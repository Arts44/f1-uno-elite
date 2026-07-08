import './_setup.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resetStorage } from './_setup.js';
import { installFixtures, seedCollection, SAMPLE_COLL } from './_fixtures.js';
import { loadData, coll, saveData, setTypeData } from '../storage.js';
import {
  tutorialKeys, captureLocalStorage, applyLocalStorage, TUTORIAL_STEPS,
  isTutorialSeen, markTutorialSeen,
} from '../tutorial.js';

describe('tutorial — state snapshot / restore (data safety)', () => {
  beforeEach(() => { resetStorage(); installFixtures(); });

  test('tutorialKeys covers owned, badges, history, backup + prefs', () => {
    const keys = tutorialKeys(2025);
    ['f1uno_owned_2025', 'f1uno_badges_2025', 'f1uno_auto_badges_2025',
     'f1uno_history_2025', 'f1uno_changes_since_backup', 'f1uno_last_backup',
     'f1uno_theme', 'f1uno_lang', 'f1uno_font', 'f1uno_title',
    ].forEach(k => assert.ok(keys.includes(k), k));
  });

  test('captureLocalStorage records values and null for absent keys', () => {
    localStorage.setItem('f1uno_theme', 'dark');
    const snap = captureLocalStorage(['f1uno_theme', 'f1uno_font']);
    assert.equal(snap['f1uno_theme'], 'dark');
    assert.equal(snap['f1uno_font'], null);
  });

  test('applyLocalStorage restores values AND removes keys that were absent', () => {
    localStorage.setItem('f1uno_theme', 'dark');
    const snap = captureLocalStorage(['f1uno_theme', 'f1uno_font']);
    // mutate: change one, create the other
    localStorage.setItem('f1uno_theme', 'light');
    localStorage.setItem('f1uno_font', 'prestige');
    applyLocalStorage(snap);
    assert.equal(localStorage.getItem('f1uno_theme'), 'dark');   // reverted
    assert.equal(localStorage.getItem('f1uno_font'), null);      // removed (was absent)
  });

  test('round-trip: real tutorial edits on a non-empty collection are fully undone', () => {
    // Start from a known non-empty collection
    seedCollection(SAMPLE_COLL); loadData();
    localStorage.setItem('f1uno_changes_since_backup', '4');
    const before = captureLocalStorage(tutorialKeys(2025));
    const ownedBefore = localStorage.getItem('f1uno_owned_2025');

    // Simulate what the tour does: mark a card owned, add a double, etc.
    setTypeData('P2', 'blue', 'owned', true);
    setTypeData('P2', 'blue', 'qty', 3);        // owned + double
    setTypeData('G1', 'blue', 'wishlist', true);
    saveData();                                  // also bumps changes counter + history
    // sanity: state actually changed
    assert.notEqual(localStorage.getItem('f1uno_owned_2025'), ownedBefore);

    // Restore
    applyLocalStorage(before);
    loadData();

    // Exactly the original state is back
    assert.equal(localStorage.getItem('f1uno_owned_2025'), ownedBefore);
    assert.equal(localStorage.getItem('f1uno_changes_since_backup'), '4');
    // P2 was wishlist-only in SAMPLE_COLL — the tour's "owned + double" is undone
    assert.equal(coll.P2.blue.owned, false);
    assert.equal(coll.P2.blue.wishlist, true);
    assert.ok(!coll.G1);                          // the tutorial's G1 wishlist is gone
  });
});

describe('tutorial — step sequence', () => {
  test('steps are well-formed: unique ids, and each is action or observe', () => {
    const ids = TUTORIAL_STEPS.map(s => s.id);
    assert.equal(new Set(ids).size, ids.length, 'ids unique');
    for (const s of TUTORIAL_STEPS) {
      assert.ok(typeof s.id === 'string' && s.id.length > 0);
      assert.ok(s.observe === true || !!s.action || s.id === 'welcome',
        `${s.id} must be observe or have an action`);
    }
  });

  test('covers the required areas (filters, search, modal, badges, stats, settings)', () => {
    const ids = new Set(TUTORIAL_STEPS.map(s => s.id));
    ['sidebar_open', 'filter_apply', 'filter_reset', 'search', 'open_card',
     'mark_owned', 'mark_double', 'favorite', 'wishlist',
     'go_badges', 'badge_manual', 'badge_remove',
     'go_stats', 'stats_progress', 'stats_highlights', 'stats_donut',
     'go_settings', 'set_theme', 'set_font', 'set_backup', 'set_data', 'replay',
    ].forEach(id => assert.ok(ids.has(id), `missing step ${id}`));
  });

  test('the badge-remove step targets the force-remove action', () => {
    const step = TUTORIAL_STEPS.find(s => s.id === 'badge_remove');
    assert.equal(step.action.type, 'dataAction');
    assert.equal(step.action.name, 'enterRemoveBadgeMode');
  });
});

describe('tutorial — seen flag', () => {
  beforeEach(() => resetStorage());
  test('mark/read the seen flag', () => {
    assert.equal(isTutorialSeen(), false);
    markTutorialSeen();
    assert.equal(isTutorialSeen(), true);
  });
});
