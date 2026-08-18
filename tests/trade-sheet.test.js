/* ══════════════════════════════════════════════════════════
   LA FICHE D'ÉCHANGE (1.69.0) — les deux points de la revue.

   1. #trade= NE PEUT JAMAIS ÊTRE PRIS POUR #backup= — dans les
      DEUX sens, avec un message nommé, jamais un « invalide »
      générique. Un utilisateur qui croit restaurer et importe
      une liste d'échange serait un incident sérieux.
   2. LE PLAFOND RESTE HONNÊTE quand la liste est courte : pas de
      « + 0 autres dans le code », pas de colonne vide.

   Les fonctions de code (encode/decode) exigent Compression-
   Stream : présent sous Node 22. Le RENDU canvas se vérifie au
   navigateur (règle du dépôt), le FLUX réel aussi.
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import '../app/translations.js';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { tradeSheetModel } from '../app/collector.js';

const read = f => readFileSync(new URL('../app/' + f, import.meta.url), 'utf8');
const backup = read('backup.js');

describe('1 · une fiche d’échange n’est JAMAIS une sauvegarde', () => {
  test('decodeBackupCode refuse F1T1 avec un message NOMMÉ, avant le générique', () => {
    const fn = backup.match(/export async function decodeBackupCode[\s\S]*?\n}/)[0];
    const iTrade = fn.indexOf("/^F1T1\\./");
    const iGeneric = fn.indexOf("/^F1U[01]\\./");
    assert.ok(iTrade > -1, 'aucun garde contre un code de fiche');
    assert.ok(iTrade < iGeneric, 'le refus nommé doit passer AVANT le rejet générique');
    assert.match(fn, /F1T1[\s\S]{0,80}tr\.is_trade/, 'message dédié attendu');
  });

  test('decodeTradeCode refuse F1U* symétriquement', () => {
    const fn = backup.match(/export async function decodeTradeCode[\s\S]*?\n}/)[0];
    assert.match(fn, /F1U\[01\][\s\S]{0,80}tr\.is_backup/);
  });

  test('les deux préfixes sont disjoints et les deux enveloppes séparées', () => {
    assert.match(backup, /'F1T1\.' \+ bytesToB64url/);
    assert.match(backup, /'F1U1\.' \+ bytesToB64url/);
    // routeurs de hash distincts
    assert.match(backup, /#backup=/);
    assert.match(backup, /#trade=/);
    assert.match(read('app.js'), /maybeHandleTradeHash\(\)/);
  });

  test('un #trade= reçu n’ouvre PAS le dialogue d’import (lecture seule)', () => {
    const fn = backup.match(/export async function maybeHandleTradeHash[\s\S]*?\n}/)[0];
    assert.ok(!/_showImportDialog/.test(fn),
      'une fiche reçue ne doit jamais proposer de restaurer — c’est l’incident à éviter');
    assert.match(fn, /_showIncomingTrade/);
  });

  test('la racine (vitrine) fait suivre le fragment #trade= vers /app/', () => {
    const root = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    assert.match(root, /#\(backup\|trade\|access_token\|error\)=/,
      'sans ça, un QR scanné depuis la racine perdrait la liste');
  });
});

describe('2 · le plafond reste honnête sur une liste courte', () => {
  const mk = (n, wish = 0) => Array.from({ length: n }, (_, i) => ({ id: 'C' + i, name: 'Carte ' + i, wishlist: i < wish }));

  test('liste plus courte que le plafond : AUCUN « + 0 autres »', () => {
    const m = tradeSheetModel(mk(3), mk(2), 6);
    assert.equal(m.wantMore, 0);
    assert.equal(m.offerMore, 0);
    assert.equal(m.want.length, 3);
    assert.equal(m.offer.length, 2);
  });

  test('aucun double : la colonne « je donne » ne se dessine pas', () => {
    const m = tradeSheetModel(mk(5), [], 6);
    assert.equal(m.hasOffer, false);
    assert.equal(m.offer.length, 0);
    assert.equal(m.offerMore, 0);
  });

  test('rien à chercher (collection complète) : pas de colonne « je cherche »', () => {
    const m = tradeSheetModel([], mk(4), 6);
    assert.equal(m.hasWant, false);
  });

  test('pile au plafond : rempli, mais toujours pas de « + 0 »', () => {
    const m = tradeSheetModel(mk(6), mk(6), 6);
    assert.equal(m.want.length, 6);
    assert.equal(m.wantMore, 0);
  });

  test('au-delà : le reste est annoncé, et le TOTAL reste exact', () => {
    const m = tradeSheetModel(mk(29), mk(8), 6);
    assert.equal(m.want.length, 6);
    assert.equal(m.wantMore, 23);
    assert.equal(m.wantTotal, 29);
    assert.equal(m.offerMore, 2);
  });

  test('les souhaitées passent devant sur l’image', () => {
    const want = [
      { id: 'A', name: 'A', wishlist: false }, { id: 'B', name: 'B', wishlist: true },
      { id: 'C', name: 'C', wishlist: false }, { id: 'D', name: 'D', wishlist: true },
    ];
    const m = tradeSheetModel(want, [], 2);
    assert.deepEqual(m.want.map(r => r.id), ['B', 'D']);
  });

  test('le dessin lit hasWant/hasOffer et n’écrit « more » que s’il est non nul', () => {
    const src = read('profile-card.js');
    assert.match(src, /m\.sheet\.hasWant \?/);
    assert.match(src, /m\.sheet\.hasOffer \?/);
    assert.match(src, /if\(more\)\{/, 'la ligne « + N » doit être conditionnelle');
  });
});

describe('le code porte TOUJOURS la liste complète (la mesure est écrite)', () => {
  test('la charge envoyée n’est pas plafonnée — seule l’image l’est', () => {
    const src = read('stats.js');
    const bloc = src.match(/svTradeSheet[\s\S]*?shareTradeSheet\(model\)/)[0];
    assert.match(bloc, /want: want\.map\(r => r\.id\)/, 'le code prend TOUTE la liste');
    assert.ok(!/slice\(0, ?6\)|slice\(0, ?cap\)/.test(bloc), 'aucun plafond sur la charge du code');
  });

  test('la marge QR mesurée est commentée pour qui ajoutera un champ', () => {
    assert.match(backup, /101 manquantes\) fait 284 caractères → QR version 11/);
  });
});

describe('i18n ×7 — les clés de la fiche', () => {
  const LANGS = ['en', 'fr', 'es', 'zh', 'it', 'nl', 'de'];
  const KEYS = ['tr.btn', 'tr.title', 'tr.more', 'tr.scan_t', 'tr.scan', 'tr.saved',
    'tr.recv', 'tr.close', 'tr.invalid', 'tr.is_trade', 'tr.is_backup'];
  for(const key of KEYS){
    test(key, () => {
      for(const l of LANGS) assert.ok(window.__T[l] && window.__T[l][key], `${key} manque en ${l}`);
    });
  }
});
