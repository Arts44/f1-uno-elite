/* ══════════════════════════════════════════════════════════
   CAPTURE_SCREENSHOTS.PY — le script de gel visuel ne doit pas
   pouvoir échouer en silence.

   Vécu : check_seed_honesty() levait une exception et mourait AVANT
   le rapport final. Tout ce qui précédait — dont le contrôle
   anti-collision des tuiles Éternel — n'était jamais rapporté,
   pendant que le script affichait une trentaine de lignes « OK ».
   Un contrôle qui échoue sans le dire est pire qu'un contrôle
   absent : il donne la confiance sans la vérification.

   Ces tests sont en JS parce que la suite du dépôt l'est (node
   --test) : ils lisent le script Python comme du texte, ce qui
   suffit pour tenir les deux invariants qui comptent.
   ══════════════════════════════════════════════════════════ */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const py = readFileSync(new URL('../capture_screenshots.py', import.meta.url), 'utf8');

describe('capture_screenshots.py — échec bruyant', () => {
  test('un rapport final s’affiche à la sortie, quoi qu’il arrive', () => {
    assert.match(py, /^import atexit/m, 'atexit n’est plus importé');
    assert.match(py, /@atexit\.register/, 'le rapport de sortie a disparu');
    assert.match(py, /RAPPORT INCOMPLET/,
      'sans ce message, une mort prématurée passe pour un succès');
    assert.match(py, /os\._exit\(1\)/,
      'le code de sortie doit rester non nul même depuis atexit');
  });

  test('_REACHED_END n’est vrai qu’APRÈS le dernier contrôle', () => {
    const poses = [...py.matchAll(/^_REACHED_END = True$/gm)];
    assert.equal(poses.length, 1, '_REACHED_END est posé à plusieurs endroits');
    const avant = py.slice(0, poses[0].index);
    assert.match(avant, /check_seed_honesty\(sync_playwright\)/,
      'le drapeau est posé avant que tous les contrôles aient tourné');
  });

  test('aucune f-string Python dans un corps JS passé à evaluate()', () => {
    // La cause exacte du plantage : f'f1uno_auto_badges_{SEASON}' écrit
    // dans une chaîne NON préfixée f — Python ne l’interpole pas, et le
    // navigateur lit du JS invalide. Les valeurs passent en argument.
    for (const m of py.matchAll(/evaluate\("""([\s\S]*?)"""/g)) {
      assert.ok(!/[^\w]f['"]/.test(m[1]),
        'syntaxe f\'...\' de Python dans un corps JS : elle ne sera pas '
        + 'interpolée, et le navigateur lèvera une SyntaxError.\n' + m[1].slice(0, 200));
    }
  });
});

/* ── Le SEED est un module, plus un script qu'on exécute ────────
   capture_demos.py récupérait le seed en exécutant la moitié de
   capture_screenshots.py (`exec(compile(...))` sur un découpage par
   commentaire). Ça marchait ; c'était fragile — le découpage tenait à
   une chaîne de commentaire — illisible, et signalé à juste titre par
   trois analyseurs (Bandit B102, PyLint W0122, Semgrep exec-detected). */
describe('scripts de capture — pas d’exec, pas de shell', () => {
  const demos = readFileSync(new URL('../capture_demos.py', import.meta.url), 'utf8');
  const seed = readFileSync(new URL('../capture_seed.py', import.meta.url), 'utf8');

  test('aucun exec() dans les scripts de capture', () => {
    for (const [nom, src] of [['capture_demos.py', demos], ['capture_screenshots.py', py]]) {
      assert.ok(!/\bexec\s*\(/.test(src), `${nom} : exec() est revenu`);
    }
  });

  test('le seed est importé, pas rejoué', () => {
    assert.match(demos, /^from capture_seed import /m);
    assert.match(py, /^from capture_seed import /m);
  });

  test('capture_seed.py ne fait QUE des données — rien à l’import', () => {
    assert.ok(!/sync_playwright|\.screenshot\(|subprocess/.test(seed),
      'importer le seed ne doit ouvrir aucun navigateur et n’écrire aucun fichier');
  });

  test('ffmpeg est appelé sans shell, avec une liste d’arguments', () => {
    assert.match(demos, /shell=False/);
    assert.ok(!/shell\s*=\s*True/.test(demos), 'jamais de shell=True');
  });

  test('aucun except silencieux', () => {
    assert.ok(!/except[^\n]*:\s*\n\s*pass\b/.test(demos),
      'un except qui avale sans rien dire est la même faute que le rapport muet');
  });
});
