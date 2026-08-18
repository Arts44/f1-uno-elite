/* ══════════════════════════════════════════════════════════
   LE BON MOMENT — une seule règle pour toutes les surcouches.

   POURQUOI CE MODULE DE VINGT LIGNES EXISTE. Trois fois de suite, un
   élément a été construit AU BON MOMENT et empilé AU MAUVAIS :
     · la fiche d'échange reçue, derrière la visite guidée (1.74.0) ;
     · le bandeau de mise à jour, derrière l'écran de première visite
       — mesuré ATTEIGNABLE 0 fois sur 6 (1.76.0) ;
   et à chaque fois le symptôme était le même : présent dans le DOM,
   inatteignable pour un doigt. La règle ne pouvait pas rester dans le
   module de l'un des deux ; dupliquée, elle aurait divergé.

   CE QU'ELLE DIT : trois écrans ont priorité absolue, parce qu'ils
   demandent une action ou racontent une séquence qu'une surcouche
   casserait — l'écran de première visite (langue, PIN, mise en route),
   la visite guidée, et la célébration de palier.

   RIEN D'AUTRE NE DOIT ENTRER ICI, comme season.js : ce module vaut
   par ce qu'il ignore. Aucun import, donc feuille du graphe, donc
   utilisable par n'importe qui sans rien traîner.
   ══════════════════════════════════════════════════════════ */

// L'écran de première visite est-il devant ? (display, pas seulement
// présence : il reste dans le DOM une fois masqué.)
export function miseEnRouteEnCours(){
  const login = document.getElementById('login-screen');
  return !!(login && getComputedStyle(login).display !== 'none');
}

export function visiteGuideeEnCours(){
  return !!document.querySelector('.tut-overlay');
}

export function celebrationEnCours(){
  return !!document.getElementById('tierCele');
}

/* Peut-on poser une surcouche MAINTENANT ? Les appelants qui ont
   quelque chose à conserver (fiche reçue, bandeau de mise à jour)
   doivent ENREGISTRER quoi qu'il arrive et ne différer que
   l'affichage — jamais l'inverse. */
export function peutAfficherSurcouche(){
  return !miseEnRouteEnCours() && !visiteGuideeEnCours() && !celebrationEnCours();
}

/* Rappelle `fn` dès que le moment devient bon, au plus une fois.
   `sonde` : intervalle de vérification ; `limite` : abandon (une mise
   en route qui n'aboutit pas ne doit pas laisser une minuterie
   tourner indéfiniment). setInterval et pas MutationObserver : trois
   conditions sur trois éléments distincts dont deux n'existent pas
   encore au moment de l'appel. */
export function quandLeMomentEstBon(fn, { sonde = 700, limite = 120000 } = {}){
  if(peutAfficherSurcouche()){ fn(); return null; }
  const t0 = Date.now();
  const id = setInterval(() => {
    if(peutAfficherSurcouche()){ clearInterval(id); fn(); }
    else if(Date.now() - t0 > limite) clearInterval(id);
  }, sonde);
  return id;
}

/* ══════════════════════════════════════════════════════════
   L'ARBITRAGE DE LA ZONE BASSE (1.77.0)

   POURQUOI ICI. La règle existait déjà, juste, et au mauvais endroit :
   `_zoneOccupee()` dans review-invite.js. Elle était à SENS UNIQUE —
   l'invitation d'avis cédait à tout le monde, personne ne lui cédait —
   et une surface sur sept l'appliquait. Mesuré : superposition totale
   des deux bandeaux (n°24), 21 à 47 px entre bandeau et badge-toast
   (le chevauchement vaut `hauteur du toast − 37 px`), 9 px entre
   installation et mise à jour à 320.

   CE QU'ELLE DEVIENT : bidirectionnelle, avec une FILE. Un prédicat
   sans file n'aurait pas différé, il aurait ANNULÉ — un badge débloqué
   pendant un bandeau ne serait jamais annoncé. On aurait échangé un
   défaut d'affichage contre une perte de message.

   LA PRIORITÉ N'EST PAS L'IMPORTANCE, C'EST LA DURÉE DE VIE. Un
   badge-toast s'efface seul en 2,8 s ; un bandeau attend un geste.
   L'éphémère PRÉEMPTE donc le persistant, qui revient ensuite en tête
   de file — c'est la même exigence que ci-dessus : rien ne se perd.

   Le toast standard (#toast) n'entre PAS dans cet arbitrage : ~30
   appelants, et il répond à un geste de l'utilisateur (annuler, une
   erreur, une confirmation). Le faire attendre derrière un bandeau
   serait une régression. Il partage la GÉOMÉTRIE de la zone, pas son
   arbitrage — c'est toute la distinction.
   ══════════════════════════════════════════════════════════ */

/* LE POINT D'AMARRAGE. Un seul conteneur, un seul `bottom`, dérivé de
   --nav-clear et suivant env(safe-area-inset-bottom). Toute surface du
   bas s'y insère au lieu de `document.body` : la géométrie appartient
   au conteneur, plus aux surfaces. Aucun nouveau fichier précaché —
   ce module tenait déjà la règle du bon moment pour ces mêmes
   surcouches, il tient maintenant leur place. */
export function zoneBasse(){
  return document.getElementById('zoneBasse') || document.body;
}

// Rangs — plus haut passe devant. Décidés, pas dérivés.
export const RANG = { maj: 3, nouveautes: 2, installation: 1, avis: 0, badge: 0 };

let _occupant = null;     // à l'écran
const _file = [];         // en attente, triée par rang décroissant
let _sonde = null;

// Qui occupe la zone ? (null si libre) — remplace `_zoneOccupee()`.
export function zoneOccupee(){
  if(_occupantPerdu()) _occupant = null;
  return _occupant ? _occupant.id : null;
}

export function _resetZone(){         // tests seulement
  _occupant = null; _file.length = 0;
  if(_sonde){ clearInterval(_sonde); _sonde = null; }
}

/* AUTOGUÉRISON. Une entrée dont le nœud a disparu sans passer par
   `libererLaZone` (un `remove()` ailleurs, un test, du code futur)
   bloquerait la zone pour toujours. On ne fait pas confiance au
   registre seul : si l'occupant n'est plus dans le DOM, il n'occupe
   plus rien. `selecteur` est fourni par l'appelant — moment.js ne
   connaît aucun identifiant de surface. */
function _occupantPerdu(){
  return !!(_occupant && _occupant.selecteur && !document.querySelector(_occupant.selecteur));
}

function _placer(e){
  const i = _file.findIndex(x => x.rang < e.rang);
  if(i === -1) _file.push(e); else _file.splice(i, 0, e);
}

function _installer(e){ _occupant = e; e.montrer(); }

function _armerSonde(){
  if(_sonde || !_file.length) return;
  _sonde = quandLeMomentEstBon(() => { _sonde = null; _vider(); });
}

function _vider(){
  if(_occupant || !_file.length) return;
  if(!peutAfficherSurcouche()){ _armerSonde(); return; }
  _installer(_file.shift());
}

/* Demander la zone. `montrer`/`cacher` sont les DEUX faces : une
   entrée évincée doit savoir se reconstruire, sinon la préemption
   perd le message qu'elle prétend préserver.
   Renvoie true si la surface est posée tout de suite. */
export function demanderLaZone({ id, rang = 0, ephemere = false, selecteur = '', montrer, cacher }){
  if(_occupantPerdu()) _occupant = null;
  if(_occupant && _occupant.id === id) return false;   // déjà à l'écran
  if(_file.some(e => e.id === id)) return false;       // déjà en attente
  const e = { id, rang, ephemere, selecteur, montrer, cacher };
  if(!peutAfficherSurcouche()){ _placer(e); _armerSonde(); return false; }
  if(!_occupant){ _installer(e); return true; }
  if(ephemere && !_occupant.ephemere){
    const evince = _occupant;
    evince.cacher();
    _occupant = null;
    _file.unshift(evince);      // retour prioritaire sur tout le reste
    _installer(e);
    return true;
  }
  /* LE RANG ÉVINCE AUSSI, et ce n'est pas un raffinement : sans ça,
     l'ordre décidé ne s'appliquerait JAMAIS. Mesuré sur le bundle —
     `maybeOfferWhatsNew()` part de `initApp()`, le bandeau de mise à
     jour arrive ~600 ms plus tard : « nouveautés » occuperait donc
     toujours la zone en premier, et « mise à jour > nouveautés »
     resterait une intention. L'évincé retourne dans la file À SON
     RANG (et non en tête comme l'interrompu d'un éphémère) : il
     reparaîtra quand la place se libérera. Rien ne se perd. */
  if(!ephemere && !_occupant.ephemere && rang > _occupant.rang){
    const evince = _occupant;
    evince.cacher();
    _occupant = null;
    _placer(evince);
    _installer(e);
    return true;
  }
  _placer(e);
  return false;
}

// Rendre la zone. Sans effet si l'appelant ne l'occupe pas — une
// surface ne libère jamais la place d'une autre.
export function libererLaZone(id){
  if(!_occupant || _occupant.id !== id) return;
  _occupant = null;
  _vider();
}
