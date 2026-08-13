/* ══════════════════════════════════════════════════════════
   BADGES v2.2 — les nouveaux comportements de la page :
   familles, prochain badge / objectif épinglé, badge le plus
   difficile, dates de déblocage (avec héritage des `true`),
   libellé de toast groupé, i18n. La mécanique historique
   (evaluateBadgeCondition, persistance) est couverte par
   badges.test.js et n'a pas bougé.
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import '../translations.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetStorage } from './_setup.js';
import { installFixtures, seedCollection, SAMPLE_COLL } from './_fixtures.js';
import { loadData } from '../storage.js';
import {
  FAMILIES, pickNextBadge, hardestUnlockedBadge,
  badgeUnlockDate, groupBadgeToastLabel, setPinnedBadge, getPinnedBadge,
} from '../badges.js';
import { readFileSync } from 'node:fs';

const read = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const LANGS = ['en', 'fr', 'es', 'zh', 'it', 'nl', 'de'];

describe('familles — le regroupement couvre tout, une seule fois', () => {
  test('les 68 badges auto RÉELS sont répartis sans doublon ni oubli', () => {
    const real = JSON.parse(readFileSync(new URL('../data/badges.json', import.meta.url), 'utf8'));
    const famIds = FAMILIES.filter(f => !f.manual).flatMap(f => [...(f.ids || []), ...(f.extraIds || [])]); // v3 : extraIds (tuiles sous l'échelle)
    assert.equal(new Set(famIds).size, famIds.length, 'aucun badge dans deux familles');
    const autoIds = real.auto.map(b => b.id);
    autoIds.forEach(id => assert.ok(famIds.includes(id), `${id} sans famille`));
    assert.equal(famIds.length, autoIds.length);
  });

  test('un badge auto inconnu (future saison) tombe en famille passion, pas dans le vide', () => {
    // Déménagé dans badge-rules.js (v2, pas 5 du découpage) : seul le
    // nom de fichier change, le code est déplacé au caractère près.
    const src = read('badge-rules.js');
    assert.match(src, /passion[\s\S]{0,200}known\.has|known\.has[\s\S]{0,200}passion/);
  });
});

describe('pickNextBadge — objectif épinglé puis calcul', () => {
  const mk = (id, cur, max) => ({ id, _p: { cur, max } });
  const ev = b => b._p;
  const un = b => b._p.cur >= b._p.max;

  test('sans épingle : la meilleure fraction gagne', () => {
    const r = pickNextBadge(null, [mk('a', 1, 10), mk('b', 8, 10), mk('c', 5, 10)], ev, un);
    assert.equal(r.badge.id, 'b');
    assert.equal(r.pinned, false);
  });

  test('à fraction égale, le plus petit reste gagne', () => {
    const r = pickNextBadge(null, [mk('a', 5, 10), mk('b', 1, 2)], ev, un);
    assert.equal(r.badge.id, 'b'); // 50% partout, mais il ne manque qu'1
  });

  test('l’épingle prime tant que le badge est verrouillé', () => {
    const r = pickNextBadge('a', [mk('a', 1, 10), mk('b', 9, 10)], ev, un);
    assert.equal(r.badge.id, 'a');
    assert.equal(r.pinned, true);
  });

  test('une épingle débloquée ou inconnue rend la main au calcul', () => {
    const r = pickNextBadge('done', [mk('done', 10, 10), mk('b', 3, 10)], ev, un);
    assert.equal(r.badge.id, 'b');
    assert.equal(r.pinned, false);
  });

  test('tout débloqué → null', () => {
    assert.equal(pickNextBadge(null, [mk('a', 5, 5)], ev, un), null);
  });
});

describe('hardestUnlockedBadge — la plus grande cible débloquée', () => {
  const mk = (id, cur, max) => ({ id, _p: { cur, max } });
  const ev = b => b._p;
  const un = b => b._p.cur >= b._p.max;

  // v3 : le « plus difficile » se mesure au SCORE de difficulté (scoreFn
  // injectable) — plus à la taille de la cible.
  const score = b => b._p.max;
  test('le score le plus haut débloqué gagne', () => {
    const r = hardestUnlockedBadge([mk('blue', 20, 20), mk('legend', 101, 101), mk('locked', 3, 50)], ev, un, score);
    assert.equal(r.id, 'legend');
  });
  test('aucun débloqué → null', () => {
    assert.equal(hardestUnlockedBadge([mk('a', 0, 5)], ev, un, score), null);
  });
});

describe('dates de déblocage — timestamps ET héritage des true', () => {
  test('un timestamp donne une Date, un true hérité donne null (« Débloqué » simple)', () => {
    const store = { fresh: 1754550000000, legacy: true };
    assert.ok(badgeUnlockDate(store, 'fresh') instanceof Date);
    assert.equal(badgeUnlockDate(store, 'legacy'), null);
    assert.equal(badgeUnlockDate(store, 'absent'), null);
  });
});

describe('objectif épinglé — persistance par saison', () => {
  beforeEach(() => { resetStorage(); installFixtures(); seedCollection(SAMPLE_COLL); loadData(); });
  test('set / get / clear', () => {
    assert.equal(getPinnedBadge(), null);
    setPinnedBadge('expert_50');
    assert.equal(getPinnedBadge(), 'expert_50');
    setPinnedBadge(null);
    assert.equal(getPinnedBadge(), null);
  });
});

describe('toast groupé', () => {
  const tf = (k, v) => k === 'b.toast_many' ? `${v.n} badges débloqués` : k;
  test('un seul badge : son nom, sans compteur', () => {
    assert.equal(groupBadgeToastLabel(['Expert'], tf), 'Expert');
  });
  test('plusieurs : compteur + 3 premiers noms + ellipse', () => {
    assert.equal(groupBadgeToastLabel(['A', 'B', 'C', 'D'], tf), '4 badges débloqués — A, B, C…');
  });
});

describe('détection en cours d’usage & contrats de source', () => {
  test('updateStats appelle checkNewAutoBadges (le toast peut tomber partout)', () => {
    assert.match(read('stats.js'), /checkNewAutoBadges\(\)/);
  });
  test('l’haptique se dégrade en silence (vibrate gardé par un if)', () => {
    // Déménagé dans badge-toasts.js (v2, pas 6) : nom de fichier seul.
    assert.match(read('badge-toasts.js'), /if\(navigator\.vibrate\)/);
  });
  test('le toast badge attend le toast standard (Annuler prioritaire)', () => {
    const src = read('badge-toasts.js');   // v2, pas 6 : nom de fichier seul
    assert.match(src, /getElementById\('toast'\)[\s\S]{0,120}classList\.contains\('show'\)/);
  });
  test('épingler/retirer l’objectif est bloqué en mode spectateur', () => {
    assert.match(read('app.js'), /VIEWER_BLOCKED[\s\S]{0,400}'pinBadge','unpinBadge'/);
  });
  test('l’animation du hero est neutralisée en reduced-motion', () => {
    assert.match(read('badges.js'), /animateHero[\s\S]{0,400}prefers-reduced-motion/);
  });
});

describe('i18n v2.2 — toutes les nouvelles clés ×7', () => {
  const KEYS = ['b.fam_parcours','b.fam_sets','b.fam_foils','b.fam_colors','b.fam_passion','b.fam_exp',
    'b.next_badge','b.objective','b.pin_objective','b.unpin_objective','b.pinned_toast','b.remaining',
    'b.unlocked_on','b.unlocked_simple','b.hardest','b.share','b.share_saved','b.toast_one','b.toast_many',
    'b.empty_title','b.empty_sub','b.all_done','b.remove_badge','b.removed',
    'tut.badge_next_t','tut.badge_next_d','tut.badge_families_t','tut.badge_families_d'];
  for (const key of KEYS){
    test(key, () => {
      for (const l of LANGS) assert.ok(window.__T[l] && window.__T[l][key], `${key} manque en ${l}`);
    });
  }
});
