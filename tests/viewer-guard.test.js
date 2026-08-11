/* ══════════════════════════════════════════════════════════
   GARDES SPECTATEUR & ROBUSTESSE — trois régressions de la
   1.24.0, verrouillées ici. Ce sont des gardes AU NIVEAU SOURCE :
   le comportement vit dans le DOM (SVG, modales, navigation), que
   la suite node --test ne simule pas. Ce qu'on empêche, c'est la
   réintroduction du motif fautif.
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import '../translations.js';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const LANGS = ['en', 'fr', 'es', 'zh', 'it', 'nl', 'de'];

describe('icônes de nav : jamais de textContent sur un <svg>', () => {
  // .bn-icon est un <svg> depuis la 1.24.0 : lui écrire textContent
  // détruit ses <path> et laisse une icône vide (le bug « je ne vois
  // plus l'icône Réglages » en mode spectateur).
  test('aucun module n’écrit textContent sur .bn-icon', () => {
    for (const f of ['pin.js', 'render.js', 'app.js', 'account.js', 'tutorial.js']) {
      const src = read(f);
      const bad = /\.bn-icon['"]\s*\)?\s*(?:\.[\w]+)*\.textContent\s*=/.test(src)
               || /bn-icon[^\n]*\)\.textContent\s*=/.test(src);
      assert.equal(bad, false, `${f} écrit textContent sur .bn-icon — cela efface le SVG`);
    }
  });

  test('render.js expose le basculeur d’icône et bascule aussi la clé i18n', () => {
    const src = read('render.js');
    assert.match(src, /export function setSettingsTabLocked/);
    assert.match(src, /setAttribute\('data-i18n', key\)/,
      'applyLanguage() réécrit le libellé depuis data-i18n : la clé doit suivre');
  });
});

describe('mode spectateur : le garde vit dans switchView', () => {
  // Le garde était dans la délégation d'app.js ; le glissement de la
  // pastille appelait switchView() en direct et le contournait.
  test('switchView refuse la vue settings en spectateur, avant tout rendu', () => {
    const src = read('render.js');
    const fn = src.slice(src.indexOf('export function switchView'));
    const body = fn.slice(0, fn.indexOf('\n}'));
    assert.match(body, /isViewer\(\)\s*&&\s*view\s*===\s*'settings'/,
      'switchView doit porter le garde spectateur');
    const guardAt = body.indexOf('isViewer()');
    const renderAt = body.indexOf('renderSettings');
    assert.ok(guardAt >= 0 && (renderAt === -1 || guardAt < renderAt),
      'le garde doit précéder tout rendu des Réglages');
    assert.match(body.slice(guardAt, guardAt + 200), /return;/,
      'le garde doit interrompre switchView');
  });
});

describe('confirmations : aucune dépendance à confirm() natif', () => {
  // Un navigateur qui a supprimé les dialogues (« empêcher cette page
  // de créer des boîtes de dialogue ») rendait les actions de sécurité
  // silencieusement inertes.
  // Les commentaires citent confirm() en toutes lettres : on les retire
  // avant d'analyser, sinon la garde se déclenche sur sa propre note.
  const stripComments = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

  test('aucun confirm() natif dans les modules de l’app', () => {
    for (const f of ['pin.js', 'render.js', 'app.js', 'account.js', 'storage.js', 'backup.js',
      'cloud-auth.js', 'cloud-sync.js', 'cloud-ui.js']) {
      const code = stripComments(read(f)).replace(/confirmDialog\s*\(/g, 'X(');
      assert.equal(/(^|[^.\w])confirm\s*\(/m.test(code), false,
        `${f} utilise confirm() natif — passer par confirmDialog()`);
    }
  });

  test('confirmDialog est exporté, renvoie une promesse et piège le focus', () => {
    const src = read('render.js');
    assert.match(src, /export function confirmDialog/);
    assert.match(src, /return new Promise/);
    assert.match(src, /e\.key === 'Escape'/, 'Échap doit annuler');
    assert.match(src, /e\.key === 'Tab'/, 'le focus doit rester dans la modale');
  });
});

describe('i18n des nouvelles clés', () => {
  for (const key of ['nav.admin', 'cfm.confirm']) {
    test(`${key} existe dans les 7 langues`, () => {
      for (const lang of LANGS) {
        assert.ok(window.__T[lang] && window.__T[lang][key], `${key} manque en ${lang}`);
      }
    });
  }
});
