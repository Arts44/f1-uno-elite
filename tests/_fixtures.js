/* ══════════════════════════════════════════════════════════
   TEST FIXTURES — a small self-contained CARDS_DB + metadata,
   independent from the real data/ files. Injected via the
   test-only exports _applyMetadata/_applyBadges (data.js) and
   by mutating CARDS_DB in place (it is a const array).
   ══════════════════════════════════════════════════════════ */
import { CARDS_DB, _applyMetadata, _applyBadges } from '../data.js';

export const META = {
  cardTypes: {
    blue:          { id: 'blue',          label: 'Blue',          foil: false, icon: '🔵', css: 'tv-blue',  color: '#1a3a6b' },
    blue_foil:     { id: 'blue_foil',     label: 'Blue Foil',     foil: true,  icon: '✦',  css: 'tv-bf',    color: '#2d6abf' },
    blue_red_foil: { id: 'blue_red_foil', label: 'Dual Foil',     foil: true,  icon: '◈',  css: 'tv-brf',   color: '#4a2080' },
    wild_foil:     { id: 'wild_foil',     label: 'Wild Foil',     foil: true,  icon: '🃏', css: 'tv-wf',    color: '#0a0a0a' },
    nitro_foil:    { id: 'nitro_foil',    label: 'Nitro Foil',    foil: true,  icon: '❋',  css: 'tv-nf',    color: '#7b2fbe' },
    promo_blue:    { id: 'promo_blue',    label: 'Promo Blue',    foil: true,  icon: '★',  css: 'tv-pb',    color: '#1a3a6b' },
  },
  typeBadgeRarity: { blue: 'common', blue_foil: 'rare', blue_red_foil: 'epic', wild_foil: 'legendary', nitro_foil: 'mythic', promo_blue: 'ultra' },
  typeBadgeStyles: {
    common: { color: '#8E8E93', stars: 1 }, rare: { color: '#007AFF', stars: 2 },
    epic: { color: '#AF52DE', stars: 3 }, legendary: { color: '#FF9500', stars: 4 },
    mythic: { color: '#34C759', stars: 5 }, ultra: { color: '#FF2D55', stars: 6 },
  },
  rarityKeys: ['epic', 'legendary', 'mythic', 'ultra', 'cosmic', 'divine'],
  rarityOrder: { epic: 0, legendary: 1, mythic: 2, ultra: 3, cosmic: 4, divine: 5 },
  rarities: {
    epic:      { label: 'Épique',      color: '#C026D3', stars: 1 },
    legendary: { label: 'Légendaire',  color: '#FF7A00', stars: 2 },
    mythic:    { label: 'Mythique',    color: '#00C853', stars: 3 },
    ultra:     { label: 'Ultra rare',  color: '#FF1744', stars: 4 },
    cosmic:    { label: 'Cosmique',    color: '#7C4DFF', stars: 5 },
    divine:    { label: 'Divin',       color: '#FACC15', stars: 6 },
  },
  categories: {
    pilote: { label: 'Pilote', emoji: '🏎️' }, reserve: { label: 'Réserve', emoji: '🔧' },
    directeur: { label: 'Directeur', emoji: '🎯' }, gp: { label: 'Grand Prix', emoji: '🏁' },
  },
  driverNumbers: {}, teamColors: {}, teamLogos: {}, driverImages: {}, teamLogoBg: {},
  teamLogoNoeffects: [],
  roleBaseRarity: { pilote: 'legendary', reserve: 'epic', directeur: 'epic', gp: 'legendary' },
};

// P1 champion driver, P2 regular driver, R1 reserve, D1 team principal, G1 grand prix
export const CARDS = [
  { id: 'P1', season: 2025, name: 'Champ Driver',   category: 'pilote',    champion: true,  championYears: [2024], team: 'Team A', types: ['blue', 'blue_foil', 'nitro_foil'] },
  { id: 'P2', season: 2025, name: 'Regular Driver', category: 'pilote',    champion: false, championYears: [],     team: 'Team B', types: ['blue', 'blue_foil', 'blue_red_foil', 'wild_foil', 'promo_blue'] },
  { id: 'R1', season: 2025, name: 'Reserve Guy',    category: 'reserve',   champion: false, championYears: [],     team: 'Team A', types: ['blue', 'blue_foil', 'wild_foil'] },
  { id: 'D1', season: 2025, name: 'The Boss',       category: 'directeur', champion: false, championYears: [],     team: 'Team B', types: ['blue'] },
  { id: 'G1', season: 2025, name: 'Test GP',        category: 'gp',        champion: false, championYears: [],     team: '',       types: ['blue', 'nitro_foil'] },
];

const T = (owned = false, wishlist = false, doubles = false, favorite = false, qty = 0) =>
  ({ owned, wishlist, doubles, favorite, qty });

// A known collection over the fixture cards:
// - P1 owned (blue x2 doubles+favorite, nitro x1)   → owned, doubles, fav
// - P2 wishlist only                                 → wishlist, missing
// - R1 owned (blue_foil x1)                          → owned
// - D1 owned:true but qty 0 (edge case)              → owned (flag), 0 copies
// - G1 untouched                                     → missing
export const SAMPLE_COLL = {
  P1: { blue: T(true, false, true, true, 2), nitro_foil: T(true, false, false, false, 1) },
  P2: { blue: T(false, true) },
  R1: { blue_foil: T(true, false, false, false, 1) },
  D1: { blue: T(true, false, false, false, 0) },
};

export const AUTO_BADGES_FIXTURE = [
  { id: 'first_card', condition: { metric: 'owned_count',    operator: '>=',  value: 1 } },
  { id: 'collect_3',  condition: { metric: 'owned_count',    operator: '>=',  value: 3 } },
  { id: 'dream_1',    condition: { metric: 'wishlist_count', operator: '>=',  value: 1 } },
  { id: 'double_1',   condition: { metric: 'doubles_count',  operator: '>=',  value: 1 } },
  { id: 'fan_2',      condition: { metric: 'favorite_count', operator: '>=',  value: 2 } },
  { id: 'qty_3',      condition: { metric: 'total_qty',      operator: '>=',  value: 3 } },
  { id: 'all_pilots', condition: { metric: 'category_owned', operator: '==',  value: 'pilote', allOfCategory: true } },
  { id: 'all_champs', condition: { metric: 'champion_owned', operator: 'all', value: null } },
  { id: 'foil_2',     condition: { metric: 'type_owned',     operator: '>=',  value: 2, typeFilter: 'foil' } },
  { id: 'nitro_1',    condition: { metric: 'type_owned',     operator: '>=',  value: 1, typeFilter: 'nitro_foil' } },
  { id: 'weird',      condition: { metric: 'not_a_metric',   operator: '>=',  value: 1 } },
];

/** Install the fixture DB + metadata (call in beforeEach). */
export function installFixtures(){
  _applyMetadata(META);
  _applyBadges({ auto: AUTO_BADGES_FIXTURE, manual: [{ id: 'm1' }, { id: 'm2' }] });
  CARDS_DB.length = 0;
  CARDS.forEach(c => CARDS_DB.push(structuredClone(c)));
}

/** Persist a collection for season 2025 so loadData() picks it up. */
export function seedCollection(coll){
  localStorage.setItem('f1uno_version', '2');
  localStorage.setItem('f1uno_owned_2025', JSON.stringify(coll));
}
