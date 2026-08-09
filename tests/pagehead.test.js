/* ══════════════════════════════════════════════════════════
   BANDEAU DE PAGE (1.45.0) — remplace l'ancien test du compteur
   du header global, qui a déménagé dans le bandeau de Collection.

   Deux choses gardées ici :
   1. le CONTRAT DU PATTERN — le bandeau produit toujours un titre
      de niveau 1 avec une icône, et il échappe ce qu'on lui passe
      (le sous-titre porte des valeurs calculées) ;
   2. les CLÉS ×7 et leurs marqueurs — un {n} oublié dans une seule
      langue affiche « {n} cartes » en clair à l'écran.
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import '../translations.js';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { pageHeadHTML, pageHeadBtn } from '../pagehead.js';

const LANGS = ['en', 'fr', 'es', 'zh', 'it', 'nl', 'de'];

// Marqueurs attendus par clé : une clé qui les perd casse l'affichage.
const PLACEHOLDERS = {
  'ph.coll_sub':   ['{n}', '{y}'],
  'ph.badges_sub': ['{n}', '{total}'],
  'ph.stats_sub':  ['{n}', '{y}'],
  'ph.set_sub':    ['{v}'],
  'ph.acc_sub':    [],
};

describe('pageHeadHTML — le contrat du pattern', () => {
  test('icône, titre de niveau 1 et sous-titre', () => {
    const h = pageHeadHTML({ icon: 'layers', title: 'Collection', sub: '101 cartes' });
    assert.match(h, /<div class="ph">/);
    assert.match(h, /<div class="ph-icon"><svg class="ic"/);
    assert.match(h, /<h1 class="ph-title">Collection<\/h1>/);
    assert.match(h, /<div class="ph-sub">101 cartes<\/div>/);
  });

  test('les slots facultatifs ne laissent pas de conteneur vide', () => {
    const h = pageHeadHTML({ icon: 'user', title: 'Compte' });
    assert.ok(!h.includes('ph-sub'), 'sous-titre vide rendu quand même');
    assert.ok(!h.includes('ph-act'), 'slot d’actions vide rendu quand même');
    assert.ok(!h.includes('ph-metric'), 'slot mesure vide rendu quand même');
  });

  test('titre et sous-titre sont échappés', () => {
    const h = pageHeadHTML({ icon: 'user', title: '<img src=x onerror="alert(1)">', sub: '"><b>' });
    assert.ok(!h.includes('<img'), 'le titre a injecté du markup');
    assert.ok(!h.includes('<b>'), 'le sous-titre a injecté du markup');
    assert.match(h, /&lt;img/);
  });

  test('un bouton d’action porte toujours un nom accessible', () => {
    const b = pageHeadBtn('upload', 'Partager', 'data-action="shareBadges"');
    assert.match(b, /aria-label="Partager"/);
    assert.match(b, /type="button"/);
    assert.match(b, /data-action="shareBadges"/);
  });
});

describe('clés du bandeau — les 7 langues', () => {
  for (const key of Object.keys(PLACEHOLDERS)) {
    test(`${key} : présente et complète partout`, () => {
      for (const lang of LANGS) {
        const v = window.__T[lang] && window.__T[lang][key];
        assert.ok(v, `${key} absente en ${lang}`);
        for (const ph of PLACEHOLDERS[key]) {
          assert.ok(v.includes(ph), `${key} en ${lang} a perdu ${ph} → "${v}"`);
        }
      }
    });
  }

  test('les clés du compteur d’en-tête d’avant 1.45.0 ont bien disparu', () => {
    // Le compteur vit maintenant dans le bandeau de Collection ; laisser
    // header.total dans le dictionnaire ferait croire qu'il sert encore.
    for (const lang of LANGS) {
      assert.equal(window.__T[lang]['header.total'], undefined, `header.total encore là en ${lang}`);
      assert.equal(window.__T[lang]['header.total_aria'], undefined, `header.total_aria encore là en ${lang}`);
    }
  });
});
