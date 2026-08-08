/* ══════════════════════════════════════════════════════════
   ACCESSIBILITÉ CLAVIER (audit 1.42.2) — la tuile de carte portait
   un onclick sur un <div> sans tabindex : l'action PRINCIPALE de
   l'app (ouvrir une fiche) était hors d'atteinte au clavier, et
   muette pour un lecteur d'écran. Les puces wishlist/favori aussi.

   Ce test garde le CONTRAT DU MARKUP produit — c'est là que la
   régression se produirait (un attribut oublié dans un template).
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const render = readFileSync(new URL('../render.js', import.meta.url), 'utf8');
const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const htmlDev = readFileSync(new URL('../index-dev.html', import.meta.url), 'utf8');

describe('tuile de carte — cible clavier de plein droit', () => {
  test('role, tabindex et nom accessible sont posés', () => {
    for (const attr of ["setAttribute('role', 'button')", "setAttribute('tabindex', '0')", "setAttribute('aria-label'"]) {
      assert.ok(render.includes(attr), `manquant : ${attr}`);
    }
  });

  test('le focus survit au remplacement de la tuile', () => {
    // updateCardTile() remplace le nœud : sans restauration, cocher la
    // wishlist au clavier renvoie au <body> et oblige à re-tabuler.
    const fn = render.slice(render.indexOf('export function updateCardTile'));
    assert.ok(fn.includes('document.activeElement'), 'le focus courant n’est pas relevé');
    assert.ok(fn.includes('focus({ preventScroll: true })'), 'le focus n’est pas reposé');
  });
});

describe('puces d’état — interrupteurs annoncés', () => {
  test('role, tabindex, aria-pressed et aria-label sur les deux puces', () => {
    const chips = render.match(/<div class="schip[^>]*>/g) || [];
    assert.equal(chips.length, 2, 'les deux puces doivent être présentes');
    for (const c of chips) {
      assert.match(c, /role="button"/, c);
      assert.match(c, /tabindex="0"/, c);
      assert.match(c, /aria-pressed="\$\{is(Wish|Fav)\}"/, c);
      assert.match(c, /aria-label="\$\{t\(/, c);
    }
  });
});

describe('activation clavier déléguée', () => {
  test('Entrée et Espace déclenchent les cibles role=button non natives', () => {
    const kb = app.slice(app.indexOf("addEventListener('keydown'"));
    assert.ok(kb.includes("e.key !== 'Enter' && e.key !== ' '"), 'les deux touches ne sont pas gérées');
    assert.ok(kb.includes('[role="button"][tabindex]'), 'la cible déléguée est absente');
    // Les <button>/<a> natifs ne doivent PAS être doublés (double activation)
    assert.ok(kb.includes("el.tagName === 'BUTTON'"), 'les boutons natifs ne sont pas exclus');
  });
});

describe('markup statique des deux points d’entrée', () => {
  for (const [name, src] of [['index.html', html], ['index-dev.html', htmlDev]]) {
    test(`${name} : aucun aria-label vide`, () => {
      assert.equal((src.match(/aria-label=""/g) || []).length, 0);
    });
    test(`${name} : role="tablist" a bien des enfants role="tab"`, () => {
      const tabs = (src.match(/class="bn-tab[^"]*"[^>]*role="tab"/g) || []).length;
      assert.equal((src.match(/class="bn-tab/g) || []).length, tabs, 'un onglet sans role="tab"');
      assert.ok(tabs >= 5, `seulement ${tabs} onglets`);
    });
    test(`${name} : meta description présente`, () => {
      assert.match(src, /<meta name="description" content="[^"]{50,}">/);
    });
  }
});
