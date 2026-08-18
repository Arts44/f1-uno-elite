/* ══════════════════════════════════════════════════════════
   ACCOUNT — the « Compte » view: cloud session (Supabase),
   device backups (code + QR, export/import), feedback, and the
   danger zone (data deletion with strong confirmation).
   These sections MOVED here from Réglages (pin.js) — no dupes.
   ══════════════════════════════════════════════════════════ */
import { log } from './logger.js';
import { CARDS_DB, _currentSeason, availableSeasons } from './data.js';
import { cardOwned } from './storage.js';
import { deniedForViewer } from './session.js';
import { t, tEsc, setSafeHTML } from './i18n.js';
import { showToast, renderCollection } from './render.js';
import { updateStats } from './stats.js';
import { triggerImport, collectionSnapshot, _showImportDialog, deleteLocalCollectionData } from './storage.js';
import { generateBackupCode, decodeBackupCode, markBackupDone, buildBackupLink, makeBackupQrSvg, hasEverBackedUp } from './backup.js';
import { backupIncludes, setBackupIncludes } from './settings-sync.js';
import { cloudSectionHTML, bindCloudSection } from './cloud-ui.js';
import { isCloudSignedIn, cloudDeleteSeason } from './cloud-sync.js';
import { feedbackSectionHTML, bindFeedbackSection } from './feedback.js';
import { showAdminPinScreen } from './pin.js';
import { icon } from './icons.js';
import { pageHeadHTML } from './pagehead.js';

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
export function deletionPlan(scope, cloudConnected, season = null){
  if(!DELETE_SCOPES.includes(scope)) throw new Error('bad-scope');
  return {
    local: scope === 'local' || scope === 'both',
    cloud: (scope === 'cloud' || scope === 'both') && !!cloudConnected,
    // null = toutes les saisons. Une valeur = cette saison-là, et
    // rien d'autre : ni les autres saisons, ni les réglages partagés.
    season: season === null ? null : Number(season),
  };
}

/* ── Ce que la suppression va emporter, en clair ──
   Le récapitulatif est CALCULÉ, jamais rédigé à l'avance : il cite le
   nombre réel de cartes possédées, la saison nommée, et les portées
   effectivement retenues. Une action destructive doit dire exactement
   ce qu'elle fait, pas décrire une catégorie d'actions. */
export function deletionSummary(plan, stats){
  const lignes = [];
  const s = plan.season;
  lignes.push(s === null
    ? { cle: 'danger.sum_all_seasons', p: { detail: stats.detail || '' } }
    : { cle: 'danger.sum_one_season', p: { season: s, cards: stats.cards || 0 } });
  lignes.push({ cle: plan.local && plan.cloud ? 'danger.sum_both'
              : plan.cloud ? 'danger.sum_cloud' : 'danger.sum_local',
              p: { season: s === null ? '' : s } });
  return lignes;
}

/* ── Vue verrouillée (mode spectateur) ──
   On ne DÉSACTIVE pas les contrôles, on ne les rend pas du tout :
   un `disabled` se retire en une ligne de console, une absence non.
   L'écran explique le refus ET donne la sortie (passer en admin) —
   un état bloqué sans issue est un cul-de-sac. */
function _lockedAccountHTML(){
  return pageHeadHTML({
    icon: 'user',
    title: t('acc.title'),
    sub: t('acc.locked_title')
  }) + `
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
  /* ── L'ÉTAT VIDE DU COMPTE (1.70.0, piste 3a — le FRAGMENT retenu)
     Tant que rien n'a jamais été sauvegardé sur cet appareil, la page
     s'ouvre sur la promesse ET son revers : la collection vit ici, donc
     vider le navigateur l'efface. C'est vrai, c'est utile, et c'est le
     bon moment pour le dire — « tant qu'il n'y a rien à perdre ».

     La condition est un FAIT, pas un réglage : dès que markBackupDone()
     passe (export fichier ou code), le bloc disparaît de lui-même. Rien
     à tenir, rien à oublier de remettre.

     CE QUI N'A PAS ÉTÉ PRIS de la piste 3a, et pourquoi — écrit ici ET
     dans POINTS-SIGNALES n°22 pour que ça ne se rejoue pas :
     · la PROJECTION des stats (« une carte par jour, complète le
       27 novembre ») est une invention sans base dans les données — la
       maquette l'admet elle-même ;
     · les QUATRE écrans vides complets coûtent quatre gabarits en sept
       langues que personne ne revoit jamais (ils disparaissent à la
       première carte). Un seul écran, celui qui dit quelque chose de
       VRAI et d'actionnable, valait la peine. ── */
  const showEmpty = !hasEverBackedUp();
  const emptyHTML = showEmpty ? `
    <div class="acc-accent acc-empty">
      <div class="acc-empty-t">${t('acc.empty_t')}</div>
      <div class="acc-empty-s">${t('acc.empty_s')}</div>
      <div class="acc-empty-warn">
        <div class="acc-empty-wt">${icon('info')} ${t('acc.empty_warn_t')}</div>
        <div class="acc-empty-ws">${t('acc.empty_warn_s')}</div>
      </div>
      <div class="acc-empty-acts">
        <button class="setv-btn primary" id="accEmptyExport" data-action="exportCollection">${t('acc.empty_cta')}</button>
        <button class="setv-btn" id="accEmptyImport">${t('acc.empty_import')}</button>
      </div>
    </div>` : '';

  el.innerHTML = pageHeadHTML({
    icon: 'user',
    title: t('acc.title'),
    sub: t('ph.acc_sub')
  }) + emptyHTML + `

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
      <div class="setv-section-title">${icon('danger')} ${t('danger.title')}</div>
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
  // État vide : le même geste, à l'endroit où il compte le plus
  el.querySelector('#accEmptyImport')?.addEventListener('click', triggerImport);
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
    const { svg, tooBig, minPx } = makeBackupQrSvg(buildBackupLink(out.value));
    if(tooBig){
      qrBox.innerHTML = '';
      hint.textContent = t('bk.qr_too_big');
      hint.classList.add('bk-qr-warn');
    } else {
      qrBox.innerHTML = svg;
      /* LA LARGEUR SUIT LA VERSION (1.71.0). La règle CSS fixait 220 px
         quelle que soit la densité — et la MESURE est sans appel : à
         220 px, TOUTES les versions affichables tombaient sous le
         plancher, de 4,49 px/module (version 6, le plus petit code
         possible) à 1,76 (version 25). Dès ~236 caractères de code, ce
         QR était illisible pour un lecteur réel. Un QR de sauvegarde
         illisible, c'est une collection perdue.

         Le QR garde donc sa taille PHYSIQUE (minPx) et son conteneur
         défile plutôt que de le réduire : réduire, c'est reproduire le
         défaut en silence. Quand la taille requise dépasse la largeur
         disponible, le hint le DIT — même famille que `tooBig`. */
      qrBox.style.width = minPx + 'px';
      const place = wrap.clientWidth || document.documentElement.clientWidth;
      const deborde = minPx > place - 24;
      hint.textContent = deborde ? t('bk.qr_scroll') : t('bk.qr_hint');
      hint.classList.toggle('bk-qr-warn', deborde);
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

/* ── Danger modal: scope choice + typed confirmation ──
   Il y avait ici une table SCOPE_WARN_KEYS qui associait chaque portée à
   une phrase d'avertissement figée. Elle est morte avec l'arrivée de la
   suppression par saison : le récapitulatif est calculé par
   deletionSummary() et rendu dans #dangerRecap, parce qu'il doit dire ce
   qui part ET ce qui reste, ce qu'une phrase figée ne pouvait pas.
   Les trois clés i18n qu'elle citait (danger.warn_local / _cloud / _both)
   partent avec elle, dans les 7 langues : une traduction sans lecteur est
   une dette qui a l'air d'un actif. ── */

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
      <div class="danger-mo-title">${icon('danger')} ${t('danger.modal_title')}</div>
      <div class="danger-seasons" role="radiogroup" aria-label="${t('danger.season_label')}">
        <label class="danger-season sel"><input type="radio" name="dangerSeason" value="one" checked>
          <span>${tEsc('danger.season_one', { season: _currentSeason })}</span></label>
        <label class="danger-season"><input type="radio" name="dangerSeason" value="all">
          <span>${t('danger.season_all')}</span></label>
      </div>
      <div class="danger-scopes" role="radiogroup" aria-label="${t('danger.scope_label')}">
        <label class="danger-scope"><input type="radio" name="dangerScope" value="local" checked> <span>${t('danger.scope_local')}</span></label>
        <label class="danger-scope${signedIn?'':' off'}"><input type="radio" name="dangerScope" value="cloud"${signedIn?'':' disabled'}> <span>${t('danger.scope_cloud')}${signedIn?'':' — '+t('danger.scope_needs_login')}</span></label>
        <label class="danger-scope${signedIn?'':' off'}"><input type="radio" name="dangerScope" value="both"${signedIn?'':' disabled'}> <span>${t('danger.scope_both')}</span></label>
      </div>
      <div class="danger-recap" id="dangerRecap"></div>
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
  const warnEl = overlay.querySelector('#dangerRecap');
  const scope = () => overlay.querySelector('input[name="dangerScope"]:checked')?.value || 'local';
  const saison = () => overlay.querySelector('input[name="dangerSeason"]:checked')?.value === 'all'
    ? null : _currentSeason;

  const compte = () => CARDS_DB.filter(c => cardOwned(c.id)).length;
  const redessine = () => {
    const plan = deletionPlan(scope(), isCloudSignedIn(), saison());
    const autres = availableSeasons().filter(y => y !== _currentSeason);
    const lignes = deletionSummary(plan, {
      cards: compte(),
      detail: availableSeasons().join(', '),
    });
    setSafeHTML(warnEl, `
      <div class="danger-recap-h">${t('danger.recap_title')}</div>
      <ul>${lignes.map(l => `<li>${tEsc(l.cle, l.p)}</li>`).join('')}</ul>
      <p class="danger-keep">${tEsc('danger.keep', {
        others: (plan.season === null || !autres.length)
          ? '' : t('danger.keep_seasons', { list: autres.join(', ') }),
      })}</p>`);
    overlay.querySelectorAll('.danger-season').forEach(el =>
      el.classList.toggle('sel', el.querySelector('input').checked));
  };
  overlay.querySelectorAll('input[name="dangerScope"],input[name="dangerSeason"]')
    .forEach(r => r.addEventListener('change', redessine));
  redessine();
  wordInput.addEventListener('input', () => {
    confirmBtn.disabled = !canConfirmDeletion(wordInput.value, word);
  });
  overlay.querySelector('#dangerCancelBtn').addEventListener('click', closeDeleteModal);
  overlay.addEventListener('click', e => { if(e.target === overlay) closeDeleteModal(); });

  confirmBtn.addEventListener('click', async () => {
    if(!canConfirmDeletion(wordInput.value, word)) return; // belt and braces
    confirmBtn.disabled = true;
    const plan = deletionPlan(scope(), isCloudSignedIn(), saison());
    try {
      if(plan.cloud) await cloudDeleteSeason(plan.season);
      if(plan.local) deleteLocalCollectionData(plan.season);
      closeDeleteModal();
      updateStats(); renderCollection(); renderAccount();
      showToast(t(plan.local && plan.cloud ? 'danger.done_both' : plan.cloud ? 'danger.done_cloud' : 'danger.done_local'));
    } catch(e){
      log('data deletion failed', e);
      confirmBtn.disabled = false;
      setSafeHTML(warnEl, `<p class="danger-keep">${t('danger.error')}</p>`);
    }
  });
  wordInput.focus();
}

export function closeDeleteModal(){
  document.getElementById('dangerMo')?.remove();
}
