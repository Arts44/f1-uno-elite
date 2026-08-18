/* ══════════════════════════════════════════════════════════
   LE BANDEAU DE MISE À JOUR (1.76.0) — deux défauts mesurés,
   deux contrats testables.

   ① IL ÉTAIT INATTEIGNABLE AU PREMIER LANCEMENT. Mesuré :
      présent 6 fois sur 6, ATTEIGNABLE 0 fois sur 6 — l'écran
      de langue/PIN interceptait les clics. Un bandeau qu'on ne
      peut pas toucher n'existe pas. Troisième occurrence du
      premier lancement comme angle mort (après les six défauts
      de l'état « 1 carte » et la fiche d'échange perdue).

   ② FERMÉ, IL NE REVENAIT JAMAIS. `registration.update()`
      n'émet aucun `updatefound` quand le worker est déjà garé,
      donc les vérifications périodiques ne rallumaient rien.
      C'est l'explication du « une fois sur deux ».
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { peutReproposer, SILENCE_APRES_FERMETURE_MS } from '../app/update.js';

const read = f => readFileSync(new URL('../app/' + f, import.meta.url), 'utf8');

describe('② fermer veut dire « pas maintenant », pas « jamais »', () => {
  const H = 3600000;

  test('jamais fermé : le bandeau a toujours le droit de paraître', () => {
    assert.equal(peutReproposer(Date.now(), 0), true);
  });

  test('juste fermé : silence — un refus ne se transforme pas en harcèlement', () => {
    const t = Date.now();
    assert.equal(peutReproposer(t, t), false);
    assert.equal(peutReproposer(t + 60000, t), false, 'une minute après, toujours silencieux');
  });

  test('après le délai : la vérification suivante le repropose', () => {
    const t = Date.now();
    assert.equal(peutReproposer(t + SILENCE_APRES_FERMETURE_MS, t), true);
    assert.equal(peutReproposer(t + SILENCE_APRES_FERMETURE_MS + 1, t), true);
  });

  test('le silence dure exactement l’intervalle de vérification — « la prochaine » est vrai à la lettre', () => {
    assert.equal(SILENCE_APRES_FERMETURE_MS, H);
    const src = read('update.js');
    assert.match(src, /SILENCE_APRES_FERMETURE_MS = CHECK_EVERY_MS/,
      'aligner les deux est ce qui rend la promesse littérale ; deux valeurs indépendantes dériveraient');
  });

  test('le refus vit en MÉMOIRE, pas dans localStorage — il ne survit pas à la session', () => {
    const src = read('update.js');
    assert.match(src, /let _fermeA = 0/);
    assert.ok(!/_fermeA[\s\S]{0,60}localStorage/.test(src),
      'persister un refus le rendrait définitif au rechargement — l’inverse du contrat');
  });

  test('la vérification périodique regarde l’ÉTAT, pas seulement l’événement', () => {
    const fn = read('update.js').match(/function _checkForUpdate\(\)\{[\s\S]*?\n}/)[0];
    assert.match(fn, /_reg\.waiting && navigator\.serviceWorker\.controller\) _showUpdateBanner/,
      'sans cette ligne, un worker déjà garé n’émet plus rien et le bandeau ne revient jamais');
  });
});

describe('① le bandeau attend un moment où on peut le toucher', () => {
  test('il diffère l’affichage au lieu de se poser derrière un écran', () => {
    /* CE TEST A CHANGÉ EN 1.77.0 — changement de comportement assumé.
       Le garde n'est plus écrit dans `_showUpdateBanner` : celui-ci ne
       fait que DEMANDER la zone, et c'est `demanderLaZone` qui tient la
       règle du bon moment, pour les sept surfaces au lieu d'une. La
       garantie mesurée en 1.76.0 — présent 6/6, atteignable 0/6 avant
       correctif — est inchangée ; son point d'application a bougé. */
    const fn = read('update.js').match(/function _showUpdateBanner\(\)\{[\s\S]*?\n}/)[0];
    assert.match(fn, /demanderLaZone\(\{ id: 'maj'/);
    const dz = read('moment.js').match(/export function demanderLaZone[\s\S]*?\n}/)[0];
    assert.match(dz, /if\(!peutAfficherSurcouche\(\)\)\{ _placer\(e\); _armerSonde\(\); return false; \}/,
      'sans ce garde dans la file, une surcouche se poserait derrière un écran');
  });

  test('la règle est PARTAGÉE avec la fiche reçue — une seule source', () => {
    assert.match(read('update.js'), /from '\.\/moment\.js'/);
    assert.match(read('trade-inbox.js'), /peutAfficherSurcouche as peutAfficher/);
    const m = read('moment.js');
    assert.match(m, /login-screen/);
    assert.match(m, /\.tut-overlay/);
    assert.match(m, /tierCele/);
  });

  test('moment.js est une FEUILLE : aucun import applicatif', () => {
    assert.ok(!/^import /m.test(read('moment.js')),
      'ce module vaut par ce qu’il ignore — comme season.js');
  });

  test('la relance abandonne au bout d’un temps borné', () => {
    assert.match(read('moment.js'), /limite = 120000/,
      'une mise en route qui n’aboutit pas ne doit pas laisser une minuterie tourner');
  });
});
