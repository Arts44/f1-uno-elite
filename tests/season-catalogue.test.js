/* ══════════════════════════════════════════════════════════
   CATALOGUE DE SAISON — total DÉCLARÉ, jamais déduit.

   `metadata.json → seasons[] = [{year, cardCount}]` répond à UNE
   question : « ce catalogue est-il complet ? ». De cette seule
   réponse dépendent la liste des saisons sélectionnables et le
   refus de débloquer 23 badges sur un fichier partiel.

   Le scénario réel : les cartes arrivent par boosters, donc le
   fichier reste incomplet pendant des semaines. Sans référence
   déclarée, posséder les 12 pilotes PRÉSENTS sur 40 cartes
   débloquerait « tous les pilotes » — définitivement, puisqu'un
   badge automatique ne se reverrouille jamais.
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resetStorage } from './_setup.js';
import { installFixtures, seedCollection } from './_fixtures.js';
import { loadData } from '../app/storage.js';
import {
  CARDS_DB, setCurrentSeason, _applyMetadata, _applyCards,
  seasonCardCount, seasonCatalogueState, availableSeasons,
} from '../app/data.js';
import { evaluateBadgeCondition, isAutoBadgeUnlocked, setAutoBadgeUnlocked } from '../app/badges.js';

const meta = JSON.parse(readFileSync(new URL('../app/data/metadata.json', import.meta.url), 'utf8'));

describe('seasons[] — la déclaration elle-même', () => {
  test('metadata.json déclare chaque saison avec son total', () => {
    assert.ok(Array.isArray(meta.seasons), 'seasons[] absent de metadata.json');
    for (const s of meta.seasons) {
      assert.ok(Number.isInteger(s.year), 'year entier');
      assert.ok(Number.isInteger(s.cardCount) && s.cardCount > 0, `cardCount de ${s.year}`);
    }
  });

  test('le total déclaré correspond au fichier de cartes livré', () => {
    for (const s of meta.seasons) {
      const cards = JSON.parse(
        readFileSync(new URL(`../app/data/cards-${s.year}.json`, import.meta.url), 'utf8'));
      assert.equal(cards.length, s.cardCount,
        `cards-${s.year}.json contient ${cards.length} cartes, seasons[] en déclare ${s.cardCount}`);
    }
  });
});

describe('seasonCatalogueState — les trois intensités', () => {
  beforeEach(() => { resetStorage(); installFixtures(); setCurrentSeason(2025); });

  test('complet quand le catalogue chargé couvre le total déclaré', () => {
    _applyMetadata({ ...meta, seasons: [{ year: 2025, cardCount: CARDS_DB.length }] });
    assert.equal(seasonCatalogueState().etat, 'complet');
  });

  test('partiel quand il en manque', () => {
    _applyMetadata({ ...meta, seasons: [{ year: 2025, cardCount: CARDS_DB.length + 61 }] });
    const s = seasonCatalogueState();
    assert.equal(s.etat, 'partiel');
    assert.equal(s.total, CARDS_DB.length + 61);
    assert.equal(s.charge, CARDS_DB.length);
  });

  test('vide quand aucune carte n’est chargée', () => {
    _applyMetadata({ ...meta, seasons: [{ year: 2025, cardCount: 101 }] });
    _applyCards([]);
    assert.equal(seasonCatalogueState().etat, 'vide');
  });

  test('inconnu quand rien n’est déclaré — on ne PRÉSUME pas', () => {
    _applyMetadata({ ...meta, seasons: [] });
    assert.equal(seasonCardCount(2025), null);
    assert.equal(seasonCatalogueState().etat, 'inconnu');
  });
});

describe('le poule/œuf de la liste des saisons', () => {
  beforeEach(() => { resetStorage(); installFixtures(); setCurrentSeason(2025); });

  test('une saison déclarée est sélectionnable SANS aucune donnée locale', () => {
    _applyMetadata({ ...meta, seasons: [{ year: 2025, cardCount: 101 }, { year: 2026, cardCount: 10 }] });
    assert.ok(availableSeasons().includes(2026),
      'sans ça, une saison neuve n’apparaît jamais — et sans pastille, impossible de créer ses données');
  });

  test('une saison retirée du fichier reste sélectionnable si on y a une collection', () => {
    _applyMetadata({ ...meta, seasons: [{ year: 2026, cardCount: 10 }] });
    localStorage.setItem('f1uno_owned_2024', '{}');
    assert.ok(availableSeasons().includes(2024),
      'retirer une saison des données ne doit pas faire disparaître la collection saisie dedans');
  });
});

describe('fichier partiel — les 23 badges relatifs ne se débloquent PAS', () => {
  beforeEach(() => {
    resetStorage(); installFixtures(); setCurrentSeason(2025); setAutoBadgeUnlocked({});
  });

  const pilotes = () => CARDS_DB.filter(c => c.category === 'pilote');
  const badgePiloteAll = { id: 'pilote_all', condition: { metric: 'category_owned', value: 'pilote' } };

  test('catalogue COMPLET : posséder tous les pilotes débloque', () => {
    _applyMetadata({ ...meta, seasons: [{ year: 2025, cardCount: CARDS_DB.length }] });
    const coll = {};
    pilotes().forEach(c => { coll[c.id] = { [c.types[0]]: { owned: true, qty: 1 } }; });
    seedCollection(coll); loadData();
    const p = evaluateBadgeCondition(badgePiloteAll);
    assert.equal(p.cur, p.max, 'décor : la condition est bien satisfaite');
    assert.equal(p.partiel, undefined, 'catalogue complet : aucun marquage');
    assert.equal(isAutoBadgeUnlocked(badgePiloteAll), true);
  });

  test('catalogue PARTIEL : la même possession ne débloque pas', () => {
    _applyMetadata({ ...meta, seasons: [{ year: 2025, cardCount: CARDS_DB.length + 61 }] });
    const coll = {};
    pilotes().forEach(c => { coll[c.id] = { [c.types[0]]: { owned: true, qty: 1 } }; });
    seedCollection(coll); loadData();
    const p = evaluateBadgeCondition(badgePiloteAll);
    assert.equal(p.cur, p.max, 'la condition est satisfaite SUR LE CATALOGUE CHARGÉ');
    assert.equal(p.partiel, true, 'et elle est marquée comme telle');
    assert.equal(isAutoBadgeUnlocked(badgePiloteAll), false,
      'débloquer ici serait définitif — rien ne reverrouille un badge automatique');
  });

  test('la PROGRESSION reste affichée : on informe, on ne masque pas', () => {
    _applyMetadata({ ...meta, seasons: [{ year: 2025, cardCount: CARDS_DB.length + 61 }] });
    const p = evaluateBadgeCondition(badgePiloteAll);
    assert.ok(Number.isInteger(p.cur) && Number.isInteger(p.max),
      'cur/max restent lisibles — le badge montre où on en est');
  });

  test('un badge à seuil ABSOLU n’est pas affecté', () => {
    _applyMetadata({ ...meta, seasons: [{ year: 2025, cardCount: CARDS_DB.length + 61 }] });
    const p = evaluateBadgeCondition({ id: 'first_card', condition: { metric: 'owned_count', value: 1 } });
    assert.equal(p.partiel, undefined,
      '« posséder 1 carte » ne dépend pas de la composition du catalogue');
  });

  test('un badge déjà débloqué le RESTE si le catalogue devient partiel', () => {
    _applyMetadata({ ...meta, seasons: [{ year: 2025, cardCount: CARDS_DB.length }] });
    const coll = {};
    pilotes().forEach(c => { coll[c.id] = { [c.types[0]]: { owned: true, qty: 1 } }; });
    seedCollection(coll); loadData();
    assert.equal(isAutoBadgeUnlocked(badgePiloteAll), true);
    _applyMetadata({ ...meta, seasons: [{ year: 2025, cardCount: CARDS_DB.length + 61 }] });
    assert.equal(isAutoBadgeUnlocked(badgePiloteAll), true,
      'la correction ne doit RIEN reverrouiller — un badge gagné est gagné');
  });
});
