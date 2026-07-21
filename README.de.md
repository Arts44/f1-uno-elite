[🇬🇧 English](README.md) · [🇫🇷 Français](README.fr.md) · [🇪🇸 Español](README.es.md) · [🇨🇳 中文](README.zh.md) · [🇮🇹 Italiano](README.it.md) · [🇳🇱 Nederlands](README.nl.md) · 🇩🇪 **Deutsch**

# 🏎️ F1 UNO Élite — Collection Tracker

**Ein offline-first, installierbarer Sammelkarten-Tracker, gebaut mit Vanilla JavaScript und null Laufzeitabhängigkeiten — kein Framework, kein SDK, kein CDN, kein Backend nötig.**

[![tests](https://github.com/Arts44/f1-uno-elite/actions/workflows/tests.yml/badge.svg)](https://github.com/Arts44/f1-uno-elite/actions/workflows/tests.yml)
![License: MIT](https://img.shields.io/badge/license-MIT-green)
![PWA](https://img.shields.io/badge/PWA-installable%20%2B%20offline%20%E2%9C%93-brightgreen)
![Zero runtime deps](https://img.shields.io/badge/runtime%20dependencies-0-blue)
![Vanilla JS](https://img.shields.io/badge/JavaScript-vanilla-f7df1e?logo=javascript&logoColor=black)
![i18n](https://img.shields.io/badge/languages-7-purple)

## ▶️ **[Live ausprobieren → arts44.github.io/f1-uno-elite](https://arts44.github.io/f1-uno-elite/)**

Es ist eine **PWA**: Aus dem Browser heraus installiert läuft sie wie eine native App, vollständig offline, mit eigenem Icon — auf Desktop und Mobilgerät.

![Sammlungsraster — dunkles Theme](screenshots/grid-desktop-dark.jpg)

| Kartendetail — animierte Foil-Typen | Statistik-Dashboard |
|---|---|
| ![Kartenmodal](screenshots/modal-dark.jpg) | ![Statistikansicht](screenshots/stats-light.jpg) |

<sub>Weitere Aufnahmen in [`screenshots/`](screenshots/) — helles/dunkles Theme, mobil.</sub>

---

## ✨ Was sie kann

Eine komplette **F1 UNO Élite**-Sammelkartensammlung verwalten (101 Karten, jede in bis zu 16 Varianten — Grundfarben, Foils, Duals, Wild, Nitro, Promos):

- 📇 **Vollständige Sammlungsverwaltung** — im Besitz / Dubletten / Wunschliste / Favoriten, mit Stückzahlen pro Variante, Sofortsuche und umfangreichen Filtern.
- ✨ **Animiertes 6-stufiges Seltenheitssystem** — `epic → legendary → mythic → ultra → cosmic → divine`, automatisch aus der besten Variante im Besitz berechnet; Foil-Karten tragen bewegte Lichtreflexe, und die höchste Stufe erscheint als wandernder irisierender Verlauf (alles unter Beachtung von `prefers-reduced-motion`).
- 📴 **Funktioniert komplett offline** — die gesamte App wird von einem Service Worker vorgecacht; nach dem ersten Besuch ändert der Flugmodus nichts mehr.
- 🔄 **Transparente Auto-Updates** — neue Versionen werden im Hintergrund erkannt und mit einem Tipp auf ein dezentes Banner übernommen, dazu ein integriertes Changelog („was ist neu seit *deiner* letzten Version").
- 🌍 **7 Sprachen** — Englisch, Französisch, Spanisch, Chinesisch, Italienisch, Niederländisch, Deutsch. Jeder Text, jedes Abzeichen, jeder Changelog-Eintrag.
- 🎓 **Interaktives Tutorial in 26 Schritten** — eine geführte Tour, in der du die echten Aktionen *selbst ausführst*, in einer Sandbox, die am Ende jede Änderung zurücknimmt.
- 🏅 **50 Abzeichen & Titel** — 25 werden automatisch anhand messbarer Bedingungen freigeschaltet, 25 selbst deklariert.
- 📊 **Statistik-Dashboard** — Gesamtfortschritt, Seltenheits-Donut, Vervollständigung pro Kategorie, Highlights und eine tagesgenaue Fortschrittskurve (pures SVG, keine Chart-Bibliothek).
- 🔁 **Backups überall** — JSON-Export/-Import, ein komprimierter **Backup-Code** von Gerät zu Gerät, derselbe Code als scanbarer **QR-Code**, und ein optionales **Cloud-Backup** (Supabase).
- 🔐 **PIN-Sperre, Betrachtermodus & optionale Verschlüsselung** — eine 4-stellige PIN (SHA-256), ein Nur-Lese-Modus zum Teilen, und eine Opt-in-Verschlüsselung der Sammlung im Ruhezustand (PBKDF2 + AES-GCM, aus der PIN abgeleitet — natives Web Crypto).
- 🤝 **Sammlerwerkzeuge** — Fehl-, Dubletten- und Tauschlisten zum Mitnehmen auf die Tauschbörse.
- 💬 **Integriertes Feedback** — angemeldete Nutzer senden Vorschläge oder Fehlerberichte direkt aus den Einstellungen.

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
| Schriften | Selbst gehostete WOFF2 (SIL OFL) — keine Google-Fonts-Anfrage, 5 umschaltbare Schrift-Themes |
| Tests | **Nodes eingebauter Test-Runner** (`node --test`) — 166 Tests, kein Test-Framework |
| CI | GitHub Actions — Tests + Build + Aktualitätsprüfung des committeten Bundles bei jedem Push/PR |

**Null Laufzeitabhängigkeiten ist eine Designregel, kein Zufall.** Alles, was ein Framework oder SDK üblicherweise liefert — Rendering, Navigation zwischen Ansichten, i18n, Offline-Caching, Auth über REST, Verschlüsselung, QR-Erzeugung — ist direkt auf den Webplattform-APIs umgesetzt. Die App, die du installierst, ist exakt der Code in diesem Repository.

---

## 🧗 Technische Herausforderungen

Die Probleme, die diesen Code wirklich geprägt haben, und ihre Lösungen:

### Offline-first *und* immer aktuell
**Problem:** Ein Cache-first-Service-Worker macht die App offline unerschütterlich — und hervorragend darin, für immer veralteten Code auszuliefern. Installierte PWAs trifft es am härtesten: Sie können tagelang ohne Navigation offen bleiben, der Browser prüft den Worker also nie von selbst erneut.
**Lösung:** Der neue Worker lädt im Hintergrund und parkt bewusst im *waiting*-Zustand (kein automatisches `skipWaiting` — die Shell unter einer laufenden App auszutauschen ist der sichere Weg, ihren Zustand zu zerstören). Die App zeigt ein Ein-Tipp-Banner „neue Version — neu laden", das ihn per `SKIP_WAITING`-Nachricht befördert; ein ignoriertes Banner löst sich beim nächsten Kaltstart von selbst. Installierte PWAs rufen zusätzlich bei jeder Rückkehr in den Vordergrund und stündlich `registration.update()` auf. Die App-Version leitet sich aus dem neuesten Changelog-Eintrag ab: Veröffentlichen *heißt* Changelog schreiben — Version und Historie können nicht auseinanderlaufen.

### Eine E-Mail-Anmeldung, die eine installierte PWA übersteht
**Problem:** Die klassische Magic-Link-Anmeldung bricht in installierten PWAs: Der Link öffnet sich im Standardbrowser — einer anderen Speicherpartition — und die Sitzung landet dort, wo die App nicht ist.
**Lösung:** Die Authentifizierung nutzt **E-Mail-OTP-Codes** als Hauptweg: Der Code wird in der App selbst eingetippt, die Sitzung entsteht also jedes Mal im richtigen Kontext. Der Magic Link bleibt als Bonus auf Browserseite. Der gesamte GoTrue-Ablauf (Senden, Verifizieren, Refresh, Ablaufmarge) ist mit rohem `fetch()` umgesetzt — ohne Supabase-SDK.

### Ein Service Worker, der die API nie anfasst
**Problem:** Ein vorcachender Service Worker, der alles abfängt, liefert bereitwillig eine API-Antwort aus dem Cache — ein stiller Datenkorruptions-Bug, der erst in Produktion auftaucht.
**Lösung:** Der Worker schließt die Supabase-Origin vollständig aus (Anfragen passieren unangetastet), und Cloud-Aufrufe senden zusätzlich `cache: 'no-store'`. Doppelt gesichert, durch Tests verifiziert.

### Ein CSS-Refactoring, Byte für Byte als identisch bewiesen
**Problem:** Hunderte hartkodierte Abstandswerte auf Design-Tokens migrieren, mit „sieht für mich gleich aus" als einziger Garantie.
**Lösung:** Ausschließlich exakt passende Ersetzungen (kein Runden auf das nächstgelegene Token), danach ein Beweis: jedes `var()` in Vorher- und Nachher-Stylesheet zu Pixelwerten auflösen und beide Byte für Byte vergleichen — mathematisch identisches Rendering; Werte außerhalb der Skala blieben unangetastet und wurden für einen späteren, bewussten Durchgang inventarisiert.

### Feedback mit E-Mail-Benachrichtigung — ohne Server
**Problem:** Der Maintainer möchte für jedes in der App abgegebene Feedback eine E-Mail, aber es gibt kein Backend, das sie verschickt.
**Lösung:** Ein Postgres-Trigger auf der `feedback`-Tabelle ruft über `pg_net` die Resend-API auf — vollständig innerhalb von Supabase. Der API-Schlüssel liegt verschlüsselt im Supabase Vault (niemals in diesem Repository), Nutzerinhalte werden HTML-escaped, und eine fehlschlagende E-Mail kann den Insert nie blockieren. Clientseitig: ein Cooldown; serverseitig: eine SQL-Drossel (max. 5/Stunde pro Nutzer), per Trigger erzwungen.

### 7 Sprachen ohne i18n-Bibliothek
**Problem:** Jeder sichtbare Text — Oberfläche, Abzeichen, Tutorial, Changelog-Einträge, Fehlermeldungen — in 7 Sprachen, ohne Framework, das Disziplin erzwingt.
**Lösung:** Ein kleiner `t()`-Helfer über Wörterbuchdateien, `data-i18n`-Attribute für statisches HTML und Unit-Tests, die fehlschlagen, sobald einem Changelog-Eintrag auch nur eine der 7 Sprachen fehlt. Englisch ist der erklärte Fallback; eine harte Projektregel besagt: Ein Text, den es nur auf Englisch gibt, ist eine unvollständige Änderung.

### Eine Browser-App ohne Browser testen
**Problem:** Das Null-Abhängigkeiten-Versprechen schließt Jest, Vitest und Headless-Browser-Gespanne aus.
**Lösung:** Die Logik wurde browserfrei faktorisiert (Seltenheitsberechnung, Speichermigration, Backup-Kodierung, Statistiken, Abzeichen, Verschlüsselung, Cloud-Helfer, Update-Logik …) und wird von **166 Tests auf Nodes eingebautem Runner** abgedeckt — null Testabhängigkeiten, kein echtes Netzwerk (jeder Cloud-Test stubbt `fetch`). Die CI baut zudem das Bundle neu und schlägt fehl, wenn das committete Artefakt veraltet ist: Der deployte Code stimmt beweisbar mit den Quellen überein.

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

# Tests:
npm test        # 166 Tests, node --test, ohne Framework
```

### Deployment

Das Repository wird **unverändert** auf GitHub Pages deployt (statisch, kein Server-Build): Alle URLs sind relativ, die App läuft also identisch auf einer Domain-Root, unter einem Unterpfad und auf localhost. Das gebaute Bundle ist committet, weil Pages keinen npm-Schritt ausführt; die CI stellt sicher, dass es nie veraltet. Release-Routine: einen Changelog-Eintrag hinzufügen (das *ist* der Versionssprung) → `SW_VERSION` in `sw.js` erhöhen → bauen → pushen. Wiederkehrende Besucher erhalten das Update-Banner.

---

## ⚖️ Ehrliche Grenzen

- **Die PIN ist eine Oberflächenbarriere, keine starke Sicherheit.** Ohne die optionale Verschlüsselung ist die Sammlung per DevTools im `localStorage` lesbar. Mit aktiver Verschlüsselung ist beiläufiges Schnüffeln blockiert — aber eine 4-stellige PIN lässt sich offline brute-forcen, wenn jemand das Gerät in Händen hält. Das schützt vor Gelegenheitsneugier, nicht vor Experten. Eine vergessene PIN macht eine verschlüsselte lokale Sammlung unwiederbringlich — Backups aufbewahren.
- **Die Cloud-Anmeldung läuft über eine Test-E-Mail-Domain.** Auth- und Feedback-Mails gehen derzeit über Standard-/Test-Absenderdomains mit engen Limits — für ein persönliches Projekt in Ordnung, keine produktionsreife E-Mail-Zustellung. Ein eigenes SMTP/eigene Domain würde das beheben.
- **Die Fortschrittshistorie kennt kein Back-fill** — die Statistikkurve beginnt an dem Tag, an dem das Feature installiert wurde; es gibt keinen Zeitstempel pro Karte, um die Vergangenheit zu rekonstruieren.

---

## 📜 Lizenz & Marken

Veröffentlicht unter der **MIT-Lizenz** — siehe [LICENSE](LICENSE). © 2026 Arthur.

> „F1" und „UNO" sowie die Logos und Bilder von Teams und Fahrern gehören ihren jeweiligen Eigentümern. Dies ist ein **inoffizielles**, persönliches Werkzeug zur Sammlungsverwaltung — ohne Verbindung zu, Billigung durch oder Sponsoring von Formula 1, Mattel oder irgendeinem Team.
