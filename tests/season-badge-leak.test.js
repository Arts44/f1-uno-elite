/* ══════════════════════════════════════════════════════════
   FUITE INTER-SAISONS DES BADGES — le test qui échouait avant
   le correctif.

   `loadManualBadges()` faisait `if(a) autoBadgeUnlocked = …`
   SANS `else`. Quand la nouvelle saison n'avait pas encore de
   badges enregistrés, les objets de module gardaient ceux de la
   saison précédente — et le premier `saveManualBadges()` les
   écrivait sous la clé de la NOUVELLE saison. La corruption
   était permanente : rien ne reverrouille un badge automatique.

   Même famille que la fuite de titre corrigée en 1.47.4. Ces
   tests figent le CONTRAT (une saison ne voit que ses badges),
   pas l'implémentation.
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetStorage } from './_setup.js';
import { readFileSync } from 'node:fs';
import { installFixtures } from './_fixtures.js';
import { setCurrentSeason } from '../data.js';
import { loadManualBadges, manualBadges, autoBadgeUnlocked, saveManualBadges } from '../badges.js';

describe('badges — étanchéité entre saisons', () => {
  beforeEach(() => { resetStorage(); installFixtures(); });

  test('une saison SANS badges enregistrés n’hérite de rien', () => {
    setCurrentSeason(2025);
    localStorage.setItem('f1uno_auto_badges_2025', JSON.stringify({ collector_10: 1, hunter_25: 1 }));
    localStorage.setItem('f1uno_badges_2025', JSON.stringify({ m_paddock: 1 }));
    loadManualBadges();
    assert.equal(Object.keys(autoBadgeUnlocked).length, 2, 'décor : 2025 a bien ses badges');

    // bascule vers une saison vierge
    setCurrentSeason(2026);
    loadManualBadges();
    assert.deepEqual(autoBadgeUnlocked, {},
      '2026 n’a aucun badge enregistré : elle ne doit PAS voir ceux de 2025');
    assert.deepEqual(manualBadges, {},
      'idem pour les badges manuels');
  });

  test('la sauvegarde de la nouvelle saison n’écrit pas les badges de l’ancienne', () => {
    setCurrentSeason(2025);
    localStorage.setItem('f1uno_auto_badges_2025', JSON.stringify({ collector_10: 1 }));
    loadManualBadges();

    setCurrentSeason(2026);
    loadManualBadges();
    saveManualBadges();                       // ce qu'un déblocage déclenche
    const ecrit = JSON.parse(localStorage.getItem('f1uno_auto_badges_2026') || '{}');
    assert.deepEqual(ecrit, {},
      'la clé 2026 ne doit pas recevoir collector_10 — c’était la corruption permanente');
  });

  test('le retour à la saison d’origine retrouve ses badges intacts', () => {
    setCurrentSeason(2025);
    localStorage.setItem('f1uno_auto_badges_2025', JSON.stringify({ collector_10: 1, fan_5: 1 }));
    loadManualBadges();
    setCurrentSeason(2026);
    loadManualBadges();
    saveManualBadges();
    setCurrentSeason(2025);
    loadManualBadges();
    assert.deepEqual(Object.keys(autoBadgeUnlocked).sort(), ['collector_10', 'fan_5'],
      'l’étanchéité ne doit pas se payer par une perte à l’aller-retour');
  });

  test('une clé illisible vide l’état, elle ne le laisse pas traîner', () => {
    setCurrentSeason(2025);
    localStorage.setItem('f1uno_auto_badges_2025', JSON.stringify({ collector_10: 1 }));
    loadManualBadges();
    setCurrentSeason(2026);
    localStorage.setItem('f1uno_auto_badges_2026', '{ pas du JSON');
    loadManualBadges();
    assert.deepEqual(autoBadgeUnlocked, {},
      'le catch remet à zéro — il ne doit pas laisser l’état de la saison précédente');
  });
});

/* ── Le motif, ailleurs dans le dépôt ──
   Balayage fait à la main : les trois autres chargements par saison
   sont sains, chacun pour une raison DIFFÉRENTE. Ce test le fige,
   pour qu'une régression sur l'un d'eux se voie. */
describe('le même motif ailleurs — vérifié, pas supposé', () => {
  const src = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');

  test('storage.js loadData() a bien son else', () => {
    assert.match(src('storage.js'), /if\(s\) \{[\s\S]*?\} else \{[\s\S]*?coll=\{\};/,
      'la collection doit être remise à zéro quand la clé de saison est absente');
  });

  test('badges.js loadSelectedTitle() remet à zéro AVANT de lire', () => {
    assert.match(src('badges.js'), /function loadSelectedTitle\(\)\{\s*\n\s*selectedTitleId = null;/,
      'le titre est réinitialisé en tête de fonction — pas d’héritage possible');
  });

  test('history.js et le badge épinglé relisent le stockage à chaque appel', () => {
    assert.match(src('history.js'), /export function getHistory\(\)\{[\s\S]{0,200}secureGet\(_storageKey\('history'\)\)/,
      'aucun cache de module : rien à faire fuir');
    assert.match(src('badges.js'), /export function getPinnedBadge\(\)\{ return localStorage\.getItem/,
      'idem pour le badge épinglé');
  });
});
