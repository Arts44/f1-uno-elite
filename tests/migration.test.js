import './_setup.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetStorage } from './_setup.js';
import { installFixtures } from './_fixtures.js';
import { loadData, coll } from '../app/storage.js';

const V1_OWNED = JSON.stringify({ P1: { blue: { owned: true, qty: 1 } } });
const V1_BADGES = JSON.stringify({ m1: true });
const V1_AUTO = JSON.stringify({ first_card: true });

describe('localStorage migration v1 → v2', () => {
  beforeEach(() => { resetStorage(); installFixtures(); });

  test('legacy keys are copied to season-scoped keys', () => {
    localStorage.setItem('f1uno_v3', V1_OWNED);
    localStorage.setItem('f1uno_badges', V1_BADGES);
    localStorage.setItem('f1uno_auto_badges', V1_AUTO);
    loadData();
    assert.equal(localStorage.getItem('f1uno_owned_2025'), V1_OWNED);
    assert.equal(localStorage.getItem('f1uno_badges_2025'), V1_BADGES);
    assert.equal(localStorage.getItem('f1uno_auto_badges_2025'), V1_AUTO);
    assert.equal(localStorage.getItem('f1uno_version'), '3');
  });

  test('migrated collection is actually loaded into coll', () => {
    localStorage.setItem('f1uno_v3', V1_OWNED);
    loadData();
    assert.equal(coll.P1.blue.owned, true);
  });

  test('existing season-scoped data is never overwritten', () => {
    const existing = JSON.stringify({ P2: { blue: { owned: true, qty: 5 } } });
    localStorage.setItem('f1uno_v3', V1_OWNED);
    localStorage.setItem('f1uno_owned_2025', existing);
    loadData();
    assert.equal(localStorage.getItem('f1uno_owned_2025'), existing);
  });

  test('idempotent: running twice changes nothing', () => {
    localStorage.setItem('f1uno_v3', V1_OWNED);
    loadData();
    const snapshot = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      snapshot[k] = localStorage.getItem(k);
    }
    loadData();
    for (const [k, v] of Object.entries(snapshot))
      assert.equal(localStorage.getItem(k), v, k);
  });

  /* ── v2 → v3 : le titre porté devient season-scoped ──
     Régression 1.47.4 : f1uno_title était partagé par toutes les
     saisons. Un titre gagné en 2025 se serait affiché en 2026 sans
     qu'aucun badge de 2026 ne le débloque. La migration doit déplacer
     le titre existant vers 2025 — et surtout ne pas le perdre. */
  test('v3 : f1uno_title est déplacé vers f1uno_title_2025', () => {
    localStorage.setItem('f1uno_title', '"legend"');
    localStorage.setItem('f1uno_version', '2');
    loadData();
    assert.equal(localStorage.getItem('f1uno_title_2025'), '"legend"');
    assert.equal(localStorage.getItem('f1uno_title'), null, 'la clé nue est retirée');
    assert.equal(localStorage.getItem('f1uno_version'), '3');
  });

  test('v3 : une valeur déjà scoppée n\'est jamais écrasée', () => {
    localStorage.setItem('f1uno_title', '"legend"');
    localStorage.setItem('f1uno_title_2025', '"rookie"');
    localStorage.setItem('f1uno_version', '2');
    loadData();
    assert.equal(localStorage.getItem('f1uno_title_2025'), '"rookie"');
  });

  test('v3 : sans titre existant, rien n\'est créé', () => {
    localStorage.setItem('f1uno_version', '2');
    loadData();
    assert.equal(localStorage.getItem('f1uno_title_2025'), null);
  });

  test('version >= 2 skips the v1→v2 migration entirely', () => {
    localStorage.setItem('f1uno_version', '2');
    localStorage.setItem('f1uno_v3', V1_OWNED);
    loadData();
    assert.equal(localStorage.getItem('f1uno_owned_2025'), null);
  });

  test('fresh install: no legacy keys → empty coll, version stamped', () => {
    loadData();
    assert.deepEqual(coll, {});
    assert.equal(localStorage.getItem('f1uno_version'), '3');
  });

  test('corrupted stored collection falls back to empty coll', () => {
    localStorage.setItem('f1uno_version', '2');
    localStorage.setItem('f1uno_owned_2025', '{not json');
    loadData();
    assert.deepEqual(coll, {});
  });
});
