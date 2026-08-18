import './_setup.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resetStorage } from './_setup.js';
import { installFixtures, seedCollection, SAMPLE_COLL } from './_fixtures.js';
import { loadData } from '../app/storage.js';
import { computeStats } from '../app/stats.js';
import { rarityTextColor, rarityChipClass, rarityChipStyle } from '../app/data.js';

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
    const meta = JSON.parse(readFileSync(new URL('../app/data/metadata.json', import.meta.url), 'utf8'));
    let checked = 0;
    for(const [key, r] of Object.entries(meta.rarities)){
      if(key === 'divine' || key === 'eternal') continue; // animated gradients, paint themselves
      assert.equal(rarityTextColor(r.color), '#fff', `${key} (${r.color}) must take white text`);
      assert.equal(rarityChipStyle(key, r.color), `background:${r.color};color:#fff`);
      checked++;
    }
    assert.equal(checked, 5, 'five rarities are inline-painted (epic, legendary, mythic, ultra, cosmic)');
  });

  test('divine and eternal are the ONLY rarities painted by CSS', () => {
    assert.equal(rarityChipClass('divine'), ' rar-divine-bg');
    assert.equal(rarityChipStyle('divine', '#FACC15'), '');
    assert.equal(rarityChipClass('eternal'), ' rar-eternal-bg');
    assert.equal(rarityChipStyle('eternal', '#D99E00'), '');
    for(const key of ['epic', 'legendary', 'mythic', 'ultra', 'cosmic']){
      assert.equal(rarityChipClass(key), '', `${key} must not get an extra CSS class`);
    }
  });

  // Inverted on purpose (it used to assert the shadow was PRESENT):
  // the shadow was removed by the design decision above, and nothing
  // should quietly bring it back.
  test('no rarity chip rule ships a text-shadow', () => {
    const css = readFileSync(new URL('../app/styles.css', import.meta.url), 'utf8');
    assert.ok(!/\.rar-legendary-bg/.test(css), 'the .rar-legendary-bg shadow rule must stay removed');
    const divine = css.match(/\.rar-divine-bg\s*\{[^}]*\}/);
    assert.ok(divine, '.rar-divine-bg rule is missing from styles.css');
    assert.ok(!/text-shadow/.test(divine[0]), 'divine chip must not gain a text-shadow either');
  });
});

/* ══════════════════════════════════════════════════════════
   CODE GARDÉ VOLONTAIREMENT — fmtMissing / fmtDoubles / fmtTrade.

   Ces trois exports n'ont aucun appelant. Tout analyseur les
   signalera, et toute passe de nettoyage automatique les retirera.
   Le mainteneur a décidé de les garder : elles sont la base de
   l'export de liste d'échange (partage texte ou image), une
   évolution voulue mais pas encore datée.

   Un commentaire ne protège que ceux qui le lisent. Ce test-ci
   échoue si elles disparaissent — et son message dit pourquoi elles
   sont là, à l'endroit où quelqu'un le verra : la sortie rouge.
   ══════════════════════════════════════════════════════════ */
describe('exports de l’export de liste d’échange', () => {
  const src = readFileSync(new URL('../app/stats.js', import.meta.url), 'utf8');

  /* Longtemps gardées SANS appelant sur décision du mainteneur (1.48.x),
     avec un sous-test qui exigeait la mise en garde « NE PAS
     SUPPRIMER » au-dessus d'elles. Depuis 1.66.0 elles ont leurs
     appelants (Copier · Partager, n°15 fermé) : la décision a changé,
     le sous-test est parti avec elle — comme son message le prévoyait.
     stats-inverse.test.js tient le contrat inverse (appelants présents,
     mise en garde absente). */
  for (const nom of ['fmtMissing', 'fmtDoubles', 'fmtTrade']) {
    test(`${nom} existe toujours et reste exportée`, () => {
      assert.match(src, new RegExp(`export\\s+function\\s+${nom}\\s*\\(`));
    });
  }
});

/* ── Répartitions : sommaire + colonne large (1.56.0) ──
   Deux invariants que rien d'autre ne tient, et dont l'oubli ne se
   verrait qu'à l'œil, tard :
   1. « Par type de carte » ne doit PAS retourner dans la grille de
      colonnes — c'est justement ce que la correction supprime ;
   2. le sommaire doit rester des boutons. Des ancres href="#id"
      écriraient dans location.hash, que l'app lit au démarrage. */
describe('répartitions — sommaire ancré et colonne large', () => {
  const src = readFileSync(new URL('../app/stats.js', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../app/styles.css', import.meta.url), 'utf8');

  test('le bloc « par type » est hors de .sv-breakcols et en sous-colonnes', () => {
    const grid = src.match(/<div class="sv-breakcols">([\s\S]*?)<\/div>/);
    assert.ok(grid, '.sv-breakcols introuvable');
    assert.ok(!grid[1].includes("t('st.by_type')"),
      'la colonne de 16 lignes est retournée dans la grille');
    assert.match(src, /st\.by_type[\s\S]{0,120}sv-rows-split/,
      'le bloc « par type » ne demande plus ses sous-colonnes');
    assert.match(css, /\.sv-rows-split\{[^}]*repeat\(auto-fit,\s*minmax\(270px/,
      'les sous-colonnes doivent dégrader progressivement (auto-fit), pas sauter de 3 à 1');
  });

  test('le sommaire est fait de boutons — jamais d’ancres', () => {
    const nav = src.match(/<nav class="sv-jump"[\s\S]*?<\/nav>/);
    assert.ok(nav, 'sommaire introuvable');
    assert.ok(!/<a\s/.test(nav[0]), 'une ancre écrirait dans location.hash');
    assert.match(nav[0], /data-jump="svTools"/, 'le saut vers les outils a disparu');
  });

  test('les pastilles se resserrent sous 380 px (elles tenaient sur 3 lignes)', () => {
    assert.match(css, /@media \(max-width:380px\)\{[^}]*\.sv-jump\b/,
      'sans ce palier, le sommaire fait 3 lignes à 320 px');
  });
});
