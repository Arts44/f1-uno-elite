/* ══════════════════════════════════════════════════════════
   LES STATS RENVERSÉES (1.66.0) — le héros du manque et ses
   deux garde-fous, les portes, et le partage de la liste
   d'échange (fermeture de POINTS-SIGNALES n°15).

   LE GARDE-FOU D'ABORD : sur une collection presque vide,
   « 101 cartes vous manquent » serait absurde et démoralisant.
   heroModel() bascule en formulation positive sous
   SEUIL_HERO_POSITIF — c'est le contrat validé au chiffrage,
   testé aux seuils exacts (0, 1, 9, 10) et au complet.
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { heroModel, SEUIL_HERO_POSITIF } from '../app/stats.js';

const read = f => readFileSync(new URL('../app/' + f, import.meta.url), 'utf8');

describe('heroModel — la bascule positive AVANT le chiffre rouge', () => {
  test('0 possédée : le catalogue, pas le manque', () => {
    const h = heroModel(0, 101);
    assert.equal(h.mode, 'start');
    assert.equal(h.big, 101, 'le grand chiffre est ce qu\'il y a À COLLECTIONNER');
    assert.equal(h.labelKey, 'st.hero_start');
  });

  test('1 et 5 possédées : le positif — ce qu\'on A, pas ce qui manque', () => {
    for(const owned of [1, 5]){
      const h = heroModel(owned, 101);
      assert.equal(h.mode, 'early', `à ${owned} possédée(s)`);
      assert.equal(h.big, owned);
      assert.equal(h.subParams.missing, 101 - owned);
    }
  });

  test('la frontière exacte : 9 → positif, 10 → manque', () => {
    assert.equal(heroModel(SEUIL_HERO_POSITIF - 1, 101).mode, 'early');
    const h = heroModel(SEUIL_HERO_POSITIF, 101);
    assert.equal(h.mode, 'missing');
    assert.equal(h.big, 91);
    // Garde-fou n°1 : le sous-titre porte possédées + total + pourcentage
    // — c'est lui qui empêche le chiffre rouge d'être une claque.
    assert.deepEqual(h.subParams, { owned: 10, total: 101, pct: 10 });
  });

  test('collection complète : ni manque ni zéro — l\'accomplissement', () => {
    const h = heroModel(101, 101);
    assert.equal(h.mode, 'done');
    assert.equal(h.big, 101);
  });

  test('catalogue vide (saison sans données) : pas de « complet » menteur', () => {
    assert.equal(heroModel(0, 0).mode, 'start');
  });
});

describe('le renversement — contrats de gabarit', () => {
  const src = read('stats.js');

  test('l\'ordre : héros puis portes AVANT les graphiques', () => {
    const layout = src.match(/<div class="sv-col">([\s\S]*?)<aside/);
    assert.ok(layout, 'colonne principale introuvable');
    const col = layout[1];
    const order = ['${heroHtml}', '${toolsHtml}', "st.general", "st.history"];
    let pos = -1;
    for(const marker of order){
      const p = col.indexOf(marker);
      assert.ok(p > pos, `${marker} n'est pas après le précédent — l'ordre du renversement est perdu`);
      pos = p;
    }
  });

  test('trois portes, sémantique tablist conservée', () => {
    for(const tool of ['missing', 'doubles', 'trade']){
      assert.match(src, new RegExp(`sv-door[^>]*data-tool="${tool}"[^>]*role="tab"`),
        `porte ${tool} absente ou sans rôle d'onglet`);
    }
  });
});

describe('n°15 fermé — le partage sans recopie', () => {
  test('stats.js consomme share-file.js, et ne recopie PAS la plomberie', () => {
    const src = read('stats.js');
    assert.match(src, /import \{ shareOrDownloadFile \} from '\.\/share-file\.js'/);
    assert.ok(!/canShare|createObjectURL/.test(src),
      'la plomberie de sortie appartient à share-file.js — la recopier recrée la dette du n°15');
  });

  test('profile-card.js consomme le MÊME module (déplacée, pas dupliquée)', () => {
    const src = read('profile-card.js');
    assert.match(src, /import \{ shareOrDownloadFile \} from '\.\/share-file\.js'/);
    assert.ok(!/navigator\.canShare/.test(src));
  });

  test('share-file.js est une feuille : aucun import applicatif', () => {
    assert.ok(!/^import /m.test(read('share-file.js')),
      'la feuille ne doit embarquer aucune vue — c\'est ce qui a fermé le n°15');
  });

  test('le commentaire « NE PAS SUPPRIMER » est parti avec la dette', () => {
    assert.ok(!read('stats.js').includes('NE PAS SUPPRIMER'),
      'fmtTrade a des appelants depuis 1.66.0 — la mise en garde n\'a plus de raison d\'être');
    assert.match(read('stats.js'), /fmtTrade\(\)/, 'les appelants doivent exister');
  });
});

describe('i18n ×7 — les clés du renversement', () => {
  new Function(read('translations.js'))();
  const LANGS = ['en', 'fr', 'es', 'zh', 'it', 'nl', 'de'];
  const KEYS = ['st.hero_missing', 'st.hero_missing_sub', 'st.hero_start', 'st.hero_start_sub',
    'st.hero_early', 'st.hero_early_sub', 'st.hero_done', 'st.hero_done_sub',
    'st.door_missing', 'st.door_missing_sub', 'st.door_doubles', 'st.door_doubles_sub',
    'st.door_trade', 'st.door_trade_sub', 'st.copy', 'st.share', 'st.copied', 'st.trade_saved'];
  for(const key of KEYS){
    test(key, () => {
      for(const l of LANGS) assert.ok(window.__T[l] && window.__T[l][key], `${key} manque en ${l}`);
    });
  }
});
