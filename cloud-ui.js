/* ══════════════════════════════════════════════════════════
   CLOUD · INTERFACE — la section « Cloud » des Réglages.

   POURQUOI CE MODULE EXISTE (et pas pour un compteur) :

   C'est la SEULE partie du cloud qui touche le DOM et i18n. La
   séparer est ce qui rend les trois autres testables sans DOM —
   et la phase 1 a démontré le coût de l'inverse : il a fallu
   écrire un mini-DOM entier (tests/_dom.js) pour atteindre des
   fonctions d'authentification pures, enfermées dans le même
   fichier que 180 lignes de câblage.

   Position dans la pile : ui → sync → auth → http.
   Ce module ne parle JAMAIS au réseau directement : il appelle
   cloud-auth et cloud-sync, et traduit leurs codes d'erreur typés
   en messages. C'est tout ce qu'il fait.
   ══════════════════════════════════════════════════════════ */
import { log } from './logger.js';
import { isCloudConfigured } from './cloud-http.js';
import {
  loadSession, sendCooldownRemaining, isValidOtpFormat,
  sendMagicLink, verifyOtpCode, signOut, requestEmailChange,
} from './cloud-auth.js';
import { pushCollection, pullCollection, fetchCloudMeta } from './cloud-sync.js';
import { t, escapeHtml, setSafeHTML } from './i18n.js';
import { icon } from './icons.js';
import { createSegmentedInput } from './otp-input.js';

// État du cool-down d'envoi : il appartient à l'UI (c'est elle qui
// bloque le bouton), et il descendra dans cloud-ui.js au pas 4.
// `sendCooldownRemaining` reste pur, dans cloud-auth.js — feedback.js
// l'utilise avec SON propre horodatage. Helper partagé, état local :
// c'est déjà le motif du dépôt.
let _lastOtpSentAt = 0;

/* ── Factorisation n°4 : la règle de validation d'adresse ──
   Elle existait en deux copies (connexion et changement d'e-mail). Une
   règle de validation en deux exemplaires finit toujours par en devenir
   DEUX règles. Le littéral n'est pas global : `.test()` est sans état,
   la constante est donc partageable sans risque de lastIndex. ── */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ── Factorisation n°5 : poser un message dans une zone ──
   Le motif `if(msg){ msg.textContent = t(k); msg.className = … }` était
   écrit 17 fois pour TROIS zones. Un helper existait déjà — mais pour
   une seule des trois. Les deux autres refaisaient à la main ce que la
   troisième faisait proprement : une seule décision, trois écritures.
   Le style ('ok' / 'err' / rien) reste au site d'appel : c'est lui qui
   sait si l'opération a réussi. ── */
const msgSetter = id => (key, cls) => {
  const m = document.getElementById(id);
  if(!m) return;
  m.textContent = t(key);
  m.className = cls ? 'cloud-msg ' + cls : 'cloud-msg';
};

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
      const setMsg = msgSetter('cloudAuthMsg');
      const email = (input && input.value || '').trim();
      if(!EMAIL_RE.test(email)){
        setMsg('cloud.invalid_email', 'err');
        return;
      }
      if(!navigator.onLine){
        setMsg('cloud.offline', 'err');
        return;
      }
      if(sendCooldownRemaining(_lastOtpSentAt, Date.now()) > 0) return; // guard
      sendBtn.disabled = true;
      setMsg('cloud.sending');
      try {
        await sendMagicLink(email);
        _lastOtpSentAt = Date.now();
        _startCooldownUi(sendBtn);
        const codeRow = document.getElementById('cloudCodeRow');
        if(codeRow){ codeRow.style.display = ''; }
        const codeInput = document.getElementById('cloudCode');
        if(codeInput) codeInput.focus();
        setMsg('cloud.link_sent', 'ok');
      } catch(e){
        log('cloud: send failed', e);
        if(e.message === 'rate-limited'){
          _lastOtpSentAt = Date.now(); // server said stop: hold the button too
          _startCooldownUi(sendBtn);
          setMsg('cloud.rate_limited', 'err');
        } else {
          const KEY = {
            'offline':          'cloud.offline',
            'email-not-allowed':'cloud.email_not_allowed',
            'signups-closed':   'cloud.signups_closed',
            'mail-down':        'cloud.mail_down',
          };
          setMsg(KEY[e.message] || 'cloud.link_error', 'err');
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
    const setMsg = msgSetter('cloudAuthMsg');
    const email = (document.getElementById('cloudEmail')?.value || '').trim();
    const code = otpApi ? otpApi.value() : '';
    if(!isValidOtpFormat(code)){
      setMsg('cloud.code_err', 'err');
      if(otpApi) otpApi.setState('error');
      return;
    }
    verifyBtn.disabled = true;
    setMsg('cloud.verifying');
    try {
      await verifyOtpCode(email, code);
      if(otpApi){
        // Succès : cases vertes, check dessiné, texte, puis bascule
        otpApi.setState('success');
        setMsg('cloud.otp_verified', 'ok');
        const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        setTimeout(() => _refreshCloudArea(), reduce ? 150 : 1100);
      } else {
        _refreshCloudArea(); // → signed-in state
      }
    } catch(e){
      log('cloud: verify error', e);
      const key = e.message === 'offline' ? 'cloud.offline'
                : e.message === 'rate-limited' ? 'cloud.rate_limited' : 'cloud.code_err';
      setMsg(key, 'err');
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
      const setMsg = msgSetter('cloudEmailChgMsg');
      const btn = document.getElementById('cloudEmailChgSendBtn');
      const email = (document.getElementById('cloudNewEmail')?.value || '').trim();
      if(!EMAIL_RE.test(email)){
        setMsg('cloud.invalid_email', 'err');
        return;
      }
      btn.disabled = true;
      setMsg('cloud.sending');
      try {
        await requestEmailChange(email);
        setMsg('cloud.change_email_sent', 'ok');
      } catch(e){
        log('cloud: email change error', e);
        const key = e.message === 'offline' ? 'cloud.offline'
                  : e.message === 'rate-limited' ? 'cloud.rate_limited' : 'cloud.change_email_err';
        setMsg(key, 'err');
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
  const setSyncMsg = msgSetter('cloudSyncMsg');

  const pushBtn = document.getElementById('cloudPushBtn');
  if(pushBtn){
    pushBtn.addEventListener('click', async () => {
      pushBtn.disabled = true;
      setSyncMsg('cloud.sending');
      try {
        const at = await pushCollection();
        setSyncMsg('cloud.push_ok', 'ok');
        _setLastBackup(at);
      } catch(e){
        log('cloud: push error', e);
        setSyncMsg(errKey(e), 'err');
        if(e.message === 'not-signed-in') _refreshCloudArea(); // session died
      }
      pushBtn.disabled = false;
    });
  }
  const pullBtn = document.getElementById('cloudPullBtn');
  if(pullBtn){
    pullBtn.addEventListener('click', async () => {
      pullBtn.disabled = true;
      setSyncMsg('cloud.sending');
      try {
        await pullCollection(); // opens the merge/replace dialog
        setSyncMsg('cloud.pull_ready', 'ok');
      } catch(e){
        log('cloud: pull error', e);
        setSyncMsg(errKey(e), 'err');
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
