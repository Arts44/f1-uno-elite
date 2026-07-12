/* ══════════════════════════════════════════════════════════
   SECURE STORE — optional at-rest encryption of the collection
   data in localStorage, keyed off the user's PIN.

   What is encrypted: the season-scoped data families
   f1uno_owned_* / f1uno_badges_* / f1uno_auto_badges_* /
   f1uno_history_*. Preferences, flags and the PIN hash stay plain.

   How: PBKDF2-SHA-256 (310 000 iterations, random 16-byte salt,
   stored locally) derives an AES-GCM-256 key from the PIN; every
   write uses a fresh 12-byte IV. All Web Crypto, no library.

   ⚠️ HONEST SECURITY NOTE: a 4-digit PIN has 10 000 combinations.
   A determined attacker with the device can brute-force the
   derivation offline in minutes regardless of the iteration count.
   This is a barrier against OPPORTUNISTIC reading (DevTools,
   casual snooping of localStorage) — not strong protection.
   The README says the same to users.

   Sync facade over async crypto: the app reads/writes through
   secureGet/secureSet synchronously. When encryption is on, reads
   are served from an in-memory plaintext cache built at unlock;
   writes update the cache immediately and are flushed to
   localStorage encrypted, asynchronously, coalesced per key
   (last-write-wins). Tradeoff: a write in the last few ms before
   the tab is destroyed can be lost — accepted, saveData fires on
   every change so the previous state is at most one action behind.

   Migration safety: enabling encrypts each key only after an
   encrypt→decrypt→compare round-trip on that exact value succeeds;
   a failure aborts and leaves every remaining value in clear.
   Reads tolerate a mix of plain and encrypted values, so an
   interrupted migration is picked up transparently and re-encrypted
   on the next write. Disabling the PIN decrypts everything back to
   plain BEFORE the PIN is dropped; changing the PIN re-encrypts
   with the new key.
   ══════════════════════════════════════════════════════════ */
import { log } from './logger.js';

const FLAG_KEY = 'f1uno_enc_enabled';
const SALT_KEY = 'f1uno_enc_salt';
const CHECK_KEY = 'f1uno_enc_check';
const CHECK_PLAINTEXT = 'f1uno-enc-check-v1';
const ITERATIONS = 310000;
const DATA_KEY_RE = /^f1uno_(owned|badges|auto_badges|history)_/;

let _key = null;            // CryptoKey for this unlocked session
let _cache = new Map();     // key -> plaintext string (enc mode only)
let _pending = new Map();   // key -> latest value awaiting encrypted flush
let _flushing = null;       // in-flight flush promise (serialized)

export function isEncEnabled(){ return localStorage.getItem(FLAG_KEY) === 'true'; }
export function isEncPayload(value){
  return typeof value === 'string' && value.startsWith('{"__f1uno_enc"');
}
function _isDataKey(key){ return DATA_KEY_RE.test(key); }

/* ── base64 helpers (binary-safe) ── */
function _b64(buf){
  const bytes = new Uint8Array(buf);
  let s = '';
  for(let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}
function _unb64(s){
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for(let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/* ── crypto primitives ── */
async function _deriveKey(pin, saltBytes){
  const raw = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(String(pin)), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: saltBytes, iterations: ITERATIONS, hash: 'SHA-256' },
    raw, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

async function _encryptString(plain, key = _key){
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, new TextEncoder().encode(plain));
  return JSON.stringify({ __f1uno_enc: 1, iv: _b64(iv), data: _b64(data) });
}

async function _decryptString(payload, key = _key){
  const p = JSON.parse(payload);
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: _unb64(p.iv) }, key, _unb64(p.data));
  return new TextDecoder().decode(plain);
}

/* ══════════════════════════════════════════════════════════
   Sync facade — the only storage API the data modules use
   ══════════════════════════════════════════════════════════ */
export function secureGet(key){
  if(isEncEnabled() && _isDataKey(key)){
    return _cache.has(key) ? _cache.get(key) : null;
  }
  return localStorage.getItem(key);
}

export function secureSet(key, value){
  if(isEncEnabled() && _isDataKey(key)){
    _cache.set(key, value);
    _queueWrite(key, value);
    return;
  }
  localStorage.setItem(key, value);
}

export function secureRemove(key){
  _cache.delete(key);
  _pending.delete(key);
  localStorage.removeItem(key);
}

/* Coalesced async flush: one encrypt in flight, always writing the
   LATEST value per key. saveData can fire in bursts without piling up
   crypto work. */
function _queueWrite(key, value){
  _pending.set(key, value);
  if(_flushing) return;
  _flushing = (async () => {
    try {
      while(_pending.size){
        const [k, v] = _pending.entries().next().value;
        _pending.delete(k);
        if(!_key){ console.error('secure-store: write dropped, store locked'); continue; }
        try {
          localStorage.setItem(k, await _encryptString(v));
        } catch(e){
          console.error('secure-store: encrypted write failed for', k, e);
        }
      }
    } finally {
      _flushing = null;
    }
  })();
}

// Test/robustness hook: resolves when every queued write has landed.
export async function flushSecureWrites(){ if(_flushing) await _flushing; }

/* ══════════════════════════════════════════════════════════
   Lifecycle
   ══════════════════════════════════════════════════════════ */

// Called on successful PIN entry, BEFORE initApp. Throws Error('bad-key')
// when the PIN-derived key cannot decrypt (PIN changed outside the app,
// corrupted salt/check…) — the ciphertexts are left untouched.
export async function unlockSecureStore(pin){
  if(!isEncEnabled()) return false;
  const salt = _unb64(localStorage.getItem(SALT_KEY) || '');
  const key = await _deriveKey(pin, salt);
  try {
    const check = await _decryptString(localStorage.getItem(CHECK_KEY) || '', key);
    if(check !== CHECK_PLAINTEXT) throw new Error('check mismatch');
  } catch(e){
    log('secure-store: unlock failed (bad key or corrupted check)');
    throw new Error('bad-key');
  }
  _key = key;
  _cache = new Map();
  for(let i = 0; i < localStorage.length; i++){
    const k = localStorage.key(i);
    if(!_isDataKey(k)) continue;
    const v = localStorage.getItem(k);
    if(isEncPayload(v)){
      try {
        _cache.set(k, await _decryptString(v));
      } catch(e){
        // One corrupted entry must not take the whole collection down:
        // surface it, keep the ciphertext on disk, serve nothing for it.
        console.error('secure-store: cannot decrypt', k, '- entry skipped, ciphertext kept', e);
      }
    } else if(v !== null){
      // Plain value under an enabled store (interrupted migration):
      // readable as-is, re-encrypted on its next write.
      _cache.set(k, v);
    }
  }
  log('secure-store: unlocked,', _cache.size, 'entries in cache');
  return true;
}

// Turn encryption ON (PIN must be enabled; `pin` in clear to derive).
// Verify-before-replace, per key: encrypt, decrypt back, compare, and
// only then overwrite the plain value. Any failure aborts and leaves
// all remaining data in clear.
export async function enableEncryption(pin){
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await _deriveKey(pin, salt);
  const check = await _encryptString(CHECK_PLAINTEXT, key);
  // Flag + material first: reads tolerate plain values under the flag,
  // so an interruption at ANY point leaves every value readable.
  localStorage.setItem(SALT_KEY, _b64(salt));
  localStorage.setItem(CHECK_KEY, check);
  localStorage.setItem(FLAG_KEY, 'true');
  _key = key;
  _cache = new Map();
  const dataKeys = [];
  for(let i = 0; i < localStorage.length; i++){
    const k = localStorage.key(i);
    if(_isDataKey(k)) dataKeys.push(k);
  }
  for(const k of dataKeys){
    const plain = localStorage.getItem(k);
    if(isEncPayload(plain)){ _cache.set(k, await _decryptString(plain)); continue; }
    const cipher = await _encryptString(plain, key);
    const roundTrip = await _decryptString(cipher, key);
    if(roundTrip !== plain){
      // Never replace a value we could not prove decryptable.
      localStorage.removeItem(FLAG_KEY);
      localStorage.removeItem(SALT_KEY);
      localStorage.removeItem(CHECK_KEY);
      _key = null; _cache = new Map();
      throw new Error('roundtrip-failed');
    }
    localStorage.setItem(k, cipher);
    _cache.set(k, plain);
  }
  log('secure-store: encryption enabled,', dataKeys.length, 'keys migrated');
}

// Turn encryption OFF: everything back to clear (required when the PIN
// is disabled — without a PIN there is no key). Uses the session cache,
// which holds the full decrypted state.
export async function disableEncryption(){
  if(!isEncEnabled()) return;
  if(!_key) throw new Error('locked');
  await flushSecureWrites();
  for(const [k, v] of _cache) localStorage.setItem(k, v);
  localStorage.removeItem(FLAG_KEY);
  localStorage.removeItem(SALT_KEY);
  localStorage.removeItem(CHECK_KEY);
  _key = null;
  _cache = new Map();
  log('secure-store: encryption disabled, data back in clear');
}

// PIN changed: re-encrypt everything under the new PIN (new salt).
export async function rekeyEncryption(newPin){
  if(!isEncEnabled()) return;
  if(!_key) throw new Error('locked');
  await flushSecureWrites();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await _deriveKey(newPin, salt);
  const entries = [...cacheEntries()];
  const rewritten = [];
  for(const [k, v] of entries){
    const cipher = await _encryptString(v, key);
    if(await _decryptString(cipher, key) !== v) throw new Error('roundtrip-failed');
    rewritten.push([k, cipher]);
  }
  // All ciphertexts proven good — swap material + values together.
  localStorage.setItem(SALT_KEY, _b64(salt));
  localStorage.setItem(CHECK_KEY, await _encryptString(CHECK_PLAINTEXT, key));
  for(const [k, cipher] of rewritten) localStorage.setItem(k, cipher);
  _key = key;
  log('secure-store: re-keyed under the new PIN');
}

function cacheEntries(){ return _cache.entries(); }

// Recovery exit when unlock cannot decrypt (PIN desync/corruption): the
// undecryptable ciphertexts are MOVED ASIDE (f1uno_enc_orphan_*), never
// deleted, encryption is switched off, and the app continues with an
// empty collection so the user can restore a backup (import/cloud pull).
export function quarantineEncryptedData(){
  const orphans = [];
  for(let i = 0; i < localStorage.length; i++){
    const k = localStorage.key(i);
    if(_isDataKey(k) && isEncPayload(localStorage.getItem(k))) orphans.push(k);
  }
  for(const k of orphans){
    localStorage.setItem('f1uno_enc_orphan_' + k, localStorage.getItem(k));
    localStorage.removeItem(k);
  }
  localStorage.removeItem(FLAG_KEY);
  localStorage.removeItem(SALT_KEY);
  localStorage.removeItem(CHECK_KEY);
  _key = null;
  _cache = new Map();
  console.error('secure-store: ' + orphans.length + ' undecryptable entries quarantined under f1uno_enc_orphan_*');
  return orphans.length;
}

// Tests only: drop all in-memory state (simulates a fresh page).
export function _resetSecureStoreForTests(){
  _key = null;
  _cache = new Map();
  _pending = new Map();
  _flushing = null;
}
