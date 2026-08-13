[🇬🇧 English](README.md) · [🇫🇷 Français](README.fr.md) · [🇪🇸 Español](README.es.md) · [🇨🇳 中文](README.zh.md) · [🇮🇹 Italiano](README.it.md) · [🇳🇱 Nederlands](README.nl.md) · 🇩🇪 **Deutsch**

# 🏎️ F1 UNO Élite — Collection Tracker

**Ein offline-first, installierbarer Sammelkarten-Tracker, gebaut mit Vanilla JavaScript und null Laufzeitabhängigkeiten — kein Framework, kein SDK, kein CDN, kein Backend.**

[![tests](https://github.com/Arts44/f1-uno-elite/actions/workflows/tests.yml/badge.svg)](https://github.com/Arts44/f1-uno-elite/actions/workflows/tests.yml)
![License: MIT](https://img.shields.io/badge/license-MIT-green)
![PWA](https://img.shields.io/badge/PWA-installable%20%2B%20offline%20%E2%9C%93-brightgreen)
![Zero runtime deps](https://img.shields.io/badge/runtime%20dependencies-0-blue)
![Vanilla JS](https://img.shields.io/badge/JavaScript-vanilla-f7df1e?logo=javascript&logoColor=black)
![i18n](https://img.shields.io/badge/languages-7-purple)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/4e7d9096628044aba780a0b2000aee8c)](https://app.codacy.com/gh/Arts44/f1-uno-elite/dashboard)

## ▶️ **[Live ausprobieren → arts44.github.io/f1-uno-elite](https://arts44.github.io/f1-uno-elite/)**

Es ist eine **PWA**: aus dem Browser installiert läuft sie wie eine native App, vollständig offline, mit eigenem Icon — auf Desktop und Mobilgerät.

![Sammlungsraster — dunkles Theme](screenshots/grid-desktop-dark.jpg)

| Kartenansicht — animierte Foil-Typen | Statistik-Dashboard |
|---|---|
| ![Kartenmodal](screenshots/modal-dark.jpg) | ![Statistikansicht](screenshots/stats-light.jpg) |

<sub>Weitere Aufnahmen in [`screenshots/`](screenshots/) — helles und dunkles Theme, Desktop und mobil.</sub>

### ✨ In Bewegung

| Schnelles Hinzufügen — ein Tipp, ein Exemplar | Navigation mit Perle | Abzeichen — 120, sieben Familien | Zwei Saisons, einen Tipp entfernt |
|---|---|---|---|
| ![Demo schnelles Hinzufügen](screenshots/demo-quick-add.gif) | ![Demo Navigation](screenshots/demo-nav.gif) | ![Demo Abzeichen](screenshots/demo-badges.gif) | ![Seasons demo](screenshots/demo-seasons.gif) |

Jede Demo erzeugt `capture_demos.py` aus demselben deterministischen Seed wie die Standbilder, die zwischen zwei Läufen **Byte für Byte identisch** sind: Jede Animation wird vor jeder Aufnahme auf einer gewählten Phase eingefroren. Die GIFs laufen mit 33,3 fps; die 60-fps-Fassung liegt daneben: [schnelles Hinzufügen](screenshots/demo-quick-add.mp4) · [Navigation](screenshots/demo-nav.mp4) · [Abzeichen](screenshots/demo-badges.mp4) · [Saisons](screenshots/demo-seasons.mp4).


### Neu in 1.29 — der v2-Durchgang

| Abzeichen — Familien, Fortschritt, angepinntes Ziel | Abzeichen-Detail — Freischaltdatum, beitragende Karten |
|---|---|
| ![Abzeichen — Familien, Fortschritt, angepinntes Ziel](screenshots/badges-dark.jpg) | ![Abzeichen-Detail — Freischaltdatum, beitragende Karten](screenshots/badges-detail.jpg) |

| Konto — Cloud, Backups, Gefahrenzone | Einstellungen — die Sicherheitskarte |
|---|---|
| ![Konto — Cloud, Backups, Gefahrenzone](screenshots/account-dark.jpg) | ![Einstellungen — die Sicherheitskarte](screenshots/settings-dark.jpg) |

| PIN-Entsperrung — segmentiert und maskiert | E-Mail-Code — dieselbe geteilte Komponente |
|---|---|
| ![PIN-Entsperrung — segmentiert und maskiert](screenshots/pin-screen.jpg) | ![E-Mail-Code — dieselbe geteilte Komponente](screenshots/otp-input.jpg) |

| Streckenverläufe — neu aus echten GPS-Daten gezeichnet | Abzeichen — helles Thema |
|---|---|
| ![Streckenverläufe — neu aus echten GPS-Daten gezeichnet](screenshots/circuit-gp.jpg) | ![Abzeichen — helles Thema](screenshots/badges-light.jpg) |

| Führung — fünf Kapitel, eins pro Seite | Die fünf Foil-Familien, auf der beruhigten Stufe |
|---|---|
| ![Führung — fünf Kapitel, eins pro Seite](screenshots/tutorial-chapter.jpg) | ![Die fünf Foil-Familien, auf der beruhigten Stufe](screenshots/foil-family.jpg) |


![Untere Navigation — Bead und Kerbe bewegen sich als eine Einheit](screenshots/nav-bead.jpg)

<sub>In 7 Sprachen lokalisiert — jeder Text, jedes Abzeichen, jeder Changelog-Eintrag</sub>

| Ewige Seltenheit — Champions mit komplettem Set | Schnell hinzufügen — Variantenauswahl |
|---|---|
| ![Ewige Seltenheit — Champions mit komplettem Set](screenshots/i18n/eternal-tile.de.jpg) | ![Schnell hinzufügen — Variantenauswahl](screenshots/i18n/quick-add.de.jpg) |

| Seltenheits-Donut mit Ewig | Rückgängig-Hinweis |
|---|---|
| ![Seltenheits-Donut mit Ewig](screenshots/i18n/stats-rarity.de.jpg) | ![Rückgängig-Hinweis](screenshots/i18n/toast.de.jpg) |

---

## ✨ Was sie kann

Eine komplette **F1 UNO Élite**-Sammelkartensammlung verwalten — 101 Karten für die Saison 2025, jede in bis zu 16 Varianten (Grundfarben, Foils, Duals, Wild, Nitro, Promos):

- 📇 **Vollständige Sammlungsverwaltung** — im Besitz / Dubletten / Wunschliste / Favoriten, Stückzahlen pro Variante, die gesamte Sammlung immer im Blick.
- ➕ **Schnelles Hinzufügen mit einer Geste** — ein +-Button auf jeder Kachel öffnet eine Variantenauswahl: ein Tipp fügt ein Exemplar hinzu, mit „Rückgängig“-Toast. Der Header zeigt deinen Fortschritt live (besessen/gesamt) über einer feinen Fortschrittslinie.
- ✨ **Animiertes 7-stufiges Seltenheitssystem** — `epic → legendary → mythic → ultra → cosmic → divine → eternal`, berechnet aus der besten Variante im Besitz, +1 Stufe bei komplettem Set (jede Variante im Besitz) — `eternal` ist nur so erreichbar. Foil-Karten tragen bewegte Lichtreflexe, `divine` erscheint als irisierender Verlauf und `eternal` in funkelndem Schwarz-Gold (alles unter Beachtung von `prefers-reduced-motion`).
- 📴 **Funktioniert komplett offline** — die gesamte App wird von einem Service Worker vorgecacht; nach dem ersten Besuch ändert der Flugmodus nichts.
- 🔄 **Transparente Auto-Updates** — neue Versionen werden im Hintergrund erkannt und mit einem Tipp übernommen, dazu ein integriertes Changelog, das zeigt, was sich seit *deiner* letzten Version geändert hat.
- 🌍 **7 Sprachen** — Englisch, Französisch, Spanisch, Chinesisch, Italienisch, Niederländisch, Deutsch. Jeder Text, jedes Abzeichen, jeder Changelog-Eintrag.
- 🎓 **Interaktives Tutorial, 33 Schritte in 5 Kapiteln** — ein Kapitel pro Seite, in der Reihenfolge der Tabs. Eine Führung, in der du die *echten* Aktionen ausführst, in einer Sandbox, die am Ende jede Änderung zurücknimmt.
- 🏅 **Eine Abzeichen-Seite, die deine Sammlung erzählt** — 120 Abzeichen in 7 Familien: Werdegang, komplette Sets, Foils, Farben, Leidenschaft und selbst bestätigte Erlebnisse. Ein Fortschrittsring mit deinem Titel, eine *Nächstes Abzeichen*-Karte, die immer das nächstliegende zeigt — oder das Ziel, das du angepinnt hast —, eine Meilenstein-Leiter von 1 bis 101 Karten, Freischaltdaten und eine echte Feier, wenn eines fällt: gebündelter Hinweis, kurze Vibration und ein Aufplatzen der Kachel. Deine Sammlerkarte lässt sich als teilbares Bild exportieren.
- 📊 **Statistik-Dashboard** — Gesamtfortschritt, Seltenheits-Donut, Vollständigkeit je Kategorie, Höhepunkte, eine Tag-für-Tag-Fortschrittskurve (reines SVG, keine Diagrammbibliothek) und die Sammlerwerkzeuge als innere Tabs: Fehl-, Dubletten- und Tauschlisten.
- 👤 **Eine eigene Konto-Seite** — Cloud-Anmeldung per E-Mail-Code, Sichern/Wiederherstellen, JSON-Export/-Import, QR-Übertragung, Feedback in der App und eine Gefahrenzone mit drei Löschbereichen, jeder durch ein einzutippendes Wort geschützt. Im Zuschauermodus wird die ganze Seite durch einen gesperrten Zustand ersetzt — die Bedienelemente fehlen, sie sind nicht ausgegraut.
- 🔁 **Backups überall** — JSON-Export/-Import, ein komprimierter Backup-Code von Gerät zu Gerät, derselbe Code als scanbarer QR-Code, und optionales Cloud-Backup.
- 🔐 **PIN-Sperre, Zuschauermodus & optionale Verschlüsselung** — eine 4-stellige PIN auf einem Segmentfeld (jede Ziffer kurz sichtbar, dann maskiert), geführte Abläufe zum Anlegen/Ändern/Deaktivieren mit sichtbarem Fortschritt, ein Nur-Lese-Modus zum Teilen und optionale Verschlüsselung der Sammlung im Ruhezustand (PBKDF2 + AES-GCM, aus der PIN abgeleitet).
- 🧭 **Eine Navigationsleiste mit Bead** — Pille, Kerbe und Bead sind ein einziger SVG-Pfad, der Bild für Bild aus einer einzigen Animationsuhr neu berechnet wird, sodass beide nie auseinanderlaufen. Ziehbar, per Tastatur erreichbar und `prefers-reduced-motion` wird respektiert.

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
| Tests | **Nodes eingebauter Test-Runner** (`node --test`) — 854 Tests, kein Test-Framework |
| CI | GitHub Actions — Tests + Build + Aktualitätsprüfung des committeten Bundles bei jedem Push/PR |

**Null Laufzeitabhängigkeiten ist eine Designregel, kein Zufall.** Alles, was ein Framework oder SDK üblicherweise liefert — Rendering, Navigation zwischen Ansichten, i18n, Offline-Caching, Auth über REST, Verschlüsselung, QR-Erzeugung — ist direkt auf den Webplattform-APIs umgesetzt. Die App, die du installierst, ist exakt der Code in diesem Repository. Seitdem: `cloud.js` (726 Zeilen) wurde hinter 61 nie geänderten Charakterisierungstests in vier Module geteilt, was `pushSeason(s)` / `listCloudSeasons()` freischaltete — gegen die echte Supabase-Datenbank geprüft; und zwei XSS-Lücken wurden an der Quelle geschlossen, in `tEsc()` und an den Dateneingängen.

---

## 🧱 Die Architektur in Kürze

Der Quellcode besteht aus fokussierten **ES-Modulen** hinter einem einzigen Einstiegspunkt, `app.js`, von esbuild zu einem committeten `app.bundle.js` gebündelt (GitHub Pages führt keinen Build-Schritt aus). Zwei HTML-Einstiegspunkte teilen sich alles Übrige: `index-dev.html` lädt die rohen Module für die Entwicklung, `index.html` lädt das Bundle.

| Schicht | Module |
|---|---|
| Zustand & Daten | `storage.js` (localStorage, saisonbezogen, Migration v1→v2), `data.js`, `history.js` |
| Oberfläche | `render.js` (Raster, Filter, Kartenansicht), `stats.js`, `badges.js`, `pin.js` (Einstellungen) |
| Plattform | `sw.js` (Precache), `update.js` (Updates), `install.js`, `secure-store.js` |
| Optionale Cloud | `cloud-http/auth/sync/ui.js`, `feedback.js`, `settings-sync.js` — alle über rohes REST |

Aktionen laufen über **einen einzigen delegierten Listener** auf `[data-action]` statt über Inline-Handler — was auch den Betrachtermodus möglich macht, da ein einziges `VIEWER_BLOCKED`-Set jeden Schreibzugriff sperrt. Oberflächentext steht nie im Code: er läuft über `t()` gegen Wörterbücher, die alle 7 Sprachen abdecken.

### Die Form des Projekts

Vier klassische Skripte veröffentlichen `window.__*`-Globals vor den Modulen; alles andere ist ein ES-Modul hinter einem einzigen Einstiegspunkt.

```mermaid
flowchart TB
  subgraph BOOT["Start"]
    H["index.html"] --> C["translations.js<br/>card-descriptions.js<br/>data-embedded.js<br/>cloud-config.js"]
    H --> B["app.bundle.js"]
  end
  B --> APP["app.js"]
  APP --> UI
  APP --> ST
  APP --> PL
  subgraph UI["Ansichten"]
    R["render.js"]; S["stats.js"]; BG["badges.js"]; PN["pin.js"]; AC["account.js"]; TU["tutorial.js"]; PH["pagehead.js"]; IC["icons.js"]
  end
  subgraph ST["Zustand"]
    STO["storage.js"]; DA["data.js"]; HI["history.js"]; SEC["secure-store.js"]; I18["i18n.js"]
  end
  subgraph PL["Plattform"]
    SW["sw.js"]; UP["update.js"]; IN["install.js"]; BK["backup.js"]
  end
  subgraph CL["Optionale Cloud"]
    CLO["cloud-*.js (4)"]; FB["feedback.js"]; SS["settings-sync.js"]
  end
  ST --> CL
  STO --> SEC
```


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
**Lösung:** Ein Postgres-Trigger auf der `feedback`-Tabelle ruft über `pg_net` die Resend-API auf — vollständig innerhalb von Supabase. Der API-Schlüssel liegt verschlüsselt im Vault, Nutzerinhalte werden in SQL HTML-escaped, und der Trigger schluckt seine eigenen Fehler (`exception when others`): Eine fehlschlagende E-Mail kann den Insert nie blockieren. Ein **zweiter Trigger setzt die eigentliche Ratenbegrenzung in der Datenbank durch** — fünf Rückmeldungen pro Nutzer und Stunde, geworfen als `rate_limited` — und die App übersetzt diesen Fehler in einen typisierten Code. Die Wartezeit auf Client-Seite ist eine Höflichkeit; der Schutz liegt auf dem Server.

### Eine Browser-App ohne Browser testen
Das Null-Abhängigkeiten-Versprechen schließt Jest, Vitest und Headless-Browser-Gespanne aus.
**Lösung:** Die Logik wurde browserfrei faktorisiert und wird von **854 Tests auf Nodes eingebautem Runner** abgedeckt — keine Testabhängigkeiten, kein echtes Netzwerk. Die CI baut zudem das Bundle neu und schlägt fehl, wenn das committete Artefakt veraltet ist.

---

### Was die Tests abdecken — und was nicht

854 Tests auf Nodes eingebautem Runner, ohne Framework. Genauigkeit über die Grenze zählt mehr als die Zahl:

- **Abgedeckt:** Speichermigrationen und das saisonbezogene Schlüsselschema; die siebenstufige Seltenheitsleiter samt Aufstieg durch ein vollständiges Set; alle Abzeichenbedingungen und das Schwierigkeitsmodell; die Sammlerlisten (fehlend, doppelt, Tausch); die Kodierungsdurchläufe der Sicherungscodes; die Cloud-Helfer gegen ein nachgebildetes `fetch` samt Fehlerpfaden; die Gleichheit der i18n-Schlüssel über 7 Sprachen und das Erkennen doppelter Schlüssel; der Precache des Service Workers gegen den echten Importgraphen; die Markup-Verträge des Tastaturzugangs; die Herkunft jedes von außen gespeisten `innerHTML`; Kontrast in beiden Themen von Hand geprüft.
- **Nicht abgedeckt:** das tatsächliche Rendern (keine DOM-Zusicherungen über Markup-Strings hinaus), das Laufzeitverhalten des Service Workers, echte Netzwerkaufrufe, IndexedDB, Installationsaufforderungen und alles, was eine Browser-Engine braucht — das wird von Hand und durch den deterministischen Screenshot-Durchlauf geprüft, nicht durch die Suite. Der oben genannte Prozentsatz misst nur diese browserfreie Schicht — so ist er zu lesen, nicht als Maß für die App.

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

npm test        # 854 Tests, node --test, ohne Framework
```

**Deployment.** Das Repository wird unverändert auf GitHub Pages deployt: Alle URLs sind relativ, die App läuft also identisch auf einer Domain-Root, unter einem Unterpfad und auf localhost. Release-Routine: einen Changelog-Eintrag hinzufügen (das *ist* der Versionssprung) → `SW_VERSION` erhöhen → bauen → pushen.

---

## ⚖️ Ehrliche Grenzen

- **Die PIN ist eine Oberflächenbarriere, keine starke Sicherheit.** Ohne die optionale Verschlüsselung ist die Sammlung per DevTools im `localStorage` lesbar. Mit aktiver Verschlüsselung ist beiläufiges Schnüffeln blockiert — aber eine 4-stellige PIN lässt sich offline brute-forcen, wenn jemand das Gerät in Händen hält. Eine vergessene PIN macht eine verschlüsselte lokale Sammlung unwiederbringlich.
- **Feedback-Benachrichtigungen gehen von Resends Testdomain aus** (`onboarding@resend.dev`). Von dieser Domain aus stellt Resend nur an die Adresse des Kontoinhabers zu: Die Benachrichtigung erreicht den Betreuer und sonst niemanden. Von anderswo zu senden hieße, eine Domain zu besitzen und zu verifizieren. Das ist eine bewusst hingenommene Grenze, kein Fehler: Die Rückmeldung wird ohnehin in der Datenbank gespeichert, und ein fehlgeschlagener Versand blockiert das nie.
- **Anmeldecodes laufen über einen in Supabase konfigurierten eigenen SMTP-Anbieter** — eine Kette, die von den obigen Benachrichtigungen völlig getrennt ist. Zustellung, Kontingente und Absenderreputation hängen von diesem Anbieter ab und werden von diesem Repository nicht gemessen; Anmelde-E-Mails sind für ein persönliches Projekt als «nach bestem Bemühen» zu verstehen.
- **Die Fortschrittshistorie kennt kein Back-fill** — die Statistikkurve beginnt an dem Tag, an dem das Feature installiert wurde.
- **Die Codacy-Note ist A — und eines ihrer vier Qualitätsziele steht auf Rot.** Gemessen an Commit `b680aed`, 123 Dateien, 9 643 Zeilen. Grün: Duplikation bei 5 % (Ziel 10 %) und Abdeckung bei 69 % — Codacys Anzeige und das lokale `npm run test:cov` (69,21 %) stimmen diesmal überein, gegenüber einem Ziel von 60 %: neun Punkte Spielraum statt der früheren 2,7. Rot: die Komplexität, mit **45 % der analysierten Dateien über der Schwelle** gegenüber einem Ziel von 10 % — das Verhältnis *stieg*, nachdem `cloud.js` in vier Module geteilt wurde, was viel über die Metrik sagt: Sie zählt *Dateien*, bestraft also eine Basis aus wenigen großen Modulen. Das ist eine Tatsache über die Messung, keine Ausrede; `badges.js` macht wirklich zu viel. Und eine vierte Zahl, die das Abzeichen verdeckt: **2 offene Issues**, statt 11 — die 8 in den Aufnahmeskripten und die 2 ungenutzten Variablen in `account.js` wurden behoben, nicht stummgeschaltet (`c5941cd`). Die beiden Verbliebenen sind **dieselbe Regel, die auf eine Zeichenkette anspringt, die kein Geheimnis ist**: ein Schein-Token in `capture_seed.py` (`demo.access.token`, Entwicklungswerkzeug, das nie ausgeliefert wird) und `SESSION_KEY = 'f1uno_cloud_session'` in `cloud-auth.js`, also der *Name* eines localStorage-Schlüssels. Sie bleiben bewusst sichtbar: Ein Fehlalarm, der auf der Übersicht stehen bleibt, kostet eine Zeile Erklärung — die Regel abzuschalten würde auch den echten Fall verdecken, den sie fangen soll.

---

## 🔩 Engineering-Notizen

Null Laufzeitabhängigkeiten (nur esbuild, beim Build); typografische Untergrenze von 11 px, geprüft über 5 Schriftthemen × 2 Farbthemen × 320/375/Desktop (eine einzige Ausnahme, das « ÉLITE » der Wortmarke mit 8 px, das ist Branding); Layoutverschiebung gemessen — und jetzt tatsächlich null: Die Kachelhöhe ist FEST (zuvor 13 verschiedene Höhen, von 246,69 bis 292,69 px), das Skelett liest dieselbe CSS-Variable und passt daher exakt — zum Preis von +19,4 % Scrollen, dem Aufwand, überall den schlimmsten Fall zu reservieren; das schnelle Hinzufügen profiliert und optimiert (~300 ms → ~45 ms auf einem Mittelklasse-Handy, Einzelmessung, in der CI nicht wiederholt); optionale lokale Verschlüsselung am PIN (PBKDF2 + AES-GCM); Zuschauermodus in der Logik verriegelt, nicht im CSS; Screenshots von einem deterministischen Skript im Repo regeneriert, die drei animierten Demos geskriptet und reproduzierbar; 854 Tests in Vanilla-JS mit Nodes eingebautem Runner. Alle Details im [englischen README](README.md).

---

## ☕ Den Entwickler unterstützen

Ein einziger ausgehender Link unter **Einstellungen → Über** führt zu [Ko-fi](https://ko-fi.com/arts44). Er unterstützt **mich, den Entwickler** — nicht die App und nicht ihr Themenfeld. Kein Drittanbieter-Skript, kein Tracking-Pixel, keine persönlichen Daten verlassen das Gerät: Es ist ein `<a target="_blank" rel="noopener noreferrer">`, nicht mehr. Die URL lebt in einer einzigen Konstante (`SUPPORT_URL` in `pin.js`); leert man sie, verschwindet die Zeile ganz. Offline wird die Zeile sichtbar inaktiv, statt auf eine tote Seite zu führen.

**Eine Spende schaltet nichts frei** — keine Funktion, kein Abzeichen, keinen Namen in einer Liste. Eine Spende, die etwas kaufte, wäre ein Kauf, und dies bleibt ein nicht-kommerzielles Fanprojekt.

---

## 📜 Lizenz & Marken

Veröffentlicht unter der **MIT-Lizenz** — siehe [LICENSE](LICENSE). © 2026 Arthur — [@Arts44](https://github.com/Arts44).

> **Inoffizielles Fanprojekt, nicht kommerziell.** „F1" und „UNO" sowie die Logos und Bilder von Teams und Fahrern gehören ihren jeweiligen Eigentümern. Dieses Werkzeug steht in keiner Verbindung zu Formula 1, Mattel oder einem Team und wird von ihnen weder unterstützt noch gesponsert.
