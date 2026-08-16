/* ══════════════════════════════════════════════════════════
   ACCOUNT / DANGER ZONE — deletion demands an exact typed
   confirmation, respects the chosen scope, and deletes nothing
   without it. deleteLocalCollectionData wipes ONLY collection
   keys (all seasons) and keeps prefs + PIN.
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetStorage } from './_setup.js';
import { installFixtures, seedCollection } from './_fixtures.js';
import { canConfirmDeletion, deletionPlan, DELETE_SCOPES } from '../app/account.js';
import { deleteLocalCollectionData, loadData, cardOwned } from '../app/storage.js';

describe('canConfirmDeletion — typed word gate', () => {
  test('exact word confirms; case and surrounding spaces are forgiven', () => {
    assert.equal(canConfirmDeletion('SUPPRIMER', 'SUPPRIMER'), true);
    assert.equal(canConfirmDeletion('supprimer', 'SUPPRIMER'), true);
    assert.equal(canConfirmDeletion('  Supprimer  ', 'SUPPRIMER'), true);
  });
  test('anything else refuses', () => {
    assert.equal(canConfirmDeletion('', 'SUPPRIMER'), false);
    assert.equal(canConfirmDeletion('SUPPRIME', 'SUPPRIMER'), false);
    assert.equal(canConfirmDeletion('SUPPRIMER!', 'SUPPRIMER'), false);
    assert.equal(canConfirmDeletion(null, 'SUPPRIMER'), false);
    assert.equal(canConfirmDeletion(undefined, 'SUPPRIMER'), false);
    assert.equal(canConfirmDeletion('DELETE', ''), false);
  });
  test('works with every localized word (incl. zh)', () => {
    for (const w of ['DELETE', 'SUPPRIMER', 'BORRAR', '删除', 'ELIMINA', 'VERWIJDER', 'LÖSCHEN'])
      assert.equal(canConfirmDeletion(w, w), true);
  });
});

describe('deletionPlan — scope granularity', () => {
  test('the three scopes are exactly local/cloud/both', () =>
    assert.deepEqual(DELETE_SCOPES, ['local', 'cloud', 'both']));
  /* `season` a rejoint le plan : null = toutes les saisons, une valeur =
     celle-là seulement. Le défaut reste null pour que tout appel qui ne
     précise rien garde le comportement d'avant. */
  test('local: local only, never cloud', () =>
    assert.deepEqual(deletionPlan('local', true), { local: true, cloud: false, season: null }));
  test('cloud: cloud only when signed in', () =>
    assert.deepEqual(deletionPlan('cloud', true), { local: false, cloud: true, season: null }));
  test('both: everything when signed in', () =>
    assert.deepEqual(deletionPlan('both', true), { local: true, cloud: true, season: null }));
  test('cloud scope WITHOUT session never plans a cloud delete', () => {
    assert.deepEqual(deletionPlan('cloud', false), { local: false, cloud: false, season: null });
    assert.deepEqual(deletionPlan('both', false), { local: true, cloud: false, season: null });
  });
  test('une saison précisée est portée telle quelle, en nombre', () => {
    assert.deepEqual(deletionPlan('local', false, 2026), { local: true, cloud: false, season: 2026 });
    assert.deepEqual(deletionPlan('local', false, '2026').season, 2026,
      'une chaîne venue du DOM doit être normalisée — la comparaison de clés est numérique');
  });
  test('unknown scope throws (nothing is deleted by default)', () =>
    assert.throws(() => deletionPlan('everything', true)));
});

describe('deleteLocalCollectionData', () => {
  beforeEach(() => { resetStorage(); installFixtures(); });

  test('wipes collection keys of ALL seasons, keeps prefs and PIN', () => {
    seedCollection({ P1: { blue: { owned: true, qty: 2 } } }); loadData();
    localStorage.setItem('f1uno_owned_2024', '{}');
    localStorage.setItem('f1uno_badges_2025', '{"x":true}');
    localStorage.setItem('f1uno_auto_badges_2025', '{"y":true}');
    localStorage.setItem('f1uno_history_2025', '[]');
    localStorage.setItem('f1uno_changes_since_backup', '12');
    localStorage.setItem('f1uno_theme', 'dark');
    localStorage.setItem('f1uno_lang', 'fr');
    localStorage.setItem('f1uno_pin_hash', 'abc');
    assert.equal(cardOwned('P1'), true);

    deleteLocalCollectionData();

    for (const k of ['f1uno_owned_2025', 'f1uno_owned_2024', 'f1uno_badges_2025',
                     'f1uno_auto_badges_2025', 'f1uno_history_2025', 'f1uno_changes_since_backup'])
      assert.equal(localStorage.getItem(k), null, k + ' must be gone');
    assert.equal(localStorage.getItem('f1uno_theme'), 'dark');
    assert.equal(localStorage.getItem('f1uno_lang'), 'fr');
    assert.equal(localStorage.getItem('f1uno_pin_hash'), 'abc');
    // in-memory state reloaded: nothing owned anymore
    assert.equal(cardOwned('P1'), false);
  });
});
