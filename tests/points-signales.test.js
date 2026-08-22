// L'en-tête de docs/POINTS-SIGNALES.md annonce des comptes. Ces comptes ont
// déjà menti : l'en-tête a affirmé « aucun point ouvert » alors que huit
// l'étaient, et la correction de cette affirmation a elle-même embarqué un
// chiffre faux (⑦ deux fois de suite, registre de CONVENTIONS.md).
//
// Ce test rend l'en-tête VÉRIFIABLE. Il ne juge pas si un point est
// réellement clos — cela demande de lire son diagnostic. Il vérifie que
// l'en-tête et les marqueurs des entrées disent la MÊME chose.
//
// SEUIL DÉCLARÉ (㉒) : ce test tombe au premier écart, sans tolérance.
// Il n'y a pas de « presque juste » sur un décompte — un point ouvert
// manquant à l'en-tête est exactement le défaut que ce fichier reproche
// au reste du dépôt.
import { test } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';

const SRC = new URL('../docs/POINTS-SIGNALES.md', import.meta.url);
const md = readFileSync(SRC, 'utf-8');

// ── Ce que les ENTRÉES déclarent ──────────────────────────────────────
const entries = [...md.matchAll(/^## (\d+)\. (.*)\n\n<!-- état: (.+?) · type: (.+?) -->/gm)]
  .map(([, num, titre, etat, type]) => ({ num, titre, etat, type }));

// ── Ce que l'EN-TÊTE annonce ──────────────────────────────────────────
const entete = md.slice(0, md.indexOf('\n---\n'));
const annonce = entete.match(/\*\*(\d+) entrées : (\d+) défauts et (\d+) référence/);
const motDouze = entete.match(/([A-ZÀ-Ý]+) défauts? sont OUVERTS/);
const listés = [...entete.matchAll(/^> \| (\d+) \|/gm)].map(m => m[1]);

const MOTS = { UN: 1, DEUX: 2, TROIS: 3, QUATRE: 4, CINQ: 5, SIX: 6, SEPT: 7,
  HUIT: 8, NEUF: 9, DIX: 10, ONZE: 11, DOUZE: 12, TREIZE: 13, QUATORZE: 14, QUINZE: 15 };

test('chaque entrée porte un marqueur état + type', () => {
  const titres = [...md.matchAll(/^## (\d+)\. /gm)].map(m => m[1]);
  assert.strictEqual(entries.length, titres.length,
    `${titres.length} entrées mais ${entries.length} marqueurs — sans marqueur : ` +
    titres.filter(n => !entries.some(e => e.num === n)).join(', '));
});

test('les valeurs des marqueurs sont celles du vocabulaire', () => {
  for (const e of entries) {
    assert.ok(['ouvert', 'fermé', 'sans objet'].includes(e.etat),
      `n°${e.num} : état « ${e.etat} » hors vocabulaire`);
    assert.ok(['défaut', 'référence'].includes(e.type),
      `n°${e.num} : type « ${e.type} » hors vocabulaire`);
  }
});

test("l'en-tête annonce le bon nombre d'entrées, de défauts et de références", () => {
  assert.ok(annonce, "l'en-tête n'annonce plus ses comptes dans la forme attendue");
  const [, total, defauts, refs] = annonce;
  assert.strictEqual(Number(total), entries.length, 'total annoncé ≠ entrées comptées');
  assert.strictEqual(Number(defauts), entries.filter(e => e.type === 'défaut').length,
    'défauts annoncés ≠ marqueurs type: défaut');
  assert.strictEqual(Number(refs), entries.filter(e => e.type === 'référence').length,
    'références annoncées ≠ marqueurs type: référence');
});

test("l'en-tête annonce le bon nombre d'ouverts, en toutes lettres", () => {
  const ouverts = entries.filter(e => e.etat === 'ouvert' && e.type === 'défaut');
  assert.ok(motDouze, "l'en-tête n'annonce plus « N défauts sont OUVERTS »");
  assert.strictEqual(MOTS[motDouze[1]], ouverts.length,
    `en-tête : « ${motDouze[1]} » (${MOTS[motDouze[1]]}) · marqueurs : ${ouverts.length}`);
});

test("le tableau de l'en-tête liste exactement les entrées ouvertes", () => {
  const ouverts = entries.filter(e => e.etat === 'ouvert' && e.type === 'défaut').map(e => e.num);
  const manquants = ouverts.filter(n => !listés.includes(n));
  const enTrop = listés.filter(n => !ouverts.includes(n));
  assert.deepStrictEqual({ manquants, enTrop }, { manquants: [], enTrop: [] },
    `tableau désynchronisé — absents : [${manquants}] · en trop : [${enTrop}]`);
});

test('un titre barré ne peut pas être marqué ouvert', () => {
  const incoherents = entries.filter(e => e.titre.trimStart().startsWith('~~') && e.etat === 'ouvert');
  assert.deepStrictEqual(incoherents.map(e => e.num), [],
    'titre barré mais état ouvert : ' + incoherents.map(e => e.num).join(', '));
});
