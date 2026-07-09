# 🏎️ F1 UNO Élite — Collection Tracker

> A client-side web app for tracking your **F1 UNO Élite** trading-card collection: manage owned cards, doubles, wishlist and favourites, unlock badges, and follow your completion stats — fully offline, with no backend.
>
> **Live app:** <https://arts44.github.io/f1-uno-elite/> (GitHub Pages)

![License: MIT](https://img.shields.io/badge/license-MIT-green)
![Vanilla JS](https://img.shields.io/badge/JavaScript-vanilla-f7df1e?logo=javascript&logoColor=black)
![ES Modules](https://img.shields.io/badge/ES%20modules-yes-blue)
![Build: esbuild](https://img.shields.io/badge/build-esbuild-ffcf00)
![PWA](https://img.shields.io/badge/PWA-installable%20%2B%20offline%20%E2%9C%93-brightgreen)
![i18n](https://img.shields.io/badge/languages-7-purple)

---

## 📋 Overview

**F1 UNO Élite — Collection Tracker** is a 100% client-side single-page app (no application server, no database) that helps a collector track their F1 UNO Élite trading cards. Each card exists in several **types / variants** (Blue, Green, Red, Yellow and their *foil* versions, plus Nitro, Wild, Promo…), and the app lets you record, per variant, whether it is owned, a double, wishlisted or a favourite, with a quantity counter.

All progress is stored **locally in the browser** (`localStorage`), with JSON export / import for backup and transfer between devices.

The codebase is plain **HTML / CSS / vanilla JavaScript** with no UI framework and **zero runtime dependencies**. The source is authored as native **ES modules** from a single entry point, `app.js`. For production, those modules are bundled into one classic script (`app.bundle.js`) with **esbuild**; during development the unbundled modules can be loaded directly (see [Installation](#-installation--usage)).

---

## ✨ Features

### Collection
- **Card grid** that can be filtered and sorted (by number, name, rarity, category).
- **Per-variant tracking**: each card manages its types (Blue, Red, Foil, Nitro…) independently, each with an *owned / double / wishlist / favourite* status and a **quantity**.
- **Automatic rarity** on a **6-level scale** — `epic · legendary · mythic · ultra · cosmic · divine` (there is no common/rare anymore). A base rarity is derived per role/champion and foils climb the ladder (simple foil +1, dual +2, wild/promo/nitro +3, clamped at divine). The palette is saturated and distinct per level, and the top rarity **divine** renders as a slowly shifting **iridescent animated gradient** (respecting `prefers-reduced-motion`), everywhere its colour appears (chips, labels, stats). The type-pill visual ladder is a separate scale (`typeBadgeStyles`) and is not affected.
- **Instant search** (with a results dropdown and input debouncing).
- **Advanced filters** in a floating sidebar: status, category (pilote, reserve, directeur, gp), card type, rarity, year, champions-only, and favourites pinned to the top.
- **RETIRED badge** shown on cards for drivers who are no longer active.

### Badges & titles
- **50 badges** split into **automatic** (unlocked from measured conditions: number of cards owned, wishlist, doubles, favourites, completed categories, champions, types…) and **manual** (self-declared, e.g. "I attended a Grand Prix"). Currently **25 automatic + 25 manual**.
- **Title system** unlocked by badges and milestones, displayed on the profile.
- Preview of the cards contributing to a badge, plus unlock animations (sparkles/particles).

### Stats
- **Dashboard**: overall progress, breakdown by rarity, team, category and card type, with completion rates.
- **Progression over time**: a pure-SVG line chart of owned cards per day. One point is recorded per day on each collection change (`history.js`, capped at 365 points). With fewer than two points it shows a "the curve will build over time" message instead of an empty graph.
  > ⚠️ **The history only starts the day this feature was installed.** Past progress cannot be reconstructed — there is no back-fill — so the curve begins empty and grows from your first change onward.
- **Highlights**: your **rarest owned card** and the card with the **most total copies**, computed live from the current collection (empty collection shows a friendly placeholder). "Last added" is intentionally not shown — no per-card timestamp is stored.
- **Rarity chart**: a pure-SVG donut of owned cards by rarity, using the shared rarity colours (the divine segment gets an animated iridescent gradient), with a legend.
- **Unified colour design**: the stat tiles carry a clear, vivid semantic palette (owned = green, wishlist = amber, doubles = blue, missing = red, favourites = pink, copies = purple), and everything rarity-related reuses the single rarity palette — contrast-checked in light **and** dark themes.

### Multi-season
- **Season selector** in the header. The listed seasons are **2025** plus any season already present in your `localStorage` (i.e. seasons you have saved data for). Switching season loads the matching `data/cards-<year>.json`.
- Progress is **scoped per season** in `localStorage`, with automatic migration from the old un-scoped format (v1 → v2).

### Security & access modes
- **PIN lock** (4 digits) hashed with **SHA-256** via the Web Crypto API.
- **Viewer mode** (read-only) to share your collection without risking edits; write actions are blocked and an admin PIN screen switches back to full access.
- Basic console-bypass protection.

### PWA — installable & offline
- **Web App Manifest** (`manifest.webmanifest`): installable to the home screen / dock (standalone display). Icons 192/512 px declared `any maskable`, plus **screenshots** (a `wide` desktop and a `narrow` mobile capture) so browsers can show the richer install UI. A **favicon** (`favicon.ico`) is served too.
- **Service Worker** (`sw.js`): the app shell (HTML, CSS, all JS modules + the bundle, the `data/` JSON files, icons, screenshots, favicon and the default + driver-number fonts) is **precached at install** under a versioned cache and served **cache-first** — after the first visit the app loads and works fully offline.
- External assets (team/driver images from formula1.com, the Wikimedia F1/UNO logos) are cached at runtime (*stale-while-revalidate*) in a separate cache, so previously-seen images also work offline. **Fonts are self-hosted** and same-origin, so they fall under the shell cache — not an external dependency.
- Old shell caches are cleaned up automatically when a new Service Worker version activates.
- **Guided install experience** (`install.js`): on Chrome/Edge/Android the `beforeinstallprompt` event is captured and surfaced as a native **Install** button in Settings plus a discreet, dismissable banner (a refusal is remembered — `f1uno_install_dismissed` — so it never nags). Browsers without the event get **platform-specific manual instructions** (iOS Safari: Share → Add to Home Screen, incl. iPadOS masquerading as macOS; macOS Safari: File → Add to Dock; Chromium: address-bar icon; Android menu; generic fallback) — and **Arc** (which has no install support and hides behind a Chrome UA) is detected via its injected `--arc-palette-*` CSS variables and gets an honest "open this in Chrome/Edge/Safari" message instead of instructions pointing at a nonexistent icon. Everything hides when the app already runs standalone.

### Collector tools
- **Shareable lists** generated from the current collection, in **Settings → Collector tools** — to bring to a swap meet or a trade:
  - **Missing cards** — every card you don't own yet, grouped by category, with rarity and a ⭐ mark for wishlisted ones.
  - **Doubles to trade** — cards flagged as doubles, with the exact duplicated types and copy counts.
  - **Trade list** — a combined "looking for / offering" sheet.
- Each is a plain, readable **text** block shown in a box with a **Copy** button (no file, no upload); the selection logic (`collector.js`) is pure and unit-tested.

### Data & backup
- **JSON export / import** of the collection (merge or replace on import).
- **Backup code** (device-to-device, no file, no server): generate a short code (collection compressed with `CompressionStream` and base64url-encoded), copy it, paste it on another device to restore — with the same merge/replace choice as the file import. Codes also work embedded in a link (`…#backup=<code>`). Everything stays client-side.
- **QR code transfer**: the backup code can also be shown as a **QR code** (encoding the `…#backup=<code>` link). Scan it with the target device to open the app and trigger the restore automatically — no typing, no camera scanner built into the app, no backend. Generated locally with a vendored QR encoder (no CDN). If the collection is too large to fit a reliably-scannable QR, the UI shows a fallback message pointing to the text code or JSON export instead of an unreadable QR.
- **Backup reminder**: after 30 saved changes or 14 days without a backup, a toast nudges you to export or generate a code.
- **Offline embedded fallback** (`data-embedded.js`): if the JSON files cannot be fetched, the app boots from data baked into the page.

### User experience
- **Interactive tutorial**: a 26-step guided tour (spotlight + bubble) that has you *perform* the real actions — add a card, count doubles, filter, validate/remove badges, read the stats, tour the settings. Runs in a **sandbox**: every change made during the tour is reverted on finish or quit, so your collection is untouched. Two escape hatches on every step (*skip this step* / *quit tutorial*, plus Esc). Auto-starts once after setup (`f1uno_onboarded` flag; existing installs are flagged silently), replayable anytime from Settings. Themed light + dark, translated in all 7 languages.
- **Internationalisation (i18n)**: 7 languages — 🇬🇧 English, 🇫🇷 French, 🇪🇸 Spanish, 🇨🇳 Chinese, 🇮🇹 Italian, 🇳🇱 Dutch, 🇩🇪 German.
- **First-launch language chooser**: before the PIN setup, a language-neutral screen (7 native language names + the prompt shown in all 7 languages at once — no wrong-language flash) lets you pick the language; setup and tutorial then run in it. Shown only when no language was ever chosen; existing installs never see it. The Settings selector remains the normal way to switch later.
- **Self-hosted fonts + font picker**: all fonts are bundled locally as WOFF2 (no CDN). **Settings → Font** offers **5 themes** — *Circuit* (default), *Sprint*, *Prestige*, *Minimal*, *Original* — each a display + body pairing, applied instantly and persisted (`f1uno_font`, re-applied before render to avoid a flash). The default pair is precached; the others download on first use and then work offline. **Driver numbers keep their own fixed identity fonts** (Orbitron / Racing Sans One) and are deliberately *not* affected by the picker.
- **Light / dark theme**, persisted and applied before render to avoid a flash of the wrong theme.
- **Responsive design** from small phones (~320 px) to desktop — including the top bar, where the search field shrinks and secondary badges hide instead of overlapping — with a bottom tab bar (Collection / Badges / Stats / Settings).
- **Inline SVG circuit outlines** on Grand Prix cards.
- Accessibility care (ARIA roles, `aria-live` regions, keyboard navigation, PIN keypad support).

---

## 🛠️ Tech & dependencies

| Area | Choice |
|---|---|
| **Language** | Vanilla JavaScript (ES modules, ES6+), HTML5, CSS3 |
| **Framework** | None (native DOM, zero runtime dependencies) |
| **Build** | [esbuild](https://esbuild.github.io/) — bundles `app.js` + the modules into `app.bundle.js` (IIFE, minified, with sourcemap). Optional in dev, where the raw modules run unbundled. |
| **Storage** | Browser `localStorage` |
| **Offline / PWA** | Service Worker (versioned precache, cache-first shell, runtime cache for external assets) + Web App Manifest |
| **Crypto** | Web Crypto API (SHA-256 for the PIN); `CompressionStream` for backup codes |
| **QR** | `qrcodegen.js` — vendored QR encoder ([Project Nayuki](https://www.nayuki.io/page/qr-code-generator-library), **MIT**), trimmed to byte-mode + SVG output |
| **Data** | Static JSON files (+ an embedded JS copy for the offline fallback) |
| **Fonts** | **Self-hosted** WOFF2 (latin subset) in `fonts/`, all **SIL OFL** (see `fonts/LICENSES`) — Space Grotesk, Inter, Chakra Petch, IBM Plex Sans, Fraunces, Source Sans 3, Manrope, Syne, DM Sans (UI themes) + Orbitron & Racing Sans One (driver-number identity) |
| **Tests** | Node's built-in test runner (`node --test`) — no test framework installed |
| **External assets** | F1/UNO logos (Wikimedia), team logos & driver photos (formula1.com) |

> **No npm/CDN runtime dependencies.** The only tooling dependency is **esbuild** (a `devDependency` in `package.json`); the test runner is built into Node. Fonts are **self-hosted** locally (no Google Fonts request), each under the SIL Open Font License (`fonts/LICENSES`). One third-party source file is *vendored* into the repo — `qrcodegen.js`, the QR encoder by Project Nayuki (MIT, provenance and licence noted in the file header) — so QR generation works fully offline without pulling anything at runtime.

---

## 🚀 Installation & usage

### Requirements
A modern browser **and a local HTTP server**. Node.js is only needed if you want to (re)build the production bundle.

> ⚠️ **A local HTTP server is required.** Opening the page directly from the filesystem (`file://`, i.e. double-clicking) does **not** work properly:
> - the development entry point (`index-dev.html`) loads native **ES modules**, which browsers block over `file://` for CORS/security reasons;
> - even the bundled `index.html` cannot `fetch()` the `data/*.json` files over `file://`, so it would only ever run in a degraded mode using the **embedded fallback** (`data-embedded.js`) — a single baked-in season, no dynamic data loading.
>
> Serve the folder over HTTP and everything (module loading, `data/` fetching, season switching) works. The embedded fallback still applies whenever a JSON fetch fails.

### Option A — run from source, no build (development)

Serve the folder and open **`index-dev.html`**, which loads the unbundled ES modules directly:

```bash
# With Python
python3 -m http.server 8000

# or with Node.js
npx serve .
```

Then open **http://localhost:8000/index-dev.html**.

### Option B — build the production bundle

`index.html` loads `app.bundle.js`, a single minified IIFE bundle produced by esbuild. Generate it, then serve the folder:

```bash
npm install          # installs esbuild (the only devDependency)
npm run build        # bundles app.js -> app.bundle.js (minified + sourcemap)
# npm run dev        # same, unminified, rebuilt on change (watch mode)

python3 -m http.server 8000
```

Then open **http://localhost:8000/** (i.e. `index.html`).

> `app.bundle.js` is a generated artifact — after editing any `*.js` module, re-run `npm run build` (or keep `npm run dev` running) to refresh it.

### Option C — deploy to GitHub Pages

GitHub Pages serves this folder **as-is** (no server-side build), from a sub-path. This repo **is** deployed that way: **<https://arts44.github.io/f1-uno-elite/>**. What makes it work:

- **All URLs are relative** — HTML assets, `manifest.webmanifest` (`start_url`/`scope` = `./`), the service-worker registration (`sw.js`, scope = the sub-folder) and its precache list, and every `fetch()` in the code. Nothing starts with `/`, so the app works identically at the domain root, under a sub-path, and on localhost.
- **The built bundle is committed** (`app.bundle.js` + sourcemap) precisely because Pages runs no `npm` step. Rebuild it before every commit that touches a JS source (`npm run build`); a local git *pre-commit* hook automates this in this working copy (rebuild + `git add app.bundle.js*` whenever a staged JS source changed — hooks aren't versioned, so recreate it after a fresh clone).
- **Publishing**: push the repo to GitHub, then *Settings → Pages → Source: Deploy from a branch → Branch: `main` / root*. The site appears at `https://<user>.github.io/<repo>/` after a minute or two.
- **Updates**: the service worker precaches the app shell version-tagged by `SW_VERSION` (in `sw.js`). Bump it on every release — visitors get the new version on their **second** load (first load serves the cached shell while the new worker installs and replaces the old cache).
- **Release routine**: edit sources → `npm run build` (the local pre-commit hook also enforces this) → bump `SW_VERSION` if any precached file changed → commit → `git push`. Pages redeploys automatically in ~1–2 minutes.

### Tests

The unit test suite uses **Node's built-in test runner** (`node --test`) — no test framework is installed, keeping the zero-runtime-dependency promise intact (esbuild remains the only devDependency).

```bash
npm test             # run the whole suite once
npm run test:watch   # re-run on file change
```

Tests live in `tests/` (one file per module) and run against small self-contained fixtures (`tests/_fixtures.js`), not the real `data/` files — except a few assertions that deliberately validate the real `metadata.json` / `data-embedded.js` parity. A minimal browser shim (`tests/_setup.js`) provides `localStorage` and a null-object `document`; no rendering is simulated.

**Covered** (logic only, no browser):
- **Rarity** — `baseCardRarity` / `variantRarity` (foil bonuses, index clamp) / `cardRarity` (best owned variant, qty-0 edge cases), plus the 6-rarity scale integrity in the real metadata and its embedded fallback.
- **Storage migration** — legacy v1 keys → season-scoped v2 keys, idempotence, no-overwrite, corrupted-data fallback.
- **Backup codes** — snapshot → compress → base64url round-trip, `#backup=` link format, rejection of corrupted/invalid codes, size threshold (`tooBig`).
- **Stats** — `computeStats()` aggregates (owned/wishlist/doubles/missing/favorites, copies, %) on a known fixture collection, `rarityTextColor` contrast picks.
- **Badges** — `evaluateBadgeCondition` for every metric, target clamping, unlock persistence (`isAutoBadgeUnlocked`).
- **History** — one point per day (same-day updates in place), 365-point cap, corrupted-data fallback.
- **Collector tools** — `missingCards` (incl. the qty-0-owned edge and the wishlist subset), `doublesList` (duplicated types + qty), `tradeList`.
- **Tutorial** — localStorage snapshot/restore round-trip on a non-empty collection (data safety), step-sequence integrity (unique ids, pedagogical order, condition-based close steps, the force-remove badge step).
- **Install** — platform detection from real user-agent fixtures (iPhone/iPad/iPadOS-desktop/mac Safari/Chrome/Edge/Android/Firefox), instruction-key routing incl. the Arc case, standalone detection.
- **Language gating** — the first-launch language screen shows only when no language was ever chosen and setup isn't done.

**Not covered — tested manually in the browser**: DOM rendering (grid, modal, sidebar, stats views), Service Worker / offline behavior, PWA install, QR code visual output, theming/font-switching/animations, the interactive tutorial's DOM engine (its snapshot/restore and step sequence *are* covered), and the collector-tools UI (its selection logic *is* covered above).

### First run
1. On first launch, a **language chooser** appears first (7 languages), then a setup screen lets you optionally define a **PIN code** (or skip it), followed by the **interactive tutorial** (auto-starts only once; replayable from Settings) — all in the chosen language.
2. Navigate between **Collection / Badges / Stats / Settings** via the bottom bar.
3. Mark owned variants from a card's detail modal.
4. Optionally pick a **font theme** and language in **Settings**.
5. Export your collection to JSON — or generate a **backup code / QR** — from **Settings** regularly to back it up.

### Install as an app (PWA) & offline use
- On the **first load** over http/https, `app.js` registers the Service Worker, which precaches the app shell. From the **next load** on, the page itself is served from cache and the app works **fully offline** (a reload after the first visit is enough to be under Service Worker control).
- **Settings → Install the app** offers a native **Install** button where the browser supports it (Chrome/Edge/Android; a discreet banner appears too), and correct manual instructions elsewhere (iOS/macOS Safari, Android menu, an honest message in Arc). It then runs standalone with its own icon.
- Note for maintainers: assets are served **cache-first**, so after changing any shell file, bump `SW_VERSION` in `sw.js` — the new worker re-precaches everything (bypassing the browser HTTP cache, so it always fetches the current files) and drops the old cache on activation.
- The Service Worker does not register on `file://` (the `'serviceWorker' in navigator` guard skips it) — that's expected; serve over HTTP.

### Move your collection to another device (backup code / QR)
1. On the source device: **Settings → Backup code → 🔑 Generate**, then either **Copy the code** or **📱 QR code**.
2. Transfer it:
   - **By code**: send the text code to yourself (it's compressed + base64url, typically a few hundred characters; nothing is uploaded anywhere) and, on the target device, **Settings → Restore from code → 📋 Paste a code**.
   - **By QR**: scan the displayed QR with the target device — it opens the app via a `#backup=` link and starts the restore automatically.
3. Either way, choose **merge** or **replace** in the dialog (same flow as the JSON file import).
4. If your collection is too large for a practical code (> 4 000 characters) or a reliably-scannable QR, the UI tells you and points you to the **JSON file export** instead.

### Adding a new season
1. Create `data/cards-2026.json` with the same structure as `cards-2025.json`.
2. Update `data/metadata.json` if new teams/drivers appear.
3. Because the header only lists 2025 plus seasons you already have saved data for, a brand-new season also needs to become reachable in the UI (e.g. once data for it exists in `localStorage`, its pill appears and `switchSeason` fetches the new file).

---

## 📁 File structure

The app source is split into focused **ES modules** loaded from the `app.js` entry point. Three global helper scripts (`data-embedded.js`, `translations.js`, `card-descriptions.js`) are loaded as classic scripts *before* the app, since they expose `window` globals the modules read. For production these modules are bundled by esbuild into `app.bundle.js`.

```
F1/
├── index.html            # Production markup; loads the bundled app.bundle.js
├── index-dev.html        # Dev markup; loads app.js as native ES modules (no build)
├── styles.css            # Styles (themes, grid, cards, responsive)
├── manifest.webmanifest  # Web App Manifest (installable PWA, relative start_url/scope)
├── sw.js                 # Service worker: versioned precache, cache-first shell,
│                         #   stale-while-revalidate runtime cache for external assets
├── favicon.ico           # Favicon (16/32/48, derived from the app icon)
├── icons/                # App icon: icon.svg (source) + icon-192/512.png exports (any maskable)
├── screenshots/          # Manifest install screenshots (desktop-* wide, mobile-* narrow)
├── fonts/                # Self-hosted WOFF2 (UI + driver-number fonts) + LICENSES (SIL OFL)
│
├── app.js                # ES module entry point: initApp, initEvents, startup, SW registration
├── logger.js             # DEBUG-gated logger (log()/warn() are no-ops in prod)
├── i18n.js               # Languages, t(), applyLanguage()
├── data.js               # Static DB constants + JSON loaders + season switching
├── storage.js            # localStorage, collection state, card/rarity helpers, import/export
├── backup.js             # Backup code + QR (compress/encode, decode/validate, #backup= link, reminder)
├── qrcodegen.js          # Vendored QR encoder (Project Nayuki, MIT) — byte mode + SVG
├── history.js            # Daily owned-count snapshots for the Stats progression curve
├── collector.js          # Missing / doubles / trade-list selection logic (pure, tested)
├── tutorial.js           # Interactive guided tour (sandboxed, auto once, replayable)
├── install.js            # PWA install helper (native prompt, banner, per-platform/Arc instructions)
├── badges.js             # Badge evaluation/rendering + user titles
├── stats.js              # computeStats() + updateStats() + renderStats() (progression, highlights, donut)
├── render.js             # Grid, sidebar, filters, modal, search, views, toast
├── pin.js                # Auth/PIN, viewer & admin modes, settings (backup/QR, font picker, collector tools)
│
├── app.bundle.js         # Generated esbuild bundle (+ app.bundle.js.map)
├── package.json          # esbuild build/dev + test scripts, devDependency (esbuild only)
│
├── translations.js       # i18n dictionaries (7 languages) → window.__T / window.__BADGE_T
├── card-descriptions.js  # Card description texts → window.__CARD_DESC / getCardDesc()
├── data-embedded.js      # Embedded data for the offline fallback → window.__F1UNO_EMBEDDED
├── extract_data.mjs      # Dev tool: data extraction/generation
│
├── tests/                # node --test suites + fixtures (_setup.js, _fixtures.js)
├── LICENSE               # MIT
└── data/
    ├── metadata.json     # Static config (types, rarities, teams, drivers…)
    ├── cards-2025.json   # 101 cards for the 2025 season
    ├── circuits.json     # SVG circuit outlines
    └── badges.json       # 50 badges (25 auto + 25 manual) and their conditions
```

> **Debug logging** is centralised in `logger.js` behind a `DEBUG` flag (`export const DEBUG = false`). With `DEBUG` off, `log()`/`warn()` are no-ops, so production emits no debug output. Genuine error logging (`console.error`/`console.warn`) is preserved.

### Data formats (summary)

- **`metadata.json`** — `cardTypes`, `rarities`/`rarityKeys`/`rarityOrder` (6 levels: epic…divine), `typeBadgeRarity` + `typeBadgeStyles` (the separate type-pill colour/star ladder), `categories`, `driverNumbers`, `teamColors`, `teamLogos`, `driverImages`, `teamLogoBg`, `teamLogoNoeffects`, `roleBaseRarity`.
- **`cards-XXXX.json`** — array of cards: `id`, `season`, `number`, `name`, `team`, `category`, `nationality`, `champion`, `championYears`, `description`, `tags`, `types[]`, `retired`.
- **`badges.json`** — `auto[]` (each with a `condition`: `metric`, `operator`, `value`, optional `typeFilter`) and `manual[]`.

**Available badge condition metrics:** `owned_count`, `wishlist_count`, `doubles_count`, `favorite_count`, `total_qty`, `category_owned`, `champion_owned`, `type_owned`.

### `localStorage` versioning

| Version | Keys | Description |
|---|---|---|
| v1 | `f1uno_v3`, `f1uno_badges`, `f1uno_auto_badges` | Old format (no season scope) |
| v2 | `f1uno_owned_2025`, `f1uno_badges_2025`, `f1uno_auto_badges_2025`, `f1uno_history_2025` | Season-scoped format (incl. the Stats progression history) |

Shared (non-scoped) keys: `f1uno_theme`, `f1uno_lang`, `f1uno_font`, `f1uno_title`, `f1uno_version`, `f1uno_onboarded`, PIN/viewer keys (`f1uno_pin_enabled`, `f1uno_pin_hash`, `f1uno_setup_done`, `f1uno_viewer_enabled`), and backup-reminder keys (`f1uno_last_backup`, `f1uno_changes_since_backup`) and `f1uno_install_dismissed` (install banner opt-out). Migration v1 → v2 runs automatically on first load.

---

## 🔮 Roadmap

The following is **not yet implemented** and is the main remaining work:

### Optional cloud sync — *decision pending*
**Status:** a full design document exists — [docs/CLOUD-SYNC-DESIGN.md](docs/CLOUD-SYNC-DESIGN.md) — covering backend options (all compatible with static GitHub Pages hosting), a sync/conflict model reusing the existing merge/replace flow, security/privacy, and a phased implementation plan. **No code has been written**: the honest assessment is that the existing backup code + QR already covers occasional device-to-device transfer, and a real sync only pays off with regular multi-device editing. Implementation awaits an explicit go/no-go decision.

> Already shipped, not part of the roadmap: ES-module split of the former monolith, `DEBUG`-gated logging, esbuild production bundle, a **`node --test` unit-test suite**, **installable offline PWA** (manifest with maskable icons + screenshots, favicon, service worker), **device-to-device backup codes + QR transfer**, the **enriched Stats view** (progression curve, highlights, rarity donut) with a unified colour redesign, the **6-level rarity system** with the animated iridescent *divine* tier, **self-hosted fonts with a 5-theme picker**, the **interactive guided tutorial**, and **collector tools** (missing / doubles / trade lists).

---

## 📜 License

Released under the **MIT License** — see [LICENSE](LICENSE). © 2026 Arthur.

> **Trademark note:** "F1" and "UNO", along with team/driver logos and images, are the property of their respective owners. This project is an **unofficial**, personal/educational collection-tracking tool and is not affiliated with, endorsed by, or sponsored by Formula 1, Mattel, or any team.
