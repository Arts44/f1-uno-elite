/* ══════════════════════════════════════════════════════════
   QUICK ADD — the grid + button: add one copy of a chosen
   variant, and undo restores the EXACT previous state.
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetStorage } from './_setup.js';
import { installFixtures, seedCollection } from './_fixtures.js';
import { getTypeData, quickAddVariant, undoQuickAdd, cardOwned, loadData } from '../storage.js';

describe('quickAddVariant / undoQuickAdd', () => {
  beforeEach(() => { resetStorage(); installFixtures(); });

  test('first copy: qty 1, owned, not doubles, wishlist cleared', () => {
    seedCollection({ P2: { blue: { owned: false, wishlist: true, qty: 0 } } }); loadData();
    quickAddVariant('P2', 'blue');
    const d = getTypeData('P2', 'blue');
    assert.equal(d.qty, 1);
    assert.equal(d.owned, true);
    assert.equal(d.doubles, false);
    assert.equal(d.wishlist, false);
    assert.equal(cardOwned('P2'), true);
  });

  test('second copy: qty 2 and doubles set', () => {
    seedCollection({ P2: { blue: { owned: true, qty: 1 } } }); loadData();
    quickAddVariant('P2', 'blue');
    const d = getTypeData('P2', 'blue');
    assert.equal(d.qty, 2);
    assert.equal(d.doubles, true);
  });

  test('undo restores the exact previous state (incl. wishlist)', () => {
    seedCollection({ P2: { blue: { owned: false, wishlist: true, qty: 0 } } }); loadData();
    const prev = quickAddVariant('P2', 'blue');
    undoQuickAdd('P2', 'blue', prev);
    const d = getTypeData('P2', 'blue');
    assert.equal(d.qty, 0);
    assert.equal(d.owned, false);
    assert.equal(d.wishlist, true);
    assert.equal(cardOwned('P2'), false);
  });

  test('undo after a second copy goes back to qty 1, doubles cleared', () => {
    seedCollection({ P2: { blue: { owned: true, qty: 1, doubles: false } } }); loadData();
    const prev = quickAddVariant('P2', 'blue');
    undoQuickAdd('P2', 'blue', prev);
    const d = getTypeData('P2', 'blue');
    assert.equal(d.qty, 1);
    assert.equal(d.doubles, false);
    assert.equal(d.owned, true);
  });

  test('works on any variant, not just the base type', () => {
    seedCollection({}); loadData();
    quickAddVariant('P1', 'nitro_foil');
    assert.equal(getTypeData('P1', 'nitro_foil').qty, 1);
    assert.equal(cardOwned('P1'), true);
  });
});
