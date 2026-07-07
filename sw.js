/* ══════════════════════════════════════════════════════════
   SERVICE WORKER — offline support for F1 UNO Élite
   - App shell: precached at install (versioned cache), cache-first.
   - External assets (Google Fonts, Wikimedia/F1 images): runtime
     stale-while-revalidate in a separate cache (NOT precached —
     too many/dynamic, referenced from metadata).
   Bump SW_VERSION on every release to invalidate the old shell.
   ══════════════════════════════════════════════════════════ */
const SW_VERSION = 'v15';
const SHELL_CACHE = `f1uno-shell-${SW_VERSION}`;
const RUNTIME_CACHE = 'f1uno-runtime';

// App shell — everything needed to boot fully offline.
// Relative paths so the SW works from a sub-folder (e.g. GitHub Pages).
const SHELL_ASSETS = [
  './',
  'index.html',
  'index-dev.html',
  'styles.css',
  'manifest.webmanifest',
  'favicon.ico',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'screenshots/desktop-collection.png',
  'screenshots/mobile-collection.png',
  // Production bundle
  'app.bundle.js',
  // Raw ES modules (dev entry point, index-dev.html)
  'app.js',
  'logger.js',
  'i18n.js',
  'data.js',
  'storage.js',
  'history.js',
  'render.js',
  'stats.js',
  'badges.js',
  'pin.js',
  'backup.js',
  'qrcodegen.js',
  'onboarding.js',
  // Classic global scripts
  'data-embedded.js',
  'translations.js',
  'card-descriptions.js',
  // Data
  'data/metadata.json',
  'data/circuits.json',
  'data/badges.json',
  'data/cards-2025.json',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      // cache:'reload' bypasses the browser HTTP cache so a version bump
      // always precaches the CURRENT files from the server, never stale
      // heuristically-cached copies.
      .then(cache => cache.addAll(SHELL_ASSETS.map(u => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys
        .filter(k => k.startsWith('f1uno-shell-') && k !== SHELL_CACHE)
        .map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  if (sameOrigin) {
    // App shell & local data: cache-first, network fallback.
    // Navigations fall back to the cached start page when offline.
    event.respondWith(
      caches.match(req, { ignoreSearch: true }).then(cached => {
        if (cached) return cached;
        return fetch(req)
          .then(resp => {
            // Cache-on-fetch for same-origin misses (e.g. future cards-2026.json)
            if (resp && resp.ok) {
              const copy = resp.clone();
              caches.open(SHELL_CACHE).then(c => c.put(req, copy));
            }
            return resp;
          })
          .catch(() => {
            if (req.mode === 'navigate') return caches.match('./');
            return Response.error();
          });
      })
    );
    return;
  }

  // External assets (fonts, logos, driver images…):
  // stale-while-revalidate in a separate runtime cache.
  event.respondWith(
    caches.open(RUNTIME_CACHE).then(cache =>
      cache.match(req).then(cached => {
        const network = fetch(req)
          .then(resp => {
            // Opaque (no-cors) responses are fine to cache for images/fonts
            if (resp && (resp.ok || resp.type === 'opaque')) {
              cache.put(req, resp.clone());
            }
            return resp;
          })
          .catch(() => cached); // offline: fall back to cache (or fail)
        return cached || network;
      })
    )
  );
});
