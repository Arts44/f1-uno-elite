/* ══════════════════════════════════════════════════════════
   LA CÉLÉBRATION DE PALIER (1.67.0) — les trois cas où elle NE
   PART PAS (la revue les a exigés testés), puis ses contrats.

   1. TUTORIEL — garde explicite sur .tut-overlay : un plein
      écran par-dessus la visite guidée serait le défaut du n°17.
   2. IMPORT / pull cloud — structurellement impossible : les
      seuls appelants sont les DEUX gestes de render.js. Ce test
      COMPTE les appelants ; un troisième (dans un chemin
      d'import) le ferait échouer.
   3. SPECTATEUR — les deux gestes sont dans VIEWER_BLOCKED.

   (Le dépôt ne monte pas badge-toasts.js sous node — il tire
   render.js et le DOM entier : ces contrats se lisent aux
   sources, le comportement se vérifie au navigateur.)
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = f => readFileSync(new URL('../app/' + f, import.meta.url), 'utf8');
const toasts = read('badge-toasts.js');
const render = read('render.js');
const appjs = read('app.js');
const css = read('styles.css');

describe('les trois cas où elle ne part PAS', () => {
  test('1 · tutoriel : le garde .tut-overlay est la PREMIÈRE ligne de la célébration', () => {
    const fn = toasts.match(/export function showTierCelebration[\s\S]{0,200}/)[0];
    assert.match(fn, /\.tut-overlay'\)\) return false/,
      'sans ce garde, la célébration recouvrirait la visite guidée — le défaut du n°17');
  });

  test('2 · import : les seuls appelants sont les deux gestes de render.js', () => {
    const files = ['app.js', 'storage.js', 'backup.js', 'cloud-sync.js', 'tutorial.js',
      'tutorial-snapshot.js', 'stats.js', 'badges.js', 'pin.js', 'season.js'];
    for(const f of files){
      let src; try { src = read(f); } catch { continue; }
      assert.ok(!src.includes('showTierCelebration'),
        `${f} appelle la célébration — un chemin d'import ne doit JAMAIS la déclencher`);
    }
    const calls = (render.match(/showTierCelebration\(/g) || []).length;
    assert.equal(calls, 2, 'exactement deux appelants : changeMoQty et quickAddType');
    assert.match(render, /function changeMoQty[\s\S]*?showTierCelebration\(/);
    assert.match(render, /function quickAddType[\s\S]*?showTierCelebration\(/);
  });

  test('3 · spectateur : les deux gestes porteurs sont bloqués', () => {
    const vb = appjs.match(/VIEWER_BLOCKED = new Set\(\[([\s\S]*?)\]\)/)[1];
    assert.ok(vb.includes("'changeMoQty'"));
    assert.ok(vb.includes("'quickAddType'"));
  });

  test('jamais pour un simple +1 : montée STRICTE requise, aux deux points', () => {
    const checks = (render.match(/RARITY_ORDER\[rarAfter\] > RARITY_ORDER\[rarBefore\]/g) || []).length;
    assert.equal(checks, 2, 'l\'avant/après strict doit garder chaque geste');
  });
});

describe('sans mouvement, par construction', () => {
  test('le bloc CSS .tier-* ne contient AUCUNE animation ni transition d\'entrée', () => {
    const bloc = css.match(/\.tier-cele\{[\s\S]*?\.tier-actions \.primary\{[^}]*\}/);
    assert.ok(bloc, 'bloc .tier-* introuvable');
    assert.ok(!/animation/.test(bloc[0]), 'le tampon est déjà posé — rien ne bouge');
    assert.ok(!/@keyframes/.test(bloc[0]));
    assert.ok(!/transition/.test(bloc[0]), 'même pas de transition : statique par construction');
  });
});

describe('la file et l\'invitation restent honnêtes', () => {
  test('la célébration TIENT la file (les toasts attendent sa fermeture)', () => {
    assert.match(toasts, /_drainToastQueue\(\)\{[\s\S]{0,600}if\(_celeOpen\)\{ setTimeout\(_drainToastQueue/,
      'sans cette retenue, un toast partirait sous l\'écran de célébration');
  });

  test('fermer la célébration relance la file — l\'invitation ne tire que tout retombé', () => {
    assert.match(toasts, /_celeOpen = false;[\s\S]{0,120}_drainToastQueue\(\)/);
  });

  test('la ligne « + N badges » est rafraîchie APRÈS updateStats, aux deux gestes', () => {
    const refreshes = (render.match(/refreshTierCeleBadges\(\)/g) || []).length;
    assert.equal(refreshes, 2);
    assert.match(render, /updateStats\(\); updateCardTile\(cardId\);\n\s*refreshTierCeleBadges/);
  });

  test('review-invite : la célébration compte comme bandeau visible (ceinture)', () => {
    assert.match(read('review-invite.js'), /getElementById\('tierCele'\)\) return true/);
  });

  test('la célébration s\'ouvre AVANT updateStats dans changeMoQty (la file doit la trouver posée)', () => {
    const fn = render.match(/export function changeMoQty[\s\S]*?refreshTierCeleBadges\(\);/)[0];
    assert.ok(fn.indexOf('showTierCelebration') < fn.indexOf('updateStats()'),
      'ouverte après, un toast gagnerait la course et partirait sous l\'écran');
  });
});

describe('i18n ×7 — les clés de la célébration', () => {
  new Function(read('translations.js'))();
  const LANGS = ['en', 'fr', 'es', 'zh', 'it', 'nl', 'de'];
  const KEYS = ['cele.kicker', 'cele.kicker_set', 'cele.line_type', 'cele.line_set',
    'cele.count', 'cele.queue', 'cele.see', 'cele.continue'];
  for(const key of KEYS){
    test(key, () => {
      for(const l of LANGS) assert.ok(window.__T[l] && window.__T[l][key], `${key} manque en ${l}`);
    });
  }
});
