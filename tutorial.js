/* ══════════════════════════════════════════════════════════
   INTERACTIVE TUTORIAL — a step-by-step guided tour that makes
   the user perform the real actions (spotlight + bubble, waits
   for the action before advancing). Self-navigates between views
   and opens the modal/sidebar so the targeted element exists.

   Pedagogical order: the very first thing taught is HOW TO ADD
   A CARD (open a card → mark a variant owned), then quantities/
   doubles, quick statuses, filters & search, then the other views.

   Robustness: every step shows BOTH a "skip this step" and a
   "quit tutorial" control, so the user can never get stuck.
   State-change steps (close the sidebar / the modal) advance on
   the actual state change, whichever way the user triggers it.

   DATA SAFETY: the tour performs real edits, so it snapshots ALL
   collection-critical localStorage keys + in-memory view/filter
   state at start, and RESTORES them verbatim on finish OR skip —
   the user's collection is byte-identical afterwards. Verified
   explicitly on a non-empty collection (see tests + browser).

   Zero runtime deps: overlay + spotlight are hand-rolled here.
   ══════════════════════════════════════════════════════════ */
import { log } from './logger.js';
import { t, applyLanguage } from './i18n.js';
import { _currentSeason } from './data.js';
import { loadData } from './storage.js';
import { loadManualBadges } from './badges.js';
import {
  filters, favoriteFirst, setFavoriteFirst, sectionStates, toggleSection,
  currentView, setCurrentView, switchView, toggleSidebar, closeMo, applyFilters,
} from './render.js';
import { updateStats } from './stats.js';
import { applySavedFont } from './pin.js';

const SEEN_KEY = 'f1uno_onboarded'; // reused: existing installs stay flagged

export function isTutorialSeen(){ return localStorage.getItem(SEEN_KEY) === 'true'; }
export function markTutorialSeen(){ localStorage.setItem(SEEN_KEY, 'true'); }

/* ══════════════════════════════════════════════════════════
   STATE SNAPSHOT / RESTORE  (pure localStorage part is tested)
   ══════════════════════════════════════════════════════════ */
// Every localStorage key the tour could touch, for the given season.
export function tutorialKeys(season){
  return [
    `f1uno_owned_${season}`,
    `f1uno_badges_${season}`,
    `f1uno_auto_badges_${season}`,
    `f1uno_history_${season}`,
    'f1uno_title',
    'f1uno_changes_since_backup',
    'f1uno_last_backup',
    'f1uno_theme',
    'f1uno_lang',
    'f1uno_font',
  ];
}

// Capture the exact value (or null when absent) of each key.
export function captureLocalStorage(keys){
  const snap = {};
  keys.forEach(k => { snap[k] = localStorage.getItem(k); });
  return snap;
}

// Restore each key to its captured value; a key that was absent
// (null) is removed — so anything the tour created is undone too.
export function applyLocalStorage(snap){
  Object.keys(snap).forEach(k => {
    const v = snap[k];
    if(v === null || v === undefined) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  });
}

// Full snapshot: localStorage + in-memory view/filter state (browser).
function captureState(){
  return {
    ls: captureLocalStorage(tutorialKeys(_currentSeason)),
    filters: JSON.parse(JSON.stringify(filters)),
    favoriteFirst,
    sectionStates: JSON.parse(JSON.stringify(sectionStates)),
    view: currentView,
  };
}

// Re-apply the collapsed/expanded DOM state of every sidebar section
// from sectionStates (toggleSection only flips, so sync explicitly).
function _syncSectionsDom(){
  Object.keys(sectionStates).forEach(section => {
    const btn = document.getElementById(`${section}-toggle`);
    if(!btn) return;
    const box = btn.closest('.sidebar-section');
    const collapsed = !!sectionStates[section];
    if(box) box.classList.toggle('collapsed', collapsed);
    btn.classList.toggle('collapsed', collapsed);
    btn.textContent = collapsed ? '▶' : '▼';
  });
}

// Restore everything the tour may have changed, then re-render.
function restoreState(snap){
  if(!snap) return;
  try { closeMo(); } catch(e){}
  _ensureSidebar(false);
  applyLocalStorage(snap.ls);
  // Re-hydrate in-memory data from the restored localStorage
  try { loadData(); } catch(e){ log('tut restore loadData', e); }
  try { loadManualBadges(); } catch(e){}
  // Restore filter / view state
  Object.keys(filters).forEach(k => { delete filters[k]; });
  Object.assign(filters, snap.filters);
  setFavoriteFirst(snap.favoriteFirst);
  Object.assign(sectionStates, snap.sectionStates);
  _syncSectionsDom();
  // Restore theme / font from the restored prefs
  const theme = snap.ls['f1uno_theme'];
  if(theme) document.documentElement.setAttribute('data-theme', theme);
  else document.documentElement.removeAttribute('data-theme');
  try { applySavedFont(); } catch(e){}
  // Re-render with the restored language + data, then go back to the origin view
  try { applyLanguage(); } catch(e){ log('tut restore applyLanguage', e); }
  setCurrentView(snap.view);
  try { switchView(snap.view); } catch(e){}
  try { applyFilters(); updateStats(); } catch(e){}
}

/* ══════════════════════════════════════════════════════════
   STEP DEFINITIONS
   Each step: { id, ensure?, target?, action?, observe? }
   - ensure(): async, navigates/opens so the target can exist.
   - target: CSS selector or () => Element. Selectors are scanned
     for the first VISIBLE match (a hidden element is not a target).
   - action: how the user advances:
       {type:'click', selector}    — click matching the selector
       {type:'dataAction', name}   — click on [data-action=name]
       {type:'view', view}         — click on the bottom-nav tab
       {type:'input', selector}    — type into the input
       {type:'condition', check}   — polls check() until true; the
         step validates on the STATE change, however it was caused
         (button, overlay, swipe, keyboard…). Used for "close X".
   - observe: true → passive step with a Next button.
   Every step also gets "skip this step" + "quit tutorial" buttons.
   ══════════════════════════════════════════════════════════ */
const q = sel => document.querySelector(sel);
const _visible = el => !!el && el.getClientRects && el.getClientRects().length > 0;
const firstVisible = sel => [...document.querySelectorAll(sel)].find(_visible) || null;
const cards = () => document.querySelectorAll('#collectionView .card, .card');
const nthCardChip = (n, status) => () => cards()[n]?.querySelector(`[data-action="quickToggle"][data-status="${status}"]`);

function _isSidebarOpen(){
  const sb = document.getElementById('floating-sidebar');
  return !!sb && sb.classList.contains('open');
}
function _isModalOpen(){
  const mo = document.getElementById('mo');
  return !!mo && mo.classList.contains('open');
}
function _ensureSidebar(open){
  if(_isSidebarOpen() !== open){ try { toggleSidebar(); } catch(e){} }
}
// Expand a collapsed sidebar section so its pills are visible
// (all sections start collapsed → a hidden pill is never a valid target).
function _ensureSectionOpen(section){
  if(sectionStates[section]){ try { toggleSection(section); } catch(e){} }
}
function _clearSearch(){
  const si = document.getElementById('searchInput');
  if(si && si.value !== ''){ si.value = ''; si.dispatchEvent(new Event('input', { bubbles: true })); }
}

export const TUTORIAL_STEPS = [
  { id: 'welcome', observe: true,
    ensure: async () => { switchView('collection'); _ensureSidebar(false); try { closeMo(); } catch(e){} } },

  // ── 1. The core gesture: add a card to the collection ──
  // Cards open via a direct onclick (no data-action), so the step
  // validates on the actual state change: the detail modal opening.
  { id: 'open_card',
    ensure: async () => { _clearSearch(); _ensureSidebar(false); },
    target: () => cards()[0],
    action: { type: 'condition', check: () => _isModalOpen() } },

  { id: 'mark_owned',
    ensure: async () => { if(!_isModalOpen()){ cards()[0]?.click(); } },
    target: () => q('#moTypeRows .mqbtn[data-delta="1"]'),
    action: { type: 'dataAction', name: 'changeMoQty' } },

  { id: 'mark_double',
    target: () => q('#moTypeRows .mqbtn[data-delta="1"]'),
    action: { type: 'dataAction', name: 'changeMoQty' } },

  // Validates on the actual close, whichever way (✕, backdrop, swipe)
  { id: 'close_modal',
    target: '#modalCloseBtn',
    action: { type: 'condition', check: () => !_isModalOpen() } },

  // ── 2. Quick statuses from the grid ──
  { id: 'favorite',
    ensure: async () => { try { closeMo(); } catch(e){} },
    target: nthCardChip(0, 'favorite'),
    action: { type: 'dataAction', name: 'quickToggle' } },

  { id: 'wishlist',
    target: nthCardChip(1, 'wishlist'),
    action: { type: 'dataAction', name: 'quickToggle' } },

  // ── 3. Finding cards: filters + search ──
  { id: 'sidebar_open',
    ensure: async () => { switchView('collection'); _ensureSidebar(false); },
    target: '#sidebar-toggle',
    action: { type: 'click', selector: '#sidebar-toggle' } },

  { id: 'filter_apply',
    // The rarity section starts collapsed: expand it so pills are visible
    ensure: async () => { _ensureSidebar(true); _ensureSectionOpen('rarities'); },
    target: () => firstVisible('#sidebarRarPills .fpill') || firstVisible('#floating-sidebar .fpill'),
    action: { type: 'click', selector: '.fpill' } },

  { id: 'filter_reset',
    ensure: async () => { _ensureSidebar(true); },
    target: '[data-action="resetFilters"]',
    action: { type: 'dataAction', name: 'resetFilters' } },

  // Validates on the actual close (✕, overlay, toggle, swipe, key B)
  { id: 'sidebar_close',
    target: '#sidebarClose',
    action: { type: 'condition', check: () => !_isSidebarOpen() } },

  { id: 'search',
    ensure: async () => { _ensureSidebar(false); },
    target: '#searchInput',
    action: { type: 'input', selector: '#searchInput' } },

  // ── 4. Badges ──
  { id: 'go_badges',
    ensure: async () => { _clearSearch(); },
    target: '.bn-tab[data-view="badges"]',
    action: { type: 'view', view: 'badges' } },

  { id: 'badge_manual',
    ensure: async () => { switchView('badges'); },
    target: () => firstVisible('[data-action="toggleManualBadge"]'),
    action: { type: 'dataAction', name: 'toggleManualBadge' } },

  { id: 'badge_remove',
    target: '[data-action="enterRemoveBadgeMode"]',
    action: { type: 'dataAction', name: 'enterRemoveBadgeMode' } },

  // ── 5. Stats ──
  { id: 'go_stats',
    target: '.bn-tab[data-view="stats"]',
    action: { type: 'view', view: 'stats' } },

  { id: 'stats_progress', ensure: async () => { switchView('stats'); },
    target: () => q('#statsView .sv-progress'), observe: true },
  { id: 'stats_highlights', target: () => q('#statsView .sv-feat'), observe: true },
  { id: 'stats_donut', target: () => q('#statsView .sv-donut'), observe: true },

  // ── 6. Settings ──
  { id: 'go_settings',
    target: '.bn-tab[data-view="settings"]',
    action: { type: 'view', view: 'settings' } },

  { id: 'set_theme', ensure: async () => { switchView('settings'); },
    target: () => q('#settingsView [data-action="toggleTheme"]'), observe: true },
  { id: 'set_font', target: '#fontPicker', observe: true },
  { id: 'set_backup', target: '#backupCodeBtn', observe: true },
  { id: 'set_data', target: '#importBtn', observe: true },
  { id: 'set_tools', target: '#toolsMissingBtn', observe: true },
  { id: 'replay', target: '#replayTutBtn', observe: true },
];

/* ══════════════════════════════════════════════════════════
   TOUR ENGINE (DOM)
   ══════════════════════════════════════════════════════════ */
let _active = false;
let _snapshot = null;
let _overlay = null, _spot = null, _bubble = null;
let _stepCleanup = null;
let _escHandler = null;
let _stepSeq = 0; // invalidates async work from a stale step

export function maybeStartTutorial(){
  if(isTutorialSeen()) return;
  markTutorialSeen();      // set immediately: never auto-replays
  startTutorial();
}

export function startTutorial(){
  if(_active) return;
  _active = true;
  _snapshot = captureState();
  _buildOverlay();
  _escHandler = e => { if(e.key === 'Escape') _end(true); };
  document.addEventListener('keydown', _escHandler, true);
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
  _overlay.append(_spot, _bubble);
  document.body.appendChild(_overlay);
}

function _teardown(){
  if(_stepCleanup){ _stepCleanup(); _stepCleanup = null; }
  if(_escHandler){ document.removeEventListener('keydown', _escHandler, true); _escHandler = null; }
  if(_overlay){ _overlay.remove(); _overlay = null; }
  _spot = _bubble = null;
  _active = false;
  _stepSeq++;
}

function _end(skipped){
  log('tutorial: end, skipped=', skipped);
  restoreState(_snapshot);
  _snapshot = null;
  _teardown();
}

// Poll for a visible target. Selectors scan ALL matches (a hidden
// first match must not mask a visible one further down).
function _waitForTarget(step, seq, timeout = 4000){
  return new Promise(resolve => {
    if(!step.target){ resolve(null); return; }
    const get = () => (typeof step.target === 'function' ? step.target() : firstVisible(step.target)) || null;
    const t0 = Date.now();
    const tick = () => {
      if(!_active || seq !== _stepSeq){ resolve(null); return; }
      const el = get();
      if(_visible(el)){ resolve(el); return; }
      if(Date.now() - t0 > timeout){ resolve(null); return; }
      setTimeout(tick, 90);
    };
    tick();
  });
}

async function _runStep(i){
  if(_stepCleanup){ _stepCleanup(); _stepCleanup = null; }
  if(!_active) return;
  if(i >= TUTORIAL_STEPS.length){ _end(false); return; }
  const seq = ++_stepSeq;
  const step = TUTORIAL_STEPS[i];
  try { if(step.ensure) await step.ensure(); } catch(e){ log('tut ensure', step.id, e); }
  if(!_active || seq !== _stepSeq) return;
  // Show the bubble IMMEDIATELY (skip/quit stay usable while the
  // target is being looked for) — the user is never stuck.
  _positionSpot(null);
  _showBubble(step, i);
  const el = await _waitForTarget(step, seq);
  if(!_active || seq !== _stepSeq) return;
  if(!el && step.target){
    // Target never appeared: tell the user and let them move on.
    log('tutorial: target missing', step.id);
    _showBubble(step, i, { missing: true });
    _bindAdvance(step, () => _runStep(i + 1), null, { forceNext: true });
    return;
  }
  _positionSpot(el);
  _showBubble(step, i);
  _bindAdvance(step, () => _runStep(i + 1), el);
}

function _positionSpot(el){
  if(!el){ _spot.style.display = 'none'; return; }
  const r = el.getBoundingClientRect();
  const pad = 6;
  _spot.style.display = 'block';
  _spot.style.top = `${r.top - pad}px`;
  _spot.style.left = `${r.left - pad}px`;
  _spot.style.width = `${r.width + pad * 2}px`;
  _spot.style.height = `${r.height + pad * 2}px`;
}

function _showBubble(step, i, opts = {}){
  const isLast = i === TUTORIAL_STEPS.length - 1;
  const total = TUTORIAL_STEPS.length;
  const showNext = step.observe || isLast || opts.missing;
  _bubble.innerHTML = `
    <div class="tut-progress">${i + 1} / ${total}</div>
    <div class="tut-title">${t('tut.' + step.id + '_t')}</div>
    <div class="tut-text">${opts.missing ? t('tut.missing') : t('tut.' + step.id + '_d')}</div>
    <div class="tut-btns">
      <button class="tut-quit" id="tutQuit" type="button">${t('tut.quit')}</button>
      ${isLast ? '' : `<button class="tut-skip-step" id="tutSkipStep" type="button">${t('tut.skip_step')}</button>`}
      ${showNext ? `<button class="tut-next" id="tutNext" type="button">${isLast ? t('tut.done') : t('tut.next')}</button>` : `<span class="tut-hint">${t('tut.do_it')}</span>`}
    </div>`;
  _bubble.querySelector('#tutQuit').addEventListener('click', () => _end(true));
  const skipStep = _bubble.querySelector('#tutSkipStep');
  if(skipStep){
    const idx = i;
    skipStep.addEventListener('click', () => { if(_active) _runStep(idx + 1); });
  }
  _positionBubble(step);
}

function _positionBubble(step){
  const bw = Math.min(320, window.innerWidth - 24);
  _bubble.style.width = `${bw}px`;
  const spotShown = _spot.style.display !== 'none';
  if(!spotShown){
    _bubble.style.left = `${(window.innerWidth - bw) / 2}px`;
    _bubble.style.top = `${Math.max(24, window.innerHeight / 2 - 90)}px`;
    return;
  }
  const r = _spot.getBoundingClientRect();
  const bh = _bubble.offsetHeight || 150;
  const gap = 12;
  let top = r.bottom + gap;
  if(top + bh > window.innerHeight - 12) top = Math.max(12, r.top - bh - gap);
  let left = r.left + r.width / 2 - bw / 2;
  left = Math.max(12, Math.min(left, window.innerWidth - bw - 12));
  _bubble.style.left = `${left}px`;
  _bubble.style.top = `${top}px`;
}

// Bind the completion condition for the step (or a Next button for observe).
function _bindAdvance(step, done, el, opts = {}){
  const cleanups = [];
  let finished = false;
  const finish = () => {
    if(finished) return;
    finished = true;
    cleanups.forEach(fn => fn());
    done();
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
      // Advance on the actual state change, whichever way it happens
      // (button, overlay, swipe, keyboard shortcut…).
      const iv = setInterval(() => { try { if(a.check()) finish(); } catch(e){} }, 150);
      cleanups.push(() => clearInterval(iv));
    } else {
      // click / dataAction / view — listen at document level (capture) so the
      // real interaction advances regardless of the exact inner element hit.
      const match = e => {
        if(a.type === 'dataAction') return !!e.target.closest(`[data-action="${a.name}"]`);
        if(a.type === 'view') return !!e.target.closest(`.bn-tab[data-view="${a.view}"]`);
        return !!e.target.closest(a.selector);
      };
      const h = e => { if(match(e)) setTimeout(finish, 60); }; // let the app handler run first
      document.addEventListener('click', h, true);
      cleanups.push(() => document.removeEventListener('click', h, true));
    }
  }

  // Reposition spotlight/bubble on resize/scroll while the step is live
  const repos = () => { _positionSpot(el); _positionBubble(step); };
  window.addEventListener('resize', repos);
  window.addEventListener('scroll', repos, true);
  cleanups.push(() => { window.removeEventListener('resize', repos); window.removeEventListener('scroll', repos, true); });

  _stepCleanup = () => cleanups.forEach(fn => fn());
}
