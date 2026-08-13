/* ══════════════════════════════════════════════════════════
   BADGES · CÉLÉBRATION ET TOASTS — la seule partie à minuteurs

   POURQUOI CE MODULE EXISTE. Trois raisons, et aucune n'est la taille :

   1. C'est le SEUL endroit du domaine badges qui manipule le temps —
      files d'attente, `setTimeout`, animation de particules. Le reste
      est synchrone et déterministe.

   2. `checkNewAutoBadges()` est appelé par `updateStats()`, donc à
      CHAQUE écriture de collection : un chemin chaud. Il n'a aucune
      raison de traîner le rendu de la page Badges avec lui.

   3. C'est le point d'accroche de l'invitation à laisser un avis
      (review-invite.js), qui attend précisément que la file se vide.

   LA FILE N'EST PAS UNE COQUETTERIE : elle garantit qu'un toast de
   badge ne se batte jamais avec le toast standard (« Annuler… »). C'est
   elle qui donne à l'invitation d'avis ses trois garanties gratuites —
   jamais par-dessus un autre toast, jamais pendant l'animation, jamais
   avant que le badge soit persisté.

   `setTimeout` ET PAS `requestAnimationFrame` pour l'entrée du toast :
   rAF ne tourne pas dans un onglet en arrière-plan, le toast ne serait
   jamais monté à l'écran au retour.
   ══════════════════════════════════════════════════════════ */
import { t, getLang } from './i18n.js';
import { AUTO_BADGES, badgeTr } from './data.js';
import { switchView } from './render.js';
import { autoBadgeUnlocked, saveManualBadges } from './badges-store.js';
import { evaluateBadgeCondition } from './badge-rules.js';


export function _celebrate(tile){
  if(!tile) return;
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  tile.classList.add('just-unlocked');
  const particles = document.createElement('div');
  particles.className = 'badge-particles';
  const colors = ['var(--red)','var(--orange)','var(--gold)','var(--green)','var(--blue)','var(--purple)'];
  for(let i=0;i<12;i++){
    const p = document.createElement('div');
    p.className = 'badge-particle';
    const angle = (Math.PI*2/12)*i;
    // Math.random() DÉCORATIF : distance de projection d'une particule
    // de célébration (34→60 px) quand un badge se débloque. Aucune
    // valeur de sécurité n'en dépend — la seule aléa cryptographique du
    // dépôt est crypto.getRandomValues() dans secure-store.js (sel
    // PBKDF2, IV AES-GCM). Un analyseur qui exige un CSPRNG ici confond
    // « aléatoire » et « imprévisible ».
    const dist = 34 + Math.random()*26;
    p.style.cssText = `left:50%;top:26px;background:${colors[i%colors.length]};--px:${Math.cos(angle)*dist}px;--py:${Math.sin(angle)*dist}px;animation-delay:${i*0.02}s;`;
    particles.appendChild(p);
  }
  tile.appendChild(particles);
  setTimeout(()=>{ tile.classList.remove('just-unlocked'); particles.remove(); }, 1200);
}

/* ══════════════════════════════════════════════════════════
   DÉBLOCAGE EN COURS D'USAGE — détection + toast badge.
   Appelé par updateStats() après chaque écriture de collection.
   Groupé si plusieurs tombent d'un coup ; file d'attente pour ne
   jamais se battre avec le toast standard (Annuler) : on attend
   qu'il soit parti. Haptique courte, silencieuse là où vibrate
   n'existe pas (iOS).
   ══════════════════════════════════════════════════════════ */
export function groupBadgeToastLabel(names, tf = t){
  if(names.length === 1) return names[0];
  return tf('b.toast_many', { n: names.length }) + ' — ' + names.slice(0, 3).join(', ') + (names.length > 3 ? '…' : '');
}

const _toastQueue = [];
let _toastShowing = false;
export function queueBadgeToasts(badges, opts = {}){
  if(!badges.length) return;
  _toastQueue.push({ badges, navigate: opts.navigate !== false });
  _drainToastQueue();
}
function _drainToastQueue(){
  if(_toastShowing || !_toastQueue.length) return;
  // le toast standard (Annuler…) est prioritaire : repasser après lui
  const std = document.getElementById('toast');
  if(std && std.classList.contains('show')){ setTimeout(_drainToastQueue, 1200); return; }
  _toastShowing = true;
  const { badges, navigate } = _toastQueue.shift();
  let el = document.getElementById('badgeToast');
  if(!el){
    el = document.createElement('div');
    el.id = 'badgeToast';
    el.className = 'badge-toast';
    document.body.appendChild(el);
  }
  const names = badges.map(b => badgeTr(b).name || b.name);
  el.innerHTML = `<div class="bgt-med">${badges[0].emoji}</div>
    <div><div class="bgt-k">${badges.length > 1 ? t('b.toast_many', { n: badges.length }) : t('b.toast_one')}</div>
    <div class="bgt-n">${badges.length > 1 ? names.slice(0, 3).join(', ') + (names.length > 3 ? '…' : '') : names[0]}</div></div>`;
  el.onclick = navigate ? () => { el.classList.remove('show'); switchView('badges'); } : () => el.classList.remove('show');
  // setTimeout, PAS requestAnimationFrame : rAF ne tourne pas onglet en
  // arrière-plan — le toast ne serait jamais monté à l'écran au retour.
  setTimeout(() => el.classList.add('show'), 20);
  try { if(navigator.vibrate) navigator.vibrate(30); } catch(e){ /* iOS: pas d'API */ }
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => {
      _toastShowing = false;
      _drainToastQueue();
      // LA FILE EST VIDE = la célébration vient de retomber. C'est le
      // seul moment où l'invitation à laisser un avis a le droit
      // d'apparaître : jamais pendant une action, jamais par-dessus un
      // autre toast — cette file garantit déjà les deux.
      // Import différé : badges.js ne doit pas charger l'invitation au
      // démarrage, elle ne sert qu'ici et rarement.
      if(!_toastQueue.length){
        import('./review-invite.js')
          .then(m => m.maybeInviteAfterCelebration())
          .catch(() => {});
      }
    }, 400);
  }, 2800);
}

// Détecte les transitions verrouillé → débloqué depuis la dernière
// écriture. C'est un AJOUT : la persistance passe toujours par
// autoBadgeUnlocked + saveManualBadges, comme avant.
export function checkNewAutoBadges(){
  const fresh = [];
  AUTO_BADGES.forEach(b => {
    if(autoBadgeUnlocked[b.id]) return;
    const p = evaluateBadgeCondition(b);
    if(p.cur >= p.max){
      autoBadgeUnlocked[b.id] = Date.now();
      fresh.push(b);
    }
  });
  if(fresh.length){
    saveManualBadges();
    queueBadgeToasts(fresh);
    const tile = document.querySelector(`.badge-tile[data-badge="${fresh[0].id}"]`);
    if(tile) _celebrate(tile);
  }
}