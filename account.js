/* ══════════════════════════════════════════════════════════
   ACCOUNT — the « Compte » view: cloud session (Supabase),
   device backups (code + QR, export/import), feedback, and the
   danger zone (data deletion with strong confirmation).
   These sections MOVED here from Réglages (pin.js) — no dupes.
   ══════════════════════════════════════════════════════════ */
import { log } from './logger.js';
import { deniedForViewer } from './session.js';
import { t } from './i18n.js';
import { showToast, renderCollection } from './render.js';
import { updateStats } from './stats.js';
import { triggerImport, collectionSnapshot, _showImportDialog, deleteLocalCollectionData } from './storage.js';
import { generateBackupCode, decodeBackupCode, markBackupDone, buildBackupLink, makeBackupQrSvg } from './backup.js';
import { backupIncludes, setBackupIncludes } from './settings-sync.js';
import { cloudSectionHTML, bindCloudSection, isCloudSignedIn, cloudDeleteAll } from './cloud.js';
import { feedbackSectionHTML, bindFeedbackSection } from './feedback.js';
import { showAdminPinScreen } from './pin.js';

/* ── Deletion logic (pure, unit-tested) ── */
export const DELETE_SCOPES = ['local', 'cloud', 'both'];

// The typed confirmation must match the localized word exactly
// (case-insensitive, surrounding spaces ignored). Anything else → no.
export function canConfirmDeletion(input, word){
  if(typeof input !== 'string' || typeof word !== 'string' || !word) return false;
  return input.trim().toUpperCase() === word.trim().toUpperCase();
}

// What a given scope actually deletes. Cloud deletion requires a live
// session — without one the cloud part is off, never silently assumed.
export function deletionPlan(scope, cloudConnected){
  if(!DELETE_SCOPES.includes(scope)) throw new Error('bad-scope');
  return {
    local: scope === 'local' || scope === 'both',
    cloud: (scope === 'cloud' || scope === 'both') && !!cloudConnected,
  };
}

/* ── Vue verrouillée (mode spectateur) ──
   On ne DÉSACTIVE pas les contrôles, on ne les rend pas du tout :
   un `disabled` se retire en une ligne de console, une absence non.
   L'écran explique le refus ET donne la sortie (passer en admin) —
   un état bloqué sans issue est un cul-de-sac. */
function _lockedAccountHTML(){
  return `
    <h2 class="setv-title">${t('acc.title')}</h2>
    <div class="setv-section acc-locked">
      <svg class="acc-lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <div class="acc-locked-title">${t('acc.locked_title')}</div>
      <p class="acc-locked-msg">${t('acc.locked_msg')}</p>
      <button class="setv-btn" id="accAdminBtn" type="button">${t('acc.locked_btn')}</button>
    </div>`;
}

/* ── View ── */
export function renderAccount(){
  const el = document.getElementById('accountView');
  if(!el) return;
  if(deniedForViewer()){
    el.innerHTML = _lockedAccountHTML();
    el.querySelector('#accAdminBtn')?.addEventListener('click', showAdminPinScreen);
    return;
  }
  el.innerHTML = `
    <h2 class="setv-title">👤 ${t('acc.title')}</h2>

    <div class="acc-accent acc-cloud">${cloudSectionHTML()}</div>

    <div class="acc-accent acc-backup">
    <div class="setv-section">
      <div class="setv-section-title">${t('s.collection')}</div>
      <div class="setv-row" style="flex-direction:column;align-items:stretch;gap:8px;">
        <div class="setv-row-left">
          <div class="setv-row-label">${t('bk.inc_title')}</div>
          <div class="setv-row-sub">${t('bk.inc_sub')}</div>
        </div>
        <label class="import-set-row"><input type="checkbox" id="bkIncPrefs"${backupIncludes().prefs?' checked':''}> <span>${t('bk.inc_prefs')}</span></label>
        <label class="import-set-row"><input type="checkbox" id="bkIncSec"${backupIncludes().security?' checked':''}> <span>${t('bk.inc_sec')}</span></label>
      </div>
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
      <div class="setv-row">
        <div class="setv-row-left">
          <div class="setv-row-label">${t('s.bkcode')}</div>
          <div class="setv-row-sub">${t('s.bkcode_sub')}</div>
        </div>
        <button class="setv-btn" id="backupCodeBtn">${t('s.bkcode_btn')}</button>
      </div>
      <div class="setv-row" id="backupCodeArea" style="display:none;flex-direction:column;align-items:stretch;gap:8px;">
        <textarea id="backupCodeOut" readonly rows="4" style="width:100%;resize:vertical;font-family:monospace;font-size:11px;padding:8px;border-radius:8px;border:1px solid var(--border);background:var(--surface2);color:var(--tx1);"></textarea>
        <div class="pin-form-error" id="backupCodeWarn"></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="setv-btn" id="backupCopyBtn">${t('bk.copy')}</button>
          <button class="setv-btn" id="backupQrBtn">${t('bk.show_qr')}</button>
        </div>
        <div class="bk-qr-wrap" id="backupQrWrap" style="display:none;">
          <div class="bk-qr" id="backupQr" aria-label="${t('bk.qr_alt')}"></div>
          <div class="bk-qr-hint" id="backupQrHint">${t('bk.qr_hint')}</div>
        </div>
      </div>
      <div class="setv-row">
        <div class="setv-row-left">
          <div class="setv-row-label">${t('s.bkrestore')}</div>
          <div class="setv-row-sub">${t('s.bkrestore_sub')}</div>
        </div>
        <button class="setv-btn" id="restoreCodeBtn">${t('s.bkrestore_btn')}</button>
      </div>
      <div class="setv-row" id="restoreCodeArea" style="display:none;flex-direction:column;align-items:stretch;gap:8px;">
        <textarea id="restoreCodeIn" rows="4" placeholder="${t('bk.placeholder')}" style="width:100%;resize:vertical;font-family:monospace;font-size:11px;padding:8px;border-radius:8px;border:1px solid var(--border);background:var(--surface2);color:var(--tx1);"></textarea>
        <div class="pin-form-error" id="restoreCodeError"></div>
        <button class="setv-btn" id="restoreApplyBtn">${t('bk.apply')}</button>
      </div>
    </div>
    </div>

    <div class="acc-accent acc-feedback">${feedbackSectionHTML()}</div>

    <div class="acc-accent acc-danger">
    <div class="setv-section danger-zone">
      <div class="setv-section-title">⚠️ ${t('danger.title')}</div>
      <div class="setv-row">
        <div class="setv-row-left">
          <div class="setv-row-label">${t('danger.delete_label')}</div>
          <div class="setv-row-sub">${t('danger.delete_sub')}</div>
        </div>
        <button class="setv-btn danger" id="dangerDeleteBtn">${t('danger.delete_btn')}</button>
      </div>
    </div>
    </div>
  `;
  _bindBackupSection(el);
  bindCloudSection();
  bindFeedbackSection();
  el.querySelector('#dangerDeleteBtn')?.addEventListener('click', openDeleteModal);
}

/* ── Backup bindings (moved verbatim from pin.js) ── */
function _bindBackupSection(el){
  el.querySelector('#importBtn')?.addEventListener('click', triggerImport);
  el.querySelector('#bkIncPrefs')?.addEventListener('change', e => setBackupIncludes({ prefs: e.target.checked }));
  el.querySelector('#bkIncSec')?.addEventListener('change', e => setBackupIncludes({ security: e.target.checked }));

  el.querySelector('#backupCodeBtn')?.addEventListener('click', async ()=>{
    const area = el.querySelector('#backupCodeArea');
    const out = el.querySelector('#backupCodeOut');
    const warn = el.querySelector('#backupCodeWarn');
    try {
      const { code, tooBig } = await generateBackupCode(collectionSnapshot(backupIncludes()));
      out.value = code;
      warn.textContent = tooBig ? t('bk.too_big') : '';
      area.style.display = 'flex';
      markBackupDone();
    } catch(e){
      warn.textContent = t('bk.invalid');
      area.style.display = 'flex';
    }
  });
  el.querySelector('#backupCopyBtn')?.addEventListener('click', async ()=>{
    const out = el.querySelector('#backupCodeOut');
    try {
      await navigator.clipboard.writeText(out.value);
    } catch(e){
      out.focus(); out.select();
      document.execCommand('copy');
    }
    showToast(t('bk.copied'));
  });
  el.querySelector('#backupQrBtn')?.addEventListener('click', ()=>{
    const out = el.querySelector('#backupCodeOut');
    const wrap = el.querySelector('#backupQrWrap');
    const qrBox = el.querySelector('#backupQr');
    const hint = el.querySelector('#backupQrHint');
    if(!out.value) return;
    if(wrap.style.display !== 'none'){ wrap.style.display = 'none'; return; }
    const { svg, tooBig } = makeBackupQrSvg(buildBackupLink(out.value));
    if(tooBig){
      qrBox.innerHTML = '';
      hint.textContent = t('bk.qr_too_big');
      hint.classList.add('bk-qr-warn');
    } else {
      qrBox.innerHTML = svg;
      hint.textContent = t('bk.qr_hint');
      hint.classList.remove('bk-qr-warn');
    }
    wrap.style.display = 'flex';
  });
  el.querySelector('#restoreCodeBtn')?.addEventListener('click', ()=>{
    const area = el.querySelector('#restoreCodeArea');
    area.style.display = area.style.display === 'none' ? 'flex' : 'none';
  });
  el.querySelector('#restoreApplyBtn')?.addEventListener('click', async ()=>{
    const input = el.querySelector('#restoreCodeIn');
    const errEl = el.querySelector('#restoreCodeError');
    errEl.textContent = '';
    try {
      const data = await decodeBackupCode(input.value);
      _showImportDialog(data); // existing merge/replace dialog
    } catch(e){
      errEl.textContent = e.message || t('bk.invalid');
    }
  });
}

/* ── Danger modal: scope choice + typed confirmation ── */
const SCOPE_WARN_KEYS = { local: 'danger.warn_local', cloud: 'danger.warn_cloud', both: 'danger.warn_both' };

export function openDeleteModal(){
  if(deniedForViewer()) return ;   // lecture seule : refus même en appel direct
  closeDeleteModal();
  const signedIn = isCloudSignedIn();
  const overlay = document.createElement('div');
  overlay.className = 'danger-mo';
  overlay.id = 'dangerMo';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', t('danger.modal_title'));
  const word = t('danger.word');
  overlay.innerHTML = `
    <div class="danger-mo-box">
      <div class="danger-mo-title">⚠️ ${t('danger.modal_title')}</div>
      <div class="danger-scopes" role="radiogroup" aria-label="${t('danger.scope_label')}">
        <label class="danger-scope"><input type="radio" name="dangerScope" value="local" checked> <span>${t('danger.scope_local')}</span></label>
        <label class="danger-scope${signedIn?'':' off'}"><input type="radio" name="dangerScope" value="cloud"${signedIn?'':' disabled'}> <span>${t('danger.scope_cloud')}${signedIn?'':' — '+t('danger.scope_needs_login')}</span></label>
        <label class="danger-scope${signedIn?'':' off'}"><input type="radio" name="dangerScope" value="both"${signedIn?'':' disabled'}> <span>${t('danger.scope_both')}</span></label>
      </div>
      <div class="danger-warn" id="dangerWarn">${t(SCOPE_WARN_KEYS.local)}</div>
      <div class="danger-confirm">
        <label for="dangerWord" class="danger-word-hint">${t('danger.type_hint', { word })}</label>
        <input type="text" id="dangerWord" autocomplete="off" autocapitalize="characters" spellcheck="false">
      </div>
      <div class="danger-mo-actions">
        <button class="setv-btn" id="dangerCancelBtn" type="button">${t('danger.cancel')}</button>
        <button class="setv-btn danger" id="dangerConfirmBtn" type="button" disabled>${t('danger.confirm_btn')}</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const wordInput = overlay.querySelector('#dangerWord');
  const confirmBtn = overlay.querySelector('#dangerConfirmBtn');
  const warnEl = overlay.querySelector('#dangerWarn');
  const scope = () => overlay.querySelector('input[name="dangerScope"]:checked')?.value || 'local';

  overlay.querySelectorAll('input[name="dangerScope"]').forEach(r =>
    r.addEventListener('change', () => { warnEl.textContent = t(SCOPE_WARN_KEYS[scope()]); }));
  wordInput.addEventListener('input', () => {
    confirmBtn.disabled = !canConfirmDeletion(wordInput.value, word);
  });
  overlay.querySelector('#dangerCancelBtn').addEventListener('click', closeDeleteModal);
  overlay.addEventListener('click', e => { if(e.target === overlay) closeDeleteModal(); });

  confirmBtn.addEventListener('click', async () => {
    if(!canConfirmDeletion(wordInput.value, word)) return; // belt and braces
    confirmBtn.disabled = true;
    const plan = deletionPlan(scope(), isCloudSignedIn());
    try {
      if(plan.cloud) await cloudDeleteAll();
      if(plan.local) deleteLocalCollectionData();
      closeDeleteModal();
      updateStats(); renderCollection(); renderAccount();
      showToast(t(plan.local && plan.cloud ? 'danger.done_both' : plan.cloud ? 'danger.done_cloud' : 'danger.done_local'));
    } catch(e){
      log('data deletion failed', e);
      confirmBtn.disabled = false;
      warnEl.textContent = t('danger.error');
    }
  });
  wordInput.focus();
}

export function closeDeleteModal(){
  document.getElementById('dangerMo')?.remove();
}
