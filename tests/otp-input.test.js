/* ══════════════════════════════════════════════════════════
   COMPOSANT SEGMENTÉ (otp-input.js) — helpers purs + contrats
   de source. Le rendu vit dans le DOM (vérifié au navigateur) ;
   ici on fige la logique d'affichage (masquage type PIN compris,
   pour le volet D) et les contrats que la refonte a établis :
   tokens de composant, plus d'accent bleu, erreur ≠ accent.
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import '../app/translations.js';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { segDisplay, segActiveIndex, segSanitize } from '../app/otp-input.js';

const read = f => readFileSync(new URL('../app/' + f, import.meta.url), 'utf8');

describe('segDisplay — ce que chaque case affiche', () => {
  test('sans masquage : le chiffre, ou rien', () => {
    assert.equal(segDisplay('123', 0), '1');
    assert.equal(segDisplay('123', 2), '3');
    assert.equal(segDisplay('123', 3), '');
    assert.equal(segDisplay('', 0), '');
    assert.equal(segDisplay(null, 0), '');
  });

  test('masqué : puce partout sauf le chiffre en cours de révélation', () => {
    assert.equal(segDisplay('123', 0, { mask: true }), '•');
    assert.equal(segDisplay('123', 2, { mask: true, revealIdx: 2 }), '3');
    assert.equal(segDisplay('123', 1, { mask: true, revealIdx: 2 }), '•');
    assert.equal(segDisplay('123', 3, { mask: true, revealIdx: 2 }), '',
      'une case vide reste vide, même masquée');
  });
});

describe('segActiveIndex — la case qui attend le prochain chiffre', () => {
  test('suit la longueur saisie et disparaît quand c’est complet', () => {
    assert.equal(segActiveIndex('', 8), 0);
    assert.equal(segActiveIndex('123', 8), 3);
    assert.equal(segActiveIndex('1234567', 8), 7);
    assert.equal(segActiveIndex('12345678', 8), -1);
  });
});

describe('segSanitize — chiffres seuls, tronqués à la longueur', () => {
  test('retire tout sauf les chiffres et coupe au-delà de length', () => {
    assert.equal(segSanitize(' 0371 6217 ', 8), '03716217');
    assert.equal(segSanitize('12a4-56', 8), '12456');
    assert.equal(segSanitize('1234567890', 8), '12345678');
    assert.equal(segSanitize(null, 8), '');
  });
});

describe('contrats de la refonte (niveau source)', () => {
  test('l’UI cloud consomme le composant — plus de rendu OTP artisanal', () => {
    // Le contrat a suivi cloud.js → cloud-ui.js lors du découpage :
    // c'est la couche d'interface qui monte le composant.
    const src = read('cloud-ui.js');
    assert.match(src, /createSegmentedInput/);
    assert.equal(/otp-box/.test(src), false,
      'le markup des cases appartient au composant, pas à cloud-ui.js');
  });

  test('l’accent actif est celui de la marque, plus le bleu', () => {
    const css = read('styles.css');
    const seg = css.slice(css.indexOf('--seg-bg'), css.indexOf('segShake'));
    assert.match(seg, /--seg-accent:var\(--red\)/);
    assert.equal(/--blue/.test(seg), false, 'plus aucun bleu dans le composant');
  });

  test('l’erreur est ORANGE — jamais la couleur de l’accent', () => {
    const css = read('styles.css');
    assert.match(css, /--seg-err:var\(--orange\)/);
  });

  test('le composant n’embarque aucune couleur en dur', () => {
    assert.equal(/#[0-9a-fA-F]{3,8}\b/.test(read('otp-input.js')), false);
  });

  test('reduced-motion neutralise pulse, pop, secousse, caret et particules', () => {
    const css = read('styles.css');
    const rm = css.slice(css.indexOf('.otp-box.active,.otp-box.pop'));
    assert.match(rm.slice(0, 400), /animation:none/);
    assert.match(rm.slice(0, 400), /stroke-dashoffset:0/,
      'le check doit apparaître déjà dessiné sans animation');
  });

  test('cloud.otp_verified existe dans les 7 langues', () => {
    for (const l of ['en', 'fr', 'es', 'zh', 'it', 'nl', 'de']){
      assert.ok(window.__T[l] && window.__T[l]['cloud.otp_verified'], `manque en ${l}`);
    }
  });
});
