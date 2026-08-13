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
> **Aucun point ouvert.** Les treize sont corrigés, mesurés ou tranchés,
> et tous conservés avec leur diagnostic : 1a, 1b, 2, 3, 4, 5, 6, 7, 8,
> 9, 10, 11, 12, 13. Reste une hypothèse non mesurée, notée au n°12 §C :
> ce que voit l'utilisateur quand le quota Resend est atteint.

---

## 1. Deux champs de données inertes

Même famille : un champ qui existe dans les données, que tout lecteur
suppose utilisé, et que le code ignore complètement. **Le premier est
corrigé, le second est tranché — les deux sont clos.**

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

### ~~`g` sur les livrées d'écurie — inerte, et perpétué par un test~~ — TRANCHÉ : retiré (`c3ac181`)

> **Retiré, avec son test.** L'autre issue — lui donner un usage réel —
> a été écartée sur une mesure : la bande de livrée fait **7 px de
> large** (vérifié au navigateur, 78 bandes, toutes 7×120). C'est
> l'argument déjà retenu pour `swap` et `refresh`, indistinguables à
> 12-14 px : une géométrie a besoin de surface. À 7 px, dix gestes
> seraient dix fois la même colonne.
>
> Et le champ était un **vestige d'un arbitrage déjà rendu** : les
> gestes étaient réellement peints jusqu'à P1 (1.33.0), qui a donné le
> fond à la rareté et l'écurie au casque. Le dessin est parti, le champ
> est resté.
>
> Le test qui le remplace garde l'absence : une livrée ne porte que ses
> deux couleurs. Ajouter une écurie ne demande plus d'inventer quoi que
> ce soit.

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

## 4. ~~Un émoji oublié par la passe de 1.31.0~~ — CORRIGÉ (1.59.4)

> **Le diagnostic ci-dessous était faux sur son point le plus précis, et
> la mesure l'a montré.** Il affirmait que l'émoji « n'apparaît qu'en
> français, par accident », parce que `data-i18n` l'écrasait au premier
> `applyLanguage()`. Vérification au navigateur : `applyLanguage()`
> **n'est jamais appelée** quand un PIN est actif — elle vit dans
> `initApp()`, qui ne tourne qu'après le déverrouillage.
>
> Conséquence réelle, plus large que le point signalé : **tout l'écran
> de verrouillage restait dans la langue écrite en dur**. En chinois
> comme en français, `document.documentElement.lang` valait `en` et le
> titre affichait « PIN Code ». L'émoji, lui, était visible partout —
> pas seulement en français.
>
> Corrigé aux deux niveaux : `applyLoginI18n()` traduit l'écran visible
> au démarrage (sans toucher aux rendus de données, qui ne sont pas
> chargées à ce moment), et le bouton porte `icon('eye')` avec son
> libellé dans un `<span data-i18n>` — l'icône ne peut plus être effacée
> par une écriture dans `textContent`.
>
> **Ce que ça enseigne** : le point disait vrai sur le symptôme et faux
> sur la cause, et la cause fausse était la plus rassurante des deux
> (« un cas limite en français » plutôt que « tout le monde, tout le
> temps »). Le diagnostic d'origine est conservé tel quel ci-dessous.

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

## 5. ~~Les marqueurs de coin sont muets pour un lecteur d'écran~~ — CORRIGÉ (1.59.5)

> **Le correctif prescrit ici n'aurait rien corrigé, et la mesure l'a
> montré avant qu'une ligne soit écrite.** Le point demandait deux clés
> i18n et `role="img"` + `aria-label` sur les marqueurs, « sur le modèle
> du sceau ». Or la tuile est un `role="button"` porteur d'un
> `aria-label` : le nom accessible d'un bouton **remplace** son contenu.
> L'étiquette des marqueurs aurait été avalée — exactement comme
> **celle du sceau l'était déjà**, ce que le point citait pourtant en
> exemple à suivre.
>
> Relevé au navigateur (CDP, `Accessibility.getPartialAXTree`), avant :
>
> ```
> Stoffel Vandoorne — #070      (réserve)
> James Vowles — #076           (directeur)
> ```
>
> Après :
>
> ```
> Stoffel Vandoorne — #070, Pilote de réserve, Aston Martin…, possédée
> James Vowles — #076, Directeur, Atlassian Williams Racing, possédée
> Fernando Alonso — #004, Pilote, Aston Martin…, possédée, set complet,
>   champion du monde
> ```
>
> **L'information passe par le seul endroit qui est lu** : le nom de la
> tuile, composé par `cardAriaLabel()`. Les marqueurs restent
> `aria-hidden` — ils sont décoratifs, et le dire est honnête. Le sceau
> de la tuile perd son `aria-label` inerte et garde son `title`, utile à
> la souris.
>
> **Quatre clés ×7, pas deux** : `cat.*` existait déjà et dit la
> catégorie mieux qu'une clé neuve (même vocabulaire que le reste de
> l'app) ; les quatre ajoutées disent l'état de collection, qu'aucune
> clé ne portait sans glyphe — `a11y.owned`, `a11y.missing`, `a11y.set`,
> `a11y.champion`.
>
> **Ce que la mesure a appris en plus** : la catégorie d'une carte
> n'apparaît **nulle part** en texte, ni sur la tuile ni dans la fiche —
> seulement dans les agrégats de Stats. Un utilisateur voyant la déduit
> du visuel ; sans la vue, elle n'existait pas du tout.

### Diagnostic d'origine



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

## 6. ~~`cloudDeleteSeason()` renvoie `true` même quand rien n'a été supprimé~~ — CORRIGÉ

> **`Prefer: return=representation`**, le même en-tête que `pushSeason()`
> utilise déjà : PostgREST renvoie alors les lignes supprimées, donc leur
> nombre. La fonction renvoie ce nombre.
>
> **Trois résultats, pas deux** — et c'est là que se joue l'honnêteté :
>
> | Retour | Signification |
> |---|---|
> | `2` | deux lignes ont réellement disparu |
> | `0` | **certitude** : il n'y avait rien à supprimer |
> | `null` | **ignorance** : le serveur n'a pas renvoyé les lignes (204, corps vide, JSON illisible) |
>
> `null` n'est pas `false`. Un échec aurait déjà levé `delete-failed` avant
> d'arriver là ; renvoyer `false` sur une ignorance affirmerait un échec
> qui n'a pas eu lieu — la faute symétrique de celle qu'on corrige.
>
> **Un test de caractérisation a été modifié volontairement.** Il figeait
> le `true` constant. Ce n'était pas une observation neutre à préserver :
> c'était la photographie d'une valeur qui ne portait aucune information.
> Les quatre nouveaux tests échouent tous sur l'ancien code.
>
> **Ce qui reste ouvert, et qui appartient à l'utilisateur** : la zone
> danger affiche toujours « Copie dans le nuage supprimée » même quand
> zéro ligne est partie. L'information existe désormais ; l'afficher
> demande une clé i18n ×7 (« il n'y avait rien à supprimer »), donc son
> propre passage — c'est précisément le scénario que ce point annonçait.

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

## 7. ~~La grille se reconstruit entièrement au retour sur Collection~~ — CORRIGÉ (1.59.6), diagnostic redressé

> **La prémisse était fausse, et c'est la mesure qui l'a dit.** Les 101
> tuiles sont marquées avant le changement de vue et retrouvées intactes
> après : **101 marques sur 101, zéro nœud ajouté, aucune tâche longue**
> (`PerformanceObserver`, entryType `longtask`). Le DOM n'est pas touché.
> La comparaison avec le défaut d'ajout rapide — « même signature » —
> était donc trompeuse : là, un re-rendu JS ; ici, rien du tout.
>
> **Le coût est dans la PEINTURE.** La vue passe de `display:none` à
> visible : le navigateur repeint 101 tuiles d'un coup, avec leurs
> couches foil. D'où l'absence de tâche longue — le travail est dans le
> compositeur, pas dans le fil JS. C'est aussi pourquoi le profilage par
> tâches longues ne voyait rien, alors que l'œil, lui, voyait.
>
> **Corrigé par deux lignes de CSS** : `content-visibility:auto` laisse
> le navigateur sauter le rendu des tuiles hors écran ;
> `contain-intrinsic-size:auto var(--card-h)` lui donne la taille exacte
> à réserver — elle l'est, puisque la hauteur de tuile est fixe.
>
> | | avant | après |
> |---|---|---|
> | Images sur les 280 ms du glissement | 9-11 | **17** |
> | Cadence | 32-36 fps | **61 fps** |
> | Pire écart entre deux images | 83 ms | **17 ms** |
> | Hauteur de grille (320/390/1280 px) | 17 052 / 17 052 / 7 032 | **inchangée** |
>
> Les trois autres vues en profitent aussi : Badges passe de 32-46 à
> 57 fps.
>
> **La contrepartie est réelle et documentée** : une tuile dont le rendu
> est sauté n'a pas d'animation à figer. Le script de captures désactive
> donc la règle chez lui. C'est la seule dette de ce correctif, elle est
> écrite aux deux endroits, et elle a coûté une demi-journée de mesures
> — voir le n°11, qui a doublé de volume à cette occasion.

### Diagnostic d'origine — conservé, et faux sur sa cause



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

> ⚠️ **Ce « 0 » était un échantillon de taille un, et il a menti — trois
> fois.** D'autres sources d'aléa subsistaient, sans rapport avec les
> animations, et la dernière n'est pas corrigeable : voir le **point
> n°11**. Le gel décrit ici reste juste ; il n'a jamais été suffisant, et
> l'objectif lui-même — l'octet — a fini par être abandonné au profit
> d'un seuil vérifiable.


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
## 9. ~~Le plancher de hauteur de tuile n'a pas été reconfirmé~~ — MESURÉ (sur le CSS de 1.59.4)

> **Refait sur le CSS définitif, et le chiffre de la maquette est
> réfuté.** La mesure d'origine avait échoué faute de méthode : on
> surchargeait `--card-h` et on lisait la hauteur de la GRILLE, qui ne
> bouge pas — les rangées s'alignent sur une hauteur fixe, c'est tout
> l'objet du chantier. On mesurait donc l'invariant qu'on venait de
> poser.
>
> **La bonne mesure ne surcharge rien** : on relâche la contrainte tuile
> par tuile (`height:auto`), on lit la hauteur NATURELLE du contenu, on
> remet. Le plancher est le maximum sur les 101 tuiles.
>
> | Largeur | Plancher mesuré | `--card-h` = 320 |
> |---|---|---|
> | 1280 px | **281,89** | 38 px de marge |
> | 375 px | **314,48** | **5,5 px de marge** |
> | 320 px | **347,08** | **27 px de trop peu** |
>
> Trois conclusions, dont deux n'étaient pas attendues :
>
> **1. Le 300 de la maquette était optimiste de 15 px.** Le vrai
> plancher à 375 est 315, pas 300. La marge réelle n'est pas « large » :
> elle est de 5,5 px. Un nom d'écurie plus long en 2026 la mange.
>
> **2. À 320 px, la hauteur fixe comprime réellement du contenu.**
> Mesuré sur la pire tuile (Fernando Alonso — nom long, drapeau, écurie
> en trois lignes, trois variantes possédées) : `.card-name` passe de 31
> à 23 px et `.card-owned-summary` de 33 à 24. Rien ne déborde de la
> tuile, rien ne disparaît, mais les blocs sont tassés.
>
> **3. Le geste correcteur a un prix qui n'est pas à moi.** Passer
> `--card-h` à 348 supprime la compression à 320 px, au prix de **+8,75 %
> de défilement pour tout le monde**, y compris sur les écrans où 320
> suffit largement. L'alternative — un `--card-h` par palier de largeur —
> réintroduit la variabilité de hauteur que le chantier d'origine avait
> justement supprimée, mais entre paliers, pas à l'intérieur d'une
> rangée. **Arbitrage laissé ouvert** : les deux options coûtent quelque
> chose de réel, et aucune ne corrige un défaut visible à l'usage.
>
> Ce qui est acquis : le chiffre existe, il est reproductible, et la
> méthode qui le produit est écrite ci-dessus. C'était la demande.

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


---

## 11. ~~Le « 0 fichier différent » du gel était vrai une fois, pas toujours~~ — CORRIGÉ

**Trouvé en régénérant les captures après un autre chantier**, et c'est le
réflexe du dépôt qui l'a attrapé : *avant d'attribuer une différence à un
changement, vérifier que la mesure est reproductible SANS changement*.
Six fichiers différaient ; le contrôle — deux exécutions du même code —
en a montré **4 variables**, mais **pas les mêmes d'une fois sur l'autre**.
Signature d'une course, pas d'un défaut de rendu.

Le gel des animations (n°8) avait bien supprimé sa cause à lui. Il en
restait deux, indépendantes, qu'aucune animation ne concernait :

**1. `clip_shot()` mesurait le cadre avant de figer.** L'ordre était :
mesurer, figer, déclencher. Or le gel mène les animations d'entrée à leur
**fin** — il peut donc déplacer la mise en page entre la mesure et la
capture. Le `clip` ne désignait alors plus la même région : image entière
décalée de ~6 px. Trois `quick-add.*` sur sept en vivaient à chaque
exécution, tirées au sort.

**2. La boucle du tutoriel sortait sur une durée, pas sur un état.**
1 600 ms par étape, sortie dès que `#tutNext` existait : selon la vitesse
de la machine, l'étape atteinte variait, et le projecteur se retrouvait
ailleurs — 120 952 pixels d'écart, mesurés.

**Corrigé** : le cadre est relu après le gel (on passe le locator, plus le
cadre) ; le défilement est imposé puis attendu jusqu'à stabilité ; la
boucle attend un **changement d'état observable** (le compteur « n / of »)
et l'étape atteinte est **vérifiée** — une capture prise ailleurs est un
échec, pas une variante.

**Vérifié par quatre exécutions consécutives, trois comparaisons, zéro
différence** — et ce « zéro » a menti à son tour.

---

### La quatrième mesure : l'octet n'est pas tenable, et c'est acté

Trois exécutions de plus, faites en préparant le correctif du n°7, ont
montré **1 à 3 fichiers variables** — encore d'autres causes :

**3. La page Compte lisait le réseau.** Le seed porte une session cloud
fictive, et la ligne « dernière sauvegarde » part vraiment interroger
Supabase, échoue au bout d'un temps variable, et la capture attrape
tantôt le `…` d'attente, tantôt le « none yet » résolu. **131 niveaux
d'écart** — la seule des quatre causes qui se VOYAIT. Corrigé en coupant
l'origine `*.supabase.co` à la racine du contexte de capture (un gel
visuel n'a rien à faire sur le réseau) et en attendant l'état résolu.

**4. Le reste est du bruit d'anti-crénelage, et il ne partira pas.**
Après les trois corrections, il subsiste par intermittence quelques
dizaines de pixels à **3 à 10 niveaux sur 255**, sur un halo de PIN ou un
contour SVG. Testé avec les drapeaux de rendu déterministe de Chromium
(`--disable-gpu`, `--force-color-profile=srgb`, `--disable-lcd-text`,
`--disable-partial-raster`…) : le bruit diminue, il ne disparaît pas. En
isolation, la même capture est pourtant identique 3 fois sur 3 — c'est
donc l'exécution complète qui le produit, pas la page.

**Ce qui remplace la promesse.** `compare_captures.py` régénère et compare
avec **deux seuils chiffrés** : amplitude ≤ 16/255 **et** ≤ 0,4 % des
pixels touchés. Vérifié sur quatre cas fabriqués à la taille réelle des
captures : le bruit mesuré passe, un texte qui change (178 niveaux)
échoue, trois pixels devenus noirs (24 niveaux) échouent, une image
décalée d'un seul niveau échoue.

> **La leçon, écrite une bonne fois.** « Identique à l'octet » a été
> affirmé trois fois et réfuté trois fois. Ce n'était pas de la
> malhonnêteté : à chaque fois, la correction précédente était réelle et
> la mesure qui suivait était propre — trop courte, simplement. Une
> propriété qui dépend d'un aléa intermittent ne se prouve pas en
> répétant la mesure jusqu'à obtenir zéro ; elle se prouve en bornant ce
> qu'on tolère. Le seuil vaut mieux que le zéro, parce qu'il est
> vérifiable en une commande et qu'il ne peut pas mentir par chance.

---

## 12. ~~Bascule vers `arts44.dev`~~ — FAITE le 13/08/2026

> **Les trois textes ont bougé ensemble**, et c'est le test de couplage
> qui l'a garanti plutôt que la vigilance : en changeant l'expéditeur
> dans `db/03-functions.sql`, la suite est passée au ROUGE tant que les
> sept README décrivaient encore le domaine de test. Première mise en
> situation réelle du garde ; il a fait exactement ce pour quoi il avait
> été posé la veille.
>
> | Quoi | État |
> |---|---|
> | `db/03-functions.sql` — expéditeur | `noreply@arts44.dev`, re-extrait |
> | 7 README — puce « limites honnêtes » | réécrite : domaine vérifié + réputation mesurée |
> | `s.limits_mail_d` ×7 — app | plafond QUOTIDIEN, avec sa nuance |
>
> **La nuance de nature a été tenue.** Le texte ne dit pas seulement
> « une centaine par jour » : il dit que si le plafond du jour est
> atteint, **l'attente peut aller jusqu'au lendemain**. Sans cette
> phrase, on aurait recopié la formulation horaire en la vidant de son
> sens — un plafond horaire se recharge en permanence, un plafond
> quotidien non.
>
> **Ce qui reste ouvert** : l'hypothèse du 500 contre 429 (section C
> ci-dessous), à mesurer le jour où un quota sera réellement atteint.

### Ce que la réputation a coûté le premier jour — mesuré

Deux envois, dans l'heure suivant la vérification du domaine :

| Destinataire | Résultat |
|---|---|
| **Proximus** | **rejeté** — `smtp; 554 Your access to this mail system has been rejected due to poor reputation of a domain used in message transfer`, type *Transient* |
| **Gmail** | **reçu, classé en indésirables** |

C'est le comportement attendu d'un domaine sans historique, et le type
*Transient* le dit : le rejet n'est pas définitif, il tombera avec la
réputation. Mais **c'est une régression temporaire par rapport au SMTP
précédent**, et elle touche précisément les FAI belges — donc les
premiers utilisateurs réels.

**Consigné dans les sept README** plutôt que dans l'app : c'est une
observation datée, pas une propriété du produit. Dans la section
« limites », elle serait devenue fausse en quelques semaines sans que
rien ne le signale ; dans les notes d'ingénierie, elle reste vraie —
elle décrit ce qui a été mesuré ce jour-là.

### Diagnostic d'origine

Le domaine `arts44.dev` était acquis, et les codes de connexion
partaient encore du SMTP précédent.

Ce jour-là, **trois affirmations deviennent fausses en même temps**, et
aucune ne se signalera d'elle-même :

| Où | Ce qui devient faux |
|---|---|
| Réglages → limites, clé `s.limits_mail_d` ×7 | « une trentaine par heure » — Resend gratuit plafonne à **100/jour et 3 000/mois**, ce qui est une contrainte de forme différente : un plafond quotidien, pas horaire |
| README ×7 | « les notifications partent du domaine de test de Resend (`onboarding@resend.dev`), qui ne délivre qu'au propriétaire du compte » — plus vrai avec un domaine vérifié |
| `db/03-functions.sql` | l'expéditeur `F1 UNO Élite <onboarding@resend.dev>` dans `notify_feedback_email()` |

**Ce qui s'améliore au passage**, et mérite d'être dit quand ce sera
fait : un domaine vérifié (SPF, DKIM, DMARC) change la délivrabilité de
façon décisive. Le « faut-il s'attendre à ce que certains codes finissent
en indésirables » du rapport cloud n'aura plus la même réponse.

> **La leçon des sept README s'applique d'avance.** Ces trois textes sont
> vrais aujourd'hui et le resteront après la bascule — sans rien
> signaler. C'est exactement la forme de dérive qu'on a passé une session
> à traquer : une affirmation qui décrit précisément le travail qui l'a
> rendue fausse. Elle est notée ici pour que la bascule emporte sa
> correction avec elle.

---

### A. Le SQL, prêt à coller

**Dans la base D'ABORD, le dépôt ensuite** — l'ordre du n°13, pour la
même raison : corriger `db/` sans corriger le serveur produirait un
schéma versionné qui ne décrit plus rien.

Une seule ligne change dans `notify_feedback_email()`. Le reste de la
fonction — les quatre échappements, le garde de clé nulle, le bloc
`exception` — **ne doit pas bouger** :

```sql
-- Remplacer UNIQUEMENT la ligne 'from' du corps de la requête :
--
--   'from', 'F1 UNO Élite <onboarding@resend.dev>',
--
-- par :
      'from', 'F1 UNO Élite <NOREPLY@arts44.dev>',
```

`<NOREPLY@arts44.dev>` est le marqueur : mettre l'adresse réellement
vérifiée chez Resend (`noreply@`, `avis@`, peu importe — **elle doit
appartenir au domaine vérifié**, sinon Resend refuse l'envoi avec un 403
et le trigger l'avalera en silence, puisqu'il avale tout).

La façon la moins risquée de l'appliquer est de **re-exécuter la
fonction entière** depuis `db/03-functions.sql` avec cette seule ligne
modifiée, plutôt que d'éditer dans le dashboard : le fichier est la
référence, il évite d'introduire une différence en même temps.

**Puis re-extraire**, comme pour le n°13 :

```sql
select pg_get_functiondef(p.oid) from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'notify_feedback_email';
```

⚠️ **Remplacer l'adresse du destinataire par `<ADRESSE_MAINTENEUR>`
avant de coller** — elle est passée en clair les deux fois précédentes.

**Vérification** : envoyer un avis depuis l'app et confirmer que
l'e-mail arrive **avec le nouvel expéditeur**. Le trigger avalant ses
propres erreurs, un envoi raté ne se signale nulle part : l'absence
d'e-mail est le seul symptôme, et il ressemble à « personne n'a écrit ».

---

### B. Les textes utilisateur, et le piège de formulation

**Deux plafonds de natures différentes**, et c'est le point à ne pas
rater en réécrivant :

| | Aujourd'hui (SMTP) | Après (Resend gratuit) |
|---|---|---|
| Plafond | ~30 par **heure** | 100 par **jour**, 3 000 par mois |
| Ce qui se passe quand il est atteint | l'attente se compte en **minutes** | l'attente se compte en **heures** |
| Formule qui reste vraie | « ça se débloque tout seul » | ⚠️ vraie, mais **jusqu'au lendemain** |

Un plafond horaire se recharge en permanence : attendre suffit toujours,
et « patiente » est un conseil honnête. Un plafond quotidien, une fois
épuisé, ne se recharge qu'au jour suivant. **Écrire « une centaine par
jour » sans dire ce que ça implique reprendrait la formulation actuelle
en la vidant de son sens.**

**À réécrire, dans cet ordre :**

1. **`s.limits_mail_d` ×7** (Réglages → limites). La formule « une
   trentaine par heure » devient fausse. Garder la règle du n°4 : **pas
   de chiffre exact**, parce qu'il vit chez un prestataire et changera
   sans prévenir. Une piste : « L'envoi d'e-mails est plafonné à environ
   une centaine par jour pour l'ensemble des utilisateurs. En cas
   d'affluence, ton code peut attendre — et si le plafond du jour est
   atteint, l'attente peut aller jusqu'au lendemain. »

2. **Les 7 README**, puce « limites honnêtes » — une seule occurrence par
   fichier, `grep -n "onboarding@resend.dev" README*.md` les trouve
   toutes. Le paragraphe entier tombe : il explique que le domaine de
   test ne délivre qu'au propriétaire du compte, ce qui cesse d'être le
   cas. Ce qui le remplace n'est pas une limite mais une **amélioration**
   — domaine vérifié, SPF/DKIM/DMARC, délivrabilité réelle — donc la
   puce change de section autant que de contenu.

3. **Le README anglais**, si le chiffre des quotas y apparaît ailleurs :
   `grep -n "thirty\|30 per hour\|trentaine" README*.md`.

---

### C. Un effet de bord à vérifier, que personne n'a mesuré

**Quand le quota Resend est épuisé, que voit l'utilisateur ?**

Aujourd'hui, un dépassement de quota SMTP remonte en `429` → l'app
affiche « Trop de demandes — réessaie dans N s » avec le délai réel.
C'est juste.

Rien ne garantit qu'un dépassement de quota **Resend** remonte de la
même façon. S'il arrive en `500`/`error_sending`, `classifyOtpError()`
le classe en `mail-down` et l'app affiche « Le service d'e-mail ne
répond pas — ton adresse n'est pas en cause. **Réessaie dans quelques
minutes.** »

Le début reste vrai, la fin devient un mauvais conseil : réessayer dans
quelques minutes ne servira à rien avant le lendemain.

**À faire au moment de la bascule** : provoquer ou simuler le
dépassement, lire le statut et le corps réellement renvoyés, et — si
c'est bien un 500 — ajouter une branche à `classifyOtpError()`. Tant que
ce n'est pas mesuré, ça reste une hypothèse, et elle est notée comme
telle.

---

### D. Ce qui est déjà en place pour que la bascule ne se fasse pas à moitié

Deux garde-fous ont été posés **avant** la bascule, pendant qu'on avait
le sujet en tête plutôt qu'au milieu du geste :

**Le couplage code ↔ documentation.** `tests/db-rls.test.js` échoue si
`onboarding@resend.dev` disparaît de `db/03-functions.sql` sans
disparaître des sept README, **et l'inverse**. Le test passe aujourd'hui
(les deux côtés décrivent le domaine de test), passera après (aucun des
deux ne le mentionnera), et rougit entre les deux. Vérifié dans les
trois configurations.

**L'adresse de rôle sur le domaine du projet est autorisée d'avance.**
Le garde qui refuse toute adresse en clair dans `db/` aurait refusé
`noreply@arts44.dev` — une adresse publique par nature, qui voyage dans
l'en-tête de chaque e-mail. La liste des locaux autorisés (`noreply`,
`no-reply`, `avis`, `feedback`, `contact`) est explicite plutôt que
« tout `@arts44.dev` » : `herve@arts44.dev` reste refusée, et c'est
vérifié.

> Sans ces deux ajustements, la bascule aurait fait rougir la suite au
> moment précis où on a besoin qu'elle dise la vérité sur autre chose.

---

## 13. ~~`app_version` et `lang` entrent dans l'e-mail de notification sans échappement~~ — CORRIGÉ

> **Corrigé dans la base d'abord, puis re-extrait dans `db/`** — l'ordre
> compte : corriger le fichier sans corriger le serveur aurait produit un
> schéma versionné qui ne décrit plus rien.
>
> Les quatre champs qui viennent du client passent maintenant par un
> `replace` : `safe_msg`, `safe_mail`, `safe_ver`, `safe_lang`.
>
> **Le garde ne cherche pas le mot « échappement ».** Il vérifie deux
> choses qui ne peuvent pas être satisfaites par de la prose : que chaque
> variable `safe_*` est **construite** par un `replace` sur sa source, et
> qu'**aucune source brute** n'apparaît dans le corps HTML. Un champ
> ajouté demain sans échappement échouera sur la seconde condition même
> si personne ne pense à étendre la première.
>
> Vérifié en fabriquant les **huit** fautes possibles — pour chacun des
> quatre champs, l'assignation privée de son `replace`, puis le HTML
> utilisant la source brute. Les huit rougissent.
>
> **CE QUI COMPTE ICI N'EST PAS LE DÉFAUT, C'EST COMMENT IL A ÉTÉ VU.**
> Il existait depuis l'écriture de la fonction. Il n'était visible nulle
> part : le code vivait dans un dashboard, où personne ne relit. Il a été
> trouvé à la **première relecture rendue possible par le
> versionnement** — pas par un test, pas par un incident, pas par un
> utilisateur. C'est l'argument du dossier `db/` en un exemple, et il est
> arrivé le jour même de sa création.

### Diagnostic d'origine



**Trouvé en versionnant le SQL** — c'est-à-dire trouvé parce qu'on l'a
versionné : le code vivait dans un dashboard, où personne ne le relit.

`notify_feedback_email()` échappe soigneusement `& < >` sur le message et
sur l'adresse de l'auteur, qui sont des saisies utilisateur. Deux autres
champs arrivent pourtant du même client et entrent dans le corps HTML
**tels quels** :

```sql
|| coalesce(new.app_version, '?') ||
|| coalesce(new.lang, '?') ||
```

**Portée réelle, sans dramatiser.** Les contraintes CHECK bornent ces
champs à 20 et 5 caractères, ce qui exclut un script complet mais pas du
balisage : `<b>x</b>` tient en 8 caractères, `<img src=x>` en 11. Le
destinataire est le mainteneur, seul, dans un client mail — pas un
navigateur avec une session. Le pire cas réaliste est donc un e-mail de
notification défiguré, pas une compromission.

**Pourquoi ce n'est pas corrigé dans le même commit.** `db/` est un
EXTRAIT de ce que la base exécute. Corriger le fichier sans corriger la
base produirait exactement le mensonge que ce dossier existe pour
supprimer : un schéma versionné qui ne décrit plus le serveur. La
correction se fait dans le dashboard d'abord, puis se re-extrait ici.

**Le correctif**, quand il se fera — deux variables de plus, sur le
modèle des deux existantes :

```sql
safe_ver  := replace(replace(replace(coalesce(new.app_version,'?'), '&','&amp;'), '<','&lt;'), '>','&gt;');
safe_lang := replace(replace(replace(coalesce(new.lang,'?'), '&','&amp;'), '<','&lt;'), '>','&gt;');
```

> **Ce point est l'argument du dossier `db/` en une ligne.** Il existait
> avant d'être versionné, il n'était visible nulle part, et il a été vu
> à la première relecture rendue possible. Le versionnement n'a pas
> créé le défaut : il a créé la relecture.
