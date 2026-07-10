# CLAUDE.md — F1 UNO Élite · Collection Tracker

> **Read me first / À lire d'abord.** This file is the operating manual for any AI model working in this repo. It exists so a model can produce work indistinguishable from the maintainer's own, **without** the maintainer filling gaps from memory. It is **bilingual**: each section gives the rule in **English**, then a short **🇫🇷 FR** mirror for the parts that matter most. When English and French disagree, **English wins** (the code, filenames and commit history are English).
>
> **Ce fichier fait autorité.** Si tu ne trouves pas la réponse ici, lis le `README.md` (source de vérité détaillée), puis demande — ne devine pas sur les règles marquées **HARD RULE**.

---

## 1. What this project is / Ce que c'est

**F1 UNO Élite — Collection Tracker** is a 100 % client-side single-page PWA that lets a collector track their *F1 UNO Élite* trading-card collection: owned cards, doubles, wishlist, favourites, badges, titles and completion stats. **No backend, no database, no framework, no runtime dependencies.** State lives in the browser's `localStorage`; the app works fully offline once installed.

- **Live app:** https://arts44.github.io/f1-uno-elite/ (GitHub Pages, served static from `main`, root of `Collections/F1/`).
- **Repo:** `Arts44/f1-uno-elite` — the git root is the `Collections/F1/` folder, **not** the parent `ARC/` folder. All commands below assume you are in `Collections/F1/`.

🇫🇷 App 100 % côté client, hors-ligne, sans serveur ni framework. Le dépôt git est le dossier `Collections/F1/`. Toute progression est stockée dans `localStorage`.

---

## 2. HARD RULES — non-negotiable / Règles absolues

These are the rules that, if broken, ship a bug to production or violate the project's core promises. Treat every one as a blocker.

1. **Zero runtime dependencies. HARD RULE.** No npm packages, no CDN `<script>`/`<link>`, no framework, no SDK at runtime. The *only* dependency is `esbuild`, a `devDependency` used to bundle. Cloud calls use raw `fetch()` (no Supabase SDK). QR uses the vendored `qrcodegen.js`. Fonts are self-hosted WOFF2 — **never** add a Google Fonts request. If a task seems to need a library, stop and ask.
   🇫🇷 Aucune dépendance à l'exécution. Jamais de CDN, jamais de SDK. Seul `esbuild` (devDependency) est permis. Si une lib semble nécessaire → demander.

2. **All URLs must be relative. HARD RULE.** GitHub Pages serves from a sub-path (`/f1-uno-elite/`). Nothing may start with `/`. Every `fetch()`, asset href, `manifest.webmanifest` `start_url`/`scope`, and the service-worker registration/precache list uses `./` relative paths so the app runs identically at localhost, a domain root, and a sub-path. A leading-slash path is a bug.
   🇫🇷 URLs toujours relatives (`./`). Un chemin commençant par `/` casse GitHub Pages → c'est un bug.

3. **Rebuild the bundle after touching a bundled JS source. HARD RULE.** `app.bundle.js` (+ `.map`) is a **committed** artifact because Pages runs no build step. After editing any *bundled* root module, run `npm run build` and commit the regenerated bundle. The **bundled** sources are every root `*.js` **except** these classic (non-module) scripts, which are *not* bundled and need **no** rebuild: `sw.js`, `translations.js`, `data-embedded.js`, `card-descriptions.js`, `cloud-config.js` (and `app.bundle.js` itself). A local `.git/hooks/pre-commit` automates the rebuild, **but git hooks are not versioned** — after a fresh clone the hook is gone; recreate it or rebuild manually. Never commit a JS source change without the matching bundle.
   🇫🇷 Après édition d'un module *bundlé*, `npm run build` puis commit du bundle régénéré. Non-bundlés (pas de rebuild) : `sw.js`, `translations.js`, `data-embedded.js`, `card-descriptions.js`, `cloud-config.js`. Le hook pre-commit n'est pas versionné → le recréer après un clone.

4. **Bump `SW_VERSION` when any precached shell file changes. HARD RULE.** The service worker (`sw.js`) precaches the app shell **cache-first**. If you change any precached file (HTML, CSS, a bundled JS, a `data/*.json`, an icon, a font…) without bumping `SW_VERSION`, returning users keep the **stale** cached version forever. `SW_VERSION` is a single line near the top of `sw.js` (currently **`'v29'`**). Bump it (e.g. `v29` → `v30`) on any release that alters a precached file, and confirm the precache list still lists every shipped shell file.
   🇫🇷 Toute modif d'un fichier du shell précaché ⇒ incrémenter `SW_VERSION` dans `sw.js` (actuellement `v29`). Sinon les utilisateurs gardent l'ancienne version en cache.

5. **UI text goes through i18n, in all 7 languages. HARD RULE.** Never hard-code user-facing text. Add a key and call `t('my.key')` (JS) or `data-i18n="my.key"` (HTML). Every new key must be added for **all 7 languages** in `translations.js`: `en, fr, es, zh, it, nl, de`. English is the fallback; an English-only string is an incomplete change.
   🇫🇷 Aucun texte d'interface en dur. Ajouter la clé dans `translations.js` pour **les 7 langues** (`en, fr, es, zh, it, nl, de`) et utiliser `t()` / `data-i18n`.

6. **Debug logging only through `logger.js`. HARD RULE.** Use `log()` / `warn()` from `logger.js`; they are gated behind `export const DEBUG = false` and are **no-ops in production**. Never leave raw `console.log` for debugging. Genuine, always-on error reporting (`console.error`, and `console.warn` for real warnings) is fine and expected. Ship with `DEBUG = false`.
   🇫🇷 Debug via `log()`/`warn()` de `logger.js` (no-op en prod, `DEBUG=false`). Jamais de `console.log` de debug résiduel. `console.error` pour les vraies erreurs = OK.

7. **Cloud config: anon key only, never `service_role`. HARD RULE.** `cloud-config.js` holds the Supabase `url` + `anon` public key. These are public by design (protected by Row Level Security server-side). **Never** put the `service_role` key anywhere in the repo — it bypasses RLS. `cloud-config.js` is a classic script (not bundled): editing it needs no rebuild. Empty both values to fully disable cloud.
   🇫🇷 `cloud-config.js` : uniquement l'`url` + la clé `anon` (publiques, protégées par RLS). **Jamais** la clé `service_role` dans le repo.

8. **Serve over HTTP — never `file://`. HARD RULE (for running/testing).** ES-module loading and `fetch()` of `data/*.json` are both blocked over `file://`. Always serve the folder over a local HTTP server before testing.
   🇫🇷 Toujours servir en HTTP local ; `file://` casse les modules ES et le `fetch` des JSON.

---

## 3. Stack & architecture

| Area | Choice |
|---|---|
| Language | Vanilla JavaScript (ES modules, ES6+), HTML5, CSS3 — no framework |
| Entry point | `app.js` (ES module): init sequence, global event wiring, SW registration |
| Build | esbuild → `app.bundle.js` (IIFE, minified, sourcemap). `npm run build` / `npm run dev` (watch) |
| Runtime deps | **None** |
| Storage | Browser `localStorage`, season-scoped keys |
| PWA / offline | `sw.js` (versioned precache, cache-first shell, stale-while-revalidate for external images) + `manifest.webmanifest` |
| Crypto | Web Crypto `SHA-256` (PIN); `CompressionStream` (backup codes) |
| QR | Vendored `qrcodegen.js` (Project Nayuki, MIT) — byte mode + SVG |
| Cloud (optional) | Supabase via **raw REST `fetch()`** (GoTrue magic-link auth); gated on `cloud-config.js` being filled |
| Tests | Node's built-in runner: `node --test` (no test framework installed) |
| Fonts | Self-hosted WOFF2 in `fonts/` (SIL OFL) |

**Two HTML entry points:** `index-dev.html` loads raw ES modules (no build needed — use for development); `index.html` loads the built `app.bundle.js` (production / Pages).

**Classic scripts loaded *before* the modules** (they set `window` globals the modules read): `data-embedded.js` (`window.__F1UNO_EMBEDDED`), `translations.js` (`window.__T` / `window.__BADGE_T`), `card-descriptions.js` (`window.__CARD_DESC`), and `cloud-config.js` (`window.__F1UNO_CLOUD`).

🇫🇷 JS vanilla en modules ES, point d'entrée `app.js`, bundle esbuild. Deux HTML : `index-dev.html` (modules bruts, dev) et `index.html` (bundle, prod). Quatre scripts classiques chargés avant les modules exposent des globals `window.__*`.

---

## 4. Run · Build · Test — exact commands

Run everything **from `Collections/F1/`**.

```bash
# ── DEV (no build): serve, then open index-dev.html ──
python3 -m http.server 8123
#   → http://localhost:8123/index-dev.html   (raw ES modules)

# ── BUILD the production bundle ──
npm install          # first time only — installs esbuild (the sole devDependency)
npm run build        # app.js → app.bundle.js (minified + sourcemap)
npm run dev          # same, unminified, rebuilds on change (watch)
#   → open http://localhost:8123/            (index.html, bundled)

# ── TEST (logic only, browser-free) ──
npm test             # node --test over tests/*.test.js
npm run test:watch   # re-run on change

# ── QUICK SYNTAX CHECK on a single file (used often here) ──
node --check render.js
```

> Port note: the VS Code launch config and this project's history use **8123**; the README examples use 8000. Either works — pick one and be consistent. `data/*.json`, season switching and module loading only work over HTTP.

🇫🇷 Tout se lance depuis `Collections/F1/`. Dev : `python3 -m http.server 8123` puis `index-dev.html`. Build : `npm run build`. Tests : `npm test`. Vérif rapide : `node --check <fichier>.js`.

---

## 5. Conventions — how things are done here

**Event handling — delegation, not inline handlers.** User actions are wired through a single delegated listener in `app.js` on `[data-action="…"]` (and `[data-digit]`, `[data-card]`, etc.). To add an interaction: put `data-action="myAction"` in the HTML and add a `case 'myAction':` to the `switch` in `initEvents()`. **If the action writes to the collection, add it to the `VIEWER_BLOCKED` set** so viewer (read-only) mode blocks it. Avoid inline `onclick=`.
🇫🇷 Interactions via `data-action` + délégation dans `app.js`. Toute action qui **écrit** doit être ajoutée à `VIEWER_BLOCKED` (mode lecture seule).

**Module layout.** One concern per module (see the file map). Each file opens with a boxed banner comment (`══` border) naming its responsibility — keep that style. Imports are explicit named ES imports.

**i18n.** See Hard Rule 5. Badge texts live in `window.__BADGE_T`; card descriptions in `card-descriptions.js`.

**Rarity has two independent scales — do not conflate them.** (1) Card rarity is a **6-level** scale `epic · legendary · mythic · ultra · cosmic · divine` (no `common`/`rare` anymore), derived from role/champion base rarity with foil bonuses (+1 simple foil, +2 dual, +3 wild/promo/nitro, clamped at `divine`); `divine` renders as an animated iridescent gradient. (2) The **type-pill** colour/star ladder is a *separate* scale (`typeBadgeStyles` / `typeBadgeRarity` in `metadata.json`) and must not be changed when you touch card rarity. Any animation must respect `prefers-reduced-motion`.
🇫🇷 Deux échelles distinctes : la rareté de carte (6 niveaux `epic…divine`) et l'échelle des pastilles de type (`typeBadgeStyles`). Ne pas les confondre. Animations : respecter `prefers-reduced-motion`.

**`localStorage` keys.** Season-scoped **v2** format: `f1uno_owned_<year>`, `f1uno_badges_<year>`, `f1uno_auto_badges_<year>`, `f1uno_history_<year>`. Shared keys: `f1uno_theme`, `f1uno_lang`, `f1uno_font`, `f1uno_title`, `f1uno_onboarded`, PIN/viewer keys, backup-reminder keys, `f1uno_install_dismissed`, and `f1uno_cloud_session`. Legacy **v1** keys migrate automatically on load — don't break `migration`.
🇫🇷 Clés `localStorage` scoppées par saison (v2). Migration v1→v2 automatique : ne pas la casser.

**Code style & language.** 2-space indent, semicolons, single quotes. Existing code comments and `log()` strings are a **French/English mix** — that is fine; keep comments clear in whichever language fits, but **all identifiers and user-facing i18n keys stay English**.

**Commit messages — Conventional Commits. HARD RULE for git.** Format: `type(scope): subject`, lowercase type and scope, imperative, an em-dash (`—`) for the elaboration. Types in use: `feat, fix, docs, style, refactor, test, chore, build`. Real examples from this repo:
- `feat(cloud): step 1 — cloud-config.js (Supabase URL + anon key slots)`
- `fix(fonts): apply font vars inline via JS so a stale stylesheet can't break switching`
- `test: first unit-test suite — 65 tests over the browser-free logic`
- `docs: sync README with current app (fonts, rarity, collector tools, PWA, tests)`

🇫🇷 Commits en Conventional Commits : `type(scope): sujet` en minuscules, à l'impératif, tiret cadratin `—` pour préciser. Types : `feat, fix, docs, style, refactor, test, chore, build`.

---

## 6. File map / Carte des fichiers

```
Collections/F1/                 ← git root · all commands run here
├── index.html                  # Production markup → loads app.bundle.js
├── index-dev.html              # Dev markup → loads app.js as native ES modules (no build)
├── styles.css                  # Themes, grid, cards, responsive
├── manifest.webmanifest        # PWA manifest (relative start_url/scope)
├── sw.js                       # Service worker — SW_VERSION, precache, cache-first  ⚠ classic script, not bundled
├── favicon.ico · icons/ · screenshots/ · fonts/   # PWA assets (self-hosted fonts)
│
│  ── Bundled ES modules (entry app.js → app.bundle.js) ──
├── app.js                      # Entry: init, global event delegation, SW registration
├── logger.js                   # DEBUG-gated log()/warn()
├── i18n.js                     # LANGS, t(), applyLanguage()
├── data.js                     # DB constants, JSON loaders, season switching
├── storage.js                  # localStorage, collection state, import/export, migration
├── backup.js                   # Backup code + QR (compress/encode, #backup= link, reminder)
├── qrcodegen.js                # Vendored QR encoder (Nayuki, MIT)
├── history.js                  # Daily owned-count snapshots (stats progression)
├── collector.js                # Missing / doubles / trade-list logic (pure, unit-tested)
├── tutorial.js                 # Interactive sandboxed guided tour
├── install.js                  # PWA install (native prompt, banner, per-platform + Arc)
├── badges.js                   # Badge evaluation/rendering + titles
├── stats.js                    # computeStats(), renderStats() (progression, highlights, donut)
├── render.js                   # Grid, sidebar, filters, modal, search, views, toast
├── pin.js                      # Auth/PIN, viewer & admin modes, settings UI
├── cloud.js                    # Optional Supabase push/pull via raw REST fetch (magic-link auth)
│
│  ── Classic scripts (NOT bundled · loaded before modules · set window.__ globals) ──
├── translations.js             # window.__T / window.__BADGE_T (7 languages)
├── card-descriptions.js        # window.__CARD_DESC
├── data-embedded.js            # window.__F1UNO_EMBEDDED (offline fallback data)
├── cloud-config.js             # window.__F1UNO_CLOUD (Supabase url + anon key)
│
├── app.bundle.js(.map)         # ⚠ GENERATED + COMMITTED — rebuild after editing a bundled module
├── package.json                # esbuild build/dev + node --test scripts (esbuild = only devDep)
├── extract_data.mjs            # Dev tool: data extraction/generation
├── tests/                      # node --test suites + fixtures (_setup.js, _fixtures.js)
├── docs/CLOUD-SYNC-DESIGN.md   # Cloud-sync design document
└── data/
    ├── metadata.json           # cardTypes, rarities/rarityKeys/rarityOrder, typeBadgeStyles, teams, drivers…
    ├── cards-2025.json         # 101 cards (2025 season)
    ├── circuits.json           # SVG circuit outlines
    └── badges.json             # 50 badges (25 auto + 25 manual)
```

**Adding a season:** create `data/cards-<year>.json` (same shape as `cards-2025.json`), update `data/metadata.json` for new teams/drivers, and remember the header only lists 2025 + seasons already present in `localStorage`.

---

## 7. Cloud sync — current status (read carefully)

⚠️ **The README's "Roadmap" section is out of date on this point.** It still says cloud sync has *"no code written."* That is **no longer true**: an **optional Supabase cloud layer is now in the repo and wired up**:
- `cloud.js` — magic-link auth + session handling over raw REST `fetch()` (no SDK).
- `cloud-config.js` — filled with a real project `url` + `anon` key (public by design).
- `cloud.test.js` — unit tests for the pure helpers.
- `app.js` calls `handleAuthRedirect()` at boot; `pin.js` renders the cloud Settings section.

It is **optional and gated**: with `cloud-config.js` empty the app behaves exactly as before. When working on cloud features, keep the raw-`fetch()`/no-SDK rule (Hard Rule 1), the anon-key-only rule (Hard Rule 7), and ensure `sw.js` continues to **exclude the Supabase origin** from caching (cloud responses use `cache:'no-store'` and must never be served from cache). If you touch this area, also update the README roadmap so docs match reality.

🇫🇷 Le README dit à tort que la sync cloud n'existe pas : elle est désormais présente (`cloud.js`, `cloud-config.js`, `cloud.test.js`, appelée dans `app.js`). Optionnelle, activée seulement si `cloud-config.js` est rempli. Respecter : `fetch` brut (pas de SDK), clé `anon` seulement, et le SW qui **exclut** l'origine Supabase du cache.

---

## 8. Definition of Done / Définition de « terminé »

A change is **not done** until all of these pass. Run them before you say the work is finished.

1. **Syntax:** `node --check <each edited .js>` is clean.
2. **Tests:** `npm test` is green. If you changed testable logic (rarity, storage/migration, backup, stats, badges, history, collector, install detection, language gating, cloud helpers), **add or update a test** in `tests/`.
3. **Bundle:** if you edited a *bundled* module, `npm run build` was run and `app.bundle.js` + `.map` are committed alongside the source.
4. **Service worker:** if any precached shell file changed, `SW_VERSION` in `sw.js` was bumped and the precache list still covers every shipped file.
5. **i18n:** any new user-facing string exists as a key in **all 7 languages** in `translations.js`; nothing is hard-coded.
6. **Relative paths:** no new URL starts with `/`.
7. **Logging:** no stray debug `console.log`; `DEBUG` is `false`.
8. **Manual browser pass (what tests can't cover):** serve over HTTP and check what you touched — DOM rendering, modal/sidebar, theming, font switching, animations (incl. `prefers-reduced-motion`), the tutorial's DOM flow, PWA install, offline reload, and QR visual output. State clearly which manual checks you did and which you couldn't.
9. **Docs:** if behaviour or structure changed, update `README.md` (and this file) so they still match reality.

🇫🇷 Avant de dire « terminé » : `node --check` propre, `npm test` vert (+ test ajouté si logique modifiée), bundle reconstruit et commité si module bundlé, `SW_VERSION` incrémenté si le shell change, 7 langues à jour, aucun chemin en `/`, pas de `console.log` de debug, passe manuelle navigateur (HTTP) sur ce que tu as touché, et docs synchronisées.

---

## 9. Gotchas — things that used to live only in the maintainer's head

- **The pre-commit hook is not in git.** After a fresh clone, nothing auto-rebuilds the bundle. Rebuild manually (or recreate the hook) or you'll commit a stale `app.bundle.js`.
- **Editing `translations.js` / `data-embedded.js` / `card-descriptions.js` / `cloud-config.js` / `sw.js` does NOT need a rebuild** — they're classic scripts outside the bundle. Editing any other root `*.js` **does**.
- **Stats progression history has no back-fill** — the curve starts empty the day the feature was installed. Don't try to reconstruct past data; there's no per-card timestamp.
- **`data-embedded.js` must stay in parity with the real `data/metadata.json`** (a few tests assert this) — it's the offline fallback.
- **Viewer mode** silently blocks write actions via the `VIEWER_BLOCKED` set in `app.js`; forget to list a new write action there and read-only mode leaks writes.
- **Arc browser** hides behind a Chrome UA and has no install support; `install.js` detects it via `--arc-palette-*` CSS vars and shows an honest message. Don't "simplify" that away.
- **Driver-number fonts** (Orbitron / Racing Sans One) are intentionally fixed and must **not** follow the font-theme picker.
- **Colour/contrast:** stat and rarity palettes are contrast-checked in **both** light and dark themes. If you change chart/tile/rarity colours, re-check contrast in both themes (the `dataviz` skill provides a palette-contrast validator; there is no such script committed in this repo).

---

## 10. When unsure / En cas de doute

Ask the maintainer before: adding any dependency or CDN; changing the rarity scales, the storage key scheme, or the migration; altering the service-worker caching strategy; or making an irreversible data change. Prefer a small, tested, reversible change over a clever large one. Preserve the honest, precise tone of the existing code and docs.

🇫🇷 Demander avant : toute dépendance/CDN, tout changement des échelles de rareté, du schéma de clés `localStorage`, de la migration, ou de la stratégie de cache du service worker. Préférer une petite modif testée et réversible. Conserver le ton honnête et précis du code et de la doc existants.
