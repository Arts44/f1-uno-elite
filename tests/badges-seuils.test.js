/* ══════════════════════════════════════════════════════════
   SEUILS DE BADGES — le total vient d'une valeur DÉCLARÉE
   (étape 1/5 du plan docs/PLAN-SEUILS-RELATIFS.md)

   Le mécanisme : une condition peut demander `of: 'season'` au lieu
   d'un `value` numérique. Le dénominateur est alors
   `seasonCardCount()` — metadata.seasons[].cardCount — et JAMAIS
   CARDS_DB.length, qui vaut ce que le fichier contient et non ce que
   la saison compte.

   Ces tests sont écrits AVANT l'implémentation : c'est l'étape qui
   porte le risque du chantier, puisqu'elle décide de déblocages
   définitifs.

   LA RÈGLE DU §0 EST TESTÉE ICI AUSSI : un badge déjà débloqué reste
   débloqué même quand sa condition cesse d'être satisfaite. Elle est
   structurelle (isAutoBadgeUnlocked lit le store, pas le calcul) — ce
   test existe pour qu'on ne la « corrige » pas par inadvertance.
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import '../translations.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resetStorage } from './_setup.js';
import { _applyMetadata, _applyCards, _applyBadges, CARDS_DB, seasonCardCount } from '../data.js';
import { setTypeData, txBatch } from '../storage.js';
import { evaluateBadgeCondition, isAutoBadgeUnlocked, setAutoBadgeUnlocked } from '../badges.js';
import { badgeEffort, _resetDifficultyCache } from '../difficulty.js';

/* resetStorage() ne vide QUE le localStorage : la collection chargée
   reste en mémoire dans storage.js, et les badges débloqués dans
   badges.js. Un test qui l'ignore mesure l'état laissé par le test
   précédent — c'est ce qui a fait échouer deux de ces tests à leur
   première écriture. On remet donc explicitement l'état de module. */
const resetTout = () => { resetStorage(); setAutoBadgeUnlocked({}); _resetDifficultyCache(); };

const meta = JSON.parse(readFileSync(new URL('../data/metadata.json', import.meta.url), 'utf8'));
const cardsFile = JSON.parse(readFileSync(new URL('../data/cards-2025.json', import.meta.url), 'utf8'));
const allCards = Array.isArray(cardsFile) ? cardsFile : cardsFile.cards;
const badgesJson = JSON.parse(readFileSync(new URL('../data/badges.json', import.meta.url), 'utf8'));

const own = card => txBatch(() => card.types.forEach(ty => {
  setTypeData(card.id, ty, 'owned', true); setTypeData(card.id, ty, 'qty', 1);
}));
const unown = card => txBatch(() => card.types.forEach(ty => {
  setTypeData(card.id, ty, 'owned', false); setTypeData(card.id, ty, 'qty', 0);
}));
const ownAll = cards => cards.forEach(own);

/* Un catalogue PARTIEL : la saison déclare 101, le fichier n'en donne
   que 40. C'est le scénario réel de la saisie au fil de l'eau. */
function loadPartial(n = 40){
  _applyMetadata(meta);
  _applyCards(allCards.slice(0, n));
  _applyBadges(badgesJson);
}
function loadComplete(){
  _applyMetadata(meta);
  _applyCards(allCards);
  _applyBadges(badgesJson);
}

const BADGE_SEASON = { id: '_test_all', condition: { metric: 'owned_count', of: 'season' } };

describe('of: \'season\' — le dénominateur est déclaré, pas déduit', () => {
  beforeEach(() => { resetTout(); });

  test('catalogue COMPLET : max = total déclaré, et il vaut CARDS_DB.length ici', () => {
    loadComplete();
    const p = evaluateBadgeCondition(BADGE_SEASON);
    assert.equal(p.max, seasonCardCount(), 'max doit venir du total déclaré');
    assert.equal(p.max, CARDS_DB.length, '2025 complet : les deux coïncident');
    assert.ok(!p.partiel, 'catalogue complet ⇒ pas de marque partiel');
  });

  test('catalogue PARTIEL : max reste le total DÉCLARÉ, pas le nombre chargé', () => {
    loadPartial(40);
    const p = evaluateBadgeCondition(BADGE_SEASON);
    assert.equal(CARDS_DB.length, 40, 'le fixture doit bien être partiel');
    assert.equal(p.max, 101, 'max doit rester 101 — le total de la saison, pas 40');
  });

  test('LE CŒUR : tout posséder d’un fichier partiel ne débloque PAS', () => {
    loadPartial(40);
    ownAll(CARDS_DB);
    const p = evaluateBadgeCondition(BADGE_SEASON);
    assert.equal(p.cur, 40);
    assert.equal(p.max, 101);
    assert.ok(p.partiel, 'un catalogue incomplet doit marquer le résultat partiel');
    assert.equal(isAutoBadgeUnlocked(BADGE_SEASON), false,
      'débloquer ici serait DÉFINITIF sur une condition non satisfaite');
  });

  test('catalogue complet et tout possédé : là, ça débloque', () => {
    loadComplete();
    ownAll(CARDS_DB);
    const p = evaluateBadgeCondition(BADGE_SEASON);
    assert.equal(p.cur, p.max);
    assert.ok(!p.partiel);
    assert.equal(isAutoBadgeUnlocked(BADGE_SEASON), true);
  });

  test('total NON déclaré : partiel, donc pas de déblocage — le silence n’est jamais un badge', () => {
    _applyMetadata({ ...meta, seasons: [] });   // aucune saison déclarée
    _applyCards(allCards);
    _applyBadges(badgesJson);
    ownAll(CARDS_DB);
    assert.equal(seasonCardCount(), null, 'aucun total déclaré');
    const p = evaluateBadgeCondition(BADGE_SEASON);
    assert.ok(p.partiel, 'inconnu doit se comporter comme partiel, pas comme complet');
    assert.equal(isAutoBadgeUnlocked(BADGE_SEASON), false);
  });

  test('`of` ne perturbe pas les paliers arbitraires (value numérique)', () => {
    loadComplete();
    ownAll(CARDS_DB.slice(0, 12));
    const p = evaluateBadgeCondition({ id: '_p', condition: { metric: 'owned_count', value: 10 } });
    assert.deepEqual({ cur: p.cur, max: p.max }, { cur: 10, max: 10 });
    assert.ok(!p.partiel, 'un palier arbitraire n’a rien à voir avec la taille du catalogue');
  });
});

/* ── §0 du plan — la promesse ─────────────────────────────────
   « Un badge débloqué reste débloqué. Sans exception. Y compris s'il a
   été obtenu à tort. » Ce test échoue si quelqu'un fait recalculer
   isAutoBadgeUnlocked au lieu de lire le store. */
describe('§0 — un badge débloqué ne se reverrouille jamais', () => {
  beforeEach(() => { resetTout(); loadComplete(); });

  test('condition satisfaite puis PLUS satisfaite ⇒ toujours débloqué', () => {
    ownAll(CARDS_DB);
    assert.equal(isAutoBadgeUnlocked(BADGE_SEASON), true, 'préalable : il faut l’avoir débloqué');
    unown(CARDS_DB[0]);                // une carte de moins : la condition tombe
    const p = evaluateBadgeCondition(BADGE_SEASON);
    assert.ok(p.cur < p.max, `préalable : la condition ne doit plus être satisfaite (${p.cur}/${p.max})`);
    assert.equal(isAutoBadgeUnlocked(BADGE_SEASON), true,
      'RÈGLE DU §0 : le déblocage est acquis, le recalcul ne le reprend pas');
  });

  test('un faux positif hérité d’un catalogue partiel est CONSERVÉ', () => {
    // Exactement le cas que la correction empêche à l'avenir : le badge
    // décerné avant elle reste acquis. Ce n'est pas une dette.
    loadPartial(40);
    setAutoBadgeUnlocked({ [BADGE_SEASON.id]: 1 });   // hérité d'avant la correction
    ownAll(CARDS_DB);
    assert.equal(isAutoBadgeUnlocked(BADGE_SEASON), true,
      'retirer un badge obtenu à tort serait un retour en arrière, pas un nettoyage');
  });
});

/* ── Étape 2 : legend_101 sur le total déclaré ─────────────── */
describe('legend_101 — « toutes les cartes », plus « 101 »', () => {
  beforeEach(() => { resetTout(); });

  const legend = () => badgesJson.auto.find(b => b.id === 'legend_101');

  test('la condition ne code plus la taille du catalogue', () => {
    const c = legend().condition;
    assert.equal(c.of, 'season');
    assert.equal(c.value, undefined, '101 ne doit plus être écrit en dur');
  });

  test('data-embedded.js est en parité (repli hors ligne)', () => {
    const emb = readFileSync(new URL('../data-embedded.js', import.meta.url), 'utf8');
    assert.match(emb, /"id":"legend_101"[^}]*"condition":\{"metric":"owned_count","operator":">=","of":"season"\}/);
    assert.ok(!/"metric":"owned_count","operator":">=","value":101/.test(emb),
      'le repli hors ligne garderait l’ancien seuil');
  });

  test('catalogue complet : 101 sur 101, comme avant', () => {
    loadComplete();
    const p = evaluateBadgeCondition(legend());
    assert.equal(p.max, 101);
    ownAll(CARDS_DB);
    assert.equal(evaluateBadgeCondition(legend()).cur, 101);
    assert.equal(isAutoBadgeUnlocked(legend()), true);
  });

  test('catalogue partiel : possédé en entier, TOUJOURS pas débloqué', () => {
    loadPartial(40);
    ownAll(CARDS_DB);
    assert.equal(isAutoBadgeUnlocked(legend()), false,
      'c’est LE faux positif que le chantier supprime');
  });

  test('le modèle de difficulté suit — pas de NaN dans l’échelle', () => {
    loadComplete();
    const e = badgeEffort(legend());
    assert.ok(Number.isFinite(e) && e > 0, `effort non fini : ${e}`);
  });
});

/* ── Étape 3 : les deux badges « toutes les écuries » ───────── */
describe('of: \'teams\' — le nombre d’écuries n’est plus écrit en dur', () => {
  beforeEach(() => { resetTout(); });
  const bid = id => badgesJson.auto.find(b => b.id === id);

  test('teams_owned_10 et teamset_all ne codent plus « 10 »', () => {
    for (const id of ['teams_owned_10', 'teamset_all']){
      assert.equal(bid(id).condition.of, 'teams', id);
      assert.equal(bid(id).condition.value, undefined, `${id} : 10 écrit en dur`);
    }
  });

  test('les paliers arbitraires 2 et 5 écuries ne bougent PAS', () => {
    assert.equal(bid('teams_owned_2').condition.value, 2);
    assert.equal(bid('teams_owned_5').condition.value, 5);
    assert.equal(bid('teams_owned_2').condition.of, undefined,
      '« 2 écuries » est un palier, pas une propriété du catalogue');
  });

  test('catalogue complet : max = nombre réel d’écuries (10 en 2025)', () => {
    loadComplete();
    assert.equal(evaluateBadgeCondition(bid('teams_owned_10')).max, 10);
  });

  test('catalogue partiel : indébloquable, même en possédant tout le fichier', () => {
    loadPartial(40);
    ownAll(CARDS_DB);
    const p = evaluateBadgeCondition(bid('teams_owned_10'));
    assert.ok(p.partiel, '« toutes les écuries » n’a pas de sens sur un catalogue incomplet');
    assert.equal(isAutoBadgeUnlocked(bid('teams_owned_10')), false);
  });

  test('parité data-embedded pour les deux', () => {
    const emb = readFileSync(new URL('../data-embedded.js', import.meta.url), 'utf8');
    assert.match(emb, /"metric":"teams_owned_count","operator":">=","of":"teams"/);
    assert.match(emb, /"metric":"teams_set_count","operator":">=","of":"teams"/);
  });

  test('la difficulté reste finie (le Grand Chelem garde son sommet)', () => {
    loadComplete();
    const e = badgeEffort(bid('teamset_all'));
    assert.ok(Number.isFinite(e) && e > 0, `effort non fini : ${e}`);
  });
});
