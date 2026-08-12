/* ══════════════════════════════════════════════════════════
   PRECACHE DU SERVICE WORKER (audit 1.42.2) — la liste de
   SHELL_ASSETS est maintenue À LA MAIN. Elle avait perdu
   otp-input.js, session.js et account.js entre 1.27 et 1.42 :
   quinze versions pendant lesquelles un rechargement hors ligne
   sur index-dev.html cassait, sans qu'aucun test ne le voie.

   Ce test rend l'oubli impossible : tout module livré doit être
   précaché, et toute entrée précachée doit exister sur le disque.
   ══════════════════════════════════════════════════════════ */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const sw = readFileSync(root + 'sw.js', 'utf8');

const SHELL = sw
  .slice(sw.indexOf('const SHELL_ASSETS'), sw.indexOf('self.addEventListener'))
  .match(/'([^']+)'/g)
  .map(s => s.slice(1, -1))
  .filter(s => s !== './');

// Les .js de la racine qui ne sont PAS des ressources du shell :
//  - app.bundle.js.map : servi à la demande par les devtools ;
//  - sw.js : le navigateur le récupère lui-même hors du cache — le
//    précacher figerait le service worker dans sa propre version et
//    empêcherait toute mise à jour.
const NOT_SHIPPED = new Set(['app.bundle.js.map', 'sw.js']);

describe('SHELL_ASSETS', () => {
  test('toute entrée précachée existe réellement sur le disque', () => {
    const missing = SHELL.filter(f => !existsSync(root + f));
    assert.deepEqual(missing, [], `entrées fantômes : ${missing.join(', ')}`);
  });

  test('tout module JS livré est précaché', () => {
    const shipped = readdirSync(root)
      .filter(f => f.endsWith('.js') && !NOT_SHIPPED.has(f));
    const notCached = shipped.filter(f => !SHELL.includes(f));
    assert.deepEqual(notCached, [], `modules livrés hors precache : ${notCached.join(', ')}`);
  });

  test('les deux points d’entrée HTML et leurs dépendances directes sont précachés', () => {
    for (const f of ['index.html', 'index-dev.html', 'styles.css', 'manifest.webmanifest', 'app.bundle.js']) {
      assert.ok(SHELL.includes(f), `${f} absent du precache`);
    }
  });

  test('chaque module importé par index-dev.html est précaché', () => {
    // index-dev charge app.js en module brut : c'est le graphe complet
    // qui doit être disponible hors ligne, pas seulement le bundle.
    const seen = new Set();
    const walk = file => {
      if (seen.has(file) || !existsSync(root + file)) return;
      seen.add(file);
      const src = readFileSync(root + file, 'utf8');
      for (const m of src.matchAll(/from\s+'\.\/([^']+)'/g)) walk(m[1]);
    };
    walk('app.js');
    const notCached = [...seen].filter(f => !SHELL.includes(f));
    assert.deepEqual(notCached, [], `graphe de modules hors precache : ${notCached.join(', ')}`);
    assert.ok(seen.size > 15, `graphe suspicieusement petit (${seen.size})`);
  });

  test('aucun doublon dans la liste', () => {
    const dupes = SHELL.filter((f, i) => SHELL.indexOf(f) !== i);
    assert.deepEqual([...new Set(dupes)], [], `doublons : ${dupes.join(', ')}`);
  });

  test('SW_VERSION est bien présent et versionné', () => {
    assert.match(sw, /const SW_VERSION = 'v\d+';/);
  });

  /* Le fichier de cartes de CHAQUE saison déclarée doit être précaché.
     Sans ça, une saison neuve n'est consultable hors ligne qu'après une
     première visite en ligne — et l'app affiche son état vide sur un
     appareil qui a pourtant tout le reste en cache. La liste des saisons
     vit dans metadata.json ; ce test la suit au lieu de la recopier. */
  test('chaque saison LIVRÉE a son fichier de cartes précaché', () => {
    const meta = JSON.parse(readFileSync(root + 'data/metadata.json', 'utf8'));
    const manquants = (meta.seasons || [])
      .filter(s => !s.test)
      .map(s => `data/cards-${s.year}.json`)
      .filter(f => !SHELL.includes(f));
    assert.deepEqual(manquants, [],
      `saisons livrées mais hors precache : ${manquants.join(', ')}`);
  });

  /* L'autre sens, et c'est celui qui compte pour la production : une
     saison de développement ne doit PAS être mise en cache hors ligne
     chez un visiteur. Sans ce test, ajouter `test: true` dans seasons[]
     en oubliant de retirer l'entrée du SHELL passerait inaperçu. */
  test('aucune saison de test n’entre dans le precache', () => {
    const meta = JSON.parse(readFileSync(root + 'data/metadata.json', 'utf8'));
    const intrus = (meta.seasons || [])
      .filter(s => s.test)
      .map(s => `data/cards-${s.year}.json`)
      .filter(f => SHELL.includes(f));
    assert.deepEqual(intrus, [],
      `saisons de test précachées : ${intrus.join(', ')}`);
  });
});
