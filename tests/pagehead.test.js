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
import '../app/translations.js';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pageHeadHTML, pageHeadBtn } from '../app/pagehead.js';

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

describe('infobulle du tutoriel — contraste des aplats', () => {
  const css = readFileSync(new URL('../app/styles.css', import.meta.url), 'utf8');
  const rule = name => {
    const i = css.indexOf(name + '{');
    return i === -1 ? '' : css.slice(i, css.indexOf('}', i));
  };

  test('le bouton Suivant et la pastille directionnelle sont en blanc, pas en --red-ink', () => {
    // --red-ink est l'encre ROUGE FONCÉE pour du texte sur fond CLAIR
    // (#C50026 en clair, var(--red) en sombre). Posée sur un aplat
    // var(--red), elle donne du rouge sur rouge — invisible en sombre.
    for (const sel of ['.tut-next', '.tut-away']) {
      const r = rule(sel);
      assert.ok(r.includes('background:var(--red)'), `${sel} : aplat rouge attendu`);
      assert.ok(r.includes('color:var(--on-red'), `${sel} : le texte doit utiliser --on-red`);
      assert.ok(!r.includes('--red-ink'), `${sel} : --red-ink sur un aplat rouge`);
    }
  });

  test('--on-red change avec le thème — le rouge sombre est trop clair pour du blanc', () => {
    // #FFF sur #FF4757 ne fait que 3,1:1 (sous AA pour du texte de 13 px).
    // Le thème sombre veut donc une encre presque noire, pas du blanc.
    assert.match(css, /:root\{[^}]*--on-red:#FFFFFF/);
    assert.match(css, /\[data-theme="dark"\]\{[^}]*--on-red:#[0-9A-F]{6}/i);
    const dark = css.match(/\[data-theme="dark"\]\{[^}]*--on-red:(#[0-9A-F]{6})/i)[1];
    assert.notEqual(dark.toUpperCase(), '#FFFFFF', 'le thème sombre ne peut pas garder du blanc');
  });
});
