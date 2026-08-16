/* ══════════════════════════════════════════════════════════
   SAISON DE DÉVELOPPEMENT — visible en dev, ABSENTE en prod.

   Le problème n'est pas de permissions : il n'y a rien à
   protéger, juste des données de test à ne pas livrer. Donc pas
   d'authentification, pas de séquence secrète, pas de porte
   dérobée — le dépôt en a déjà écarté une pour le PIN.

   Le mécanisme est celui du POINT D'ENTRÉE. index-dev.html pose
   `window.__F1UNO_DEV`, index.html ne le pose pas. La liste des
   saisons reste UNIQUE — seasons[] dans metadata.json — et seule
   sa LECTURE filtre : pas de seconde source de vérité.
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resetStorage } from './_setup.js';
import { installFixtures } from './_fixtures.js';
import {
  CARDS_DB, setCurrentSeason, _applyMetadata, _applyCards,
  availableSeasons, isDevBuild, isTestSeason, loadAppData,
} from '../app/data.js';

const lire = f => readFileSync(new URL('../app/' + f, import.meta.url), 'utf8');
const META = JSON.parse(lire('data/metadata.json'));

const SAISONS = [
  { year: 2025, cardCount: 101 },
  { year: 2026, cardCount: 10, test: true },
];

beforeEach(() => { resetStorage(); installFixtures(); delete globalThis.window.__F1UNO_DEV; });
afterEach(() => { delete globalThis.window.__F1UNO_DEV; });

describe('les deux points d’entrée', () => {
  test('index.html ne pose JAMAIS le marqueur de développement', () => {
    assert.equal(/__F1UNO_DEV/.test(lire('index.html')), false,
      'le marqueur dans l’entrée de production rendrait les saisons de test visibles à tous');
  });

  test('index-dev.html le pose', () => {
    assert.match(lire('index-dev.html'), /window\.__F1UNO_DEV\s*=\s*true/);
  });

  test('le marqueur est posé AVANT les scripts qui lisent les données', () => {
    const src = lire('index-dev.html');
    assert.ok(src.indexOf('__F1UNO_DEV') < src.indexOf('data-embedded.js'),
      'posé après, il arriverait trop tard pour le premier rendu');
  });

  test('le marqueur ne touche à rien d’autre qu’aux saisons', () => {
    // Aucun code ne doit s'en servir pour contourner un verrou.
    for (const f of ['pin.js', 'session.js', 'storage.js', 'cloud-auth.js', 'account.js']) {
      assert.equal(/__F1UNO_DEV|isDevBuild/.test(lire(f)), false,
        `${f} ne doit pas consulter le marqueur — ce n’est pas une porte dérobée`);
    }
  });
});

describe('filtrage de la liste des saisons', () => {
  test('hors dev, une saison de test n’est pas sélectionnable', () => {
    _applyMetadata({ ...META, seasons: SAISONS });
    setCurrentSeason(2025);
    assert.equal(isDevBuild(), false);
    assert.deepEqual(availableSeasons(), [2025]);
  });

  test('en dev, elle l’est', () => {
    globalThis.window.__F1UNO_DEV = true;
    _applyMetadata({ ...META, seasons: SAISONS });
    setCurrentSeason(2025);
    assert.deepEqual(availableSeasons(), [2026, 2025]);
  });

  test('la liste des saisons reste UNE — le filtrage est à la lecture', () => {
    _applyMetadata({ ...META, seasons: SAISONS });
    assert.equal(isTestSeason(2026), true);
    assert.equal(isTestSeason(2025), false);
    // seasons[] n'est pas modifiée par la lecture
    assert.equal(SAISONS.length, 2, 'aucune seconde liste, aucune copie filtrée persistée');
  });
});

describe('ceinture et bretelles — le catalogue lui-même', () => {
  let origFetch;
  beforeEach(() => {
    origFetch = globalThis.fetch;
    // Router par URL : un stub qui renvoie le même corps partout ferait
    // passer le tableau de cartes à _applyMetadata, qui écraserait
    // seasons[] — et le garde n'aurait plus rien à lire.
    const carte = { id: '001', season: 2026, name: 'X', team: '', category: 'pilote',
      nationality: '', champion: false, championYears: [], description: '', tags: [],
      types: ['blue'], retired: false, power: 'Skip' };
    globalThis.fetch = async (url) => {
      const u = String(url);
      if(u.includes('metadata.json')) return { ok: true, status: 200, json: async () => ({ ...META, seasons: SAISONS }) };
      if(u.includes('cards-')) return { ok: true, status: 200, json: async () => [carte] };
      return { ok: false, status: 404, json: async () => { throw new Error('404'); } };
    };
  });
  afterEach(() => { globalThis.fetch = origFetch; });

  test('hors dev, le catalogue d’une saison de test ne se charge PAS', async () => {
    _applyMetadata({ ...META, seasons: SAISONS });
    setCurrentSeason(2026);
    _applyCards([]);
    await loadAppData();
    assert.equal(CARDS_DB.length, 0,
      'même sélectionnée de force (état persisté, URL bricolée), une saison de test reste vide en production');
  });

  test('en dev, il se charge', async () => {
    globalThis.window.__F1UNO_DEV = true;
    _applyMetadata({ ...META, seasons: SAISONS });
    setCurrentSeason(2026);
    _applyCards([]);
    await loadAppData();
    assert.ok(CARDS_DB.length > 0);
  });
});
