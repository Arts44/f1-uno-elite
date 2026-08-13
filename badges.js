/* ══════════════════════════════════════════════════════════
   BADGES SYSTEM — v3 : 111 badges (59 auto + 52 manuels) + titres
   ══════════════════════════════════════════════════════════ */
import { t, tEsc, getLang } from './i18n.js';
import { icon } from './icons.js';
import { pageHeadHTML, pageHeadBtn } from './pagehead.js';
import { CARD_TYPES, AUTO_BADGES, MANUAL_BADGES, seasonCatalogueState, seasonCardCount, _currentSeason } from './data.js';
import {
  _storageKey,
  cardWishlist, cardDoubles, cardFavorite,
  cardRarity
} from './storage.js';
/* La correspondance badge → cartes vit dans badge-cards.js : elle répond
   à une autre question que ce module, sans DOM ni i18n, ce qui la rend
   réemployable par l'export de liste d'échange. RÉ-EXPORTÉE ici pour que
   ce pas reste un déplacement. */
/* Les règles vivent dans badge-rules.js : la logique métier pure, sans
   DOM ni minuteur — c'est ce que stats.js et difficulty.js consomment.
   RÉ-EXPORTÉES pour que ce pas reste un déplacement. */
import {
  evaluateBadgeCondition, seedNewAutoBadges, isAutoBadgeUnlocked,
  FAMILIES, familyBadges, pickNextBadge, hardestUnlockedBadge,
} from './badge-rules.js';
export {
  evaluateBadgeCondition, seedNewAutoBadges, isAutoBadgeUnlocked,
  FAMILIES, familyBadges, pickNextBadge, hardestUnlockedBadge,
};
/* La célébration et les toasts vivent dans badge-toasts.js : seule
   partie à minuteurs, appelée à chaque updateStats(), et point
   d'accroche de l'invitation d'avis. RÉ-EXPORTÉS : ce pas déplace. */
import { groupBadgeToastLabel, queueBadgeToasts, checkNewAutoBadges, _celebrate } from './badge-toasts.js';
export { groupBadgeToastLabel, queueBadgeToasts, checkNewAutoBadges };
/* La carte de profil vit dans profile-card.js : c'est la plomberie de
   sortie de l'app (canvas → PNG → partage), et l'export de liste
   d'échange en a besoin sans vouloir de la page Badges. */
import { shareProfileCard } from './profile-card.js';
export { shareProfileCard };
import { getBadgeCards } from './badge-cards.js';
export { getBadgeCards };
/* Les titres vivent dans badge-titles.js : un titre n'est pas un badge,
   c'est ce que le collectionneur affiche de lui-même — clé de stockage
   propre, trois consommateurs qui n'ont besoin que de ça. RÉ-EXPORTÉS
   pour que ce pas reste un déplacement. */
import { getUnlockedTitles, selectTitle, updateUserTitle, toggleTitlePicker } from './badge-titles.js';
export { getUnlockedTitles, selectTitle, updateUserTitle, toggleTitlePicker };
import { badgeDifficulty, difficultyLabelKey } from './difficulty.js';
import { updateStats } from './stats.js';
import { showToast } from './render.js';
import { secureSet } from './secure-store.js';
import {
  manualBadges, autoBadgeUnlocked, setManualBadges, setAutoBadgeUnlocked,
  loadManualBadges, saveManualBadges, badgeUnlockDate,
  getPinnedBadge, setPinnedBadge, _seenAutoBadges,
} from './badges-store.js';


/* L'état persistant vit dans badges-store.js — voir son en-tête pour la
   raison (l'arête storage → badges, famille du bug de fuite 1.52.1).
   RÉ-EXPORTÉ ici : ce pas est un déplacement, pas un changement d'API,
   et les consommateurs (app, stats, data, tutorial) ne bougent pas. */
export {
  manualBadges, autoBadgeUnlocked, setManualBadges, setAutoBadgeUnlocked,
  loadManualBadges, saveManualBadges, badgeUnlockDate,
  getPinnedBadge, setPinnedBadge,
};

// Evaluate badge progress from JSON condition config
/* ── Objectif épinglé (préférence locale, par saison) ── */

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


/* ── Description d'un badge : le chiffre vient de la saison ──
   « Posséder les 101 cartes » était vrai en 2025 et faux au millésime
   suivant. Le libellé porte donc {n}, rempli par le total DÉCLARÉ.

   Et quand aucun total n'est déclaré ? On ne remplit pas {n} avec une
   estimation : le libellé d'un badge est une PROMESSE — « atteins ce
   nombre et tu l'auras » — et promettre un chiffre faux est pire que
   ne pas en donner. On bascule sur une formulation sans chiffre. Le
   badge est de toute façon indébloquable dans ce cas (`partiel`), donc
   les deux se tiennent : pas de chiffre, pas de déblocage. */
function _descTexte(b, tr){
  const brut = tr.desc || b.desc || '';
  if(!brut.includes('{n}')) return brut;
  const total = seasonCardCount();
  return total === null ? t('b.all_cards') : brut.replace('{n}', total);
}

/* ── Le champ `season` devient LU (1.59.0) ──
   Il existait dans les données depuis l'origine et le code l'ignorait
   complètement : un champ que tout lecteur croit actif, et qui ne
   produit rien. Cinq badges le portaient à tort — « posséder tous les
   pilotes » a un sens dans n'importe quelle saison — et leur champ a
   été retiré. Deux le portent à raison : `launch_day` (« j'étais là au
   lancement ») et `prediction` (« j'ai prédit le champion 2025 ») sont
   des faits DATÉS.

   Ce qu'on en fait : une étiquette, pas un masquage. Un badge gagné
   reste visible hors de sa saison — le cacher serait un reverrouillage
   visuel, contraire à la règle « une fois débloqué, toujours débloqué ».
   L'étiquette dit simplement pourquoi il ne peut plus être obtenu.

   On ne bloque pas non plus sa validation : ces deux-là sont MANUELS,
   donc déclaratifs. Quelqu'un qui coche en 2027 « j'étais là au
   lancement » raconte 2025, il ne triche pas. */
function _saisonChip(b){
  const y = b.season;
  if(!Number.isInteger(y) || y === _currentSeason) return '';
  return ` <span class="bd-season" title="${tEsc('b.season_only', { y })}">${y}</span>`;
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
  let h = `<div class="bd-name">${b.emoji} ${tr.name || b.name}${_saisonChip(b)}</div>
    <div class="bd-desc">${_descTexte(b, tr)}</div>
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
   USER TITLES — 1 par badge + titres spéciaux jalons
   ══════════════════════════════════════════════════════════ */
// Titles unlocked by each badge (auto + manual)
