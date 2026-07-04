# 🏎️ F1 UNO Élite — Collection Tracker

> Application web de suivi de collection pour les cartes **F1 UNO Élite** : gérez vos cartes possédées, doubles, wishlist et favoris, débloquez des badges et suivez vos statistiques — le tout hors-ligne, sans backend.

![Statut](https://img.shields.io/badge/statut-actif-brightgreen)
![Vanilla JS](https://img.shields.io/badge/JavaScript-vanilla-f7df1e?logo=javascript&logoColor=black)
![No build](https://img.shields.io/badge/build-aucun-blue)
![PWA-ready](https://img.shields.io/badge/PWA-en%20préparation-orange)
![i18n](https://img.shields.io/badge/langues-7-purple)
![Licence](https://img.shields.io/badge/licence-non%20spécifiée-lightgrey)

---

## 📋 Description

**F1 UNO Élite — Collection Tracker** est une application *single-page* 100 % côté client (aucun serveur applicatif, aucune base de données) qui aide un collectionneur à suivre l'avancement de sa collection de cartes F1 UNO Élite. Chaque carte existe en plusieurs **types/variantes** (Blue, Green, Red, Yellow et leurs versions *foil*, Nitro, etc.), et l'application permet de marquer, pour chaque variante, si elle est possédée, en double, en wishlist ou favorite, avec un compteur de quantité.

Toutes les données de progression sont stockées **localement dans le navigateur** (`localStorage`), avec possibilité d'export / import JSON pour la sauvegarde et le transfert entre appareils.

---

## ✨ Fonctionnalités principales

### Collection
- **Grille de cartes** filtrable et triable (numéro, nom, rareté, catégorie).
- **Suivi par variante** : chaque carte gère indépendamment ses types (Blue, Red, Foil, Nitro…), avec statut *possédée / double / wishlist / favorite* et **quantité**.
- **Calcul automatique de la rareté** d'une carte et de ses variantes (foils plus rares, rareté de base par rôle).
- **Recherche instantanée** (avec dropdown de résultats et *debounce*).
- **Filtres avancés** dans une sidebar : statut, catégorie (pilote, réserve, directeur, GP), type de carte, rareté, année, champions uniquement, favoris épinglés en tête.
- **Badge RETIRED** sur les cartes des pilotes qui ne sont plus en activité.

### Badges & Titres
- **50 badges** répartis en **automatiques** (débloqués via des conditions mesurées : nombre de cartes possédées, wishlist, doubles, favoris, catégories complètes, champions, types…) et **manuels** (déclarations personnelles : « j'ai assisté à un GP »).
- **Système de titres** débloqués par badges et jalons, affichables sur le profil.
- Prévisualisation des cartes concernées par un badge, animations de déblocage.

### Statistiques
- **Tableau de bord** : progression globale, répartition par rareté, par équipe, par catégorie, taux de complétion.

### Multi-saisons
- **Sélecteur de saison** dans le header, détection automatique des fichiers `cards-*.json` disponibles.
- Données de progression **scopées par saison** dans le `localStorage`, avec migration automatique de l'ancien format (v1 → v2).

### Sécurité & modes d'accès
- **Verrouillage par code PIN** (4 chiffres) haché en **SHA-256** via la Web Crypto API.
- **Mode « Viewer »** en lecture seule pour partager sa collection sans risque de modification.
- Protection basique contre le contournement via la console.

### Données & sauvegarde
- **Export / Import JSON** de la collection.
- Fonctionne en **mode fallback hors-ligne** grâce aux données embarquées (`data-embedded.js`) lorsque le chargement HTTP des JSON n'est pas disponible.

### Expérience utilisateur
- **Internationalisation (i18n)** : 7 langues — 🇬🇧 Anglais, 🇫🇷 Français, 🇪🇸 Espagnol, 🇨🇳 中文, 🇮🇹 Italien, 🇳🇱 Néerlandais, 🇩🇪 Allemand.
- **Thème clair / sombre** persistant (appliqué avant le rendu pour éviter le *flash*).
- **Design responsive** avec navigation par onglets en bas d'écran (Collection / Badges / Stats / Réglages).
- **Tracés SVG des circuits** intégrés aux cartes.
- Accessibilité soignée (rôles ARIA, `aria-live`, navigation clavier).

---

## 🛠️ Technologies & dépendances

| Domaine | Choix |
|---|---|
| **Langage** | JavaScript *vanilla* (ES6+), HTML5, CSS3 |
| **Build** | Aucun — pas de bundler, pas de transpilation |
| **Framework** | Aucun (DOM natif, pas de dépendance runtime) |
| **Stockage** | `localStorage` du navigateur |
| **Crypto** | Web Crypto API (SHA-256 pour le PIN) |
| **Données** | Fichiers JSON statiques (+ version embarquée JS pour le fallback `file://`) |
| **Polices** | Google Fonts (Syne, DM Sans, Racing Sans One, Orbitron) |
| **Assets externes** | Logos F1/UNO et images (Wikimedia) |

> ✅ Aucune installation de paquet requise : le projet n'a **pas de `package.json`** ni de dépendance npm. Un simple serveur HTTP statique suffit.

---

## 🚀 Installation & utilisation

### Prérequis
Un navigateur moderne et, idéalement, un serveur HTTP local (nécessaire pour le chargement dynamique des fichiers JSON).

### Lancement local

```bash
# Avec Python
python3 -m http.server 8000

# ou avec Node.js
npx serve .
```

Puis ouvrir **http://localhost:8000** dans le navigateur.

> ⚠️ L'ouverture directe de `index.html` via le protocole `file://` fonctionne en **mode fallback** (données codées en dur dans `data-embedded.js`), mais le chargement dynamique des saisons requiert un serveur HTTP.

### Première utilisation
1. À l'ouverture, définir un **code PIN** (écran de configuration).
2. Naviguer entre **Collection / Badges / Stats / Réglages** via la barre du bas.
3. Marquer les variantes possédées depuis la fiche d'une carte.
4. Exporter régulièrement sa collection en JSON depuis les **Réglages** pour la sauvegarder.

### Ajouter une nouvelle saison
1. Créer `data/cards-2026.json` avec la même structure que `cards-2025.json`.
2. Mettre à jour `data/metadata.json` si de nouvelles équipes/pilotes apparaissent.
3. Le sélecteur de saison détecte automatiquement les nouveaux fichiers `cards-*.json`.

---

## 📁 Structure des fichiers

```
F1/
├── index.html            # Page principale (structure + points d'ancrage)
├── styles.css            # Styles (thèmes, grille, cartes, responsive)
├── script.js             # Logique applicative (monolithe : i18n, storage,
│                         #   rendu, filtres, badges, stats, PIN, import/export)
├── translations.js       # Dictionnaires i18n (7 langues) → window.__T
├── card-descriptions.js  # Textes descriptifs des cartes
├── data-embedded.js      # Données embarquées (fallback hors-ligne / file://)
├── extract_data.mjs      # Outil dev : extraction/génération des données
├── app.js                # Placeholder (réservé — voir Améliorations v2)
├── sw.js                 # Placeholder Service Worker (réservé — v2)
└── data/
    ├── metadata.json     # Config statique (types, raretés, équipes, pilotes…)
    ├── cards-2025.json   # 101 cartes de la saison 2025
    ├── circuits.json     # Tracés SVG des circuits
    └── badges.json       # 50 badges (auto + manuels) et leurs conditions
```

### Formats de données (résumé)

- **`metadata.json`** — `cardTypes`, `rarities`/`rarityKeys`/`rarityOrder`, `categories`, `driverNumbers`, `teamColors`, `teamLogos`, `driverImages`, `roleBaseRarity`…
- **`cards-XXXX.json`** — tableau de cartes : `id`, `season`, `number`, `name`, `team`, `category`, `nationality`, `champion`, `championYears`, `description`, `tags`, `types[]`, `retired`.
- **`badges.json`** — `auto[]` (avec `condition` : `metric`, `operator`, `value`, `typeFilter`) et `manual[]`.

**Métriques de condition disponibles** : `owned_count`, `wishlist_count`, `doubles_count`, `favorite_count`, `total_qty`, `category_owned`, `champion_owned`, `type_owned`.

### Versioning `localStorage`

| Version | Clés | Description |
|---|---|---|
| v1 | `f1uno_v3`, `f1uno_badges`, `f1uno_auto_badges` | Ancien format (sans saison) |
| v2 | `f1uno_owned_2025`, `f1uno_badges_2025`, `f1uno_auto_badges_2025` | Format scopé par saison |

Clés partagées (non scopées) : `f1uno_theme`, `f1uno_lang`, `f1uno_title`, `f1uno_version`, `f1uno_pin_hash`. La migration v1 → v2 est automatique au premier chargement.

---

## 🔮 Améliorations v2

### 1. Finaliser la PWA (Service Worker + Web App Manifest) — *offline complet & installable*
**Pourquoi ?** Les fichiers `sw.js` et `app.js` sont aujourd'hui de simples placeholders. L'app est déjà pensée pour l'hors-ligne (données embarquées, `localStorage`), mais elle ne peut pas être **installée** ni servie sans réseau : les polices, logos et JSON restent dépendants d'une connexion.
**Implémentation :** ajouter un `manifest.webmanifest` (nom, icônes, `display: standalone`, thème) référencé dans `index.html`, et implémenter dans `sw.js` une stratégie *cache-first* (précache de `index.html`, `styles.css`, `script.js`, `translations.js`, les JSON de `data/` et les assets Google Fonts/Wikimedia). Enregistrer le SW au chargement. Résultat : app installable sur mobile/desktop et 100 % fonctionnelle hors-ligne.

### 2. Synchronisation / sauvegarde cloud optionnelle — *ne plus perdre sa collection*
**Pourquoi ?** Toute la progression vit dans le `localStorage` d'un seul navigateur : vider le cache, changer d'appareil ou réinstaller efface tout. L'export/import JSON manuel existe mais dépend de la discipline de l'utilisateur.
**Implémentation :** proposer une sauvegarde chiffrée via un service simple (ex. *export vers un gist/Drive/Dropbox* via un lien, ou un petit backend optionnel type Supabase/Firebase). MVP sans backend : un **rappel automatique d'export** + un code de sauvegarde partageable (la collection JSON compressée encodée dans une URL) permettant la restauration sur un autre appareil.

### 3. Nettoyage & modularisation du code (retrait des `console.log`, découpage du monolithe) — *maintenabilité & performance*
**Pourquoi ?** `script.js` fait ~123 Ko en un seul fichier et contient de nombreux `console.log` de debug (ex. dans `t()`, appelé à chaque traduction) qui polluent la console et pèsent sur les performances. Les fichiers `.bak`/`.bak2` traînent dans le dépôt.
**Implémentation :** activer les modules ES (`<script type="module">`) et scinder `script.js` en modules cohérents (`i18n.js`, `storage.js`, `badges.js`, `stats.js`, `render.js`, `pin.js`) — le placeholder `app.js` peut servir de point d'entrée. Retirer/gater les `console.log` derrière un flag `DEBUG`, et supprimer les fichiers `data-embedded.js.bak*` du versioning (à déplacer hors dépôt ou dans `.gitignore`).

---

## 📜 Licence

Aucune licence n'est actuellement spécifiée dans le dépôt. Pour une publication publique sur GitHub, il est recommandé d'ajouter un fichier `LICENSE` (ex. **MIT** pour un projet ouvert).

> **Note marques** : « F1 » et « UNO » ainsi que les logos et images des équipes/pilotes sont la propriété de leurs détenteurs respectifs. Ce projet est un outil de suivi **non officiel**, à but personnel/éducatif.
