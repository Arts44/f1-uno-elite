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
import { t, tEsc } from './i18n.js';
import { AUTO_BADGES, badgeTr, CARDS_DB, CARD_TYPES, RARITIES, RARITY_ORDER, RARITY_KEYS, DRIVER_NUMBERS, sortTypesCanonical } from './data.js';
import { switchView } from './render.js';
import { autoBadgeUnlocked, saveManualBadges } from './badges-store.js';
import { evaluateBadgeCondition } from './badge-rules.js';
import { getTypeData, cardRarity, cardSetComplete, variantRarity } from './storage.js';


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
let _celeOpen = false;   // la célébration de palier tient la file (voir plus bas)
export function queueBadgeToasts(badges, opts = {}){
  if(!badges.length) return;
  _toastQueue.push({ badges, navigate: opts.navigate !== false });
  _drainToastQueue();
}
function _drainToastQueue(){
  if(_toastShowing || !_toastQueue.length) return;
  // La célébration de palier TIENT la file : les badges tombés dans le
  // même geste s'annoncent dedans (« + N badges »), puis se déroulent en
  // toasts après sa fermeture — jamais par-dessus. C'est ce qui garde
  // les trois garanties de l'invitation d'avis (file vide = tout est
  // retombé, célébration comprise).
  if(_celeOpen){ setTimeout(_drainToastQueue, 800); return; }
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

/* ══════════════════════════════════════════════════════════
   LA CÉLÉBRATION DE PALIER (1.67.0) — ce qui se fête n'est pas le
   badge, c'est la CARTE qui change de matière. Elle vit ICI, avec la
   file, parce qu'elle en fait partie : elle la tient ouverte
   (_celeOpen) et annonce ce qui suit (« + N badges »).

   SANS MOUVEMENT, par construction : le tampon est déjà posé, aucune
   animation d'entrée, aucun confetti — prefers-reduced-motion n'a rien
   à neutraliser (vérifié animationName === 'none', pas affirmé). Seule
   la matière tv-* du nouveau palier vit sa vie habituelle de tuile.

   QUAND ELLE NE PART PAS — les trois cas de la revue, dans l'ordre :
   1. TUTORIEL : un plein écran par-dessus la visite guidée serait le
      défaut du n°17 ; garde explicite sur .tut-overlay, testé.
   2. IMPORT / pull cloud : structurellement impossible — les DEUX seuls
      appelants sont les gestes (changeMoQty, quickAddType, render.js),
      jamais setTypeData ; restaurer une sauvegarde n'y passe pas. Un
      test compte les appelants. (Le journal du chantier 5, accroché à
      setTypeData, aura LUI besoin d'un drapeau de suspension — pas la
      célébration : le point d'accroche fait le garde.)
   3. SPECTATEUR : les deux gestes sont dans VIEWER_BLOCKED (app.js).
   Et JAMAIS pour un simple +1 : seuil = montée de palier réelle
   (RARITY_ORDER strictement croissant), le set complété n'étant qu'une
   montée comme une autre (cardRarity porte le bonus).
   ══════════════════════════════════════════════════════════ */
export function showTierCelebration(card, beforeKey, afterKey){
  if(document.querySelector('.tut-overlay')) return false;   // cas 1 — jamais sur le tour
  if(document.getElementById('tierCele')) return false;      // une seule à la fois
  const rar = RARITIES[afterKey] || {};
  const setDone = cardSetComplete(card.id);
  const isEternal = afterKey === 'eternal';
  // Le type qui a fait monter : le meilleur possédé au nouveau palier
  // (ordre canonique). Pour un set complété, c'est le set qui monte.
  const afterIdx = RARITY_ORDER[afterKey] ?? 0;
  const risers = sortTypesCanonical(card.types.filter(ty => {
    const d = getTypeData(card.id, ty);
    return d.owned && (d.qty||0) > 0 && (RARITY_ORDER[variantRarity(card, ty)] ?? 0) >= afterIdx;
  }));
  // Un type possédé au nouveau palier = c'est lui qui a fait monter ;
  // sinon la montée vient du bonus set complet (seule autre voie).
  const kind = risers.length ? 'type' : 'set';
  const tyLabel = risers.length ? (() => { const k = 'type.' + risers[0], l = t(k); return l === k ? (CARD_TYPES[risers[0]]?.label || risers[0]) : l; })() : '';
  const atTier = CARDS_DB.filter(c => cardRarity(c) === afterKey).length;
  // DRIVER_NUMBERS : { n, cls } — c'est `n` qu'on affiche, pas l'objet.
  const num = DRIVER_NUMBERS[card.name]?.n ?? `#${card.id}`;
  const stars = isEternal ? '✦'.repeat(rar.stars || 7) : '★'.repeat(rar.stars || 1);

  _celeOpen = true;
  const el = document.createElement('div');
  el.id = 'tierCele';
  el.className = 'tier-cele';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', t(kind === 'set' ? 'cele.kicker_set' : 'cele.kicker'));
  el.innerHTML = `
    <div class="tier-card">
      <div class="tier-stamp">${t(kind === 'set' ? 'cele.kicker_set' : 'cele.kicker')}</div>
      <div class="modal-visual ${risers.length ? CARD_TYPES[risers[0]].css : ''} tier-visual"${isEternal ? ' data-eternal' : ''}><span class="tv-num">${num}</span></div>
      <div class="tier-id">#${card.id} · ${card.category ? card.category.toUpperCase() : ''}</div>
      <div class="tier-name"></div>
      <div class="tier-rar">
        <span class="mtag mtag-rarity" style="color:${rar.color};background:color-mix(in srgb,${rar.color} 11%,transparent);">${stars} ${t('rar.' + afterKey) || rar.label}</span>
        <span class="mo-tier">${tEsc('mo.tier', { n: afterIdx + 1, max: RARITY_KEYS.length })}</span>
      </div>
      <div class="tier-line">${kind === 'set'
        ? tEsc('cele.line_set', { e: card.types.length })
        : tEsc('cele.line_type', { ty: tyLabel })}
        ${tEsc('cele.count', { n: atTier, r: t('rar.' + afterKey) || rar.label })}</div>
      <div class="tier-queue" id="tcQueue" hidden></div>
      <div class="tier-actions">
        <button class="setv-btn" id="tcSee" type="button" hidden>${t('cele.see')}</button>
        <button class="setv-btn primary" id="tcGo" type="button">${t('cele.continue')}</button>
      </div>
    </div>`;
  el.querySelector('.tier-name').textContent = card.name;   // donnée, jamais en gabarit
  document.body.appendChild(el);

  const close = () => {
    _celeOpen = false;
    el.remove();
    document.removeEventListener('keydown', onKey);
    _drainToastQueue();   // les badges retenus se déroulent maintenant
  };
  const onKey = e => {
    if(e.key === 'Escape'){ close(); return; }
    if(e.key === 'Tab'){                       // focus piégé entre les deux boutons
      const btns = [...el.querySelectorAll('button:not([hidden])')];
      if(!btns.length) return;
      const i = btns.indexOf(document.activeElement);
      e.preventDefault();
      btns[(i + (e.shiftKey ? -1 : 1) + btns.length) % btns.length].focus();
    }
  };
  document.addEventListener('keydown', onKey);
  el.querySelector('#tcGo').addEventListener('click', close);
  el.querySelector('#tcSee').addEventListener('click', () => { close(); switchView('badges'); });
  el.querySelector('#tcGo').focus();
  return true;
}

/* Appelé APRÈS updateStats() par les deux gestes : les badges du même
   geste sont alors dans la file (retenue par _celeOpen) — la ligne
   « + N badges » peut dire la vérité. */
export function refreshTierCeleBadges(){
  const el = document.getElementById('tierCele');
  if(!el) return;
  const n = _toastQueue.reduce((s, q) => s + q.badges.length, 0);
  const q = el.querySelector('#tcQueue'), see = el.querySelector('#tcSee');
  if(n > 0){
    q.hidden = false; q.textContent = t('cele.queue', { n });
    see.hidden = false;
  }
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