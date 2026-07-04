/* ══════════════════════════════════════════════════════════
   STORAGE — localStorage persistence, collection state,
   card/rarity helpers, import/export.
   coll[cardId][typeId] = { owned, wishlist, doubles, favorite, qty }
   ══════════════════════════════════════════════════════════ */
import { log } from './logger.js';
import { t } from './i18n.js';
import {
  _currentSeason, setCurrentSeason,
  CARDS_DB, CARD_TYPES, RARITY_ORDER, RARITY_KEYS, ROLE_BASE_RARITY
} from './data.js';
import { updateStats } from './stats.js';
import { applyFilters, showToast } from './render.js';
import {
  manualBadges, autoBadgeUnlocked,
  setManualBadges, setAutoBadgeUnlocked, saveManualBadges
} from './badges.js';

/* ── Versioning & season-scoped keys ── */
const STORAGE_VERSION = 2;

export function _storageKey(name){
  return (name==='theme'||name==='title'||name==='version')
    ? `f1uno_${name}`
    : `f1uno_${name}_${_currentSeason}`;
}

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
  localStorage.setItem('f1uno_version', String(STORAGE_VERSION));
}

/* ── Collection state ── */
export let coll = {};

export function loadData(){
  _migrateStorage();
  try{
    const s=localStorage.getItem(_storageKey('owned'));
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
    if(loginThemeIcon) loginThemeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
  }
}
export function saveData(){ localStorage.setItem(_storageKey('owned'), JSON.stringify(coll)); }

export function getTypeData(cardId, typeId){
  return (coll[cardId]&&coll[cardId][typeId]) || {owned:false,wishlist:false,doubles:false,favorite:false,qty:0};
}
export function setTypeData(cardId, typeId, key, value){
  if(!coll[cardId]) coll[cardId]={};
  if(!coll[cardId][typeId]) coll[cardId][typeId]={owned:false,wishlist:false,doubles:false,favorite:false,qty:0};
  coll[cardId][typeId][key]=value;
  saveData(); updateStats();
}

// Card-level
export function cardOwned(id){ const card=CARDS_DB.find(c=>c.id===id); return card.types.some(t=>getTypeData(id,t).owned); }
export function cardWishlist(id){ const card=CARDS_DB.find(c=>c.id===id); return !cardOwned(id) && card.types.some(t=>getTypeData(id,t).wishlist); }
export function cardDoubles(id){ const card=CARDS_DB.find(c=>c.id===id); return card.types.some(t=>getTypeData(id,t).doubles); }
export function cardFavorite(id){ const card=CARDS_DB.find(c=>c.id===id); return card.types.some(t=>getTypeData(id,t).favorite); }
export function cardMissing(id){ return !cardOwned(id); }
export function cardTotalQty(id){ const card=CARDS_DB.find(c=>c.id===id); return card.types.reduce((s,t)=>s+(getTypeData(id,t).qty||0),0); }

export function baseCardRarity(card){
  if(card.champion) return 'mythic';
  return ROLE_BASE_RARITY[card.category] || 'rare';
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
    idx = Math.min(baseIdx+bonus, RARITY_KEYS.length-1);
  }
  return RARITY_KEYS[idx];
}

// Rareté de la carte
// - si tu n'as aucun exemplaire possédé : rareté de base (rôle / champion)
// - sinon : meilleure rareté parmi les types possédés
export function cardRarity(card){
  const ownedTypes = card.types.filter(t=>getTypeData(card.id,t).owned && (getTypeData(card.id,t).qty||0)>0);
  if(ownedTypes.length===0) return baseCardRarity(card);
  return ownedTypes.reduce((best,t)=>{
    const r = variantRarity(card,t);
    return RARITY_ORDER[r] > RARITY_ORDER[best] ? r : best;
  }, baseCardRarity(card));
}

/* ══════════════════════════════════════════════════════════ EXPORT */
export function exportCollection(){
  const data = {
    season: _currentSeason,
    exportDate: new Date().toISOString(),
    owned: coll,
    manualBadges: manualBadges,
    autoBadges: autoBadgeUnlocked
  };
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
  showToast(t('toast.exported'));
}

/* ══════════════════════════════════════════════════════════ IMPORT JSON */
export function triggerImport(){
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
      showToast('❌ Fichier invalide ou corrompu');
    }
  };
  reader.readAsText(file);
}

function _showImportDialog(data){
  const overlay = document.createElement('div');
  overlay.className='import-dialog-overlay';
  overlay.innerHTML=`
    <div class="import-dialog">
      <div class="import-dialog-title">${t('imp.title')}</div>
      <div class="import-dialog-sub">${t('imp.sub',{season:data.season||'?',date:data.exportDate?new Date(data.exportDate).toLocaleDateString():'?'})}<br>${t('imp.q')}</div>
      <div class="import-dialog-btns">
        <button class="import-dialog-btn" id="importMergeBtn">${t('imp.merge')}</button>
        <button class="import-dialog-btn primary" id="importReplaceBtn">${t('imp.replace')}</button>
      </div>
      <button class="import-dialog-btn" id="importCancelBtn" style="margin-top:4px">${t('imp.cancel')}</button>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#importCancelBtn').addEventListener('click',()=>overlay.remove());
  overlay.querySelector('#importReplaceBtn').addEventListener('click',()=>{
    _applyImport(data,'replace'); overlay.remove();
  });
  overlay.querySelector('#importMergeBtn').addEventListener('click',()=>{
    _applyImport(data,'merge'); overlay.remove();
  });
}

function _applyImport(data, mode){
  if(data.season) setCurrentSeason(data.season);
  if(mode==='replace'){
    coll = data.owned || {};
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
  applyFilters();
  updateStats();
  showToast(mode==='replace'?t('imp.ok_replace'):t('imp.ok_merge'));
}
