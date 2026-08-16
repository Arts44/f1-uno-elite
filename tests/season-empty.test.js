/* ══════════════════════════════════════════════════════════
   LE SILENCE — un catalogue introuvable ne doit JAMAIS laisser
   celui de la saison précédente à l'écran.

   Le défaut d'origine : sur un 404, `_applyCards` n'était jamais
   appelé, CARDS_DB gardait son contenu, et le garde-fou
   `if(!CARDS_DB.length)` ne se déclenchait pas puisque la liste
   n'était pas vide. L'app affichait 101 cartes de 2025 sous une
   étiquette 2026, sans un mot.

   Démontré au navigateur AVANT correction : bascule vers une
   saison déclarée sans fichier → 10 cartes de la saison
   précédente affichées, et un bandeau annonçant « 10 des 20
   cartes de 2027 » — un mensonge, ces 10 étaient celles de 2026.
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetStorage } from './_setup.js';
import { installFixtures } from './_fixtures.js';
import {
  CARDS_DB, setCurrentSeason, loadAppData, _applyCards, _applyMetadata,
  seasonCatalogueState,
} from '../app/data.js';

const CARTES_2025 = [
  { id: '001', season: 2025, number: 1, name: 'A', team: 'T', category: 'pilote',
    nationality: '', champion: false, championYears: [], description: '', tags: [],
    types: ['blue'], retired: false, power: 'Skip' },
  { id: '002', season: 2025, number: 2, name: 'B', team: 'T', category: 'pilote',
    nationality: '', champion: false, championYears: [], description: '', tags: [],
    types: ['blue'], retired: false, power: 'Skip' },
];

let origFetch, origEmbedded;
const routes = {};
beforeEach(() => {
  resetStorage(); installFixtures();
  origFetch = globalThis.fetch;
  origEmbedded = globalThis.window.__F1UNO_EMBEDDED;
  globalThis.window.__F1UNO_EMBEDDED = undefined;   // pas de repli par défaut
  globalThis.fetch = async (url) => {
    const u = String(url);
    for (const [motif, rep] of Object.entries(routes)) {
      if (u.includes(motif)) return rep;
    }
    return { ok: false, status: 404, json: async () => { throw new Error('404'); } };
  };
});
afterEach(() => {
  globalThis.fetch = origFetch;
  globalThis.window.__F1UNO_EMBEDDED = origEmbedded;
  for (const k of Object.keys(routes)) delete routes[k];
});

const ok = body => ({ ok: true, status: 200, json: async () => body });

describe('catalogue introuvable — le précédent ne survit pas', () => {
  test('un 404 sur le fichier de cartes VIDE le catalogue', async () => {
    setCurrentSeason(2025);
    _applyCards(CARTES_2025);
    assert.equal(CARDS_DB.length, 2, 'décor : 2025 est chargée');

    setCurrentSeason(2026);              // aucune route → 404 sur cards-2026
    await loadAppData();
    assert.equal(CARDS_DB.length, 0,
      'les cartes de 2025 ne doivent PAS rester sous l’étiquette 2026');
  });

  test('l’état devient « vide », pas « partiel » — un partiel mentirait', async () => {
    setCurrentSeason(2025);
    _applyCards(CARTES_2025);
    routes['metadata.json'] = ok({ seasons: [{ year: 2026, cardCount: 20 }] });
    setCurrentSeason(2026);
    await loadAppData();
    const s = seasonCatalogueState();
    assert.equal(s.etat, 'vide',
      'avec 2 cartes héritées, l’état aurait été « partiel » et le bandeau aurait annoncé « 2 des 20 cartes de 2026 »');
    assert.equal(s.charge, 0);
  });

  test('un catalogue qui charge bien remplace l’ancien, il ne s’y ajoute pas', async () => {
    setCurrentSeason(2025);
    _applyCards(CARTES_2025);
    routes['cards-2026.json'] = ok([{ ...CARTES_2025[0], id: '900', season: 2026 }]);
    setCurrentSeason(2026);
    await loadAppData();
    assert.equal(CARDS_DB.length, 1);
    assert.equal(CARDS_DB[0].id, '900');
  });

  test('le repli embarqué ne sert QUE si la saison y figure', async () => {
    globalThis.window.__F1UNO_EMBEDDED = { cards2025: CARTES_2025 };
    setCurrentSeason(2026);
    await loadAppData();
    assert.equal(CARDS_DB.length, 0,
      'les cartes embarquées de 2025 ne doivent pas combler le trou de 2026');
  });

  test('le repli embarqué sert quand la saison y figure', async () => {
    globalThis.window.__F1UNO_EMBEDDED = { cards2026: [{ ...CARTES_2025[0], season: 2026 }] };
    setCurrentSeason(2026);
    await loadAppData();
    assert.equal(CARDS_DB.length, 1, 'hors ligne, une saison embarquée reste consultable');
  });
});

describe('les trois intensités se suivent', () => {
  test('vide → partiel → complet, sur la même saison', async () => {
    _applyMetadata({ seasons: [{ year: 2026, cardCount: 3 }] });
    setCurrentSeason(2026);
    _applyCards([]);
    assert.equal(seasonCatalogueState().etat, 'vide');
    _applyCards([CARTES_2025[0]]);
    assert.equal(seasonCatalogueState().etat, 'partiel');
    _applyCards([CARTES_2025[0], CARTES_2025[1], { ...CARTES_2025[0], id: '003' }]);
    assert.equal(seasonCatalogueState().etat, 'complet');
  });
});
