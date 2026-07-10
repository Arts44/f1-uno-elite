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
  });
  if(!resp.ok){
    const body = await resp.text().catch(() => '');
    log('cloud: otp failed', resp.status, body);
    throw new Error('otp-failed');
  }
  return true;
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
    <div class="cloud-msg" id="cloudAuthMsg" aria-live="polite"></div>`;
}

function _refreshCloudArea(){
  const area = document.getElementById('cloudArea');
  if(area){ area.innerHTML = _cloudAreaHTML(); bindCloudSection(); }
}

export function bindCloudSection(){
  const sendBtn = document.getElementById('cloudSendBtn');
  if(sendBtn){
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
      sendBtn.disabled = true;
      if(msg){ msg.textContent = t('cloud.sending'); msg.className = 'cloud-msg'; }
      try {
        await sendMagicLink(email);
        if(msg){ msg.textContent = t('cloud.link_sent'); msg.className = 'cloud-msg ok'; }
      } catch(e){
        if(msg){ msg.textContent = t('cloud.link_error'); msg.className = 'cloud-msg err'; }
        sendBtn.disabled = false;
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
}
