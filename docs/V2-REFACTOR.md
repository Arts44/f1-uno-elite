# Plan v2 — scinder les quatre modules denses

> Ce document existe pour qu'on ne se trompe pas de chantier dans six mois.
> Il dit **ce qu'on scinde**, **ce qu'on ne scinde pas**, et **pourquoi la
> différence n'est pas une nuance**.

## Ce que ce refactor vise — et ce qu'il ne vise pas

**Le dépôt est noté A par Codacy** (0 issue, 4 % de duplication). Ce n'est
donc pas la note qui motive ce chantier — elle est déjà là.

Ce qui reste rouge, c'est la **jauge de complexité** : 13 des 30 fichiers
sources dépassent le seuil, soit 43 % contre un objectif de 10 %. Ce
document explique pourquoi on ne la fera pas tomber par n'importe quel
moyen.

Le refactor poursuit donc **un seul but** :

> **Débloquer ce qui est bloqué** — le multi-saisons (`cloud.js`) et
> l'export de liste d'échange (`badges.js`).

La jauge s'améliorera en chemin — de 43 % à ~18,8 %, chiffrage ci-dessous —
sans atteindre les 10 %. Ce n'est pas un échec : ce n'était pas l'objectif.

## Ce que Tarjan a mesuré — et qui corrige ce document

**Ce document a longtemps dit que `badges.js` était pris dans « trois
cycles d'import ». C'est faux, et la mesure vaut mieux que l'intention.**

Le graphe complet, passé à Tarjan (`tests/import-cycles.test.js`), donne
**une seule composante fortement connexe de 22 modules** : depuis
n'importe lequel on revient à n'importe lequel. Parler DES cycles de
`badges.js` n'avait pas de sens — il n'y en a qu'un, et tout le monde est
dedans.

**Conséquence sur ce qu'on peut promettre.** À la maille des composantes,
« le découpage casse un cycle » est intenable : la composante reste une.
Ce qui se vérifie, ce sont des **arêtes nommées** et deux compteurs :

| | avant | après les pas 1-2 |
|---|---|---|
| Composante enchevêtrée | 22 modules | **22 — inchangée** |
| Feuilles hors composante | 13 | **16** |
| Arête `storage.js → badges.js` | présente | **supprimée** |

**La composante ne maigrit pas, et il ne faut pas prétendre le
contraire.** Ce qui change : l'arête qui a coûté un bug réel disparaît,
et les trois modules extraits restent DEHORS.

Ce dernier point n'était pas acquis. Mesurés juste après leur création,
`storage-keys.js` et `badges-store.js` étaient **dedans** — la composante
était passée de 22 à **24**. La cause tenait à une seule donnée : la
saison courante vivait dans `data.js`, qui importe `render.js` et
`stats.js`, si bien que « connaître l'année » revenait à hériter de la
moitié de l'app. D'où `season.js`, quinze lignes sans aucune dépendance.

> **Le réflexe à garder** : mesurer APRÈS CHAQUE PAS, pas seulement à la
> fin. Un découpage qui fait ENTRER un module dans la composante est une
> régression structurelle, et elle ne se voit pas à la lecture du diff.

### L'arête qui comptait

`storage.js → badges.js` n'est pas une arête comme une autre : elle est
de la **même famille que la fuite inter-saisons corrigée en 1.52.1** —
un module qui lit l'état d'un autre pendant que celui-ci l'initialise. Le
bug d'alors venait d'un `else` manquant ; il aurait pu venir de l'ordre
d'initialisation, et personne n'aurait su où regarder.

### Le cycle qui reste, assumé

`badges.js ⇄ render.js ⇄ stats.js` : `stats.js` appelle `renderBadges()`
quand la collection change, la vue appelle `updateStats()` après une
mutation de badge.

**La parade est identifiée** — sortir les deux actions mutantes dans un
`badge-actions.js`, le chemin d'écriture distinct du chemin de lecture —
et elle a été **écartée** : sa justification (« muter n'est pas
afficher ») est vraie mais générale, elle vaudrait pour une dizaine
d'autres découpes du dépôt. On la reverra si ce cycle gêne réellement
quelque chose.

---

## Le chantier 3 a été MESURÉ avant d'être fait — et refusé sur mesure

Le plan ci-dessus désignait `data.js → render.js, stats.js` comme « la
racine de l'enchevêtrement ». **Simulée sur le graphe avant d'écrire une
ligne, la coupe ne donne rien** :

| coupe simulée | nœuds | arêtes | part du dépôt | modules libérés |
|---|---|---|---|---|
| — (état actuel) | 27 | 128 | 63 % | — |
| `data.js → render, stats` | **27** | **126** | **63 %** | **aucun** |

Deux arêtes sur 128, zéro module libéré. La raison tient en une ligne :
sans l'arête directe, la boucle repasse par `data.js → i18n.js →
render.js`.

**C'est `i18n.js` le vrai carrefour**, pas `data.js` : importé par 20
modules, il en importe cinq — `render`, `badges`, `stats`, `pin`,
`badge-titles` — pour tout redessiner au changement de langue
(`applyLanguage()`). Un module qui a l'air d'une feuille de chaînes et
qui rappelle toute l'interface.

### Sur `i18n.js`, le gain est réel — mais indivisible

| coupe simulée | nœuds | arêtes | part | libérés |
|---|---|---|---|---|
| 1, 2, 3 ou 4 des 5 sortantes | **27** | 127→124 | 63 % | **aucun** |
| **les 5 ensemble** | **23** | **95** | **53 %** | `i18n`, `install`, `pagehead`, `update` |

**Aucun sous-ensemble ne paie.** Tant qu'une seule des cinq subsiste,
`i18n.js` reste dans la composante et n'entraîne personne. C'est
tout ou rien : 33 arêtes et 4 modules, ou zéro.

### L'arête la plus rentable du dépôt, et elle n'était dans aucun plan

```
render.js → account.js     27 → 24 nœuds,  128 → 109 arêtes
                           libère account.js, cloud-sync.js, cloud-ui.js
```

**Aucune autre arête, coupée seule, ne fait mieux que −1 nœud.**
`account.js` n'est importé que par `render.js` — et le réimporte. Cette
paire à elle seule tient trois modules cloud dans l'enchevêtrement.

Cumulée avec les cinq d'`i18n.js` : **27 → 20 nœuds, 128 → 79 arêtes,
63 % → 47 %, 16 → 23 feuilles.**

### La revue d'architecture, conservée pour le jour où le chantier reprend

Trois façons de sortir les appels d'interface d'un module de données
(`switchSeason()` servait de cas d'école) :

**(a) Le descripteur retourné** — la fonction renvoie son résultat,
l'appelant redessine. Le plus simple à lire et à tester. **Coût réel** :
les trois appelants recopient la même séquence de redessin, et au critère
du dépôt (« changeraient-ils toujours ensemble ? ») la réponse est *oui*
— c'est de la duplication qu'on refuse ailleurs.

**(b) L'émetteur d'événements** — le seul qui inverse vraiment la
dépendance. **Coût réel** : il faut un bus que le dépôt n'a pas, et on
perd l'ordre garanti *et la promesse*. Or la promesse existe pour une
raison écrite dans le code : l'import de sauvegarde doit l'attendre,
sinon il écrit la collection de l'ancienne saison sous la clé de la
nouvelle. Un événement ne s'attend pas. Et le carrefour changerait
seulement de nom : tout le monde importerait le bus.

**(c) Les callbacks injectés au démarrage** — `app.js` câble, le module
de données appelle ce qu'on lui a donné. **Coût réel** : un état
d'initialisation de plus, donc une panne silencieuse si l'ordre dérape —
à couvrir par un défaut explicite, pas par un `if`.

> **Recommandation : (c)**, et sans enthousiasme. C'est la seule qui
> retire les imports **sans** sacrifier l'ordre et la promesse qui
> protègent déjà d'un bug connu. Mais sur `data.js` elle rapporte 2
> arêtes sur 128 : correcte sur le principe, invisible en pratique.

### Décision

**Ni `data.js`, ni `i18n.js` pour l'instant.** Le gain sur `i18n.js` est
réel (−33 arêtes, −10 points de part piégée) mais il coûte la réécriture
d'`applyLanguage()`, qui touche les sept langues et cinq surfaces de
rendu — pour une propriété que l'utilisateur ne voit pas. L'app a des
besoins plus proches d'elle.

**Ce qui est acté, en revanche** : si le chantier reprend un jour, il
commence par `render.js → account.js` — meilleur rapport mesuré du dépôt,
une seule arête, trois modules libérés — puis les cinq d'`i18n.js`
ensemble, jamais par sous-ensembles.

> **La leçon de méthode, et c'est la vraie valeur de ce passage** : la
> coupe a été *simulée sur le graphe* avant d'écrire du code. Deux heures
> de refactor pour zéro module libéré ont été évitées par cinq minutes de
> mesure. `repo_map.py`, à la racine, existe pour ça.

---

## `storage.js` : simulé aussi, et **refusé** — il aggrave le graphe

Même méthode, appliquée avant d'écrire une ligne. Découpe simulée en
trois : `collection-store.js` (état, migration, `txBatch`),
`card-predicates.js` (`cardOwned`…`cardSetComplete`), `transfer.js`
(instantané, export, dialogue d'import).

| | modules | nœuds | arêtes | part | feuilles |
|---|---|---|---|---|---|
| Avant | 43 | 27 | 128 | 63 % | 16 |
| **Après la découpe en 3** | 45 | **29** | **149** | **64 %** | **16** |
| Variante « sans `updateStats` » | 45 | 29 | 148 | 64 % | 16 |
| Variante `transfer.js` découplé au maximum | 45 | 29 | **144** | 64 % | 16 |

**Les trois morceaux extraits atterrissent DANS la composante**, et pas
une feuille de plus. C'est exactement le piège des pas 1-2 de `badges.js`
(22 → 24 avant correction) — **sauf qu'ici il n'est pas corrigeable de la
même façon.** À l'époque, la cause tenait à une seule donnée qu'on a pu
isoler dans `season.js`, quinze lignes sans dépendance. Ici la cause est
la nature même du module : l'état de la collection, le catalogue et la
vue se tiennent mutuellement, et aucun des trois n'est extractible.

**La variante la plus optimiste reste pire que l'existant** : 144 arêtes
contre 128. Découper `storage.js` ne redistribue pas les dépendances, il
les *duplique* — chaque importateur qui prenait une arête vers
`storage.js` en prend maintenant deux ou trois.

### Même la rareté, seule pièce que ce plan justifiait, ne paie pas

| | modules | nœuds | arêtes | `card-rarity.js` |
|---|---|---|---|---|
| `card-rarity.js` extrait tel quel | 44 | 28 | 137 | **dedans** |
| `card-rarity.js` **pur** (état injecté) | 44 | 28 | 137 | **dedans** |

Même privée de l'état de la collection, la rareté doit connaître le
catalogue — donc `data.js`, donc la composante. Sept modules gagnent une
arête, personne ne sort.

### La raison hors-graphe : il n'y en a pas

C'est le critère qui a tranché les deux chantiers précédents, et il est
décisif ici :

| module | ce que le découpage débloquait |
|---|---|
| `cloud.js` | le multi-saisons |
| `badges.js` | l'export de liste d'échange |
| **`storage.js`** | **rien** |

Ce document lui-même ne lui donnait qu'un argument, et il ne survit pas à
la mesure : *« sortir la rareté est un découpage évident et sans
risque »*. Évident, oui ; **sans effet**, aussi.

Pas de famille de bug non plus. Les deux défauts réels passés par
`storage.js` — l'import inter-saisons et la XSS du dialogue d'import —
sont des défauts d'**échappement et d'ordre d'appel**, déjà corrigés et
désormais tenus par `tEsc`/`setSafeHTML`, par le lint des symboles non
déclarés et par leurs tests. Aucun n'aurait été évité par un découpage,
et aucun ne peut revenir par la structure.

### Décision

**Chantier 3 refusé, et pas reporté.** Contrairement à `i18n.js`, où le
gain existait mais coûtait trop cher, ici **il n'y a pas de gain** : la
mesure est négative sur les trois compteurs, et il n'y a aucune feature
ni aucun bug derrière. Le seul argument restant serait la métrique de
complexité — et ce document a maintenant établi **trois fois** qu'elle ne
suffit pas à elle seule.

Ce qui reste vrai et qu'on garde en note : `storage.js` fait 409 lignes
et mélange quatre responsabilités. Si un jour une feature a besoin de
l'une d'elles sans les autres — c'est ce qui a rendu `badges.js`
découpable — la découpe se fera à ce moment-là, guidée par ce besoin
plutôt que par le compteur.

---

## `tutorial.js` : simulé — et le vrai sujet n'est pas le découpage

Quatrième et dernier module du backlog. Même méthode, pour que les quatre
soient clos avec la même rigueur.

Découpe simulée : `tutorial-data.js` (28 étapes, 5 chapitres),
`tutorial-snapshot.js` (instantané / restauration localStorage),
`tutorial.js` (moteur de positionnement).

| | modules | nœuds | arêtes | part | feuilles |
|---|---|---|---|---|---|
| Avant | 43 | 27 | 125 | 63 % | 16 |
| Découpe en 3, telle quelle | 45 | **29** | **130** | 64 % | 16 |
| **Seule la partie pure extraite** | 44 | **27** | **125** | 61 % | **17** |

**Contrairement à `storage.js`, quelque chose est extractible.** La partie
« sûreté des données » — `isTutorialSeen`, `markTutorialSeen`,
`tutorialKeys`, `captureLocalStorage`, `applyLocalStorage`, ~75 lignes —
ne dépend de **rien** : `tutorialKeys()` est une liste en dur, pas un
appel à `SEASON_KEY_RE`. Elle sortirait en **feuille**.

**Mais la découpe en trois, elle, aggrave** : 27 → 29 nœuds, 125 → 130
arêtes. `TUTORIAL_STEPS` n'est pas de la donnée — chaque étape porte des
fermetures `ensure`/`target` qui appellent `switchView()`, `closeMo()` et
les sélecteurs du moteur. Les « données » du tutoriel sont du
comportement ; les séparer du moteur crée une arête au lieu d'en retirer.

> ⚠️ **Et le « 61 % » ne vaut rien.** La composante reste à **27 nœuds** ;
> la part baisse seulement parce que le dénominateur passe de 43 à 44.
> C'est exactement l'artefact contre lequel ce document met en garde
> depuis la première mesure. Le gain réel de l'extraction pure tient en
> un chiffre : **+1 feuille, 0 arête**.

### La raison hors-graphe : elle existe, et ce n'est pas le découpage

Le tableau qui a tranché les trois autres :

| module | ce que le découpage débloquait |
|---|---|
| `cloud.js` | le multi-saisons |
| `badges.js` | l'export de liste d'échange |
| `storage.js` | rien |
| **`tutorial.js`** | **rien — mais voir ci-dessous** |

Pas de feature bloquée, pas de famille de bug. En revanche la mesure
d'audit tient toujours, et elle est sévère :

```
tutorial.js   44,91 % de lignes   ·   11,27 % de FONCTIONS
              non couvert : 84-746  (tout le moteur)
```

**11,27 %, la pire couverture de fonctions du dépôt** — confirmée, pas
citée de mémoire. Et le détail dit où : les lignes 1 à 83 sont couvertes,
tout le reste ne l'est pas. **Ce qui est testé, c'est exactement la
partie qu'on extrairait.**

Conséquence à écrire avant de s'en réjouir : extraire
`tutorial-snapshot.js` ne **crée aucun test**. Ça déplace les 20 tests
existants vers un module de 75 lignes qui affichera ~100 %, et laisse un
`tutorial.js` de 670 lignes à ~0 %. Le nombre deviendrait **honnête** au
lieu d'être dilué — ce n'est pas rien, mais ce n'est pas un progrès de
sûreté.

### Décision

**Découpe refusée. Le sujet réel est la couverture du moteur.**

Le moteur est de la géométrie et du DOM : halo, bulle, pastille
directionnelle, attente de cible, défilement. Le tester demande un DOM,
pas un découpage — et c'est un chantier de **test**, à instruire pour
lui-même, avec son propre chiffrage. Il n'appartient pas à ce plan.

**Ce qui reste acté si ce chantier de test s'ouvre un jour** : commencer
par extraire `tutorial-snapshot.js`. Pas pour le graphe (+1 feuille,
0 arête), mais parce que `app.js` importe aujourd'hui 746 lignes et neuf
dépendances pour deux getters `localStorage`, et parce qu'un moteur
mesuré à 0 % se laisse instrumenter plus franchement qu'un module dont
la moyenne est adoucie par la seule partie déjà sûre.

---

## La mesure qui a tranché

Codacy signale 13 des 30 fichiers sources au-dessus du seuil de complexité,
soit 43 % — contre un objectif de 10 %. Le premier réflexe serait de conclure
que treize fichiers sont à refaire. La complexité normalisée par la taille
raconte autre chose :

| Fichier | Complexité | Lignes | **pour 100 lignes** |
|---|---|---|---|
| `badges.js` | 377 | 931 | **40,5** |
| `collector.js` | 29 | 74 | 39,2 |
| `difficulty.js` | 48 | 125 | 38,4 |
| `storage.js` | 140 | 390 | **35,9** |
| `tutorial.js` | 253 | 741 | **34,1** |
| `cloud.js` | 234 | 726 | **32,2** |
| … | | | |
| `pin.js` | 148 | 968 | 15,3 |
| `render.js` | 144 | 1039 | **13,9** |

`render.js` est signalé complexe avec la densité **la plus basse** du dépôt
après les modules triviaux. Il n'est pas alambiqué : il est long. `pin.js`
de même. La métrique est un produit taille × densité, et pour ces deux-là
c'est la taille qui domine.

## Ce qu'on scinde — et pourquoi

Quatre modules sont gros **et** denses. Aucune granularité ne les excuse.

### `badges.js` — 377, le plus dense du dépôt

Il porte aujourd'hui : l'évaluation des 120 badges, le modèle de difficulté,
le rendu des familles, l'anneau de progression, les titres, la file de
toasts, la célébration sur tuile, et l'export canvas de la carte de
collectionneur. Sept responsabilités dans un fichier.

**Ce que ça débloque :** l'export de liste d'échange. Les fonctions
`fmtMissing` / `fmtDoubles` / `fmtTrade` de `stats.js` attendent une UI
depuis la v2.x ; elles ne sont pas branchées parce que l'endroit où les
brancher est déjà saturé.

### `cloud.js` — 234, et 16 % de duplication (record du dépôt)

Auth GoTrue, session, rafraîchissement de jeton, push/pull, changement
d'e-mail, rendu de la zone cloud des Réglages. La duplication vient des
blocs `try/catch` répétés autour de chaque `fetch`.

**Ce que ça débloque :** le multi-saisons. Il touchera précisément les
chemins push/pull, et les toucher aujourd'hui veut dire les toucher six fois.

### `storage.js` — 140 sur 390 lignes, 35,9 pour 100

État de la collection, clés de saison, migration, import/export, dialogue
d'import, helpers de rareté. La rareté n'a rien à faire là.

### `tutorial.js` — 253

28 étapes, 5 chapitres, moteur de positionnement, instantané/restauration.
Les données (étapes, chapitres) et le moteur peuvent se séparer proprement.

## Ce qu'on NE scinde PAS — et c'est une décision, pas un oubli

**`render.js` et `pin.js` restent tels quels.**

Les découper les ferait passer sous le seuil sans qu'une seule branche ait
changé. Ce serait déplacer la ligne d'arrivée par un autre moyen que le
curseur — et le curseur, on a déjà décidé de ne pas y toucher.

Si un jour ils se scindent, que ce soit parce qu'une fonctionnalité l'exige,
jamais parce qu'un chiffre le demande.

## Une réserve honnête sur la métrique

Elle compte des **fichiers**. Une architecture faite de peu de gros modules
est donc pénalisée par construction : le même code réparti sur 300 fichiers
de composants donnerait 4,3 %, sans qu'une ligne change.

C'est un fait sur la mesure, pas une excuse. Les quatre modules ci-dessus
sont réellement denses, et c'est pour eux — pas pour la note — que le
refactor est prévu.

## Le chiffrage — la jauge tombe-t-elle sous 10 % ?

**Non.** Scinder les quatre modules denses amène de 43,3 % à **18,8 %** de
fichiers complexes. L'objectif de la jauge est 10 %.

La raison tient à ce que le découpage fait au **dénominateur** : il monte en
même temps que le numérateur descend. Un module de complexité 377 doit se
couper en 8 morceaux pour que chacun passe sous la barre, donc il retire 1
fichier complexe mais ajoute 8 fichiers au total.

| Scénario | Scindés | Dénominateur | Complexes | % | ≤10 % ? |
|---|---|---|---|---|---|
| **A** — les 4 modules denses seuls | 4 → 22 | 48 | 9 | **18,8 %** | ✗ |
| **B** — les 4 + les 5 fichiers juste au-dessus | 9 → 32 | 53 | 4 | **7,5 %** | ✓ |
| **C** — tout sauf `render.js` et `pin.js` | 11 → 38 | 56 | 2 | **3,6 %** | ✓ |

Après le scénario A, resteraient signalés : `stats.js` (150), `pin.js` (148),
`render.js` (144), `app.js` (77), `update.js` (65), `data.js` (62),
`secure-store.js` (60), `account.js` (58), `install.js` (55). Neuf fichiers,
dont deux qu'on a décidé de ne pas toucher.

**Pourquoi on ne fait pas B pour autant.** Les cinq fichiers qu'il ajoute
(`install`, `account`, `secure-store`, `data`, `update`) sont entre 55 et 65 :
juste au-dessus de la barre, une coupure en deux suffirait à chacun. Mais
scinder `install.js` — 182 lignes — parce que le compteur le demande, c'est
exactement ce qu'on s'est interdit pour `render.js`. La règle ne peut pas
valoir pour l'un et pas pour l'autre.

**Réserve sur ces chiffres.** La coupure utilisée (~50) est **calibrée pour
reproduire les 43 % affichés par Codacy**, pas dérivée de sa formule — le
réglage annoncé est `fileComplexityValueThreshold: 20`, et le lien entre les
deux n'a pas pu être retrouvé. La conclusion « la jauge ne tombe pas sous 10 % » est
robuste : l'écart entre 18,8 % et 10 % est trop large pour tenir à une erreur
de calibrage. Les 7,5 % du scénario B, eux, sont à prendre avec précaution.

## Décision : le découpage COSMÉTIQUE est refusé

Ce qui est refusé ici, ce n'est pas la note A — le dépôt l'a déjà. C'est le
**découpage cosmétique** : scinder des fichiers dans le seul but de faire
tomber la jauge de complexité sous 10 %.

Tranché, et noir sur blanc pour que personne ne rouvre le débat dans six
mois :

- Scinder les quatre modules réellement denses mène à **~18,8 %**, pas à 10 %.
- Atteindre 10 % exigerait de découper en plus des fichiers que **rien ne
  justifie de découper** — `install.js` et ses 182 lignes, `account.js`,
  `secure-store.js`, `data.js`, `update.js` — uniquement pour faire bouger un
  compteur. **C'est refusé**, au même titre que monter le seuil ou découper
  `render.js`.

Un découpage qui ne rend pas le code plus clair n'est pas un refactor, c'est
une mise en scène. Et une jauge qu'on satisfait sans rien améliorer cesse de
mesurer quoi que ce soit.

**Le critère de réussite** n'est donc pas un pourcentage : c'est que
`cloud.js` cesse de rendre le multi-saisons pénible et que `badges.js` laisse
enfin brancher l'export de liste d'échange.

La jauge de complexité reste rouge à l'arrivée, expliquée dans les README —
et ce document est la raison écrite de ce choix.

## Tests d'abord — là où c'est possible

Ces quatre modules ont peu de couverture, et un refactor y casse en silence.
`tutorial.js` est le cas d'école : **44,5 % de lignes, 11,3 % de fonctions**
exercées. Neuf fonctions sur dix n'y sont jamais appelées par un test.

La séquence est donc : **filet d'abord**. Des tests de caractérisation sur le
comportement observable de chaque module AVANT d'y toucher — pas après, où
ils ne feraient que graver le comportement issu du refactor, bugs compris.

Les tests de sûreté des données du tutoriel (instantané / restauration
byte-identique) sont déjà ce filet-là pour une partie du module : ils doivent
passer **inchangés** de part et d'autre du découpage. C'est le même critère
qu'en 1.47.0.

## Ordre proposé

1. `cloud.js` — il bloque le multi-saisons, qui est la v2 elle-même.
2. `badges.js` — il bloque l'export de liste d'échange.
3. ~~`storage.js` — sortir la rareté est un découpage évident et sans
   risque.~~ **REFUSÉ après simulation** : 27 → 29 nœuds, 128 → 149
   arêtes, zéro feuille gagnée, et aucune feature derrière. Voir
   « `storage.js` : simulé aussi, et refusé » plus haut.
4. ~~`tutorial.js` — le moins urgent : il fonctionne et personne n'y
   touche.~~ **REFUSÉ après simulation** : découpe en trois → 27 → 29
   nœuds, 125 → 130 arêtes ; extraction de la seule partie pure → +1
   feuille, 0 arête. Aucune feature derrière. Le vrai sujet est sa
   couverture de fonctions — **11,27 %**, la pire du dépôt, tout le
   moteur (lignes 84-746) non testé. Voir « `tutorial.js` : simulé — et
   le vrai sujet n'est pas le découpage » plus haut.

## Garde-fou

La marge de couverture est mince : **62,72 % pour un seuil de 60**. Scinder
du code déjà testé ne change pas le ratio, mais un chantier qui ajoute du
code neuf sans tests le fera tomber vite — de l'ordre de 300 lignes non
testées suffisent à repasser sous la barre. À surveiller pendant le
multi-saisons, qui touchera ces fichiers-là.

---

## Troisième chantier refusé : borner la fréquence du bandeau « nouveautés »

**Refusé en 1.77.0**, après le correctif de `f0be4d0` (un message jamais vu
n'est plus consommé). Ce correctif a un effet mesuré : un bandeau jamais
touché est **re-proposé à chaque chargement de page, indéfiniment** —
3 fois sur 3 relevées, `seen_version` inchangé, une offre par chargement et
non par navigation interne (`_whatsNewOffered` tient la session).

Quatre bornes ont été chiffrées. **La borne « au plus une par jour »
(clé `f1uno_whatsnew_jour`, ~5 lignes) était la recommandation, et elle est
refusée.**

**L'argument, et il tient en une ligne : elle borne une fréquence qui n'a
jamais été mesurée.** « 12 lancements par jour ramenés à 1 » suppose douze
lancements par jour. Le dépôt n'a **aucune donnée de fréquence de
lancement** : Cloudflare Web Analytics est posé sur la **vitrine**, pas sur
l'app, et l'app n'émet rien. Pour un usage à un lancement par jour — le seul
profil que rien ne contredit — la borne ne change **strictement rien** : elle
ajoute une clé de stockage, un registre à tenir et un cas de test pour un
effet nul. C'est la même faute que le chantier 3 et que la découpe de
`storage.js` : une amélioration dont le bénéfice est postulé, pas mesuré.

**Condition de réouverture — deux voies, l'une ou l'autre suffit :**

1. une **mesure de fréquence de lancement** montrant un usage
   multi-sessions quotidien (l'app instrumentée, pas la vitrine) ;
2. un **retour d'utilisateur** disant que le bandeau insiste.

Le second est le plus probable et le moins cher : il ne demande rien à
écrire aujourd'hui.

### Le contrat retenu, à documenter plutôt qu'à borner

Le bandeau « nouveautés » est un **indicateur de non-lu** :

- **offert une fois par chargement de page** — pas par navigation interne ;
- **jamais consommé tant qu'il n'a pas été traité** : ni l'affichage, ni
  l'éviction par un bandeau de rang supérieur ne l'effacent ;
- **terminé définitivement par un clic sur l'un OU l'autre bouton** —
  « Nouveautés » comme la croix estampillent `seen_version`.

Un seul geste suffit à en finir, et c'est ce qui rend l'insistance
acceptable sans borne. Ce que ce contrat NE dit pas encore à l'utilisateur
est consigné en POINTS-SIGNALES n°27 : la croix des nouveautés veut dire
« jamais » là où la croix identique du bandeau de mise à jour veut dire
« pas maintenant ».
