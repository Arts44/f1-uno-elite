[🇬🇧 English](README.md) · 🇫🇷 **Français** · [🇪🇸 Español](README.es.md) · [🇨🇳 中文](README.zh.md) · [🇮🇹 Italiano](README.it.md) · [🇳🇱 Nederlands](README.nl.md) · [🇩🇪 Deutsch](README.de.md)

# 🏎️ F1 UNO Élite — Collection Tracker

**Un tracker de collection de cartes, installable et pensé hors-ligne d'abord, écrit en JavaScript vanilla avec zéro dépendance à l'exécution — pas de framework, pas de SDK, pas de CDN, pas de backend.**

[![tests](https://github.com/Arts44/f1-uno-elite/actions/workflows/tests.yml/badge.svg)](https://github.com/Arts44/f1-uno-elite/actions/workflows/tests.yml)
![License: MIT](https://img.shields.io/badge/license-MIT-green)
![PWA](https://img.shields.io/badge/PWA-installable%20%2B%20offline%20%E2%9C%93-brightgreen)
![Zero runtime deps](https://img.shields.io/badge/runtime%20dependencies-0-blue)
![Vanilla JS](https://img.shields.io/badge/JavaScript-vanilla-f7df1e?logo=javascript&logoColor=black)
![i18n](https://img.shields.io/badge/languages-7-purple)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/4e7d9096628044aba780a0b2000aee8c)](https://app.codacy.com/gh/Arts44/f1-uno-elite/dashboard)

## ▶️ **[Essayer en ligne → arts44.github.io/f1-uno-elite](https://arts44.github.io/f1-uno-elite/)**

C'est une **PWA** : installez-la depuis votre navigateur et elle fonctionne comme une app native, entièrement hors-ligne, avec sa propre icône — sur ordinateur comme sur mobile.

![Grille de collection — thème sombre](screenshots/grid-desktop-dark.jpg)

| Fiche carte — types foil animés | Tableau de bord Stats |
|---|---|
| ![Modale carte](screenshots/modal-dark.jpg) | ![Vue Stats](screenshots/stats-light.jpg) |

<sub>Plus de captures dans [`screenshots/`](screenshots/) — thèmes clair et sombre, ordinateur et mobile.</sub>

### ✨ En mouvement

| Ajout rapide — un geste, un exemplaire | Navigation à pastille | Badges — 120, sept familles | Deux saisons, à un geste l'une de l'autre |
|---|---|---|---|
| ![Démo ajout rapide](screenshots/demo-quick-add.gif) | ![Démo navigation](screenshots/demo-nav.gif) | ![Démo badges](screenshots/demo-badges.gif) | ![Seasons demo](screenshots/demo-seasons.gif) |

Chaque démo est produite par `capture_demos.py`, à partir du même seed déterministe que les captures fixes, elles-mêmes **sans aucune différence visible d'une exécution à l'autre** : chaque animation est figée à une phase choisie avant chaque déclenchement — plus aucun enregistrement à la main. Le seuil est chiffré et vérifiable en une commande (`compare_captures.py`) ; l'octet, lui, n'est pas tenable — il reste un bruit d'anti-crénelage de quelques dizaines de pixels à 10 niveaux sur 255. Les GIF tournent à 33,3 images/s, le pas régulier le plus rapide que le format autorise ; la version 60 images/s est à côté : [ajout rapide](screenshots/demo-quick-add.mp4) · [navigation](screenshots/demo-nav.mp4) · [badges](screenshots/demo-badges.mp4) · [saisons](screenshots/demo-seasons.mp4).


### Nouveautés 1.29 — la passe v2

| Badges — familles, progression, objectif épinglé | Détail d’un badge — date de déblocage, cartes contributives |
|---|---|
| ![Badges — familles, progression, objectif épinglé](screenshots/badges-dark.jpg) | ![Détail d’un badge — date de déblocage, cartes contributives](screenshots/badges-detail.jpg) |

| Compte — cloud, sauvegardes, zone danger | Réglages — la carte sécurité |
|---|---|
| ![Compte — cloud, sauvegardes, zone danger](screenshots/account-dark.jpg) | ![Réglages — la carte sécurité](screenshots/settings-dark.jpg) |

| Déverrouillage PIN — segmenté et masqué | Code e-mail — le même composant partagé |
|---|---|
| ![Déverrouillage PIN — segmenté et masqué](screenshots/pin-screen.jpg) | ![Code e-mail — le même composant partagé](screenshots/otp-input.jpg) |

| Tracés de circuits — refaits depuis des relevés GPS réels | Badges — thème clair |
|---|---|
| ![Tracés de circuits — refaits depuis des relevés GPS réels](screenshots/circuit-gp.jpg) | ![Badges — thème clair](screenshots/badges-light.jpg) |

| Visite guidée — cinq chapitres, un par page | Les cinq familles de foil, au niveau atténué |
|---|---|
| ![Visite guidée — cinq chapitres, un par page](screenshots/tutorial-chapter.jpg) | ![Les cinq familles de foil, au niveau atténué](screenshots/foil-family.jpg) |


![Navigation basse — la pastille et son encoche bougent d’un seul bloc](screenshots/nav-bead.jpg)

<sub>Localisé en 7 langues — chaque texte, badge et entrée de changelog</sub>

| Rareté Éternel — champions en set complet | Ajout rapide — sélecteur de variantes |
|---|---|
| ![Rareté Éternel — champions en set complet](screenshots/i18n/eternal-tile.fr.jpg) | ![Ajout rapide — sélecteur de variantes](screenshots/i18n/quick-add.fr.jpg) |

| Donut des raretés avec Éternel | Toast Annuler |
|---|---|
| ![Donut des raretés avec Éternel](screenshots/i18n/stats-rarity.fr.jpg) | ![Toast Annuler](screenshots/i18n/toast.fr.jpg) |

---

## ✨ Ce que ça fait

Suivre une collection complète de cartes **F1 UNO Élite** — 101 cartes pour la saison 2025, chacune existant en jusqu'à 16 variantes (couleurs de base, foils, duals, Wild, Nitro, promos) :

- 📇 **Gestion complète de la collection** — possédées / doubles / wishlist / favoris, quantités par variante, l’ensemble de la collection toujours visible.
- ➕ **Ajout rapide en un geste** — un bouton + sur chaque tuile ouvre un sélecteur de variantes : un appui ajoute un exemplaire, avec un toast « Annuler ». Le bandeau de la page Collection affiche la progression en direct : une barre, puis possédées / manquantes / doubles.
- ✨ **Système de rareté animé à 7 niveaux** — `epic → legendary → mythic → ultra → cosmic → divine → eternal`, calculé depuis la meilleure variante possédée, +1 niveau quand le set est complet (toutes les variantes possédées) — `eternal` n'est atteignable que comme ça. Les cartes foil portent des reflets de lumière animés, `divine` s'affiche en dégradé irisé mouvant et `eternal` en noir & or scintillant (le tout respectant `prefers-reduced-motion`).
- 📴 **Fonctionne entièrement hors-ligne** — toute l'app est précachée par un service worker ; après la première visite, le mode avion ne change rien.
- 🔄 **Mises à jour transparentes** — les nouvelles versions sont détectées en arrière-plan et appliquées d'un tap, avec un changelog intégré qui montre ce qui a changé depuis *votre* dernière version.
- 🌍 **7 langues** — anglais, français, espagnol, chinois, italien, néerlandais, allemand. Chaque texte, badge et entrée de changelog.
- 🎓 **Tutoriel interactif, 33 étapes en 5 chapitres** — un chapitre par page, dans l’ordre des onglets. Une visite guidée où vous *réalisez* les vraies actions, dans un bac à sable qui annule chaque modification à la fin.
- 🏅 **Une page Badges qui raconte votre collection** — 120 badges en 7 familles : parcours, sets complets, écuries, foils, couleurs, passion, et expériences vécues que vous validez vous-même. Chaque badge porte un **score de difficulté intrinsèque** (0–100) calculé depuis l'effort d'acquisition qu'il exige — pas depuis une télémétrie, que cette app ne collecte pas. Un anneau de progression avec votre titre, une carte *Prochain badge* qui met toujours en avant le plus proche — ou l'objectif que vous avez épinglé —, une échelle de jalons de 1 à 101 cartes, les dates de déblocage, et une vraie célébration quand l'un tombe : toast groupé, courte vibration, et explosion sur la tuile. Votre carte de collectionneur s'exporte en image partageable.
- 📊 **Tableau de bord Stats** — progression globale, donut des raretés, complétion par catégorie, temps forts, une courbe de progression jour par jour (SVG pur, aucune bibliothèque de graphiques), et les outils de collectionneur en onglets internes : listes manquantes, doubles et échanges.
- 👤 **Une page Compte dédiée** — connexion cloud par code e-mail, sauvegarde/restauration, export/import JSON, transfert par QR, avis intégré, et une zone danger offrant trois portées de suppression, chacune protégée par un mot à retaper. En mode spectateur, toute la page est remplacée par un état verrouillé — les contrôles sont absents, pas grisés.
- 🔁 **Sauvegardes partout** — export/import JSON, un code de sauvegarde compressé d'appareil à appareil, le même code en QR scannable, et une sauvegarde cloud optionnelle.
- 🔐 **Verrou PIN, mode spectateur & chiffrement optionnel** — un PIN à 4 chiffres sur un pavé segmenté (chaque chiffre visible un instant, puis masqué), des parcours guidés pour le créer/changer/désactiver avec progression visible, un mode lecture seule pour partager, et un chiffrement au repos opt-in de la collection (PBKDF2 + AES-GCM, dérivé du PIN).
- 🧭 **Une barre de navigation à pastille** — la pilule, son encoche et la pastille forment un seul chemin SVG recalculé image par image depuis une horloge unique, si bien que les deux ne dérivent jamais. Glissable, accessible au clavier, et respectant `prefers-reduced-motion`.

---

## 🛠️ Stack technique

| Domaine | Choix |
|---|---|
| Langage | **JavaScript vanilla** (modules ES natifs), HTML5, CSS3 — aucun framework |
| Dépendances à l'exécution | **Zéro.** Pas de paquet npm, pas de CDN, pas de SDK au runtime |
| Build | [esbuild](https://esbuild.github.io/) (l'*unique* devDependency) → un bundle IIFE minifié |
| Hors-ligne / PWA | Service Worker écrit à la main (précache versionné, shell cache-first) + Web App Manifest |
| Cloud (optionnel) | **Supabase en `fetch()` REST brut** — sans SDK ; auth par code OTP e-mail, Row Level Security |
| Crypto | **Web Crypto** natif — SHA-256 (PIN), PBKDF2 + AES-GCM (chiffrement au repos optionnel) |
| Codes QR | Encodeur mono-fichier vendorisé ([Project Nayuki](https://www.nayuki.io/page/qr-code-generator-library), MIT) |
| Polices | WOFF2 auto-hébergées (SIL OFL) — aucune requête Google Fonts, 5 thèmes au choix |
| Tests | **Runner de test intégré à Node** (`node --test`) — 872 tests, aucun framework de test |
| CI | GitHub Actions — tests + build + vérification de fraîcheur du bundle commité à chaque push/PR |

**Zéro dépendance à l'exécution est une règle de conception, pas un hasard.** Tout ce qu'un framework ou un SDK fournirait — rendu, navigation entre vues, i18n, cache hors-ligne, auth REST, chiffrement, génération de QR — est construit directement sur les API de la plateforme web. L'app que vous installez est exactement le code de ce dépôt. Depuis : `cloud.js` (726 lignes) a été scindé en quatre modules derrière 61 tests de caractérisation jamais modifiés, ce qui a débloqué `pushSeason(s)` / `listCloudSeasons()` — vérifiés contre la vraie base Supabase, une saison poussée sans que l'app quitte celle affichée ; et deux failles XSS ont été fermées à la source, dans `tEsc()` et aux points d'entrée des données.

---

## 🧱 L'architecture en bref

Le code est un ensemble de **modules ES** ciblés derrière un point d'entrée unique, `app.js`, assemblés par esbuild en un `app.bundle.js` commité (GitHub Pages n'exécute aucune étape de build). Deux points d'entrée HTML partagent tout le reste : `index-dev.html` charge les modules bruts pour le développement, `index.html` charge le bundle.

| Couche | Modules |
|---|---|
| État & données | `storage.js` (localStorage, scoppé par saison, migration v1→v2), `data.js`, `history.js` |
| Interface | `render.js` (grille, filtres, fiche carte), `stats.js`, `badges.js`, `pin.js` (réglages) |
| Plateforme | `sw.js` (précache), `update.js` (mises à jour), `install.js`, `secure-store.js` |
| Cloud optionnel | `cloud-http/auth/sync/ui.js`, `feedback.js`, `settings-sync.js` — tous en REST brut |

Les actions passent par **un unique écouteur délégué** sur `[data-action]` plutôt que par des gestionnaires en ligne — c'est aussi ce qui rend possible le mode lecteur, puisqu'un seul ensemble `VIEWER_BLOCKED` verrouille toutes les écritures. Le texte d'interface n'apparaît jamais dans le code : il passe par `t()` sur des dictionnaires couvrant les 7 langues.

### La forme du projet

Quatre scripts classiques publient des globales `window.__*` avant les modules ; tout le reste est un module ES derrière un point d'entrée unique.

```mermaid
flowchart TB
  subgraph BOOT["Démarrage"]
    H["index.html"] --> C["translations.js<br/>card-descriptions.js<br/>data-embedded.js<br/>cloud-config.js"]
    H --> B["app.bundle.js"]
  end
  B --> APP["app.js"]
  APP --> UI
  APP --> ST
  APP --> PL
  subgraph UI["Vues"]
    R["render.js"]; S["stats.js"]; BG["badges.js"]; PN["pin.js"]; AC["account.js"]; TU["tutorial.js"]; PH["pagehead.js"]; IC["icons.js"]
  end
  subgraph ST["État"]
    STO["storage.js"]; DA["data.js"]; HI["history.js"]; SEC["secure-store.js"]; I18["i18n.js"]
  end
  subgraph PL["Plateforme"]
    SW["sw.js"]; UP["update.js"]; IN["install.js"]; BK["backup.js"]
  end
  subgraph CL["Cloud optionnel"]
    CLO["cloud-*.js (4)"]; FB["feedback.js"]; SS["settings-sync.js"]
  end
  ST --> CL
  STO --> SEC
```


---

## 🧗 Défis techniques

Les problèmes qui ont réellement façonné ce code :

### Hors-ligne d'abord *et* toujours à jour
Un service worker cache-first rend l'app inébranlable hors-ligne — et excellente pour servir du code périmé indéfiniment. Les PWA installées sont les plus touchées : elles peuvent rester ouvertes des jours sans navigation, le navigateur ne revérifie donc jamais le worker.
**Solution :** le nouveau worker se télécharge en arrière-plan et se gare délibérément en état *waiting* (pas de `skipWaiting` automatique — remplacer le shell sous une app en cours d'exécution, c'est ainsi qu'on corrompt l'état). Un bandeau le promeut en un tap via `SKIP_WAITING` ; un bandeau ignoré se résout au prochain démarrage à froid. Les PWA installées appellent en plus `registration.update()` à chaque retour au premier plan et toutes les heures. La version de l'app dérive de l'entrée de changelog la plus récente : publier, *c'est* écrire le changelog.

### Une connexion e-mail qui survit à une PWA installée
Le magic link classique casse dans une PWA installée : le lien s'ouvre dans le navigateur par défaut — une partition de stockage différente — et la session atterrit là où l'app n'est pas.
**Solution :** l'authentification passe en priorité par des **codes OTP e-mail**, saisis dans l'app elle-même, donc la session naît au bon endroit à chaque fois. Tout le flux GoTrue est implémenté en `fetch()` brut.

### Un service worker qui ne touche jamais l'API
Un service worker de précache qui intercepte tout servira volontiers une réponse d'API depuis le cache — un bug de corruption de données silencieux qui n'apparaît qu'en production.
**Solution :** le worker exclut entièrement l'origine Supabase, et les appels cloud envoient aussi `cache: 'no-store'`.

### Un refactor CSS prouvé identique, octet par octet
Migrer des centaines de valeurs d'espacement en dur vers des tokens, avec pour seule garantie « ça a l'air pareil ».
**Solution :** substitution en correspondance exacte uniquement, puis une preuve — résoudre chaque `var()` des deux feuilles de style en pixels et les comparer octet par octet. Une passe ultérieure a nommé les demi-pas récurrents plutôt que d'arrondir 61 déclarations pour la seule pureté de l'échelle.

### Du feedback avec notification e-mail — sans serveur
**Solution :** un trigger Postgres sur la table `feedback` appelle l'API Resend via `pg_net`, entièrement dans Supabase. La clé d'API vit chiffrée dans le Vault, le contenu utilisateur est échappé en HTML côté SQL, et le trigger avale ses propres échecs (`exception when others`) : un e-mail en échec ne peut jamais bloquer l'insertion. Un **second trigger applique la vraie limite de débit en base** — cinq avis par utilisateur et par heure, levés en `rate_limited` — et l'app traduit cette erreur en code typé. Le délai côté client est une politesse ; la protection est côté serveur.

### Tester une app navigateur sans navigateur
Tenir la promesse zéro dépendance exclut Jest, Vitest et les harnais de navigateur headless.
**Solution :** la logique a été factorisée pour être indépendante du navigateur et couverte par **872 tests sur le runner intégré de Node** — aucune dépendance de test, aucun réseau réel. La CI reconstruit aussi le bundle et échoue si l'artefact commité est périmé.

---

### Ce que les tests couvrent — et ce qu'ils ne couvrent pas

872 tests sur le lanceur intégré de Node, sans framework. Être précis sur la frontière compte plus que le nombre :

- **Couvert :** migrations de stockage et schéma de clés par saison ; l'échelle de rareté à sept niveaux, bonus de set complet inclus ; toutes les conditions de badge et le modèle de difficulté ; les listes du collectionneur (manquantes, doubles, échange) ; les allers-retours d'encodage des codes de sauvegarde ; les aides cloud contre un `fetch` simulé, chemins d'échec compris ; la parité des clés i18n sur les 7 langues et la détection de doublons ; le precache du service worker confronté au vrai graphe d'imports ; les contrats de markup de l'accès clavier ; la provenance de chaque `innerHTML` nourri de l'extérieur ; le contraste vérifié à la main sur les deux thèmes.
- **Non couvert :** le rendu réel (aucune assertion DOM au-delà des chaînes de markup), le comportement du service worker à l'exécution, les appels réseau réels, IndexedDB, les invites d'installation, et tout ce qui exige un moteur de navigateur — ces points sont vérifiés à la main et par la passe de captures déterministe, pas par la suite. Le pourcentage cité plus haut ne mesure que cette tranche sans navigateur — à lire comme tel, pas comme une mesure de l'application.

## 🚀 Démarrer

Un navigateur moderne et n'importe quel serveur HTTP statique (`file://` ne suffit pas — modules ES et `fetch()` des JSON y sont bloqués).

```bash
# Développement — sans build, modules ES bruts :
python3 -m http.server 8000
# → http://localhost:8000/index-dev.html

# Bundle de production :
npm install     # installe esbuild, l'unique devDependency
npm run build   # app.js → app.bundle.js (minifié + sourcemap)
# → http://localhost:8000/  (index.html)

npm test        # 872 tests, node --test, sans framework
```

**Déploiement.** Le dépôt se déploie tel quel sur GitHub Pages : toutes les URL sont relatives, l'app tourne donc à l'identique à la racine d'un domaine, sous un sous-chemin et en localhost. Routine de release : ajouter une entrée de changelog (c'*est* le bump de version) → incrémenter `SW_VERSION` → build → push.

---

## ⚖️ Limites assumées

- **Le PIN est une barrière d'interface, pas une sécurité forte.** Sans le chiffrement optionnel, la collection est lisible dans `localStorage` via les DevTools. Chiffrement activé, la curiosité ordinaire est bloquée — mais un PIN à 4 chiffres se brute-force hors-ligne pour qui tient l'appareil. Un PIN oublié rend une collection locale chiffrée irrécupérable.
- **Les notifications d'avis partent du domaine de test de Resend** (`onboarding@resend.dev`). Depuis ce domaine, Resend ne délivre qu'à l'adresse du propriétaire du compte : la notification atteint le mainteneur et personne d'autre. Envoyer ailleurs supposerait de posséder et vérifier un domaine. C'est une limite assumée, pas un défaut : l'avis est enregistré en base dans tous les cas, et un envoi raté ne le bloque jamais.
- **Les codes de connexion passent par un fournisseur SMTP configuré dans Supabase** — une chaîne entièrement distincte des notifications ci-dessus. Délivrabilité, quotas et réputation d'expéditeur dépendent de ce fournisseur et ne sont pas mesurés par ce dépôt ; les e-mails de connexion sont à considérer comme « au mieux » pour un projet perso.
- **L'historique de progression n'a pas de rétro-remplissage** — la courbe des stats commence le jour où la fonctionnalité a été installée.
- **La note Codacy est A — et un de ses quatre objectifs de qualité est au rouge.** Mesuré sur le commit `b680aed`, 123 fichiers, 9 643 lignes. Au vert : la duplication à 5 % (objectif 10 %), et la couverture à 69 % — la jauge de Codacy et le `npm run test:cov` local s'accordent au dixième cette fois (69,21 %), pour un objectif de 60 %, soit neuf points de marge au lieu des 2,7 d'avant. Au rouge : la complexité, avec **45 % des fichiers analysés au-dessus du seuil** pour un objectif de 10 % — le ratio a *monté* après le découpage de `cloud.js` en quatre, ce qui en dit long sur la métrique : elle compte des *fichiers*, donc une base faite de peu de gros modules est pénalisée, quand le même code réparti en 300 fichiers passerait sans qu'une ligne change. C'est un fait sur la mesure, pas une excuse ; `badges.js` en fait réellement trop. Et un quatrième chiffre que le badge masque : **2 issues ouvertes**, contre 11 — les 8 des scripts de capture et les 2 variables inutilisées d'`account.js` ont été corrigées, pas tues (`c5941cd`). Les deux survivantes sont **la même règle qui se déclenche sur une chaîne qui n'est pas un secret** : un faux jeton dans `capture_seed.py` (`demo.access.token`, de l'outillage qui n'est jamais livré) et `SESSION_KEY = 'f1uno_cloud_session'` dans `cloud-auth.js`, qui est le *nom* d'une clé localStorage. Elles restent visibles délibérément : un faux positif qui demeure au tableau coûte une ligne d'explication, alors que désactiver la règle masquerait aussi le vrai positif qu'elle est là pour attraper. Le badge ci-dessus est réel ; il n'est pas le tableau complet, c'est pourquoi le tableau complet est ici.

---

## 🔩 Notes d'ingénierie

Zéro dépendance à l'exécution (esbuild seul, au build) ; plancher typographique de 11 px vérifié sur 5 polices × 2 thèmes × 320/375/desktop (une seule exception, l'« ÉLITE » du logo à 8 px, qui est du branding) ; décalage de mise en page mesuré, et désormais réellement nul : la hauteur de tuile est FIXE (13 hauteurs distinctes auparavant, de 246,69 à 292,69 px), le squelette lit la même variable CSS et colle donc exactement — au prix de +19,4 % de défilement, la réservation du pire cas partout ; l'ajout rapide profilé et optimisé (~300 ms → ~45 ms sur mobile moyen, mesure unique non rejouée en CI) ; chiffrement local optionnel lié au PIN (PBKDF2 + AES-GCM) ; mode spectateur verrouillé dans la logique, pas en CSS ; captures régénérées par un script déterministe versionné, les quatre démos animées scriptées et reproductibles ; 872 tests en JS vanilla avec le runner intégré de Node. Détails complets dans le [README anglais](README.md).

---

## ☕ Soutenir le développeur

Un unique lien sortant, dans **Réglages → À propos**, mène à [Ko-fi](https://ko-fi.com/arts44). Il soutient **moi, le développeur** — pas l'app, ni son univers. Aucun script tiers, aucun pixel de suivi, aucune donnée personnelle ne quitte l'appareil : c'est un `<a target="_blank" rel="noopener noreferrer">`, rien de plus. L'URL vit dans une constante unique (`SUPPORT_URL` dans `pin.js`) ; la vider fait disparaître la ligne. Hors ligne, la ligne devient visiblement inerte plutôt que de mener à une page morte.

**Aucune contrepartie** — pas de fonctionnalité débloquée, pas de badge donateur, pas de mention nominative. Un don qui achèterait quelque chose serait un achat, et ce projet reste un fan project non commercial.

---

## 📜 Licence & marques

Publié sous **licence MIT** — voir [LICENSE](LICENSE). © 2026 Arthur — [@Arts44](https://github.com/Arts44).

> **Projet fan non officiel, non commercial.** « F1 » et « UNO », ainsi que les logos et images des équipes et pilotes, appartiennent à leurs propriétaires respectifs. Cet outil n'est ni affilié, ni approuvé, ni sponsorisé par la Formula 1, Mattel ou aucune équipe.
