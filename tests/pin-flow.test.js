/* ══════════════════════════════════════════════════════════
   VOLET D — l'interface PIN sur le composant segmenté.
   Contrats de source : le boot et les overlays consomment les
   helpers/classes du composant (plus aucun #dot-i), la mécanique
   anti-flash n'a pas bougé, et DÉSACTIVER exige désormais la
   vérification du code — plus un simple « OK ».
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import '../translations.js';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const LANGS = ['en', 'fr', 'es', 'zh', 'it', 'nl', 'de'];

describe('le rendu PIN vit dans le composant segmenté', () => {
  test('pin.js importe les helpers du composant et ne dessine plus de pastilles', () => {
    const src = read('pin.js');
    assert.match(src, /from '\.\/otp-input\.js'/);
    assert.equal(/dot-\d|pin-dot/.test(src), false,
      'plus aucune pastille #dot-i — le miroir visuel appartient au composant');
  });

  test('les deux HTML embarquent le squelette segmenté statique (anti-flash intact)', () => {
    for (const f of ['index.html', 'index-dev.html']){
      const html = read(f);
      const login = html.slice(html.indexOf('login-screen'), html.indexOf('class="pin-keypad"'));
      assert.match(login, /pin-segs/, `${f} : l'écran de boot doit porter .pin-segs`);
      assert.match(login, /pin-lock/, `${f} : le cadenas SVG doit être présent`);
      assert.equal(/pin-dot/.test(login), false, `${f} : pastilles supprimées`);
      assert.match(html, /data-boot/, `${f} : la décision avant premier paint doit rester`);
    }
  });

  test('la saisie est masquée avec révélation brève (200 ms) du dernier chiffre', () => {
    const src = read('pin.js');
    assert.match(src, /mask:\s*true/);
    assert.match(src, /_segReveal\s*=\s*pinEntry\.length\s*-\s*1/);
  });

  test('le succès au boot reste discret : pas de badge dans le markup PIN', () => {
    assert.equal(/otp-badge/.test(read('pin.js')), false,
      'le check-célébration appartient au flux OTP, pas au déverrouillage');
  });
});

describe('flux de gestion à étapes', () => {
  const src = read('pin.js');

  test('le moteur _pinFlow affiche une progression i/n', () => {
    assert.match(src, /function _pinFlow/);
    assert.match(src, /\$\{idx\+1\}\/\$\{steps\.length\}/);
  });

  test('désactiver vérifie le code (une étape _stepVerify), après l’avertissement', () => {
    const dis = src.slice(src.indexOf("if(!await confirmDialog(t('pin.disable')"));
    assert.match(dis.slice(0, 300), /_pinFlow\(t\('pin\.flow_disable'\),\s*\[_stepVerify\]/,
      'retirer une protection exige de prouver qu’on la connaît');
  });

  test('changer = ancien → nouveau → confirmation (3 étapes), re-key AVANT le hash', () => {
    assert.match(src, /_pinFlow\(t\('s\.change_pin'\),\s*\[_stepVerify,\s*_stepNew,\s*_stepConfirm\(1\)\]/);
    const done = src.slice(src.indexOf("_pinFlow(t('s.change_pin')"));
    const rekeyAt = done.indexOf('rekeyEncryption');
    const hashAt = done.indexOf("localStorage.setItem('f1uno_pin_hash'");
    assert.ok(rekeyAt >= 0 && rekeyAt < hashAt,
      'si le re-chiffrement échoue, l’ancien code doit encore ouvrir les données');
  });

  test('créer = nouveau → confirmation, et l’échec de confirmation REJOUE la saisie', () => {
    assert.match(src, /_pinFlow\(t\('pin\.set_title'\),\s*\[_stepNew,\s*_stepConfirm\(0\)\]/);
    assert.match(src, /goto\s*\}/ , '_stepConfirm doit renvoyer un goto de reprise');
  });
});

describe('carte Sécurité & i18n', () => {
  test('l’état du PIN est lisible sans interaction (puce Actif/Inactif)', () => {
    assert.match(read('pin.js'), /sec-chip/);
  });

  for (const key of ['pin.flow_verify', 'pin.flow_disable', 'pin.change_sub',
                     'pin.state_on', 'pin.state_off', 'pin.off_done']){
    test(`${key} : 7 langues`, () => {
      for (const l of LANGS) assert.ok(window.__T[l] && window.__T[l][key], `manque en ${l}`);
    });
  }
});
