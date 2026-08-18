/* ══════════════════════════════════════════════════════════
   L'ÉTAT VIDE DU COMPTE (1.70.0) — le fragment retenu de la
   piste 3a, et surtout ce qui N'A PAS été pris.

   Le contrat qui compte : la condition d'affichage est un FAIT
   (une sauvegarde a-t-elle jamais été faite), pas un réglage à
   tenir — le bloc s'efface tout seul au premier export. Et les
   trois refus (projection inventée, quatre gabarits, décor) sont
   tenus par un test : ce qui n'a pas de base dans les données ne
   doit pas revenir par distraction.
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import '../app/translations.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resetStorage } from './_setup.js';
import { hasEverBackedUp, markBackupDone } from '../app/backup.js';

const read = f => readFileSync(new URL('../app/' + f, import.meta.url), 'utf8');
const account = read('account.js');

describe('la condition est un FAIT, pas un réglage', () => {
  beforeEach(() => { resetStorage(); });

  test('appareil neuf : aucune sauvegarde → le bloc s’affiche', () => {
    assert.equal(hasEverBackedUp(), false);
  });

  test('après un export, le bloc disparaît DE LUI-MÊME', () => {
    markBackupDone();
    assert.equal(hasEverBackedUp(), true);
  });

  test('le rendu lit bien ce fait — et rien d’autre', () => {
    assert.match(account, /const showEmpty = !hasEverBackedUp\(\);/);
    assert.match(account, /emptyHTML = showEmpty \?/);
    // Aucune clé de réglage propre à l'état vide : rien à oublier
    assert.ok(!/f1uno_empty|acc_empty_dismiss|empty_seen/.test(account),
      'un état vide qui se mémorise est un réglage de plus à tenir');
  });

  test('les deux gestes sont branchés (sauvegarder / j’ai déjà)', () => {
    assert.match(account, /id="accEmptyExport" data-action="exportCollection"/);
    assert.match(account, /accEmptyImport'\)\?\.addEventListener\('click', triggerImport\)/);
  });
});

describe('les trois refus de la piste 3a sont tenus', () => {
  /* Ancrage sur du CODE, jamais sur des commentaires — règle du dépôt,
     déjà payée au plancher de --card-h : le commentaire qui EXPLIQUE le
     refus contient forcément les mots refusés. On dépouille donc les
     sources avant de chercher (même helper que lockup-geometry). */
  const sansCommentaires = src => src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').map(l => l.replace(/\/\/.*$/, '')).join('\n');

  test('AUCUNE projection de date : rien ne prétend savoir quand ce sera fini', () => {
    for(const src of [account, read('stats.js')]){
      const code = sansCommentaires(src);
      assert.ok(!/projection|complète le|complete on|par jour/i.test(code),
        'la projection est une invention sans base dans les données (POINTS-SIGNALES n°22)');
    }
    // …et aucune clé i18n ne la porterait non plus
    assert.ok(!/'st\.projection|'acc\.projection/.test(read('translations.js')));
  });

  test('UN SEUL écran vide — pas quatre gabarits à maintenir ×7', () => {
    const keys = [...read('translations.js').matchAll(/'(acc\.empty_[a-z_]+)'/g)].map(m => m[1]);
    assert.ok(new Set(keys).size <= 8,
      'la famille acc.empty_* doit rester petite : quatre écrans vides = quatre jeux de chaînes que personne ne revoit');
    // et aucune famille jumelle pour les autres pages
    const src = read('translations.js');
    for(const fam of ['coll.empty_catalog', 'b.empty_ladder', 'st.empty_projection']){
      assert.ok(!src.includes(fam), `${fam} : écran vide refusé (n°22)`);
    }
  });

  test('le refus est écrit là où quelqu’un le relira', () => {
    assert.match(account, /CE QUI N'A PAS ÉTÉ PRIS de la piste 3a/);
    const doc = readFileSync(new URL('../docs/POINTS-SIGNALES.md', import.meta.url), 'utf8');
    assert.match(doc, /## 22\. Les états vides de la piste 3a/);
  });
});

describe('i18n ×7 — les clés de l’état vide', () => {
  const LANGS = ['en', 'fr', 'es', 'zh', 'it', 'nl', 'de'];
  const KEYS = ['acc.empty_t', 'acc.empty_s', 'acc.empty_warn_t', 'acc.empty_warn_s',
    'acc.empty_cta', 'acc.empty_import'];
  for(const key of KEYS){
    test(key, () => {
      for(const l of LANGS) assert.ok(window.__T[l] && window.__T[l][key], `${key} manque en ${l}`);
    });
  }
});
