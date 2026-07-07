import './_setup.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetStorage } from './_setup.js';
import { installFixtures, seedCollection, SAMPLE_COLL } from './_fixtures.js';
import { loadData } from '../storage.js';
import { computeStats } from '../stats.js';
import { rarityTextColor } from '../data.js';

describe('computeStats aggregates', () => {
  beforeEach(() => { resetStorage(); installFixtures(); });

  test('known fixture collection produces the expected aggregates', () => {
    seedCollection(SAMPLE_COLL); loadData();
    const s = computeStats();
    // P1, R1, D1 owned — P2 wishlist-only — G1 untouched
    assert.equal(s.total, 5);
    assert.equal(s.owned, 3);
    assert.equal(s.wish, 1);       // P2 (wishlist counts only non-owned cards)
    assert.equal(s.doubles, 1);    // P1.blue
    assert.equal(s.missing, 2);    // P2, G1
    assert.equal(s.fav, 1);        // P1.blue
    assert.equal(s.totalExemplaires, 4); // P1: 2+1, R1: 1, D1: qty 0
    assert.equal(s.pct, 60);       // 3/5
  });

  test('empty collection → all zeroes, 0%', () => {
    seedCollection({}); loadData();
    const s = computeStats();
    assert.equal(s.owned, 0);
    assert.equal(s.missing, s.total);
    assert.equal(s.totalExemplaires, 0);
    assert.equal(s.pct, 0);
  });

  test('a wishlist flag on an owned card does not count as wishlist', () => {
    seedCollection({ P1: { blue: { owned: true, wishlist: true, qty: 1 } } });
    loadData();
    assert.equal(computeStats().wish, 0);
  });
});

describe('rarityTextColor', () => {
  test('picks white on dark saturated colors', () => {
    assert.equal(rarityTextColor('#C026D3'), '#fff');  // epic fuchsia
    assert.equal(rarityTextColor('#7C4DFF'), '#fff');  // cosmic violet
  });
  test('picks near-black on bright colors', () => {
    assert.equal(rarityTextColor('#FF7A00'), '#141414'); // legendary orange
    assert.equal(rarityTextColor('#00C853'), '#141414'); // mythic emerald
  });
  test('invalid input falls back to white', () => {
    assert.equal(rarityTextColor(undefined), '#fff');
    assert.equal(rarityTextColor('red'), '#fff');
    assert.equal(rarityTextColor('#12345'), '#fff');
  });
});
