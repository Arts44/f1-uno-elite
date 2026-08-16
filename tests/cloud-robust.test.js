/* ══════════════════════════════════════════════════════════
   ROBUSTESSE CLOUD (phase F) — les 5 scénarios d'échec réseau,
   avec fetch stubbé : chaque cas produit son code TYPÉ et ne
   corrompt JAMAIS l'état local (collection + session).
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetStorage } from './_setup.js';
import { pushCollection, pullCollection } from '../app/cloud-sync.js';
import { loadSession, saveSession, getValidSession } from '../app/cloud-auth.js';

const CFG = { url: 'https://demo.supabase.co', anonKey: 'anon-key' };
const FUTURE = Math.floor(Date.now() / 1000) + 3600;
const PAST = Math.floor(Date.now() / 1000) - 3600;
const SESSION = { access_token: 'tok', refresh_token: 'ref', expires_at: FUTURE, user: { id: 'u1', email: 'a@b.c' } };
const OWNED = JSON.stringify({ '001': { blue: { owned: true, qty: 2 } } });

const resp = (status, body) => ({
  ok: status >= 200 && status < 300, status,
  json: async () => body, text: async () => JSON.stringify(body),
});

function seed(session = SESSION){
  resetStorage();
  globalThis.window.__F1UNO_CLOUD = CFG;
  localStorage.setItem('f1uno_owned_2025', OWNED);
  saveSession(session);
}
const collectionIntact = () => assert.equal(localStorage.getItem('f1uno_owned_2025'), OWNED);

describe('cloud — échec réseau et session, sans corruption', () => {
  beforeEach(() => seed());

  test('S1 · push coupé à mi-requête → offline, collection intacte, session gardée', async () => {
    globalThis.fetch = async () => { throw new TypeError('network down'); };
    await assert.rejects(pushCollection(), { message: 'offline' });
    collectionIntact();
    assert.ok(loadSession(), 'la session ne doit pas être jetée sur une coupure');
  });

  test('S2 · token révoqué (401 serveur) → not-signed-in, session purgée, collection intacte', async () => {
    globalThis.fetch = async () => resp(401, { message: 'JWT invalid' });
    await assert.rejects(pushCollection(), { message: 'not-signed-in' });
    collectionIntact();
    assert.equal(loadSession(), null, 'la session morte doit être purgée');
  });

  test('S3 · pull avec session expirée et refresh REFUSÉ → not-signed-in, session purgée', async () => {
    seed({ ...SESSION, expires_at: PAST });
    globalThis.fetch = async () => resp(400, { error: 'invalid_grant' });
    await assert.rejects(pullCollection(), { message: 'not-signed-in' });
    collectionIntact();
    assert.equal(loadSession(), null);
  });

  test('S4 · coupure réseau PENDANT le refresh → offline, la session survit (fix 1.40.0)', async () => {
    seed({ ...SESSION, expires_at: PAST });
    globalThis.fetch = async () => { throw new TypeError('network down'); };
    await assert.rejects(pushCollection(), { message: 'offline' });
    collectionIntact();
    assert.ok(loadSession(), 'une coupure pendant le refresh ne déconnecte pas');
  });

  test('S5 · pull : réponse malformée → bad-data ; vide → no-data ; jamais d\'écriture locale', async () => {
    globalThis.fetch = async () => resp(200, { not: 'an-array' });
    await assert.rejects(pullCollection(), { message: 'bad-data' });
    globalThis.fetch = async () => resp(200, []);
    await assert.rejects(pullCollection(), { message: 'no-data' });
    globalThis.fetch = async () => resp(200, [{ data: { nope: true }, updated_at: 'x' }]);
    await assert.rejects(pullCollection(), { message: 'bad-data' });
    collectionIntact();
  });

  test('getValidSession : session valide rendue telle quelle, aucune requête', async () => {
    globalThis.fetch = async () => { throw new Error('ne doit pas être appelé'); };
    const s = await getValidSession();
    assert.equal(s.access_token, 'tok');
  });
});
