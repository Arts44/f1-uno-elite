/* ══════════════════════════════════════════════════════════
   SERVICE WORKER — offline support for F1 UNO Élite
   - App shell: precached at install (versioned cache), cache-first.
   - External assets (Google Fonts, Wikimedia/F1 images): runtime
     stale-while-revalidate in a separate cache (NOT precached —
     too many/dynamic, referenced from metadata).
   Bump SW_VERSION on every release to invalidate the old shell.
   ══════════════════════════════════════════════════════════ */
const SW_VERSION = 'v38';
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
  // Fonts: only the default theme + the driver-number identity fonts are
  // precached (~100 KB). The other font themes download on first use
  // (Settings preview / selection) and land in the same cache via the
  // same-origin cache-on-fetch below — offline once chosen.
  'fonts/space-grotesk-var.woff2',
  'fonts/inter-var.woff2',
  'fonts/orbitron-var.woff2',
  'fonts/racing-sans-one-400.woff2',
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
  'tutorial.js',
  'collector.js',
  'install.js',
  'cloud.js',
  'settings-sync.js',
  'update.js',
  'changelog.js',
  // Classic global scripts
  'data-embedded.js',
  'translations.js',
  'cloud-config.js',
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
      // NO automatic skipWaiting: the new SW parks in "waiting" so the
      // page can show a "new version — reload" banner instead of having
      // the shell swapped under a running app. The page promotes it
      // explicitly with the SKIP_WAITING message below; if the banner is
      // ignored, the waiting SW activates naturally on the next cold
      // start (all clients closed).
  );
});

// Promotion requested by the page (update banner click).
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
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

  // Cloud API (Supabase): NEVER cached, NEVER served from cache.
  // Auth and data calls must always hit the network — a cached
  // /auth/v1/user or /rest/v1 response would be a correctness bug
  // (stale sessions, stale collections served as fresh).
  if (url.hostname.endsWith('.supabase.co') || url.hostname.endsWith('.supabase.in')) {
    return; // fall through to the network, no respondWith
  }

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
