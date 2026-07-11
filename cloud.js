/* ══════════════════════════════════════════════════════════
   CLOUD — optional manual push/pull backup to Supabase.
   Pure REST over fetch() — NO SDK (zero-runtime-dependency rule).
   Auth: email magic link (GoTrue /auth/v1 endpoints).

   The app works 100% without this: everything here is gated on
   window.__F1UNO_CLOUD being filled (cloud-config.js) and on the
   user explicitly signing in from Settings.

   Session tokens live in localStorage (f1uno_cloud_session) and are
   lazily refreshed before an API call when close to expiry.
   All requests use cache:'no-store' AND the service worker excludes
   the Supabase origin, so no API response is ever served from cache.
   ══════════════════════════════════════════════════════════ */
import { log } from './logger.js';
import { t } from './i18n.js';
import { collectionSnapshot, _showImportDialog } from './storage.js';
import { backupIncludes } from './settings-sync.js';
import { markBackupDone } from './backup.js';
import { _currentSeason } from './data.js';

export const SESSION_KEY = 'f1uno_cloud_session';

/* ── Config (filled by the user in cloud-config.js) ── */
export function cloudConfig(){
  const c = (typeof window !== 'undefined' && window.__F1UNO_CLOUD) || {};
  return (c.url && c.anonKey) ? { url: c.url.replace(/\/+$/, ''), anonKey: c.anonKey } : null;
}
export function isCloudConfigured(){ return !!cloudConfig(); }

/* ══════════════════════════════════════════════════════════
   PURE HELPERS (unit-tested)
   ══════════════════════════════════════════════════════════ */

// Parse the #access_token=…&refresh_token=… fragment GoTrue appends
// to the redirect URL after the magic link is clicked.
// `nowSec` is injectable for tests.
export function parseSessionFromHash(hash, nowSec){
  if(!hash || hash.indexOf('access_token=') === -1) return null;
  const p = new URLSearchParams(hash.replace(/^#\/?/, ''));
  const access_token = p.get('access_token');
  const refresh_token = p.get('refresh_token');
  if(!access_token || !refresh_token) return null;
  const expiresIn = parseInt(p.get('expires_in') || '3600', 10);
  const expires_at = parseInt(p.get('expires_at') || '0', 10)
    || (nowSec || Math.floor(Date.now() / 1000)) + expiresIn;
  return { access_token, refresh_token, expires_at, type: p.get('type') || '' };
}

// A session is "expired" 60s early so a token never dies mid-request.
export function isSessionExpired(session, nowSec){
  if(!session || !session.access_token || !session.expires_at) return true;
  const now = nowSec || Math.floor(Date.now() / 1000);
  return now >= session.expires_at - 60;
}

// The user id (auth.uid()) is the JWT's `sub` claim — decoded locally,
// no network round-trip needed to know who we are.
export function decodeJwtSub(token){
  try {
    const payload = token.split('.')[1];
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(b64)).sub || null;
  } catch(e){ return null; }
}

// PostgREST upsert body for one (user, season) row. Pure for tests.
// updated_at is intentionally absent: the server trigger owns it.
export function buildUpsertRow(userId, season, snapshot){
  return { user_id: userId, season, data: snapshot };
}

// Headers for GoTrue/PostgREST. Without a user token, the anon key is
// used as the bearer (required by Supabase even for anonymous calls).
export function authHeaders(cfg, accessToken){
  return {
    'apikey': cfg.anonKey,
    'Authorization': `Bearer ${accessToken || cfg.anonKey}`,
    'Content-Type': 'application/json',
  };
}

/* ── Session persistence ── */
export function loadSession(){
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if(!raw) return null;
    const s = JSON.parse(raw);
    return (s && s.access_token && s.refresh_token) ? s : null;
  } catch(e){ return null; }
}
export function saveSession(session){
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
export function clearSession(){
  localStorage.removeItem(SESSION_KEY);
}

/* ══════════════════════════════════════════════════════════
   AUTH API (GoTrue, REST)
   ══════════════════════════════════════════════════════════ */

// Send the magic link. redirect_to = the current page, so the link
// comes back to the same entry (localhost dev or GitHub Pages) —
// the URL must be allowed in Supabase → Auth → URL Configuration.
export async function sendMagicLink(email){
  const cfg = cloudConfig();
  if(!cfg) throw new Error('not-configured');
  const redirectTo = encodeURIComponent(location.origin + location.pathname);
  const resp = await fetch(`${cfg.url}/auth/v1/otp?redirect_to=${redirectTo}`, {
    method: 'POST',
    cache: 'no-store',
    headers: authHeaders(cfg),
    body: JSON.stringify({ email, create_user: true }),
  }).catch(() => { throw new Error('offline'); });
  if(!resp.ok){
    const body = await resp.text().catch(() => '');
    log('cloud: otp failed', resp.status, body);
    throw new Error(resp.status === 429 ? 'rate-limited' : 'otp-failed');
  }
  return true;
}

// Verify the 6-digit code from the email (GoTrue /verify). This is the
// PRIMARY sign-in path: typing a code works in every context — installed
// PWA (standalone), plain browser, mobile — unlike the magic link, which
// always opens in the default browser and never reaches the installed
// app (and iOS PWAs don't even share localStorage with Safari).
export async function verifyOtpCode(email, code){
  const cfg = cloudConfig();
  if(!cfg) throw new Error('not-configured');
  const resp = await fetch(`${cfg.url}/auth/v1/verify`, {
    method: 'POST',
    cache: 'no-store',
    headers: authHeaders(cfg),
    body: JSON.stringify({ type: 'email', email, token: code }),
  }).catch(() => { throw new Error('offline'); });
  if(!resp.ok){
    log('cloud: verify failed', resp.status, await resp.text().catch(() => ''));
    throw new Error(resp.status === 429 ? 'rate-limited' : 'code-invalid');
  }
  const d = await resp.json().catch(() => null);
  if(!d || !d.access_token || !d.refresh_token) throw new Error('code-invalid');
  const session = {
    access_token: d.access_token,
    refresh_token: d.refresh_token,
    expires_at: d.expires_at || (Math.floor(Date.now() / 1000) + (d.expires_in || 3600)),
    user: d.user ? { id: d.user.id, email: d.user.email } : undefined,
  };
  saveSession(session);
  log('cloud: signed in via OTP code as', session.user && session.user.email);
  return session;
}

/* ── OTP input helpers (pure, tested) ──
   Supabase's "Email OTP Length" is configurable from 6 to 10 digits
   (this project uses 8!) — the app must never assume 6. Pasted codes
   may carry spaces ("0371 6217"): strip all whitespace first. */
export function normalizeOtpInput(value){
  return String(value || '').replace(/\s+/g, '');
}
export function isValidOtpFormat(code){
  return /^\d{6,10}$/.test(code);
}

/* ── Send cool-down (anti rate-limit guard) ──
   Supabase throttles auth emails aggressively; a user hammering the
   send button would lock himself out (429). Pure helper is tested. */
export const SEND_COOLDOWN_MS = 60000;
let _lastOtpSentAt = 0;
export function sendCooldownRemaining(lastSentAt, now, cooldownMs = SEND_COOLDOWN_MS){
  if(!lastSentAt) return 0;
  return Math.max(0, Math.ceil((lastSentAt + cooldownMs - now) / 1000));
}

// Fetch the user profile (id + email) for a fresh token.
async function _fetchUser(cfg, accessToken){
  const resp = await fetch(`${cfg.url}/auth/v1/user`, {
    cache: 'no-store',
    headers: authHeaders(cfg, accessToken),
  });
  if(!resp.ok) throw new Error('user-failed');
  const u = await resp.json();
  return { id: u.id, email: u.email };
}

// Exchange the refresh token for a new session.
async function _refresh(cfg, refreshToken){
  const resp = await fetch(`${cfg.url}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    cache: 'no-store',
    headers: authHeaders(cfg),
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if(!resp.ok) throw new Error('refresh-failed');
  const d = await resp.json();
  return {
    access_token: d.access_token,
    refresh_token: d.refresh_token,
    expires_at: d.expires_at || (Math.floor(Date.now() / 1000) + (d.expires_in || 3600)),
    user: d.user ? { id: d.user.id, email: d.user.email } : undefined,
  };
}

// The one entry point API calls use: returns a session with a valid
// (refreshed if needed) access token, or null if signed out / expired
// beyond recovery. Clears the stored session when refresh fails.
export async function getValidSession(){
  const cfg = cloudConfig();
  if(!cfg) return null;
  let session = loadSession();
  if(!session) return null;
  if(!isSessionExpired(session)) return session;
  try {
    const fresh = await _refresh(cfg, session.refresh_token);
    session = { ...session, ...fresh, user: fresh.user || session.user };
    saveSession(session);
    log('cloud: session refreshed');
    return session;
  } catch(e){
    log('cloud: refresh failed, signing out', e);
    clearSession();
    return null;
  }
}

// Called at boot: if the URL carries a magic-link fragment, store the
// session, resolve the user profile and clean the URL.
export async function handleAuthRedirect(){
  const cfg = cloudConfig();
  if(!cfg) return false;
  const parsed = parseSessionFromHash(location.hash);
  if(!parsed) return false;
  try { history.replaceState(null, '', location.pathname + location.search); } catch(e){}
  const session = { ...parsed };
  try {
    session.user = await _fetchUser(cfg, session.access_token);
  } catch(e){
    log('cloud: could not fetch user after redirect', e);
  }
  saveSession(session);
  log('cloud: signed in via magic link as', session.user && session.user.email);
  return true;
}

export async function signOut(){
  const cfg = cloudConfig();
  const session = loadSession();
  clearSession(); // local state first: signing out must always succeed
  if(cfg && session){
    try {
      await fetch(`${cfg.url}/auth/v1/logout`, {
        method: 'POST',
        cache: 'no-store',
        headers: authHeaders(cfg, session.access_token),
      });
    } catch(e){ log('cloud: logout request failed (ignored)', e); }
  }
}

/* ══════════════════════════════════════════════════════════
   PUSH / PULL (PostgREST /rest/v1/collections)
   Manual only — nothing runs in the background.
   ══════════════════════════════════════════════════════════ */

// Errors are thrown as Error(code) with code ∈
// {'offline','not-signed-in','push-failed','pull-failed','no-data','bad-data'}
function _requireOnline(){
  if(typeof navigator !== 'undefined' && navigator.onLine === false) throw new Error('offline');
}
async function _requireSession(){
  const session = await getValidSession();
  if(!session) throw new Error('not-signed-in');
  const userId = (session.user && session.user.id) || decodeJwtSub(session.access_token);
  if(!userId) throw new Error('not-signed-in');
  return { session, userId };
}

// Upsert the current season's snapshot. Returns the server updated_at.
export async function pushCollection(){
  const cfg = cloudConfig();
  if(!cfg) throw new Error('not-signed-in');
  _requireOnline();
  const { session, userId } = await _requireSession();
  const row = buildUpsertRow(userId, _currentSeason, collectionSnapshot(backupIncludes()));
  const resp = await fetch(`${cfg.url}/rest/v1/collections?on_conflict=user_id,season`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      ...authHeaders(cfg, session.access_token),
      'Prefer': 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify([row]),
  }).catch(() => { throw new Error('offline'); });
  if(!resp.ok){
    log('cloud: push failed', resp.status, await resp.text().catch(() => ''));
    throw new Error('push-failed');
  }
  const rows = await resp.json().catch(() => null);
  const updatedAt = rows && rows[0] && rows[0].updated_at;
  // A successful cloud push IS a backup: reset the local backup reminder.
  try { markBackupDone(); } catch(e){}
  log('cloud: pushed season', _currentSeason, 'updated_at', updatedAt);
  return updatedAt || null;
}

// Fetch the cloud snapshot for the current season and hand it to the
// EXISTING import dialog (merge / replace / cancel) — the local
// collection is never overwritten silently.
export async function pullCollection(){
  const cfg = cloudConfig();
  if(!cfg) throw new Error('not-signed-in');
  _requireOnline();
  const { session } = await _requireSession();
  const resp = await fetch(
    `${cfg.url}/rest/v1/collections?season=eq.${_currentSeason}&select=data,updated_at`, {
    cache: 'no-store',
    headers: authHeaders(cfg, session.access_token),
  }).catch(() => { throw new Error('offline'); });
  if(!resp.ok){
    log('cloud: pull failed', resp.status, await resp.text().catch(() => ''));
    throw new Error('pull-failed');
  }
  const rows = await resp.json().catch(() => null);
  if(!Array.isArray(rows)) throw new Error('bad-data');
  if(rows.length === 0) throw new Error('no-data');
  const snapshot = rows[0].data;
  if(!snapshot || typeof snapshot !== 'object' || !snapshot.owned) throw new Error('bad-data');
  _showImportDialog(snapshot); // merge / replace / cancel — user decides
  return rows[0].updated_at || null;
}

// Lightweight metadata read for the "last cloud backup" line.
export async function fetchCloudMeta(){
  const cfg = cloudConfig();
  if(!cfg) return null;
  const session = await getValidSession();
  if(!session) return null;
  try {
    const resp = await fetch(
      `${cfg.url}/rest/v1/collections?season=eq.${_currentSeason}&select=updated_at`, {
      cache: 'no-store',
      headers: authHeaders(cfg, session.access_token),
    });
    if(!resp.ok) return null;
    const rows = await resp.json();
    return (Array.isArray(rows) && rows[0] && rows[0].updated_at) || null;
  } catch(e){ return null; }
}

/* ══════════════════════════════════════════════════════════
   SETTINGS UI (rendered by pin.js renderSettings)
   ══════════════════════════════════════════════════════════ */

export function cloudSectionHTML(){
  return `
    <div class="setv-section">
      <div class="setv-section-title">☁️ ${t('cloud.title')}</div>
      <div class="setv-row" style="flex-direction:column;align-items:stretch;gap:10px;" id="cloudArea">
        ${_cloudAreaHTML()}
      </div>
    </div>`;
}

function _cloudAreaHTML(){
  if(!isCloudConfigured()){
    return `<div class="setv-row-sub">${t('cloud.not_configured')}</div>`;
  }
  const session = loadSession();
  if(session){
    const email = (session.user && session.user.email) || '…';
    return `
      <div class="cloud-status">
        <span class="cloud-dot on" aria-hidden="true"></span>
        <span>${t('cloud.signed_in')} <b>${email}</b></span>
      </div>
      <div class="setv-row-sub">${t('cloud.last_backup')} <span id="cloudLastBackup">…</span></div>
      <div class="cloud-actions">
        <button class="setv-btn" id="cloudPushBtn" type="button">${t('cloud.push_btn')}</button>
        <button class="setv-btn" id="cloudPullBtn" type="button">${t('cloud.pull_btn')}</button>
      </div>
      <div class="cloud-msg" id="cloudSyncMsg" aria-live="polite"></div>
      <div><button class="setv-btn" id="cloudSignOutBtn" type="button">${t('cloud.sign_out')}</button></div>`;
  }
  return `
    <div class="setv-row-left">
      <div class="setv-row-label">${t('cloud.login_label')}</div>
      <div class="setv-row-sub">${t('cloud.login_sub')}</div>
    </div>
    <div class="cloud-login-row">
      <input type="email" class="cloud-email" id="cloudEmail" placeholder="${t('cloud.email_ph')}" autocomplete="email" inputmode="email">
      <button class="setv-btn" id="cloudSendBtn" type="button">${t('cloud.send_link')}</button>
    </div>
    <div class="cloud-login-row" id="cloudCodeRow" style="display:none;">
      <input type="text" class="cloud-email cloud-code" id="cloudCode" placeholder="${t('cloud.code_ph')}" inputmode="numeric" autocomplete="one-time-code" maxlength="10" aria-label="${t('cloud.code_label')}">
      <button class="setv-btn" id="cloudVerifyBtn" type="button">${t('cloud.verify_btn')}</button>
    </div>
    <div class="cloud-msg" id="cloudAuthMsg" aria-live="polite"></div>`;
}

function _refreshCloudArea(){
  const area = document.getElementById('cloudArea');
  if(area){ area.innerHTML = _cloudAreaHTML(); bindCloudSection(); }
}

// Reflect the send cool-down on the button (label countdown, disabled),
// resilient to re-renders: the interval kills itself when the button is
// replaced or the countdown ends.
function _startCooldownUi(sendBtn){
  const tick = () => {
    const btn = document.getElementById('cloudSendBtn');
    if(!btn){ clearInterval(iv); return; }
    const left = sendCooldownRemaining(_lastOtpSentAt, Date.now());
    if(left <= 0){
      btn.disabled = false;
      btn.textContent = t('cloud.send_link');
      clearInterval(iv);
      return;
    }
    btn.disabled = true;
    btn.textContent = t('cloud.resend_in', { s: left });
  };
  const iv = setInterval(tick, 1000);
  tick();
}

export function bindCloudSection(){
  const sendBtn = document.getElementById('cloudSendBtn');
  if(sendBtn){
    // A cool-down may still be running from before a re-render
    if(sendCooldownRemaining(_lastOtpSentAt, Date.now()) > 0) _startCooldownUi(sendBtn);
    sendBtn.addEventListener('click', async () => {
      const input = document.getElementById('cloudEmail');
      const msg = document.getElementById('cloudAuthMsg');
      const email = (input && input.value || '').trim();
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)){
        if(msg){ msg.textContent = t('cloud.invalid_email'); msg.className = 'cloud-msg err'; }
        return;
      }
      if(!navigator.onLine){
        if(msg){ msg.textContent = t('cloud.offline'); msg.className = 'cloud-msg err'; }
        return;
      }
      if(sendCooldownRemaining(_lastOtpSentAt, Date.now()) > 0) return; // guard
      sendBtn.disabled = true;
      if(msg){ msg.textContent = t('cloud.sending'); msg.className = 'cloud-msg'; }
      try {
        await sendMagicLink(email);
        _lastOtpSentAt = Date.now();
        _startCooldownUi(sendBtn);
        const codeRow = document.getElementById('cloudCodeRow');
        if(codeRow){ codeRow.style.display = ''; }
        const codeInput = document.getElementById('cloudCode');
        if(codeInput) codeInput.focus();
        if(msg){ msg.textContent = t('cloud.link_sent'); msg.className = 'cloud-msg ok'; }
      } catch(e){
        log('cloud: send failed', e);
        if(e.message === 'rate-limited'){
          _lastOtpSentAt = Date.now(); // server said stop: hold the button too
          _startCooldownUi(sendBtn);
          if(msg){ msg.textContent = t('cloud.rate_limited'); msg.className = 'cloud-msg err'; }
        } else {
          if(msg){ msg.textContent = e.message === 'offline' ? t('cloud.offline') : t('cloud.link_error'); msg.className = 'cloud-msg err'; }
          sendBtn.disabled = false;
        }
      }
    });
  }
  const verifyBtn = document.getElementById('cloudVerifyBtn');
  if(verifyBtn){
    verifyBtn.addEventListener('click', async () => {
      const msg = document.getElementById('cloudAuthMsg');
      const email = (document.getElementById('cloudEmail')?.value || '').trim();
      const code = normalizeOtpInput(document.getElementById('cloudCode')?.value);
      if(!isValidOtpFormat(code)){
        if(msg){ msg.textContent = t('cloud.code_err'); msg.className = 'cloud-msg err'; }
        return;
      }
      verifyBtn.disabled = true;
      if(msg){ msg.textContent = t('cloud.verifying'); msg.className = 'cloud-msg'; }
      try {
        await verifyOtpCode(email, code);
        _refreshCloudArea(); // → signed-in state
      } catch(e){
        log('cloud: verify error', e);
        const key = e.message === 'offline' ? 'cloud.offline'
                  : e.message === 'rate-limited' ? 'cloud.rate_limited' : 'cloud.code_err';
        if(msg){ msg.textContent = t(key); msg.className = 'cloud-msg err'; }
        verifyBtn.disabled = false;
      }
    });
  }
  const outBtn = document.getElementById('cloudSignOutBtn');
  if(outBtn){
    outBtn.addEventListener('click', async () => {
      outBtn.disabled = true;
      await signOut();
      _refreshCloudArea();
    });
  }

  // Signed-in extras: last-backup date + push/pull actions
  _fillLastBackup();
  const errKey = e => ({
    'offline': 'cloud.offline',
    'not-signed-in': 'cloud.expired',
    'no-data': 'cloud.no_data',
    'bad-data': 'cloud.pull_err',
    'push-failed': 'cloud.push_err',
    'pull-failed': 'cloud.pull_err',
  }[e && e.message] || 'cloud.push_err');
  const msgEl = () => document.getElementById('cloudSyncMsg');
  const setMsg = (key, cls) => { const m = msgEl(); if(m){ m.textContent = t(key); m.className = 'cloud-msg ' + (cls || ''); } };

  const pushBtn = document.getElementById('cloudPushBtn');
  if(pushBtn){
    pushBtn.addEventListener('click', async () => {
      pushBtn.disabled = true;
      setMsg('cloud.sending');
      try {
        const at = await pushCollection();
        setMsg('cloud.push_ok', 'ok');
        _setLastBackup(at);
      } catch(e){
        log('cloud: push error', e);
        setMsg(errKey(e), 'err');
        if(e.message === 'not-signed-in') _refreshCloudArea(); // session died
      }
      pushBtn.disabled = false;
    });
  }
  const pullBtn = document.getElementById('cloudPullBtn');
  if(pullBtn){
    pullBtn.addEventListener('click', async () => {
      pullBtn.disabled = true;
      setMsg('cloud.sending');
      try {
        await pullCollection(); // opens the merge/replace dialog
        setMsg('cloud.pull_ready', 'ok');
      } catch(e){
        log('cloud: pull error', e);
        setMsg(errKey(e), 'err');
        if(e.message === 'not-signed-in') _refreshCloudArea();
      }
      pullBtn.disabled = false;
    });
  }
}

function _setLastBackup(updatedAt){
  const el = document.getElementById('cloudLastBackup');
  if(!el) return;
  el.textContent = updatedAt ? new Date(updatedAt).toLocaleString() : t('cloud.never');
}
function _fillLastBackup(){
  if(!document.getElementById('cloudLastBackup')) return;
  fetchCloudMeta().then(_setLastBackup).catch(() => _setLastBackup(null));
}
