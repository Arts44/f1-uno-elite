/* ══════════════════════════════════════════════════════════
   INVITATION À LAISSER UN AVIS

   Le problème qu'elle résout : le formulaire d'avis existe depuis des
   versions, et personne ne pense à s'en servir. Une app qui va être
   partagée a besoin de retours d'utilisateurs réels, et un formulaire
   qu'il faut aller chercher n'en produit pas.

   CE QUI REND CETTE INVITATION ACCEPTABLE — et c'est un contrat, pas
   une intention :

     · elle ne s'adresse QU'À qui n'a jamais envoyé d'avis. Le premier
       envoi l'éteint définitivement ;
     · DEUX affichages maximum sur toute la vie de l'app ;
     · « Non merci » vaut « plus jamais » — la seconde n'arrive pas.
       Seule une fermeture passive laisse la porte ouverte ;
     · six semaines entre les deux, comptées depuis le REFUS, pas
       depuis l'affichage ;
     · une seule par session, même ignorée plusieurs fois ;
     · jamais pendant une action, jamais pendant le tutoriel, jamais en
       mode spectateur.

   POURQUOI UN MODULE À PART. Le déclencheur vit dans badges.js, le
   formulaire dans feedback.js, l'état dans le stockage : ce fichier est
   le seul endroit où les trois se rencontrent. L'y mettre évite d'ajouter
   à badges.js — qui est précisément le module qu'on s'apprête à scinder.

   PAS DE CYCLE D'IMPORT, et c'est vérifié par un test : ce module ne
   connaît NI stats.js (qui importe badges.js, lequel importe celui-ci),
   NI le catalogue de cartes. Ses deux signaux d'usage viennent d'une
   seule source déjà écrite — l'historique.
   ══════════════════════════════════════════════════════════ */
import { log } from './logger.js';
import { t } from './i18n.js';
import { icon } from './icons.js';
import { deniedForViewer } from './session.js';
import { getHistory } from './history.js';
import { openFeedbackForm } from './feedback.js';

/* ── L'état, en UNE clé d'appareil ───────────────────────────────
   Globale, pas par saison, et c'est un choix argumenté : l'invitation
   concerne la PERSONNE, pas la collection. Quelqu'un qui bascule en
   2026 est le même qui a dit « non merci » en 2025 ; une clé par saison
   lui reposerait la question et violerait la règle des deux fois.
   Le feedback lui-même n'est pas saisonnier — une ligne de la table
   `feedback` ne porte pas d'année.

   { n: affichages, t: horodatage du dernier refus passif, off: éteinte } */
export const REVIEW_KEY = 'f1uno_review';
export const MAX_INVITES = 2;
export const DELAI_MS = 42 * 24 * 3600 * 1000;   // six semaines
export const MIN_JOURS = 3;
export const MIN_CARTES = 20;

export function reviewState(){
  try {
    const s = JSON.parse(localStorage.getItem(REVIEW_KEY) || '{}');
    return {
      n: Number.isFinite(s.n) && s.n > 0 ? s.n : 0,
      t: Number.isFinite(s.t) && s.t > 0 ? s.t : 0,
      off: !!s.off,
    };
  } catch(e){ return { n: 0, t: 0, off: false }; }
}

function saveReviewState(s){
  try { localStorage.setItem(REVIEW_KEY, JSON.stringify(s)); }
  catch(e){ /* quota, navigation privée : l'invitation ne doit rien casser */ }
}

/** Éteint l'invitation pour toujours. Appelé par « Non merci » ET par
    le premier envoi réussi d'un avis (feedback.js). */
export function reviewOff(){
  const s = reviewState();
  saveReviewState({ ...s, off: true });
  log('review: invitation éteinte');
}

/* ── Les deux seuils d'usage réel ────────────────────────────────
   Aucun compteur nouveau : les deux se lisent dans ce qui existe.
   Un badge seul ne prouve rien — `first_card` tombe au premier ajout.

   `getHistory()` pose un point par JOUR où la collection a changé :
   sa longueur est donc exactement le nombre de jours d'usage distincts.
   C'est de la donnée déjà écrite, pour un autre besoin, qui répond
   juste à celui-ci. */
export function usageReel(){
  const hist = getHistory();
  const jours = hist.length;
  // Le dernier point porte le nombre de cartes possédées ce jour-là :
  // l'historique répond aux DEUX questions. Compter via CARDS_DB
  // marcherait aussi, mais ajouterait une dépendance au catalogue pour
  // une information déjà écrite ici — et rendrait le module dépendant
  // d'un catalogue chargé, ce qu'il n'a aucune raison d'exiger.
  const dernier = hist[hist.length - 1];
  const cartes = dernier && Number.isFinite(dernier.owned) ? dernier.owned : 0;
  return { jours, cartes, assez: jours >= MIN_JOURS && cartes >= MIN_CARTES };
}

/* ── UNE SEULE par session, même ignorée plusieurs fois ──────────
   Sans ce drapeau, quelqu'un qui change de page trois fois pendant que
   des badges tombent verrait trois invitations et brûlerait ses deux
   affichages en une soirée. La règle des deux fois compte des
   OCCASIONS, pas des rendus. */
let _vueCetteSession = false;
export function _resetSession(){ _vueCetteSession = false; }   // tests

/* Une bande déjà à l'écran interdit la nôtre. Trouvé en le regardant :
   le bandeau « Application mise à jour » occupe la MÊME zone, et les
   deux empilés donnaient une pile de notifications illisible où le
   bouton « Donner mon avis » passait sous le bandeau.

   ⚠️ LE TUTORIEL COMPTE AUSSI, et c'était un OUBLI, pas un arbitrage.
   Le contrat disait « jamais pendant une action, un tutoriel ou un
   écran de déverrouillage » ; les deux premiers cas étaient couverts,
   le tutoriel non. Le chemin était pourtant complet : la visite guidée
   ajoute des cartes → des badges tombent → la file de toasts se vide →
   badge-toasts.js appelle maybeInviteAfterCelebration(). La bande
   s'affichait par-dessus la visite.

   Ce que ça coûtait : `tutorialKeys()` restaure `f1uno_review`, donc le
   COMPTEUR revenait — mais l'invitation avait été VUE, une des deux
   d'une vie, dépensée sur un écran de démonstration.

   Important : ce refus ne consomme PAS la session. Ni un bandeau de
   mise à jour ni un tutoriel ne sont un refus de l'utilisateur — la
   prochaine célébration reposera la question. */
function _zoneOccupee(){
  const b = document.getElementById('updateBanner');
  if(b) return true;
  const inst = document.querySelector('.install-banner');
  if(inst) return true;
  return !!document.querySelector('.tut-overlay');
}

export function peutInviter(maintenant = Date.now()){
  if(deniedForViewer()) return false;          // le spectateur ne poste rien
  if(_zoneOccupee()) return false;
  if(_vueCetteSession) return false;
  const s = reviewState();
  if(s.off) return false;                      // avis envoyé, ou « non merci »
  if(s.n >= MAX_INVITES) return false;
  if(s.n > 0 && maintenant - s.t < DELAI_MS) return false;
  return usageReel().assez;
}

/* ── Le rendu ────────────────────────────────────────────────────
   Grammaire du toast de badge : même position, même carte, même
   ombre. Elle se pose là où la célébration vient de disparaître.
   Rien n'est bloquant : la bande se ferme, l'app continue dessous. */
function _fermer(el, passif){
  el.classList.remove('show');
  setTimeout(() => el.remove(), 400);
  if(passif){
    const s = reviewState();
    saveReviewState({ ...s, n: s.n + 1, t: Date.now() });
    log('review: fermeture passive, affichage', s.n + 1, 'sur', MAX_INVITES);
  }
}

export function showReviewInvite(){
  if(document.getElementById('reviewInvite')) return;
  _vueCetteSession = true;

  const el = document.createElement('div');
  el.id = 'reviewInvite';
  el.className = 'rv-invite';
  el.setAttribute('role', 'region');
  el.setAttribute('aria-label', t('rv.kicker'));
  el.innerHTML = `
    <div class="rv-ic" aria-hidden="true">${icon('message')}</div>
    <div class="rv-body">
      <div class="rv-k">${t('rv.kicker')}</div>
      <div class="rv-t">${t('rv.text')}</div>
      <div class="rv-acts">
        <button type="button" class="rv-btn primary" id="rvGive">${t('rv.give')}</button>
        <button type="button" class="rv-btn" id="rvLater">${t('rv.later')}</button>
        <button type="button" class="rv-btn" id="rvNo">${t('rv.no')}</button>
      </div>
    </div>
    <button type="button" class="rv-x" id="rvClose" aria-label="${t('rv.close')}">${icon('x')}</button>`;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('show'), 20);   // pas rAF : onglet en arrière-plan

  // « Donner mon avis » n'est PAS une fermeture passive comptée à part :
  // on l'incrémente aussi, parce que quelqu'un qui ouvre le formulaire
  // sans envoyer ne doit pas être relancé la semaine suivante.
  el.querySelector('#rvGive').onclick = () => {
    _fermer(el, true);
    openFeedbackForm();
  };
  el.querySelector('#rvLater').onclick = () => _fermer(el, true);
  el.querySelector('#rvClose').onclick = () => _fermer(el, true);
  el.querySelector('#rvNo').onclick = () => { _fermer(el, false); reviewOff(); };
  log('review: invitation affichée');
}

/** Point d'entrée unique, appelé quand la file de toasts de badge se
    vide — c'est-à-dire quand la célébration retombe. */
export function maybeInviteAfterCelebration(){
  try {
    if(peutInviter()) showReviewInvite();
  } catch(e){ log('review: invitation impossible', e); }
}
