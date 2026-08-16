import './_setup.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetStorage } from './_setup.js';
import { installFixtures, seedCollection, SAMPLE_COLL } from './_fixtures.js';
import { loadData, setTypeData, cardSetComplete } from '../app/storage.js';

describe('cardSetComplete — every variant of the card owned', () => {
  beforeEach(() => { resetStorage(); installFixtures(); seedCollection(SAMPLE_COLL); loadData(); });

  test('untouched card: not complete', () => {
    assert.equal(cardSetComplete('G1'), false);
  });

  test('partially owned card: not complete (P1 owns blue + nitro, misses blue_foil)', () => {
    assert.equal(cardSetComplete('P1'), false);
  });

  test('owning every type completes the set', () => {
    // P1 has types blue, blue_foil, nitro_foil — blue & nitro already owned
    setTypeData('P1', 'blue_foil', 'owned', true);
    setTypeData('P1', 'blue_foil', 'qty', 1);
    assert.equal(cardSetComplete('P1'), true);
  });

  test('owned flag without a copy does NOT count (qty 0 edge case)', () => {
    // D1 has a single type with owned:true but qty 0 in SAMPLE_COLL
    assert.equal(cardSetComplete('D1'), false);
    setTypeData('D1', 'blue', 'qty', 1);
    assert.equal(cardSetComplete('D1'), true);
  });

  test('losing the last copy of one variant breaks the set', () => {
    setTypeData('P1', 'blue_foil', 'owned', true);
    setTypeData('P1', 'blue_foil', 'qty', 1);
    assert.equal(cardSetComplete('P1'), true);
    setTypeData('P1', 'nitro_foil', 'qty', 0);
    setTypeData('P1', 'nitro_foil', 'owned', false);
    assert.equal(cardSetComplete('P1'), false);
  });

  test('single-type card completes with one copy', () => {
    setTypeData('D1', 'blue', 'qty', 2);
    assert.equal(cardSetComplete('D1'), true);
  });
});
