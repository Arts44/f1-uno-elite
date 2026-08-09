/* ══════════════════════════════════════════════════════════
   REGISTRES DE CLÉS — cohérence entre ce que le code ÉCRIT et ce
   que les registres DÉCLARENT.

   Le dépôt a trois listes qui décrivent le stockage :
     · DATA_KEY_RE   (secure-store.js) — ce que le chiffrement couvre
     · SEASON_KEY_RE (storage.js)      — ce qui appartient à une saison
     · tutorialKeys()(tutorial.js)     — ce que le tutoriel restaure

   Une clé oubliée dans l'un d'eux ne provoque aucune erreur visible :
   elle laisse simplement une donnée en clair, non effacée, ou non
   restaurée après le tutoriel. C'est exactement le genre de trou que
   les tests doivent tenir, faute de pouvoir le voir à l'œil.

   Ces tests lisent les SOURCES : ils échouent si une clé apparaît
   dans le code sans être classée ici.
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DATA_KEY_RE } from '../secure-store.js';
import { SEASON_KEY_RE, _storageKey } from '../storage.js';
import { tutorialKeys } from '../tutorial.js';

const SEASON = 2025;

/* Les six familles scoppées par saison, telles que le code les
   fabrique via _storageKey() ou en gabarit littéral. */
const SEASON_FAMILIES = ['owned', 'badges', 'auto_badges', 'history', 'title', 'pinned_badge'];

/* Clés d'APPAREIL : une seule valeur, toutes saisons confondues.
   Inventaire exhaustif, tenu à la main — le test ci-dessous vérifie
   qu'aucune clé du code n'en sort. */
const DEVICE_KEYS = [
  // préférences d'affichage
  'f1uno_theme', 'f1uno_lang', 'f1uno_font',
  // état de première visite / bandeaux
  'f1uno_setup_done', 'f1uno_onboarded', 'f1uno_tut_skipped',
  'f1uno_install_dismissed', 'f1uno_qa_hint', 'f1uno_seen_version',
  // sécurité locale
  'f1uno_pin_enabled', 'f1uno_pin_hash', 'f1uno_viewer_enabled',
  // chiffrement au repos
  'f1uno_enc_enabled', 'f1uno_enc_salt', 'f1uno_enc_check',
  // rappel de sauvegarde + choix d'inclusion
  'f1uno_last_backup', 'f1uno_changes_since_backup',
  'f1uno_backup_inc_prefs', 'f1uno_backup_inc_sec',
  // session cloud (jeton — ne doit JAMAIS voyager dans une sauvegarde)
  'f1uno_cloud_session',
  // schéma de stockage
  'f1uno_version',
  // clés héritées, uniquement LUES par la migration puis effacées
  'f1uno_v3', 'f1uno_badges', 'f1uno_auto_badges', 'f1uno_title', 'f1uno_sort',
];

describe('registres de clés — périmètres', () => {
  test('DATA_KEY_RE couvre les quatre familles chiffrées, et rien d\'autre', () => {
    ['owned', 'badges', 'auto_badges', 'history'].forEach(f => { assert.ok(DATA_KEY_RE.test(`f1uno_${f}_${SEASON}`), f); });
    ['title', 'pinned_badge'].forEach(f => {
      assert.ok(!DATA_KEY_RE.test(`f1uno_${f}_${SEASON}`),
        `${f} n'est pas chiffré : il ne contient qu'un identifiant public`);
    });
    DEVICE_KEYS.forEach(k => { assert.ok(!DATA_KEY_RE.test(k), k); });
  });

  test('SEASON_KEY_RE est un surensemble strict de DATA_KEY_RE', () => {
    SEASON_FAMILIES.forEach(f => { assert.ok(SEASON_KEY_RE.test(`f1uno_${f}_${SEASON}`), f); });
    DEVICE_KEYS.forEach(k => {
      assert.ok(!SEASON_KEY_RE.test(k),
        `${k} est une clé d'appareil : l'effacement de collection doit l'épargner`);
    });
  });

  test('SEASON_KEY_RE exige une année, pas n\'importe quel suffixe', () => {
    assert.ok(!SEASON_KEY_RE.test('f1uno_owned_'));
    assert.ok(!SEASON_KEY_RE.test('f1uno_owned_abc'));
    assert.ok(SEASON_KEY_RE.test('f1uno_owned_2026'));
  });

  test('_storageKey() produit bien des clés reconnues par SEASON_KEY_RE', () => {
    SEASON_FAMILIES.forEach(f => {
      const k = _storageKey(f);
      assert.ok(SEASON_KEY_RE.test(k), `${f} → ${k}`);
    });
    // …sauf les deux réglages d'appareil, qui restent nus
    assert.equal(_storageKey('theme'), 'f1uno_theme');
    assert.equal(_storageKey('version'), 'f1uno_version');
  });

  test('tutorialKeys() couvre TOUTES les familles de saison', () => {
    const keys = tutorialKeys(SEASON);
    SEASON_FAMILIES.forEach(f => {
      assert.ok(keys.includes(`f1uno_${f}_${SEASON}`),
        `le tutoriel ne restaurerait pas f1uno_${f}_${SEASON}`);
    });
  });
});

/* ── Inventaire : aucune clé du code hors des deux catégories ──
   On relit les sources livrées et on extrait tout littéral f1uno_*.
   Chaque occurrence doit être soit une clé d'appareil connue, soit le
   préfixe d'une famille de saison. Une clé nouvelle fait échouer ce
   test tant qu'elle n'a pas été classée — c'est le but. */
describe('inventaire localStorage — aucune clé hors registre', () => {
  const SOURCES = [
    'storage.js', 'badges.js', 'history.js', 'backup.js', 'pin.js',
    'tutorial.js', 'settings-sync.js', 'secure-store.js', 'cloud.js',
    'install.js', 'update.js', 'session.js', 'i18n.js', 'data.js',
    'render.js', 'stats.js', 'app.js', 'feedback.js',
  ];

  test('toute clé f1uno_* du code est classée', () => {
    const unknown = new Set();
    for(const file of SOURCES){
      let src;
      try { src = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'); }
      catch { continue; }   // module optionnel absent : rien à inventorier
      // Le lookbehind écarte le marqueur de charge chiffrée
      // `{"__f1uno_enc"` : ce n'est pas une clé de stockage.
      for(const m of src.matchAll(/(?<![_a-z0-9])f1uno_[a-z0-9_]+/g)){
        const k = m[0];
        if(DEVICE_KEYS.includes(k)) continue;
        // Préfixe d'une famille de saison : `f1uno_owned_` suivi de
        // l'interpolation de l'année, capté ici sans son suffixe.
        if(SEASON_FAMILIES.some(f => k === `f1uno_${f}` || k === `f1uno_${f}_`)) continue;
        if(SEASON_KEY_RE.test(k)) continue;
        // Préfixe technique du chiffrement (clés orphelines mises de côté)
        if(k.startsWith('f1uno_enc_orphan')) continue;
        unknown.add(`${file}: ${k}`);
      }
    }
    assert.deepEqual([...unknown], [],
      'clés non classées — ajoute-les à DEVICE_KEYS ou à SEASON_FAMILIES');
  });

  /* Les clés fabriquées par _storageKey('x') n'apparaissent pas comme
     littéraux : elles échappent au balayage ci-dessus. On inventorie
     donc aussi les ARGUMENTS de _storageKey, qui doivent tous être
     soit une famille de saison, soit l'un des deux réglages nus. */
  test('tout argument de _storageKey() est une famille connue', () => {
    const seen = new Set();
    for(const file of SOURCES){
      let src;
      try { src = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'); }
      catch { continue; }
      for(const m of src.matchAll(/_storageKey\(\s*'([a-z0-9_]+)'/g)) seen.add(m[1]);
    }
    assert.ok(seen.size > 0, 'le balayage doit trouver des appels');
    const allowed = new Set([...SEASON_FAMILIES, 'theme', 'version']);
    assert.deepEqual([...seen].filter(n => !allowed.has(n)), []);
  });
});
