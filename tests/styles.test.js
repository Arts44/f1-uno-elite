import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// styles.css is not JS, but a whole class of bugs hides in it that no
// other test can catch: a `var(--foo)` whose token was never defined.
// CSS silently invalidates the entire declaration and falls back to the
// initial value — which is exactly how `padding:var(--space-7) …` on the
// dialogs collapsed to 0 after the spacing refactor named a token that
// the (deliberately sparse) scale never defined.
describe('styles.css custom properties', () => {
  const css = readFileSync(new URL('../app/styles.css', import.meta.url), 'utf8');

  // Tokens supplied at runtime by JS (element.style.setProperty) rather
  // than declared in the sheet — legitimately "used but not defined".
  // --c1/--c2 : couleurs de livrée posées inline par liveryHTML() (render.js).
  // --tut-arrow : décalage de la flèche de l'infobulle, calculé sur le
  //   centre du halo à chaque étape (tutorial.js, _positionBubble).
  const RUNTIME_SET = new Set(['--tc', '--rarc', '--px', '--py', '--dur', '--delay', '--logo-bg', '--c1', '--c2', '--tut-arrow']);

  test('every var(--token) used is defined somewhere (or set at runtime)', () => {
    const defined = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1]));
    const used = new Set([...css.matchAll(/var\(\s*(--[\w-]+)/g)].map(m => m[1]));
    const missing = [...used].filter(t => !defined.has(t) && !RUNTIME_SET.has(t));
    assert.deepEqual(missing, [], `undefined CSS custom properties: ${missing.join(', ')}`);
  });

  test('the spacing scale defines every step it advertises being used', () => {
    // Guard specifically the --space-* family, since the refactor churns it.
    const defined = new Set([...css.matchAll(/(--space-[\w-]+)\s*:/g)].map(m => m[1]));
    const used = new Set([...css.matchAll(/var\(\s*(--space-[\w-]+)/g)].map(m => m[1]));
    for (const tok of used) {
      assert.ok(defined.has(tok), `${tok} is used but never defined in :root`);
    }
  });
});

/* ══════════════════════════════════════════════════════════
   HAUTEUR DE TUILE — une seule, et le squelette la partage.
   Avant : la hauteur dépendait du nombre de lignes du nom
   d'écurie et de la présence de la pastille d'exemplaires —
   13 hauteurs distinctes mesurées à 375 px. Le squelette ne
   pouvait alors coller qu'à la médiane.
   Ces tests figent le MÉCANISME (une variable partagée), pas
   une valeur : changer 320 en 340 les laisse verts, retirer la
   variable les casse.
   ══════════════════════════════════════════════════════════ */
describe('hauteur de tuile fixe', () => {
  const css = readFileSync(new URL('../app/styles.css', import.meta.url), 'utf8');

  test('--card-h est déclarée une fois, sur :root', () => {
    const decl = css.match(/--card-h\s*:/g) || [];
    assert.equal(decl.length, 1, '--card-h ne doit avoir qu’une seule déclaration');
    assert.match(css, /:root\{--card-h:\d+px;\}/);
  });

  test('.card ET .sk-card tirent leur hauteur de la MÊME variable', () => {
    assert.match(css, /\.card\{[^}]*height:var\(--card-h\)/,
      'la tuile doit avoir une hauteur fixe');
    assert.match(css, /\.sk-card\{height:var\(--card-h\);\}/,
      'le squelette doit partager la hauteur de la tuile — c’est ce qui le rend EXACT');
  });

  test('le nom de carte est borné, sinon un seul GP dicte la grille', () => {
    const m = css.match(/\.card-name\{[^}]*\}/s);
    assert.ok(m, '.card-name introuvable');
    assert.match(m[0], /-webkit-line-clamp:2/);
  });

  test('la rangée de rareté tombe en bas, l’emplacement d’exemplaires est réservé', () => {
    assert.match(css, /\.card-rarity-row\{[^}]*margin-top:auto/,
      'sans margin-top:auto les pastilles ne s’alignent pas d’une tuile à l’autre');
    assert.match(css, /\.card-owned-summary\{[^}]*min-height:20px/,
      'sans emplacement réservé, les cartes sans exemplaire seraient plus courtes');
  });
});
