[🇬🇧 English](README.md) · 🇫🇷 **Français** · [🇪🇸 Español](README.es.md) · [🇨🇳 中文](README.zh.md) · [🇮🇹 Italiano](README.it.md) · [🇳🇱 Nederlands](README.nl.md) · [🇩🇪 Deutsch](README.de.md)

# 🏎️ F1 UNO Élite — Collection Tracker

**Un tracker de collection de cartes, installable et pensé hors-ligne d'abord, écrit en JavaScript vanilla avec zéro dépendance à l'exécution — pas de framework, pas de SDK, pas de CDN, pas de backend.**

[![tests](https://github.com/Arts44/f1-uno-elite/actions/workflows/tests.yml/badge.svg)](https://github.com/Arts44/f1-uno-elite/actions/workflows/tests.yml)
![License: MIT](https://img.shields.io/badge/license-MIT-green)
![PWA](https://img.shields.io/badge/PWA-installable%20%2B%20offline%20%E2%9C%93-brightgreen)
![Zero runtime deps](https://img.shields.io/badge/runtime%20dependencies-0-blue)
![Vanilla JS](https://img.shields.io/badge/JavaScript-vanilla-f7df1e?logo=javascript&logoColor=black)
![i18n](https://img.shields.io/badge/languages-7-purple)

## ▶️ **[Essayer en ligne → arts44.github.io/f1-uno-elite](https://arts44.github.io/f1-uno-elite/)**

C'est une **PWA** : installez-la depuis votre navigateur et elle fonctionne comme une app native, entièrement hors-ligne, avec sa propre icône — sur ordinateur comme sur mobile.

![Grille de collection — thème sombre](screenshots/grid-desktop-dark.jpg)

| Fiche carte — types foil animés | Tableau de bord Stats |
|---|---|
| ![Modale carte](screenshots/modal-dark.jpg) | ![Vue Stats](screenshots/stats-light.jpg) |

<sub>Plus de captures dans [`screenshots/`](screenshots/) — thèmes clair/sombre, mobile.</sub>

---

## ✨ Ce que ça fait

Suivre une collection complète de cartes **F1 UNO Élite** (101 cartes, chacune en jusqu'à 16 variantes — couleurs de base, foils, duals, Wild, Nitro, promos) :

- 📇 **Gestion complète de la collection** — possédées / doubles / wishlist / favoris, avec quantités par variante, recherche instantanée et filtres avancés.
- ✨ **Système de rareté animé à 6 niveaux** — `epic → legendary → mythic → ultra → cosmic → divine`, calculé automatiquement depuis la meilleure variante possédée ; les cartes foil portent des reflets de lumière animés et le niveau suprême s'affiche en dégradé irisé mouvant (le tout respectant `prefers-reduced-motion`).
- 📴 **Fonctionne entièrement hors-ligne** — toute l'app est précachée par un service worker ; après la première visite, le mode avion ne change rien.
- 🔄 **Mises à jour transparentes** — les nouvelles versions sont détectées en arrière-plan et appliquées d'un tap sur un bandeau discret, avec un changelog intégré (« quoi de neuf depuis *votre* dernière version »).
- 🌍 **7 langues** — anglais, français, espagnol, chinois, italien, néerlandais, allemand. Chaque texte, badge et entrée de changelog.
- 🎓 **Tutoriel interactif en 26 étapes** — une visite guidée où vous *réalisez* les vraies actions, dans un bac à sable qui annule chaque modification à la fin.
- 🏅 **50 badges & titres** — 25 débloqués automatiquement sur conditions mesurées, 25 auto-déclarés.
- 📊 **Tableau de bord Stats** — progression globale, donut des raretés, complétion par catégorie, temps forts, et une courbe de progression jour par jour (SVG pur, aucune lib de graphiques).
- 🔁 **Sauvegardes partout** — export/import JSON, un **code de sauvegarde** compressé d'appareil à appareil, le même code en **QR** scannable, et une **sauvegarde cloud** optionnelle (Supabase).
- 🔐 **Verrou PIN, mode lecteur & chiffrement optionnel** — un PIN 4 chiffres (SHA-256), un mode lecture seule pour partager, et un chiffrement au repos opt-in de la collection (PBKDF2 + AES-GCM, dérivé du PIN — Web Crypto natif).
- 🤝 **Outils de collectionneur** — listes manquantes / doubles / échanges à emporter à une bourse d'échange.
- 💬 **Feedback intégré** — les utilisateurs connectés envoient suggestions et bugs directement depuis les Réglages.

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
| Polices | WOFF2 auto-hébergées (SIL OFL) — aucune requête Google Fonts, 5 thèmes de police |
| Tests | **Runner de test intégré à Node** (`node --test`) — 166 tests, aucun framework de test |
| CI | GitHub Actions — tests + build + vérification de fraîcheur du bundle commité à chaque push/PR |

**Zéro dépendance à l'exécution est une règle de conception, pas un hasard.** Tout ce qu'un framework ou un SDK fournirait — rendu, navigation entre vues, i18n, cache hors-ligne, auth REST, chiffrement, génération de QR — est implémenté directement sur les API de la plateforme web. L'app que vous installez est exactement le code de ce dépôt.

---

## 🧗 Défis techniques

Les problèmes qui ont réellement façonné ce code, et leur résolution :

### Hors-ligne d'abord *et* toujours à jour
**Problème :** un service worker cache-first rend l'app inébranlable hors-ligne — et excellente pour servir du code périmé pour toujours. Les PWA installées sont les plus touchées : elles peuvent rester ouvertes des jours sans navigation, donc le navigateur ne revérifie jamais le worker de lui-même.
**Solution :** le nouveau worker se télécharge en arrière-plan et se gare délibérément en état *waiting* (pas de `skipWaiting` automatique — remplacer le shell sous une app en cours d'exécution, c'est comme ça qu'on corrompt l'état). L'app affiche un bandeau « nouvelle version — recharger » qui le promeut via un message `SKIP_WAITING` ; un bandeau ignoré se résout au prochain démarrage à froid. Les PWA installées appellent en plus `registration.update()` à chaque retour au premier plan et toutes les heures. La version de l'app dérive de l'entrée de changelog la plus récente : publier, *c'est* écrire le changelog — version et historique ne peuvent pas diverger.

### Une connexion e-mail qui survit à une PWA installée
**Problème :** le magic link classique casse dans une PWA installée : le lien s'ouvre dans le navigateur par défaut — une partition de stockage différente — et la session atterrit là où l'app n'est pas.
**Solution :** l'authentification passe en priorité par des **codes OTP e-mail** : le code est saisi dans l'app elle-même, la session est donc créée au bon endroit à chaque fois. Le magic link reste un bonus côté navigateur. Tout le flux GoTrue (envoi, vérification, refresh, marge d'expiration) est implémenté en `fetch()` brut — sans SDK Supabase.

### Un service worker qui ne touche jamais l'API
**Problème :** un service worker de précache qui intercepte tout servira volontiers une réponse d'API depuis le cache — un bug de corruption de données silencieux qui n'apparaît qu'en production.
**Solution :** le worker exclut entièrement l'origine Supabase (les requêtes passent sans interception), et les appels cloud envoient aussi `cache: 'no-store'`. Ceinture et bretelles, vérifié par les tests.

### Un refactor CSS prouvé identique, octet par octet
**Problème :** migrer des centaines de valeurs d'espacement en dur vers des tokens de design avec pour seule garantie « ça a l'air pareil ».
**Solution :** substitution en correspondance exacte uniquement (aucun arrondi au token le plus proche), puis une preuve : résoudre chaque `var()` des feuilles de style avant et après en valeurs pixel, et comparer les deux octet par octet — rendu mathématiquement identique, les valeurs hors échelle laissées intactes et inventoriées pour une passe ultérieure, délibérée.

### Du feedback avec notification e-mail — sans serveur
**Problème :** le mainteneur veut un e-mail pour chaque avis envoyé dans l'app, mais il n'y a pas de backend pour l'expédier.
**Solution :** un trigger Postgres sur la table `feedback` appelle l'API Resend via `pg_net`, entièrement dans Supabase. La clé d'API vit chiffrée dans le Vault Supabase (jamais dans ce dépôt), le contenu utilisateur est échappé en HTML, et un e-mail en échec ne peut jamais bloquer l'insertion. Côté client : un cooldown ; côté serveur : un throttle SQL (max 5/heure par utilisateur) imposé par trigger.

### 7 langues sans bibliothèque i18n
**Problème :** chaque texte visible — interface, badges, tutoriel, entrées de changelog, messages d'erreur — en 7 langues, sans framework pour imposer la discipline.
**Solution :** un petit helper `t()` sur des fichiers dictionnaires, des attributs `data-i18n` pour le HTML statique, et des tests unitaires qui échouent si une entrée de changelog manque une seule des 7 langues. L'anglais est le repli déclaré ; une règle dure du projet dit qu'un texte en anglais seul est une modification incomplète.

### Tester une app navigateur sans navigateur
**Problème :** tenir la promesse zéro dépendance exclut Jest, Vitest et les harnais de navigateur headless.
**Solution :** la logique a été factorisée pour être indépendante du navigateur (calcul de rareté, migration du stockage, encodage des sauvegardes, stats, badges, chiffrement, helpers cloud, logique de mise à jour…) et couverte par **166 tests sur le runner intégré de Node** — zéro dépendance de test, aucun réseau réel (chaque test cloud stubbe `fetch`). La CI reconstruit aussi le bundle et échoue si l'artefact commité est périmé : le code déployé correspond prouvablement aux sources.

---

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

# Tests :
npm test        # 166 tests, node --test, sans framework
```

### Déploiement

Le dépôt se déploie **tel quel** sur GitHub Pages (statique, aucun build serveur) : toutes les URL sont relatives, l'app tourne donc à l'identique à la racine d'un domaine, sous un sous-chemin et en localhost. Le bundle compilé est commité parce que Pages n'exécute aucune étape npm ; la CI vérifie qu'il ne devient jamais périmé. Routine de release : ajouter une entrée de changelog (c'*est* le bump de version) → incrémenter `SW_VERSION` dans `sw.js` → build → push. Les visiteurs de retour reçoivent le bandeau de mise à jour.

---

## ⚖️ Limites assumées

- **Le PIN est une barrière d'interface, pas une sécurité forte.** Sans le chiffrement optionnel, la collection est lisible dans `localStorage` via les DevTools. Chiffrement activé, la curiosité ordinaire est bloquée — mais un PIN à 4 chiffres se brute-force hors-ligne pour qui tient l'appareil. C'est une protection contre l'indiscrétion opportuniste, pas contre des experts. Un PIN oublié rend une collection locale chiffrée irrécupérable — gardez des sauvegardes.
- **La connexion cloud repose sur un domaine e-mail de test.** Les e-mails d'auth et de feedback partent aujourd'hui par des domaines d'expédition par défaut/de test aux limites strictes — parfait pour un projet perso, pas une délivrabilité de production. Un SMTP/domaine personnalisé lèverait cette limite.
- **L'historique de progression n'a pas de rétro-remplissage** — la courbe des stats commence le jour où la fonctionnalité a été installée ; aucun horodatage par carte ne permet de reconstruire le passé.

---

## 📜 Licence & marques

Publié sous **licence MIT** — voir [LICENSE](LICENSE). © 2026 Arthur.

> « F1 » et « UNO », ainsi que les logos et images des équipes et pilotes, appartiennent à leurs propriétaires respectifs. Ceci est un outil de suivi de collection **non officiel** et personnel, sans affiliation, approbation ni sponsoring de la Formula 1, de Mattel ou d'aucune équipe.
