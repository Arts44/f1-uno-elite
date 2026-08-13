/* ══════════════════════════════════════════════════════════
   PIN / AUTH — login, setup wizard, viewer & admin modes,
   settings screen. PIN is SHA-256 hashed in localStorage.
   ══════════════════════════════════════════════════════════ */
import { log } from './logger.js';
import { isViewer, setViewer } from './session.js';
import { t, LANGS, getLang, setLang } from './i18n.js';
import { switchView, showToast, currentView, setCurrentView, closeMo, setSettingsTabLocked, confirmDialog } from './render.js';
import { initApp } from './app.js';
import { maybeStartTutorial, startTutorial } from './tutorial.js';
import { installRowHTML, bindInstallRow } from './install.js';
import { openChangelog, checkForUpdatesNow, isUpdateCheckSupported } from './update.js';
import { APP_VERSION } from './changelog.js';
import { pageHeadHTML } from './pagehead.js';
import { segDisplay, segActiveIndex } from './otp-input.js';
import { icon } from './icons.js';
import {
  isEncEnabled, unlockSecureStore, enableEncryption, disableEncryption,
  rekeyEncryption, quarantineEncryptedData
} from './secure-store.js';

// PIN storage helpers (localStorage-based, SHA-256 hashed)
export function isPinEnabled(){ return localStorage.getItem('f1uno_pin_enabled')==='true'; }
export function isSetupDone(){ return localStorage.getItem('f1uno_setup_done')==='true'; }
export function isViewerModeAllowed(){ return localStorage.getItem('f1uno_viewer_enabled')==='true'; }
/* ══════════════════════════════════════════════════════════
   LE PROJET ET SON AUTEUR — deux liens, rien d'autre.

   Deux destinations, une même intention : donner accès à ce qu'il
   y a autour de l'app, sans rien demander. Ko-fi rassemble les
   réseaux de l'auteur, le suivi et — parmi d'autres options — le
   don ; GitHub donne le code.

   Ce qui ne change pas : le don soutient le DÉVELOPPEUR, pas
   l'application. Le projet reste un fan project non commercial, le
   disclaimer F1/Mattel ne bouge pas, et il n'y a AUCUNE
   contrepartie — pas de fonctionnalité débloquée, pas de badge
   donateur, pas de mention nominative. À la seconde où le don
   ouvre quelque chose, ce n'est plus un don, c'est un achat.

   Des liens externes et c'est tout : zéro dépendance, zéro script
   tiers, zéro pixel de suivi, aucune donnée qui quitte l'appareil.
   Vider les DEUX URL masque entièrement la ligne ; n'en vider
   qu'une retire seulement son bouton.

   GitHub pointe le DÉPÔT, pas le profil : la ligne vit dans « À
   propos » de cette app, donc ce qu'on y cherche est le code de
   CETTE app. Le profil est à un clic depuis l'en-tête du dépôt ;
   l'inverse n'est pas vrai.
   ══════════════════════════════════════════════════════════ */
// Source unique de chaque URL : les changer ici les change partout.
export const SUPPORT_URL = 'https://ko-fi.com/arts44';
export const SOURCE_URL = 'https://github.com/Arts44/f1-uno-elite';

export function getStoredPinHash(){ return localStorage.getItem('f1uno_pin_hash')||''; }

/* Comparaison à TEMPS CONSTANT de deux empreintes hexadécimales.
   `a === b` s'arrête au premier caractère qui diffère : le temps de
   réponse fuit la longueur du préfixe commun, ce qui permet en théorie
   de reconstruire l'empreinte caractère par caractère. Le risque est
   faible ici — l'empreinte est déjà en clair dans le localStorage de la
   machine, donc quiconque peut mesurer peut aussi la lire — mais la
   correction ne coûte rien et supprime la question. */
export function timingSafeEqual(a, b){
  const x = String(a), y = String(b);
  // La longueur, elle, n'est pas un secret (SHA-256 hex = 64 partout).
  if(x.length !== y.length) return false;
  let diff = 0;
  for(let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}

let pinEntry = '';
let _authenticated = false;
export function setAuthenticated(v){ _authenticated = v; }

// SHA-256 helper using Web Crypto API
async function sha256(str){
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

// Console bypass protection
function _guard(){
  if(!_authenticated){
    console.warn('%c⛔ Accès refusé','color:red;font-size:20px;font-weight:bold');
    return false;
  }
  return true;
}
// Override console methods to require authentication
const _origLog=console.log;const _origWarn=console.warn;const _origError=console.error;
['log','warn','error','info','debug','table','dir','trace','group','groupEnd','time','timeEnd','assert','count','countReset','clear','profile','profileEnd'].forEach(m=>{
  const orig=console[m];
  if(typeof orig==='function'){
    console[m]=function(){
      if(!_authenticated && m!=='warn') return;
      return orig.apply(console,arguments);
    };
  }
});

/* ── Rendu des cases PIN ──
   Toutes les surfaces (écran de boot, overlay admin, flux de gestion)
   portent le même markup .pin-segs et sont repeintes ensemble — comme
   les anciens #dot-i, mais via les helpers purs du composant segmenté
   (masquage avec révélation brève du dernier chiffre). */
const PIN_LEN = 4;
const _SEGS_BOXES = '<div class="otp-boxes" aria-hidden="true">'
  + '<span class="otp-box"><span class="otp-caret"></span></span>'.repeat(PIN_LEN) + '</div>';
const _segsMarkup = () => `<div class="otp-wrap pin-segs">${_SEGS_BOXES}</div>`;
const _reduceMotion = () => typeof window !== 'undefined' && window.matchMedia
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let _segReveal = -1, _segRevealTimer = 0;

function updatePinDots() { // nom historique — repeint toutes les .pin-segs
  const active = segActiveIndex(pinEntry, PIN_LEN);
  document.querySelectorAll('.pin-segs').forEach(wrap => {
    wrap.classList.remove('seg-error', 'seg-success');
    wrap.querySelectorAll('.otp-box').forEach((b, i) => {
      const shown = segDisplay(pinEntry, i, { mask: true, revealIdx: _segReveal });
      const txt = b.lastChild && b.lastChild.nodeType === 3 ? b.lastChild : null;
      if((txt ? txt.data : '') !== shown){
        if(txt) txt.data = shown; else b.appendChild(document.createTextNode(shown));
        if(shown && !_reduceMotion()){ b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
      }
      b.classList.toggle('filled', !!pinEntry[i]);
      b.classList.toggle('active', i === active);
    });
  });
  // La touche « tout effacer » suit la saisie : présente à sa place,
  // sans effet quand il n'y a rien à effacer. Repeinte ICI parce que
  // c'est le seul endroit traversé par TOUTES les écritures de pinEntry.
  document.querySelectorAll('.pin-key.clear').forEach(k => {
    k.disabled = pinEntry.length === 0;
  });
}

// Échec : secousse + contour d'erreur (orange, jamais l'accent), message,
// puis saisie vidée — le comportement commun aux trois surfaces.
function _segsError(msg){
  clearTimeout(_segRevealTimer); _segReveal = -1; // un repaint différé effacerait la secousse
  document.querySelectorAll('.pin-segs').forEach(w => {
    w.classList.remove('seg-error'); void w.offsetWidth; w.classList.add('seg-error');
  });
  document.querySelectorAll('#pin-error').forEach(e => { e.textContent = msg; });
  setTimeout(() => { pinEntry = ''; _segReveal = -1; updatePinDots(); }, 700);
}

// Succès : vert bref et discret — un déverrouillage n'est pas une fête.
function _segsSuccess(){
  clearTimeout(_segRevealTimer); _segReveal = -1; // idem : le vert doit tenir le fondu
  document.querySelectorAll('.pin-segs').forEach(w => w.classList.add('seg-success'));
}

let _pinKeyProcessing = false;
export function pinKey(digit) {
  if (_pinKeyProcessing) return;
  _pinKeyProcessing = true;
  log('pinKey called with digit:', digit, 'current pinEntry:', pinEntry);
  if (pinEntry.length < 4) {
    pinEntry += digit;
    log('pinEntry after adding digit:', pinEntry);
    // révélation brève du chiffre tapé, puis masquage (comme l'OTP)
    clearTimeout(_segRevealTimer);
    _segReveal = pinEntry.length - 1;
    _segRevealTimer = setTimeout(() => { _segReveal = -1; updatePinDots(); }, _reduceMotion() ? 0 : 200);
    updatePinDots();
    if (pinEntry.length === 4) {
      checkPin();
    }
  }
  setTimeout(() => { _pinKeyProcessing = false; }, 50);
}

export function pinDel() {
  if (pinEntry.length > 0) {
    pinEntry = pinEntry.slice(0, -1);
    updatePinDots();
  }
}

/* ── Tout effacer (1.57.0) ──
   La case libre du pavé (3 × 4 : [⌫] [0] [trou]) reçoit UN rôle, et
   toujours le même : vider la saisie. Elle ne devient jamais « Retour »
   selon l'état — une touche qui change de sens entre deux appuis, au
   même endroit sous le même doigt, est un piège qui ne se voit qu'à
   l'usage. La navigation d'étape vit SOUS le pavé, en texte.
   Effacer une saisie n'ouvre aucune porte : la touche est donc présente
   partout, y compris au déverrouillage, où l'on tape le plus souvent. */
export function pinClear() {
  if (pinEntry.length === 0) return;
  pinEntry = '';
  _segReveal = -1;
  updatePinDots();
}

async function checkPin(opts={}) {
  // Setup wizard override
  if(window._setupCheckOverride){ await window._setupCheckOverride(); return; }
  // Admin overlay override
  if(window._adminOverlayActive && window._adminPinCallback){ await window._adminPinCallback(); return; }
  const hash = await sha256(pinEntry);
  const stored = getStoredPinHash();
  if (stored && timingSafeEqual(hash, stored)) {
    if(opts.onSuccess) { opts.onSuccess(pinEntry); pinEntry=''; return; }
    // Encrypted store: derive the key and decrypt BEFORE the app boots.
    // On failure (PIN/data desync, corruption) the ciphertexts are left
    // untouched and the user gets an explicit way out.
    if(isEncEnabled()){
      try {
        await unlockSecureStore(pinEntry);
      } catch(e){
        await _handleUnlockDecryptFailure();
        return;
      }
    }
    _segsSuccess(); // vert bref pendant le fondu — pas de célébration
    enterApp(false);
  } else {
    _segsError(opts.errorMsg || t('pin.wrong'));
  }
}

// Decryption failed at unlock: offer to continue with an empty
// collection so a backup can be restored — the undecryptable data is
// moved aside (f1uno_enc_orphan_*), never deleted. Cancel keeps the
// lock screen and every byte as it was.
async function _handleUnlockDecryptFailure(){
  pinEntry = '';
  updatePinDots();
  if(await confirmDialog(t('enc.err_unlock'), { danger:true })){
    quarantineEncryptedData();
    enterApp(false);
    showToast(t('enc.quarantined'));
  }
}

export function enterApp(viewer=false){
  // Viewer mode needs readable data, and without a PIN there is no key:
  // an encrypted store cannot be browsed anonymously.
  if(viewer && isEncEnabled()){ showToast(t('enc.viewer_blocked')); return; }
  setViewer(viewer);
  _authenticated = !viewer;
  pinEntry = '';
  const loginScreen = document.getElementById('login-screen');
  if(loginScreen){
    loginScreen.style.opacity='0';
    loginScreen.style.transition='opacity 0.4s ease';
    setTimeout(()=>{ loginScreen.style.display='none'; _launchApp(); }, 400);
  } else {
    _launchApp();
  }
}

function _launchApp(){
  const appWrapper = document.getElementById('app-wrapper');
  if(appWrapper) appWrapper.style.display='flex';
  // Force display of collection view
  const collectionView = document.getElementById('collectionView');
  if(collectionView) collectionView.style.display='block';
  initApp();
  if(isViewer()) _applyViewerMode();
  else maybeStartTutorial(); // no-op unless very first launch
}

function _applyViewerMode(){
  document.body.classList.add('viewer-mode');
  setSettingsTabLocked(true);
  // Always start on collection in viewer mode
  setCurrentView('collection');
  switchView('collection');
  showToast(t('toast.viewer'));
}

/* ── FIRST-LAUNCH LANGUAGE CHOICE ──
   Shown BEFORE the PIN setup, only when no language was ever chosen
   (no f1uno_lang key). Existing installs (setup done) never see it,
   even if they never touched the Settings language selector. */
export function needsLanguageChoice(){
  return !isSetupDone() && !localStorage.getItem('f1uno_lang');
}

/* Pastilles ISO typographiques (phase B) — les drapeaux émojis ne
   rendent pas pareil d'une plateforme à l'autre (et pas du tout sur
   Windows) ; le code ISO est neutre, lisible et thémable. Les drapeaux
   de nationalité SUR les cartes sont du contenu et restent. */
const LANG_ISO = {en:'EN',fr:'FR',es:'ES',zh:'中文',it:'IT',nl:'NL',de:'DE'};
// The prompt is deliberately shown in ALL 7 languages at once (plus the
// native language names): the screen is language-neutral by design, so
// there is no "wrong language flash" before the user chooses.
const LANG_PROMPTS = ['Choose your language','Choisis ta langue','Elige tu idioma','选择你的语言','Scegli la tua lingua','Kies je taal','Wähle deine Sprache'];

export function showLanguageScreen(){
  const ls = document.getElementById('login-screen');
  if(!ls) return;
  const buttons = Object.entries(LANGS).map(([code,label]) => `
      <button class="lang-opt" data-lang="${code}" type="button">
        <span class="lang-iso" aria-hidden="true" lang="${code}">${LANG_ISO[code]||code.toUpperCase()}</span>
        <span class="lang-name" lang="${code}">${label}</span>
      </button>`).join('');
  ls.querySelector('.login-box').innerHTML = `
    <span class="lockup lk-lg" aria-label="F1 UNO Élite"><span class="lk-top"><span class="lk-f1">F1</span><span class="lk-uno">UNO</span><span class="lk-elite">Élite</span></span><span class="lk-bar" aria-hidden="true"></span></span>
    <div class="lang-globe" aria-hidden="true">${icon('globe')}</div>
    <div class="lang-prompt">${LANG_PROMPTS.join(' · ')}</div>
    <div class="lang-grid" role="group" aria-label="Language">${buttons}</div>`;
  ls.querySelectorAll('.lang-opt').forEach(btn => btn.addEventListener('click', () => {
    const code = btn.getAttribute('data-lang');
    log('language chosen:', code);
    // Persist only — no full applyLanguage() re-render here: the app is
    // not initialized yet. The setup screen below renders through t()
    // in the chosen language, and initApp() applies it to everything.
    localStorage.setItem('f1uno_lang', code);
    document.documentElement.lang = code;
    showSetupScreen();
  }));
}

export function showSetupScreen(){
  const ls = document.getElementById('login-screen');
  if(!ls) return;
  ls.querySelector('.login-box').innerHTML = `
    <span class="lockup lk-lg" aria-label="F1 UNO Élite"><span class="lk-top"><span class="lk-f1">F1</span><span class="lk-uno">UNO</span><span class="lk-elite">Élite</span></span><span class="lk-bar" aria-hidden="true"></span></span>
    <div class="setup-title">${t('setup.welcome')}</div>
    <div class="setup-sub">${t('setup.subtitle')}</div>
    <div class="setup-btns">
      <button class="setup-btn primary" id="setupYesBtn" type="button">${t('setup.yes')}</button>
      <button class="setup-btn secondary" id="setupNoBtn" type="button">${t('setup.no')}</button>
    </div>`;
  document.getElementById('setupNoBtn').addEventListener('click', ()=>{
    localStorage.setItem('f1uno_pin_enabled','false');
    localStorage.setItem('f1uno_setup_done','true');
    enterApp(false);
  });
  document.getElementById('setupYesBtn').addEventListener('click', ()=>{ showSetupPinEntry(ls,''); });
}

function showSetupPinEntry(ls, subtitle){
  const box = ls.querySelector('.login-box') || ls;
  box.innerHTML = `
    <span class="lockup lk-lg" aria-label="F1 UNO Élite"><span class="lk-top"><span class="lk-f1">F1</span><span class="lk-uno">UNO</span><span class="lk-elite">Élite</span></span><span class="lk-bar" aria-hidden="true"></span></span>
    <div class="setup-title">${t('setup.choose')}</div>
    <div class="setup-sub" data-step="1">${subtitle||t('setup.enter')} <span class="pin-flow-num">1/2</span></div>
    ${_segsMarkup()}
    <div class="pin-keypad" id="pin-keypad">
      <button class="pin-key" data-digit="1" type="button">1</button>
      <button class="pin-key" data-digit="2" type="button">2</button>
      <button class="pin-key" data-digit="3" type="button">3</button>
      <button class="pin-key" data-digit="4" type="button">4</button>
      <button class="pin-key" data-digit="5" type="button">5</button>
      <button class="pin-key" data-digit="6" type="button">6</button>
      <button class="pin-key" data-digit="7" type="button">7</button>
      <button class="pin-key" data-digit="8" type="button">8</button>
      <button class="pin-key" data-digit="9" type="button">9</button>
      <button class="pin-key del" data-action="pinDel" type="button">⌫</button>
      <button class="pin-key zero" data-digit="0" type="button">0</button>
        <button class="pin-key clear" data-action="pinClear" type="button" disabled aria-label="${t('pin.clear')}">${icon('xCircle')}</button>
    </div>
    <div class="pin-error-msg" id="pin-error"></div>
    <button class="pin-flow-cancel" id="setupBackBtn" type="button"></button>`;
  pinEntry = '';

  /* ── La marche arrière de la création (1.57.0) ──
     Il n'y en avait AUCUNE. Une fois les 4 premiers chiffres saisis, on
     basculait en 2/2 sans retour possible : ni vers 1/2 pour changer de
     code, ni vers la question « veux-tu un code ? ». La seule issue
     était de taper 4 chiffres FAUX exprès pour provoquer l'erreur qui
     ramène à 1/2. C'était le vrai manque, sous la demande d'une touche.
     Le bouton vit SOUS le pavé, en texte, comme « Annuler » ailleurs :
     la navigation d'étape ne partage jamais un doigt avec les chiffres. */
  const back = box.querySelector('#setupBackBtn');
  const paintBack = () => {
    const confirming = window._setupPhase === 'confirm';
    back.textContent = confirming ? t('pin.step_back') : t('pin.back_to_choice');
  };
  const toStep1 = () => {
    window._setupPhase = 'enter';
    window._setupFirstPin = '';
    pinEntry = '';
    box.querySelector('.setup-sub').innerHTML = `${t('setup.enter')} <span class="pin-flow-num">1/2</span>`;
    box.querySelector('#pin-error').textContent = '';
    updatePinDots();
    paintBack();
  };
  back.addEventListener('click', e => {
    e.stopPropagation();
    if(window._setupPhase === 'confirm') toStep1();
    else {
      // Sortie du tunnel : on rend la main à la question d'origine.
      window._setupCheckOverride = null;
      window._setupPhase = null;
      window._setupFirstPin = '';
      pinEntry = '';
      showSetupScreen();
    }
  });

  // Override checkPin to do setup-confirm flow
  window._setupPhase = 'enter';
  window._setupFirstPin = '';
  paintBack();
  window._setupCheckOverride = async ()=>{
    if(window._setupPhase === 'enter'){
      window._setupFirstPin = pinEntry;
      window._setupPhase = 'confirm';
      pinEntry = '';
      box.querySelector('.setup-sub').innerHTML = `${t('setup.confirm')} <span class="pin-flow-num">2/2</span>`;
      updatePinDots();
      paintBack();
    } else {
      if(pinEntry === window._setupFirstPin){
        const hash = await sha256(pinEntry);
        localStorage.setItem('f1uno_pin_hash', hash);
        localStorage.setItem('f1uno_pin_enabled','true');
        localStorage.setItem('f1uno_setup_done','true');
        window._setupCheckOverride = null;
        window._setupPhase = null;
        _segsSuccess();
        enterApp(false);
      } else {
        window._setupPhase = 'enter';
        window._setupFirstPin = '';
        box.querySelector('.setup-sub').innerHTML = `${t('setup.enter')} <span class="pin-flow-num">1/2</span>`;
        paintBack();
        _segsError(t('setup.mismatch'));
      }
    }
  };
}

// Pristine login-box markup, captured at module load BEFORE any boot
// flow (language chooser / setup wizard) rewrites it — restored on lock
// so the PIN keypad is always what comes back.
const _LOGIN_BOX_HTML = (typeof document !== 'undefined'
  && document.getElementById('login-screen')?.querySelector('.login-box')?.innerHTML) || '';

export function lockApp() {
  if(!isPinEnabled()) return; // no lock if PIN disabled
  log('lockApp: hot lock (no reload)');
  // 1. Drop every privilege FIRST — the console guard re-arms here.
  _authenticated = false;
  setViewer(false);
  pinEntry = '';
  window._adminOverlayActive = false;
  window._adminPinCallback = null;
  // 2. Close anything that could sit above (or leak behind) the lock
  //    screen: card modal, admin overlay, import dialogs.
  try { closeMo(); } catch(e){}
  document.getElementById('admin-pin-overlay')?.remove();
  document.querySelectorAll('.import-dialog-overlay').forEach(o => o.remove());
  // Viewer-mode leftovers (the reload used to clear these implicitly)
  document.body.classList.remove('viewer-mode');
  setSettingsTabLocked(false);
  // 3. Reset the view so the next unlock starts on a clean collection
  setCurrentView('collection');
  try { switchView('collection'); } catch(e){}
  // 4. Hide the app, restore + show the PIN screen instantly
  const app = document.getElementById('app-wrapper');
  if(app) app.style.display = 'none';
  const ls = document.getElementById('login-screen');
  if(!ls) return;
  const box = ls.querySelector('.login-box');
  if(box && _LOGIN_BOX_HTML){
    box.innerHTML = _LOGIN_BOX_HTML; // pristine keypad markup
    // Re-translate the restored static markup (it carries data-i18n)
    box.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.getAttribute('data-i18n')); });
    box.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria'))); });
    // Keypad digits/delete are document-delegated; only the viewer
    // browse button has a direct binding → rebind + visibility.
    _bindViewerBrowseBtn();
    const vb = document.getElementById('viewerBrowseBtn');
    if(vb) vb.style.display = isViewerModeAllowed() ? '' : 'none';
  }
  updatePinDots();
  const err = document.getElementById('pin-error');
  if(err) err.textContent = '';
  ls.style.display = '';
  ls.style.opacity = '1';
}

/* ══════════════════════════════════════════════════════════
   TRADUCTION DE L'ÉCRAN DE VERROUILLAGE

   MESURÉ, et contraire à ce qu'on croyait : quand un PIN est actif,
   le démarrage ne fait RIEN — applyLanguage() n'est appelée que dans
   initApp(), qui ne tourne qu'après le déverrouillage. L'écran de
   verrouillage restait donc dans la langue écrite en dur dans le
   HTML, pour tout le monde. Vérifié au navigateur : en chinois comme
   en français, `document.documentElement.lang` valait « en » et le
   titre affichait « PIN Code ».

   On ne peut pas appeler applyLanguage() ici : elle re-rend la
   collection, les stats et les badges, dont les données ne sont pas
   encore chargées. On traduit donc le seul écran visible — la même
   opération que lockApp() fait déjà sur la boîte restaurée.
   ══════════════════════════════════════════════════════════ */
export function applyLoginI18n(){
  const ls = document.getElementById('login-screen');
  if(!ls) return;
  document.documentElement.lang = getLang();
  ls.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.getAttribute('data-i18n')); });
  ls.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria'))); });
  ls.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.getAttribute('data-i18n-placeholder')); });
}

/* ══════════════════════════════════════════════════════════
   VIEWER BROWSE BUTTON BINDING
   ══════════════════════════════════════════════════════════ */
export function _bindViewerBrowseBtn(){
  const btn = document.getElementById('viewerBrowseBtn');
  if(btn) btn.addEventListener('click', ()=> enterApp(true));
}

/* ══════════════════════════════════════════════════════════
   SETTINGS PIN MANAGEMENT
   ══════════════════════════════════════════════════════════ */
/* ── PIN re-entry overlay ──
   Same keypad flow as the admin overlay (reuses its id so the global
   keyboard handler and lockApp cleanup apply), but on success it hands
   the PIN IN CLEAR to the callback — needed to derive the encryption
   key, which the stored hash cannot provide. */
function _askPin(onOk){
  const overlay = document.createElement('div');
  overlay.id = 'admin-pin-overlay';
  overlay.style.cssText='position:fixed;inset:0;background:var(--bg);display:flex;align-items:center;justify-content:center;z-index:9999;flex-direction:column;';
  overlay.innerHTML=`
    <div class="login-box">
      <div class="pin-label" style="margin-top:8px">${t('enc.pin_confirm')}</div>
      ${_segsMarkup()}
      <div class="pin-keypad">
        ${[1,2,3,4,5,6,7,8,9].map(d=>`<button class="pin-key" data-digit="${d}" type="button">${d}</button>`).join('')}
        <button class="pin-key del" data-action="pinDel" type="button">⌫</button>
        <button class="pin-key zero" data-digit="0" type="button">0</button>
        <button class="pin-key clear" data-action="pinClear" type="button" disabled aria-label="${t('pin.clear')}">${icon('xCircle')}</button>
      </div>
      <div class="pin-error-msg" id="pin-error"></div>
      <button style="background:none;border:1.5px solid var(--border);border-radius:100px;color:var(--tx2);font-size:12px;font-weight:600;padding:7px 18px;cursor:pointer;font-family:var(--font-b);margin-top:14px;" id="askPinCancelBtn">${t('adm.cancel')}</button>
    </div>`;
  document.body.appendChild(overlay);
  pinEntry='';
  const close = ()=>{
    overlay.remove();
    pinEntry='';
    window._adminOverlayActive = false;
    window._adminPinCallback = null;
  };
  overlay.querySelector('#askPinCancelBtn').addEventListener('click', e=>{ e.stopPropagation(); close(); });
  window._adminOverlayActive = true;
  window._adminPinCallback = async ()=>{
    const hash = await sha256(pinEntry);
    if(timingSafeEqual(hash, getStoredPinHash())){
      const pin = pinEntry;
      close();
      await onOk(pin);
    } else {
      _segsError(t('pin.wrong'));
    }
  };
}

/* ── Flux PIN à étapes (créer / changer / désactiver) ──
   Un seul moteur : plein écran, pavé numérique, cases segmentées,
   titre + intitulé d'étape + progression « 2/3 » visible, erreurs en
   ligne (secousse orange + message). Auto-avance à 4 chiffres via le
   hook _adminPinCallback — le même que l'overlay admin, donc lockApp
   sait déjà nettoyer cet écran. check() renvoie true, ou
   { err:'clé i18n', goto:index } pour rejouer une étape. */
function _pinFlow(title, steps, onDone){
  const overlay = document.createElement('div');
  overlay.id = 'admin-pin-overlay';
  overlay.style.cssText='position:fixed;inset:0;background:var(--bg);display:flex;align-items:center;justify-content:center;z-index:9999;flex-direction:column;';
  overlay.innerHTML=`
    <div class="login-box">
      <svg class="pin-lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      <div class="pin-flow-title">${title}</div>
      <div class="pin-flow-step"><span id="pinFlowPrompt"></span> <span class="pin-flow-num" id="pinFlowNum"></span></div>
      ${_segsMarkup()}
      <div class="pin-keypad">
        ${[1,2,3,4,5,6,7,8,9].map(d=>`<button class="pin-key" data-digit="${d}" type="button">${d}</button>`).join('')}
        <button class="pin-key del" data-action="pinDel" type="button">⌫</button>
        <button class="pin-key zero" data-digit="0" type="button">0</button>
        <button class="pin-key clear" data-action="pinClear" type="button" disabled aria-label="${t('pin.clear')}">${icon('xCircle')}</button>
      </div>
      <div class="pin-error-msg" id="pin-error" role="alert" aria-live="assertive"></div>
      <div class="pin-flow-actions">
        <button class="pin-flow-cancel" id="pinFlowBack" type="button" hidden>${t('pin.step_back')}</button>
        <button class="pin-flow-cancel" id="pinFlowCancel" type="button">${t('adm.cancel')}</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  let idx = 0; const ctx = {};
  /* Le retour n'existe QU'À partir de la 2e étape : à la première, il n'y
     a rien derrière — « Annuler » est déjà la sortie. Un bouton présent
     mais inerte y mentirait sur ce qui est possible. */
  const setStep = () => {
    overlay.querySelector('#pinFlowPrompt').textContent = t(steps[idx].prompt);
    overlay.querySelector('#pinFlowNum').textContent = `${idx+1}/${steps.length}`;
    overlay.querySelector('#pin-error').textContent = ''; // l'erreur appartient à SON étape
    overlay.querySelector('#pinFlowBack').hidden = idx === 0;
    pinEntry = ''; _segReveal = -1; updatePinDots();
  };
  overlay.querySelector('#pinFlowBack').addEventListener('click', e => {
    e.stopPropagation();
    if(idx > 0){ idx--; setStep(); }
  });
  const close = () => {
    overlay.remove(); pinEntry = '';
    window._adminOverlayActive = false;
    window._adminPinCallback = null;
  };
  overlay.querySelector('#pinFlowCancel').addEventListener('click', e => { e.stopPropagation(); close(); });
  window._adminOverlayActive = true;
  window._adminPinCallback = async () => {
    const res = await steps[idx].check(pinEntry, ctx);
    if(res === true){
      idx++;
      if(idx >= steps.length){ close(); await onDone(ctx); }
      else setStep();
    } else {
      if(typeof res.goto === 'number') idx = res.goto;
      overlay.querySelector('#pinFlowPrompt').textContent = t(steps[idx].prompt);
      overlay.querySelector('#pinFlowNum').textContent = `${idx+1}/${steps.length}`;
      _segsError(t(res.err || 'pin.wrong'));
    }
  };
  setStep();
}

// Les trois briques d'étape partagées
const _stepVerify = { prompt: 'pin.flow_verify', check: async pin =>
  timingSafeEqual(await sha256(pin), getStoredPinHash()) ? true : { err: 'pin.wrong' } };
const _stepNew = { prompt: 's.new_pin', check: (pin, ctx) => { ctx.pin = pin; return true; } };
const _stepConfirm = goto => ({ prompt: 's.confirm_pin', check: (pin, ctx) =>
  pin === ctx.pin ? true : { err: 'pin.mismatch', goto } });

export function showAdminPinScreen(){
  // When in viewer mode, show a PIN overlay to switch to admin
  const overlay = document.createElement('div');
  overlay.id = 'admin-pin-overlay';
  overlay.style.cssText='position:fixed;inset:0;background:var(--bg);display:flex;align-items:center;justify-content:center;z-index:9999;flex-direction:column;';
  overlay.innerHTML=`
    <div class="login-box">
      <span class="lockup lk-lg" aria-label="F1 UNO Élite"><span class="lk-top"><span class="lk-f1">F1</span><span class="lk-uno">UNO</span><span class="lk-elite">Élite</span></span><span class="lk-bar" aria-hidden="true"></span></span>
      <div class="pin-label" style="margin-top:16px">${t('adm.title')}</div>
      ${_segsMarkup()}
      <div class="pin-keypad" id="pin-keypad">
        <button class="pin-key" data-digit="1" type="button">1</button>
        <button class="pin-key" data-digit="2" type="button">2</button>
        <button class="pin-key" data-digit="3" type="button">3</button>
        <button class="pin-key" data-digit="4" type="button">4</button>
        <button class="pin-key" data-digit="5" type="button">5</button>
        <button class="pin-key" data-digit="6" type="button">6</button>
        <button class="pin-key" data-digit="7" type="button">7</button>
        <button class="pin-key" data-digit="8" type="button">8</button>
        <button class="pin-key" data-digit="9" type="button">9</button>
        <button class="pin-key del" data-action="pinDel" type="button">⌫</button>
        <button class="pin-key zero" data-digit="0" type="button">0</button>
        <button class="pin-key clear" data-action="pinClear" type="button" disabled aria-label="${t('pin.clear')}">${icon('xCircle')}</button>
      </div>
      <div class="pin-error-msg" id="pin-error"></div>
      <div style="display:flex;gap:10px;margin-top:14px;width:100%;justify-content:center;">
        <button style="background:none;border:1.5px solid var(--border);border-radius:100px;color:var(--tx2);font-size:12px;font-weight:600;padding:7px 18px;cursor:pointer;font-family:var(--font-b);" id="adminCancelBtn">${t('adm.cancel')}</button>
        <button style="background:none;border:1.5px solid var(--border);border-radius:100px;color:var(--red);font-size:12px;font-weight:600;padding:7px 18px;cursor:pointer;font-family:var(--font-b);" id="adminLockBtn">${t('adm.lock')}</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  pinEntry='';
  document.getElementById('adminCancelBtn').addEventListener('click', e=>{
    e.stopPropagation();
    overlay.remove();
    pinEntry='';
    window._adminOverlayActive = false;
    window._adminPinCallback = null;
    switchView(currentView === 'settings' ? 'collection' : currentView);
  });
  document.getElementById('adminLockBtn').addEventListener('click', e=>{
    e.stopPropagation();
    overlay.remove();
    window._adminOverlayActive = false;
    window._adminPinCallback = null;
    lockApp();
  });
  // checkPin will now authenticate against stored hash
  window._adminOverlayActive = true;
  window._adminPinCallback = async ()=>{
    const hash = await sha256(pinEntry);
    if(timingSafeEqual(hash, getStoredPinHash())){
      overlay.remove();
      window._adminOverlayActive = false;
      window._adminPinCallback = null;
      setViewer(false);
      _authenticated = true;
      document.body.classList.remove('viewer-mode');
      setSettingsTabLocked(false);
      pinEntry='';
      switchView('settings');
      showToast(t('adm.ok'));
    } else {
      _segsError(t('pin.wrong'));
    }
  };
}

/* ── Font themes (display + body pairs, all self-hosted / OFL).
   Names are proper nouns, shared across languages. The driver-number
   identity fonts (Orbitron / Racing Sans One) are NOT part of this. ── */
const FONT_THEMES = [
  { id:'circuit',  name:'Circuit',  display:"'Space Grotesk',sans-serif", body:"'Inter',sans-serif" },
  { id:'sprint',   name:'Sprint',   display:"'Chakra Petch',sans-serif",  body:"'IBM Plex Sans',sans-serif" },
  { id:'prestige', name:'Prestige', display:"'Fraunces',serif",           body:"'Source Sans 3',sans-serif" },
  { id:'minimal',  name:'Minimal',  display:"'Manrope',sans-serif",       body:"'Manrope',sans-serif" },
  { id:'original', name:'Original', display:"'Syne',sans-serif",          body:"'DM Sans',sans-serif" },
];
export function getFontTheme(){ return localStorage.getItem('f1uno_font') || 'circuit'; }
export function setFontTheme(id){
  localStorage.setItem('f1uno_font', id);
  _applyFontVars(id);
  _ensureFontLoaded(id); // fetch/decode the WOFF2 now so the swap is immediate
}

// Apply the theme by writing --font-d/--font-b INLINE on <html>, so the font
// switches even if the stylesheet's :root[data-font=…] rules are missing or
// stale (e.g. a cache-first SW serving an old styles.css alongside new JS —
// the exact "attribute changes but vars don't" failure). The data-font
// attribute is still set for any CSS that hooks off it, but the JS map is the
// source of truth. Falls back to the CSS default rule for an unknown id.
function _applyFontVars(id){
  const el = document.documentElement;
  el.setAttribute('data-font', id);
  const theme = FONT_THEMES.find(f => f.id === id);
  if(theme){
    el.style.setProperty('--font-d', theme.display);
    el.style.setProperty('--font-b', theme.body);
  } else {
    el.style.removeProperty('--font-d');
    el.style.removeProperty('--font-b');
  }
}

// Re-assert the persisted font on app start (the tiny inline boot script in
// index*.html already sets it pre-render to avoid a flash; this makes the
// module the authority and covers the case where the boot script was absent).
export function applySavedFont(){ _applyFontVars(getFontTheme()); }

// Non-default themes are lazy (only the default pair is precached). Passively
// relying on the CSS-variable flip to trigger the download can leave freshly
// picked text on the fallback face until a reflow — so we proactively load the
// theme's display+body faces at the weights the app uses (body 400, titles 700).
function _ensureFontLoaded(id){
  if(!document.fonts || typeof document.fonts.load !== 'function') return;
  const theme = FONT_THEMES.find(f => f.id === id);
  if(!theme) return;
  const families = [...new Set([theme.display, theme.body].map(s => s.split(',')[0].trim()))];
  families.forEach(fam => {
    document.fonts.load(`400 1em ${fam}`).catch(()=>{});
    document.fonts.load(`700 1em ${fam}`).catch(()=>{});
  });
}


export function renderSettings(){
  const el = document.getElementById('settingsView');
  if(!el) return;

  // Ensure collectionView is hidden when rendering settings
  const collectionView = document.getElementById('collectionView');
  if(collectionView) collectionView.style.display = 'none';

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const pinOn = isPinEnabled();
  const viewerOn = isViewerModeAllowed();

  const langOptions = Object.entries(LANGS).map(([code,label])=>
    `<option value="${code}"${getLang()===code?' selected':''}>${label}</option>`
  ).join('');

  el.innerHTML = pageHeadHTML({
    icon: 'settings',
    title: t('nav.settings'),
    sub: t('ph.set_sub', { v: APP_VERSION })
  }) + `

    <div class="setv-section set-appearance">
      <div class="setv-section-title">${icon('palette')} ${t('s.appearance')}</div>
      <div class="setv-row">
        <div class="setv-row-left">
          <div class="setv-row-label">${t('s.dark')}</div>
          <div class="setv-row-sub">${t('s.dark_sub')}</div>
        </div>
        <button class="setv-toggle${isDark?' on':''}" data-action="toggleTheme"></button>
      </div>
      <div class="setv-row">
        <div class="setv-row-left">
          <div class="setv-row-label">${t('s.lang')}</div>
          <div class="setv-row-sub">${t('s.lang_sub')}</div>
        </div>
        <select class="setv-lang-sel" id="langSel">${langOptions}</select>
      </div>
      <div class="setv-row" style="flex-direction:column;align-items:stretch;gap:10px;">
        <div class="setv-row-left">
          <div class="setv-row-label">${t('s.font')}</div>
          <div class="setv-row-sub">${t('s.font_sub')}</div>
        </div>
        <div class="font-picker" id="fontPicker">
          ${FONT_THEMES.map(f=>`
          <button class="font-opt${getFontTheme()===f.id?' active':''}" data-font-id="${f.id}" type="button">
            <span class="font-opt-name" style="font-family:${f.display}">${f.name}</span>
            <span class="font-opt-sample" style="font-family:${f.body}">Aa Bb 0123 ★</span>
          </button>`).join('')}
        </div>
      </div>
      <div class="setv-row">
        <div class="setv-row-left">
          <div class="setv-row-label">${t('s.replay_tut')}</div>
          <div class="setv-row-sub">${t('s.replay_tut_sub')}</div>
        </div>
        <button class="setv-btn" id="replayTutBtn">${t('s.replay_tut_btn')}</button>
      </div>
    </div>

    ${installRowHTML()}

    <div class="setv-section set-security">
      <div class="setv-section-title">${icon('shield')} ${t('s.security')}</div>
      <div class="setv-row">
        <div class="setv-row-left">
          <div class="setv-row-label">${t('s.pin')} <span class="sec-chip${pinOn?' on':''}">${t(pinOn?'pin.state_on':'pin.state_off')}</span></div>
          <div class="setv-row-sub">${t('s.pin_sub')}</div>
        </div>
        <button class="setv-toggle${pinOn?' on':''}" id="pinToggle"></button>
      </div>
      ${pinOn ? `
      <div class="setv-row">
        <div class="setv-row-left">
          <div class="setv-row-label">${t('s.change_pin')}</div>
          <div class="setv-row-sub">${t('pin.change_sub')}</div>
        </div>
        <button class="setv-btn" id="showChangePinBtn">${t('s.change_btn')}</button>
      </div>
      <div class="setv-row">
        <div class="setv-row-left">
          <div class="setv-row-label">${t('s.enc')}</div>
          <div class="setv-row-sub">${isEncEnabled()?t('s.enc_on_sub'):t('s.enc_sub')}</div>
        </div>
        <button class="setv-toggle${isEncEnabled()?' on':''}" id="encToggle"></button>
      </div>
      <div class="setv-row">
        <div class="setv-row-left">
          <div class="setv-row-label">${t('s.viewer')}</div>
          <div class="setv-row-sub">${isEncEnabled()?t('enc.viewer_blocked'):t('s.viewer_sub')}</div>
        </div>
        <button class="setv-toggle${viewerOn?' on':''}" id="viewerToggle"${isEncEnabled()?' disabled style="opacity:0.4;pointer-events:none;"':''}></button>
      </div>` : `
      <div class="setv-row" style="opacity:0.4;pointer-events:none;">
        <div class="setv-row-left">
          <div class="setv-row-label">${t('s.viewer')}</div>
          <div class="setv-row-sub">${t('s.viewer_off')}</div>
        </div>
        <button class="setv-toggle" disabled></button>
      </div>`}
    </div>


    <div class="setv-section set-about">
      <div class="setv-section-title">${icon('info')} ${t('s.about')}</div>
      <div class="setv-row">
        <div class="setv-row-left">
          <div class="setv-row-label">${t('s.version')}</div>
          <div class="setv-row-sub">F1 UNO Élite — Collection Tracker</div>
        </div>
        <span class="setv-version">${APP_VERSION}</span>
      </div>
      <div class="setv-row">
        <div class="setv-row-left">
          <div class="setv-row-label">${t('upd.whatsnew')}</div>
          <div class="setv-row-sub">${t('s.changelog_sub')}</div>
        </div>
        <button class="setv-btn" id="changelogBtn">${t('s.changelog_btn')}</button>
      </div>
      ${isUpdateCheckSupported() ? `
      <div class="setv-row">
        <div class="setv-row-left">
          <div class="setv-row-label">${t('s.check_upd')}</div>
          <div class="setv-row-sub" id="checkUpdMsg">${t('s.check_upd_sub')}</div>
        </div>
        <button class="setv-btn" id="checkUpdBtn">${t('upd.check_btn')}</button>
      </div>` : ''}
      ${SUPPORT_URL ? `
      <div class="setv-row support-row" id="supportRow">
        <div class="setv-row-left">
          <div class="setv-row-label">${icon('handshake')} ${t('s.support')}</div>
          <div class="setv-row-sub">${t('s.support_sub')}</div>
        </div>
        <a class="setv-btn" id="supportBtn" href="${SUPPORT_URL}"
           target="_blank" rel="noopener noreferrer">${t('s.support_btn')}</a>
      </div>` : ''}
      ${SOURCE_URL ? `
      <div class="setv-row support-row" id="sourceRow">
        <div class="setv-row-left">
          <div class="setv-row-label">${t('s.source_label')}</div>
          <div class="setv-row-sub">${t('s.source_note')}</div>
        </div>
        <a class="setv-btn" id="sourceBtn" href="${SOURCE_URL}"
           target="_blank" rel="noopener noreferrer">${t('s.source_btn')}</a>
      </div>` : ''}
    </div>

    ${pinOn ? `
    <div class="setv-section set-session">
      <div class="setv-section-title">${icon('lock')} ${t('s.session')}</div>
      <div class="setv-row">
        <div class="setv-row-left">
          <div class="setv-row-label">${t('s.lock')}</div>
          <div class="setv-row-sub">${t('s.lock_sub')}</div>
        </div>
        <button class="setv-btn danger" id="settingsLockBtn">${t('s.lock_btn')}</button>
      </div>
    </div>` : ''}
  `;

  // — Bindings —
  el.querySelector('#pinToggle')?.addEventListener('click', async ()=>{
    if(pinOn){
      // Désactiver : avertissement, puis VÉRIFICATION du code — un
      // simple « OK » ne suffit plus pour retirer une protection.
      // Le déchiffrement repasse tout en clair AVANT de jeter la clé
      // (sans PIN, pas de clé : des données chiffrées seraient perdues).
      if(!await confirmDialog(t('pin.disable'), { danger:true })) return;
      _pinFlow(t('pin.flow_disable'), [_stepVerify], async ()=>{
        if(isEncEnabled()){
          try {
            await disableEncryption();
            showToast(t('enc.off_done'));
          } catch(e){
            console.error('encryption disable failed — PIN kept enabled', e);
            showToast(t('enc.err_generic'));
            return;
          }
        }
        localStorage.setItem('f1uno_pin_enabled','false');
        localStorage.removeItem('f1uno_pin_hash');
        renderSettings();
        showToast(t('pin.off_done'));
      });
    } else {
      // Activer : nouveau code + confirmation (2 étapes)
      _pinFlow(t('pin.set_title'), [_stepNew, _stepConfirm(0)], async ctx=>{
        const hash = await sha256(ctx.pin);
        localStorage.setItem('f1uno_pin_hash', hash);
        localStorage.setItem('f1uno_pin_enabled','true');
        showToast(t('toast.pin_on'));
        renderSettings();
      });
    }
  });

  // Changer : ancien code → nouveau → confirmation (3 étapes)
  el.querySelector('#showChangePinBtn')?.addEventListener('click', ()=>{
    _pinFlow(t('s.change_pin'), [_stepVerify, _stepNew, _stepConfirm(1)], async ctx=>{
      const hash = await sha256(ctx.pin);
      // Re-encrypt under the new PIN BEFORE the hash is replaced: if the
      // re-key fails, the old PIN must still open the old ciphertexts.
      if(isEncEnabled()){
        try {
          await rekeyEncryption(ctx.pin);
        } catch(e){
          console.error('re-key failed — PIN unchanged', e);
          showToast(t('enc.err_generic'));
          return;
        }
      }
      localStorage.setItem('f1uno_pin_hash', hash);
      showToast(t('pin.saved'));
    });
  });

  el.querySelector('#viewerToggle')?.addEventListener('click', ()=>{
    localStorage.setItem('f1uno_viewer_enabled', viewerOn?'false':'true');
    renderSettings();
    showToast(viewerOn?t('toast.viewer_off'):t('toast.viewer_on'));
  });

  // — Local data encryption (needs the PIN in clear to derive the key,
  //   so enabling re-asks it on the keypad) —
  el.querySelector('#encToggle')?.addEventListener('click', async ()=>{
    if(isEncEnabled()){
      if(!await confirmDialog(t('enc.off_confirm'), { danger:true })) return;
      disableEncryption()
        .then(()=>{ renderSettings(); showToast(t('enc.off_done')); })
        .catch(e=>{ console.error('encryption disable failed', e); showToast(t('enc.err_generic')); });
    } else {
      // The warning is the contract: forgotten PIN = unrecoverable local
      // data, so back up first. Explicit confirmation required.
      if(!await confirmDialog(t('enc.warn'), { danger:true })) return;
      _askPin(async pin => {
        try {
          await enableEncryption(pin);
          renderSettings();
          showToast(t('enc.on_done'));
        } catch(e){
          console.error('encryption enable failed — data left in clear', e);
          showToast(t('enc.err_generic'));
        }
      });
    }
  });

  el.querySelector('#settingsLockBtn')?.addEventListener('click', lockApp);
  el.querySelector('#changelogBtn')?.addEventListener('click', () => openChangelog());

  /* Hors ligne : un lien externe qui ne mène nulle part vaut moins
     qu'un lien qui le dit. On le désactive et on l'explique, plutôt
     que de laisser l'utilisateur tomber sur la page d'erreur du
     navigateur. L'état se remet à jour dès le retour du réseau —
     l'app est hors-ligne d'abord, ce cas est la norme, pas l'exception. */
  /* Les deux liens vivent maintenant sur DEUX lignes (une ligne = une
     action). Le sélecteur porte donc sur la classe partagée, pas sur un
     id : avec `#supportRow` seul, la ligne « Code source » serait restée
     cliquable hors ligne — le bug que ce découpage aurait introduit. */
  const rows = [...el.querySelectorAll('.support-row')].map(row => ({
    lien: row.querySelector('.setv-btn'),
    sub: row.querySelector('.setv-row-sub'),
    // chaque ligne retrouve SON texte : le sous-titre n'est plus partagé
    cle: row.id === 'sourceRow' ? 's.source_note' : 's.support_sub',
  })).filter(r => r.lien);
  if(rows.length){
    const online = () => {
      const up = navigator.onLine !== false;
      rows.forEach(({ lien, sub, cle }) => {
        lien.classList.toggle('is-off', !up);
        lien.setAttribute('aria-disabled', up ? 'false' : 'true');
        if(sub) sub.textContent = up ? t(cle) : t('s.support_offline');
      });
    };
    online();
    rows.forEach(({ lien }) => lien.addEventListener('click', e => {
      if(navigator.onLine === false) e.preventDefault();
    }));
    window.addEventListener('online', online);
    window.addEventListener('offline', online);
  }

  // — Manual update check: reuses the automatic mechanism; if a new
  //   version is found, the existing "reload" banner takes over —
  el.querySelector('#checkUpdBtn')?.addEventListener('click', async () => {
    const btn = el.querySelector('#checkUpdBtn');
    const msg = el.querySelector('#checkUpdMsg');
    if(!btn || btn.disabled) return;
    btn.disabled = true;
    msg.textContent = t('upd.checking');
    const outcome = await checkForUpdatesNow();
    const MSG_KEYS = {
      uptodate: 'upd.uptodate',
      found: 'upd.found_msg',
      offline: 'upd.check_err',
      error: 'upd.check_err',
      cooldown: 'upd.cooldown',
      unsupported: 'upd.check_err',
    };
    msg.textContent = t(MSG_KEYS[outcome] || 'upd.check_err');
    // Short cooldown against rapid-fire checks; the message then resets.
    setTimeout(() => {
      if(el.querySelector('#checkUpdMsg')) el.querySelector('#checkUpdMsg').textContent = t('s.check_upd_sub');
      if(el.querySelector('#checkUpdBtn')) el.querySelector('#checkUpdBtn').disabled = false;
    }, 6000);
  });

  el.querySelector('#replayTutBtn')?.addEventListener('click', ()=> startTutorial());
  bindInstallRow();

  const langSel = el.querySelector('#langSel');
  if(langSel) langSel.addEventListener('change', e=>setLang(e.target.value));

  // — Font theme picker: immediate apply (CSS vars) + persistence —
  el.querySelectorAll('#fontPicker .font-opt').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      setFontTheme(btn.getAttribute('data-font-id'));
      el.querySelectorAll('#fontPicker .font-opt').forEach(b=>b.classList.toggle('active', b===btn));
    });
  });
}

