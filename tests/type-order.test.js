/* ══════════════════════════════════════════════════════════
   ORDRE CANONIQUE DES TYPES (1.33.0) — verrouillé par test.
   Base (bleu, vert, rouge, jaune) → foils simples → duals →
   wild → nitro → promos. Toute surface qui liste des types
   (chips de tuile, fiche, popover +, stats, outils) passe par
   sortTypesCanonical — cet ordre ne doit plus bouger.
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TYPE_CANONICAL, sortTypesCanonical } from '../data.js';

const meta = JSON.parse(readFileSync(new URL('../data/metadata.json', import.meta.url), 'utf8'));
const cardsFile = JSON.parse(readFileSync(new URL('../data/cards-2025.json', import.meta.url), 'utf8'));
const cards = Array.isArray(cardsFile) ? cardsFile : cardsFile.cards;

describe('ordre canonique des types', () => {
  test('l’ordre exact est verrouillé', () => {
    assert.deepEqual(TYPE_CANONICAL, [
      'blue', 'green', 'red', 'yellow',
      'blue_foil', 'green_foil', 'red_foil', 'yellow_foil',
      'blue_red_foil', 'green_yellow_foil',
      'wild_foil', 'nitro_foil',
      'promo_blue', 'promo_green', 'promo_red', 'promo_yellow',
    ]);
  });

  test('couvre exactement les types de metadata.json', () => {
    assert.deepEqual([...TYPE_CANONICAL].sort(), Object.keys(meta.cardTypes).sort());
  });

  test('le cas max (Bearman, 16 types en désordre dans le JSON) se trie correctement', () => {
    const mx = cards.reduce((a, c) => c.types.length > a.types.length ? c : a);
    assert.equal(mx.types.length, 16);
    assert.notDeepEqual(mx.types, TYPE_CANONICAL, 'le JSON est bien en désordre (sinon ce test ne prouve rien)');
    assert.deepEqual(sortTypesCanonical(mx.types), TYPE_CANONICAL);
  });

  test('stable pour toutes les cartes : le tri est une permutation, types inconnus en queue', () => {
    for (const c of cards) {
      const sorted = sortTypesCanonical(c.types);
      assert.equal(sorted.length, c.types.length, c.id);
      assert.deepEqual([...sorted].sort(), [...c.types].sort(), c.id);
      // ordre croissant d'index canonique
      const idx = sorted.map(t => TYPE_CANONICAL.indexOf(t));
      for (let i = 1; i < idx.length; i++) assert.ok(idx[i] >= idx[i-1], `${c.id}: ${sorted}`);
    }
    assert.deepEqual(sortTypesCanonical(['zzz', 'blue']), ['blue', 'zzz']);
  });
});
