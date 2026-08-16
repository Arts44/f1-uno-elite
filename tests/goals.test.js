/* ══════════════════════════════════════════════════════════
   OBJECTIFS PROCHES (phase H) — nearGoals pur : entamés et non
   finis seulement, triés par manque croissant, manquantes listées.
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { nearGoals } from '../app/collector.js';

const cards = [
  { id: '001', name: 'A', team: 'T1', category: 'pilote' },
  { id: '002', name: 'B', team: 'T1', category: 'pilote' },
  { id: '003', name: 'C', team: 'T2', category: 'pilote', champion: true },
  { id: '004', name: 'D', team: 'T2', category: 'pilote' },
  { id: '005', name: 'E', team: 'T2', category: 'pilote' },
  { id: '006', name: 'F', category: 'gp' },
  { id: '007', name: 'G', category: 'gp' },
];

describe('nearGoals', () => {
  test('entamé et non fini seulement, trié par manque croissant', () => {
    const owned = new Set(['001', '003']);            // T1: 1/2 · T2: 1/3 · pilote: 2/5 · gp: 0/2 (pas commencé)
    const g = nearGoals(cards, id => owned.has(id));
    assert.equal(g[0].key, 'T1');                      // plus que 1
    assert.equal(g[0].missing.length, 1);
    assert.equal(g[0].missing[0].id, '002');
    assert.ok(!g.some(x => x.key === 'gp'), 'un but pas commencé ne motive personne');
    assert.ok(!g.some(x => x.kind === 'champion' && x.missing.length === 0));
  });
  test('un but fini disparaît ; limite respectée', () => {
    const owned = new Set(['001', '002', '003', '004', '006']);
    const g = nearGoals(cards, id => owned.has(id), 2);
    assert.ok(!g.some(x => x.key === 'T1'), 'T1 est fini');
    assert.ok(g.length <= 2);
  });
  test('les champions comptent comme un but', () => {
    const many = [...cards, { id: '008', name: 'H', category: 'pilote', champion: true }];
    const owned = new Set(['003']);                    // champions 1/2
    const g = nearGoals(many, id => owned.has(id), 10);
    assert.ok(g.some(x => x.kind === 'champion' && x.missing.length === 1));
  });
});
