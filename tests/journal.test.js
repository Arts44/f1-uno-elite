/* ══════════════════════════════════════════════════════════
   LE JOURNAL DES GESTES (1.68.0) — le test central est celui de
   la revue : UN JOURNAL QUI INVENTE DES GESTES SERAIT PIRE QUE
   PAS DE JOURNAL. Contrairement à un affichage faux, personne ne
   s'en apercevrait — c'est donc au test de s'en apercevoir.

   1. Restaurer une sauvegarde de 300 cartes → journal VIDE.
      (Les imports remplacent `coll` sans passer par setTypeData ;
      ce test attrape le refactor qui les y ferait passer.)
   2. Un vrai geste → une entrée, avec son delta réel.

   Puis les contrats : plafond 2000 FIFO, chiffrement, sauvegarde
   (fichier/cloud OUI, code/QR JAMAIS — mesuré), restauration.
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import '../app/translations.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resetStorage } from './_setup.js';
import { installFixtures, seedCollection } from './_fixtures.js';
import {
  loadData, quickAddVariant, undoQuickAdd, setTypeData, txBatch,
  collectionSnapshot, _applyImport,
} from '../app/storage.js';
import { getJournal, setJournal, journalRecord, JOURNAL_MAX } from '../app/journal.js';
import { DATA_KEY_RE } from '../app/secure-store.js';

const read = f => readFileSync(new URL('../app/' + f, import.meta.url), 'utf8');

/* _applyImport repeint grille et stats — même béquille de document
   permissif que season-import.test.js. */
const _realDoc = {
  getElementById: globalThis.document.getElementById,
  createElement: globalThis.document.createElement,
  createTextNode: globalThis.document.createTextNode,
};
const _fakeEl = () => ({
  style: {}, dataset: {}, parentElement: null, textContent: '', innerHTML: '',
  classList: { add(){}, remove(){}, toggle(){}, contains: () => false },
  appendChild(){}, append(){}, prepend(){}, insertBefore(){}, remove(){},
  setAttribute(){}, removeAttribute(){}, getAttribute: () => null,
  addEventListener(){}, removeEventListener(){}, focus(){},
  closest: () => null, querySelector: () => null, querySelectorAll: () => [],
  getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0 }),
});
const permissiveDoc = () => {
  globalThis.document.getElementById = _fakeEl;
  globalThis.document.createElement = _fakeEl;
  globalThis.document.createTextNode = _fakeEl;
};
const restoreDoc = () => { Object.assign(globalThis.document, _realDoc); };

describe('le journal ne ment pas — le test de la revue', () => {
  beforeEach(() => { resetStorage(); installFixtures(); seedCollection({}); loadData(); });

  test('1 · restaurer une sauvegarde de 300 cartes laisse le journal VIDE', async () => {
    const owned = {};
    for(let i = 1; i <= 300; i++){
      owned['X' + i] = { blue: { owned: true, wishlist: false, doubles: false, favorite: false, qty: 2 } };
    }
    permissiveDoc();
    try { await _applyImport({ season: 2025, owned }, 'replace'); }
    finally { restoreDoc(); }
    assert.deepEqual(getJournal(), [],
      '300 cartes importées ont produit des entrées de journal — un import est passé par setTypeData : '
      + 'le journal raconte maintenant une histoire qui n\'a pas eu lieu');
  });

  test('2 · un vrai geste s\'inscrit, avec son delta réel', () => {
    quickAddVariant('P1', 'nitro_foil');
    const j = getJournal();
    assert.equal(j.length, 1);
    assert.equal(j[0].c, 'P1');
    assert.equal(j[0].t, 'nitro_foil');
    assert.equal(j[0].q, 1);
    assert.match(j[0].d, /^\d{4}-\d{2}-\d{2}$/);
  });

  test('l\'annulation est un geste aussi : +1 puis −1, l\'histoire est honnête', () => {
    const prev = quickAddVariant('P1', 'blue');
    undoQuickAdd('P1', 'blue', prev);
    const q = getJournal().map(e => e.q);
    assert.deepEqual(q, [1, -1]);
  });

  test('les drapeaux (souhait, favori, double) ne journalisent pas — quantités seulement', () => {
    txBatch(() => {
      setTypeData('P1', 'blue', 'wishlist', true);
      setTypeData('P1', 'blue', 'favorite', true);
      setTypeData('P1', 'blue', 'doubles', false);
    });
    assert.deepEqual(getJournal(), []);
  });

  test('écrire la même quantité (delta 0) ne fabrique pas d\'entrée', () => {
    txBatch(() => { setTypeData('P1', 'blue', 'qty', 0); });
    assert.deepEqual(getJournal(), []);
  });
});

describe('plafond et rotation', () => {
  beforeEach(() => { resetStorage(); installFixtures(); seedCollection({}); loadData(); });

  test('2000 entrées max, FIFO : les plus anciennes jetées d\'abord', () => {
    const old = Array.from({ length: JOURNAL_MAX }, (_, i) => ({ d: '2026-01-01', c: 'OLD' + i, t: 'blue', q: 1 }));
    setJournal(old);
    journalRecord('P1', 'nitro_foil', 1);
    const j = getJournal();
    assert.equal(j.length, JOURNAL_MAX);
    assert.equal(j[0].c, 'OLD1', 'la plus ancienne (OLD0) doit être sortie');
    assert.equal(j[j.length - 1].c, 'P1', 'la plus récente doit être entrée');
  });

  test('le plafond est la valeur tranchée : 2000', () => {
    assert.equal(JOURNAL_MAX, 2000);
  });
});

describe('sauvegarde — fichier et cloud OUI, code/QR JAMAIS (mesuré)', () => {
  beforeEach(() => { resetStorage(); installFixtures(); seedCollection({}); loadData(); });

  test('sans include.journal, le snapshot garde sa forme historique (pas de champ journal)', () => {
    journalRecord('P1', 'blue', 1);
    assert.ok(!('journal' in collectionSnapshot()), 'forme historique du code/QR préservée');
    assert.ok(!('journal' in collectionSnapshot({ prefs: true })), 'les réglages n\'entraînent pas le journal');
  });

  test('avec include.journal, le snapshot le porte', () => {
    journalRecord('P1', 'blue', 1);
    const snap = collectionSnapshot({ journal: true });
    assert.equal(snap.journal.length, 1);
  });

  test('journal vide → pas de champ (les vieux lecteurs ne voient rien de neuf)', () => {
    assert.ok(!('journal' in collectionSnapshot({ journal: true })));
  });

  test('la restauration « remplacer » reprend le journal de la sauvegarde', async () => {
    journalRecord('P1', 'blue', 1);   // journal local, sera remplacé
    permissiveDoc();
    try {
      await _applyImport({ season: 2025, owned: {}, journal: [{ d: '2026-05-01', c: 'P2', t: 'blue', q: 1 }] }, 'replace');
    } finally { restoreDoc(); }
    const j = getJournal();
    assert.equal(j.length, 1);
    assert.equal(j[0].c, 'P2');
  });

  test('la fusion GARDE le journal local — mêler deux chronologies fabriquerait une histoire', async () => {
    journalRecord('P1', 'blue', 1);
    permissiveDoc();
    try {
      await _applyImport({ season: 2025, owned: {}, journal: [{ d: '2026-05-01', c: 'P2', t: 'blue', q: 1 }] }, 'merge');
    } finally { restoreDoc(); }
    assert.equal(getJournal()[0].c, 'P1');
  });

  test('les APPELANTS : export fichier et push cloud demandent le journal, le code/QR jamais', () => {
    assert.match(read('storage.js'), /exportCollection[\s\S]{0,200}collectionSnapshot\(\{ \.\.\.backupIncludes\(\), journal: true \}\)/);
    assert.match(read('cloud-sync.js'), /collectionSnapshot\(\{ \.\.\.backupIncludes\(\), journal: true \}\)/);
    assert.match(read('account.js'), /generateBackupCode\(collectionSnapshot\(backupIncludes\(\)\)\)/,
      'le code/QR ne doit JAMAIS embarquer le journal : mesuré, il le tuerait dès ~500 entrées');
  });

  test('la mesure est écrite sur place, pour arrêter le futur « complèteur »', () => {
    assert.match(read('storage.js'), /\+3777 à 500[\s\S]{0,80}MAX_CODE_CHARS/);
  });
});

describe('registres — la clé est classée partout', () => {
  test('chiffrée au repos : DATA_KEY_RE couvre le journal', () => {
    assert.ok(DATA_KEY_RE.test('f1uno_journal_2025'));
  });
  test('le tutoriel emporte et restaure le journal (un geste du tour est un vrai geste)', () => {
    assert.match(read('tutorial-snapshot.js'), /f1uno_journal_\$\{season\}/);
  });
  test('feuille du graphe : journal.js n\'importe ni storage ni data', () => {
    const src = read('journal.js');
    assert.ok(!/from '\.\/storage\.js'|from '\.\/data\.js'/.test(src),
      'importer storage/data ferait entrer le journal dans la composante de cycles');
  });
});
