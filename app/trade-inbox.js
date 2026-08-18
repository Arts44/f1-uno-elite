/* ══════════════════════════════════════════════════════════
   LA FICHE D'ÉCHANGE REÇUE (1.74.0) — une seule mécanique pour
   deux besoins qui n'en font qu'un.

   LE BUG QU'ELLE CORRIGE. Une fiche reçue par lien n'était
   qu'un overlay DOM : rien n'était conservé. Sur un appareil qui
   n'a JAMAIS vu l'app — le public principal d'un lien partagé —
   la mise en route et la visite guidée passaient par-dessus
   (z-index 10000 et 900 contre 500), volaient les clics, et la
   fiche disparaissait définitivement. L'ENREGISTREMENT est la
   correction : une fiche écrite survit à la mise en route, au
   tutoriel, à une fermeture accidentelle et à un rechargement.

   LES ARBITRAGES, tous validés avec leur raison :
   · UNE SEULE fiche à la fois — un échange se fait avec une
     personne, dans un moment. Plusieurs demanderaient une liste,
     un tri, une gestion, pour un besoin que rien n'atteste. La
     nouvelle remplace l'ancienne APRÈS confirmation qui la
     nomme : on ne perd jamais une fiche sans le savoir.
   · 30 JOURS — un échange se conclut en jours, pas en mois ;
     au-delà, la collection d'en face a bougé et la fiche ment.
     Une fiche × 30 jours : le plafond est STRUCTUREL, pas un
     compteur à surveiller (« pas d'accumulation silencieuse »).
     L'échéance est écrite sur la porte : rien n'expire en
     silence — la version utilisateur de ce qu'on s'applique.
   · STRICTEMENT LOCALE — ni sauvegarde, ni cloud, donc PAS dans
     DATA_KEY_RE ni dans collectionSnapshot(). Trois raisons :
     c'est la collection de quelqu'un d'AUTRE ; elle est
     périssable quand une sauvegarde est faite pour durer ; et la
     mesure du chantier 5 s'applique — le code de sauvegarde
     plafonne à 4000 caractères, une fiche en ajouterait des
     centaines pour une donnée qui expire.
   · DANS tutorialKeys() — un geste du tour restaure le
     localStorage : sans ça, la visite guidée EMPORTERAIT une
     fiche reçue juste avant. Contrat tenu par un test, vu rouge.

   FEUILLE DU GRAPHE, comme journal.js : clé littérale, aucun
   import de storage.js ni de data.js.
   ══════════════════════════════════════════════════════════ */
import { log } from './logger.js';

export const INBOX_KEY = 'f1uno_trade_inbox';
export const INBOX_JOURS = 30;
const JOUR_MS = 86400000;

export function getInbox(){
  try {
    const s = localStorage.getItem(INBOX_KEY);
    if(!s) return null;
    const f = JSON.parse(s);
    if(!f || typeof f !== 'object' || !Array.isArray(f.want)) return null;
    // Périmée : elle disparaît d'elle-même à la lecture — pas de
    // ménage différé qui laisserait croire qu'elle est encore valable.
    if(expiree(f)){ clearInbox(); return null; }
    return f;
  } catch(e){ return null; }
}

export function expiree(f, maintenant = Date.now()){
  return !f || !f.recue || (maintenant - f.recue) > INBOX_JOURS * JOUR_MS;
}

// Jours restants, arrondis vers le HAUT : « expire dans 1 jour » tant
// qu'il reste la moindre heure — jamais « dans 0 jour » sur une fiche
// encore utilisable.
export function joursRestants(f, maintenant = Date.now()){
  if(!f || !f.recue) return 0;
  return Math.max(0, Math.ceil((INBOX_JOURS * JOUR_MS - (maintenant - f.recue)) / JOUR_MS));
}

export function setInbox(data, maintenant = Date.now()){
  try {
    const f = { v: 1, season: data.season, want: data.want || [], offer: data.offer || [],
                recue: maintenant, lue: false };
    localStorage.setItem(INBOX_KEY, JSON.stringify(f));
    log('fiche reçue enregistrée :', f.want.length, 'cherchées,', f.offer.length, 'offertes');
    return f;
  } catch(e){ log('enregistrement de la fiche impossible:', e); return null; }
}

export function markInboxLue(){
  const f = getInbox();
  if(!f) return;
  f.lue = true;
  try { localStorage.setItem(INBOX_KEY, JSON.stringify(f)); } catch(e){ /* stockage plein */ }
}

export function clearInbox(){
  try { localStorage.removeItem(INBOX_KEY); } catch(e){ /* rien à faire */ }
}

/* PEUT-ON AFFICHER MAINTENANT ? Même famille que le garde de la
   célébration de palier : le point d'accroche décide, pas un drapeau.
   Trois écrans ont priorité — et pendant une visite guidée la fiche ne
   s'affiche NI pendant NI à la fin : un plein écran à la sortie du
   tutoriel serait le même défaut, décalé de trente secondes. La
   pastille sur la porte dit qu'elle est là ; l'utilisateur y va quand
   il veut. */
export function peutAfficher(){
  const login = document.getElementById('login-screen');
  if(login && getComputedStyle(login).display !== 'none') return false;
  if(document.querySelector('.tut-overlay')) return false;
  if(document.getElementById('tierCele')) return false;
  return true;
}
