/* ══════════════════════════════════════════════════════════
   STATS — live header/counter updates + stats view rendering
   ══════════════════════════════════════════════════════════ */
import { t } from './i18n.js';
import { CARDS_DB, CATS, CARD_TYPES, RARITY_KEYS, RARITIES, RARITY_ORDER, TEAM_COLORS, AUTO_BADGES, rarityTextColor } from './data.js';
import {
  getTypeData, cardOwned, cardWishlist, cardDoubles, cardMissing, cardFavorite,
  cardRarity, variantRarity, cardTotalQty
} from './storage.js';
import { getHistory } from './history.js';
import { loadManualBadges, isAutoBadgeUnlocked, manualBadges, renderBadges, updateUserTitle } from './badges.js';
import { currentView } from './render.js';

// Pure aggregates over the current CARDS_DB + collection state —
// extracted from updateStats() (DOM-free, unit-testable).
export function computeStats(){
  const total=CARDS_DB.length;
  const owned=CARDS_DB.filter(c=>cardOwned(c.id)).length;
  const wish=CARDS_DB.filter(c=>cardWishlist(c.id)).length;
  const doubles=CARDS_DB.filter(c=>cardDoubles(c.id)).length;
  const missing=CARDS_DB.filter(c=>cardMissing(c.id)).length;
  const fav=CARDS_DB.filter(c=>cardFavorite(c.id)).length;

  // Total d'exemplaires (toutes les quantités de tous les types)
  let totalExemplaires = 0;
  CARDS_DB.forEach(card => {
    card.types.forEach(typeId => {
      const d = getTypeData(card.id, typeId);
      if (d.owned && d.qty > 0) {
        totalExemplaires += d.qty;
      }
    });
  });

  const pct=Math.round((owned/total)*100);
  return { total, owned, wish, doubles, missing, fav, totalExemplaires, pct };
}

export function updateStats(){
  const { total, owned, wish, doubles, missing, fav, totalExemplaires, pct } = computeStats();

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

export function renderStats(){
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
    // Semantic completion steps (theme-aware vars, no muddy HSL midtones):
    // low = red, mid = amber, high = owned green. These are progress
    // steps, NOT the wishlist/missing categories — they keep their own
    // --pr-* tokens so recolouring a stat category never shifts them.
    if(p >= 67) return 'var(--st-owned)';
    if(p >= 34) return 'var(--pr-mid)';
    return 'var(--pr-low)';
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
    // solid color dot (same visual weight as team/type rows) + colored label
    const dot = rKey==='divine'
      ? '<span class="sv-team-dot rar-divine-bg"></span>'
      : `<span class="sv-team-dot" style="background:${rar.color}"></span>`;
    const label = rKey==='divine'
      ? `<span class="rar-divine-text">${t('rar.'+rKey)}</span>`
      : `<span style="color:${rar.color}">${t('rar.'+rKey)}</span>`;
    return svRow(dot, label, ownedAtRar, reachable, rarPct);
  }).join('');

  // — Cartes phares (highlights) — computed from current data only.
  // "Last added card" is deliberately omitted: no per-card timestamp
  // is stored, and we don't invent data.
  const ownedCards = CARDS_DB.filter(c=>cardOwned(c.id));
  let featuredHtml;
  if(ownedCards.length === 0){
    featuredHtml = `<div class="sv-empty-note">${t('st.empty_coll')}</div>`;
  } else {
    const rarest = ownedCards.reduce((b,c)=> (RARITY_ORDER[cardRarity(c)]||0) > (RARITY_ORDER[cardRarity(b)]||0) ? c : b);
    const most = ownedCards.reduce((b,c)=> cardTotalQty(c.id) > cardTotalQty(b.id) ? c : b);
    const rr = RARITIES[cardRarity(rarest)]||{};
    featuredHtml = `<div class="sv-feat">
      <div class="sv-feat-item">
        <div class="sv-feat-label">${t('st.feat_rarest')}</div>
        <div class="sv-feat-name">${CATS[rarest.category]?.emoji||'🃏'} #${rarest.id} ${rarest.name}</div>
        <div class="sv-feat-sub sv-feat-chip${cardRarity(rarest)==='divine'?' rar-divine-bg':''}" style="${cardRarity(rarest)==='divine'?'':`background:${rr.color||'var(--surface3)'};color:${rarityTextColor(rr.color)}`}">${t('rar.'+cardRarity(rarest))} ${'★'.repeat(rr.stars||1)}</div>
      </div>
      <div class="sv-feat-item">
        <div class="sv-feat-label">${t('st.feat_most_copies')}</div>
        <div class="sv-feat-name">${CATS[most.category]?.emoji||'🃏'} #${most.id} ${most.name}</div>
        <div class="sv-feat-sub">📦 ×${cardTotalQty(most.id)}</div>
      </div>
    </div>`;
  }

  // — Donut SVG: owned cards by rarity (colors from RARITIES metadata) —
  const donutData = RARITY_KEYS
    .map(k => ({k, n: ownedCards.filter(c=>cardRarity(c)===k).length, color:(RARITIES[k]||{}).color||'#888'}))
    .filter(d => d.n > 0);
  let donutHtml = '';
  if(donutData.length){
    const R = 40, C = 2*Math.PI*R;
    let offset = 0;
    // Divine segment: slowly rotating iridescent SVG gradient (SMIL, no JS
    // per frame). Static multicolor gradient when the user prefers reduced
    // motion; d.color stays as the plain fallback for the other rarities.
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const divineDefs = donutData.some(d => d.k==='divine') ? `<defs>
        <linearGradient id="divineGrad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="120" y2="120">
          <stop offset="0" stop-color="#8B5CF6"/><stop offset="0.25" stop-color="#3B82F6"/>
          <stop offset="0.5" stop-color="#14B8A6"/><stop offset="0.75" stop-color="#FACC15"/>
          <stop offset="1" stop-color="#F472B6"/>
          ${reduceMotion ? '' : '<animateTransform attributeName="gradientTransform" type="rotate" from="0 60 60" to="360 60 60" dur="9s" repeatCount="indefinite"/>'}
        </linearGradient>
      </defs>` : '';
    // 2px surface gap between adjacent segments (skipped for a lone segment)
    const GAP = donutData.length > 1 ? 2 : 0;
    const segs = donutData.map(d => {
      const len = d.n/ownedCards.length*C;
      const drawn = Math.max(len - GAP, 0.8);
      const stroke = d.k==='divine' ? 'url(#divineGrad)' : d.color;
      const s = `<circle r="${R}" cx="60" cy="60" fill="none" stroke="${stroke}" stroke-width="16" stroke-dasharray="${drawn.toFixed(2)} ${(C-drawn).toFixed(2)}" stroke-dashoffset="${(-(offset + GAP/2)).toFixed(2)}" transform="rotate(-90 60 60)"/>`;
      offset += len;
      return s;
    }).join('');
    const legend = donutData.map(d =>
      `<div class="sv-leg-item"><span class="sv-leg-dot${d.k==='divine'?' rar-divine-bg':''}" style="${d.k==='divine'?'':`background:${d.color}`}"></span>${t('rar.'+d.k)}<span class="sv-leg-n">${d.n}</span></div>`
    ).join('');
    donutHtml = `<div class="sv-donut-row">
      <svg class="sv-donut" viewBox="0 0 120 120" role="img" aria-label="${t('st.chart_rarity')}">
        ${divineDefs}
        ${segs}
        <text x="60" y="57" text-anchor="middle" class="sv-donut-big">${ownedCards.length}</text>
        <text x="60" y="72" text-anchor="middle" class="sv-donut-small">${t('st.history_owned')}</text>
      </svg>
      <div class="sv-legend">${legend}</div>
    </div>`;
  }

  // — Progression curve (data recorded by history.js on each save;
  //   read-only here, no computation in this hot path) —
  const hist = getHistory();
  let histHtml;
  if(hist.length < 2){
    histHtml = `<div class="sv-empty-note">${t('st.history_empty')}</div>`;
  } else {
    const W=600, H=200, PL=34, PR=12, PT=14, PB=26;
    const t0 = new Date(hist[0].date).getTime();
    const t1 = new Date(hist[hist.length-1].date).getTime();
    const span = Math.max(1, t1 - t0);
    const maxY = Math.max(1, ...hist.map(p=>p.owned));
    const px = p => PL + (new Date(p.date).getTime()-t0)/span*(W-PL-PR);
    const py = p => PT + (1 - p.owned/maxY)*(H-PT-PB);
    const pts = hist.map(p=>`${px(p).toFixed(1)},${py(p).toFixed(1)}`).join(' ');
    const lastP = hist[hist.length-1];
    histHtml = `<svg class="sv-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${t('st.history')}">
      <line x1="${PL}" y1="${PT}" x2="${W-PR}" y2="${PT}" class="sv-grid"/>
      <line x1="${PL}" y1="${H-PB}" x2="${W-PR}" y2="${H-PB}" class="sv-axis"/>
      <polygon points="${PL},${H-PB} ${pts} ${W-PR},${H-PB}" class="sv-area"/>
      <polyline points="${pts}" class="sv-line"/>
      <circle cx="${px(lastP).toFixed(1)}" cy="${py(lastP).toFixed(1)}" r="4" class="sv-dot"/>
      <text x="${PL-6}" y="${PT+4}" text-anchor="end" class="sv-axis-label">${maxY}</text>
      <text x="${PL-6}" y="${H-PB+4}" text-anchor="end" class="sv-axis-label">0</text>
      <text x="${PL}" y="${H-8}" class="sv-axis-label">${hist[0].date.slice(5)}</text>
      <text x="${W-PR}" y="${H-8}" text-anchor="end" class="sv-axis-label">${lastP.date.slice(5)}</text>
    </svg>`;
  }
  histHtml += `<div class="sv-note">${t('st.history_note')}</div>`;

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

    <div class="sv-summary">
      <div class="sv-summary-panel">
        <div class="sv-section-title sv-sub">${t('st.featured')}</div>
        ${featuredHtml}
      </div>
      ${donutHtml ? `<div class="sv-summary-panel">
        <div class="sv-section-title sv-sub">${t('st.chart_rarity')}</div>
        ${donutHtml}
      </div>`:''}
    </div>

    ${catRows   ? `<div class="sv-section-title">${t('st.by_cat')}</div><div class="sv-rows-block">${catRows}</div>`:''}
    ${typeRows  ? `<div class="sv-section-title">${t('st.by_type')}</div><div class="sv-rows-block">${typeRows}</div>`:''}
    ${teamRows  ? `<div class="sv-section-title">${t('st.by_team')}</div><div class="sv-rows-block">${teamRows}</div>`:''}
    ${rarityRows? `<div class="sv-section-title">${t('st.by_rarity')}</div><div class="sv-rows-block">${rarityRows}</div>`:''}

    <div class="sv-section-title">${t('st.history')}</div>
    ${histHtml}
  `;
}
