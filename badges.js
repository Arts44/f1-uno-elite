/* ══════════════════════════════════════════════════════════
   BADGES SYSTEM — v3 : 111 badges (59 auto + 52 manuels) + titres
   ══════════════════════════════════════════════════════════ */
import { t, getLang } from './i18n.js';
import { icon } from './icons.js';
import { pageHeadHTML, pageHeadBtn } from './pagehead.js';
import { CARDS_DB, CARD_TYPES, AUTO_BADGES, MANUAL_BADGES } from './data.js';
import {
  _storageKey, getTypeData,
  cardOwned, cardWishlist, cardDoubles, cardFavorite,
  cardSetComplete, cardRarity
} from './storage.js';
import { getHistory } from './history.js';
import { badgeDifficulty, difficultyLabelKey } from './difficulty.js';
import { updateStats } from './stats.js';
import { showToast, switchView } from './render.js';
import { secureGet, secureSet } from './secure-store.js';

export let manualBadges = {};        // { badgeId: true/false }
export let autoBadgeUnlocked = {};   // { badgeId: true } — persists once unlocked
const _seenAutoBadges = new Set();    // auto badge IDs already displayed with shimmer
const DAY_MS = 86400000;              // 24 h en millisecondes

// Setters for cross-module writes (import "replace" mode)
export function setManualBadges(v){ manualBadges = v; }
export function setAutoBadgeUnlocked(v){ autoBadgeUnlocked = v; }

// Evaluate badge progress from JSON condition config
export function evaluateBadgeCondition(badge){
  // If badge has a progress function (hardcoded fallback), use it
  if(typeof badge.progress === 'function') return badge.progress();

  const cond = badge.condition;
  if(!cond) return {cur:0, max:1};

  const metric = cond.metric;
  const target = cond.value;

  switch(metric){
    case 'owned_count': {
      const n = CARDS_DB.filter(c => cardOwned(c.id)).length;
      return {cur: Math.min(n, target), max: target};
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
      return {cur: n, max: all.length};
    }
    case 'champion_owned': {
      const all = CARDS_DB.filter(c => c.champion);
      const n = all.filter(c => cardOwned(c.id)).length;
      return {cur: n, max: all.length};
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
      return {cur: Math.min(n, target), max: target};
    }
    case 'team_set': {
      const all = CARDS_DB.filter(c => c.team === target);
      const n = all.filter(c => cardSetComplete(c.id)).length;
      return {cur: n, max: all.length || 1};
    }
    case 'teams_set_count': {
      const teams = [...new Set(CARDS_DB.map(c => c.team).filter(Boolean))];
      const n = teams.filter(tm => {
        const cs = CARDS_DB.filter(c => c.team === tm);
        return cs.length && cs.every(c => cardSetComplete(c.id));
      }).length;
      return {cur: Math.min(n, target), max: target};
    }
    case 'category_set': {
      const all = CARDS_DB.filter(c => c.category === target);
      const n = all.filter(c => cardSetComplete(c.id)).length;
      return {cur: n, max: all.length || 1};
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

// Load manual badges from localStorage
export function loadManualBadges(){
  try {
    const s = secureGet(_storageKey('badges'));
    if(s) manualBadges = JSON.parse(s);
  } catch(e){ manualBadges = {}; }
  try {
    const a = secureGet(_storageKey('auto_badges'));
    if(a) autoBadgeUnlocked = JSON.parse(a);
  } catch(e){ autoBadgeUnlocked = {}; }
}
export function saveManualBadges(){ secureSet(_storageKey('badges'), JSON.stringify(manualBadges)); secureSet(_storageKey('auto_badges'), JSON.stringify(autoBadgeUnlocked)); }

// Check if auto badge is unlocked (current condition OR previously unlocked)
// La valeur persistée est le TIMESTAMP de déblocage (Date.now()) ; les
// anciens enregistrements valent `true` (pas de date connue) — les deux
// sont vrais, la règle « une fois débloqué, toujours débloqué » ne change pas.
export function isAutoBadgeUnlocked(badge){
  const p = evaluateBadgeCondition(badge);
  const currently = p.cur >= p.max;
  if(currently && !autoBadgeUnlocked[badge.id]){
    autoBadgeUnlocked[badge.id] = Date.now();
    saveManualBadges();
  }
  return !!autoBadgeUnlocked[badge.id];
}

// Date de déblocage lisible, ou null (badge hérité sans date / verrouillé)
export function badgeUnlockDate(store, id){
  const v = store[id];
  return (typeof v === 'number' && v > 0) ? new Date(v) : null;
}

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

/* ── Objectif épinglé (préférence locale, par saison) ── */
export function getPinnedBadge(){ return localStorage.getItem(_storageKey('pinned_badge')) || null; }
export function setPinnedBadge(id){
  if(id) localStorage.setItem(_storageKey('pinned_badge'), id);
  else localStorage.removeItem(_storageKey('pinned_badge'));
}

export function removeAutoBadge(badgeId){
  if(autoBadgeUnlocked[badgeId]){
    delete autoBadgeUnlocked[badgeId];
    saveManualBadges();
    renderBadges();
    updateStats();
    showToast(t('b.removed'));
  }
}

/* ── Célébration d'une tuile (particules + glow, nettoyée seule).
   prefers-reduced-motion : rien — la tuile passe juste à l'état
   débloqué. ── */
function _celebrate(tile){
  if(!tile) return;
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  tile.classList.add('just-unlocked');
  const particles = document.createElement('div');
  particles.className = 'badge-particles';
  const colors = ['var(--red)','var(--orange)','var(--gold)','var(--green)','var(--blue)','var(--purple)'];
  for(let i=0;i<12;i++){
    const p = document.createElement('div');
    p.className = 'badge-particle';
    const angle = (Math.PI*2/12)*i;
    // Math.random() DÉCORATIF : distance de projection d'une particule
    // de célébration (34→60 px) quand un badge se débloque. Aucune
    // valeur de sécurité n'en dépend — la seule aléa cryptographique du
    // dépôt est crypto.getRandomValues() dans secure-store.js (sel
    // PBKDF2, IV AES-GCM). Un analyseur qui exige un CSPRNG ici confond
    // « aléatoire » et « imprévisible ».
    const dist = 34 + Math.random()*26;
    p.style.cssText = `left:50%;top:26px;background:${colors[i%colors.length]};--px:${Math.cos(angle)*dist}px;--py:${Math.sin(angle)*dist}px;animation-delay:${i*0.02}s;`;
    particles.appendChild(p);
  }
  tile.appendChild(particles);
  setTimeout(()=>{ tile.classList.remove('just-unlocked'); particles.remove(); }, 1200);
}

export function toggleManualBadge(badgeId){
  const wasUnlocked = !!manualBadges[badgeId];
  if(wasUnlocked) delete manualBadges[badgeId];
  else manualBadges[badgeId] = Date.now();   // timestamp = date de déblocage
  saveManualBadges();
  renderBadges();
  if(!wasUnlocked){
    const tile = document.querySelector(`.badge-tile[data-badge="${badgeId}"]`);
    _celebrate(tile);
    const b = MANUAL_BADGES.find(x => x.id === badgeId);
    if(b) queueBadgeToasts([b], { navigate: false });
  } else {
    showToast(t('b.removed'));
  }
}

export function getBadgeCards(badgeId){
  const catMap = {pilote_all:'pilote',reserve_all:'reserve',director_all:'directeur',gp_all:'gp',champ_all:'champion'};
  // Category badges: show all cards in category with owned/missing
  if(catMap[badgeId]){
    const cat = catMap[badgeId]==='champion' ? null : catMap[badgeId];
    const cards = cat
      ? CARDS_DB.filter(c=>c.category===cat)
      : CARDS_DB.filter(c=>c.champion);
    return cards.map(c=>({id:c.id,name:c.name,owned:cardOwned(c.id),cat:true}));
  }
  // Other auto badges: show owned cards that contribute
  const owned = CARDS_DB.filter(c=>cardOwned(c.id));
  if(badgeId==='first_card') return owned.slice(0,1).map(c=>({id:c.id,name:c.name,owned:true,cat:false}));
  if(badgeId==='collector_10') return owned.slice(0,10).map(c=>({id:c.id,name:c.name,owned:true,cat:false}));
  if(badgeId==='hunter_25') return owned.slice(0,25).map(c=>({id:c.id,name:c.name,owned:true,cat:false}));
  if(badgeId==='expert_50') return owned.slice(0,50).map(c=>({id:c.id,name:c.name,owned:true,cat:false}));
  if(badgeId==='master_75') return owned.slice(0,75).map(c=>({id:c.id,name:c.name,owned:true,cat:false}));
  if(badgeId==='legend_101') return owned.map(c=>({id:c.id,name:c.name,owned:true,cat:false}));
  if(badgeId==='dreamer_5') return CARDS_DB.filter(c=>cardWishlist(c.id)).slice(0,5).map(c=>({id:c.id,name:c.name,owned:cardOwned(c.id),cat:false}));
  if(badgeId==='ambitious_15') return CARDS_DB.filter(c=>cardWishlist(c.id)).slice(0,15).map(c=>({id:c.id,name:c.name,owned:cardOwned(c.id),cat:false}));
  if(badgeId==='doubler_5') return CARDS_DB.filter(c=>cardDoubles(c.id)).slice(0,5).map(c=>({id:c.id,name:c.name,owned:true,cat:false}));
  if(badgeId==='massive_50'){let t=0;const r=[];CARDS_DB.forEach(c=>{c.types.forEach(ty=>{const d=getTypeData(c.id,ty);if(d.owned&&d.qty>0){t+=d.qty;if(t<=50)r.push({id:c.id,name:c.name,owned:true,cat:false});}});});return r;}
  if(badgeId==='fan_5') return CARDS_DB.filter(c=>cardFavorite(c.id)).slice(0,5).map(c=>({id:c.id,name:c.name,owned:cardOwned(c.id),cat:false}));
  if(badgeId==='superfan_15') return CARDS_DB.filter(c=>cardFavorite(c.id)).slice(0,15).map(c=>({id:c.id,name:c.name,owned:cardOwned(c.id),cat:false}));
  if(badgeId==='foil_5'){let n=0;const r=[];CARDS_DB.forEach(c=>{c.types.forEach(t=>{if(CARD_TYPES[t]&&CARD_TYPES[t].foil&&getTypeData(c.id,t).owned&&n<5){n++;r.push({id:c.id,name:c.name,owned:true,cat:false});}});});return r;}
  if(badgeId==='nitro_1'){let n=0;const r=[];CARDS_DB.forEach(c=>{c.types.forEach(t=>{if(t==='nitro_foil'&&getTypeData(c.id,t).owned&&n<1){n++;r.push({id:c.id,name:c.name,owned:true,cat:false});}});});return r;}
  if(badgeId==='wild_3'){const r=[];CARDS_DB.forEach(c=>{c.types.forEach(t=>{if(t==='wild_foil'&&getTypeData(c.id,t).owned&&r.length<3)r.push({id:c.id,name:c.name,owned:true,cat:false});});});return r;}
  if(badgeId==='promo_1'){const r=[];CARDS_DB.forEach(c=>{c.types.forEach(t=>{if((t==='promo_blue'||t==='promo_green'||t==='promo_red'||t==='promo_yellow')&&getTypeData(c.id,t).owned&&r.length<1)r.push({id:c.id,name:c.name,owned:true,cat:false});});});return r;}
  if(badgeId==='blue_20') return CARDS_DB.filter(c=>getTypeData(c.id,'blue').owned).slice(0,20).map(c=>({id:c.id,name:c.name,owned:true,cat:false}));
  if(badgeId==='green_20') return CARDS_DB.filter(c=>getTypeData(c.id,'green').owned).slice(0,20).map(c=>({id:c.id,name:c.name,owned:true,cat:false}));
  if(badgeId==='red_20') return CARDS_DB.filter(c=>getTypeData(c.id,'red').owned).slice(0,20).map(c=>({id:c.id,name:c.name,owned:true,cat:false}));
  if(badgeId==='yellow_20') return CARDS_DB.filter(c=>getTypeData(c.id,'yellow').owned).slice(0,20).map(c=>({id:c.id,name:c.name,owned:true,cat:false}));
  return [];
}

/* ── Détail d'un badge (panneau inline sous la grille de sa famille) ──
   Description, progression, date de déblocage, cartes contributives
   (getBadgeCards inchangé), objectif épinglable (auto verrouillé),
   validation (manuel) et retrait (débloqué). ── */
let _openDetail = null;

function _detailHTML(b, fam){
  const isManual = !!fam.manual;
  const store = isManual ? manualBadges : autoBadgeUnlocked;
  const unlocked = isManual ? !!manualBadges[b.id] : !!autoBadgeUnlocked[b.id];
  const tr = (window.__BADGE_T?.[b.id]?.[getLang()] || window.__BADGE_T?.[b.id]?.en || {});
  const diff = badgeDifficulty(b);
  let h = `<div class="bd-name">${b.emoji} ${tr.name || b.name}</div>
    <div class="bd-desc">${tr.desc || b.desc || ''}</div>
    <div class="bd-diff"><span class="bd-diff-lb dl-${difficultyLabelKey(diff).slice(7)}">${t(difficultyLabelKey(diff))}</span><span class="bd-diff-pct">${t('b.difficulty')} ${diff} %</span></div>`;
  if(unlocked){
    const d = badgeUnlockDate(store, b.id);
    h += `<div class="bd-date">✓ ${d
      ? t('b.unlocked_on', { d: d.toLocaleDateString(getLang(), { day:'numeric', month:'long', year:'numeric' }) })
      : t('b.unlocked_simple')}</div>`;
  } else if(!isManual){
    const p = evaluateBadgeCondition(b);
    const pct = p.max ? Math.min(100, Math.round(p.cur / p.max * 100)) : 0;
    h += `<div class="bd-bar"><i style="width:${pct}%"></i></div>
      <div class="bd-sub">${p.cur} / ${p.max} — ${t('b.remaining', { n: p.max - p.cur })}</div>`;
  }
  if(!isManual){
    const cards = getBadgeCards(b.id);
    if(cards.length){
      const isCat = ['pilote_all','reserve_all','director_all','gp_all','champ_all'].includes(b.id);
      h += `<div class="bd-chips">`;
      cards.filter(c => c.owned).slice(0, 14).forEach(c => { h += `<span class="bd-chip">#${c.id} ${c.name}</span>`; });
      const more = cards.filter(c => c.owned).length - 14;
      if(more > 0) h += `<span class="bd-chip">+${more}…</span>`;
      if(isCat) cards.filter(c => !c.owned).forEach(c => { h += `<span class="bd-chip miss">#${c.id} ${c.name}</span>`; });
      h += `</div>`;
    }
  }
  h += `<div class="bd-actions">`;
  if(isManual){
    h += `<button class="bd-btn ${unlocked ? '' : 'primary'}" data-action="toggleManualBadge" data-badge="${b.id}">${unlocked ? t('b.remove_badge') : t('b.validate_btn')}</button>`;
  } else if(unlocked){
    h += `<button class="bd-btn" data-action="removeAutoBadge" data-badge="${b.id}">${t('b.remove_badge')}</button>`;
  } else {
    const pinned = getPinnedBadge() === b.id;
    h += `<button class="bd-btn ${pinned ? '' : 'primary'}" data-action="${pinned ? 'unpinBadge' : 'pinBadge'}" data-badge="${b.id}">${pinned ? t('b.unpin_objective') : t('b.pin_objective')}</button>`;
  }
  h += `</div>`;
  return h;
}

export function toggleBadgeDetail(badgeId){
  const fam = FAMILIES.find(f => familyBadges(f).some(b => b.id === badgeId));
  if(!fam) return;
  const det = document.getElementById('bd-' + fam.id);
  if(!det) return;
  if(_openDetail === badgeId){ det.classList.remove('open'); _openDetail = null; return; }
  document.querySelectorAll('.badge-detail').forEach(d => d.classList.remove('open'));
  const b = familyBadges(fam).find(x => x.id === badgeId);
  det.innerHTML = _detailHTML(b, fam);
  det.classList.add('open');
  _openDetail = badgeId;
}

export function pinBadge(badgeId){
  setPinnedBadge(badgeId);
  renderBadges();
  showToast(t('b.pinned_toast'));
}
export function unpinBadge(){
  setPinnedBadge(null);
  renderBadges();
}

/* ══════════════════════════════════════════════════════════
   RENDU DE LA PAGE — hero (anneau + titre + plus difficile +
   partage), carte Prochain badge / Objectif, familles (échelle
   pour le Parcours, tuiles ailleurs), détail inline.
   ══════════════════════════════════════════════════════════ */
const _bt = b => (window.__BADGE_T?.[b.id]?.[getLang()] || window.__BADGE_T?.[b.id]?.en || {});

function _tileHTML(b, fam){
  const isManual = !!fam.manual;
  const unlocked = isManual ? !!manualBadges[b.id] : !!autoBadgeUnlocked[b.id];
  const p = isManual ? null : evaluateBadgeCondition(b);
  // seule la « prochaine » tuile verrouillée de la famille porte l'arc
  const eternal = b.id === 'champ_all';
  let cls = unlocked ? 'un' : 'lock';
  let arc = '';
  if(!unlocked && p && p.cur > 0){
    cls = 'prog';
    const pct = Math.min(100, Math.round(p.cur / p.max * 100));
    arc = ` style="--p:${pct}"`;
  }
  return `<div class="badge-tile ${cls}${eternal ? ' eternal' : ''}" data-action="toggleBadgeDetail" data-badge="${b.id}" role="listitem" tabindex="0"${arc}>
    ${unlocked ? '<span class="bt-chk">✓</span>' : ''}
    <div class="bt-med"><span>${b.emoji}</span></div>
    ${cls === 'prog' ? `<span class="bt-pp">${p.cur}/${p.max}</span>` : ''}
    <div class="bt-name">${_bt(b).name || b.name}</div>
    <span class="bt-diff dl-${difficultyLabelKey(badgeDifficulty(b)).slice(7)}">${badgeDifficulty(b)}%</span>
  </div>`;
}

let _heroWasAnimated = false;
export function renderBadges(opts = {}){
  loadManualBadges();
  const hero = document.getElementById('badgesHead');
  const next = document.getElementById('badgesNext');
  const fams = document.getElementById('badgesFams');
  if(!hero || !next || !fams) return;
  _openDetail = null;

  const autoUnlocked = AUTO_BADGES.filter(b => isAutoBadgeUnlocked(b)).length;
  const manualUnlocked = Object.values(manualBadges).filter(Boolean).length;
  const total = autoUnlocked + manualUnlocked;
  const TOTAL = AUTO_BADGES.length + MANUAL_BADGES.length;

  // ── Bandeau de page (1.45.0) : le hero d'avant, rangé dans le
  //    pattern commun. L'anneau, le titre porté et « le plus difficile »
  //    occupent le slot mesure ; le partage passe dans le slot d'actions.
  const C = 2 * Math.PI * 38;
  const hardest = hardestUnlockedBadge([...AUTO_BADGES, ...MANUAL_BADGES], evaluateBadgeCondition, b => !!(autoBadgeUnlocked[b.id] || manualBadges[b.id]));
  hero.innerHTML = pageHeadHTML({
    icon: 'award',
    title: t('nav.badges'),
    sub: t('ph.badges_sub', { n: total, total: TOTAL }),
    actions: pageHeadBtn('upload', t('b.share'), 'data-action="shareBadges"'),
    metric: `<div class="bh-row">
      <div class="bh-ring">
        <svg width="86" height="86" viewBox="0 0 86 86" aria-hidden="true">
          <circle class="bh-bg" cx="43" cy="43" r="38" fill="none" stroke-width="7"/>
          <circle class="bh-fg" id="bhFg" cx="43" cy="43" r="38" fill="none" stroke-width="7"
            stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - total / TOTAL)}"/>
        </svg>
        <div class="bh-num"><b id="bhCount">${total}</b><span>/ ${TOTAL}</span></div>
      </div>
      <div class="bh-right">
        <div class="user-title-wrap" id="userTitleCard"></div>
        ${hardest ? `<div class="bh-hardest">${t('b.hardest')} <b>${hardest.emoji} ${_bt(hardest).name || hardest.name}</b></div>` : ''}
      </div>
    </div>`
  });

  // ── Prochain badge / Objectif épinglé ──
  const nx = pickNextBadge(getPinnedBadge(), AUTO_BADGES, evaluateBadgeCondition, isAutoBadgeUnlocked);
  if(nx && getPinnedBadge() && !nx.pinned) setPinnedBadge(null); // objectif tombé → retour au calcul
  if(total === 0){
    next.innerHTML = `<div class="bn-empty">🏁 <b>${t('b.empty_title')}</b><br>${t('b.empty_sub')}</div>`;
  } else if(!nx){
    next.innerHTML = `<div class="bn-empty full">🌟 <b>${t('b.all_done')}</b></div>`;
  } else {
    const pct = nx.p.max ? Math.min(100, Math.round(nx.p.cur / nx.p.max * 100)) : 0;
    next.innerHTML = `
      <div class="bn-next" data-action="toggleBadgeDetail" data-badge="${nx.badge.id}" role="button" tabindex="0">
        <div class="bn-med">${nx.badge.emoji}</div>
        <div class="bn-body">
          <div class="bn-k">${nx.pinned ? icon('pin') + ' ' + t('b.objective') : t('b.next_badge')}</div>
          <div class="bn-n">${_bt(nx.badge).name || nx.badge.name}</div>
          <div class="bn-bar"><i style="width:${pct}%"></i></div>
          <div class="bn-s"><b>${nx.p.cur}/${nx.p.max}</b> · ${t('b.remaining', { n: nx.p.max - nx.p.cur })}</div>
        </div>
      </div>`;
  }

  // ── Familles ──
  let h = '';
  FAMILIES.forEach(fam => {
    const list = familyBadges(fam);
    const un = list.filter(b => fam.manual ? !!manualBadges[b.id] : !!autoBadgeUnlocked[b.id]).length;
    h += `<div class="badge-fam ${fam.cls}">
      <div class="bfh"><span class="bfh-ico">${fam.ico}</span><span class="bfh-name">${t('b.fam_' + fam.id)}</span><span class="bfh-count">${un}/${list.length}</span></div>
      <div class="bfh-bar"><i style="width:${list.length ? un / list.length * 100 : 0}%"></i></div>`;
    if(fam.ladder){
      // v3 : l'échelle ne montre que les JALONS (fam.ids) ; les badges
      // de progression annexes (doubles, exemplaires, rythme) vivent en
      // tuiles sous l'échelle.
      const rungs = list.filter(b => fam.ids.includes(b.id));
      const extras = list.filter(b => !fam.ids.includes(b.id));
      h += `<div class="badge-ladder" role="list">`;
      rungs.forEach(b => {
        const unl = !!autoBadgeUnlocked[b.id];
        const p = evaluateBadgeCondition(b);
        const cur = !unl && p.cur > 0 && rungs.filter(x => !autoBadgeUnlocked[x.id])[0]?.id === b.id;
        h += `<div class="bl-rung ${unl ? 'done' : cur ? 'cur' : 'lock'}" data-action="toggleBadgeDetail" data-badge="${b.id}" role="listitem" tabindex="0">
          <div class="bl-dot">${b.emoji}</div><div class="bl-lbl">${p.max}</div></div>`;
      });
      h += `</div>`;
      if(extras.length){
        h += `<div class="badge-tiles" role="list">`;
        extras.forEach(b => { h += _tileHTML(b, fam); });
        h += `</div>`;
      }
      h += `<div class="badge-detail" id="bd-${fam.id}"></div>`;
    } else {
      h += `<div class="badge-tiles" role="list">`;
      list.forEach(b => { h += _tileHTML(b, fam); });
      h += `<div class="badge-detail" id="bd-${fam.id}"></div></div>`;
    }
    h += `</div>`;
  });
  fams.innerHTML = h;

  // ── Compteur d'onglet + titre ──
  const tabCount = document.getElementById('badgeCountTab');
  if(tabCount) tabCount.textContent = `${total}/${TOTAL}`;
  updateUserTitle();

  // ── Animation d'arrivée (one-shot ~600 ms, statique en reduced-motion) ──
  if(opts.animateHero && !_heroWasAnimated){
    _heroWasAnimated = true;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(!reduce && total > 0){
      const fg = document.getElementById('bhFg');
      const cnt = document.getElementById('bhCount');
      if(fg && cnt){
        const target = C * (1 - total / TOTAL);
        fg.style.transition = 'none';
        fg.setAttribute('stroke-dashoffset', C);
        void fg.getBoundingClientRect();
        fg.style.transition = 'stroke-dashoffset 0.6s cubic-bezier(0.22,0.9,0.36,1)';
        fg.setAttribute('stroke-dashoffset', target);
        const t0 = performance.now();
        const tick = now => {
          const k = Math.min(1, (now - t0) / 600);
          cnt.textContent = Math.round(total * (1 - Math.pow(1 - k, 3)));
          if(k < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        // filet : rAF gelé (onglet caché) → valeur finale posée quand même
        setTimeout(() => { cnt.textContent = String(total); }, 650);
      }
    }
  }

  AUTO_BADGES.forEach(b => { if(isAutoBadgeUnlocked(b)) _seenAutoBadges.add(b.id); });
}

// L'animation du hero rejoue à chaque ARRIVÉE sur la page, pas aux
// re-rendus internes : render.js arme ce drapeau en quittant la vue.
export function resetHeroAnimation(){ _heroWasAnimated = false; }

/* ══════════════════════════════════════════════════════════
   DÉBLOCAGE EN COURS D'USAGE — détection + toast badge.
   Appelé par updateStats() après chaque écriture de collection.
   Groupé si plusieurs tombent d'un coup ; file d'attente pour ne
   jamais se battre avec le toast standard (Annuler) : on attend
   qu'il soit parti. Haptique courte, silencieuse là où vibrate
   n'existe pas (iOS).
   ══════════════════════════════════════════════════════════ */
export function groupBadgeToastLabel(names, tf = t){
  if(names.length === 1) return names[0];
  return tf('b.toast_many', { n: names.length }) + ' — ' + names.slice(0, 3).join(', ') + (names.length > 3 ? '…' : '');
}

const _toastQueue = [];
let _toastShowing = false;
export function queueBadgeToasts(badges, opts = {}){
  if(!badges.length) return;
  _toastQueue.push({ badges, navigate: opts.navigate !== false });
  _drainToastQueue();
}
function _drainToastQueue(){
  if(_toastShowing || !_toastQueue.length) return;
  // le toast standard (Annuler…) est prioritaire : repasser après lui
  const std = document.getElementById('toast');
  if(std && std.classList.contains('show')){ setTimeout(_drainToastQueue, 1200); return; }
  _toastShowing = true;
  const { badges, navigate } = _toastQueue.shift();
  let el = document.getElementById('badgeToast');
  if(!el){
    el = document.createElement('div');
    el.id = 'badgeToast';
    el.className = 'badge-toast';
    document.body.appendChild(el);
  }
  const names = badges.map(b => _bt(b).name || b.name);
  el.innerHTML = `<div class="bgt-med">${badges[0].emoji}</div>
    <div><div class="bgt-k">${badges.length > 1 ? t('b.toast_many', { n: badges.length }) : t('b.toast_one')}</div>
    <div class="bgt-n">${badges.length > 1 ? names.slice(0, 3).join(', ') + (names.length > 3 ? '…' : '') : names[0]}</div></div>`;
  el.onclick = navigate ? () => { el.classList.remove('show'); switchView('badges'); } : () => el.classList.remove('show');
  // setTimeout, PAS requestAnimationFrame : rAF ne tourne pas onglet en
  // arrière-plan — le toast ne serait jamais monté à l'écran au retour.
  setTimeout(() => el.classList.add('show'), 20);
  try { if(navigator.vibrate) navigator.vibrate(30); } catch(e){ /* iOS: pas d'API */ }
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => { _toastShowing = false; _drainToastQueue(); }, 400);
  }, 2800);
}

// Détecte les transitions verrouillé → débloqué depuis la dernière
// écriture. C'est un AJOUT : la persistance passe toujours par
// autoBadgeUnlocked + saveManualBadges, comme avant.
export function checkNewAutoBadges(){
  const fresh = [];
  AUTO_BADGES.forEach(b => {
    if(autoBadgeUnlocked[b.id]) return;
    const p = evaluateBadgeCondition(b);
    if(p.cur >= p.max){
      autoBadgeUnlocked[b.id] = Date.now();
      fresh.push(b);
    }
  });
  if(fresh.length){
    saveManualBadges();
    queueBadgeToasts(fresh);
    const tile = document.querySelector(`.badge-tile[data-badge="${fresh[0].id}"]`);
    if(tile) _celebrate(tile);
  }
}

/* ── Carte de profil exportable (canvas → PNG) ── */
export async function shareProfileCard(){
  loadManualBadges();
  const total = AUTO_BADGES.filter(b => isAutoBadgeUnlocked(b)).length
    + Object.values(manualBadges).filter(Boolean).length;
  const TOTAL = AUTO_BADGES.length + MANUAL_BADGES.length;
  const unlockedList = [...AUTO_BADGES, ...MANUAL_BADGES]
    .filter(b => autoBadgeUnlocked[b.id] || manualBadges[b.id]);
  const hardest = hardestUnlockedBadge([...AUTO_BADGES, ...MANUAL_BADGES], evaluateBadgeCondition, b => !!(autoBadgeUnlocked[b.id] || manualBadges[b.id]));
  const titleEl = document.querySelector('#headerTitle .ht-icon + span');
  const titleTxt = titleEl ? titleEl.textContent : 'Rookie';
  const dark = document.documentElement.getAttribute('data-theme') !== 'light';

  const W = 1000, H = 1250;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const x = cv.getContext('2d');
  x.fillStyle = dark ? '#100E0F' : '#F4F1ED'; x.fillRect(0, 0, W, H);
  const ink = dark ? '#F3F0F1' : '#191716';
  const sub = dark ? '#A5A0A2' : '#6A6461';
  const red = dark ? '#FF4757' : '#E8002D';
  // liseré
  x.strokeStyle = red; x.lineWidth = 10; x.strokeRect(25, 25, W - 50, H - 50);
  // en-tête
  x.fillStyle = ink; x.textAlign = 'center';
  x.font = '700 54px system-ui'; x.fillText('F1 UNO ÉLITE', W / 2, 130);
  x.fillStyle = sub; x.font = '600 30px system-ui'; x.fillText(t('b.title').replace('🏅 ', '').toUpperCase(), W / 2, 180);
  // anneau
  const cx = W / 2, cy = 430, r = 150;
  x.lineWidth = 26; x.lineCap = 'round';
  x.strokeStyle = dark ? '#2E2A2C' : '#E3DED7';
  x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.stroke();
  x.strokeStyle = red;
  x.beginPath(); x.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (total / TOTAL)); x.stroke();
  x.fillStyle = ink; x.font = '700 110px system-ui'; x.fillText(String(total), cx, cy + 20);
  x.fillStyle = sub; x.font = '600 36px system-ui'; x.fillText(`/ ${TOTAL}`, cx, cy + 75);
  // titre actif
  x.fillStyle = red; x.font = '700 44px system-ui'; x.fillText(titleTxt, W / 2, 700);
  if(hardest){
    x.fillStyle = sub; x.font = '500 28px system-ui';
    x.fillText(`${t('b.hardest')} ${_bt(hardest).name || hardest.name}`, W / 2, 755);
  }
  // badges marquants (jusqu'à 8 emojis)
  const show = unlockedList.slice(0, 8);
  x.font = '64px system-ui';
  show.forEach((b, i) => {
    const bx = W / 2 + (i - (show.length - 1) / 2) * 100;
    x.fillText(b.emoji, bx, 890);
  });
  // pied
  x.fillStyle = sub; x.font = '500 26px system-ui';
  x.fillText('arts44.github.io/f1-uno-elite', W / 2, H - 90);

  const blob = await new Promise(res => cv.toBlob(res, 'image/png'));
  if(!blob) return;
  const file = new File([blob], 'f1-uno-badges.png', { type: 'image/png' });
  if(navigator.canShare && navigator.canShare({ files: [file] })){
    try { await navigator.share({ files: [file] }); return; } catch(e){ /* annulé → repli */ }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'f1-uno-badges.png'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  showToast(t('b.share_saved'));
}

/* ══════════════════════════════════════════════════════════
   USER TITLES — 1 par badge + titres spéciaux jalons
   ══════════════════════════════════════════════════════════ */
// Titles unlocked by each badge (auto + manual)
const BADGE_TITLES = {
  // Auto badges
  first_card:'Débutant',collector_10:'Collectionneur',hunter_25:'Chasseur',expert_50:'Expert',
  master_75:'Maître',legend_101:'Légende vivante',dreamer_5:'Rêveur',ambitious_15:'Ambitieux',
  doubler_5:'Doubleur',massive_50:'Collection massive',fan_5:'Fan',superfan_15:'Super Fan',
  pilote_all:'Pilote collector',reserve_all:'Réserve collector',director_all:'Directeur collector',
  gp_all:'GP collector',champ_all:'Champion collector',foil_5:'Foil hunter',nitro_1:'Nitro master',
  wild_3:'Wild card',promo_1:'Promo king',blue_20:'Blue team',green_20:'Green machine',
  red_20:'Red baron',yellow_20:'Yellow flash',
  // Manual badges
  spectateur:'Spectateur',premier_achat:'Premier acheteur',cadeau:'Lucky gift',echange:'Négociateur',
  photo_pilote:'Selfie star',circuit_visit:'Circuit walker',fan_tv:'Téléspectateur',gamer:'Gamer F1',
  merch:'Merch addict',app_f1tv:'F1 TV viewer',launch_day:'Day One',globe:'Globe-trotter',
  vip:'VIP Access',f1tv_pro:'F1 TV Pro',rencontre:'Rencontreur',sim_racing:'Sim Racer',
  livre_f1:'Connaisseur',fan_art:'Artiste F1',communaute:'Communautaire',benevole:'Bénévole',
  cinema_f1:'Cinéphile F1',podcast_f1:'Podcaster',stands_visit:'Pit lane',prediction:'Prophète',
  karting:'Karting pilot'
};

// Special milestone titles (unlocked when conditions met)
const MILESTONE_TITLES = [
  {id:'25_badges', name:'Champion',      icon:'🏆', color:'#34C759', desc:'25 badges débloqués'},
  {id:'50_badges', name:'Hall of Fame',  icon:'🌟', color:'#FF6B35', desc:'50 badges débloqués'},
  {id:'all_auto',  name:'Cyborg',        icon:'🤖', color:'#007AFF', desc:'Tous les badges auto'},
  {id:'all_manual',name:'Explorateur',   icon:'🧭', color:'#FF9500', desc:'Tous les badges manuels'},
];

// Seul l'IDENTIFIANT du titre choisi est gardé : l'objet affiché est
// toujours retrouvé dans getUnlockedTitles(). Voir loadSelectedTitle().
let selectedTitleId = null;

/* ── f1uno_title : on ne persiste QUE l'identifiant ───────────
   Avant, l'OBJET titre entier était sérialisé dans le localStorage,
   puis relu et affiché tel quel. Le garde ne vérifiait que son `id`
   contre les titres débloqués — mais c'est l'objet STOCKÉ qui était
   ensuite interpolé en innerHTML. Or f1uno_title fait partie des
   préférences restaurées par un import (settings-sync.js, PREF_KEYS) :
   une sauvegarde ou un lien #backup= hostile pouvait donc y placer
   {id:"<un id valide>", name:"<img src=x onerror=…>"} et faire exécuter
   du script. Même vecteur que la XSS #backup= corrigée en 1.42.
   Le titre est une donnée DÉRIVÉE : seul son id a besoin d'être
   persisté, et l'objet affiché vient toujours de getUnlockedTitles(). */
function loadSelectedTitle(){
  selectedTitleId = null;
  try {
    // Clé scoppée par saison depuis 1.47.4 (un titre se gagne AVEC les
    // badges d'une saison). La migration v3 déplace l'ancienne clé nue ;
    // la relecture de secours ci-dessous couvre le cas où le titre est
    // lu avant que loadData() n'ait migré.
    const raw = localStorage.getItem(_storageKey('title'))
      ?? localStorage.getItem('f1uno_title');
    if(!raw) return;
    const v = JSON.parse(raw);
    // Ancien format (objet complet) ET nouveau (id nu) : on ne retient
    // que l'identifiant, et seulement s'il ressemble à un identifiant.
    const id = typeof v === 'string' ? v : (v && typeof v.id === 'string' ? v.id : null);
    if(id && /^[a-z0-9_]{1,64}$/i.test(id)) selectedTitleId = id;
  } catch(e){}
}
function saveSelectedTitle(){
  if(selectedTitleId) localStorage.setItem(_storageKey('title'), JSON.stringify(selectedTitleId));
  else localStorage.removeItem(_storageKey('title'));
}

export function getUnlockedTitles(){
  loadManualBadges();
  const titles = [];
  // Per-badge titles
  // v3 : CHAQUE badge débloqué offre un titre — l'entrée explicite de
  // BADGE_TITLES garde la priorité, sinon le nom traduit du badge.
  // t() renvoie la CLÉ quand la traduction manque — on la traite comme
  // absente (sinon les nouveaux badges affichent « title.foil_15 »).
  const trOrEmpty = k => { const v = t(k); return v === k ? '' : v; };
  const titleOf = b => trOrEmpty('title.'+b.id) || BADGE_TITLES[b.id]
    || (window.__BADGE_T?.[b.id]?.[getLang()] || window.__BADGE_T?.[b.id]?.en || {}).name || b.name;
  AUTO_BADGES.forEach(b => {
    if(isAutoBadgeUnlocked(b))
      titles.push({id:b.id, name:titleOf(b), emoji:b.emoji, source:'badge'});
  });
  MANUAL_BADGES.forEach(b => {
    if(manualBadges[b.id])
      titles.push({id:b.id, name:titleOf(b), emoji:b.emoji, source:'badge'});
  });
  // Milestone titles
  const autoCount = AUTO_BADGES.filter(b=>isAutoBadgeUnlocked(b)).length;
  const manualCount = Object.values(manualBadges).filter(Boolean).length;
  const total = autoCount + manualCount;
  if(total >= 25) titles.push({...MILESTONE_TITLES[0], name:t('milestone.25_badges')||MILESTONE_TITLES[0].name, desc:t('milestone.25_badges_desc')||MILESTONE_TITLES[0].desc, source:'milestone'});
  if(total >= 50) titles.push({...MILESTONE_TITLES[1], name:t('milestone.50_badges')||MILESTONE_TITLES[1].name, desc:t('milestone.50_badges_desc')||MILESTONE_TITLES[1].desc, source:'milestone'});
  if(autoCount >= 25) titles.push({...MILESTONE_TITLES[2], name:t('milestone.all_auto')||MILESTONE_TITLES[2].name, desc:t('milestone.all_auto_desc')||MILESTONE_TITLES[2].desc, source:'milestone'});
  if(manualCount >= 25) titles.push({...MILESTONE_TITLES[3], name:t('milestone.all_manual')||MILESTONE_TITLES[3].name, desc:t('milestone.all_manual_desc')||MILESTONE_TITLES[3].desc, source:'milestone'});
  return titles;
}

export function selectTitle(titleObj){
  selectedTitleId = titleObj && titleObj.id ? titleObj.id : null;
  saveSelectedTitle();
  updateUserTitle();
}

export function updateUserTitle(){
  loadSelectedTitle();
  const unlocked = getUnlockedTitles();
  // Le titre affiché vient TOUJOURS de la liste débloquée, jamais du
  // localStorage : celui-ci ne fournit qu'un identifiant à retrouver.
  const chosen = selectedTitleId ? unlocked.find(t => t.id === selectedTitleId) : null;
  if(selectedTitleId && !chosen){ selectedTitleId = null; saveSelectedTitle(); }
  const active = chosen
    || (unlocked.length > 0 ? unlocked[0] : {id:'rookie',name:'Rookie',emoji:'🟡',source:'default'});

  // Regenerate name with current translation for active title
  if(active.source === 'badge' && active.id !== 'rookie'){
    { const v = t('title.'+active.id); if(v !== 'title.'+active.id) active.name = v; }
  } else if(active.source === 'milestone'){
    if(active.id === 'milestone_25_badges') active.name = t('milestone.25_badges') || active.name;
    else if(active.id === 'milestone_50_badges') active.name = t('milestone.50_badges') || active.name;
    else if(active.id === 'milestone_all_auto') active.name = t('milestone.all_auto') || active.name;
    else if(active.id === 'milestone_all_manual') active.name = t('milestone.all_manual') || active.name;
  }

  const color = active.color || (active.source==='milestone' ? '#FF6B35' : '#E8002D');
  // Header pill
  const ht = document.getElementById('headerTitle');
  if(ht) ht.innerHTML = `<span class="ht-icon">${active.emoji||active.icon||'🟡'}</span><span style="color:color-mix(in srgb, ${color} var(--ink-mix,100%), #000)">${active.name}</span>`;
  // Badges page card
  const uc = document.getElementById('userTitleCard');
  if(uc){
    const unlockedCount = unlocked.length;
    uc.innerHTML = `
      <span class="user-title-icon">${active.emoji||active.icon||'🟡'}</span>
      <span class="user-title-text" style="color:color-mix(in srgb, ${color} var(--ink-mix,100%), #000)">${active.name}</span>
      <span class="user-title-sub">${unlockedCount} ${t('b.titles_unlocked')||'titles unlocked'}</span>
      <div class="user-title-next" data-action="toggleTitlePicker">${t('b.choose')||'▼ Choose my title'}</div>
      <div class="title-picker" id="titlePicker" style="display:none"></div>`;
  }
}

export function toggleTitlePicker(){
  const picker = document.getElementById('titlePicker');
  if(!picker) return;
  if(picker.style.display !== 'none'){
    picker.style.display = 'none'; return;
  }
  const unlocked = getUnlockedTitles();
  loadSelectedTitle();
  const unlockedIds = new Set(unlocked.map(x => x.id));
  // Jalons (25/50 badges…) d'abord — hors échelle de difficulté
  let html = '<div class="title-picker-grid">';
  unlocked.filter(x => x.source === 'milestone').forEach(t => {
    const isActive = selectedTitleId === t.id;
    const color = t.color || '#E8002D';
    html += `<div class="title-pick${isActive?' active':''}" data-action="selectTitle" data-title-id="${t.id}" style="border-color:${isActive?color:'var(--border)'}">
      <span>${t.emoji || t.icon || '🏆'}</span><span style="color:color-mix(in srgb, ${color} var(--ink-mix,100%), #000)">${t.name}</span>
    </div>`;
  });
  // Puis TOUS les badges, du plus difficile au plus facile (nom en départage)
  const nameOf = b => (window.__BADGE_T?.[b.id]?.[getLang()] || window.__BADGE_T?.[b.id]?.en || {}).name || b.name;
  const all = [...AUTO_BADGES, ...MANUAL_BADGES]
    .map(b => ({ b, d: badgeDifficulty(b), nm: nameOf(b), un: unlockedIds.has(b.id) }))
    .sort((a, z) => z.d - a.d || a.nm.localeCompare(z.nm));
  all.forEach(({ b, d, nm, un }) => {
    const isActive = un && selectedTitleId === b.id;
    const diff = `<span class="tp-diff dl-${difficultyLabelKey(d).slice(7)}">${d}%</span>`;
    if(un){
      html += `<div class="title-pick${isActive?' active':''}" data-action="selectTitle" data-title-id="${b.id}">
        <span>${b.emoji}</span><span>${nm}</span>${diff}</div>`;
    } else {
      html += `<div class="title-pick tp-locked" aria-disabled="true">
        <span>${b.emoji}</span><span>${nm}</span>${diff}</div>`;
    }
  });
  html += '</div>';
  picker.innerHTML = html;
  picker.style.display = 'block';
}
