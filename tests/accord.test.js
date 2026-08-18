/* ══════════════════════════════════════════════════════════
   LE RECOUPEMENT (1.75.0) — et LE TEST DE SYMÉTRIE, qui est le
   vrai apport de ce chantier.

   L'app calcule, elle n'arbitre pas. C'est une propriété
   ÉDITORIALE — le genre de chose qu'on annonce d'habitude dans
   un commentaire et qu'on espère voir tenir. Ici elle est
   VÉRIFIABLE : les deux directions passent par le même code et
   les mêmes gabarits, donc un test peut exiger que « 6 pour 0 »
   et « 0 pour 4 » se disent exactement de la même façon. Ajoutez
   un mot de jugement d'un seul côté, et il tombe.

   C'est le seul endroit du projet où une intention de ton
   devient testable. Elle mérite de le rester.
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import '../app/translations.js';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { accordModel, accordMiroir } from '../app/collector.js';

const LANGS = ['en', 'fr', 'es', 'zh', 'it', 'nl', 'de'];
const CARDS = [
  { id: '044', name: 'Charles Leclerc' }, { id: '048', name: 'Lando Norris' },
  { id: '001', name: 'Alex Albon' },      { id: '006', name: 'Fernando Alonso' },
];
const deps = { cards: CARDS };
const dbl = (id, ty = 'blue', q = 2) => [id, [[ty, q]]];

describe('LA SYMÉTRIE — la neutralité est vérifiable, pas promise', () => {
  const moi   = { want: ['044', '048'], offer: [dbl('001'), dbl('006')] };
  const autre = { want: ['001'],        offer: [dbl('044'), dbl('048')] };

  test('échanger les deux collections produit l’accord EXACTEMENT inverse', () => {
    const a = accordModel(moi, autre, deps);
    const b = accordModel(autre, moi, deps);
    assert.deepEqual(b.nIn, a.nOut);
    assert.deepEqual(b.nOut, a.nIn);
    assert.deepEqual(b.entrant.map(x => x.id), a.sortant.map(x => x.id));
    assert.deepEqual(b.sortant.map(x => x.id), a.entrant.map(x => x.id));
  });

  test('l’état est le MÊME dans les deux sens — l’app ne distingue pas qui donne', () => {
    // 2 pour 0 dans un sens, 0 pour 2 dans l'autre : même verdict.
    const donneur  = { want: [],      offer: [dbl('001'), dbl('006')] };
    const receveur = { want: ['001', '006'], offer: [] };
    const a = accordModel(donneur, receveur, deps);
    const b = accordModel(receveur, donneur, deps);
    assert.equal(a.etat, 'unilateral');
    assert.equal(b.etat, 'unilateral', 'un sens « donneur » et un sens « receveur » ne peuvent pas avoir deux verdicts');
    assert.deepEqual(accordMiroir(a).entrant.map(x => x.id), b.entrant.map(x => x.id));
  });

  test('AUCUN mot de jugement dans les textes de l’accord, dans les 7 langues', () => {
    /* La liste est volontairement large : si un de ces mots apparaît un
       jour, c'est que l'app s'est mise à arbitrer. */
    const JUGEMENT = /déséquilibr|desequilibr|avantag|désavantag|unfair|injuste|inéquitable|imbalanc|lopsided|generous|généreu|mauvais|bad deal|good deal|bonne affaire|perdant|gagnant|ungünstig|nachteil|vorteilhaft|squilibr|svantagg|desventaj|desequilibrad|oneerlijk|voordelig|不公平|吃亏|占便宜/i;
    const CLES = ['tr.ac_possible', 'tr.ac_uneven', 'tr.ac_none', 'tr.ac_none_why',
      'tr.ac_none_next', 'tr.ac_in', 'tr.ac_out', 'tr.ac_you_have', 'tr.ac_they_have',
      'tr.ac_nothing_yours', 'tr.ac_nothing_theirs', 'tr.ac_left'];
    for(const l of LANGS) for(const k of CLES){
      const v = window.__T[l][k];
      assert.ok(v, `${k} manque en ${l}`);
      assert.ok(!JUGEMENT.test(v), `${k} en ${l} porte un mot de JUGEMENT : « ${v} »`);
    }
  });

  test('les deux directions partagent le MÊME verdict — une seule clé, pas deux', () => {
    // Impossible de juger un côté si les deux lisent la même chaîne.
    const src = readFileSync(new URL('../app/backup.js', import.meta.url), 'utf8');
    const bloc = src.match(/_accordHTML[\s\S]*?\n}/);
    assert.ok(bloc, '_accordHTML introuvable');
    assert.ok(!/ac_uneven_in|ac_uneven_out|ac_uneven_donneur/.test(bloc[0]),
      'deux clés de verdict rouvriraient la porte au jugement : une seule, partagée');
    assert.match(bloc[0], /tr\.ac_uneven/);
  });

  test('les deux phrases directionnelles ont la MÊME forme (mêmes paramètres)', () => {
    for(const l of LANGS){
      const a = window.__T[l]['tr.ac_you_have'];
      const b = window.__T[l]['tr.ac_they_have'];
      const params = s => (s.match(/\{[a-z]+\}/g) || []).sort().join(',');
      assert.equal(params(a), params(b),
        `en ${l}, « vous avez » et « elle a » n’ont pas les mêmes paramètres : ${a} / ${b}`);
    }
  });
});

describe('le calcul lui-même', () => {
  test('intersection des deux sens', () => {
    const moi   = { want: ['044'], offer: [dbl('001')] };
    const autre = { want: ['001'], offer: [dbl('044')] };
    const a = accordModel(moi, autre, deps);
    assert.deepEqual(a.entrant.map(x => x.id), ['044']);
    assert.deepEqual(a.sortant.map(x => x.id), ['001']);
    assert.equal(a.etat, 'possible');
  });

  test('rien à échanger : état « aucun », sans verdict d’échec', () => {
    const a = accordModel({ want: ['999'], offer: [dbl('001')] },
                          { want: ['888'], offer: [dbl('044')] }, deps);
    assert.equal(a.etat, 'aucun');
    assert.equal(a.nIn, 0);
    assert.equal(a.nOut, 0);
  });

  test('« il vous en reste N » — on ne donne que des doubles', () => {
    const a = accordModel({ want: [], offer: [['001', [['blue', 3]]]] },
                          { want: ['001'], offer: [] }, deps);
    assert.equal(a.sortant[0].reste, 2, '3 exemplaires, un donné → il en reste 2');
  });

  test('la montée de palier se calcule SANS collection fictive', () => {
    const a = accordModel(
      { want: ['044'], offer: [] },
      { want: [], offer: [['044', [['nitro_foil', 2]]]] },
      { cards: CARDS, rarityOrder: { legendary: 1, cosmic: 4 },
        variantRarity: () => 'cosmic', cardRarity: () => 'legendary' });
    assert.equal(a.entrant[0].monte, 'cosmic');
  });

  test('aucune montée annoncée si le type reçu ne dépasse pas le palier courant', () => {
    const a = accordModel(
      { want: ['044'], offer: [] },
      { want: [], offer: [['044', [['blue', 2]]]] },
      { cards: CARDS, rarityOrder: { legendary: 1, cosmic: 4 },
        variantRarity: () => 'legendary', cardRarity: () => 'cosmic' });
    assert.equal(a.entrant[0].monte, undefined);
  });

  test('la note sur variantRarity est écrite là où quelqu’un simulerait', () => {
    const src = readFileSync(new URL('../app/collector.js', import.meta.url), 'utf8');
    assert.match(src, /AUCUNE COLLECTION FICTIVE/);
    assert.match(src, /variantRarity\(carte, type\)` est PURE/);
  });
});
