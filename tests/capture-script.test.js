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
