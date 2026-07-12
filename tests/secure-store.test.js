import './_setup.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetStorage } from './_setup.js';
import {
  isEncEnabled, isEncPayload, secureGet, secureSet,
  unlockSecureStore, enableEncryption, disableEncryption, rekeyEncryption,
  quarantineEncryptedData, flushSecureWrites, _resetSecureStoreForTests,
} from '../secure-store.js';

const OWNED = 'f1uno_owned_2025';
const BADGES = 'f1uno_badges_2025';
const HISTORY = 'f1uno_history_2025';
const SAMPLE = JSON.stringify({ P1: { blue: { owned: true, qty: 2 } } });
const BADGE_SAMPLE = JSON.stringify({ b1: true });

function seedPlain(){
  localStorage.setItem(OWNED, SAMPLE);
  localStorage.setItem(BADGES, BADGE_SAMPLE);
  localStorage.setItem(HISTORY, JSON.stringify([{ date: '2026-07-12', owned: 1 }]));
}

beforeEach(() => { resetStorage(); _resetSecureStoreForTests(); });

describe('secure-store — migration clear → encrypted (no loss)', () => {
  test('enable encrypts every data key, values round-trip exactly', async () => {
    seedPlain();
    await enableEncryption('1234');
    assert.equal(isEncEnabled(), true);
    // On disk: unreadable payloads with the marker, never the plaintext
    for(const k of [OWNED, BADGES, HISTORY]){
      const raw = localStorage.getItem(k);
      assert.ok(isEncPayload(raw), `${k} must be an encrypted payload`);
      assert.ok(!raw.includes('owned'), `${k} must not leak plaintext`);
    }
    // Through the facade: byte-identical to what was stored
    assert.equal(secureGet(OWNED), SAMPLE);
    assert.equal(secureGet(BADGES), BADGE_SAMPLE);
  });

  test('non-data keys are never touched', async () => {
    seedPlain();
    localStorage.setItem('f1uno_theme', 'dark');
    localStorage.setItem('f1uno_pin_hash', 'abc');
    await enableEncryption('1234');
    assert.equal(localStorage.getItem('f1uno_theme'), 'dark');
    assert.equal(localStorage.getItem('f1uno_pin_hash'), 'abc');
  });

  test('writes after enabling land encrypted (flushed async, coalesced)', async () => {
    seedPlain();
    await enableEncryption('1234');
    const v2 = JSON.stringify({ P2: { red: { owned: true, qty: 1 } } });
    secureSet(OWNED, 'intermediate');
    secureSet(OWNED, v2);               // last write wins
    assert.equal(secureGet(OWNED), v2); // cache is immediate
    await flushSecureWrites();
    assert.ok(isEncPayload(localStorage.getItem(OWNED)));
    // A fresh session under the same PIN reads the flushed value back
    _resetSecureStoreForTests();
    await unlockSecureStore('1234');
    assert.equal(secureGet(OWNED), v2);
  });
});

describe('secure-store — unlock (fresh session)', () => {
  test('right PIN rebuilds the plaintext cache', async () => {
    seedPlain();
    await enableEncryption('1234');
    _resetSecureStoreForTests(); // simulate page reload
    assert.equal(secureGet(OWNED), null); // locked: nothing readable
    await unlockSecureStore('1234');
    assert.equal(secureGet(OWNED), SAMPLE);
    assert.equal(secureGet(HISTORY), JSON.stringify([{ date: '2026-07-12', owned: 1 }]));
  });

  test('wrong PIN throws bad-key and leaves ciphertexts untouched', async () => {
    seedPlain();
    await enableEncryption('1234');
    const cipherBefore = localStorage.getItem(OWNED);
    _resetSecureStoreForTests();
    await assert.rejects(() => unlockSecureStore('9999'), /bad-key/);
    assert.equal(localStorage.getItem(OWNED), cipherBefore); // intact
  });

  test('tolerates a plain value under an enabled store (interrupted migration)', async () => {
    seedPlain();
    await enableEncryption('1234');
    // Simulate an interruption: one key was left in clear
    localStorage.setItem(BADGES, BADGE_SAMPLE);
    _resetSecureStoreForTests();
    await unlockSecureStore('1234');
    assert.equal(secureGet(BADGES), BADGE_SAMPLE); // readable as-is
    assert.equal(secureGet(OWNED), SAMPLE);        // encrypted one too
  });
});

describe('secure-store — disable (PIN removed → back to clear)', () => {
  test('everything is decrypted back to plain and flags are cleared', async () => {
    seedPlain();
    await enableEncryption('1234');
    await disableEncryption();
    assert.equal(isEncEnabled(), false);
    assert.equal(localStorage.getItem(OWNED), SAMPLE); // raw plain again
    assert.equal(localStorage.getItem('f1uno_enc_salt'), null);
    assert.equal(localStorage.getItem('f1uno_enc_check'), null);
  });

  test('refuses to disable while locked (no key = would lose data)', async () => {
    seedPlain();
    await enableEncryption('1234');
    _resetSecureStoreForTests();
    await assert.rejects(() => disableEncryption(), /locked/);
    assert.ok(isEncPayload(localStorage.getItem(OWNED))); // untouched
  });
});

describe('secure-store — PIN change (re-key)', () => {
  test('new PIN opens the store, old PIN no longer does', async () => {
    seedPlain();
    await enableEncryption('1234');
    await rekeyEncryption('5678');
    _resetSecureStoreForTests();
    await assert.rejects(() => unlockSecureStore('1234'), /bad-key/);
    _resetSecureStoreForTests();
    await unlockSecureStore('5678');
    assert.equal(secureGet(OWNED), SAMPLE); // no loss through the re-key
  });
});

describe('secure-store — decrypt-failure recovery (quarantine)', () => {
  test('undecryptable data is moved aside, never deleted; store reset to clear', async () => {
    seedPlain();
    await enableEncryption('1234');
    const cipher = localStorage.getItem(OWNED);
    _resetSecureStoreForTests();
    const n = quarantineEncryptedData();
    assert.ok(n >= 3);
    assert.equal(isEncEnabled(), false);
    assert.equal(localStorage.getItem(OWNED), null);                      // slot freed for a restore
    assert.equal(localStorage.getItem('f1uno_enc_orphan_' + OWNED), cipher); // ciphertext preserved
    // The app can now write a restored backup in clear
    secureSet(OWNED, SAMPLE);
    assert.equal(localStorage.getItem(OWNED), SAMPLE);
  });
});

describe('secure-store — passthrough when encryption is off', () => {
  test('secureGet/secureSet behave exactly like localStorage', () => {
    secureSet(OWNED, SAMPLE);
    assert.equal(localStorage.getItem(OWNED), SAMPLE);
    assert.equal(secureGet(OWNED), SAMPLE);
    assert.equal(secureGet('f1uno_missing_key'), null);
  });
});
