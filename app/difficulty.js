/* ══════════════════════════════════════════════════════════
   DIFFICULTY — score de difficulté INTRINSÈQUE des badges (v3).

   Aucune télémétrie n'existe (collections locales) : la difficulté
   est calculée, pas mesurée. Modèle documenté :

   E (effort) = somme des acquisitions élémentaires requises,
   pondérées par la rareté d'obtention :
     carte de base précise 1 · carte au choix 0,6 · contrainte de
     catégorie/écurie 0,75 · foil 2 · dual 3 · wild/nitro 4 ·
     promo précise 5 (dépendance au hasard) · wishlist/favori ≈ un
     clic. Le set intégral d'une carte = somme des unités de SES
     types (calculé carte par carte) ; pour « N sets », on somme
     les N sets les moins chers (le collectionneur optimise).
     Badges manuels : E assigné à la main sur la même échelle.

   Score = 100 × ln(1+E) / ln(1+E_max) — normalisation
   logarithmique : étale le bas de l'échelle et fait converger le
   sommet (Grand Chelem) vers 100 sans tasser le haut.
   ══════════════════════════════════════════════════════════ */
import { CARDS_DB, AUTO_BADGES, MANUAL_BADGES, seasonCardCount } from './data.js';

const UNIT = {
  blue:1, green:1, red:1, yellow:1,
  blue_foil:2, green_foil:2, red_foil:2, yellow_foil:2,
  blue_red_foil:3, green_yellow_foil:3,
  wild_foil:4, nitro_foil:4,
  promo_blue:5, promo_green:5, promo_red:5, promo_yellow:5,
};
const CHOICE = 0.6;      // carte au choix parmi toutes
const SCOPED = 0.75;     // choix contraint (catégorie, écurie)
const CLICK = 0.06;      // wishlist / favori : un geste, pas une acquisition
const DOUBLE = 1.2;      // un double = retrouver une carte déjà eue
const COPY = 0.8;        // un exemplaire quelconque de plus

/* E assigné à la main pour les badges MANUELS — même échelle d'unités
   (« GP à la télé » ≈ un demi-ajout ; « usine d'écurie » ≈ un set
   Mercedes intégral). Validé avec le classement complet. */
const MANUAL_EFFORT = {
  fan_tv:0.5, podcast_f1:0.8, app_f1tv:1, premier_achat:1, cinema_f1:1.5, prediction:1.5,
  gamer:1.5, launch_day:2, livre_f1:2, communaute:2, cadeau:2, f1tv_pro:3, merch:3,
  fan_art:3, echange:4, sim_racing:5, karting:5, circuit_visit:10, spectateur:18,
  photo_pilote:22, rencontre:28, stands_visit:40, vip:45, globe:55, benevole:35,
  m_radio_gp:1.5, m_carte_protegee:1.5, m_recu_cadeau:2, m_montre_collection:2,
  m_classeur:3, m_offert:3, m_nuit_blanche:3, m_soiree_gp:4, m_pronostic_podium:4,
  m_mini_casque:4, m_booster_session:5, m_converti:6, m_echange_irl:6, m_karting_pluie:8,
  m_complete_echange:10, m_musee:12, m_essai_libre:12, m_qualifs:14, m_tribune:18,
  m_gp_pluie:24, m_podium_vrai:26, m_autographe:30, m_simu_complet:30, m_paddock:45,
  m_trackday:60, m_usine:70, m_marshal:80,
};

const _setCost = card => card.types.reduce((s, t) => s + (UNIT[t] || 1), 0);
const _cheapestSets = (pool, n) =>
  pool.map(_setCost).sort((a, b) => a - b).slice(0, n).reduce((a, b) => a + b, 0);

/* E d'un badge — miroir exact des métriques d'evaluateBadgeCondition. */
export function badgeEffort(badge){
  if(MANUAL_EFFORT[badge.id] !== undefined) return MANUAL_EFFORT[badge.id];
  const c = badge.condition;
  if(!c) return 1;
  /* « miroir exact » n'est pas une formule de politesse : quand
     evaluateBadgeCondition a appris `of: 'season'`, ce fichier devait
     l'apprendre aussi. Sans ça `c.value` vaut undefined, l'effort vaut
     NaN, et TOUTE l'échelle de difficulté s'effondre — pas seulement le
     badge concerné, puisque les scores sont normalisés les uns par
     rapport aux autres. Quatre tests l'ont dit tout de suite.
     Le repli sur CARDS_DB.length ne sert qu'à garder un score fini
     quand aucun total n'est déclaré ; le déblocage, lui, reste refusé
     par `partiel` côté evaluateBadgeCondition. */
  const v = c.of === 'season' ? (seasonCardCount() ?? CARDS_DB.length)
    : c.of === 'teams' ? new Set(CARDS_DB.map(x => x.team).filter(Boolean)).size
    : c.value;
  const teamOf = t => CARDS_DB.filter(x => x.team === t);
  switch(c.metric){
    case 'owned_count': return CHOICE * v;
    case 'wishlist_count':
    case 'favorite_count': return CLICK * v;
    case 'doubles_count': return DOUBLE * v;
    case 'total_qty': return COPY * v;
    case 'category_owned': {
      const pool = v === 'champion' ? CARDS_DB.filter(x => x.champion) : CARDS_DB.filter(x => x.category === v);
      return SCOPED * pool.length;
    }
    case 'champion_owned': return SCOPED * CARDS_DB.filter(x => x.champion).length;
    case 'type_owned': {
      const tf = c.typeFilter;
      const u = tf === 'foil' ? 2 : tf === 'promo' ? 5 : tf === 'dual' ? 3 : (UNIT[tf] || 1);
      return u * v;
    }
    /* Divin ≈ variante +3 (wild/nitro/promo) sur la bonne carte ;
       Cosmique ≈ palier dual. Mêmes unités que l'échelle des types. */
    case 'rarity_count': return (c.rarity === 'divine' ? 8 : c.rarity === 'cosmic' ? 5 : 3) * v;
    case 'sets_complete_count': return _cheapestSets(CARDS_DB, v);
    case 'eternal_count': return _cheapestSets(CARDS_DB.filter(x => x.champion), v);
    case 'teams_owned_count': {
      const sizes = [...new Set(CARDS_DB.map(x => x.team).filter(Boolean))]
        .map(t => SCOPED * teamOf(t).length).sort((a, b) => a - b);
      return sizes.slice(0, v).reduce((a, b) => a + b, 0);
    }
    case 'team_set': return teamOf(v).reduce((s, x) => s + _setCost(x), 0);
    case 'teams_set_count': {
      const teams = [...new Set(CARDS_DB.map(x => x.team).filter(Boolean))];
      const costs = teams.map(t => teamOf(t).reduce((s, x) => s + _setCost(x), 0)).sort((a, b) => a - b);
      return costs.slice(0, v).reduce((a, b) => a + b, 0);
    }
    case 'category_set': return CARDS_DB.filter(x => x.category === v).reduce((s, x) => s + _setCost(x), 0);
    case 'history_day_gain': return 12;
    case 'history_streak': return 15;
    case 'history_months': return 25;
    default: return 1;
  }
}

let _emax = null;
function _eMax(){
  if(_emax === null){
    const all = [...AUTO_BADGES, ...MANUAL_BADGES];
    _emax = all.length ? Math.max(...all.map(badgeEffort)) : 1;
  }
  return _emax;
}
export function _resetDifficultyCache(){ _emax = null; }   // saison / fixtures de test

/* Score 0-100. */
export function badgeDifficulty(badge){
  return Math.round(100 * Math.log1p(badgeEffort(badge)) / Math.log1p(_eMax()));
}

/* Libellé qualitatif (clé i18n b.diff_*). */
export function difficultyLabelKey(score){
  if(score >= 90) return 'b.diff_legendaire';
  if(score >= 75) return 'b.diff_extreme';
  if(score >= 50) return 'b.diff_difficile';
  if(score >= 25) return 'b.diff_modere';
  return 'b.diff_facile';
}
