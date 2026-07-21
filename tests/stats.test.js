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
  // Design invariant: every rarity chip painted with a flat background
  // must reach WCAG AA for small text (>= 4.5:1) with the colour
  // rarityTextColor() picks. Two rarities are exempt because CSS, not
  // this function, paints them (see rarityChipStyle in data.js):
  //   divine    — animated iridescent gradient
  //   legendary — white on bright gold, legibility carried by a layered
  //               dark text-shadow. Deliberate aesthetic choice: the raw
  //               ratio is ~2.35:1, so a contrast assertion would be
  //               meaningless here; the test below pins the mechanism
  //               instead, and the rendering was validated visually.
  // Any OTHER rarity drifting into the unreadable band still fails loudly.
  test('every inline-painted rarity color is legible with its chosen text color', () => {
    const meta = JSON.parse(readFileSync(new URL('../data/metadata.json', import.meta.url), 'utf8'));
    const lum = hex => {
      const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
        .map(c => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const contrast = (bg, fg) => {
      const [a, b] = [lum(bg), lum(fg)].sort((x, y) => y - x);
      return (a + 0.05) / (b + 0.05);
    };
    let checked = 0;
    for(const [key, r] of Object.entries(meta.rarities)){
      if(key === 'divine' || key === 'legendary') continue; // CSS-painted
      const fg = rarityTextColor(r.color);
      assert.ok(fg === '#fff' || fg === '#141414', `${key}: unexpected text color ${fg}`);
      const c = contrast(r.color, fg === '#fff' ? '#ffffff' : '#141414');
      assert.ok(c >= 4.5, `${key} (${r.color}) with ${fg}: contrast ${c.toFixed(2)}:1 < 4.5`);
      checked++;
    }
    assert.equal(checked, 4, 'exactly four rarities are inline-painted (epic, mythic, ultra, cosmic)');
  });

  // Legendary must keep going through the CSS class that supplies the
  // white text + dark shadow — never fall back to an inline colour that
  // would land at 2.35:1 with no shadow to save it.
  test('legendary and divine are painted by CSS, not by an inline text color', () => {
    assert.equal(rarityChipClass('legendary'), ' rar-legendary-bg');
    assert.equal(rarityChipClass('divine'), ' rar-divine-bg');
    assert.equal(rarityChipClass('mythic'), '');

    // legendary keeps the gold background but sets no inline color
    const legend = rarityChipStyle('legendary', '#EC9600');
    assert.equal(legend, 'background:#EC9600');
    assert.ok(!/color:/.test(legend), 'legendary must not set an inline text color');

    // divine paints everything itself
    assert.equal(rarityChipStyle('divine', '#FACC15'), '');

    // the others keep the previous behaviour: contrast-driven text colour.
    // The shipped jade is bright enough that white would only reach
    // 3.08:1, so it legitimately takes dark text — that is the guard
    // working, not a regression.
    assert.equal(rarityChipStyle('mythic', '#00A86B'), 'background:#00A86B;color:#141414');
    assert.equal(rarityChipStyle('cosmic', '#5B4BE0'), 'background:#5B4BE0;color:#fff');
  });

  // The shadow that carries legendary's legibility lives in styles.css;
  // if it is ever deleted, white-on-gold silently becomes unreadable.
  test('the legendary chip rule still ships its dark text-shadow', () => {
    const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
    const rule = css.match(/\.rar-legendary-bg\s*\{[^}]*\}/);
    assert.ok(rule, '.rar-legendary-bg rule is missing from styles.css');
    assert.ok(/color:#fff!important/.test(rule[0]), 'legendary chip must force white text');
    assert.ok(/text-shadow:[^;]*rgba\(0,0,0/.test(rule[0]), 'legendary chip must keep a dark text-shadow');
  });
});
