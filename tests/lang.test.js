import './_setup.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetStorage } from './_setup.js';
import { needsLanguageChoice } from '../pin.js';

describe('first-launch language choice — gating', () => {
  beforeEach(() => resetStorage());

  test('fresh install (no setup, no lang): screen shown', () => {
    assert.equal(needsLanguageChoice(), true);
  });

  test('language already chosen: screen NOT shown', () => {
    localStorage.setItem('f1uno_lang', 'fr');
    assert.equal(needsLanguageChoice(), false);
  });

  test('existing install without a lang key (pre-feature): screen NOT shown', () => {
    localStorage.setItem('f1uno_setup_done', 'true');
    assert.equal(needsLanguageChoice(), false);
  });

  test('setup done AND lang set: screen NOT shown', () => {
    localStorage.setItem('f1uno_setup_done', 'true');
    localStorage.setItem('f1uno_lang', 'de');
    assert.equal(needsLanguageChoice(), false);
  });
});
