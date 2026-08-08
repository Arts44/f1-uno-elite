import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// styles.css is not JS, but a whole class of bugs hides in it that no
// other test can catch: a `var(--foo)` whose token was never defined.
// CSS silently invalidates the entire declaration and falls back to the
// initial value — which is exactly how `padding:var(--space-7) …` on the
// dialogs collapsed to 0 after the spacing refactor named a token that
// the (deliberately sparse) scale never defined.
describe('styles.css custom properties', () => {
  const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');

  // Tokens supplied at runtime by JS (element.style.setProperty) rather
  // than declared in the sheet — legitimately "used but not defined".
  // --c1/--c2 : couleurs de livrée posées inline par liveryHTML() (render.js).
  const RUNTIME_SET = new Set(['--tc', '--rarc', '--px', '--py', '--dur', '--delay', '--logo-bg', '--c1', '--c2']);

  test('every var(--token) used is defined somewhere (or set at runtime)', () => {
    const defined = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1]));
    const used = new Set([...css.matchAll(/var\(\s*(--[\w-]+)/g)].map(m => m[1]));
    const missing = [...used].filter(t => !defined.has(t) && !RUNTIME_SET.has(t));
    assert.deepEqual(missing, [], `undefined CSS custom properties: ${missing.join(', ')}`);
  });

  test('the spacing scale defines every step it advertises being used', () => {
    // Guard specifically the --space-* family, since the refactor churns it.
    const defined = new Set([...css.matchAll(/(--space-[\w-]+)\s*:/g)].map(m => m[1]));
    const used = new Set([...css.matchAll(/var\(\s*(--space-[\w-]+)/g)].map(m => m[1]));
    for (const tok of used) {
      assert.ok(defined.has(tok), `${tok} is used but never defined in :root`);
    }
  });
});
