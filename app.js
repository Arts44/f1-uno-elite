/* ══════════════════════════════════════════════════════════
   APP — entry point: init sequence, global event wiring, boot.
   Loaded as an ES module (<script type="module" src="app.js">).
   ══════════════════════════════════════════════════════════ */
import { log } from './logger.js';
import { t, applyLanguage } from './i18n.js';
import { loadAppData, _renderSeasonPills, switchSeason, CARDS_DB } from './data.js';
import { loadData, coll, exportCollection, _handleImportFile } from './storage.js';
import {
  initSearch, renderSidebar, applyFilters, switchView, toggleSidebar, closeMo,
  toggleTheme, quickToggle, selectCard, changeMoQty, toggleSection,
  toggleFavoriteFirst, toggleChampionFilter, resetFilters, handleGlobalKeyPress, showToast,
  filters, favoriteFirst, sectionStates
} from './render.js';
import { updateStats } from './stats.js';
import {
  loadManualBadges, updateUserTitle, toggleManualBadge, removeAutoBadge,
  enterRemoveBadgeMode, toggleTitlePicker, getUnlockedTitles, selectTitle
} from './badges.js';
import {
  isViewerMode, pinKey, pinDel, showAdminPinScreen, showSetupScreen,
  _bindViewerBrowseBtn, isViewerModeAllowed, isSetupDone, isPinEnabled,
  setAuthenticated
} from './pin.js';
import { maybeHandleBackupHash } from './backup.js';
import { isOnboarded, markOnboarded } from './onboarding.js';

export function initApp() {
  log('Initialisation de l\'app...');
  loadAppData().then(() => {
    log('Données chargées, CARDS_DB.length:', CARDS_DB.length);
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

    log('App initialisée, coll contient:', Object.keys(coll).length, 'cartes');

    // If the app was opened from a scanned QR / shared #backup= link,
    // trigger the existing restore (merge/replace) dialog.
    maybeHandleBackupHash();
  });
}

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
        enterRemoveBadgeMode();
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
   GLOBAL LISTENERS (attached at load, like the original IIFE)
   ══════════════════════════════════════════════════════════ */
// Theme toggle works even before login (PIN screen)
document.addEventListener('click', e => {
  if(e.target.closest('[data-action="toggleTheme"]')) toggleTheme();
});

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

// Raccourcis clavier globaux
document.addEventListener('keydown', handleGlobalKeyPress);

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
log('Checking if PIN event listeners already attached:', window._pinEventListenersAttached);
if(!window._pinEventListenersAttached) {
  window._pinEventListenersAttached = true;
  log('Attaching PIN event listeners');
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-digit]');
    if(el) {
      log('PIN keypad click detected, digit:', el.getAttribute('data-digit'));
      pinKey(el.getAttribute('data-digit'));
    }
  }, { passive: true });

  // Wire up PIN delete button immediately
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-action="pinDel"]');
    if(el) {
      log('PIN delete button click detected');
      pinDel();
    }
  }, { passive: true });
}

log('Setup done:', isSetupDone());
log('PIN enabled:', isPinEnabled());
log('Viewer mode allowed:', isViewerModeAllowed());

// Existing installs (setup already done before the onboarding feature
// shipped) must never see the intro retroactively: flag them silently.
if(isSetupDone() && !isOnboarded()) markOnboarded();

if(!isSetupDone()){
  // First launch
  log('First launch - showing setup screen');
  showSetupScreen();
} else if(!isPinEnabled()){
  // No PIN — go straight to app
  log('PIN disabled - going straight to app');
  setAuthenticated(true);
  const ls = document.getElementById('login-screen');
  if(ls) ls.style.display='none';
  document.getElementById('app-wrapper').style.display='flex';
  initApp();
} else {
  log('PIN enabled - login screen should be visible');
}
// else: PIN enabled — login screen already visible in HTML, user enters PIN normally

/* ══════════════════════════════════════════════════════════
   SERVICE WORKER — offline support (PWA)
   Only registers over http/https; silently skipped on file://
   (the guard below is false there), which is expected.
   ══════════════════════════════════════════════════════════ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => log('Service worker registered, scope:', reg.scope))
      .catch(err => console.error('Service worker registration failed:', err));
  });
}
