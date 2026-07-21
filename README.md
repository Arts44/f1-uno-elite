🇬🇧 **English** · [🇫🇷 Français](README.fr.md) · [🇪🇸 Español](README.es.md) · [🇨🇳 中文](README.zh.md) · [🇮🇹 Italiano](README.it.md) · [🇳🇱 Nederlands](README.nl.md) · [🇩🇪 Deutsch](README.de.md)

# 🏎️ F1 UNO Élite — Collection Tracker

**An offline-first, installable trading-card collection tracker built with vanilla JavaScript and zero runtime dependencies — no framework, no SDK, no CDN, no backend required.**

[![tests](https://github.com/Arts44/f1-uno-elite/actions/workflows/tests.yml/badge.svg)](https://github.com/Arts44/f1-uno-elite/actions/workflows/tests.yml)
![License: MIT](https://img.shields.io/badge/license-MIT-green)
![PWA](https://img.shields.io/badge/PWA-installable%20%2B%20offline%20%E2%9C%93-brightgreen)
![Zero runtime deps](https://img.shields.io/badge/runtime%20dependencies-0-blue)
![Vanilla JS](https://img.shields.io/badge/JavaScript-vanilla-f7df1e?logo=javascript&logoColor=black)
![i18n](https://img.shields.io/badge/languages-7-purple)

## ▶️ **[Try it live → arts44.github.io/f1-uno-elite](https://arts44.github.io/f1-uno-elite/)**

It's a **PWA**: install it from your browser and it runs like a native app, fully offline, with its own icon — on desktop and mobile.

![Collection grid — dark theme](screenshots/grid-desktop-dark.jpg)

| Card detail — animated foil types | Stats dashboard |
|---|---|
| ![Card modal](screenshots/modal-dark.jpg) | ![Stats view](screenshots/stats-light.jpg) |

<sub>More captures in [`screenshots/`](screenshots/) — light/dark themes, mobile.</sub>

---

## ✨ What it does

Track a complete **F1 UNO Élite** trading-card collection (101 cards, each in up to 16 variants — base colours, foils, duals, Wild, Nitro, promos):

- 📇 **Full collection management** — owned / doubles / wishlist / favourites, with per-variant quantities, instant search and deep filtering.
- ✨ **Animated 6-level rarity system** — `epic → legendary → mythic → ultra → cosmic → divine`, computed automatically from the best owned variant; foil cards carry live light-sweep visuals and the top tier renders as a shifting iridescent gradient (all respecting `prefers-reduced-motion`).
- 📴 **Works fully offline** — the whole app is precached by a service worker; after the first visit, airplane mode changes nothing.
- 🔄 **Transparent auto-updates** — new versions are detected in the background and applied with one tap on a discreet banner, plus an in-app changelog ("what's new since *your* last version").
- 🌍 **7 languages** — English, French, Spanish, Chinese, Italian, Dutch, German. Every string, badge and changelog entry.
- 🎓 **Interactive 26-step tutorial** — a guided tour where you *perform* the real actions, running in a sandbox that reverts every change when it ends.
- 🏅 **50 badges & titles** — 25 unlocked automatically from measured conditions, 25 self-declared.
- 📊 **Stats dashboard** — global progress, rarity donut, per-category completion, highlights, and a day-by-day progression curve (pure SVG, no chart library).
- 🔁 **Backups everywhere** — JSON export/import, a compressed device-to-device **backup code**, the same code as a scannable **QR link**, and an optional **cloud backup** (Supabase).
- 🔐 **PIN lock, viewer mode & optional encryption** — a 4-digit PIN (SHA-256), a read-only sharing mode, and opt-in at-rest encryption of the collection (PBKDF2 + AES-GCM, keyed off the PIN — native Web Crypto).
- 🤝 **Collector tools** — printable missing / doubles / trade lists to take to a swap meet.
- 💬 **In-app feedback** — signed-in users can send suggestions or bug reports straight from Settings.

---

## 🛠️ Tech stack

| Area | Choice |
|---|---|
| Language | **Vanilla JavaScript** (native ES modules), HTML5, CSS3 — no framework |
| Runtime dependencies | **Zero.** No npm packages, no CDN, no SDK at runtime |
| Build | [esbuild](https://esbuild.github.io/) (the *only* devDependency) → one minified IIFE bundle |
| Offline / PWA | Hand-written Service Worker (versioned precache, cache-first shell) + Web App Manifest |
| Cloud (optional) | **Supabase over raw REST `fetch()`** — no SDK; OTP email auth, Row Level Security |
| Crypto | Native **Web Crypto** — SHA-256 (PIN), PBKDF2 + AES-GCM (optional at-rest encryption) |
| QR codes | Vendored single-file encoder ([Project Nayuki](https://www.nayuki.io/page/qr-code-generator-library), MIT) |
| Fonts | Self-hosted WOFF2 (SIL OFL) — no Google Fonts request, 5 switchable font themes |
| Tests | **Node's built-in test runner** (`node --test`) — 166 tests, no test framework |
| CI | GitHub Actions — tests + build + committed-bundle freshness check on every push/PR |

**Zero runtime dependencies is a design rule, not an accident.** Everything a framework or SDK would normally provide — rendering, routing between views, i18n, offline caching, auth over REST, encryption, QR generation — is implemented directly on web platform APIs. The app you install is exactly the code in this repo.

---

## 🧗 Technical challenges

The problems that actually shaped this codebase, and how they were solved:

### Offline-first *and* always up to date
**Problem:** a cache-first service worker makes the app bulletproof offline — and excellent at serving stale code forever. Installed PWAs are worst hit: they can stay open for days without a navigation, so the browser never re-checks the worker on its own.
**Solution:** the new worker downloads in the background and deliberately parks in the *waiting* state (no auto `skipWaiting`— swapping the shell under a running app is how you corrupt state). The app shows a one-tap "new version — reload" banner that promotes it via a `SKIP_WAITING` message; ignored banners resolve on the next cold start. Installed PWAs additionally call `registration.update()` on every return to the foreground and hourly. The app version is derived from the newest changelog entry, so releasing *is* writing the changelog — version and history cannot drift apart.

### Email sign-in that survives an installed PWA
**Problem:** classic magic-link auth breaks in installed PWAs: the link opens in the default browser — a different storage partition — so the session lands where the app isn't.
**Solution:** authentication uses **email OTP codes** as the primary path: the code is typed into the app itself, so the session is created in the right context every time. The magic link still works as a browser-side bonus. The whole GoTrue flow (send, verify, refresh, expiry margin) is implemented over raw `fetch()` — no Supabase SDK.

### A service worker that never touches the API
**Problem:** a precaching service worker that intercepts everything will happily serve a cached API response — a silent data-corruption bug that only appears in production.
**Solution:** the worker excludes the Supabase origin entirely (requests fall through untouched), and cloud calls also send `cache: 'no-store'`. Belt and braces, verified by tests.

### A CSS refactor proven identical, byte for byte
**Problem:** migrating hundreds of hard-coded spacing values to design tokens with "it looks the same to me" as the only guarantee.
**Solution:** exact-match substitution only (no rounding to the nearest token), then a proof: resolve every `var()` in both the before and after stylesheets down to pixel values and byte-compare the two — mathematically identical rendering, off-scale values left untouched and inventoried for a later, deliberate pass.

### Feedback with email notifications — without a server
**Problem:** the maintainer wants an email for each piece of in-app feedback, but there is no backend to send one.
**Solution:** a Postgres trigger on the `feedback` table calls the Resend API through `pg_net`, entirely inside Supabase. The API key lives encrypted in the Supabase Vault (never in this repo), user content is HTML-escaped, and a failing email can never block the insert. Client-side: a cooldown; server-side: an SQL throttle (max 5/hour per user) enforced by trigger.

### 7 languages with no i18n library
**Problem:** every user-facing string — UI, badges, tutorial, changelog entries, error messages — in 7 languages, without a framework to enforce discipline.
**Solution:** a tiny `t()` helper over dictionary files, `data-i18n` attributes for static markup, and unit tests that fail if a changelog entry ever misses one of the 7 languages. English is the declared fallback; a hard project rule says an English-only string is an incomplete change.

### Testing a browser app without a browser
**Problem:** keeping a zero-dependency promise rules out Jest, Vitest and headless-browser harnesses.
**Solution:** the logic was factored to be browser-free (rarity math, storage migration, backup encoding, stats, badges, encryption, cloud helpers, update logic…) and is covered by **166 tests on Node's built-in runner** — zero test dependencies, no real network (every cloud test stubs `fetch`). CI also rebuilds the bundle and fails if the committed artifact is stale, so the deployed code provably matches the sources.

---

## 🚀 Getting started

A modern browser and any static HTTP server (`file://` won't do — ES modules and JSON `fetch()` are blocked there).

```bash
# Development — no build step, raw ES modules:
python3 -m http.server 8000
# → http://localhost:8000/index-dev.html

# Production bundle:
npm install     # installs esbuild, the only devDependency
npm run build   # app.js → app.bundle.js (minified + sourcemap)
# → http://localhost:8000/  (index.html)

# Tests:
npm test        # 166 tests, node --test, no framework
```

### Deployment

The repo deploys **as-is** to GitHub Pages (static, no server build): every URL is relative, so the app runs identically at a domain root, under a sub-path, and on localhost. The built bundle is committed because Pages runs no npm step; CI verifies it never goes stale. Release routine: add a changelog entry (that *is* the version bump) → bump `SW_VERSION` in `sw.js` → build → push. Returning visitors get the update banner.

---

## ⚖️ Honest limits

- **The PIN is an interface barrier, not strong security.** Without the optional encryption, the collection is readable in `localStorage` via DevTools. With encryption on, casual snooping is blocked — but a 4-digit PIN can be brute-forced offline by someone holding the device. It protects against opportunistic peeking, not experts. A forgotten PIN makes an encrypted local collection unrecoverable — keep backups.
- **Cloud sign-in runs on a test email domain.** Auth and feedback emails are currently sent through default/test sender domains with tight rate limits — fine for a personal project, not production-grade email delivery. A custom SMTP/domain would lift this.
- **Progression history has no back-fill** — the stats curve starts the day the feature was installed; there is no per-card timestamp to reconstruct the past from.

---

## 📜 License & trademarks

Released under the **MIT License** — see [LICENSE](LICENSE). © 2026 Arthur.

> "F1" and "UNO", along with team/driver logos and images, are the property of their respective owners. This is an **unofficial**, personal collection-tracking tool, not affiliated with, endorsed by, or sponsored by Formula 1, Mattel, or any team.
