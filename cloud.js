/* ══════════════════════════════════════════════════════════
   CLOUD — baril de TRANSITION, supprimé au pas 5.

   Ce fichier ne contient plus de code : il ré-exporte la surface
   publique historique pour que les trois consommateurs (app.js,
   account.js, feedback.js) n'aient pas à bouger pendant que les
   modules se mettent en place. Chaque pas du découpage reste
   ainsi un pur déplacement, vérifiable par des tests inchangés.

   Il DOIT disparaître : le garder annulerait le bénéfice visé.
   feedback.js continuerait d'importer un fichier qui, lui,
   importe le DOM, la collection et i18n — alors qu'il ne veut
   que six fonctions d'authentification.

   La vraie pile est : cloud-ui → cloud-sync → cloud-auth → cloud-http
   ══════════════════════════════════════════════════════════ */
export { cloudConfig, isCloudConfigured, authHeaders } from './cloud-http.js';
export {
  SESSION_KEY, loadSession, saveSession, clearSession,
  parseSessionFromHash, isSessionExpired, decodeJwtSub,
  sendMagicLink, classifyOtpError, verifyOtpCode,
  normalizeOtpInput, isValidOtpFormat,
  SEND_COOLDOWN_MS, sendCooldownRemaining,
  getValidSession, handleAuthRedirect, signOut, requestEmailChange,
} from './cloud-auth.js';
export {
  buildUpsertRow, pushCollection, pullCollection,
  isCloudSignedIn, cloudDeleteAll, fetchCloudMeta,
} from './cloud-sync.js';
export { cloudSectionHTML, bindCloudSection } from './cloud-ui.js';
