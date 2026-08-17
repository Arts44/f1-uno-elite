/* ══════════════════════════════════════════════════════════
   RENDER — grid, modal, views, toast
   ══════════════════════════════════════════════════════════ */
import { DEBUG, log } from './logger.js';
import { t, tEsc, escapeHtml, safeImagePath, setSafeHTML } from './i18n.js';
import {
  CARDS_DB, CARD_TYPES, RARITIES, RARITY_ORDER, TYPE_BADGE_RARITY, TYPE_BADGE_STYLES, rarityChipClass, rarityChipStyle,
  CATS, CIRCUIT_SVGS, DRIVER_NUMBERS, TEAM_COLORS, TEAM_MONOGRAMS, TEAM_LIVERIES, sortTypesCanonical,
  seasonCatalogueState, _currentSeason
} from './data.js';
import { icon, typeIcon, HELMET_SVG } from './icons.js';
import {
  getTypeData, setTypeData,
  cardOwned, cardWishlist, cardDoubles, cardFavorite, cardTotalQty,
  cardSetComplete, cardRarity, variantRarity,
  quickAddVariant, undoQuickAdd, txBatch
} from './storage.js';
import { updateStats, renderStats } from './stats.js';
import { renderBadges, resetHeroAnimation } from './badges.js';
import { renderSettings, showAdminPinScreen } from './pin.js';
import { isViewer } from './session.js';
import { renderAccount } from './account.js';

/* ── Visual helpers ──
   v2.3 : plus AUCUNE image distante. Les photos de pilotes et les logos
   d'écuries venaient de formula1.com — marques déposées, dépendance
   externe, et un hors-ligne qui n'en était pas un. Le numéro de course
   (déjà la plus belle partie de la carte) devient le visuel principal,
   et les écuries sont représentées par leur monogramme + leur couleur. */
/* Livrée d'écurie (arbitrage P1, 1.33.0) : une COLONNE de 7 px sur le
   bord gauche du visuel, c1 puis c2 — l'écurie signe la tuile sans
   jamais concurrencer le fond, qui appartient à la RARETÉ. Le casque
   saturé porte la couleur d'équipe. (Les gestes géométriques restent
   décrits dans teamLiveries — seule la surface d'expression change.) */
export function liveryHTML(team){
  const lv = TEAM_LIVERIES[team];
  if(!lv) return '';
  return `<span class="lvb" style="--c1:${lv.c1};--c2:${lv.c2}" aria-hidden="true"></span>`;
}

/* ── LE CASQUE SIGNALE UN NUMÉRO, PAS UNE CATÉGORIE. Décision, pas oubli.
   Le visuel de tuile se choisit dans cet ordre (voir plus bas, au rendu) :
   circuit (gp) → casque + numéro (pilote AVEC numéro) → monogramme
   d'écurie (directeur ou réserve) → icône de catégorie.

   D'où un écart qui SE VOIT et qu'on prend pour un bug : #070 Vandoorne
   (réserve) et #076 Vowles (directeur) portent tous deux un monogramme,
   alors que Vandoorne est un pilote. Ce n'est pas la catégorie qui décide,
   c'est le numéro : `driverNumbers` ne contient que les 25 titulaires, et
   AUCUN des 8 réservistes — un réserviste n'a pas de numéro de course
   attribué. Même en autorisant le casque pour la catégorie réserve, cette
   fonction renverrait null et le rendu retomberait sur le monogramme.

   Deux variantes ont été examinées et écartées (arbitrage 1.55.1) :
   - casque SANS numéro pour les réservistes : ils perdraient le
     monogramme, seule chose qui les rattache à leur écurie sur la tuile ;
   - casque + monogramme : chargerait la tuile pour dire ce que le texte
     dit déjà juste en dessous.
   Bottas et Zhou rendent le cas concret : ils ont eu un numéro, ils n'en
   ont plus pour 2025. Le visuel suit les données, pas le CV. ── */
export function driverNumberHTML(card){
  const d=DRIVER_NUMBERS[card.name];
  if(!d) return null;
  const col=TEAM_COLORS[card.team]||'#fff';
  // Casque C1 générique (icons.js) sur la livrée de l'écurie, numéro à droite.
  return `<div class="driver-number no-img" style="--tc:${col}">${liveryHTML(card.team)}${HELMET_SVG}<span class="dn-num ${d.cls}">${d.n}</span></div>`;
}

export function teamLogoHTML(team){
  const mono=TEAM_MONOGRAMS[team];
  if(!mono) return null;
  const col=TEAM_COLORS[team]||'#fff';
  return `<div class="team-mono-wrap" style="--tc:${col}">${liveryHTML(team)}<div class="team-emblem"><span class="team-mono">${mono}</span><span class="team-rule" aria-hidden="true"></span><span class="team-name">${team}</span></div></div>`;
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
          <div class="sk-line w70"></div>
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
  if (loginThemeIcon) loginThemeIcon.innerHTML = icon(newTheme === 'dark' ? 'sun' : 'moon');
  // Sync settings toggle if visible
  const settingsToggle = document.querySelector('#settingsView .setv-toggle');
  if(settingsToggle) settingsToggle.classList.toggle('on', newTheme === 'dark');
  localStorage.setItem('f1uno_theme', newTheme);
}

/* ── Hint d'ajout rapide (phase E) : une seule fois, uniquement pour
   qui a SAUTÉ la visite guidée. Bulle ancrée sur le + de la première
   tuile, fermable, disparaît d'elle-même au premier ajout rapide. ── */
export function maybeShowQuickAddHint(){
  try {
    if(localStorage.getItem('f1uno_qa_hint') === 'shown') return;
    if(localStorage.getItem('f1uno_tut_skipped') !== 'true') return;
    const vis = document.querySelector('#cardGrid .card .card-visual');
    if(!vis) return;
    localStorage.setItem('f1uno_qa_hint', 'shown');   // une seule fois, quoi qu'il arrive
    const tip = document.createElement('div');
    tip.className = 'qa-hint';
    tip.setAttribute('role', 'note');
    tip.innerHTML = `<span>${t('quick.hint')}</span><button type="button" class="qa-hint-x" data-action="dismissQaHint" aria-label="✕">✕</button>`;
    vis.appendChild(tip);
  } catch(e){}
}
export function dismissQuickAddHint(){ document.querySelector('.qa-hint')?.remove(); }

/* ── Collection render: full grid, sorted by card number, + total ── */
export function renderCollection(){
  const result=[...CARDS_DB].sort((a,b)=>a.id.localeCompare(b.id));
  renderGrid(result);
  // Header counter (owned/total + progress hairline) lives in updateStats()
  // so it refreshes on every collection change, not only on re-renders.
  updateStats();
}

/* ══════════════════════════════════════════════════════════ GRID */
/* Icône de catégorie. `CATS[id].icon` porte le NOM d'une icône de
   icons.js — plus un émoji : les quatre symboles sont désormais au
   trait, dans la même famille que le reste, et suivent currentColor
   donc les deux thèmes. */
export const catIcon=(id,cls)=>icon(CATS[id]?.icon||'layers',cls);

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

/* ── Les deux états de catalogue ──
   Deux intensités, deux TONS. Le partiel est un état normal et
   temporaire pendant la saisie au fil des boosters : il informe, il
   n'alarme pas — surface neutre, pas de couleur d'alerte, un ⓘ et non
   un ⚠. Le vide est plus proche d'un problème de données : il peut être
   affirmatif.
   Le texte du partiel reste dans le registre de ce que l'utilisateur a
   sous les yeux — « les compteurs », « la complétion » — plutôt que de
   parler de badges devant une grille de cartes. */
function _seasonPartialHTML(cat, season){
  const pct = Math.round(cat.charge / cat.total * 100);
  return `${icon('info', 'sp-ic')}
    <div class="sp-txt">${tEsc('season.partial', { n: cat.charge, total: cat.total, season })}
      <span class="sp-sub">${tEsc('season.partial_sub', { reste: cat.total - cat.charge })}</span>
      <span class="sp-bar"><i style="width:${pct}%"></i></span>
    </div>`;
}
function _seasonEmptyHTML(season){
  return `<div class="season-empty">
    ${icon('layers', 'se-ic')}
    <div class="se-title">${tEsc('season.empty_title', { season })}</div>
    <div class="se-body">${t('season.empty_body')}
      <span class="se-hint">${t('season.empty_hint')}</span>
    </div>
  </div>`;
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

  /* ── ÉTAT DU CATALOGUE DE LA SAISON — trois intensités, un mécanisme ──
     Le total est DÉCLARÉ dans metadata.json → seasons[], jamais déduit
     de la longueur du tableau chargé (voir data.js).
       0 carte        → état vide, affirmatif : c'est un problème de
                        données, et le dire vaut mieux que l'escamoter
       0 < n < total  → bandeau d'information, la grille reste visible
       n === total    → rien
     Le défaut corrigé ici : un 404 sur le fichier de cartes laissait
     CARDS_DB avec le catalogue de la saison PRÉCÉDENTE, et l'app
     affichait 101 cartes de 2025 sous une étiquette 2026, sans un mot. */
  const cat = seasonCatalogueState();
  if(cat.etat === 'vide' || !cards.length){
    setSafeHTML(grid, _seasonEmptyHTML(_currentSeason));
    return;
  }
  if(cat.etat === 'partiel'){
    const banner = document.createElement('div');
    banner.className = 'season-partial';
    setSafeHTML(banner, _seasonPartialHTML(cat, _currentSeason));
    grid.appendChild(banner);
  }

  log('Starting to render cards...');
  let renderedCount = 0;
  cards.forEach((card)=>{
    renderedCount++;
    grid.appendChild(buildCardEl(card));
  });
  log('Finished rendering', renderedCount, 'cards');
  observeFoils();
}

/* ══════════════════════════════════════════════════════════
   PAUSE DES EFFETS HORS ÉCRAN (1.46.0)

   La grille compte 101 tuiles ; une quinzaine tient à l'écran.
   Sans observateur, les ~85 autres animaient dans le vide :
   du travail de composition permanent, invisible, qui empêchait
   la page de se stabiliser (Speed Index) et vidait la batterie.

   L'observateur ne fait qu'ajouter/retirer une classe ; le CSS
   met les animations en `paused` — l'état visuel est conservé,
   la reprise est instantanée et sans saut de phase.
   ══════════════════════════════════════════════════════════ */
let _foilObs = null;
export function observeFoils(){
  if(typeof IntersectionObserver === 'undefined') return;
  const grid = document.getElementById('cardGrid');
  if(!grid) return;
  if(!_foilObs){
    _foilObs = new IntersectionObserver(entries => {
      entries.forEach(e => e.target.classList.toggle('fx-idle', !e.isIntersecting));
    }, {
      root: document.getElementById('collectionView'),
      // Une tuile s'anime déjà avant d'entrer dans le cadre : pas de
      // démarrage visible pendant un défilement rapide.
      rootMargin: '250px 0px'
    });
  }
  _foilObs.disconnect();
  grid.querySelectorAll('.card').forEach(c => _foilObs.observe(c));
}

/* Construit LA tuile d'une carte — extrait de renderGrid pour que
   l'ajout rapide puisse remplacer une seule tuile au lieu de
   reconstruire les 101 (le +1 coûtait ~300 ms en classe mobile). */
/* ══════════════════════════════════════════════════════════
   LE NOM DE LA TUILE — pourquoi il porte TOUT

   MESURÉ AU NAVIGATEUR (CDP, Accessibility.getPartialAXTree), et
   contraire à la correction qu'on avait prescrite : la tuile est un
   `role="button"` avec un `aria-label`. Or le nom accessible d'un
   bouton REMPLACE son contenu — l'écurie, l'année, la rareté, les
   exemplaires et jusqu'à l'`aria-label` du sceau « set complet » ne
   sont **jamais annoncés**. Relevé avant correction :

     Stoffel Vandoorne — #070      (réserve)
     James Vowles — #076           (directeur)

   Deux catégories, deux visuels identiques (le monogramme d'écurie),
   et deux noms qui ne les distinguent pas. Poser `role="img"` +
   `aria-label` sur les marqueurs de coin n'y aurait rien changé :
   l'étiquette aurait été avalée comme celle du sceau l'est déjà.

   Le marqueur reste donc décoratif (`aria-hidden`) — ce qu'il est —
   et l'information passe par le seul endroit qui est lu.

   ORDRE : ce qui identifie d'abord (numéro, nom), puis ce qui
   qualifie (catégorie, écurie), puis l'état de collection. Sur une
   grille de 101 tuiles parcourues à la voix, chaque mot coûte ; on
   ne dit donc l'année que si elle n'est pas celle de la saison
   affichée, et le champion ou le set complet que s'ils sont vrais.
   ══════════════════════════════════════════════════════════ */
export function cardAriaLabel(card, { isOwned, isSet } = {}){
  const parts = [`${card.name} — #${card.id}`];
  const cat = t('cat.' + card.category);
  if(cat && cat !== 'cat.' + card.category) parts.push(cat);
  if(card.team) parts.push(card.team);
  parts.push(t(isOwned ? 'a11y.owned' : 'a11y.missing'));
  if(isSet) parts.push(t('a11y.set'));
  if(card.champion) parts.push(t('a11y.champion'));
  if(card.retired) parts.push(t('m.retired'));
  return parts.join(', ');
}

function buildCardEl(card){
    const isOwned=cardOwned(card.id);
    const isWish=cardWishlist(card.id);
    const isFav=cardFavorite(card.id);
    const isSet=cardSetComplete(card.id);
    const bestType=bestOwnedType(card);
    const displayType=bestType||defaultBaseType(card);
    const ct=CARD_TYPES[displayType];
    const rKey=cardRarity(card);
    const rarity=RARITIES[rKey];
    const isEternal=rKey==='eternal';

    const el=document.createElement('div');
    let cardClass='card'+(isOwned?' has-owned':'')+(isWish?' has-wishlist':'')+(isFav?' has-favorite':'')+(isSet?' set-complete':'')+(isEternal?' rar-eternal-fx':'');
    // Couleur de variante BIEN visible dès la carte de base (1.34.0) :
    // les 4 couleurs lavent le CORPS de la carte (le fond du visuel
    // reste à la rareté — règle P1 intacte). Les foils ont déjà leur
    // dégradé pleine carte sous le panneau translucide.
    if(bestType && CARD_TYPES[bestType] && !CARD_TYPES[bestType].foil){
      cardClass+=` vt-${bestType}`;
    }
    // FOILS (simples, duals, nitro, promos, wild) : le dégradé se
    // prolonge sur TOUTE la carte (une seule couche continue, le
    // .card-visual devient transparent) et le texte est posé sur un
    // encadré noir translucide — le traitement wild, généralisé.
    // Types NON-foil : visuel en haut, corps neutre du thème.
    if(bestType && CARD_TYPES[bestType] && CARD_TYPES[bestType].foil){
      cardClass+=` ${CARD_TYPES[bestType].css}`;
    }
    el.className=cardClass;
    el.dataset.card=card.id;
    // a11y (audit 1.42.2) : la tuile portait un onclick sur un <div> sans
    // tabindex — l'action PRINCIPALE de l'app était donc hors d'atteinte
    // au clavier et muette pour un lecteur d'écran. Elle devient un
    // bouton de plein droit : focusable, nommé, activable Entrée/Espace.
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', cardAriaLabel(card, { isOwned, isSet }));
    const openThis = e => {
      if(e.target.closest('.schip') || e.target.closest('.qbtn') || e.target.closest('.qadd-pop')) return;
      openModal(card.id);
    };
    el.onclick = openThis;
    // L'activation clavier (Entrée/Espace) est gérée par UN listener
    // délégué dans app.js — même grammaire que les clics, aucune
    // duplication par tuile.

    // Owned types summary. Set complet : posséder 1× chaque type est
    // implicite, donc on n'affiche que les types en exemplaires
    // multiples (×n) — le reste serait du bruit.
    const ownedTypes=card.types.filter(t=>{
      const d=getTypeData(card.id,t);
      return d.owned && (!isSet || (d.qty||0)>1);
    });
    const ownedSummary=sortTypesCanonical(ownedTypes).map(t=>{
      let cls='';
      if(t==='blue'||t==='blue_foil') cls='blue';
      else if(t==='green'||t==='green_foil') cls='green';
      else if(t==='red'||t==='red_foil') cls='red';
      else if(t==='yellow'||t==='yellow_foil') cls='yellow';
      else if(t.includes('foil')) cls='foil';
      if(t==='nitro_foil') cls='nitro';
      if(t==='promo_blue' || t==='promo_green' || t==='promo_red' || t==='promo_yellow') cls='promo';
      const d=getTypeData(card.id,t);
      return `<span class="owned-tag ${cls}">${typeIcon(t)}${d.qty>1?' ×'+d.qty:''}</span>`;
    }).join('');

    el.innerHTML=`
      ${isEternal?'<span class="eternal-spark s1" aria-hidden="true">✦</span><span class="eternal-spark s2" aria-hidden="true">✦</span><span class="eternal-spark s3" aria-hidden="true">✦</span>':''}
      <div class="card-visual ${bestType?ct.css:''}${!isOwned?' not-owned':''}" style="--rarc:${rarity.color}">
        ${/* ══ MARQUEURS DE COIN — deux règles contre-intuitives ══
              (1) ON MARQUE CE QUI SE CONFOND, PAS CE QUI EST DÉJÀ DISTINCT.
              Le visuel se choisit plus bas dans cet ordre : circuit (gp),
              casque + numéro (pilote), monogramme d'écurie (directeur OU
              réserve), icône de catégorie. Réserve et directeur partagent
              donc EXACTEMENT le même visuel — c'est la seule paire qu'on ne
              peut pas distinguer sans lire le nom, et c'est pour ça qu'elles
              seules portent un marqueur de catégorie. Le pilote et le Grand
              Prix ont chacun un visuel unique : leur ajouter un marqueur
              dupliquerait ce qui est déjà là (un damier sur une carte qui
              montre déjà le tracé du circuit).
              NE « COMPLÈTE » DONC PAS LA SÉRIE : l'absence de marqueur sur
              GP et pilote est le résultat de la règle, pas un oubli.

              (2) LE MARQUEUR EST NEUTRE, ET SES JETONS NE SUIVENT PAS LE
              THÈME (voir --mark-* dans styles.css). Son fond n'est pas la
              page : c'est le VISUEL de la carte — livrée rose Alpine, cyan
              Mercedes, tracé de circuit, foil. Un jeton qui basculerait
              clair/sombre avec le thème ne serait juste que par accident. ══ */''}
        ${card.champion?`<span class="crown" aria-hidden="true">${icon('crown')}</span>`:''}
        ${card.category==='reserve'?`<span class="replacement-icon" aria-hidden="true">${icon('swap')}</span>`:''}
        ${card.category==='directeur'?`<span class="director-icon" aria-hidden="true">${icon('headset')}</span>`:''}
        ${/* Le sceau garde son `title` — l'infobulle sert la souris — mais
              perd `role="img"`/`aria-label` : à l'intérieur d'un bouton
              nommé, cette étiquette n'était JAMAIS annoncée. Elle donnait
              l'apparence d'une accessibilité qui n'existait pas. Le set
              complet est désormais dit par le nom de la tuile. */''}
        ${isSet?`<span class="set-flag" aria-hidden="true" title="${t('set.complete')}">${icon('seal')}</span>`:''}
        ${card.category==='gp' && circuitSVG(card.id,'card') ? circuitSVG(card.id,'card') : card.category==='pilote' && driverNumberHTML(card) ? driverNumberHTML(card) : (card.category==='directeur' || card.category==='reserve') && teamLogoHTML(card.team) ? teamLogoHTML(card.team) : `<span class="card-cat-ic">${catIcon(card.category)}</span>`}
        <button class="qbtn" type="button" data-action="quickAdd" data-card="${card.id}" aria-label="${t('quick.add')}" title="${t('quick.add')}">+</button>
      </div>
      <div class="card-body">
        <div class="card-num">#${card.id} ${card.champion?`· ${icon('crown','ic-crown')}`:''}</div>
        <div class="card-name">${card.name} ${card.category==='pilote'?card.nationality||'':''} ${card.retired?`<span class="retired-badge">${t('m.retired')}</span>`:''}</div>
        <div class="card-year">${card.season||_currentSeason}</div>
        <div class="card-team">${TEAM_COLORS[card.team]?`<span class="team-dot" style="background:${TEAM_COLORS[card.team]}"></span>`:''}${card.team||''}</div>
        <div class="card-rarity-row">
          <span class="card-rarity${rarityChipClass(rKey)}" style="${rarityChipStyle(rKey,rarity.color)}">${t('rar.'+rKey)} ${isEternal?`<span class="eternal-stars">${'✦'.repeat(rarity.stars)}</span>`:'★'.repeat(rarity.stars)}</span>
          <div class="status-chips">
            <div class="schip${isWish?' on':''}" role="button" tabindex="0" aria-pressed="${isWish}" aria-label="${t('status.wishlist')}" data-s="wishlist" data-action="quickToggle" data-card="${card.id}" data-status="wishlist" title="${t('status.wishlist')}">${icon('star')}</div>
            <div class="schip${isFav?' on':''}" role="button" tabindex="0" aria-pressed="${isFav}" aria-label="${t('status.fav')}" data-s="favorite" data-action="quickToggle" data-card="${card.id}" data-status="favorite" title="${t('status.fav')}">${icon('heart')}</div>
          </div>
        </div>
        ${ownedSummary?`<div class="card-owned-summary">${ownedSummary}</div>`:''}
      </div>
    `;

    return el;
}

/* Mise à jour CIBLÉE d'une tuile après une écriture (ajout rapide,
   toggle, quantité en fiche) : remplace le seul nœud concerné.
   Repli honnête : tuile absente du DOM → re-rendu complet. */
export function updateCardTile(cardId){
  const grid=document.getElementById('cardGrid');
  const card=CARDS_DB.find(c=>c.id===cardId);
  const old=grid && grid.querySelector(`.card[data-card="${cardId}"]`);
  if(!grid || !card || !old){ renderCollection(); return; }
  // a11y (audit 1.42.2) : remplacer le nœud DÉTRUIT le focus — au
  // clavier, cocher la wishlist renvoyait au <body>, obligeant à
  // re-tabuler depuis le début. On note où était le focus et on le
  // repose sur l'élément équivalent de la tuile reconstruite.
  const act = document.activeElement;
  let restore = null;
  if(act && old.contains(act)){
    if(act === old) restore = '';
    else if(act.classList.contains('schip')) restore = `.schip[data-status="${act.dataset.status}"]`;
    else if(act.classList.contains('qbtn')) restore = '.qbtn';
  }
  const fresh = buildCardEl(card);
  old.replaceWith(fresh);
  // La tuile est un NOUVEAU nœud : l'ancien était observé, pas celui-ci.
  if(_foilObs) _foilObs.observe(fresh);
  if(restore !== null){
    const target = restore === '' ? fresh : fresh.querySelector(restore);
    try { target?.focus({ preventScroll: true }); } catch(e){}
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
  txBatch(()=>{
    setTypeData(cardId, firstType, status, newVal);
    if(status==='owned'&&newVal){ setTypeData(cardId,firstType,'qty',Math.max(1,d.qty||0)); setTypeData(cardId,firstType,'wishlist',false); }
    if(status==='owned'&&!newVal){ setTypeData(cardId,firstType,'qty',0); setTypeData(cardId,firstType,'doubles',false); }
  });
  updateStats(); updateCardTile(cardId);
  showToast(newVal?'✓ Mis à jour':'Retiré');
}

/* ══════════════════════════════════════════════════════════ MODAL */
export function openModal(id){
  const card=CARDS_DB.find(c=>c.id===id);
  if(!card) return;
  currentCardId=id;

  updateModalVisual(card);

  const _img = safeImagePath(card.image);
  // Le correctif est DANS la ligne signalée : la source passe par
  // safeImagePath() (chemins relatifs uniquement — tout schéma, tout
  // hôte, toute remontée de répertoire refusés) et le nom par
  // escapeHtml(). Les deux sont couverts par 17 cas dans
  // tests/security-hardening.test.js.
  //
  // Pas de directive eslint-disable ici : voir i18n.js, setSafeHTML —
  // les alertes restantes sont des patterns natifs Codacy, hors de
  // portée d'une directive ESLint.
  document.getElementById('moEmoji').innerHTML = _img ? `<img src="${_img}" alt="${escapeHtml(card.name)}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--r-xl) var(--r-xl) 0 0;">` : (card.category==='gp' && circuitSVG(card.id,'modal') ? circuitSVG(card.id,'modal') : card.category==='pilote' && driverNumberHTML(card) ? driverNumberHTML(card) : (card.category==='directeur' || card.category==='reserve') && teamLogoHTML(card.team) ? teamLogoHTML(card.team) : `<span class="mo-cat-ic">${catIcon(card.category)}</span>`);
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
    <div class="mib"><div class="mib-l">${t('mo.total_copies')||'Total copies'}</div><div class="mib-v" style="color:var(--red-ink,var(--red))">${cardTotalQty(id)}</div></div>
  `;

  _mxSelected = null;   // l'inspecteur repart du premier type existant
  renderModalTypes(card);
  document.getElementById('mo').classList.add('open');
}

/* ── LA MATRICE 4×4 (1.64.0) — les 16 variantes en 4 colonnes de
   couleur × 4 familles, trois états par cellule (possédée + quantité,
   manquante, n'existe pas), un inspecteur unique qui remplace les 16
   paires de boutons −/+.

   LA MATRICE EST TOUJOURS 4×4, même sur une carte Grand Prix qui n'a
   que 4 types : ses 12 cellules « n'existe pas » restent affichées,
   hachurées. NE PAS « OPTIMISER » EN SAUTANT LES RANGÉES VIDES —
   c'est délibéré : la même carte mentale sur les 101 fiches (une
   cellule au même endroit veut toujours dire la même variante), et le
   comptage « X inexistantes » dit déjà pourquoi ces cellules sont
   éteintes. L'ancien rendu par liste sautait les rangées absentes ;
   c'est précisément ce que ce chantier remplace.

   Colonnes = icônes de couleur, JAMAIS des abréviations traduites
   (règle i18n n°2). Rangées = famille traduite en toutes lettres —
   courtes dans les 7 langues, mesuré (l'abréviation « BAS/FOI/SPÉ »
   de la maquette d'origine imposait un apprentissage évitable). ── */
const MX_ROWS = [
  ['blue', 'green', 'red', 'yellow'],
  ['blue_foil', 'green_foil', 'red_foil', 'yellow_foil'],
  ['blue_red_foil', 'green_yellow_foil', 'wild_foil', 'nitro_foil'],
  ['promo_blue', 'promo_green', 'promo_red', 'promo_yellow'],
];
const MX_FAM = [
  ['mx.fam_base', null], ['mx.fam_foil', 'foil'],
  ['mx.fam_special', 'wild'], ['mx.fam_promo', 'promo'],
];
/* Type ouvert dans l'inspecteur — état de session de la modale,
   réinitialisé à chaque ouverture (openModal). */
let _mxSelected = null;

/* L'encre du wild (#0a0a0a) est invisible sur fond sombre — défaut
   PRÉEXISTANT de l'ancienne liste, corrigé au passage : la couleur
   passe par --wild-ink, redéfinie par thème dans styles.css. */
function _typeInk(typeId){
  return typeId === 'wild_foil' ? 'var(--wild-ink)' : CARD_TYPES[typeId].color;
}
function _typeLabel(typeId){
  const k = 'type.' + typeId, l = t(k);
  return l === k ? (CARD_TYPES[typeId]?.label || typeId) : l;
}

export function selectMoType(cardId, typeId){
  _mxSelected = typeId;
  const card = CARDS_DB.find(c => c.id === cardId);
  if(card) renderModalTypes(card);
}

export function renderModalTypes(card){
  const grid = document.getElementById('moTypeRows');
  const typeSet = new Set(card.types);
  const qtyOf = ty => getTypeData(card.id, ty).qty || 0;
  const stateOf = ty => !typeSet.has(ty) ? 'none' : qtyOf(ty) > 0 ? 'owned' : 'missing';

  // Sélection : garder celle en cours si elle existe sur CETTE carte,
  // sinon le premier type existant (ordre canonique) — c'est lui que le
  // tutoriel presse deux fois (mark_owned puis mark_double).
  if(!_mxSelected || !typeSet.has(_mxSelected)){
    _mxSelected = sortTypesCanonical(card.types)[0];
  }
  const sel = _mxSelected;
  const selState = stateOf(sel);

  const existN = card.types.length;
  const ownedN = card.types.filter(ty => qtyOf(ty) > 0).length;
  const noneN = 16 - existN;

  const cells = MX_ROWS.map((row, ri) => {
    const [famKey, famIc] = MX_FAM[ri];
    const lab = `<div class="mo-mx-rowlab">${famIc ? icon(famIc) : ''}<span>${t(famKey)}</span></div>`;
    return lab + row.map(ty => {
      const st = stateOf(ty);
      // La colonne donne la couleur, pas l'identité (wild n'est pas
      // « rouge ») : les rangées non-base portent leur glyphe en coin.
      const glyph = ri > 0 ? `<span class="mx-ty" style="color:${_typeInk(ty)}" aria-hidden="true">${typeIcon(ty)}</span>` : '';
      if(st === 'none') return `<div class="mo-mx-cell none" aria-hidden="true">${glyph}</div>`;
      const aria = `${_typeLabel(ty)} — ${st === 'owned' ? `${t('mx.own')} ×${qtyOf(ty)}` : t('mx.miss')}`;
      return `<button type="button" class="mo-mx-cell ${st}${ty === sel ? ' sel' : ''}" data-action="selectMoType" data-card="${card.id}" data-type="${ty}" aria-label="${aria}" aria-pressed="${ty === sel}">${glyph}${st === 'owned' ? qtyOf(ty) : '<span aria-hidden="true">▢</span>'}</button>`;
    }).join('');
  }).join('');

  const inspState = selState === 'owned'
    ? `<span class="mi-state own">${t('mx.own')}</span>`
    : `<span class="mi-state">${t('mx.miss')}</span>`;
  grid.className = 'mo-type-rows';
  grid.innerHTML = `
    <div class="mo-mx-count">${tEsc('mx.count', { o: ownedN, e: existN, n: noneN })}</div>
    <div class="mo-mx">
      <div class="mo-mx-corner"></div>
      ${['blue', 'green', 'red', 'yellow'].map(c => `<div class="mo-mx-colhead" aria-hidden="true">${typeIcon(c)}</div>`).join('')}
      ${cells}
    </div>
    <div class="mo-mx-legend">
      <span><i class="lg-own"></i>${t('mx.own')}</span>
      <span><i></i>${t('mx.miss')}</span>
      <span><i class="lg-none"></i>${t('mx.none')}</span>
    </div>
    <div class="mo-insp">
      <div class="mi-ic" style="background:color-mix(in srgb,${_typeInk(sel)} 13%,transparent);border:1.5px solid color-mix(in srgb,${_typeInk(sel)} 25%,transparent);color:${_typeInk(sel)};">${typeIcon(sel)}</div>
      <div class="mi-tx">${inspState}<div class="mi-name">${_typeLabel(sel)}</div></div>
      <div class="mo-qty-wrap">
        <button class="mqbtn" data-action="changeMoQty" data-card="${card.id}" data-type="${sel}" data-delta="-1" aria-label="${t('mo.qty_dec')}" title="${t('mo.qty_dec')}">−</button>
        <span class="mqval" id="mqv-${card.id}-${sel}">${qtyOf(sel)}</span>
        <button class="mqbtn" data-action="changeMoQty" data-card="${card.id}" data-type="${sel}" data-delta="1" aria-label="${t('mo.qty_inc')}" title="${t('mo.qty_inc')}">+</button>
      </div>
    </div>`;
}



/* Modal header tags (champion, card tags, rarity). Factored so a qty
   change can refresh the RARITY tag live — adding/removing a foil can
   move the card's rarity while the modal stays open. */
function _renderModalTags(card){
  const tagsEl=document.getElementById('moTags');
  if(!tagsEl) return;
  tagsEl.innerHTML='';
  const addTag=(cls,txt)=>{const s=document.createElement('span');s.className=`mtag ${cls}`;s.textContent=txt;tagsEl.appendChild(s);};
  if(card.champion){
    const s=document.createElement('span');
    s.className='mtag champion';
    s.innerHTML=`${icon('crown')} Champion ${card.championYears.join(', ')}`;
    tagsEl.appendChild(s);
  }
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
    ['owned',    'check',   cardOwned(card.id),    'status.owned'],
    ['doubles',  'copy',    cardDoubles(card.id),  'status.doubles'],
    ['wishlist', 'star',    cardWishlist(card.id), 'status.wishlist'],
    ['favorite', 'heart',   cardFavorite(card.id), 'status.fav'],
  ];
  states.forEach(([id,ic,on,key])=>{
    const s=document.createElement('span');
    s.className=`mo-st${on?' on':''}`;
    s.innerHTML=`${icon(ic)} ${t(key)||id}`;
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
  const rKey=cardRarity(card);
  const isEternal=rKey==='eternal';
  vis.className = (best ? `modal-visual ${CARD_TYPES[best].css}` : 'modal-visual not-owned') + (isSet?' set-complete':'') + (isEternal?' rar-eternal-fx':'');
  vis.style.setProperty('--rarc', (RARITIES[rKey]||{}).color || '#8E8E93'); // fond = rareté (P1)
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
    flag.innerHTML=icon('seal');
    vis.appendChild(flag);
  } else if(!isSet && flag){
    flag.remove();
  }
}

export function changeMoQty(cardId, typeId, delta){
  const d=getTypeData(cardId,typeId);
  const newQty=Math.max(0,(d.qty||0)+delta);
  txBatch(()=>{
    setTypeData(cardId,typeId,'qty',newQty);
    if(newQty>0) setTypeData(cardId,typeId,'owned',true);
    if(newQty>1) setTypeData(cardId,typeId,'doubles',true);
    if(newQty<=1) setTypeData(cardId,typeId,'doubles',false);
    if(newQty===0){ setTypeData(cardId,typeId,'owned',false); setTypeData(cardId,typeId,'doubles',false); }
  });
  const el=document.getElementById(`mqv-${cardId}-${typeId}`);
  if(el) el.textContent=newQty;
  // refresh total in moInfo
  document.querySelector('#moInfo .mib:last-child .mib-v').textContent=cardTotalQty(cardId);
  const card=CARDS_DB.find(c=>c.id===cardId);
  renderModalTypes(card);
  updateModalVisual(card);
  _renderModalTags(card);
  updateStats(); updateCardTile(cardId);
}

export function closeMo(){ document.getElementById('mo').classList.remove('open'); currentCardId=null; }

/* ══════════════════════════════════════════════════════════ NAV BEAD
   Barre de navigation à pastille. Trois invariants :

   1. UN SEUL path SVG paramétrique — pilule + encoche circulaire de
      MÊME centre que la pastille, rayon + marge constante, raccordée
      par des congés dont les points de tangence sont calculés (aucune
      courbe approximée).
   2. UNE SEULE horloge — la pastille n'a pas de transition CSS : elle
      et l'encoche sont posées ensemble par setCx(), donc aucune dérive
      possible entre les deux.
   3. L'encoche dégage toujours les coins — la bande d'onglets reçoit
      une marge intérieure calculée pour ça ; si elle comprimait les
      onglets sous le seuil tactile, c'est le rayon de coin qui cède.

   Les .bn-tab et leurs data-view sont inchangés : le tutoriel, la
   délégation d'événements et les tests gardent leurs sélecteurs. */
const BEAD_R = 25, BEAD_GAP = 5, BEAD_SINK = 15, BEAD_FIL = 10;
const BEAD_H = 58, BEAD_DUR = 350, TAP_MIN = 44;
let _beadW = 0, _beadCx = null, _beadAnim = null, _beadG = null;

function _beadTabs(){ return [...document.querySelectorAll('.bn-tab')]; }
function _beadActiveIdx(){ return Math.max(0, _beadTabs().findIndex(t => t.classList.contains('active'))); }
const _beadReduce = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Géométrie dérivée de la largeur : encoche, marge intérieure, rayon de coin.
function _beadGeom(w, n){
  const cy = BEAD_SINK - BEAD_R;                 // centre pastille / haut de barre
  const rn = BEAD_R + BEAD_GAP;                  // rayon d'encoche (marge constante)
  const sh = Math.sqrt(Math.max(0, (BEAD_FIL + rn) ** 2 - (cy - BEAD_FIL) ** 2));
  const tx = sh - BEAD_FIL * sh / (BEAD_FIL + rn);
  const ty = BEAD_FIL + BEAD_FIL * (cy - BEAD_FIL) / (BEAD_FIL + rn);
  let corner = Math.min(BEAD_H / 2, 29);
  let pad = Math.max(0, (corner + sh - w / (2 * n)) / (1 - 1 / n));
  const padMax = Math.max(0, (w - TAP_MIN * n) / 2);
  if(pad > padMax){                              // priorité à la zone tactile
    pad = padMax;
    corner = Math.max(4, pad + (w - 2 * pad) / (2 * n) - sh);
  }
  return { cy, rn, sh, tx, ty, pad, corner, tabW: (w - 2 * pad) / n, over: 2 * BEAD_R - BEAD_SINK };
}

function _beadPath(W, cx){
  const { rn, sh, tx, ty, corner: C } = _beadG, f = BEAD_FIL;
  return [
    `M ${C} 0`, `H ${(cx - sh).toFixed(2)}`,
    `A ${f} ${f} 0 0 1 ${(cx - tx).toFixed(2)} ${ty.toFixed(2)}`,
    `A ${rn} ${rn} 0 0 0 ${(cx + tx).toFixed(2)} ${ty.toFixed(2)}`,
    `A ${f} ${f} 0 0 1 ${(cx + sh).toFixed(2)} 0`,
    `H ${W - C}`, `A ${C} ${C} 0 0 1 ${W} ${C}`, `V ${BEAD_H - C}`,
    `A ${C} ${C} 0 0 1 ${W - C} ${BEAD_H}`, `H ${C}`,
    `A ${C} ${C} 0 0 1 0 ${BEAD_H - C}`, `V ${C}`, `A ${C} ${C} 0 0 1 ${C} 0`, 'Z',
  ].join(' ');
}
function _beadCxFor(i){ return _beadG.pad + _beadG.tabW * (i + 0.5); }

// Pose la pastille ET l'encoche — le halo d'accent suit le même centre.
function _beadSetCx(cx){
  _beadCx = cx;
  const bar = document.getElementById('beadBar');
  const bead = document.getElementById('navBead');
  if(!bar || !bead) return;
  const d = _beadPath(_beadW, cx);
  bar.querySelectorAll('path').forEach(p => p.setAttribute('d', d));
  const glow = bar.querySelector('#beadGlowGrad');
  if(glow){ glow.setAttribute('cx', cx); glow.setAttribute('cy', 0); }
  bead.style.transform = `translateX(${cx - BEAD_R}px)`;
}

function _beadTweenTo(target){
  cancelAnimationFrame(_beadAnim);
  if(_beadReduce()){ _beadSetCx(target); return; }
  const from = _beadCx, t0 = performance.now();
  const ease = x => 1 - Math.pow(1 - x, 3);
  const step = now => {
    const k = Math.min(1, (now - t0) / BEAD_DUR);
    _beadSetCx(from + (target - from) * ease(k));
    if(k < 1) _beadAnim = requestAnimationFrame(step);
  };
  _beadAnim = requestAnimationFrame(step);
}

// L'icône de la pastille est clonée depuis l'onglet actif (une seule
// source pour les deux, la taille est réglée en CSS).
function _beadSyncIcon(){
  const bead = document.getElementById('navBead');
  const icon = _beadTabs()[_beadActiveIdx()]?.querySelector('.bn-icon');
  if(bead && icon) bead.innerHTML = icon.outerHTML;
}

export function layoutNavBead(){
  const bar = document.getElementById('beadBar');
  const inner = document.getElementById('beadInner');
  const pill = document.querySelector('.bottom-nav-pill');
  if(!bar || !inner) return;
  const tabs = _beadTabs();
  if(!tabs.length) return;
  // Math.max(1, …) : `window.innerWidth` vaut 0 tant que la fenêtre n'a
  // pas de dimensions — onglet en arrière-plan au premier rendu, panneau
  // masqué, course pendant un redimensionnement. On obtenait alors -24,
  // donc <svg width="-24" viewBox="0 0 -24 58"> et une erreur du moteur
  // de rendu (« A negative value is not valid »). La barre était de toute
  // façon invisible ; on borne pour ne pas produire un SVG invalide.
  _beadW = Math.max(1, Math.min(window.innerWidth - 24, 560));
  _beadG = _beadGeom(_beadW, tabs.length);
  inner.style.width = _beadW + 'px';
  if(pill){ pill.style.left = _beadG.pad + 'px'; pill.style.right = _beadG.pad + 'px'; }
  bar.setAttribute('width', _beadW);
  bar.setAttribute('height', BEAD_H);
  bar.setAttribute('viewBox', `0 0 ${_beadW} ${BEAD_H}`);
  const d = _beadPath(_beadW, _beadCxFor(_beadActiveIdx()));
  bar.innerHTML =
    '<defs>' +
      '<linearGradient id="beadBarFill" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="var(--nav-fill-top)"/><stop offset="1" stop-color="var(--nav-fill-bot)"/>' +
      '</linearGradient>' +
      '<linearGradient id="beadBarEdge" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="var(--nav-edge-top)"/>' +
        '<stop offset="0.55" stop-color="var(--nav-edge-bot)"/>' +
        '<stop offset="1" stop-color="var(--nav-edge-bot)"/>' +
      '</linearGradient>' +
      '<radialGradient id="beadGlowGrad" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="110">' +
        '<stop offset="0" stop-color="rgb(var(--nav-glow))" stop-opacity="var(--nav-glow-a1)"/>' +
        '<stop offset="0.45" stop-color="rgb(var(--nav-glow))" stop-opacity="var(--nav-glow-a2)"/>' +
        '<stop offset="1" stop-color="rgb(var(--nav-glow))" stop-opacity="0"/>' +
      '</radialGradient>' +
    '</defs>' +
    `<path class="nav-bar-shape" d="${d}"/><path class="nav-bar-glow" d="${d}"/>`;
  const bead = document.getElementById('navBead');
  if(bead) bead.style.top = (-_beadG.over) + 'px';
  _beadSyncIcon();
  _beadSetCx(_beadCxFor(_beadActiveIdx()));
}

export function updateNavBead(){
  const bar = document.getElementById('beadBar');
  if(!bar || !bar.querySelector('path')) return;
  if(!_beadW || !_beadG) layoutNavBead();
  const target = _beadCxFor(_beadActiveIdx());
  _beadSyncIcon();
  if(target === _beadCx) return;
  _beadTweenTo(target);
}

// Glisser la pastille : suivi direct au pointeur, aperçu de l'onglet
// survolé, aimantation par le même tween au relâchement.
function _beadInitDrag(){
  const bead = document.getElementById('navBead');
  if(!bead || bead.dataset.dragReady) return;
  bead.dataset.dragReady = '1';
  let dragging = false, moved = false;
  const nearest = x => {
    const i = Math.round((x - _beadG.pad) / _beadG.tabW - 0.5);
    return Math.max(0, Math.min(_beadTabs().length - 1, i));
  };
  bead.addEventListener('pointerdown', e => {
    if(!_beadG) return;
    dragging = true; moved = false;
    try { bead.setPointerCapture(e.pointerId); } catch(err){}
    cancelAnimationFrame(_beadAnim);
    e.preventDefault();
  });
  bead.addEventListener('pointermove', e => {
    if(!dragging) return;
    moved = true;
    const inner = document.getElementById('beadInner');
    const last = _beadTabs().length - 1;
    const x = Math.max(_beadCxFor(0), Math.min(_beadCxFor(last),
      e.clientX - inner.getBoundingClientRect().left));
    _beadSetCx(x);
    const n = nearest(x);
    const tabs = _beadTabs();
    if(!tabs[n]?.classList.contains('active')){
      tabs.forEach((t, i) => t.classList.toggle('active', i === n));
      _beadSyncIcon();
    }
  });
  const end = e => {
    if(!dragging) return;
    dragging = false;
    try { bead.releasePointerCapture(e.pointerId); } catch(err){}
    const idx = _beadActiveIdx();
    if(moved) _beadTweenTo(_beadCxFor(idx)); else _beadSetCx(_beadCxFor(idx));
    // le drag EST une navigation : appliquer la vue de l'onglet atteint
    const view = _beadTabs()[idx]?.getAttribute('data-view');
    if(moved && view && view !== currentView) switchView(view);
  };
  bead.addEventListener('pointerup', end);
  bead.addEventListener('pointercancel', end);
}

/* L'onglet Réglages devient « Admin » en mode spectateur. Écrire
   .textContent sur un <svg> DÉTRUIT ses <path> — d'où l'icône vide
   qu'on a eue en 1.24.0. On échange donc le contenu SVG, et le libellé
   passe par i18n au lieu d'une chaîne en dur. */
const NAV_UNLOCK = '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>';

export function setSettingsTabLocked(locked){
  const tab = document.querySelector('.bn-tab[data-view="settings"]');
  if(!tab) return;
  const icon = tab.querySelector('.bn-icon');
  if(icon){
    if(locked){
      if(!icon.dataset.origIcon) icon.dataset.origIcon = icon.innerHTML;
      icon.innerHTML = NAV_UNLOCK;
    } else if(icon.dataset.origIcon){
      icon.innerHTML = icon.dataset.origIcon;
    }
  }
  const label = tab.querySelector('.bn-label');
  if(label){
    // basculer la CLÉ, pas seulement le texte : applyLanguage() repasse
    // derrière et réécrirait le libellé depuis data-i18n.
    const key = locked ? 'nav.admin' : 'nav.settings';
    label.setAttribute('data-i18n', key);
    label.textContent = t(key);
  }
  _beadSyncIcon();   // la pastille clone l'onglet actif : la resynchroniser
}

export function initNavBead(){
  layoutNavBead();
  _beadInitDrag();
  window.addEventListener('resize', layoutNavBead);
}

/* ══════════════════════════════════════════════════════════ CONFIRM
   Remplace confirm() : un navigateur qui a supprimé les dialogues natifs
   rendait les actions de sécurité inertes, sans le moindre retour. */
export function confirmDialog(message, opts = {}){
  return new Promise(resolve => {
    document.getElementById('confirmMo')?.remove();
    const prev = document.activeElement;
    const ov = document.createElement('div');
    ov.className = 'danger-mo';
    ov.id = 'confirmMo';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.innerHTML = `
      <div class="danger-mo-box confirm-box">
        <div class="confirm-msg"></div>
        <div class="danger-mo-actions">
          <button class="setv-btn" data-r="0" type="button">${t('danger.cancel')}</button>
          <button class="setv-btn${opts.danger ? ' danger' : ''}" data-r="1" type="button">${opts.confirmLabel || t('cfm.confirm')}</button>
        </div>
      </div>`;
    ov.querySelector('.confirm-msg').textContent = message; // jamais d'injection
    document.body.appendChild(ov);
    const done = v => {
      ov.remove();
      document.removeEventListener('keydown', onKey);
      try { prev && prev.focus(); } catch(e){}
      resolve(v);
    };
    const onKey = e => {
      if(e.key === 'Escape') done(false);
      if(e.key === 'Tab'){                      // focus piégé dans la modale
        const f = [...ov.querySelectorAll('button')];
        const i = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    };
    ov.addEventListener('click', e => {
      const b = e.target.closest('[data-r]');
      if(b) done(b.dataset.r === '1');
      else if(e.target === ov) done(false);
    });
    document.addEventListener('keydown', onKey);
    ov.querySelector('[data-r="1"]').focus();
  });
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
  pop.innerHTML=sortTypesCanonical(card.types).map(ty=>{
    const ct=CARD_TYPES[ty];
    const d=getTypeData(cardId,ty);
    return `<button type="button" class="qadd-type" role="menuitem" data-action="quickAddType" data-card="${cardId}" data-type="${ty}" title="${ct.label}" aria-label="${ct.label}" style="color:${ct.color}">${typeIcon(ty)}${(d.qty||0)>0?`<span class="qadd-qty">${d.qty}</span>`:''}</button>`;
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
  dismissQuickAddHint();
  const prev=quickAddVariant(cardId, typeId);
  showToast(t('quick.added'), {
    actionLabel:t('quick.undo'),
    onAction:()=>{ undoQuickAdd(cardId, typeId, prev); updateStats(); updateCardTile(cardId); }
  });
  updateStats(); updateCardTile(cardId); // la tuile remplacée emporte son popover
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
/* Transition d'entrée entre vues (phase C) : fondu + léger glissement
   ~150 ms ease-out, DIRECTIONNEL — la vue arrive du même côté que la
   pastille de navigation voyage, une seule grammaire de mouvement.
   Transform/opacity uniquement (zéro layout shift, le skeleton ne
   réapparaît pas) ; prefers-reduced-motion coupe l'animation en CSS. */
const VIEW_ORDER = ['collection', 'badges', 'stats', 'account', 'settings'];
function _animateViewIn(view, fromView){
  if(view === fromView) return;
  const el = view === 'collection'
    ? document.getElementById('collectionView')
    : document.getElementById(view + 'View');
  if(!el) return;
  const dir = VIEW_ORDER.indexOf(view) >= VIEW_ORDER.indexOf(fromView) ? 'r' : 'l';
  el.classList.remove('view-in-l', 'view-in-r');
  void el.offsetWidth;                       // rejouable : redémarre l'animation
  el.classList.add('view-in-' + dir);
  el.addEventListener('animationend', () => el.classList.remove('view-in-l', 'view-in-r'), { once: true });
}

export function switchView(view){
  // Garde unique : le mode spectateur ne donne jamais accès aux Réglages,
  // quel que soit le chemin (clic, glissement, appel direct). Le garde
  // vivait dans la délégation d'app.js et le drag le contournait.
  if(isViewer() && view === 'settings'){
    showAdminPinScreen();
    return;
  }
  if(currentView === 'badges' && view !== 'badges') resetHeroAnimation();
  const fromView = currentView;
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
      renderBadges({ animateHero: true });
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
  _animateViewIn(view, fromView);
}
