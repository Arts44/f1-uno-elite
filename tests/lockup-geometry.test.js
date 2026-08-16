/* ══════════════════════════════════════════════════════════
   LA GÉOMÉTRIE DU LOCKUP — une source, trois implémentations tenues

   Le lockup vit en TROIS endroits qui ne s'importent pas : le CSS
   (.lockup, la SOURCE), l'icône SVG (icons/icon.svg) et le sceau canvas
   (profile-card.js). Trois implémentations qui se désynchronisent, ce
   dépôt connaît — le partage ne peut pas être mécanique ici (un SVG
   autonome ne lit pas les variables CSS, un canvas non plus), donc ce
   test ÉCHOUE quand elles divergent. C'est l'exigence posée à 1.61.0.

   Les valeurs nommées : graisse 700 (le VRAI maximum de
   space-grotesk-var — la 800 de 1.30.0 était un faux gras synthétique),
   interlettre nom -0.02em, ÉLITE 500/0.16em compensée, barre pleine
   78 % / 0.08em, seuil : pas de barre sous 24 px.

   Ancrages sur du CODE, jamais sur des commentaires (CONVENTIONS §…) :
   les regex visent les déclarations elles-mêmes.
   ══════════════════════════════════════════════════════════ */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const lire = f => readFileSync(new URL(`../app/${f}`, import.meta.url), 'utf8');
const sansCommentaires = (src, ouvre, ferme) => src.split(ouvre).map((b, i) => i === 0 ? b : b.slice(b.indexOf(ferme) + ferme.length)).join('');

const css = sansCommentaires(lire('styles.css'), '/*', '*/');
const svg = sansCommentaires(lire('icons/icon.svg'), '<!--', '-->');
const carte = sansCommentaires(lire('profile-card.js'), '/*', '*/');

/* ── LA SOURCE : les valeurs nommées, extraites du CSS lui-même ── */
const GRAISSE = 700;
const INTERLETTRE_NOM = -0.02;
const ELITE = { graisse: 500, taille: 0.34, interlettre: 0.16 };
const BARRE = { largeur: 78, hauteur: 0.08 };

describe('lockup — la source CSS porte les valeurs nommées', () => {
  test('graisse 700 réelle sur F1 et UNO — jamais 800 (faux gras)', () => {
    assert.match(css, /\.lk-f1\{font-weight:700;/);
    assert.match(css, /\.lk-uno\{font-weight:700;/);
    assert.ok(!/\.lk-\w+\{[^}]*font-weight:800/.test(css),
      'la 800 est un faux gras : space-grotesk-var s’arrête à 700');
  });
  test('interlettre du nom et réglage d’ÉLITE', () => {
    assert.match(css, new RegExp(`\\.lk-f1\\{[^}]*letter-spacing:${INTERLETTRE_NOM}em`));
    assert.match(css, new RegExp(
      `\\.lk-elite\\{font-weight:${ELITE.graisse};font-size:${ELITE.taille}em;letter-spacing:${ELITE.interlettre}em;[^}]*margin-right:-${ELITE.interlettre}em`),
      'l’interlettre d’ÉLITE doit rester COMPENSÉE à droite (espace fantôme du dernier glyphe)');
  });
  test('barre pleine 78 % / 0.08em, et AUCUN fondu', () => {
    assert.match(css, new RegExp(`\\.lk-bar\\{height:max\\(2px,${BARRE.hauteur}em\\);[^}]*width:${BARRE.largeur}%`));
    assert.ok(!/\.lk-bar\{[^}]*gradient/.test(css), 'le fondu rendait la barre illisible — elle reste pleine');
  });
  test('le seuil : pas de barre dans l’en-tête, et l’EXCEPTION d’ÉLITE y est réglée', () => {
    assert.match(css, /\.lk-hd \.lk-bar\{display:none;\}/);
    // L'exception documentée : à 20 px, ÉLITE remonte à 0.4em. Si
    // quelqu'un « uniformise » en croyant bien faire, ce test le dira.
    assert.match(css, /\.lk-hd \.lk-elite\{font-size:0\.4em;/);
  });
});

describe('lockup — le SVG et le canvas reprennent la source', () => {
  test('icon.svg : graisse 700, interlettre = ratio de la source', () => {
    const f1 = svg.match(/<text[^>]*font-weight="(\d+)" font-size="(\d+)" letter-spacing="(-?[\d.]+)">F1</);
    assert.ok(f1, 'le texte F1 de l’icône est introuvable');
    assert.equal(+f1[1], GRAISSE);
    assert.equal((+f1[3] / +f1[2]).toFixed(2), INTERLETTRE_NOM.toFixed(2),
      'letter-spacing(px) / font-size doit valoir l’interlettre de la source');
    const uno = svg.match(/font-weight="(\d+)" font-size="(\d+)" letter-spacing="([\d.]+)"[^>]*>UNO</);
    assert.ok(uno, 'le texte UNO de l’icône est introuvable');
    assert.equal(+uno[1], ELITE.graisse, 'UNO empilé porte la graisse « qualificatif » (500)');
    assert.equal((+uno[3] / +uno[2]).toFixed(2), ELITE.interlettre.toFixed(2));
    assert.ok(!/font-weight="800"/.test(svg), 'jamais 800 dans l’icône');
  });
  test('profile-card.js : Space Grotesk 700, plus jamais system-ui seul', () => {
    assert.match(carte, /x\.font = "700 54px 'Space Grotesk', system-ui"/,
      'le sceau doit porter la police du produit en graisse 700 réelle');
    assert.ok(!/x\.font = '700 54px system-ui'/.test(carte),
      'system-ui seul était la mauvaise police sur le seul rendu qui sort de l’app');
  });
});
