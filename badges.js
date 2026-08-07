/* ══════════════════════════════════════════════════════════
   BADGES SYSTEM — 50 badges (25 auto + 25 manual) + user titles
   ══════════════════════════════════════════════════════════ */
import { t, getLang } from './i18n.js';
import { CARDS_DB, CARD_TYPES, AUTO_BADGES, MANUAL_BADGES } from './data.js';
import {
  _storageKey, getTypeData,
  cardOwned, cardWishlist, cardDoubles, cardFavorite
} from './storage.js';
import { updateStats } from './stats.js';
import { showToast, switchView } from './render.js';
import { secureGet, secureSet } from './secure-store.js';

export let manualBadges = {};        // { badgeId: true/false }
export let autoBadgeUnlocked = {};   // { badgeId: true } — persists once unlocked
const _seenAutoBadges = new Set();    // auto badge IDs already displayed with shimmer

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
      if(tf === 'foil'){
        CARDS_DB.forEach(c => { c.types.forEach(t => { if(CARD_TYPES[t] && CARD_TYPES[t].foil){ const d=getTypeData(c.id,t); if(d.owned) n+=(d.qty||1); }}); });
      } else {
        CARDS_DB.forEach(c => { const d=getTypeData(c.id, tf); if(d.owned) n+=(d.qty||1); });
      }
      return {cur: Math.min(n, target), max: target};
    }
    default:
      return {cur:0, max:1};
  }
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
    ids:['first_card','collector_10','hunter_25','expert_50','master_75','legend_101'] },
  { id:'sets',     ico:'🧩', cls:'bf-sets',
    ids:['pilote_all','reserve_all','director_all','gp_all','champ_all'] },
  { id:'foils',    ico:'✦',  cls:'bf-foils',
    ids:['foil_5','nitro_1','wild_3','promo_1'] },
  { id:'colors',   ico:'🎨', cls:'bf-colors',
    ids:['blue_20','green_20','red_20','yellow_20'] },
  { id:'passion',  ico:'❤️', cls:'bf-passion',
    ids:['dreamer_5','ambitious_15','doubler_5','massive_50','fan_5','superfan_15'] },
  { id:'exp',      ico:'🎟️', cls:'bf-exp', manual:true, ids:null }, // = tous les manuels
];
export function familyBadges(fam){
  if(fam.manual) return MANUAL_BADGES;
  const known = new Set(FAMILIES.flatMap(f => f.ids || []));
  const list = fam.ids.map(id => AUTO_BADGES.find(b => b.id === id)).filter(Boolean);
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

// Le badge débloqué le plus « difficile » : la plus grande cible
// (101 cartes bat 20 bleues) — déterministe et explicable.
export function hardestUnlockedBadge(badges, evalFn, unlockedFn){
  let best = null, bestMax = -1;
  badges.forEach(b => {
    if(!unlockedFn(b)) return;
    const m = evalFn(b).max;
    if(m > bestMax){ best = b; bestMax = m; }
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
  let h = `<div class="bd-name">${b.emoji} ${tr.name || b.name}</div>
    <div class="bd-desc">${tr.desc || b.desc || ''}</div>`;
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
  </div>`;
}

let _heroWasAnimated = false;
export function renderBadges(opts = {}){
  loadManualBadges();
  const hero = document.getElementById('badgesHero');
  const next = document.getElementById('badgesNext');
  const fams = document.getElementById('badgesFams');
  if(!hero || !next || !fams) return;
  _openDetail = null;

  const autoUnlocked = AUTO_BADGES.filter(b => isAutoBadgeUnlocked(b)).length;
  const manualUnlocked = Object.values(manualBadges).filter(Boolean).length;
  const total = autoUnlocked + manualUnlocked;
  const TOTAL = AUTO_BADGES.length + MANUAL_BADGES.length;

  // ── Hero : anneau + compteur + titre + plus difficile + partage ──
  const C = 2 * Math.PI * 38;
  const hardest = hardestUnlockedBadge(AUTO_BADGES, evaluateBadgeCondition, isAutoBadgeUnlocked);
  hero.innerHTML = `
    <div class="bh-ring">
      <svg width="86" height="86" viewBox="0 0 86 86" aria-hidden="true">
        <circle class="bh-bg" cx="43" cy="43" r="38" fill="none" stroke-width="7"/>
        <circle class="bh-fg" id="bhFg" cx="43" cy="43" r="38" fill="none" stroke-width="7"
          stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - total / TOTAL)}"/>
      </svg>
      <div class="bh-num"><b id="bhCount">${total}</b><span>/ ${TOTAL}</span></div>
    </div>
    <div class="bh-right">
      <div class="bh-kicker">${t('b.title').replace('🏅 ','')}</div>
      <div class="user-title-wrap" id="userTitleCard"></div>
      ${hardest ? `<div class="bh-hardest">${t('b.hardest')} <b>${hardest.emoji} ${_bt(hardest).name || hardest.name}</b></div>` : ''}
    </div>
    <button class="bh-share" data-action="shareBadges" type="button" aria-label="${t('b.share')}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
    </button>`;

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
          <div class="bn-k">${nx.pinned ? '📌 ' + t('b.objective') : t('b.next_badge')}</div>
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
      h += `<div class="badge-ladder" role="list">`;
      list.forEach(b => {
        const unl = !!autoBadgeUnlocked[b.id];
        const p = evaluateBadgeCondition(b);
        const cur = !unl && p.cur > 0 && list.filter(x => !autoBadgeUnlocked[x.id])[0]?.id === b.id;
        h += `<div class="bl-rung ${unl ? 'done' : cur ? 'cur' : 'lock'}" data-action="toggleBadgeDetail" data-badge="${b.id}" role="listitem" tabindex="0">
          <div class="bl-dot">${b.emoji}</div><div class="bl-lbl">${p.max}</div></div>`;
      });
      h += `</div><div class="badge-detail" id="bd-${fam.id}"></div>`;
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
  const hardest = hardestUnlockedBadge(AUTO_BADGES, evaluateBadgeCondition, isAutoBadgeUnlocked);
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

let selectedTitle = null; // {id, name, icon?, color?, source:'badge'|'milestone'}

function loadSelectedTitle(){
  try{ const s=localStorage.getItem('f1uno_title'); if(s) selectedTitle=JSON.parse(s); }catch(e){}
}
function saveSelectedTitle(){ localStorage.setItem('f1uno_title',JSON.stringify(selectedTitle)); }

export function getUnlockedTitles(){
  loadManualBadges();
  const titles = [];
  // Per-badge titles
  AUTO_BADGES.forEach(b => {
    if(isAutoBadgeUnlocked(b) && BADGE_TITLES[b.id])
      titles.push({id:b.id, name:t('title.'+b.id)||BADGE_TITLES[b.id], emoji:b.emoji, source:'badge'});
  });
  MANUAL_BADGES.forEach(b => {
    if(!!manualBadges[b.id] && BADGE_TITLES[b.id])
      titles.push({id:b.id, name:t('title.'+b.id)||BADGE_TITLES[b.id], emoji:b.emoji, source:'badge'});
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
  selectedTitle = titleObj;
  saveSelectedTitle();
  updateUserTitle();
}

export function updateUserTitle(){
  loadSelectedTitle();
  const unlocked = getUnlockedTitles();
  // If selected title is no longer unlocked, reset
  if(selectedTitle && !unlocked.find(t=>t.id===selectedTitle.id)){
    selectedTitle = null;
    saveSelectedTitle();
  }
  // Default: first unlocked or "Rookie"
  const active = selectedTitle && unlocked.find(t=>t.id===selectedTitle.id)
    ? selectedTitle
    : (unlocked.length > 0 ? unlocked[0] : {id:'rookie',name:'Rookie',emoji:'🟡',source:'default'});

  // Regenerate name with current translation for active title
  if(active.source === 'badge' && active.id !== 'rookie'){
    active.name = t('title.'+active.id) || active.name;
  } else if(active.source === 'milestone'){
    if(active.id === 'milestone_25_badges') active.name = t('milestone.25_badges') || active.name;
    else if(active.id === 'milestone_50_badges') active.name = t('milestone.50_badges') || active.name;
    else if(active.id === 'milestone_all_auto') active.name = t('milestone.all_auto') || active.name;
    else if(active.id === 'milestone_all_manual') active.name = t('milestone.all_manual') || active.name;
  }

  const color = active.color || (active.source==='milestone' ? '#FF6B35' : '#E8002D');
  // Header pill
  const ht = document.getElementById('headerTitle');
  if(ht) ht.innerHTML = `<span class="ht-icon">${active.emoji||active.icon||'🟡'}</span><span style="color:${color}">${active.name}</span>`;
  // Badges page card
  const uc = document.getElementById('userTitleCard');
  if(uc){
    const unlockedCount = unlocked.length;
    uc.innerHTML = `
      <span class="user-title-icon">${active.emoji||active.icon||'🟡'}</span>
      <span class="user-title-text" style="color:${color}">${active.name}</span>
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
  let html = '<div class="title-picker-grid">';
  unlocked.forEach(t => {
    const isActive = selectedTitle && selectedTitle.id === t.id;
    const color = t.color || '#E8002D';
    const icon = t.emoji || t.icon || '🟡';
    html += `<div class="title-pick${isActive?' active':''}" data-action="selectTitle" data-title-id="${t.id}" style="border-color:${isActive?color:'var(--border)'}">
      <span>${icon}</span><span style="color:${color}">${t.name}</span>
    </div>`;
  });
  html += '</div>';
  picker.innerHTML = html;
  picker.style.display = 'block';
}
