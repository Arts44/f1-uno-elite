/* ══════════════════════════════════════════════════════════
   BACKUP CODE — device-to-device transfer without a file.
   Snapshot (same format as the JSON export) → deflate-raw
   (CompressionStream when available) → base64url → short code
   the user copies and pastes on the other device. 100% client-
   side: nothing ever leaves the browser.

   Code format:  F1U1.<base64url>  (deflate-raw compressed)
                 F1U0.<base64url>  (uncompressed fallback)
   ══════════════════════════════════════════════════════════ */
import { log } from './logger.js';
import { deniedForViewer } from './session.js';
import { t, tEsc, setSafeHTML } from './i18n.js';
import { CARDS_DB, CARD_TYPES } from './data.js';
import { showToast } from './render.js';
import { encodeBinary, toSvg, Ecc } from './qrcodegen.js';
import { _showImportDialog } from './storage.js';

// Above this size the code is impractical to paste into a link/QR —
// the UI then steers the user to the existing JSON file export.
export const MAX_CODE_CHARS = 4000;

// A QR is only reliably scannable up to a moderate density. We cap the
// QR version (25 → 117×117 modules); a link that doesn't fit is NOT
// rendered as an unreadable QR — the UI falls back to the text code /
// JSON export instead.
const MAX_QR_VERSION = 25;

/* ── base64url helpers ── */
function bytesToB64url(bytes){
  let bin = '';
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function b64urlToBytes(s){
  const b64 = s.replace(/-/g,'+').replace(/_/g,'/') + '='.repeat((4 - s.length % 4) % 4);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/* ── compression helpers (CompressionStream, graceful fallback) ── */
async function _pipe(bytes, TransformCtor, mode){
  const stream = new Blob([bytes]).stream().pipeThrough(new TransformCtor(mode));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/* ── code generation ── */
// snapshot: the object returned by storage.js collectionSnapshot()
export async function generateBackupCode(snapshot){
  if(deniedForViewer()) throw new Error('read-only');   // refus même en appel direct
  const json = JSON.stringify(snapshot);
  const raw = new TextEncoder().encode(json);
  let code;
  if(typeof CompressionStream === 'function'){
    const packed = await _pipe(raw, CompressionStream, 'deflate-raw');
    code = 'F1U1.' + bytesToB64url(packed);
  } else {
    code = 'F1U0.' + bytesToB64url(raw);
  }
  return { code, tooBig: code.length > MAX_CODE_CHARS };
}

/* ── code decoding + validation ── */
// Accepts a bare code or a link containing "#backup=<code>".
// Throws Error with a translated message on any failure.
export async function decodeBackupCode(input){
  let s = (input||'').trim();
  const m = s.match(/#backup=([^&\s]+)/);
  if(m) s = m[1];
  // UNE FICHE D'ÉCHANGE N'EST PAS UNE SAUVEGARDE. Un utilisateur qui
  // croit restaurer et importe une liste d'échange serait un incident
  // sérieux : le préfixe F1T1 est refusé ICI, avec son propre message —
  // jamais laissé tomber dans un « code invalide » générique.
  if(/^F1T1\./.test(s)) throw new Error(t('tr.is_trade'));
  if(!/^F1U[01]\./.test(s)) throw new Error(t('bk.invalid'));
  const compressed = s.startsWith('F1U1.');
  let data;
  try {
    const bytes = b64urlToBytes(s.slice(5));
    const raw = compressed
      ? await _pipe(bytes, DecompressionStream, 'deflate-raw')
      : bytes;
    data = JSON.parse(new TextDecoder().decode(raw));
  } catch(e){
    throw new Error(t('bk.invalid'));
  }
  // Schema validation — must look like a collectionSnapshot()
  if(!data || typeof data !== 'object' || !data.owned || typeof data.owned !== 'object')
    throw new Error(t('bk.invalid'));
  if(data.season !== undefined && !Number.isInteger(data.season))
    throw new Error(t('bk.invalid'));
  return data;
}

/* ══════════════════════════════════════════════════════════
   QR CODE — scan-to-transfer (encodes a #backup= link so the
   target device opens the app and restores automatically).
   ══════════════════════════════════════════════════════════ */
// Build an absolute link that reopens THIS deployment with the code in
// the hash. Uses origin + pathname so it works under a sub-folder
// (e.g. GitHub Pages); query/hash are stripped first.
export function buildBackupLink(code){
  const base = location.origin + location.pathname;
  return `${base}#backup=${code}`;
}

// Returns { svg } on success, or { tooBig: true } when the link exceeds
// the scannable QR capacity. Dark-on-white for contrast in any theme.
export function makeBackupQrSvg(link){
  try {
    const qr = encodeBinary(new TextEncoder().encode(link), Ecc.LOW, 1, MAX_QR_VERSION);
    return { svg: toSvg(qr, { border: 4, dark: '#111111', light: '#ffffff' }), version: qr.version };
  } catch(e){
    log('QR too big for link length', link.length, e && e.message);
    return { tooBig: true };
  }
}

// Startup: if the URL carries a #backup= code, decode it and open the
// existing merge/replace import dialog, then strip the hash so a reload
// doesn't re-trigger it. Called from initApp() once data is loaded.
export async function maybeHandleBackupHash(){
  if(deniedForViewer()) return false;   // lecture seule : refus même en appel direct
  const hash = location.hash || '';
  if(!/#backup=/.test(hash)) return false;
  // Clear the hash immediately (before await) so it can't fire twice
  try { history.replaceState(null, '', location.pathname + location.search); } catch(e){}
  try {
    const data = await decodeBackupCode(hash);
    _showImportDialog(data);
    return true;
  } catch(e){
    showToast(t('bk.invalid'));
    return false;
  }
}

/* ══════════════════════════════════════════════════════════
   LA FICHE D'ÉCHANGE (#trade=) — même chaîne, AUTRE ENVELOPPE.

   Format : F1T1.<base64url deflate-raw> — préfixe DISTINCT de F1U*
   (sauvegarde), et les deux décodeurs se REFUSENT mutuellement avec
   un message dédié : croire restaurer et importer une liste d'échange
   serait un incident sérieux, dans les deux sens.

   Charge : { v:1, season, want:[ids], offer:[[id,[[type,qty]…]]…] } —
   des identifiants, jamais des noms (l'app d'en face a le catalogue).

   MESURE (chiffrage 1.69.0), pour qui voudra ajouter un champ : la
   charge réelle du seed (29 manquantes + 8 doubles) fait ~196
   caractères → QR version 9 ; le PIRE CAS ABSOLU (collection vierge,
   101 manquantes) fait 284 caractères → QR version 11, sur un plafond
   de 25 (MAX_QR_VERSION). La marge est large — c'est elle qui permet
   au QR de porter TOUJOURS la liste complète pendant que l'image
   plafonne à 6 lignes.
   ══════════════════════════════════════════════════════════ */
export async function encodeTradeCode(payload){
  const raw = new TextEncoder().encode(JSON.stringify(payload));
  if(typeof CompressionStream !== 'function')
    throw new Error(t('tr.invalid'));   // pas de repli non compressé : le QR est la raison d'être
  const packed = await _pipe(raw, CompressionStream, 'deflate-raw');
  return 'F1T1.' + bytesToB64url(packed);
}

export async function decodeTradeCode(input){
  let s = (input||'').trim();
  const m = s.match(/#trade=([^&\s]+)/);
  if(m) s = m[1];
  // Le symétrique du garde de decodeBackupCode : une SAUVEGARDE n'est
  // pas une fiche d'échange — refus nommé, jamais générique.
  if(/^F1U[01]\./.test(s)) throw new Error(t('tr.is_backup'));
  if(!/^F1T1\./.test(s)) throw new Error(t('tr.invalid'));
  let data;
  try {
    const raw = await _pipe(b64urlToBytes(s.slice(5)), DecompressionStream, 'deflate-raw');
    data = JSON.parse(new TextDecoder().decode(raw));
  } catch(e){
    throw new Error(t('tr.invalid'));
  }
  if(!data || typeof data !== 'object' || data.v !== 1
    || !Array.isArray(data.want) || !Array.isArray(data.offer)
    || (data.season !== undefined && !Number.isInteger(data.season)))
    throw new Error(t('tr.invalid'));
  return data;
}

export function buildTradeLink(code){
  const base = location.origin + location.pathname;
  return `${base}#trade=${code}`;
}

/* La fiche REÇUE : scanner/coller le lien ouvre l'app avec la liste
   complète préchargée — lecture seule (rien n'est écrit : pas de garde
   spectateur, exprès). Les noms se résolvent sur NOTRE catalogue. */
function _cardName(id){ const c = CARDS_DB.find(x => x.id === id); return c ? c.name : `#${id}`; }
function _typeLabelTr(ty){ const k = 'type.' + ty, l = t(k); return l === k ? (CARD_TYPES[ty]?.label || ty) : l; }

export function _showIncomingTrade(data){
  const overlay = document.createElement('div');
  overlay.className = 'import-dialog-overlay';
  const wantRows = data.want.map(id =>
    `<div class="tr-in-row"><span>#${id}</span> ${_cardName(id)}</div>`).join('');
  const offerRows = data.offer.map(([id, types]) =>
    `<div class="tr-in-row"><span>#${id}</span> ${_cardName(id)} <em>${(types||[]).map(([ty, q]) => `${_typeLabelTr(ty)} ×${q}`).join(', ')}</em></div>`).join('');
  setSafeHTML(overlay, `
    <div class="import-dialog tr-in">
      <div class="import-dialog-title">${t('tr.recv')}</div>
      <div class="import-dialog-sub">${tEsc('tools.season', { season: data.season || '?' })}</div>
      ${data.want.length ? `<div class="tr-in-h want">▲ ${t('tools.want')} · ${data.want.length}</div>${wantRows}` : ''}
      ${data.offer.length ? `<div class="tr-in-h offer">▼ ${t('tools.offer')} · ${data.offer.length}</div>${offerRows}` : ''}
      <div class="import-dialog-btns">
        <button class="import-dialog-btn primary" id="trInClose">${t('tr.close')}</button>
      </div>
    </div>`);
  document.body.appendChild(overlay);
  overlay.querySelector('#trInClose').addEventListener('click', () => overlay.remove());
}

// Démarrage : un lien #trade= ouvre la fiche reçue, puis retire le
// hash — même mécanique que maybeHandleBackupHash, enveloppe séparée.
export async function maybeHandleTradeHash(){
  const hash = location.hash || '';
  if(!/#trade=/.test(hash)) return false;
  try { history.replaceState(null, '', location.pathname + location.search); } catch(e){}
  try {
    const data = await decodeTradeCode(hash);
    _showIncomingTrade(data);
    return true;
  } catch(e){
    showToast(e && e.message || t('tr.invalid'));
    return false;
  }
}

/* ══════════════════════════════════════════════════════════
   BACKUP REMINDER — nudge after N changes or N days
   ══════════════════════════════════════════════════════════ */
const DAY_MS = 86400000;            // 24 h en millisecondes
const REMIND_AFTER_CHANGES = 30;
const REMIND_AFTER_DAYS = 14;
const K_CHANGES = 'f1uno_changes_since_backup';
const K_LAST = 'f1uno_last_backup';
let _remindedThisSession = false;

// Called from storage.js saveData() on every persisted change.
export function noteChange(){
  const n = parseInt(localStorage.getItem(K_CHANGES)||'0', 10) + 1;
  localStorage.setItem(K_CHANGES, String(n));
  if(_remindedThisSession) return;
  const last = parseInt(localStorage.getItem(K_LAST)||'0', 10);
  const daysSince = last ? (Date.now() - last) / DAY_MS : Infinity;
  if(n >= REMIND_AFTER_CHANGES || (last && daysSince >= REMIND_AFTER_DAYS)){
    _remindedThisSession = true;
    showToast(t('bk.reminder'));
  }
}

/* Une sauvegarde a-t-elle DÉJÀ été faite sur cet appareil ? Lu par
   l'état vide du Compte (1.70.0) : l'avertissement disparaît au
   premier geste de sauvegarde, sans réglage à tenir. */
export function hasEverBackedUp(){
  return !!localStorage.getItem(K_LAST);
}

// Called after a successful JSON export or backup-code generation.
export function markBackupDone(){
  localStorage.setItem(K_LAST, String(Date.now()));
  localStorage.setItem(K_CHANGES, '0');
}
