import './_setup.js';
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetStorage } from './_setup.js';
import {
  FEEDBACK_MIN, FEEDBACK_MAX, FEEDBACK_TYPES, FEEDBACK_COOLDOWN_MS,
  validateFeedbackMessage, buildFeedbackPayload, feedbackCooldownRemaining,
  sendFeedback, fetchMyFeedback,
} from '../feedback.js';
import { SESSION_KEY } from '../cloud.js';
import { APP_VERSION } from '../changelog.js';

// A decodable JWT (header.payload.sig) whose sub is auth.uid()
const jwt = sub => `eyJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify({ sub }))}.sig`;
const seedSession = (sub = 'user-1') => localStorage.setItem(SESSION_KEY, JSON.stringify({
  access_token: jwt(sub), refresh_token: 'RT',
  expires_at: Math.floor(Date.now() / 1000) + 3600,
}));

describe('feedback — message validation (mirrors the SQL constraint)', () => {
  test('trimmed length drives the verdict', () => {
    assert.equal(validateFeedbackMessage(''), 'empty');
    assert.equal(validateFeedbackMessage('   '), 'empty');
    assert.equal(validateFeedbackMessage(null), 'empty');
    assert.equal(validateFeedbackMessage('ab'), 'too-short');
    assert.equal(validateFeedbackMessage('  ab  '), 'too-short');   // trim first
    assert.equal(validateFeedbackMessage('abc'), 'ok');             // min = 3
    assert.equal(validateFeedbackMessage('x'.repeat(FEEDBACK_MAX)), 'ok');
    assert.equal(validateFeedbackMessage('x'.repeat(FEEDBACK_MAX + 1)), 'too-long');
  });
});

describe('feedback — payload shape', () => {
  beforeEach(() => resetStorage());

  test('carries user_id, type, trimmed message, app_version and lang', () => {
    localStorage.setItem('f1uno_lang', 'fr');
    const p = buildFeedbackPayload('u1', 'bug', '  hello  ');
    assert.deepEqual(p, { user_id: 'u1', type: 'bug', message: 'hello', app_version: APP_VERSION, lang: 'fr' });
  });

  test('unknown type falls back to other; overlong metadata is clamped', () => {
    const p = buildFeedbackPayload('u1', 'hacky', 'msg', 'v'.repeat(50), 'lang-code-too-long');
    assert.equal(p.type, 'other');
    assert.equal(p.app_version.length, 20);
    assert.equal(p.lang.length, 5);
    assert.ok(FEEDBACK_TYPES.includes('other'));
  });

  test('lang defaults to en when nothing is stored', () => {
    assert.equal(buildFeedbackPayload('u1', 'other', 'msg').lang, 'en');
  });
});

describe('feedback — cooldown', () => {
  test('counts down in SECONDS and clamps at zero', () => {
    assert.equal(feedbackCooldownRemaining(1000, 1000, 60000), 60);   // just sent
    assert.equal(feedbackCooldownRemaining(31000, 1000, 60000), 30);
    assert.equal(feedbackCooldownRemaining(61000, 1000, 60000), 0);   // expired
    // never sent yet -> no cooldown at all
    assert.equal(feedbackCooldownRemaining(0, 0), 0);
    assert.equal(feedbackCooldownRemaining(1, 1, FEEDBACK_COOLDOWN_MS), FEEDBACK_COOLDOWN_MS / 1000);
  });
});

describe('feedback — sendFeedback (stubbed fetch, no real network)', () => {
  const origFetch = globalThis.fetch;
  beforeEach(() => {
    resetStorage();
    window.__F1UNO_CLOUD = { url: 'https://p.supabase.co', anonKey: 'anon-k' };
  });
  afterEach(() => { globalThis.fetch = origFetch; });

  test('201: POST /rest/v1/feedback with auth headers, no-store, minimal return', async () => {
    seedSession('user-9');
    localStorage.setItem('f1uno_lang', 'de');
    let captured = null;
    globalThis.fetch = async (url, opts) => {
      captured = { url: String(url), opts };
      return new Response('', { status: 201 });
    };
    assert.equal(await sendFeedback('suggestion', ' Great app! '), true);
    assert.equal(captured.url, 'https://p.supabase.co/rest/v1/feedback');
    assert.equal(captured.opts.method, 'POST');
    assert.equal(captured.opts.cache, 'no-store');
    assert.equal(captured.opts.headers.apikey, 'anon-k');
    assert.ok(captured.opts.headers.Authorization.startsWith('Bearer '));
    assert.equal(captured.opts.headers.Prefer, 'return=minimal');
    const body = JSON.parse(captured.opts.body);
    assert.deepEqual(body, { user_id: 'user-9', type: 'suggestion', message: 'Great app!', app_version: APP_VERSION, lang: 'de' });
  });

  test('typed failures: invalid, not-signed-in, session-expired, rate-limited, send-failed', async () => {
    seedSession();
    await assert.rejects(() => sendFeedback('bug', 'ab'), /invalid/);          // too short, no fetch
    localStorage.removeItem(SESSION_KEY);
    await assert.rejects(() => sendFeedback('bug', 'hello'), /not-signed-in/);
    seedSession();
    globalThis.fetch = async () => new Response('', { status: 401 });
    await assert.rejects(() => sendFeedback('bug', 'hello'), /session-expired/);
    globalThis.fetch = async () => new Response(JSON.stringify({ message: 'rate_limited' }), { status: 400 });
    await assert.rejects(() => sendFeedback('bug', 'hello'), /rate-limited/);  // SQL trigger 5/h
    globalThis.fetch = async () => new Response('boom', { status: 500 });
    await assert.rejects(() => sendFeedback('bug', 'hello'), /send-failed/);
    globalThis.fetch = async () => { throw new TypeError('network down'); };
    await assert.rejects(() => sendFeedback('bug', 'hello'), /offline/);
  });

  test('cloud not configured → not-configured, nothing fetched', async () => {
    window.__F1UNO_CLOUD = { url: '', anonKey: '' };
    let fetched = false;
    globalThis.fetch = async () => { fetched = true; return new Response('', { status: 201 }); };
    await assert.rejects(() => sendFeedback('bug', 'hello'), /not-configured/);
    assert.equal(fetched, false);
  });

  test('fetchMyFeedback reads own rows, newest first (RLS scope)', async () => {
    seedSession();
    let captured = null;
    globalThis.fetch = async (url, opts) => {
      captured = { url: String(url), opts };
      return new Response(JSON.stringify([{ created_at: '2026-07-13T10:00:00Z', type: 'bug', message: 'm' }]), { status: 200 });
    };
    const rows = await fetchMyFeedback(5);
    assert.equal(rows.length, 1);
    assert.ok(captured.url.includes('/rest/v1/feedback?select=created_at,type,message&order=created_at.desc&limit=5'));
    assert.equal(captured.opts.cache, 'no-store');
  });
});
