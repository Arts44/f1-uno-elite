# Plan v2 — scinder les quatre modules denses

> Ce document existe pour qu'on ne se trompe pas de chantier dans six mois.
> Il dit **ce qu'on scinde**, **ce qu'on ne scinde pas**, et **pourquoi la
> différence n'est pas une nuance**.

## Deux objectifs, et un seul est garanti

Ce refactor poursuit deux buts :

1. **Débloquer ce qui est bloqué** — le multi-saisons (`cloud.js`) et
   l'export de liste d'échange (`badges.js`). Celui-là est certain.
2. **Viser la note A par la voie honnête**, c'est-à-dire en rendant le code
   réellement moins complexe, jamais en déplaçant le seuil.

**Le second n'est PAS atteint en scindant ces quatre modules seuls.**
Le chiffrage est ci-dessous. Il valait mieux le savoir avant de commencer
qu'après une semaine de travail.

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

Les découper les ferait passer sous le seuil et ferait monter la note, sans
qu'une seule branche ait changé. Ce serait obtenir le A en déplaçant la ligne
d'arrivée par un autre moyen que le curseur — et le curseur, on a déjà décidé
de ne pas y toucher.

Si un jour ils se scindent, que ce soit parce qu'une fonctionnalité l'exige,
jamais parce qu'un chiffre le demande.

## Une réserve honnête sur la métrique

Elle compte des **fichiers**. Une architecture faite de peu de gros modules
est donc pénalisée par construction : le même code réparti sur 300 fichiers
de composants donnerait 4,3 % et un A, sans qu'une ligne change.

C'est un fait sur la mesure, pas une excuse. Les quatre modules ci-dessus
sont réellement denses, et c'est pour eux — pas pour la note — que le
refactor est prévu.

## Le chiffrage — est-ce que ça suffit pour le A ?

**Non.** Scinder les quatre modules denses amène de 43,3 % à **18,8 %** de
fichiers complexes. L'objectif est 10 %.

La raison tient à ce que le découpage fait au **dénominateur** : il monte en
même temps que le numérateur descend. Un module de complexité 377 doit se
couper en 8 morceaux pour que chacun passe sous la barre, donc il retire 1
fichier complexe mais ajoute 8 fichiers au total.

| Scénario | Scindés | Dénominateur | Complexes | % | A ? |
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
deux n'a pas pu être retrouvé. La conclusion « A n'est pas atteint » est
robuste : l'écart entre 18,8 % et 10 % est trop large pour tenir à une erreur
de calibrage. Les 7,5 % du scénario B, eux, sont à prendre avec précaution.

## Décision : le A est REFUSÉ ici

Tranché, et noir sur blanc pour que personne ne rouvre le débat dans six
mois : **la note A n'est pas atteignable sur ce dépôt par une voie honnête.**

- Scinder les quatre modules réellement denses mène à **~18,8 %**, pas à 10 %.
- Atteindre 10 % exigerait de découper en plus des fichiers que **rien ne
  justifie de découper** — `install.js` et ses 182 lignes, `account.js`,
  `secure-store.js`, `data.js`, `update.js` — uniquement pour faire bouger un
  compteur. **C'est refusé**, au même titre que monter le seuil ou découper
  `render.js`.

**Le refactor se fait donc pour ce qu'il débloque — le multi-saisons et
l'export de liste d'échange — pas pour la note.** Si le chiffre s'améliore en
chemin, tant mieux ; ce n'est pas le critère de réussite. Le critère, c'est
que `cloud.js` cesse de rendre le multi-saisons pénible et que `badges.js`
laisse enfin brancher l'export.

La note reste **B**, expliquée dans les README, et ce document est la raison
écrite de ce choix.

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
3. `storage.js` — sortir la rareté est un découpage évident et sans risque.
4. `tutorial.js` — le moins urgent : il fonctionne et personne n'y touche.

## Garde-fou

La marge de couverture est mince : **62,72 % pour un seuil de 60**. Scinder
du code déjà testé ne change pas le ratio, mais un chantier qui ajoute du
code neuf sans tests le fera tomber vite — de l'ordre de 300 lignes non
testées suffisent à repasser sous la barre. À surveiller pendant le
multi-saisons, qui touchera ces fichiers-là.
