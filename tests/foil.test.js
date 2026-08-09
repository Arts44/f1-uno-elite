/* ══════════════════════════════════════════════════════════
   FOILS — sobriété d'animation (1.46.0)

   Les foils ne causaient pas de lag (TBT ~0, 60 fps), mais
   quatre de leurs cinq animations pilotaient des propriétés
   NON COMPOSABLES — background-position, mask-position,
   box-shadow — c'est-à-dire du repeint continu sur des dizaines
   de tuiles. Lighthouse comptait 36 animations non composées ;
   après réécriture en transform, il en reste 1 (et elle n'est
   pas un foil : c'est la pastille de rareté iridescente).

   Ces tests gardent le CONTRAT. Ils lisent le CSS et le JS
   comme du texte : c'est le seul niveau où une régression de ce
   type est visible sans navigateur.
   ══════════════════════════════════════════════════════════ */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const render = readFileSync(new URL('../render.js', import.meta.url), 'utf8');

// Extrait le corps de chaque @keyframes du fichier.
function keyframes(){
  const out = {};
  const re = /@keyframes\s+([\w-]+)\s*\{/g;
  let m;
  while ((m = re.exec(css))) {
    let depth = 1, i = re.lastIndex;
    while (depth > 0 && i < css.length) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}') depth--;
      i++;
    }
    out[m[1]] = css.slice(re.lastIndex, i - 1);
  }
  return out;
}
const KF = keyframes();

// Les animations de foil, par nom. wild-spin tournait déjà en transform.
const FOIL_ANIMS = ['foil-pass', 'wild-spin'];
// Propriétés qui forcent un repeint à chaque frame.
const REPAINT = ['background-position', 'mask-position', 'box-shadow', 'filter', 'width', 'height', 'left', 'top'];

describe('animations de foil — transform / opacity uniquement', () => {
  test('les keyframes de foil existent', () => {
    for (const n of FOIL_ANIMS) assert.ok(KF[n], `@keyframes ${n} absent`);
  });

  test('aucune keyframe de foil ne pilote une propriété repeinte', () => {
    for (const n of FOIL_ANIMS) {
      for (const prop of REPAINT) {
        assert.ok(!KF[n].includes(prop + ':'), `@keyframes ${n} anime ${prop}`);
      }
    }
  });

  test('les anciennes animations coûteuses ont bien disparu', () => {
    // tv-sheen animait background-position, nitro-sweep mask-position,
    // wild-glow box-shadow — sur toute la grille, en continu.
    for (const dead of ['tv-sheen', 'nitro-sweep', 'wild-glow']) {
      assert.equal(KF[dead], undefined, `@keyframes ${dead} est revenu`);
    }
  });

  test('la bande a un temps mort — elle ne balaie pas en continu', () => {
    // Le levier de confort principal : le passage occupe une fraction
    // du cycle, le reste la tuile ne bouge plus du tout.
    assert.match(KF['foil-pass'], /45%\s*\{\s*transform:translateX\(300%\)/);
    assert.match(KF['foil-pass'], /100%\s*\{\s*transform:translateX\(300%\)/);
  });
});

describe('intensité — le niveau « moyen » est bien celui posé', () => {
  const vars = { '--f-peak': '0.55', '--f-mid': '0.26', '--f-dur': '6.5s',
                 '--f-beam-a': '0.50', '--f-beam-dur': '7s', '--f-nitro-dur': '10s' };
  for (const [k, v] of Object.entries(vars)) {
    test(`${k} vaut ${v}`, () => {
      const m = css.match(new RegExp(k.replace(/-/g, '\\-') + ':\\s*([^;]+);'));
      assert.ok(m, `${k} absente`);
      assert.equal(m[1].trim(), v);
    });
  }

  test('les effets se lisent tous à travers les variables', () => {
    // Une valeur en dur quelque part = un niveau qu'on croit avoir
    // réglé et qui ne bouge pas.
    assert.ok(css.includes('animation:foil-pass var(--f-dur)'), 'bande foil non pilotée');
    assert.ok(css.includes('animation:foil-pass var(--f-promo-dur)'), 'bande promo non pilotée');
    assert.ok(css.includes('animation:foil-pass var(--f-nitro-dur)'), 'grille nitro non pilotée');
    assert.ok(css.includes('wild-spin var(--f-beam-dur)'), 'faisceaux non pilotés');
  });
});

describe('pause hors écran', () => {
  test('un IntersectionObserver est bien câblé sur la grille', () => {
    assert.ok(render.includes('new IntersectionObserver'), 'aucun observateur');
    assert.ok(render.includes("classList.toggle('fx-idle'"), 'la classe de pause n’est pas posée');
    assert.ok(render.includes('rootMargin'), 'pas de marge : l’animation démarrerait à vue');
  });

  test('une tuile remplacée est ré-observée', () => {
    // updateCardTile() remplace le nœud : sans ré-observation, la
    // tuile reste figée « hors écran » pour toujours.
    const fn = render.slice(render.indexOf('export function updateCardTile'));
    assert.ok(fn.includes('_foilObs.observe(fresh)'), 'la nouvelle tuile n’est pas ré-observée');
  });

  test('le CSS met en pause au lieu de supprimer', () => {
    // animation:none redémarrerait à la phase 0 au retour — un saut
    // visible. animation-play-state conserve l’état.
    assert.match(css, /\.card\.fx-idle[^{]*\{animation-play-state:paused;\}/);
  });
});

describe('prefers-reduced-motion', () => {
  const blocks = [...css.matchAll(/@media \(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/g)]
    .map(m => m[1]).join('\n');

  test('tout s’arrête', () => {
    assert.ok(blocks.includes('tv-wild_foil') && blocks.includes('tv-nitro_foil'));
    assert.ok(blocks.includes('animation:none'));
  });

  test('mais la bande reste POSÉE — un foil se distingue à l’arrêt', () => {
    assert.ok(blocks.includes('translateX(60%)'),
      'la bande sort du cadre : à l’arrêt, un foil ressemblerait à un non-foil');
  });
});
