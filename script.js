(function(){
'use strict';

console.log('script.js loaded successfully');

/* ══════════════════════════════════════════════════════════
   I18N
   ══════════════════════════════════════════════════════════ */
const LANGS = {en:'English',fr:'Français',es:'Español',zh:'中文',it:'Italiano',nl:'Nederlands',de:'Deutsch'};
function getLang(){ return localStorage.getItem('f1uno_lang')||'en'; }
function setLang(code){
  localStorage.setItem('f1uno_lang', code);
  applyLanguage();
}
function t(key, p={}){
  const d = (window.__T||{})[getLang()]||(window.__T||{}).en||{};
  const base = (window.__T||{}).en||{};
  let s = d[key]||base[key]||key;
  Object.keys(p).forEach(k=>{ s=s.replace('{'+k+'}',p[k]); });
  console.log('t() called:', key, p, 'result:', s);
  return s;
}
function applyLanguage(){
  const lang = getLang();
  
  // Update HTML lang attribute
  document.documentElement.lang = lang;
  
  // Update page title
  const titleEl = document.querySelector('title[data-i18n]');
  if(titleEl) titleEl.textContent = t(titleEl.getAttribute('data-i18n'));
  
  // Process all data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
  // Process all data-i18n-aria elements (aria-labels)
  document.querySelectorAll('[data-i18n-aria]').forEach(el=>{
    el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
  });
  // Search placeholder in header
  const si = document.getElementById('searchInput');
  if(si) si.placeholder = t('header.search');
  
  // Update displayedCount counter
  const displayedCount = document.getElementById('displayedCount');
  if(displayedCount) {
    const currentCount = document.querySelectorAll('.card').length;
    displayedCount.textContent = t('header.displayed',{n:currentCount});
  }
  
  // Re-render grid to update rarity translations
  applyFilters();
  
  // Re-render badges to update badge translations
  if(currentView === 'badges') renderBadges();
  
  // Sort select options
  const sel = document.getElementById('sidebarSortSel');
  if(sel){
    const sortKeys = ['number:sort.num','name:sort.name','rarity_desc:sort.rar_desc','rarity_asc:sort.rar_asc','category:sort.cat'];
    sortKeys.forEach(pair=>{
      const [val,key] = pair.split(':');
      const opt = sel.querySelector(`option[value="${val}"]`);
      if(opt) opt.textContent = t(key);
    });
  }
  // Re-render dynamic content
  if(typeof renderSidebar==='function') renderSidebar();
  if(typeof updateStats==='function') updateStats();
  if(typeof currentView!=='undefined'){
    if(currentView==='stats') renderStats();
    else if(currentView==='settings') renderSettings();
    else if(currentView==='badges') renderBadges();
  }
  // Re-render modal if open to update description translation and rarity
  if(currentCardId && document.getElementById('mo').classList.contains('open')){
    openModal(currentCardId);
  }
  // Re-render user title to update badge title translation
  if(typeof updateUserTitle==='function') updateUserTitle();
}

/* ══════════════════════════════════════════════════════════
   STORAGE VERSIONING & SEASON SUPPORT
   ══════════════════════════════════════════════════════════ */
const STORAGE_VERSION = 2;
let _currentSeason = 2025;

function _storageKey(name){
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

/* ══════════════════════════════════════════════════════════
   DATA — loaded from JSON files at runtime
   ══════════════════════════════════════════════════════════ */
let CARD_TYPES = {};
let TYPE_BADGE_RARITY = {};
let RARITY_KEYS = [];
let RARITY_ORDER = {};
let RARITIES = {};
let CATS = {};
let CIRCUIT_SVGS = {};

let DRIVER_NUMBERS = {};
let TEAM_COLORS = {};
let TEAM_LOGOS = {};
let DRIVER_IMAGES = {};

function driverNumberHTML(card){
  const d=DRIVER_NUMBERS[card.name];
  const img=DRIVER_IMAGES[card.name];
  if(!d && !img) return null;
  const col=TEAM_COLORS[card.team]||'#fff';
  const hasImg=!!img;
  const imgHtml=img?`<img class="driver-img" src="${img}" alt="${card.name}" crossorigin="anonymous" onerror="this.style.display='none';this.nextElementSibling&&this.parentElement.classList.add('no-img')"/>`:'';
  const numHtml=d?`<span class="dn-num ${d.cls}">${d.n}</span>`:'';
  return `<div class="driver-number${hasImg?'':' no-img'}" style="--tc:${col}">${imgHtml}${numHtml}</div>`;
}

let TEAM_LOGO_BG = {};
let TEAM_LOGO_NOEFFECTS = new Set([
  'Visa Cash App RB Formula One',
  'Oracle Red Bull Racing'
]);

function teamLogoHTML(team){
  const url=TEAM_LOGOS[team];
  if(!url) return null;
  const bg=TEAM_LOGO_BG[team]||'';
  const noEffects=TEAM_LOGO_NOEFFECTS.has(team);
  const vars=[];
  if(bg) vars.push(`--logo-bg:${bg}`);
  if(noEffects){ vars.push('--logo-blur:none'); vars.push('--logo-shadow:none'); vars.push('--logo-drop:none'); }
  const style=vars.length?` style="${vars.join(';')}"`:'';
  return `<div class="team-logo-wrap"${style}><img class="team-logo" src="${url}" alt="${team}" crossorigin="anonymous" onerror="this.outerHTML='<span style=font-size:40px>🎯</span>'"/></div>`;
}

function circuitSVG(cardId, size='card'){
  const c = CIRCUIT_SVGS[cardId];
  if(!c) return null;
  const drs = (c.d||[]).map(z=>`<line x1="${z.s.split(',')[0]}" y1="${z.s.split(',')[1]}" x2="${z.e.split(',')[0]}" y2="${z.e.split(',')[1]}" stroke="rgba(0,255,100,0.8)" stroke-width="10" stroke-linecap="round" opacity="0.6"/>`).join('');
  return `<svg class="circuit-svg" viewBox="0 0 500 500" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <path class="track-path" d="${c.p}" fill="none" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
    ${drs}
  </svg>`;
}

// Rareté de base par rôle (hors foil)
let ROLE_BASE_RARITY = {};

let CARDS_DB = [];


/* ══════════════════════════════════════════════════════════
   COLLECTION STATE
   coll[cardId][typeId] = { owned, wishlist, doubles, favorite, qty }
   ══════════════════════════════════════════════════════════ */
let coll = {};
let filters = {status:'all', category:null, type:null, rarity:null, year:null, search:'', champions:false};
let favoriteFirst = false;
let currentCardId = null;
let sectionStates = {status: true, categories: true, types: true, rarities: true, year: true}; // false = développé, true = condensé

function loadData(){
  _migrateStorage();
  try{ 
    const s=localStorage.getItem(_storageKey('owned')); 
    console.log('localStorage key:', _storageKey('owned'));
    console.log('localStorage value:', s);
    if(s) {
      coll=JSON.parse(s);
      console.log('Données chargées:', Object.keys(coll).length, 'cartes');
    } else {
      console.log('Aucune donnée trouvée dans localStorage');
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
function saveData(){ localStorage.setItem(_storageKey('owned'), JSON.stringify(coll)); }

function getTypeData(cardId, typeId){
  return (coll[cardId]&&coll[cardId][typeId]) || {owned:false,wishlist:false,doubles:false,favorite:false,qty:0};
}
function setTypeData(cardId, typeId, key, value){
  if(!coll[cardId]) coll[cardId]={};
  if(!coll[cardId][typeId]) coll[cardId][typeId]={owned:false,wishlist:false,doubles:false,favorite:false,qty:0};
  coll[cardId][typeId][key]=value;
  saveData(); updateStats();
}

// Card-level
function cardOwned(id){ const card=CARDS_DB.find(c=>c.id===id); return card.types.some(t=>getTypeData(id,t).owned); }
function cardWishlist(id){ const card=CARDS_DB.find(c=>c.id===id); return !cardOwned(id) && card.types.some(t=>getTypeData(id,t).wishlist); }
function cardDoubles(id){ const card=CARDS_DB.find(c=>c.id===id); return card.types.some(t=>getTypeData(id,t).doubles); }
function cardFavorite(id){ const card=CARDS_DB.find(c=>c.id===id); return card.types.some(t=>getTypeData(id,t).favorite); }
function cardMissing(id){ return !cardOwned(id); }
function cardTotalQty(id){ const card=CARDS_DB.find(c=>c.id===id); return card.types.reduce((s,t)=>s+(getTypeData(id,t).qty||0),0); }

function baseCardRarity(card){
  if(card.champion) return 'mythic';
  return ROLE_BASE_RARITY[card.category] || 'rare';
}

function variantRarity(card,typeId){
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
function cardRarity(card){
  const ownedTypes = card.types.filter(t=>getTypeData(card.id,t).owned && (getTypeData(card.id,t).qty||0)>0);
  if(ownedTypes.length===0) return baseCardRarity(card);
  return ownedTypes.reduce((best,t)=>{
    const r = variantRarity(card,t);
    return RARITY_ORDER[r] > RARITY_ORDER[best] ? r : best;
  }, baseCardRarity(card));
}

/* ══════════════════════════════════════════════════════════ STATS */
function updateStats(){
  const total=CARDS_DB.length;
  const owned=CARDS_DB.filter(c=>cardOwned(c.id)).length;
  const wish=CARDS_DB.filter(c=>cardWishlist(c.id)).length;
  const doubles=CARDS_DB.filter(c=>cardDoubles(c.id)).length;
  const missing=CARDS_DB.filter(c=>cardMissing(c.id)).length;
  const fav=CARDS_DB.filter(c=>cardFavorite(c.id)).length;
  
  // Calcul du total d'exemplaires (toutes les quantités de tous les types)
  let totalExemplaires = 0;
  CARDS_DB.forEach(card => {
    card.types.forEach(typeId => {
      const d = getTypeData(card.id, typeId);
      if (d.owned && d.qty > 0) {
        totalExemplaires += d.qty;
      }
    });
  });
  
  // Vérifications de sécurité avant de modifier le DOM
  const statOwned = document.getElementById('statOwned');
  if (statOwned) statOwned.textContent=`✓ ${owned} / ${total}`;
  
  // Mettre à jour la stat possédées dans le header
  const ownedCount = document.getElementById('ownedCount');
  if (ownedCount) ownedCount.textContent=`${owned} possédées`;
  
  const statWish = document.getElementById('statWish');
  if (statWish) statWish.textContent=`♡ ${wish} wishlist`;
  
  const statExemplaires = document.getElementById('statExemplaires');
  if (statExemplaires) statExemplaires.textContent=`📦 ${totalExemplaires} exemplaires`;
  
  const pct=Math.round((owned/total)*100);
  const statTotal = document.getElementById('statTotal');
  if (statTotal) statTotal.textContent=`${pct}%`;
  
  const cAll = document.getElementById('cAll');
  if (cAll) cAll.textContent=total;
  
  const cOwned = document.getElementById('cOwned');
  if (cOwned) cOwned.textContent=owned;
  
  const cWish = document.getElementById('cWish');
  if (cWish) cWish.textContent=wish;
  
  const cDouble = document.getElementById('cDouble');
  if (cDouble) cDouble.textContent=doubles;
  
  const cMissing = document.getElementById('cMissing');
  if (cMissing) cMissing.textContent=missing;
  
  const cFav = document.getElementById('cFav');
  if (cFav) cFav.textContent=fav;
  
  const progBar = document.getElementById('progBar');
  if (progBar) progBar.style.width=pct+'%';
  
  const progTxt = document.getElementById('progTxt');
  if (progTxt) progTxt.textContent=`${owned} / ${total} cartes`;
  
  const progPct = document.getElementById('progPct');
  if (progPct) progPct.textContent=`${pct}%`;
  
  // Mettre à jour les stats du header
  const wishCount = document.getElementById('wishCount');
  if (wishCount) wishCount.textContent=`${wish} wishlist`;
  
  const totalQty = document.getElementById('totalQty');
  if (totalQty) totalQty.textContent=`${totalExemplaires} exemplaires`;
  
  const champFilter = document.getElementById('champFilter');
  if (champFilter) {
    const champCount = CARDS_DB.filter(c=>c.champion).length;
    champFilter.textContent=`🏆 ${champCount} Champions`;
  }

  // Update badge tab count
  loadManualBadges();
  let autoUnlocked = 0;
  AUTO_BADGES.forEach(b => { if(isAutoBadgeUnlocked(b)) autoUnlocked++; });
  let manualUnlocked = Object.values(manualBadges).filter(v=>v).length;
  const badgeCountTab = document.getElementById('badgeCountTab');
  if(badgeCountTab) badgeCountTab.textContent = `${autoUnlocked+manualUnlocked}/50`;
  // Refresh active views
  if(currentView === 'badges') renderBadges();
  if(currentView === 'stats') renderStats();
  updateUserTitle();
}

/* ══════════════════════════════════════════════════════════ SIDEBAR */
function renderSidebar(){
  // Status - Floating sidebar uniquement
  const fsp=document.getElementById('sidebarStatusPills'); 
  if (fsp) {
    fsp.innerHTML='';
    const statuses = [
      {id:'all',label:t('status.all'),emoji:'📋'},
      {id:'owned',label:t('status.owned'),emoji:'✓'},
      {id:'wishlist',label:t('status.wishlist'),emoji:'⭐'},
      {id:'doubles',label:t('status.doubles'),emoji:'🔄'},
      {id:'missing',label:t('status.missing'),emoji:'✗'},
      {id:'favorite',label:t('status.fav'),emoji:'❤️'},
      {id:'retired',label:t('status.retired'),emoji:'🏁'}
    ];
    statuses.forEach(status => {
      const cnt = status.id === 'all' ? CARDS_DB.length :
                  status.id === 'owned' ? CARDS_DB.filter(c=>cardOwned(c.id)).length :
                  status.id === 'wishlist' ? CARDS_DB.filter(c=>cardWishlist(c.id)).length :
                  status.id === 'doubles' ? CARDS_DB.filter(c=>cardDoubles(c.id)).length :
                  status.id === 'missing' ? CARDS_DB.filter(c=>cardMissing(c.id)).length :
                  status.id === 'retired' ? CARDS_DB.filter(c=>c.retired).length :
                  CARDS_DB.filter(c=>cardFavorite(c.id)).length;
      const btn=document.createElement('button');
      btn.className='fpill'+(filters.status===status.id?' active':'');
      btn.innerHTML=`${status.emoji} ${status.label}<span class="fc">${cnt}</span>`;
      btn.onclick=()=>{filters.status=filters.status===status.id?'all':status.id;renderSidebar();applyFilters();};
      fsp.appendChild(btn);
    });
  }

  // Categories - Floating sidebar uniquement
  const fcp=document.getElementById('sidebarCatPills'); 
  if (fcp) {
    fcp.innerHTML='';
    Object.entries(CATS).forEach(([id,cat])=>{
      const cnt=CARDS_DB.filter(c=>c.category===id).length;
      const btn=document.createElement('button');
      btn.className='fpill'+(filters.category===id?' active':'');
      btn.innerHTML=`${cat.emoji} ${t('cat.'+id)}<span class="fc">${cnt}</span>`;
      btn.onclick=()=>{filters.category=filters.category===id?null:id;renderSidebar();applyFilters();};
      fcp.appendChild(btn);
    });
  }

  // Card types - Floating sidebar uniquement
  const ftp=document.getElementById('sidebarTypePills');
  if (ftp) {
    ftp.innerHTML='';
    Object.values(CARD_TYPES).forEach(ct=>{
      const r=RARITIES[TYPE_BADGE_RARITY[ct.id]||'rare']||{};
      const btn=document.createElement('button');
      btn.className='fpill'+(filters.type===ct.id?' active':'');
      btn.innerHTML=`<span style="font-size:14px">${ct.icon}</span>${t('type.'+ct.id)||ct.label}<span class="fc" style="color:${r.color||'#888'}">${'★'.repeat(r.stars||1)}</span>`;
      btn.onclick=()=>{filters.type=filters.type===ct.id?null:ct.id;renderSidebar();applyFilters();};
      ftp.appendChild(btn);
    });
  }

  // Rarities - Floating sidebar uniquement
  const frp=document.getElementById('sidebarRarPills');
  if (frp) {
    frp.innerHTML='';
    RARITY_KEYS.forEach(rid=>{
      const r=RARITIES[rid];
      if(!r) return;
      const btn=document.createElement('button');
      btn.className='fpill'+(filters.rarity===rid?' active':'');
      btn.innerHTML=`<span style="width:10px;height:10px;border-radius:50%;background:${r.color};display:inline-block;flex-shrink:0"></span>${t('rar.'+rid)}<span class="fc" style="color:${r.color}">${'★'.repeat(r.stars)}</span>`;
      btn.onclick=()=>{filters.rarity=filters.rarity===rid?null:rid;renderSidebar();applyFilters();};
      frp.appendChild(btn);
    });
  }

  // Years - Floating sidebar uniquement
  const fyp=document.getElementById('sidebarYearPills'); 
  if (fyp) {
    fyp.innerHTML='';
    const yearSet = new Set();
    CARDS_DB.forEach(c => { if(c.season) yearSet.add(String(c.season)); });
    if(yearSet.size === 0) yearSet.add('2025');
    const years = [...yearSet].sort((a,b) => b - a);
    years.forEach(year => {
      const cnt = CARDS_DB.filter(c => String(c.season) === year || (!c.season && year === '2025')).length;
      const btn=document.createElement('button');
      btn.className='fpill'+(filters.year===year?' active':'');
      btn.innerHTML=`📅 ${year}<span class="fc">${cnt}</span>`;
      btn.onclick=()=>{filters.year=filters.year===year?null:year;renderSidebar();applyFilters();};
      fyp.appendChild(btn);
    });
  }
}

/* ══════════════════════════════════════════════════════════ FILTERS */
function setStatus(s){
  filters.status=s;
  // Mettre à jour uniquement les boutons dans la sidebar flottante
  const floatingSidebar = document.getElementById('floating-sidebar');
  if (floatingSidebar) {
    floatingSidebar.querySelectorAll('.sbtn').forEach(b=>b.classList.toggle('active',b.dataset.f===s));
  }
  applyFilters();
}
function toggleYearFilter(year){
  filters.year=filters.year===year?null:year;
  renderSidebar();applyFilters();
}

function toggleSection(section) {
  sectionStates[section] = !sectionStates[section];
  const sectionElement = document.querySelector(`#${section}-toggle`).closest('.sidebar-section');
  const toggleBtn = document.getElementById(`${section}-toggle`);
  
  if (sectionStates[section]) {
    // Condenser
    sectionElement.classList.add('collapsed');
    toggleBtn.classList.add('collapsed');
    toggleBtn.textContent = '▶';
  } else {
    // Développer
    sectionElement.classList.remove('collapsed');
    toggleBtn.classList.remove('collapsed');
    toggleBtn.textContent = '▼';
  }
}

function resetFilters(){
  filters={status:'all',category:null,type:null,rarity:null,year:null,search:'',champions:false};
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value='';
  const sidebarSearchInput = document.getElementById('sidebarSearchInput');
  if (sidebarSearchInput) sidebarSearchInput.value='';
  const statChampions = document.getElementById('statChampions');
  if (statChampions) statChampions.classList.remove('active');
  const sidebarChampFilter = document.getElementById('sidebarChampFilter');
  if (sidebarChampFilter) sidebarChampFilter.classList.remove('active');
  
  // Réinitialiser les états On/Off
  const sidebarFavToggleState = document.getElementById('sidebarFavToggleState');
  if (sidebarFavToggleState) sidebarFavToggleState.textContent = t('fav.off');
  const sidebarChampState = document.getElementById('sidebarChampState');
  if (sidebarChampState) sidebarChampState.textContent = t('fav.off');
  
  // Réinitialiser le filtre year
  const yearPills = document.querySelectorAll('[data-year]');
  yearPills.forEach(pill => pill.classList.remove('active'));
  
  // Mettre à jour uniquement les boutons dans la sidebar flottante
  const floatingSidebar = document.getElementById('floating-sidebar');
  if (floatingSidebar) {
    floatingSidebar.querySelectorAll('.sbtn').forEach(b=>b.classList.toggle('active',b.dataset.f==='all'));
  }
  
  // Réinitialiser le tri
  const sortSel = document.getElementById('sortSel');
  const sidebarSortSel = document.getElementById('sidebarSortSel');
  if (sortSel) sortSel.value = 'number';
  if (sidebarSortSel) sidebarSortSel.value = 'number';
  
  renderSidebar(); applyFilters();
}

function toggleChampions(){
  filters.champions = !filters.champions;
  const btn = document.getElementById('statChampions');
  const sidebarBtn = document.getElementById('sidebarChampFilter');
  
  if(btn){
    if(filters.champions){
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  }
  
  if(sidebarBtn){
    if(filters.champions){
      sidebarBtn.classList.add('active');
    } else {
      sidebarBtn.classList.remove('active');
    }
  }
  
  applyFilters();
}

function toggleChampionFilter(){
  filters.champions = !filters.champions;
  const btn = document.getElementById('sidebarChampFilter');
  const stateEl = document.getElementById('sidebarChampState');
  if(stateEl) stateEl.textContent = filters.champions ? t('fav.on') : t('fav.off');
  if(btn) btn.classList.toggle('active', filters.champions);
  applyFilters();
}

function toggleTheme(){
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', newTheme);
  const loginThemeIcon = document.getElementById('loginThemeIcon');
  if (loginThemeIcon) loginThemeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
  // Sync settings toggle if visible
  const settingsToggle = document.querySelector('#settingsView .setv-toggle');
  if(settingsToggle) settingsToggle.classList.toggle('on', newTheme === 'dark');
  localStorage.setItem('f1uno_theme', newTheme);
}

function toggleFavoriteFirst(){
  favoriteFirst = !favoriteFirst;
  const stateEl = document.getElementById('favToggleState');
  const sidebarStateEl = document.getElementById('sidebarFavToggleState');
  const sidebarBtn = document.getElementById('sidebarFavToggleBtn');
  if(stateEl) stateEl.textContent = favoriteFirst ? t('fav.on') : t('fav.off');
  if(sidebarStateEl) sidebarStateEl.textContent = favoriteFirst ? t('fav.on') : t('fav.off');
  if(sidebarBtn) sidebarBtn.classList.toggle('active', favoriteFirst);
  applyFilters();
}

function applyFilters(){
  let result=[...CARDS_DB];
  const q=filters.search.toLowerCase().trim();
  if(q) result=result.filter(c=>c.name.toLowerCase().includes(q)||c.id.includes(q)||('#'+c.id).includes(q));
  if(filters.status==='owned') result=result.filter(c=>cardOwned(c.id));
  else if(filters.status==='wishlist') result=result.filter(c=>cardWishlist(c.id));
  else if(filters.status==='doubles') result=result.filter(c=>cardDoubles(c.id));
  else if(filters.status==='missing') result=result.filter(c=>cardMissing(c.id));
  else if(filters.status==='favorite') result=result.filter(c=>cardFavorite(c.id));
  else if(filters.status==='retired') result=result.filter(c=>c.retired);
  if(filters.champions) result=result.filter(c=>c.champion);
  if(filters.category) result=result.filter(c=>c.category===filters.category);
  if(filters.type) result=result.filter(c=>{
    const typeData = getTypeData(c.id, filters.type);
    return typeData.owned && typeData.qty > 0;
  });
  if(filters.rarity){
    result=result.filter(c=>{
      const r=cardRarity(c);
      return r===filters.rarity;
    });
  }
  if(filters.year){
    result=result.filter(c=>filters.year === '2025' ? (c.season===2025||!c.season) : (String(c.season)===filters.year));
  }

  // Synchroniser le tri entre les deux sidebars
  const sortSel = document.getElementById('sortSel');
  const sidebarSortSel = document.getElementById('sidebarSortSel');
  let sortValue = 'number';
  
  if (sortSel && sortSel.value) {
    sortValue = sortSel.value;
    if (sidebarSortSel) sidebarSortSel.value = sortValue;
  } else if (sidebarSortSel && sidebarSortSel.value) {
    sortValue = sidebarSortSel.value;
    if (sortSel) sortSel.value = sortValue;
  }

  const sort=sortValue;
  const ro=RARITY_ORDER;
  result.sort((a,b)=>{
    if(sort==='name') return a.name.localeCompare(b.name);
    if(sort==='rarity_desc') return ro[cardRarity(b)]-ro[cardRarity(a)];
    if(sort==='rarity_asc') return ro[cardRarity(a)]-ro[cardRarity(b)];
    if(sort==='category') return a.category.localeCompare(b.category);
    return a.id.localeCompare(b.id);
  });

  // Option: favoris pin
  if(favoriteFirst){
    result.sort((a,b)=>{
      const fa = cardFavorite(a.id)?1:0;
      const fb = cardFavorite(b.id)?1:0;
      if(fa!==fb) return fb-fa; // 1 avant 0
      return 0;
    });
  }

  renderGrid(result);
  const label={all:'Toutes les cartes',owned:'Possédées',wishlist:'Wishlist',doubles:'En double',missing:'Manquantes',favorite:'Favoris'}[filters.status];
  
  // Mettre à jour le compteur dans le header (si l'élément existe)
  const resCnt = document.getElementById('resCnt');
  if (resCnt) resCnt.innerHTML=`${label} · <span>${result.length}</span>`;
  
  // Mettre à jour le compteur de cartes affichées
  const displayedCount = document.getElementById('displayedCount');
  if (displayedCount) {
    displayedCount.textContent = t('header.displayed',{n:result.length});
  }
}

/* ══════════════════════════════════════════════════════════ GRID */
const catEmoji=id=>CATS[id]?.emoji||'🃏';

function bestOwnedType(card){
  const owned=card.types.filter(t=>{
    const d=getTypeData(card.id,t);
    return d.owned && (d.qty||0)>0;
  });
  if(owned.length===0) return null;
  return owned.reduce((best,t)=>{
    const rBest=variantRarity(card,best);
    const rT=variantRarity(card,t);
    const qtyBest=getTypeData(card.id,best).qty||0;
    const qtyT=getTypeData(card.id,t).qty||0;
    // Higher rarity wins
    if(RARITY_ORDER[rT]!==RARITY_ORDER[rBest]){
      return RARITY_ORDER[rT]>RARITY_ORDER[rBest]?t:best;
    }
    // Same rarity: higher quantity wins, keep current if equal
    return qtyT>qtyBest?t:best;
  });
}

function defaultBaseType(card){
  // On force un type non-foil pour éviter l'effet lumineux si tu n'as pas sélectionné de foil
  return card.types.find(t=>CARD_TYPES[t] && !CARD_TYPES[t].foil) || card.types[0];
}

function renderGrid(cards){
  const grid=document.getElementById('cardGrid');
  const appWrapper = document.getElementById('app-wrapper');
  const loginScreen = document.getElementById('login-screen');
  console.log('login-screen element:', loginScreen);
  console.log('login-screen display:', loginScreen ? loginScreen.style.display : 'N/A');
  console.log('app-wrapper element:', appWrapper);
  console.log('app-wrapper display:', appWrapper ? appWrapper.style.display : 'N/A');
  console.log('app-wrapper visibility:', appWrapper ? window.getComputedStyle(appWrapper).visibility : 'N/A');
  console.log('app-wrapper height:', appWrapper ? appWrapper.offsetHeight : 'N/A');
  console.log('cardGrid element:', grid);
  console.log('cardGrid display:', grid ? grid.style.display : 'N/A');
  console.log('cardGrid visibility:', grid ? window.getComputedStyle(grid).visibility : 'N/A');
  if(grid) {
    console.log('cardGrid parent:', grid.parentElement);
    console.log('cardGrid parent display:', grid.parentElement ? grid.parentElement.style.display : 'N/A');
    console.log('cardGrid parent height:', grid.parentElement ? grid.parentElement.offsetHeight : 'N/A');
    // Force display grid and parent
    grid.style.display = 'grid';
    grid.style.visibility = 'visible';
    grid.style.opacity = '1';
    if(grid.parentElement) {
      grid.parentElement.style.display = 'block';
      grid.parentElement.style.visibility = 'visible';
    }
  }
  grid.innerHTML='';
  console.log('renderGrid called with', cards.length, 'cards');
  if(!cards.length){
    grid.innerHTML='<div class="empty"><div class="ei">🔍</div><p>Aucune carte ne correspond à vos filtres.</p></div>';
    return;
  }

  console.log('Starting to render cards...');
  let renderedCount = 0;
  cards.forEach((card, index)=>{
    console.log('Rendering card', index, ':', card.id, card.name);
    const isOwned=cardOwned(card.id);
    const isWish=cardWishlist(card.id);
    const isFav=cardFavorite(card.id);
    const qty=cardTotalQty(card.id);
    renderedCount++;
    console.log('Card', index, 'isOwned:', isOwned, 'isWish:', isWish, 'isFav:', isFav, 'qty:', qty);
    const bestType=bestOwnedType(card);
    const displayType=bestType||defaultBaseType(card);
    const ct=CARD_TYPES[displayType];
    const rarity=RARITIES[cardRarity(card)];

    // Bar color from card type (neutre si aucune variante sélectionnée)
    const barColor=bestType?ct.color:'rgba(0,0,0,0.06)';

    const el=document.createElement('div');
    let cardClass='card'+(isOwned?' has-owned':'')+(isWish?' has-wishlist':'')+(isFav?' has-favorite':'');
    // si la meilleure variante possédée est foil, on applique aussi le fond foil à toute la carte
    if(bestType && CARD_TYPES[bestType] && CARD_TYPES[bestType].foil){
      cardClass+=` ${CARD_TYPES[bestType].css}`;
    }
    el.className=cardClass;
    el.onclick=e=>{
      if(!e.target.closest('.schip')&&!e.target.closest('.qbtn')) openModal(card.id);
    };

    // Owned types summary
    const ownedTypes=card.types.filter(t=>getTypeData(card.id,t).owned);
    const ownedSummary=ownedTypes.map(t=>{
      const ctt=CARD_TYPES[t];
      let cls='';
      if(t==='blue'||t==='blue_foil') cls='blue';
      else if(t==='green'||t==='green_foil') cls='green';
      else if(t==='red'||t==='red_foil') cls='red';
      else if(t==='yellow'||t==='yellow_foil') cls='yellow';
      else if(t.includes('foil')) cls='foil';
      if(t==='nitro_foil') cls='nitro';
      if(t==='promo_blue' || t==='promo_green' || t==='promo_red' || t==='promo_yellow') cls='promo';
      const d=getTypeData(card.id,t);
      return `<span class="owned-tag ${cls}">${ctt.icon}${d.qty>1?' ×'+d.qty:''}</span>`;
    }).join('');

    const footerStyle = bestType && CARD_TYPES[bestType] && CARD_TYPES[bestType].foil
      ? ` style="background:${ct.color}22;border-top:1px solid ${ct.color}55;"`
      : '';

    el.innerHTML=`
      <div class="card-visual ${bestType?ct.css:''}${!isOwned?' not-owned':''}">
        ${card.champion?'<span class="crown">👑</span>':''}
        ${card.category==='reserve'?'<span class="replacement-icon">🔄</span>':''}
        ${card.category==='gp' && circuitSVG(card.id,'card') ? circuitSVG(card.id,'card') : card.category==='pilote' && driverNumberHTML(card) ? driverNumberHTML(card) : (card.category==='directeur' || card.category==='reserve') && teamLogoHTML(card.team) ? teamLogoHTML(card.team) : `<span style="font-size:40px">${catEmoji(card.category)}</span>`}
      </div>
      <div class="card-body">
        <div class="card-num">#${card.id} ${card.champion?'· 👑':''}</div>
        <div class="card-name">${card.name} ${card.category==='pilote'?card.nationality||'':''} ${card.retired?`<span class="retired-badge">${t('m.retired')}</span>`:''}</div>
        <div class="card-year">${card.season||2025}</div>
        <div class="card-team">${card.team||''}</div>
        <div class="card-rarity-row">
          <span class="card-rarity" style="background:${rarity.color}20;color:${rarity.color}">${t('rar.'+cardRarity(card))} ${'★'.repeat(rarity.stars)}</span>
          <div class="status-chips">
            <div class="schip${isWish?' on':''}" data-s="wishlist" data-action="quickToggle" data-card="${card.id}" data-status="wishlist" title="Wishlist">⭐</div>
            <div class="schip${isFav?' on':''}" data-s="favorite" data-action="quickToggle" data-card="${card.id}" data-status="favorite" title="Favori">❤️</div>
          </div>
        </div>
        ${ownedSummary?`<div class="card-owned-summary">${ownedSummary}</div>`:''}
      </div>
    `;

    grid.appendChild(el);
  });
  console.log('Finished rendering', renderedCount, 'cards');
  if(renderedCount > 0) {
    const firstCard = grid.querySelector('.card');
    if(firstCard) {
      console.log('First card computed styles:', window.getComputedStyle(firstCard));
      console.log('First card display:', window.getComputedStyle(firstCard).display);
      console.log('First card visibility:', window.getComputedStyle(firstCard).visibility);
      console.log('First card opacity:', window.getComputedStyle(firstCard).opacity);
      console.log('First card height:', firstCard.offsetHeight);
      console.log('First card z-index:', window.getComputedStyle(firstCard).zIndex);
      console.log('First card position:', window.getComputedStyle(firstCard).position);
      console.log('First card top:', window.getComputedStyle(firstCard).top);
      console.log('First card left:', window.getComputedStyle(firstCard).left);
      console.log('Grid overflow:', window.getComputedStyle(grid).overflow);
      console.log('Grid position:', window.getComputedStyle(grid).position);
    }
  }
}

/* Quick toggle: applies to the FIRST type of the card (or opens modal for more control) */
function quickToggle(cardId, status, e){
  if(e) e.stopPropagation();
  const card=CARDS_DB.find(c=>c.id===cardId);
  const firstType=card.types[0];
  const d=getTypeData(cardId, firstType);
  const newVal=!d[status];
  if(status==='wishlist'&&newVal&&cardOwned(cardId)){showToast('Déjà possédée !');return;}
  setTypeData(cardId, firstType, status, newVal);
  if(status==='owned'&&newVal){ setTypeData(cardId,firstType,'qty',Math.max(1,d.qty||0)); setTypeData(cardId,firstType,'wishlist',false); }
  if(status==='owned'&&!newVal){ setTypeData(cardId,firstType,'qty',0); setTypeData(cardId,firstType,'doubles',false); }
  applyFilters();
  showToast(newVal?'✓ Mis à jour':'Retiré');
}

function quickQty(cardId, delta, e){
  if(e) e.stopPropagation();
  const card=CARDS_DB.find(c=>c.id===cardId);
  const firstType=card.types[0];
  const d=getTypeData(cardId, firstType);
  const newQty=Math.max(0,(d.qty||0)+delta);
  setTypeData(cardId, firstType, 'qty', newQty);
  if(newQty>0) setTypeData(cardId, firstType, 'owned', true);
  if(newQty>1) setTypeData(cardId, firstType, 'doubles', true);
  if(newQty<=1) setTypeData(cardId, firstType, 'doubles', false);
  if(newQty===0){ setTypeData(cardId, firstType, 'owned', false); setTypeData(cardId, firstType, 'doubles', false); }
  updateStats(); applyFilters();
}

/* ══════════════════════════════════════════════════════════ SEARCH */
let searchInput, searchDd;
let _searchTimer = null;

// Debounce helper
function debounce(fn, ms){
  let t;
  return function(...args){ clearTimeout(t); t = setTimeout(()=>fn.apply(this,args), ms); };
}

function _handleSearch(value, otherInput){
  filters.search = value;
  if(otherInput) otherInput.value = value;

  const q = value.toLowerCase().trim();
  if(q.length > 0){
    const matches = [];
    for(const c of CARDS_DB){
      if(c.name.toLowerCase().includes(q)||c.id.includes(q)||('#'+c.id).includes(q)){
        matches.push(c); if(matches.length>=12) break;
      }
    }
    searchDd.innerHTML = matches.map(c=>{
      const rar = cardRarity(c);
      const rarData = RARITIES[rar] || {};
      return `<div class="sr-item" data-action="selectCard" data-card="${c.id}">
        <span class="sr-num">#${c.id}</span>
        <span class="sr-name">${catEmoji(c.category)} ${c.name}</span>
        <span class="sr-sub" style="color:${rarData.color||'var(--tx3)'}">${t('rar.'+rar)||rarData.label||rar}</span>
      </div>`;
    }).join('') || '<div class="sr-item"><span class="sr-name" style="color:var(--tx3)">Aucun résultat</span></div>';
    searchDd.classList.add('open');
  } else {
    searchDd.classList.remove('open');
  }
  applyFilters();
}

function initSearch() {
  searchInput = document.getElementById('searchInput');
  searchDd = document.getElementById('searchDD');
  const sidebarSearchInput = document.getElementById('sidebarSearchInput');

  const debouncedMain = debounce(()=>_handleSearch(searchInput.value, sidebarSearchInput), 200);
  const debouncedSidebar = debounce(()=>_handleSearch(sidebarSearchInput.value, searchInput), 200);

  if(searchInput) searchInput.addEventListener('input', debouncedMain);
  if(sidebarSearchInput) sidebarSearchInput.addEventListener('input', debouncedSidebar);
}

function selectCard(id){
  const searchDd = document.getElementById('searchDD');
  if (searchDd) searchDd.classList.remove('open');
  
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.value=''; 
    filters.search='';
  }
  
  openModal(id); 
  applyFilters();
}
document.addEventListener('click',e=>{ 
  const searchDd = document.getElementById('searchDD');
  if (searchDd && !e.target.closest('.search-wrap')) {
    searchDd.classList.remove('open'); 
  }
});

/* ══════════════════════════════════════════════════════════ MODAL */
function openModal(id){
  const card=CARDS_DB.find(c=>c.id===id);
  if(!card) return;
  currentCardId=id;

  const bestType=bestOwnedType(card);
  const vis=document.getElementById('moVis');
  let ct=null;
  if(bestType){
    ct=CARD_TYPES[bestType];
    const modalCss=ct.css.replace(/_foil$/, '').replace(/_foil(?=\s|$)/,'');
    vis.className=`modal-visual ${bestType==='wild_foil'?ct.css:(ct.foil?modalCss:ct.css)}`;
  } else {
    vis.className='modal-visual not-owned';
  }
  const rarity=RARITIES[cardRarity(card)];

  document.getElementById('moEmoji').innerHTML = card.image ? `<img src="${card.image}" alt="${card.name}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--r-xl) var(--r-xl) 0 0;">` : (card.category==='gp' && circuitSVG(card.id,'modal') ? circuitSVG(card.id,'modal') : card.category==='pilote' && driverNumberHTML(card) ? driverNumberHTML(card) : (card.category==='directeur' || card.category==='reserve') && teamLogoHTML(card.team) ? teamLogoHTML(card.team) : catEmoji(card.category));
  document.getElementById('moNum').textContent=`#${card.id} · ${CATS[card.category]?.label||card.category}`;
  document.getElementById('moName').textContent=card.name + (card.category==='pilote'?` ${card.nationality||''}`:'');
  document.getElementById('moTeam').textContent=card.team||'';

  // Tags
  const tagsEl=document.getElementById('moTags'); tagsEl.innerHTML='';
  const addTag=(cls,txt)=>{const s=document.createElement('span');s.className=`mtag ${cls}`;s.textContent=txt;tagsEl.appendChild(s);};
  if(card.champion) addTag('champion',`👑 Champion ${card.championYears.join(', ')}`);
  const tagMap={legend:'⭐ Légende',fan_favorite:'❤️ Fan Favorite',rising_star:'🌟 Rising Star',top_driver:'🎯 Top Driver',legendary:'🔱 Légendaire',prestige:'💫 Prestige',night_race:'🌙 Nuit',high_speed:'⚡ Vitesse'};
  (card.tags||[]).forEach(t=>{if(tagMap[t]) addTag(t,tagMap[t]);});
  addTag('',`${'★'.repeat(rarity.stars)} ${t('rar.'+cardRarity(card))||rarity.label}`);

  document.getElementById('moDesc').textContent = (typeof getCardDesc==='function'?getCardDesc(card.name):'')||card.description||'';

  document.getElementById('moInfo').innerHTML=`
    <div class="mib"><div class="mib-l">${t('mo.card')||'Card'}</div><div class="mib-v">#${card.id}</div></div>
    <div class="mib"><div class="mib-l">${t('mo.category')||'Category'}</div><div class="mib-v">${catEmoji(card.category)} ${t('cat.'+card.category)||CATS[card.category]?.label||''}</div></div>
    <div class="mib"><div class="mib-l">${t('mo.types_avail')||'Types'}</div><div class="mib-v">${card.types.length} type(s)</div></div>
    <div class="mib"><div class="mib-l">${t('mo.total_copies')||'Total copies'}</div><div class="mib-v" style="color:var(--red)">${cardTotalQty(id)}</div></div>
  `;

  renderModalTypes(card);
  document.getElementById('mo').classList.add('open');
}

function renderModalTypes(card){
  const grid=document.getElementById('moTypeRows');
  grid.innerHTML='';
  grid.className='mo-type-grid';

  const typeSet=new Set(card.types);

  const COLS = ['blue','green','red','yellow'];
  const BASE_FOIL_MAP = {blue:'blue_foil',green:'green_foil',red:'red_foil',yellow:'yellow_foil'};
  const SPECIALS = ['blue_red_foil','green_yellow_foil','nitro_foil','wild_foil','promo_blue','promo_green','promo_red','promo_yellow'];

  function makeCell(typeId){
    const ct=CARD_TYPES[typeId];
    const r=RARITIES[variantRarity(card,typeId)];
    const d=getTypeData(card.id, typeId);
    const qty=d.qty||0;
    const cell=document.createElement('div');
    cell.className=`mo-type-cell${qty>0?' has-qty':''}`;
    cell.innerHTML=`
      <div class="mo-cell-icon" style="background:${ct.color}20;border:1.5px solid ${ct.color}40;">${ct.icon}</div>
      <div class="mo-cell-label">${ct.label}</div>
      <div class="mo-qty-wrap">
        <button class="mqbtn" data-action="changeMoQty" data-card="${card.id}" data-type="${typeId}" data-delta="-1">−</button>
        <span class="mqval" id="mqv-${card.id}-${typeId}">${qty}</span>
        <button class="mqbtn" data-action="changeMoQty" data-card="${card.id}" data-type="${typeId}" data-delta="1">+</button>
      </div>`;
    return cell;
  }

  function makeEmpty(){
    const cell=document.createElement('div');
    cell.className='mo-type-cell empty';
    return cell;
  }

  // Row 1: Base types — always 4 columns with empties
  const hasBase = COLS.some(c=>typeSet.has(c));
  if(hasBase){
    const label=document.createElement('div');
    label.className='mo-grid-row-label';
    label.textContent='Base';
    grid.appendChild(label);
    COLS.forEach(c=>{
      if(typeSet.has(c)) grid.appendChild(makeCell(c));
      else grid.appendChild(makeEmpty());
    });
  }

  // Row 2: Base foil types — always 4 columns aligned under base, with empties
  const hasFoil = COLS.some(c=>typeSet.has(BASE_FOIL_MAP[c]));
  if(hasFoil){
    const label=document.createElement('div');
    label.className='mo-grid-row-label';
    label.textContent='Foil';
    grid.appendChild(label);
    COLS.forEach(c=>{
      const fid=BASE_FOIL_MAP[c];
      if(typeSet.has(fid)) grid.appendChild(makeCell(fid));
      else grid.appendChild(makeEmpty());
    });
  }

  // Row 3: Special types — fill 4 columns, promo spans all 4
  const cardSpecials=SPECIALS.filter(s=>typeSet.has(s));
  if(cardSpecials.length){
    const label=document.createElement('div');
    label.className='mo-grid-row-label';
    label.textContent='Spécial';
    grid.appendChild(label);
    const others=cardSpecials.filter(s=>s!=='promo');
    others.forEach(s=>grid.appendChild(makeCell(s)));
    // Fill remaining slots to complete the row
    const remaining = (4 - others.length % 4) % 4;
    for(let i=0;i<remaining;i++) grid.appendChild(makeEmpty());
    // Promo on its own full-width row below
    if(cardSpecials.includes('promo')){
      grid.appendChild(makeCell('promo'));
    }
  }
}

function toggleMoType(cardId, typeId, status){
  const d=getTypeData(cardId,typeId);
  const newVal=!d[status];
  if(status==='wishlist'&&newVal&&cardOwned(cardId)){showToast('Déjà possédée !');return;}
  setTypeData(cardId,typeId,status,newVal);
  if(status==='owned'&&newVal){ setTypeData(cardId,typeId,'qty',Math.max(1,d.qty||0)); setTypeData(cardId,typeId,'wishlist',false); }
  if(status==='owned'&&!newVal){ setTypeData(cardId,typeId,'qty',0); setTypeData(cardId,typeId,'doubles',false); }
  // update modal visual
  const card=CARDS_DB.find(c=>c.id===cardId);
  renderModalTypes(card);
  // update header rarity based on best owned
  const best=bestOwnedType(card);
  const vis=document.getElementById('moVis');
  if(best){
    const ct=CARD_TYPES[best];
    const modalCss=ct.css.replace(/_foil$/, '').replace(/_foil(?=\s|$)/,'');
    vis.className=`modal-visual ${best==='wild_foil'?ct.css:(ct.foil?modalCss:ct.css)}`;
  }else{
    vis.className='modal-visual not-owned';
  }
  applyFilters();
  showToast(newVal?'✓ Mis à jour':'Retiré');
}

function changeMoQty(cardId, typeId, delta){
  const d=getTypeData(cardId,typeId);
  const newQty=Math.max(0,(d.qty||0)+delta);
  setTypeData(cardId,typeId,'qty',newQty);
  if(newQty>0) setTypeData(cardId,typeId,'owned',true);
  if(newQty>1) setTypeData(cardId,typeId,'doubles',true);
  if(newQty<=1) setTypeData(cardId,typeId,'doubles',false);
  if(newQty===0){ setTypeData(cardId,typeId,'owned',false); setTypeData(cardId,typeId,'doubles',false); }
  const el=document.getElementById(`mqv-${cardId}-${typeId}`);
  if(el) el.textContent=newQty;
  // refresh total in moInfo
  document.querySelector('#moInfo .mib:last-child .mib-v').textContent=cardTotalQty(cardId);
  const card=CARDS_DB.find(c=>c.id===cardId);
  renderModalTypes(card);
  // update modal visual based on best owned
  const best=bestOwnedType(card);
  const vis=document.getElementById('moVis');
  if(best){
    const ct=CARD_TYPES[best];
    const modalCss=ct.css.replace(/_foil$/, '').replace(/_foil(?=\s|$)/,'');
    vis.className=`modal-visual ${best==='wild_foil'?ct.css:(ct.foil?modalCss:ct.css)}`;
  }else{
    vis.className='modal-visual not-owned';
  }
  updateStats(); applyFilters();
}

function closeMoOverlay(e){ if(e.target===document.getElementById('mo')) closeMo(); }
function closeMo(){ document.getElementById('mo').classList.remove('open'); currentCardId=null; }

/* TOAST */
function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),1600);
}

/* LOGIN SYSTEM */
// PIN storage helpers (localStorage-based, SHA-256 hashed)
function isPinEnabled(){ return localStorage.getItem('f1uno_pin_enabled')==='true'; }
function isSetupDone(){ return localStorage.getItem('f1uno_setup_done')==='true'; }
function isViewerModeAllowed(){ return localStorage.getItem('f1uno_viewer_enabled')==='true'; }
function getStoredPinHash(){ return localStorage.getItem('f1uno_pin_hash')||''; }

let pinEntry = '';
let _authenticated = false;
let isViewerMode = false;

// SHA-256 helper using Web Crypto API
async function sha256(str){
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

// Console bypass protection
function _guard(){
  if(!_authenticated){
    console.warn('%c⛔ Accès refusé','color:red;font-size:20px;font-weight:bold');
    return false;
  }
  return true;
}
// Override console methods to require authentication
const _origLog=console.log;const _origWarn=console.warn;const _origError=console.error;
['log','warn','error','info','debug','table','dir','trace','group','groupEnd','time','timeEnd','assert','count','countReset','clear','profile','profileEnd'].forEach(m=>{
  const orig=console[m];
  if(typeof orig==='function'){
    console[m]=function(){
      if(!_authenticated && m!=='warn') return;
      return orig.apply(console,arguments);
    };
  }
});

function updatePinDots() {
  for (let i = 0; i < 4; i++) {
    // querySelectorAll so we update both login screen AND admin overlay if both in DOM
    document.querySelectorAll('#dot-' + i).forEach(dot => {
      if (i < pinEntry.length) {
        dot.classList.add('filled');
        dot.classList.remove('error');
      } else {
        dot.classList.remove('filled', 'error');
      }
    });
  }
}

let _pinKeyProcessing = false;
function pinKey(digit) {
  if (_pinKeyProcessing) return;
  _pinKeyProcessing = true;
  console.log('pinKey called with digit:', digit, 'current pinEntry:', pinEntry);
  if (pinEntry.length < 4) {
    pinEntry += digit;
    console.log('pinEntry after adding digit:', pinEntry);
    updatePinDots();
    if (pinEntry.length === 4) {
      checkPin();
    }
  }
  setTimeout(() => { _pinKeyProcessing = false; }, 50);
}

function pinDel() {
  if (pinEntry.length > 0) {
    pinEntry = pinEntry.slice(0, -1);
    updatePinDots();
  }
}

async function checkPin(opts={}) {
  // Setup wizard override
  if(window._setupCheckOverride){ await window._setupCheckOverride(); return; }
  // Admin overlay override
  if(window._adminOverlayActive && window._adminPinCallback){ await window._adminPinCallback(); return; }
  const hash = await sha256(pinEntry);
  const stored = getStoredPinHash();
  if (stored && hash === stored) {
    if(opts.onSuccess) { opts.onSuccess(pinEntry); pinEntry=''; return; }
    enterApp(false);
  } else {
    for (let i = 0; i < 4; i++) {
      document.querySelectorAll('#dot-' + i).forEach(d => { d.classList.remove('filled'); d.classList.add('error'); });
    }
    document.querySelectorAll('#pin-error').forEach(e => { e.textContent = opts.errorMsg || 'Code incorrect — réessayez'; });
    setTimeout(() => { pinEntry = ''; updatePinDots(); }, 700);
  }
}

function enterApp(viewer=false){
  isViewerMode = viewer;
  _authenticated = !viewer;
  pinEntry = '';
  const loginScreen = document.getElementById('login-screen');
  if(loginScreen){
    loginScreen.style.opacity='0';
    loginScreen.style.transition='opacity 0.4s ease';
    setTimeout(()=>{ loginScreen.style.display='none'; _launchApp(); }, 400);
  } else {
    _launchApp();
  }
}

function _launchApp(){
  const appWrapper = document.getElementById('app-wrapper');
  if(appWrapper) appWrapper.style.display='flex';
  // Force display of collection view
  const collectionView = document.getElementById('collectionView');
  if(collectionView) collectionView.style.display='block';
  initApp();
  if(isViewerMode) _applyViewerMode();
}

function _applyViewerMode(){
  document.body.classList.add('viewer-mode');
  const settingsTab = document.querySelector('.bn-tab[data-view="settings"]');
  if(settingsTab){
    settingsTab.querySelector('.bn-icon').textContent='🔓';
    settingsTab.querySelector('.bn-label').textContent='Admin';
  }
  // Always start on collection in viewer mode
  currentView = 'collection';
  switchView('collection');
  showToast(t('toast.viewer'));
}

function showSetupScreen(){
  const ls = document.getElementById('login-screen');
  if(!ls) return;
  ls.querySelector('.login-box').innerHTML = `
    <div class="login-duo">
      <div class="login-f1"><img src="https://upload.wikimedia.org/wikipedia/commons/3/33/F1.svg" alt="F1"></div>
      <span class="login-x">×</span>
      <div class="login-uno"><img src="https://upload.wikimedia.org/wikipedia/commons/f/f9/UNO_Logo.svg" alt="UNO"></div>
    </div>
    <div class="setup-title">${t('setup.welcome')}</div>
    <div class="setup-sub">${t('setup.subtitle')}</div>
    <div class="setup-btns">
      <button class="setup-btn primary" id="setupYesBtn" type="button">${t('setup.yes')}</button>
      <button class="setup-btn secondary" id="setupNoBtn" type="button">${t('setup.no')}</button>
    </div>`;
  document.getElementById('setupNoBtn').addEventListener('click', ()=>{
    localStorage.setItem('f1uno_pin_enabled','false');
    localStorage.setItem('f1uno_setup_done','true');
    enterApp(false);
  });
  document.getElementById('setupYesBtn').addEventListener('click', ()=>{ showSetupPinEntry(ls,''); });
}

function showSetupPinEntry(ls, subtitle){
  const box = ls.querySelector('.login-box') || ls;
  box.innerHTML = `
    <div class="login-duo">
      <div class="login-f1"><img src="https://upload.wikimedia.org/wikipedia/commons/3/33/F1.svg" alt="F1"></div>
      <span class="login-x">×</span>
      <div class="login-uno"><img src="https://upload.wikimedia.org/wikipedia/commons/f/f9/UNO_Logo.svg" alt="UNO"></div>
    </div>
    <div class="setup-title">${t('setup.choose')}</div>
    <div class="setup-sub">${subtitle||t('setup.enter')}</div>
    <div class="pin-dots" id="pin-dots">
      <div class="pin-dot" id="dot-0"></div><div class="pin-dot" id="dot-1"></div>
      <div class="pin-dot" id="dot-2"></div><div class="pin-dot" id="dot-3"></div>
    </div>
    <div class="pin-keypad" id="pin-keypad">
      <button class="pin-key" data-digit="1" type="button">1</button>
      <button class="pin-key" data-digit="2" type="button">2</button>
      <button class="pin-key" data-digit="3" type="button">3</button>
      <button class="pin-key" data-digit="4" type="button">4</button>
      <button class="pin-key" data-digit="5" type="button">5</button>
      <button class="pin-key" data-digit="6" type="button">6</button>
      <button class="pin-key" data-digit="7" type="button">7</button>
      <button class="pin-key" data-digit="8" type="button">8</button>
      <button class="pin-key" data-digit="9" type="button">9</button>
      <button class="pin-key del" data-action="pinDel" type="button">⌫</button>
      <button class="pin-key zero" data-digit="0" type="button">0</button>
    </div>
    <div class="pin-error-msg" id="pin-error"></div>`;
  pinEntry = '';
  // Override checkPin to do setup-confirm flow
  window._setupPhase = 'enter';
  window._setupFirstPin = '';
  window._setupCheckOverride = async ()=>{
    if(window._setupPhase === 'enter'){
      window._setupFirstPin = pinEntry;
      window._setupPhase = 'confirm';
      pinEntry = '';
      box.querySelector('.setup-sub').textContent = t('setup.confirm');
      updatePinDots();
    } else {
      if(pinEntry === window._setupFirstPin){
        const hash = await sha256(pinEntry);
        localStorage.setItem('f1uno_pin_hash', hash);
        localStorage.setItem('f1uno_pin_enabled','true');
        localStorage.setItem('f1uno_setup_done','true');
        window._setupCheckOverride = null;
        window._setupPhase = null;
        enterApp(false);
      } else {
        window._setupPhase = 'enter';
        window._setupFirstPin = '';
        pinEntry = '';
        updatePinDots();
        const errEl = document.getElementById('pin-error');
        if(errEl) errEl.textContent = t('setup.mismatch');
      }
    }
  };
}

function lockApp() {
  if(!isPinEnabled()) return; // no lock if PIN disabled
  // Simply reload the page instead of showing login screen
  window.location.reload();
}

// Keyboard support for PIN (login screen OR admin overlay)
document.addEventListener('keydown', e => {
  const adminOverlay = document.getElementById('admin-pin-overlay');
  const loginScreen = document.getElementById('login-screen');
  const loginVisible = loginScreen && loginScreen.style.display !== 'none';
  const adminVisible = !!adminOverlay;
  if (!loginVisible && !adminVisible) return;
  if (e.key >= '0' && e.key <= '9') pinKey(e.key);
  else if (e.key === 'Backspace') pinDel();
});

// Focus sur le champ mot de passe avec la touche espace
document.addEventListener('keydown', function(event) {
  // Seulement si l'écran de login est visible et que le focus n'est pas déjà sur un input
  if (event.code === 'Space' && 
      document.getElementById('login-screen').style.display !== 'none' &&
      document.activeElement.tagName !== 'INPUT') {
    event.preventDefault();
  }
  // Escape pour quitter les champs
  if (event.key === 'Escape' && 
      (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
    document.activeElement.blur();
  }
});

// ── SIDEBAR FUNCTIONS ──
function toggleSidebar() {
  const sidebar = document.getElementById('floating-sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  
  sidebar.classList.toggle('open');
  sidebarOverlay.classList.toggle('show');
  sidebarToggle.classList.toggle('sidebar-open');
}

// ── KEYBOARD SHORTCUTS ──
function handleGlobalKeyPress(event) {
  // Ignorer si l'utilisateur est dans un champ de saisie
  if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
    return;
  }
  
  // Raccourci B - Toggle Sidebar
  if (event.key === 'b' || event.key === 'B') {
    event.preventDefault();
    toggleSidebar();
    return;
  }
}

// Initialiser les raccourcis clavier
document.addEventListener('keydown', handleGlobalKeyPress);

function _showDataError(msg){
  console.error(msg);
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:99999;background:#cc0000;color:#fff;padding:12px 24px;border-radius:10px;font:bold 14px system-ui,sans-serif;box-shadow:0 4px 24px rgba(0,0,0,.4);max-width:90vw;text-align:center;';
  el.textContent = '⚠️ ' + msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 8000);
}

function exportCollection(){
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

async function loadAppData(){
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
        console.log(`Données embarquées utilisées: ${CARDS_DB.length} cartes`);
      } else {
        console.error('Erreur critique: aucune carte chargée');
        _showDataError('Impossible de charger les données.');
      }
    } else {
      console.log(`Données chargées: ${CARDS_DB.length} cartes, saison ${_currentSeason}`);
    }
  } catch(e){
    console.error('Erreur chargement JSON:', e);
    if(!_loadEmbedded()){
      _showDataError('Erreur critique: impossible de charger les données JSON.');
    }
  }
}

function switchSeason(season){
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

function _renderSeasonPills(){
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

function initApp() {
  console.log('Initialisation de l\'app...');
  loadAppData().then(() => {
    console.log('Données chargées, CARDS_DB.length:', CARDS_DB.length);
    loadData();
    loadManualBadges();
    initEvents();
    initSearch();
    renderSidebar();
    applyFilters();
    updateStats();
    _renderSeasonPills();
    // Apply saved language on app load (after data is loaded)
    applyLanguage();
    // Load and apply user title
    updateUserTitle();

    // Initialiser les états On/Off
    const sidebarFavToggleState = document.getElementById('sidebarFavToggleState');
    if (sidebarFavToggleState) sidebarFavToggleState.textContent = favoriteFirst ? t('fav.on') : t('fav.off');
    const sidebarChampState = document.getElementById('sidebarChampState');
    if (sidebarChampState) sidebarChampState.textContent = filters.champions ? t('fav.on') : t('fav.off');

    // Initialiser les sections condensées
    Object.keys(sectionStates).forEach(section => {
      if (sectionStates[section]) {
        const sectionElement = document.querySelector(`#${section}-toggle`).closest('.sidebar-section');
        const toggleBtn = document.getElementById(`${section}-toggle`);
        if (sectionElement && toggleBtn) {
          sectionElement.classList.add('collapsed');
          toggleBtn.classList.add('collapsed');
          toggleBtn.textContent = '▶';
        }
      }
    });

    console.log('App initialisée, coll contient:', Object.keys(coll).length, 'cartes');
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

function getUnlockedTitles(){
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

function selectTitle(titleObj){
  selectedTitle = titleObj;
  saveSelectedTitle();
  updateUserTitle();
}

function updateUserTitle(){
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

function toggleTitlePicker(){
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

/* ══════════════════════════════════════════════════════════
   BADGES SYSTEM — 50 badges (25 auto + 25 manual)
   ══════════════════════════════════════════════════════════ */
let currentView = 'collection'; // 'collection' | 'badges' | 'stats' | 'settings'
let manualBadges = {}; // { badgeId: true/false }
let autoBadgeUnlocked = {}; // { badgeId: true } — persists once unlocked
let _selectRemoveMode = false; // when true, clicking an auto badge removes it
let _seenAutoBadges = new Set(); // auto badge IDs already displayed with shimmer

// Evaluate badge progress from JSON condition config
function evaluateBadgeCondition(badge){
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
function loadManualBadges(){
  try {
    const s = localStorage.getItem(_storageKey('badges'));
    if(s) manualBadges = JSON.parse(s);
  } catch(e){ manualBadges = {}; }
  try {
    const a = localStorage.getItem(_storageKey('auto_badges'));
    if(a) autoBadgeUnlocked = JSON.parse(a);
  } catch(e){ autoBadgeUnlocked = {}; }
}
function saveManualBadges(){ localStorage.setItem(_storageKey('badges'), JSON.stringify(manualBadges)); localStorage.setItem(_storageKey('auto_badges'), JSON.stringify(autoBadgeUnlocked)); }

// Check if auto badge is unlocked (current condition OR previously unlocked)
function isAutoBadgeUnlocked(badge){
  const p = evaluateBadgeCondition(badge);
  const currently = p.cur >= p.max;
  if(currently && !autoBadgeUnlocked[badge.id]){
    autoBadgeUnlocked[badge.id] = true;
    saveManualBadges();
  }
  return !!autoBadgeUnlocked[badge.id];
}

function removeAutoBadge(badgeId){
  if(autoBadgeUnlocked[badgeId]){
    delete autoBadgeUnlocked[badgeId];
    saveManualBadges();
    renderBadges();
    updateStats();
    showToast('Badge retiré');
  }
}

function toggleManualBadge(badgeId){
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

// ── BADGES — loaded from badges.json ──
let AUTO_BADGES = [];
let MANUAL_BADGES = [];

function getBadgeCards(badgeId){
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

function toggleBadgePreview(cardEl, badgeId){
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

function renderBadges(){
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

function switchView(view){
  currentView = view;
  const collectionView = document.getElementById('collectionView');
  const badgesView = document.getElementById('badgesView');
  const statsView = document.getElementById('statsView');
  const settingsView = document.getElementById('settingsView');

  collectionView.style.display = 'none';
  badgesView.classList.remove('active');
  if(statsView) statsView.classList.remove('active');
  if(settingsView) settingsView.classList.remove('active');

  // Bottom nav tabs
  document.querySelectorAll('.bn-tab').forEach(t => {
    t.classList.toggle('active', t.getAttribute('data-view') === view);
  });

  // Sidebar toggle only on collection
  const sidebarToggle = document.getElementById('sidebar-toggle');
  if(sidebarToggle) sidebarToggle.style.display = view === 'collection' ? '' : 'none';

  switch(view){
    case 'badges':
      badgesView.classList.add('active');
      renderBadges();
      break;
    case 'stats':
      if(statsView){ statsView.classList.add('active'); renderStats(); }
      break;
    case 'settings':
      if(settingsView){ settingsView.classList.add('active'); renderSettings(); }
      // Ensure collectionView is hidden when in settings
      collectionView.style.display = 'none';
      break;
    default:
      collectionView.style.display = '';
  }
}

function renderStats(){
  const el = document.getElementById('statsView');
  if(!el) return;

  // — Générales —
  const total = CARDS_DB.length;
  const owned = CARDS_DB.filter(c=>cardOwned(c.id)).length;
  const wish  = CARDS_DB.filter(c=>cardWishlist(c.id)).length;
  const doubles = CARDS_DB.filter(c=>cardDoubles(c.id)).length;
  const missing = CARDS_DB.filter(c=>cardMissing(c.id)).length;
  const fav = CARDS_DB.filter(c=>cardFavorite(c.id)).length;
  const champions = CARDS_DB.filter(c=>c.champion).length;
  const champOwned = CARDS_DB.filter(c=>c.champion && cardOwned(c.id)).length;
  let totalExemplaires = 0;
  CARDS_DB.forEach(card => card.types.forEach(typeId => {
    const d = getTypeData(card.id, typeId);
    if(d.owned && d.qty > 0) totalExemplaires += d.qty;
  }));
  const pct = total > 0 ? Math.round((owned/total)*100) : 0;

  function pctColor(p){
    // red (hue 0) → orange (hue 25) → green (hue 120), interpolated via HSL
    const hue = Math.round(p * 1.2); // 0%→0 (red), 50%→60 (yellow), 100%→120 (green)
    return `hsl(${hue},80%,48%)`;
  }

  function svRow(icon, name, n, tot, pct){
    const full = pct === 100;
    const fillClass = full ? 'sv-mini-fill sv-mini-fill-full' : 'sv-mini-fill';
    const fillStyle = full ? '' : `background:${pctColor(pct)}`;
    return `<div class="sv-row${full?' sv-row-full':''}">
      <div class="sv-row-left"><span class="sv-row-icon">${icon}</span><span class="sv-row-name">${name}</span></div>
      <div class="sv-row-right">
        <span class="sv-row-count">${n}<span class="sv-row-total">/${tot}</span></span>
        <div class="sv-mini-bar"><div class="${fillClass}" style="width:${pct}%;${fillStyle}"></div></div>
        <span class="sv-full-check">${full?'✓':''}</span>
      </div>
    </div>`;
  }

  // — Par catégorie (+ Champions) —
  const catIds = Object.keys(CATS);
  const catRowsArr = catIds.map(catId => {
    const cat = CATS[catId];
    const catCards = CARDS_DB.filter(c=>c.category===catId);
    if(catCards.length === 0) return '';
    const catOwned = catCards.filter(c=>cardOwned(c.id)).length;
    return svRow(cat.emoji, t('cat.'+catId), catOwned, catCards.length, Math.round((catOwned/catCards.length)*100));
  });
  const champPct = champions > 0 ? Math.round((champOwned/champions)*100) : 0;
  catRowsArr.push(svRow('🏆', t('st.champions'), champOwned, champions, champPct));
  const catRows = catRowsArr.join('');

  // — Par type de carte —
  const typeIds = Object.keys(CARD_TYPES);
  const typeRows = typeIds.map(typeId => {
    const ct = CARD_TYPES[typeId];
    const cardsWithType = CARDS_DB.filter(c=>c.types.includes(typeId));
    if(cardsWithType.length === 0) return '';
    const ownedWithType = cardsWithType.filter(c=>{
      const d = getTypeData(c.id, typeId);
      return d.owned && (d.qty||0) > 0;
    }).length;
    const typePct = Math.round((ownedWithType/cardsWithType.length)*100);
    // Use vivid mid-gradient color matching the card visual, not the dark metadata color
    const TYPE_VIVID = {
      blue:'#1a5fb4', green:'#1e7a35', red:'#cc0000', yellow:'#f5c000',
      blue_foil:'#4a90d9', green_foil:'#2ecc71', red_foil:'#ff4d4d', yellow_foil:'#ffd000',
      blue_red_foil:'linear-gradient(135deg,#4a90d9,#cc2233)',
      green_yellow_foil:'linear-gradient(135deg,#2ecc71,#ffd700)',
      wild_foil:'conic-gradient(from 0deg,#1e50dc,#14a032,#dc0000,#ffd000,#1e50dc)',
      nitro_foil:'linear-gradient(135deg,#9B3DFF,#1e50dc,#14a032,#dc0000)',
      promo_blue:'#0099ff', promo_green:'#00e676', promo_red:'#ff2d55', promo_yellow:'#ffe000'
    };
    const bgStyle = TYPE_VIVID[typeId] || ct.color;
    const isGradient = bgStyle.includes('gradient');
    const dotStyle = isGradient ? `background:${bgStyle}` : `background:${bgStyle}`;
    const icon = `<span class="sv-type-dot${ct.foil?' sv-type-dot-foil':''}" style="${dotStyle}"></span>`;
    return svRow(icon, t('type.'+typeId)||ct.label, ownedWithType, cardsWithType.length, typePct);
  }).join('');

  // — Par équipe —
  const TEAM_SHORT = {
    'Oracle Red Bull Racing':'Red Bull','Scuderia Ferrari HP':'Ferrari','McLaren F1':'McLaren',
    'Mercedes-AMG Petronas Formula One Team':'Mercedes','Aston Martin Aramco Formula One Team':'Aston Martin',
    'BWT Alpine F1 Team':'Alpine','MoneyGram Haas F1 Team':'Haas',
    'Visa Cash App RB Formula One':'RB','Atlassian Williams Racing':'Williams',
    'Stake F1 Team KICK Sauber':'Sauber'
  };
  const teams = [...new Set(CARDS_DB.map(c=>c.team).filter(Boolean))].sort();
  const teamRows = teams.map(team => {
    const teamCards = CARDS_DB.filter(c=>c.team===team);
    if(teamCards.length === 0) return '';
    const teamOwned = teamCards.filter(c=>cardOwned(c.id)).length;
    const teamPct = Math.round((teamOwned/teamCards.length)*100);
    const color = (TEAM_COLORS&&TEAM_COLORS[team]) || 'var(--red)';
    const dot = `<span class="sv-team-dot" style="background:${color}"></span>`;
    return svRow(dot, TEAM_SHORT[team]||team, teamOwned, teamCards.length, teamPct);
  }).join('');

  // — Par rareté —
  const rarityRows = RARITY_KEYS.map(rKey => {
    const rar = RARITIES[rKey];
    if(!rar) return '';
    const ownedAtRar = CARDS_DB.filter(c => cardOwned(c.id) && cardRarity(c) === rKey).length;
    const reachable = CARDS_DB.filter(c => c.types.some(t => variantRarity(c,t) === rKey)).length;
    if(reachable === 0) return '';
    const rarPct = Math.round((ownedAtRar/reachable)*100);
    return svRow(`<span style="color:${rar.color}">★</span>`, `<span style="color:${rar.color}">${t('rar.'+rKey)}</span>`, ownedAtRar, reachable, rarPct);
  }).join('');

  el.innerHTML = `
    <div class="sv-title">${t('st.title')}</div>

    <div class="sv-progress${pct===100?' sv-progress-full':''}">
      <div class="sv-prog-hero">
        <div class="sv-prog-pct-big">${pct}%</div>
        <div class="sv-prog-text">
          <div class="sv-prog-title">${pct===100?t('st.complete'):t('st.progress')}</div>
          <div class="sv-prog-sub">${t('st.sub',{owned,total})}</div>
        </div>
      </div>
      <div class="sv-prog-bar"><div class="sv-prog-fill${pct===100?' sv-prog-fill-full':''}" style="width:${pct}%"></div></div>
    </div>

    <div class="sv-section-title">${t('st.general')}</div>
    <div class="sv-cards">
      <div class="sv-card owned"><div class="sv-card-value">${owned}<span class="sv-card-total">/${total}</span></div><div class="sv-card-label">${t('st.owned')}</div></div>
      <div class="sv-card wish"><div class="sv-card-value">${wish}</div><div class="sv-card-label">${t('st.wish')}</div></div>
      <div class="sv-card doubles"><div class="sv-card-value">${doubles}</div><div class="sv-card-label">${t('st.doubles')}</div></div>
      <div class="sv-card missing"><div class="sv-card-value">${missing}</div><div class="sv-card-label">${t('st.missing')}</div></div>
      <div class="sv-card fav"><div class="sv-card-value">${fav}</div><div class="sv-card-label">${t('st.fav')}</div></div>
      <div class="sv-card exemplaires"><div class="sv-card-value">${totalExemplaires}</div><div class="sv-card-label">${t('st.copies')}</div></div>
    </div>

    ${catRows   ? `<div class="sv-section-title">${t('st.by_cat')}</div><div class="sv-rows-block">${catRows}</div>`:''}
    ${typeRows  ? `<div class="sv-section-title">${t('st.by_type')}</div><div class="sv-rows-block">${typeRows}</div>`:''}
    ${teamRows  ? `<div class="sv-section-title">${t('st.by_team')}</div><div class="sv-rows-block">${teamRows}</div>`:''}
    ${rarityRows? `<div class="sv-section-title">${t('st.by_rarity')}</div><div class="sv-rows-block">${rarityRows}</div>`:''}
  `;
}

function renderSettings(){
  const el = document.getElementById('settingsView');
  if(!el) return;
  
  // Ensure collectionView is hidden when rendering settings
  const collectionView = document.getElementById('collectionView');
  if(collectionView) collectionView.style.display = 'none';
  
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const pinOn = isPinEnabled();
  const viewerOn = isViewerModeAllowed();

  const langOptions = Object.entries(LANGS).map(([code,label])=>
    `<option value="${code}"${getLang()===code?' selected':''}>${label}</option>`
  ).join('');

  el.innerHTML = `
    <div class="setv-title">⚙️ <span>${t('nav.settings').replace('⚙️ ','')}</span></div>

    <div class="setv-section">
      <div class="setv-section-title">${t('s.appearance')}</div>
      <div class="setv-row">
        <div class="setv-row-left">
          <div class="setv-row-label">${t('s.dark')}</div>
          <div class="setv-row-sub">${t('s.dark_sub')}</div>
        </div>
        <button class="setv-toggle${isDark?' on':''}" data-action="toggleTheme"></button>
      </div>
      <div class="setv-row">
        <div class="setv-row-left">
          <div class="setv-row-label">${t('s.lang')}</div>
          <div class="setv-row-sub">${t('s.lang_sub')}</div>
        </div>
        <select class="setv-lang-sel" id="langSel">${langOptions}</select>
      </div>
    </div>

    <div class="setv-section">
      <div class="setv-section-title">${t('s.security')}</div>
      <div class="setv-row">
        <div class="setv-row-left">
          <div class="setv-row-label">${t('s.pin')}</div>
          <div class="setv-row-sub">${t('s.pin_sub')}</div>
        </div>
        <button class="setv-toggle${pinOn?' on':''}" id="pinToggle"></button>
      </div>
      ${pinOn ? `
      <div class="setv-row" id="changePinRow" style="flex-direction:column;align-items:flex-start;gap:0;padding-bottom:6px;">
        <div style="display:flex;align-items:center;justify-content:space-between;width:100%;padding:0 0 12px;">
          <div class="setv-row-left"><div class="setv-row-label">${t('s.change_pin')}</div></div>
          <button class="setv-btn" id="showChangePinBtn">${t('s.change_btn')}</button>
        </div>
        <div id="changePinForm" style="display:none;width:100%">
          <div class="pin-change-form">
            <div class="pin-input-row">
              <div class="pin-input-label">${t('s.new_pin')}</div>
              <input type="password" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" class="pin-mini-input" id="newPinA" placeholder="••••">
            </div>
            <div class="pin-input-row">
              <div class="pin-input-label">${t('s.confirm_pin')}</div>
              <input type="password" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" class="pin-mini-input" id="newPinB" placeholder="••••">
            </div>
            <div class="pin-form-error" id="pinChangeError"></div>
            <button class="pin-save-btn" id="savePinBtn">${t('s.enable_pin')}</button>
          </div>
        </div>
      </div>
      <div class="setv-row">
        <div class="setv-row-left">
          <div class="setv-row-label">${t('s.viewer')}</div>
          <div class="setv-row-sub">${t('s.viewer_sub')}</div>
        </div>
        <button class="setv-toggle${viewerOn?' on':''}" id="viewerToggle"></button>
      </div>` : `
      <div class="setv-row" style="opacity:0.4;pointer-events:none;">
        <div class="setv-row-left">
          <div class="setv-row-label">${t('s.viewer')}</div>
          <div class="setv-row-sub">${t('s.viewer_off')}</div>
        </div>
        <button class="setv-toggle" disabled></button>
      </div>`}
    </div>

    <div class="setv-section">
      <div class="setv-section-title">${t('s.collection')}</div>
      <div class="setv-row">
        <div class="setv-row-left">
          <div class="setv-row-label">${t('s.import')}</div>
          <div class="setv-row-sub">${t('s.import_sub')}</div>
        </div>
        <button class="setv-btn" id="importBtn">${t('s.import_btn')}</button>
      </div>
      <div class="setv-row">
        <div class="setv-row-left">
          <div class="setv-row-label">${t('s.export')}</div>
          <div class="setv-row-sub">${t('s.export_sub')}</div>
        </div>
        <button class="setv-btn" data-action="exportCollection">${t('s.export_btn')}</button>
      </div>
    </div>

    ${pinOn ? `
    <div class="setv-section">
      <div class="setv-section-title">${t('s.session')}</div>
      <div class="setv-row">
        <div class="setv-row-left">
          <div class="setv-row-label">${t('s.lock')}</div>
          <div class="setv-row-sub">${t('s.lock_sub')}</div>
        </div>
        <button class="setv-btn danger" id="settingsLockBtn">${t('s.lock_btn')}</button>
      </div>
    </div>` : ''}
  `;

  // — Bindings —
  el.querySelector('#pinToggle')?.addEventListener('click', async ()=>{
    if(pinOn){
      // Disable PIN: confirm
      if(!confirm(t('pin.disable'))) return;
      localStorage.setItem('f1uno_pin_enabled','false');
      localStorage.removeItem('f1uno_pin_hash');
    } else {
      // Enable PIN: need to set one first
      _startEnablePin(el);
      return;
    }
    renderSettings();
  });

  el.querySelector('#showChangePinBtn')?.addEventListener('click', ()=>{
    const form = el.querySelector('#changePinForm');
    if(form) form.style.display = form.style.display==='none'?'block':'none';
  });

  el.querySelector('#savePinBtn')?.addEventListener('click', async ()=>{
    const a = el.querySelector('#newPinA').value;
    const b = el.querySelector('#newPinB').value;
    const errEl = el.querySelector('#pinChangeError');
    if(!/^\d{4}$/.test(a)){ errEl.textContent=t('pin.digits'); return; }
    if(a !== b){ errEl.textContent=t('pin.mismatch'); return; }
    const hash = await sha256(a);
    localStorage.setItem('f1uno_pin_hash', hash);
    errEl.textContent='';
    el.querySelector('#changePinForm').style.display='none';
    el.querySelector('#newPinA').value='';
    el.querySelector('#newPinB').value='';
    showToast(t('pin.saved'));
  });

  el.querySelector('#viewerToggle')?.addEventListener('click', ()=>{
    localStorage.setItem('f1uno_viewer_enabled', viewerOn?'false':'true');
    renderSettings();
    showToast(viewerOn?t('toast.viewer_off'):t('toast.viewer_on'));
  });

  el.querySelector('#importBtn')?.addEventListener('click', triggerImport);
  el.querySelector('#settingsLockBtn')?.addEventListener('click', lockApp);

  const langSel = el.querySelector('#langSel');
  if(langSel) langSel.addEventListener('change', e=>setLang(e.target.value));
}

function _startEnablePin(container){
  container.innerHTML = `
    <div class="setv-title">⚙️ <span>${t('nav.settings').replace('⚙️ ','')}</span></div>
    <div class="setv-section">
      <div class="setv-section-title">${t('pin.set_title')}</div>
      <div class="pin-change-form">
        <div class="pin-input-row">
          <div class="pin-input-label">${t('s.new_pin')}</div>
          <input type="password" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" class="pin-mini-input" id="enablePinA" placeholder="••••">
        </div>
        <div class="pin-input-row">
          <div class="pin-input-label">${t('s.confirm_pin')}</div>
          <input type="password" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" class="pin-mini-input" id="enablePinB" placeholder="••••">
        </div>
        <div class="pin-form-error" id="enablePinError"></div>
        <div style="display:flex;gap:8px;">
          <button class="pin-save-btn" id="enablePinSave">Activer le PIN</button>
          <button class="setv-btn" id="enablePinCancel" style="margin-top:4px">Annuler</button>
        </div>
      </div>
    </div>`;
  container.querySelector('#enablePinCancel').addEventListener('click', renderSettings);
  container.querySelector('#enablePinSave').addEventListener('click', async ()=>{
    const a = container.querySelector('#enablePinA').value;
    const b = container.querySelector('#enablePinB').value;
    const errEl = container.querySelector('#enablePinError');
    if(!/^\d{4}$/.test(a)){ errEl.textContent=t('pin.digits'); return; }
    if(a !== b){ errEl.textContent=t('pin.mismatch'); return; }
    const hash = await sha256(a);
    localStorage.setItem('f1uno_pin_hash', hash);
    localStorage.setItem('f1uno_pin_enabled','true');
    showToast(t('toast.pin_on'));
    renderSettings();
  });
}

/* ══════════════════════════════════════════════════════════
   EVENT BINDING — replaces all inline onclick handlers
   ══════════════════════════════════════════════════════════ */
// Theme toggle works even before login (PIN screen)
document.addEventListener('click', e => {
  if(e.target.closest('[data-action="toggleTheme"]')) toggleTheme();
});

let _eventsInitialized = false;
function initEvents(){
  if(_eventsInitialized) return;
  _eventsInitialized = true;
  // ── Global event delegation for data-action ──
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if(!el) return;
    const action = el.getAttribute('data-action');

    // Block write actions in viewer mode
    const VIEWER_BLOCKED = new Set(['quickToggle','changeMoQty','toggleManualBadge','removeAutoBadge','enterRemoveBadgeMode','toggleFavoriteFirst','toggleChampionFilter','resetFilters','toggleTitlePicker','selectTitle']);
    if(isViewerMode && VIEWER_BLOCKED.has(action)){
      showToast(t('toast.readonly'));
      return;
    }

    switch(action){
      case 'quickToggle': {
        const cardId = el.getAttribute('data-card');
        const status = el.getAttribute('data-status');
        quickToggle(cardId, status, e);
        break;
      }
      case 'selectCard': {
        const cardId = el.getAttribute('data-card');
        selectCard(cardId);
        break;
      }
      case 'changeMoQty': {
        const cardId = el.getAttribute('data-card');
        const typeId = el.getAttribute('data-type');
        const delta = parseInt(el.getAttribute('data-delta'), 10);
        changeMoQty(cardId, typeId, delta);
        break;
      }
      case 'toggleManualBadge': {
        const badgeId = el.getAttribute('data-badge');
        toggleManualBadge(badgeId);
        break;
      }
      case 'removeAutoBadge': {
        e.stopPropagation();
        const badgeId = el.getAttribute('data-badge');
        removeAutoBadge(badgeId);
        break;
      }
      case 'enterRemoveBadgeMode': {
        _selectRemoveMode = true;
        document.querySelectorAll('#autoBadgesGrid .badge-card.unlocked').forEach(c=>c.classList.add('select-remove'));
        showToast('Cliquez sur un badge débloqué pour le retirer');
        break;
      }
      case 'toggleTitlePicker': {
        toggleTitlePicker();
        break;
      }
      case 'selectTitle': {
        const titleId = el.getAttribute('data-title-id');
        const unlocked = getUnlockedTitles();
        const titleObj = unlocked.find(t => t.id === titleId);
        if(titleObj) selectTitle(titleObj);
        toggleTitlePicker();
        break;
      }
      case 'toggleSection': {
        const section = el.getAttribute('data-section');
        toggleSection(section);
        break;
      }
      case 'toggleFavoriteFirst': {
        toggleFavoriteFirst();
        break;
      }
      case 'toggleChampionFilter': {
        toggleChampionFilter();
        break;
      }
      case 'resetFilters': {
        resetFilters();
        break;
      }
      case 'switchView': {
        const view = el.getAttribute('data-view');
        if(isViewerMode && view === 'settings'){
          showAdminPinScreen();
        } else {
          switchView(view);
        }
        break;
      }
      case 'switchSeason': {
        const s = parseInt(el.getAttribute('data-season'), 10);
        if(s) switchSeason(s);
        break;
      }
      case 'pinDel': {
        pinDel();
        break;
      }
      case 'toggleTheme': break; // handled by pre-login global listener
      case 'exportCollection': {
        exportCollection();
        break;
      }
    }
  });

  // ── PIN keypad — digit buttons ──
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-digit]');
    if(el) pinKey(el.getAttribute('data-digit'));
  });

  // ── Static element bindings ──
  const sidebarToggle = document.getElementById('sidebar-toggle');
  if(sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);

  const sidebarClose = document.getElementById('sidebarClose');
  if(sidebarClose) sidebarClose.addEventListener('click', toggleSidebar);

  const sidebarOverlay = document.getElementById('sidebar-overlay');
  if(sidebarOverlay) sidebarOverlay.addEventListener('click', toggleSidebar);

  // Lock button is now in settings page, bound on renderSettings()

  const modalCloseBtn = document.getElementById('modalCloseBtn');
  if(modalCloseBtn) modalCloseBtn.addEventListener('click', closeMo);

  const mo = document.getElementById('mo');
  if(mo) mo.addEventListener('click', e => { if(e.target === mo) closeMo(); });

  const sidebarSortSel = document.getElementById('sidebarSortSel');
  if(sidebarSortSel) sidebarSortSel.addEventListener('change', applyFilters);

  // ── Touch swipe: modal down → close, sidebar left → close ──
  let _touchStartY = 0, _touchStartX = 0;
  const modalEl = document.querySelector('.modal');
  if(modalEl){
    modalEl.addEventListener('touchstart', e => { _touchStartY = e.touches[0].clientY; }, {passive:true});
    modalEl.addEventListener('touchend', e => {
      const dy = e.changedTouches[0].clientY - _touchStartY;
      if(dy > 80) closeMo();
    }, {passive:true});
  }
  const sidebarEl = document.getElementById('floating-sidebar');
  if(sidebarEl){
    sidebarEl.addEventListener('touchstart', e => { _touchStartX = e.touches[0].clientX; }, {passive:true});
    sidebarEl.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - _touchStartX;
      if(dx < -60) toggleSidebar();
    }, {passive:true});
  }
}

/* ══════════════════════════════════════════════════════════
   VIEWER BROWSE BUTTON BINDING
   ══════════════════════════════════════════════════════════ */
function _bindViewerBrowseBtn(){
  const btn = document.getElementById('viewerBrowseBtn');
  if(btn) btn.addEventListener('click', ()=> enterApp(true));
}

/* ══════════════════════════════════════════════════════════
   SETTINGS PIN MANAGEMENT
   ══════════════════════════════════════════════════════════ */
function showAdminPinScreen(){
  // When in viewer mode, show a PIN overlay to switch to admin
  const overlay = document.createElement('div');
  overlay.id = 'admin-pin-overlay';
  overlay.style.cssText='position:fixed;inset:0;background:var(--bg);display:flex;align-items:center;justify-content:center;z-index:9999;flex-direction:column;';
  overlay.innerHTML=`
    <div class="login-box">
      <div class="login-duo">
        <div class="login-f1"><img src="https://upload.wikimedia.org/wikipedia/commons/3/33/F1.svg" alt="F1"></div>
        <span class="login-x">×</span>
        <div class="login-uno"><img src="https://upload.wikimedia.org/wikipedia/commons/f/f9/UNO_Logo.svg" alt="UNO"></div>
      </div>
      <div class="pin-label" style="margin-top:16px">${t('adm.title')}</div>
      <div class="pin-dots" id="admin-pin-dots">
        <div class="pin-dot" id="dot-0"></div><div class="pin-dot" id="dot-1"></div>
        <div class="pin-dot" id="dot-2"></div><div class="pin-dot" id="dot-3"></div>
      </div>
      <div class="pin-keypad" id="pin-keypad">
        <button class="pin-key" data-digit="1" type="button">1</button>
        <button class="pin-key" data-digit="2" type="button">2</button>
        <button class="pin-key" data-digit="3" type="button">3</button>
        <button class="pin-key" data-digit="4" type="button">4</button>
        <button class="pin-key" data-digit="5" type="button">5</button>
        <button class="pin-key" data-digit="6" type="button">6</button>
        <button class="pin-key" data-digit="7" type="button">7</button>
        <button class="pin-key" data-digit="8" type="button">8</button>
        <button class="pin-key" data-digit="9" type="button">9</button>
        <button class="pin-key del" data-action="pinDel" type="button">⌫</button>
        <button class="pin-key zero" data-digit="0" type="button">0</button>
      </div>
      <div class="pin-error-msg" id="pin-error"></div>
      <div style="display:flex;gap:10px;margin-top:14px;width:100%;justify-content:center;">
        <button style="background:none;border:1.5px solid var(--border);border-radius:100px;color:var(--tx2);font-size:12px;font-weight:600;padding:7px 18px;cursor:pointer;font-family:var(--font-b);" id="adminCancelBtn">${t('adm.cancel')}</button>
        <button style="background:none;border:1.5px solid var(--border);border-radius:100px;color:var(--red);font-size:12px;font-weight:600;padding:7px 18px;cursor:pointer;font-family:var(--font-b);" id="adminLockBtn">${t('adm.lock')}</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  pinEntry='';
  document.getElementById('adminCancelBtn').addEventListener('click', e=>{
    e.stopPropagation();
    overlay.remove();
    pinEntry='';
    window._adminOverlayActive = false;
    window._adminPinCallback = null;
    switchView(currentView === 'settings' ? 'collection' : currentView);
  });
  document.getElementById('adminLockBtn').addEventListener('click', e=>{
    e.stopPropagation();
    overlay.remove();
    window._adminOverlayActive = false;
    window._adminPinCallback = null;
    lockApp();
  });
  // checkPin will now authenticate against stored hash
  window._adminOverlayActive = true;
  window._adminPinCallback = async ()=>{
    const hash = await sha256(pinEntry);
    if(hash === getStoredPinHash()){
      overlay.remove();
      window._adminOverlayActive = false;
      window._adminPinCallback = null;
      isViewerMode = false;
      _authenticated = true;
      document.body.classList.remove('viewer-mode');
      const settingsTab = document.querySelector('.bn-tab[data-view="settings"]');
      if(settingsTab){
        settingsTab.querySelector('.bn-icon').textContent='⚙️';
        settingsTab.querySelector('.bn-label').textContent='Réglages';
      }
      pinEntry='';
      switchView('settings');
      showToast(t('adm.ok'));
    } else {
      for(let i=0;i<4;i++){
        document.querySelectorAll('#dot-'+i).forEach(d=>{ d.classList.remove('filled'); d.classList.add('error'); });
      }
      document.querySelectorAll('#pin-error').forEach(e=>{ e.textContent='Code incorrect'; });
      setTimeout(()=>{ pinEntry=''; updatePinDots(); },700);
    }
  };
}

/* ══════════════════════════════════════════════════════════
   IMPORT JSON
   ══════════════════════════════════════════════════════════ */
function triggerImport(){
  const inp = document.getElementById('importFileInput');
  if(inp){ inp.value=''; inp.click(); }
}

function _handleImportFile(file){
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
  if(data.season) _currentSeason = data.season;
  if(mode==='replace'){
    coll = data.owned || {};
    if(data.manualBadges) manualBadges = data.manualBadges;
    if(data.autoBadges) autoBadgeUnlocked = data.autoBadges;
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

/* ══════════════════════════════════════════════════════════
   INIT — startup sequence
   ══════════════════════════════════════════════════════════ */
// Wire up import file input
const _importInput = document.getElementById('importFileInput');
if(_importInput) _importInput.addEventListener('change', e=>_handleImportFile(e.target.files[0]));

// Wire up initial viewer browse button (HTML version)
_bindViewerBrowseBtn();
if(isViewerModeAllowed()){
  const btn = document.getElementById('viewerBrowseBtn');
  if(btn) btn.style.display='';
}

// Wire up PIN keypad immediately (needed before initApp)
// Use event delegation to handle dynamically created PIN keypads
// Use a flag to prevent multiple attachments
console.log('Checking if PIN event listeners already attached:', window._pinEventListenersAttached);
if(!window._pinEventListenersAttached) {
  window._pinEventListenersAttached = true;
  console.log('Attaching PIN event listeners');
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-digit]');
    if(el) {
      console.log('PIN keypad click detected, digit:', el.getAttribute('data-digit'));
      pinKey(el.getAttribute('data-digit'));
    }
  }, { passive: true });

  // Wire up PIN delete button immediately
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-action="pinDel"]');
    if(el) {
      console.log('PIN delete button click detected');
      pinDel();
    }
  }, { passive: true });
}

console.log('Setup done:', isSetupDone());
console.log('PIN enabled:', isPinEnabled());
console.log('Viewer mode allowed:', isViewerModeAllowed());

if(!isSetupDone()){
  // First launch
  console.log('First launch - showing setup screen');
  showSetupScreen();
} else if(!isPinEnabled()){
  // No PIN — go straight to app
  console.log('PIN disabled - going straight to app');
  _authenticated = true;
  const ls = document.getElementById('login-screen');
  if(ls) ls.style.display='none';
  document.getElementById('app-wrapper').style.display='flex';
  initApp();
} else {
  console.log('PIN enabled - login screen should be visible');
}
// else: PIN enabled — login screen already visible in HTML, user enters PIN normally

})();
