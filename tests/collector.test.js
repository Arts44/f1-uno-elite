import './_setup.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetStorage } from './_setup.js';
import { installFixtures, seedCollection, SAMPLE_COLL } from './_fixtures.js';
import { loadData } from '../storage.js';
import { missingCards, wishlistCards, doublesList, tradeList } from '../collector.js';

// SAMPLE_COLL over the fixture cards (see _fixtures.js):
//  P1 champion pilote — blue owned x2 (doubles+fav), nitro owned x1
//  P2 pilote          — blue wishlist only            → missing + wishlist
//  R1 reserve         — blue_foil owned x1
//  D1 team principal  — blue owned:true qty 0         → owned (flag), not missing
//  G1 grand prix      — untouched                     → missing, not wishlist
const ids = arr => arr.map(c => c.id).sort();

describe('collector — missing cards', () => {
  beforeEach(() => { resetStorage(); installFixtures(); seedCollection(SAMPLE_COLL); loadData(); });

  test('lists exactly the non-owned cards', () => {
    assert.deepEqual(ids(missingCards()), ['G1', 'P2']);
  });

  test('an owned card with qty 0 is still owned (not missing)', () => {
    assert.ok(!missingCards().some(c => c.id === 'D1'));
  });

  test('each entry carries id/name/category/rarity and a wishlist flag', () => {
    const p2 = missingCards().find(c => c.id === 'P2');
    assert.equal(p2.name, 'Regular Driver');
    assert.equal(p2.category, 'pilote');
    assert.equal(p2.rarity, 'legendary');
    assert.equal(p2.wishlist, true);
  });

  test('wishlistCards is the wishlist subset of missing', () => {
    assert.deepEqual(ids(wishlistCards()), ['P2']);
    assert.ok(wishlistCards().every(c => c.wishlist));
  });

  test('empty collection → everything missing, nothing on wishlist', () => {
    seedCollection({}); loadData();
    assert.equal(missingCards().length, 5);
    assert.equal(wishlistCards().length, 0);
  });
});

describe('collector — doubles', () => {
  beforeEach(() => { resetStorage(); installFixtures(); seedCollection(SAMPLE_COLL); loadData(); });

  test('lists only cards with a doubled type, with type + qty', () => {
    const d = doublesList();
    assert.deepEqual(ids(d), ['P1']);
    assert.deepEqual(d[0].types, [{ type: 'blue', qty: 2 }]);
    // cardRarity = best OWNED variant: P1 owns nitro_foil → champion base
    // mythic + nitro bonus 3, clamped at divine
    assert.equal(d[0].rarity, 'divine');
  });

  test('no doubles → empty list', () => {
    seedCollection({ P2: { blue: { owned: true, qty: 1 } } }); loadData();
    assert.deepEqual(doublesList(), []);
  });

  test('multiple doubled types on one card are all listed', () => {
    seedCollection({
      P2: {
        blue: { owned: true, doubles: true, qty: 3 },
        blue_foil: { owned: true, doubles: true, qty: 2 },
      },
    });
    loadData();
    const p2 = doublesList().find(c => c.id === 'P2');
    assert.deepEqual(
      p2.types.sort((a, b) => a.type.localeCompare(b.type)),
      [{ type: 'blue', qty: 3 }, { type: 'blue_foil', qty: 2 }]
    );
  });
});

describe('collector — trade list', () => {
  beforeEach(() => { resetStorage(); installFixtures(); seedCollection(SAMPLE_COLL); loadData(); });

  test('combines want (missing) and offer (doubles)', () => {
    const { want, offer } = tradeList();
    assert.deepEqual(ids(want), ['G1', 'P2']);
    assert.deepEqual(ids(offer), ['P1']);
  });
});
