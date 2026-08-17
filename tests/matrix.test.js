/* ══════════════════════════════════════════════════════════
   LA MATRICE 4×4 (1.64.0) — contrats de la fiche carte.

   La modale montre les 16 variantes en 4 familles × 4 colonnes,
   TOUJOURS 16 cellules (les inexistantes hachurées, jamais
   sautées), et un inspecteur unique porte la seule paire −/+.

   Deux contrats que rien d'autre ne tient :

   1. LE TUTORIEL. Les étapes mark_owned / mark_double ciblent
      `#moTypeRows .mqbtn[data-delta="1"]` et l'action
      `changeMoQty`. La matrice a remplacé 16 paires par une —
      mais l'inspecteur DOIT garder ces attributs exacts, et sa
      sélection par défaut doit être le premier type existant
      (celui que le tutoriel presse deux fois).

   2. LA COMPLÉTUDE. MX_ROWS est une seconde écriture de
      TYPE_CANONICAL (pliée en 4×4). Un type ajouté à l'un sans
      l'autre disparaîtrait de la fiche sans erreur visible.

   Ces tests lisent les SOURCES (le dépôt ne peut pas monter
   render.js sous node : il tire le DOM entier au chargement).
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TYPE_CANONICAL } from '../app/data.js';

const read = f => readFileSync(new URL('../app/' + f, import.meta.url), 'utf8');
const render = read('render.js');
const appjs = read('app.js');
const css = read('styles.css');

/* MX_ROWS extrait du source et évalué : le littéral lui-même est la
   valeur testée, pas une copie recopiée ici. */
function mxRows(){
  const m = render.match(/const MX_ROWS = \[([\s\S]*?)\n\];/);
  assert.ok(m, 'MX_ROWS introuvable dans render.js');
  return new Function(`return [${m[1]}]`)();
}

describe('matrice — complétude et pliage 4×4', () => {
  test('MX_ROWS couvre TYPE_CANONICAL exactement, une fois chacun', () => {
    const flat = mxRows().flat();
    assert.equal(flat.length, 16);
    assert.deepEqual([...flat].sort(), [...TYPE_CANONICAL].sort());
  });

  test('4 rangées de 4 — le pliage est bien base / foils / spéciaux / promos', () => {
    const rows = mxRows();
    assert.equal(rows.length, 4);
    rows.forEach(r => assert.equal(r.length, 4));
    assert.deepEqual(rows[0], ['blue', 'green', 'red', 'yellow']);
    assert.deepEqual(rows[3], ['promo_blue', 'promo_green', 'promo_red', 'promo_yellow']);
  });

  test('toujours 16 cellules : aucune rangée sautée (le garde du commentaire)', () => {
    // L'ancien rendu sautait les rangées absentes (`if(hasBase)`…).
    // La matrice itère MX_ROWS sans condition : si quelqu'un
    // « optimise » en filtrant les rangées vides, ce test le dira.
    assert.match(render, /MX_ROWS\.map\(/, 'la matrice doit itérer les 4 rangées sans les filtrer');
    assert.ok(!/MX_ROWS\.filter\(/.test(render), 'aucun filtrage des rangées de la matrice');
  });
});

describe('matrice — le contrat du tutoriel (mark_owned / mark_double)', () => {
  test('l’inspecteur porte les attributs exacts que le tutoriel cible', () => {
    // #moTypeRows .mqbtn[data-delta="1"] + dataAction changeMoQty
    assert.match(render, /class="mqbtn" data-action="changeMoQty" data-card="\$\{card\.id\}" data-type="\$\{sel\}" data-delta="-1"/);
    assert.match(render, /class="mqbtn" data-action="changeMoQty" data-card="\$\{card\.id\}" data-type="\$\{sel\}" data-delta="1"/);
  });

  test('la sélection par défaut est le premier type existant (ordre canonique)', () => {
    assert.match(render, /_mxSelected = sortTypesCanonical\(card\.types\)\[0\]/);
    // …et elle est réinitialisée à chaque ouverture de fiche.
    assert.match(render, /_mxSelected = null;[^\n]*\n\s*renderModalTypes\(card\)/);
  });
});

describe('matrice — sélection en lecture, écritures bloquées en spectateur', () => {
  test('selectMoType est câblé mais PAS dans VIEWER_BLOCKED', () => {
    assert.match(appjs, /case 'selectMoType'/);
    const vb = appjs.match(/VIEWER_BLOCKED = new Set\(\[([\s\S]*?)\]\)/);
    assert.ok(vb, 'VIEWER_BLOCKED introuvable');
    assert.ok(vb[1].includes("'changeMoQty'"), 'changeMoQty reste bloqué en spectateur');
    assert.ok(!vb[1].includes('selectMoType'), 'la sélection est une lecture : pas de blocage');
  });

  test('le CSS spectateur n’éteint que les −/+, pas les cellules', () => {
    assert.match(css, /body\.viewer-mode \.mo-type-rows \.mqbtn/);
    assert.ok(!/body\.viewer-mode \.mo-type-rows button/.test(css),
      'l’ancien sélecteur éteignait TOUT bouton — il rendrait la matrice inerte en spectateur');
  });
});

describe('matrice — l’encre du wild (défaut préexistant, corrigé au passage)', () => {
  test('le wild s’encre via --wild-ink, défini dans les deux thèmes', () => {
    assert.match(render, /wild_foil' \? 'var\(--wild-ink\)'/);
    assert.match(css, /--wild-ink:#0a0a0a/);
    const dark = css.slice(css.indexOf('[data-theme="dark"] {'));
    assert.match(dark, /--wild-ink:#DEDADC/, 'sans redéfinition sombre, le wild redevient invisible');
  });
});

describe('matrice — i18n ×7', () => {
  // Les traductions sont un script global (window.__T), pas un module.
  new Function(read('translations.js'))();
  const LANGS = ['en', 'fr', 'es', 'zh', 'it', 'nl', 'de'];
  const KEYS = ['mx.count', 'mx.fam_base', 'mx.fam_foil', 'mx.fam_special', 'mx.fam_promo',
    'mx.own', 'mx.miss', 'mx.none'];
  for(const key of KEYS){
    test(key, () => {
      for(const l of LANGS) assert.ok(window.__T[l] && window.__T[l][key], `${key} manque en ${l}`);
    });
  }
  test('les libellés de colonne sont des icônes, jamais des clés traduites', () => {
    // La règle i18n n°2 : les en-têtes de colonnes passent par typeIcon,
    // aucune clé mx.col_* ne doit exister.
    assert.match(render, /mo-mx-colhead" aria-hidden="true">\$\{typeIcon\(c\)\}/);
    assert.ok(!/mx\.col_/.test(read('translations.js')), 'pas d’abréviations de colonnes traduites');
  });
});
