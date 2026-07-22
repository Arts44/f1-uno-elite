[🇬🇧 English](README.md) · [🇫🇷 Français](README.fr.md) · [🇪🇸 Español](README.es.md) · [🇨🇳 中文](README.zh.md) · [🇮🇹 Italiano](README.it.md) · 🇳🇱 **Nederlands** · [🇩🇪 Deutsch](README.de.md)

# 🏎️ F1 UNO Élite — Collection Tracker

**Een offline-first, installeerbare tracker voor een ruilkaartencollectie, gebouwd met vanilla JavaScript en nul runtime-afhankelijkheden — geen framework, geen SDK, geen CDN, geen backend.**

[![tests](https://github.com/Arts44/f1-uno-elite/actions/workflows/tests.yml/badge.svg)](https://github.com/Arts44/f1-uno-elite/actions/workflows/tests.yml)
![License: MIT](https://img.shields.io/badge/license-MIT-green)
![PWA](https://img.shields.io/badge/PWA-installable%20%2B%20offline%20%E2%9C%93-brightgreen)
![Zero runtime deps](https://img.shields.io/badge/runtime%20dependencies-0-blue)
![Vanilla JS](https://img.shields.io/badge/JavaScript-vanilla-f7df1e?logo=javascript&logoColor=black)
![i18n](https://img.shields.io/badge/languages-7-purple)

## ▶️ **[Probeer live → arts44.github.io/f1-uno-elite](https://arts44.github.io/f1-uno-elite/)**

Het is een **PWA**: installeer haar vanuit je browser en ze draait als een native app, volledig offline, met een eigen icoon — op desktop én mobiel.

![Collectieraster — donker thema](screenshots/grid-desktop-dark.jpg)

| Kaartfiche — geanimeerde foil-types | Statistiekendashboard |
|---|---|
| ![Kaartmodal](screenshots/modal-dark.jpg) | ![Statistiekenweergave](screenshots/stats-light.jpg) |

<sub>Meer schermafbeeldingen in [`screenshots/`](screenshots/) — licht en donker thema, desktop en mobiel.</sub>

---

## ✨ Wat het doet

Een complete **F1 UNO Élite**-ruilkaartencollectie bijhouden — 101 kaarten, elk in tot 16 varianten (basiskleuren, foils, duals, Wild, Nitro, promo's):

- 📇 **Volledig collectiebeheer** — in bezit / dubbelen / verlanglijst / favorieten, aantallen per variant, directe zoekfunctie en uitgebreide filters.
- ✨ **Geanimeerd zeldzaamheidssysteem met 6 niveaus** — `epic → legendary → mythic → ultra → cosmic → divine`, berekend uit de beste variant in bezit. Foil-kaarten dragen bewegende lichtglans-effecten en het hoogste niveau toont een verschuivend iriserend verloop (alles met respect voor `prefers-reduced-motion`).
- 📴 **Werkt volledig offline** — de hele app wordt door een service worker geprecachet; na het eerste bezoek verandert vliegtuigmodus niets.
- 🔄 **Transparante auto-updates** — nieuwe versies worden op de achtergrond gedetecteerd en met één tik toegepast, met een ingebouwde changelog die toont wat er sinds *jouw* laatste versie veranderde.
- 🌍 **7 talen** — Engels, Frans, Spaans, Chinees, Italiaans, Nederlands, Duits. Elke tekst, badge en changelog-vermelding.
- 🎓 **Interactieve tutorial in 26 stappen** — een rondleiding waarin je de echte handelingen *zelf uitvoert*, in een sandbox die elke wijziging aan het einde terugdraait.
- 🏅 **50 badges en titels** — 25 automatisch ontgrendeld op meetbare voorwaarden, 25 zelf gedeclareerd.
- 📊 **Statistiekendashboard** — totale voortgang, zeldzaamheidsdonut, voltooiing per categorie, hoogtepunten en een dag-voor-dag voortgangscurve (pure SVG, geen grafiekbibliotheek).
- 🔁 **Back-ups overal** — JSON-export/-import, een gecomprimeerde back-upcode van toestel naar toestel, dezelfde code als scanbare QR, en optionele cloudback-up.
- 🔐 **Pincodevergrendeling, kijkersmodus en optionele versleuteling** — een 4-cijferige pincode (SHA-256), een alleen-lezen deelmodus, en opt-in-versleuteling van de collectie in rust (PBKDF2 + AES-GCM, afgeleid van de pincode).
- 🤝 **Verzamelaarstools** — lijsten van ontbrekende / dubbele / ruilkaarten om mee te nemen naar een ruilbeurs.

---

## 🛠️ Technische stack

| Gebied | Keuze |
|---|---|
| Taal | **Vanilla JavaScript** (native ES-modules), HTML5, CSS3 — geen framework |
| Runtime-afhankelijkheden | **Nul.** Geen npm-pakketten, geen CDN, geen SDK tijdens runtime |
| Build | [esbuild](https://esbuild.github.io/) (de *enige* devDependency) → één geminificeerde IIFE-bundle |
| Offline / PWA | Handgeschreven Service Worker (geversioneerde precache, cache-first shell) + Web App Manifest |
| Cloud (optioneel) | **Supabase via kale REST-`fetch()`** — geen SDK; e-mail-OTP-authenticatie, Row Level Security |
| Crypto | Native **Web Crypto** — SHA-256 (pincode), PBKDF2 + AES-GCM (optionele versleuteling in rust) |
| QR-codes | Gevendorde single-file-encoder ([Project Nayuki](https://www.nayuki.io/page/qr-code-generator-library), MIT) |
| Lettertypen | Zelf gehoste WOFF2 (SIL OFL) — geen Google Fonts-verzoek, 5 thema's naar keuze |
| Tests | **Ingebouwde testrunner van Node** (`node --test`) — 166 tests, geen testframework |
| CI | GitHub Actions — tests + build + versheidscontrole van de gecommitte bundle bij elke push/PR |

**Nul runtime-afhankelijkheden is een ontwerpregel, geen toeval.** Alles wat een framework of SDK normaal levert — rendering, navigatie tussen weergaven, i18n, offline caching, auth via REST, versleuteling, QR-generatie — is rechtstreeks op de webplatform-API's gebouwd. De app die je installeert is exact de code in deze repository.

---

## 🧱 De architectuur in het kort

De code bestaat uit gerichte **ES-modules** achter één ingangspunt, `app.js`, door esbuild gebundeld tot één gecommitte `app.bundle.js` (GitHub Pages voert geen buildstap uit). Twee HTML-ingangspunten delen al het overige: `index-dev.html` laadt de rauwe modules voor ontwikkeling, `index.html` laadt de bundle.

| Laag | Modules |
|---|---|
| Staat en data | `storage.js` (localStorage, per seizoen, migratie v1→v2), `data.js`, `history.js` |
| Interface | `render.js` (raster, filters, kaartfiche), `stats.js`, `badges.js`, `pin.js` (instellingen) |
| Platform | `sw.js` (precache), `update.js` (updates), `install.js`, `secure-store.js` |
| Optionele cloud | `cloud.js`, `feedback.js`, `settings-sync.js` — alle via kale REST |

Acties lopen via **één gedelegeerde listener** op `[data-action]` in plaats van inline handlers — wat ook de kijkersmodus mogelijk maakt, omdat één enkele `VIEWER_BLOCKED`-set elke schrijfactie tegenhoudt. Interfacetekst staat nooit in de code: die loopt via `t()` over woordenboeken die alle 7 talen dekken.

---

## 🧗 Technische uitdagingen

De problemen die deze codebase werkelijk hebben gevormd:

### Offline-first *én* altijd up-to-date
Een cache-first service worker maakt de app onverwoestbaar offline — en uitstekend in het eindeloos serveren van verouderde code. Geïnstalleerde PWA's zijn het zwaarst getroffen: ze kunnen dagenlang open blijven zonder navigatie, dus de browser controleert de worker nooit opnieuw.
**Oplossing:** de nieuwe worker downloadt op de achtergrond en parkeert bewust in de *waiting*-status (geen automatische `skipWaiting` — de shell verwisselen onder een draaiende app is precies hoe je state corrumpeert). Een banner promoveert hem met één tik via `SKIP_WAITING`; een genegeerde banner lost zichzelf op bij de volgende koude start. Geïnstalleerde PWA's roepen bovendien `registration.update()` aan bij elke terugkeer naar de voorgrond en elk uur. De appversie is afgeleid van de nieuwste changelog-vermelding: releasen *is* de changelog schrijven.

### E-mail-inloggen dat een geïnstalleerde PWA overleeft
Klassieke magic-link-authenticatie breekt in geïnstalleerde PWA's: de link opent in de standaardbrowser — een andere opslagpartitie — waardoor de sessie belandt waar de app niet is.
**Oplossing:** authenticatie gebruikt **e-mail-OTP-codes** als hoofdroute, ingetypt in de app zelf, dus de sessie ontstaat elke keer in de juiste context. De hele GoTrue-flow is geïmplementeerd met kale `fetch()`.

### Een service worker die de API nooit aanraakt
Een precachende service worker die alles onderschept, serveert met plezier een gecachet API-antwoord — een stille datacorruptiebug die alleen in productie opduikt.
**Oplossing:** de worker sluit de Supabase-origin volledig uit, en cloudaanroepen sturen bovendien `cache: 'no-store'`.

### Een CSS-refactor die byte voor byte identiek is bewezen
Honderden hardgecodeerde spatiëringswaarden migreren naar tokens, met „het ziet er hetzelfde uit" als enige garantie.
**Oplossing:** uitsluitend exact passende substitutie, en daarna een bewijs — elke `var()` in beide stylesheets oplossen naar pixelwaarden en ze byte voor byte vergelijken. Een latere ronde gaf de terugkerende halve stappen een naam in plaats van 61 declaraties af te ronden puur voor schaalzuiverheid.

### Feedback met e-mailnotificatie — zonder server
**Oplossing:** een Postgres-trigger op de `feedback`-tabel roept de Resend-API aan via `pg_net`, volledig binnen Supabase. De API-sleutel staat versleuteld in de Vault, gebruikersinhoud wordt HTML-geëscapet, en een mislukte e-mail kan de insert nooit blokkeren.

### Een browserapp testen zonder browser
De belofte van nul afhankelijkheden sluit Jest, Vitest en headless-browsertuigages uit.
**Oplossing:** de logica is zo gefactoriseerd dat ze browservrij is en wordt gedekt door **166 tests op de ingebouwde runner van Node** — geen testafhankelijkheden, geen echt netwerk. De CI herbouwt bovendien de bundle en faalt als het gecommitte artefact verouderd is.

---

## 🚀 Aan de slag

Een moderne browser en een willekeurige statische HTTP-server (`file://` volstaat niet — ES-modules en de `fetch()` van de JSON-bestanden worden daar geblokkeerd).

```bash
# Ontwikkeling — geen buildstap, rauwe ES-modules:
python3 -m http.server 8000
# → http://localhost:8000/index-dev.html

# Productiebundle:
npm install     # installeert esbuild, de enige devDependency
npm run build   # app.js → app.bundle.js (geminificeerd + sourcemap)
# → http://localhost:8000/  (index.html)

npm test        # 166 tests, node --test, zonder framework
```

**Deployment.** De repository deployt as-is naar GitHub Pages: elke URL is relatief, dus de app draait identiek op een domeinroot, onder een subpad en op localhost. Releaseroutine: een changelog-vermelding toevoegen (dat *is* de versiebump) → `SW_VERSION` ophogen → builden → pushen.

---

## ⚖️ Eerlijke beperkingen

- **De pincode is een interfacebarrière, geen sterke beveiliging.** Zonder de optionele versleuteling is de collectie leesbaar in `localStorage` via DevTools. Met versleuteling aan is terloops gluren geblokkeerd — maar een 4-cijferige pincode kan offline gebruteforcet worden door wie het toestel in handen heeft. Een vergeten pincode maakt een versleutelde lokale collectie onherstelbaar.
- **Cloud-inloggen draait op een test-e-maildomein**, met strakke limieten — prima voor een persoonlijk project, geen productiewaardige bezorging.
- **De voortgangshistorie kent geen back-fill** — de statistiekencurve begint op de dag dat de functie werd geïnstalleerd.

---

## 📜 Licentie & merken

Uitgebracht onder de **MIT-licentie** — zie [LICENSE](LICENSE). © 2026 Arthur — [@Arts44](https://github.com/Arts44).

> **Onofficieel fanproject, niet-commercieel.** „F1" en „UNO", evenals de logo's en afbeeldingen van teams en coureurs, zijn eigendom van hun respectieve eigenaren. Deze tool is niet gelieerd aan, goedgekeurd door of gesponsord door Formula 1, Mattel of enig team.
