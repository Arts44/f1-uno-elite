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
