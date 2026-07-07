/* ══════════════════════════════════════════════════════════
   TEST SETUP — minimal browser shims so the app's ES modules
   can be imported under Node (node --test). Import this file
   FIRST in every test file, before any app module.

   Only what the import graph actually touches is shimmed:
   - localStorage (full mock, resettable)
   - a null-object document (every getElementById is null-guarded
     in the app, so returning null is enough)
   - window/navigator/location stubs
   No rendering is simulated — DOM output is out of scope here.
   ══════════════════════════════════════════════════════════ */

class LocalStorageMock {
  constructor(){ this._m = new Map(); }
  getItem(k){ return this._m.has(k) ? this._m.get(k) : null; }
  setItem(k, v){ this._m.set(String(k), String(v)); }
  removeItem(k){ this._m.delete(k); }
  clear(){ this._m.clear(); }
  key(i){ return [...this._m.keys()][i] ?? null; }
  get length(){ return this._m.size; }
}

const noop = () => {};
const nullEl = null;

if (!globalThis.localStorage) {
  globalThis.localStorage = new LocalStorageMock();
}

if (!globalThis.document) {
  globalThis.document = {
    getElementById: () => nullEl,
    querySelector: () => nullEl,
    querySelectorAll: () => [],
    addEventListener: noop,
    removeEventListener: noop,
    createElement: () => ({
      style: {}, classList: { add: noop, remove: noop, contains: () => false },
      setAttribute: noop, appendChild: noop, remove: noop,
      addEventListener: noop, querySelector: () => nullEl, querySelectorAll: () => [],
      dataset: {},
    }),
    documentElement: { setAttribute: noop, getAttribute: () => null, lang: 'en' },
    body: { appendChild: noop, classList: { add: noop, remove: noop } },
  };
}

if (!globalThis.window) globalThis.window = globalThis;
if (!globalThis.navigator) globalThis.navigator = {};
if (!globalThis.location) {
  globalThis.location = {
    origin: 'https://example.test',
    pathname: '/f1uno/',
    hash: '',
    search: '',
    href: 'https://example.test/f1uno/',
  };
}
// i18n reads window.__T; an empty table makes t() return the key itself.
if (!globalThis.window.__T) globalThis.window.__T = {};

/** Reset persisted state between tests. */
export function resetStorage(){ globalThis.localStorage.clear(); }
