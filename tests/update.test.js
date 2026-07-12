import './_setup.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetStorage } from './_setup.js';
import {
  CHANGELOG, APP_VERSION, compareVersions, entriesSince, changesFor,
} from '../changelog.js';
import {
  lastSeenVersion, markVersionSeen, shouldOfferWhatsNew,
} from '../update.js';

const LANG_CODES = ['en', 'fr', 'es', 'zh', 'it', 'nl', 'de'];

describe('update — compareVersions', () => {
  test('orders numerically, not lexicographically', () => {
    assert.equal(compareVersions('1.0.0', '1.0.0'), 0);
    assert.equal(compareVersions('1.0.1', '1.0.0'), 1);
    assert.equal(compareVersions('1.0.0', '1.0.1'), -1);
    assert.equal(compareVersions('1.10.0', '1.9.0'), 1);  // the lexicographic trap
    assert.equal(compareVersions('2.0.0', '1.99.99'), 1);
  });

  test('tolerates different segment counts', () => {
    assert.equal(compareVersions('1.0', '1.0.0'), 0);
    assert.equal(compareVersions('1.0.1', '1.0'), 1);
    assert.equal(compareVersions('1', '1.0.0'), 0);
  });
});

describe('update — entriesSince (changelog selection)', () => {
  const LIST = [
    { version: '2.1.0', date: '2026-08-01', changes: { en: ['c'] } },
    { version: '2.0.0', date: '2026-07-20', changes: { en: ['b'] } },
    { version: '1.0.0', date: '2026-07-01', changes: { en: ['a'] } },
  ];

  test('returns only the strictly newer entries, newest first', () => {
    assert.deepEqual(entriesSince('1.0.0', LIST).map(e => e.version), ['2.1.0', '2.0.0']);
    assert.deepEqual(entriesSince('2.0.0', LIST).map(e => e.version), ['2.1.0']);
  });

  test('up to date or ahead → nothing to announce', () => {
    assert.deepEqual(entriesSince('2.1.0', LIST), []);
    assert.deepEqual(entriesSince('9.9.9', LIST), []);
  });

  test('no baseline (fresh / pre-versioning install) → nothing', () => {
    assert.deepEqual(entriesSince('', LIST), []);
    assert.deepEqual(entriesSince(null, LIST), []);
  });
});

describe('update — shouldOfferWhatsNew', () => {
  test('offers only on an actual upgrade', () => {
    assert.equal(shouldOfferWhatsNew('', '1.1.0'), false);          // no baseline
    assert.equal(shouldOfferWhatsNew('1.1.0', '1.1.0'), false);     // same version
    assert.equal(shouldOfferWhatsNew('1.0.0', '1.1.0'), true);      // upgrade
    assert.equal(shouldOfferWhatsNew('1.2.0', '1.1.0'), false);     // rollback: stay quiet
  });
});

describe('update — seen-version persistence', () => {
  beforeEach(() => resetStorage());
  test('round-trips through localStorage; defaults to APP_VERSION', () => {
    assert.equal(lastSeenVersion(), '');
    markVersionSeen('1.0.0');
    assert.equal(lastSeenVersion(), '1.0.0');
    markVersionSeen(); // no arg → stamp the running version
    assert.equal(lastSeenVersion(), APP_VERSION);
  });
});

describe('changelog — data integrity', () => {
  test('APP_VERSION is the newest entry (single source of truth)', () => {
    assert.equal(APP_VERSION, CHANGELOG[0].version);
  });

  test('entries are strictly descending with valid version + date formats', () => {
    for(const e of CHANGELOG){
      assert.match(e.version, /^\d+\.\d+\.\d+$/, `bad version: ${e.version}`);
      assert.match(e.date, /^\d{4}-\d{2}-\d{2}$/, `bad date: ${e.date}`);
    }
    for(let i = 1; i < CHANGELOG.length; i++){
      assert.equal(compareVersions(CHANGELOG[i - 1].version, CHANGELOG[i].version), 1,
        `not descending: ${CHANGELOG[i - 1].version} then ${CHANGELOG[i].version}`);
    }
  });

  test('every entry is translated in all 7 languages, same item count, no empty text', () => {
    for(const e of CHANGELOG){
      const counts = LANG_CODES.map(l => {
        const items = e.changes[l];
        assert.ok(Array.isArray(items) && items.length > 0, `${e.version}: missing/empty '${l}'`);
        items.forEach(s => assert.ok(typeof s === 'string' && s.trim().length > 0,
          `${e.version}/${l}: empty change text`));
        return items.length;
      });
      assert.equal(new Set(counts).size, 1, `${e.version}: languages have differing item counts`);
    }
  });

  test('changesFor picks the language, falls back to English', () => {
    const entry = CHANGELOG[0];
    assert.deepEqual(changesFor(entry, 'fr'), entry.changes.fr);
    assert.deepEqual(changesFor(entry, 'xx'), entry.changes.en);
    assert.deepEqual(changesFor(null, 'fr'), []);
  });
});
