import './_setup.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resetStorage } from './_setup.js';
import { installFixtures, seedCollection, CARDS } from './_fixtures.js';
import { RARITY_KEYS } from '../app/data.js';
import { baseCardRarity, variantRarity, cardRarity, loadData } from '../app/storage.js';

const card = id => CARDS.find(c => c.id === id);

describe('rarity scale (real metadata)', () => {
  const meta = JSON.parse(readFileSync(new URL('../app/data/metadata.json', import.meta.url), 'utf8'));

  test('exactly the 7 current rarities, no common/rare', () => {
    assert.deepEqual(meta.rarityKeys, ['epic', 'legendary', 'mythic', 'ultra', 'cosmic', 'divine', 'eternal']);
    assert.ok(!('common' in meta.rarities) && !('rare' in meta.rarities));
  });

  test('rarityOrder is contiguous 0..6 and matches rarityKeys', () => {
    meta.rarityKeys.forEach((k, i) => assert.equal(meta.rarityOrder[k], i));
    assert.equal(Object.keys(meta.rarityOrder).length, meta.rarityKeys.length);
  });

  test('embedded fallback carries the same rarity tables', () => {
    const src = readFileSync(new URL('../app/data-embedded.js', import.meta.url), 'utf8');
    const emb = JSON.parse(src.match(/metadata:\s*({.*})/)[1]);
    assert.deepEqual(emb.rarityKeys, meta.rarityKeys);
    assert.deepEqual(emb.rarityOrder, meta.rarityOrder);
    assert.deepEqual(emb.rarities, meta.rarities);
    assert.deepEqual(emb.roleBaseRarity, meta.roleBaseRarity);
  });
});

describe('baseCardRarity', () => {
  beforeEach(() => { resetStorage(); installFixtures(); });

  test('champion → mythic regardless of category', () =>
    assert.equal(baseCardRarity(card('P1')), 'mythic'));
  test('driver → legendary', () =>
    assert.equal(baseCardRarity(card('P2')), 'legendary'));
  test('reserve and team principal → epic', () => {
    assert.equal(baseCardRarity(card('R1')), 'epic');
    assert.equal(baseCardRarity(card('D1')), 'epic');
  });
  test('grand prix → legendary', () =>
    assert.equal(baseCardRarity(card('G1')), 'legendary'));
  test('unknown category falls back to epic (the lowest rung)', () =>
    assert.equal(baseCardRarity({ category: 'mystery', champion: false }), 'epic'));
});

describe('variantRarity', () => {
  beforeEach(() => { resetStorage(); installFixtures(); });

  test('non-foil type = base rarity', () =>
    assert.equal(variantRarity(card('P2'), 'blue'), 'legendary'));
  test('simple foil = base + 1', () =>
    assert.equal(variantRarity(card('P2'), 'blue_foil'), 'mythic'));
  test('dual foil = base + 2', () =>
    assert.equal(variantRarity(card('P2'), 'blue_red_foil'), 'ultra'));
  test('wild / promo = base + 3', () => {
    assert.equal(variantRarity(card('P2'), 'wild_foil'), 'cosmic');
    assert.equal(variantRarity(card('P2'), 'promo_blue'), 'cosmic');
  });
  test('nitro on a champion clamps exactly at divine — never eternal', () =>
    assert.equal(variantRarity(card('P1'), 'nitro_foil'), 'divine'));

  test('no variant alone can ever reach eternal (foil clamp = divine)', () => {
    for (const c of CARDS)
      for (const ty of c.types)
        assert.notEqual(variantRarity(c, ty), 'eternal', `${c.id}/${ty}`);
  });
  test('reserve + wild = epic + 3 = ultra', () =>
    assert.equal(variantRarity(card('R1'), 'wild_foil'), 'ultra'));
  test('unknown type id behaves like non-foil (base)', () =>
    assert.equal(variantRarity(card('P2'), 'does_not_exist'), 'legendary'));
});

describe('cardRarity (collection-aware)', () => {
  beforeEach(() => { resetStorage(); installFixtures(); });

  test('nothing owned → base rarity', () => {
    seedCollection({}); loadData();
    assert.equal(cardRarity(card('P1')), 'mythic');
    assert.equal(cardRarity(card('R1')), 'epic');
  });

  test('owned base type only → base rarity', () => {
    seedCollection({ P2: { blue: { owned: true, qty: 1 } } }); loadData();
    assert.equal(cardRarity(card('P2')), 'legendary');
  });

  test('best owned variant wins', () => {
    seedCollection({ P2: { blue: { owned: true, qty: 1 }, blue_red_foil: { owned: true, qty: 1 } } });
    loadData();
    assert.equal(cardRarity(card('P2')), 'ultra');
  });

  test('owned flag with qty 0 is ignored → base rarity', () => {
    seedCollection({ P2: { wild_foil: { owned: true, qty: 0 } } }); loadData();
    assert.equal(cardRarity(card('P2')), 'legendary');
  });

  test('champion + nitro owned → divine', () => {
    seedCollection({ P1: { nitro_foil: { owned: true, qty: 1 } } }); loadData();
    assert.equal(cardRarity(card('P1')), 'divine');
  });

  test('set complet → effective rarity +1 (champion + nitro + set = eternal)', () => {
    // P1: blue + blue_foil + nitro_foil tous possédés = set complet.
    // Meilleure variante = divine (nitro sur champion) → +1 = eternal.
    seedCollection({ P1: {
      blue:       { owned: true, qty: 1 },
      blue_foil:  { owned: true, qty: 1 },
      nitro_foil: { owned: true, qty: 1 },
    } });
    loadData();
    assert.equal(cardRarity(card('P1')), 'eternal');
  });

  test('set complet on a NON-champion tops out at divine, not eternal', () => {
    // G1 (gp, legendary base): nitro = cosmic, set complet → +1 = divine.
    seedCollection({ G1: { blue: { owned: true, qty: 1 }, nitro_foil: { owned: true, qty: 1 } } });
    loadData();
    assert.equal(cardRarity(card('G1')), 'divine');
  });

  test('eternal RÉTROGRADE when one copy drops back to 0 (dynamic)', () => {
    seedCollection({ P1: {
      blue:       { owned: true, qty: 1 },
      blue_foil:  { owned: true, qty: 0 },   // set brisé : qty 0
      nitro_foil: { owned: true, qty: 1 },
    } });
    loadData();
    assert.equal(cardRarity(card('P1')), 'divine');
  });

  test('set complet +1 is clamped at the top (already-eternal stays eternal)', () => {
    seedCollection({ P1: {
      blue:       { owned: true, qty: 3 },
      blue_foil:  { owned: true, qty: 2 },
      nitro_foil: { owned: true, qty: 2 },
    } });
    loadData();
    assert.equal(cardRarity(card('P1')), 'eternal');
  });

  test('every reachable rarity is one of RARITY_KEYS', () => {
    seedCollection({}); loadData();
    for (const c of CARDS)
      for (const t of c.types)
        assert.ok(RARITY_KEYS.includes(variantRarity(c, t)), `${c.id}/${t}`);
  });
});

describe('circuits — parité embarqué / data + géométrie GPS', () => {
  const circuits = JSON.parse(readFileSync(new URL('../app/data/circuits.json', import.meta.url), 'utf8'));
  const embSrc = readFileSync(new URL('../app/data-embedded.js', import.meta.url), 'utf8');

  test('data-embedded.js embarque exactement data/circuits.json', () => {
    const emb = JSON.parse(embSrc.match(/circuits:\s*({.*})/)[1]);
    assert.deepEqual(emb, circuits,
      'le repli hors-ligne doit servir les mêmes tracés que data/circuits.json');
  });

  test('23 GP, chaque tracé est une boucle fermée dans le viewBox 500', () => {
    const keys = Object.keys(circuits);
    assert.equal(keys.length, 23);
    for (const k of keys) {
      const p = circuits[k].path;
      assert.match(p, /^M[\d.]/, `${k} : doit ouvrir sur un M absolu`);
      assert.match(p, /Z$/, `${k} : un circuit est une boucle — le chemin doit se fermer`);
      // Toutes les coordonnées restent dans le viewBox (marge sûre du trait incluse)
      const nums = p.match(/-?\d+(\.\d+)?/g).map(Number);
      const out = nums.filter(n => n < 0 || n > 500);
      assert.equal(out.length, 0, `${k} : ${out.length} coordonnées hors du viewBox 0–500`);
    }
  });
});
