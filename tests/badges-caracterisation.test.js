/* ══════════════════════════════════════════════════════════
   BADGES.JS — TESTS DE CARACTÉRISATION (filet avant découpage)

   CE QUE CES TESTS SONT. Une description du comportement OBSERVABLE de
   badges.js tel qu'il est aujourd'hui, y compris ses bizarreries. Ils ne
   disent pas ce qui SERAIT bien : ils figent ce qui EST, pour que le
   découpage à venir casse un test plutôt que l'application.

   C'est la méthode qui a marché pour cloud.js (1.50.x → 1.54.0) : 61
   tests écrits AVANT, jamais modifiés PENDANT, et c'est ce « jamais
   modifiés » qui constitue la preuve. Un test qu'on ajuste en route ne
   prouve plus rien — il documente le nouveau code, pas la continuité.

   CE QU'ILS COUVRENT EN PRIORITÉ : ce que la couverture actuelle
   n'atteint pas et qui va bouger. Mesuré avant écriture, badges.js est
   à 59,83 % de lignes. Les trous : getBadgeCards (125 lignes, ZÉRO
   test), les titres, le détail dépliable. L'évaluation des conditions,
   les familles, la sélection d'objectif et les dates de déblocage sont
   déjà tenues par badges.test.js, badges-v22 et badges-seuils — on ne
   les redouble pas.

   CE QU'ILS NE COUVRENT PAS, et pourquoi : shareProfileCard() dessine
   sur un canvas. Le vérifier demanderait un canvas complet en Node ; sa
   sortie est une image, pas une valeur. Il sera déplacé tel quel, et
   c'est le seul morceau dont le déplacement ne sera pas prouvé par un
   test — noté ici plutôt que passé sous silence.
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import '../translations.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resetStorage } from './_setup.js';
import { installDom, resetDom, mount } from './_dom.js';

installDom();
const B = await import('../badges.js');
const D = await import('../data.js');
const { setTypeData, txBatch, loadData } = await import('../storage.js');

/* Le catalogue n'est PAS chargé dans le harnais : data.js le remplit au
   démarrage de l'app, depuis des JSON. On l'injecte donc comme le font
   déjà badges-seuils et badges-v3 — sans quoi CARDS_DB vaut [] et tous
   les tests de correspondance passeraient sur une liste vide, ce qui est
   la pire façon de croire un filet posé. */
const lireJson = f => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), 'utf8'));
const meta = lireJson('metadata.json');
const cardsFile = lireJson('cards-2025.json');
D._applyMetadata(meta);
D._applyCards(Array.isArray(cardsFile) ? cardsFile : cardsFile.cards);
D._applyBadges(lireJson('badges.json'));
const { CARDS_DB, AUTO_BADGES, MANUAL_BADGES, CARD_TYPES } = D;

const SEASON = 2025;

/** Possède les n premières cartes sur leur premier type. */
function posseder(n){
  txBatch(() => {
    CARDS_DB.slice(0, n).forEach(c => {
      setTypeData(c.id, c.types[0], 'owned', true);
      setTypeData(c.id, c.types[0], 'qty', 1);
    });
  });
}

/** Possède une carte sur un type précis (variantes foil, promo…). */
function posseder1(cardId, typeId){
  txBatch(() => {
    setTypeData(cardId, typeId, 'owned', true);
    setTypeData(cardId, typeId, 'qty', 1);
  });
}

beforeEach(() => {
  resetStorage();
  // resetStorage() ne vide QUE le localStorage : storage.js garde sa
  // collection en mémoire, et badges.js ses deux tables. Sans ces trois
  // lignes, un test hérite des cartes possédées par le précédent — le
  // piège a déjà coûté deux faux échecs sur les badges (1.59.0).
  loadData();
  resetDom();
  B.setManualBadges({});
  B.setAutoBadgeUnlocked({});
});

/* ══════════════════════════════════════════════════════════
   A · getBadgeCards — 125 lignes, aucun test jusqu'ici

   C'est une TABLE DE CORRESPONDANCE badge → cartes à montrer, écrite
   en cascade de `if`. Elle n'a aucune dépendance au DOM et ne lit que
   la collection : c'est le morceau le plus évidemment déplaçable de
   badges.js, et donc celui qu'il faut figer le plus soigneusement.
   ══════════════════════════════════════════════════════════ */
describe('A · getBadgeCards — la correspondance badge → cartes', () => {
  test('un badge inconnu renvoie une liste VIDE, il ne lève pas', () => {
    assert.deepEqual(B.getBadgeCards('badge_qui_nexiste_pas'), []);
  });

  test('les badges de CATÉGORIE listent toute la catégorie, possédée ou non', () => {
    // Comportement notable : ces badges-là montrent aussi les cartes
    // MANQUANTES (cat:true), parce que la liste sert de check-list.
    const cartes = B.getBadgeCards('pilote_all');
    assert.ok(cartes.length > 0);
    assert.ok(cartes.every(c => c.cat === true), 'toutes marquées cat:true');
    assert.ok(cartes.some(c => !c.owned), 'les manquantes sont présentes');
    const pilotes = CARDS_DB.filter(c => c.category === 'pilote').length;
    assert.equal(cartes.length, pilotes);
  });

  test('champ_all passe par le drapeau champion, pas par la catégorie', () => {
    const cartes = B.getBadgeCards('champ_all');
    const champions = CARDS_DB.filter(c => c.champion).length;
    assert.equal(cartes.length, champions);
  });

  test('les badges de PALIER ne listent que le possédé, tronqué au seuil', () => {
    posseder(30);
    assert.equal(B.getBadgeCards('first_card').length, 1);
    assert.equal(B.getBadgeCards('collector_10').length, 10);
    assert.equal(B.getBadgeCards('hunter_25').length, 25);
    assert.ok(B.getBadgeCards('collector_10').every(c => c.owned === true));
    assert.ok(B.getBadgeCards('collector_10').every(c => c.cat === false));
  });

  test('un palier non atteint renvoie ce qui EST possédé, sans compléter', () => {
    posseder(3);
    assert.equal(B.getBadgeCards('collector_10').length, 3,
      'la liste décrit l’état réel, elle ne promet pas le seuil');
  });

  test('legend_101 renvoie TOUT le possédé, sans troncature', () => {
    posseder(40);
    assert.equal(B.getBadgeCards('legend_101').length, 40);
  });

  test('les badges de COULEUR filtrent sur le type, pas sur la carte', () => {
    const bleues = CARDS_DB.filter(c => c.types.includes('blue')).slice(0, 5);
    bleues.forEach(c => posseder1(c.id, 'blue'));
    assert.equal(B.getBadgeCards('blue_20').length, 5);
    assert.equal(B.getBadgeCards('green_20').length, 0,
      'posséder la variante bleue ne compte pas pour la verte');
  });

  test('foil_5 compte les VARIANTES foil, plusieurs par carte possibles', () => {
    const foils = Object.keys(CARD_TYPES).filter(t => CARD_TYPES[t].foil);
    assert.ok(foils.length > 0, 'le décor doit contenir des types foil');
    const carte = CARDS_DB.find(c => c.types.some(t => foils.includes(t)));
    posseder1(carte.id, carte.types.find(t => foils.includes(t)));
    assert.equal(B.getBadgeCards('foil_5').length, 1);
  });

  test('la liste de souhaits et les doubles ont leurs propres badges', () => {
    const c = CARDS_DB[0];
    txBatch(() => setTypeData(c.id, c.types[0], 'wishlist', true));
    assert.equal(B.getBadgeCards('dreamer_5').length, 1);
    assert.equal(B.getBadgeCards('doubler_5').length, 0);
  });

  test('chaque entrée porte les quatre mêmes champs', () => {
    posseder(5);
    for(const c of B.getBadgeCards('collector_10')){
      assert.deepEqual(Object.keys(c).sort(), ['cat', 'id', 'name', 'owned']);
    }
  });
});

/* ══════════════════════════════════════════════════════════
   B · Les titres — dérivés des badges, jamais du stockage seul

   La règle qui compte : le titre affiché vient TOUJOURS de la liste
   débloquée. Le localStorage ne fournit qu'un identifiant à retrouver.
   Un titre stocké mais non débloqué doit être OUBLIÉ, pas affiché.
   ══════════════════════════════════════════════════════════ */
describe('B · titres', () => {
  test('sans aucun badge, aucun titre débloqué', () => {
    assert.deepEqual(B.getUnlockedTitles(), []);
  });

  test('chaque badge débloqué offre un titre', () => {
    const b = MANUAL_BADGES[0];
    B.setManualBadges({ [b.id]: Date.now() });
    B.saveManualBadges();
    const titres = B.getUnlockedTitles();
    assert.equal(titres.length, 1);
    assert.equal(titres[0].id, b.id);
    assert.equal(titres[0].source, 'badge');
    assert.ok(titres[0].name, 'un titre a toujours un nom');
  });

  test('les paliers s’ajoutent aux titres de badge, ils ne les remplacent pas', () => {
    const store = {};
    MANUAL_BADGES.slice(0, 25).forEach(b => { store[b.id] = Date.now(); });
    B.setManualBadges(store);
    B.saveManualBadges();
    const titres = B.getUnlockedTitles();
    assert.equal(titres.filter(x => x.source === 'badge').length, 25);
    assert.ok(titres.some(x => x.source === 'milestone'),
      '25 badges ouvrent au moins un palier');
  });

  test('un titre stocké mais NON débloqué est OUBLIÉ, et la clé nettoyée', () => {
    // La valeur est stockée en JSON (guillemets compris) — écrire la
    // chaîne nue emprunterait un autre chemin, celui du test suivant.
    localStorage.setItem(`f1uno_title_${SEASON}`, JSON.stringify('jamais_debloque'));
    B.updateUserTitle();
    assert.equal(localStorage.getItem(`f1uno_title_${SEASON}`), null,
      'un identifiant qui ne correspond à aucun titre débloqué est effacé');
  });

  test('une valeur ILLISIBLE est ignorée mais LAISSÉE EN PLACE — bizarrerie figée', () => {
    /* Comportement caractérisé, pas approuvé : loadSelectedTitle()
       échoue à parser, laisse selectedTitleId à null, et la branche de
       nettoyage — qui exige un identifiant non nul — n'est jamais
       atteinte. La valeur illisible reste donc indéfiniment.

       Sans conséquence visible : elle n'est jamais affichée. Mais si le
       découpage « corrigeait » ça au passage, ce test le dirait — et
       c'est tout l'objet d'un filet de caractérisation. */
    localStorage.setItem(`f1uno_title_${SEASON}`, 'pas du json');
    B.updateUserTitle();
    assert.equal(localStorage.getItem(`f1uno_title_${SEASON}`), 'pas du json');
  });

  test('selectTitle(null) revient au titre par défaut sans lever', () => {
    B.selectTitle(null);
    assert.doesNotThrow(() => B.updateUserTitle());
  });
});

/* ══════════════════════════════════════════════════════════
   C · Le détail dépliable — un seul ouvert à la fois
   ══════════════════════════════════════════════════════════ */
/* renderBadges exige TROIS conteneurs et ne fait rien si l'un manque —
   voir le test dédié plus bas. Le décor les fournit tous les trois. */
const DECOR = '<div id="badgesHead"></div><div id="badgesNext"></div><div id="badgesFams"></div>';

describe('C · toggleBadgeDetail', () => {
  test('ouvrir un détail ferme le précédent', () => {
    posseder(30);
    mount(DECOR);
    B.renderBadges();
    const tuiles = [...document.querySelectorAll('.badge-tile[data-badge]')];
    if(tuiles.length < 2) return;   // décor trop pauvre : rien à caractériser
    B.toggleBadgeDetail(tuiles[0].dataset.badge);
    B.toggleBadgeDetail(tuiles[1].dataset.badge);
    assert.ok(document.querySelectorAll('.badge-detail.open').length <= 1,
      'deux détails ouverts en même temps seraient un changement de comportement');
  });

  test('un identifiant inconnu ne lève pas', () => {
    mount(DECOR);
    assert.doesNotThrow(() => B.toggleBadgeDetail('inexistant'));
  });
});

/* ══════════════════════════════════════════════════════════
   D · Rendu — ce que la vue produit d'observable

   On ne fige pas le HTML (il changera), on fige les INVARIANTS : toutes
   les familles sont rendues, chaque badge apparaît une fois et une
   seule, et l'objectif épinglé est marqué.
   ══════════════════════════════════════════════════════════ */
describe('D · renderBadges — invariants', () => {
  test('chaque badge du catalogue produit une tuile, une seule fois', () => {
    /* Le DOM de test ne gère pas les sélecteurs d'ATTRIBUT : on compte
       les tuiles et on cherche les identifiants dans le HTML produit,
       plutôt que d'interroger `[data-badge]`. La propriété vérifiée est
       la même — aucun badge perdu, aucun rendu deux fois — et c'est
       elle qui casserait si le découpage oubliait une famille. */
    mount(DECOR);
    B.renderBadges();
    const html = document.getElementById('badgesFams').innerHTML;
    const attendus = [...AUTO_BADGES, ...MANUAL_BADGES];
    assert.ok(attendus.length > 100, 'le décor doit porter le vrai catalogue');
    for(const b of attendus){
      const n = html.split(`data-badge="${b.id}"`).length - 1;
      assert.equal(n, 1, `${b.id} rendu ${n} fois au lieu d’une`);
    }
    // On NE compte PAS les `.badge-tile` : le DOM de test en dénombre
    // 114 pour 120 badges tous présents dans le HTML — écart du parseur
    // du harnais, pas de l'app. L'occurrence par identifiant ci-dessus
    // est de toute façon l'invariant fort : c'est lui qui casserait si
    // le découpage oubliait une famille ou en dupliquait une.
  });

  test('le rendu ne dépend pas d’un appel préalable à loadManualBadges', () => {
    // Bizarrerie caractérisée : renderBadges charge lui-même l'état.
    // Si le découpage l'en dispensait, la vue s'afficherait vide au
    // premier rendu — c'est arrivé sur cloud.js, avec la session.
    mount(DECOR);
    assert.doesNotThrow(() => B.renderBadges());
    assert.ok(document.querySelectorAll('.badge-tile').length > 0);
  });

  test('il ne rend RIEN si un seul des trois conteneurs manque', () => {
    // Sortie silencieuse volontaire : la vue Badges peut ne pas être
    // montée. Un découpage qui la remplacerait par une exception
    // casserait le premier rendu de l'app, pas un test.
    mount('<div id="badgesHead"></div><div id="badgesNext"></div>');
    assert.doesNotThrow(() => B.renderBadges());
    assert.equal(document.querySelectorAll('.badge-tile').length, 0);
  });
});

/* ══════════════════════════════════════════════════════════
   E · Le contrat de persistance, vu de l'extérieur

   Déjà couvert pour la fuite inter-saisons (season-badge-leak) ; ce
   qu'on ajoute ici est le contrat vu par un APPELANT : ce qui est écrit
   est relu à l'identique, et un déblocage automatique persiste seul.
   ══════════════════════════════════════════════════════════ */
describe('E · persistance vue de l’extérieur', () => {
  test('ce qui est enregistré est relu à l’identique', () => {
    const t0 = Date.now();
    B.setManualBadges({ a: t0 });
    B.setAutoBadgeUnlocked({ b: t0 });
    B.saveManualBadges();
    B.setManualBadges({});
    B.setAutoBadgeUnlocked({});
    B.loadManualBadges();
    assert.equal(B.manualBadges.a, t0);
    assert.equal(B.autoBadgeUnlocked.b, t0);
  });

  test('checkNewAutoBadges persiste ce qu’il vient de débloquer', () => {
    posseder(30);
    B.checkNewAutoBadges();
    const brut = localStorage.getItem(`f1uno_auto_badges_${SEASON}`);
    assert.ok(brut, 'la clé de saison est écrite');
    assert.ok(Object.keys(JSON.parse(brut)).length > 0,
      'un déblocage détecté doit survivre au rechargement, sans action de l’appelant');
  });
});
