/* ══════════════════════════════════════════════════════════
   TRI DE GRILLE (phase E) — sortForGrid pur : n° de carte, ou
   manquantes d'abord (n° en départage), sans muter l'entrée.
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { sortForGrid } from '../render.js';

const cards = [{ id: '003' }, { id: '001' }, { id: '002' }, { id: '004' }];
const owned = new Set(['001', '003']);
const isOwned = id => owned.has(id);

describe('sortForGrid', () => {
  test('ordre normal : par n° de carte', () => {
    assert.deepEqual(sortForGrid(cards, 'num', isOwned).map(c => c.id), ['001', '002', '003', '004']);
  });
  test('manquantes d’abord, n° en départage', () => {
    assert.deepEqual(sortForGrid(cards, 'missing', isOwned).map(c => c.id), ['002', '004', '001', '003']);
  });
  test('l’entrée n’est pas mutée et une préférence inconnue = ordre normal', () => {
    const before = cards.map(c => c.id);
    sortForGrid(cards, 'missing', isOwned);
    assert.deepEqual(cards.map(c => c.id), before);
    assert.deepEqual(sortForGrid(cards, 'zzz', isOwned).map(c => c.id), ['001', '002', '003', '004']);
  });
});
