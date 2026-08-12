# Format des données d'une saison

> **À quoi sert ce document.** Le jour où les cartes d'une nouvelle saison
> sortent, il ne doit rester qu'à **déposer un fichier**. Ce document dit
> exactement quoi saisir, avec quelles valeurs admises, et ce qui casse si
> on se trompe.
>
> Référence vivante : `data/cards-2025.json` (101 cartes réelles) et
> `data/cards-2026.json` (10 cartes **factices**, écrites pour exercer
> tous les chemins avant que les vraies données existent).

---

## 1. `data/cards-<année>.json`

**Un tableau JSON**, un objet par carte. Pas d'enveloppe, pas de clé
racine.

```json
[
  {
    "id": "001",
    "season": 2026,
    "number": 1,
    "name": "Ada Placeholder",
    "team": "Alpha Test Racing Team",
    "category": "pilote",
    "nationality": "🇦🇶",
    "champion": true,
    "championYears": [2026],
    "description": "Texte affiché dans la fiche de la carte.",
    "tags": ["champion", "legendary"],
    "types": ["blue", "green", "red", "yellow", "blue_foil", "…"],
    "retired": false,
    "power": "Skip"
  }
]
```

### Les 14 champs, un par un

| Champ | Type | Obligatoire | Règle |
|---|---|---|---|
| `id` | chaîne | **oui** | Le `number` sur **3 chiffres**, zéros en tête : `1` → `"001"`. C'est la clé de stockage de la collection — **elle ne doit jamais changer après publication**, sinon les cartes possédées se perdent. |
| `season` | entier | **oui** | L'année. Doit correspondre au nom du fichier. |
| `number` | entier | **oui** | Numéro imprimé sur la carte, de 1 à N, sans trou. |
| `name` | chaîne | **oui** | Nom affiché. Sert aussi de **clé** dans `driverNumbers` (§2) — l'orthographe doit être identique aux deux endroits. |
| `team` | chaîne | **oui** | Doit exister **à l'identique** dans `teamColors`, `teamMonograms` et `teamLiveries` (§2). **Chaîne vide `""` pour un Grand Prix.** |
| `category` | chaîne | **oui** | `pilote` · `reserve` · `directeur` · `gp`. Rien d'autre. |
| `nationality` | chaîne | oui (peut être `""`) | Un emoji drapeau. Vide pour les GP, les directeurs et les réservistes du set 2025. |
| `champion` | booléen | **oui** | Affiche la couronne et alimente les badges de champions. |
| `championYears` | tableau d'entiers | **oui** | `[]` si `champion` est `false`. |
| `description` | chaîne | oui (peut être `""`) | Une à deux phrases, affichées dans la fiche. |
| `tags` | tableau de chaînes | **oui** | `[]` accepté. Vocabulaire utilisé en 2025 : `champion`, `rising_star`, `fan_favorite`, `legendary`, `legend`, `night_race`, `top_driver`, `prestige`, `high_speed`. |
| `types` | tableau de chaînes | **oui** | **Le champ qui pilote la rareté.** Voir §1.2. |
| `retired` | booléen | **oui** | `false` partout en 2025. |
| `power` | chaîne | **oui** | Le pouvoir de jeu, texte libre affiché tel quel. |
| `powerPromo` | chaîne | **non** | Uniquement sur les cartes ayant des types `promo_*`. 2 cartes sur 101 en 2025. |

### 1.2 `types` — les 16 valeurs admises

Aucune autre valeur n'est reconnue ; une valeur inconnue est ignorée
silencieusement au calcul de rareté.

| Groupe | Valeurs | Bonus de rareté |
|---|---|---|
| Base | `blue` `green` `red` `yellow` | — |
| Foil simple | `blue_foil` `green_foil` `red_foil` `yellow_foil` | **+1** |
| Foil double | `blue_red_foil` `green_yellow_foil` | **+2** |
| Wild / Nitro | `wild_foil` `nitro_foil` | **+3** |
| Promo | `promo_blue` `promo_green` `promo_red` `promo_yellow` | **+3** |

**Comment la rareté sort de là.** Rareté de base par rôle
(`roleBaseRarity` dans `metadata.json`) : `pilote` et `gp` = `legendary`,
`reserve` et `directeur` = `epic`. Le meilleur bonus de foil présent
s'ajoute, **plafonné à `divine`**. Posséder un **set complet** (au moins
un exemplaire de chaque type listé) ajoute encore **+1**, plafonné à
`eternal` — c'est la seule façon d'atteindre `eternal`.

Échelle, dans l'ordre : `epic` · `legendary` · `mythic` · `ultra` ·
`cosmic` · `divine` · `eternal`.

> ⚠️ **Ne pas confondre** avec l'échelle des pastilles de type
> (`typeBadgeStyles` / `typeBadgeRarity`) : c'est une échelle
> **indépendante**, et toucher à l'une ne doit pas toucher à l'autre.

---

## 2. `data/metadata.json` — ce qu'il faut étendre

Quatre dictionnaires sont indexés par **écurie** ou par **nom de pilote**.
Une entrée manquante ne plante pas — elle **dégrade silencieusement**,
ce qui est pire à repérer. Le tableau dit quoi.

| Dictionnaire | Clé | Valeur | Si l'entrée manque |
|---|---|---|---|
| `teamColors` | nom d'écurie | `"#RRGGBB"` | Le blanc `#fff` est utilisé — la carte perd son identité d'écurie. |
| `teamMonograms` | nom d'écurie | 2 à 3 lettres (`"ATR"`) | **Le visuel de la carte est vide** : `teamLogoHTML()` renvoie `null`. |
| `teamLiveries` | nom d'écurie | `{"c1":"#RRGGBB","c2":"#RRGGBB","g":"nom"}` | La bande de livrée disparaît. |
| `driverNumbers` | **nom du pilote**, identique au champ `name` | `{"n": 1, "cls": "dn-xxx"}` | Le numéro de pilote n'est **pas affiché du tout**. |

### Deux contraintes que les tests font respecter

1. **`teamLiveries` et `teamColors` doivent avoir exactement les mêmes
   clés** (`tests/icons.test.js`). Ajouter une écurie dans l'un sans
   l'autre fait échouer la suite.
2. **Le champ `g` doit être unique** d'une écurie à l'autre — même test.
   Les 10 gestes du set 2025 sont : `lame` `coin` `vague` `vee` `coupe`
   `eclair` `houle` `lisiere` `marche` `traits`. **Il faut en inventer un
   nouveau pour chaque écurie ajoutée** ; les cartes factices utilisent
   `essai-a` et `essai-b`.

> **`g` n'est lu par aucun code.** `liveryHTML()` n'utilise que `c1` et
> `c2`. Le champ est documentaire — mais il est **gardé par un test**,
> donc il contraint la saisie. Constat noté, pas corrigé ici.

### `driverNumbers[*].cls` — la dégradation à connaître

`cls` est écrit tel quel comme classe CSS sur le numéro. Chaque pilote de
2025 a une règle dédiée dans `styles.css` (`.dn-ver`, `.dn-ham`, …) qui
lui donne sa police d'identité — Orbitron ou Racing Sans One, avec son
interlettrage.

**Si la classe n'existe pas dans `styles.css`, le numéro s'affiche quand
même**, dans l'Orbitron par défaut de `.dn-num`. C'est le cas des quatre
pilotes factices (`dn-tst-a` … `dn-tst-d`) — vérifié au navigateur.

Donc : ajouter la règle CSS est **facultatif et purement esthétique**.
Rien ne casse sans elle.

---

## 3. Ce que j'aurai besoin de recevoir, concrètement

Pour une nouvelle saison, la liste minimale :

1. **Le nombre de cartes** et leur numérotation (1 → N).
2. **Pour chaque carte** : numéro, nom, écurie, catégorie, nationalité,
   champion (o/n) + années, description, pouvoir, et **la liste de ses
   types** parmi les 16.
3. **Pour chaque écurie nouvelle** : nom exact, couleur principale,
   monogramme 2-3 lettres, et deux couleurs de livrée.
4. **Pour chaque pilote nouveau** : son numéro de course.

Le reste (`id`, `season`, `retired`, `tags`) se déduit ou vaut par défaut.

Un tableau, un CSV ou même une liste en texte suffisent — la conversion
au format JSON ci-dessus est mécanique.

---

## 4. Ce qu'il reste à faire côté code (phase 3)

Déposer le fichier ne suffit **pas encore**. Ce document décrit le format
cible ; l'infrastructure qui le consomme est en cours :

- la liste des saisons sélectionnables est déduite du `localStorage`, donc
  une saison sans données existantes n'apparaît jamais ;
- un 404 sur le fichier de cartes laisse **silencieusement** le catalogue
  précédent en place ;
- `data-embedded.js` (repli hors ligne) ne couvre que 2025 ;
- `sw.js` ne précache que `data/cards-2025.json` ;
- `extract_data.mjs` **régénère `metadata.json`** à partir de valeurs
  écrites en dur : le relancer aujourd'hui **écraserait** les écuries
  ajoutées à la main.

Voir le plan du chantier multi-saisons pour l'état d'avancement.
