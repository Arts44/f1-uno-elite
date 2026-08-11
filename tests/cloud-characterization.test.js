/* ══════════════════════════════════════════════════════════
   CLOUD — TESTS DE CARACTÉRISATION (filet avant découpage)

   CE QUE CES TESTS SONT. Une description du comportement
   OBSERVABLE de cloud.js tel qu'il est aujourd'hui — y compris
   ses bizarreries. Ils ne disent pas ce qui SERAIT bien : ils
   figent ce qui EST, pour que le découpage à venir casse un
   test plutôt que l'application.

   CE QU'ILS NE SONT PAS. Ni une spécification, ni un jugement.
   Là où le comportement actuel surprend, le test le dit dans
   son nom et un commentaire l'explique — sans le corriger.

   Le chemin d'UI (`bindCloudSection`, 180 lignes) n'avait aucun
   test : `_setup.js` rend un document objet-nul, donc tout le
   câblage se contentait de ne rien trouver. `_dom.js` fournit
   le minimum de DOM nécessaire, sans dépendance.
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetStorage } from './_setup.js';
import { installDom, resetDom, mount } from './_dom.js';

installDom();
// Les modules sont importés dynamiquement APRÈS installDom() : leurs
// dépendances lisent `document` au chargement. `cloud` agrège les
// quatre couches pour que les tests restent écrits en termes de
// comportement, pas d'arborescence de fichiers.
const cloud = {
  ...await import('../cloud-http.js'),
  ...await import('../cloud-auth.js'),
  ...await import('../cloud-sync.js'),
  ...await import('../cloud-ui.js'),
};
const {
  cloudSectionHTML, bindCloudSection, classifyOtpError,
  getValidSession, saveSession, loadSession, clearSession,
  SESSION_KEY, sendCooldownRemaining, SEND_COOLDOWN_MS,
} = cloud;

/* ── Décor ────────────────────────────────────────────────── */
const CFG = { url: 'https://demo.supabase.co', anonKey: 'anon-key' };
const OWNED = JSON.stringify({ '001': { blue: { owned: true, qty: 2 } } });
const nowSec = () => Math.floor(NOW() / 1000);
const SESSION = () => ({
  access_token: 'tok', refresh_token: 'ref',
  expires_at: nowSec() + 3600, user: { id: 'u1', email: 'a@b.c' },
});

// Plus d'horloge pilotée : `_resetCooldown()` purge l'état de module
// directement. La version précédente remplaçait Date.now et avançait un
// compteur de 61 s entre chaque cas, pour joindre une variable que rien
// n'exposait — beaucoup de machinerie autour d'un défaut de conception.
const NOW = () => Date.now();

const resp = (status, body) => ({
  ok: status >= 200 && status < 300, status,
  json: async () => body,
  text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
});

let calls = [];            // journal des fetch
let routes = [];           // [ [motif, réponse|fn] ]
let timeouts = [];         // setTimeout capturés
let intervals = [];        // setInterval capturés
const orig = {};

function route(pattern, value){ routes.push([pattern, value]); }
function flushTimeouts(){ const p = timeouts.splice(0); p.forEach(fn => fn()); }
// Laisse les promesses flottantes (_fillLastBackup) se résoudre.
const settle = () => new Promise(r => orig.setTimeout(r, 0));

beforeEach(() => {
  resetStorage();
  resetDom();
  calls = []; routes = []; timeouts = []; intervals = [];
  globalThis.window.__F1UNO_CLOUD = CFG;
  // Node ≥21 expose un `navigator` natif en lecture seule : on le
  // REMPLACE par un objet à nous, sinon `navigator.onLine` n'existe pas.
  Object.defineProperty(globalThis, 'navigator', {
    value: { onLine: true }, configurable: true, writable: true,
  });
  globalThis.window.matchMedia = () => ({ matches: false });
  localStorage.setItem('f1uno_owned_2025', OWNED);

  orig.fetch = globalThis.fetch;
  orig.setTimeout = globalThis.setTimeout;
  orig.clearTimeout = globalThis.clearTimeout;
  orig.setInterval = globalThis.setInterval;
  orig.clearInterval = globalThis.clearInterval;
  cloud._resetCooldown();
  globalThis.setTimeout = fn => { timeouts.push(fn); return timeouts.length; };
  globalThis.clearTimeout = () => {};
  globalThis.setInterval = fn => { intervals.push(fn); fn(); return intervals.length; };
  globalThis.clearInterval = () => {};

  globalThis.fetch = async (url, opts) => {
    calls.push({ url: String(url), method: (opts && opts.method) || 'GET', opts });
    for(const [pattern, value] of routes){
      if(String(url).includes(pattern)) {
        return typeof value === 'function' ? value(url, opts) : value;
      }
    }
    return resp(200, []);
  };
});

afterEach(() => {
  Object.assign(globalThis, {
    fetch: orig.fetch, setTimeout: orig.setTimeout, clearTimeout: orig.clearTimeout,
    setInterval: orig.setInterval, clearInterval: orig.clearInterval,
  });
});

/** Monte la section et câble : l'état de départ vient du localStorage. */
function open(){
  const host = mount(cloudSectionHTML());
  bindCloudSection();
  return host;
}
const $ = id => document.getElementById(id);
const txt = id => ($(id) ? $(id).textContent : null);

/* ══════════════════════════════════════════════════════════
   A · RENDU DE LA SECTION COMPTE
   ══════════════════════════════════════════════════════════ */
describe('A · rendu de la section cloud', () => {
  test('cloud non configuré : un seul message, aucun contrôle', () => {
    globalThis.window.__F1UNO_CLOUD = null;
    open();
    assert.equal($('cloudArea').textContent.includes('cloud.not_configured'), true);
    assert.equal($('cloudSendBtn'), null);
    assert.equal($('cloudPushBtn'), null);
  });

  test('configuré et déconnecté : e-mail + envoi, la rangée code est CACHÉE', () => {
    open();
    assert.ok($('cloudEmail'), 'champ e-mail');
    assert.ok($('cloudSendBtn'), 'bouton d’envoi');
    assert.equal($('cloudCodeRow').style.display, 'none');
    assert.equal($('cloudPushBtn'), null, 'pas de push tant qu’on n’est pas connecté');
  });

  test('connecté : l’e-mail est affiché, push/pull/déconnexion présents', () => {
    saveSession(SESSION());
    open();
    assert.match($('cloudArea').textContent, /a@b\.c/);
    assert.ok($('cloudPushBtn'));
    assert.ok($('cloudPullBtn'));
    assert.ok($('cloudSignOutBtn'));
    assert.equal($('cloudSendBtn'), null, 'plus de formulaire de connexion');
    assert.equal($('cloudEmailChgRow').style.display, 'none');
  });

  test('l’e-mail de session est ÉCHAPPÉ avant d’entrer dans le HTML', () => {
    saveSession({ ...SESSION(), user: { id: 'u1', email: '<img src=x onerror=alert(1)>' } });
    open();
    const html = $('cloudArea').innerHTML;
    assert.equal(html.includes('<img'), false, 'aucune balise injectée');
    assert.match(html, /&lt;img/);
  });

  test('sans session, l’état affiché suit le localStorage, pas le réseau', () => {
    open();
    assert.equal(calls.filter(c => c.url.includes('/auth/')).length, 0);
  });
});

/* ══════════════════════════════════════════════════════════
   B · FLUX OTP COMPLET
   ══════════════════════════════════════════════════════════ */
describe('B · flux OTP, de l’envoi à la session', () => {
  test('e-mail invalide : message typé, AUCUNE requête', async () => {
    open();
    $('cloudEmail').value = 'pas-un-email';
    await $('cloudSendBtn').click();
    assert.equal(txt('cloudAuthMsg'), 'cloud.invalid_email');
    assert.equal($('cloudAuthMsg').className, 'cloud-msg err');
    assert.equal(calls.length, 0);
  });

  test('hors-ligne : refus AVANT la requête', async () => {
    globalThis.navigator.onLine = false;
    open();
    $('cloudEmail').value = 'a@b.co';
    await $('cloudSendBtn').click();
    assert.equal(txt('cloudAuthMsg'), 'cloud.offline');
    assert.equal(calls.length, 0);
  });

  test('envoi réussi : rangée code révélée, cool-down armé sur le bouton', async () => {
    route('/auth/v1/otp', resp(200, {}));
    open();
    $('cloudEmail').value = 'a@b.co';
    await $('cloudSendBtn').click();
    assert.equal(txt('cloudAuthMsg'), 'cloud.link_sent');
    assert.equal($('cloudCodeRow').style.display, '', 'la rangée code s’ouvre');
    assert.equal($('cloudSendBtn').disabled, true, 'le bouton reste bloqué le temps du cool-down');
    assert.match($('cloudSendBtn').textContent, /cloud\.resend_in/);
    assert.equal(calls[0].method, 'POST');
    assert.match(calls[0].url, /\/auth\/v1\/otp\?redirect_to=/);
  });

  test('le champ code est le composant segmenté : 8 cases, input #cloudCode', async () => {
    route('/auth/v1/otp', resp(200, {}));
    open();
    $('cloudEmail').value = 'a@b.co';
    await $('cloudSendBtn').click();
    assert.ok($('cloudCode'), 'l’input caché garde son id (autofill, tests)');
    assert.equal(document.querySelectorAll('.otp-box').length, 8);
  });

  test('code au mauvais format : refusé sans appel réseau', async () => {
    route('/auth/v1/otp', resp(200, {}));
    open();
    $('cloudEmail').value = 'a@b.co';
    await $('cloudSendBtn').click();
    const before = calls.length;
    $('cloudCode').value = '123';
    await $('cloudVerifyBtn').click();
    assert.equal(txt('cloudAuthMsg'), 'cloud.code_err');
    assert.equal(calls.length, before, 'aucune vérification envoyée');
  });

  test('code correct : session enregistrée, puis bascule en état connecté', async () => {
    route('/auth/v1/otp', resp(200, {}));
    route('/auth/v1/verify', resp(200, {
      access_token: 'new-tok', refresh_token: 'new-ref',
      expires_at: nowSec() + 3600, user: { id: 'u9', email: 'me@x.io' },
    }));
    open();
    $('cloudEmail').value = 'me@x.io';
    await $('cloudSendBtn').click();
    $('cloudCode').value = '03716217';
    await $('cloudVerifyBtn').click();

    assert.equal(txt('cloudAuthMsg'), 'cloud.otp_verified');
    const s = loadSession();
    assert.equal(s.access_token, 'new-tok');
    assert.equal(s.user.email, 'me@x.io');

    // La bascule d'affichage est DIFFÉRÉE (animation de succès) : elle
    // n'a lieu qu'au tour de boucle suivant, pas dans le clic.
    assert.ok($('cloudEmail'), 'la zone n’a pas encore basculé');
    flushTimeouts();
    await settle();
    assert.ok($('cloudPushBtn'), 'après le délai, l’état connecté est rendu');
  });

  test('code refusé : message d’erreur et bouton REACTIVÉ pour réessayer', async () => {
    route('/auth/v1/otp', resp(200, {}));
    route('/auth/v1/verify', resp(400, { error: 'invalid' }));
    open();
    $('cloudEmail').value = 'a@b.co';
    await $('cloudSendBtn').click();
    $('cloudCode').value = '03716217';
    await $('cloudVerifyBtn').click();
    assert.equal(txt('cloudAuthMsg'), 'cloud.code_err');
    assert.equal($('cloudVerifyBtn').disabled, false);
    assert.equal(loadSession(), null);
  });

  test('429 à la vérification : message de limitation, pas « code faux »', async () => {
    route('/auth/v1/otp', resp(200, {}));
    route('/auth/v1/verify', resp(429, 'over_request_rate_limit'));
    open();
    $('cloudEmail').value = 'a@b.co';
    await $('cloudSendBtn').click();
    $('cloudCode').value = '03716217';
    await $('cloudVerifyBtn').click();
    assert.equal(txt('cloudAuthMsg'), 'cloud.rate_limited');
  });

  test('réponse 200 sans jeton : traitée comme un code invalide', async () => {
    route('/auth/v1/otp', resp(200, {}));
    route('/auth/v1/verify', resp(200, { user: { id: 'u1' } }));
    open();
    $('cloudEmail').value = 'a@b.co';
    await $('cloudSendBtn').click();
    $('cloudCode').value = '03716217';
    await $('cloudVerifyBtn').click();
    assert.equal(txt('cloudAuthMsg'), 'cloud.code_err');
    assert.equal(loadSession(), null);
  });
});

/* ══════════════════════════════════════════════════════════
   C · LES SIX ÉCHECS TYPÉS D'ENVOI
   ══════════════════════════════════════════════════════════ */
describe('C · pourquoi l’e-mail n’est pas parti', () => {
  test('classifyOtpError couvre les six causes', () => {
    assert.equal(classifyOtpError(429, ''), 'rate-limited');
    assert.equal(classifyOtpError(400, 'over_email_send_rate_limit'), 'rate-limited');
    assert.equal(classifyOtpError(403, 'email_address_not_authorized'), 'email-not-allowed');
    assert.equal(classifyOtpError(422, 'signup_disabled'), 'signups-closed');
    assert.equal(classifyOtpError(422, 'otp_disabled'), 'signups-closed');
    assert.equal(classifyOtpError(500, ''), 'mail-down');
    assert.equal(classifyOtpError(400, 'error_sending_confirmation_email'), 'mail-down');
    assert.equal(classifyOtpError(418, 'quelque chose d’autre'), 'otp-failed');
  });

  test('l’ordre des règles compte : 429 gagne sur un corps « signup_disabled »', () => {
    assert.equal(classifyOtpError(429, 'signup_disabled'), 'rate-limited');
  });

  const UI = [
    ['email-not-allowed', 403, 'email_address_not_authorized', 'cloud.email_not_allowed'],
    ['signups-closed', 422, 'signup_disabled', 'cloud.signups_closed'],
    ['mail-down', 503, '', 'cloud.mail_down'],
    ['otp-failed', 418, 'inconnu', 'cloud.link_error'],
  ];
  for(const [nom, status, body, key] of UI){
    test(`${nom} → ${key}, et le bouton redevient cliquable`, async () => {
      route('/auth/v1/otp', resp(status, body));
      open();
      $('cloudEmail').value = 'a@b.co';
      await $('cloudSendBtn').click();
      assert.equal(txt('cloudAuthMsg'), key);
      assert.equal($('cloudSendBtn').disabled, false, 'l’utilisateur peut réessayer');
    });
  }

  test('rate-limited : le bouton reste BLOQUÉ — le serveur a dit stop', async () => {
    route('/auth/v1/otp', resp(429, 'over_email_send_rate_limit'));
    open();
    $('cloudEmail').value = 'a@b.co';
    await $('cloudSendBtn').click();
    assert.equal(txt('cloudAuthMsg'), 'cloud.rate_limited');
    assert.equal($('cloudSendBtn').disabled, true,
      'seul cas où l’échec ne rend PAS la main : réessayer aggraverait');
  });

  test('coupure réseau à l’envoi → cloud.offline', async () => {
    route('/auth/v1/otp', () => { throw new TypeError('network down'); });
    open();
    $('cloudEmail').value = 'a@b.co';
    await $('cloudSendBtn').click();
    assert.equal(txt('cloudAuthMsg'), 'cloud.offline');
  });

  test('sendCooldownRemaining : 0 sans envoi, décompte en secondes ensuite', () => {
    assert.equal(sendCooldownRemaining(0, NOW()), 0);
    assert.equal(sendCooldownRemaining(NOW(), NOW()), 60);
    assert.equal(sendCooldownRemaining(NOW() - 59000, NOW()), 1);
    assert.equal(sendCooldownRemaining(NOW() - 60000, NOW()), 0);
    assert.equal(sendCooldownRemaining(NOW() - 999999, NOW()), 0, 'jamais négatif');
  });
});

/* ══════════════════════════════════════════════════════════
   D · PUSH / PULL PAR L'INTERFACE
   ══════════════════════════════════════════════════════════ */
describe('D · push et pull depuis les Réglages', () => {
  beforeEach(() => saveSession(SESSION()));

  test('push réussi : message OK et date de dernière sauvegarde mise à jour', async () => {
    route('/rest/v1/collections?on_conflict', resp(200, [{ updated_at: '2026-01-02T03:04:05Z' }]));
    open();
    await $('cloudPushBtn').click();
    assert.equal(txt('cloudSyncMsg'), 'cloud.push_ok');
    assert.equal($('cloudSyncMsg').className, 'cloud-msg ok');
    assert.notEqual(txt('cloudLastBackup'), '…');
    assert.equal($('cloudPushBtn').disabled, false, 'le bouton est rendu après l’opération');
  });

  test('push refusé en 401 : session purgée ET zone re-rendue déconnectée', async () => {
    route('/rest/v1/collections?on_conflict', resp(401, 'JWT expired'));
    open();
    await $('cloudPushBtn').click();
    assert.equal(txt('cloudSyncMsg'), null, 'la zone a été remplacée : plus de #cloudSyncMsg');
    assert.equal(loadSession(), null, 'la session morte est jetée');
    assert.ok($('cloudEmail'), 'retour au formulaire de connexion');
  });

  test('push en échec serveur : message typé, session CONSERVÉE', async () => {
    route('/rest/v1/collections?on_conflict', resp(500, 'boom'));
    open();
    await $('cloudPushBtn').click();
    assert.equal(txt('cloudSyncMsg'), 'cloud.push_err');
    assert.ok(loadSession(), 'un 500 n’est pas une session morte');
  });

  test('pull réussi : ouvre le dialogue d’import, n’écrase RIEN tout seul', async () => {
    route('select=data,updated_at', resp(200, [{
      data: { owned: { '001': { blue: { owned: true, qty: 1 } } }, season: 2025 },
      updated_at: '2026-01-02T03:04:05Z',
    }]));
    open();
    await $('cloudPullBtn').click();
    assert.equal(txt('cloudSyncMsg'), 'cloud.pull_ready');
    assert.ok(document.querySelector('.import-dialog-overlay'), 'dialogue merge/remplacer ouvert');
    assert.equal(localStorage.getItem('f1uno_owned_2025'), OWNED, 'la collection locale est intacte');
  });

  test('pull sans ligne distante → cloud.no_data', async () => {
    route('select=data,updated_at', resp(200, []));
    open();
    await $('cloudPullBtn').click();
    assert.equal(txt('cloudSyncMsg'), 'cloud.no_data');
  });

  test('pull d’un contenu illisible → cloud.pull_err', async () => {
    route('select=data,updated_at', resp(200, [{ data: { pas: 'une collection' } }]));
    open();
    await $('cloudPullBtn').click();
    assert.equal(txt('cloudSyncMsg'), 'cloud.pull_err');
  });

  test('hors-ligne : push et pull refusent avant toute requête', async () => {
    globalThis.navigator.onLine = false;
    open();
    await settle();                    // laisse _fillLastBackup se résoudre
    const before = calls.length;
    await $('cloudPushBtn').click();
    assert.equal(txt('cloudSyncMsg'), 'cloud.offline');
    await $('cloudPullBtn').click();
    assert.equal(txt('cloudSyncMsg'), 'cloud.offline');
    assert.equal(calls.length, before, 'aucun appel réseau');
  });

  test('la ligne « dernière sauvegarde » se remplit toute seule à l’ouverture', async () => {
    route('select=updated_at', resp(200, [{ updated_at: '2026-01-02T03:04:05Z' }]));
    open();
    await settle();
    assert.notEqual(txt('cloudLastBackup'), '…');
  });

  test('hors-ligne, la ligne « dernière sauvegarde » ne tente RIEN', async () => {
    // ── TEST RÉÉCRIT SCIEMMENT, le comportement a changé ──
    // La version de caractérisation figeait l'inverse : fetchCloudMeta()
    // était la seule des cinq fonctions réseau à ne pas poser la question
    // « suis-je hors ligne ? », et lançait donc une requête vouée à
    // échouer chaque fois qu'on ouvrait le Compte sans connexion.
    // C'était une ASYMÉTRIE, pas une décision : rien ne la justifiait, et
    // aucun autre comportement n'en dépendait (la ligne retombait déjà
    // sur « jamais »). L'ancienne assertion — « INTERROGE quand même le
    // réseau » — est remplacée, pas ajustée.
    globalThis.navigator.onLine = false;
    route('select=updated_at', resp(200, [{ updated_at: '2026-01-02T03:04:05Z' }]));
    open();
    await settle();
    assert.equal(calls.filter(c => c.url.includes('select=updated_at')).length, 0);
    assert.equal(txt('cloudLastBackup'), 'cloud.never',
      'la ligne affiche « jamais » — comme avant, mais sans requête inutile');
  });

  test('métadonnée illisible : la ligne retombe sur « jamais », sans erreur', async () => {
    route('select=updated_at', resp(500, ''));
    open();
    await settle();
    assert.equal(txt('cloudLastBackup'), 'cloud.never');
  });
});

/* ══════════════════════════════════════════════════════════
   E · SESSION : EXPIRATION ET RAFRAÎCHISSEMENT
   ══════════════════════════════════════════════════════════ */
describe('E · durée de vie de la session', () => {
  test('session fraîche : rendue telle quelle, aucun appel', async () => {
    saveSession(SESSION());
    const s = await getValidSession();
    assert.equal(s.access_token, 'tok');
    assert.equal(calls.length, 0);
  });

  test('la marge de 60 s : une session qui expire dans 30 s est déjà « expirée »', async () => {
    saveSession({ ...SESSION(), expires_at: nowSec() + 30 });
    route('grant_type=refresh_token', resp(200, {
      access_token: 'tok2', refresh_token: 'ref2', expires_in: 3600,
    }));
    const s = await getValidSession();
    assert.equal(s.access_token, 'tok2', 'rafraîchie avant de mourir en cours de requête');
  });

  test('expirée : rafraîchie, la nouvelle session est PERSISTÉE', async () => {
    saveSession({ ...SESSION(), expires_at: nowSec() - 10 });
    route('grant_type=refresh_token', resp(200, {
      access_token: 'tok2', refresh_token: 'ref2', expires_in: 3600,
      user: { id: 'u1', email: 'a@b.c' },
    }));
    const s = await getValidSession();
    assert.equal(s.access_token, 'tok2');
    assert.equal(loadSession().access_token, 'tok2');
  });

  test('le refresh CONSERVE l’utilisateur quand le serveur ne le renvoie pas', async () => {
    saveSession({ ...SESSION(), expires_at: nowSec() - 10 });
    route('grant_type=refresh_token', resp(200, {
      access_token: 'tok2', refresh_token: 'ref2', expires_in: 3600,
    }));
    const s = await getValidSession();
    assert.equal(s.user.email, 'a@b.c');
  });

  test('refresh REFUSÉ : session purgée, retour null', async () => {
    saveSession({ ...SESSION(), expires_at: nowSec() - 10 });
    route('grant_type=refresh_token', resp(400, 'invalid_grant'));
    assert.equal(await getValidSession(), null);
    assert.equal(localStorage.getItem(SESSION_KEY), null);
  });

  test('refresh COUPÉ (réseau) : la session est GARDÉE et l’erreur remonte', async () => {
    saveSession({ ...SESSION(), expires_at: nowSec() - 10 });
    route('grant_type=refresh_token', () => { throw new TypeError('network down'); });
    await assert.rejects(getValidSession(), { message: 'offline' });
    assert.ok(loadSession(), 'une coupure ne déconnecte pas — c’est la correction de 1.40.0');
  });

  test('session illisible en stockage : traitée comme absente', async () => {
    localStorage.setItem(SESSION_KEY, '{ ceci n’est pas du JSON');
    assert.equal(loadSession(), null);
    assert.equal(await getValidSession(), null);
  });

  test('session sans refresh_token : rejetée au chargement', () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ access_token: 'tok' }));
    assert.equal(loadSession(), null);
  });
});

/* ══════════════════════════════════════════════════════════
   F · CHANGEMENT D'E-MAIL ET DÉCONNEXION
   ══════════════════════════════════════════════════════════ */
describe('F · changement d’e-mail et déconnexion', () => {
  beforeEach(() => saveSession(SESSION()));

  test('le bouton révèle la rangée, puis la referme', async () => {
    open();
    assert.equal($('cloudEmailChgRow').style.display, 'none');
    await $('cloudEmailChgBtn').click();
    assert.equal($('cloudEmailChgRow').style.display, '');
    await $('cloudEmailChgBtn').click();
    assert.equal($('cloudEmailChgRow').style.display, 'none');
  });

  test('nouvelle adresse invalide : refus local, aucune requête', async () => {
    open();
    await $('cloudEmailChgBtn').click();
    $('cloudNewEmail').value = 'nope';
    const before = calls.length;
    await $('cloudEmailChgSendBtn').click();
    assert.equal(txt('cloudEmailChgMsg'), 'cloud.invalid_email');
    assert.equal(calls.length, before);
  });

  test('demande acceptée : message de confirmation, PUT sur /auth/v1/user', async () => {
    route('/auth/v1/user', resp(200, {}));
    open();
    await $('cloudEmailChgBtn').click();
    $('cloudNewEmail').value = 'neuf@x.io';
    await $('cloudEmailChgSendBtn').click();
    assert.equal(txt('cloudEmailChgMsg'), 'cloud.change_email_sent');
    const put = calls.find(c => c.method === 'PUT');
    assert.ok(put, 'la demande part en PUT');
    assert.match(put.url, /\/auth\/v1\/user$/);
  });

  test('429 sur le changement : message de limitation et bouton rendu', async () => {
    route('/auth/v1/user', resp(429, ''));
    open();
    await $('cloudEmailChgBtn').click();
    $('cloudNewEmail').value = 'neuf@x.io';
    await $('cloudEmailChgSendBtn').click();
    assert.equal(txt('cloudEmailChgMsg'), 'cloud.rate_limited');
    assert.equal($('cloudEmailChgSendBtn').disabled, false);
  });

  test('déconnexion : session purgée et retour au formulaire', async () => {
    route('/auth/v1/logout', resp(204, ''));
    open();
    await $('cloudSignOutBtn').click();
    assert.equal(loadSession(), null);
    assert.ok($('cloudEmail'), 'le formulaire de connexion est revenu');
  });

  test('déconnexion hors-ligne : la session locale part QUAND MÊME', async () => {
    route('/auth/v1/logout', () => { throw new TypeError('network down'); });
    open();
    await $('cloudSignOutBtn').click();
    assert.equal(loadSession(), null,
      'se déconnecter ne doit jamais dépendre du réseau');
  });
});

/* ══════════════════════════════════════════════════════════
   G · LIEN MAGIQUE, SUPPRESSION, JETON RÉVOQUÉ
   L'autre chemin d'authentification et les actions qui restaient
   sans le moindre test.
   ══════════════════════════════════════════════════════════ */
describe('G · lien magique et actions de compte', () => {
  beforeEach(() => {
    globalThis.location = { origin: 'https://ex.test', pathname: '/app/', search: '', hash: '' };
    globalThis.history = { replaceState(){} };
  });

  test('parseSessionFromHash : un fragment complet donne une session', () => {
    const s = cloud.parseSessionFromHash(
      '#access_token=A&refresh_token=R&expires_in=3600&type=magiclink', 1000);
    assert.equal(s.access_token, 'A');
    assert.equal(s.refresh_token, 'R');
    assert.equal(s.expires_at, 4600, 'expires_at dérivé de expires_in quand il manque');
    assert.equal(s.type, 'magiclink');
  });

  test('parseSessionFromHash : sans refresh_token, rien — une demi-session ne vaut rien', () => {
    assert.equal(cloud.parseSessionFromHash('#access_token=A', 1000), null);
    assert.equal(cloud.parseSessionFromHash('#autre=chose', 1000), null);
    assert.equal(cloud.parseSessionFromHash('', 1000), null);
  });

  test('retour de lien magique : session stockée, profil résolu, URL nettoyée', async () => {
    globalThis.location.hash = '#access_token=A&refresh_token=R&expires_in=3600';
    let cleaned = false;
    globalThis.history = { replaceState(){ cleaned = true; } };
    route('/auth/v1/user', resp(200, { id: 'u7', email: 'link@x.io' }));
    assert.equal(await cloud.handleAuthRedirect(), true);
    assert.equal(loadSession().user.email, 'link@x.io');
    assert.equal(cleaned, true, 'les jetons ne restent pas dans la barre d’adresse');
  });

  test('profil injoignable : la session est GARDÉE quand même, sans utilisateur', async () => {
    globalThis.location.hash = '#access_token=A&refresh_token=R&expires_in=3600';
    route('/auth/v1/user', resp(500, ''));
    assert.equal(await cloud.handleAuthRedirect(), true);
    assert.equal(loadSession().access_token, 'A');
    assert.equal(loadSession().user, undefined, 'le nom manque, la connexion tient');
  });

  test('sans fragment : ne fait rien et ne touche à rien', async () => {
    assert.equal(await cloud.handleAuthRedirect(), false);
    assert.equal(calls.length, 0);
  });

  test('isCloudSignedIn suit le stockage local, pas la fraîcheur du jeton', () => {
    assert.equal(cloud.isCloudSignedIn(), false);
    saveSession({ ...SESSION(), expires_at: nowSec() - 99999 });
    assert.equal(cloud.isCloudSignedIn(), true,
      'une session périmée compte encore comme « connecté » ici — les actions revérifient');
  });

  test('suppression cloud : DELETE ciblé sur l’utilisateur, pas sur la saison', async () => {
    saveSession(SESSION());
    route('/rest/v1/collections?user_id=eq.', resp(204, ''));
    assert.equal(await cloud.cloudDeleteAll(), true);
    const del = calls.find(c => c.method === 'DELETE');
    assert.match(del.url, /user_id=eq\.u1/);
    assert.equal(/season=/.test(del.url), false, 'toutes les saisons partent d’un coup');
  });

  test('suppression refusée : code typé, session conservée', async () => {
    saveSession(SESSION());
    route('/rest/v1/collections?user_id=eq.', resp(500, 'boom'));
    await assert.rejects(cloud.cloudDeleteAll(), { message: 'delete-failed' });
    assert.ok(loadSession());
  });

  test('pull avec jeton révoqué (403) : session purgée, message d’expiration', async () => {
    saveSession(SESSION());
    route('select=data,updated_at', resp(403, 'JWT revoked'));
    open();
    await $('cloudPullBtn').click();
    assert.equal(loadSession(), null);
    assert.ok($('cloudEmail'), 'retour au formulaire');
  });

  test('pull en erreur serveur : cloud.pull_err, session conservée', async () => {
    saveSession(SESSION());
    route('select=data,updated_at', resp(500, 'boom'));
    open();
    await $('cloudPullBtn').click();
    assert.equal(txt('cloudSyncMsg'), 'cloud.pull_err');
    assert.ok(loadSession());
  });

  test('la fin du cool-down rend le bouton et lui remet son libellé', async () => {
    route('/auth/v1/otp', resp(200, {}));
    open();
    $('cloudEmail').value = 'a@b.co';
    await $('cloudSendBtn').click();
    assert.equal($('cloudSendBtn').disabled, true);
    // On recule l'horodatage d'envoi au-delà du cool-down, au lieu
    // d'avancer le temps : même effet, sans toucher à Date.now.
    cloud._resetCooldown(Date.now() - SEND_COOLDOWN_MS - 1000);
    intervals.forEach(fn => fn());          // le tick suivant
    assert.equal($('cloudSendBtn').disabled, false);
    assert.equal($('cloudSendBtn').textContent, 'cloud.send_link');
  });
});

/* ══════════════════════════════════════════════════════════
   H · CE QUI SURPREND — figé sans être corrigé
   ══════════════════════════════════════════════════════════ */
describe('H · comportements observés, non jugés', () => {
  test('le cool-down d’envoi est un état de MODULE, partagé par tous les rendus', async () => {
    route('/auth/v1/otp', resp(200, {}));
    open();
    $('cloudEmail').value = 'a@b.co';
    await $('cloudSendBtn').click();
    assert.equal($('cloudSendBtn').disabled, true);

    // Un re-rendu complet de la zone ne remet PAS le compteur à zéro :
    // il est porté par une variable de module, pas par le DOM.
    resetDom();
    open();
    assert.equal($('cloudSendBtn').disabled, true,
      'le cool-down survit à un re-rendu — voulu (anti-429), mais invisible depuis le DOM');
  });

  test('clearSession() n’efface QUE la session — la collection reste', () => {
    saveSession(SESSION());
    clearSession();
    assert.equal(loadSession(), null);
    assert.equal(localStorage.getItem('f1uno_owned_2025'), OWNED);
  });

  test('le message de synchro est réutilisé par push ET pull, sans distinction', async () => {
    saveSession(SESSION());
    route('/rest/v1/collections?on_conflict', resp(500, ''));
    route('select=data,updated_at', resp(200, []));
    open();
    await $('cloudPushBtn').click();
    assert.equal(txt('cloudSyncMsg'), 'cloud.push_err');
    await $('cloudPullBtn').click();
    assert.equal(txt('cloudSyncMsg'), 'cloud.no_data',
      'le dernier message écrase le précédent : une seule zone pour deux actions');
  });
});
