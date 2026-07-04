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
import { showToast } from './render.js';

export let manualBadges = {};        // { badgeId: true/false }
export let autoBadgeUnlocked = {};   // { badgeId: true } — persists once unlocked
export let _selectRemoveMode = false; // when true, clicking an auto badge removes it
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
    const s = localStorage.getItem(_storageKey('badges'));
    if(s) manualBadges = JSON.parse(s);
  } catch(e){ manualBadges = {}; }
  try {
    const a = localStorage.getItem(_storageKey('auto_badges'));
    if(a) autoBadgeUnlocked = JSON.parse(a);
  } catch(e){ autoBadgeUnlocked = {}; }
}
export function saveManualBadges(){ localStorage.setItem(_storageKey('badges'), JSON.stringify(manualBadges)); localStorage.setItem(_storageKey('auto_badges'), JSON.stringify(autoBadgeUnlocked)); }

// Check if auto badge is unlocked (current condition OR previously unlocked)
export function isAutoBadgeUnlocked(badge){
  const p = evaluateBadgeCondition(badge);
  const currently = p.cur >= p.max;
  if(currently && !autoBadgeUnlocked[badge.id]){
    autoBadgeUnlocked[badge.id] = true;
    saveManualBadges();
  }
  return !!autoBadgeUnlocked[badge.id];
}

export function removeAutoBadge(badgeId){
  if(autoBadgeUnlocked[badgeId]){
    delete autoBadgeUnlocked[badgeId];
    saveManualBadges();
    renderBadges();
    updateStats();
    showToast('Badge retiré');
  }
}

// Enter "remove badge" selection mode (triggered from the badges header button)
export function enterRemoveBadgeMode(){
  _selectRemoveMode = true;
  document.querySelectorAll('#autoBadgesGrid .badge-card.unlocked').forEach(c=>c.classList.add('select-remove'));
  showToast('Cliquez sur un badge débloqué pour le retirer');
}

export function toggleManualBadge(badgeId){
  const wasUnlocked = !!manualBadges[badgeId];
  manualBadges[badgeId] = !manualBadges[badgeId];
  saveManualBadges();
  renderBadges();
  if(!wasUnlocked && manualBadges[badgeId]){
    // Celebration effect — find the card and animate it
    setTimeout(()=>{
      const cards = document.querySelectorAll('#manualBadgesGrid .badge-card');
      cards.forEach(card => {
        const btn = card.querySelector('.badge-manual-btn');
        if(btn && btn.getAttribute('data-badge') === badgeId){
          card.classList.add('just-unlocked');
          card.classList.add('shimmer-active');
          // Spawn particles
          const particles = document.createElement('div');
          particles.className = 'badge-particles';
          const colors = ['#E8002D','#FF6B35','#FFD700','#34C759','#007AFF','#AF52DE'];
          for(let i=0;i<12;i++){
            const p = document.createElement('div');
            p.className = 'badge-particle';
            const angle = (Math.PI*2/12)*i;
            const dist = 40 + Math.random()*30;
            p.style.cssText = `left:50%;top:50%;background:${colors[i%colors.length]};--px:${Math.cos(angle)*dist}px;--py:${Math.sin(angle)*dist}px;animation-delay:${i*0.03}s;`;
            particles.appendChild(p);
          }
          card.appendChild(particles);
          // Glow
          const glow = document.createElement('div');
          glow.className = 'badge-glow';
          card.appendChild(glow);
          // Cleanup celebration
          setTimeout(()=>{
            card.classList.remove('just-unlocked');
            particles.remove();
            glow.remove();
          },1200);
          // Stop shimmer after 5s
          setTimeout(()=>{ card.classList.remove('shimmer-active'); },5000);
        }
      });
    },50);
    showToast('🏅 Badge débloqué !');
  } else {
    showToast('Badge retiré');
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

export function toggleBadgePreview(cardEl, badgeId){
  const existing = cardEl.querySelector('.badge-preview');
  if(existing){existing.remove();return;}
  // Close any other open previews
  document.querySelectorAll('.badge-preview').forEach(e=>e.remove());
  const cards = getBadgeCards(badgeId);
  if(!cards.length) return;
  const catMap = {pilote_all:true,reserve_all:true,director_all:true,gp_all:true,champ_all:true};
  const isCat = catMap[badgeId];
  const ownedCards = cards.filter(c=>c.owned);
  const missingCards = isCat ? cards.filter(c=>!c.owned) : [];
  let html = '<div class="badge-preview">';
  if(isCat){
    html += `<div class="badge-preview-title">✓ Possédées (${ownedCards.length})</div><div class="badge-preview-grid">`;
    ownedCards.forEach(c=>{html+=`<div class="badge-preview-chip owned">#${c.id} ${c.name}</div>`;});
    html += '</div>';
    if(missingCards.length){
      html += `<div class="badge-preview-title" style="margin-top:6px">✗ Manquantes (${missingCards.length})</div><div class="badge-preview-grid">`;
      missingCards.forEach(c=>{html+=`<div class="badge-preview-chip missing">#${c.id} ${c.name}</div>`;});
      html += '</div>';
    }
  } else {
    html += `<div class="badge-preview-title">Cartes contributives (${ownedCards.length})</div><div class="badge-preview-grid">`;
    cards.forEach(c=>{html+=`<div class="badge-preview-chip owned">#${c.id} ${c.name}</div>`;});
    html += '</div>';
  }
  html += '</div>';
  cardEl.insertAdjacentHTML('beforeend',html);
}

export function renderBadges(){
  loadManualBadges();
  const autoGrid = document.getElementById('autoBadgesGrid');
  const manualGrid = document.getElementById('manualBadgesGrid');
  if(!autoGrid || !manualGrid) return;

  let autoUnlocked = 0;
  let manualUnlocked = 0;

  // Helper: generate sparkle HTML for unlocked badges
  function sparkleHTML(){
    let s = '<div class="badge-sparkles">';
    for(let i=0;i<6;i++){
      const x = 10 + Math.random()*80;
      const y = 10 + Math.random()*80;
      const dur = (2 + Math.random()*2).toFixed(1);
      const delay = (Math.random()*3).toFixed(1);
      s += `<div class="badge-sparkle" style="left:${x}%;top:${y}%;--dur:${dur}s;--delay:${delay}s;"></div>`;
    }
    s += '</div>';
    return s;
  }

  // Auto badges
  autoGrid.innerHTML = '';
  AUTO_BADGES.forEach(b => {
    const p = evaluateBadgeCondition(b);
    const unlocked = isAutoBadgeUnlocked(b);
    if(unlocked) autoUnlocked++;
    const pct = Math.min(100, Math.round((p.cur/p.max)*100));
    const card = document.createElement('div');
    card.className = `badge-card ${unlocked ? 'unlocked' : 'locked'}`;
    card.innerHTML = `
      ${unlocked ? sparkleHTML() : ''}
      ${unlocked ? '<span class="badge-confetti">✓</span>' : ''}
      <div class="badge-card-top">
        <div class="badge-icon-wrap"><span class="badge-emoji">${b.emoji}</span></div>
        <div class="badge-info">
          <div class="badge-name">${(window.__BADGE_T?.[b.id]?.[getLang()]||window.__BADGE_T?.[b.id]?.en||{}).name||b.name}</div>
          <div class="badge-desc">${(window.__BADGE_T?.[b.id]?.[getLang()]||window.__BADGE_T?.[b.id]?.en||{}).desc||b.desc}</div>
        </div>
      </div>
      <div class="badge-prog-wrap"><div class="badge-prog-fill" style="width:${pct}%"></div></div>
      <div class="badge-prog-label"><span>${p.cur} / ${p.max}</span><span>${pct}%</span></div>
      <div class="badge-status">
        <span class="badge-status-tag auto">${t('b.auto_tag')}</span>
        <span class="badge-unlock-indicator ${unlocked ? 'unlocked' : 'locked'}">${unlocked ? t('b.status_unlocked') : t('b.status_locked')}</span>
      </div>`;
    card.classList.add('clickable');
    card.onclick=()=>{
      if(_selectRemoveMode && unlocked){
        removeAutoBadge(b.id);
        _selectRemoveMode = false;
        document.querySelectorAll('.badge-card').forEach(c=>c.classList.remove('select-remove'));
        return;
      }
      toggleBadgePreview(card,b.id);
    };
    autoGrid.appendChild(card);
    // Shimmer only on newly-unlocked auto badges (not seen before)
    if(unlocked && !_seenAutoBadges.has(b.id)){
      card.classList.add('shimmer-active');
      setTimeout(()=>{ card.classList.remove('shimmer-active'); },5000);
    }
  });

  // Manual badges
  manualGrid.innerHTML = '';
  MANUAL_BADGES.forEach(b => {
    const unlocked = !!manualBadges[b.id];
    if(unlocked) manualUnlocked++;
    const card = document.createElement('div');
    card.className = `badge-card ${unlocked ? 'unlocked' : 'locked'}`;
    card.innerHTML = `
      ${unlocked ? sparkleHTML() : ''}
      ${unlocked ? '<span class="badge-confetti">✓</span>' : ''}
      <div class="badge-card-top">
        <div class="badge-icon-wrap"><span class="badge-emoji">${b.emoji}</span></div>
        <div class="badge-info">
          <div class="badge-name">${(window.__BADGE_T?.[b.id]?.[getLang()]||window.__BADGE_T?.[b.id]?.en||{}).name||b.name}</div>
          <div class="badge-desc">${(window.__BADGE_T?.[b.id]?.[getLang()]||window.__BADGE_T?.[b.id]?.en||{}).desc||b.desc}</div>
        </div>
      </div>
      <div class="badge-status">
        <span class="badge-status-tag manual">${t('b.manual_tag')}</span>
        <span class="badge-unlock-indicator ${unlocked ? 'unlocked' : 'locked'}">${unlocked ? t('b.status_validated') : t('b.status_to_validate')}</span>
      </div>
      <button class="badge-manual-btn ${unlocked ? 'validated' : ''}" data-action="toggleManualBadge" data-badge="${b.id}">${unlocked ? t('b.status_validated') : t('b.validate_btn')}</button>`;
    manualGrid.appendChild(card);
  });

  // Update counters
  const totalUnlocked = autoUnlocked + manualUnlocked;
  const bpText = document.querySelector('.badges-progress-text');
  if(bpText) bpText.innerHTML = t('b.unlocked',{n:`<span id="badgesUnlockedCount">${totalUnlocked}</span>`});
  const el2 = document.getElementById('badgesProgressFill');
  if(el2) el2.style.width = Math.round((totalUnlocked/50)*100) + '%';
  const el3 = document.getElementById('autoBadgeCount');
  if(el3) el3.textContent = `${autoUnlocked}/25`;
  const el4 = document.getElementById('manualBadgeCount');
  if(el4) el4.textContent = `${manualUnlocked}/25`;
  const el5 = document.getElementById('badgeCountTab');
  if(el5) el5.textContent = `${totalUnlocked}/50`;
  updateUserTitle();

  // Mark all currently unlocked auto badges as seen
  AUTO_BADGES.forEach(b => {
    if(isAutoBadgeUnlocked(b)) _seenAutoBadges.add(b.id);
  });
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
