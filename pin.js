/* ══════════════════════════════════════════════════════════
   PIN / AUTH — login, setup wizard, viewer & admin modes,
   settings screen. PIN is SHA-256 hashed in localStorage.
   ══════════════════════════════════════════════════════════ */
import { log } from './logger.js';
import { t, LANGS, getLang, setLang } from './i18n.js';
import { switchView, showToast, toggleTheme, currentView, setCurrentView } from './render.js';
import { triggerImport } from './storage.js';
import { initApp } from './app.js';

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
    enterApp(false);
  } else {
    for (let i = 0; i < 4; i++) {
      document.querySelectorAll('#dot-' + i).forEach(d => { d.classList.remove('filled'); d.classList.add('error'); });
    }
    document.querySelectorAll('#pin-error').forEach(e => { e.textContent = opts.errorMsg || 'Code incorrect — réessayez'; });
    setTimeout(() => { pinEntry = ''; updatePinDots(); }, 700);
  }
}

export function enterApp(viewer=false){
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
}

function _applyViewerMode(){
  document.body.classList.add('viewer-mode');
  const settingsTab = document.querySelector('.bn-tab[data-view="settings"]');
  if(settingsTab){
    settingsTab.querySelector('.bn-icon').textContent='🔓';
    settingsTab.querySelector('.bn-label').textContent='Admin';
  }
  // Always start on collection in viewer mode
  setCurrentView('collection');
  switchView('collection');
  showToast(t('toast.viewer'));
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

export function lockApp() {
  if(!isPinEnabled()) return; // no lock if PIN disabled
  // Simply reload the page instead of showing login screen
  window.location.reload();
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
      const settingsTab = document.querySelector('.bn-tab[data-view="settings"]');
      if(settingsTab){
        settingsTab.querySelector('.bn-icon').textContent='⚙️';
        settingsTab.querySelector('.bn-label').textContent='Réglages';
      }
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

    <div class="setv-section">
      <div class="setv-section-title">${t('s.appearance')}</div>
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
    </div>

    <div class="setv-section">
      <div class="setv-section-title">${t('s.security')}</div>
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
          <div class="pin-change-form">
            <div class="pin-input-row">
              <div class="pin-input-label">${t('s.new_pin')}</div>
              <input type="password" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" class="pin-mini-input" id="newPinA" placeholder="••••">
            </div>
            <div class="pin-input-row">
              <div class="pin-input-label">${t('s.confirm_pin')}</div>
              <input type="password" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" class="pin-mini-input" id="newPinB" placeholder="••••">
            </div>
            <div class="pin-form-error" id="pinChangeError"></div>
            <button class="pin-save-btn" id="savePinBtn">${t('s.enable_pin')}</button>
          </div>
        </div>
      </div>
      <div class="setv-row">
        <div class="setv-row-left">
          <div class="setv-row-label">${t('s.viewer')}</div>
          <div class="setv-row-sub">${t('s.viewer_sub')}</div>
        </div>
        <button class="setv-toggle${viewerOn?' on':''}" id="viewerToggle"></button>
      </div>` : `
      <div class="setv-row" style="opacity:0.4;pointer-events:none;">
        <div class="setv-row-left">
          <div class="setv-row-label">${t('s.viewer')}</div>
          <div class="setv-row-sub">${t('s.viewer_off')}</div>
        </div>
        <button class="setv-toggle" disabled></button>
      </div>`}
    </div>

    <div class="setv-section">
      <div class="setv-section-title">${t('s.collection')}</div>
      <div class="setv-row">
        <div class="setv-row-left">
          <div class="setv-row-label">${t('s.import')}</div>
          <div class="setv-row-sub">${t('s.import_sub')}</div>
        </div>
        <button class="setv-btn" id="importBtn">${t('s.import_btn')}</button>
      </div>
      <div class="setv-row">
        <div class="setv-row-left">
          <div class="setv-row-label">${t('s.export')}</div>
          <div class="setv-row-sub">${t('s.export_sub')}</div>
        </div>
        <button class="setv-btn" data-action="exportCollection">${t('s.export_btn')}</button>
      </div>
    </div>

    ${pinOn ? `
    <div class="setv-section">
      <div class="setv-section-title">${t('s.session')}</div>
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
      // Disable PIN: confirm
      if(!confirm(t('pin.disable'))) return;
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

  el.querySelector('#savePinBtn')?.addEventListener('click', async ()=>{
    const a = el.querySelector('#newPinA').value;
    const b = el.querySelector('#newPinB').value;
    const errEl = el.querySelector('#pinChangeError');
    if(!/^\d{4}$/.test(a)){ errEl.textContent=t('pin.digits'); return; }
    if(a !== b){ errEl.textContent=t('pin.mismatch'); return; }
    const hash = await sha256(a);
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

  el.querySelector('#importBtn')?.addEventListener('click', triggerImport);
  el.querySelector('#settingsLockBtn')?.addEventListener('click', lockApp);

  const langSel = el.querySelector('#langSel');
  if(langSel) langSel.addEventListener('change', e=>setLang(e.target.value));
}

function _startEnablePin(container){
  container.innerHTML = `
    <div class="setv-title">⚙️ <span>${t('nav.settings').replace('⚙️ ','')}</span></div>
    <div class="setv-section">
      <div class="setv-section-title">${t('pin.set_title')}</div>
      <div class="pin-change-form">
        <div class="pin-input-row">
          <div class="pin-input-label">${t('s.new_pin')}</div>
          <input type="password" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" class="pin-mini-input" id="enablePinA" placeholder="••••">
        </div>
        <div class="pin-input-row">
          <div class="pin-input-label">${t('s.confirm_pin')}</div>
          <input type="password" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" class="pin-mini-input" id="enablePinB" placeholder="••••">
        </div>
        <div class="pin-form-error" id="enablePinError"></div>
        <div style="display:flex;gap:8px;">
          <button class="pin-save-btn" id="enablePinSave">Activer le PIN</button>
          <button class="setv-btn" id="enablePinCancel" style="margin-top:4px">Annuler</button>
        </div>
      </div>
    </div>`;
  container.querySelector('#enablePinCancel').addEventListener('click', renderSettings);
  container.querySelector('#enablePinSave').addEventListener('click', async ()=>{
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
