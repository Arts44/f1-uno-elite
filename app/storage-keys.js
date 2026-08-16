/* ══════════════════════════════════════════════════════════
   LA RÈGLE DE NOMMAGE DES CLÉS — et rien d'autre

   POURQUOI CE MODULE DE DIX LIGNES EXISTE. Deux stockages INDÉPENDANTS
   partagent cette règle : la collection (`storage.js`) et les badges
   (`badges-store.js`). Tant qu'elle vivait dans `storage.js`, le store
   des badges devait importer le module de la collection — et la
   collection importait en retour l'état des badges pour la sauvegarde.
   C'est cette arête, `storage.js → badges.js`, qui a produit la fuite
   inter-saisons de 1.52.1 : un module lisait l'état d'un autre pendant
   que celui-ci l'initialisait.

   L'ALTERNATIVE ÉTAIT DE RECOPIER la règle dans les deux modules. Passée
   au critère du dépôt — « ces deux endroits changeraient-ils toujours
   ensemble ? » — la réponse est OUI : tout changement du schéma de clés
   touche les deux. Donc on n'a pas dupliqué, on a extrait.

   Ce module ne dépend que de la saison courante. Rien ne doit lui être
   ajouté : dès qu'il connaîtra autre chose, il redeviendra un carrefour.
   ══════════════════════════════════════════════════════════ */
import { _currentSeason } from './season.js';

/* Deux clés échappent au scope de saison, et ce n'est pas un oubli :
   le thème et la version de schéma appartiennent à l'APPAREIL, pas à
   une collection. Les mettre par saison ferait basculer le thème en
   changeant d'année. */
const HORS_SAISON = new Set(['theme', 'version']);

export function _storageKey(name){
  return HORS_SAISON.has(name)
    ? `f1uno_${name}`
    : `f1uno_${name}_${_currentSeason}`;
}
