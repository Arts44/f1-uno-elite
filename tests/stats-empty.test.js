/* ══════════════════════════════════════════════════════════
   LA PAGE STATS À UNE CARTE (1.72.0) — l'état d'un nouvel
   utilisateur, et le seul qu'aucune capture ne montrait : toutes
   étaient prises sur le seed à 72 cartes. Six défauts y vivaient.

   Le PLURIEL d'abord, parce qu'il touchait CHAQUE libellé et que
   les règles diffèrent par langue — un `n > 1 ? 's' : ''` au point
   d'appel ne pouvait pas marcher.
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import '../app/translations.js';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pluralForm } from '../app/i18n.js';
import { heroModel, SEUIL_PHARES } from '../app/stats.js';

const read = f => readFileSync(new URL('../app/' + f, import.meta.url), 'utf8');
const LANGS = ['en', 'fr', 'es', 'zh', 'it', 'nl', 'de'];

describe('pluriel — trois règles, pas une', () => {
  test('fr : 0 ET 1 au singulier (« 0 carte »)', () => {
    assert.equal(pluralForm('fr', 0), 'one');
    assert.equal(pluralForm('fr', 1), 'one');
    assert.equal(pluralForm('fr', 2), 'other');
  });
  test('en/de/nl/es/it : seul 1 est singulier (« 0 cards »)', () => {
    for(const l of ['en', 'de', 'nl', 'es', 'it']){
      assert.equal(pluralForm(l, 0), 'other', l);
      assert.equal(pluralForm(l, 1), 'one', l);
      assert.equal(pluralForm(l, 2), 'other', l);
    }
  });
  test('zh : une seule forme, toujours', () => {
    for(const n of [0, 1, 2, 100]) assert.equal(pluralForm('zh', n), 'other');
  });
  test('les deux formes existent ×7 pour chaque clé pluralisée', () => {
    const KEYS = ['st.hero_missing', 'st.hero_start', 'st.hero_early', 'st.hero_early_sub',
      'st.door_missing_sub', 'st.door_doubles_sub', 'st.owned_cards'];
    for(const k of KEYS) for(const l of LANGS) for(const f of ['one', 'other']){
      assert.ok(window.__T[l]?.[`${k}_${f}`], `${k}_${f} manque en ${l}`);
    }
  });
  test('en zh les deux formes sont IDENTIQUES — voulu, pas un oubli', () => {
    for(const k of ['st.hero_early', 'st.owned_cards']){
      assert.equal(window.__T.zh[`${k}_one`], window.__T.zh[`${k}_other`]);
    }
  });
  test('le héros marque ce qui s’accorde, et sur quel nombre', () => {
    assert.equal(heroModel(1, 101).plural, true);
    assert.equal(heroModel(1, 101).big, 1, 'l’accord suit le GRAND chiffre');
    assert.equal(heroModel(0, 101).big, 101);
  });
});

describe('les cinq autres défauts', () => {
  const stats = read('stats.js');

  test('1 · le libellé du donut ne peut plus déborder du trou (64 unités)', () => {
    assert.match(stats, /textLength="54" lengthAdjust="spacingAndGlyphs"/,
      'sans textLength, la longueur dépend de la langue et repasse sous l’anneau');
  });

  test('3 · un segment unique est PLEIN, jamais iridescent', () => {
    assert.match(stats, /const seul = donutData\.length === 1;/);
    assert.match(stats, /!seul && d\.k==='divine'/);
    assert.match(stats, /!seul && d\.k==='eternal'/);
  });

  test('4 · le nombre n’est plus écrit deux fois dans une porte', () => {
    // Le chiffre vit dans .dr-n ; le libellé est un NOM, sans {n}.
    for(const l of LANGS){
      assert.ok(!/\{n\}/.test(window.__T[l]['st.door_missing']), `st.door_missing porte encore {n} en ${l}`);
      assert.ok(!/\{n\}/.test(window.__T[l]['st.door_doubles']), `st.door_doubles porte encore {n} en ${l}`);
    }
    assert.match(stats, /<span class="dr-t">\$\{t\('st\.door_missing'\)\}<\/span>/);
  });

  test('5 · un fondu couvre la zone de la barre flottante, sans bloquer les gestes', () => {
    const css = read('styles.css');
    assert.match(css, /\.main::after\{content:'';position:fixed[^}]*pointer-events:none/);
    assert.match(css, /\.main::after\{[^}]*var\(--nav-clear\)/);
  });

  test('6 · les cartes phares ont un seuil, et s’effacent si elles se répètent', () => {
    assert.equal(SEUIL_PHARES, 5);
    assert.match(stats, /pharesRedondantes = rarest0 && most0 && rarest0\.id === most0\.id/);
    assert.match(stats, /featuredHtml \? block\(t\('st\.featured'\), featuredHtml\) : ''/);
  });
});
