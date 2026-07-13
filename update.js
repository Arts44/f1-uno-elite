/* ══════════════════════════════════════════════════════════
   UPDATE — automatic app updates + "what's new" flow.
   - Registers the service worker and watches for a NEW version:
     when a fresh SW reaches the "waiting" state, a discreet banner
     offers to reload; the click messages the waiting SW
     (SKIP_WAITING) and reloads once it takes control.
   - Installed PWAs can stay open for days without a navigation
     (the browser then never re-checks sw.js): we poke
     registration.update() when the app returns to the foreground
     and hourly while it stays open.
   - Version bookkeeping: APP_VERSION (from changelog.js) vs the
     last version seen by this device (f1uno_seen_version) drives a
     non-intrusive "see what's new" offer after an applied update.
   ══════════════════════════════════════════════════════════ */
import { log } from './logger.js';
import { t, getLang } from './i18n.js';
import { CHANGELOG, APP_VERSION, compareVersions, entriesSince, changesFor } from './changelog.js';

const SEEN_KEY = 'f1uno_seen_version';
const CHECK_EVERY_MS = 60 * 60 * 1000; // hourly while the app stays open

export function lastSeenVersion(){ return localStorage.getItem(SEEN_KEY) || ''; }
export function markVersionSeen(v = APP_VERSION){ localStorage.setItem(SEEN_KEY, v); }

// Pure, unit-tested: offer "what's new" only when a baseline exists and
// the running version is strictly newer (never on fresh installs, never
// on a same-version reload, never on a downgrade/rollback).
export function shouldOfferWhatsNew(lastSeen, current = APP_VERSION){
  return !!lastSeen && compareVersions(current, lastSeen) > 0;
}

/* ══════════════════════════════════════════════════════════
   SW registration + update detection
   ══════════════════════════════════════════════════════════ */
let _reg = null;
let _reloading = false;

export function initUpdateFlow(){
  if(!('serviceWorker' in navigator)) return; // file:// etc. — expected
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
      .then(reg => {
        _reg = reg;
        log('Service worker registered, scope:', reg.scope);
        // A new SW may already be parked in "waiting" (downloaded on a
        // previous visit, banner never acted on): offer it again.
        if(reg.waiting && navigator.serviceWorker.controller) _showUpdateBanner();
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          if(!nw) return;
          nw.addEventListener('statechange', () => {
            // "installed" WITH an existing controller = an update is
            // ready and waiting. (On the very first install there is no
            // controller — nothing to announce.)
            if(nw.state === 'installed' && navigator.serviceWorker.controller){
              log('update: new service worker installed and waiting');
              _showUpdateBanner();
            }
          });
        });
      })
      .catch(err => console.error('Service worker registration failed:', err));

    // Reload exactly once when the waiting SW takes control after OUR
    // skip-waiting request. The guard ignores controller changes we did
    // not ask for (e.g. clients.claim on first install) — no reload loop.
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if(!_reloading) return;
      _reloading = false;
      window.location.reload();
    });

    document.addEventListener('visibilitychange', () => {
      if(document.visibilityState === 'visible') _checkForUpdate();
    });
    setInterval(_checkForUpdate, CHECK_EVERY_MS);
  });
}

function _checkForUpdate(){
  if(_reg) _reg.update().catch(() => {}); // offline/network errors: silent
}

// User clicked "Reload": promote the waiting SW, then reload on
// controllerchange (with a safety-net reload if the event never comes).
export function applyUpdate(){
  const waiting = _reg && _reg.waiting;
  _removeUpdateBanner();
  if(waiting){
    _reloading = true;
    waiting.postMessage({ type: 'SKIP_WAITING' });
    setTimeout(() => {
      if(_reloading){ _reloading = false; window.location.reload(); }
    }, 3000);
  } else {
    window.location.reload();
  }
}

/* ── Manual update check (Settings → About) ──
   Reuses the same registration and the same banner flow as the
   automatic detection — no parallel mechanism. */
export const MANUAL_CHECK_COOLDOWN_MS = 30000;
let _lastManualCheck = 0;

export function isUpdateCheckSupported(){
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
}

// Pure, unit-tested: maps an observed state to the user-facing outcome.
export function resolveUpdateCheck({ supported, registered, online, installing, waiting, error }){
  if(!supported || !registered) return 'unsupported';
  if(!online) return 'offline';
  if(error) return 'error';
  if(installing || waiting) return 'found';
  return 'uptodate';
}

// Pure, unit-tested: ms left before another manual check is allowed.
export function manualCheckCooldownRemaining(now, last, cooldownMs = MANUAL_CHECK_COOLDOWN_MS){
  return Math.max(0, last + cooldownMs - now);
}

export async function checkForUpdatesNow(){
  if(!isUpdateCheckSupported() || !_reg) return 'unsupported';
  if(!navigator.onLine) return 'offline';
  if(manualCheckCooldownRemaining(Date.now(), _lastManualCheck) > 0) return 'cooldown';
  _lastManualCheck = Date.now();
  let error = false;
  try {
    await _reg.update();
  } catch(e){
    error = true;
    log('manual update check failed:', e);
  }
  const outcome = resolveUpdateCheck({
    supported: true, registered: true, online: navigator.onLine,
    installing: !!_reg.installing, waiting: !!_reg.waiting, error,
  });
  // A new worker already parked in waiting: re-offer the banner right
  // away (the updatefound path only fires while it installs).
  if(outcome === 'found' && _reg.waiting && navigator.serviceWorker.controller) _showUpdateBanner();
  return outcome;
}

function _removeUpdateBanner(){
  const b = document.getElementById('updateBanner');
  if(b) b.remove();
}

function _showUpdateBanner(){
  if(document.getElementById('updateBanner')) return;
  const b = document.createElement('div');
  b.className = 'install-banner update-banner';
  b.id = 'updateBanner';
  b.setAttribute('role', 'status');
  b.innerHTML = `
    <span class="install-banner-icon" aria-hidden="true">🔄</span>
    <span class="install-banner-text">${t('upd.banner')}</span>
    <button class="install-banner-btn" id="updateReloadBtn" type="button">${t('upd.reload')}</button>
    <button class="install-banner-close" id="updateCloseBtn" type="button" aria-label="${t('upd.later')}">✕</button>`;
  document.body.appendChild(b);
  document.getElementById('updateReloadBtn').addEventListener('click', applyUpdate);
  document.getElementById('updateCloseBtn').addEventListener('click', _removeUpdateBanner);
}

/* ══════════════════════════════════════════════════════════
   "What's new" — post-update offer + changelog dialog
   ══════════════════════════════════════════════════════════ */
let _whatsNewOffered = false;

// Called from initApp(): if this device just moved to a newer version,
// offer (never impose) the changelog of what it missed. Fresh installs
// and pre-versioning installs are stamped silently — no greeting.
export function maybeOfferWhatsNew(){
  const last = lastSeenVersion();
  if(!shouldOfferWhatsNew(last)){
    if(!last) markVersionSeen();
    return;
  }
  const entries = entriesSince(last);
  markVersionSeen();
  if(_whatsNewOffered || !entries.length || document.getElementById('whatsNewBanner')) return;
  _whatsNewOffered = true;
  const b = document.createElement('div');
  b.className = 'install-banner update-banner';
  b.id = 'whatsNewBanner';
  b.setAttribute('role', 'status');
  b.innerHTML = `
    <span class="install-banner-icon" aria-hidden="true">✨</span>
    <span class="install-banner-text">${t('upd.updated')}</span>
    <button class="install-banner-btn" id="whatsNewSeeBtn" type="button">${t('upd.whatsnew')}</button>
    <button class="install-banner-close" id="whatsNewCloseBtn" type="button" aria-label="${t('upd.later')}">✕</button>`;
  document.body.appendChild(b);
  const close = () => b.remove();
  document.getElementById('whatsNewSeeBtn').addEventListener('click', () => { close(); openChangelog(entries); });
  document.getElementById('whatsNewCloseBtn').addEventListener('click', close);
}

// Changelog dialog — reuses the import-dialog look. `entries` defaults to
// the full history (Settings → What's new).
export function openChangelog(entries = CHANGELOG){
  if(document.querySelector('.changelog-overlay')) return;
  const lang = getLang();
  const overlay = document.createElement('div');
  overlay.className = 'import-dialog-overlay changelog-overlay';
  overlay.innerHTML = `
    <div class="import-dialog changelog-dialog">
      <div class="import-dialog-title">✨ ${t('upd.whatsnew')}</div>
      <div class="changelog-list">
        ${entries.map(e => `
        <div class="changelog-entry">
          <div class="changelog-ver">${e.version}<span class="changelog-date">${new Date(e.date + 'T00:00:00').toLocaleDateString()}</span></div>
          <ul>${changesFor(e, lang).map(c => `<li>${c}</li>`).join('')}</ul>
        </div>`).join('')}
      </div>
      <button class="import-dialog-btn primary" id="changelogCloseBtn" type="button">${t('upd.close')}</button>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if(e.target === overlay) overlay.remove(); });
  overlay.querySelector('#changelogCloseBtn').addEventListener('click', () => overlay.remove());
}
