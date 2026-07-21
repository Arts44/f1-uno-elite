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
export let TYPE_BADGE_STYLES = {};

// ── Rarity chip painting — single source of truth ──
// Two rarities opt out of the plain "solid background + computed text
// colour" treatment and are painted by CSS instead:
//   divine    → animated iridescent gradient (.rar-divine-bg)
//   legendary → white text on bright gold, made legible by a layered
//               dark text-shadow (.rar-legendary-bg). Deliberate
//               aesthetic choice: raw white-on-#EC9600 is only 2.35:1,
//               so the shadow — not the contrast ratio — carries the
//               legibility. Don't "fix" it by darkening the gold.
// Everything else gets rarityTextColor() below.
const RARITY_CSS_PAINTED = { divine: 'rar-divine-bg', legendary: 'rar-legendary-bg' };

// Extra class for a rarity chip ('' when the chip is painted inline).
export function rarityChipClass(rarityKey){
  const cls = RARITY_CSS_PAINTED[rarityKey];
  return cls ? ' ' + cls : '';
}

// Inline style for a rarity chip. Divine paints its own background;
// legendary keeps the solid gold but lets CSS own the text.
export function rarityChipStyle(rarityKey, hex){
  if(rarityKey === 'divine') return '';
  const bg = hex || 'var(--surface3)';
  if(rarityKey === 'legendary') return `background:${bg}`;
  return `background:${bg};color:${rarityTextColor(hex)}`;
}

// Readable text color for a solid chip of the given background color:
// white or near-black, whichever has the higher WCAG contrast.
// NOTE: legendary never goes through this — see RARITY_CSS_PAINTED.
export function rarityTextColor(hex){
  if(!/^#[0-9a-fA-F]{6}$/.test(hex||'')) return '#fff';
  const [r,g,b] = [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255)
    .map(c=>c<=0.03928 ? c/12.92 : ((c+0.055)/1.055)**2.4);
  const L = 0.2126*r + 0.7152*g + 0.0722*b;
  // contrast vs white: 1.05/(L+.05) — vs #141414 (L≈0.0091): (L+.05)/0.0591
  return (1.05/(L+0.05)) >= ((L+0.05)/0.0591) ? '#fff' : '#141414';
}
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

// Exported for the test suite (fixture injection) — not used by the UI.
export function _applyMetadata(meta){
  CARD_TYPES = meta.cardTypes;
  TYPE_BADGE_RARITY = meta.typeBadgeRarity;
  // Visual ladder of the sidebar type pills — independent from the card
  // rarity scale (which starts at 'epic' / 1★)
  TYPE_BADGE_STYLES = meta.typeBadgeStyles;
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

// Exported for the test suite (fixture injection) — not used by the UI.
export function _applyBadges(badgesData){
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
