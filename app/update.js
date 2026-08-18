/* ══════════════════════════════════════════════════════════
   UPDATE — automatic app updates + "what's new" flow.
   - Registers the service worker and watches for a NEW version:
     when a fresh SW reaches the "waiting" state, a discreet banner
     offers to reload; the click messages the waiting SW
     (SKIP_WAITING) and reloads once it takes control.
   - Installed PWAs can stay open for days without a navigation
     (the browser then never re-checks sw.js): we poke
     registration.update() when the app returns to the foreground
     and hourly while it stays open.
   - Version bookkeeping: APP_VERSION (from changelog.js) vs the
     last version seen by this device (f1uno_seen_version) drives a
     non-intrusive "see what's new" offer after an applied update.
   ══════════════════════════════════════════════════════════ */
import { log } from './logger.js';
import { t, getLang } from './i18n.js';
import { CHANGELOG, APP_VERSION, compareVersions, entriesSince, changesFor } from './changelog.js';
import { icon } from './icons.js';
import { demanderLaZone, libererLaZone, zoneBasse, RANG } from './moment.js';

const SEEN_KEY = 'f1uno_seen_version';
const CHECK_EVERY_MS = 60 * 60 * 1000; // hourly while the app stays open

export function lastSeenVersion(){ return localStorage.getItem(SEEN_KEY) || ''; }
export function markVersionSeen(v = APP_VERSION){ localStorage.setItem(SEEN_KEY, v); }

// Pure, unit-tested: offer "what's new" only when a baseline exists and
// the running version is strictly newer (never on fresh installs, never
// on a same-version reload, never on a downgrade/rollback).
export function shouldOfferWhatsNew(lastSeen, current = APP_VERSION){
  return !!lastSeen && compareVersions(current, lastSeen) > 0;
}

/* ══════════════════════════════════════════════════════════
   SW registration + update detection
   ══════════════════════════════════════════════════════════ */
let _reg = null;
let _reloading = false;

/* LE SONDAGE DU WORKER, ET POURQUOI LES NOUVEAUTÉS L'ATTENDENT.
   Mesuré sur le bundle : `maybeOfferWhatsNew()` pose sa demande à
   ~77 ms, le bandeau de mise à jour arrive après le sondage du service
   worker, et l'éviction retirait « Application mise à jour ! » au bout
   de 1624 ms. Un bandeau qui paraît une seconde et demie puis
   s'escamote est un SCINTILLEMENT — pas une file qui fonctionne.
   On attend donc de SAVOIR s'il y a une mise à jour à annoncer avant
   de proposer les nouveautés. Borné : hors ligne, sans service worker
   ou si l'enregistrement échoue, la promesse se résout quand même et
   les nouveautés paraissent. Elles ne dépendent de personne. */
export const DELAI_SONDAGE_MAX_MS = 4000;
/* `var` et création PARESSEUSE, délibérément — pas un oubli de style.
   app.js appelle `initUpdateFlow()` au niveau module (app.js:405), et
   le graphe est circulaire : la fonction peut donc tourner AVANT que
   le corps de ce fichier soit terminé. Avec `let`, la zone morte
   temporelle faisait échouer l'import entier
   (« Cannot access '_finSondage' before initialization »). */
var _finSondage;
var _sondageTermine;
function _promesseSondage(){
  if(!_sondageTermine) _sondageTermine = new Promise(r => { _finSondage = r; });
  return _sondageTermine;
}
function _sondageFait(){
  _promesseSondage();
  if(_finSondage){ _finSondage(); _finSondage = null; }
}

export function initUpdateFlow(){
  if(!('serviceWorker' in navigator)){ _sondageFait(); return; } // file:// etc. — expected
  setTimeout(_sondageFait, DELAI_SONDAGE_MAX_MS);
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
      .then(reg => {
        _reg = reg;
        log('Service worker registered, scope:', reg.scope);
        // A new SW may already be parked in "waiting" (downloaded on a
        // previous visit, banner never acted on): offer it again.
        if(reg.waiting && navigator.serviceWorker.controller) _showUpdateBanner();
        /* ON ATTEND QUE LE CONTRÔLE SOIT FINI, et deux essais plus
           naïfs ont été mesurés faux avant celui-ci :
             · `_sondageFait()` après `register()` — les nouveautés
               partaient à ~80 ms et se faisaient évincer à 1630 ms ;
             · attendre `reg.installing` — il est NUL à cet instant,
               le navigateur n'a pas encore commencé sa vérification.
           `update()` résout quand le travail est terminé, installation
           comprise : c'est la seule promesse qui réponde à la question
           « y a-t-il une mise à jour à annoncer ? ». Une requête
           conditionnelle de plus sur sw.js au démarrage, assumée. */
        reg.update().then(_sondageFait, _sondageFait);
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          if(!nw) return;
          nw.addEventListener('statechange', () => {
            // "installed" WITH an existing controller = an update is
            // ready and waiting. (On the very first install there is no
            // controller — nothing to announce.)
            if(nw.state === 'installed' && navigator.serviceWorker.controller){
              log('update: new service worker installed and waiting');
              _showUpdateBanner();
            }
          });
        });
      })
      .catch(err => { console.error('Service worker registration failed:', err); _sondageFait(); });

    // Reload exactly once when the waiting SW takes control after OUR
    // skip-waiting request. The guard ignores controller changes we did
    // not ask for (e.g. clients.claim on first install) — no reload loop.
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if(!_reloading) return;
      _reloading = false;
      window.location.reload();
    });

    document.addEventListener('visibilitychange', () => {
      if(document.visibilityState === 'visible') _checkForUpdate();
    });
    setInterval(_checkForUpdate, CHECK_EVERY_MS);
  });
}

function _checkForUpdate(){
  if(!_reg) return;
  _reg.update().catch(() => {}); // offline/network errors: silent
  /* ET ON REGARDE L'ÉTAT, pas seulement l'événement : `update()`
     n'émet `updatefound` que s'il TÉLÉCHARGE quelque chose. Quand un
     worker est déjà garé — le cas après une fermeture — il n'émet
     rien, et sans cette ligne le bandeau ne revenait jamais. */
  if(_reg.waiting && navigator.serviceWorker.controller) _showUpdateBanner();
}

// User clicked "Reload": promote the waiting SW, then reload on
// controllerchange (with a safety-net reload if the event never comes).
export function applyUpdate(){
  const waiting = _reg && _reg.waiting;
  _removeUpdateBanner();
  libererLaZone('maj');
  if(waiting){
    _reloading = true;
    waiting.postMessage({ type: 'SKIP_WAITING' });
    setTimeout(() => {
      if(_reloading){ _reloading = false; window.location.reload(); }
    }, 3000);
  } else {
    window.location.reload();
  }
}

/* ── Manual update check (Settings → About) ──
   Reuses the same registration and the same banner flow as the
   automatic detection — no parallel mechanism. */
export const MANUAL_CHECK_COOLDOWN_MS = 30000;
let _lastManualCheck = 0;

export function isUpdateCheckSupported(){
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
}

// Pure, unit-tested: maps an observed state to the user-facing outcome.
export function resolveUpdateCheck({ supported, registered, online, installing, waiting, error }){
  if(!supported || !registered) return 'unsupported';
  if(!online) return 'offline';
  if(error) return 'error';
  if(installing || waiting) return 'found';
  return 'uptodate';
}

// Pure, unit-tested: ms left before another manual check is allowed.
export function manualCheckCooldownRemaining(now, last, cooldownMs = MANUAL_CHECK_COOLDOWN_MS){
  return Math.max(0, last + cooldownMs - now);
}

export async function checkForUpdatesNow(){
  if(!isUpdateCheckSupported() || !_reg) return 'unsupported';
  if(!navigator.onLine) return 'offline';
  if(manualCheckCooldownRemaining(Date.now(), _lastManualCheck) > 0) return 'cooldown';
  _lastManualCheck = Date.now();
  let error = false;
  try {
    await _reg.update();
  } catch(e){
    error = true;
    log('manual update check failed:', e);
  }
  const outcome = resolveUpdateCheck({
    supported: true, registered: true, online: navigator.onLine,
    installing: !!_reg.installing, waiting: !!_reg.waiting, error,
  });
  // A new worker already parked in waiting: re-offer the banner right
  // away (the updatefound path only fires while it installs).
  if(outcome === 'found' && _reg.waiting && navigator.serviceWorker.controller) _showUpdateBanner();
  return outcome;
}

function _removeUpdateBanner(){
  const b = document.getElementById('updateBanner');
  if(b) b.remove();
}

/* ══════════════════════════════════════════════════════════
   FERMER VEUT DIRE « PAS MAINTENANT », PAS « JAMAIS » (1.76.0)

   LE DÉFAUT MESURÉ : un bandeau fermé ne revenait JAMAIS. Le
   mécanisme — `registration.update()` n'émet aucun `updatefound` quand
   le worker est déjà garé en waiting, donc les vérifications
   périodiques ne rallumaient rien. Il suffisait de fermer une fois,
   par réflexe, pour ne plus jamais voir la mise à jour de cette
   version. C'est l'explication du « une fois sur deux ».

   LE CONTRAT, clair et testable — trois règles, pas « il revient
   parfois » :
     1. fermer fait taire le bandeau pendant SILENCE_APRES_FERMETURE ;
     2. passé ce délai, la prochaine vérification le repropose ;
     3. un RECHARGEMENT le repropose tout de suite — c'est une
        nouvelle session, et recharger est un geste actif.

   Le silence dure aussi longtemps que l'intervalle de vérification :
   « il revient à la prochaine vérification » est alors vrai à la
   lettre. Il vit en MÉMOIRE, pas dans localStorage : un refus ne doit
   pas survivre à la session qui l'a exprimé.
   ══════════════════════════════════════════════════════════ */
export const SILENCE_APRES_FERMETURE_MS = CHECK_EVERY_MS;
let _fermeA = 0;

// Pur, testable : le bandeau a-t-il le droit de reparaître ?
export function peutReproposer(maintenant, fermeA, silenceMs = SILENCE_APRES_FERMETURE_MS){
  return !fermeA || (maintenant - fermeA) >= silenceMs;
}

function _fermerBanniere(){
  _fermeA = Date.now();
  _removeUpdateBanner();
  libererLaZone('maj');
}

/* DEMANDEUR et POSEUR sont séparés depuis 1.77.0 : la file de
   moment.js rappelle `_poserBanniere` quand la zone se libère, et
   `_showUpdateBanner` ne fait plus que poser la demande. Sans cette
   séparation, l'entrée rappelée redemanderait la zone en boucle.

   LE BANDEAU ATTEND LA FIN DE LA MISE EN ROUTE — mesuré au premier
   lancement : présent 6 fois sur 6, ATTEIGNABLE 0 fois sur 6.
   C'est désormais la file qui tient cette règle, pour les sept
   surfaces au lieu d'une. */
function _showUpdateBanner(){
  if(document.getElementById('updateBanner')) return;
  if(!peutReproposer(Date.now(), _fermeA)) return;
  demanderLaZone({ id: 'maj', rang: RANG.maj, selecteur: '#updateBanner',
                   montrer: _poserBanniere, cacher: _removeUpdateBanner });
}

function _poserBanniere(){
  if(document.getElementById('updateBanner')) return;
  const b = document.createElement('div');
  b.className = 'install-banner update-banner';
  b.id = 'updateBanner';
  b.setAttribute('role', 'status');
  b.innerHTML = `
    <span class="install-banner-icon" aria-hidden="true">${icon('refresh')}</span>
    <span class="install-banner-text">${t('upd.banner')}</span>
    <button class="install-banner-btn" id="updateReloadBtn" type="button">${t('upd.reload')}</button>
    <button class="install-banner-close" id="updateCloseBtn" type="button" aria-label="${t('upd.later')}">✕</button>`;
  zoneBasse().appendChild(b);
  document.getElementById('updateReloadBtn').addEventListener('click', applyUpdate);
  document.getElementById('updateCloseBtn').addEventListener('click', _fermerBanniere);
}

/* ══════════════════════════════════════════════════════════
   "What's new" — post-update offer + changelog dialog
   ══════════════════════════════════════════════════════════ */
let _whatsNewOffered = false;
export function _resetWhatsNew(){ _whatsNewOffered = false; _entreesWhatsNew = []; }  // tests

// Called from initApp(): if this device just moved to a newer version,
// offer (never impose) the changelog of what it missed. Fresh installs
// and pre-versioning installs are stamped silently — no greeting.
export function maybeOfferWhatsNew(){
  const last = lastSeenVersion();
  if(!shouldOfferWhatsNew(last)){
    if(!last) markVersionSeen();
    return;
  }
  const entries = entriesSince(last);
  /* ON NE CONSOMME PLUS À L'OFFRE. `markVersionSeen()` était appelé
     ICI, avant même que le bandeau soit demandé : mesuré sur le
     bundle, un profil en retard voyait « Application mise à jour ! »
     1624 ms puis se faire évincer, et le message ne revenait JAMAIS
     — `seen_version` valait déjà la version courante. C'est très
     exactement la perte de message qui a fait rejeter l'option du
     prédicat sans file ; elle s'était réintroduite par une autre
     porte. La version n'est estampillée que lorsque le message a été
     TRAITÉ : lu, ou fermé. Un bandeau jamais vu ne consomme rien, et
     la session suivante repose la question. */
  if(!entries.length){ markVersionSeen(); return; }   // rien à annoncer
  if(_whatsNewOffered || document.getElementById('whatsNewBanner')) return;
  _whatsNewOffered = true;
  /* IL N'AVAIT AUCUN GARDE. Son jumeau `_showUpdateBanner` attendait la
     fin de la mise en route depuis 1.76.0 ; celui-ci s'affichait en
     plein tutoriel — mesuré, capture à l'appui, avant la refonte
     (POINTS-SIGNALES n°26). La file le corrige au passage. */
  _entreesWhatsNew = entries;
  _promesseSondage().then(() => demanderLaZone({
    id: 'nouveautes', rang: RANG.nouveautes, selecteur: '#whatsNewBanner',
    montrer: _poserNouveautes, cacher: _removeWhatsNewBanner }));
}

let _entreesWhatsNew = [];
function _removeWhatsNewBanner(){ document.getElementById('whatsNewBanner')?.remove(); }

function _poserNouveautes(){
  const entries = _entreesWhatsNew;
  if(document.getElementById('whatsNewBanner')) return;
  const b = document.createElement('div');
  b.className = 'install-banner update-banner';
  b.id = 'whatsNewBanner';
  b.setAttribute('role', 'status');
  b.innerHTML = `
    <span class="install-banner-icon" aria-hidden="true">${icon('sparkles')}</span>
    <span class="install-banner-text">${t('upd.updated')}</span>
    <button class="install-banner-btn" id="whatsNewSeeBtn" type="button">${t('upd.whatsnew')}</button>
    <button class="install-banner-close" id="whatsNewCloseBtn" type="button" aria-label="${t('upd.later')}">✕</button>`;
  zoneBasse().appendChild(b);
  const close = () => { markVersionSeen(); b.remove(); libererLaZone('nouveautes'); };
  document.getElementById('whatsNewSeeBtn').addEventListener('click', () => { close(); openChangelog(entries); });
  document.getElementById('whatsNewCloseBtn').addEventListener('click', close);
}

// Changelog dialog — reuses the import-dialog look. `entries` defaults to
// the full history (Settings → What's new).
export function openChangelog(entries = CHANGELOG){
  if(document.querySelector('.changelog-overlay')) return;
  const lang = getLang();
  const overlay = document.createElement('div');
  overlay.className = 'import-dialog-overlay changelog-overlay';
  overlay.innerHTML = `
    <div class="import-dialog changelog-dialog">
      <div class="import-dialog-title">${icon('sparkles')} ${t('upd.whatsnew')}</div>
      <div class="changelog-list">
        ${entries.map(e => `
        <div class="changelog-entry">
          <div class="changelog-ver">${e.version}<span class="changelog-date">${new Date(e.date + 'T00:00:00').toLocaleDateString()}</span></div>
          <ul>${changesFor(e, lang).map(c => `<li>${c}</li>`).join('')}</ul>
        </div>`).join('')}
      </div>
      <button class="import-dialog-btn primary" id="changelogCloseBtn" type="button">${t('upd.close')}</button>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if(e.target === overlay) overlay.remove(); });
  overlay.querySelector('#changelogCloseBtn').addEventListener('click', () => overlay.remove());
}
