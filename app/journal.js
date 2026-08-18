/* ══════════════════════════════════════════════════════════
   LE JOURNAL DES GESTES (1.68.0) — consigner aujourd'hui pour
   pouvoir dessiner dans trois mois.

   La piste C de l'exploration a été refusée avec raison :
   history.js ne stocke que { date, owned } — « there is no way
   to back-fill the past from the current state ». Ce module est
   la réponse : chaque geste { d, c, t, q } (date, carte, type,
   delta d'exemplaires) au moment où il se produit. AUCUN
   AFFICHAGE : rien n'apparaît dans l'interface, et c'est voulu —
   il n'y aura une histoire à raconter que dans plusieurs
   semaines, et jamais pour le passé.

   POURQUOI IL NE MENT PAS — un journal qui invente des gestes
   serait pire que pas de journal (personne ne s'en apercevrait) :
   · le point d'accroche est setTypeData (storage.js), et ses
     appelants sont TOUS des gestes — quickToggle, changeMoQty,
     quickAddVariant, undoQuickAdd. Les imports (restauration,
     pull cloud) remplacent `coll` directement et n'y passent
     jamais ; la restauration du tutoriel réécrit localStorage
     brut. Aucun drapeau de suspension à maintenir : le point
     d'accroche fait le garde, comme pour la célébration de
     palier. Le test « restaurer 300 cartes → journal vide »
     (tests/journal.test.js) attrapera le refactor qui ferait
     passer un import par setTypeData.
   · un geste pendant le TUTORIEL est un vrai geste sur le vrai
     stockage — la clé est donc dans tutorialKeys() : l'instantané
     du tour l'emporte et la restaure avec le reste.

   PLAFOND : 2000 entrées, rotation FIFO (les plus anciennes
   jetées d'abord). Justifié par la mesure : une saison engagée ≈
   300-500 gestes ; 2000 couvre plusieurs saisons de corrections
   pour ~100 Ko bruts (2 % du quota localStorage).

   CLÉ : f1uno_journal_<saison> — famille de saison (SEASON_KEY_RE,
   effacement, tutoriel) et chiffrée au repos (DATA_KEY_RE) : elle
   raconte la collection aussi précisément que `owned`.

   FEUILLE DU GRAPHE, délibérément : la clé est un littéral (comme
   tutorial-snapshot.js) et la saison vient de season.js — importer
   storage.js ferait entrer ce module dans la composante de cycles.
   La cohérence des registres est tenue par key-registry.test.js.
   ══════════════════════════════════════════════════════════ */
import { log } from './logger.js';
import { _currentSeason } from './season.js';
import { secureGet, secureSet } from './secure-store.js';

export const JOURNAL_MAX = 2000;

const _key = () => `f1uno_journal_${_currentSeason}`;

function _todayKey(){
  // Date locale, pas UTC — le « jour » est celui de l'utilisateur
  // (même règle que history.js).
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function getJournal(){
  try {
    const s = secureGet(_key());
    const arr = s ? JSON.parse(s) : [];
    return Array.isArray(arr) ? arr : [];
  } catch(e){
    return [];
  }
}

// Appelé par setTypeData (storage.js) sur les seuls changements de
// QUANTITÉ — delta ≠ 0. Meilleur effort : ne casse jamais une écriture.
export function journalRecord(cardId, typeId, delta){
  if(!delta) return;
  try {
    const j = getJournal();
    j.push({ d: _todayKey(), c: cardId, t: typeId, q: delta });
    if(j.length > JOURNAL_MAX) j.splice(0, j.length - JOURNAL_MAX);
    secureSet(_key(), JSON.stringify(j));
    log('journal:', cardId, typeId, delta > 0 ? `+${delta}` : delta);
  } catch(e){
    log('journal record failed:', e);
  }
}

// Restauration depuis une sauvegarde (import fichier / cloud) : on
// REMPLACE — le journal suit sa collection, il ne se fusionne pas
// (fusionner deux histoires fabriquerait une chronologie qui n'a
// jamais eu lieu).
export function setJournal(entries){
  try {
    if(!Array.isArray(entries)) return;
    secureSet(_key(), JSON.stringify(entries.slice(-JOURNAL_MAX)));
  } catch(e){ /* meilleur effort */ }
}
