import './_setup.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetStorage } from './_setup.js';
import { installFixtures, seedCollection, SAMPLE_COLL, AUTO_BADGES_FIXTURE } from './_fixtures.js';
import { loadData } from '../storage.js';
import { evaluateBadgeCondition, isAutoBadgeUnlocked, setAutoBadgeUnlocked, setManualBadges } from '../badges.js';

const badge = id => AUTO_BADGES_FIXTURE.find(b => b.id === id);
const evalId = id => evaluateBadgeCondition(badge(id));

describe('evaluateBadgeCondition', () => {
  beforeEach(() => {
    resetStorage(); installFixtures();
    setAutoBadgeUnlocked({}); setManualBadges({});
    seedCollection(SAMPLE_COLL); loadData();
  });

  test('owned_count reaches its target (P1, R1, D1 owned)', () => {
    assert.deepEqual(evalId('first_card'), { cur: 1, max: 1 });
    assert.deepEqual(evalId('collect_3'), { cur: 3, max: 3 });
  });

  test('cur is clamped at the target (Math.min)', () => {
    // 3 cards owned but the target is 1 → cur stays 1
    assert.equal(evalId('first_card').cur, 1);
  });

  test('wishlist_count counts only non-owned wishlist cards', () =>
    assert.deepEqual(evalId('dream_1'), { cur: 1, max: 1 }));

  test('doubles_count', () =>
    assert.deepEqual(evalId('double_1'), { cur: 1, max: 1 }));

  test('favorite_count below target reports progress', () =>
    // only P1.blue is favorite → 1/2
    assert.deepEqual(evalId('fan_2'), { cur: 1, max: 2 }));

  test('total_qty sums owned quantities', () =>
    // P1: 2+1, R1: 1 → 4, clamped at 3
    assert.deepEqual(evalId('qty_3'), { cur: 3, max: 3 }));

  test('category_owned with allOfCategory tracks the full category', () =>
    // 2 pilote cards, only P1 owned → 1/2
    assert.deepEqual(evalId('all_pilots'), { cur: 1, max: 2 }));

  test('champion_owned counts champions', () =>
    // P1 is the only champion and is owned → 1/1
    assert.deepEqual(evalId('all_champs'), { cur: 1, max: 1 }));

  test('type_owned with foil filter sums foil quantities', () =>
    // P1.nitro qty 1 + R1.blue_foil qty 1 → 2/2
    assert.deepEqual(evalId('foil_2'), { cur: 2, max: 2 }));

  test('type_owned with a specific type id', () =>
    assert.deepEqual(evalId('nitro_1'), { cur: 1, max: 1 }));

  test('unknown metric → 0/1 (never unlocks)', () =>
    assert.deepEqual(evalId('weird'), { cur: 0, max: 1 }));
});

describe('isAutoBadgeUnlocked', () => {
  beforeEach(() => {
    resetStorage(); installFixtures();
    setAutoBadgeUnlocked({}); setManualBadges({});
    seedCollection(SAMPLE_COLL); loadData();
  });

  test('unlocks when the condition is met, and persists it', () => {
    assert.equal(isAutoBadgeUnlocked(badge('first_card')), true);
    const persisted = JSON.parse(localStorage.getItem('f1uno_auto_badges_2025'));
    assert.equal(persisted.first_card, true);
  });

  test('not unlocked when below target', () => {
    assert.equal(isAutoBadgeUnlocked(badge('fan_2')), false);
  });

  test('once unlocked, stays unlocked even if the condition regresses', () => {
    assert.equal(isAutoBadgeUnlocked(badge('first_card')), true);
    seedCollection({}); loadData(); // collection wiped
    assert.equal(isAutoBadgeUnlocked(badge('first_card')), true);
  });
});
