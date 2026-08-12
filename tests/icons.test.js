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

/* ── Marqueurs de coin de tuile ──
   Trois marqueurs se posent en absolu sur .card-visual : couronne
   (champion, haut-gauche), pastille réserve (haut-droite) et sceau set
   complet (haut-droite, décalé sous la pastille quand les deux sont là).

   Le défaut corrigé en 1.55.1 : la pastille réserve dessinait `refresh`
   (« recharger ») pendant que la catégorie réserve dessinait `swap`
   (« remplaçant »). Deux tracés pour un concept, visibles côte à côte.
   Rien ne l'attrapait — d'où ces trois tests, qui lisent la SOURCE. */
describe('marqueurs de coin de tuile', () => {
  const render = readFileSync(new URL('../render.js', import.meta.url), 'utf8');
  const markerLine = re => (render.match(re) || [''])[0];

  test('le marqueur réserve dessine la MÊME icône que la catégorie réserve', () => {
    const line = markerLine(/<span class="replacement-icon"[^\n]*/);
    assert.ok(line, 'marqueur réserve introuvable dans render.js');
    const used = (line.match(/icon\('([^']+)'\)/) || [])[1];
    assert.equal(used, meta.categories.reserve.icon,
      `la tuile dessine « ${used} », la catégorie « ${meta.categories.reserve.icon} »`);
  });

  test('les trois marqueurs passent par icon() — aucun émoji résiduel', () => {
    for (const cls of ['crown', 'replacement-icon', 'set-flag']) {
      const line = markerLine(new RegExp(`<span class="${cls}"[^\\n]*`));
      assert.ok(line, `marqueur ${cls} introuvable`);
      assert.match(line, /\$\{icon\('/, `${cls} : le marqueur n'utilise pas icon()`);
      assert.ok(!/\p{Extended_Pictographic}/u.test(line), `${cls} : émoji résiduel`);
    }
  });

  /* `swap` et `refresh` sont deux paires d'arcs fléchés : comparés à 12 et
     14 px ils sont le même dessin pour l'œil. Ils ne peuvent donc pas
     désigner deux choses différentes dans la même app. `swap` est réservé
     à la réserve ; les doubles ont `copy`, le rechargement garde `refresh`. */
  test('swap ne sert QU’À la réserve', () => {
    const sources = ['../render.js', '../stats.js', '../badges.js', '../update.js', '../pin.js']
      .map(f => readFileSync(new URL(f, import.meta.url), 'utf8'));
    const usages = sources.flatMap(s => [...s.matchAll(/icon\('swap'[^)]*\)/g)].map(m => m[0]));
    assert.equal(usages.length, 1,
      `swap est utilisé ${usages.length} fois : il ne doit désigner que la réserve`);
    assert.equal(meta.categories.reserve.icon, 'swap');
  });

  test('les doubles ne dessinent PAS un arc fléché (voisin de swap)', () => {
    const render = readFileSync(new URL('../render.js', import.meta.url), 'utf8');
    const stats = readFileSync(new URL('../stats.js', import.meta.url), 'utf8');
    assert.match(render, /'doubles',\s*'copy'/, 'le statut « doubles » doit utiliser copy');
    assert.ok(!/icon\('refresh'\)/.test(stats),
      'les outils de collectionneur ne doivent plus emprunter refresh');
    assert.match(icon('copy'), /<rect/, 'copy doit rester un dessin de rectangles, pas un arc');
  });

  test('le sceau glisse sous la pastille réserve (règle de non-recouvrement)', () => {
    assert.match(css, /\.replacement-icon\s*~\s*\.set-flag\s*\{[^}]*top:\s*32px/,
      'sans cette règle, sceau et pastille se superposent au même coin');
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
