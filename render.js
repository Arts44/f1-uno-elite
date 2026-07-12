/* ══════════════════════════════════════════════════════════
   RENDER — grid, sidebar, filters, search, modal, views, toast
   ══════════════════════════════════════════════════════════ */
import { DEBUG, log } from './logger.js';
import { t } from './i18n.js';
import {
  CARDS_DB, CARD_TYPES, RARITIES, RARITY_KEYS, RARITY_ORDER, TYPE_BADGE_RARITY, TYPE_BADGE_STYLES, rarityTextColor,
  CATS, CIRCUIT_SVGS, DRIVER_NUMBERS, TEAM_COLORS, TEAM_LOGOS, DRIVER_IMAGES,
  TEAM_LOGO_BG, TEAM_LOGO_NOEFFECTS
} from './data.js';
import {
  getTypeData, setTypeData,
  cardOwned, cardWishlist, cardDoubles, cardFavorite, cardMissing, cardTotalQty,
  cardRarity, variantRarity, baseCardRarity
} from './storage.js';
import { updateStats, renderStats } from './stats.js';
import { renderBadges } from './badges.js';
import { renderSettings } from './pin.js';

/* ── Visual helpers ── */
export function driverNumberHTML(card){
  const d=DRIVER_NUMBERS[card.name];
  const img=DRIVER_IMAGES[card.name];
  if(!d && !img) return null;
  const col=TEAM_COLORS[card.team]||'#fff';
  const hasImg=!!img;
  const imgHtml=img?`<img class="driver-img" src="${img}" alt="${card.name}" crossorigin="anonymous" onerror="this.style.display='none';this.nextElementSibling&&this.parentElement.classList.add('no-img')"/>`:'';
  const numHtml=d?`<span class="dn-num ${d.cls}">${d.n}</span>`:'';
  return `<div class="driver-number${hasImg?'':' no-img'}" style="--tc:${col}">${imgHtml}${numHtml}</div>`;
}

export function teamLogoHTML(team){
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

export function circuitSVG(cardId, size='card'){
  const c = CIRCUIT_SVGS[cardId];
  if(!c) return null;
  const drs = (c.d||[]).map(z=>`<line x1="${z.s.split(',')[0]}" y1="${z.s.split(',')[1]}" x2="${z.e.split(',')[0]}" y2="${z.e.split(',')[1]}" stroke="rgba(0,255,100,0.8)" stroke-width="10" stroke-linecap="round" opacity="0.6"/>`).join('');
  return `<svg class="circuit-svg" viewBox="0 0 500 500" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <path class="track-path" d="${c.p}" fill="none" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
    ${drs}
  </svg>`;
}

/* ── Collection / filter state ── */
export let filters = {status:'all', category:null, type:null, rarity:null, year:null, search:'', champions:false};
export let favoriteFirst = false;
export function setFavoriteFirst(v){ favoriteFirst = v; } // restore hook (tutorial)
export let currentCardId = null;
export let sectionStates = {status: true, categories: true, types: true, rarities: true, year: true}; // false = développé, true = condensé
export let currentView = 'collection'; // 'collection' | 'badges' | 'stats' | 'settings'
export function setCurrentView(view){ currentView = view; }

/* ══════════════════════════════════════════════════════════ SIDEBAR */
export function renderSidebar(){
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
      const r=TYPE_BADGE_STYLES[TYPE_BADGE_RARITY[ct.id]]||{};
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
      btn.className='fpill rar-pill'+(filters.rarity===rid?' active':'');
      const isDivine = rid==='divine';
      // --rarc drives the tinted background/border (CSS color-mix), so the
      // .active state can still override it cleanly (no inline background)
      btn.style.setProperty('--rarc', isDivine?'#8B5CF6':r.color);
      btn.innerHTML=`<span class="${isDivine?'rar-divine-bg':''}" style="width:13px;height:13px;border-radius:4px;${isDivine?'':`background:${r.color};`}display:inline-block;flex-shrink:0"></span>${t('rar.'+rid)}<span class="fc${isDivine?' rar-divine-text':''}" style="${isDivine?'':`color:${r.color}`}">${'★'.repeat(r.stars)}</span>`;
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
export function setStatus(s){
  filters.status=s;
  // Mettre à jour uniquement les boutons dans la sidebar flottante
  const floatingSidebar = document.getElementById('floating-sidebar');
  if (floatingSidebar) {
    floatingSidebar.querySelectorAll('.sbtn').forEach(b=>b.classList.toggle('active',b.dataset.f===s));
  }
  applyFilters();
}
export function toggleYearFilter(year){
  filters.year=filters.year===year?null:year;
  renderSidebar();applyFilters();
}

export function toggleSection(section) {
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

export function resetFilters(){
  filters={status:'all',category:null,type:null,rarity:null,year:null,search:'',champions:false};
  const searchInputEl = document.getElementById('searchInput');
  if (searchInputEl) searchInputEl.value='';
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

export function toggleChampions(){
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

export function toggleChampionFilter(){
  filters.champions = !filters.champions;
  const btn = document.getElementById('sidebarChampFilter');
  const stateEl = document.getElementById('sidebarChampState');
  if(stateEl) stateEl.textContent = filters.champions ? t('fav.on') : t('fav.off');
  if(btn) btn.classList.toggle('active', filters.champions);
  applyFilters();
}

export function toggleTheme(){
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

export function toggleFavoriteFirst(){
  favoriteFirst = !favoriteFirst;
  const stateEl = document.getElementById('favToggleState');
  const sidebarStateEl = document.getElementById('sidebarFavToggleState');
  const sidebarBtn = document.getElementById('sidebarFavToggleBtn');
  if(stateEl) stateEl.textContent = favoriteFirst ? t('fav.on') : t('fav.off');
  if(sidebarStateEl) sidebarStateEl.textContent = favoriteFirst ? t('fav.on') : t('fav.off');
  if(sidebarBtn) sidebarBtn.classList.toggle('active', favoriteFirst);
  applyFilters();
}

export function applyFilters(){
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
export const catEmoji=id=>CATS[id]?.emoji||'🃏';

export function bestOwnedType(card){
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

export function defaultBaseType(card){
  // On force un type non-foil pour éviter l'effet lumineux si tu n'as pas sélectionné de foil
  return card.types.find(t=>CARD_TYPES[t] && !CARD_TYPES[t].foil) || card.types[0];
}

export function renderGrid(cards){
  const grid=document.getElementById('cardGrid');
  if(DEBUG){
    const appWrapper = document.getElementById('app-wrapper');
    const loginScreen = document.getElementById('login-screen');
    log('login-screen element:', loginScreen);
    log('login-screen display:', loginScreen ? loginScreen.style.display : 'N/A');
    log('app-wrapper element:', appWrapper);
    log('app-wrapper display:', appWrapper ? appWrapper.style.display : 'N/A');
    log('app-wrapper visibility:', appWrapper ? window.getComputedStyle(appWrapper).visibility : 'N/A');
    log('app-wrapper height:', appWrapper ? appWrapper.offsetHeight : 'N/A');
    log('cardGrid element:', grid);
    log('cardGrid display:', grid ? grid.style.display : 'N/A');
    log('cardGrid visibility:', grid ? window.getComputedStyle(grid).visibility : 'N/A');
  }
  if(grid) {
    if(DEBUG){
      log('cardGrid parent:', grid.parentElement);
      log('cardGrid parent display:', grid.parentElement ? grid.parentElement.style.display : 'N/A');
      log('cardGrid parent height:', grid.parentElement ? grid.parentElement.offsetHeight : 'N/A');
    }
    // Force display grid and parent — but never un-hide the collection
    // view while another view (badges/stats/settings) is active
    grid.style.display = 'grid';
    grid.style.visibility = 'visible';
    grid.style.opacity = '1';
    if(grid.parentElement && currentView === 'collection') {
      grid.parentElement.style.display = 'block';
      grid.parentElement.style.visibility = 'visible';
    }
  }
  grid.innerHTML='';
  log('renderGrid called with', cards.length, 'cards');
  if(!cards.length){
    grid.innerHTML='<div class="empty"><div class="ei">🔍</div><p>Aucune carte ne correspond à vos filtres.</p></div>';
    return;
  }

  log('Starting to render cards...');
  let renderedCount = 0;
  cards.forEach((card, index)=>{
    log('Rendering card', index, ':', card.id, card.name);
    const isOwned=cardOwned(card.id);
    const isWish=cardWishlist(card.id);
    const isFav=cardFavorite(card.id);
    const qty=cardTotalQty(card.id);
    renderedCount++;
    log('Card', index, 'isOwned:', isOwned, 'isWish:', isWish, 'isFav:', isFav, 'qty:', qty);
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
          <span class="card-rarity${cardRarity(card)==='divine'?' rar-divine-bg':''}" style="${cardRarity(card)==='divine'?'':`background:${rarity.color};color:${rarityTextColor(rarity.color)}`}">${t('rar.'+cardRarity(card))} ${'★'.repeat(rarity.stars)}</span>
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
  log('Finished rendering', renderedCount, 'cards');
  if(DEBUG && renderedCount > 0) {
    const firstCard = grid.querySelector('.card');
    if(firstCard) {
      log('First card computed styles:', window.getComputedStyle(firstCard));
      log('First card display:', window.getComputedStyle(firstCard).display);
      log('First card visibility:', window.getComputedStyle(firstCard).visibility);
      log('First card opacity:', window.getComputedStyle(firstCard).opacity);
      log('First card height:', firstCard.offsetHeight);
      log('First card z-index:', window.getComputedStyle(firstCard).zIndex);
      log('First card position:', window.getComputedStyle(firstCard).position);
      log('First card top:', window.getComputedStyle(firstCard).top);
      log('First card left:', window.getComputedStyle(firstCard).left);
      log('Grid overflow:', window.getComputedStyle(grid).overflow);
      log('Grid position:', window.getComputedStyle(grid).position);
    }
  }
}

/* Quick toggle: applies to the FIRST type of the card (or opens modal for more control) */
export function quickToggle(cardId, status, e){
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

export function quickQty(cardId, delta, e){
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
        <span class="sr-sub sr-rar${rar==='divine'?' rar-divine-bg':''}" style="${rar==='divine'?'':`background:${rarData.color||'var(--surface3)'};color:${rarityTextColor(rarData.color)}`}">${t('rar.'+rar)||rarData.label||rar}</span>
      </div>`;
    }).join('') || '<div class="sr-item"><span class="sr-name" style="color:var(--tx3)">Aucun résultat</span></div>';
    searchDd.classList.add('open');
  } else {
    searchDd.classList.remove('open');
  }
  applyFilters();
}

export function initSearch() {
  searchInput = document.getElementById('searchInput');
  searchDd = document.getElementById('searchDD');
  const sidebarSearchInput = document.getElementById('sidebarSearchInput');

  const debouncedMain = debounce(()=>_handleSearch(searchInput.value, sidebarSearchInput), 200);
  const debouncedSidebar = debounce(()=>_handleSearch(sidebarSearchInput.value, searchInput), 200);

  if(searchInput) searchInput.addEventListener('input', debouncedMain);
  if(sidebarSearchInput) sidebarSearchInput.addEventListener('input', debouncedSidebar);
}

export function selectCard(id){
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
export function openModal(id){
  const card=CARDS_DB.find(c=>c.id===id);
  if(!card) return;
  currentCardId=id;

  const bestType=bestOwnedType(card);
  const vis=document.getElementById('moVis');
  let ct=null;
  if(bestType){
    // The modal mirrors the grid: same tv-<type> class, full effect.
    // (It used to strip the _foil suffix, which mapped nitro/wild/dual
    // foils onto classes that don't exist → dull default background.)
    ct=CARD_TYPES[bestType];
    vis.className=`modal-visual ${ct.css}`;
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
  { // rarity tag: solid rarity color (divine keeps its animated gradient)
    const rt=document.createElement('span');
    rt.className='mtag'+(cardRarity(card)==='divine'?' rar-divine-bg':'');
    if(cardRarity(card)!=='divine'){ rt.style.background=rarity.color; rt.style.color=rarityTextColor(rarity.color); }
    rt.textContent=`${'★'.repeat(rarity.stars)} ${t('rar.'+cardRarity(card))||rarity.label}`;
    tagsEl.appendChild(rt);
  }

  document.getElementById('moDesc').textContent = (typeof window.getCardDesc==='function'?window.getCardDesc(card.name):'')||card.description||'';

  document.getElementById('moInfo').innerHTML=`
    <div class="mib"><div class="mib-l">${t('mo.card')||'Card'}</div><div class="mib-v">#${card.id}</div></div>
    <div class="mib"><div class="mib-l">${t('mo.category')||'Category'}</div><div class="mib-v">${catEmoji(card.category)} ${t('cat.'+card.category)||CATS[card.category]?.label||''}</div></div>
    <div class="mib"><div class="mib-l">${t('mo.types_avail')||'Types'}</div><div class="mib-v">${card.types.length} type(s)</div></div>
    <div class="mib"><div class="mib-l">${t('mo.total_copies')||'Total copies'}</div><div class="mib-v" style="color:var(--red)">${cardTotalQty(id)}</div></div>
  `;

  renderModalTypes(card);
  document.getElementById('mo').classList.add('open');
}

export function renderModalTypes(card){
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

export function toggleMoType(cardId, typeId, status){
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

export function changeMoQty(cardId, typeId, delta){
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

export function closeMoOverlay(e){ if(e.target===document.getElementById('mo')) closeMo(); }
export function closeMo(){ document.getElementById('mo').classList.remove('open'); currentCardId=null; }

/* TOAST */
export function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),1600);
}

/* ══════════════════════════════════════════════════════════ VIEWS */
export function switchView(view){
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

/* ── SIDEBAR TOGGLE ── */
export function toggleSidebar() {
  const sidebar = document.getElementById('floating-sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const sidebarToggle = document.getElementById('sidebar-toggle');

  sidebar.classList.toggle('open');
  sidebarOverlay.classList.toggle('show');
  sidebarToggle.classList.toggle('sidebar-open');
}

/* ── KEYBOARD SHORTCUTS ── */
export function handleGlobalKeyPress(event) {
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
