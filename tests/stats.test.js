import './_setup.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
  test('still picks near-black when a color is too bright for white', () => {
    assert.equal(rarityTextColor('#FF7A00'), '#141414'); // the OLD legendary orange
    assert.equal(rarityTextColor('#00C853'), '#141414'); // the OLD mythic emerald
  });
  test('invalid input falls back to white', () => {
    assert.equal(rarityTextColor(undefined), '#fff');
    assert.equal(rarityTextColor('red'), '#fff');
    assert.equal(rarityTextColor('#12345'), '#fff');
  });
  // Design invariant: every non-divine rarity chip is white-on-color, with
  // WCAG AA contrast for small text (>= 4.5:1). If a future palette tweak
  // brightens a rarity past what white can bear, this fails loudly.
  test('every shipped rarity color takes white text at >= 4.5:1', () => {
    const meta = JSON.parse(readFileSync(new URL('../data/metadata.json', import.meta.url), 'utf8'));
    const whiteContrast = hex => {
      const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
        .map(c => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
      return 1.05 / (0.2126 * r + 0.7152 * g + 0.0722 * b + 0.05);
    };
    for(const [key, r] of Object.entries(meta.rarities)){
      if(key === 'divine') continue; // animated gradient, own treatment
      assert.equal(rarityTextColor(r.color), '#fff', `${key} (${r.color}) must take white text`);
      assert.ok(whiteContrast(r.color) >= 4.5, `${key} (${r.color}): white contrast ${whiteContrast(r.color).toFixed(2)}:1 < 4.5`);
    }
  });
});
