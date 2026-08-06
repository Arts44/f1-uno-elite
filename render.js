/* ══════════════════════════════════════════════════════════
   RENDER — grid, modal, views, toast
   ══════════════════════════════════════════════════════════ */
import { DEBUG, log } from './logger.js';
import { t } from './i18n.js';
import {
  CARDS_DB, CARD_TYPES, RARITIES, RARITY_ORDER, TYPE_BADGE_RARITY, TYPE_BADGE_STYLES, rarityChipClass, rarityChipStyle,
  CATS, CIRCUIT_SVGS, DRIVER_NUMBERS, TEAM_COLORS, TEAM_LOGOS, DRIVER_IMAGES,
  TEAM_LOGO_BG, TEAM_LOGO_NOEFFECTS
} from './data.js';
import {
  getTypeData, setTypeData,
  cardOwned, cardWishlist, cardDoubles, cardFavorite, cardTotalQty,
  cardSetComplete, cardRarity, variantRarity,
  quickAddVariant, undoQuickAdd
} from './storage.js';
import { updateStats, renderStats } from './stats.js';
import { renderBadges } from './badges.js';
import { renderSettings } from './pin.js';
import { renderAccount } from './account.js';

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

/* ── Collection state ── */
export let currentCardId = null;
export let currentView = 'collection'; // 'collection' | 'badges' | 'stats' | 'settings'
export function setCurrentView(view){ currentView = view; }


/* ── Boot skeletons ──────────────────────────────────────────
   initApp() cannot render the grid until four JSON fetches have
   landed. Rather than leave an empty shell (or flash a spinner on
   a warm cache), show skeleton cards — but only if the wait is
   actually perceptible. Below the threshold nothing is drawn at
   all, so a fast start stays visually still. */
const SKELETON_DELAY = 150; // ms — below this, a load reads as instant
let _skeletonTimer = null;

export function showGridSkeleton(count = 12){
  const grid = document.getElementById('cardGrid');
  if(!grid || _skeletonTimer) return;
  _skeletonTimer = setTimeout(() => {
    if(grid.children.length) return;            // real cards beat us to it
    grid.setAttribute('aria-busy', 'true');
    grid.innerHTML = Array.from({length: count}, () => `
      <div class="sk-card" aria-hidden="true">
        <div class="sk-visual"></div>
        <div class="sk-body">
          <div class="sk-line w40"></div>
          <div class="sk-line w70"></div>
          <div class="sk-line w55"></div>
          <div class="sk-chip"></div>
        </div>
      </div>`).join('');
    log('grid skeleton shown');
  }, SKELETON_DELAY);
}

export function hideGridSkeleton(){
  clearTimeout(_skeletonTimer);
  _skeletonTimer = null;
  const grid = document.getElementById('cardGrid');
  if(!grid) return;
  grid.removeAttribute('aria-busy');
  if(grid.querySelector('.sk-card')) grid.innerHTML = '';
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

/* ── Collection render: full grid, sorted by card number, + total ── */
export function renderCollection(){
  const result=[...CARDS_DB].sort((a,b)=>a.id.localeCompare(b.id));
  renderGrid(result);
  // Header counter (owned/total + progress hairline) lives in updateStats()
  // so it refreshes on every collection change, not only on re-renders.
  updateStats();
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
    // Same card rarity (e.g. nitro vs wild, both +3): the type-badge
    // ladder breaks the tie — nitro (mythic) shows over wild
    // (legendary), promos (ultra) over both.
    const tbOrder=Object.keys(TYPE_BADGE_STYLES);
    const tbT=tbOrder.indexOf(TYPE_BADGE_RARITY[t]);
    const tbBest=tbOrder.indexOf(TYPE_BADGE_RARITY[best]);
    if(tbT!==tbBest) return tbT>tbBest?t:best;
    // Same tier: higher quantity wins, keep current if equal
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
  if(!cards.length) return; // DB empty (cannot happen once data is loaded)

  log('Starting to render cards...');
  let renderedCount = 0;
  cards.forEach((card, index)=>{
    log('Rendering card', index, ':', card.id, card.name);
    const isOwned=cardOwned(card.id);
    const isWish=cardWishlist(card.id);
    const isFav=cardFavorite(card.id);
    const isSet=cardSetComplete(card.id);
    const qty=cardTotalQty(card.id);
    renderedCount++;
    log('Card', index, 'isOwned:', isOwned, 'isWish:', isWish, 'isFav:', isFav, 'qty:', qty);
    const bestType=bestOwnedType(card);
    const displayType=bestType||defaultBaseType(card);
    const ct=CARD_TYPES[displayType];
    const rKey=cardRarity(card);
    const rarity=RARITIES[rKey];
    const isEternal=rKey==='eternal';

    // Bar color from card type (neutre si aucune variante sélectionnée)
    const barColor=bestType?ct.color:'rgba(0,0,0,0.06)';

    const el=document.createElement('div');
    let cardClass='card'+(isOwned?' has-owned':'')+(isWish?' has-wishlist':'')+(isFav?' has-favorite':'')+(isSet?' set-complete':'')+(isEternal?' rar-eternal-fx':'');
    // FOILS (simples, duals, nitro, promos, wild) : le dégradé se
    // prolonge sur TOUTE la carte (une seule couche continue, le
    // .card-visual devient transparent) et le texte est posé sur un
    // encadré noir translucide — le traitement wild, généralisé.
    // Types NON-foil : visuel en haut, corps neutre du thème.
    if(bestType && CARD_TYPES[bestType] && CARD_TYPES[bestType].foil){
      cardClass+=` ${CARD_TYPES[bestType].css}`;
    }
    el.className=cardClass;
    el.onclick=e=>{
      if(!e.target.closest('.schip')&&!e.target.closest('.qbtn')&&!e.target.closest('.qadd-pop')) openModal(card.id);
    };

    // Owned types summary. Set complet : posséder 1× chaque type est
    // implicite, donc on n'affiche que les types en exemplaires
    // multiples (×n) — le reste serait du bruit.
    const ownedTypes=card.types.filter(t=>{
      const d=getTypeData(card.id,t);
      return d.owned && (!isSet || (d.qty||0)>1);
    });
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

    el.innerHTML=`
      ${isEternal?'<span class="eternal-spark s1" aria-hidden="true">✦</span><span class="eternal-spark s2" aria-hidden="true">✦</span><span class="eternal-spark s3" aria-hidden="true">✦</span>':''}
      <div class="card-visual ${bestType?ct.css:''}${!isOwned?' not-owned':''}">
        ${card.champion?'<span class="crown">👑</span>':''}
        ${card.category==='reserve'?'<span class="replacement-icon">🔄</span>':''}
        ${isSet?`<span class="set-flag" role="img" aria-label="${t('set.complete')}" title="${t('set.complete')}">🏁</span>`:''}
        ${card.category==='gp' && circuitSVG(card.id,'card') ? circuitSVG(card.id,'card') : card.category==='pilote' && driverNumberHTML(card) ? driverNumberHTML(card) : (card.category==='directeur' || card.category==='reserve') && teamLogoHTML(card.team) ? teamLogoHTML(card.team) : `<span style="font-size:40px">${catEmoji(card.category)}</span>`}
        <button class="qbtn" type="button" data-action="quickAdd" data-card="${card.id}" aria-label="${t('quick.add')}" title="${t('quick.add')}">+</button>
      </div>
      <div class="card-body">
        <div class="card-num">#${card.id} ${card.champion?'· 👑':''}</div>
        <div class="card-name">${card.name} ${card.category==='pilote'?card.nationality||'':''} ${card.retired?`<span class="retired-badge">${t('m.retired')}</span>`:''}</div>
        <div class="card-year">${card.season||2025}</div>
        <div class="card-team">${TEAM_COLORS[card.team]?`<span class="team-dot" style="background:${TEAM_COLORS[card.team]}"></span>`:''}${card.team||''}</div>
        <div class="card-rarity-row">
          <span class="card-rarity${rarityChipClass(rKey)}" style="${rarityChipStyle(rKey,rarity.color)}">${t('rar.'+rKey)} ${isEternal?`<span class="eternal-stars">${'✦'.repeat(rarity.stars)}</span>`:'★'.repeat(rarity.stars)}</span>
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
  renderCollection();
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
  updateStats(); renderCollection();
}

/* ══════════════════════════════════════════════════════════ MODAL */
export function openModal(id){
  const card=CARDS_DB.find(c=>c.id===id);
  if(!card) return;
  currentCardId=id;

  updateModalVisual(card);
  const rarity=RARITIES[cardRarity(card)];

  document.getElementById('moEmoji').innerHTML = card.image ? `<img src="${card.image}" alt="${card.name}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--r-xl) var(--r-xl) 0 0;">` : (card.category==='gp' && circuitSVG(card.id,'modal') ? circuitSVG(card.id,'modal') : card.category==='pilote' && driverNumberHTML(card) ? driverNumberHTML(card) : (card.category==='directeur' || card.category==='reserve') && teamLogoHTML(card.team) ? teamLogoHTML(card.team) : catEmoji(card.category));
  document.getElementById('moNum').textContent=`#${card.id} · ${CATS[card.category]?.label||card.category}`;
  document.getElementById('moName').textContent=card.name + (card.category==='pilote'?` ${card.nationality||''}`:'');
  document.getElementById('moTeam').textContent=card.team||'';

  _renderModalTags(card);

  document.getElementById('moDesc').textContent = (typeof window.getCardDesc==='function'?window.getCardDesc(card.name):'')||card.description||'';

  // "Card #" and "Category" used to sit here too — both already appear in
  // the header line above (#005 · PILOTE), so they were pure duplication
  // competing with the two figures that actually carry information.
  document.getElementById('moInfo').innerHTML=`
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



/* Modal header tags (champion, card tags, rarity). Factored so a qty
   change can refresh the RARITY tag live — adding/removing a foil can
   move the card's rarity while the modal stays open. */
function _renderModalTags(card){
  const tagsEl=document.getElementById('moTags');
  if(!tagsEl) return;
  tagsEl.innerHTML='';
  const addTag=(cls,txt)=>{const s=document.createElement('span');s.className=`mtag ${cls}`;s.textContent=txt;tagsEl.appendChild(s);};
  if(card.champion) addTag('champion',`👑 Champion ${card.championYears.join(', ')}`);
  const tagMap={legend:'⭐ Légende',fan_favorite:'❤️ Fan Favorite',rising_star:'🌟 Rising Star',top_driver:'🎯 Top Driver',legendary:'🔱 Légendaire',prestige:'💫 Prestige',night_race:'🌙 Nuit',high_speed:'⚡ Vitesse'};
  (card.tags||[]).forEach(t=>{if(tagMap[t]) addTag(t,tagMap[t]);});

  // Rarity is the card's most structuring attribute, so it gets its own
  // line right under the identity block instead of being mixed into the
  // champion/legend tag soup below.
  const rarEl=document.getElementById('moRarity');
  if(rarEl){
    const key=cardRarity(card);
    const rarity=RARITIES[key];
    rarEl.innerHTML='';
    const rt=document.createElement('span');
    rt.className='mtag mtag-rarity'+rarityChipClass(key);
    rt.style.cssText=rarityChipStyle(key,rarity.color);
    if(key==='eternal'){
      rt.innerHTML=`<span class="eternal-stars">${'✦'.repeat(rarity.stars)}</span> ${t('rar.'+key)||rarity.label}`;
    } else {
      rt.textContent=`${'★'.repeat(rarity.stars)} ${t('rar.'+key)||rarity.label}`;
    }
    rarEl.appendChild(rt);
  }
  _renderModalStatus(card);
}

/* At-a-glance state of the card — owned / doubles / wishlist / favourite.
   Read-only: the write paths stay on the grid chips and the type cells.
   Reuses the sidebar's status.* keys, so no new translations. */
function _renderModalStatus(card){
  const el=document.getElementById('moStatus');
  if(!el) return;
  el.innerHTML='';
  const states=[
    ['owned',    '✓',  cardOwned(card.id),    'status.owned'],
    ['doubles',  '🔄', cardDoubles(card.id),  'status.doubles'],
    ['wishlist', '⭐', cardWishlist(card.id), 'status.wishlist'],
    ['favorite', '❤️', cardFavorite(card.id), 'status.fav'],
  ];
  states.forEach(([id,icon,on,key])=>{
    const s=document.createElement('span');
    s.className=`mo-st${on?' on':''}`;
    s.textContent=`${icon} ${t(key)||id}`;
    el.appendChild(s);
  });
}

/* Single source of truth for the modal header visual: the SAME
   tv-<type> class as the grid, full effect (the old copies of this
   logic stripped the _foil suffix — mapping nitro/duals onto CSS
   classes that don't exist → black header after a qty change). */
function updateModalVisual(card){
  const vis=document.getElementById('moVis');
  if(!vis) return;
  const best=bestOwnedType(card);
  const isSet=cardSetComplete(card.id);
  const isEternal=cardRarity(card)==='eternal';
  vis.className = (best ? `modal-visual ${CARD_TYPES[best].css}` : 'modal-visual not-owned') + (isSet?' set-complete':'') + (isEternal?' rar-eternal-fx':'');
  // Étoiles ✦ éternel — mêmes marqueurs que sur la tuile
  vis.querySelectorAll('.eternal-spark').forEach(s=>s.remove());
  if(isEternal){
    ['s1','s2','s3'].forEach(cls=>{
      const sp=document.createElement('span');
      sp.className='eternal-spark '+cls;
      sp.setAttribute('aria-hidden','true');
      sp.textContent='✦';
      vis.appendChild(sp);
    });
  }
  // Badge 🏁 « set complet » — même marqueur que sur la tuile
  let flag=vis.querySelector('.set-flag');
  if(isSet && !flag){
    flag=document.createElement('span');
    flag.className='set-flag';
    flag.setAttribute('role','img');
    flag.setAttribute('aria-label',t('set.complete'));
    flag.title=t('set.complete');
    flag.textContent='🏁';
    vis.appendChild(flag);
  } else if(!isSet && flag){
    flag.remove();
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
  updateModalVisual(card);
  _renderModalTags(card);
  renderCollection();
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
  updateModalVisual(card);
  _renderModalTags(card);
  updateStats(); renderCollection();
}

export function closeMoOverlay(e){ if(e.target===document.getElementById('mo')) closeMo(); }
export function closeMo(){ document.getElementById('mo').classList.remove('open'); currentCardId=null; }

/* ══════════════════════════════════════════════════════════ NAV BEAD
   Barre de navigation à pastille : silhouette en UN path SVG
   paramétrique (pilule + encoche circulaire), la pastille glisse en
   CSS (transform 280 ms) et l'encoche suit via un tween rAF one-shot
   — aucune animation continue. Les .bn-tab et data-view sont
   inchangés (tutoriel, délégation, tests). */
const BEAD_H = 58, BEAD_NR = 31, BEAD_CORNER = 29;
let _beadW = 0, _beadCx = null, _beadAnim = null;

function _beadPath(W, cx){
  const f = 10, r = BEAD_NR - 4, dip = 6, C = BEAD_CORNER;
  return [
    `M ${C} 0`, `H ${cx - BEAD_NR - f}`,
    `C ${cx - BEAD_NR - f/2} 0 ${cx - BEAD_NR - 1} ${dip*0.35} ${cx - r} ${dip}`,
    `A ${r} ${r} 0 0 0 ${cx + r} ${dip}`,
    `C ${cx + BEAD_NR + 1} ${dip*0.35} ${cx + BEAD_NR + f/2} 0 ${cx + BEAD_NR + f} 0`,
    `H ${W - C}`, `A ${C} ${C} 0 0 1 ${W} ${C}`, `V ${BEAD_H - C}`,
    `A ${C} ${C} 0 0 1 ${W - C} ${BEAD_H}`, `H ${C}`,
    `A ${C} ${C} 0 0 1 0 ${BEAD_H - C}`, `V ${C}`, `A ${C} ${C} 0 0 1 ${C} 0`, 'Z',
  ].join(' ');
}

function _beadTabs(){ return [...document.querySelectorAll('.bn-tab')]; }
function _beadActiveIdx(){ return Math.max(0, _beadTabs().findIndex(t => t.classList.contains('active'))); }
function _beadCxFor(i){ return _beadW / Math.max(1, _beadTabs().length) * (i + 0.5); }
const _beadReduce = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function layoutNavBead(){
  const bar = document.getElementById('beadBar');
  const inner = document.getElementById('beadInner');
  if(!bar || !inner) return;
  _beadW = Math.min(window.innerWidth - 24, 560);
  inner.style.width = _beadW + 'px';
  bar.setAttribute('width', _beadW);
  bar.setAttribute('height', BEAD_H);
  bar.setAttribute('viewBox', `0 0 ${_beadW} ${BEAD_H}`);
  _beadCx = _beadCxFor(_beadActiveIdx());
  bar.innerHTML = `<path d="${_beadPath(_beadW, _beadCx)}"/>`;
  const bead = document.getElementById('navBead');
  if(bead){
    bead.style.transition = 'none';
    bead.style.transform = `translateX(${_beadCx - 24}px)`;
    void bead.offsetWidth;
    bead.style.transition = '';
    const icon = _beadTabs()[_beadActiveIdx()]?.querySelector('.bn-icon');
    if(icon) bead.textContent = icon.textContent;
  }
}

export function updateNavBead(){
  const bar = document.getElementById('beadBar');
  const bead = document.getElementById('navBead');
  if(!bar || !bead || !bar.firstElementChild){ return; }
  if(!_beadW) layoutNavBead();
  const idx = _beadActiveIdx();
  const target = _beadCxFor(idx);
  if(target === _beadCx) return;
  const icon = _beadTabs()[idx]?.querySelector('.bn-icon');
  if(icon) bead.textContent = icon.textContent;
  bead.style.transform = `translateX(${target - 24}px)`;
  if(_beadReduce()){
    bar.firstElementChild.setAttribute('d', _beadPath(_beadW, target));
    _beadCx = target;
    return;
  }
  cancelAnimationFrame(_beadAnim);
  const from = _beadCx, t0 = performance.now(), DUR = 280;
  const ease = x => 1 - Math.pow(1 - x, 3);
  const step = now => {
    const k = Math.min(1, (now - t0) / DUR);
    _beadCx = from + (target - from) * ease(k);
    bar.firstElementChild.setAttribute('d', _beadPath(_beadW, _beadCx));
    if(k < 1) _beadAnim = requestAnimationFrame(step);
  };
  _beadAnim = requestAnimationFrame(step);
}

export function initNavBead(){
  layoutNavBead();
  window.addEventListener('resize', layoutNavBead);
}

/* ══════════════════════════════════════════════════════════ QUICK ADD
   Bouton « + » sur la tuile → mini-sélecteur de variantes → +1 qty,
   toast avec Annuler. Les écritures passent par quickAddVariant()
   (storage.js) ; l'ouverture de fiche exclut .qbtn/.qadd-pop. */
export function toggleQuickAdd(cardId, btnEl){
  const existing=document.querySelector('.qadd-pop');
  const wasForSame=existing && existing.dataset.card===cardId;
  if(existing) existing.remove();
  if(wasForSame) return; // re-clic sur le même + : simple fermeture
  const card=CARDS_DB.find(c=>c.id===cardId);
  if(!card || !btnEl) return;
  const pop=document.createElement('div');
  pop.className='qadd-pop';
  pop.dataset.card=cardId;
  pop.setAttribute('role','menu');
  pop.setAttribute('aria-label',t('quick.pick'));
  pop.innerHTML=card.types.map(ty=>{
    const ct=CARD_TYPES[ty];
    const d=getTypeData(cardId,ty);
    return `<button type="button" class="qadd-type" role="menuitem" data-action="quickAddType" data-card="${cardId}" data-type="${ty}" title="${ct.label}" aria-label="${ct.label}">${ct.icon}${(d.qty||0)>0?`<span class="qadd-qty">${d.qty}</span>`:''}</button>`;
  }).join('');
  btnEl.closest('.card-visual').appendChild(pop);
  const first=pop.querySelector('.qadd-type');
  if(first) first.focus();
}

export function closeQuickAdd(target){
  const pop=document.querySelector('.qadd-pop');
  if(pop && (!target || (!target.closest('.qadd-pop') && !target.closest('.qbtn')))) pop.remove();
}

export function quickAddType(cardId, typeId){
  const prev=quickAddVariant(cardId, typeId);
  const ct=CARD_TYPES[typeId];
  showToast(`${ct?ct.icon+' ':''}${t('quick.added')}`, {
    actionLabel:t('quick.undo'),
    onAction:()=>{ undoQuickAdd(cardId, typeId, prev); updateStats(); renderCollection(); }
  });
  updateStats(); renderCollection(); // re-render : le popover disparaît avec la grille
}

/* TOAST — msg simple, ou avec bouton d'action ({actionLabel, onAction}) */
export function showToast(msg, opts){
  const el=document.getElementById('toast');
  if(!el) return;
  el.textContent='';
  el.append(document.createTextNode(msg));
  if(opts && opts.actionLabel){
    const b=document.createElement('button');
    b.type='button';
    b.className='toast-action';
    b.textContent=opts.actionLabel;
    b.onclick=()=>{ el.classList.remove('show'); if(opts.onAction) opts.onAction(); };
    el.appendChild(b);
  }
  el.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t=setTimeout(()=>el.classList.remove('show'), opts&&opts.actionLabel?4000:1600);
}

/* ══════════════════════════════════════════════════════════ VIEWS */
export function switchView(view){
  currentView = view;
  const collectionView = document.getElementById('collectionView');
  const badgesView = document.getElementById('badgesView');
  const statsView = document.getElementById('statsView');
  const settingsView = document.getElementById('settingsView');
  const accountView = document.getElementById('accountView');

  collectionView.style.display = 'none';
  badgesView.classList.remove('active');
  if(statsView) statsView.classList.remove('active');
  if(settingsView) settingsView.classList.remove('active');
  if(accountView) accountView.classList.remove('active');

  // Bottom nav tabs
  document.querySelectorAll('.bn-tab').forEach(t => {
    t.classList.toggle('active', t.getAttribute('data-view') === view);
  });
  updateNavBead();

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
    case 'account':
      if(accountView){ accountView.classList.add('active'); renderAccount(); }
      collectionView.style.display = 'none';
      break;
    default:
      collectionView.style.display = '';
  }
}
