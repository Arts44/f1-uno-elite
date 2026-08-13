/* ══════════════════════════════════════════════════════════
   BADGES v3 — nouvelles métriques, semis silencieux, difficulté.
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import '../translations.js';   // charge window.__BADGE_T sur le stub
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resetStorage } from './_setup.js';
import { _applyMetadata, _applyCards, CARDS_DB, AUTO_BADGES, MANUAL_BADGES, _applyBadges } from '../data.js';
import { setTypeData, txBatch } from '../storage.js';
import {
  evaluateBadgeCondition, seedNewAutoBadges, autoBadgeUnlocked, setAutoBadgeUnlocked,
} from '../badges.js';
import { badgeDifficulty, difficultyLabelKey, _resetDifficultyCache } from '../difficulty.js';

const meta = JSON.parse(readFileSync(new URL('../data/metadata.json', import.meta.url), 'utf8'));
const cardsFile = JSON.parse(readFileSync(new URL('../data/cards-2025.json', import.meta.url), 'utf8'));
const cards = Array.isArray(cardsFile) ? cardsFile : cardsFile.cards;
const badgesJson = JSON.parse(readFileSync(new URL('../data/badges.json', import.meta.url), 'utf8'));

function loadRealData(){
  _applyMetadata(meta);
  _applyCards(cards);
  _applyBadges(badgesJson);
}
const bid = id => AUTO_BADGES.find(b => b.id === id);
const ownFullSet = card => txBatch(() => card.types.forEach(ty => { setTypeData(card.id, ty, 'owned', true); setTypeData(card.id, ty, 'qty', 1); }));

describe('badges v3 — données', () => {
  beforeEach(() => { resetStorage(); loadRealData(); _resetDifficultyCache(); });

  test('120 badges (68 auto + 52 manuels), ids uniques', () => {
    assert.equal(badgesJson.auto.length, 68);
    assert.equal(badgesJson.manual.length, 52);
    const ids = [...badgesJson.auto, ...badgesJson.manual].map(b => b.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  test('chaque nouveau badge a ses 7 traductions', () => {
    const NEW = [...badgesJson.auto, ...badgesJson.manual].map(b => b.id)
      .filter(id => id.startsWith('m_') || /^(set_|eternal_|teams_|teamset_|catset_|doubles_25|doubles_75|qty_|rythme_|foil_15|foil_30|dual_5|wild_10|nitro_5|promo_5|divine_|cosmic_)/.test(id));
    const T = globalThis.window.__BADGE_T || {};
    NEW.forEach(id => {
      const e = T[id];
      assert.ok(e, `${id} sans __BADGE_T`);
      for(const lg of ['en','fr','es','zh','it','nl','de']){
        assert.ok(e[lg]?.name && e[lg]?.desc, `${id}.${lg} incomplet`);
      }
    });
  });
});

describe('badges v3 — métriques', () => {
  beforeEach(() => { resetStorage(); loadRealData(); _resetDifficultyCache(); });

  test('sets_complete_count compte les sets intégraux', () => {
    const b = bid('set_1');
    assert.equal(evaluateBadgeCondition(b).cur, 0);
    ownFullSet(CARDS_DB[0]);
    assert.equal(evaluateBadgeCondition(b).cur, 1);
  });

  test('eternal_count : un champion en set intégral atteint Éternel', () => {
    const champ = CARDS_DB.find(c => c.champion);
    ownFullSet(champ);
    assert.equal(evaluateBadgeCondition(bid('eternal_1')).cur, 1);
  });

  test('team_set : progression = cartes de l’écurie en set intégral', () => {
    const b = bid('teamset_ferrari');
    const team = b.condition.value;
    const pool = CARDS_DB.filter(c => c.team === team);
    assert.ok(pool.length > 0);
    assert.equal(evaluateBadgeCondition(b).max, pool.length);
    ownFullSet(pool[0]);
    assert.equal(evaluateBadgeCondition(b).cur, 1);
  });

  test('teams_owned_count : une écurie entièrement possédée compte 1', () => {
    const team = CARDS_DB.find(c => c.team).team;
    txBatch(() => CARDS_DB.filter(c => c.team === team).forEach(c => { setTypeData(c.id, c.types[0], 'owned', true); setTypeData(c.id, c.types[0], 'qty', 1); }));
    assert.equal(evaluateBadgeCondition(bid('teams_owned_2')).cur, 1);
  });

  test('grand chelem : toutes les écuries en set intégral', () => {
    txBatch(() => CARDS_DB.filter(c => c.team).forEach(ownFullSet));
    const p = evaluateBadgeCondition(bid('teamset_all'));
    assert.equal(p.cur, 10);
    assert.equal(p.max, 10);
  });
});

describe('badges v3 — semis silencieux (rétrocompat)', () => {
  beforeEach(() => { resetStorage(); loadRealData(); _resetDifficultyCache(); setAutoBadgeUnlocked({}); });

  test('un badge déjà satisfait est semé en true (sans date), pas en timestamp', () => {
    txBatch(() => { setTypeData(CARDS_DB[0].id, CARDS_DB[0].types[0], 'owned', true); setTypeData(CARDS_DB[0].id, CARDS_DB[0].types[0], 'qty', 1); });
    const seeded = seedNewAutoBadges();
    assert.ok(seeded >= 1);
    assert.equal(autoBadgeUnlocked['first_card'], true);     // legacy true, PAS Date.now()
  });

  test('un badge déjà débloqué (timestamp) n’est jamais retouché', () => {
    // Le décor doit passer par le STOCKAGE, pas seulement par la mémoire :
    // seedNewAutoBadges() appelle loadManualBadges(), qui relit la clé de
    // la saison — et qui, depuis la correction de la fuite inter-saisons,
    // REMET À ZÉRO quand la clé est absente. Un état injecté uniquement en
    // mémoire n'existe pas dans l'application.
    localStorage.setItem('f1uno_auto_badges_2025', JSON.stringify({ first_card: 1754550000000 }));
    setAutoBadgeUnlocked({ first_card: 1754550000000 });
    txBatch(() => { setTypeData(CARDS_DB[0].id, CARDS_DB[0].types[0], 'owned', true); setTypeData(CARDS_DB[0].id, CARDS_DB[0].types[0], 'qty', 1); });
    seedNewAutoBadges();
    assert.equal(autoBadgeUnlocked['first_card'], 1754550000000);
  });
});

describe('badges v3 — difficulté intrinsèque', () => {
  beforeEach(() => { resetStorage(); loadRealData(); _resetDifficultyCache(); });

  test('le Grand Chelem est le sommet absolu (100)', () => {
    assert.equal(badgeDifficulty(bid('teamset_all')), 100);
    [...AUTO_BADGES, ...MANUAL_BADGES].forEach(b => {
      assert.ok(badgeDifficulty(b) <= 100, b.id);
    });
  });

  test('l’ordre est sain : première carte < 20 bleues < écurie intégrale < grille parfaite', () => {
    const s = id => badgeDifficulty(bid(id));
    assert.ok(s('first_card') < s('blue_20'));
    assert.ok(s('blue_20') < s('teamset_ferrari'));
    assert.ok(s('teamset_ferrari') < s('catset_pilote'));
    assert.ok(s('catset_pilote') < s('teamset_all'));
  });

  test('tous les badges ont un score 1-100 et un libellé', () => {
    [...AUTO_BADGES, ...MANUAL_BADGES].forEach(b => {
      const d = badgeDifficulty(b);
      assert.ok(d >= 1 && d <= 100, `${b.id}: ${d}`);
      assert.match(difficultyLabelKey(d), /^b\.diff_/);
    });
  });

  test('les manuels sont notés à la main : usine > karting > GP à la télé', () => {
    const m = id => badgeDifficulty(MANUAL_BADGES.find(b => b.id === id));
    assert.ok(m('m_usine') > m('karting'));
    assert.ok(m('karting') > m('fan_tv'));
  });
});
