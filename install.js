/* ══════════════════════════════════════════════════════════
   INSTALL — "install the app" experience for the PWA.
   - Chromium (Chrome/Edge/Android): captures beforeinstallprompt
     and offers the NATIVE prompt (Settings button + a discreet,
     dismissable banner).
   - Browsers without the event (Safari macOS/iOS, Firefox): the
     Settings section shows platform-specific manual instructions.
   - Hidden entirely when already running standalone (installed).
   Zero runtime deps; pure helpers are unit-tested.
   ══════════════════════════════════════════════════════════ */
import { log } from './logger.js';
import { t } from './i18n.js';

const DISMISS_KEY = 'f1uno_install_dismissed';

let _deferredPrompt = null;
let _installedThisSession = false;

/* ── Pure, testable helpers ── */

// Already running as an installed app?
export function isStandalone(win){
  const w = win || window;
  try {
    return (w.matchMedia && w.matchMedia('(display-mode: standalone)').matches)
        || w.navigator.standalone === true; // iOS Safari
  } catch(e){ return false; }
}

// Platform from a user-agent string (+ maxTouchPoints for iPadOS,
// which masquerades as macOS). Kept pure for unit tests.
export function detectPlatform(ua, maxTouchPoints = 0){
  ua = ua || '';
  if(/iPhone|iPod|iPad/.test(ua)) return 'ios';
  if(/Macintosh/.test(ua) && maxTouchPoints > 1) return 'ios'; // iPadOS
  if(/Android/.test(ua)) return 'android';
  if(/Edg\//.test(ua) || /Chrome\//.test(ua)) return 'chromium';
  if(/Macintosh/.test(ua) && /Safari/.test(ua)) return 'mac_safari';
  return 'other';
}

// Arc masquerades as Chrome in its UA, but injects --arc-palette-*
// CSS variables on :root — the reliable way to identify it. Arc has
// no install icon in its address bar and never fires
// beforeinstallprompt, so Chrome instructions would point at a
// nonexistent UI element there.
export function isArcBrowser(win){
  const w = win || window;
  try {
    return !!getComputedStyle(w.document.documentElement)
      .getPropertyValue('--arc-palette-title').trim();
  } catch(e){ return false; }
}

// Which manual-instruction i18n key fits the platform.
// opts.arc: Chromium engine identified as Arc → honest redirect message
// instead of instructions pointing at an address-bar icon Arc lacks.
export function installInstructionKey(platform, opts = {}){
  if(platform === 'chromium' && opts.arc) return 'install.ins_arc';
  return {
    ios: 'install.ins_ios',
    mac_safari: 'install.ins_mac',
    chromium: 'install.ins_chromium',
    android: 'install.ins_android',
  }[platform] || 'install.ins_generic';
}

/* ── Runtime state ── */

export function canPromptInstall(){ return !!_deferredPrompt; }
export function isBannerDismissed(){ return localStorage.getItem(DISMISS_KEY) === 'true'; }
function _dismissBanner(){ localStorage.setItem(DISMISS_KEY, 'true'); }

export async function promptInstall(){
  if(!_deferredPrompt) return false;
  const p = _deferredPrompt;
  _deferredPrompt = null; // a prompt event is single-use
  p.prompt();
  const choice = await p.userChoice.catch(() => null);
  log('install: user choice', choice && choice.outcome);
  refreshInstallRow();
  return !!choice && choice.outcome === 'accepted';
}

// Listen as early as possible (the event can fire before load).
export function initInstall(){
  if(typeof window.addEventListener !== 'function') return; // non-browser (tests)
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();          // keep it for OUR button/banner
    _deferredPrompt = e;
    log('install: beforeinstallprompt captured');
    maybeShowInstallBanner();
    refreshInstallRow();
  });
  window.addEventListener('appinstalled', () => {
    _installedThisSession = true;
    _deferredPrompt = null;
    log('install: appinstalled');
    _removeBanner();
    refreshInstallRow();
  });
}

/* ── Settings section (rendered by pin.js renderSettings) ── */

export function installRowHTML(){
  const installed = isStandalone() || _installedThisSession;
  let action;
  if(installed){
    action = `<div class="install-ok">✓ ${t('install.installed')}</div>`;
  } else if(canPromptInstall()){
    action = `<button class="setv-btn install-native-btn" id="installNativeBtn">${t('install.btn')}</button>`;
  } else {
    const key = installInstructionKey(
      detectPlatform(navigator.userAgent, navigator.maxTouchPoints || 0),
      { arc: isArcBrowser() });
    action = `<div class="install-ins">${t(key)}</div>`;
  }
  return `
    <div class="setv-section">
      <div class="setv-section-title">${t('install.title')}</div>
      <div class="setv-row" id="installRow" style="flex-direction:column;align-items:stretch;gap:10px;">
        <div class="setv-row-left">
          <div class="setv-row-label">${t('install.label')}</div>
          <div class="setv-row-sub">${t('install.sub')}</div>
        </div>
        <div id="installRowAction">${action}</div>
      </div>
    </div>`;
}

export function bindInstallRow(){
  const btn = document.getElementById('installNativeBtn');
  if(btn) btn.addEventListener('click', promptInstall);
}

// Re-render just the action area when availability changes live
// (event fired / prompt used / app installed) while Settings is open.
export function refreshInstallRow(){
  const area = document.getElementById('installRowAction');
  if(!area) return;
  const tmp = document.createElement('div');
  tmp.innerHTML = installRowHTML();
  const fresh = tmp.querySelector('#installRowAction');
  if(fresh){ area.innerHTML = fresh.innerHTML; bindInstallRow(); }
}

/* ── Discreet banner (native-prompt browsers only) ── */

function _removeBanner(){
  const b = document.getElementById('installBanner');
  if(b) b.remove();
}

export function maybeShowInstallBanner(){
  if(!canPromptInstall()) return;                     // native path only
  if(isStandalone() || _installedThisSession) return; // already an app
  if(isBannerDismissed()) return;                     // user said no
  if(document.getElementById('installBanner')) return;
  const wrapper = document.getElementById('app-wrapper');
  if(!wrapper || wrapper.style.display === 'none') return; // wait for login
  const b = document.createElement('div');
  b.className = 'install-banner';
  b.id = 'installBanner';
  b.innerHTML = `
    <span class="install-banner-icon" aria-hidden="true">📲</span>
    <span class="install-banner-text">${t('install.banner')}</span>
    <button class="install-banner-btn" id="installBannerBtn" type="button">${t('install.btn')}</button>
    <button class="install-banner-close" id="installBannerClose" type="button" aria-label="${t('install.later')}">✕</button>`;
  document.body.appendChild(b);
  document.getElementById('installBannerBtn').addEventListener('click', async () => {
    const ok = await promptInstall();
    if(!ok) _dismissBanner(); // declined the native prompt: stop nagging
    _removeBanner();
  });
  document.getElementById('installBannerClose').addEventListener('click', () => {
    _dismissBanner();
    _removeBanner();
    log('install: banner dismissed');
  });
}
