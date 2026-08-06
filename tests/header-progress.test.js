/* ══════════════════════════════════════════════════════════
   HEADER PROGRESS — the header counter shows owned/total in
   every language, and computeStats feeds it a coherent pct.
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import '../translations.js';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

const LANG_CODES = ['en', 'fr', 'es', 'zh', 'it', 'nl', 'de'];

describe('header progress counter (owned/total)', () => {
  test('header.total has {o} and {n} placeholders in all 7 languages', () => {
    for (const lang of LANG_CODES) {
      const dict = window.__T[lang];
      assert.ok(dict, `missing language ${lang}`);
      const s = dict['header.total'];
      assert.ok(s, `missing header.total for ${lang}`);
      assert.ok(s.includes('{o}/{n}'), `header.total for ${lang} must show "{o}/{n}", got "${s}"`);
    }
  });

  test('header.total_aria exists in all 7 languages', () => {
    for (const lang of LANG_CODES) {
      assert.ok(window.__T[lang]['header.total_aria'], `missing header.total_aria for ${lang}`);
    }
  });
});
