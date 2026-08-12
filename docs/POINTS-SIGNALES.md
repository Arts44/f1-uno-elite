# Points signalés, non corrigés

> Trouvés en chemin pendant un autre chantier, et **délibérément laissés
> tels quels** pour ne pas mélanger un déplacement avec un changement de
> comportement. Chacun attend son propre commit, et pour certains sa
> propre décision.
>
> Un point n'entre ici que s'il est **démontré**, pas soupçonné.

---

## 1. Deux champs de données inertes

Même famille : un champ qui existe dans les données, que tout lecteur
suppose utilisé, et que le code ignore complètement.

### `season` sur les badges — inerte, et dangereux

7 badges de `data/badges.json` portent `"season": 2025`
(`legend_101`, `pilote_all`, `reserve_all`, `director_all`, `gp_all`,
`launch_day`, `prediction`). **`badges.js` ne lit jamais ce champ** —
`grep -n "season" badges.js` ne renvoie rien.

Conséquence : ils s'évaluent à l'identique dans toutes les saisons.
`legend_101` (« posséder les 101 cartes ») sera décerné à tort si 2026
en compte moins, et inatteignable s'il en compte plus.

**Décision prise** : passer à des seuils **relatifs** (« toutes les
cartes », « toutes les cartes d'une catégorie ») plutôt qu'absolus. Ça
survit à n'importe quel millésime et supprime la dépendance au champ.
**Chantier à part**, après le multi-saisons : il touche des badges déjà
débloqués, des libellés i18n ×7 qui disent « 101 », l'affichage de la
progression et le modèle de difficulté.

⚠️ **Voir le point 3** : un seuil relatif calculé sur le fichier chargé
est faux si le fichier est partiel. Le total doit être **déclaré**, pas
déduit.

### `g` sur les livrées d'écurie — inerte, et perpétué par un test

`data/metadata.json → teamLiveries[*].g` décrit un geste géométrique
(`lame`, `coin`, `vague`…). **`liveryHTML()` n'utilise que `c1` et
`c2`** : le champ ne produit rien.

Il est pourtant **gardé par un test** (`tests/icons.test.js` :
« 10 gestes distincts — aucune géométrie partagée entre écuries »). Le
test perpétue donc l'illusion que le champ sert à quelque chose : en
ajoutant deux écuries factices pour 2026, il a fallu **inventer deux
gestes** (`essai-a`, `essai-b`) uniquement pour le satisfaire.

**Deux issues acceptables, la troisième est refusée :**
- retirer `g` **et son test** ;
- ou lui **donner un usage réel** dans le rendu ;
- ~~le laisser tel quel~~ — c'est ce qui a fait inventer deux gestes
  pour rien.

---

## 2. Fuite inter-saisons des badges — bug ACTUEL, pas un risque futur

`badges.js → loadManualBadges()` :

```js
const a = secureGet(_storageKey('auto_badges'));
if(a) autoBadgeUnlocked = JSON.parse(a);   // ← si la clé est absente,
                                            //   l'objet n'est PAS vidé
```

**Quand on bascule vers une saison qui n'a pas encore de badges
enregistrés, `autoBadgeUnlocked` et `manualBadges` gardent le contenu de
la saison précédente.** Le premier déblocage déclenche
`saveManualBadges()`, qui écrit alors les badges de l'ancienne saison
**sous la clé de la nouvelle**. La fuite devient permanente.

**Démontré** : collection 2026 réduite à 4 cartes, clé
`f1uno_auto_badges_2026` supprimée, bascule 2025 → 2026.
Résultat : **9 badges automatiques dans la clé 2026**, dont 7 hérités de
2025 (`collector_10`, `hunter_25`, `massive_50`, `blue_20`…) — alors que
4 cartes seulement sont possédées.

C'est **la même famille que la fuite de titre** déjà corrigée
(`f1uno_title` → `f1uno_title_<année>`). Le correctif tient en deux
`else` :

```js
if(a) autoBadgeUnlocked = JSON.parse(a); else autoBadgeUnlocked = {};
```

Priorité : **haute**. Ce bug touche n'importe quel utilisateur qui
bascule de saison, indépendamment du multi-saisons.

---

## 3. Fichier de cartes partiel — 23 badges se débloquent trop tôt

Scénario réel : saisir les cartes **au fil de l'eau** (elles arrivent par
boosters), donc un `cards-2026.json` incomplet pendant des semaines.

23 badges automatiques calculent leur `max` **à partir du fichier
chargé**, pas d'un total déclaré :

| Métrique | Badges | `max` calculé |
|---|---|---|
| `category_owned` | 4 | nombre de cartes de la catégorie **dans le fichier** |
| `category_set` | 4 | idem |
| `team_set` | 10 | nombre de cartes de l'écurie **dans le fichier** |
| `teams_owned_count` | 3 | `.every()` sur les cartes **présentes** |
| `teams_set_count` | 1 | idem |
| `champion_owned` | 1 | champions **présents** |

Avec 40 cartes sur 101, posséder les 12 pilotes présents débloque
`pilote_all` — et **le déblocage est irréversible** (« une fois
débloqué, toujours débloqué », `isAutoBadgeUnlocked` persiste
immédiatement). Compléter le fichier ensuite ne le reverrouille pas.

**Démontré** : saison 2026 factice (4 pilotes, 2 champions), les 4
pilotes possédés → `pilote_all` et `champ_all` débloqués et persistés.

**Ce que ça implique pour le chantier des seuils relatifs** : le total
doit venir d'une **valeur déclarée** dans les données de la saison
(par ex. `metadata.seasons[].cardCount`), jamais de `CARDS_DB.length`.
Sinon un fichier partiel produit un dénominateur faux, et la correction
introduit exactement le bug qu'elle prétend supprimer.

Les métriques à seuil **absolu** (`owned_count >= 101`, `total_qty`,
`doubles_count`…) ne sont pas concernées : elles restent simplement
inatteignables tant que le fichier est incomplet, ce qui est honnête.

---

## 4. Un émoji oublié par la passe de 1.31.0

`index.html` (et `index-dev.html`) : le bouton du mode spectateur porte
encore `👁 Parcourir` en dur.

```html
<button class="viewer-browse-btn" id="viewerBrowseBtn" … data-i18n="login.browse">👁 Parcourir</button>
```

Deux défauts d'un coup :

1. **C'est le dernier émoji d'interface** — la passe de 1.31.0 les a tous
   remplacés par des SVG (`icons.js`), sauf celui-ci. `eye` existe déjà
   dans `icons.js`, il n'y a rien à dessiner.
2. **Le texte est en dur ET traduit** : `data-i18n="login.browse"` écrase
   le contenu au premier `applyLanguage()`, donc l'émoji ne survit que
   jusqu'au premier rendu — il n'apparaît qu'en français, par accident.

Correction : `icon('eye')` + le libellé par `data-i18n`, comme partout
ailleurs. Trouvé pendant le chantier du pavé PIN (1.57.0), délibérément
pas emporté avec lui.

---

## 5. Les marqueurs de coin sont muets pour un lecteur d'écran

`render.js` pose trois marqueurs sur `.card-visual`. Deux sont
`aria-hidden="true"` :

| Marqueur | Exposé ? |
|---|---|
| Sceau « set complet » | **oui** — `role="img"` + `aria-label` traduit |
| Réserve (`swap`) | non — `aria-hidden="true"` |
| Directeur (`headset`) | non — `aria-hidden="true"` |
| Couronne champion | non — mais l'info est reprise en texte dans `.card-num` |

Conséquence : **la seule information qui distingue une carte réserve
d'une carte directeur est invisible pour un lecteur d'écran** — les deux
partagent le même visuel (monogramme d'écurie) et le même texte (nom,
écurie, année). C'est précisément l'ambiguïté que le marqueur existe pour
lever ; elle reste entière sans la vue.

Ce n'est pas une régression de 1.58.0 : la réserve était déjà
`aria-hidden` depuis l'origine. Le directeur a hérité de la convention
existante plutôt que d'introduire une divergence — mais la convention
était le défaut.

**Correction attendue** : deux clés i18n ×7 (`mark.reserve`,
`mark.director`), `role="img"` + `aria-label`, sur le modèle du sceau.
Deux catégories, deux clés, sept langues : ça mérite son passage, pas un
ajout discret au coin d'un autre commit.

---

## 6. Le plancher de hauteur de tuile n'a pas été reconfirmé

`--card-h` vaut 320. Le **plancher** — la plus petite valeur qui ne
comprime aucun bloc — a été mesuré à **300** sur la MAQUETTE (feuille de
style injectée), pas sur le CSS définitif.

Sur le code final, toutes les valeurs testées ont renvoyé la même
hauteur de grille (17 052 px), signe que les surcharges de `--card-h`
n'étaient pas reprises par le rendu. Le plancher n'a donc pas pu être
re-dérivé.

**Sans conséquence connue** : la marge choisie (320) couvre largement le
300 mesuré. Mais si quelqu'un veut un jour resserrer la hauteur, le
chiffre de départ est à remesurer, pas à reprendre ici.

---

## 7. ~~`.login-box` fait 380 px de large, en dur~~ — CORRIGÉ (1.52.3)

Passée en `width:min(380px, 100vw - 24px)` avec un remplissage
`clamp(20px, 6vw, 48px)`. Mesuré après : à 320 px la boîte fait 287 et
ne dépasse plus ; à 1280 elle vaut 380 comme avant. Vérifié sur les
deux écrans qui l'utilisent (langue, PIN) × deux thèmes × 320/375/1280
— aucun enfant hors de la boîte, aucun défilement horizontal.

**Ce que ça ne débloque PAS — et c'est définitif.**
La grille de langues à **3 colonnes reste impossible sur mobile**, et
la cause n'est pas la boîte : c'est la **largeur minimale d'un bouton**.
Une option mesure au moins ~121 px (pastille ISO 33 + libellé +
remplissage), donc trois colonnes demandent **383 px de contenu**. Même
fluide, la boîte n'en offre que **247 à 320 px** et **295 à 375**. Il
manquerait encore 88 px sur l'écran le plus large des deux.

> **L'idée des 3 colonnes est classée.** Elle ne se rouvre pas en
> élargissant la boîte — elle ne se rouvrirait qu'en retirant la
> pastille ISO ou en tronquant les libellés, ce qui coûte plus que le
> problème de rythme qu'elle prétendait résoudre. La disposition
> retenue est la dernière ligne pleine largeur alignée à gauche
> (1.52.2).

### L'état d'origine, pour mémoire

`styles.css → .login-box{width:380px}` — une largeur **fixe**, pas un
`max-width`, pas de fluide.

Conséquence sur un écran de 320 px : la boîte **dépasse de 60 px**
(elle déborde de −30 à gauche et +350 à droite). Rien ne se voit
aujourd'hui parce que `body{overflow-x:hidden}` coupe le débordement et
que le contenu tient dans les 284 px utiles — mais le débordement est
réel, et il interdit toute disposition plus large.

**Découvert en évaluant une grille de langues à 3 colonnes** : trois
boutons demandent ~380 px de contenu, la boîte n'en offre que 284. La
disposition a été écartée pour cette raison, et non pour un défaut qui
lui serait propre.

Corriger demanderait de passer `.login-box` en `max-width` + largeur
fluide, ce qui touche **tous** les écrans qui l'utilisent (choix de
langue, installation, PIN). À traiter comme un chantier, pas comme un
ajustement.
