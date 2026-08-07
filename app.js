/* ══════════════════════════════════════════════════════════
   APP — entry point: init sequence, global event wiring, boot.
   Loaded as an ES module (<script type="module" src="app.js">).
   ══════════════════════════════════════════════════════════ */
import { log } from './logger.js';
import { isViewer } from './session.js';
import { t, applyLanguage } from './i18n.js';
import { loadAppData, _renderSeasonPills, switchSeason, CARDS_DB } from './data.js';
import { loadData, coll, exportCollection, _handleImportFile } from './storage.js';
import {
  showGridSkeleton, hideGridSkeleton,
  renderCollection, switchView, closeMo,
  toggleTheme, quickToggle, changeMoQty, showToast,
  toggleQuickAdd, quickAddType, closeQuickAdd, initNavBead
} from './render.js';
import { updateStats } from './stats.js';
import {
  loadManualBadges, updateUserTitle, toggleManualBadge, removeAutoBadge,
  enterRemoveBadgeMode, toggleTitlePicker, getUnlockedTitles, selectTitle
} from './badges.js';
import {
  pinKey, pinDel, showAdminPinScreen, showSetupScreen,
  needsLanguageChoice, showLanguageScreen,
  _bindViewerBrowseBtn, isViewerModeAllowed, isSetupDone, isPinEnabled,
  setAuthenticated, applySavedFont
} from './pin.js';
import { maybeHandleBackupHash } from './backup.js';
import { isTutorialSeen, markTutorialSeen } from './tutorial.js';
import { initInstall, maybeShowInstallBanner } from './install.js';
import { handleAuthRedirect } from './cloud.js';
import { initUpdateFlow, maybeOfferWhatsNew } from './update.js';

// Magic-link return: if the URL carries a GoTrue #access_token fragment,
// store the cloud session and clean the URL — before anything else
// (incl. maybeHandleBackupHash) looks at location.hash. On success,
// land the user on the Account view so the signed-in state is visible.
let _openAccountAfterInit = false;
let _appInitialized = false;
handleAuthRedirect().then(ok => {
  if(!ok) return;
  _openAccountAfterInit = true;
  if(_appInitialized) switchView('account');
});

// Listen for beforeinstallprompt as early as possible — it can fire
// before the app is initialized (login screen still visible).
initInstall();

export function initApp() {
  log('Initialisation de l\'app...');
  showGridSkeleton();          // no-op if the data lands within 150ms
  loadAppData().then(() => {
    hideGridSkeleton();
    log('Données chargées, CARDS_DB.length:', CARDS_DB.length);
    loadData();
    loadManualBadges();
    initEvents();
    initNavBead();
    renderCollection();
    updateStats();
    _renderSeasonPills();
    // Re-assert the persisted font (inline vars) — robust even if the
    // stylesheet's [data-font] rules are stale/missing.
    applySavedFont();
    // Apply saved language on app load (after data is loaded)
    applyLanguage();
    // Load and apply user title
    updateUserTitle();

    log('App initialisée, coll contient:', Object.keys(coll).length, 'cartes');

    // If the app was opened from a scanned QR / shared #backup= link,
    // trigger the existing restore (merge/replace) dialog.
    maybeHandleBackupHash();

    // Install banner: the beforeinstallprompt event may have fired
    // while the login screen was still up — show it now if relevant.
    maybeShowInstallBanner();

    // Just updated to a newer version? Offer (never impose) the
    // "what's new" changelog. Idempotent — safe on unlock re-inits.
    maybeOfferWhatsNew();

    // Magic-link sign-in just landed? Show the Account view.
    _appInitialized = true;
    if(_openAccountAfterInit) switchView('account');
  });
}

let _eventsInitialized = false;
function initEvents(){
  if(_eventsInitialized) return;
  _eventsInitialized = true;
  // ── Global event delegation for data-action ──
  document.addEventListener('click', e => {
    // Quick-add : un clic hors du sélecteur/bouton + le referme
    closeQuickAdd(e.target);
    const el = e.target.closest('[data-action]');
    if(!el) return;
    const action = el.getAttribute('data-action');

    // Block write actions in viewer mode
    const VIEWER_BLOCKED = new Set(['quickToggle','changeMoQty','quickAdd','quickAddType','toggleManualBadge','removeAutoBadge','enterRemoveBadgeMode','toggleTitlePicker','selectTitle',
      // l'export sort la collection de l'appareil : une fuite, pas une écriture
      'exportCollection']);
    if(isViewer() && VIEWER_BLOCKED.has(action)){
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
      case 'changeMoQty': {
        const cardId = el.getAttribute('data-card');
        const typeId = el.getAttribute('data-type');
        const delta = parseInt(el.getAttribute('data-delta'), 10);
        changeMoQty(cardId, typeId, delta);
        break;
      }
      case 'quickAdd': {
        toggleQuickAdd(el.getAttribute('data-card'), el);
        break;
      }
      case 'quickAddType': {
        quickAddType(el.getAttribute('data-card'), el.getAttribute('data-type'));
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
      case 'switchView': {
        const view = el.getAttribute('data-view');
        if(isViewer() && view === 'settings'){
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
  // Lock button is now in settings page, bound on renderSettings()

  const modalCloseBtn = document.getElementById('modalCloseBtn');
  if(modalCloseBtn) modalCloseBtn.addEventListener('click', closeMo);

  const mo = document.getElementById('mo');
  if(mo) mo.addEventListener('click', e => { if(e.target === mo) closeMo(); });

  // ── Touch swipe: modal down → close ──
  let _touchStartY = 0;
  const modalEl = document.querySelector('.modal');
  if(modalEl){
    modalEl.addEventListener('touchstart', e => { _touchStartY = e.touches[0].clientY; }, {passive:true});
    modalEl.addEventListener('touchend', e => {
      const dy = e.changedTouches[0].clientY - _touchStartY;
      if(dy > 80) closeMo();
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

// Existing installs (setup already done before the tutorial shipped)
// must never get the guided tour auto-launched retroactively: flag them
// silently. They can still replay it from Settings.
if(isSetupDone() && !isTutorialSeen()) markTutorialSeen();

if(!isSetupDone()){
  // First launch: language choice first (only if none was ever set),
  // then the PIN setup — which then runs in the chosen language.
  if(needsLanguageChoice()){
    log('First launch - showing language screen');
    showLanguageScreen();
  } else {
    log('First launch - showing setup screen');
    showSetupScreen();
  }
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
   SERVICE WORKER — offline support (PWA) + automatic updates.
   update.js registers sw.js, watches for a new waiting worker
   (→ "new version — reload" banner), and re-checks periodically
   so installed PWAs that stay open still learn about releases.
   Silently skipped on file:// (guard inside), which is expected.
   ══════════════════════════════════════════════════════════ */
initUpdateFlow();
