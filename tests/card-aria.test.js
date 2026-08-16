/* ══════════════════════════════════════════════════════════
   LE NOM ACCESSIBLE DE LA TUILE (point n°5)

   CE QUE LA MESURE A MONTRÉ, et qui contredisait le correctif
   prescrit. La tuile est un `role="button"` avec un `aria-label` :
   le nom accessible d'un bouton REMPLACE son contenu. Tout ce que
   la tuile affiche — écurie, année, rareté, exemplaires, et jusqu'à
   l'`aria-label` du sceau « set complet » — n'était jamais annoncé.

   Relevé au navigateur avant correction (CDP, getPartialAXTree) :

     Stoffel Vandoorne — #070      (réserve)
     James Vowles — #076           (directeur)

   Deux catégories, le même visuel (monogramme d'écurie), et deux
   noms qui ne les distinguent pas. Poser `role="img"` + `aria-label`
   sur les marqueurs de coin — la correction annoncée — n'aurait rien
   changé : l'étiquette aurait été avalée comme celle du sceau l'est.

   Ces tests portent sur la FONCTION qui compose le nom, pas sur le
   markup : c'est elle qui décide ce qu'un lecteur d'écran entend.
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Les traductions sont un script global (window.__T), pas un module.
globalThis.window = globalThis.window || {};
new Function(readFileSync(new URL('../app/translations.js', import.meta.url), 'utf8'))
  .call(globalThis);

const { cardAriaLabel } = await import('../app/render.js');

const RESERVE = { id: '070', name: 'Stoffel Vandoorne', category: 'reserve', team: 'Aston Martin' };
const DIRECTEUR = { id: '076', name: 'James Vowles', category: 'directeur', team: 'Atlassian Williams Racing' };

describe('nom accessible de la tuile', () => {
  test('réserve et directeur ne portent plus le même nom', () => {
    const r = cardAriaLabel(RESERVE, { isOwned: true });
    const d = cardAriaLabel(DIRECTEUR, { isOwned: true });
    assert.notEqual(r, d);
    assert.match(r, /réserve|Reserve/i, 'la catégorie réserve n’est pas dite');
    assert.match(d, /Directeur|Principal/i, 'la catégorie directeur n’est pas dite');
  });

  test('le nom commence par ce qui identifie : nom et numéro', () => {
    assert.ok(cardAriaLabel(RESERVE, {}).startsWith('Stoffel Vandoorne — #070'),
      'sur 101 tuiles parcourues à la voix, l’identité vient en premier');
  });

  test('l’état de collection est dit — c’est l’objet même de l’app', () => {
    assert.match(cardAriaLabel(RESERVE, { isOwned: true }), /possédée|owned/i);
    assert.match(cardAriaLabel(RESERVE, { isOwned: false }), /manquante|missing/i);
  });

  test('set complet et champion ne sont dits que s’ils sont vrais', () => {
    const nu = cardAriaLabel(RESERVE, { isOwned: true });
    assert.ok(!/set complet/i.test(nu));
    assert.match(cardAriaLabel(RESERVE, { isOwned: true, isSet: true }), /set complet|complete set/i);
    assert.match(cardAriaLabel({ ...RESERVE, champion: true }, { isOwned: true }), /champion|Weltmeister/i);
  });

  test('une catégorie inconnue ne pollue pas le nom avec sa clé', () => {
    const l = cardAriaLabel({ ...RESERVE, category: 'inventée' }, { isOwned: true });
    assert.ok(!l.includes('cat.'), `clé i18n brute annoncée : ${l}`);
  });

  test('les quatre clés existent dans les 7 langues', () => {
    for(const lg of ['en', 'fr', 'es', 'zh', 'it', 'nl', 'de']){
      for(const k of ['a11y.owned', 'a11y.missing', 'a11y.set', 'a11y.champion']){
        assert.ok(globalThis.window.__T[lg][k], `${lg} : ${k} manquante`);
      }
    }
  });
});

describe('marqueurs de coin — décoratifs, et enfin honnêtes', () => {
  const render = readFileSync(new URL('../app/render.js', import.meta.url), 'utf8');
  const tuile = render.slice(render.indexOf('MARQUEURS DE COIN'), render.indexOf('<button class="qbtn"'));

  test('le sceau de la TUILE ne prétend plus porter une étiquette', () => {
    const ligne = tuile.split('\n').find(l => l.includes('class="set-flag"'));
    assert.ok(ligne, 'sceau introuvable');
    assert.ok(!ligne.includes('aria-label'),
      'dans un bouton nommé, cette étiquette n’est jamais lue — elle simule une accessibilité absente');
    assert.match(ligne, /aria-hidden="true"/);
    assert.match(ligne, /title=/, 'l’infobulle souris, elle, reste utile');
  });

  test('les trois marqueurs restent décoratifs', () => {
    for(const cls of ['crown', 'replacement-icon', 'director-icon']){
      const ligne = tuile.split('\n').find(l => l.includes(`class="${cls}"`));
      assert.match(ligne, /aria-hidden="true"/, `${cls} : un marqueur muet doit le dire`);
    }
  });
});
