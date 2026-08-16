/* ══════════════════════════════════════════════════════════
   NON-RÉGRESSION XSS (audit 1.42.1) — une charge hostile dans un
   fichier importé, un code de sauvegarde, un lien #backup= ou une
   réponse cloud finissait dans innerHTML SANS échappement :
   `t('imp.sub', {season})` → exécution dans l'origine de l'app,
   donc lecture de localStorage (collection, hash du PIN, et le
   jeton de session cloud → reprise du compte).

   Les quatre chemins d'entrée passent par _showImportDialog :
     import JSON · code de sauvegarde · lien #backup= · pull cloud.

   Ce test garde le contrat au niveau du helper (tEsc/escapeHtml),
   là où tous ces chemins convergent.
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, tEsc, t } from '../app/i18n.js';

// translations.js est un script CLASSIQUE (window.__T) : hors navigateur
// on injecte le strict nécessaire — le gabarit réel de imp.sub.
globalThis.window.__T = {
  en: { 'imp.sub': 'Season {season} — exported on {date}.' },
};
globalThis.localStorage.setItem('f1uno_lang', 'en');

// La charge EXACTE utilisée pour la preuve en navigateur.
const PAYLOAD = '<img src=x onerror="window.__pwned()">';

describe('escapeHtml', () => {
  test('neutralise la charge de la preuve', () => {
    const out = escapeHtml(PAYLOAD);
    assert.ok(!out.includes('<img'), 'la balise passe encore');
    assert.ok(!out.includes('onerror="'), 'l’attribut d’événement passe encore');
    assert.equal(out, '&lt;img src=x onerror=&quot;window.__pwned()&quot;&gt;');
  });

  test('couvre les cinq caractères dangereux, sans double échappement', () => {
    assert.equal(escapeHtml(`&<>"'`), '&amp;&lt;&gt;&quot;&#39;');
    assert.equal(escapeHtml('rien à échapper'), 'rien à échapper');
  });

  test('accepte les non-chaînes sans lever (undefined, nombres, objets)', () => {
    assert.equal(escapeHtml(2025), '2025');
    assert.equal(escapeHtml(undefined), 'undefined');
    assert.equal(escapeHtml(null), 'null');
  });
});

describe('tEsc — le t() des contextes innerHTML', () => {
  test('la charge injectée via {season} ressort inerte', () => {
    const out = tEsc('imp.sub', { season: PAYLOAD, date: '01/01/2026' });
    assert.ok(!out.includes('<img'), out);
    assert.ok(out.includes('&lt;img'), out);
  });

  test('t() brut, lui, laisse passer — c’est bien tEsc qui protège', () => {
    // Documente la raison d'être de tEsc : si un jour on repasse à t()
    // sur un sink innerHTML, ce test rappelle ce qu'on perd.
    assert.ok(t('imp.sub', { season: PAYLOAD, date: 'x' }).includes('<img'));
  });

  test('les valeurs légitimes traversent intactes', () => {
    const out = tEsc('imp.sub', { season: 2025, date: '08/08/2026' });
    assert.ok(out.includes('2025') && out.includes('08/08/2026'), out);
  });

  test('le gabarit traduit n’est PAS échappé (il vient du dépôt)', () => {
    // imp.q contient une apostrophe typographique en français ;
    // l'échapper afficherait une entité à l'écran.
    const s = tEsc('imp.sub', { season: 'a', date: 'b' });
    assert.ok(!s.includes('&amp;lt;'), 'double échappement du gabarit');
  });
});
