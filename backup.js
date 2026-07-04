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
import { t } from './i18n.js';
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
   BACKUP REMINDER — nudge after N changes or N days
   ══════════════════════════════════════════════════════════ */
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
  const daysSince = last ? (Date.now() - last) / 86400000 : Infinity;
  if(n >= REMIND_AFTER_CHANGES || (last && daysSince >= REMIND_AFTER_DAYS)){
    _remindedThisSession = true;
    showToast(t('bk.reminder'));
  }
}

// Called after a successful JSON export or backup-code generation.
export function markBackupDone(){
  localStorage.setItem(K_LAST, String(Date.now()));
  localStorage.setItem(K_CHANGES, '0');
}
