/* ══════════════════════════════════════════════════════════
   LA ZONE BASSE (1.77.0) — l'arbitrage, pas la géométrie.

   La géométrie est vérifiée par verify_zone.py (les sept surfaces
   posées ensemble, aux sept langues, chevauchement nul). Ici on teste
   la FILE : qui passe, qui attend, et surtout QUI REVIENT.

   Le contrat qui compte : RIEN NE SE PERD. C'est ce qui a disqualifié
   l'option d'un simple prédicat bidirectionnel — un prédicat sans file
   n'aurait pas différé, il aurait annulé. Un badge débloqué pendant un
   bandeau de mise à jour ne serait jamais annoncé.
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { installDom, resetDom, mount } from './_dom.js';

installDom();
/* `miseEnRouteEnCours()` lit le style calculé de #login-screen : le
   mini-DOM ne fait pas de mise en page (c'est écrit dans son en-tête),
   on lui donne donc le strict minimum — l'écran est devant tant qu'il
   n'est pas explicitement masqué. */
globalThis.getComputedStyle = el => ({ display: (el && el.style && el.style.display) || '' });
import {
  demanderLaZone, libererLaZone, zoneOccupee, _resetZone, RANG, zoneBasse,
} from '../app/moment.js';

// Une surface de démonstration : elle pose et retire un vrai nœud, ce
// qui rend l'autoguérison observable.
function surface(id, opts = {}){
  const sel = `#${id}`;
  const journal = [];
  return {
    journal,
    entree: {
      id, selecteur: sel, rang: opts.rang ?? 0, ephemere: !!opts.ephemere,
      montrer(){
        journal.push('montrer');
        const el = document.createElement('div');
        el.id = id;
        zoneBasse().appendChild(el);
      },
      cacher(){
        journal.push('cacher');
        document.getElementById(id)?.remove();
      },
    },
    get pose(){ return !!document.getElementById(id); },
  };
}

beforeEach(() => {
  resetDom();
  mount('<div id="zoneBasse"></div>');
  _resetZone();
});

describe('la zone n’accueille qu’une surface à la fois', () => {
  test('la première passe, la seconde attend', () => {
    const a = surface('a'), b = surface('b');
    assert.equal(demanderLaZone(a.entree), true);
    assert.equal(demanderLaZone(b.entree), false);
    assert.equal(a.pose, true);
    assert.equal(b.pose, false, 'deux surfaces posées = le défaut n°24');
    assert.equal(zoneOccupee(), 'a');
  });

  test('la place rendue, l’attente passe — rien ne se perd', () => {
    const a = surface('a'), b = surface('b');
    demanderLaZone(a.entree);
    demanderLaZone(b.entree);
    libererLaZone('a');
    assert.equal(b.pose, true);
    assert.equal(zoneOccupee(), 'b');
  });

  test('une surface ne libère jamais la place d’une autre', () => {
    const a = surface('a'), b = surface('b');
    demanderLaZone(a.entree);
    demanderLaZone(b.entree);
    libererLaZone('b');                    // b n'occupe pas : sans effet
    assert.equal(zoneOccupee(), 'a');
    assert.equal(b.pose, false);
  });

  test('demander deux fois ne pose pas deux fois', () => {
    const a = surface('a');
    demanderLaZone(a.entree);
    demanderLaZone(a.entree);
    demanderLaZone(a.entree);
    assert.equal(a.journal.filter(x => x === 'montrer').length, 1);
  });
});

describe('l’ordre : mise à jour > nouveautés > installation', () => {
  test('la file sert par rang, pas par ordre d’arrivée', () => {
    const occupant = surface('occ', { rang: 99 });
    const inst = surface('installation', { rang: RANG.installation });
    const nouv = surface('nouveautes', { rang: RANG.nouveautes });
    const maj = surface('maj', { rang: RANG.maj });
    demanderLaZone(occupant.entree);
    demanderLaZone(inst.entree);           // arrivée en premier…
    demanderLaZone(nouv.entree);
    demanderLaZone(maj.entree);            // …mais rang le plus haut
    libererLaZone('occ');
    assert.equal(zoneOccupee(), 'maj');
    libererLaZone('maj');
    assert.equal(zoneOccupee(), 'nouveautes');
    libererLaZone('nouveautes');
    assert.equal(zoneOccupee(), 'installation');
  });

  test('les rangs du dépôt sont bien ceux qui ont été décidés', () => {
    assert.ok(RANG.maj > RANG.nouveautes);
    assert.ok(RANG.nouveautes > RANG.installation);
    assert.ok(RANG.installation > RANG.badge);
  });
});

describe('la préemption — et le RETOUR du préempté', () => {
  test('l’éphémère passe devant le persistant', () => {
    const maj = surface('maj', { rang: RANG.maj });
    const badge = surface('badge', { rang: RANG.badge, ephemere: true });
    demanderLaZone(maj.entree);
    assert.equal(maj.pose, true);
    demanderLaZone(badge.entree);
    assert.equal(badge.pose, true, 'un badge ne doit pas attendre la fermeture d’un bandeau');
    assert.equal(maj.pose, false);
    assert.equal(zoneOccupee(), 'badge');
  });

  /* LE CONTRÔLE QUI COMPTE. Un éphémère qui préempte un persistant et
     ne le rend pas est une PERTE DE MESSAGE — exactement ce qui a fait
     rejeter le prédicat sans file. */
  test('le préempté REVIENT dès que l’éphémère retombe', () => {
    const maj = surface('maj', { rang: RANG.maj });
    const badge = surface('badge', { rang: RANG.badge, ephemere: true });
    demanderLaZone(maj.entree);
    demanderLaZone(badge.entree);
    libererLaZone('badge');
    assert.equal(maj.pose, true, 'le bandeau préempté est perdu');
    assert.equal(zoneOccupee(), 'maj');
    assert.deepEqual(maj.journal, ['montrer', 'cacher', 'montrer']);
  });

  test('le préempté revient AVANT tout ce qui attendait', () => {
    /* NUANCE ENTRE LES DEUX ÉVICTIONS : l'interrompu par un éphémère
       revient EN TÊTE (il n'a pas fini son tour) ; l'évincé par un rang
       supérieur revient à SON rang. Ici `nouveautes` attend depuis le
       début, et `maj` — interrompu par le badge — repasse devant. */
    const maj = surface('maj', { rang: RANG.maj });
    const nouv = surface('nouveautes', { rang: RANG.nouveautes });
    const badge = surface('badge', { ephemere: true });
    demanderLaZone(maj.entree);
    demanderLaZone(nouv.entree);    // en attente derrière maj
    demanderLaZone(badge.entree);   // préempte maj
    assert.equal(zoneOccupee(), 'badge');
    libererLaZone('badge');
    assert.equal(zoneOccupee(), 'maj',
      'ce qui a été interrompu reprend sa place avant qu’on serve la file');
    assert.equal(nouv.pose, false);
  });

  test('un rang supérieur évince un rang inférieur — sinon l’ordre ne s’applique jamais', () => {
    /* En production `maybeOfferWhatsNew()` part de `initApp()` et le
       bandeau de mise à jour arrive ~600 ms plus tard : sans éviction
       par rang, « mise à jour > nouveautés » ne s’appliquerait à aucune
       session réelle. */
    const nouv = surface('nouveautes', { rang: RANG.nouveautes });
    const maj = surface('maj', { rang: RANG.maj });
    demanderLaZone(nouv.entree);
    assert.equal(zoneOccupee(), 'nouveautes');
    demanderLaZone(maj.entree);
    assert.equal(zoneOccupee(), 'maj');
    assert.equal(nouv.pose, false);
  });

  test('l’évincé par rang REVIENT quand la place se libère', () => {
    const nouv = surface('nouveautes', { rang: RANG.nouveautes });
    const maj = surface('maj', { rang: RANG.maj });
    demanderLaZone(nouv.entree);
    demanderLaZone(maj.entree);
    libererLaZone('maj');
    assert.equal(zoneOccupee(), 'nouveautes', 'évincé n’est pas annulé');
    assert.equal(nouv.pose, true);
  });

  test('un rang inférieur n’évince rien', () => {
    const maj = surface('maj', { rang: RANG.maj });
    const inst = surface('installation', { rang: RANG.installation });
    demanderLaZone(maj.entree);
    demanderLaZone(inst.entree);
    assert.equal(zoneOccupee(), 'maj');
    assert.equal(inst.pose, false);
  });

  test('un éphémère ne préempte pas un autre éphémère', () => {
    const b1 = surface('b1', { ephemere: true });
    const b2 = surface('b2', { ephemere: true });
    demanderLaZone(b1.entree);
    demanderLaZone(b2.entree);
    assert.equal(zoneOccupee(), 'b1');
    assert.equal(b2.pose, false);
  });
});

describe('les gardes', () => {
  test('pendant la visite guidée, personne ne se pose', () => {
    const tut = document.createElement('div');
    tut.className = 'tut-overlay';
    document.body.appendChild(tut);
    const a = surface('a');
    assert.equal(demanderLaZone(a.entree), false);
    assert.equal(a.pose, false, 'c’est le défaut que maybeOfferWhatsNew avait');
    assert.equal(zoneOccupee(), null);
  });

  test('la célébration et la mise en route bloquent aussi', () => {
    for(const poser of [
      () => { const c = document.createElement('div'); c.id = 'tierCele'; document.body.appendChild(c); },
      () => { const l = document.createElement('div'); l.id = 'login-screen'; document.body.appendChild(l); },
    ]){
      resetDom();
      mount('<div id="zoneBasse"></div>');
      _resetZone();
      poser();
      const a = surface('a');
      assert.equal(demanderLaZone(a.entree), false);
      assert.equal(a.pose, false);
    }
  });

  /* AUTOGUÉRISON : un nœud retiré ailleurs qu'à travers la file ne doit
     pas geler la zone pour le reste de la session. */
  test('un occupant dont le nœud a disparu n’occupe plus rien', () => {
    const a = surface('a'), b = surface('b');
    demanderLaZone(a.entree);
    document.getElementById('a').remove();        // retrait sauvage
    assert.equal(zoneOccupee(), null);
    assert.equal(demanderLaZone(b.entree), true);
    assert.equal(b.pose, true);
  });

  test('sans sélecteur, aucune autoguérison — on ne devine pas', () => {
    const a = surface('a');
    delete a.entree.selecteur;
    demanderLaZone(a.entree);
    document.getElementById('a').remove();
    assert.equal(zoneOccupee(), 'a', 'le registre reste la source quand rien ne l’infirme');
  });
});

describe('le point d’amarrage', () => {
  test('zoneBasse() rend le conteneur quand il existe', () => {
    assert.equal(zoneBasse().id, 'zoneBasse');
  });

  test('zoneBasse() se replie sur le corps — jamais de surface perdue', () => {
    resetDom();
    assert.equal(zoneBasse(), document.body);
  });
});
