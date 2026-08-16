import './_setup.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resetStorage } from './_setup.js';
import { installFixtures, seedCollection, SAMPLE_COLL } from './_fixtures.js';
import { loadData, coll, saveData, setTypeData } from '../app/storage.js';
import {
  tutorialKeys, captureLocalStorage, applyLocalStorage,
  isTutorialSeen, markTutorialSeen,
} from '../app/tutorial-snapshot.js';
import { TUTORIAL_STEPS, TUTORIAL_CHAPTERS } from '../app/tutorial.js';

describe('tutorial — state snapshot / restore (data safety)', () => {
  beforeEach(() => { resetStorage(); installFixtures(); });

  test('tutorialKeys covers owned, badges, history, backup + prefs', () => {
    const keys = tutorialKeys(2025);
    ['f1uno_owned_2025', 'f1uno_badges_2025', 'f1uno_auto_badges_2025',
     'f1uno_history_2025', 'f1uno_changes_since_backup', 'f1uno_last_backup',
     'f1uno_theme', 'f1uno_lang', 'f1uno_font',
     // Scoppés par saison depuis 1.47.4 — le tutoriel peut épingler un
     // badge et changer le titre porté : les deux doivent revenir.
     'f1uno_title_2025', 'f1uno_pinned_badge_2025',
    ].forEach(k => assert.ok(keys.includes(k), k));
  });

  test('tutorialKeys suit la saison qu\'on lui passe', () => {
    const keys = tutorialKeys(2026);
    ['f1uno_owned_2026', 'f1uno_title_2026', 'f1uno_pinned_badge_2026']
      .forEach(k => assert.ok(keys.includes(k), k));
    assert.ok(!keys.some(k => k.endsWith('_2025')));
  });

  test('captureLocalStorage records values and null for absent keys', () => {
    localStorage.setItem('f1uno_theme', 'dark');
    const snap = captureLocalStorage(['f1uno_theme', 'f1uno_font']);
    assert.equal(snap['f1uno_theme'], 'dark');
    assert.equal(snap['f1uno_font'], null);
  });

  test('applyLocalStorage restores values AND removes keys that were absent', () => {
    localStorage.setItem('f1uno_theme', 'dark');
    const snap = captureLocalStorage(['f1uno_theme', 'f1uno_font']);
    // mutate: change one, create the other
    localStorage.setItem('f1uno_theme', 'light');
    localStorage.setItem('f1uno_font', 'prestige');
    applyLocalStorage(snap);
    assert.equal(localStorage.getItem('f1uno_theme'), 'dark');   // reverted
    assert.equal(localStorage.getItem('f1uno_font'), null);      // removed (was absent)
  });

  test('round-trip: real tutorial edits on a non-empty collection are fully undone', () => {
    // Start from a known non-empty collection
    seedCollection(SAMPLE_COLL); loadData();
    localStorage.setItem('f1uno_changes_since_backup', '4');
    const before = captureLocalStorage(tutorialKeys(2025));
    const ownedBefore = localStorage.getItem('f1uno_owned_2025');

    // Simulate what the tour does: mark a card owned, add a double, etc.
    setTypeData('P2', 'blue', 'owned', true);
    setTypeData('P2', 'blue', 'qty', 3);        // owned + double
    setTypeData('G1', 'blue', 'wishlist', true);
    saveData();                                  // also bumps changes counter + history
    // sanity: state actually changed
    assert.notEqual(localStorage.getItem('f1uno_owned_2025'), ownedBefore);

    // Restore
    applyLocalStorage(before);
    loadData();

    // Exactly the original state is back
    assert.equal(localStorage.getItem('f1uno_owned_2025'), ownedBefore);
    assert.equal(localStorage.getItem('f1uno_changes_since_backup'), '4');
    // P2 was wishlist-only in SAMPLE_COLL — the tour's "owned + double" is undone
    assert.equal(coll.P2.blue.owned, false);
    assert.equal(coll.P2.blue.wishlist, true);
    assert.ok(!coll.G1);                          // the tutorial's G1 wishlist is gone
  });

  /* Le round-trip ci-dessus ne regarde que la collection. Celui-ci
     regarde les clés d'APPAREIL — celles qui ne portent pas d'année et
     que le test des familles de saison ne pouvait pas voir.

     `f1uno_review` est le cas qui compte : la visite guidée ajoute des
     cartes, débloque des badges, et pouvait donc faire apparaître
     l'invitation à laisser un avis. Deux gardes la protègent
     désormais — `_zoneOccupee()` refuse tant que `.tut-overlay` est à
     l'écran, et cette clé est restaurée si quelque chose passait quand
     même. Ce test tient le second. */
  test('round-trip : les clés d’APPAREIL touchées par le tour reviennent aussi', () => {
    localStorage.setItem('f1uno_review', JSON.stringify({ n: 0, t: 0, off: false }));
    localStorage.setItem('f1uno_theme', 'dark');
    localStorage.setItem('f1uno_font', 'sport');
    localStorage.removeItem('f1uno_lang');        // absente exprès : doit le rester
    const before = captureLocalStorage(tutorialKeys(2025));

    // Ce que le tour peut faire : consommer une invitation, changer les
    // préférences depuis le chapitre Réglages.
    localStorage.setItem('f1uno_review', JSON.stringify({ n: 1, t: 999, off: false }));
    localStorage.setItem('f1uno_theme', 'light');
    localStorage.setItem('f1uno_font', 'system');
    localStorage.setItem('f1uno_lang', 'es');

    applyLocalStorage(before);

    assert.deepEqual(JSON.parse(localStorage.getItem('f1uno_review')),
      { n: 0, t: 0, off: false }, 'une invitation brûlée pendant le tour est irrécupérable');
    assert.equal(localStorage.getItem('f1uno_theme'), 'dark');
    assert.equal(localStorage.getItem('f1uno_font'), 'sport');
    assert.equal(localStorage.getItem('f1uno_lang'), null,
      'une clé ABSENTE avant le tour doit être retirée, pas laissée à la valeur du tour');
  });
});

describe('tutorial — parcours en 5 chapitres (1.47.0)', () => {
  const VALID_ACTIONS = new Set(['click', 'dataAction', 'view', 'input', 'condition']);
  const ids = TUTORIAL_STEPS.map(s => s.id);
  const idx = id => ids.indexOf(id);
  const chapterOf = id => TUTORIAL_STEPS[idx(id)].chapter;

  test('étapes bien formées : ids uniques, chapitre connu, observe ou action valide', () => {
    assert.equal(new Set(ids).size, ids.length, 'ids uniques');
    const known = new Set(TUTORIAL_CHAPTERS.map(c => c.id));
    for (const s of TUTORIAL_STEPS) {
      assert.ok(typeof s.id === 'string' && s.id.length > 0);
      assert.ok(known.has(s.chapter), `${s.id} : chapitre inconnu « ${s.chapter} »`);
      assert.ok(s.observe === true || !!s.action, `${s.id} doit être observe ou porter une action`);
      if (s.action) assert.ok(VALID_ACTIONS.has(s.action.type), `${s.id} : type d'action invalide`);
    }
  });

  test('les 5 chapitres suivent l’ordre de la nav', () => {
    assert.deepEqual(TUTORIAL_CHAPTERS.map(c => c.id),
      ['collection', 'badges', 'stats', 'account', 'settings']);
    // Compte AVANT Réglages : la nav fait foi (avant 1.47.0 c'était l'inverse).
    assert.ok(idx('go_account') < idx('go_settings'));
  });

  test('les étapes d’un chapitre sont CONTIGUËS — on n’en sort pas puis on y revient', () => {
    const seen = [];
    for (const s of TUTORIAL_STEPS) {
      if (seen[seen.length - 1] !== s.chapter) {
        assert.ok(!seen.includes(s.chapter), `le chapitre ${s.chapter} est repris après en être sorti`);
        seen.push(s.chapter);
      }
    }
    assert.deepEqual(seen, TUTORIAL_CHAPTERS.map(c => c.id));
  });

  test('chaque chapitre s’ouvre par sa navigation, sauf Collection (on y est déjà)', () => {
    for (const c of TUTORIAL_CHAPTERS) {
      const first = TUTORIAL_STEPS.find(s => s.chapter === c.id);
      if (c.id === 'collection') { assert.equal(first.id, 'coll_intro'); continue; }
      assert.equal(first.action && first.action.type, 'view', `${c.id} ne s'ouvre pas par une navigation`);
      assert.equal(first.action.view, c.view);
    }
  });

  test('chaque chapitre présente sa page avant de la détailler', () => {
    for (const c of TUTORIAL_CHAPTERS) {
      const inCh = TUTORIAL_STEPS.filter(s => s.chapter === c.id);
      const introAt = inCh.findIndex(s => /_intro$/.test(s.id));
      assert.ok(introAt !== -1, `${c.id} n'a pas d'introduction`);
      assert.ok(introAt <= 1, `${c.id} : l'introduction arrive trop tard`);
      assert.ok(inCh[introAt].observe, 'une introduction est passive');
    }
  });

  test('couverture : tout ce que l’app sait faire est montré', () => {
    const S = new Set(ids);
    ['coll_intro', 'open_card', 'mark_owned', 'mark_double', 'set_complete',
     'close_modal', 'quick_status', 'quick_add',
     'go_badges', 'badges_intro', 'badge_next', 'badge_families',
     'go_stats', 'stats_intro', 'stats_progress', 'stats_rail', 'stats_goals', 'set_tools',
     'go_account', 'account_intro', 'acc_cloud', 'set_backup', 'set_data',
     'go_settings', 'settings_intro', 'set_theme', 'set_security', 'replay',
    ].forEach(id => assert.ok(S.has(id), `étape manquante : ${id}`));
    assert.equal(TUTORIAL_STEPS.length, 28);
  });

  test('les étapes de fonctionnalités supprimées ne sont pas revenues', () => {
    const S = new Set(ids);
    // tri, pochette, recherche/filtres : retirés de l'app en 1.44.0 et avant.
    ['sidebar_open', 'filter_apply', 'filter_reset', 'sidebar_close', 'search',
     'sort_by', 'open_pack', 'pack_mode',
     // fusionnées ou coupées en 1.47.0
     'welcome', 'favorite', 'wishlist', 'stats_highlights', 'stats_donut', 'set_font',
    ].forEach(id => assert.ok(!S.has(id), `étape obsolète encore présente : ${id}`));
  });

  test('ordre pédagogique : ajouter une carte s’apprend avant tout le reste', () => {
    assert.equal(ids[0], 'coll_intro');
    assert.equal(ids[1], 'open_card', 'le premier geste enseigné est d’ouvrir une carte');
    assert.equal(ids[2], 'mark_owned', 'puis de marquer une variante possédée');
    assert.ok(idx('mark_double') < idx('quick_status'), 'quantités avant statuts rapides');
    assert.ok(idx('quick_add') < idx('go_badges'), 'les bases de la collection avant les autres pages');
    assert.equal(ids[ids.length - 1], 'replay');
  });

  test('fermer valide sur le CHANGEMENT D’ÉTAT, pas sur un bouton précis', () => {
    const step = TUTORIAL_STEPS.find(s => s.id === 'close_modal');
    assert.equal(step.action.type, 'condition');
    assert.equal(typeof step.action.check, 'function');
  });

  test('les étapes des pages Badges, Stats, Compte et Réglages n’écrivent RIEN', () => {
    // Elles montrent ; elles ne déclenchent aucune modification de la
    // collection. Seul le chapitre Collection fait agir l'utilisateur.
    for (const s of TUTORIAL_STEPS) {
      if (s.chapter === 'collection') continue;
      const isNav = s.action && s.action.type === 'view';
      assert.ok(s.observe === true || isNav,
        `${s.id} : une étape hors Collection doit être passive ou une navigation`);
    }
  });
});

describe('tutorial — textes ×7 (1.47.0)', () => {
  const LANGS = ['en', 'fr', 'es', 'zh', 'it', 'nl', 'de'];
  const src = readFileSync(new URL('../app/translations.js', import.meta.url), 'utf8');
  const head = src.slice(0, src.indexOf('window.__BADGE_T'));
  const marks = LANGS.map(l => [head.indexOf(l + ':{'), l]).sort((a, b) => a[0] - b[0]);
  const block = {};
  marks.forEach(([start, lang], i) => {
    block[lang] = head.slice(start, i + 1 < marks.length ? marks[i + 1][0] : head.length);
  });
  const val = (lang, key) => {
    const m = block[lang].match(new RegExp("'" + key.replace('.', '\\.') + "':'((?:[^'\\\\]|\\\\.)*)'"));
    return m ? m[1] : null;
  };

  test('chaque étape a son titre et son texte dans les 7 langues', () => {
    for (const s of TUTORIAL_STEPS) {
      for (const lang of LANGS) {
        assert.ok(val(lang, 'tut.' + s.id + '_t'), `${lang} : tut.${s.id}_t manquant`);
        assert.ok(val(lang, 'tut.' + s.id + '_d'), `${lang} : tut.${s.id}_d manquant`);
      }
    }
  });

  test('chaque chapitre a son nom dans les 7 langues', () => {
    for (const c of TUTORIAL_CHAPTERS) {
      for (const lang of LANGS) {
        assert.ok(val(lang, 'tut.ch_' + c.id), `${lang} : tut.ch_${c.id} manquant`);
      }
    }
  });

  test('les commandes de l’infobulle existent partout', () => {
    for (const k of ['quit', 'prev', 'next', 'done', 'skip_chapter', 'skip_chapter_short',
                     'skip_step', 'do_it', 'missing', 'away_down', 'away_up']) {
      for (const lang of LANGS) {
        assert.ok(val(lang, 'tut.' + k), `${lang} : tut.${k} manquant`);
      }
    }
  });

  test('les textes tiennent dans la bulle — 2 lignes à 375 px', () => {
    // Mesuré : au-delà de ~130 caractères la bulle passe à 3 lignes et
    // dépasse 40 % de la hauteur d'un écran de 320×568.
    const LIMIT = 130;
    const tooLong = [];
    for (const s of TUTORIAL_STEPS) {
      for (const lang of LANGS) {
        const v = val(lang, 'tut.' + s.id + '_d') || '';
        if (v.length > LIMIT) tooLong.push(`${lang}/${s.id} (${v.length})`);
      }
    }
    assert.deepEqual(tooLong, [], `textes trop longs : ${tooLong.join(', ')}`);
  });
});

describe('tutorial — seen flag', () => {
  beforeEach(() => resetStorage());
  test('mark/read the seen flag', () => {
    assert.equal(isTutorialSeen(), false);
    markTutorialSeen();
    assert.equal(isTutorialSeen(), true);
  });
});
