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
import { cloudConfig, isCloudConfigured, authHeaders, cloudFetch, logFailure } from './cloud-http.js';
import {
  loadSession, clearSession, getValidSession,
  isValidOtpFormat, sendCooldownRemaining, sendMagicLink, verifyOtpCode,
  signOut, requestEmailChange, _requireOnline, _requireSession,
} from './cloud-auth.js';
import { deniedForViewer } from './session.js';
import { t, escapeHtml, setSafeHTML } from './i18n.js';
import { collectionSnapshot, _showImportDialog } from './storage.js';
import { backupIncludes } from './settings-sync.js';
import { icon } from './icons.js';
import { markBackupDone } from './backup.js';
import { _currentSeason } from './data.js';
import { createSegmentedInput } from './otp-input.js';

/* ── Baril de transition (pas 5 le supprimera) ──
   La surface publique de cloud.js ne bouge pas tant que les trois
   consommateurs (app.js, account.js, feedback.js) n'ont pas été
   repointés sur les vrais modules. Chaque pas reste ainsi un pur
   déplacement, vérifiable par des tests inchangés. ── */
export {
  cloudConfig, isCloudConfigured, authHeaders,
} from './cloud-http.js';
export {
  SESSION_KEY, loadSession, saveSession, clearSession,
  parseSessionFromHash, isSessionExpired, decodeJwtSub,
  sendMagicLink, classifyOtpError, verifyOtpCode,
  normalizeOtpInput, isValidOtpFormat,
  SEND_COOLDOWN_MS, sendCooldownRemaining,
  getValidSession, handleAuthRedirect, signOut, requestEmailChange,
} from './cloud-auth.js';

// PostgREST upsert body for one (user, season) row. Pure for tests.
// updated_at is intentionally absent: the server trigger owns it.
export function buildUpsertRow(userId, season, snapshot){
  return { user_id: userId, season, data: snapshot };
}

// Upsert the current season's snapshot. Returns the server updated_at.
export async function pushCollection(){
  if(deniedForViewer()) throw new Error('read-only');   // refus même en appel direct
  const cfg = cloudConfig();
  if(!cfg) throw new Error('not-signed-in');
  _requireOnline();
  const { session, userId } = await _requireSession();
  const row = buildUpsertRow(userId, _currentSeason, collectionSnapshot(backupIncludes()));
  const resp = await cloudFetch(`${cfg.url}/rest/v1/collections?on_conflict=user_id,season`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      ...authHeaders(cfg, session.access_token),
      'Prefer': 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify([row]),
  });
  if(resp.status === 401 || resp.status === 403){
    // token révoqué côté serveur : session morte — purge + message typé
    clearSession();
    throw new Error('not-signed-in');
  }
  if(!resp.ok){
    await logFailure('cloud: push failed', resp);
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
  if(deniedForViewer()) throw new Error('read-only');   // refus même en appel direct
  const cfg = cloudConfig();
  if(!cfg) throw new Error('not-signed-in');
  _requireOnline();
  const { session } = await _requireSession();
  const resp = await cloudFetch(
    `${cfg.url}/rest/v1/collections?season=eq.${_currentSeason}&select=data,updated_at`, {
    cache: 'no-store',
    headers: authHeaders(cfg, session.access_token),
  });
  if(resp.status === 401 || resp.status === 403){
    // token révoqué côté serveur : session morte — purge + message typé
    clearSession();
    throw new Error('not-signed-in');
  }
  if(!resp.ok){
    await logFailure('cloud: pull failed', resp);
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

// True when a session exists locally (used by the Account view to gate
// cloud-scoped actions; token freshness is re-checked by the actions).
export function isCloudSignedIn(){
  return isCloudConfigured() && !!loadSession();
}

// Danger zone: delete EVERY season row of the signed-in user (RLS keeps
// this scoped to their own rows server-side).
export async function cloudDeleteAll(){
  if(deniedForViewer()) throw new Error('read-only');   // refus même en appel direct
  const cfg = cloudConfig();
  if(!cfg) throw new Error('not-signed-in');
  _requireOnline();
  const { session, userId } = await _requireSession();
  const resp = await cloudFetch(`${cfg.url}/rest/v1/collections?user_id=eq.${userId}`, {
    method: 'DELETE',
    cache: 'no-store',
    headers: authHeaders(cfg, session.access_token),
  });
  if(!resp.ok){
    await logFailure('cloud: delete failed', resp);
    throw new Error('delete-failed');
  }
  return true;
}

// Lightweight metadata read for the "last cloud backup" line.
export async function fetchCloudMeta(){
  const cfg = cloudConfig();
  if(!cfg) return null;
  const session = await getValidSession();
  if(!session) return null;
  try {
    const resp = await cloudFetch(
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

// État du cool-down d'envoi : il appartient à l'UI (c'est elle qui
// bloque le bouton), et il descendra dans cloud-ui.js au pas 4.
// `sendCooldownRemaining` reste pur, dans cloud-auth.js — feedback.js
// l'utilise avec SON propre horodatage. Helper partagé, état local :
// c'est déjà le motif du dépôt.
let _lastOtpSentAt = 0;

export function cloudSectionHTML(){
  return `
    <div class="setv-section">
      <div class="setv-section-title">${icon('cloud')} ${t('cloud.title')}</div>
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
        <span>${t('cloud.signed_in')} <b>${escapeHtml(email)}</b></span>
      </div>
      <div class="setv-row-sub">${t('cloud.last_backup')} <span id="cloudLastBackup">…</span></div>
      <div class="cloud-actions">
        <button class="setv-btn" id="cloudPushBtn" type="button">${t('cloud.push_btn')}</button>
        <button class="setv-btn" id="cloudPullBtn" type="button">${t('cloud.pull_btn')}</button>
      </div>
      <div class="cloud-msg" id="cloudSyncMsg" aria-live="polite"></div>
      <div class="cloud-actions">
        <button class="setv-btn" id="cloudSignOutBtn" type="button">${t('cloud.sign_out')}</button>
        <button class="setv-btn" id="cloudEmailChgBtn" type="button">${t('cloud.change_email')}</button>
      </div>
      <div class="cloud-login-row" id="cloudEmailChgRow" style="display:none;">
        <input type="email" class="cloud-email" id="cloudNewEmail" placeholder="${t('cloud.new_email_ph')}" autocomplete="email" inputmode="email">
        <button class="setv-btn" id="cloudEmailChgSendBtn" type="button">${t('cloud.change_email_send')}</button>
      </div>
      <div class="cloud-msg" id="cloudEmailChgMsg" aria-live="polite"></div>`;
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
    <div class="cloud-login-row cloud-otp-row" id="cloudCodeRow" style="display:none;">
      <div id="otpWrap"></div>
      <button class="setv-btn" id="cloudVerifyBtn" type="button">${t('cloud.verify_btn')}</button>
    </div>
    <div class="cloud-msg" id="cloudAuthMsg" aria-live="polite"></div>`;
}

function _refreshCloudArea(){
  const area = document.getElementById('cloudArea');
  if(area){ setSafeHTML(area, _cloudAreaHTML()); bindCloudSection(); }
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
          const KEY = {
            'offline':          'cloud.offline',
            'email-not-allowed':'cloud.email_not_allowed',
            'signups-closed':   'cloud.signups_closed',
            'mail-down':        'cloud.mail_down',
          };
          if(msg){ msg.textContent = t(KEY[e.message] || 'cloud.link_error'); msg.className = 'cloud-msg err'; }
          sendBtn.disabled = false;
        }
      }
    });
  }
  // ── Saisie OTP : instance du composant segmenté partagé.
  //    L'input caché garde l'id cloudCode (tests, autofill) et le
  //    code complet déclenche la vérification tout seul. ──
  const otpHost = document.getElementById('otpWrap');
  const verifyBtn = document.getElementById('cloudVerifyBtn');
  let otpApi = null;
  const doVerify = async () => {
    if(!verifyBtn || verifyBtn.disabled) return;
    const msg = document.getElementById('cloudAuthMsg');
    const email = (document.getElementById('cloudEmail')?.value || '').trim();
    const code = otpApi ? otpApi.value() : '';
    if(!isValidOtpFormat(code)){
      if(msg){ msg.textContent = t('cloud.code_err'); msg.className = 'cloud-msg err'; }
      if(otpApi) otpApi.setState('error');
      return;
    }
    verifyBtn.disabled = true;
    if(msg){ msg.textContent = t('cloud.verifying'); msg.className = 'cloud-msg'; }
    try {
      await verifyOtpCode(email, code);
      if(otpApi){
        // Succès : cases vertes, check dessiné, texte, puis bascule
        otpApi.setState('success');
        if(msg){ msg.textContent = t('cloud.otp_verified'); msg.className = 'cloud-msg ok'; }
        const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        setTimeout(() => _refreshCloudArea(), reduce ? 150 : 1100);
      } else {
        _refreshCloudArea(); // → signed-in state
      }
    } catch(e){
      log('cloud: verify error', e);
      const key = e.message === 'offline' ? 'cloud.offline'
                : e.message === 'rate-limited' ? 'cloud.rate_limited' : 'cloud.code_err';
      if(msg){ msg.textContent = t(key); msg.className = 'cloud-msg err'; }
      if(otpApi) otpApi.setState('error');
      verifyBtn.disabled = false;
    }
  };
  if(otpHost){
    otpApi = createSegmentedInput(otpHost, {
      length: 8, inputId: 'cloudCode', ariaLabel: t('cloud.code_label'),
      autoSubmit: true, onComplete: doVerify,
    });
  }
  if(verifyBtn){ verifyBtn.addEventListener('click', doVerify); }
  const outBtn = document.getElementById('cloudSignOutBtn');
  if(outBtn){
    outBtn.addEventListener('click', async () => {
      outBtn.disabled = true;
      await signOut();
      _refreshCloudArea();
    });
  }

  // Change email: reveal the input row, then PUT /auth/v1/user.
  const chgBtn = document.getElementById('cloudEmailChgBtn');
  if(chgBtn){
    chgBtn.addEventListener('click', () => {
      const row = document.getElementById('cloudEmailChgRow');
      if(row){ row.style.display = row.style.display === 'none' ? '' : 'none'; }
      document.getElementById('cloudNewEmail')?.focus();
    });
    document.getElementById('cloudEmailChgSendBtn')?.addEventListener('click', async () => {
      const msg = document.getElementById('cloudEmailChgMsg');
      const btn = document.getElementById('cloudEmailChgSendBtn');
      const email = (document.getElementById('cloudNewEmail')?.value || '').trim();
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)){
        if(msg){ msg.textContent = t('cloud.invalid_email'); msg.className = 'cloud-msg err'; }
        return;
      }
      btn.disabled = true;
      if(msg){ msg.textContent = t('cloud.sending'); msg.className = 'cloud-msg'; }
      try {
        await requestEmailChange(email);
        if(msg){ msg.textContent = t('cloud.change_email_sent'); msg.className = 'cloud-msg ok'; }
      } catch(e){
        log('cloud: email change error', e);
        const key = e.message === 'offline' ? 'cloud.offline'
                  : e.message === 'rate-limited' ? 'cloud.rate_limited' : 'cloud.change_email_err';
        if(msg){ msg.textContent = t(key); msg.className = 'cloud-msg err'; }
        btn.disabled = false;
      }
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
