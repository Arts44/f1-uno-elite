/* ══════════════════════════════════════════════════════════
   BANDEAU DE NAVIGATION — largeur du SVG

   layoutNavBead() dérivait sa largeur de window.innerWidth - 24.
   Au tout premier layout d'un onglet ouvert en arrière-plan,
   innerWidth vaut 0 : la largeur passait à -24 et le navigateur
   rejetait width="-24" / viewBox="0 0 -24 58" (deux erreurs
   console à chaque démarrage).

   Ce test appelle la fonction avec un DOM minimal et vérifie que
   les attributs posés restent valides quelle que soit la largeur.

   Il vérifie l'INVARIANT, pas la valeur du plancher : « le SVG
   reste valide » tient que le repli vaille 1 px (le choix retenu :
   la barre est de toute façon invisible à ce moment-là) ou une
   largeur plausible. Un test qui aurait figé 240 aurait échoué sur
   un correctif également correct — ce qu'on demande au code, c'est
   de ne jamais produire width="-24", pas d'atteindre un nombre.
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

function fakeEl(){
  return {
    style: {}, attrs: {}, innerHTML: '',
    setAttribute(k, v){ this.attrs[k] = String(v); },
    getAttribute(k){ return this.attrs[k] ?? null; },
    querySelector: () => null,
    querySelectorAll: () => [],
    classList: { add(){}, remove(){}, contains: () => false },
  };
}

// DOM minimal : la barre, son conteneur, et 5 onglets (comme l'app).
const bar = fakeEl(), inner = fakeEl();
const tabs = Array.from({ length: 5 }, (_, i) => {
  const t = fakeEl();
  t.classList = { add(){}, remove(){}, contains: () => i === 0 };
  return t;
});
globalThis.document = {
  ...globalThis.document,
  getElementById: id => (id === 'beadBar' ? bar : id === 'beadInner' ? inner : null),
  querySelector: () => null,
  querySelectorAll: sel => (sel === '.bn-tab' ? tabs : []),
};

const { layoutNavBead } = await import('../app/render.js');

describe('layoutNavBead — largeur du SVG', () => {
  for (const vw of [0, 320, 375, 1280]) {
    test(`innerWidth=${vw} : width et viewBox restent positifs`, () => {
      globalThis.window.innerWidth = vw;
      layoutNavBead();
      const w = Number(bar.getAttribute('width'));
      assert.ok(w > 0, `width invalide : ${bar.getAttribute('width')}`);
      const vb = bar.getAttribute('viewBox');
      assert.ok(/^0 0 \d+(\.\d+)? \d+(\.\d+)?$/.test(vb), `viewBox invalide : ${vb}`);
      assert.ok(!inner.style.width.startsWith('-'), `largeur interne négative : ${inner.style.width}`);
    });
  }

  test('sur une fenêtre mesurable, la largeur suit bien la fenêtre', () => {
    globalThis.window.innerWidth = 400;
    layoutNavBead();
    assert.equal(Number(bar.getAttribute('width')), 376);
  });

  test('la largeur reste plafonnée à 560', () => {
    globalThis.window.innerWidth = 1920;
    layoutNavBead();
    assert.equal(Number(bar.getAttribute('width')), 560);
  });
});
