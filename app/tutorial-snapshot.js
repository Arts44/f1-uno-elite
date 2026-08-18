/* ══════════════════════════════════════════════════════════
   TUTORIEL · SÛRETÉ DES DONNÉES — l'instantané, et rien d'autre

   POURQUOI CE MODULE EXISTE, et ce n'est pas le graphe : la simulation
   (docs/V2-REFACTOR.md) a montré que cette extraction rapporte +1
   feuille et 0 arête — un gain nul en désenchevêtrement. Les deux
   raisons sont ailleurs :

   · `app.js` importait 746 lignes et NEUF dépendances (badges, render,
     stats, pin…) pour deux getters localStorage — `isTutorialSeen` /
     `markTutorialSeen`. Le prix d'un import ne se lit pas à la ligne
     d'import ;
   · le moteur du tutoriel est mesuré à ~0 % de couverture de fonctions
     une fois cette partie sortie — un chiffre HONNÊTE, qui désigne le
     chantier de test restant, au lieu d'un 11 % adouci par la seule
     partie déjà sûre.

   CE QUE CE MODULE GARANTIT : tout ce que la visite guidée peut écrire
   est listé ici, capturé avant, restauré après — la collection d'un
   utilisateur est identique à l'octet une fois le tour fini. C'est tenu
   par trois filets : tests/tutorial.test.js (round-trips), le registre
   tests/key-registry.test.js (toute clé du tour doit être classée), et
   verify_tutorial.py (le parcours réel, diff relu après coup).

   RIEN NE DOIT LUI ÊTRE AJOUTÉ qui dépende d'un autre module : il est
   feuille, c'est sa seule propriété structurelle, et elle disparaît au
   premier import. (Arête interdite dans tests/import-cycles.test.js.)
   ══════════════════════════════════════════════════════════ */

const SEEN_KEY = 'f1uno_onboarded'; // reused: existing installs stay flagged

export function isTutorialSeen(){ return localStorage.getItem(SEEN_KEY) === 'true'; }
export function markTutorialSeen(){ localStorage.setItem(SEEN_KEY, 'true'); }

// Every localStorage key the tour could touch, for the given season.
export function tutorialKeys(season){
  return [
    `f1uno_owned_${season}`,
    `f1uno_badges_${season}`,
    `f1uno_auto_badges_${season}`,
    `f1uno_history_${season}`,
    `f1uno_journal_${season}`,   // les gestes du tour s'y consignent — restaurés avec le reste
    `f1uno_title_${season}`,
    `f1uno_pinned_badge_${season}`,
    'f1uno_changes_since_backup',
    'f1uno_last_backup',
    // Le tutoriel ajoute des cartes, donc débloque des badges, donc
    // pourrait déclencher l'invitation à laisser un avis — et brûler
    // une des DEUX qu'un utilisateur verra dans sa vie, pendant une
    // visite guidée. On restaure l'état comme le reste.
    'f1uno_review',
    'f1uno_theme',
    'f1uno_lang',
    'f1uno_font',
  ];
}

// Capture the exact value (or null when absent) of each key.
export function captureLocalStorage(keys){
  const snap = {};
  keys.forEach(k => { snap[k] = localStorage.getItem(k); });
  return snap;
}

// Restore each key to its captured value; a key that was absent
// (null) is removed — so anything the tour created is undone too.
export function applyLocalStorage(snap){
  Object.keys(snap).forEach(k => {
    const v = snap[k];
    if(v === null || v === undefined) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  });
}
