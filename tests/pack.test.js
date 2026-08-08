/* ══════════════════════════════════════════════════════════
   MODE POCHETTE (phase G) — la logique pure du flux : saisie du
   numéro, reconnaissance de la carte, bilan de session.
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { packKeyReduce, resolvePackInput, packSummary } from '../pack.js';

const cards = [{ id: '001', name: 'A' }, { id: '010', name: 'B' }, { id: '101', name: 'C' }];

describe('saisie du numéro', () => {
  test('accumule jusqu’à 3 chiffres puis sature', () => {
    let b = '';
    for (const k of ['0', '1', '0', '7']) b = packKeyReduce(b, k);
    assert.equal(b, '010');
  });
  test('retour arrière et touches non numériques', () => {
    assert.equal(packKeyReduce('010', 'back'), '01');
    assert.equal(packKeyReduce('', 'back'), '');
    assert.equal(packKeyReduce('01', 'a'), '01');
    assert.equal(packKeyReduce('01', 'Enter'), '01');
  });
});

describe('reconnaissance de la carte', () => {
  test('en dessous de 3 chiffres : rien n’est proposé', () => {
    assert.equal(resolvePackInput('', cards).state, 'typing');
    assert.equal(resolvePackInput('01', cards).state, 'typing');
  });
  test('3 chiffres connus : la carte est rendue', () => {
    const r = resolvePackInput('010', cards);
    assert.equal(r.state, 'found');
    assert.equal(r.card.name, 'B');
  });
  test('3 chiffres inconnus : signalé, jamais une carte au hasard', () => {
    const r = resolvePackInput('999', cards);
    assert.equal(r.state, 'unknown');
    assert.equal(r.id, '999');
  });
  test('les zéros de tête comptent : « 1 » n’est pas « 001 »', () => {
    assert.equal(resolvePackInput('100', cards).state, 'unknown');
    assert.equal(resolvePackInput('101', cards).state, 'found');
  });
});

describe('bilan de session', () => {
  const entries = [
    { cardId: '001', kind: 'add' }, { cardId: '010', kind: 'dup' },
    { cardId: '101', kind: 'skip' }, { cardId: '001', kind: 'dup' },
  ];
  test('ajoutées = tout sauf les passées ; nouvelles et doublons distingués', () => {
    assert.deepEqual(packSummary(entries), { added: 3, fresh: 1, dup: 2, skipped: 1 });
  });
  test('session vide', () => {
    assert.deepEqual(packSummary([]), { added: 0, fresh: 0, dup: 0, skipped: 0 });
  });
});
