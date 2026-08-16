/* ══════════════════════════════════════════════════════════
   INVITATION À LAISSER UN AVIS — le CONTRAT, pas le rendu

   Une invitation à donner son avis est la fonctionnalité la plus facile
   à rendre insupportable : il suffit qu'elle revienne. Les règles qui
   l'encadrent ne sont donc pas des préférences, ce sont des promesses
   faites à l'utilisateur — et une promesse non testée est une intention.

   Ce fichier teste le contrat :
     · deux affichages maximum sur toute la vie de l'app ;
     · « Non merci » vaut « plus jamais » ;
     · un avis envoyé l'éteint définitivement ;
     · six semaines entre les deux, comptées depuis le REFUS ;
     · une seule par session, même ignorée plusieurs fois ;
     · jamais en mode spectateur ;
     · pas avant un usage réel (3 jours distincts, 20 cartes).
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetStorage } from './_setup.js';
import { installDom, resetDom } from './_dom.js';

installDom();
const rv = await import('../app/review-invite.js');
const { setViewer } = await import('../app/session.js');

const JOUR = 24 * 3600 * 1000;

/** Fabrique un usage réel : n jours d'historique, m cartes possédées. */
function usage(jours, cartes){
  const hist = [];
  for(let i = 0; i < jours; i++) hist.push({ date: `2026-08-${String(i + 1).padStart(2, '0')}`, owned: cartes });
  localStorage.setItem('f1uno_history_2025', JSON.stringify(hist));
  const owned = {};
  for(let i = 1; i <= cartes; i++) owned[String(i).padStart(3, '0')] = { blue: { owned: true, qty: 1 } };
  localStorage.setItem('f1uno_owned_2025', JSON.stringify(owned));
}

beforeEach(() => {
  resetStorage();
  resetDom();
  setViewer(false);
  rv._resetSession();
});

describe('les seuils d’usage réel', () => {
  test('un usage insuffisant n’invite pas', () => {
    usage(2, 40);
    assert.equal(rv.peutInviter(), false, '2 jours : trop tôt');
    usage(5, 10);
    assert.equal(rv.peutInviter(), false, '10 cartes : trop peu');
  });

  test('les deux seuils atteints ouvrent la porte', () => {
    usage(3, 20);
    assert.equal(rv.peutInviter(), true);
  });

  test('un badge seul ne suffirait pas — c’est le point des seuils', () => {
    // `first_card` tombe au PREMIER ajout : sans seuil, l'invitation
    // partirait dans les secondes suivant l'installation.
    usage(1, 1);
    assert.equal(rv.peutInviter(), false);
  });
});

describe('le contrat des deux affichages', () => {
  test('après DEUX fermetures passives, plus jamais', () => {
    usage(3, 20);
    localStorage.setItem('f1uno_review', JSON.stringify({ n: 2, t: 1000, off: false }));
    assert.equal(rv.peutInviter(Date.now() + 10 * 365 * JOUR), false,
      'dix ans plus tard, toujours non : DEUX est un maximum de vie, pas une cadence');
  });

  test('« Non merci » vaut plus jamais, dès la première', () => {
    usage(3, 20);
    rv.reviewOff();
    assert.equal(rv.peutInviter(Date.now() + 10 * 365 * JOUR), false);
    assert.equal(rv.reviewState().off, true);
  });

  test('un avis envoyé éteint l’invitation', () => {
    // reviewOff() est ce que feedback.js appelle sur un 201.
    usage(3, 20);
    localStorage.setItem('f1uno_review', JSON.stringify({ n: 1, t: 1000, off: false }));
    rv.reviewOff();
    assert.equal(rv.peutInviter(Date.now() + 99 * JOUR), false);
  });
});

describe('le délai part du REFUS, pas de l’affichage', () => {
  test('avant six semaines, la seconde n’arrive pas', () => {
    usage(3, 20);
    const refus = Date.now();
    localStorage.setItem('f1uno_review', JSON.stringify({ n: 1, t: refus, off: false }));
    assert.equal(rv.peutInviter(refus + 41 * JOUR), false, '41 jours : trop tôt');
  });

  test('après six semaines, la seconde peut venir', () => {
    usage(3, 20);
    const refus = Date.now();
    localStorage.setItem('f1uno_review', JSON.stringify({ n: 1, t: refus, off: false }));
    assert.equal(rv.peutInviter(refus + 43 * JOUR), true);
  });

  test('l’horodatage stocké est celui du refus, pas de l’ouverture', () => {
    // Nuance demandée explicitement : si le compteur partait de
    // l'affichage, quelqu'un qui laisse la bande à l'écran une heure
    // avant de la fermer verrait la seconde une heure plus tôt.
    usage(3, 20);
    const avant = Date.now();
    rv.showReviewInvite();
    assert.equal(rv.reviewState().t, 0, 'rien n’est écrit à l’affichage');
    document.getElementById('rvLater').onclick();
    const apres = rv.reviewState();
    assert.ok(apres.t >= avant, 'l’horodatage est posé à la fermeture');
    assert.equal(apres.n, 1);
  });
});

describe('une seule par session', () => {
  test('ignorée trois fois dans la même session = UNE invitation', () => {
    // Sans ce garde-fou, quelqu'un qui change de page pendant que des
    // badges tombent brûlerait ses deux affichages en une soirée.
    usage(3, 20);
    rv.showReviewInvite();
    document.getElementById('reviewInvite').remove();
    assert.equal(rv.peutInviter(), false, 'la session est déjà consommée');
    rv.showReviewInvite();
    rv.showReviewInvite();
    assert.equal(rv.reviewState().n, 0, 'aucun affichage compté sans fermeture');
  });

  test('deux appels ne créent pas deux bandes', () => {
    usage(3, 20);
    rv.showReviewInvite();
    rv.showReviewInvite();
    assert.equal(document.querySelectorAll('.rv-invite').length, 1);
  });
});

describe('les exclusions', () => {
  test('le mode spectateur ne voit jamais l’invitation', () => {
    usage(3, 20);
    setViewer(true);
    assert.equal(rv.peutInviter(), false,
      'un spectateur ne peut pas poster : lui proposer serait une impasse');
  });

  test('un bandeau déjà à l’écran repousse l’invitation, SANS consommer la session', () => {
    /* Trouvé en regardant le rendu : le bandeau « Application mise à
       jour » occupe la même zone, et les deux empilés cachaient le
       bouton « Donner mon avis ».

       Le « sans consommer la session » est le point : un bandeau de
       mise à jour n'est pas un refus de l'utilisateur. Si on brûlait la
       session, une mise à jour lui coûterait une de ses deux
       invitations sans qu'il ait rien vu. */
    usage(3, 20);
    const b = document.createElement('div');
    b.id = 'updateBanner';
    document.body.appendChild(b);
    assert.equal(rv.peutInviter(), false);
    b.remove();
    assert.equal(rv.peutInviter(), true, 'le bandeau parti, la porte se rouvre');
  });

  test('le TUTORIEL repousse l’invitation, SANS consommer la session', () => {
    /* Le chemin est complet et il a existé en production : le tutoriel
       ajoute des cartes → des badges tombent → la file de toasts se
       vide → badge-toasts.js appelle maybeInviteAfterCelebration(). La
       bande pouvait donc s'afficher PAR-DESSUS la visite guidée.

       Ce que ça coûte : tutorialKeys() restaure bien `f1uno_review`,
       donc le COMPTEUR revient. Mais l'invitation a été VUE — une des
       deux d'une vie, dépensée sur un écran de démonstration — et
       `_vueCetteSession` reste vrai en mémoire, ce que la restauration
       de localStorage ne rattrape pas.

       Comme pour le bandeau de mise à jour, le refus ne consomme PAS la
       session : un tutoriel n'est pas un refus de l'utilisateur. */
    usage(3, 20);
    const ov = document.createElement('div');
    ov.className = 'tut-overlay';
    document.body.appendChild(ov);
    assert.equal(rv.peutInviter(), false);
    ov.remove();
    assert.equal(rv.peutInviter(), true, 'le tutoriel fini, la porte se rouvre');
  });

  test('maybeInviteAfterCelebration n’affiche rien quand les conditions manquent', () => {
    usage(1, 1);
    rv.maybeInviteAfterCelebration();
    assert.equal(document.getElementById('reviewInvite'), null);
  });

  test('un état illisible ne bloque ni ne déclenche rien d’absurde', () => {
    usage(3, 20);
    localStorage.setItem('f1uno_review', 'pas du json');
    assert.deepEqual(rv.reviewState(), { n: 0, t: 0, off: false });
    assert.equal(rv.peutInviter(), true, 'on repart de zéro, sans lever');
  });
});

describe('les trois actions', () => {
  test('« Non merci » éteint, « Plus tard » compte, la croix compte', () => {
    usage(3, 20);
    rv.showReviewInvite();
    document.getElementById('rvNo').onclick();
    assert.equal(rv.reviewState().off, true);
    assert.equal(rv.reviewState().n, 0, 'un refus explicite n’est pas un report');

    resetStorage(); rv._resetSession(); usage(3, 20);
    rv.showReviewInvite();
    document.getElementById('rvClose').onclick();
    assert.equal(rv.reviewState().n, 1);
    assert.equal(rv.reviewState().off, false, 'une croix laisse la porte ouverte');
  });
});
