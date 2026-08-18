/* ══════════════════════════════════════════════════════════
   STATS — live header/counter updates + stats view rendering
   ══════════════════════════════════════════════════════════ */
import { t, tEsc, tp, tpEsc, getLang } from './i18n.js';
import { pageHeadHTML } from './pagehead.js';
import { CARDS_DB, CATS, CARD_TYPES, RARITY_KEYS, RARITIES, RARITY_ORDER, TEAM_COLORS, AUTO_BADGES, MANUAL_BADGES, rarityChipClass, rarityChipStyle, _currentSeason } from './data.js';
import { missingCards, doublesList, tradeList, nearGoals, tradeSheetModel } from './collector.js';
import {
  getTypeData, cardOwned, cardWishlist, cardDoubles, cardMissing, cardFavorite,
  cardRarity, variantRarity, cardTotalQty
} from './storage.js';
import { getHistory } from './history.js';
import { loadManualBadges, isAutoBadgeUnlocked, manualBadges, renderBadges, updateUserTitle, checkNewAutoBadges } from './badges.js';
import { currentView, showToast } from './render.js';
import { shareOrDownloadFile } from './share-file.js';
import { encodeTradeCode, buildTradeLink } from './backup.js';
import { shareTradeSheet } from './profile-card.js';
import { icon, typeIcon } from './icons.js';

/* ── Le héros du manque (1.66.0) — pur, testé aux seuils.
   Sous SEUIL_HERO_POSITIF possédées, la formulation bascule en
   positif : « 101 cartes vous manquent » sur une collection vierge
   serait absurde et démoralisant (garde-fou validé au chiffrage). ── */
export const SEUIL_HERO_POSITIF = 10;
/* En dessous, « cartes phares » ne dit rien : voir sa composition. */
export const SEUIL_PHARES = 5;
export function heroModel(owned, total){
  const missing = total - owned;
  const pct = total ? Math.round(owned / total * 100) : 0;
  if(total > 0 && missing === 0) return { mode: 'done',  big: total, labelKey: 'st.hero_done',  subKey: 'st.hero_done_sub',  subParams: { total } };
  if(owned === 0)                return { mode: 'start', big: total, labelKey: 'st.hero_start', plural: true, subKey: 'st.hero_start_sub', subParams: { total } };
  if(owned < SEUIL_HERO_POSITIF) return { mode: 'early', big: owned, labelKey: 'st.hero_early', plural: true, subKey: 'st.hero_early_sub', subPlural: true, subPluralOn: missing, subParams: { missing, total } };
  return { mode: 'missing', big: missing, labelKey: 'st.hero_missing', plural: true, subKey: 'st.hero_missing_sub', subParams: { owned, total, pct } };
}

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

/* ── Bandeau de la page Collection ─────────────────────────
   Reconstruit une fois, puis mis à jour par valeur : updateStats()
   est appelé à chaque écriture dans la collection, et réécrire
   l'innerHTML à chaque coche ferait clignoter la barre au lieu de
   l'animer. ── */
export function renderCollectionHead(s){
  const el = document.getElementById('collHead');
  if(!el) return;
  // La coquille ne se reconstruit qu'au changement de langue, de
  // saison ou de taille de jeu — pas à chaque coche.
  const key = `${getLang()}|${_currentSeason}|${s.total}`;
  if(el.dataset.k !== key){
    el.dataset.k = key;
    el.innerHTML = pageHeadHTML({
      icon: 'layers',
      title: t('nav.collection'),
      sub: t('ph.coll_sub', { n: s.total, y: _currentSeason }),
      metric: `<div class="phm-coll">
        <div class="phm-bar"><i id="phCollBar" style="width:0%"></i></div>
        <div class="phm-nums">
          <div class="phm-k k-own"><b id="phCollOwned">0</b><span>${t('st.owned')}</span></div>
          <div class="phm-k k-mis"><b id="phCollMissing">0</b><span>${t('st.missing')}</span></div>
          <div class="phm-k k-dbl"><b id="phCollDoubles">0</b><span>${t('st.doubles')}</span></div>
        </div>
      </div>`
    });
  }
  const set = (id, v) => { const n = document.getElementById(id); if(n) n.textContent = v; };
  const bar = document.getElementById('phCollBar');
  if(bar) bar.style.width = s.pct + '%';
  set('phCollOwned', `${s.owned}/${s.total}`);
  set('phCollMissing', s.missing);
  set('phCollDoubles', s.doubles);
}

export function updateStats(){
  // Un badge auto vient-il de tomber ? (toast + persistance — ajout v2.2,
  // la règle « une fois débloqué, toujours débloqué » ne change pas)
  try { checkNewAutoBadges(); } catch(e){ console.error('badge check failed', e); }
  const { total, owned, wish, doubles, missing, fav, totalExemplaires, pct } = computeStats();

  // Bandeau de la page Collection — depuis 1.45.0, le compteur et la
  // barre de progression vivent ici et non plus dans le header global
  // (ils y faisaient doublon sur Collection et hors-sujet ailleurs).
  renderCollectionHead({ total, owned, doubles, missing, pct });

  // Vérifications de sécurité avant de modifier le DOM
  const statOwned = document.getElementById('statOwned');
  if (statOwned) statOwned.innerHTML=`${icon('check')} ${owned} / ${total}`;

  // Mettre à jour la stat possédées dans le header
  const ownedCount = document.getElementById('ownedCount');
  if (ownedCount) ownedCount.textContent=`${owned} possédées`;

  const statWish = document.getElementById('statWish');
  if (statWish) statWish.innerHTML=`${icon('heart')} ${wish} wishlist`;

  const statExemplaires = document.getElementById('statExemplaires');
  if (statExemplaires) statExemplaires.innerHTML=`${icon('box')} ${totalExemplaires} exemplaires`;

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
    champFilter.innerHTML=`${icon('trophy')} ${champCount} Champions`;
  }

  // Update badge tab count
  loadManualBadges();
  let autoUnlocked = 0;
  AUTO_BADGES.forEach(b => { if(isAutoBadgeUnlocked(b)) autoUnlocked++; });
  let manualUnlocked = Object.values(manualBadges).filter(v=>v).length;
  const badgeCountTab = document.getElementById('badgeCountTab');
  if(badgeCountTab) badgeCountTab.textContent = `${autoUnlocked+manualUnlocked}/${AUTO_BADGES.length+MANUAL_BADGES.length}`;
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
    return svRow(icon(cat.icon||'layers'), t('cat.'+catId), catOwned, catCards.length, Math.round((catOwned/catCards.length)*100));
  });
  const champPct = champions > 0 ? Math.round((champOwned/champions)*100) : 0;
  catRowsArr.push(svRow(icon('trophy'), t('st.champions'), champOwned, champions, champPct));
  const catRows = catRowsArr.filter(Boolean).join('');
  const catCount = catRowsArr.filter(Boolean).length;

  // — Par type de carte —
  const typeIds = Object.keys(CARD_TYPES);
  const typeRowsArr = typeIds.map(typeId => {
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
    const dotIcon = `<span class="sv-type-dot${ct.foil?' sv-type-dot-foil':''}" style="${dotStyle}"></span>`;
    return svRow(dotIcon, t('type.'+typeId)||ct.label, ownedWithType, cardsWithType.length, typePct);
  }).filter(Boolean);
  const typeRows = typeRowsArr.join('');
  const typeCount = typeRowsArr.length;

  // — Par équipe —
  const TEAM_SHORT = {
    'Oracle Red Bull Racing':'Red Bull','Scuderia Ferrari HP':'Ferrari','McLaren F1':'McLaren',
    'Mercedes-AMG Petronas Formula One Team':'Mercedes','Aston Martin Aramco Formula One Team':'Aston Martin',
    'BWT Alpine F1 Team':'Alpine','MoneyGram Haas F1 Team':'Haas',
    'Visa Cash App RB Formula One':'RB','Atlassian Williams Racing':'Williams',
    'Stake F1 Team KICK Sauber':'Sauber'
  };
  const teams = [...new Set(CARDS_DB.map(c=>c.team).filter(Boolean))].sort();
  const teamRowsArr = teams.map(team => {
    const teamCards = CARDS_DB.filter(c=>c.team===team);
    if(teamCards.length === 0) return '';
    const teamOwned = teamCards.filter(c=>cardOwned(c.id)).length;
    const teamPct = Math.round((teamOwned/teamCards.length)*100);
    const color = (TEAM_COLORS&&TEAM_COLORS[team]) || 'var(--red)';
    const dot = `<span class="sv-team-dot" style="background:${color}"></span>`;
    return svRow(dot, TEAM_SHORT[team]||team, teamOwned, teamCards.length, teamPct);
  }).filter(Boolean);
  const teamRows = teamRowsArr.join('');
  const teamCount = teamRowsArr.length;

  // — Par rareté —
  const rarityRowsArr = RARITY_KEYS.map(rKey => {
    const rar = RARITIES[rKey];
    if(!rar) return '';
    const ownedAtRar = CARDS_DB.filter(c => cardOwned(c.id) && cardRarity(c) === rKey).length;
    // Une carte peut atteindre rKey soit par une variante, soit par le
    // bonus set complet (+1 au-dessus de sa MEILLEURE variante — c'est
    // le seul chemin vers eternal, les foils clampant à divine).
    const reachable = CARDS_DB.filter(c => {
      const idxs = c.types.map(ty => RARITY_ORDER[variantRarity(c,ty)]);
      return idxs.includes(RARITY_ORDER[rKey]) || Math.max(...idxs)+1 === RARITY_ORDER[rKey];
    }).length;
    if(reachable === 0) return '';
    const rarPct = Math.round((ownedAtRar/reachable)*100);
    // solid color dot (same visual weight as team/type rows) + colored label
    const dot = rKey==='divine' || rKey==='eternal'
      ? `<span class="sv-team-dot rar-${rKey}-bg"></span>`
      : `<span class="sv-team-dot" style="background:${rar.color}"></span>`;
    const label = rKey==='divine' || rKey==='eternal'
      ? `<span class="rar-${rKey}-text">${t('rar.'+rKey)}</span>`
      : `<span style="color:color-mix(in srgb, ${rar.color} var(--ink-mix,100%), #000)">${t('rar.'+rKey)}</span>`;
    return svRow(dot, label, ownedAtRar, reachable, rarPct);
  }).filter(Boolean);
  const rarityRows = rarityRowsArr.join('');
  const rarityCount = rarityRowsArr.length;

  // — Cartes phares (highlights) — computed from current data only.
  // "Last added card" is deliberately omitted: no per-card timestamp
  // is stored, and we don't invent data.
  const ownedCards = CARDS_DB.filter(c=>cardOwned(c.id));
  /* SEUIL DES CARTES PHARES (1.72.0) — même raisonnement que le héros
     du manque : à une carte, « la plus rare » et « le plus
     d'exemplaires » désignent LA MÊME carte avec ×1, et le bloc dit
     deux fois la même chose sans rien apprendre. En dessous du seuil il
     ne s'affiche pas du tout : un bloc vide vaudrait mieux qu'un bloc
     faux, mais pas d'affichage vaut mieux que les deux. */
  let featuredHtml;
  const rarest0 = ownedCards.length ? ownedCards.reduce((b,c)=> (RARITY_ORDER[cardRarity(c)]||0) > (RARITY_ORDER[cardRarity(b)]||0) ? c : b) : null;
  const most0 = ownedCards.length ? ownedCards.reduce((b,c)=> cardTotalQty(c.id) > cardTotalQty(b.id) ? c : b) : null;
  const pharesRedondantes = rarest0 && most0 && rarest0.id === most0.id;
  const pharesUtiles = ownedCards.length >= SEUIL_PHARES && !pharesRedondantes;
  if(ownedCards.length === 0){
    featuredHtml = `<div class="sv-empty-note">${t('st.empty_coll')}</div>`;
  } else if(!pharesUtiles){
    featuredHtml = null;   // bloc entier omis — voir la composition plus bas
  } else {
    const rarest = rarest0, most = most0;
    const rr = RARITIES[cardRarity(rarest)]||{};
    featuredHtml = `<div class="sv-feat">
      <div class="sv-feat-item">
        <div class="sv-feat-label">${t('st.feat_rarest')}</div>
        <div class="sv-feat-name">${icon(CATS[rarest.category]?.icon||'layers')} #${rarest.id} ${rarest.name}</div>
        <div class="sv-feat-sub sv-feat-chip${rarityChipClass(cardRarity(rarest))}" style="${rarityChipStyle(cardRarity(rarest),rr.color)}">${t('rar.'+cardRarity(rarest))} ${'★'.repeat(rr.stars||1)}</div>
      </div>
      <div class="sv-feat-item">
        <div class="sv-feat-label">${t('st.feat_most_copies')}</div>
        <div class="sv-feat-name">${icon(CATS[most.category]?.icon||'layers')} #${most.id} ${most.name}</div>
        <div class="sv-feat-sub">${icon('box')} ×${cardTotalQty(most.id)}</div>
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
    const gradDefs = [];
    if(donutData.some(d => d.k==='divine')) gradDefs.push(`
        <linearGradient id="divineGrad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="120" y2="120">
          <stop offset="0" stop-color="#8B5CF6"/><stop offset="0.25" stop-color="#3B82F6"/>
          <stop offset="0.5" stop-color="#14B8A6"/><stop offset="0.75" stop-color="#FACC15"/>
          <stop offset="1" stop-color="#F472B6"/>
          ${reduceMotion ? '' : '<animateTransform attributeName="gradientTransform" type="rotate" from="0 60 60" to="360 60 60" dur="9s" repeatCount="indefinite"/>'}
        </linearGradient>`);
    if(donutData.some(d => d.k==='eternal')) gradDefs.push(`
        <linearGradient id="eternalGrad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="120" y2="120">
          <stop offset="0" stop-color="#B45309"/><stop offset="0.5" stop-color="#FACC15"/>
          <stop offset="1" stop-color="#D99E00"/>
          ${reduceMotion ? '' : '<animateTransform attributeName="gradientTransform" type="rotate" from="0 60 60" to="360 60 60" dur="9s" repeatCount="indefinite"/>'}
        </linearGradient>`);
    const divineDefs = gradDefs.length ? `<defs>${gradDefs.join('')}</defs>` : '';
    // 2px surface gap between adjacent segments (skipped for a lone segment)
    const GAP = donutData.length > 1 ? 2 : 0;
    const segs = donutData.map(d => {
      const len = d.n/ownedCards.length*C;
      const drawn = Math.max(len - GAP, 0.8);
      /* L'IRIDESCENCE EST UNE INFORMATION, PAS UNE DÉCORATION — et
         c'est pour ça qu'elle DISPARAÎT dans le cas où elle serait le
         plus spectaculaire, ce qui est contre-intuitif : quelqu'un
         voudra la remettre. Le dégradé animé du divin (et de l'éternel)
         distingue ces raretés PARMI les autres segments. Quand un seul
         segment couvre 100 % de l'anneau, il n'y a plus rien à
         distinguer : il ne reste qu'un arc-en-ciel sur un graphique de
         répartition, qui donne à croire que toutes les raretés sont
         représentées. Une carte d'une seule rareté → anneau ENTIÈREMENT
         de cette couleur. Constaté sur une collection réelle à une
         carte, l'état que voit un nouvel utilisateur. */
      const seul = donutData.length === 1;
      const stroke = (!seul && d.k==='divine') ? 'url(#divineGrad)'
        : (!seul && d.k==='eternal') ? 'url(#eternalGrad)' : d.color;
      const s = `<circle r="${R}" cx="60" cy="60" fill="none" stroke="${stroke}" stroke-width="16" stroke-dasharray="${drawn.toFixed(2)} ${(C-drawn).toFixed(2)}" stroke-dashoffset="${(-(offset + GAP/2)).toFixed(2)}" transform="rotate(-90 60 60)"/>`;
      offset += len;
      return s;
    }).join('');
    const legend = donutData.map(d =>
      `<div class="sv-leg-item"><span class="sv-leg-dot${d.k==='divine'||d.k==='eternal'?` rar-${d.k}-bg`:''}" style="${d.k==='divine'||d.k==='eternal'?'':`background:${d.color}`}"></span>${t('rar.'+d.k)}<span class="sv-leg-n">${d.n}</span></div>`
    ).join('');
    donutHtml = `<div class="sv-donut-row">
      <svg class="sv-donut" viewBox="0 0 120 120" role="img" aria-label="${t('st.chart_rarity')}">
        ${divineDefs}
        ${segs}
        <text x="60" y="57" text-anchor="middle" class="sv-donut-big">${ownedCards.length}</text>
        <!-- LE TROU FAIT 64 UNITÉS (R 40 − demi-trait 8, ×2) et ce
             libellé en faisait 67,2 : il passait SOUS l'anneau des deux
             côtés. Une taille de police plus petite ne suffit pas — la
             longueur dépend de la LANGUE. textLength + lengthAdjust
             garantissent la largeur quelle que soit la traduction, et
             la valeur est un peu sous 64 pour laisser respirer. -->
        <text x="60" y="72" text-anchor="middle" class="sv-donut-small"
              textLength="54" lengthAdjust="spacingAndGlyphs">${tp('st.owned_cards', ownedCards.length)}</text>
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

  /* — LE RENVERSEMENT (1.66.0, maquette 1f validée) — le héros du
     manque puis trois PORTES : chaque liste est une action visible,
     plus un onglet caché. Les portes gardent la sémantique tablist
     (elles pilotent le même panneau _toolPanelHTML qu'avant) ; les
     calculs de collector.js n'ont pas bougé d'une ligne. — */

  // Garde-fou du héros (validé au chiffrage) : sous SEUIL_HERO_POSITIF
  // possédées, « 101 cartes vous manquent » serait absurde — l'écran
  // presque vide parle de ce qu'il y a À OBTENIR, pas de ce qui manque
  // (même raisonnement que l'état vide du Compte). Le sous-titre reste
  // en clair : c'est lui qui empêche le chiffre rouge d'être une claque.
  const hero = heroModel(owned, total);
  /* Le libellé s'accorde sur le GRAND CHIFFRE (hero.big), pas sur le
     nombre de possédées : c'est lui que l'œil lit juste au-dessus. */
  const heroHtml = `
    <div class="sv-lack sv-lack-${hero.mode}">
      <div class="sv-lack-n">${hero.big}</div>
      <div class="sv-lack-l">${hero.plural ? tp(hero.labelKey, hero.big) : t(hero.labelKey)}</div>
      <div class="sv-lack-sub">${hero.subPlural ? tpEsc(hero.subKey, hero.subPluralOn, hero.subParams) : tEsc(hero.subKey, hero.subParams)}</div>
    </div>`;

  // « exemplaires en trop » : la somme des copies au-delà de la première
  // sur les types marqués doubles — le chiffre qu'un échangeur regarde.
  const extraCopies = doublesList().reduce((s, r) => s + r.types.reduce((x, ty) => x + Math.max(0, ty.qty - 1), 0), 0);
  const toolsHtml = `
    <section class="sv-block" id="svTools">
    <div class="sv-section-title">${icon('wrench')} ${t('st.tools')}</div>
    <div class="sv-doors" role="tablist" aria-label="${t('st.tools')}">
      <button class="sv-door active" data-tool="missing" role="tab" aria-selected="true" type="button">
        <span class="dr-n">${missing}</span>
        <span class="dr-tx"><span class="dr-t">${t('st.door_missing')}</span><span class="dr-s">${tpEsc('st.door_missing_sub', wish)}</span></span>
        <span class="dr-go" aria-hidden="true">→</span>
      </button>
      <button class="sv-door doubles" data-tool="doubles" role="tab" aria-selected="false" type="button">
        <span class="dr-n">${doubles}</span>
        <span class="dr-tx"><span class="dr-t">${t('st.door_doubles')}</span><span class="dr-s">${tpEsc('st.door_doubles_sub', extraCopies)}</span></span>
        <span class="dr-go" aria-hidden="true">→</span>
      </button>
      <button class="sv-door trade" data-tool="trade" role="tab" aria-selected="false" type="button">
        <span class="dr-n">${icon('handshake')}</span>
        <span class="dr-tx"><span class="dr-t">${t('st.door_trade')}</span><span class="dr-s">${t('st.door_trade_sub')}</span></span>
        <span class="dr-go" aria-hidden="true">→</span>
      </button>
    </div>
    <div class="sv-share">
      <button class="setv-btn" id="svTradeCopy" type="button">${icon('clipboard')} ${t('st.copy')}</button>
      <button class="setv-btn" id="svTradeShare" type="button">${icon('upload')} ${t('st.share')}</button>
      <button class="setv-btn" id="svTradeSheet" type="button">${icon('handshake')} ${t('tr.btn')}</button>
    </div>
    <div class="sv-tools-body" id="svToolsBody">${_toolPanelHTML('missing')}</div>
    </section>`;

  // — Objectifs proches (phase H) : les buts « à N cartes près »,
  //   cliquables → les manquantes concernées (chips), même grammaire de
  //   motivation que la carte « Prochain badge » de la page Badges.
  const TEAM_SHORT_G = TEAM_SHORT;
  const goals = nearGoals(CARDS_DB, id => cardOwned(id));
  const goalLabel = g => g.kind === 'team' ? tEsc('st.goal_finish', { x: TEAM_SHORT_G[g.key] || g.key })
    : g.kind === 'champion' ? t('st.goal_finish', { x: t('st.champions') })
    : t('st.goal_finish', { x: t('cat.' + g.key) });
  const goalsHtml = goals.length ? `
    <section class="sv-block">
    <div class="sv-section-title">${t('st.goals')}</div>
    <div class="sv-goals">${goals.map((g, i) => `
      <div class="sv-goal" data-goal="${i}" role="button" tabindex="0">
        <div class="sv-goal-row">
          <div class="sv-goal-txt"><b>${goalLabel(g)}</b>
            <span>${t('b.remaining', { n: g.missing.length })} · ${g.owned}/${g.total}</span></div>
          <div class="sv-mini-bar"><div class="sv-mini-fill" style="width:${Math.round(g.owned / g.total * 100)}%"></div></div>
        </div>
        <div class="sv-goal-miss" id="goalMiss${i}" style="display:none">${g.missing.map(m =>
          `<span class="bd-chip miss">#${m.id} ${m.name}</span>`).join('')}</div>
      </div>`).join('')}
    </div></section>` : '';

  // ── Mise en page (1.45.0) — disposition « colonne principale +
  //    rail collant ». Le récit (général → répartitions → outils →
  //    historique) tient la colonne large ; le rail garde donut,
  //    à la une et objectifs sous les yeux pendant le défilement.
  //    Aucun calcul n'a changé : seuls les conteneurs bougent.
  const block = (title, body, id) => `<section class="sv-block"${id?` id="${id}"`:''}><div class="sv-section-title">${title}</div>${body}</section>`;

  /* ── Répartitions : sommaire ancré + colonne large (1.56.0) ──
     AVANT : quatre blocs dans une grille auto-fit. « Par type de carte »
     y tenait 16 lignes contre 5 pour les catégories, d'où 511 px de vide
     sous la colonne courte, et 1 919 px de répartitions sur mobile —
     2,7 écrans avant d'atteindre les outils, sans savoir ce qui venait.

     DEUX corrections, aucune ne cache quoi que ce soit :
     1. La colonne longue cesse d'être une colonne. « Par type » passe
        pleine largeur et répartit ses lignes en sous-colonnes ; les trois
        blocs restants, de hauteurs voisines, tiennent sur un rang.
        L'irrégularité est supprimée, pas contournée — rien à maintenir.
     2. Un sommaire de repères annonce chaque bloc avec son nombre de
        lignes, et saute aux outils. On sait ce qui vient AVANT de faire
        défiler. C'est ce qui répond au cas mobile, que (1) ne touche pas.

     Un repli mémorisé a été écarté : il n'aurait rien changé au premier
     regard (rien ne doit être caché par défaut), et un état persistant
     s'oublie — il aurait fini par faire croire qu'on avait tout vu. */
  const jump = [
    ['svByCat',    t('st.by_cat'),    catCount],
    ['svByTeam',   t('st.by_team'),   teamCount],
    ['svByRarity', t('st.by_rarity'), rarityCount],
    ['svByType',   t('st.by_type'),   typeCount],
  ].filter(j => j[2] > 0);
  const jumpHtml = `
    <nav class="sv-jump" aria-label="${t('st.jump')}">
      ${jump.map(([id, label, n]) => `<button class="sv-jump-chip" type="button" data-jump="${id}">${label}<span class="sv-jump-n">${n}</span></button>`).join('')}
      <button class="sv-jump-chip sv-jump-skip" type="button" data-jump="svTools">${t('st.tools')}<span class="sv-jump-arrow" aria-hidden="true">↓</span></button>
    </nav>`;

  el.innerHTML = pageHeadHTML({
    icon: 'chart',
    title: t('st.title'),
    sub: t('ph.stats_sub', { n: total, y: _currentSeason }),
    metric: `<div class="sv-progress${pct===100?' sv-progress-full':''}">
      <div class="sv-prog-hero">
        <div class="sv-prog-pct-big">${pct}%</div>
        <div class="sv-prog-text">
          <div class="sv-prog-title">${pct===100?t('st.complete'):t('st.progress')}</div>
          <div class="sv-prog-sub">${t('st.sub',{owned,total})}</div>
        </div>
      </div>
      <div class="sv-prog-bar"><div class="sv-prog-fill${pct===100?' sv-prog-fill-full':''}" style="width:${pct}%"></div></div>
    </div>`
  }) + `
    <div class="sv-layout">
      <div class="sv-col">
        ${heroHtml}
        ${toolsHtml}

        ${block(t('st.general'), `<div class="sv-cards">
          <div class="sv-card owned"><div class="sv-card-value">${owned}<span class="sv-card-total">/${total}</span></div><div class="sv-card-label">${t('st.owned')}</div></div>
          <div class="sv-card wish"><div class="sv-card-value">${wish}</div><div class="sv-card-label">${t('st.wish')}</div></div>
          <div class="sv-card doubles"><div class="sv-card-value">${doubles}</div><div class="sv-card-label">${t('st.doubles')}</div></div>
          <div class="sv-card missing"><div class="sv-card-value">${missing}</div><div class="sv-card-label">${t('st.missing')}</div></div>
          <div class="sv-card fav"><div class="sv-card-value">${fav}</div><div class="sv-card-label">${t('st.fav')}</div></div>
          <div class="sv-card exemplaires"><div class="sv-card-value">${totalExemplaires}</div><div class="sv-card-label">${t('st.copies')}</div></div>
        </div>`)}

        ${block(t('st.history'), histHtml)}

        ${jumpHtml}

        <div class="sv-breakcols">
          ${catRows    ? block(t('st.by_cat'),    `<div class="sv-rows-block">${catRows}</div>`,    'svByCat')    : ''}
          ${teamRows   ? block(t('st.by_team'),   `<div class="sv-rows-block">${teamRows}</div>`,   'svByTeam')   : ''}
          ${rarityRows ? block(t('st.by_rarity'), `<div class="sv-rows-block">${rarityRows}</div>`, 'svByRarity') : ''}
        </div>

        ${typeRows ? block(t('st.by_type'), `<div class="sv-rows-block sv-rows-split">${typeRows}</div>`, 'svByType') : ''}
      </div>

      <aside class="sv-rail">
        ${donutHtml ? block(t('st.chart_rarity'), donutHtml) : ''}
        ${featuredHtml ? block(t('st.featured'), featuredHtml) : ''}
        ${goalsHtml}
      </aside>
    </div>
  `;

  // Objectifs proches : clic/Entrée = déplier les manquantes concernées
  el.querySelectorAll('.sv-goal').forEach(gl => {
    const toggle = () => {
      const p = gl.querySelector('.sv-goal-miss');
      if(p) p.style.display = p.style.display === 'none' ? '' : 'none';
    };
    gl.addEventListener('click', toggle);
    gl.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); toggle(); } });
  });

  /* Sommaire : saut vers un bloc. Des BOUTONS, pas des ancres — un
     href="#id" écrirait dans location.hash, que l'app lit au démarrage
     (lien #backup=, retour d'authentification). Un repère de lecture n'a
     pas à laisser de trace dans l'URL. */
  el.querySelectorAll('[data-jump]').forEach(b => {
    b.addEventListener('click', () => {
      const target = el.querySelector('#' + b.dataset.jump);
      if(target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Portes outils : bascule locale (lecture seule, pas d'écriture)
  el.querySelectorAll('.sv-door').forEach(door => {
    door.addEventListener('click', () => {
      el.querySelectorAll('.sv-door').forEach(x => {
        x.classList.toggle('active', x === door);
        x.setAttribute('aria-selected', x === door ? 'true' : 'false');
      });
      const body = el.querySelector('#svToolsBody');
      if(body) body.innerHTML = _toolPanelHTML(door.dataset.tool);
    });
  });

  // Copier · Partager la liste d'échange — fmtTrade() a enfin ses
  // appelants (n°15 fermé). La sortie fichier passe par la plomberie
  // EXTRAITE de profile-card.js (share-file.js), pas recopiée.
  const copyBtn = el.querySelector('#svTradeCopy');
  if(copyBtn) copyBtn.addEventListener('click', () => {
    const done = () => showToast(t('st.copied'));
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(fmtTrade()).then(done).catch(() => {});
    }
  });
  const shareBtn = el.querySelector('#svTradeShare');
  if(shareBtn) shareBtn.addEventListener('click', async () => {
    const blob = new Blob([fmtTrade()], { type: 'text/plain' });
    const how = await shareOrDownloadFile(blob, 'f1-uno-echange.txt');
    if(how === 'saved') showToast(t('st.trade_saved'));
  });
  // La FICHE D'ÉCHANGE (1.69.0) : l'image plafonnée à 6 lignes + le QR
  // qui porte la liste COMPLÈTE (#trade=). Charge en identifiants nus —
  // l'app d'en face a le catalogue.
  const sheetBtn = el.querySelector('#svTradeSheet');
  if(sheetBtn) sheetBtn.addEventListener('click', async () => {
    const { want, offer } = tradeList();
    if(!want.length && !offer.length){ showToast(t('st.trade_empty')); return; }
    const payload = { v: 1, season: _currentSeason,
      want: want.map(r => r.id),
      offer: offer.map(r => [r.id, r.types.map(ty => [ty.type, ty.qty])]) };
    const code = await encodeTradeCode(payload);
    const model = {
      sheet: tradeSheetModel(
        want,
        offer.map(r => ({ ...r, typesLabel: r.types.map(ty => `${_typeLabel(ty.type)} ×${ty.qty}`).join(', ') }))),
      season: _currentSeason,
      owned: computeStats().owned, total: CARDS_DB.length,
      code, link: buildTradeLink(code),
    };
    await shareTradeSheet(model);
  });
}

/* ══════════════════════════════════════════════════════════
   COLLECTOR TOOLS UI — structured rows (one card per line, one
   field per span) so a v2.x text export is a trivial map+join;
   the fmt* helpers below already produce that text.
   ══════════════════════════════════════════════════════════ */
function _toolRow(item, extra = ''){
  const rar = RARITIES[item.rarity] || {};
  return `<div class="sv-tool-row" data-card="${item.id}">
    <span class="sv-tool-cat" title="${CATS[item.category]?.label||item.category}">${icon(CATS[item.category]?.icon||'layers')}</span>
    <span class="sv-tool-num">#${item.id}</span>
    <span class="sv-tool-name">${item.name}</span>
    <span class="sv-tool-chip${rarityChipClass(item.rarity)}" style="${rarityChipStyle(item.rarity, rar.color)}">${t('rar.'+item.rarity)}</span>
    ${extra}
  </div>`;
}
const _missingExtra = r => r.wishlist ? `<span class="sv-tool-wish" title="${t('status.wishlist')}">${icon('star')}</span>` : '';
const _doublesExtra = r => `<span class="sv-tool-types">${r.types.map(ty =>
  `<span class="sv-tool-type">${typeIcon(ty.type)}&nbsp;×${ty.qty}</span>`).join('')}</span>`;

function _toolPanelHTML(tool){
  if(tool === 'doubles'){
    const rows = doublesList();
    if(!rows.length) return `<div class="sv-tool-empty">${icon('copy')} ${t('st.doubles_empty')}</div>`;
    return rows.map(r => _toolRow(r, _doublesExtra(r))).join('');
  }
  if(tool === 'trade'){
    const { want, offer } = tradeList();
    if(!want.length && !offer.length) return `<div class="sv-tool-empty">${icon('handshake')} ${t('st.trade_empty')}</div>`;
    return `
      <div class="sv-tool-subtitle">${icon('search')} ${t('tools.want')} <span class="sv-tool-n">${want.length}</span></div>
      ${want.length ? want.map(r => _toolRow(r, _missingExtra(r))).join('') : `<div class="sv-tool-empty">${t('st.missing_empty')}</div>`}
      <div class="sv-tool-subtitle">${icon('copy')} ${t('tools.offer')} <span class="sv-tool-n">${offer.length}</span></div>
      ${offer.length ? offer.map(r => _toolRow(r, _doublesExtra(r))).join('') : `<div class="sv-tool-empty">${t('st.doubles_empty')}</div>`}`;
  }
  const rows = missingCards();
  if(!rows.length) return `<div class="sv-tool-empty">${icon('trophy')} ${t('st.missing_empty')}</div>`;
  return rows.map(r => _toolRow(r, _missingExtra(r))).join('');
}

/* ── Collector-tools text formatting (shareable lists) — moved from
   pin.js with the tools UI. Card names are data (never translated);
   category/rarity/type labels use i18n.

   Branchées depuis 1.66.0 : Copier · Partager sur la liste d'échange
   (renderStats). La dette « aucun appelant » posée en 1.48.x est
   soldée, sa mise en garde retirée avec elle — POINTS-SIGNALES n°15
   fermé. ── */
function _catLabel(cat){ const k='cat.'+cat, l=t(k); return l===k ? (CATS[cat]?.label||cat) : l; }
function _typeLabel(id){ const k='type.'+id, l=t(k); return l===k ? (CARD_TYPES[id]?.label||id) : l; }

function _groupByCat(rows){
  const groups = [];
  Object.keys(CATS).forEach(cat => {
    const inCat = rows.filter(r => r.category === cat);
    if(inCat.length) groups.push({ cat, rows: inCat });
  });
  rows.filter(r => !CATS[r.category]).forEach(r => {
    let g = groups.find(g => g.cat === r.category);
    if(!g){ g = { cat: r.category, rows: [] }; groups.push(g); }
    g.rows.push(r);
  });
  return groups;
}
function _missingLine(r){ return `  #${r.id} ${r.name} — ${t('rar.'+r.rarity)}${r.wishlist?' ⭐':''}`; }
function _doublesLine(r){
  const types = r.types.map(ty => `${_typeLabel(ty.type)} ×${ty.qty}`).join(', ');
  return `  #${r.id} ${r.name} — ${types}`;
}
/* Export TEXTE : plus de pictogramme du tout.
   Les symboles de catégorie sont devenus des SVG, qu'un bloc-notes ne
   peut pas afficher — et c'était de toute façon la bonne décision :
   « Pilote de réserve » écrit en toutes lettres est plus clair qu'un
   glyphe dans un fichier texte. C'est ce qui a permis de retirer le
   champ `emoji` des catégories au lieu de le traîner pour ce seul
   usage. */
function _groupedBlock(rows, lineFn){
  return _groupByCat(rows).map(g =>
    `${_catLabel(g.cat)}\n${g.rows.map(lineFn).join('\n')}`
  ).join('\n\n');
}
function _fmtHead(titleKey){ return `F1 UNO Élite — ${t(titleKey)} (${t('tools.season',{season:_currentSeason})})`; }

export function fmtMissing(){
  const rows = missingCards();
  const head = `${_fmtHead('tools.missing')}\n${rows.length} / ${CARDS_DB.length}`;
  return rows.length ? `${head}\n\n${_groupedBlock(rows, _missingLine)}` : `${head}\n\n${t('tools.none')}`;
}
export function fmtDoubles(){
  const rows = doublesList();
  const head = _fmtHead('tools.doubles');
  return rows.length ? `${head}\n\n${_groupedBlock(rows, _doublesLine)}` : `${head}\n\n${t('tools.none')}`;
}
export function fmtTrade(){
  const { want, offer } = tradeList();
  const wantBlock = want.length ? want.map(_missingLine).join('\n') : '  —';
  const offerBlock = offer.length ? offer.map(_doublesLine).join('\n') : '  —';
  return `${_fmtHead('tools.trade')}\n\n🔎 ${t('tools.want')} (${want.length})\n${wantBlock}\n\n🔄 ${t('tools.offer')} (${offer.length})\n${offerBlock}`;
}
