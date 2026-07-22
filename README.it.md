[🇬🇧 English](README.md) · [🇫🇷 Français](README.fr.md) · [🇪🇸 Español](README.es.md) · [🇨🇳 中文](README.zh.md) · 🇮🇹 **Italiano** · [🇳🇱 Nederlands](README.nl.md) · [🇩🇪 Deutsch](README.de.md)

# 🏎️ F1 UNO Élite — Collection Tracker

**Un tracker per collezioni di carte, installabile e offline-first, costruito in JavaScript vanilla con zero dipendenze a runtime — niente framework, niente SDK, niente CDN, nessun backend.**

[![tests](https://github.com/Arts44/f1-uno-elite/actions/workflows/tests.yml/badge.svg)](https://github.com/Arts44/f1-uno-elite/actions/workflows/tests.yml)
![License: MIT](https://img.shields.io/badge/license-MIT-green)
![PWA](https://img.shields.io/badge/PWA-installable%20%2B%20offline%20%E2%9C%93-brightgreen)
![Zero runtime deps](https://img.shields.io/badge/runtime%20dependencies-0-blue)
![Vanilla JS](https://img.shields.io/badge/JavaScript-vanilla-f7df1e?logo=javascript&logoColor=black)
![i18n](https://img.shields.io/badge/languages-7-purple)

## ▶️ **[Provala dal vivo → arts44.github.io/f1-uno-elite](https://arts44.github.io/f1-uno-elite/)**

È una **PWA**: installala dal browser e funziona come un'app nativa, completamente offline, con la propria icona — su desktop e mobile.

![Griglia della collezione — tema scuro](screenshots/grid-desktop-dark.jpg)

| Scheda carta — tipi foil animati | Dashboard delle statistiche |
|---|---|
| ![Modale carta](screenshots/modal-dark.jpg) | ![Vista statistiche](screenshots/stats-light.jpg) |

<sub>Altre catture in [`screenshots/`](screenshots/) — temi chiaro e scuro, desktop e mobile.</sub>

---

## ✨ Cosa fa

Tenere traccia di una collezione completa di carte **F1 UNO Élite** — 101 carte, ciascuna in fino a 16 varianti (colori base, foil, dual, Wild, Nitro, promo):

- 📇 **Gestione completa della collezione** — possedute / doppioni / wishlist / preferite, quantità per variante, ricerca istantanea e filtri avanzati.
- ✨ **Sistema di rarità animato a 6 livelli** — `epic → legendary → mythic → ultra → cosmic → divine`, calcolato dalla migliore variante posseduta. Le carte foil hanno riflessi di luce animati e il livello supremo si mostra come un gradiente iridescente in movimento (il tutto rispettando `prefers-reduced-motion`).
- 📴 **Funziona completamente offline** — l'intera app è precachata da un service worker; dopo la prima visita, la modalità aereo non cambia nulla.
- 🔄 **Aggiornamenti trasparenti** — le nuove versioni vengono rilevate in background e applicate con un tocco, con un changelog integrato che mostra cosa è cambiato dalla *tua* ultima versione.
- 🌍 **7 lingue** — inglese, francese, spagnolo, cinese, italiano, olandese, tedesco. Ogni testo, badge e voce del changelog.
- 🎓 **Tutorial interattivo in 26 passi** — un tour guidato in cui *esegui* le azioni reali, in una sandbox che annulla ogni modifica alla fine.
- 🏅 **50 badge e titoli** — 25 sbloccati automaticamente da condizioni misurate, 25 autodichiarati.
- 📊 **Dashboard delle statistiche** — progresso globale, ciambella delle rarità, completamento per categoria, highlights e una curva di progressione giorno per giorno (SVG puro, nessuna libreria di grafici).
- 🔁 **Backup ovunque** — export/import JSON, un codice di backup compresso da dispositivo a dispositivo, lo stesso codice come QR scansionabile, e backup cloud opzionale.
- 🔐 **Blocco PIN, modalità visitatore e crittografia opzionale** — un PIN a 4 cifre (SHA-256), una modalità di sola lettura per condividere, e crittografia a riposo opt-in della collezione (PBKDF2 + AES-GCM, derivata dal PIN).
- 🤝 **Strumenti da collezionista** — liste di mancanti / doppioni / scambi da portare a un raduno.

---

## 🛠️ Stack tecnico

| Area | Scelta |
|---|---|
| Linguaggio | **JavaScript vanilla** (moduli ES nativi), HTML5, CSS3 — nessun framework |
| Dipendenze a runtime | **Zero.** Nessun pacchetto npm, nessun CDN, nessun SDK a runtime |
| Build | [esbuild](https://esbuild.github.io/) (l'*unica* devDependency) → un bundle IIFE minificato |
| Offline / PWA | Service Worker scritto a mano (precache versionata, shell cache-first) + Web App Manifest |
| Cloud (opzionale) | **Supabase in `fetch()` REST puro** — senza SDK; auth con codice OTP via e-mail, Row Level Security |
| Crittografia | **Web Crypto** nativo — SHA-256 (PIN), PBKDF2 + AES-GCM (crittografia a riposo opzionale) |
| Codici QR | Encoder a file singolo vendorizzato ([Project Nayuki](https://www.nayuki.io/page/qr-code-generator-library), MIT) |
| Font | WOFF2 self-hosted (SIL OFL) — nessuna richiesta a Google Fonts, 5 temi a scelta |
| Test | **Test runner integrato di Node** (`node --test`) — 166 test, nessun framework di test |
| CI | GitHub Actions — test + build + verifica di freschezza del bundle committato a ogni push/PR |

**Zero dipendenze a runtime è una regola di progettazione, non un caso.** Tutto ciò che un framework o un SDK fornirebbe — rendering, navigazione tra viste, i18n, cache offline, auth via REST, crittografia, generazione di QR — è costruito direttamente sulle API della piattaforma web. L'app che installi è esattamente il codice di questo repository.

---

## 🧱 L'architettura in breve

Il codice è un insieme di **moduli ES** mirati dietro un unico punto di ingresso, `app.js`, assemblati da esbuild in un `app.bundle.js` committato (GitHub Pages non esegue alcuno step di build). Due punti di ingresso HTML condividono tutto il resto: `index-dev.html` carica i moduli grezzi per lo sviluppo, `index.html` carica il bundle.

| Livello | Moduli |
|---|---|
| Stato e dati | `storage.js` (localStorage, per stagione, migrazione v1→v2), `data.js`, `history.js` |
| Interfaccia | `render.js` (griglia, filtri, scheda carta), `stats.js`, `badges.js`, `pin.js` (impostazioni) |
| Piattaforma | `sw.js` (precache), `update.js` (aggiornamenti), `install.js`, `secure-store.js` |
| Cloud opzionale | `cloud.js`, `feedback.js`, `settings-sync.js` — tutti in REST puro |

Le azioni passano da **un unico listener delegato** su `[data-action]` invece che da handler inline — ed è anche ciò che rende possibile la modalità visitatore, dato che un solo insieme `VIEWER_BLOCKED` blocca ogni scrittura. Il testo dell'interfaccia non compare mai nel codice: passa da `t()` su dizionari che coprono tutte e 7 le lingue.

---

## 🧗 Sfide tecniche

I problemi che hanno davvero plasmato questo codice:

### Offline-first *e* sempre aggiornata
Un service worker cache-first rende l'app inossidabile offline — ed eccellente nel servire codice stantio all'infinito. Le PWA installate sono le più colpite: possono restare aperte per giorni senza una navigazione, quindi il browser non ricontrolla mai il worker.
**Soluzione:** il nuovo worker si scarica in background e si parcheggia deliberatamente nello stato *waiting* (niente `skipWaiting` automatico — sostituire la shell sotto un'app in esecuzione è il modo perfetto per corrompere lo stato). Un banner lo promuove con un tocco tramite `SKIP_WAITING`; un banner ignorato si risolve al successivo avvio a freddo. Le PWA installate chiamano inoltre `registration.update()` a ogni ritorno in primo piano e ogni ora. La versione dell'app deriva dalla voce più recente del changelog: pubblicare *è* scrivere il changelog.

### Un accesso via e-mail che sopravvive a una PWA installata
Il classico magic link si rompe nelle PWA installate: il link si apre nel browser predefinito — una partizione di storage diversa — e la sessione atterra dove l'app non c'è.
**Soluzione:** l'autenticazione usa i **codici OTP via e-mail** come via principale, digitati nell'app stessa, quindi la sessione nasce ogni volta nel contesto giusto. L'intero flusso GoTrue è implementato in `fetch()` puro.

### Un service worker che non tocca mai l'API
Un service worker di precache che intercetta tutto servirà volentieri una risposta API dalla cache — un bug silenzioso di corruzione dati che compare solo in produzione.
**Soluzione:** il worker esclude completamente l'origine Supabase, e le chiamate cloud inviano anche `cache: 'no-store'`.

### Un refactor CSS dimostrato identico, byte per byte
Migrare centinaia di valori di spaziatura scritti a mano verso token, con «a me sembra uguale» come unica garanzia.
**Soluzione:** sostituzione solo a corrispondenza esatta, poi una prova — risolvere ogni `var()` di entrambi i fogli di stile in pixel e confrontarli byte per byte. Un passaggio successivo ha dato un nome ai mezzi passi ricorrenti invece di arrotondare 61 dichiarazioni per la sola purezza della scala.

### Feedback con notifica e-mail — senza server
**Soluzione:** un trigger Postgres sulla tabella `feedback` chiama l'API di Resend tramite `pg_net`, interamente dentro Supabase. La chiave API vive cifrata nel Vault, il contenuto dell'utente è escapato in HTML, e una e-mail fallita non può mai bloccare l'inserimento.

### Testare un'app per browser senza browser
Mantenere la promessa di zero dipendenze esclude Jest, Vitest e i sistemi con browser headless.
**Soluzione:** la logica è stata fattorizzata per essere indipendente dal browser ed è coperta da **166 test sul runner integrato di Node** — nessuna dipendenza di test, nessuna rete reale. La CI ricostruisce anche il bundle e fallisce se l'artefatto committato è obsoleto.

---

## 🚀 Per iniziare

Un browser moderno e un qualsiasi server HTTP statico (`file://` non basta — i moduli ES e il `fetch()` dei JSON lì sono bloccati).

```bash
# Sviluppo — nessuna build, moduli ES grezzi:
python3 -m http.server 8000
# → http://localhost:8000/index-dev.html

# Bundle di produzione:
npm install     # installa esbuild, l'unica devDependency
npm run build   # app.js → app.bundle.js (minificato + sourcemap)
# → http://localhost:8000/  (index.html)

npm test        # 166 test, node --test, senza framework
```

**Deployment.** Il repository si deploya così com'è su GitHub Pages: tutti gli URL sono relativi, quindi l'app gira identica alla radice di un dominio, sotto un sottopercorso e in localhost. Routine di release: aggiungere una voce al changelog (quello *è* il bump di versione) → incrementare `SW_VERSION` → build → push.

---

## ⚖️ Limiti dichiarati

- **Il PIN è una barriera d'interfaccia, non sicurezza forte.** Senza la crittografia opzionale, la collezione è leggibile in `localStorage` dai DevTools. Con la crittografia attiva, la curiosità casuale è bloccata — ma un PIN a 4 cifre può essere forzato offline da chi ha in mano il dispositivo. Un PIN dimenticato rende irrecuperabile una collezione locale cifrata.
- **L'accesso cloud gira su un dominio e-mail di test**, con limiti stretti — perfetto per un progetto personale, non una consegna e-mail di produzione.
- **La cronologia di progressione non ha back-fill** — la curva delle statistiche parte dal giorno in cui la funzione è stata installata.

---

## 📜 Licenza e marchi

Rilasciato sotto **licenza MIT** — vedi [LICENSE](LICENSE). © 2026 Arthur — [@Arts44](https://github.com/Arts44).

> **Progetto amatoriale non ufficiale, non commerciale.** «F1» e «UNO», insieme ai loghi e alle immagini di team e piloti, appartengono ai rispettivi proprietari. Questo strumento non è affiliato, approvato o sponsorizzato da Formula 1, Mattel o alcun team.
