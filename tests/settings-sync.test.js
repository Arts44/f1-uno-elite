import './_setup.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetStorage } from './_setup.js';
import { installFixtures, seedCollection, SAMPLE_COLL } from './_fixtures.js';
import {
  gatherSettings, applySettings, backupIncludes, setBackupIncludes,
  PREF_KEYS, SECURITY_KEYS,
} from '../settings-sync.js';
import { collectionSnapshot, loadData, _showImportDialog } from '../storage.js';

function seedDeviceSettings(){
  localStorage.setItem('f1uno_lang', 'fr');
  localStorage.setItem('f1uno_theme', 'dark');
  localStorage.setItem('f1uno_font', 'prestige');
  localStorage.setItem('f1uno_title', 'legend');
  localStorage.setItem('f1uno_pin_enabled', 'true');
  localStorage.setItem('f1uno_pin_hash', 'abc123hash');
  localStorage.setItem('f1uno_viewer_enabled', 'true');
}

describe('settings-sync — gather (export side)', () => {
  beforeEach(() => resetStorage());

  test('gathers only the requested categories', () => {
    seedDeviceSettings();
    const both = gatherSettings({ prefs: true, security: true });
    assert.deepEqual(both.prefs, { lang: 'fr', theme: 'dark', font: 'prestige', title: 'legend' });
    assert.deepEqual(both.security, { pinEnabled: 'true', pinHash: 'abc123hash', viewerEnabled: 'true' });
    const prefsOnly = gatherSettings({ prefs: true });
    assert.ok(prefsOnly.prefs && !prefsOnly.security);
  });

  test('absent keys are omitted; nothing gathered → null (no settings field)', () => {
    localStorage.setItem('f1uno_lang', 'de'); // only one pref exists
    const s = gatherSettings({ prefs: true, security: true });
    assert.deepEqual(s, { prefs: { lang: 'de' } }); // no security section at all
    assert.equal(gatherSettings({}), null);
    resetStorage();
    assert.equal(gatherSettings({ prefs: true, security: true }), null);
  });
});

describe('settings-sync — snapshot integration + backward compatibility', () => {
  beforeEach(() => { resetStorage(); installFixtures(); seedCollection(SAMPLE_COLL); loadData(); });

  test('no include → historical shape, NO settings field', () => {
    const snap = collectionSnapshot();
    assert.deepEqual(Object.keys(snap).sort(), ['autoBadges', 'exportDate', 'manualBadges', 'owned', 'season']);
  });

  test('include prefs → settings.prefs present, collection unchanged', () => {
    seedDeviceSettings();
    const snap = collectionSnapshot({ prefs: true });
    assert.equal(snap.settings.prefs.lang, 'fr');
    assert.ok(!snap.settings.security);
    assert.ok(snap.owned.P1); // collection payload untouched
  });

  test('include everything but nothing stored → still NO settings field', () => {
    const snap = collectionSnapshot({ prefs: true, security: true });
    assert.ok(!('settings' in snap));
  });
});

describe('settings-sync — apply (import side, partial choices)', () => {
  beforeEach(() => resetStorage());
  const SETTINGS = {
    prefs: { lang: 'it', theme: 'dark', font: 'sprint', title: 'champion' },
    security: { pinEnabled: 'true', pinHash: 'newhash', viewerEnabled: 'false' },
  };

  test('prefs only: security keys untouched', () => {
    localStorage.setItem('f1uno_pin_hash', 'devicehash');
    const applied = applySettings(SETTINGS, { prefs: true, security: false });
    assert.deepEqual(applied, { prefs: true, security: false });
    assert.equal(localStorage.getItem('f1uno_lang'), 'it');
    assert.equal(localStorage.getItem('f1uno_font'), 'sprint');
    assert.equal(localStorage.getItem('f1uno_pin_hash'), 'devicehash'); // NOT replaced
  });

  test('security only: prefs untouched, PIN replaced', () => {
    localStorage.setItem('f1uno_lang', 'nl');
    const applied = applySettings(SETTINGS, { prefs: false, security: true });
    assert.deepEqual(applied, { prefs: false, security: true });
    assert.equal(localStorage.getItem('f1uno_lang'), 'nl');      // NOT replaced
    assert.equal(localStorage.getItem('f1uno_pin_hash'), 'newhash');
    assert.equal(localStorage.getItem('f1uno_viewer_enabled'), 'false');
  });

  test('nothing chosen / old backup without settings: no-op, never throws', () => {
    assert.deepEqual(applySettings(SETTINGS, {}), { prefs: false, security: false });
    assert.deepEqual(applySettings(undefined, { prefs: true }), { prefs: false, security: false });
    assert.deepEqual(applySettings(null, { prefs: true, security: true }), { prefs: false, security: false });
    assert.equal(localStorage.getItem('f1uno_lang'), null);
  });

  test('malformed settings values are skipped (only strings applied)', () => {
    applySettings({ prefs: { lang: 42, theme: 'dark' } }, { prefs: true });
    assert.equal(localStorage.getItem('f1uno_lang'), null);
    assert.equal(localStorage.getItem('f1uno_theme'), 'dark');
  });
});

describe('settings-sync — remembered export choice', () => {
  beforeEach(() => resetStorage());
  test('defaults: prefs ON, security OFF; choices persist', () => {
    assert.deepEqual(backupIncludes(), { prefs: true, security: false });
    setBackupIncludes({ prefs: false, security: true });
    assert.deepEqual(backupIncludes(), { prefs: false, security: true });
    setBackupIncludes({ security: false });
    assert.deepEqual(backupIncludes(), { prefs: false, security: false });
  });
});

describe('settings-sync — key coverage', () => {
  test('categories cover exactly the intended localStorage keys', () => {
    assert.deepEqual(Object.values(PREF_KEYS).sort(),
      ['f1uno_font', 'f1uno_lang', 'f1uno_theme', 'f1uno_title']);
    assert.deepEqual(Object.values(SECURITY_KEYS).sort(),
      ['f1uno_pin_enabled', 'f1uno_pin_hash', 'f1uno_viewer_enabled']);
    // the cloud session token must NEVER be part of any category
    const all = [...Object.values(PREF_KEYS), ...Object.values(SECURITY_KEYS)];
    assert.ok(!all.includes('f1uno_cloud_session'));
  });
});
