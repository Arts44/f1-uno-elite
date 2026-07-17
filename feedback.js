/* ══════════════════════════════════════════════════════════
   FEEDBACK — in-app suggestions/bug reports, stored in Supabase.
   - Pure REST fetch() to /rest/v1/feedback (no SDK), reusing the
     cloud session (getValidSession) and headers from cloud.js.
   - Cloud sign-in REQUIRED (RLS: insert/select own rows only) — the
     Settings section shows a sign-in hint instead of the form when
     signed out.
   - Server-side guards (SQL): message length 3–1000, max 5 rows per
     user per hour (trigger raises 'rate_limited'). The UI mirrors
     them: live counter, validation, and a send cool-down.
   - The service worker never touches these calls: the whole
     *.supabase.co origin is excluded from caching, and every request
     here is cache:'no-store'.
   ══════════════════════════════════════════════════════════ */
import { log } from './logger.js';
import { t, getLang } from './i18n.js';
import { APP_VERSION } from './changelog.js';
import {
  cloudConfig, isCloudConfigured, authHeaders, getValidSession,
  loadSession, decodeJwtSub, sendCooldownRemaining,
} from './cloud.js';

export const FEEDBACK_MIN = 3;      // mirrors the SQL check constraint
export const FEEDBACK_MAX = 1000;   // mirrors the SQL check constraint
export const FEEDBACK_TYPES = ['suggestion', 'bug', 'other'];
export const FEEDBACK_COOLDOWN_MS = 60000;

let _lastSentAt = 0;

/* ── Pure helpers (unit-tested) ── */

// 'ok' | 'empty' | 'too-short' | 'too-long' — on the TRIMMED message,
// like the SQL constraint (char_length(btrim(message)) between 3 and 1000).
export function validateFeedbackMessage(message){
  const m = String(message == null ? '' : message).trim();
  if(m.length === 0) return 'empty';
  if(m.length < FEEDBACK_MIN) return 'too-short';
  if(m.length > FEEDBACK_MAX) return 'too-long';
  return 'ok';
}

// The row sent to PostgREST. app_version and lang travel automatically —
// they cost the user nothing and make triage possible.
export function buildFeedbackPayload(userId, type, message, appVersion = APP_VERSION, lang = null){
  return {
    user_id: userId,
    type: FEEDBACK_TYPES.includes(type) ? type : 'other',
    message: String(message).trim(),
    app_version: String(appVersion).slice(0, 20),
    lang: (lang || (typeof localStorage !== 'undefined' && localStorage.getItem('f1uno_lang')) || 'en').slice(0, 5),
  };
}

// Remaining cool-down in SECONDS (sendCooldownRemaining's unit), 0 when
// nothing was sent yet or the window has passed.
export function feedbackCooldownRemaining(now, last = _lastSentAt, cooldownMs = FEEDBACK_COOLDOWN_MS){
  return sendCooldownRemaining(last, now, cooldownMs);
}

/* ── REST calls ──
   Typed failures via Error(message) where message is one of:
   'not-configured' | 'offline' | 'invalid' | 'not-signed-in' |
   'session-expired' | 'rate-limited' | 'send-failed' */

export async function sendFeedback(type, message){
  const cfg = cloudConfig();
  if(!cfg) throw new Error('not-configured');
  if(typeof navigator !== 'undefined' && navigator.onLine === false) throw new Error('offline');
  if(validateFeedbackMessage(message) !== 'ok') throw new Error('invalid');
  const session = await getValidSession();
  if(!session) throw new Error('not-signed-in');
  const userId = decodeJwtSub(session.access_token);
  if(!userId) throw new Error('not-signed-in');
  const payload = buildFeedbackPayload(userId, type, message);
  let res;
  try {
    res = await fetch(`${cfg.url}/rest/v1/feedback`, {
      method: 'POST',
      headers: { ...authHeaders(cfg, session.access_token), Prefer: 'return=minimal' },
      cache: 'no-store',
      body: JSON.stringify(payload),
    });
  } catch(e){
    throw new Error('offline');
  }
  if(res.status === 201){
    _lastSentAt = Date.now();
    log('feedback sent:', payload.type, payload.message.length, 'chars');
    return true;
  }
  if(res.status === 401) throw new Error('session-expired');
  const body = await res.text().catch(() => '');
  if(body.includes('rate_limited')) throw new Error('rate-limited');
  log('feedback send failed:', res.status, body.slice(0, 200));
  throw new Error('send-failed');
}

// Review what I already sent (RLS: only my own rows are readable).
export async function fetchMyFeedback(limit = 10){
  const cfg = cloudConfig();
  if(!cfg) throw new Error('not-configured');
  const session = await getValidSession();
  if(!session) throw new Error('not-signed-in');
  const res = await fetch(
    `${cfg.url}/rest/v1/feedback?select=created_at,type,message&order=created_at.desc&limit=${limit}`,
    { headers: authHeaders(cfg, session.access_token), cache: 'no-store' });
  if(res.status === 401) throw new Error('session-expired');
  if(!res.ok) throw new Error('send-failed');
  return res.json();
}

/* ══════════════════════════════════════════════════════════
   Settings UI (mirrors the cloud section pattern)
   ══════════════════════════════════════════════════════════ */

export function feedbackSectionHTML(){
  if(!isCloudConfigured()) return '';
  const signedIn = !!loadSession();
  return `
    <div class="setv-section">
      <div class="setv-section-title">${t('fb.title')}</div>
      ${signedIn ? `
      <div class="setv-row" style="flex-direction:column;align-items:stretch;gap:10px;">
        <div class="setv-row-sub">${t('fb.sub')}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <select class="setv-lang-sel" id="fbType">
            <option value="suggestion">${t('fb.type_suggestion')}</option>
            <option value="bug">${t('fb.type_bug')}</option>
            <option value="other">${t('fb.type_other')}</option>
          </select>
        </div>
        <textarea id="fbMsg" rows="4" maxlength="${FEEDBACK_MAX}" placeholder="${t('fb.msg_ph')}" style="width:100%;resize:vertical;font-family:var(--font-b);font-size:13px;line-height:1.5;padding:10px;border-radius:8px;border:1px solid var(--border);background:var(--surface2);color:var(--tx1);"></textarea>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
          <span class="setv-row-sub" id="fbCount">0/${FEEDBACK_MAX}</span>
          <div style="display:flex;gap:8px;">
            <button class="setv-btn" id="fbMineBtn">${t('fb.mine_btn')}</button>
            <button class="setv-btn" id="fbSendBtn">${t('fb.send')}</button>
          </div>
        </div>
        <div class="pin-form-error" id="fbStatus" aria-live="polite"></div>
        <div id="fbMineArea" style="display:none;flex-direction:column;gap:6px;"></div>
      </div>` : `
      <div class="setv-row">
        <div class="setv-row-left">
          <div class="setv-row-label">${t('fb.need_login')}</div>
          <div class="setv-row-sub">${t('fb.need_login_sub')}</div>
        </div>
      </div>`}
    </div>`;
}

export function bindFeedbackSection(){
  const msg = document.getElementById('fbMsg');
  if(!msg) return; // signed out (hint only) or cloud disabled
  const count = document.getElementById('fbCount');
  const status = document.getElementById('fbStatus');
  const sendBtn = document.getElementById('fbSendBtn');

  msg.addEventListener('input', () => {
    count.textContent = `${msg.value.trim().length}/${FEEDBACK_MAX}`;
  });

  sendBtn.addEventListener('click', async () => {
    if(sendBtn.disabled) return;
    const v = validateFeedbackMessage(msg.value);
    if(v !== 'ok'){
      status.textContent = t(v === 'too-long' ? 'fb.err_long' : 'fb.err_short');
      return;
    }
    const cdSec = feedbackCooldownRemaining(Date.now());
    if(cdSec > 0){
      status.textContent = t('cloud.resend_in', { s: cdSec });
      return;
    }
    sendBtn.disabled = true;
    status.textContent = t('fb.sending');
    try {
      await sendFeedback(document.getElementById('fbType').value, msg.value);
      msg.value = '';
      count.textContent = `0/${FEEDBACK_MAX}`;
      status.textContent = t('fb.thanks');
    } catch(e){
      const KEYS = {
        'offline': 'cloud.offline',
        'not-signed-in': 'fb.err_session',
        'session-expired': 'fb.err_session',
        'rate-limited': 'fb.err_rate',
        'invalid': 'fb.err_short',
      };
      status.textContent = t(KEYS[e.message] || 'fb.err_failed');
    } finally {
      // short UI cool-down against rapid-fire sends (the 60s module
      // cool-down and the server 5/hour throttle stay in charge)
      setTimeout(() => { sendBtn.disabled = false; }, 4000);
    }
  });

  document.getElementById('fbMineBtn')?.addEventListener('click', async () => {
    const area = document.getElementById('fbMineArea');
    if(area.style.display !== 'none'){ area.style.display = 'none'; return; }
    area.style.display = 'flex';
    area.innerHTML = `<span class="setv-row-sub">${t('fb.sending')}</span>`;
    try {
      const rows = await fetchMyFeedback();
      area.innerHTML = rows.length
        ? rows.map(r => `<div class="setv-row-sub" style="border:1px solid var(--border);border-radius:8px;padding:8px 10px;">
            <strong>${t('fb.type_' + (FEEDBACK_TYPES.includes(r.type) ? r.type : 'other'))}</strong> · ${new Date(r.created_at).toLocaleDateString()}<br>${_esc(r.message)}</div>`).join('')
        : `<span class="setv-row-sub">${t('fb.mine_empty')}</span>`;
    } catch(e){
      area.innerHTML = `<span class="setv-row-sub">${t('fb.err_failed')}</span>`;
    }
  });
}

function _esc(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
