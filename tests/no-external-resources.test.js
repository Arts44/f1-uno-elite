/* ══════════════════════════════════════════════════════════
   ZÉRO RESSOURCE EXTERNE (v2.3) — garde-fou.

   L'app hotlinkait 33 fichiers : les logos F1/UNO depuis Wikimedia
   et 31 photos/logos depuis formula1.com. Trois problèmes en un :
   des marques déposées dans une app qui se déclare fan project,
   une dépendance réseau dans une app qui se dit auto-hébergée, et
   un « hors-ligne » qui n'en était pas un (rien n'était précaché).

   Ces tests échouent si un seul revient.
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// Hôtes autorisés : documentation, schémas, et le backend cloud opt-in.
// Aucun n'est chargé comme ressource par la page.
const ALLOWED = [
  'www.w3.org', 'schemas.', 'github.com/Arts44', 'arts44.github.io',
  'supabase.co', 'www.nayuki.io',
];
const isAllowed = url => ALLOWED.some(a => url.includes(a));

const SHIPPED = [
  'index.html', 'index-dev.html', 'styles.css', 'manifest.webmanifest',
  'app.js', 'render.js', 'pin.js', 'data.js', 'storage.js', 'badges.js',
  'stats.js', 'account.js', 'cloud.js', 'otp-input.js', 'tutorial.js',
  'install.js', 'update.js', 'backup.js', 'sw.js', 'data-embedded.js',
];

describe('aucune URL externe dans les fichiers livrés', () => {
  for (const f of SHIPPED) {
    test(f, () => {
      const urls = (read(f).match(/https?:\/\/[^"'`)\s]+/g) || []).filter(u => !isAllowed(u));
      assert.deepEqual(urls, [], `${f} référence une ressource externe`);
    });
  }
});

describe('les données ne portent plus de lien distant', () => {
  test('metadata.json : ni logos d’écurie ni photos de pilotes', () => {
    const meta = JSON.parse(read('data/metadata.json'));
    assert.equal('teamLogos' in meta, false, 'teamLogos doit avoir disparu');
    assert.equal('driverImages' in meta, false, 'driverImages doit avoir disparu');
    assert.equal(/https?:\/\//.test(JSON.stringify(meta)), false);
  });

  test('les 10 écuries ont un monogramme, et il couvre exactement teamColors', () => {
    const meta = JSON.parse(read('data/metadata.json'));
    assert.deepEqual(Object.keys(meta.teamMonograms).sort(),
                     Object.keys(meta.teamColors).sort(),
      'une écurie sans monogramme retomberait sur un visuel vide');
    for (const [team, mono] of Object.entries(meta.teamMonograms)) {
      assert.match(mono, /^[A-Z]{2,3}$/, `${team} : monogramme court et lisible attendu`);
    }
  });

  test('cards-2025.json ne porte aucune image distante', () => {
    const cards = JSON.parse(read('data/cards-2025.json'));
    const list = Array.isArray(cards) ? cards : cards.cards;
    const ext = list.filter(c => String(c.image || '').startsWith('http'));
    assert.deepEqual(ext, []);
  });
});

describe('le rendu ne fabrique plus de balise <img> distante', () => {
  test('render.js : plus de driver-img ni de team-logo', () => {
    const src = read('render.js');
    assert.equal(/driver-img|team-logo/.test(src), false);
    assert.match(src, /team-mono/, 'les écuries passent par le monogramme');
  });

  test('le lockup typographique remplace les logos sur toutes les surfaces', () => {
    for (const f of ['index.html', 'index-dev.html']) {
      const s = read(f);
      assert.match(s, /class="lockup lk-lg"/, `${f} : écran de connexion`);
      assert.match(s, /class="lockup lk-hd"/, `${f} : header`);
      assert.equal(/login-duo|logo-duo|login-f1|logo-uno/.test(s), false,
        `${f} : plus aucun reste du duo de logos`);
    }
    // pin.js : langue, setup, saisie du PIN de setup, overlay admin
    const pin = read('pin.js');
    assert.equal((pin.match(/class="lockup lk-lg"/g) || []).length, 4);
    assert.equal(/login-duo|login-f1|login-uno/.test(pin), false);
  });

  test('le CSS ne garde aucune règle des anciens logos', () => {
    const css = read('styles.css');
    assert.equal(/\.login-duo|\.logo-duo|\.driver-img|\.team-logo/.test(css), false);
    assert.match(css, /\.lockup\{/);
    assert.match(css, /\.team-mono\{/);
  });
});
