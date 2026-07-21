import './_setup.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resetStorage } from './_setup.js';
import { installFixtures, seedCollection, SAMPLE_COLL } from './_fixtures.js';
import { loadData } from '../storage.js';
import { computeStats } from '../stats.js';
import { rarityTextColor, rarityChipClass, rarityChipStyle } from '../data.js';

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

describe('rarity chip painting', () => {
  // ══════════════════════════════════════════════════════════
  // DESIGN DECISION — 2026-07-21, taken by the maintainer.
  // Rarity chips use PLAIN WHITE TEXT on every level, with NO
  // text-shadow and NO per-rarity dark text. Visual uniformity across
  // the rarity ladder was chosen over per-chip WCAG AA, knowingly and
  // explicitly: legendary (#EC9600, ~2.35:1) and mythic (#00A86B,
  // ~3.08:1) sit below the 4.5:1 AA threshold for small text.
  //
  // The old AA assertion is therefore GONE ON PURPOSE — it is not an
  // oversight and must not be restored without reopening the decision.
  // The tests below lock the accepted behaviour instead, so that an
  // accidental drift back to dark text or to a shadow fails loudly.
  // ══════════════════════════════════════════════════════════
  test('rarityTextColor always returns white, whatever the background', () => {
    assert.equal(rarityTextColor('#C026D3'), '#fff');  // dark fuchsia
    assert.equal(rarityTextColor('#EC9600'), '#fff');  // bright gold — AA exception
    assert.equal(rarityTextColor('#00A86B'), '#fff');  // jade — AA exception
    assert.equal(rarityTextColor('#FFFFFF'), '#fff');  // even on pure white
    assert.equal(rarityTextColor(undefined), '#fff');
    assert.equal(rarityTextColor('not-a-color'), '#fff');
  });

  test('every shipped rarity takes white text — no exceptions, no dark text', () => {
    const meta = JSON.parse(readFileSync(new URL('../data/metadata.json', import.meta.url), 'utf8'));
    let checked = 0;
    for(const [key, r] of Object.entries(meta.rarities)){
      if(key === 'divine') continue; // animated gradient, paints itself
      assert.equal(rarityTextColor(r.color), '#fff', `${key} (${r.color}) must take white text`);
      assert.equal(rarityChipStyle(key, r.color), `background:${r.color};color:#fff`);
      checked++;
    }
    assert.equal(checked, 5, 'five rarities are inline-painted (epic, legendary, mythic, ultra, cosmic)');
  });

  test('divine is the ONLY rarity painted by CSS', () => {
    assert.equal(rarityChipClass('divine'), ' rar-divine-bg');
    assert.equal(rarityChipStyle('divine', '#FACC15'), '');
    for(const key of ['epic', 'legendary', 'mythic', 'ultra', 'cosmic']){
      assert.equal(rarityChipClass(key), '', `${key} must not get an extra CSS class`);
    }
  });

  // Inverted on purpose (it used to assert the shadow was PRESENT):
  // the shadow was removed by the design decision above, and nothing
  // should quietly bring it back.
  test('no rarity chip rule ships a text-shadow', () => {
    const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
    assert.ok(!/\.rar-legendary-bg/.test(css), 'the .rar-legendary-bg shadow rule must stay removed');
    const divine = css.match(/\.rar-divine-bg\s*\{[^}]*\}/);
    assert.ok(divine, '.rar-divine-bg rule is missing from styles.css');
    assert.ok(!/text-shadow/.test(divine[0]), 'divine chip must not gain a text-shadow either');
  });
});
