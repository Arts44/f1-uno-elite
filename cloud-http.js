/* ══════════════════════════════════════════════════════════
   CLOUD · TRANSPORT — la config Supabase, les en-têtes, et la
   SEULE fonction qui exécute une requête.

   POURQUOI CE MODULE EXISTE (et pas pour un compteur) :

   1. La règle de 1.40.0 — « un échec RÉSEAU n'est pas un refus
      du SERVEUR » — était recopiée huit fois dans cloud.js. Une
      règle en huit exemplaires est une règle qui finit par
      diverger, et le jour où une copie dérive, un utilisateur en
      tunnel se retrouve déconnecté au lieu d'être averti.
      Ici elle est écrite UNE fois, dans cloudFetch().

   2. feedback.js a besoin de cloudConfig() et authHeaders() sans
      avoir besoin d'une session, ni d'une collection, ni du DOM.
      Il importait pour ça un module de 726 lignes.

   Ce module ne connaît NI la session, NI la collection, NI le
   DOM. C'est le bas de la pile : ui → sync → auth → http.
   ══════════════════════════════════════════════════════════ */
import { log } from './logger.js';

/* ── Config (remplie par l'utilisateur dans cloud-config.js) ──
   PROVENANCE DE cfg.url — la réponse aux alertes SSRF portées sur les
   fetch() de ce module. L'URL vient d'UNE seule source : le littéral
   écrit dans cloud-config.js, un fichier VERSIONNÉ dans le dépôt et
   servi avec l'app. Elle n'est jamais lue depuis une saisie, une
   sauvegarde importée, un lien #backup=, une réponse réseau ni le
   localStorage. Un attaquant capable de la modifier a déjà réécrit les
   fichiers servis : il n'a plus besoin d'un SSRF.
   Le seul traitement appliqué est la suppression des « / » finaux, pour
   que la concaténation des chemins reste stable. ── */
export function cloudConfig(){
  const c = (typeof window !== 'undefined' && window.__F1UNO_CLOUD) || {};
  return (c.url && c.anonKey) ? { url: c.url.replace(/\/+$/, ''), anonKey: c.anonKey } : null;
}
export function isCloudConfigured(){ return !!cloudConfig(); }

// En-têtes GoTrue/PostgREST. Sans jeton utilisateur, la clé anon sert
// de bearer (Supabase l'exige même pour un appel anonyme).
export function authHeaders(cfg, accessToken){
  return {
    'apikey': cfg.anonKey,
    'Authorization': `Bearer ${accessToken || cfg.anonKey}`,
    'Content-Type': 'application/json',
  };
}

/* ── LA règle de 1.40.0, écrite une seule fois ──
   Une coupure réseau (tunnel, avion, Wi-Fi qui tombe) fait rejeter
   fetch() ; ce n'est PAS le serveur qui refuse. On la traduit en
   'offline', que les couches du dessus traitent comme « réessayable,
   la session reste valide ». Un vrai refus arrive en réponse !ok et
   reste à la charge de l'appelant, qui seul sait ce qu'il signifie.

   Toutes les requêtes portent cache:'no-store', ET le service worker
   exclut l'origine Supabase : aucune réponse d'API n'est jamais servie
   depuis le cache. ── */
export async function cloudFetch(url, opts){
  return fetch(url, { cache: 'no-store', ...opts })
    .catch(() => { throw new Error('offline'); });
}

// Lecture du corps d'une réponse en échec, pour le journal — jamais
// pour décider. Le code d'erreur reste choisi par l'appelant : chaque
// panne a un sens de domaine différent (push-failed, code-invalid…).
export async function logFailure(label, resp){
  log(label, resp.status, await resp.text().catch(() => ''));
}
