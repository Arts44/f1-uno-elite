/* ══════════════════════════════════════════════════════════
   LES RÈGLES DES BADGES — condition, progression, familles

   POURQUOI CE MODULE EXISTE. C'est la logique MÉTIER : « ce badge
   est-il satisfait, et à quel point ? », « à quelle famille
   appartient-il ? », « lequel proposer comme prochain objectif ? ».
   Zéro DOM, zéro minuteur, zéro rendu.

   C'est ce que `stats.js` et `difficulty.js` consomment réellement, et
   ils importaient jusqu'ici la vue pour l'obtenir.

   LA RÈGLE QUI PRIME SUR TOUTES LES AUTRES, et qui explique `partiel` :
   un badge automatique débloqué ne se reverrouille JAMAIS. Une
   condition satisfaite sur un catalogue INCOMPLET serait donc un
   déblocage définitif obtenu sur un dénominateur faux — d'où le refus,
   et non une correction du dénominateur, qui n'est pas déductible.
   Voir docs/PLAN-SEUILS-RELATIFS.md, §0.
   ══════════════════════════════════════════════════════════ */
import {
  CARDS_DB, CARD_TYPES, AUTO_BADGES, MANUAL_BADGES,
  seasonCatalogueState, seasonCardCount,
} from './data.js';
import {
  getTypeData, cardOwned, cardWishlist, cardDoubles, cardFavorite,
  cardSetComplete, cardRarity,
} from './storage.js';
import { getHistory } from './history.js';
import { badgeDifficulty } from './difficulty.js';
import { autoBadgeUnlocked, saveManualBadges, loadManualBadges, _seenAutoBadges } from './badges-store.js';

/* Utilisé par la métrique de RYTHME (jours consécutifs). Resté dans
   badges.js au pas 5, ce qui produisait un ReferenceError sur ce seul
   chemin — invisible pour la suite de tests, qui ne l'emprunte pas.
   Trouvé par la vérification navigateur du pas 7. */
const DAY_MS = 86400000;              // 24 h en millisecondes

/* ── Les métriques dont le MAXIMUM vient du fichier chargé ──
   Ces six-là calculent leur dénominateur sur CARDS_DB : « toutes les
   cartes de la catégorie », « toutes celles de l'écurie ». C'est juste
   quand le catalogue est complet, et FAUX quand il ne l'est pas encore :
   avec 40 cartes sur 101, posséder les 12 pilotes PRÉSENTS satisferait
   « tous les pilotes ».
   On ne corrige pas le dénominateur — il n'est pas déductible d'un
   simple total. On refuse le DÉBLOCAGE tant que le catalogue est
   incomplet, ce que `partiel` signale à isAutoBadgeUnlocked(). La
   progression, elle, reste affichée : l'utilisateur voit où il en est. */
const METRIQUES_RELATIVES = new Set([
  'category_owned', 'category_set', 'champion_owned',
  'team_set', 'teams_owned_count', 'teams_set_count',
]);

export function evaluateBadgeCondition(badge){
  // If badge has a progress function (hardcoded fallback), use it
  if(typeof badge.progress === 'function') return badge.progress();

  const cond = badge.condition;
  if(!cond) return {cur:0, max:1};

  const metric = cond.metric;
  /* ── `of: 'season'` — le seuil EST la taille de la saison ──
     Un palier arbitraire (5 favoris, 20 cartes bleues) traverse un
     changement de saison sans broncher. Un seuil qui vaut « toutes les
     cartes », non : 101 était la taille du catalogue 2025, pas une
     quantité remarquable. Écrit en dur, il devient faux au millésime
     suivant — décerné à tort si la saison en compte moins, inatteignable
     si elle en compte plus.

     Le total vient donc de `seasonCardCount()`, c'est-à-dire de
     `metadata.seasons[].cardCount` : une valeur DÉCLARÉE, qui vaut 101
     même quand le fichier n'en contient que 40. JAMAIS `CARDS_DB.length`
     — ce serait réintroduire exactement le défaut qu'on corrige, et le
     rendre invisible : un fichier partiel se prouverait complet
     lui-même. */
  const parSaison = cond.of === 'season';
  /* `of: 'teams'` — « toutes les écuries ». Le nombre d'écuries n'est PAS
     déclaré dans metadata.seasons[] (seul cardCount l'est), et on a
     refusé d'ajouter un `teamCount` : ce serait une seconde source de
     vérité à tenir à jour, donc à laisser diverger un jour.
     On compte donc les écuries du catalogue — ce qui est exact À LA
     CONDITION que le catalogue soit complet, et c'est précisément ce que
     `partiel` garantit ci-dessous. « Toutes les écuries » n'a de toute
     façon aucun sens sur un catalogue incomplet : mieux vaut le badge
     indébloquable qu'attribué à tort. */
  const parEcuries = cond.of === 'teams';
  const nbEcuries = () => new Set(CARDS_DB.map(c => c.team).filter(Boolean)).size;
  const totalDeclare = parSaison ? seasonCardCount() : null;
  const target = parSaison
    // Total inconnu : on affiche la meilleure estimation disponible pour
    // que la progression reste lisible, mais `partiel` ci-dessous
    // interdit le déblocage. On montre un chiffre, on n'en tire rien.
    ? (totalDeclare === null ? (CARDS_DB.length || 1) : totalDeclare)
    : parEcuries ? (nbEcuries() || 1)
    : cond.value;
  // Catalogue incomplet + métrique relative ⇒ résultat marqué `partiel`.
  // Idem dès que le seuil est celui de la saison (cartes ou écuries) et
  // que le catalogue n'est pas COMPLET : ni partiel, ni vide, ni inconnu
  // ne suffisent.
  const partiel = (METRIQUES_RELATIVES.has(metric)
      && seasonCatalogueState().etat === 'partiel')
    || ((parSaison || parEcuries) && seasonCatalogueState().etat !== 'complet');
  const marque = r => partiel ? { ...r, partiel: true } : r;

  switch(metric){
    case 'owned_count': {
      const n = CARDS_DB.filter(c => cardOwned(c.id)).length;
      return marque({cur: Math.min(n, target), max: target});
    }
    case 'wishlist_count': {
      const n = CARDS_DB.filter(c => cardWishlist(c.id)).length;
      return {cur: Math.min(n, target), max: target};
    }
    case 'doubles_count': {
      const n = CARDS_DB.filter(c => cardDoubles(c.id)).length;
      return {cur: Math.min(n, target), max: target};
    }
    case 'favorite_count': {
      const n = CARDS_DB.filter(c => cardFavorite(c.id)).length;
      return {cur: Math.min(n, target), max: target};
    }
    case 'total_qty': {
      let t = 0;
      CARDS_DB.forEach(c => { c.types.forEach(ty => { const d = getTypeData(c.id, ty); if(d.owned && d.qty > 0) t += d.qty; }); });
      return {cur: Math.min(t, target), max: target};
    }
    case 'category_owned': {
      const all = cond.value === 'champion'
        ? CARDS_DB.filter(c => c.champion)
        : CARDS_DB.filter(c => c.category === cond.value);
      const n = all.filter(c => cardOwned(c.id)).length;
      return marque({cur: n, max: all.length});
    }
    case 'champion_owned': {
      const all = CARDS_DB.filter(c => c.champion);
      const n = all.filter(c => cardOwned(c.id)).length;
      return marque({cur: n, max: all.length});
    }
    case 'type_owned': {
      const tf = cond.typeFilter;
      let n = 0;
      // Groupes : 'foil' = tout foil · 'promo' = les 4 promos · 'dual' =
      // les 2 bicolores. (fix 1.37.0 : promo_1 filtrait sur un type
      // « promo » inexistant — il ne comptait jamais rien.)
      const grp = tf === 'foil' ? (t => CARD_TYPES[t] && CARD_TYPES[t].foil)
        : tf === 'promo' ? (t => t.startsWith('promo_'))
        : tf === 'dual' ? (t => t === 'blue_red_foil' || t === 'green_yellow_foil')
        : null;
      if(grp){
        CARDS_DB.forEach(c => { c.types.forEach(t => { if(grp(t)){ const d=getTypeData(c.id,t); if(d.owned) n+=(d.qty||1); }}); });
      } else {
        CARDS_DB.forEach(c => { const d=getTypeData(c.id, tf); if(d.owned) n+=(d.qty||1); });
      }
      return {cur: Math.min(n, target), max: target};
    }
    /* ── v3 : sets intégraux, Éternel, écuries, catégories, rythme ── */
    case 'sets_complete_count': {
      const n = CARDS_DB.filter(c => cardSetComplete(c.id)).length;
      return {cur: Math.min(n, target), max: target};
    }
    case 'eternal_count': {
      const n = CARDS_DB.filter(c => cardRarity(c) === 'eternal').length;
      return {cur: Math.min(n, target), max: target};
    }
    case 'teams_owned_count': {
      const teams = [...new Set(CARDS_DB.map(c => c.team).filter(Boolean))];
      const n = teams.filter(tm => CARDS_DB.filter(c => c.team === tm).every(c => cardOwned(c.id))).length;
      return marque({cur: Math.min(n, target), max: target});
    }
    case 'team_set': {
      const all = CARDS_DB.filter(c => c.team === target);
      const n = all.filter(c => cardSetComplete(c.id)).length;
      return marque({cur: n, max: all.length || 1});
    }
    case 'teams_set_count': {
      const teams = [...new Set(CARDS_DB.map(c => c.team).filter(Boolean))];
      const n = teams.filter(tm => {
        const cs = CARDS_DB.filter(c => c.team === tm);
        return cs.length && cs.every(c => cardSetComplete(c.id));
      }).length;
      return marque({cur: Math.min(n, target), max: target});
    }
    case 'category_set': {
      const all = CARDS_DB.filter(c => c.category === target);
      const n = all.filter(c => cardSetComplete(c.id)).length;
      return marque({cur: n, max: all.length || 1});
    }
    case 'rarity_count': {
      const n = CARDS_DB.filter(c => cardRarity(c) === cond.rarity).length;
      return {cur: Math.min(n, target), max: target};
    }
    /* Rythme — depuis l'historique quotidien {date, owned}. Limites
       honnêtes : démarre à l'installation de l'historique, « activité »
       = tout jour avec écriture, gain = delta NET entre points. */
    case 'history_day_gain': {
      const h = getHistory();
      let best = 0;
      for(let i = 1; i < h.length; i++) best = Math.max(best, h[i].owned - h[i-1].owned);
      return {cur: Math.min(best, target), max: target};
    }
    case 'history_streak': {
      const h = getHistory();
      let best = h.length ? 1 : 0, run = 1;
      for(let i = 1; i < h.length; i++){
        const prev = new Date(h[i-1].date), cur = new Date(h[i].date);
        run = (cur - prev === DAY_MS) ? run + 1 : 1;
        best = Math.max(best, run);
      }
      return {cur: Math.min(best, target), max: target};
    }
    case 'history_months': {
      const months = new Set(getHistory().map(p => p.date.slice(0, 7)));
      return {cur: Math.min(months.size, target), max: target};
    }
    default:
      return {cur:0, max:1};
  }
}

/* ── SEMIS SILENCIEUX (rétrocompat v3) — appelé à l'init, AVANT toute
   évaluation : un badge auto nouvellement défini dont la condition est
   déjà satisfaite est enregistré avec la valeur legacy `true`
   (« Débloqué » sans date) et SANS toast — pas de fausse date du jour
   sur un exploit ancien, pas de rafale au premier lancement. Les
   déblocages postérieurs suivent le chemin normal (date + toast). ── */
export function seedNewAutoBadges(){
  loadManualBadges();
  let seeded = 0;
  AUTO_BADGES.forEach(b => {
    if(autoBadgeUnlocked[b.id]) return;
    const p = evaluateBadgeCondition(b);
    if(p.cur >= p.max){ autoBadgeUnlocked[b.id] = true; seeded++; }
  });
  if(seeded){ saveManualBadges(); }
  AUTO_BADGES.forEach(b => { if(autoBadgeUnlocked[b.id]) _seenAutoBadges.add(b.id); });
  return seeded;
}

/* Charge les badges de la saison COURANTE depuis le localStorage.

   LES DEUX `else` NE SONT PAS COSMÉTIQUES. Sans eux, une saison qui
   n'a pas encore de badges enregistrés laissait les objets de module
   INCHANGÉS — donc porteurs des badges de la saison précédente. Le
   premier déblocage appelait saveManualBadges(), qui les écrivait sous
   la clé de la NOUVELLE saison : la fuite devenait permanente.
   Démontré avant correction : 4 cartes possédées en 2026, et 9 badges
   automatiques dans la clé 2026, dont 7 hérités de 2025.
   Même famille que la fuite de titre corrigée en 1.47.4. */

// Check if auto badge is unlocked (current condition OR previously unlocked)
// La valeur persistée est le TIMESTAMP de déblocage (Date.now()) ; les
// anciens enregistrements valent `true` (pas de date connue) — les deux
// sont vrais, la règle « une fois débloqué, toujours débloqué » ne change pas.
export function isAutoBadgeUnlocked(badge){
  const p = evaluateBadgeCondition(badge);
  // `partiel` : la condition est satisfaite SUR LE CATALOGUE CHARGÉ, mais
  // celui-ci ne couvre pas encore toute la saison. Débloquer ici serait
  // définitif — rien ne reverrouille un badge automatique.
  const currently = p.cur >= p.max && !p.partiel;
  if(currently && !autoBadgeUnlocked[badge.id]){
    autoBadgeUnlocked[badge.id] = Date.now();
    saveManualBadges();
  }
  return !!autoBadgeUnlocked[badge.id];
}

// Date de déblocage lisible, ou null (badge hérité sans date / verrouillé)

/* ══════════════════════════════════════════════════════════
   FAMILLES — le regroupement éditorial de la page. Un badge auto
   inconnu (future saison) tombe dans 'passion' plutôt que de
   disparaître. Les couleurs sont des tokens sémantiques existants ;
   l'or des sets est l'identité Éternel déjà en place (#FACC15 via
   --gold, défini dans styles.css).
   ══════════════════════════════════════════════════════════ */
export const FAMILIES = [
  { id:'parcours', ico:'🛣️', cls:'bf-parcours', ladder:true,
    ids:['first_card','collector_10','hunter_25','expert_50','master_75','legend_101'],
    // v3 : tuiles sous l'échelle (l'échelle ne montre que les jalons possédés)
    extraIds:['doubler_5','doubles_25','doubles_75','qty_150','qty_300','qty_500',
              'rythme_jour10','rythme_semaine7','rythme_mois6'] },
  { id:'sets',     ico:'🧩', cls:'bf-sets',
    ids:['set_1','set_5','set_15','set_30','set_60',
         'pilote_all','reserve_all','director_all','gp_all','champ_all',
         'catset_pilote','catset_reserve','catset_directeur','catset_gp'] },
  { id:'ecuries',  ico:'🛡️', cls:'bf-ecuries',
    ids:['teams_owned_2','teams_owned_5','teams_owned_10',
         'teamset_redbull','teamset_ferrari','teamset_mclaren','teamset_mercedes',
         'teamset_astonmartin','teamset_alpine','teamset_haas','teamset_rb',
         'teamset_williams','teamset_sauber','teamset_all'] },
  { id:'foils',    ico:'✦',  cls:'bf-foils',
    ids:['foil_5','foil_15','foil_30','dual_5','wild_3','wild_10','nitro_1','nitro_5',
         'promo_1','promo_5','cosmic_5','divine_1','divine_3','eternal_1','eternal_3','eternal_5'] },
  { id:'colors',   ico:'🎨', cls:'bf-colors',
    ids:['blue_20','green_20','red_20','yellow_20'] },
  { id:'passion',  ico:'❤️', cls:'bf-passion',
    ids:['dreamer_5','ambitious_15','massive_50','fan_5','superfan_15'] },
  { id:'exp',      ico:'🎟️', cls:'bf-exp', manual:true, ids:null }, // = tous les manuels
];
export function familyBadges(fam){
  if(fam.manual) return MANUAL_BADGES;
  const known = new Set(FAMILIES.flatMap(f => [...(f.ids || []), ...(f.extraIds || [])]));
  const list = [...(fam.ids || []), ...(fam.extraIds || [])]
    .map(id => AUTO_BADGES.find(b => b.id === id)).filter(Boolean);
  if(fam.id === 'passion') AUTO_BADGES.forEach(b => { if(!known.has(b.id)) list.push(b); });
  return list;
}

/* ── Prochain badge (pur, testé) ──
   L'objectif épinglé par l'utilisateur gagne s'il est encore
   verrouillé ; sinon le badge auto le plus proche de tomber
   (meilleure fraction, puis plus petit reste). */
export function pickNextBadge(pinnedId, badges, evalFn, unlockedFn){
  const locked = badges.filter(b => !unlockedFn(b));
  if(!locked.length) return null;
  if(pinnedId){
    const pin = locked.find(b => b.id === pinnedId);
    if(pin) return { badge: pin, p: evalFn(pin), pinned: true };
  }
  let best = null, bestFrac = -1, bestLeft = Infinity;
  locked.forEach(b => {
    const p = evalFn(b);
    const frac = p.max ? p.cur / p.max : 0;
    const left = p.max - p.cur;
    if(frac > bestFrac || (frac === bestFrac && left < bestLeft)){
      best = { badge: b, p, pinned: false }; bestFrac = frac; bestLeft = left;
    }
  });
  return best;
}

// Le badge débloqué le plus difficile — par le SCORE DE DIFFICULTÉ
// intrinsèque (v3), autos comme manuels. scoreFn injectable (tests).
export function hardestUnlockedBadge(badges, evalFn, unlockedFn, scoreFn = badgeDifficulty){
  let best = null, bestScore = -1;
  badges.forEach(b => {
    if(!unlockedFn(b)) return;
    const s = scoreFn(b);
    if(s > bestScore){ best = b; bestScore = s; }
  });
  return best;
}