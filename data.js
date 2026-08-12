/* ══════════════════════════════════════════════════════════
   DATA — static DB (metadata, cards, circuits, badge defs)
   loaded from JSON files at runtime, with embedded fallback.
   ══════════════════════════════════════════════════════════ */
import { log } from './logger.js';
import { loadData } from './storage.js';
import { loadManualBadges } from './badges.js';
import { renderCollection } from './render.js';
import { updateStats } from './stats.js';

// Current season — reassigned via setCurrentSeason() from other modules
export let _currentSeason = 2025;
export function setCurrentSeason(season){ _currentSeason = season; }

let SEASONS = [];

// Metadata-derived tables (populated by _applyMetadata)
export let CARD_TYPES = {};
export let TYPE_BADGE_RARITY = {};
export let TYPE_BADGE_STYLES = {};

// ── Rarity chip painting — single source of truth ──
// Divine and eternal opt out of the plain "solid background + white
// text" treatment: they are painted by CSS as animated gradients
// (.rar-divine-bg / .rar-eternal-bg). Every other rarity is painted
// inline here.
const RARITY_CSS_PAINTED = { divine: 'rar-divine-bg', eternal: 'rar-eternal-bg' };

// Extra class for a rarity chip ('' when the chip is painted inline).
export function rarityChipClass(rarityKey){
  const cls = RARITY_CSS_PAINTED[rarityKey];
  return cls ? ' ' + cls : '';
}

// Inline style for a rarity chip. Divine and eternal paint themselves,
// everything else is a solid rarity colour with white text.
export function rarityChipStyle(rarityKey, hex){
  if(rarityKey === 'divine' || rarityKey === 'eternal') return '';
  return `background:${hex || 'var(--surface3)'};color:${rarityTextColor(hex)}`;
}

// ── Rarity chip text colour: ALWAYS WHITE ──
// DELIBERATE DESIGN DECISION, 2026-07-21, taken by the maintainer with
// the accessibility trade-off spelled out and accepted: visual
// uniformity across the whole rarity ladder outranks per-chip WCAG AA
// here. Two rarities knowingly fall below the 4.5:1 AA threshold for
// small text with white on them:
//     legendary #EC9600 → ~2.35:1
//     mythic    #00A86B → ~3.08:1
// No text-shadow, no per-rarity dark text, no automatic contrast
// switching — those were tried and explicitly rejected. If you are
// "fixing" this because a linter or an audit flagged it, don't: reopen
// the decision with the maintainer first. The tests in
// tests/stats.test.js lock this behaviour in place on purpose.
export function rarityTextColor(_hex){
  return '#fff';
}
export let RARITY_KEYS = [];
export let RARITY_ORDER = {};
export let RARITIES = {};
export let CATS = {};
export let CIRCUIT_SVGS = {};
export let DRIVER_NUMBERS = {};
export let TEAM_COLORS = {};
// Monogrammes d'écurie (v2.3) — remplacent les logos officiels qui
// étaient hotlinkés depuis formula1.com : marques déposées, dépendance
// externe, et hors-ligne cassé. Du texte + la couleur d'équipe, rien de plus.
export let TEAM_MONOGRAMS = {};
// Livrées d'écurie (v2.3 phase B) — un « geste » géométrique inventé par
// équipe (c1 fond, c2 accent, g = classe du geste). Générique par la
// forme, évocateur par les couleurs : aucune livrée réelle copiée.
export let TEAM_LIVERIES = {};
export let ROLE_BASE_RARITY = {};

/* Ordre CANONIQUE des types de variante — puissance croissante :
   couleurs de base, foils simples, duals, wild, nitro, promos.
   (= l'ordre des clés de metadata.json ; wild avant nitro car l'échelle
   des pastilles de type classe nitro au-dessus — cohérent avec le
   tie-break de variantRarity.) Unique source de vérité : chips de
   tuile, fiche carte, popover +, stats et outils s'y alignent tous. */
export const TYPE_CANONICAL = [
  'blue', 'green', 'red', 'yellow',
  'blue_foil', 'green_foil', 'red_foil', 'yellow_foil',
  'blue_red_foil', 'green_yellow_foil',
  'wild_foil', 'nitro_foil',
  'promo_blue', 'promo_green', 'promo_red', 'promo_yellow',
];
const _TYPE_IDX = Object.fromEntries(TYPE_CANONICAL.map((t, i) => [t, i]));
export function sortTypesCanonical(types){
  return [...types].sort((a, b) => (_TYPE_IDX[a] ?? 99) - (_TYPE_IDX[b] ?? 99));
}

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
  TEAM_MONOGRAMS = meta.teamMonograms || {};
  TEAM_LIVERIES = meta.teamLiveries || {};
  ROLE_BASE_RARITY = meta.roleBaseRarity;
  SEASONS = Array.isArray(meta.seasons) ? meta.seasons : [];
}

/* ── Saisons DÉCLARÉES — deux besoins, une seule structure ──
   `metadata.json → seasons[] = [{year, cardCount}]`.

   1. `year` rend une saison SÉLECTIONNABLE même si le localStorage n'en
      contient aucune trace. Sans ça, une saison neuve n'apparaissait
      jamais — et sans pastille, impossible de créer ses données : le
      poule/œuf.
   2. `cardCount` est le total de RÉFÉRENCE. Il répond à une seule
      question — « ce catalogue est-il complet ? » — et c'est
      volontairement la seule chose qu'il fait.

   POURQUOI PAS DÉDUIRE LE TOTAL DE CARDS_DB.length : sur un fichier
   saisi au fil de l'eau (40 cartes sur 101), la longueur du tableau
   chargé n'est pas le total de la saison. 23 badges calculent leur
   maximum sur ce tableau ; sans référence déclarée, posséder les 12
   pilotes PRÉSENTS débloquerait « tous les pilotes » — définitivement,
   puisqu'un badge automatique ne se reverrouille jamais. */
/* ── Saison de DÉVELOPPEMENT ──
   Une saison peut porter `test: true` dans seasons[]. Elle sert à
   exercer les chemins multi-saisons avant que les vraies cartes
   existent — et elle n'a rien à faire sous les yeux d'un visiteur.

   Ce n'est PAS une question de permissions : il n'y a rien à protéger,
   juste des données de test à ne pas livrer. Aucune authentification,
   aucune séquence secrète, aucune porte dérobée — le dépôt en a déjà
   écarté une pour le PIN, et pour la même raison.

   Le mécanisme est celui du POINT D'ENTRÉE : index-dev.html pose
   `window.__F1UNO_DEV`, index.html ne le pose pas. La liste des saisons
   reste UNIQUE (seasons[] dans metadata.json) ; seule sa lecture
   filtre. Deux tests garantissent qu'index.html ne peut pas poser le
   marqueur et qu'aucune saison de test n'entre dans le precache. */
export function isDevBuild(){
  return typeof window !== 'undefined' && window.__F1UNO_DEV === true;
}
export function isTestSeason(year = _currentSeason){
  const s = SEASONS.find(x => x.year === year);
  return !!(s && s.test);
}

export function seasonCardCount(year = _currentSeason){
  const s = SEASONS.find(x => x.year === year);
  return s && Number.isInteger(s.cardCount) ? s.cardCount : null;
}

/* Le catalogue chargé couvre-t-il toute la saison ?
   `null` quand aucun total n'est déclaré : on ne sait pas, et on ne
   PRÉSUME pas — l'appelant décide quoi faire d'une inconnue. */
export function seasonCatalogueState(){
  const total = seasonCardCount();
  const charge = CARDS_DB.length;
  if(total === null) return { total: null, charge, etat: 'inconnu' };
  if(charge === 0)   return { total, charge, etat: 'vide' };
  if(charge < total) return { total, charge, etat: 'partiel' };
  return { total, charge, etat: 'complet' };
}

/* Les saisons sélectionnables : celles DÉCLARÉES, unies à celles dont
   le localStorage garde une trace (une saison retirée du fichier ne doit
   pas faire disparaître la collection qu'on a saisie dedans). */
export function availableSeasons(){
  // Les saisons `test: true` n'existent que pour l'entrée de développement.
  const set = new Set(SEASONS.filter(s => !s.test || isDevBuild()).map(s => s.year));
  for(let i = 0; i < localStorage.length; i++){
    const m = localStorage.key(i).match(/^f1uno_owned_(\d+)$/);
    if(m) set.add(parseInt(m[1], 10));
  }
  set.add(_currentSeason);
  return [...set].sort((a, b) => b - a);
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

// Exported for the test suite (fixture injection) — not used by the UI.
export function _applyCards(cardsData){
  CARDS_DB.length = 0;
  cardsData.forEach(c => CARDS_DB.push(c));
}

/* Repli embarqué limité aux CARTES de la saison courante. L'ancien
   _loadEmbedded() rechargeait aussi métadonnées, circuits et badges —
   inutile ici, ils viennent d'être appliqués, et ça masquait le cas
   « cette saison n'a pas de données embarquées ». */
function _loadEmbeddedCards(){
  const e = window.__F1UNO_EMBEDDED;
  if(!e) return false;
  const k = 'cards' + _currentSeason;
  if(!e[k] || !e[k].length) return false;
  _applyCards(e[k]);
  return true;
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
    /* ── LE SILENCE QU'ON TUE ICI ──
       Avant : sur un 404, `_applyCards` n'était jamais appelé et
       CARDS_DB gardait le catalogue de la saison PRÉCÉDENTE. L'app
       affichait alors 101 cartes de 2025 sous une étiquette 2026, sans
       un mot — et le garde-fou `if(!CARDS_DB.length)` ne se déclenchait
       pas, puisque la liste n'était pas vide. Un garde-fou qui existe et
       ne protège pas est pire que pas de garde-fou.
       Désormais le catalogue est VIDÉ dès que la réponse n'est pas
       exploitable. Mieux vaut un écran vide, qui se voit, qu'un
       catalogue faux, qui ne se voit pas. */
    if(isTestSeason() && !isDevBuild()){
      // Ceinture ET bretelles : même si une saison de test se retrouvait
      // sélectionnée en production (état persisté, URL bricolée), son
      // catalogue ne se charge pas. La grille affiche son état vide.
      log(`Saison de test ${_currentSeason} ignorée hors développement`);
      _applyCards([]);
    } else if(cardsResp && cardsResp.ok){
      _applyCards(await cardsResp.json());
    } else {
      log(`Aucun catalogue pour la saison ${_currentSeason} — CARDS_DB vidé`);
      _applyCards([]);
      // Repli hors ligne : uniquement si les données embarquées
      // couvrent CETTE saison. Sinon on laisse vide — l'écran de
      // collection affiche son état vide, qui nomme la saison.
      if(_loadEmbeddedCards()){
        log(`Données embarquées utilisées: ${CARDS_DB.length} cartes`);
      }
    }

    if(!CARDS_DB.length){
      log('Aucune carte pour cette saison — état vide affiché par la grille');
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

// Renvoie une promesse résolue quand la saison est ENTIÈREMENT en
// place (catalogue rechargé, collection de la saison relue). Les
// appelants qui écrivent ensuite — l'import de sauvegarde — doivent
// l'attendre, sinon ils écrivent la collection de l'ancienne saison
// sous la clé de la nouvelle.
export function switchSeason(season){
  if(season === _currentSeason) return Promise.resolve();
  _currentSeason = season;
  return loadAppData().then(() => {
    loadData();
    loadManualBadges();
    renderCollection();
    updateStats();
    _renderSeasonPills();
  });
}

export function _renderSeasonPills(){
  const container = document.getElementById('seasonPills');
  if(!container) return;
  container.innerHTML = '';
  // Saisons déclarées ∪ saisons présentes en stockage — plus de 2025 en dur
  availableSeasons().forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'season-pill' + (s === _currentSeason ? ' active' : '');
    btn.textContent = s;
    btn.dataset.action = 'switchSeason';
    btn.dataset.season = s;
    btn.onclick = () => switchSeason(s);
    container.appendChild(btn);
  });
}
