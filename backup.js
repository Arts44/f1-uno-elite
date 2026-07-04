/* ══════════════════════════════════════════════════════════
   BACKUP CODE — device-to-device transfer without a file.
   Snapshot (same format as the JSON export) → deflate-raw
   (CompressionStream when available) → base64url → short code
   the user copies and pastes on the other device. 100% client-
   side: nothing ever leaves the browser.

   Code format:  F1U1.<base64url>  (deflate-raw compressed)
                 F1U0.<base64url>  (uncompressed fallback)
   ══════════════════════════════════════════════════════════ */
import { t } from './i18n.js';
import { showToast } from './render.js';

// Above this size the code is impractical to paste into a link/QR —
// the UI then steers the user to the existing JSON file export.
export const MAX_CODE_CHARS = 4000;

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
