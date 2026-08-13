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

/* ══════════════════════════════════════════════════════════
   LA TOUCHE MANQUANTE + LA MARCHE ARRIÈRE (1.57.0)

   Le pavé est une grille 3 × 4 dont la dernière rangée était
   [⌫] [0] [trou]. Le trou reçoit UN rôle stable — tout effacer —
   et jamais un second selon l'état : une touche qui change de sens
   entre deux appuis, au même endroit, est un piège qui ne se voit
   qu'à l'usage.

   Le vrai manque était ailleurs : la création n'avait AUCUNE marche
   arrière. Passé en 2/2, le seul moyen de revenir en 1/2 était de
   taper 4 chiffres faux exprès.
   ══════════════════════════════════════════════════════════ */
describe('pavé PIN — touche « tout effacer » et marche arrière', () => {
  const pin = read('pin.js');
  const css = read('styles.css');

  test('les QUATRE pavés portent la touche, et elle part désactivée', () => {
    const pads = pin.match(/class="pin-key zero"/g) || [];
    const clears = pin.match(/class="pin-key clear"[^>]*/g) || [];
    assert.equal(clears.length, pads.length, 'un pavé de pin.js sans touche « effacer »');
    assert.ok(pads.length >= 3, 'les pavés de pin.js ont disparu ?');
    for (const c of clears) assert.match(c, /\sdisabled/, 'la touche doit partir désactivée');
    for (const f of ['index.html', 'index-dev.html']){
      const html = read(f);
      assert.match(html, /class="pin-key clear"[^>]*\sdisabled/, `${f} : touche absente ou active`);
      assert.match(html, /data-action="pinClear"/, `${f} : action non câblée`);
    }
  });

  test('le rôle ne bascule jamais : aucune touche de pavé ne navigue', () => {
    const clears = pin.match(/class="pin-key clear"[\s\S]{0,220}?<\/button>/g) || [];
    for (const c of clears){
      assert.ok(!/step_back|back_to_choice/.test(c),
        'la touche du pavé ne doit pas porter la navigation d’étape');
    }
  });

  test('la touche suit la saisie (désactivée quand il n’y a rien à effacer)', () => {
    assert.match(pin, /\.pin-key\.clear'\)\.forEach\(k => \{\s*k\.disabled = pinEntry\.length === 0;/,
      'l’état doit être repeint dans updatePinDots — le seul passage obligé');
  });

  test('pinClear vide TOUT (et ne se contente pas d’un caractère)', () => {
    assert.match(pin, /export function pinClear\(\)[\s\S]*?pinEntry = '';/);
  });

  test('la création peut reculer : 2/2 → 1/2 et sortie du tunnel', () => {
    assert.match(pin, /id="setupBackBtn"/, 'bouton de retour absent de la création');
    assert.match(pin, /#setupBackBtn'\)/, 'le bouton existe mais n’est pas récupéré');
    assert.match(pin, /pin\.step_back/);
    assert.match(pin, /pin\.back_to_choice/);
    assert.match(pin, /showSetupScreen\(\);/,
      'à 1/2, le retour doit rendre la main à la question d’origine');
  });

  test('le flux de réglages gagne le retour, sans perdre « Annuler »', () => {
    assert.match(pin, /id="pinFlowBack"/);
    assert.match(pin, /id="pinFlowCancel"/);
    assert.match(pin, /#pinFlowBack'\)\.hidden = idx === 0/,
      'pas de retour à la première étape : il n’y a rien derrière');
  });

  test('les trois clés existent dans les 7 langues', () => {
    const T = globalThis.window.__T;
    for (const lg of LANGS){
      for (const k of ['pin.clear', 'pin.step_back', 'pin.back_to_choice']){
        assert.ok(T[lg] && T[lg][k], `${lg} : ${k} manquante`);
      }
    }
  });

  /* Le test de source disait « câblée » et il avait raison : le `case
     'pinClear'` existait bien. Mais la délégation de initEvents() n'est
     posée qu'APRÈS l'authentification, et le pavé sert D'ABORD à
     déverrouiller. La touche était donc visible, activée, sans effet sur
     l'écran de connexion. Trouvé au navigateur, pas ici — d'où ce test,
     qui vérifie le câblage PRÉ-connexion, celui qui manquait. */
  test('la touche est câblée AVANT l’authentification, comme les chiffres', () => {
    const app = read('app.js');
    const preLogin = app.slice(app.indexOf('_pinEventListenersAttached'));
    assert.match(preLogin, /closest\('\[data-action="pinDel"\]'\)/,
      'repère perdu : le bloc pré-connexion a changé de forme');
    assert.match(preLogin, /closest\('\[data-action="pinClear"\]'\)/,
      'sans ce câblage, la touche ne fait rien sur l’écran de déverrouillage');
  });

  test('la grille du pavé ne peut plus être élargie par son contenu', () => {
    assert.match(css, /\.pin-keypad\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/,
      'sans minmax(0,…), un libellé large déforme les colonnes (mesuré : 70/70/86)');
  });

  /* ── L'écran de verrouillage parle enfin la bonne langue ──
     Encore un défaut trouvé au NAVIGATEUR, pas ici, et qui contredisait
     le diagnostic écrit : on croyait que seul l'émoji du bouton
     Parcourir ne survivait pas à la traduction. Mesure faite, c'était
     pire — quand un PIN est actif, le démarrage n'appelle jamais
     applyLanguage() (elle vit dans initApp(), qui ne tourne qu'après le
     déverrouillage). L'écran entier restait dans la langue du HTML :
     `document.documentElement.lang` valait « en » en chinois comme en
     français, et le titre affichait « PIN Code ».

     Ce qu'on ne peut PAS faire : appeler applyLanguage() au démarrage.
     Elle re-rend collection, stats et badges, dont les données ne sont
     pas chargées à ce moment. D'où une fonction qui ne traduit que
     l'écran visible. */
  test('l’écran de verrouillage est traduit AVANT le déverrouillage', () => {
    const app = read('app.js');
    const pin = read('pin.js');
    assert.match(pin, /export function applyLoginI18n\(\)/,
      'la traduction ciblée de l’écran de verrouillage a disparu');
    assert.match(pin, /document\.documentElement\.lang = getLang\(\)/,
      'sans lang, un lecteur d’écran annonce l’écran dans la mauvaise langue');
    const branche = app.slice(app.indexOf('PIN enabled - login screen should be visible'));
    assert.match(branche.slice(0, 400), /applyLoginI18n\(\)/,
      'la branche « PIN actif » du démarrage ne traduit plus l’écran');
  });

  test('applyLoginI18n ne déclenche AUCUN re-rendu de données', () => {
    const pin = read('pin.js');
    const corps = pin.slice(pin.indexOf('export function applyLoginI18n'));
    const fin = corps.indexOf('\n}');
    for (const interdit of ['renderCollection', 'updateStats', 'renderBadges', 'applyLanguage(']) {
      assert.ok(!corps.slice(0, fin).includes(interdit),
        `applyLoginI18n appelle ${interdit} — les données ne sont pas chargées à ce stade`);
    }
  });
});
