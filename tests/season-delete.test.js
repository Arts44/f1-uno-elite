/* ══════════════════════════════════════════════════════════
   SUPPRESSION PAR SAISON — ce qui part, et surtout ce qui reste.

   Avant le multi-saisons, la zone danger effaçait TOUTES les
   saisons. Nettoyer un essai 2026 emportait la collection 2025.

   Le tri repose sur le `_\d+$` de SEASON_KEY_RE : une clé
   partagée (thème, langue, PIN…) n'a pas d'année, donc elle
   n'entre jamais dans la sélection. Ces tests figent les DEUX
   sens — ce qui doit partir, et ce qui ne doit pas.
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetStorage } from './_setup.js';
import { installFixtures } from './_fixtures.js';
import { setCurrentSeason } from '../data.js';
import { deleteLocalCollectionData, SEASON_KEY_RE } from '../storage.js';

const PARTAGEES = {
  f1uno_theme: 'dark', f1uno_lang: 'fr', f1uno_font: 'circuit',
  f1uno_pin: 'hash', f1uno_viewer: 'false', f1uno_onboarded: 'true',
  f1uno_cloud_session: '{"access_token":"x"}', f1uno_storage_version: '3',
  f1uno_install_dismissed: '1', f1uno_qa_hint: 'shown', f1uno_tut_skipped: 'true',
};
const decor = () => {
  resetStorage(); installFixtures();
  for (const [k, v] of Object.entries(PARTAGEES)) localStorage.setItem(k, v);
  for (const an of [2025, 2026]) {
    localStorage.setItem(`f1uno_owned_${an}`, JSON.stringify({ P1: { blue: { owned: true, qty: 1 } } }));
    localStorage.setItem(`f1uno_badges_${an}`, '{"m_paddock":1}');
    localStorage.setItem(`f1uno_auto_badges_${an}`, '{"first_card":1}');
    localStorage.setItem(`f1uno_history_${an}`, '[]');
    localStorage.setItem(`f1uno_title_${an}`, 'rookie');
    localStorage.setItem(`f1uno_pinned_badge_${an}`, 'pilote_all');
  }
  localStorage.setItem('f1uno_changes_since_backup', '7');
  localStorage.setItem('f1uno_last_backup', '1700000000000');
};
// Le mock de localStorage expose key(i)/length, pas des propriétés
// indexées : Object.keys() y renvoie un tableau vide.
const cles = () => {
  const out = [];
  for (let i = 0; i < localStorage.length; i++) out.push(localStorage.key(i));
  return out.sort();
};
const dOne = an => cles().filter(k => k.endsWith('_' + an));

describe('« cette saison » — chirurgical', () => {
  beforeEach(() => { decor(); setCurrentSeason(2025); });

  test('les 6 clés de la saison visée partent', () => {
    assert.equal(dOne(2026).length, 6, 'décor');
    deleteLocalCollectionData(2026);
    assert.deepEqual(dOne(2026), []);
  });

  test('AUCUNE clé partagée n’est touchée', () => {
    deleteLocalCollectionData(2026);
    for (const [k, v] of Object.entries(PARTAGEES)) {
      assert.equal(localStorage.getItem(k), v,
        `${k} a disparu — c’est un réglage d’appareil, pas une donnée de saison`);
    }
  });

  test('AUCUNE autre saison n’est touchée', () => {
    deleteLocalCollectionData(2026);
    assert.equal(dOne(2025).length, 6,
      'nettoyer un essai ne doit pas emporter la collection d’une autre saison');
  });

  test('les compteurs GLOBAUX de sauvegarde survivent', () => {
    deleteLocalCollectionData(2026);
    assert.equal(localStorage.getItem('f1uno_changes_since_backup'), '7',
      'ils portent sur toutes les saisons — les remettre à zéro ferait mentir le rappel');
    assert.equal(localStorage.getItem('f1uno_last_backup'), '1700000000000');
  });
});

describe('« toutes les saisons » — le comportement d’avant, préservé', () => {
  beforeEach(() => { decor(); setCurrentSeason(2025); });

  test('les deux saisons partent', () => {
    deleteLocalCollectionData();
    assert.deepEqual(cles().filter(k => SEASON_KEY_RE.test(k)), []);
  });

  test('les réglages partagés restent, là aussi', () => {
    deleteLocalCollectionData();
    for (const [k, v] of Object.entries(PARTAGEES)) assert.equal(localStorage.getItem(k), v, k);
  });

  test('les compteurs de sauvegarde sont remis à zéro — plus rien à sauvegarder', () => {
    deleteLocalCollectionData();
    assert.equal(localStorage.getItem('f1uno_changes_since_backup'), null);
    assert.equal(localStorage.getItem('f1uno_last_backup'), null);
  });
});

describe('le filtre lui-même', () => {
  beforeEach(() => { decor(); setCurrentSeason(2025); });

  test('une année qui ne correspond à rien ne supprime rien', () => {
    // On compte les clés de SAISON : deleteLocalCollectionData appelle
    // loadData() en sortie, qui peut re-persister de l'état courant.
    const avant = cles().filter(k => SEASON_KEY_RE.test(k)).sort();
    deleteLocalCollectionData(1998);
    assert.deepEqual(cles().filter(k => SEASON_KEY_RE.test(k)).sort(), avant);
  });

  test('le filtre compare l’année ENTIÈRE, pas un préfixe', () => {
    localStorage.setItem('f1uno_owned_20260', '{}');   // piège
    deleteLocalCollectionData(2026);
    assert.equal(localStorage.getItem('f1uno_owned_20260'), '{}',
      'un `startsWith` aurait emporté 20260 en visant 2026');
  });
});
