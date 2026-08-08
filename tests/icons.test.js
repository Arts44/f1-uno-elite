/* ══════════════════════════════════════════════════════════
   ICONS + LIVRÉES (v2.3 phase B) — le système d'icônes SVG et
   les livrées d'écurie tiennent leurs invariants :
   - typeIcon() couvre les 16 types (pastille pour les couleurs
     de base, famille de 5 pour le reste), en SVG currentColor ;
   - teamLiveries est en parité stricte avec teamColors, dans
     data/metadata.json ET data-embedded.js ;
   - chaque geste déclaré a sa classe .lv-<g> dans styles.css.
   ══════════════════════════════════════════════════════════ */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { icon, typeIcon } from '../icons.js';

const meta = JSON.parse(readFileSync(new URL('../data/metadata.json', import.meta.url), 'utf8'));
const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const embedded = readFileSync(new URL('../data-embedded.js', import.meta.url), 'utf8');

describe('typeIcon — la famille de 5 + pastilles', () => {
  test('les 4 couleurs de base donnent une pastille CSS', () => {
    for (const ty of ['blue', 'green', 'red', 'yellow']) {
      const html = typeIcon(ty);
      assert.match(html, new RegExp(`cdot-${ty}`), ty);
      assert.ok(!html.includes('<svg'), `${ty} : pastille, pas de SVG`);
    }
  });

  test('chaque type de metadata.json a une icône non vide', () => {
    for (const ty of Object.keys(meta.cardTypes)) {
      const html = typeIcon(ty);
      assert.ok(html.length > 20, `typeIcon(${ty}) vide`);
    }
  });

  test('foil, nitro, wild, dual, promo sont des SVG distincts', () => {
    const set = new Set(['blue_foil', 'nitro_foil', 'wild_foil', 'blue_red_foil', 'promo_blue'].map(typeIcon));
    assert.equal(set.size, 5, 'deux types partagent le même dessin');
    for (const html of set) assert.match(html, /stroke="currentColor"/);
  });
});

describe('icon() — interface', () => {
  test('les marqueurs de carte existent (sceau, couronne, danger)', () => {
    for (const name of ['seal', 'crown', 'danger', 'star', 'heart', 'check', 'refresh', 'globe']) {
      assert.match(icon(name), /^<svg/, name);
    }
  });
  test('le danger est PLEIN (exception au trait), le sceau aussi', () => {
    assert.match(icon('danger'), /fill="currentColor"/);
    assert.match(icon('seal'), /fill="currentColor"/);
  });
});

describe('teamLiveries — parité et couverture CSS', () => {
  test('mêmes clés que teamColors (metadata.json)', () => {
    assert.deepEqual(Object.keys(meta.teamLiveries).sort(), Object.keys(meta.teamColors).sort());
  });

  test('data-embedded.js embarque les mêmes livrées', () => {
    const m = embedded.match(/"teamLiveries":(\{.*?\}\})/s);
    assert.ok(m, 'teamLiveries absent de data-embedded.js');
    assert.deepEqual(JSON.parse(m[1]), meta.teamLiveries);
  });

  test('couleurs valides et bande .lvb présente (arbitrage P1 — les gestes ne peignent plus la tuile)', () => {
    for (const [team, lv] of Object.entries(meta.teamLiveries)) {
      assert.match(lv.c1, /^#[0-9A-Fa-f]{6}$/, team);
      assert.match(lv.c2, /^#[0-9A-Fa-f]{6}$/, team);
    }
    assert.ok(css.includes('.lvb'), 'colonne de livrée .lvb absente de styles.css');
  });

  test('10 gestes distincts — aucune géométrie partagée entre écuries', () => {
    const gestures = Object.values(meta.teamLiveries).map(l => l.g);
    assert.equal(new Set(gestures).size, gestures.length);
  });
});
