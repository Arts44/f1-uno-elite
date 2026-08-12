/* ══════════════════════════════════════════════════════════
   CLOUD · IDENTITÉ — session, jetons, et les appels GoTrue.

   POURQUOI CE MODULE EXISTE (et pas pour un compteur) :

   1. C'est le SEUL endroit qui détient le secret de session
      (f1uno_cloud_session) et le seul qui parle à GoTrue.
      Une frontière autour d'un secret est une frontière utile.

   2. Deux consommateurs le veulent SANS le reste : app.js pour
      handleAuthRedirect() au démarrage, et feedback.js pour
      getValidSession()/loadSession()/decodeJwtSub() — feedback
      n'a rien à voir avec la synchronisation d'une collection,
      et importait pourtant 726 lignes pour six fonctions.

   3. C'est la partie qui doit se tester SANS DOM ni collection.
      Les tests de caractérisation (1.50.x) ont dû construire un
      mini-DOM entier pour atteindre des fonctions pures : c'est
      exactement ce que cette séparation supprime.

   Position dans la pile : ui → sync → auth → http.
   Ce module ne connaît NI la collection, NI le DOM.

   NOTE SUR _requireOnline/_requireSession : le plan les plaçait
   dans cloud-sync. Ils sont ici, et c'est un écart assumé —
   requestEmailChange() en a besoin et appartient à l'auth ; les
   laisser dans sync aurait forcé une flèche auth → sync, donc un
   cycle, dans une pile qu'on veut strictement descendante.
   ══════════════════════════════════════════════════════════ */
import { log } from './logger.js';
import { cloudConfig, authHeaders, cloudFetch, logFailure } from './cloud-http.js';
import { deniedForViewer } from './session.js';

export const SESSION_KEY = 'f1uno_cloud_session';

/* ══════════════════════════════════════════════════════════
   HELPERS PURS (testés unitairement)
   ══════════════════════════════════════════════════════════ */

// Parse the #access_token=…&refresh_token=… fragment GoTrue appends
// to the redirect URL after the magic link is clicked.
// `nowSec` is injectable for tests.
export function parseSessionFromHash(hash, nowSec){
  if(!hash || hash.indexOf('access_token=') === -1) return null;
  const p = new URLSearchParams(hash.replace(/^#\/?/, ''));
  const access_token = p.get('access_token');
  const refresh_token = p.get('refresh_token');
  if(!access_token || !refresh_token) return null;
  const expiresIn = parseInt(p.get('expires_in') || '3600', 10);
  const expires_at = parseInt(p.get('expires_at') || '0', 10)
    || (nowSec || Math.floor(Date.now() / 1000)) + expiresIn;
  return { access_token, refresh_token, expires_at, type: p.get('type') || '' };
}

// A session is "expired" 60s early so a token never dies mid-request.
export function isSessionExpired(session, nowSec){
  if(!session || !session.access_token || !session.expires_at) return true;
  const now = nowSec || Math.floor(Date.now() / 1000);
  return now >= session.expires_at - 60;
}

// The user id (auth.uid()) is the JWT's `sub` claim — decoded locally,
// no network round-trip needed to know who we are.
export function decodeJwtSub(token){
  try {
    const payload = token.split('.')[1];
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(b64)).sub || null;
  } catch(e){ return null; }
}

/* ── Une réponse à jeton → une session (factorisation) ──
   GoTrue renvoie EXACTEMENT la même forme sur /verify et sur
   /token?grant_type=refresh_token. Les deux constructions étaient
   identiques au caractère près, `expires_in || 3600` compris : une
   seule décision écrite deux fois, donc factorisée.
   `expires_at` est préféré quand le serveur le donne ; sinon on le
   dérive de `expires_in`. `user` reste undefined si le serveur ne le
   renvoie pas — l'appelant décide s'il conserve l'ancien. ── */
function _sessionFromToken(d){
  return {
    access_token: d.access_token,
    refresh_token: d.refresh_token,
    expires_at: d.expires_at || (Math.floor(Date.now() / 1000) + (d.expires_in || 3600)),
    user: d.user ? { id: d.user.id, email: d.user.email } : undefined,
  };
}

/* ── Persistance de session ── */

/* ── Session persistence ── */
export function loadSession(){
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if(!raw) return null;
    const s = JSON.parse(raw);
    return (s && s.access_token && s.refresh_token) ? s : null;
  } catch(e){ return null; }
}
export function saveSession(session){
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
export function clearSession(){
  localStorage.removeItem(SESSION_KEY);
}

/* ══════════════════════════════════════════════════════════
   AUTH API (GoTrue, REST)
   ══════════════════════════════════════════════════════════ */

// Send the magic link. redirect_to = the current page, so the link
// comes back to the same entry (localhost dev or GitHub Pages) —
// the URL must be allowed in Supabase → Auth → URL Configuration.
export async function sendMagicLink(email){
  if(deniedForViewer()) throw new Error('read-only');   // refus même en appel direct
  const cfg = cloudConfig();
  if(!cfg) throw new Error('not-configured');
  const redirectTo = encodeURIComponent(location.origin + location.pathname);
  const resp = await cloudFetch(`${cfg.url}/auth/v1/otp?redirect_to=${redirectTo}`, {
    method: 'POST',
    cache: 'no-store',
    headers: authHeaders(cfg),
    body: JSON.stringify({ email, create_user: true }),
  });
  if(!resp.ok){
    const body = await resp.text().catch(() => '');
    log('cloud: otp failed', resp.status, body);
    throw new Error(classifyOtpError(resp.status, body));
  }
  return true;
}

/* ── Pourquoi l'e-mail n'est pas parti (pur, testé) ──
   Un seul message « vérifie l'adresse » couvrait quatre causes très
   différentes, dont trois où l'adresse n'y est pour RIEN. La plus
   fréquente pour un nouvel utilisateur : sans SMTP personnalisé,
   Supabase REFUSE de livrer à une adresse hors équipe du projet
   (403 email_address_not_authorized) — dire « vérifie l'adresse »
   envoie alors l'utilisateur corriger une adresse correcte.
   Renvoie : 'rate-limited' | 'email-not-allowed' | 'signups-closed'
             | 'mail-down' | 'otp-failed'. */
export function classifyOtpError(status, body){
  const b = String(body || '');
  if(status === 429 || b.includes('over_email_send_rate_limit')) return 'rate-limited';
  if(b.includes('email_address_not_authorized')) return 'email-not-allowed';
  if(b.includes('signup_disabled') || b.includes('otp_disabled')) return 'signups-closed';
  if(status >= 500 || b.includes('error_sending')) return 'mail-down';
  return 'otp-failed';
}

// Verify the emailed code (GoTrue /verify). NOT six digits: Supabase's
// "Email OTP Length" is configurable and THIS PROJECT USES 8 — see
// isValidOtpFormat() below, which accepts 6 to 10. The old wording said
// "6-digit code" and was simply wrong; it was copied into a report before
// anyone re-read the helper two functions down. This is the
// PRIMARY sign-in path: typing a code works in every context — installed
// PWA (standalone), plain browser, mobile — unlike the magic link, which
// always opens in the default browser and never reaches the installed
// app (and iOS PWAs don't even share localStorage with Safari).
export async function verifyOtpCode(email, code){
  if(deniedForViewer()) throw new Error('read-only');   // refus même en appel direct
  const cfg = cloudConfig();
  if(!cfg) throw new Error('not-configured');
  const resp = await cloudFetch(`${cfg.url}/auth/v1/verify`, {
    method: 'POST',
    cache: 'no-store',
    headers: authHeaders(cfg),
    body: JSON.stringify({ type: 'email', email, token: code }),
  });
  if(!resp.ok){
    await logFailure('cloud: verify failed', resp);
    throw new Error(resp.status === 429 ? 'rate-limited' : 'code-invalid');
  }
  const d = await resp.json().catch(() => null);
  if(!d || !d.access_token || !d.refresh_token) throw new Error('code-invalid');
  const session = _sessionFromToken(d);
  saveSession(session);
  log('cloud: signed in via OTP code as', session.user && session.user.email);
  return session;
}

/* ── OTP input helpers (pure, tested) ──
   Supabase's "Email OTP Length" is configurable from 6 to 10 digits
   (this project uses 8!) — the app must never assume 6. Pasted codes
   may carry spaces ("0371 6217"): strip all whitespace first. */
export function normalizeOtpInput(value){
  return String(value || '').replace(/\s+/g, '');
}
export function isValidOtpFormat(code){
  return /^\d{6,10}$/.test(code);
}

/* ── Send cool-down (anti rate-limit guard) ──
   Supabase throttles auth emails aggressively; a user hammering the
   send button would lock himself out (429). Pure helper is tested. */
export const SEND_COOLDOWN_MS = 60000;
let _lastOtpSentAt = 0;
export function sendCooldownRemaining(lastSentAt, now, cooldownMs = SEND_COOLDOWN_MS){
  if(!lastSentAt) return 0;
  return Math.max(0, Math.ceil((lastSentAt + cooldownMs - now) / 1000));
}

// Fetch the user profile (id + email) for a fresh token.
async function _fetchUser(cfg, accessToken){
  const resp = await cloudFetch(`${cfg.url}/auth/v1/user`, {
    cache: 'no-store',
    headers: authHeaders(cfg, accessToken),
  });
  if(!resp.ok) throw new Error('user-failed');
  const u = await resp.json();
  return { id: u.id, email: u.email };
}

// Exchange the refresh token for a new session.
async function _refresh(cfg, refreshToken){
  // fix 1.40.0 : un échec RÉSEAU (tunnel, avion) n'est pas un refus du
  // serveur — il remonte 'offline' et la session reste récupérable.
  // Seul un vrai refus (resp !ok) vaut 'refresh-failed' → déconnexion.
  const resp = await cloudFetch(`${cfg.url}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    cache: 'no-store',
    headers: authHeaders(cfg),
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if(!resp.ok) throw new Error('refresh-failed');
  return _sessionFromToken(await resp.json());
}

// The one entry point API calls use: returns a session with a valid
// (refreshed if needed) access token, or null if signed out / expired
// beyond recovery. Clears the stored session when refresh fails.
export async function getValidSession(){
  const cfg = cloudConfig();
  if(!cfg) return null;
  let session = loadSession();
  if(!session) return null;
  if(!isSessionExpired(session)) return session;
  try {
    const fresh = await _refresh(cfg, session.refresh_token);
    session = { ...session, ...fresh, user: fresh.user || session.user };
    saveSession(session);
    log('cloud: session refreshed');
    return session;
  } catch(e){
    if(e && e.message === 'offline'){
      // coupure pendant le refresh : la session n'est PAS jetée —
      // l'opération échoue en 'offline' et se retentera au retour du réseau
      log('cloud: refresh offline, session kept');
      throw e;
    }
    log('cloud: refresh refused, signing out', e);
    clearSession();
    return null;
  }
}

// Called at boot: if the URL carries a magic-link fragment, store the
// session, resolve the user profile and clean the URL.
export async function handleAuthRedirect(){
  if(deniedForViewer()) return false;   // lecture seule : refus même en appel direct
  const cfg = cloudConfig();
  if(!cfg) return false;
  const parsed = parseSessionFromHash(location.hash);
  if(!parsed) return false;
  try { history.replaceState(null, '', location.pathname + location.search); } catch(e){}
  const session = { ...parsed };
  try {
    session.user = await _fetchUser(cfg, session.access_token);
  } catch(e){
    log('cloud: could not fetch user after redirect', e);
  }
  saveSession(session);
  log('cloud: signed in via magic link as', session.user && session.user.email);
  return true;
}

export async function signOut(){
  if(deniedForViewer()) throw new Error('read-only');   // refus même en appel direct
  const cfg = cloudConfig();
  const session = loadSession();
  clearSession(); // local state first: signing out must always succeed
  if(cfg && session){
    try {
      await cloudFetch(`${cfg.url}/auth/v1/logout`, {
        method: 'POST',
        cache: 'no-store',
        headers: authHeaders(cfg, session.access_token),
      });
    } catch(e){ log('cloud: logout request failed (ignored)', e); }
  }
}

/* ── Préconditions partagées ──
   `_requireOnline` refuse AVANT la requête quand le navigateur se sait
   hors ligne ; `_requireSession` fournit une session valide ET l'id
   utilisateur (claim `sub` du JWT si le profil n'a pas été résolu). ── */
// Errors are thrown as Error(code) with code ∈
// {'offline','not-signed-in','push-failed','pull-failed','no-data','bad-data'}
// LA question « le navigateur se sait-il hors ligne ? », posée une fois.
// Deux façons de s'en servir, parce que les contrats diffèrent : les
// actions déclenchées par l'utilisateur LÈVENT un code typé (il faut le
// lui dire), la lecture d'arrière-plan RENVOIE null (rien à annoncer).
export function isOffline(){
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}
export function _requireOnline(){
  if(isOffline()) throw new Error('offline');
}
export async function _requireSession(){
  const session = await getValidSession();
  if(!session) throw new Error('not-signed-in');
  const userId = (session.user && session.user.id) || decodeJwtSub(session.access_token);
  if(!userId) throw new Error('not-signed-in');
  return { session, userId };
}

// Change the account email: GoTrue sends confirmation link(s) — to both
// mailboxes when the project has "secure email change" enabled.
export async function requestEmailChange(newEmail){
  if(deniedForViewer()) throw new Error('read-only');   // refus même en appel direct
  const cfg = cloudConfig();
  if(!cfg) throw new Error('not-signed-in');
  _requireOnline();
  const { session } = await _requireSession();
  const resp = await cloudFetch(`${cfg.url}/auth/v1/user`, {
    method: 'PUT',
    cache: 'no-store',
    headers: { ...authHeaders(cfg, session.access_token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: newEmail }),
  });
  if(!resp.ok){
    await logFailure('cloud: email change failed', resp);
    throw new Error(resp.status === 429 ? 'rate-limited' : 'email-change-failed');
  }
  return true;
}
