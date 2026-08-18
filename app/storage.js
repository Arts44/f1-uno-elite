/* ══════════════════════════════════════════════════════════
   STORAGE — localStorage persistence, collection state,
   card/rarity helpers, import/export.
   coll[cardId][typeId] = { owned, wishlist, doubles, favorite, qty }
   ══════════════════════════════════════════════════════════ */
import { log } from './logger.js';
import { deniedForViewer } from './session.js';
import { t, tEsc, setSafeHTML } from './i18n.js';
import {
  _currentSeason, switchSeason,
  CARDS_DB, CARD_TYPES, RARITY_ORDER, RARITY_KEYS, ROLE_BASE_RARITY,
  sortTypesCanonical
} from './data.js';
import { updateStats } from './stats.js';
import { journalRecord, setJournal, getJournal } from './journal.js';
import { renderCollection, showToast } from './render.js';
/* Le store, PAS la vue : storage.js n'a besoin que de l'état persistant
   des badges pour la sauvegarde et sa restauration. Passer par
   badges.js le ferait dépendre d'un module qui dépend de lui. */
import {
  manualBadges, autoBadgeUnlocked,
  setManualBadges, setAutoBadgeUnlocked, saveManualBadges
} from './badges-store.js';
import { noteChange, markBackupDone } from './backup.js';
import { recordHistoryPoint } from './history.js';
import { gatherSettings, applySettings, backupIncludes } from './settings-sync.js';
import { secureGet, secureSet } from './secure-store.js';
import { icon } from './icons.js';
import { _storageKey } from './storage-keys.js';

/* ── Versioning & season-scoped keys ── */
const STORAGE_VERSION = 3;

/* Seuls le thème et le numéro de version sont des réglages d'APPAREIL :
   ils valent pour toutes les saisons. Tout le reste — collection,
   badges, historique, TITRE — appartient à une saison et porte son
   année. Le titre a été rescoppé en v3 (voir _migrateStorage) : il se
   gagne avec les badges d'une saison, il ne se porte donc pas dans une
   autre. */
/* _storageKey vit désormais dans storage-keys.js — voir l'en-tête de ce
   fichier pour la raison (l'arête storage → badges). Il est RÉ-EXPORTÉ
   ici pour que le déplacement ne casse aucun appelant : c'est un pas de
   refactor, pas un changement d'API. */
export { _storageKey };

function _migrateStorage(){
  const ver = parseInt(localStorage.getItem('f1uno_version')||'0', 10);
  if(ver >= STORAGE_VERSION) return;
  if(ver < 2){
    const old = localStorage.getItem('f1uno_v3');
    if(old && !localStorage.getItem('f1uno_owned_2025'))
      localStorage.setItem('f1uno_owned_2025', old);
    const ob = localStorage.getItem('f1uno_badges');
    if(ob && !localStorage.getItem('f1uno_badges_2025'))
      localStorage.setItem('f1uno_badges_2025', ob);
    const oa = localStorage.getItem('f1uno_auto_badges');
    if(oa && !localStorage.getItem('f1uno_auto_badges_2025'))
      localStorage.setItem('f1uno_auto_badges_2025', oa);
  }
  if(ver < 3){
    // v3 : f1uno_title devient f1uno_title_<année>. La seule saison
    // ayant existé jusqu'ici est 2025 : le titre porté aujourd'hui lui
    // appartient. On le déplace — sans écraser une valeur déjà scoppée.
    const ot = localStorage.getItem('f1uno_title');
    if(ot !== null){
      if(!localStorage.getItem('f1uno_title_2025'))
        localStorage.setItem('f1uno_title_2025', ot);
      localStorage.removeItem('f1uno_title');
    }
  }
  localStorage.setItem('f1uno_version', String(STORAGE_VERSION));
}

/* ── Collection state ── */
export let coll = {};

/* Nettoyage 1.44.0 : le tri de grille a été retiré. Sa préférence
   traînerait indéfiniment dans le localStorage des utilisateurs qui
   l'avaient réglée — on la balaie une fois. */
try { localStorage.removeItem('f1uno_sort'); } catch(e){ /* stockage indisponible */ }

export function loadData(){
  _migrateStorage();
  try{
    const s=secureGet(_storageKey('owned'));
    log('localStorage key:', _storageKey('owned'));
    log('localStorage value:', s);
    if(s) {
      coll=JSON.parse(s);
      log('Données chargées:', Object.keys(coll).length, 'cartes');
    } else {
      log('Aucune donnée trouvée dans localStorage');
      coll={};
    }
  }catch(e){
    console.error('Erreur chargement données:', e);
    coll={};
  }

  // Charger le thème sauvegardé
  const savedTheme = localStorage.getItem('f1uno_theme');
  if(savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    const loginThemeIcon = document.getElementById('loginThemeIcon');
    if(loginThemeIcon) loginThemeIcon.innerHTML = icon(savedTheme === 'dark' ? 'sun' : 'moon');
  }
}
export function saveData(){
  secureSet(_storageKey('owned'), JSON.stringify(coll));
  noteChange();         // backup reminder bookkeeping (backup.js)
  recordHistoryPoint(); // daily progression snapshot (history.js)
}

export function getTypeData(cardId, typeId){
  return (coll[cardId]&&coll[cardId][typeId]) || {owned:false,wishlist:false,doubles:false,favorite:false,qty:0};
}

/* Écritures groupées (1.33.0) : un geste utilisateur (+1, toggle…)
   écrit 3-4 champs — chaque setTypeData déclenchait saveData
   (stringify complet + chiffrement éventuel) ET updateStats
   (évaluation des 50 badges) : jusqu'à 5 passes complètes par tap,
   le vrai lag de l'ajout rapide. txBatch fusionne : UNE sauvegarde
   à la fin, et updateStats reste à la charge de l'appelant (les
   gestes interactifs l'appellent déjà). Hors batch, setTypeData
   garde exactement son comportement historique. */
let _txDepth = 0;
export function txBatch(fn){
  _txDepth++;
  try { fn(); }
  finally {
    _txDepth--;
    if(_txDepth === 0) saveData();
  }
}
export function setTypeData(cardId, typeId, key, value){
  if(!coll[cardId]) coll[cardId]={};
  if(!coll[cardId][typeId]) coll[cardId][typeId]={owned:false,wishlist:false,doubles:false,favorite:false,qty:0};
  // LE JOURNAL (1.68.0) : chaque changement de QUANTITÉ est consigné —
  // et setTypeData n'est atteint QUE par des gestes (quickToggle,
  // changeMoQty, quickAddVariant, undoQuickAdd) : les imports
  // remplacent `coll` directement (_applyImport), le tutoriel restaure
  // localStorage brut. Pas de drapeau de suspension : le point
  // d'accroche fait le garde — tenu par tests/journal.test.js
  // (« restaurer 300 cartes → journal vide »).
  if(key==='qty') journalRecord(cardId, typeId, (value||0) - (coll[cardId][typeId].qty||0));
  coll[cardId][typeId][key]=value;
  if(_txDepth === 0){ saveData(); updateStats(); }
}

/* ── REGISTRE : tout ce qui appartient à UNE saison ────────────
   Surensemble de DATA_KEY_RE (secure-store.js) : les quatre familles
   chiffrables, plus le titre porté et le badge épinglé, qui se
   gagnent avec les badges d'une saison donnée. C'est la liste de
   référence pour l'effacement des données locales et pour l'instantané
   du tutoriel (tutorial.js : tutorialKeys). */
export const SEASON_KEY_RE = /^f1uno_(owned|badges|auto_badges|history|journal|title|pinned_badge)_\d+$/;

// ── Suppression des données locales de collection (zone danger) ──
// Efface les clés de saison de TOUTES les saisons (possédées, badges,
// badges auto, historique, titre porté, badge épinglé) + les compteurs
// de rappel de sauvegarde. Les préférences (thème, langue, police) et
// le PIN sont volontairement conservés. Recharge l'état mémoire ensuite.
/* `season` : un millésime pour n'effacer QUE cette saison, ou null/absent
   pour toutes. Le multi-saisons rend la distinction nécessaire — sans
   elle, nettoyer un essai 2026 emportait la collection 2025.

   Ce qui est ÉPARGNÉ dans les deux cas : thème, langue, police, PIN,
   mode spectateur, session cloud, version de stockage. C'est le `_\d+$`
   de SEASON_KEY_RE qui fait le tri — une clé partagée n'a pas d'année,
   donc elle n'entre jamais dans la sélection.
   Ce qui est épargné UNIQUEMENT en portée « une saison » : les deux
   compteurs de rappel de sauvegarde, qui sont GLOBAUX. Les effacer en
   nettoyant une saison ferait mentir le rappel sur les autres. */
export function deleteLocalCollectionData(season = null){
  if(deniedForViewer()) return 0;   // lecture seule : refus même en appel direct
  const kill = [];
  for(let i = 0; i < localStorage.length; i++){
    const k = localStorage.key(i);
    if(!SEASON_KEY_RE.test(k)) continue;
    if(season !== null && k.match(/_(\d+)$/)[1] !== String(season)) continue;
    kill.push(k);
  }
  kill.forEach(k => localStorage.removeItem(k));
  if(season === null){
    localStorage.removeItem('f1uno_changes_since_backup');
    localStorage.removeItem('f1uno_last_backup');
  }
  loadData();
  return kill.length;
}

// ── Ajout rapide depuis la grille (bouton +) ──
// Ajoute 1 exemplaire de la variante choisie ; retourne l'état
// précédent du type pour permettre une annulation exacte (toast).
export function quickAddVariant(cardId, typeId){
  const prev = { ...getTypeData(cardId, typeId) };
  const newQty = (prev.qty||0)+1;
  txBatch(() => {
    setTypeData(cardId, typeId, 'qty', newQty);
    setTypeData(cardId, typeId, 'owned', true);
    setTypeData(cardId, typeId, 'doubles', newQty>1);
    setTypeData(cardId, typeId, 'wishlist', false);
  });
  return prev;
}
export function undoQuickAdd(cardId, typeId, prev){
  txBatch(() => {
    setTypeData(cardId, typeId, 'qty', prev.qty||0);
    setTypeData(cardId, typeId, 'owned', !!prev.owned);
    setTypeData(cardId, typeId, 'doubles', !!prev.doubles);
    setTypeData(cardId, typeId, 'wishlist', !!prev.wishlist);
  });
}

// Card-level
export function cardOwned(id){ const card=CARDS_DB.find(c=>c.id===id); return card.types.some(t=>getTypeData(id,t).owned); }
export function cardWishlist(id){ const card=CARDS_DB.find(c=>c.id===id); return !cardOwned(id) && card.types.some(t=>getTypeData(id,t).wishlist); }
export function cardDoubles(id){ const card=CARDS_DB.find(c=>c.id===id); return card.types.some(t=>getTypeData(id,t).doubles); }
export function cardFavorite(id){ const card=CARDS_DB.find(c=>c.id===id); return card.types.some(t=>getTypeData(id,t).favorite); }
export function cardMissing(id){ return !cardOwned(id); }
export function cardTotalQty(id){ const card=CARDS_DB.find(c=>c.id===id); return card.types.reduce((s,t)=>s+(getTypeData(id,t).qty||0),0); }
// Set complet : au moins un exemplaire de CHAQUE type de la carte
export function cardSetComplete(id){ const card=CARDS_DB.find(c=>c.id===id); return card.types.every(t=>{ const d=getTypeData(id,t); return d.owned && (d.qty||0)>0; }); }

export function baseCardRarity(card){
  if(card.champion) return 'mythic';
  // 'epic' is the lowest rung of the card rarity scale (rarityKeys)
  return ROLE_BASE_RARITY[card.category] || 'epic';
}

export function variantRarity(card,typeId){
  const base = baseCardRarity(card);
  const baseIdx = RARITY_ORDER[base] ?? 0;
  let idx = baseIdx;
  const t = CARD_TYPES[typeId];
  if(t && t.foil){
    // hiérarchie des foils : simple < dual < wild/promo/nitro
    let bonus = 1;
    if(typeId==='blue_red_foil' || typeId==='green_yellow_foil') bonus = 2;
    if(typeId==='nitro_foil' || typeId==='wild_foil' || typeId==='promo_blue' || typeId==='promo_green' || typeId==='promo_red' || typeId==='promo_yellow') bonus = 3;
    // Les foils clampent à divine : le 7e niveau (eternal) n'est
    // atteignable QUE par le bonus set complet dans cardRarity().
    idx = Math.min(baseIdx+bonus, RARITY_ORDER.divine ?? RARITY_KEYS.length-1);
  }
  return RARITY_KEYS[idx];
}

// Rareté de la carte
// - si tu n'as aucun exemplaire possédé : rareté de base (rôle / champion)
// - sinon : meilleure rareté parmi les types possédés
export function cardRarity(card){
  const ownedTypes = card.types.filter(t=>getTypeData(card.id,t).owned && (getTypeData(card.id,t).qty||0)>0);
  if(ownedTypes.length===0) return baseCardRarity(card);
  const best = ownedTypes.reduce((acc,t)=>{
    const r = variantRarity(card,t);
    return RARITY_ORDER[r] > RARITY_ORDER[acc] ? r : acc;
  }, baseCardRarity(card));
  // Set complet (≥1 exemplaire de CHAQUE type) : rareté effective +1,
  // clampée au sommet. Dynamique : recalculée à chaque rendu, donc elle
  // rétrograde d'elle-même si un exemplaire repasse à 0.
  if(cardSetComplete(card.id)){
    return RARITY_KEYS[Math.min(RARITY_ORDER[best]+1, RARITY_KEYS.length-1)];
  }
  return best;
}

/* ── LE CRAN SUIVANT (1.65.0) — ce qui ferait monter la carte d'un
   palier. C'est l'INVERSION de variantRarity : au lieu de « que vaut ce
   que je possède », « qu'est-ce qui vaudrait plus ».

   Quatre issues, dans l'ordre où on les teste :
   · top     — la carte est à l'éternel : dernier palier, rien à promettre.
   · types   — des types manquants dont variantRarity dépasse le palier
               actuel existent : les acquérir fait monter.
   · set     — aucun type seul ne suffit, mais le set est incomplet :
               le compléter fait +1 (cardRarity), et c'est mécaniquement
               le palier suivant — les types manquants valent ≤ actuel.
   · ceiling — set complet et rien au-dessus : le plafond STRUCTUREL de
               cette carte (un GP 4 couleurs plafonne à mythique). C'est
               le cas que personne ne teste — il est testé en premier.

   Pure (aucun DOM) : le rendu vit dans render.js, les phrases en i18n. */
export function nextTierInfo(card){
  const cur = cardRarity(card);
  const curIdx = RARITY_ORDER[cur] ?? 0;
  if(curIdx >= RARITY_KEYS.length - 1) return { cur, kind: 'top' };
  const has = t => { const d = getTypeData(card.id, t); return d.owned && (d.qty||0) > 0; };
  const raising = card.types.filter(t => !has(t) && (RARITY_ORDER[variantRarity(card, t)] ?? 0) > curIdx);
  if(raising.length) return { cur, kind: 'types', next: RARITY_KEYS[curIdx+1], types: sortTypesCanonical(raising) };
  if(!cardSetComplete(card.id)) return { cur, kind: 'set', next: RARITY_KEYS[curIdx+1], missing: sortTypesCanonical(card.types.filter(t => !has(t))) };
  return { cur, kind: 'ceiling' };
}

/* ══════════════════════════════════════════════════════════ EXPORT */
// Single source of truth for the export/backup payload —
// used by the JSON file export, the backup code/QR (backup.js) and
// the cloud push (cloud.js).
// `include` optionally adds a `settings` section ({prefs, security} —
// see settings-sync.js). Without it (or when nothing is gathered) the
// snapshot is byte-for-byte the historical shape: old readers ignore
// the extra field, old backups without it import unchanged.
export function collectionSnapshot(include){
  const snap = {
    season: _currentSeason,
    exportDate: new Date().toISOString(),
    owned: coll,
    manualBadges: manualBadges,
    autoBadges: autoBadgeUnlocked
  };
  if(include){
    const settings = gatherSettings(include);
    if(settings) snap.settings = settings;
    /* LE JOURNAL N'ENTRE QUE SUR DEMANDE (include.journal) : export
       FICHIER et push CLOUD le portent ; le code texte et le QR de
       sauvegarde ne le portent JAMAIS. Ce n'est pas un oubli à
       « compléter » : MESURÉ (chiffrage 1.68.0), le journal compressé
       pèse +1757 caractères à 200 entrées et +3777 à 500 — contre un
       MAX_CODE_CHARS de 4000 (backup.js). L'inclure tuerait le code et
       le QR dès ~500 entrées. Si un jour il doit y entrer, il faudra
       une autre enveloppe, pas ce champ. */
    if(include.journal){
      const j = getJournal();
      if(j.length) snap.journal = j;
    }
  }
  return snap;
}

export function exportCollection(){
  if(deniedForViewer()) return ;   // lecture seule : refus même en appel direct
  const data = collectionSnapshot({ ...backupIncludes(), journal: true });
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `f1uno-collection-${_currentSeason}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  markBackupDone(); // resets the backup reminder (backup.js)
  showToast(t('toast.exported'));
}

/* ══════════════════════════════════════════════════════════ IMPORT JSON */
export function triggerImport(){
  if(deniedForViewer()) return ;   // lecture seule : refus même en appel direct
  const inp = document.getElementById('importFileInput');
  if(inp){ inp.value=''; inp.click(); }
}

export function _handleImportFile(file){
  if(!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if(!data.owned) throw new Error('Format invalide');
      _showImportDialog(data);
    } catch {
      showToast(t('imp.invalid'));
    }
  };
  reader.readAsText(file);
}

export function _showImportDialog(data){
  if(deniedForViewer()) return ;   // lecture seule : refus même en appel direct
  const overlay = document.createElement('div');
  overlay.className='import-dialog-overlay';
  // Optional settings restore: only when the backup carries them.
  // Prefs default CHECKED, security default UNCHECKED — device settings
  // are never overwritten silently, and restoring a PIN needs an
  // explicit opt-in next to a plain warning.
  const hasPrefs = !!(data.settings && data.settings.prefs);
  const hasSec = !!(data.settings && data.settings.security);
  const settingsRows = (hasPrefs || hasSec) ? `
      <div class="import-dialog-settings">
        ${hasPrefs ? `
        <label class="import-set-row"><input type="checkbox" id="impSetPrefs" checked> <span>${t('imp.set_prefs')}</span></label>` : ''}
        ${hasSec ? `
        <label class="import-set-row"><input type="checkbox" id="impSetSec"> <span>${t('imp.set_sec')}</span></label>
        <div class="import-sec-warn" id="impSecWarn" style="display:none;">${t('imp.sec_warn')}</div>` : ''}
      </div>` : '';
  setSafeHTML(overlay, `
    <div class="import-dialog">
      <div class="import-dialog-title">${t('imp.title')}</div>
      <div class="import-dialog-sub">${tEsc('imp.sub',{season:data.season||'?',date:data.exportDate?new Date(data.exportDate).toLocaleDateString():'?'})}<br>${t('imp.q')}</div>
      ${settingsRows}
      <div class="import-dialog-btns">
        <button class="import-dialog-btn" id="importMergeBtn">${t('imp.merge')}</button>
        <button class="import-dialog-btn primary" id="importReplaceBtn">${t('imp.replace')}</button>
      </div>
      <button class="import-dialog-btn" id="importCancelBtn" style="margin-top:4px">${t('imp.cancel')}</button>
    </div>`);
  document.body.appendChild(overlay);
  const secBox = overlay.querySelector('#impSetSec');
  if(secBox){
    secBox.addEventListener('change', () => {
      const warn = overlay.querySelector('#impSecWarn');
      if(warn) warn.style.display = secBox.checked ? '' : 'none';
    });
  }
  const _choices = () => ({
    prefs: !!overlay.querySelector('#impSetPrefs')?.checked,
    security: !!secBox?.checked,
  });
  const _finish = async mode => {
    await _applyImport(data, mode);
    if(data.settings) applySettings(data.settings, _choices());
    overlay.remove();
  };
  overlay.querySelector('#importCancelBtn').addEventListener('click',()=>overlay.remove());
  overlay.querySelector('#importReplaceBtn').addEventListener('click',()=>_finish('replace'));
  overlay.querySelector('#importMergeBtn').addEventListener('click',()=>_finish('merge'));
}

export async function _applyImport(data, mode){
  // Une sauvegarde d'une AUTRE saison doit passer par switchSeason() :
  // setCurrentSeason() seul ne déplaçait que la variable, laissant en
  // mémoire le catalogue et la collection de la saison précédente. La
  // fusion se faisait alors sur les données de l'ancienne saison, puis
  // saveData() les réécrivait sous la clé de la nouvelle — écrasant la
  // collection réellement stockée pour celle-ci.
  if(data.season && data.season !== _currentSeason){
    await switchSeason(data.season);
  }
  if(mode==='replace'){
    coll = data.owned || {};
    // Le journal SUIT sa collection : restauré sur « remplacer »
    // uniquement. En fusion, le journal local continue — mêler deux
    // chronologies fabriquerait une histoire qui n'a pas eu lieu.
    if(Array.isArray(data.journal)) setJournal(data.journal);
    if(data.manualBadges) setManualBadges(data.manualBadges);
    if(data.autoBadges) setAutoBadgeUnlocked(data.autoBadges);
  } else {
    // merge: union — owned wins
    const incoming = data.owned || {};
    for(const cardId of Object.keys(incoming)){
      if(!coll[cardId]) coll[cardId]={};
      for(const typeId of Object.keys(incoming[cardId])){
        const inc = incoming[cardId][typeId];
        const cur = coll[cardId][typeId]||{owned:false,wishlist:false,doubles:false,favorite:false,qty:0};
        coll[cardId][typeId]={
          owned: inc.owned || cur.owned,
          wishlist: inc.wishlist || cur.wishlist,
          doubles: inc.doubles || cur.doubles,
          favorite: inc.favorite || cur.favorite,
          qty: Math.max(inc.qty||0, cur.qty||0)
        };
      }
    }
    if(data.manualBadges) Object.assign(manualBadges, data.manualBadges);
    if(data.autoBadges) Object.assign(autoBadgeUnlocked, data.autoBadges);
  }
  saveData();
  saveManualBadges();
  renderCollection();
  updateStats();
  showToast(mode==='replace'?t('imp.ok_replace'):t('imp.ok_merge'));
}
