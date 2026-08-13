/* ══════════════════════════════════════════════════════════
   BADGES · STOCKAGE — l'état persistant, et rien qui l'affiche

   POURQUOI CE MODULE EXISTE, et ce n'est pas la taille de badges.js :

   `storage.js` a besoin de l'état des badges pour construire une
   sauvegarde (`collectionSnapshot`) et pour la restaurer (`importData`).
   Il l'importait donc de `badges.js` — qui importait en retour
   `_storageKey` et les prédicats de carte de `storage.js`.

   Cette arête, `storage.js → badges.js`, est de la MÊME FAMILLE que la
   fuite inter-saisons corrigée en 1.52.1 : un module qui lit l'état d'un
   autre pendant que celui-ci s'initialise. Le bug d'alors venait d'un
   `else` manquant ; il aurait pu venir de l'ordre d'initialisation, et
   personne n'aurait su où regarder.

   Ce module rompt l'arête : `storage.js → badges-store.js`, et le store
   ne connaît que `storage-keys.js` et `secure-store.js`. Il ne connaît
   NI la vue, NI les règles d'évaluation, NI les données de badges.

   CE QU'IL NE FAIT PAS. Il ne décide pas si un badge est débloqué —
   c'est une règle, elle vit ailleurs. Il conserve ce qu'on lui donne et
   le rend tel quel.

   ⚠️ LES DEUX `else` DE loadManualBadges() NE SONT PAS COSMÉTIQUES.
   Sans eux, une saison sans badges enregistrés hérite de ceux de la
   précédente, et le premier déblocage les écrit sous la nouvelle clé :
   la fuite devient permanente. Vérifié en automatique par
   tests/season-badge-leak.test.js.
   ══════════════════════════════════════════════════════════ */
import { _storageKey } from './storage-keys.js';
import { secureGet, secureSet } from './secure-store.js';

export let manualBadges = {};        // { badgeId: timestamp }
export let autoBadgeUnlocked = {};   // { badgeId: timestamp } — jamais reverrouillé

// Écritures inter-modules (import en mode « remplacer »)
export function setManualBadges(v){ manualBadges = v; }
export function setAutoBadgeUnlocked(v){ autoBadgeUnlocked = v; }

export function loadManualBadges(){
  try {
    const s = secureGet(_storageKey('badges'));
    manualBadges = s ? JSON.parse(s) : {};
  } catch(e){ manualBadges = {}; }
  try {
    const a = secureGet(_storageKey('auto_badges'));
    autoBadgeUnlocked = a ? JSON.parse(a) : {};
  } catch(e){ autoBadgeUnlocked = {}; }
}

export function saveManualBadges(){
  secureSet(_storageKey('badges'), JSON.stringify(manualBadges));
  secureSet(_storageKey('auto_badges'), JSON.stringify(autoBadgeUnlocked));
}

/* Date de déblocage lisible, ou null. Les enregistrements d'avant 1.47
   valent `true` (pas de date connue) : les deux sont vrais, et la règle
   « une fois débloqué, toujours débloqué » ne change pas. */
export function badgeUnlockDate(store, id){
  const v = store[id];
  return (typeof v === 'number' && v > 0) ? new Date(v) : null;
}

/* L'objectif épinglé — un identifiant, scoppé par saison. Il vit ici
   parce que c'est une clé de stockage de badges, pas parce qu'il
   ressemble au reste : la page Badges le lit, Stats aussi. */
export function getPinnedBadge(){ return localStorage.getItem(_storageKey('pinned_badge')) || null; }
export function setPinnedBadge(id){
  if(id) localStorage.setItem(_storageKey('pinned_badge'), id);
  else localStorage.removeItem(_storageKey('pinned_badge'));
}
