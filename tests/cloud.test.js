import './_setup.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetStorage } from './_setup.js';
import {
  parseSessionFromHash, isSessionExpired, authHeaders,
  loadSession, saveSession, clearSession, SESSION_KEY,
  cloudConfig, isCloudConfigured,
} from '../cloud.js';

const CFG = { url: 'https://proj.supabase.co', anonKey: 'anon-key-123' };

describe('cloud — magic-link hash parsing', () => {
  test('parses a GoTrue redirect fragment', () => {
    const s = parseSessionFromHash(
      '#access_token=AT&expires_at=2000000100&expires_in=3600&refresh_token=RT&token_type=bearer&type=magiclink',
      2000000000);
    assert.equal(s.access_token, 'AT');
    assert.equal(s.refresh_token, 'RT');
    assert.equal(s.expires_at, 2000000100); // explicit expires_at wins
    assert.equal(s.type, 'magiclink');
  });

  test('computes expires_at from expires_in when absent', () => {
    const s = parseSessionFromHash('#access_token=AT&refresh_token=RT&expires_in=3600', 1000);
    assert.equal(s.expires_at, 4600);
  });

  test('rejects non-auth or incomplete fragments', () => {
    assert.equal(parseSessionFromHash(''), null);
    assert.equal(parseSessionFromHash('#backup=abc'), null);
    assert.equal(parseSessionFromHash('#access_token=AT'), null); // no refresh token
  });
});

describe('cloud — session expiry', () => {
  const S = { access_token: 'AT', refresh_token: 'RT', expires_at: 10000 };
  test('valid well before expiry, expired at/after (with 60s margin)', () => {
    assert.equal(isSessionExpired(S, 9000), false);
    assert.equal(isSessionExpired(S, 9941), true);   // inside the 60s margin
    assert.equal(isSessionExpired(S, 10001), true);
  });
  test('null/incomplete sessions are expired', () => {
    assert.equal(isSessionExpired(null, 0), true);
    assert.equal(isSessionExpired({}, 0), true);
  });
});

describe('cloud — request headers', () => {
  test('anon calls use the anon key as bearer', () => {
    const h = authHeaders(CFG);
    assert.equal(h.apikey, 'anon-key-123');
    assert.equal(h.Authorization, 'Bearer anon-key-123');
  });
  test('user calls use the access token as bearer, anon key as apikey', () => {
    const h = authHeaders(CFG, 'user-token');
    assert.equal(h.apikey, 'anon-key-123');
    assert.equal(h.Authorization, 'Bearer user-token');
  });
});

describe('cloud — session persistence', () => {
  beforeEach(() => resetStorage());
  const S = { access_token: 'AT', refresh_token: 'RT', expires_at: 123, user: { id: 'u1', email: 'a@b.co' } };

  test('save / load round-trip', () => {
    saveSession(S);
    assert.deepEqual(loadSession(), S);
  });
  test('clear removes the session', () => {
    saveSession(S); clearSession();
    assert.equal(loadSession(), null);
    assert.equal(localStorage.getItem(SESSION_KEY), null);
  });
  test('corrupted or incomplete stored data yields null', () => {
    localStorage.setItem(SESSION_KEY, '{not json');
    assert.equal(loadSession(), null);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ access_token: 'AT' }));
    assert.equal(loadSession(), null); // refresh_token missing
  });
});

describe('cloud — configuration gate', () => {
  test('empty config disables the feature; filled config normalizes the URL', () => {
    window.__F1UNO_CLOUD = { url: '', anonKey: '' };
    assert.equal(isCloudConfigured(), false);
    window.__F1UNO_CLOUD = { url: 'https://p.supabase.co/', anonKey: 'k' };
    assert.equal(isCloudConfigured(), true);
    assert.equal(cloudConfig().url, 'https://p.supabase.co'); // trailing slash stripped
    window.__F1UNO_CLOUD = undefined;
    assert.equal(isCloudConfigured(), false);
  });
});
