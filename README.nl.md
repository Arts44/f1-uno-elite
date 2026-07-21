[🇬🇧 English](README.md) · [🇫🇷 Français](README.fr.md) · [🇪🇸 Español](README.es.md) · [🇨🇳 中文](README.zh.md) · [🇮🇹 Italiano](README.it.md) · 🇳🇱 **Nederlands** · [🇩🇪 Deutsch](README.de.md)

# 🏎️ F1 UNO Élite — Collection Tracker

**Een offline-first, installeerbare tracker voor een ruilkaartencollectie, gebouwd met vanilla JavaScript en nul runtime-afhankelijkheden — geen framework, geen SDK, geen CDN, geen backend nodig.**

[![tests](https://github.com/Arts44/f1-uno-elite/actions/workflows/tests.yml/badge.svg)](https://github.com/Arts44/f1-uno-elite/actions/workflows/tests.yml)
![License: MIT](https://img.shields.io/badge/license-MIT-green)
![PWA](https://img.shields.io/badge/PWA-installable%20%2B%20offline%20%E2%9C%93-brightgreen)
![Zero runtime deps](https://img.shields.io/badge/runtime%20dependencies-0-blue)
![Vanilla JS](https://img.shields.io/badge/JavaScript-vanilla-f7df1e?logo=javascript&logoColor=black)
![i18n](https://img.shields.io/badge/languages-7-purple)

## ▶️ **[Probeer live → arts44.github.io/f1-uno-elite](https://arts44.github.io/f1-uno-elite/)**

Het is een **PWA**: installeer haar vanuit je browser en ze draait als een native app, volledig offline, met een eigen icoon — op desktop én mobiel.

![Collectieraster — donker thema](screenshots/grid-desktop-dark.jpg)

| Kaartdetail — geanimeerde foil-types | Statistiekendashboard |
|---|---|
| ![Kaartmodal](screenshots/modal-dark.jpg) | ![Statistiekenweergave](screenshots/stats-light.jpg) |

<sub>Meer schermafbeeldingen in [`screenshots/`](screenshots/) — licht/donker thema, mobiel.</sub>

---

## ✨ Wat het doet

Een complete **F1 UNO Élite**-ruilkaartencollectie bijhouden (101 kaarten, elk in tot 16 varianten — basiskleuren, foils, duals, Wild, Nitro, promo's):

- 📇 **Volledig collectiebeheer** — in bezit / dubbelen / verlanglijst / favorieten, met aantallen per variant, directe zoekfunctie en uitgebreide filters.
- ✨ **Geanimeerd zeldzaamheidssysteem met 6 niveaus** — `epic → legendary → mythic → ultra → cosmic → divine`, automatisch berekend uit de beste variant in bezit; foil-kaarten dragen bewegende lichtglans-effecten en het hoogste niveau toont een verschuivend iriserend verloop (alles met respect voor `prefers-reduced-motion`).
- 📴 **Werkt volledig offline** — de hele app wordt door een service worker geprecachet; na het eerste bezoek verandert vliegtuigmodus niets meer.
- 🔄 **Transparante auto-updates** — nieuwe versies worden op de achtergrond gedetecteerd en met één tik op een discrete banner toegepast, plus een ingebouwde changelog („wat is er nieuw sinds *jouw* laatste versie").
- 🌍 **7 talen** — Engels, Frans, Spaans, Chinees, Italiaans, Nederlands, Duits. Elke tekst, badge en changelog-vermelding.
- 🎓 **Interactieve tutorial in 26 stappen** — een rondleiding waarin je de echte handelingen *zelf uitvoert*, in een sandbox die elke wijziging aan het einde terugdraait.
- 🏅 **50 badges & titels** — 25 automatisch ontgrendeld op meetbare voorwaarden, 25 zelf gedeclareerd.
- 📊 **Statistiekendashboard** — totale voortgang, zeldzaamheidsdonut, voltooiing per categorie, hoogtepunten en een dag-voor-dag voortgangscurve (pure SVG, geen grafiekbibliotheek).
- 🔁 **Back-ups overal** — JSON-export/-import, een gecomprimeerde **back-upcode** van toestel naar toestel, dezelfde code als scanbare **QR**, en een optionele **cloudback-up** (Supabase).
- 🔐 **Pincodevergrendeling, kijkersmodus & optionele versleuteling** — een 4-cijferige pincode (SHA-256), een alleen-lezen deelmodus, en opt-in-versleuteling van de collectie in rust (PBKDF2 + AES-GCM, afgeleid van de pincode — native Web Crypto).
- 🤝 **Verzamelaarstools** — lijsten van ontbrekende / dubbele / ruilkaarten om mee te nemen naar een ruilbeurs.
- 💬 **Ingebouwde feedback** — ingelogde gebruikers sturen suggesties of bugmeldingen rechtstreeks vanuit Instellingen.

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
| Lettertypen | Zelf gehoste WOFF2 (SIL OFL) — geen Google Fonts-verzoek, 5 wisselbare lettertypethema's |
| Tests | **Ingebouwde testrunner van Node** (`node --test`) — 166 tests, geen testframework |
| CI | GitHub Actions — tests + build + versheidscontrole van de gecommitte bundle bij elke push/PR |

**Nul runtime-afhankelijkheden is een ontwerpregel, geen toeval.** Alles wat een framework of SDK normaal levert — rendering, navigatie tussen weergaven, i18n, offline caching, auth via REST, versleuteling, QR-generatie — is rechtstreeks op de webplatform-API's gebouwd. De app die je installeert is exact de code in deze repository.

---

## 🧗 Technische uitdagingen

De problemen die deze codebase werkelijk hebben gevormd, en hoe ze zijn opgelost:

### Offline-first *én* altijd up-to-date
**Probleem:** een cache-first service worker maakt de app onverwoestbaar offline — en uitstekend in het eeuwig serveren van verouderde code. Geïnstalleerde PWA's zijn het zwaarst getroffen: ze kunnen dagenlang open blijven zonder navigatie, dus de browser controleert de worker nooit uit zichzelf opnieuw.
**Oplossing:** de nieuwe worker downloadt op de achtergrond en parkeert bewust in de *waiting*-status (geen automatische `skipWaiting` — de shell verwisselen onder een draaiende app is precies hoe je state corrumpeert). De app toont een one-tap-banner „nieuwe versie — herladen" die hem promoveert via een `SKIP_WAITING`-bericht; een genegeerde banner lost zichzelf op bij de volgende koude start. Geïnstalleerde PWA's roepen bovendien `registration.update()` aan bij elke terugkeer naar de voorgrond en elk uur. De appversie is afgeleid van de nieuwste changelog-vermelding: releasen *is* de changelog schrijven — versie en historie kunnen niet uiteenlopen.

### E-mail-inloggen dat een geïnstalleerde PWA overleeft
**Probleem:** klassieke magic-link-authenticatie breekt in geïnstalleerde PWA's: de link opent in de standaardbrowser — een andere opslagpartitie — waardoor de sessie belandt waar de app niet is.
**Oplossing:** authenticatie gebruikt **e-mail-OTP-codes** als hoofdroute: de code typ je in de app zelf, dus de sessie ontstaat elke keer in de juiste context. De magic link blijft als bonus aan browserzijde werken. De hele GoTrue-flow (versturen, verifiëren, verversen, vervalmarge) is geïmplementeerd met kale `fetch()` — geen Supabase-SDK.

### Een service worker die de API nooit aanraakt
**Probleem:** een precachende service worker die alles onderschept, serveert met plezier een gecachet API-antwoord — een stille datacorruptiebug die alleen in productie opduikt.
**Oplossing:** de worker sluit de Supabase-origin volledig uit (verzoeken passeren onaangeroerd), en cloudaanroepen sturen bovendien `cache: 'no-store'`. Dubbel gezekerd, geverifieerd door tests.

### Een CSS-refactor die byte voor byte identiek is bewezen
**Probleem:** honderden hardgecodeerde spatiëringswaarden migreren naar design-tokens met „het ziet er hetzelfde uit" als enige garantie.
**Oplossing:** uitsluitend exact passende substitutie (geen afronden naar het dichtstbijzijnde token), en daarna een bewijs: elke `var()` in de stylesheet van vóór en ná oplossen naar pixelwaarden en de twee byte voor byte vergelijken — wiskundig identieke weergave, waarden buiten de schaal onaangeroerd gelaten en geïnventariseerd voor een latere, bewuste ronde.

### Feedback met e-mailnotificatie — zonder server
**Probleem:** de beheerder wil een e-mail per ingezonden feedback, maar er is geen backend om die te versturen.
**Oplossing:** een Postgres-trigger op de `feedback`-tabel roept de Resend-API aan via `pg_net`, volledig binnen Supabase. De API-sleutel staat versleuteld in de Supabase Vault (nooit in deze repository), gebruikersinhoud wordt HTML-geëscapet, en een mislukte e-mail kan de insert nooit blokkeren. Clientzijde: een cooldown; serverzijde: een SQL-throttle (max. 5/uur per gebruiker), afgedwongen door de trigger.

### 7 talen zonder i18n-bibliotheek
**Probleem:** elke zichtbare tekst — interface, badges, tutorial, changelog-vermeldingen, foutmeldingen — in 7 talen, zonder framework dat discipline afdwingt.
**Oplossing:** een kleine `t()`-helper over woordenboekbestanden, `data-i18n`-attributen voor statische HTML, en unittests die falen zodra een changelog-vermelding ook maar één van de 7 talen mist. Engels is de gedeclareerde fallback; een harde projectregel zegt dat een tekst die alleen in het Engels bestaat een onvolledige wijziging is.

### Een browserapp testen zonder browser
**Probleem:** de belofte van nul afhankelijkheden sluit Jest, Vitest en headless-browsertuigages uit.
**Oplossing:** de logica is zo gefactoriseerd dat ze browservrij is (zeldzaamheidsberekening, opslagmigratie, back-upcodering, statistieken, badges, versleuteling, cloudhelpers, updatelogica…) en wordt gedekt door **166 tests op de ingebouwde runner van Node** — nul testafhankelijkheden, geen echt netwerk (elke cloudtest stubt `fetch`). De CI herbouwt bovendien de bundle en faalt als het gecommitte artefact verouderd is: de gedeployde code komt aantoonbaar overeen met de bronnen.

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

# Tests:
npm test        # 166 tests, node --test, zonder framework
```

### Deployment

De repository deployt **as-is** naar GitHub Pages (statisch, geen serverbuild): elke URL is relatief, dus de app draait identiek op een domeinroot, onder een subpad en op localhost. De gebouwde bundle wordt gecommit omdat Pages geen npm-stap uitvoert; de CI bewaakt dat hij nooit veroudert. Releaseroutine: een changelog-vermelding toevoegen (dat *is* de versiebump) → `SW_VERSION` in `sw.js` ophogen → builden → pushen. Terugkerende bezoekers krijgen de updatebanner.

---

## ⚖️ Eerlijke beperkingen

- **De pincode is een interfacebarrière, geen sterke beveiliging.** Zonder de optionele versleuteling is de collectie leesbaar in `localStorage` via DevTools. Met versleuteling aan is terloops gluren geblokkeerd — maar een 4-cijferige pincode kan offline gebruteforcet worden door wie het toestel in handen heeft. Het beschermt tegen opportunistisch meekijken, niet tegen experts. Een vergeten pincode maakt een versleutelde lokale collectie onherstelbaar — bewaar back-ups.
- **Cloud-inloggen draait op een test-e-maildomein.** Auth- en feedbackmails vertrekken momenteel via standaard-/testafzenderdomeinen met strakke limieten — prima voor een persoonlijk project, geen productiewaardige e-mailbezorging. Een eigen SMTP/domein zou dit oplossen.
- **De voortgangshistorie kent geen back-fill** — de statistiekencurve begint op de dag dat de functie werd geïnstalleerd; er is geen tijdstempel per kaart om het verleden mee te reconstrueren.

---

## 📜 Licentie & merken

Uitgebracht onder de **MIT-licentie** — zie [LICENSE](LICENSE). © 2026 Arthur.

> „F1" en „UNO", evenals de logo's en afbeeldingen van teams en coureurs, zijn eigendom van hun respectieve eigenaren. Dit is een **onofficiële**, persoonlijke tool voor collectiebeheer, niet gelieerd aan, goedgekeurd door of gesponsord door Formula 1, Mattel of enig team.
