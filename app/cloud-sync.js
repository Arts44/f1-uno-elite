/* ══════════════════════════════════════════════════════════
   CLOUD · SYNCHRONISATION — push / pull / suppression / méta,
   sur PostgREST (/rest/v1/collections).

   POURQUOI CE MODULE EXISTE (et pas pour un compteur) :

   1. C'est le SEUL endroit qui connaît la forme de la ligne
      distante : (user_id, season, data). Personne d'autre dans le
      dépôt n'a besoin de le savoir.

   2. C'est la frontière que le MULTI-SAISONS traverse. Aujourd'hui
      la saison est un AMBIANT : `_currentSeason` est importé de
      data.js comme liaison vivante et lu à trois endroits. D'où
      l'impossibilité de pousser 2026 sans basculer l'application,
      ou de lister les saisons présentes dans le cloud (la requête
      filtre season=eq.courante). Le serveur, lui, est prêt : la clé
      primaire est (user_id, season).
      Le travail à venir tient alors en trois signatures — dans CE
      fichier — pushSeason(s), pullSeason(s), listCloudSeasons(),
      et le défaut « saison courante » remonte dans l'UI, où il
      appartient. Rien de cela n'est fait ici : ce commit ne change
      aucun comportement.

   Position dans la pile : ui → sync → auth → http.
   Ce module ne connaît PAS le DOM.
   ══════════════════════════════════════════════════════════ */
import { log } from './logger.js';
import { cloudConfig, isCloudConfigured, authHeaders, cloudFetch, logFailure } from './cloud-http.js';
import {
  loadSession, clearSession, getValidSession,
  isOffline, _requireOnline, _requireSession,
} from './cloud-auth.js';
import { deniedForViewer } from './session.js';
import { collectionSnapshot, _showImportDialog } from './storage.js';
import { backupIncludes } from './settings-sync.js';
import { markBackupDone } from './backup.js';
import { _currentSeason } from './data.js';

// PostgREST upsert body for one (user, season) row. Pure for tests.
// updated_at is intentionally absent: the server trigger owns it.
export function buildUpsertRow(userId, season, snapshot){
  return { user_id: userId, season, data: snapshot };
}

/* ── Jeton révoqué côté serveur (factorisation n°3) ──
   Un 401/403 sur une requête PostgREST signifie que le jeton n'est plus
   accepté : la session locale est morte, on la purge et on remonte le
   code typé pour que l'UI repasse au formulaire de connexion.
   Cette règle vivait en DEUX exemplaires, dans push et dans pull. C'est
   une règle de SÉCURITÉ : deux copies, c'est deux occasions de diverger
   — l'une purgeant la session, l'autre l'oubliant après une évolution.
   Une seule décision, un seul endroit. ── */
function _rejectIfRevoked(resp){
  if(resp.status === 401 || resp.status === 403){
    clearSession();
    throw new Error('not-signed-in');
  }
}

// Upsert the current season's snapshot. Returns the server updated_at.
/* ── LA SAISON EST UN ARGUMENT ──
   Elle était un AMBIANT : `_currentSeason` lu à trois endroits, donc
   impossible de pousser 2026 sans basculer l'application, ni de tirer
   une saison qu'on n'a pas à l'écran. Le serveur, lui, était prêt
   depuis le début — la clé primaire est (user_id, season).
   Le défaut « saison courante » reste, mais il remonte d'un cran : au
   site d'appel, où il est un choix d'interface et non une règle de
   synchronisation. Les anciens noms restent exportés et délèguent, pour
   que les consommateurs n'aient pas à bouger en même temps. */
export async function pushSeason(season){
  if(deniedForViewer()) throw new Error('read-only');   // refus même en appel direct
  const cfg = cloudConfig();
  if(!cfg) throw new Error('not-signed-in');
  _requireOnline();
  const { session, userId } = await _requireSession();
  const row = buildUpsertRow(userId, season, collectionSnapshot({ ...backupIncludes(), journal: true }));
  const resp = await cloudFetch(`${cfg.url}/rest/v1/collections?on_conflict=user_id,season`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      ...authHeaders(cfg, session.access_token),
      'Prefer': 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify([row]),
  });
  _rejectIfRevoked(resp);
  if(!resp.ok){
    await logFailure('cloud: push failed', resp);
    throw new Error('push-failed');
  }
  const rows = await resp.json().catch(() => null);
  const updatedAt = rows && rows[0] && rows[0].updated_at;
  // A successful cloud push IS a backup: reset the local backup reminder.
  try { markBackupDone(); } catch(e){}
  log('cloud: pushed season', season, 'updated_at', updatedAt);
  return updatedAt || null;
}

// Fetch the cloud snapshot for the current season and hand it to the
// EXISTING import dialog (merge / replace / cancel) — the local
// collection is never overwritten silently.
export async function pullSeason(season){
  if(deniedForViewer()) throw new Error('read-only');   // refus même en appel direct
  const cfg = cloudConfig();
  if(!cfg) throw new Error('not-signed-in');
  _requireOnline();
  const { session } = await _requireSession();
  const resp = await cloudFetch(
    `${cfg.url}/rest/v1/collections?season=eq.${season}&select=data,updated_at`, {
    cache: 'no-store',
    headers: authHeaders(cfg, session.access_token),
  });
  _rejectIfRevoked(resp);
  if(!resp.ok){
    await logFailure('cloud: pull failed', resp);
    throw new Error('pull-failed');
  }
  const rows = await resp.json().catch(() => null);
  if(!Array.isArray(rows)) throw new Error('bad-data');
  if(rows.length === 0) throw new Error('no-data');
  const snapshot = rows[0].data;
  if(!snapshot || typeof snapshot !== 'object' || !snapshot.owned) throw new Error('bad-data');
  _showImportDialog(snapshot); // merge / replace / cancel — user decides
  return rows[0].updated_at || null;
}

// True when a session exists locally (used by the Account view to gate
// cloud-scoped actions; token freshness is re-checked by the actions).
export function isCloudSignedIn(){
  return isCloudConfigured() && !!loadSession();
}

// Danger zone: delete EVERY season row of the signed-in user (RLS keeps
// this scoped to their own rows server-side).
/* `season` : une saison distante, ou null/absent pour toutes.
   Le serveur le permet sans effort — la clé primaire est
   (user_id, season), donc filtrer dessus est une clause de plus.
   RLS garde de toute façon la suppression sur les lignes de
   l'utilisateur : le filtre `user_id` est une ceinture, pas la
   protection. */
export async function cloudDeleteSeason(season = null){
  if(deniedForViewer()) throw new Error('read-only');   // refus même en appel direct
  const cfg = cloudConfig();
  if(!cfg) throw new Error('not-signed-in');
  _requireOnline();
  const { session, userId } = await _requireSession();
  const filtre = season === null ? '' : `&season=eq.${encodeURIComponent(season)}`;
  const resp = await cloudFetch(`${cfg.url}/rest/v1/collections?user_id=eq.${userId}${filtre}`, {
    method: 'DELETE',
    cache: 'no-store',
    headers: {
      ...authHeaders(cfg, session.access_token),
      // Sans cet en-tête, PostgREST répond 204 QUE la clause ait touché une
      // ligne ou zéro : la réponse ne distingue pas « supprimé » de « il n'y
      // avait rien ». Avec lui, il renvoie les lignes supprimées — donc leur
      // nombre. C'est le même en-tête que pushSeason() utilise déjà.
      'Prefer': 'return=representation',
    },
  });
  if(!resp.ok){
    await logFailure('cloud: delete failed', resp);
    throw new Error('delete-failed');
  }
  return await _lignesSupprimees(resp);
}

/* Combien de lignes ont réellement disparu.

   TROIS RÉSULTATS, PAS DEUX. `0` et `null` ne disent pas la même chose :
   `0` est une certitude (le serveur a répondu, la liste était vide, il n'y
   avait rien à supprimer) ; `null` est une ignorance (le serveur n'a pas
   renvoyé les lignes — en-tête ignoré, corps vide, JSON illisible). La
   suppression a réussi dans les deux cas, sinon on aurait déjà lancé.

   Renvoyer `true` pour tout, c'était appeler « supprimé » ce qui pouvait
   n'avoir jamais existé. Renvoyer `false` en cas d'ignorance serait pire :
   ce serait affirmer un échec qui n'a pas eu lieu. */
async function _lignesSupprimees(resp){
  if(resp.status === 204) return null;          // le serveur a ignoré Prefer
  try {
    const rows = await resp.json();
    return Array.isArray(rows) ? rows.length : null;
  } catch(e){
    return null;                                 // corps vide ou illisible
  }
}

// Lightweight metadata read for the "last cloud backup" line.
export async function fetchSeasonMeta(season){
  const cfg = cloudConfig();
  if(!cfg) return null;
  // Hors ligne : on ne tente RIEN. Cette fonction était la seule des cinq
  // à ne pas poser la question — elle lançait donc une requête vouée à
  // échouer chaque fois qu'on ouvrait le Compte sans connexion.
  // Elle RENVOIE null au lieu de lever : son contrat est « une date ou
  // rien », et l'appelant (_fillLastBackup) n'affiche pas d'erreur.
  if(isOffline()) return null;
  const session = await getValidSession();
  if(!session) return null;
  try {
    const resp = await cloudFetch(
      `${cfg.url}/rest/v1/collections?season=eq.${season}&select=updated_at`, {
      cache: 'no-store',
      headers: authHeaders(cfg, session.access_token),
    });
    if(!resp.ok) return null;
    const rows = await resp.json();
    return (Array.isArray(rows) && rows[0] && rows[0].updated_at) || null;
  } catch(e){ return null; }
}

/* ── Compatibilité : les trois noms d'origine, sur la saison courante ──
   C'est ICI que `_currentSeason` est lu, et nulle part ailleurs. Le
   défaut d'interface est donc explicite et à un seul endroit. */
export const pushCollection = () => pushSeason(_currentSeason);
export const pullCollection = () => pullSeason(_currentSeason);
export const fetchCloudMeta = () => fetchSeasonMeta(_currentSeason);

/* ── listCloudSeasons() — ce que le multi-saisons attendait ──
   Même requête que fetchSeasonMeta, SANS le filtre `season=eq.` : le
   serveur renvoie une ligne par saison sauvegardée. Impossible avant,
   puisque la requête était figée sur la saison affichée.
   Renvoie [] plutôt que null en cas d'échec : l'appelant affiche une
   liste vide, ce qui est vrai, au lieu de distinguer un cas d'erreur
   dont il ne peut rien faire. */
export async function listCloudSeasons(){
  const cfg = cloudConfig();
  if(!cfg) return [];
  if(isOffline()) return [];
  const session = await getValidSession();
  if(!session) return [];
  try {
    const resp = await cloudFetch(`${cfg.url}/rest/v1/collections?select=season,updated_at`, {
      cache: 'no-store',
      headers: authHeaders(cfg, session.access_token),
    });
    if(!resp.ok) return [];
    const rows = await resp.json();
    return Array.isArray(rows)
      ? rows.filter(r => Number.isInteger(r.season)).sort((a, b) => b.season - a.season)
      : [];
  } catch(e){ return []; }
}

// Nom historique conservé : la zone danger l'appelle encore pour la
// portée « toutes les saisons ».
export const cloudDeleteAll = () => cloudDeleteSeason(null);
