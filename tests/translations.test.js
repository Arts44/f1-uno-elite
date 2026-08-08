/* ══════════════════════════════════════════════════════════
   INTÉGRITÉ DE translations.js (audit 1.42.2) — le fichier est un
   unique objet littéral de ~500 clés × 7 langues, édité au fil de
   ~45 versions. Une clé écrite DEUX FOIS dans le même bloc ne
   produit aucune erreur : la seconde écrase silencieusement la
   première. C'est exactement ce qui est arrivé à nav.admin, dont
   la traduction néerlandaise « Beheer » était masquée par un
   « Admin » recopié du bloc anglais.

   Ces tests lisent le SOURCE (pas l'objet évalué) : c'est le seul
   endroit où un doublon est encore visible.
   ══════════════════════════════════════════════════════════ */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const LANGS = ['en', 'fr', 'es', 'zh', 'it', 'nl', 'de'];
const src = readFileSync(new URL('../translations.js', import.meta.url), 'utf8');
const head = src.slice(0, src.indexOf('window.__BADGE_T'));

// Découpe le dictionnaire d'interface en un bloc par langue.
function blocks(){
  const marks = LANGS.map(l => [head.indexOf(l + ':{'), l]).sort((a, b) => a[0] - b[0]);
  const out = {};
  marks.forEach(([start, lang], i) => {
    const end = i + 1 < marks.length ? marks[i + 1][0] : head.length;
    out[lang] = head.slice(start, end);
  });
  return out;
}
const keysOf = block => [...block.matchAll(/'([a-zA-Z0-9_.]+)':'/g)].map(m => m[1]);

describe('translations.js — intégrité du dictionnaire', () => {
  const B = blocks();

  test('les 7 langues sont présentes', () => {
    assert.deepEqual(Object.keys(B).sort(), [...LANGS].sort());
  });

  test('aucune clé dupliquée dans un bloc de langue', () => {
    for (const lang of LANGS) {
      const ks = keysOf(B[lang]);
      const dupes = [...new Set(ks.filter((k, i) => ks.indexOf(k) !== i))];
      assert.deepEqual(dupes, [], `${lang} : clés en double (la 2e écrase la 1re) → ${dupes.join(', ')}`);
    }
  });

  test('toutes les langues exposent exactement le même jeu de clés', () => {
    const ref = new Set(keysOf(B.en));
    for (const lang of LANGS) {
      const ks = new Set(keysOf(B[lang]));
      const missing = [...ref].filter(k => !ks.has(k));
      const extra = [...ks].filter(k => !ref.has(k));
      assert.deepEqual(missing, [], `${lang} : ${missing.length} clés manquantes`);
      assert.deepEqual(extra, [], `${lang} : ${extra.length} clés en trop`);
    }
  });

  test('aucune valeur vide (une clé sans texte affiche du vide à l’écran)', () => {
    for (const lang of LANGS) {
      const empties = [...B[lang].matchAll(/'([a-zA-Z0-9_.]+)':''/g)].map(m => m[1]);
      assert.deepEqual(empties, [], `${lang} : valeurs vides → ${empties.join(', ')}`);
    }
  });

  test('nav.admin : le néerlandais garde sa traduction, pas l’emprunt anglais', () => {
    // Régression de l'audit : le doublon faisait gagner « Admin ».
    const m = B.nl.match(/'nav\.admin':'([^']*)'/);
    assert.ok(m, 'nav.admin absent du bloc nl');
    assert.equal(m[1], 'Beheer');
  });
});
