[🇬🇧 English](README.md) · [🇫🇷 Français](README.fr.md) · [🇪🇸 Español](README.es.md) · [🇨🇳 中文](README.zh.md) · [🇮🇹 Italiano](README.it.md) · [🇳🇱 Nederlands](README.nl.md) · 🇩🇪 **Deutsch**

# 🏎️ F1 UNO Élite — Collection Tracker

**Ein offline-first, installierbarer Sammelkarten-Tracker, gebaut mit Vanilla JavaScript und null Laufzeitabhängigkeiten — kein Framework, kein SDK, kein CDN, kein Backend.**

[![tests](https://github.com/Arts44/f1-uno-elite/actions/workflows/tests.yml/badge.svg)](https://github.com/Arts44/f1-uno-elite/actions/workflows/tests.yml)
![License: MIT](https://img.shields.io/badge/license-MIT-green)
![PWA](https://img.shields.io/badge/PWA-installable%20%2B%20offline%20%E2%9C%93-brightgreen)
![Zero runtime deps](https://img.shields.io/badge/runtime%20dependencies-0-blue)
![Vanilla JS](https://img.shields.io/badge/JavaScript-vanilla-f7df1e?logo=javascript&logoColor=black)
![i18n](https://img.shields.io/badge/languages-7-purple)

## ▶️ **[Live ausprobieren → arts44.github.io/f1-uno-elite](https://arts44.github.io/f1-uno-elite/)**

Es ist eine **PWA**: aus dem Browser installiert läuft sie wie eine native App, vollständig offline, mit eigenem Icon — auf Desktop und Mobilgerät.

![Sammlungsraster — dunkles Theme](screenshots/grid-desktop-dark.jpg)

| Kartenansicht — animierte Foil-Typen | Statistik-Dashboard |
|---|---|
| ![Kartenmodal](screenshots/modal-dark.jpg) | ![Statistikansicht](screenshots/stats-light.jpg) |

<sub>Weitere Aufnahmen in [`screenshots/`](screenshots/) — helles und dunkles Theme, Desktop und mobil.</sub>

---

## ✨ Was sie kann

Eine komplette **F1 UNO Élite**-Sammelkartensammlung verwalten — 101 Karten, jede in bis zu 16 Varianten (Grundfarben, Foils, Duals, Wild, Nitro, Promos):

- 📇 **Vollständige Sammlungsverwaltung** — im Besitz / Dubletten / Wunschliste / Favoriten, Stückzahlen pro Variante, Sofortsuche und umfangreiche Filter.
- ✨ **Animiertes 6-stufiges Seltenheitssystem** — `epic → legendary → mythic → ultra → cosmic → divine`, berechnet aus der besten Variante im Besitz. Foil-Karten tragen bewegte Lichtreflexe, und die höchste Stufe erscheint als wandernder irisierender Verlauf (alles unter Beachtung von `prefers-reduced-motion`).
- 📴 **Funktioniert komplett offline** — die gesamte App wird von einem Service Worker vorgecacht; nach dem ersten Besuch ändert der Flugmodus nichts.
- 🔄 **Transparente Auto-Updates** — neue Versionen werden im Hintergrund erkannt und mit einem Tipp übernommen, dazu ein integriertes Changelog, das zeigt, was sich seit *deiner* letzten Version geändert hat.
- 🌍 **7 Sprachen** — Englisch, Französisch, Spanisch, Chinesisch, Italienisch, Niederländisch, Deutsch. Jeder Text, jedes Abzeichen, jeder Changelog-Eintrag.
- 🎓 **Interaktives Tutorial in 26 Schritten** — eine geführte Tour, in der du die echten Aktionen *selbst ausführst*, in einer Sandbox, die am Ende jede Änderung zurücknimmt.
- 🏅 **50 Abzeichen und Titel** — 25 automatisch anhand messbarer Bedingungen freigeschaltet, 25 selbst deklariert.
- 📊 **Statistik-Dashboard** — Gesamtfortschritt, Seltenheits-Donut, Vervollständigung pro Kategorie, Highlights und eine tagesgenaue Fortschrittskurve (pures SVG, keine Chart-Bibliothek).
- 🔁 **Backups überall** — JSON-Export/-Import, ein komprimierter Backup-Code von Gerät zu Gerät, derselbe Code als scanbarer QR-Code, und optionales Cloud-Backup.
- 🔐 **PIN-Sperre, Betrachtermodus und optionale Verschlüsselung** — eine 4-stellige PIN (SHA-256), ein Nur-Lese-Modus zum Teilen, und Opt-in-Verschlüsselung der Sammlung im Ruhezustand (PBKDF2 + AES-GCM, aus der PIN abgeleitet).
- 🤝 **Sammlerwerkzeuge** — Fehl-, Dubletten- und Tauschlisten zum Mitnehmen auf die Tauschbörse.

---

## 🛠️ Tech-Stack

| Bereich | Wahl |
|---|---|
| Sprache | **Vanilla JavaScript** (native ES-Module), HTML5, CSS3 — kein Framework |
| Laufzeitabhängigkeiten | **Null.** Keine npm-Pakete, kein CDN, kein SDK zur Laufzeit |
| Build | [esbuild](https://esbuild.github.io/) (die *einzige* devDependency) → ein minifiziertes IIFE-Bundle |
| Offline / PWA | Handgeschriebener Service Worker (versionierter Precache, Cache-first-Shell) + Web App Manifest |
| Cloud (optional) | **Supabase über rohes REST-`fetch()`** — ohne SDK; E-Mail-OTP-Anmeldung, Row Level Security |
| Krypto | Natives **Web Crypto** — SHA-256 (PIN), PBKDF2 + AES-GCM (optionale Verschlüsselung im Ruhezustand) |
| QR-Codes | Einbezogener Ein-Datei-Encoder ([Project Nayuki](https://www.nayuki.io/page/qr-code-generator-library), MIT) |
| Schriften | Selbst gehostete WOFF2 (SIL OFL) — keine Google-Fonts-Anfrage, 5 Themes zur Auswahl |
| Tests | **Nodes eingebauter Test-Runner** (`node --test`) — 166 Tests, kein Test-Framework |
| CI | GitHub Actions — Tests + Build + Aktualitätsprüfung des committeten Bundles bei jedem Push/PR |

**Null Laufzeitabhängigkeiten ist eine Designregel, kein Zufall.** Alles, was ein Framework oder SDK üblicherweise liefert — Rendering, Navigation zwischen Ansichten, i18n, Offline-Caching, Auth über REST, Verschlüsselung, QR-Erzeugung — ist direkt auf den Webplattform-APIs umgesetzt. Die App, die du installierst, ist exakt der Code in diesem Repository.

---

## 🧱 Die Architektur in Kürze

Der Quellcode besteht aus fokussierten **ES-Modulen** hinter einem einzigen Einstiegspunkt, `app.js`, von esbuild zu einem committeten `app.bundle.js` gebündelt (GitHub Pages führt keinen Build-Schritt aus). Zwei HTML-Einstiegspunkte teilen sich alles Übrige: `index-dev.html` lädt die rohen Module für die Entwicklung, `index.html` lädt das Bundle.

| Schicht | Module |
|---|---|
| Zustand & Daten | `storage.js` (localStorage, saisonbezogen, Migration v1→v2), `data.js`, `history.js` |
| Oberfläche | `render.js` (Raster, Filter, Kartenansicht), `stats.js`, `badges.js`, `pin.js` (Einstellungen) |
| Plattform | `sw.js` (Precache), `update.js` (Updates), `install.js`, `secure-store.js` |
| Optionale Cloud | `cloud.js`, `feedback.js`, `settings-sync.js` — alle über rohes REST |

Aktionen laufen über **einen einzigen delegierten Listener** auf `[data-action]` statt über Inline-Handler — was auch den Betrachtermodus möglich macht, da ein einziges `VIEWER_BLOCKED`-Set jeden Schreibzugriff sperrt. Oberflächentext steht nie im Code: er läuft über `t()` gegen Wörterbücher, die alle 7 Sprachen abdecken.

---

## 🧗 Technische Herausforderungen

Die Probleme, die diesen Code wirklich geprägt haben:

### Offline-first *und* immer aktuell
Ein Cache-first-Service-Worker macht die App offline unerschütterlich — und hervorragend darin, endlos veralteten Code auszuliefern. Installierte PWAs trifft es am härtesten: Sie können tagelang ohne Navigation offen bleiben, der Browser prüft den Worker also nie erneut.
**Lösung:** Der neue Worker lädt im Hintergrund und parkt bewusst im *waiting*-Zustand (kein automatisches `skipWaiting` — die Shell unter einer laufenden App auszutauschen ist der sichere Weg, ihren Zustand zu zerstören). Ein Banner befördert ihn mit einem Tipp per `SKIP_WAITING`; ein ignoriertes Banner löst sich beim nächsten Kaltstart von selbst. Installierte PWAs rufen zusätzlich bei jeder Rückkehr in den Vordergrund und stündlich `registration.update()` auf. Die App-Version leitet sich aus dem neuesten Changelog-Eintrag ab: Veröffentlichen *heißt* Changelog schreiben.

### Eine E-Mail-Anmeldung, die eine installierte PWA übersteht
Die klassische Magic-Link-Anmeldung bricht in installierten PWAs: Der Link öffnet sich im Standardbrowser — einer anderen Speicherpartition — und die Sitzung landet dort, wo die App nicht ist.
**Lösung:** Die Authentifizierung nutzt **E-Mail-OTP-Codes** als Hauptweg, direkt in der App eingetippt, sodass die Sitzung jedes Mal im richtigen Kontext entsteht. Der gesamte GoTrue-Ablauf ist mit rohem `fetch()` umgesetzt.

### Ein Service Worker, der die API nie anfasst
Ein vorcachender Service Worker, der alles abfängt, liefert bereitwillig eine API-Antwort aus dem Cache — ein stiller Datenkorruptions-Bug, der erst in Produktion auftaucht.
**Lösung:** Der Worker schließt die Supabase-Origin vollständig aus, und Cloud-Aufrufe senden zusätzlich `cache: 'no-store'`.

### Ein CSS-Refactoring, Byte für Byte als identisch bewiesen
Hunderte hartkodierte Abstandswerte auf Tokens migrieren, mit „sieht für mich gleich aus" als einziger Garantie.
**Lösung:** Ausschließlich exakt passende Ersetzungen, danach ein Beweis — jedes `var()` in Vorher- und Nachher-Stylesheet zu Pixelwerten auflösen und beide Byte für Byte vergleichen. Ein späterer Durchgang benannte die wiederkehrenden Halbschritte, statt 61 Deklarationen allein der Skalenreinheit wegen zu runden.

### Feedback mit E-Mail-Benachrichtigung — ohne Server
**Lösung:** Ein Postgres-Trigger auf der `feedback`-Tabelle ruft über `pg_net` die Resend-API auf — vollständig innerhalb von Supabase. Der API-Schlüssel liegt verschlüsselt im Vault, Nutzerinhalte werden HTML-escaped, und eine fehlschlagende E-Mail kann den Insert nie blockieren.

### Eine Browser-App ohne Browser testen
Das Null-Abhängigkeiten-Versprechen schließt Jest, Vitest und Headless-Browser-Gespanne aus.
**Lösung:** Die Logik wurde browserfrei faktorisiert und wird von **166 Tests auf Nodes eingebautem Runner** abgedeckt — keine Testabhängigkeiten, kein echtes Netzwerk. Die CI baut zudem das Bundle neu und schlägt fehl, wenn das committete Artefakt veraltet ist.

---

## 🚀 Loslegen

Ein moderner Browser und ein beliebiger statischer HTTP-Server (`file://` genügt nicht — ES-Module und das `fetch()` der JSON-Dateien werden dort blockiert).

```bash
# Entwicklung — kein Build-Schritt, rohe ES-Module:
python3 -m http.server 8000
# → http://localhost:8000/index-dev.html

# Produktions-Bundle:
npm install     # installiert esbuild, die einzige devDependency
npm run build   # app.js → app.bundle.js (minifiziert + Sourcemap)
# → http://localhost:8000/  (index.html)

npm test        # 166 Tests, node --test, ohne Framework
```

**Deployment.** Das Repository wird unverändert auf GitHub Pages deployt: Alle URLs sind relativ, die App läuft also identisch auf einer Domain-Root, unter einem Unterpfad und auf localhost. Release-Routine: einen Changelog-Eintrag hinzufügen (das *ist* der Versionssprung) → `SW_VERSION` erhöhen → bauen → pushen.

---

## ⚖️ Ehrliche Grenzen

- **Die PIN ist eine Oberflächenbarriere, keine starke Sicherheit.** Ohne die optionale Verschlüsselung ist die Sammlung per DevTools im `localStorage` lesbar. Mit aktiver Verschlüsselung ist beiläufiges Schnüffeln blockiert — aber eine 4-stellige PIN lässt sich offline brute-forcen, wenn jemand das Gerät in Händen hält. Eine vergessene PIN macht eine verschlüsselte lokale Sammlung unwiederbringlich.
- **Die Cloud-Anmeldung läuft über eine Test-E-Mail-Domain**, mit engen Limits — für ein persönliches Projekt in Ordnung, keine produktionsreife Zustellung.
- **Die Fortschrittshistorie kennt kein Back-fill** — die Statistikkurve beginnt an dem Tag, an dem das Feature installiert wurde.

---

## 📜 Lizenz & Marken

Veröffentlicht unter der **MIT-Lizenz** — siehe [LICENSE](LICENSE). © 2026 Arthur — [@Arts44](https://github.com/Arts44).

> **Inoffizielles Fanprojekt, nicht kommerziell.** „F1" und „UNO" sowie die Logos und Bilder von Teams und Fahrern gehören ihren jeweiligen Eigentümern. Dieses Werkzeug steht in keiner Verbindung zu Formula 1, Mattel oder einem Team und wird von ihnen weder unterstützt noch gesponsert.
