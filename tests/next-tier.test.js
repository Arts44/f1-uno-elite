/* ══════════════════════════════════════════════════════════
   LE CRAN SUIVANT (1.65.0) — nextTierInfo(), l'inversion de
   variantRarity : quels types feraient monter la carte d'un
   palier, ou pourquoi rien ne le peut.

   LE PLAFOND D'ABORD. Une carte au maximum ne doit ni afficher
   une ligne vide ni promettre l'impossible — c'est le cas que
   personne ne teste, donc il est écrit EN PREMIER, avant les
   chemins heureux. (Décision du chantier, pas un hasard d'ordre.)
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resetStorage } from './_setup.js';
import { installFixtures, seedCollection, CARDS } from './_fixtures.js';
import { loadData, nextTierInfo } from '../app/storage.js';

const card = id => CARDS.find(c => c.id === id);
const own = (qty = 1) => ({ owned: true, qty });

describe('nextTierInfo — LES PLAFONDS D’ABORD', () => {
  beforeEach(() => { resetStorage(); installFixtures(); });

  test('② plafond STRUCTUREL : set complet, aucune variante au-dessus → ceiling, jamais une ligne vide', () => {
    // D1 (directeur, base épique, un seul type) : posséder son bleu
    // complète le set → légendaire. Rien n'existe au-dessus : la carte
    // plafonne à légendaire SANS être éternelle.
    seedCollection({ D1: { blue: own() } }); loadData();
    const r = nextTierInfo(card('D1'));
    assert.equal(r.kind, 'ceiling');
    assert.equal(r.cur, 'legendary');
    assert.equal(r.next, undefined, 'un plafond ne promet aucun palier suivant');
  });

  test('① plafond ÉTERNEL : champion set complet → top', () => {
    // P1 champion : base mythique, nitro = divin (clamp), set complet
    // 3/3 = +1 → éternel. Dernier palier : rien à promettre.
    seedCollection({ P1: { blue: own(), blue_foil: own(), nitro_foil: own() } }); loadData();
    const r = nextTierInfo(card('P1'));
    assert.equal(r.kind, 'top');
    assert.equal(r.cur, 'eternal');
  });

  test('le flag owned sans exemplaire (qty 0) ne compte pas pour le set', () => {
    // Le cas limite documenté des fixtures (D1 owned:true, qty:0) :
    // cardSetComplete exige qty>0 — la carte reste à sa base, voie du set.
    seedCollection({ D1: { blue: { owned: true, qty: 0 } } }); loadData();
    const r = nextTierInfo(card('D1'));
    assert.equal(r.kind, 'set');
    assert.equal(r.cur, 'epic');
  });
});

describe('nextTierInfo — ③ la voie du set (aucun type seul ne suffit)', () => {
  beforeEach(() => { resetStorage(); installFixtures(); });

  test('carte vierge à type unique : compléter le set est la seule montée', () => {
    seedCollection({}); loadData();
    const r = nextTierInfo(card('D1'));
    assert.equal(r.kind, 'set');
    assert.equal(r.cur, 'epic');
    assert.equal(r.next, 'legendary');
    assert.deepEqual(r.missing, ['blue']);
  });

  test('collectionneur avancé : wild possédé (cosmique), rien au-dessus n’existe — le set fait divin', () => {
    // P2 : wild = cosmique (clamp divin non atteint par un seul type :
    // min(1+3,5)=4). Aucun type manquant ne DÉPASSE cosmique → la seule
    // montée est le set complet (+1 → divin). Le cas le plus fréquent
    // chez un collectionneur avancé — et le plus motivant.
    seedCollection({ P2: { wild_foil: own(), promo_blue: own() } }); loadData();
    const r = nextTierInfo(card('P2'));
    assert.equal(r.kind, 'set');
    assert.equal(r.cur, 'cosmic');
    assert.equal(r.next, 'divine');
    // ordre canonique, pas l'ordre du fichier de données
    assert.deepEqual(r.missing, ['blue', 'blue_foil', 'blue_red_foil']);
  });
});

describe('nextTierInfo — ④ la voie des types', () => {
  beforeEach(() => { resetStorage(); installFixtures(); });

  test('carte vierge riche en foils : tous les types au-dessus de la base, ordre canonique', () => {
    seedCollection({}); loadData();
    const r = nextTierInfo(card('P2'));
    assert.equal(r.kind, 'types');
    assert.equal(r.cur, 'legendary');   // base pilote, rien possédé
    assert.equal(r.next, 'mythic');
    assert.deepEqual(r.types, ['blue_foil', 'blue_red_foil', 'wild_foil', 'promo_blue']);
  });

  test('la liste ne contient QUE ce qui dépasse le palier actuel', () => {
    // P2 possède son dual (ultra) : blue_foil (mythique ≤ ultra) ne
    // fait plus monter — seuls wild et promo (cosmique) restent.
    seedCollection({ P2: { blue_red_foil: own() } }); loadData();
    const r = nextTierInfo(card('P2'));
    assert.equal(r.kind, 'types');
    assert.equal(r.cur, 'ultra');
    assert.deepEqual(r.types, ['wild_foil', 'promo_blue']);
  });

  test('la promesse suit la collection : acquérir le type promis change la réponse', () => {
    seedCollection({ G1: { blue: own() } }); loadData();
    assert.deepEqual(nextTierInfo(card('G1')).types, ['nitro_foil']);
    seedCollection({ G1: { blue: own(), nitro_foil: own() } }); loadData();
    // nitro acquis : cosmique, set complet → +1 divin… non : set complet
    // donne cur = cosmique+1 = divin, et rien au-dessus n'existe → ceiling.
    const r = nextTierInfo(card('G1'));
    assert.equal(r.cur, 'divine');
    assert.equal(r.kind, 'ceiling');
  });
});

describe('cran suivant — contrats de rendu et i18n', () => {
  const read = f => readFileSync(new URL('../app/' + f, import.meta.url), 'utf8');

  test('la ligne se rafraîchit avec la rareté (chemin _renderModalTags)', () => {
    const src = read('render.js');
    assert.match(src, /_renderNextTier\(card\);\n\s*_renderModalStatus\(card\)/,
      'le cran suivant doit se recalculer à chaque changement de quantité');
  });

  test('les plafonds écrivent un texte, jamais une ligne vide', () => {
    const src = read('render.js');
    assert.match(src, /kind === 'top' \|\| info\.kind === 'ceiling'/);
    assert.match(src, /nx\.top' : 'nx\.ceiling'/);
  });

  test('rareté et palier EMPILÉS : deux blocs, pas côte à côte (règle i18n n°1)', () => {
    const html = read('index.html');
    assert.match(html, /id="moRarity"><\/div>\n\s*<div class="mo-tier" id="moTier">/);
  });

  const LANGS = ['en', 'fr', 'es', 'zh', 'it', 'nl', 'de'];
  const KEYS = ['mo.tier', 'nx.next', 'nx.types', 'nx.set', 'nx.ceiling', 'nx.top', 'nx.or', 'nx.sep'];
  new Function(read('translations.js'))();
  for(const key of KEYS){
    test(key + ' ×7', () => {
      for(const l of LANGS) assert.ok(window.__T[l] && window.__T[l][key], `${key} manque en ${l}`);
    });
  }
});
