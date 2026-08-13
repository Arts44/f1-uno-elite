# Points signalés

> Trouvés en chemin pendant un autre chantier, et **délibérément laissés
> tels quels** pour ne pas mélanger un déplacement avec un changement de
> comportement. Chacun attend son propre commit, et pour certains sa
> propre décision.
>
> Un point n'entre ici que s'il est **démontré**, pas soupçonné.
>
> **Rien n'est supprimé de cette liste.** Un point corrigé passe en
> ~~barré~~ avec son commit, et garde son diagnostic : c'est lui qui dit
> comment le défaut a été prouvé, donc comment vérifier qu'il n'est pas
> revenu. Un backlog court n'est pas un backlog sain — celui-ci se lit
> autant pour ce qui est résolu que pour ce qui reste.
>
> **Ouverts aujourd'hui : 1b, 4, 5, 6, 7, 9.** Corrigés et conservés :
> 1a, 2, 3, 8, 10.

---

## 1. Deux champs de données inertes

Même famille : un champ qui existe dans les données, que tout lecteur
suppose utilisé, et que le code ignore complètement. **Le premier est
corrigé, le second reste ouvert.**

### ~~`season` sur les badges — inerte, et dangereux~~ — CORRIGÉ (1.59.0)

> **Traité par le chantier des seuils relatifs**, en cinq commits
> révocables séparément : `4a475f4` (le total vient d'une valeur
> déclarée), `271e981` (`legend_101` cesse d'encoder 101), `671386d`
> (« toutes les écuries » compte les écuries), `ca2dc33` (les libellés
> cessent d'affirmer 101), `a0256bf` (le champ `season` est **retiré**
> des badges où il mentait, et **lu** sur ceux où il dit vrai —
> `launch_day` et `prediction`, qui sont réellement datés).
>
> Le plan complet, ses trois arbitrages et la règle qui prime sur tout
> — *un badge débloqué reste débloqué, y compris s'il a été gagné sur
> un dénominateur faux* — sont dans [`PLAN-SEUILS-RELATIFS.md`](PLAN-SEUILS-RELATIFS.md).
>
> Le diagnostic ci-dessous est conservé : c'est lui qui a produit le
> plan, et il dit encore pourquoi le champ était dangereux.

7 badges de `data/badges.json` portaient `"season": 2025`
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

## 2. ~~Fuite inter-saisons des badges~~ — CORRIGÉ (`662b505`, 1.52.1)

> **Les deux `else` sont en place** ([`badges.js`](../badges.js) →
> `loadManualBadges()`), avec un commentaire qui dit pourquoi ils ne
> sont pas cosmétiques — c'est exactement le genre de ligne qu'un
> nettoyage « simplifie » en la supprimant.
>
> ```js
> manualBadges      = s ? JSON.parse(s) : {};
> autoBadgeUnlocked = a ? JSON.parse(a) : {};
> ```
>
> Le diagnostic est conservé tel quel : la démonstration ci-dessous est
> le scénario à rejouer si la fuite réapparaît — et elle l'est, en
> automatique, dans [`tests/season-badge-leak.test.js`](../tests/season-badge-leak.test.js).

`badges.js → loadManualBadges()` s'écrivait :

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

## 3. ~~Fichier de cartes partiel — 23 badges se débloquent trop tôt~~ — CORRIGÉ

> **Deux verrous, pas un.** Le total ne vient plus du fichier chargé
> mais de `metadata.seasons[].cardCount`, une valeur **déclarée** ; et
> [`badges.js`](../badges.js) refuse le déblocage tant que le résultat
> porte la marque `partiel` :
>
> ```js
> const currently = p.cur >= p.max && !p.partiel;
> ```
>
> Le second verrou est le vrai : un total déclaré ne protège que les
> métriques qui l'utilisent, alors que `partiel` couvre aussi celles qui
> comptent par catégorie ou par écurie — dont le total, lui, n'est
> déclaré nulle part.
>
> **Ce que la correction ne fait PAS, et c'est délibéré** : les badges
> déjà débloqués sur un dénominateur faux **le restent**. Reverrouiller
> aurait repris à un collectionneur quelque chose qu'il avait vu
> acquis ; un faux positif conservé coûte moins qu'une régression vécue.
> La règle est écrite au §0 de [`PLAN-SEUILS-RELATIFS.md`](PLAN-SEUILS-RELATIFS.md).
>
> Le diagnostic est conservé : il explique pourquoi le total doit être
> déclaré, ce qui reste vrai pour toute métrique future.

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

## 6. `cloudDeleteSeason()` renvoie `true` même quand rien n'a été supprimé

`cloud-sync.js → cloudDeleteSeason(season)` renvoie `true` dès que la
réponse HTTP est `ok`. PostgREST répond `204` **que la clause ait touché
une ligne ou zéro** : la fonction ne distingue pas « supprimé » de
« il n'y avait rien ».

Sans conséquence aujourd'hui — la zone danger ne fait qu'appeler et
rafraîchir. Mais c'est exactement le genre de valeur qu'on branchera un
jour sur un message de confirmation, et « Saison supprimée » s'afficherait
alors sur une suppression qui n'a rien supprimé.

**Parade, si on veut la certitude** : relire après coup.
`listCloudSeasons()` ou `fetchSeasonMeta(season)` (qui renvoie `null`
quand la ligne n'existe plus) donnent la preuve que la valeur de retour
ne porte pas. C'est la méthode utilisée pour vérifier la suppression de
la ligne 2026 le 12/08/2026.

Une alternative existe côté serveur — `Prefer: return=representation`
ferait renvoyer les lignes supprimées, donc leur nombre — au prix d'une
réponse plus lourde. À arbitrer le jour où un appelant a besoin de la
distinction.

---

## 7. La grille se reconstruit entièrement au retour sur Collection — et l'animation le paie

**Mesuré, reproductible, et ce n'est pas un artefact de capture.**

En scriptant les démos animées (`capture_demos.py`), le glissement de
280 ms de la pastille de navigation est échantillonné à chaque
exécution. Relevé selon la vue d'arrivée :

| Transition vers | Images sur 280 ms | Cadence |
|---|---|---|
| Compte | 17 | **61 fps** |
| Stats | 16 | 57 fps |
| Badges | 11 | 39 fps |
| **Collection** | **5 à 8** | **~25 fps** |

La capture n'est pas en cause : elle tient 60 à 75 fps sur les trois
autres vues, dans la même exécution, avec le même code. Ce qui change
est la **reconstruction des 101 tuiles**, qui occupe le fil principal
pendant que la pastille glisse. L'utilisateur voit donc une animation
qui décroche **à chaque retour sur la grille** — c'est-à-dire au geste
le plus fréquent de l'app.

**Même signature que le défaut d'ajout rapide déjà corrigé** (~300 ms →
~45 ms, profilé au CDP) : un re-rendu complet là où un rendu ciblé
suffirait. Là, c'était une coche qui reconstruisait 101 tuiles ; ici,
c'est un changement de vue. La correction avait consisté à écrire par
lots et à ne toucher que les tuiles concernées — la même piste vaut
probablement ici (réutiliser le DOM existant plutôt que réécrire
`innerHTML`, ou différer la reconstruction après la transition).

**Priorité : basse, mais c'est le seul défaut de performance identifié
depuis ce profilage.** Rien n'est cassé ; une animation à 25 fps se
remarque sans se dénoncer, ce qui est précisément pourquoi elle a
survécu jusqu'à ce qu'un script la compte image par image.

> La démo de navigation évite désormais ce retour — non pour cacher le
> défaut, mais parce qu'une démo doit montrer l'animation, pas la
> concurrence entre deux travaux. Le garde-fou du script, lui, continue
> de mesurer et d'échouer sous 30 fps.

---

## 8. ~~Les captures ne sont reproductibles qu'à l'œil~~ — CORRIGÉ

**Deux exécutions du même script donnent désormais 0 fichier différent
sur 52.** Avant : 42.

Le gel des animations est passé de partiel (les seules bandes foil de
la planche de comparaison) à complet, et il a fallu **trois** couches,
chacune découverte par la mesure suivante :

| Étape | Restait |
|---|---|
| `document.getAnimations()` figé, phases choisies | 42 → 22 |
| Gel **synchrone** juste avant chaque déclenchement | 22 → 20 |
| Animations **infinies** mises en pause au lieu de `finish()` | 20 → 8 |
| **SMIL** (`<animateTransform>`) figé via `pauseAnimations()` | 8 → **0** |

Trois pièges qui valent d'être retenus :

1. **`finish()` sur une animation infinie lève `InvalidStateError`** —
   on ne termine pas ce qui ne finit pas. L'exception était avalée, donc
   `eternalStars`, absente de la table des phases, continuait de tourner
   et suffisait à faire varier 20 captures.
2. **Le gel par intervalle laisse une fenêtre.** Un changement de vue
   crée de nouvelles animations ; une capture peut tomber avant le
   prochain tic. Le gel se fait maintenant juste avant chaque
   déclenchement, pas 120 ms plus tôt.
3. **SMIL n'est pas dans `document.getAnimations()`.** Les dégradés
   Divin et Éternel du donut tournent par `<animateTransform>`, sur une
   autre horloge : `svg.pauseAnimations()`. Eux seuls faisaient varier
   les 7 captures `stats-rarity`.

**La phase est choisie, pas subie.** Figer à l'image 0 rendrait les
effets invisibles. Chaque animation est arrêtée là où elle se montre —
la bande foil au centre de la tuile, le halo Éternel à son maximum, les
étoiles à pleine opacité, le dégradé du donut à un quart de tour. Les
choix sont écrits dans `capture_screenshots.py`, au-dessus de la table.

**Ce que ça débloque** : un diff de captures redevient un signal. Le
jour où une régénération montrera 3 fichiers modifiés, ce sera parce que
3 écrans ont changé.

---

## 9. Le plancher de hauteur de tuile n'a pas été reconfirmé

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

## 10. ~~`.login-box` fait 380 px de large, en dur~~ — CORRIGÉ (1.52.3)

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
