/* ══════════════════════════════════════════════════════════
   PIN / AUTH — login, setup wizard, viewer & admin modes,
   settings screen. PIN is SHA-256 hashed in localStorage.
   ══════════════════════════════════════════════════════════ */
import { log } from './logger.js';
import { t, LANGS, getLang, setLang } from './i18n.js';
import { switchView, showToast, toggleTheme, currentView, setCurrentView, closeMo, setSettingsTabLocked, confirmDialog } from './render.js';
import { initApp } from './app.js';
import { maybeStartTutorial, startTutorial } from './tutorial.js';
import { installRowHTML, bindInstallRow } from './install.js';
import { openChangelog, checkForUpdatesNow, isUpdateCheckSupported } from './update.js';
import { APP_VERSION } from './changelog.js';
import {
  isEncEnabled, unlockSecureStore, enableEncryption, disableEncryption,
  rekeyEncryption, quarantineEncryptedData
} from './secure-store.js';

// PIN storage helpers (localStorage-based, SHA-256 hashed)
export function isPinEnabled(){ return localStorage.getItem('f1uno_pin_enabled')==='true'; }
export function isSetupDone(){ return localStorage.getItem('f1uno_setup_done')==='true'; }
export function isViewerModeAllowed(){ return localStorage.getItem('f1uno_viewer_enabled')==='true'; }
export function getStoredPinHash(){ return localStorage.getItem('f1uno_pin_hash')||''; }

let pinEntry = '';
let _authenticated = false;
export let isViewerMode = false;
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

function updatePinDots() {
  for (let i = 0; i < 4; i++) {
    // querySelectorAll so we update both login screen AND admin overlay if both in DOM
    document.querySelectorAll('#dot-' + i).forEach(dot => {
      if (i < pinEntry.length) {
        dot.classList.add('filled');
        dot.classList.remove('error');
      } else {
        dot.classList.remove('filled', 'error');
      }
    });
  }
}

let _pinKeyProcessing = false;
export function pinKey(digit) {
  if (_pinKeyProcessing) return;
  _pinKeyProcessing = true;
  log('pinKey called with digit:', digit, 'current pinEntry:', pinEntry);
  if (pinEntry.length < 4) {
    pinEntry += digit;
    log('pinEntry after adding digit:', pinEntry);
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

async function checkPin(opts={}) {
  // Setup wizard override
  if(window._setupCheckOverride){ await window._setupCheckOverride(); return; }
  // Admin overlay override
  if(window._adminOverlayActive && window._adminPinCallback){ await window._adminPinCallback(); return; }
  const hash = await sha256(pinEntry);
  const stored = getStoredPinHash();
  if (stored && hash === stored) {
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
    enterApp(false);
  } else {
    for (let i = 0; i < 4; i++) {
      document.querySelectorAll('#dot-' + i).forEach(d => { d.classList.remove('filled'); d.classList.add('error'); });
    }
    document.querySelectorAll('#pin-error').forEach(e => { e.textContent = opts.errorMsg || 'Code incorrect — réessayez'; });
    setTimeout(() => { pinEntry = ''; updatePinDots(); }, 700);
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
  isViewerMode = viewer;
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
  if(isViewerMode) _applyViewerMode();
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

const LANG_FLAGS = {en:'🇬🇧',fr:'🇫🇷',es:'🇪🇸',zh:'🇨🇳',it:'🇮🇹',nl:'🇳🇱',de:'🇩🇪'};
// The prompt is deliberately shown in ALL 7 languages at once (plus the
// native language names): the screen is language-neutral by design, so
// there is no "wrong language flash" before the user chooses.
const LANG_PROMPTS = ['Choose your language','Choisis ta langue','Elige tu idioma','选择你的语言','Scegli la tua lingua','Kies je taal','Wähle deine Sprache'];

export function showLanguageScreen(){
  const ls = document.getElementById('login-screen');
  if(!ls) return;
  const buttons = Object.entries(LANGS).map(([code,label]) => `
      <button class="lang-opt" data-lang="${code}" type="button">
        <span class="lang-flag" aria-hidden="true">${LANG_FLAGS[code]||'🌐'}</span>
        <span class="lang-name" lang="${code}">${label}</span>
      </button>`).join('');
  ls.querySelector('.login-box').innerHTML = `
    <div class="login-duo">
      <div class="login-f1"><img src="https://upload.wikimedia.org/wikipedia/commons/3/33/F1.svg" alt="F1"></div>
      <span class="login-x">×</span>
      <div class="login-uno"><img src="https://upload.wikimedia.org/wikipedia/commons/f/f9/UNO_Logo.svg" alt="UNO"></div>
    </div>
    <div class="lang-globe" aria-hidden="true">🌐</div>
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
    <div class="login-duo">
      <div class="login-f1"><img src="https://upload.wikimedia.org/wikipedia/commons/3/33/F1.svg" alt="F1"></div>
      <span class="login-x">×</span>
      <div class="login-uno"><img src="https://upload.wikimedia.org/wikipedia/commons/f/f9/UNO_Logo.svg" alt="UNO"></div>
    </div>
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
    <div class="login-duo">
      <div class="login-f1"><img src="https://upload.wikimedia.org/wikipedia/commons/3/33/F1.svg" alt="F1"></div>
      <span class="login-x">×</span>
      <div class="login-uno"><img src="https://upload.wikimedia.org/wikipedia/commons/f/f9/UNO_Logo.svg" alt="UNO"></div>
    </div>
    <div class="setup-title">${t('setup.choose')}</div>
    <div class="setup-sub">${subtitle||t('setup.enter')}</div>
    <div class="pin-dots" id="pin-dots">
      <div class="pin-dot" id="dot-0"></div><div class="pin-dot" id="dot-1"></div>
      <div class="pin-dot" id="dot-2"></div><div class="pin-dot" id="dot-3"></div>
    </div>
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
    </div>
    <div class="pin-error-msg" id="pin-error"></div>`;
  pinEntry = '';
  // Override checkPin to do setup-confirm flow
  window._setupPhase = 'enter';
  window._setupFirstPin = '';
  window._setupCheckOverride = async ()=>{
    if(window._setupPhase === 'enter'){
      window._setupFirstPin = pinEntry;
      window._setupPhase = 'confirm';
      pinEntry = '';
      box.querySelector('.setup-sub').textContent = t('setup.confirm');
      updatePinDots();
    } else {
      if(pinEntry === window._setupFirstPin){
        const hash = await sha256(pinEntry);
        localStorage.setItem('f1uno_pin_hash', hash);
        localStorage.setItem('f1uno_pin_enabled','true');
        localStorage.setItem('f1uno_setup_done','true');
        window._setupCheckOverride = null;
        window._setupPhase = null;
        enterApp(false);
      } else {
        window._setupPhase = 'enter';
        window._setupFirstPin = '';
        pinEntry = '';
        updatePinDots();
        const errEl = document.getElementById('pin-error');
        if(errEl) errEl.textContent = t('setup.mismatch');
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
  isViewerMode = false;
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
      <div class="pin-dots">
        <div class="pin-dot" id="dot-0"></div><div class="pin-dot" id="dot-1"></div>
        <div class="pin-dot" id="dot-2"></div><div class="pin-dot" id="dot-3"></div>
      </div>
      <div class="pin-keypad">
        ${[1,2,3,4,5,6,7,8,9].map(d=>`<button class="pin-key" data-digit="${d}" type="button">${d}</button>`).join('')}
        <button class="pin-key del" data-action="pinDel" type="button">⌫</button>
        <button class="pin-key zero" data-digit="0" type="button">0</button>
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
    if(hash === getStoredPinHash()){
      const pin = pinEntry;
      close();
      await onOk(pin);
    } else {
      for(let i=0;i<4;i++){
        document.querySelectorAll('#dot-'+i).forEach(d=>{ d.classList.remove('filled'); d.classList.add('error'); });
      }
      document.querySelectorAll('#pin-error').forEach(e=>{ e.textContent=t('pin.wrong'); });
      setTimeout(()=>{ pinEntry=''; updatePinDots(); },700);
    }
  };
}

export function showAdminPinScreen(){
  // When in viewer mode, show a PIN overlay to switch to admin
  const overlay = document.createElement('div');
  overlay.id = 'admin-pin-overlay';
  overlay.style.cssText='position:fixed;inset:0;background:var(--bg);display:flex;align-items:center;justify-content:center;z-index:9999;flex-direction:column;';
  overlay.innerHTML=`
    <div class="login-box">
      <div class="login-duo">
        <div class="login-f1"><img src="https://upload.wikimedia.org/wikipedia/commons/3/33/F1.svg" alt="F1"></div>
        <span class="login-x">×</span>
        <div class="login-uno"><img src="https://upload.wikimedia.org/wikipedia/commons/f/f9/UNO_Logo.svg" alt="UNO"></div>
      </div>
      <div class="pin-label" style="margin-top:16px">${t('adm.title')}</div>
      <div class="pin-dots" id="admin-pin-dots">
        <div class="pin-dot" id="dot-0"></div><div class="pin-dot" id="dot-1"></div>
        <div class="pin-dot" id="dot-2"></div><div class="pin-dot" id="dot-3"></div>
      </div>
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
    if(hash === getStoredPinHash()){
      overlay.remove();
      window._adminOverlayActive = false;
      window._adminPinCallback = null;
      isViewerMode = false;
      _authenticated = true;
      document.body.classList.remove('viewer-mode');
      setSettingsTabLocked(false);
      pinEntry='';
      switchView('settings');
      showToast(t('adm.ok'));
    } else {
      for(let i=0;i<4;i++){
        document.querySelectorAll('#dot-'+i).forEach(d=>{ d.classList.remove('filled'); d.classList.add('error'); });
      }
      document.querySelectorAll('#pin-error').forEach(e=>{ e.textContent='Code incorrect'; });
      setTimeout(()=>{ pinEntry=''; updatePinDots(); },700);
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

  el.innerHTML = `
    <div class="setv-title">⚙️ <span>${t('nav.settings').replace('⚙️ ','')}</span></div>

    <div class="setv-section set-appearance">
      <div class="setv-section-title">🎨 ${t('s.appearance')}</div>
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
      <div class="setv-section-title">🔐 ${t('s.security')}</div>
      <div class="setv-row">
        <div class="setv-row-left">
          <div class="setv-row-label">${t('s.pin')}</div>
          <div class="setv-row-sub">${t('s.pin_sub')}</div>
        </div>
        <button class="setv-toggle${pinOn?' on':''}" id="pinToggle"></button>
      </div>
      ${pinOn ? `
      <div class="setv-row" id="changePinRow" style="flex-direction:column;align-items:flex-start;gap:0;padding-bottom:6px;">
        <div style="display:flex;align-items:center;justify-content:space-between;width:100%;padding:0 0 12px;">
          <div class="setv-row-left"><div class="setv-row-label">${t('s.change_pin')}</div></div>
          <button class="setv-btn" id="showChangePinBtn">${t('s.change_btn')}</button>
        </div>
        <div id="changePinForm" style="display:none;width:100%">
          <form class="pin-change-form" id="changePinFormEl">
            <div class="pin-input-row">
              <label class="pin-input-label" for="newPinA">${t('s.new_pin')}</label>
              <input type="password" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" autocomplete="new-password" class="pin-mini-input" id="newPinA" placeholder="••••">
            </div>
            <div class="pin-input-row">
              <label class="pin-input-label" for="newPinB">${t('s.confirm_pin')}</label>
              <input type="password" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" autocomplete="new-password" class="pin-mini-input" id="newPinB" placeholder="••••">
            </div>
            <div class="pin-form-error" id="pinChangeError"></div>
            <button class="pin-save-btn" id="savePinBtn" type="submit">${t('s.enable_pin')}</button>
          </form>
        </div>
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
      <div class="setv-section-title">ℹ️ ${t('s.about')}</div>
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
    </div>

    ${pinOn ? `
    <div class="setv-section set-session">
      <div class="setv-section-title">🔒 ${t('s.session')}</div>
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
      // Disable PIN: confirm — and decrypt everything back to clear
      // FIRST (no PIN = no key: encrypted data would become unreachable).
      if(!await confirmDialog(t('pin.disable'), { danger:true })) return;
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
    } else {
      // Enable PIN: need to set one first
      _startEnablePin(el);
      return;
    }
    renderSettings();
  });

  el.querySelector('#showChangePinBtn')?.addEventListener('click', ()=>{
    const form = el.querySelector('#changePinForm');
    if(form) form.style.display = form.style.display==='none'?'block':'none';
  });

  el.querySelector('#changePinFormEl')?.addEventListener('submit', async e=>{
    e.preventDefault(); // handled in JS — nothing must navigate
    const a = el.querySelector('#newPinA').value;
    const b = el.querySelector('#newPinB').value;
    const errEl = el.querySelector('#pinChangeError');
    if(!/^\d{4}$/.test(a)){ errEl.textContent=t('pin.digits'); return; }
    if(a !== b){ errEl.textContent=t('pin.mismatch'); return; }
    const hash = await sha256(a);
    // Re-encrypt under the new PIN BEFORE the hash is replaced: if the
    // re-key fails, the old PIN must still open the old ciphertexts.
    if(isEncEnabled()){
      try {
        await rekeyEncryption(a);
      } catch(e){
        console.error('re-key failed — PIN unchanged', e);
        errEl.textContent = t('enc.err_generic');
        return;
      }
    }
    localStorage.setItem('f1uno_pin_hash', hash);
    errEl.textContent='';
    el.querySelector('#changePinForm').style.display='none';
    el.querySelector('#newPinA').value='';
    el.querySelector('#newPinB').value='';
    showToast(t('pin.saved'));
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

function _startEnablePin(container){
  container.innerHTML = `
    <div class="setv-title">⚙️ <span>${t('nav.settings').replace('⚙️ ','')}</span></div>
    <div class="setv-section set-security">
      <div class="setv-section-title">🔐 ${t('pin.set_title')}</div>
      <form class="pin-change-form" id="enablePinFormEl">
        <div class="pin-input-row">
          <label class="pin-input-label" for="enablePinA">${t('s.new_pin')}</label>
          <input type="password" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" autocomplete="new-password" class="pin-mini-input" id="enablePinA" placeholder="••••">
        </div>
        <div class="pin-input-row">
          <label class="pin-input-label" for="enablePinB">${t('s.confirm_pin')}</label>
          <input type="password" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" autocomplete="new-password" class="pin-mini-input" id="enablePinB" placeholder="••••">
        </div>
        <div class="pin-form-error" id="enablePinError"></div>
        <div style="display:flex;gap:8px;">
          <button class="pin-save-btn" id="enablePinSave" type="submit">${t('s.enable_pin')}</button>
          <button class="setv-btn" id="enablePinCancel" type="button" style="margin-top:4px">${t('adm.cancel')}</button>
        </div>
      </form>
    </div>`;
  container.querySelector('#enablePinCancel').addEventListener('click', renderSettings);
  container.querySelector('#enablePinFormEl').addEventListener('submit', async e=>{
    e.preventDefault(); // handled in JS — nothing must navigate
    const a = container.querySelector('#enablePinA').value;
    const b = container.querySelector('#enablePinB').value;
    const errEl = container.querySelector('#enablePinError');
    if(!/^\d{4}$/.test(a)){ errEl.textContent=t('pin.digits'); return; }
    if(a !== b){ errEl.textContent=t('pin.mismatch'); return; }
    const hash = await sha256(a);
    localStorage.setItem('f1uno_pin_hash', hash);
    localStorage.setItem('f1uno_pin_enabled','true');
    showToast(t('toast.pin_on'));
    renderSettings();
  });
}
