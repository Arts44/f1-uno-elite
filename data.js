/* ══════════════════════════════════════════════════════════
   DATA — static DB (metadata, cards, circuits, badge defs)
   loaded from JSON files at runtime, with embedded fallback.
   ══════════════════════════════════════════════════════════ */
import { log } from './logger.js';
import { loadData } from './storage.js';
import { loadManualBadges } from './badges.js';
import { renderSidebar, applyFilters } from './render.js';
import { updateStats } from './stats.js';

// Current season — reassigned via setCurrentSeason() from other modules
export let _currentSeason = 2025;
export function setCurrentSeason(season){ _currentSeason = season; }

// Metadata-derived tables (populated by _applyMetadata)
export let CARD_TYPES = {};
export let TYPE_BADGE_RARITY = {};
export let RARITY_KEYS = [];
export let RARITY_ORDER = {};
export let RARITIES = {};
export let CATS = {};
export let CIRCUIT_SVGS = {};
export let DRIVER_NUMBERS = {};
export let TEAM_COLORS = {};
export let TEAM_LOGOS = {};
export let DRIVER_IMAGES = {};
export let TEAM_LOGO_BG = {};
export let TEAM_LOGO_NOEFFECTS = new Set([
  'Visa Cash App RB Formula One',
  'Oracle Red Bull Racing'
]);
export let ROLE_BASE_RARITY = {};

// Card database (mutated in place, never reassigned)
export const CARDS_DB = [];

// Badge definitions — loaded from badges.json
export let AUTO_BADGES = [];
export let MANUAL_BADGES = [];

function _showDataError(msg){
  console.error(msg);
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:99999;background:#cc0000;color:#fff;padding:12px 24px;border-radius:10px;font:bold 14px system-ui,sans-serif;box-shadow:0 4px 24px rgba(0,0,0,.4);max-width:90vw;text-align:center;';
  el.textContent = '⚠️ ' + msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 8000);
}

function _applyMetadata(meta){
  CARD_TYPES = meta.cardTypes;
  TYPE_BADGE_RARITY = meta.typeBadgeRarity;
  RARITY_KEYS = meta.rarityKeys;
  RARITY_ORDER = meta.rarityOrder;
  RARITIES = meta.rarities;
  CATS = meta.categories;
  DRIVER_NUMBERS = meta.driverNumbers;
  TEAM_COLORS = meta.teamColors;
  TEAM_LOGOS = meta.teamLogos;
  DRIVER_IMAGES = meta.driverImages;
  TEAM_LOGO_BG = meta.teamLogoBg;
  // Merge hardcoded noeffects with metadata noeffects
    const hardcodedNoEffects = ['Visa Cash App RB Formula One', 'Oracle Red Bull Racing'];
    const allNoEffects = new Set([...(meta.teamLogoNoeffects || []), ...hardcodedNoEffects]);
    TEAM_LOGO_NOEFFECTS = allNoEffects;
  ROLE_BASE_RARITY = meta.roleBaseRarity;
}

function _applyCircuits(circData){
  CIRCUIT_SVGS = {};
  for(const [id, v] of Object.entries(circData)){
    CIRCUIT_SVGS[id] = { p: v.path, d: v.drs || [] };
  }
}

function _applyBadges(badgesData){
  AUTO_BADGES = badgesData.auto;
  MANUAL_BADGES = badgesData.manual;
}

function _applyCards(cardsData){
  CARDS_DB.length = 0;
  cardsData.forEach(c => CARDS_DB.push(c));
}

function _loadEmbedded(){
  const e = window.__F1UNO_EMBEDDED;
  if(!e) return false;
  if(e.metadata) _applyMetadata(e.metadata);
  if(e.circuits) _applyCircuits(e.circuits);
  if(e.badges) _applyBadges(e.badges);
  const cardsKey = 'cards' + _currentSeason;
  if(e[cardsKey]) _applyCards(e[cardsKey]);
  return CARDS_DB.length > 0;
}

export async function loadAppData(){
  try {
    const [metaResp, circResp, badgesResp, cardsResp] = await Promise.all([
      fetch('data/metadata.json').catch(()=>null),
      fetch('data/circuits.json').catch(()=>null),
      fetch('data/badges.json').catch(()=>null),
      fetch(`data/cards-${_currentSeason}.json`).catch(()=>null),
    ]);

    if(metaResp && metaResp.ok){
      _applyMetadata(await metaResp.json());
    }
    if(circResp && circResp.ok){
      _applyCircuits(await circResp.json());
    }
    if(badgesResp && badgesResp.ok){
      _applyBadges(await badgesResp.json());
    }
    if(cardsResp && cardsResp.ok){
      _applyCards(await cardsResp.json());
    }

    if(!CARDS_DB.length){
      // Try embedded data as fallback (works on file://)
      if(_loadEmbedded()){
        log(`Données embarquées utilisées: ${CARDS_DB.length} cartes`);
      } else {
        console.error('Erreur critique: aucune carte chargée');
        _showDataError('Impossible de charger les données.');
      }
    } else {
      log(`Données chargées: ${CARDS_DB.length} cartes, saison ${_currentSeason}`);
    }
  } catch(e){
    console.error('Erreur chargement JSON:', e);
    if(!_loadEmbedded()){
      _showDataError('Erreur critique: impossible de charger les données JSON.');
    }
  }
}

export function switchSeason(season){
  if(season === _currentSeason) return;
  _currentSeason = season;
  loadAppData().then(() => {
    loadData();
    loadManualBadges();
    renderSidebar();
    applyFilters();
    updateStats();
    _renderSeasonPills();
  });
}

export function _renderSeasonPills(){
  const container = document.getElementById('seasonPills');
  if(!container) return;
  container.innerHTML = '';
  // Detect available seasons from localStorage + current
  const seasons = new Set([2025]);
  for(let i = 0; i < localStorage.length; i++){
    const key = localStorage.key(i);
    const m = key.match(/^f1uno_owned_(\d+)$/);
    if(m) seasons.add(parseInt(m[1], 10));
  }
  // Check for available card JSON files (we know 2025 exists)
  [...seasons].sort((a,b) => b - a).forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'season-pill' + (s === _currentSeason ? ' active' : '');
    btn.textContent = s;
    btn.dataset.action = 'switchSeason';
    btn.dataset.season = s;
    btn.onclick = () => switchSeason(s);
    container.appendChild(btn);
  });
}
