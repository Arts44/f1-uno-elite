/* ══════════════════════════════════════════════════════════
   INTERACTIVE TUTORIAL — a step-by-step guided tour that makes
   the user perform the real actions (spotlight + bubble, waits
   for the action before advancing). Self-navigates between views
   and opens the modal so the targeted element exists.

   Pedagogical order: the very first thing taught is HOW TO ADD
   A CARD (open a card → mark a variant owned), then quantities/
   doubles, quick statuses, then the other views.

   Robustness: every step shows BOTH a "skip this step" and a
   "quit tutorial" control, so the user can never get stuck.
   State-change steps (close the modal) advance on the actual
   state change, whichever way the user triggers it.

   DATA SAFETY: the tour performs real edits, so it snapshots ALL
   collection-critical localStorage keys + in-memory view state
   at start, and RESTORES them verbatim on finish OR skip —
   the user's collection is byte-identical afterwards. Verified
   explicitly on a non-empty collection (see tests + browser).

   Zero runtime deps: overlay + spotlight are hand-rolled here.
   ══════════════════════════════════════════════════════════ */
import { log } from './logger.js';
import { t, applyLanguage } from './i18n.js';
import { _currentSeason, CARDS_DB } from './data.js';
import { loadData } from './storage.js';
import { isViewer } from './session.js';
import { loadManualBadges } from './badges.js';
import {
  currentView, setCurrentView, switchView, closeMo, renderCollection,
} from './render.js';
import { updateStats } from './stats.js';
import { applySavedFont } from './pin.js';

/* La partie SÛRETÉ DES DONNÉES (isTutorialSeen, tutorialKeys,
   capture/applyLocalStorage) vit dans tutorial-snapshot.js : app.js en a
   besoin au démarrage et n'a pas à payer les 700 lignes du moteur pour
   deux getters. Le module est une FEUILLE et doit le rester. */
import {
  isTutorialSeen, markTutorialSeen,
  tutorialKeys, captureLocalStorage, applyLocalStorage,
} from './tutorial-snapshot.js';

// Full snapshot: localStorage + in-memory view state (browser).
function captureState(){
  return {
    ls: captureLocalStorage(tutorialKeys(_currentSeason)),
    view: currentView,
  };
}

// Restore everything the tour may have changed, then re-render.
function restoreState(snap){
  if(!snap) return;
  try { closeMo(); } catch(e){}
  applyLocalStorage(snap.ls);
  // Re-hydrate in-memory data from the restored localStorage
  try { loadData(); } catch(e){ log('tut restore loadData', e); }
  /* Journalisé comme loadData() ci-dessus, et pas par symétrie
     cosmétique : ces deux appels sont les seuls du bloc à remettre en
     MÉMOIRE ce que localStorage contient. Les autres ne font que
     réafficher — un échec s'y voit à l'écran. Ici, un échec avalé laisse
     l'utilisateur avec les badges du tutoriel devant un localStorage
     pourtant correct, et rien ne le dit. */
  try { loadManualBadges(); } catch(e){ log('tut restore loadManualBadges', e); }
  // Restore theme / font from the restored prefs
  const theme = snap.ls['f1uno_theme'];
  if(theme) document.documentElement.setAttribute('data-theme', theme);
  else document.documentElement.removeAttribute('data-theme');
  try { applySavedFont(); } catch(e){}
  // Re-render with the restored language + data, then go back to the origin view
  try { applyLanguage(); } catch(e){ log('tut restore applyLanguage', e); }
  setCurrentView(snap.view);
  try { switchView(snap.view); } catch(e){}
  try { renderCollection(); updateStats(); } catch(e){}
}

/* ══════════════════════════════════════════════════════════
   LE PARCOURS — 5 CHAPITRES, DANS L'ORDRE DE LA NAV
   (1.47.0 — refonte)

   Avant : 23 étapes à plat qui sautaient d'une vue à l'autre.
   L'utilisateur ne savait ni où il en était ni combien il en
   restait. Maintenant chaque page a son chapitre : on y entre,
   on présente la page, on montre ce qu'elle sait faire, on passe
   à la suivante. On peut sauter un chapitre entier.

   Chaque étape : { id, chapter, ensure?, target?, action?, observe? }
   - chapter : id du chapitre (voir TUTORIAL_CHAPTERS) ;
   - ensure(): async, navigue/ouvre pour que la cible existe ;
   - target : sélecteur CSS ou () => Element. Un sélecteur est
     balayé en entier : une première occurrence cachée ne doit pas
     masquer une occurrence visible plus bas ;
   - action : comment l'utilisateur avance :
       {type:'click', selector}    — clic sur le sélecteur
       {type:'dataAction', name}   — clic sur [data-action=name]
       {type:'view', view}         — clic sur l'onglet de la nav
       {type:'input', selector}    — saisie dans le champ
       {type:'condition', check}   — sonde check() jusqu'à true ;
         l'étape valide sur le CHANGEMENT D'ÉTAT, quelle qu'en soit
         la cause (bouton, voile, glissement, clavier…) ;
   - observe: true → étape passive, bouton Suivant.

   Toute étape d'action porte AUSSI « Passer l'étape » : personne
   ne reste coincé sur un geste qu'il n'arrive pas à faire.
   ══════════════════════════════════════════════════════════ */
const q = sel => document.querySelector(sel);
const _rects = el => !!el && el.getClientRects && el.getClientRects().length > 0;
const firstVisible = sel => [...document.querySelectorAll(sel)].find(_rects) || null;
const cards = () => document.querySelectorAll('#collectionView .card, .card');
const nthCardChip = (n, status) => () => cards()[n]?.querySelector(`[data-action="quickToggle"][data-status="${status}"]`);

function _isModalOpen(){
  const mo = document.getElementById('mo');
  return !!mo && mo.classList.contains('open');
}

export const TUTORIAL_CHAPTERS = [
  { id: 'collection', view: 'collection' },
  { id: 'badges',     view: 'badges' },
  { id: 'stats',      view: 'stats' },
  { id: 'account',    view: 'account' },
  { id: 'settings',   view: 'settings' },
];

// En mode spectateur la page Compte est verrouillée : guider vers un
// mur n'apprend rien, donc le CHAPITRE ENTIER sort du parcours (et le
// compteur de chapitres tombe à 4).
const VIEWER_SKIPPED_CHAPTER = 'account';

export function activeTutorialChapters(){
  return isViewer() ? TUTORIAL_CHAPTERS.filter(c => c.id !== VIEWER_SKIPPED_CHAPTER) : TUTORIAL_CHAPTERS;
}
export function activeTutorialSteps(){
  return isViewer() ? TUTORIAL_STEPS.filter(s => s.chapter !== VIEWER_SKIPPED_CHAPTER) : TUTORIAL_STEPS;
}

export const TUTORIAL_STEPS = [
  /* ── CHAPITRE 1 · COLLECTION ─────────────────────────────
     Le cœur de l'app. On apprend le geste d'ajout AVANT tout le
     reste : c'est la seule chose sans laquelle rien d'autre n'a
     de sens. ── */
  { id: 'coll_intro', chapter: 'collection', observe: true,
    ensure: async () => { switchView('collection'); try { closeMo(); } catch(e){} },
    target: () => q('#collHead .ph') },

  { id: 'open_card', chapter: 'collection',
    ensure: async () => { switchView('collection'); },
    target: () => cards()[0],
    action: { type: 'condition', check: () => _isModalOpen() } },

  { id: 'mark_owned', chapter: 'collection',
    ensure: async () => { if(!_isModalOpen()){ cards()[0]?.click(); } },
    target: () => q('#moTypeRows .mqbtn[data-delta="1"]'),
    action: { type: 'dataAction', name: 'changeMoQty' } },

  { id: 'mark_double', chapter: 'collection',
    target: () => q('#moTypeRows .mqbtn[data-delta="1"]'),
    action: { type: 'dataAction', name: 'changeMoQty' } },

  // Rareté + set complet dans la même étape : l'un explique l'autre.
  // Éternel n'est atteignable QUE par un set complet, le dire là où
  // les variantes sont sous les yeux est le seul endroit qui marche.
  { id: 'set_complete', chapter: 'collection', observe: true,
    target: () => q('#moTypeRows') },

  { id: 'close_modal', chapter: 'collection',
    target: '#modalCloseBtn',
    action: { type: 'condition', check: () => !_isModalOpen() } },

  // Favori et souhait : même geste, deux significations — une seule
  // étape, l'une ou l'autre puce valide.
  { id: 'quick_status', chapter: 'collection',
    ensure: async () => { try { closeMo(); } catch(e){} },
    target: nthCardChip(0, 'favorite'),
    action: { type: 'dataAction', name: 'quickToggle' } },

  { id: 'quick_add', chapter: 'collection',
    ensure: async () => { try { closeMo(); } catch(e){} },
    target: () => q('.card .qbtn'),
    // Le second temps du geste : une fois le « + » pressé, le halo suit
    // le menu de variantes (voir « cible de suite de geste », plus bas).
    follow: () => q('.qadd-type'),
    action: { type: 'dataAction', name: 'quickAddType' } },

  /* ── CHAPITRE 2 · BADGES ── */
  { id: 'go_badges', chapter: 'badges',
    target: '.bn-tab[data-view="badges"]',
    action: { type: 'view', view: 'badges' } },

  { id: 'badges_intro', chapter: 'badges', observe: true,
    ensure: async () => { switchView('badges'); },
    target: () => q('#badgesHead .ph') },

  { id: 'badge_next', chapter: 'badges', observe: true,
    target: () => q('#badgesNext') },

  { id: 'badge_families', chapter: 'badges', observe: true,
    target: () => q('#badgesFams .badge-fam') },

  /* ── CHAPITRE 3 · STATS ── */
  { id: 'go_stats', chapter: 'stats',
    target: '.bn-tab[data-view="stats"]',
    action: { type: 'view', view: 'stats' } },

  { id: 'stats_intro', chapter: 'stats', observe: true,
    ensure: async () => { switchView('stats'); },
    target: () => q('#statsView .ph') },

  { id: 'stats_progress', chapter: 'stats', observe: true,
    target: () => q('#statsView .sv-progress') },

  // Depuis 1.45.0 donut et cartes phares vivent dans le rail collant :
  // une seule étape les montre ensemble, ce qui est aussi le message.
  { id: 'stats_rail', chapter: 'stats', observe: true,
    // .sv-donut-row (182 px) laissait tout juste 3 px de marge sous la
    // bulle : au moindre arrondi du centrage, le placement basculait sur
    // le repli et recouvrait la cible. Le donut seul (140 px) tient large.
    target: () => q('#statsView .sv-donut') || q('#statsView .sv-donut-row') },

  { id: 'stats_goals', chapter: 'stats', observe: true,
    target: () => q('#statsView .sv-goals') },

  { id: 'set_tools', chapter: 'stats', observe: true,
    target: () => q('#statsView .sv-tools-tabs') || q('#statsView .sv-tools') },

  /* ── CHAPITRE 4 · COMPTE ── */
  { id: 'go_account', chapter: 'account',
    target: '.bn-tab[data-view="account"]',
    action: { type: 'view', view: 'account' } },

  { id: 'account_intro', chapter: 'account', observe: true,
    ensure: async () => { switchView('account'); },
    target: () => q('#accountView .ph') },

  { id: 'acc_cloud', chapter: 'account', observe: true,
    target: () => q('#accountView .acc-cloud') },

  { id: 'set_backup', chapter: 'account', observe: true,
    target: '#backupCodeBtn' },

  { id: 'set_data', chapter: 'account', observe: true,
    target: '#importBtn' },

  /* ── CHAPITRE 5 · RÉGLAGES ── */
  { id: 'go_settings', chapter: 'settings',
    target: '.bn-tab[data-view="settings"]',
    action: { type: 'view', view: 'settings' } },

  { id: 'settings_intro', chapter: 'settings', observe: true,
    ensure: async () => { switchView('settings'); },
    target: () => q('#settingsView .ph') },

  { id: 'set_theme', chapter: 'settings', observe: true,
    target: () => q('#settingsView [data-action="toggleTheme"]') },

  { id: 'set_security', chapter: 'settings', observe: true,
    target: () => q('#settingsView .set-security') },

  { id: 'replay', chapter: 'settings', observe: true,
    target: '#replayTutBtn' },
];

/* ══════════════════════════════════════════════════════════
   MOTEUR

   Le défaut corrigé en 1.47.0 : l'ancien moteur affichait la bulle
   puis CHERCHAIT la cible, sans jamais faire défiler. Quand la
   cible était hors du cadre, l'utilisateur voyait un écran grisé
   sans savoir où regarder.

   Maintenant, pour chaque étape : on amène la cible dans la bande
   sûre (sous l'en-tête collant, au-dessus de la nav), on VÉRIFIE
   qu'elle y est vraiment, et seulement alors on affiche. Si elle
   refuse de venir, une pastille directionnelle prend le relais —
   jamais d'écran grisé inerte.
   ══════════════════════════════════════════════════════════ */
const HEADER_H = 56;
const NAV_CLEAR = 107;
const SKIP_HINT_MS = 6000;   // au bout de ce délai, « Passer l'étape » s'affirme

let _active = false;
let _snapshot = null;
let _overlay = null, _spot = null, _bubble = null, _away = null;
let _stepCleanup = null;
let _keyHandler = null;
let _stepSeq = 0; // invalide le travail asynchrone d'une étape périmée

const _reduceMotion = () =>
  !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const _wait = ms => new Promise(r => setTimeout(r, ms));

export function maybeStartTutorial(){
  if(isTutorialSeen()) return;
  markTutorialSeen();      // posé tout de suite : jamais de relance auto
  startTutorial();
}

export function startTutorial(){
  if(_active) return;
  _active = true;
  _snapshot = captureState();
  _buildOverlay();
  _keyHandler = e => {
    if(!_active) return;
    if(e.key === 'Escape'){ e.preventDefault(); _end(true); return; }
    // Flèches : avancer / reculer sans quitter le clavier.
    if(e.key === 'ArrowRight'){ const b = _bubble?.querySelector('#tutNext') || _bubble?.querySelector('#tutSkipStep'); if(b){ e.preventDefault(); b.click(); } }
    if(e.key === 'ArrowLeft'){ const b = _bubble?.querySelector('#tutPrev'); if(b && !b.disabled){ e.preventDefault(); b.click(); } }
  };
  document.addEventListener('keydown', _keyHandler, true);
  log('tutorial: started');
  _runStep(0);
}

function _buildOverlay(){
  _overlay = document.createElement('div');
  _overlay.className = 'tut-overlay';
  _spot = document.createElement('div');
  _spot.className = 'tut-spot';
  _bubble = document.createElement('div');
  _bubble.className = 'tut-bubble';
  // Le lecteur d'écran doit annoncer chaque étape : dialogue non modal
  // + region live, et le focus se pose dessus à chaque changement.
  _bubble.setAttribute('role', 'dialog');
  _bubble.setAttribute('aria-live', 'polite');
  _bubble.setAttribute('tabindex', '-1');
  _away = document.createElement('div');
  _away.className = 'tut-away';
  _away.style.display = 'none';
  _overlay.append(_spot, _bubble, _away);
  document.body.appendChild(_overlay);
}

function _teardown(){
  if(_stepCleanup){ _stepCleanup(); _stepCleanup = null; }
  if(_keyHandler){ document.removeEventListener('keydown', _keyHandler, true); _keyHandler = null; }
  if(_overlay){ _overlay.remove(); _overlay = null; }
  _spot = _bubble = _away = null;
  _active = false;
  _stepSeq++;
}

function _end(skipped){
  log('tutorial: end, skipped=', skipped);
  // phase E : le hint d'ajout rapide ne vise QUE ceux qui ont sauté la
  // visite — on mémorise le saut (et on efface si elle a été finie).
  try {
    if(skipped) localStorage.setItem('f1uno_tut_skipped', 'true');
    else localStorage.removeItem('f1uno_tut_skipped');
  } catch(e){}
  restoreState(_snapshot);
  _snapshot = null;
  _teardown();
}

/* ── Géométrie ─────────────────────────────────────────────
   La « bande sûre » : ce qui reste de l'écran une fois l'en-tête
   collant et la barre de nav flottante retirés. Une cible posée
   dessous ou dessus est invisible même si le navigateur la dit
   « rendue ». ── */
function _band(){
  return { top: HEADER_H + 12, bottom: window.innerHeight - NAV_CLEAR - 12 };
}

// Le conteneur qui défile réellement autour de l'élément (chaque vue a
// le sien ; la fiche carte aussi). window en dernier recours.
function _scrollerOf(el){
  let n = el && el.parentElement;
  while(n && n !== document.body && n !== document.documentElement){
    const st = getComputedStyle(n);
    if(/(auto|scroll)/.test(st.overflowY) && n.scrollHeight > n.clientHeight + 4) return n;
    n = n.parentElement;
  }
  return null;
}

// Amène la cible au centre de la bande sûre. Défilement instantané si
// l'utilisateur a demandé moins d'animations.
async function _bringIntoView(el){
  if(!el) return;
  // Ancré (header, nav, overlay fixe) : la PAGE n'a pas à bouger — mais
  // un défileur INTERNE à l'ancrage peut, lui, amener la cible. Le cas
  // réel : l'inspecteur de la matrice (1.64.0) vit en bas du corps
  // défilant de la fiche carte, hors écran à l'ouverture. L'exemption
  // totale des ancrés laissait le halo éteint sur une cible atteignable.
  if(_isPinned(el) && !_scrollerOf(el)) return;
  const behavior = _reduceMotion() ? 'auto' : 'smooth';
  const band = _band();
  const r = el.getBoundingClientRect();
  const wanted = band.top + Math.max(0, (band.bottom - band.top - r.height) / 2);
  const delta = Math.round(r.top - wanted);
  if(Math.abs(delta) < 8) return;
  const sc = _scrollerOf(el);
  try {
    if(sc) sc.scrollBy({ top: delta, behavior });
    else window.scrollBy({ top: delta, behavior });
  } catch(e){
    if(sc) sc.scrollTop += delta; else window.scrollBy(0, delta);
  }
  await _settled(el);
}

// Attendre la FIN du défilement, pas un délai au jugé. Un scroll fluide
// de 400 px dure plus que les 420 ms qu'on attendait avant : la bulle se
// plaçait sur une cible encore en mouvement, et finissait par-dessus.
// On sonde jusqu'à ce que la position ne bouge plus sur deux relevés.
async function _settled(el, timeout = 1200){
  if(_reduceMotion()){ await _wait(40); return; }
  const t0 = Date.now();
  let last = null, stable = 0;
  while(Date.now() - t0 < timeout){
    await _wait(60);
    const y = Math.round(el.getBoundingClientRect().top);
    if(last !== null && Math.abs(y - last) <= 1){ if(++stable >= 2) return; }
    else stable = 0;
    last = y;
  }
}

// Une cible ANCRÉE (position:fixed — onglets de la nav flottante, ✕ de
// la fiche carte) ne défile pas : la juger sur la bande sûre la
// déclarerait invisible à jamais, alors qu'elle est sous les yeux.
function _isPinned(el){
  let n = el;
  while(n && n !== document.body){
    const pos = getComputedStyle(n).position;
    if(pos === 'fixed' || pos === 'sticky') return true;
    n = n.parentElement;
  }
  return false;
}

// Visible POUR DE VRAI. getClientRects().length ne dit que « rendu
// quelque part », y compris à 3000 px sous le pli. On juge donc sur
// une aire : la bande sûre pour ce qui défile, l'écran entier pour ce
// qui est ancré.
function _isVisible(el){
  if(!_rects(el)) return false;
  const r = el.getBoundingClientRect();
  if(r.width < 2 || r.height < 2) return false;
  if(r.right <= 0 || r.left >= window.innerWidth) return false;
  const area = _isPinned(el) ? { top: 0, bottom: window.innerHeight } : _band();
  const shown = Math.min(r.bottom, area.bottom) - Math.max(r.top, area.top);
  return shown >= Math.min(r.height, 24);
}

/* ── Attente de la cible ── */
function _waitForTarget(step, seq, timeout = 4000){
  return new Promise(resolve => {
    if(!step.target){ resolve(null); return; }
    const get = () => (typeof step.target === 'function' ? step.target() : firstVisible(step.target)) || null;
    const t0 = Date.now();
    const tick = () => {
      if(!_active || seq !== _stepSeq){ resolve(null); return; }
      const el = get();
      if(_rects(el)){ resolve(el); return; }
      if(Date.now() - t0 > timeout){ resolve(null); return; }
      setTimeout(tick, 90);
    };
    tick();
  });
}

async function _runStep(i){
  if(_stepCleanup){ _stepCleanup(); _stepCleanup = null; }
  if(!_active) return;
  const STEPS = activeTutorialSteps();
  if(i >= STEPS.length){ _end(false); return; }
  const seq = ++_stepSeq;
  const step = STEPS[i];

  try { if(step.ensure) await step.ensure(); } catch(e){ log('tut ensure', step.id, e); }
  if(!_active || seq !== _stepSeq) return;

  // La bulle s'affiche tout de suite (Quitter / Passer restent
  // utilisables pendant qu'on cherche la cible) mais SANS halo.
  _hideSpot();
  _showBubble(step, i);

  const el = await _waitForTarget(step, seq);
  if(!_active || seq !== _stepSeq) return;

  if(!el && step.target){
    log('tutorial: cible absente', step.id);
    _showBubble(step, i, { missing: true });
    _bindAdvance(step, i, null, { forceNext: true });
    return;
  }

  // Deux tentatives d'amener la cible dans la bande sûre.
  let visible = _isVisible(el);
  for(let attempt = 0; attempt < 2 && !visible; attempt++){
    await _bringIntoView(el);
    if(!_active || seq !== _stepSeq) return;
    visible = _isVisible(el);
  }

  if(!visible){
    // Dernier recours : on ne grise pas un écran sans rien dire.
    const r = el.getBoundingClientRect();
    log('tutorial: cible hors bande après 2 tentatives', step.id, Math.round(r.top));
    _showAway(r.top < _band().top ? 'up' : 'down');
    _hideSpot();
  } else {
    _hideAway();
    _positionSpot(el);
  }
  _showBubble(step, i, {}, _isVisible(el) ? el : null);
  _bindAdvance(step, i, el);
}

/* ── Halo, pastille directionnelle, bulle ── */
function _hideSpot(){ if(_spot) _spot.style.display = 'none'; }
function _positionSpot(el){
  if(!el){ _hideSpot(); return; }
  const r = el.getBoundingClientRect();
  const pad = 6;
  _spot.style.display = 'block';
  _spot.style.top = `${r.top - pad}px`;
  _spot.style.left = `${r.left - pad}px`;
  _spot.style.width = `${r.width + pad * 2}px`;
  _spot.style.height = `${r.height + pad * 2}px`;
}
function _hideAway(){ if(_away) _away.style.display = 'none'; }
function _showAway(dir){
  if(!_away) return;
  _away.style.display = '';
  _away.className = `tut-away ${dir}`;
  _away.textContent = t(dir === 'up' ? 'tut.away_up' : 'tut.away_down');
}

function _chapterInfo(i){
  const STEPS = activeTutorialSteps();
  const CHAPTERS = activeTutorialChapters();
  const chId = STEPS[i].chapter;
  const inChapter = STEPS.filter(s => s.chapter === chId);
  return {
    id: chId,
    index: CHAPTERS.findIndex(c => c.id === chId),
    total: CHAPTERS.length,
    n: inChapter.indexOf(STEPS[i]) + 1,
    of: inChapter.length,
    firstAfter: STEPS.findIndex(s => s.chapter !== chId && STEPS.indexOf(s) > i),
  };
}

function _showBubble(step, i, opts = {}, el = null){
  const STEPS = activeTutorialSteps();
  const isLast = i === STEPS.length - 1;
  const ch = _chapterInfo(i);
  const isAction = !step.observe && !!step.action && !opts.missing;
  const showNext = !isAction || opts.missing;

  const rail = Array.from({ length: ch.total }, (_, k) => {
    if(k < ch.index) return '<i class="done"></i>';
    if(k > ch.index) return '<i></i>';
    return `<i class="now"><span style="width:${Math.round(ch.n / ch.of * 100)}%"></span></i>`;
  }).join('');

  // Sur une étape d'action, « Passer l'étape » remplace « Passer le
  // chapitre » : c'est la sortie de secours pour un geste qui résiste.
  const skipId = isAction ? 'tutSkipStep' : 'tutSkipChapter';
  const skipLong = isAction ? t('tut.skip_step') : t('tut.skip_chapter');
  const skipShort = isAction ? t('tut.skip_step') : t('tut.skip_chapter_short');

  _bubble.innerHTML = `
    <div class="tut-rail" aria-hidden="true">${rail}</div>
    <div class="tut-kicker">
      <span class="tut-chapter">${t('tut.ch_' + ch.id)}</span>
      <span class="tut-count">${ch.n} / ${ch.of}</span>
    </div>
    <h2 class="tut-title">${t('tut.' + step.id + '_t')}</h2>
    <p class="tut-text">${opts.missing ? t('tut.missing') : t('tut.' + step.id + '_d', { n: CARDS_DB.length })}</p>
    <div class="tut-btns">
      <button class="tut-quit" id="tutQuit" type="button" aria-label="${t('tut.quit')}">
        <span class="tut-lg">${t('tut.quit')}</span><span class="tut-sm" aria-hidden="true">✕</span>
      </button>
      <button class="tut-prev" id="tutPrev" type="button" aria-label="${t('tut.prev')}"${i === 0 ? ' disabled' : ''}>
        <span class="tut-lg">${t('tut.prev')}</span><span class="tut-sm" aria-hidden="true">‹</span>
      </button>
      ${isLast ? '' : `<button class="tut-skip" id="${skipId}" type="button" aria-label="${skipLong}">
        <span class="tut-lg">${skipLong}</span><span class="tut-sm">${skipShort}</span>
      </button>`}
      ${showNext
        ? `<button class="tut-next" id="tutNext" type="button">${isLast ? t('tut.done') : t('tut.next')}</button>`
        : `<span class="tut-do">${t('tut.do_it')}</span>`}
    </div>`;

  _bubble.setAttribute('aria-label', t('tut.ch_' + ch.id) + ' — ' + t('tut.' + step.id + '_t'));
  _bubble.querySelector('#tutQuit').addEventListener('click', () => _end(true));
  const prev = _bubble.querySelector('#tutPrev');
  if(prev && i > 0) prev.addEventListener('click', () => { if(_active) _runStep(i - 1); });
  const skipChapter = _bubble.querySelector('#tutSkipChapter');
  if(skipChapter) skipChapter.addEventListener('click', () => {
    if(!_active) return;
    _runStep(ch.firstAfter === -1 ? STEPS.length : ch.firstAfter);
  });
  const skipStep = _bubble.querySelector('#tutSkipStep');
  if(skipStep){
    skipStep.addEventListener('click', () => { if(_active) _runStep(i + 1); });
    // Discrète d'abord, affirmée si le geste résiste : on n'invite pas
    // à sauter, mais on ne laisse jamais personne coincé.
    setTimeout(() => { try { skipStep.classList.add('urge'); } catch(e){} }, SKIP_HINT_MS);
  }

  _positionBubble(el);
  // Le focus suit l'étape : au clavier comme au lecteur d'écran, on est
  // toujours DANS la bulle qui vient de changer.
  try { _bubble.focus({ preventScroll: true }); } catch(e){}
}

/* Placement : sous la cible si la place existe, sinon dessus, sinon à
   côté, sinon centré. La bulle ne sort jamais de l'écran et ne
   recouvre jamais le halo. */
function _positionBubble(el){
  if(!_bubble) return;
  const gap = 12;
  const bw = Math.min(320, window.innerWidth - 24);
  _bubble.style.width = `${bw}px`;
  const bh = _bubble.offsetHeight || 200;
  const band = _band();
  const centre = () => {
    _bubble.dataset.side = 'none';
    _bubble.style.left = `${Math.round((window.innerWidth - bw) / 2)}px`;
    _bubble.style.top = `${Math.round(Math.max(band.top, (window.innerHeight - bh) / 2))}px`;
  };
  if(!el || !_spot || _spot.style.display === 'none'){ centre(); return; }

  // Rectangle de la CIBLE, élargi du même padding que le halo.
  const b0 = el.getBoundingClientRect();
  const pad = 6;
  const r = { top: b0.top - pad, left: b0.left - pad,
              bottom: b0.bottom + pad, right: b0.right + pad,
              width: b0.width + pad * 2, height: b0.height + pad * 2 };
  const below = band.bottom - r.bottom;
  const above = r.top - band.top;
  let side = null, top = 0, left = 0;

  if(below >= bh + gap){ side = 'bottom'; top = r.bottom + gap; }
  else if(above >= bh + gap){ side = 'top'; top = r.top - bh - gap; }
  else if(window.innerWidth - r.right >= bw + gap){
    side = 'right'; left = r.right + gap;
    top = Math.min(Math.max(band.top, r.top), band.bottom - bh);
  } else if(r.left >= bw + gap){
    side = 'left'; left = r.left - bw - gap;
    top = Math.min(Math.max(band.top, r.top), band.bottom - bh);
  }
  if(!side){
    // Cible plus haute que la bande : aucun côté ne tient entièrement.
    // Se centrer la recouvrirait en plein milieu ; on se range donc au
    // bord le plus dégagé, ce qui laisse le reste de la cible visible.
    side = below >= above ? 'bottom' : 'top';
    top = side === 'bottom' ? band.bottom - bh : band.top;
  }

  if(side === 'bottom' || side === 'top'){
    left = r.left + r.width / 2 - bw / 2;
  }
  left = Math.max(12, Math.min(left, window.innerWidth - bw - 12));
  top = Math.max(12, Math.min(top, window.innerHeight - bh - 12));
  _bubble.dataset.side = side;
  _bubble.style.left = `${Math.round(left)}px`;
  _bubble.style.top = `${Math.round(top)}px`;
  // La flèche vise le centre du halo, en restant dans la bulle.
  const centreOf = (side === 'bottom' || side === 'top')
    ? r.left + r.width / 2 - left
    : r.top + r.height / 2 - top;
  const span = (side === 'bottom' || side === 'top') ? bw : bh;
  _bubble.style.setProperty('--tut-arrow', `${Math.round(Math.max(18, Math.min(centreOf, span - 18)))}px`);
}

// Branche la condition de fin de l'étape (ou le bouton Suivant).
function _bindAdvance(step, i, el, opts = {}){
  const cleanups = [];
  let finished = false;
  const finish = () => {
    if(finished) return;
    finished = true;
    cleanups.forEach(fn => fn());
    _runStep(i + 1);
  };

  const next = _bubble.querySelector('#tutNext');
  if(next){ next.addEventListener('click', finish); cleanups.push(() => next.removeEventListener('click', finish)); }

  if(!opts.forceNext && step.action && !step.observe){
    const a = step.action;
    if(a.type === 'input'){
      const target = document.querySelector(a.selector);
      if(target){
        const h = () => finish();
        target.addEventListener('input', h, { once: true });
        cleanups.push(() => target.removeEventListener('input', h));
      }
    } else if(a.type === 'condition'){
      const iv = setInterval(() => { try { if(a.check()) finish(); } catch(e){} }, 150);
      cleanups.push(() => clearInterval(iv));
    } else {
      const match = e => {
        if(a.type === 'dataAction') return !!e.target.closest(`[data-action="${a.name}"]`);
        if(a.type === 'view') return !!e.target.closest(`.bn-tab[data-view="${a.view}"]`);
        return !!e.target.closest(a.selector);
      };
      const h = e => { if(match(e)) setTimeout(finish, 60); }; // laisse l'app réagir d'abord
      document.addEventListener('click', h, true);
      cleanups.push(() => document.removeEventListener('click', h, true));
    }
  }

  // Le halo et la bulle suivent la cible si la page bouge sous eux.
  // `cible` plutôt que `el` figé : la suite de geste (ci-dessous) peut
  // la déplacer, et un défilement ne doit pas la ramener en arrière.
  let cible = el;
  const repos = () => {
    const shown = cible && _isVisible(cible);
    if(shown) _positionSpot(cible);
    _positionBubble(shown ? cible : null);
  };

  /* ── Cible de SUITE DE GESTE (n°17) ──────────────────────────
     Quand le geste ouvre une surface intermédiaire — le « + » de
     l'ajout rapide ouvre un menu de variantes, et l'étape ne valide
     que sur le choix d'une variante — le halo doit ÉCLAIRER cette
     surface, pas rester sur le bouton déjà pressé.

     Sonde bornée plutôt que délai fixe : le menu est inséré par le
     handler DÉLÉGUÉ (bulle), qui court APRÈS ce listener (capture) —
     l'attente porte sur un ordre d'événements, pas sur une durée, et
     un délai « suffisant » ne le serait plus sur un CPU lent. Le
     motif est celui de _waitForTarget. */
  if(step.follow){
    const suivre = () => {
      const t0 = Date.now();
      const tick = () => {
        if(finished || !_active) return;
        const el2 = step.follow();
        if(el2 && _rects(el2)){ cible = el2; repos(); return; }
        if(Date.now() - t0 < 1200) setTimeout(tick, 90);
        else { cible = el; repos(); }   // surface refermée : on revient
      };
      setTimeout(tick, 0);   // après le handler délégué du même clic
    };
    document.addEventListener('click', suivre, true);
    cleanups.push(() => document.removeEventListener('click', suivre, true));
  }
  window.addEventListener('resize', repos);
  window.addEventListener('scroll', repos, true);
  cleanups.push(() => { window.removeEventListener('resize', repos); window.removeEventListener('scroll', repos, true); });

  _stepCleanup = () => cleanups.forEach(fn => fn());
}
