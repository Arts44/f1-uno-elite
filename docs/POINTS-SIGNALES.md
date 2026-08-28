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
> **46 entrées : 45 défauts et 1 référence. QUINZE défauts sont OUVERTS** —
> c'est ce qu'on vient chercher ici, donc c'est ce que cet en-tête liste :
>
> | № | Ouvert |
> |---|---|
> | 18 | Les PWA installées depuis l'ancienne adresse sont GELÉES sans le dire |
> | 21 | Le recoupement (piste 3c) |
> | 24 | Deux bandeaux coexistent sur un profil qui saute plusieurs versions |
> | 27 | Deux ✕ identiques, deux contrats opposés |
> | 29 | Trois filets sur cinq n'ont jamais été vus rouges |
> | 31 | Le vrai budget de la vitrine est dans les deux captures |
> | 32 | Une PWA mobile développée sans appareil mobile |
> | 33 | La séquence d'intro complète (D) |
> | 34 | La consigne d'installation iOS n'a jamais été vue fonctionner |
> | 36 | L'AVIF servi est moins fidèle que le webp qu'il précède |
> | 40 | La trace de livraison ne peut pas prouver ce qu'elle affirme |
> | 42 | Les 63 variables inutilisées restent invisibles avant push |
> | 43 | Deux sessions : la doc fusionne sans conflit, le push publie l'autre |
> | 44 | Les assertions des filets n'ont jamais été éprouvées à vide |
> | 46 | Un jeton Codacy en clair dans les transcriptions — à faire tourner |
>
> Les 28 autres défauts sont corrigés, mesurés ou tranchés, et conservés avec
> leur diagnostic. Le n°19 n'est pas un défaut : c'est le mode d'emploi du SW
> de démolition, hors décompte. Reste une hypothèse non mesurée notée au
> n°12 §C : ce que voit l'utilisateur quand le quota Resend est atteint.
>
> ### Le vocabulaire des marqueurs
>
> Chaque entrée porte, juste sous son titre, un marqueur lisible par machine :
> `<!-- état: … · type: … -->`. Les deux champs sont **fermés** — toute autre
> valeur fait tomber `tests/points-signales.test.js`. Ils répondent à deux
> questions distinctes, et c'est pour cela qu'ils ne sont pas un seul champ.
>
> **`type` — de quelle NATURE est cette entrée ?**
>
> | valeur | signifie |
> |---|---|
> | `défaut` | quelque chose ne va pas, ou n'allait pas : un bogue, une mesure fausse, une décision à prendre, une contrainte qui borne le travail. C'est le cas par défaut. |
> | `référence` | ce n'est pas un problème mais un **mode d'emploi** : une procédure à rejouer, un savoir-faire consigné. Hors du décompte des défauts. |
>
> **`état` — où en est cette entrée ?**
>
> | valeur | signifie |
> |---|---|
> | `ouvert` | du travail reste à faire, ou une décision reste à prendre. C'est ce que l'en-tête liste. |
> | `fermé` | corrigé, mesuré, ou tranché — y compris **refusé** avec sa raison écrite. Un refus assumé est clos, pas ouvert. |
> | `sans objet` | réservé à `type: référence`, qui n'a pas d'avancement. |
>
> **Pourquoi deux champs et pas un.** Une valeur `référence` glissée dans
> `état` en ferait un fourre-tout : le n°19 n'est pas à un autre stade
> d'avancement, il est d'une autre nature. Et une liste d'exclusions au lieu
> d'un champ `type` **serait** un champ `type`, simplement implicite et non
> documenté — elle se serait cassée dès la deuxième entrée non-défaut.
>
> **Cas limites déjà rencontrés, et leur tranchant :**
> - le n°30 a porté un temps `type: erreur de diagnostic, pas défaut d'outil`.
>   Une erreur de diagnostic **est** un défaut — celui du diagnostic. La
>   nuance appartient au titre, pas au marqueur. Un vocabulaire fermé sans
>   définition écrite se rouvre au premier cas limite : ces lignes existent
>   pour ça ;
> - le n°32 (aucun appareil mobile à disposition) reste `défaut` : une
>   contrainte qui borne ce qu'on peut vérifier se comporte comme un point
>   ouvert dont il faut tenir compte, pas comme un mode d'emploi.
>
> ⚠ **Cette liste se recompte à la main à chaque ajout.** Aucun test ne peut la
> vérifier aujourd'hui, et le barré du titre ne suffit pas : sur les 39 entrées,
> **18 titres sont barrés, 21 ne le sont pas — mais 13 de ces 21 sont clos**,
> leur clôture étant écrite en prose dans le corps (`CORRIGÉ`, `FERMÉ`, `résolu`,
> `accepté`, `BORNÉ`). Un compteur de titres non barrés annoncerait **21 points
> ouverts au lieu de 8**. Rendre l'en-tête vérifiable demanderait un marqueur
> d'état lisible par machine sur les 39 entrées — les 13 concernées sont les
> n° 1, 14, 18, 19, 21 à 28, et 37.

---

## 1. Deux champs de données inertes

<!-- état: fermé · type: défaut -->

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

<!-- état: fermé · type: défaut -->

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

<!-- état: fermé · type: défaut -->

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

<!-- état: fermé · type: défaut -->

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

<!-- état: fermé · type: défaut -->

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

<!-- état: fermé · type: défaut -->

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

<!-- état: fermé · type: défaut -->

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

<!-- état: fermé · type: défaut -->

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

<!-- état: fermé · type: défaut -->

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

<!-- état: fermé · type: défaut -->

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

<!-- état: fermé · type: défaut -->

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

<!-- état: fermé · type: défaut -->

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

<!-- état: fermé · type: défaut -->

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

---

## 14. L'invitation peut s'afficher une fois à quelqu'un qui a DÉJÀ écrit — décision assumée

<!-- état: fermé · type: défaut -->

**Le contrat dit** : l'invitation ne s'adresse qu'à qui n'a jamais envoyé
d'avis. **L'implémentation tient ça pour l'avenir** — le premier envoi
réussi appelle `reviewOff()` et éteint tout, définitivement.

**Ce qu'elle ne peut pas savoir** : qu'un avis a été envoyé *avant* que
cette version existe, ou depuis un autre appareil. L'état vit dans le
`localStorage` de l'appareil ; la table `feedback`, elle, est côté
serveur.

**La vérification serveur a été envisagée et REFUSÉE**, sur un rapport
coût/bénéfice explicite :

| | |
|---|---|
| Ce que ça éviterait | **une** invitation, **une** fois, à quelqu'un ayant déjà écrit |
| Ce que ça coûterait | un appel réseau à **chaque** affichage potentiel, une dépendance de l'invitation au cloud, un chemin d'échec de plus (hors-ligne, session expirée) |
| Population concernée à la décision | **deux personnes** |

Le calcul ne tient pas. Et le pire cas est bénin : quelqu'un qui a déjà
donné son avis voit une bande discrète, clique « Non merci », et ne la
revoit jamais.

> **Ce point est ici pour que la décision soit TRACÉE, pas pour qu'elle
> soit refaite.** Si un jour l'app compte des centaines d'utilisateurs
> et que plusieurs signalent avoir été relancés après avoir écrit, c'est
> le moment de rouvrir — pas avant. La donnée qui déclencherait la
> réouverture est nommée : des retours d'utilisateurs disant « on me l'a
> redemandé ».

---

## 15. ~~L'export de liste d'échange devient faisable~~ — FERMÉ (18/08/2026, 1.66.0) : Copier · Partager sur la liste d'échange

<!-- état: fermé · type: défaut -->

**Fermé par le chantier « stats renversées »** : `fmtTrade()` a ses
appelants — les boutons Copier (presse-papiers) et Partager (fichier
texte) de la page Stats. La plomberie de sortie a été **extraite** de
`profile-card.js` en un module feuille, [`share-file.js`](../app/share-file.js)
(`shareOrDownloadFile`), consommé par le sceau de badges ET la liste
d'échange — déplacée, pas recopiée. Le commentaire « NE PAS SUPPRIMER »
de `stats.js`, posé en 1.48.x, est parti avec la dette qu'il gardait.

Le texte d'origine, pour mémoire :

**Ce n'est pas un défaut, c'est une porte qui vient de s'ouvrir.**

`fmtMissing()`, `fmtDoubles()` et `fmtTrade()` existent dans `stats.js`
depuis la v2.x, produisent du texte, et n'ont **aucun appelant**. Ce qui
leur manquait n'était pas la logique : c'était la **plomberie de
sortie** — `toBlob`, `File`, `navigator.share`, repli sur téléchargement,
toast de confirmation.

Cette plomberie vivait dans `shareProfileCard()`, au milieu de mille
lignes de page Badges. L'atteindre voulait dire importer le DOM, l'i18n,
les minuteurs et 120 badges — ou la recopier.

**Depuis le pas 7 du découpage v2, elle est dans
[`profile-card.js`](../profile-card.js), 94 lignes.** Un
`export-trade-list.js` peut désormais importer ce module seul, et
`badge-cards.js` pour la forme `{id, name, owned}` — sans embarquer la
vue. Les deux arêtes correspondantes sont interdites par
[`tests/import-cycles.test.js`](../tests/import-cycles.test.js), donc ce
n'est pas une intention : c'est tenu.

**Ce qui reste à faire** est du produit, pas de la structure : décider où
vit le bouton, ce qu'on exporte (texte ? image ?), et si la liste
s'échange par lien ou par fichier. Le refactor n'a pas codé la
fonctionnalité — il a enlevé la raison de ne pas la coder.

---

## 16. ~~Les débordements de bulle du tutoriel ne sont vérifiés qu'en français~~ — FERMÉ (17/08/2026) : mesuré ×7, la prémisse est réfutée

<!-- état: fermé · type: défaut -->

**Ce n'est pas une limite de méthode, c'est un trou.** La distinction
compte : une limite de méthode se documente et on passe ; un trou se
comble un jour, et tant qu'il ne l'est pas il doit rester visible.

Un test unitaire vérifie déjà que **chaque étape a son titre et son
texte dans les 7 langues**
([`tests/tutorial.test.js`](../tests/tutorial.test.js)), et qu'ils
**tiennent dans la bulle sur deux lignes à 375 px**. Mais cette dernière
vérification est faite sur une **estimation de longueur**, pas sur un
rendu : rien ne mesure la bulle réelle.

Le parcours Playwright prévu au chantier de test
([`docs/TUTORIEL-TESTS.md`](TUTORIEL-TESTS.md)) ne comblera pas ce trou
non plus, et c'est un choix chiffré : les 7 langues × les tailles d'écran
multiplieraient le temps d'exécution par 14, pour une suite qui doit
rester lançable à chaque commit. **Le parcours tournera en français, à
une taille.**

**Ce qui reste donc non couvert, nommément** : un texte allemand ou
néerlandais — les deux langues les plus longues du dépôt — qui déborde
de la bulle, la pousse hors écran, ou recouvre le bouton « Suivant ». La
panne serait invisible ici et bien réelle chez l'utilisateur, sur le
**premier parcours qu'il verra de l'app**.

**Parade possible, non chiffrée** : une passe de captures dédiée, hors
suite de tests, sur les deux langues les plus longues et la plus étroite
des tailles — à instruire séparément si ce trou se met à coûter.

> **FERMÉ SUR MESURE (17/08/2026).** Les 7 langues parcourues dans le
> vrai tutoriel au viewport LIANT (320×568 — à texte égal, tout viewport
> plus large donne une bulle plus courte : si rien ne déborde à 320,
> 375 et desktop ne peuvent pas faire pire). Trois gravités mesurées à
> chaque étape :
>
> · **bulle hors écran : 0 px, partout, dans les 7 langues** — les
>   clamps du moteur tiennent ;
> · **débordement interne : un delta constant de 9-10 px…
>   IDENTIQUE dans les 7 langues, français compris** — donc pas un
>   effet de longueur de texte. La bulle n'a ni `overflow` ni hauteur
>   contrainte : rien ne peut y être coupé. Artefact de métrique DOM
>   (scrollHeight vs clientHeight), pas un défaut ;
> · **cible recouverte : 2-3 étapes à 320×568, aux MÊMES étapes et aux
>   mêmes surfaces dans les 7 langues** — c'est le repli documenté du
>   moteur au plus petit viewport (« se range au bord le plus dégagé »),
>   présent en français aussi. Un raffinement UX possible, pas un trou
>   linguistique.
>
> **La prémisse du point — l'allemand et le néerlandais déborderaient —
> est réfutée : aucune différence inter-langues, sur aucune des trois
> gravités.** C'est un résultat, pas un échec. (Couverture : 23 étapes
> vues par langue, la machine étant chargée pendant la mesure — les
> étapes non vues sont les mêmes dans les 7 langues, la comparaison
> inter-langues reste valide.)

---

## 17. ~~Le projecteur du tutoriel n'éclaire que la moitié du geste d'ajout rapide~~ — CORRIGÉ (1.60.4, commit 5a15368)

<!-- état: fermé · type: défaut -->

**Le diagnostic d'origine était faux, et la mesure l'a corrigé.** Première
lecture : « la pastille `+` est excentrée, le script n'y arrive pas au
centre du projecteur ». Mesuré : le centre du projecteur (46 px) **tombe
bien sur la pastille** (34 px) — `elementFromPoint` le confirme. La visée
n'est pas le problème.

**Le vrai problème : le geste est en DEUX temps, et le second n'est
jamais éclairé.** Le `+` ouvre un menu de 12 variantes, et l'étape ne
valide que sur le choix d'une variante (`quickAddType`). Pendant ce
second temps, le projecteur **reste sur le `+`** : l'utilisateur voit un
menu apparaître à l'autre bout de la tuile (première variante mesurée à
~105 px du halo) pendant que le halo continue de désigner le bouton déjà
pressé.

**Seconde observation, même étape, mesurée aussi** : le toast
d'annulation de l'ajout couvre la barre de nav **exactement là où l'étape
suivante dit d'appuyer** — `elementFromPoint(centre du projecteur)`
rendait `toast show`, pas l'onglet Stats. Pendant ~3 s, un utilisateur
obéissant au projecteur appuie sur le toast (dont le bouton « Annuler »),
pas sur l'onglet. Ça se résout tout seul quand le toast retombe, mais
pendant ce temps le tour désigne une cible inatteignable.

**Le coût du correctif, chiffré** : ce n'est pas une ligne. Il faut une
notion de « cible de suite de geste » dans le moteur — le `repos()` de
`_bindAdvance()` repositionne le halo sur l'élément **capturé au début de
l'étape** et ne ré-résout jamais la cible ; suivre le menu demande ~10
lignes dans le moteur (ré-résolution après clic + nettoyage) plus une
ligne par étape concernée. Le moteur est à 0 % de couverture : le
modifier sans son filet, pendant un chantier dont l'objet est justement
de construire ce filet, serait faire les choses dans le mauvais ordre.

**Ce qui tient la place en attendant** : `verify_tutorial.py` fait le
geste complet (les deux temps, et l'attente du toast) — le parcours passe
à 34/34 sans étape sautée, donc une régression sur ce chemin se verra.
La sortie de secours de l'app (« Passer l'étape ») garantit qu'aucun
utilisateur ne reste coincé.

**À faire si le moteur gagne son filet** : la « cible de suite de geste »
ci-dessus, et le halo qui suit le menu. Les mesures de ce point sont le
cahier des charges.

> **CORRIGÉ en 1.60.4 (5a15368)**, une fois le filet en place — les deux
> parties : le toast quitte la zone désignée pendant le tour
> (`body:has(.tut-overlay) .toast{bottom:130px}`, une règle CSS, zéro
> ligne de moteur) et le halo suit le menu de variantes (`step.follow`,
> ~16 lignes dans `_bindAdvance()`). Pas de délai fixe : le menu s'ouvre
> SYNCHRONIQUEMENT dans le handler délégué, l'attente est une sonde
> bornée (tick 90 ms, plafond 1,2 s), vérifiée à CPU ×6. TDD complet :
> deux assertions vues rouges avant, vert trois fois, deux contrôles
> négatifs inverses vus rouges. Le contournement de 8 s du script est
> devenu LE GARDE : s'il échoue à « Direction les stats », c'est le CSS
> qui a régressé. Revérifié vert sur HEAD après le changement de casque
> (1.63.2).

---

## 18. Les PWA installées depuis l'ancienne adresse sont GELÉES sans le dire — procédure EXÉCUTÉE et validée

<!-- état: ouvert · type: défaut -->

> **CLOS CÔTÉ PROCÉDURE (19/08/2026).** La migration décrite plus bas a
> été exécutée sur une **install réelle gelée en 1.60** — celle qui
> affichait « connexion internet requise » alors que le réseau
> fonctionnait — et elle a fonctionné. Ce n'est plus une procédure
> supposée, c'est une procédure éprouvée.
>
> **CE QUI RESTE VRAI pour d'éventuelles autres installs gelées**, et
> qui n'a pas bougé :
>
> · **aucune correction à distance n'est possible, même en principe.**
>   Le refus porte sur la REDIRECTION, pas sur le schéma : mesuré,
>   `update()` jette `TypeError « The script resource is behind a
>   redirect, which is disallowed »`. Cocher « Enforce HTTPS » ne ferait
>   que changer la cible en `https://arts44.dev/sw.js` — toujours une
>   autre origine, toujours refusée. Et tant que le CNAME est en place,
>   GitHub Pages redirige TOUT `*.github.io` : impossible d'y servir un
>   SW de démolition.
>
> · **« Enforce HTTPS » n'est pas cochable aujourd'hui.** Lu par l'API
>   GitHub le 19/08/2026 : `https_enforced: false`,
>   `https_certificate.state: dns_changed` — « Detected a change to DNS
>   settings. Requesting a new certificate. »
>
> · **`http://arts44.dev` répond 200 en clair, sans redirection.**
>   Troisième origine, `localStorage` distinct, et **aucun service
>   worker possible** (origine non sécurisée). C'est un piège pour qui
>   suit un ancien lien ou un signet — d'où la consigne de TAPER
>   `https://arts44.dev` à la main, jamais de suivre un lien.
>
> **RAPPEL À TENIR : revérifier l'état du certificat dans quelques
> jours.** GitHub dit déjà en redemander un. Dès que
> `https_certificate.state` passe à `approved`, la case devient
> cochable — **et c'est une action à faire**, pas une option : elle
> ferme la troisième origine pour tous les nouveaux visiteurs. Elle ne
> répare aucune install gelée, et ne les aggrave pas non plus.
>
> ```bash
> gh api repos/Arts44/f1-uno-elite/pages --jq '.https_enforced, .https_certificate.state'
> ```
>
> Le message que voyait l'utilisateur — « Impossible de vérifier —
> connexion internet requise » alors que `navigator.onLine` vaut
> `true` — est un défaut distinct, toujours présent, consigné au n°28.



**Depuis la bascule sur `arts44.dev` (13/08/2026), l'ancienne adresse
`arts44.github.io/f1-uno-elite/` répond 301.** Une PWA installée avant la
bascule continue de fonctionner — son service worker sert tout depuis le
cache — mais sa vérification de mise à jour échoue en silence : `sw.js`
répond 301, et **un script de service worker ne peut pas suivre une
redirection**. Conséquence : app figée à sa version pour toujours,
**aucun bandeau de mise à jour n'apparaîtra jamais**, collection intacte
dans le `localStorage` de l'ancienne origine.

Ce n'est pas une perte de données. C'est un **gel permanent non
signalé** — le pire des deux du point de vue de l'utilisateur, qui croit
simplement que l'app ne bouge plus.

### Procédure de migration — à donner telle quelle

Depuis l'**ancienne app** (celle installée, qui fonctionne encore) :

**Chemin A — par sauvegarde (aucun compte nécessaire)**
1. Ouvrir l'ancienne app → page **Compte**.
2. **Code de sauvegarde** → générer, puis copier le code (ou afficher le
   QR si la nouvelle app sera sur un autre appareil).
3. Ouvrir **https://arts44.dev** dans le navigateur.
4. Page **Compte** → **Importer** → coller le code (ou scanner le QR).
5. Vérifier la collection, puis installer la nouvelle app (bannière ou
   menu du navigateur) et **désinstaller l'ancienne**.

**Chemin B — par le cloud (si un compte existe déjà)**
1. Ancienne app → page **Compte** → vérifier que la dernière
   synchronisation est récente (sinon : pousser).
2. Ouvrir **https://arts44.dev** → page **Compte** → se connecter avec le
   même e-mail.
3. **Récupérer** (pull). Vérifier la collection.
4. Installer la nouvelle app, désinstaller l'ancienne.

Dans les deux chemins, l'ancienne app peut rester en place le temps de
vérifier — elle ne casse rien, elle est seulement figée.

### Ce qui conditionne le chemin A depuis un vieux LIEN

Un lien `#backup=` généré avant la bascule traverse la redirection avec
son fragment intact — **à condition que « Enforce HTTPS » soit coché**
dans les réglages GitHub Pages. Mesuré le 14/08/2026 : la redirection
visait `http://arts44.dev` (en clair), une TROISIÈME origine avec son
propre localStorage vide et sans service worker possible. Un import qui
y aboutirait rangerait la collection dans le mauvais silo.

### Côté Supabase

`sendMagicLink()` envoie `redirect_to = location.origin` : la liste
Auth → URL Configuration doit contenir **`https://arts44.dev/`**, et
**garder l'ancienne URL le temps de la migration** — une ancienne app
gelée peut encore initier une connexion, et son `redirect_to` pointe
l'ancienne origine. Une fois les deux utilisateurs migrés, retirer
l'ancienne entrée.

---

## 19. Le SW de démolition — la preuve qu'il fonctionne, à refaire à chaque déplacement de l'app

<!-- état: sans objet · type: référence -->

**Contexte (1.62.0).** L'app a quitté la racine pour `/app/`, la racine
devenant une page vitrine (qui porte la seule ressource externe du
dépôt — le compteur Cloudflare, exception nommée dans
`tests/no-external-resources.test.js`). Les PWA installées avant le
déplacement avaient un service worker de scope `/` : sans parade, elles
auraient subi le gel silencieux du n°18. La parade est le **`sw.js` de
démolition** laissé à la racine : `skipWaiting` → purge des caches
`f1uno-*` → `unregister` → rechargement des clients.

**La démonstration, sur installation réelle — pas en lecture de code :**

1. app servie à la racine, SW v156 actif (scope `/`), 68 fichiers
   précachés, collection sentinelle posée, **empreinte de la totalité du
   localStorage : `-2100154741`, 20 clés** ;
2. `sw.js` remplacé par la démolition, `registration.update()` — le
   chemin exact d'une vraie installation ;
3. après démolition : **SW : aucun (désenregistré) · caches : vides ·
   localStorage : `-2100154741`, 20 clés — identique à l'octet.**

Un service worker n'a de toute façon PAS accès à localStorage (l'API
n'existe pas dans un worker) — la survie de la collection est une
garantie de plateforme. Mais elle a été **mesurée**, pas déduite.

**Le parcours complet a aussi été rejoué** : ancienne racine en cache →
démolition → vitrine → `/app/` → SW v157 (scope `/app/`) → sentinelles
`owned` et `review` intactes à l'octet ; et un lien `/#backup=X` est
redirigé vers `/app/#backup=X`, fragment préservé.

**Si l'app déménage à nouveau un jour** : refaire exactement ce geste —
le SW de démolition au NOUVEL ancien emplacement, et la démonstration
sur installation réelle avec l'empreinte localStorage mesurée
avant/après. Ce point est le mode d'emploi.


---

## 20. ~~Le casque « masse » — prouvé, NON déployé, en réserve~~ — CLASSÉ (17/08/2026), la réserve ne sera pas déployée

<!-- état: fermé · type: défaut -->

**Contexte (1.63.0).** Le casque au trait (SVG Repo, CC0 — 
https://www.svgrepo.com/svg/172725/f1-helmet, licence vérifiée sur la
page le 16/08/2026) est déployé PARTOUT, petites tailles comprises. La
crainte « un trait fin ne survit pas à 14 px » venait d'un banc rendu à
densité 3 ; à densité 1, les traits fusionnent en masse d'eux-mêmes et
battent l'ancien galet — pixels comparés un à un, contextes réels
(rangée outillage de Stats, marqueur de coin). Voir la règle ajoutée à
CONVENTIONS.md.

**Ce qui reste en réserve : la variante « masse dérivée »** — le contour
extérieur du MÊME tracé (premier sous-tracé du path source), rempli,
visière en réserve par `fill-rule="evenodd"` :

```
contour  : premier sous-tracé de HELMET_GEOM (M331.947,226.808 … z)
visière  : M178,120 L285,118 L316,220 L235,218
           C207,211 187,196 172,166 C170,150 172,132 178,120 Z
```

**Quand la ressortir** : si le 14 px sur écran HAUTE densité (téléphones
récents — où le trait reste un dessin fin, lisible mais léger) gêne à
l'usage réel. Le montage serait celui écarté à 1.63.0 : deux symboles
dérivés de la même source, un seuil NOMMÉ (24 px), documenté ici même.
Ne pas la redessiner : elle est prouvée sur banc (14/22 px, mono et
couleur, clair et sombre).

> **TRANCHÉ (17/08/2026), mesuré en situation** : la rangée catégories de
> Stats rendue aux trois densités, trait contre masse, pixels réels.
> À dsf 2 et 3, le trait est NET — visière hachurée lisible, silhouette
> claire — « plus léger » que la masse, pas gênant. Le seul rendu
> fusionné est dsf 1, déjà tranché en 1.63.0 (la fusion y JOUE POUR le
> trait). Et l'argument que ce point n'avait pas vu : toutes les icônes
> voisines sont AU TRAIT (le système d'icônes est stroke) — une masse
> serait plus grasse que le texte et que ses voisines, elle crierait
> dans une rangée utilitaire. La réserve reste documentée ci-dessus par
> honnêteté d'archive, mais le critère de sortie est désormais réputé
> non atteint : ne la déployer que si un RETOUR UTILISATEUR réel — pas
> une intuition — la réclame.

---

## 21. Le recoupement (piste 3c) — ROUVERT et RETENU en version calcul ; la fiche d'accord partageable est REFUSÉE

<!-- état: ouvert · type: défaut -->

**Mise à jour du 18/08/2026.** Les trois conditions de réouverture
écrites ci-dessous sont remplies : la fiche d'échange existe (1.69.0), le
format `#trade=` est distinct d'une restauration, et surtout la fiche
reçue est **enregistrée localement** (1.74.0) — l'app a donc les deux
collections sous la main. Le recoupement n'est plus un collage manuel,
c'est un calcul sur des données présentes.

**Ce qui est retenu : le CALCUL seul.** L'intersection est du code pur
(`son offer ∩ mes want`, `mon offer ∩ ses want`), et la prédiction « ce
que ça fait monter » ne demande **aucun état hypothétique** —
`variantRarity(carte, type)` est pure, donc comparer sa valeur au
`cardRarity` courant suffit. C'est cette mesure qui a fait tomber le coût
de « moyen » à « faible ».

### CE QUI EST REFUSÉ, et pourquoi — pour que ça ne se rejoue pas

**La fiche d'accord partageable** (« ce qui part / ce qui arrive »,
publiable comme la fiche d'échange) est refusée. Ce n'est pas un oubli
ni un report : c'est une décision, avec son argument.

L'argument est celui qui a fait refuser deux modules du backlog v2 —
**quelle fonctionnalité ça débloque, mesurée, et pour quel besoin
attesté.** Un accord partageable suppose que l'autre personne le
**rejoue** dans son app : donc un quatrième format, un quatrième
décodeur, un quatrième chemin de hash, et la question « que se passe-t-il
si sa collection a changé entre-temps ». Le besoin observé — trois
personnes s'échangeant des listes à la main dans un fil r/F1Cards —
s'arrête à « voici l'échange ». **Le protocole d'accord est une
invention**, et la maquette 3c l'avouait déjà : « il faut un échange
privé de codes, donc les deux personnes doivent déjà se parler ». Si
elles se parlent, elles n'ont pas besoin d'un format pour se répondre.

**Condition de réouverture, précise :** quelqu'un qui utilise
**vraiment** le recoupement et qui demande à répondre **dans l'app** —
un retour d'usage réel, pas une intuition de symétrie. Tant que la
demande n'existe pas, « la suite logique » n'est pas un argument.

---

### Le texte d'origine (report), conservé

## 21 bis. Le recoupement — le report initial

**Piste identifiée à l'exploration du tour 3, consignée pour ne pas se
perdre — et pour ne pas se rejouer sans ses conditions.**

L'inverse de la fiche d'échange : on ne publie pas sa liste, on colle le
code de l'autre et l'app calcule l'intersection — ce qui part, ce qui
arrive, et ce que ça fait monter de palier. L'artefact partagé n'est
plus une liste mais un accord.

**Pourquoi reporté, et ses trois conditions de réouverture :**

1. **Il dépend de l'existence de la fiche d'échange** (chantier 6,
   format `#trade=`) : sans fiche qui circule, il n'y a pas de code à
   coller.
2. **Il suppose que deux personnes se parlent déjà en privé** — rien ne
   se poste dans un fil ; ça ne remplace pas la fiche, ça vient après.
3. **Coût moyen** : l'intersection des deux listes, et la prédiction
   « ce que ça fait monter » — qui rejoue le calcul de rareté sur un
   état hypothétique (nextTierInfo sur une collection simulée).

**À rouvrir si la fiche d'échange trouve des utilisateurs** (le besoin
observé du fil r/F1Cards, pas une intuition). Réserve de la maquette à
tenir ce jour-là : le code échangé doit se réduire à manquantes +
doubles — jamais la collection entière de l'autre, qui est plus que ce
qu'un échange demande.

---

## 22. Les états vides de la piste 3a — UN retenu, trois refusés

<!-- état: fermé · type: défaut -->

**Le fragment retenu (1.70.0)** : l'écran Compte, tant qu'aucune
sauvegarde n'a jamais été faite. Il dit une chose vraie et actionnable —
la collection vit sur cet appareil, donc vider le navigateur l'efface —
au seul moment où le dire ne coûte rien : « tant qu'il n'y a rien à
perdre ». La condition est un FAIT (`hasEverBackedUp()`), pas un
réglage : le bloc disparaît au premier export.

**Ce qui n'a PAS été pris, et pourquoi — pour que ça ne se rejoue pas :**

1. **La projection des stats** (« une carte par jour, et la collection
   est complète le 27 novembre ») est une **invention sans base dans les
   données** — la maquette l'admet elle-même (« "une carte par jour" est
   une invention, elle n'a aucune base »). Une app qui invente une date
   pour motiver ment à son utilisateur ; c'est la famille du refus de la
   piste C (n°21 : ne pas dessiner ce que les données ne portent pas).
2. **Les quatre écrans vides complets** coûtent quatre gabarits en sept
   langues **que personne ne revoit jamais** : ils disparaissent à la
   première carte. Le rapport valeur/maintenance ne tient que pour celui
   qui dit quelque chose qu'on ne peut pas deviner.
3. **Le catalogue numéroté de la grille vide** et **les paliers de
   badges atteignables** sont jolis mais redondants : la grille montre
   déjà les 101 emplacements, et la page Badges montre déjà le prochain
   badge. Ils remplacent du vide par du décor, pas par de l'information.

**Critère de réouverture** : un état vide se justifie quand il porte une
information que l'écran plein ne porte pas, et qu'un utilisateur risque
de payer cher en l'ignorant. Le Compte remplit ce critère (perte de
données) ; les trois autres non.


---

## 23. L'installation du service worker en réseau dégradé — MESURÉE le 19/08/2026

<!-- état: fermé · type: défaut -->

**L'entrée s'appelait « n'a JAMAIS été mesurée » et c'est resté vrai
deux versions. La campagne a eu lieu le 19/08/2026, avec un bridage
POSÉ DANS LE SERVEUR — le seul dont on soit certain qu'il atteint aussi
les requêtes du service worker. Ce qui suit garde l'historique du trou,
puis ce que la mesure a rendu.**

**Ce n'était pas un défaut du produit : c'était un trou dans ce qu'on
savait, et il devait rester visible plutôt que d'être comblé par une
estimation.**

Au diagnostic du bandeau de mise à jour (1.76.0), les trois moments ont
été chronométrés **en local** : vérification ~5 ms, installation **82 ms
médians pour 66 fichiers**, application ~2 ms.

**La mesure « réseau lent » qui les accompagnait est INVALIDE**, et le
contrôle d'instrument l'a montré avant qu'elle soit publiée :
l'émulation `Network.emulateNetworkConditions` de CDP (400 kb/s, 400 ms
de latence) **ne s'applique pas à localhost** — le même `fetch` de
580 Ko prend **5 ms avec et sans throttling**. Les chiffres « dégradés »
étaient donc les chiffres normaux portant une autre étiquette.

**Ce qu'on ne sait pas** : combien de temps dure réellement le précache
de 66 fichiers sur un réseau mobile lent. L'ordre de grandeur local
suffit pour décider de la FORME d'un écran de chargement (une barre de
progression sur l'installation serait invisible dans le cas courant),
mais pas pour promettre une durée à l'utilisateur.

**Ce qu'il faudrait pour combler** : un serveur qui ralentit lui-même
ses réponses, ou une mesure contre la production réelle depuis un
réseau bridé. Décidé de ne pas le faire tant qu'aucune décision n'en
dépend — la noter vaut mieux que la refaire pour rien.

### CE QUI TIENT APRÈS LA CAMPAGNE — avec les périmètres

Campagne du 19/08/2026. **Régime « 3G lent » = 50 000 octets/s et
200 ms de latence par requête, bridés DANS LE SERVEUR de test**, profil
vierge, cache vide, sur le bundle. Tout chiffre ci-dessous porte ce
périmètre sauf mention contraire.

**L'instrument, contrôlé avant toute mesure de produit** : fenêtre de
15 s, illimité **2 517,1 Ko** contre **18,2 Ko** à 10 ko/s — facteur
**138×**. Et les **67** requêtes worker correspondent exactement aux 67
entrées de `SHELL_ASSETS` : le discriminateur est vérifié, pas supposé.

| ce qui est acquis | mesure | périmètre |
|---|---|---|
| **pas d'écran blanc** | écran de langue affiché, 13 boutons, à 5 s, 15 s et 40 s | 3G lent, profil vierge |
| **`addAll` est atomique** | coupure à 40 % : **0 entrée sur 67**, pas 24 — alors que 24 requêtes worker avaient été servies et **930,7 Ko** transférés | 3G lent |
| **`reg.update()` n'aggrave pas** | 41,76 s avec, 41,69 s sans → **+0,07 s (+0,17 %)**, A/B vérifié au compteur (2 fetch contre 1) | 3G lent |
| **le zombie RETARDE, il ne bloque pas** | installation aboutie à **351,5 s** et **353,8 s**, cache **67/67**, malgré un rechargement toutes les 30 s | 3G lent, fenêtre de 600 s, n=2 |
| **le compteur ne se réarme pas** | recharger toutes les 30 s pendant 10 min n'allonge rien | idem |
| **poids transféré** | précache **2 031,9 Ko** gzip compris, contre **3 570,9 Ko** sur disque → facteur **1,76** | les 67 entrées |
| **installation saine** | **41,7 s** jusqu'au worker actif, 67/67 | 3G lent |
| **captures PWA** | **814,3 Ko**, soit **40,1 %** du précache transféré, demandées par le worker seul (page = 0) | précache |

**UN CHIFFRE PUBLIÉ PUIS RETIRÉ, et il n'a jamais été consigné ici :**
un bras de mesure avait rapporté « zombie présent → 0 réussite sur 5 ».
Il était faux — fenêtre d'observation plafonnée à 150 s pour un chemin
qui demande ~352 s. Le résultat n'était pas « jamais » mais « pas
encore ». Voir CONVENTIONS.md, cas ⑭.

### CE QUI RESTE INCONNU

**Les durées sur un réseau mobile réel.** Tout ce qui précède vient
d'un lien bridé en local à 50 ko/s ; aucun seuil de produit ne peut
être réglé là-dessus. La donnée manquante est une installation
chronométrée depuis un appareil réel sur un réseau opérateur, profil
vierge : **durée jusqu'au worker actif, et nombre d'entrées en cache**.
Deux nombres suffisent. Tant qu'ils manquent, toute correction qui
demande un SEUIL reste hors d'atteinte.

### Ce que le défaut NE touche pas : l'usage courant

Mesuré en même temps que le reste, et c'est ce qui réduit la portée de
toute l'entrée. Régime 3G lent bridé côté serveur, profil vierge,
cache vide, état de l'écran relevé pendant que l'installation tourne :

| | ce qui est à l'écran | worker |
|---|---|---|
| 5 s | écran de choix de langue, **13 boutons**, non blanc | aucun |
| 15 s | identique | `installing` |
| 40 s | identique | `installing` |

**Aucun écran blanc, aucune coquille partielle, aucune attente.** L'app
est servie par le réseau et reste utilisable pendant que le worker
installe en tâche de fond. **Une installation lente n'est pas une
attente pour l'utilisateur** — elle ne coûte que le hors-ligne, et
seulement tant qu'elle n'a pas abouti.

Conséquence sur la façon de lire cette entrée : le trou de n°23 ne
concerne **jamais** l'usage courant, uniquement la disponibilité hors
ligne. Tout chantier qui en sortirait doit être pesé à cette aune-là.

### Le facteur aggravant redouté : MESURÉ, puis ÉCARTÉ

Cette entrée portait une sous-section « Facteur aggravant ajouté en
1.77.0, connu et NON mesuré » : le sondage `reg.update()` au démarrage
coûtait une requête conditionnelle de plus sur `sw.js` à chaque
lancement, et on la soupçonnait de peser sur un réseau dégradé.

**Elle est retirée, pas nuancée. La mesure la contredit** — 3G lent
bridé côté serveur (50 ko/s, 200 ms de latence par requête), profil
vierge, cache vide, sur le bundle :

| | worker actif après | fetch de `sw.js` |
|---|---|---|
| **avec** `reg.update()` | **41,76 s** | **2** |
| **sans** | **41,69 s** | **1** |

**+0,07 s, soit +0,17 %.** L'A/B est vérifié par le compteur de
requêtes (2 contre 1), donc la substitution a bien pris ; l'écart est
**sous le bruit** — les octets totaux varient même de 2,7 Ko dans le
sens inverse. `sw.js` pèse ~2 Ko gzippés contre **2 031,9 Ko** de
précache transféré.

**CE QU'IL FAUT RETENIR DE LA FAÇON DONT ELLE A ÉTÉ ÉCRITE.** Cette
sous-section a été consignée **sur commande, sans mesure**, à un
moment où l'instrument n'existait pas. C'était raisonnable — noter un
trou vaut mieux que l'ignorer — mais une crainte consignée prend le
poids d'un fait dès qu'elle est écrite : pendant deux versions, le
dépôt a porté un « facteur aggravant » qui n'en était pas un.
**Une crainte se note comme une crainte, avec la mesure qui la
trancherait écrite à côté, et elle se retire dès que la mesure
tombe** — la nuancer aurait laissé le soupçon vivre.

---

## 24. Deux bandeaux coexistent sur un profil qui saute plusieurs versions

<!-- état: ouvert · type: défaut -->

**Signalé pendant le diagnostic du bandeau de mise à jour (1.76.0),
volontairement non corrigé dans ce commit** — il n'a rien à voir avec
l'intermittence, et l'empiler aurait mélangé deux sujets.

Sur un profil dont `f1uno_seen_version` est très en retard (le seed de
capture porte `1.29.0`), `maybeOfferWhatsNew()` pose `whatsNewBanner`
au moment même où `_showUpdateBanner()` pose `updateBanner`. Les deux
portent la classe `.install-banner update-banner` : même `bottom:150px`,
même `z-index:401`. Ce n'est pas un empilement, c'est une
**superposition exacte**.

### Le premier relevé était faux, et c'est l'instrument qui mentait

L'entrée disait ceci, et concluait que le bouton restait atteignable
donc que le défaut ne relevait pas de la famille « présent mais
inatteignable » :

```
{p: true, a: true, intercepte: 'updateReloadBtn',
 autres: ['whatsNewBanner', 'updateBanner']}
```

**Ce relevé a été pris dans UN SEUL ORDRE D'INSERTION** — celui où le
bandeau de mise à jour arrive en dernier. Il gagne alors le test de
survol parce qu'il est le dernier du DOM à `z-index` égal, et le relevé
dit vrai… sur lui. Il ne dit rien de l'autre.

Dans l'ORDRE DE PRODUCTION, `maybeOfferWhatsNew()` part depuis
`initApp()` et `_showUpdateBanner()` arrive après : c'est
`whatsNewBanner` qui est recouvert. Mesuré sur le bandeau recouvert :

```
{bandeau: false, bouton: false, fermer: false}
```

**Intégralement invisible et intégralement inatteignable.** Aucun de
ses trois points n'est touchable — pas même son ✕. L'entrée relève donc
bien de **la famille « présent mais inatteignable »**, celle qui a déjà
coûté trois occurrences ; elle n'en était sortie que par un défaut de
protocole de mesure. Le nouveau cas est consigné au registre des
instruments menteurs (CONVENTIONS.md, cas ⑥).

Le sens du défaut change avec l'ordre, pas sa nature : quel que soit
l'ordre, **un des deux bandeaux est entièrement perdu**.

### Ce qu'il faut trancher le jour où on le corrige

Les deux bandeaux disent des choses différentes — « une nouvelle
version est prête » / « voici ce qui a changé depuis votre dernière
visite » — et affichés ensemble ils sont **logiquement
contradictoires** : l'un annonce une mise à jour à venir, l'autre
annonce une mise à jour déjà appliquée. Après un rechargement,
« nouveautés » est le seul qui ait encore du sens.

La correction n'est donc pas de les empiler proprement, mais de décider
lequel s'efface — ou dans quel ordre ils se succèdent. Ça se décide
avec un utilisateur sous les yeux, pas dans un commit de correction de
bug.


---

## 25. Éteint à l'œil, pleinement cliquable — la famille INVERSE

<!-- état: fermé · type: défaut -->

**Trouvé en comblant la dernière case de la carte de la zone basse
(1.77.0), pas cherché.** La question posée était « le bandeau
d'installation peut-il coexister avec le tutoriel ? ». La réponse est
oui, et ce n'est pas le plus intéressant.

**La mesure** — contrôle positif d'abord, comme la parade ⑧ l'exige
(hors tutoriel, `maybeShowInstallBanner()` produit bien le bandeau,
donc l'instrument sait le faire paraître) :

```
prompt_capture:               true
controle_hors_tutoriel:       true    ← l'instrument sait le produire
pendant_tutoriel_apparait:    true
install_atteignable:          true
au_point_de_install:          'install-banner-text'
```

`.tut-overlay` porte `z-index:900` **et `pointer-events:none`**
([styles.css:2202](../app/styles.css)) — sans quoi le voile
intercepterait le défilement automatique qui amène la cible dans le
cadre. Une surface à `z:400` se retrouve donc **sous le halo qui la
grise, et pourtant au-dessus de rien du tout pour les clics**.

**Pourquoi ça mérite une entrée et pas une ligne au registre.** Le
registre des instruments menteurs recense les cas où la MESURE trompe
celui qui mesure. Ici l'instrument dit vrai : c'est **le produit qui
ment à l'utilisateur**. Un élément grisé annonce « indisponible » ; il
répond quand même. C'est la famille **inverse** de « présent mais
inatteignable » — celle qui a coûté trois occurrences — et elle est
plus sournoise : la première frustre, la seconde fait agir sans qu'on
l'ait voulu.

**Corrigé dans le même chantier**, et l'échelle de z unique de la zone
basse est ce qui rendait la correction obligatoire : sans elle, les
**sept** surfaces auraient hérité du défaut d'une seule. Une règle
suffit désormais — `body:has(.tut-overlay) .zone-basse` neutralise le
conteneur et ses enfants — et `verify_zone.py` le prouve par un clic
qui ne passe pas, jamais par la lecture du CSS.

**Ce qui reste ouvert** : le dépôt n'a aucune règle générale disant que
ce qu'un voile grise doit être inerte. Elle vaudrait pour toute
surcouche future. Réouverture le jour où un deuxième voile apparaît.


---

## 26. `maybeOfferWhatsNew()` n'avait aucun garde de moment

<!-- état: fermé · type: défaut -->

**Défaut TROUVÉ AVANT la refonte de la zone basse, consigné pour que
la trace ne disparaisse pas dans le commit qui le corrige.**

`_showUpdateBanner()` attend la fin de la mise en route depuis 1.76.0
([update.js](../app/update.js), garde `peutAfficherSurcouche()`). Son
**jumeau**, écrit dans le même fichier, à quarante lignes de là, n'en
avait pas : `maybeOfferWhatsNew()` posait `whatsNewBanner`
inconditionnellement depuis `initApp()`.

**Mesuré**, capture à l'appui : le bandeau « Application mise à jour ! »
s'affiche **en plein tutoriel**, grisé par le halo — et cliquable
(voir n°25). La carte de la zone basse disait « visite guidée ×
bandeaux de mise à jour : non ». C'était vrai pour l'un, faux pour
l'autre : **une correction de ma propre carte**.

**Ce que ça dit au-delà du cas** : une règle appliquée par un appelant
sur deux n'est pas une règle. Le correctif de 1.76.0 avait été posé
là où le défaut avait été observé, pas là où la règle vivait — c'est
exactement le raisonnement qui a fait passer de « trois bugs » à « une
zone sans propriétaire ». La file de `moment.js` le corrige en
supprimant la possibilité même d'un appelant qui oublie : plus
personne ne pose une surcouche sans passer par elle.


---

## 27. Deux ✕ identiques, deux contrats opposés — la pièce la plus grave du chantier de formulation

<!-- état: ouvert · type: défaut -->

**Trouvé en cherchant une borne de fréquence, pas en cherchant ça. Antérieur
à la refonte de la zone basse ; 1.77.0 ne l'a ni créé ni corrigé.**

Les deux bandeaux de `update.js` portent le **même glyphe**, la **même
classe** et **la même clé i18n** pour leur croix — `t('upd.later')`,
« Plus tard » dans les sept langues :

| | [update.js:262](../app/update.js) | [update.js:321](../app/update.js) |
|---|---|---|
| bouton | `#updateCloseBtn` | `#whatsNewCloseBtn` |
| libellé accessible | `upd.later` → « Plus tard » | `upd.later` → « Plus tard » |
| **ce que le clic fait** | pose `_fermeA` | appelle `markVersionSeen()` |
| **mesuré** | +59 min → silence tenu (3011 ms observés) ; **+1 h et 1 ms → le bandeau REVIENT (2 ms)** | après ✕ : `seen` passe à `1.77.0` ; **2 rechargements sur 2 → ABSENT** |
| contrat réel | **« pas maintenant »** | **« jamais »** |

**Pourquoi c'est plus grave que le reste du chantier de formulation.** Les
autres pièces déjà consignées hors périmètre — texte sur 2-3 lignes selon la
langue, contrat de fermeture invisible, « Plus tard » seulement en
`aria-label` — sont de l'**imprécision** : elles rendent la lecture moins
nette. Celle-ci est une **contradiction** : un utilisateur qui a appris le
premier geste se trompe nécessairement sur le second. Il croit reporter, il
efface. Et l'erreur est silencieuse — rien ne lui dira que le message ne
reviendra pas.

**Ce n'est PAS un défaut géométrique**, et c'est pour ça qu'il n'entre pas
dans `verify_zone.py` : les deux croix sont à la bonne place, à la bonne
taille (44 px depuis 1.77.0), atteignables, contrastées. Le défaut est dans
ce qu'elles **promettent**.

**STOP volontaire : non corrigé.** Deux questions sont éditoriales et se
tranchent avec un utilisateur devant, pas dans un commit de correction :
que doit dire chaque ✕, et **faut-il deux glyphes distincts** — un « plus
tard » et un « c'est lu » ne sont pas le même geste. Toute réponse ouvre le
chantier de contenu à **sept langues**, qui est déjà consigné hors périmètre.

**Condition de réouverture** : la décision éditoriale prise sur le sens des
deux gestes. C'est elle qui commande, pas l'inverse.


---

## 28. « Connexion internet requise » — ⑧ dans le produit, affiché à l'utilisateur

<!-- état: fermé · type: défaut -->

**Trouvé en diagnostiquant une install réelle gelée en 1.60 (n°18), pas
en cherchant ça. VÉRIFIÉ SUR HEAD, pas seulement sur 1.60 : le défaut
est intact aujourd'hui.**

Trois issues distinctes de la vérification de mise à jour s'effondrent
sur un seul message, et ce message **nomme l'internet**
([app/pin.js:1118-1126](../app/pin.js)) :

```js
const MSG_KEYS = {
  uptodate: 'upd.uptodate',
  found:    'upd.found_msg',
  offline:  'upd.check_err',      // vraiment hors ligne
  error:    'upd.check_err',      // ← n'importe quel échec
  cooldown: 'upd.cooldown',
  unsupported: 'upd.check_err',   // ← pas de service worker du tout
};
```

`upd.check_err` — FR : **« Impossible de vérifier — connexion internet
requise. »**

### Ce que la mesure a montré

Reproduit en laboratoire, un `sw.js` qui se met à répondre 301 vers une
autre origine — le cas exact des installs de n°18 :

```
update() jette   : TypeError « The script resource is behind a
                   redirect, which is disallowed »
worker après     : toujours activated
navigator.onLine : true
resolveUpdateCheck({error: true, online: true}) → 'error'
→ affiché : « connexion internet requise »
```

**Le réseau fonctionne, `navigator.onLine` vaut `true`, et l'app affirme
à l'utilisateur qu'il n'a pas d'internet.** C'est très exactement ⑧ —
une ABSENCE conclue sans contrôle positif — sauf qu'ici ce n'est pas un
harnais qui se trompe, c'est **le produit qui l'affirme à quelqu'un**.
Un utilisateur qui suit ce message va vérifier son wifi, changer de
réseau, redémarrer sa box : trois gestes inutiles pour un défaut qui
n'a rien à voir.

Et sur le chemin AUTOMATIQUE, c'est pire : `_checkForUpdate()` fait
`_reg.update().catch(() => {})` ([app/update.js:124](../app/update.js)).
L'échec n'est pas mal nommé, il est **muet**.

### Pourquoi ce n'est pas corrigé ici

Corriger demande de distinguer les trois cas à l'écran, donc d'écrire
au moins deux messages neufs **dans les sept langues**. C'est le
chantier de formulation déjà consigné hors périmètre — et **c'en est la
deuxième pièce grave, après le n°27** (deux ✕ identiques, deux contrats
opposés). Même famille : le produit dit quelque chose de faux à
l'utilisateur, et il le dit avec aplomb.

**Condition de réouverture** : la même que n°27 — une décision
éditoriale sur ce que l'app doit dire quand elle ne sait pas.

### Deux fausses pistes, écartées d'avance

Pour mémoire, parce qu'elles reviendront : rendre le précache **non
atomique** (`addAll` → `put` un par un) ou **avaler l'échec
d'installation** (`.catch()` dans `install`) fabriqueraient l'échec B
mesuré au n°23 — un worker ACTIF avec un cache incomplet, donc une app
qui se croit prête hors ligne et ne l'est pas. Ce serait échanger un
défaut borné à ~4,5 minutes contre un défaut **permanent et invisible**.
Refusé, et pas à rediscuter sans mesure nouvelle.

---

## 29. Trois filets sur cinq n'ont jamais été vus rouges — chantier OUVERT, non écrit

<!-- état: ouvert · type: défaut -->

**Le fait, relevé le 21/08/2026 en auditant les contrôles négatifs :**
`verify_vitrine.py` et `verify_zone.py` ont un mode `--controle` ;
**`verify_qr.py`, `verify_tutorial.py` et `verify_trade_inbox.py` n'ont
aucun contrôle négatif.** Trois gardes sur cinq n'ont donc jamais été
observés en train de rougir — ils sont *supposés* savoir voir le défaut
qu'ils prétendent surveiller.

C'est la maison qui exige un contrôle négatif sur tout garde neuf, et
qui ne l'a pas exigé rétroactivement sur les siens. **Un garde qu'on n'a
pas vu échouer n'a pas été vérifié** : la phrase est écrite en tête de
`verify_zone.py`, elle vaut pour les trois autres.

**Ce que ça coûte de ne rien faire.** Ces trois filets tournent à chaque
livraison et rendent vert. Rien ne prouve que ce vert soit gagné — c'est
exactement ⑱ (vert sur un chemin jamais emprunté) à l'échelle du
harnais, et non plus d'une assertion.

**Ce qu'il faudra écrire**, un contrôle par filet, chacun avec son seuil
déclaré à côté (㉒) :

| filet | contrôle plausible, à mesurer avant d'être écrit |
|---|---|
| `verify_qr.py` | densité rendue sous le plancher (le bug de 1.71.0), ou charge corrompue d'un octet |
| `verify_tutorial.py` | une étape dont la cible est retirée du DOM |
| `verify_trade_inbox.py` | à instruire — le filet n'a pas été relu pour ce point |

**Pourquoi ce n'est pas fait ici** : trois contrôles écrits d'un coup,
sans mesurer d'abord ce que chacun doit provoquer, produiraient trois
contrôles calibrés au jugé — la faute que ㉒ vient de consigner.

**Condition de fermeture** : les trois contrôles écrits ET vus rouges,
chacun avec la valeur produit sur laquelle il s'appuie écrite à côté.

---

## 30. ~~Codacy n'était pas joignable~~ — **L'OUTIL N'A JAMAIS ÉTÉ ABSENT**

<!-- état: fermé · type: défaut -->

**Ce point a longtemps dit le contraire de ce qui s'est passé, et le
titre barré ci-dessus est la correction. On n'efface pas l'historique :
ce qui a été affirmé est reproduit plus bas, et ce qui était vrai
au même moment est mis en face.**

### Ce qui a été affirmé

Sur **six tours** répartis sur deux jours, il a été conclu et écrit que
« l'outil Codacy n'est pas disponible dans la session », qu'il était
« présent quelques heures plus tôt, absent depuis ». Aucun compte n'a
été relevé. La conclusion a ensuite été **inscrite ici**, où elle a
produit un mécanisme : la borne basse, la règle de recalcul de
l'intervalle, et une deuxième borne locale prise le 21/08 à `05ae3f8`.

### Ce qui était vrai au même moment

Codacy **analysait chaque jour**, sans interruption, y compris les deux
jours déclarés injoignables :

| commit | jour | issues | LOC |
|---|---|---|---|
| `4cdf88b` | 22/08 | 1 | 12 953 |
| `abb77fb` | 21/08 | 1 | 12 225 |
| `32b9dc4` | 20/08 | 1 | 12 218 |
| `7818335` | 19/08 | 0 | 11 910 |
| `aa6e483` | 18/08 | 0 | 11 912 |
| `0bec034` | 17/08 | 0 | 10 757 |
| `22d446b` | 16/08 | 0 | 10 703 |

**La perte de traçabilité annoncée comme « déjà consommée » n'a jamais
eu lieu.** Le tableau ci-dessus est exactement la série que l'entrée
disait perdue : elle était disponible tout du long, à une requête de
distance.

### LA CAUSE — trois erreurs superposées, toutes vérifiées dans les traces

**① Un `which` qui répond « not found » dans un shell et trouve le
binaire dans un autre.** Dans la MÊME session, `which codacy` a rendu
`codacy not found`, puis plus tard `/opt/homebrew/bin/codacy`, deux
fois. Le PATH n'est pas le même d'une invocation à l'autre selon que le
profil est chargé ou non. Le premier résultat a servi de preuve
d'absence ; les suivants n'ont pas été rapprochés de lui.

**② Un `ls ~/.codacy` non nul lu comme « pas d'identifiants ».** La
commande était `ls -la ~/.codacy/ 2>/dev/null && echo présent || echo
absent` — elle a rendu « absent ». Plus tard dans la même session,
`ls ~/.codacy/` a listé `credentials`. **Le répertoire existait.** Un
`ls` qui échoue pour une raison qui n'est pas l'inexistence (droits,
bac à sable, stderr avalé par `2>/dev/null`) devient indiscernable d'un
répertoire absent — c'est ⑤ appliqué à `ls`.

**③ `CODACY_API_TOKEN` absent de l'environnement, lu comme « pas
d'accès ».** C'était vrai et sans conséquence : la CLI lit ses
identifiants dans `~/.codacy/credentials`, et **l'API HTTP publique du
dépôt ne demande aucun jeton du tout**. Vérifié le 22/08 :

    curl -s "https://app.codacy.com/api/v3/analysis/organizations/gh/\
    Arts44/repositories/f1-uno-elite/commit-statistics?days=30"
    → http 200, toute la série

**Ce que ces trois erreurs ont en commun, et c'est là le vrai défaut :
aucune n'est un test de l'OUTIL. Ce sont trois tests de PRÉCONDITIONS
— le binaire est-il là, le jeton est-il là, le répertoire est-il là —
dont l'échec a été converti en « l'outil est absent » sans qu'un seul
appel réel soit tenté.** Un appel réel aurait réussi n'importe lequel
des six tours, y compris sans binaire et sans jeton.

**Ce qui n'est PAS établi** : pourquoi le PATH diffère entre deux
invocations d'une même session. L'hypothèse est un shell non-login
selon le mode d'exécution ; elle n'a pas été éprouvée, et elle n'a pas
besoin de l'être pour que la parade tienne — la parade ne dépend pas de
la cause du symptôme ①.

### LA PARADE

**Ne jamais conclure à l'absence d'un outil depuis une précondition.
Toujours depuis un APPEL qui échoue.** Et quand plusieurs chemins mènent
au même service — CLI locale, API HTTP —, l'échec de l'un ne dit rien
de l'autre : ici l'API n'a jamais eu besoin de ce qui manquait.

### Ma part et la vôtre

**Ma part** : six tours, aucun contrôle positif, et une conclusion
inscrite en documentation où elle est devenue une prémisse pour la
suite. C'est ⑧ dans sa forme la plus coûteuse — voir le registre.

**Votre part, et elle est réelle** : la consigne récurrente était
« si l'outil est encore absent, dis-le ». Elle demandait **une
déclaration, pas une vérification**. Formulée ainsi, elle acceptait
l'absence comme un état possible à rapporter au lieu d'exiger qu'on
l'éprouve — et elle a donc reconduit l'erreur cinq fois après la
première. La formulation qui aurait cassé la boucle est **« montre
l'appel qui échoue »**.

### CE QUI RESTE UTILE, ET CE QUI A ÉTÉ CONSTRUIT POUR RIEN

**La borne + recalcul de l'intervalle au moment du relevé (⑦) reste
juste**, et pour une raison indépendante de tout ceci : entre deux
relevés il y a N commits, et attribuer un delta à un seul est faux quel
que soit N. Cette règle survit à la correction.

**La deuxième borne locale prise à `05ae3f8` a été construite pour un
problème inexistant** — elle répondait à « Codacy est parti, il nous faut
une continuité de repli », or il n'était pas parti. **Elle est gardée,
avec une justification neuve, et ce n'est pas un vestige :**

**Codacy et `npm run test:cov` ne mesurent pas le même périmètre, et
avoir les deux permet de voir LEQUEL bouge quand un chiffre change.**
Codacy compte 12 993 LOC sur l'ensemble du dépôt livré au navigateur, y
compris ce qu'aucun test Node ne charge ; `test:cov` compte 15 502
lignes instrumentées sur 44 fichiers, soit la tranche « sans
navigateur ». Un écart qui apparaît chez l'un et pas chez l'autre **dit
où il est né** : chez Codacy seul, il vient de code que les tests
n'atteignent pas ; chez `test:cov` seul, d'un module testé dont la
couverture a bougé sans que l'analyse statique s'en émeuve ; chez les
deux, du volume. **Une seule mesure ne peut pas faire cette distinction,
et c'est elle qui a de la valeur** — pas la redondance.

C'est aussi pour cela que les deux ne se comparent JAMAIS l'une à
l'autre : chacune se compare à elle-même, d'un relevé au suivant.

| | à `05ae3f8` (21/08) |
|---|---|
| tests | 1 213 · 242 suites · 0 échec |
| couverture lignes | 72,21 % (11 194 / 15 502) |
| couverture branches | 85,14 % (1 713 / 2 012) |
| couverture fonctions | 65,86 % |
| fichiers instrumentés | 44 |

**Périmètre déclaré (⑦)** : modules chargés par les tests Node, hors
`tests/**`, bundle, traductions, données embarquées et
`cloud-config.js`. **Pas** le périmètre de Codacy (12 953 LOC). Les deux
ne se comparent pas.

### Le relevé courant

> Dernier relevé Codacy : **`dc27aa7`** (23/08/2026) — **1 issue**
> (0,08 / kLoC), couverture 72 %, complexes 40 %, duplication 4 %.
> Intervalle recalculé au moment du relevé : **2 commits** depuis la
> borne précédente `4cdf88b`.

**Avant / après.** Relevé du 22/08 sur `49164b5` : **2 issues**
(0,15 / kLoC). Relevé du 23/08 sur `dc27aa7` : **1 issue** (0,08 / kLoC).
L'écart tient à `4cdf88b`, qui a supprimé le `GRIS` orphelin d'`intro.js`.
Les trois autres métriques n'ont pas bougé. **L'intervalle entre les deux
relevés couvre 3 commits** — aucun de ces chiffres n'est imputable à un
commit isolé (⑦).

La seule issue restante est `Trivy_secret` sur `app/cloud-config.js:23` :
la clé `anon` publique de Supabase, publique par conception, instruite
dans `.codacy.yml`. Faux positif connu, `resultDataId 131529630764`
inchangé depuis le 20/08, rien à reprendre.

### Ce que la borne raconte maintenant

Le mécanisme ne change pas ; **sa raison d'être, si.** Il n'a jamais servi
à rattraper l'absence d'un outil — cette absence n'a pas eu lieu. Il sert
à ce dont ce point manquait vraiment : **savoir jusqu'où le dernier relevé
fait foi.** Un relevé sans borne ne dit pas ce qu'il couvre ; avec borne,
n'importe qui reprend le fil sans redemander.

**À faire au prochain relevé** : recalculer l'intervalle *à ce moment-là*,
avec `git log --oneline dc27aa7..HEAD`, déclarer le nombre de commits
couverts, comparer aux chiffres ci-dessus, puis **remplacer la borne par
le commit relevé**. Ne pas énumérer les commits — une liste écrite se
périme au push suivant, c'est ce qui a été appris ici.

---

## 31. Le vrai budget de la vitrine est dans les deux captures — chantier OUVERT, non fait

<!-- état: ouvert · type: défaut -->

**Le fait, relevé le 21/08/2026** en passant le plafond aux octets
transférés : sur les 107,6 Ko du pire cas, **70,7 Ko sont les deux
captures** — `vitrine-grid.webp` 44,3 Ko et `vitrine-badges.webp`
26,4 Ko. Soit **66 %**. Le reste : la police 21,8 Ko, le HTML servi
gzippé 10,0 Ko, le favicon 5,1 Ko.

Autrement dit : **discuter du poids du HTML, c'est discuter de 9 % du
budget.** Deux blocs de commentaire pèsent 2 Ko ; une capture en pèse
vingt fois plus. Le jour où la vitrine doit vraiment maigrir, c'est là
qu'il faut aller, et nulle part ailleurs.

**Ce qui n'est PAS su, et qu'il faudra mesurer avant de toucher quoi
que ce soit :**

- `vitrine-grid.webp` est l'**élément LCP** — celui que Cloudflare
  chronomètre à 5 091 ms au P90. La réduire touche directement au
  chiffre qui a justifié tout ce chantier ; l'améliorer serait le gain
  le plus direct disponible, et l'abîmer, la régression la plus visible.
- Aucune mesure de qualité perçue n'a été faite : ni AVIF, ni un autre
  niveau de compression webp, ni un redimensionnement à la taille
  réellement rendue.

**⚠️ CORRECTION DU 21/08/2026 — « facteur 7 » ÉTAIT FAUX.** Cette
entrée a d'abord annoncé « 1520 px de source pour ~220 px de rendu
mobile, facteur 7 », et ce chiffre est parti dans un message de commit.
Il comparait la LARGEUR de la source à la HAUTEUR du rendu. Mesuré
correctement, source contre rendu × densité de pixels :

| fenêtre | rendu CSS | densité | pixels nécessaires | source | facteur |
|---|---|---|---|---|---|
| 390×844 | 350×220 | ×2 | 700×440 | 1520×950 | **2,2** |
| 390×844 | 350×220 | ×3 | 1050×660 | 1520×950 | **1,4** |
| 1280×800 | 760×476 | ×2 | 1520×952 | 1520×950 | **1,0** |

**La source n'est pas surdimensionnée : elle est calibrée pour le
desktop en ×2, où elle tombe juste au pixel près.** Le surplus n'existe
que sur mobile, et il vaut 2,2 en linéaire — pas 7. Et
`vitrine-badges.webp` est logée à la même enseigne : 400×866 de source
pour 200×431 rendus en ×2, soit **exactement la bonne taille**.

**Ce que ça change pour le chantier** : il n'y a PAS de gras à retirer
d'un simple redimensionnement. Le seul gain structurel est un
`srcset` avec une variante mobile de la grille — et il ne fera **rien**
pour le pire cas du test, qui est le chemin desktop.

### Ce que coûterait le chantier, chiffré

| piste | gain attendu | où il tombe | ce qu'il faut mesurer avant |
|---|---|---|---|
| `srcset` + variante ~1050 px de la grille | ~20 Ko | **mobile seulement** | que l'élément LCP reste `shot-desktop` et que les octets déterministes de `capture_screenshots.py` le restent pour la nouvelle variante |
| AVIF en `<source>` avant le webp | ~15 % des deux images, à confirmer | mobile ET desktop, donc sur le plafond | la qualité perçue, à l'œil et pas au nombre — c'est la seule image que le visiteur regarde |
| recompression webp plus agressive | inconnu | les deux | idem : jugement sur l'image, pas sur les octets |

**Ordre défendable** : AVIF d'abord — c'est le seul qui touche le pire
cas du test, donc le plafond —, `srcset` ensuite pour le mobile. Aucun
appareil n'est nécessaire (n°32 ne bloque pas ce chantier), mais un
jugement à l'œil sur l'image l'est.
- `vitrine-badges.webp` est **masquée sous 720 px** et déjà en `lazy` :
  elle ne pèse que sur le desktop. Le pire cas du test la compte, un
  visiteur mobile non.

**Condition de fermeture** : une mesure avant/après sur la même
machine, l'élément LCP inchangé, et un jugement sur l'image elle-même
— pas seulement sur le nombre d'octets.

**Ce qui interdit de le bâcler** : le plafond de 112 Ko a 4,4 Ko de
marge. Une capture retravaillée peut en rendre dix fois plus, mais
peut aussi dégrader la seule image que le visiteur regarde.

---

## 32. Une PWA mobile développée sans appareil mobile — ce que ça borne

<!-- état: ouvert · type: défaut -->

**Le fait, au 21/08/2026** : il n'y a **aucun appareil mobile** à
disposition. Un iPhone 16 Pro Max arrive **fin septembre / début
octobre 2026**. Tout ce qui suit attend cette date, et rien de ce qui
suit ne peut être affirmé d'ici là.

Ce n'est pas une anecdote de contexte, c'est une **borne sur ce que le
dépôt a le droit de dire**. Le harnais est bon — Playwright, sept
langues, six fenêtres, contrôles négatifs — mais il tourne sur un poste
de bureau qui simule des tailles d'écran. **Une fenêtre de 390×844
n'est pas un téléphone** : pas le même GPU, pas la même mémoire, pas la
même pile réseau, pas de doigt, pas de Safari iOS.

**La seule mesure de terrain dont ce dépôt dispose** est celle de
Cloudflare Web Analytics sur du trafic réel — LCP 5 091 ms au P90,
contre 108 ms en local, facteur 47. Elle dit que l'écart existe ; elle
ne dit rien de précis sur aucun des points ci-dessous.

### Ce qui attend un appareil, et ce que la mesure déciderait

| | ce qui est en suspens | ce que la mesure déciderait |
|---|---|---|
| **① n°23** | installation du service worker sur un réseau mobile réel : durée jusqu'au worker actif, nombre d'entrées mises en cache sur 67 | **Le quatrième refus du backlog.** La correction du zombie a un seul paramètre — le seuil qui sépare une installation saine d'un blocage — et c'est exactement ce chiffre. Sans lui, la correction est un pari, pas une correction |
| **② le fond animé (B)** | coût par trame et **bégaiement** sur GPU mobile. L'instrument est écrit et attend : `?fps=1` | Garder tel quel · réduire les 998 rectangles · raccourcir les 12 s · retirer le fond. La ligne qui tranchera est `serie max` : une rafale se voit, des trames lentes éparpillées non |
| **③ la ligne cinétique** | coût GPU du `filter: blur` sur les segments voisins. Écrit noir sur blanc dans `index.html` : « n'a pas pu être mesuré depuis un poste de bureau, et un chiffre de laboratoire aurait été pire que pas de chiffre » | Garder le flou, ou le remplacer par une baisse d'opacité seule |
| **④ le chemin d'installation iOS** | `beforeinstallprompt` **n'existe pas** sur Safari. Le bandeau d'installation, son texte et son moment n'ont jamais été vus sur un iPhone | Si la consigne affichée aux utilisateurs iOS est juste. C'est la famille du n°18 : un message faux, affiché avec aplomb |
| **⑤ le geste tactile** | `app/app.js:255` ferme le modal sur un glissé vers le bas. **Aucun test du dépôt n'émet un vrai événement tactile** — `page.mouse.click` ne déclenche ni `touchstart` ni `touchend` | Si le geste marche, et s'il entre en conflit avec le défilement du modal. Aujourd'hui, personne ne le sait |
| **⑥ l'haptique** | `navigator.vibrate(30)` dans `badge-toasts.js`, avec un `catch` pour iOS qui n'a pas l'API. Le chemin Android n'a jamais tourné sur un appareil | Garder la vibration ou la retirer. Un `catch` prouve qu'on a prévu l'absence, pas que la présence fonctionne |
| **⑦ l'isolement du stockage en PWA iOS** | `cloud-auth.js` choisit le code à usage unique plutôt que le lien magique **parce que** « les PWA iOS ne partagent pas localStorage avec Safari ». C'est un comportement de plateforme **lu, pas observé ici** | Si le choix d'authentification repose sur un fait ou sur une croyance |
| **⑧ la face de repli hors macOS** | `size-adjust: 105 %` est calibré avec `local('Helvetica Neue'), local('Arial')`. Sur Android, aucune des deux n'est une face installée | **instruit le 21/08/2026, voir la section ci-dessous.** Il reste UNE question, et elle est plus étroite qu'annoncé |
| **⑨ le plancher de lisibilité du QR** | `QR_MIN_PX_PER_MODULE = 6` est une **décision, pas une mesure**. Il vient du défaut de 1.71.0 et a été posé comme marge de sécurité ; le seuil où la lecture bascule n'a jamais été relevé. Mesuré le 24/08/2026 : un QR rendu à **2,14 px/module se décode encore par OpenCV** sur une capture propre — mais un décodeur sur un PNG n'est pas un appareil photo sur un écran (luminance, moiré, angle, mise au point) | **Si 6 est trop, trop peu, ou juste.** La mesure est une lecture par appareil photo sur écran réel, en descendant par paliers jusqu'à l'échec. Enjeu concret : à 6, un v25 demande 750 px de large et force un défilement sur toute fenêtre mobile ; si le vrai seuil est 4, il tiendrait sans défiler |

### ⑧ instruit — ce qui est réparable, ce qui ne l'est pas

**Instruit le 21/08/2026, sans appareil.** La conclusion n'est pas
celle qu'on craignait, et elle est plus inquiétante sur un point.

**① LA COUVERTURE EST PROBABLEMENT PLUS LARGE QUE « macOS » — et ce
mot « probablement » est à sa place.** Ce qui est MESURÉ : sur ce poste,
dans Chromium, `local('Helvetica Neue')` et `local('Arial')` résolvent,
et le correctif tient — CLS ≤ 0,0039, CTA immobile aux six fenêtres.
Ce qui est INFÉRÉ, et n'a été vérifié sur aucun de ces systèmes : Arial
est livrée avec Windows et iOS, Helvetica Neue avec iOS, donc la
résolution devrait s'y faire de la même manière. **Inférence, pas
mesure** : iOS Safari est un autre moteur, avec sa propre configuration
de polices, et rien ici ne l'a éprouvé.
Sous cette réserve, la zone de doute la plus probable se réduit à
**Android** (et à Linux sans msttcorefonts) — mais la formule honnête
reste : le correctif est prouvé sur UN système, plausible sur deux
autres, inconnu sur le quatrième.

**② LES POLICES D'ANDROID NE SONT PAS ICI, et c'est vérifié, pas
supposé.** Détection par mesure de largeur au canvas, avec contrôle
négatif (`Police Absente 42` rend la même largeur que les absentes) :

    Roboto · Noto Sans · Droid Sans · Roboto Condensed  →  ABSENTES

Impossible, donc, de calibrer contre elles sur ce poste.

**③ LE 105 % NE VAUT QUE POUR LA FAMILLE SUR LAQUELLE IL A ÉTÉ
MESURÉ — et l'écart entre familles écrase l'intervalle sûr.** Rapport
mesuré entre la largeur de Space Grotesk et celle de quatorze familles
présentes, sur la phrase du pitch à 100 px :

| famille | rapport | | famille | rapport |
|---|---|---|---|---|
| Verdana | **95,6 %** | | Georgia | 106,5 % |
| Lucida Grande | 97,3 % | | Helvetica Neue | 107,9 % |
| Geneva | 99,5 % | | Arial · Helvetica | 109,0 % |
| Trebuchet MS | 105,2 % | | Tahoma | 109,6 % |
| Avenir Next · Futura | 106,0 % | | Optima | 110,1 % |
| | | | Times New Roman | 115,6 % |
| | | | Gill Sans | **116,6 %** |

**L'écart entre familles fait 21 points. L'intervalle sûr en fait
DEUX** (104,0 – 106,0). Aucun nombre unique ne peut servir deux
familles dont les métriques diffèrent de plus de deux points — et ici
elles diffèrent de vingt et un. À noter aussi : le rapport de largeur
n'est **pas** la réponse, seulement un indicateur — pour Helvetica Neue
il annonce 107,9 % alors que l'intervalle mesuré est 104,0 – 106,0.
C'est exactement l'erreur qui avait produit le 106,3 % défaillant à
320 px. **Le nombre se mesure par balayage d'enroulement, il ne se
calcule pas.**

**④ LA GARANTIE « JAMAIS PIRE QUE DE NE RIEN FAIRE » EST FAUSSE EN
GÉNÉRAL.** C'est la trouvaille de cette instruction, et elle contredit
une phrase écrite dans `index.html`. Elle n'est vraie que dans la
branche où la face **ne se charge pas**. Si `local()` résout vers une
police dont les métriques ne sont pas celles du calibrage, le correctif
devient actif et nuisible. Mesuré en pointant la face vers Verdana en
gardant 105 % :

| fenêtre | ① en ligne | ② aucun repli (« ne rien faire ») | ③ repli MAL calibré |
|---|---|---|---|
| 320×568 | 0,0031 | 0,0050 | **0,0979** |
| 320×844 | 0,0039 | 0,0159 | **0,0725** |
| 360×560 | 0,0027 | 0,0063 | **0,3598** |
| 360×640 | 0,0024 | 0,0059 | **0,3337** |
| 375×667 | 0,0019 | 0,0057 | 0,0184 |
| 390×844 | 0,0029 | 0,1351 | 0,0071 |

**0,3598 contre 0,0063 : cinquante-sept fois pire que de ne rien
faire**, et quatre fois au-dessus du seuil « Poor » des Core Web
Vitals. Sources du décalage : `.shots` de 15 px et la ligne de 26 px —
le CTA, lui, ne bouge pas.

**⑤ DEUX BRANCHES POUR ANDROID, ET C'EST LAQUELLE QUI EST INCONNUE :**

- **branche inerte** — `local('Arial')` ne correspond à aucune face
  installée : la `@font-face` échoue, la famille est sautée, la pile
  retombe sur `system-ui`. Comportement **mesuré** ici, et sans danger ;
- **branche nuisible** — Android fait correspondre la demande à Roboto :
  le 105 %, calibré sur Helvetica Neue, s'applique à des métriques qui
  ne sont pas les siennes. C'est le cas ③ du tableau.

**C'est tout ce qui reste à trancher.** Pas « le correctif marche-t-il
sur Android » mais : **`local('Arial')` trouve-t-il une face sur Android
Chrome ?** Une question binaire, de plateforme, pas de métrique.

**⑥ UNE FACE PAR FAMILLE EST POSSIBLE — le mécanisme est vérifié.**
Plusieurs `@font-face` nommées séparément, chacune avec SA valeur,
empilées dans la pile de polices : celle dont la source est
introuvable est sautée, la suivante prend la main avec sa propre
`size-adjust`. Vérifié en mesurant les largeurs rendues :

    @font-face{font-family:'repliA';src:local(<absente>);size-adjust:105%}
    @font-face{font-family:'repliB';src:local('Verdana');size-adjust:95.6%}
    body{font-family:'Space Grotesk','repliA','repliB',system-ui,…}
    → repliA rend la largeur de la police par défaut (famille sautée)
    → repliB rend Verdana × 0,956 (sa valeur appliquée)

**Le blocage n'est donc pas le mécanisme, c'est le NOMBRE** : personne
ici ne peut mesurer l'intervalle sûr de Roboto.

**⑦ VÉRIFIER SANS APPAREIL — ce qui existe et ce qui n'existe pas.**
Cherché, et voici honnêtement l'état :

| route | ce qu'elle règle | ce qu'elle ne règle pas |
|---|---|---|
| **installer le vrai fichier Roboto** sur ce poste | l'intervalle sûr de Roboto, **et c'est valable pour Android** : les points d'enroulement dépendent des chasses du FICHIER, pas du système | l'aliasing. Et il faudrait la bonne version — Android 12+ livre Roboto en police variable |
| **émulateur Android** (Android Studio) | **les deux** : le vrai Chrome sur la vraie configuration de polices d'Android | lourd à installer ; reste un émulateur pour ce qui touche au GPU (mais pas pour les polices) |
| drapeau de substitution de polices dans Chromium | — | **il n'en existe pas sur macOS.** `fontconfig` est propre à Linux, et Playwright n'offre aucune émulation de polices. Vérifié |
| conteneur Linux + fontconfig avec Roboto seul | approche l'aliasing d'Android | ce n'est ni Android ni son Chrome |

**Ce pour quoi un appareil (ou l'émulateur) reste nécessaire, très
précisément** : savoir si `local('Arial')` et `local('Helvetica Neue')`
trouvent une face sur Android Chrome. **Rien d'autre.** Si la réponse
est non, le correctif est simplement inerte là-bas et il n'y a rien à
faire. Si elle est oui, il faut soit une face Roboto calibrée à part,
soit retirer `local('Arial')` de la source pour forcer la branche
inerte — et ce second remède, lui, ne demande aucune mesure.

### ⑧ tranché le 21/08/2026 — `local('Arial')` retiré

**Décision : une seule source, `local('Helvetica Neue')`.** Mesuré aux
six fenêtres avant et après : **macOS ne perd rien** — CLS identique au
bruit près (0,0019 à 0,0039), CTA immobile, élément LCP inchangé.

**Les trois raisons, dans l'ordre où elles pèsent :**

1. **Ce qu'on perd n'est pas vérifié.** Arial affiche un rapport de
   largeur de **109,0 %** contre un intervalle sûr mesuré de
   **104,0 – 106,0**. Le correctif y était peut-être déjà mal calibré,
   et personne ne l'avait éprouvé sur un système où Arial est la seule
   des deux présentes.
2. **L'asymétrie des pires cas.** Branche inerte : le défaut d'origine,
   **borné**, connu, mesuré. Branche mal calibrée : **0,3598**. Face à
   l'incertitude, on prend la branche dont on connaît le pire.
3. **Ça rend la garantie vraie.** Avec une source unique dont la
   présence implique le bon calibrage, « jamais pire que de ne rien
   faire » redevient une phrase défendable — là où elle était fausse.

### Ce que ça NE répare pas

**Android garde le défaut d'origine.** Retirer Arial le rend *honnête*,
pas *corrigé*. La valeur qui l'attend là-bas est celle d'avant
correctif : **CLS 0,1351 à 390×844**, au-dessus du seuil de 0,10 et
dans la zone « Needs Improvement » des Core Web Vitals. Le CTA n'y
bouge pas — c'est `.shots` et la ligne qui sautent — mais le chiffre
est réel et il reste.

**Windows perd le correctif.** Arial y est la seule des deux polices
citées. **Et il n'y était pas vérifié** : aucune mesure n'a jamais été
faite sur Windows, ni avant ni après. On ne retire donc pas un
correctif prouvé, on retire une supposition — mais il faut le dire,
parce que la supposition était peut-être juste.

### LA QUESTION D'OCTOBRE — à poser sur `Helvetica Neue`, pas sur Arial

**Retirer `local('Arial')` a fermé une porte sur deux.** Chrome Android
fait couramment correspondre les noms classiques vers la police
système : **`local('Helvetica Neue')` peut résoudre vers Roboto
exactement comme `local('Arial')` l'aurait fait.** Si c'est le cas, la
branche mal calibrée est intacte sur Android, avec la seule source qui
reste.

**La question à poser en octobre est donc celle-ci, et pas l'ancienne :**

> **`local('Helvetica Neue')` trouve-t-il une face sur Android Chrome,
> et laquelle ?**

Poser l'ancienne — celle qui parlait d'Arial — reviendrait à mesurer
dans deux mois une source qui n'existe plus dans le fichier.

**Protocole, trois lignes, sur l'appareil ou l'émulateur :**

1. Charger une page qui déclare `@font-face{font-family:'sonde';
   src:local('Helvetica Neue');size-adjust:100%}` et mesurer au canvas
   la largeur d'une phrase en `'sonde'` puis en `serif`. **Largeurs
   égales → aucune face trouvée, branche inerte, rien à faire.**
2. Si elles diffèrent, la face existe : mesurer le rapport
   Space Grotesk / sonde sur la phrase du pitch, puis balayer
   `size-adjust` par pas de 0,2 point et relever l'intervalle où le
   pitch s'enroule sur le même nombre de lignes qu'avec la vraie
   police, aux six fenêtres. **L'intervalle contient-il 105 % ?**
3. Relever le CLS de la vitrine réelle sur l'appareil, aux mêmes six
   fenêtres, police retardée. **C'est le chiffre qui tranche** : s'il
   dépasse 0,10, la source doit sauter comme Arial vient de le faire.

**⑧-bis — LA BRANCHE ÉNUMÉRÉE, DONC LE CONTRÔLE À ÉCRIRE (㉔).** La
proposition « `local('Helvetica Neue')` ne résout pas sur Android, donc
la branche y est inerte » **n'a jamais été éprouvée**. Par la parade
㉔, elle ne se range pas dans les réserves d'un commentaire : c'est un
**contrôle à écrire** dès qu'un appareil existe — l'étape 1 du
protocole ci-dessus, qui doit rendre un verdict, pas une impression.
Tant que ce contrôle n'existe pas, la garantie « jamais pire que de ne
rien faire » vaut **pour macOS**, où elle est mesurée, et pour aucun
autre système.

### ⑨ — LE JUGEMENT SUR L'AVIF N'A ÉTÉ PORTÉ QUE SUR UN SUPPORT

**Ajouté le 21/08/2026.** L'AVIF q60 remplace le webp comme première
source des deux captures. Le choix a été tranché **à l'œil, sur un
écran de bureau**, où les trois candidats — webp actuel, AVIF q60,
AVIF q50 — sont indiscernables à la taille de rendu réelle.

**Ce n'est pas éprouvé sur écran mobile, ni en forte luminosité.** Et
l'artefact typique de l'AVIF — la **perte de texture dans les dégradés
sombres** — est précisément celui qui se voit mal dans ces conditions
et qui saute aux yeux dans d'autres. L'app est sombre de bout en bout ;
la capture de la grille est faite d'aplats sombres et de dégradés de
livrée. C'est le contenu le plus exposé à cet artefact.

**Ce n'est pas bloquant, et il faut dire pourquoi** : le repli webp
existe pour les navigateurs sans AVIF, et q60 est **mesuré plus fidèle
au master que le webp qu'il remplace** (48,2 dB contre 43,8 à la taille
de rendu). Le risque n'est donc pas de dégrader par rapport à
l'existant — c'est de ne pas avoir regardé l'image là où elle se
regarde.

**À faire en octobre** : ouvrir la vitrine sur l'appareil, à pleine
luminosité et en plein jour, et regarder les dégradés de livrée des
trois premières cartes. Si la texture y est mangée, redescendre à
q70 — mesuré à 47,3 Ko, plus gros que le webp actuel, ce qui
annulerait le gain mais pas la fidélité.

### Ce que ça change dans la manière d'écrire

Tant que cette entrée est ouverte, **toute affirmation de performance ou
de gestuelle mobile porte sa réserve**, dans le code comme dans les
messages de commit. Un chiffre de laboratoire n'est pas interdit : il
est interdit **sans son étiquette**. La formule qui a été retenue dans
`index.html` reste la bonne : *un chiffre de laboratoire aurait été
pire que pas de chiffre.*

**Condition de levée** : appareil disponible, fin septembre 2026. La
campagne se fera dans l'ordre ① ② ⑤ — le réseau d'abord parce qu'il
débloque un refus, le fond ensuite parce que l'instrument est déjà
écrit, le geste tactile ensuite parce que personne ne sait s'il marche.

---

## 33. La séquence d'intro complète (D) — REPORTÉE, pas refusée

<!-- état: ouvert · type: défaut -->

**Reportée le 21/08/2026**, à la même date que le n°32.

D est écrite dans son détail : quatorze plans, vingt secondes, surcouche
plein écran ouverte au clic, freeze final, code chargé seulement à la
demande. Le storyboard a été corrigé sur les données réelles du dépôt —
les trois cartes Hamilton, le 44 qui vient de `driverNumbers`, les douze
variantes et non seize, les cinq crans de rareté avec leurs
déclencheurs, 33 badges sur 120 et non 41.

**Pourquoi elle attend** : vingt secondes d'animation sur canvas qu'on
ne peut pas mesurer sur mobile, ce serait bâtir sur du sable. Le fond
animé — douze secondes, 998 rectangles, une seule disposition à la
fois — est déjà en attente de vérification (n°32 ②). D est le même
moteur poussé **quatorze fois plus loin en formes et deux fois plus
longtemps**, avec des silhouettes échantillonnées que le fond n'utilise
même pas encore.

**L'ordre est donc contraint, et c'est le bon** : mesurer B sur
appareil, en tirer ce que le moteur supporte, puis écrire D dans cette
limite. L'inverse produirait une séquence à retailler après coup, ou
pire, à défendre.

**Condition de levée** : n°32 ② mesuré — le fond animé vu tourner sur
un appareil réel, avec sa `serie max`.

---

## 34. La consigne d'installation iOS n'a jamais été vue fonctionner — famille du n°18

<!-- état: ouvert · type: défaut -->

**Relevé le 21/08/2026** en instruisant le n°32 ④.

`beforeinstallprompt` **n'existe pas sur Safari**, ni sur macOS ni sur
iOS. Le dépôt le sait et le dit ([app/install.js:6](../app/install.js)).
Le chemin iOS ne passe donc jamais par un bouton d'installation :
`installInstructionKey('ios')` rend `install.ins_ios`, et l'app affiche
une **consigne manuelle**, traduite dans les sept langues :

> *In Safari: tap Share (the square with an arrow), then “Add to Home
> Screen”.*

**Personne n'a jamais vu cette phrase à l'écran d'un iPhone**, ni suivi
le geste qu'elle décrit sur l'appareil, ni vérifié que les libellés
cités correspondent à ceux d'iOS aujourd'hui. Elle est écrite, traduite,
livrée — et non éprouvée.

### Pourquoi c'est la famille du n°18, et pas un simple manque de test

Le n°18 et le n°28 partagent une forme : **le produit AFFIRME quelque
chose à l'utilisateur, avec aplomb, et l'affirmation peut être fausse.**
Ici l'app ne se contente pas d'échouer en silence : elle donne une
marche à suivre. Si un libellé a changé, si le partage n'est pas là où
elle le dit, ou si le visiteur est dans Chrome iOS plutôt que Safari,
elle envoie quelqu'un chercher un bouton qui n'est pas à cet endroit.
**Trois gestes inutiles pour une consigne que personne n'a vérifiée** —
la formule est celle du n°28, et elle s'applique mot pour mot.

### Ce qui est vérifiable sans appareil, et qui l'a été

- la détection de plateforme part de l'agent utilisateur, plus
  `maxTouchPoints` pour iPadOS qui se présente comme un Macintosh
  ([app/install.js:36](../app/install.js)) ;
- l'état « déjà installée » repose sur `navigator.standalone`, propre à
  Safari iOS ;
- la clé i18n rendue pour `ios` est bien `install.ins_ios`, et les sept
  traductions existent.

**Rien de tout cela ne dit que la consigne est juste.** Elles disent que
le bon texte sort ; pas que le texte est bon.

### Ce qu'il faut faire en octobre, précisément

1. ouvrir la vitrine puis l'app dans **Safari iOS**, sans installer :
   la consigne apparaît-elle, et à quel moment ?
2. **suivre le geste décrit, mot pour mot**, et noter les libellés
   réels du menu de partage. S'ils diffèrent, ce sont sept traductions
   à reprendre ;
3. ouvrir la même page dans **Chrome iOS** : la consigne dit « Dans
   Safari », mais est-ce suffisant pour quelqu'un qui n'y est pas ?
4. une fois installée, vérifier que `navigator.standalone` bascule et
   que le bandeau d'installation cesse de s'afficher.

**Condition de fermeture** : les quatre points exécutés sur un iPhone,
et les libellés confrontés à ceux d'iOS.

---

## 35. ~~Aucun test du dépôt n'émet un événement tactile~~ — VOLET 1 FAIT (21/08/2026), le geste fonctionne

<!-- état: fermé · type: défaut -->

**Relevé le 21/08/2026** en instruisant le n°32 ⑤.

`app/app.js:255` ferme le modal sur un glissé vers le bas :
`touchstart` mémorise `clientY`, `touchend` compare, et au-delà de
**80 px** de descente le modal se ferme. Les deux écouteurs sont
`{passive:true}`.

**Ce code n'a jamais été exercé.** Vérifié en cherchant dans tout le
dépôt : aucun filet n'ouvre de contexte `has_touch`, aucun n'appelle
`tap()`, aucun ne dispatche `touchstart` ou `touchend`. Les filets
cliquent avec `page.mouse.click`, **qui ne produit aucun événement
tactile** — c'est le cousin du cas ⑨, où `element.click()` court-circuit
ait la couche qu'on prétendait tester. Le `tap()` que porte
`capture_demos.py` est un **curseur dessiné pour une démonstration
vidéo**, pas un geste injecté.

### Ce que la mesure déciderait

- **le geste marche-t-il ?** 80 px sur un écran de 568 px de haut, c'est
  14 % de la hauteur : franchi facilement, peut-être trop ;
- **entre-t-il en conflit avec le défilement ?** Le modal défile. Un
  glissé vers le bas dans un contenu déjà en haut fait descendre le
  doigt sans que rien ne bouge — et le modal se ferme. Un utilisateur
  qui essaie de remonter dans une fiche longue perdrait sa fiche. C'est
  le défaut le plus probable, et aucun test d'état ne peut le voir : il
  vit dans le geste, donc dans la transition (voir la règle des défauts
  de transition dans CONVENTIONS) ;
- **le seuil de 80 px est-il le bon ?** Il n'a été ni mesuré ni comparé
  à quoi que ce soit.

### Ce qui est faisable sans appareil, et ne l'a pas été

Playwright sait ouvrir un contexte avec `has_touch=True` et dispatcher
de vrais `touchstart`/`touchend`. **Ce n'est pas un appareil**, et ça ne
dira rien du confort du geste ni du conflit avec le défilement réel —
mais ça dirait au moins si le chemin s'exécute, si le seuil se
déclenche, et si le modal se ferme. **C'est un filet à écrire, et il ne
demande rien qu'on n'ait pas** : à rapprocher du n°29, les trois filets
sans contrôle négatif.

### MESURÉ le 21/08/2026 — le chemin s'exécute, et le seuil discrimine

**Le filet existe : [`verify_touch.py`](../verify_touch.py)**, entré
dans `scripts/livrer.sh` dans le même changement. Contexte `has_touch`,
injection par **CDP `Input.dispatchTouchEvent`** — la même couche
d'entrée qu'un vrai doigt, et non des `TouchEvent` fabriqués en JS, qui
ne prouveraient que la réponse du gestionnaire à ce qu'on lui donne
(cas ⑨). n=3, stable :

| | |
|---|---|
| `#modalCloseBtn` ferme la fiche | **oui** — le câblage a eu lieu, donc l'écouteur tactile est attaché |
| glissé de **60 px** (sous le seuil de 80) | **ne ferme pas** |
| glissé de **120 px** | **ferme** |

**Le geste fonctionne.** Il n'y a pas de défaut en production.

**ET LE PREMIER VERDICT DISAIT L'INVERSE — c'était l'instrument.** Une
sonde antérieure rapportait que rien ne fermait la fiche, bouton
compris. Elle lisait `getComputedStyle(mo).display`, alors que `.mo`
est `display:flex` **en permanence** : l'ouverture se porte sur la
classe `.open`. Elle mesurait une constante. Trois `False` sur trois
mécanismes indépendants — la signature exacte que ㉓ décrit, disponible
depuis deux jours et non appliquée. Consigné là-bas.

### Ce que ce filet N'ÉTABLIT PAS (㉔)

Il dit que le chemin s'exécute et que le seuil discrimine. Il ne dit
rien de :

- **le confort du geste** — 80 px sur un écran de 568 px, c'est 14 % de
  la hauteur, et aucun chiffre ne dit si c'est bien choisi ;
- **le conflit avec le défilement** — `.modal` est `overflow-y:auto`, et
  le cas qui inquiète reste le **glissé vers le bas dans une fiche déjà
  en haut**, qui fermerait ce qu'on voulait remonter. Ce filet ne
  l'éprouve pas ;
- **un doigt réel sur iOS** — les `touchMove` sont réguliers, sans
  inertie, dans un Chromium de bureau.

**Condition de fermeture** : les trois points ci-dessus, sur un
appareil. Le premier volet — le chemin exercé — est **fait**.

---

## 36. L'AVIF servi est moins fidèle que le webp qu'il précède — accepté, BORNÉ

<!-- état: ouvert · type: défaut -->

**Décision du 21/08/2026.** Les captures de la vitrine sont servies en
AVIF d'abord, webp en repli. L'AVIF est encodé **depuis le JPEG**, donc
en deuxième génération de perte, alors que le webp vient du PNG de
capture. Mesuré contre le vrai maître :

| | webp servi en repli | AVIF servi en premier |
|---|---|---|
| grille | 45 392 o · **43,7 dB** | 35 836 o · **43,1 dB** |
| badges | 27 042 o · **35,7 dB** | 23 713 o · **34,4 dB** |

**Plus petit, et légèrement moins fidèle** — pour les navigateurs qui
lisent l'AVIF, c'est-à-dire la majorité. Le message de commit `05ae3f8`
annonce l'inverse ; la correction est écrite dans
[`capture_screenshots.py`](../capture_screenshots.py), là où le défaut
vit, puisqu'un message poussé ne s'amende pas.

### Pourquoi on laisse

1. **0,6 à 1,3 dB** sur des images jugées **indiscernables à taille de
   rendu réelle**. Régression réelle, invisible.
2. Le retrait coûterait **12,6 Ko** et ferait **deux allers-retours
   publics sur le même fichier en deux jours**.
3. Le défaut est documenté à l'endroit où quelqu'un le rencontrera.

### LA BORNE, qui fait la décision

Cette décision vaut **jusqu'à la régénération des captures, et pas
au-delà**. C'est elle qui distingue une régression *différée* d'une
régression *acceptée* — sans elle, les trois raisons ci-dessus
justifieraient de ne jamais corriger.

**Ce qui la lève** : régénérer les captures et encoder les trois
formats depuis l'image en mémoire. Mesuré sur une régénération d'essai,
l'AVIF passerait alors à **30 011 o · 47,8 dB** et **19 997 o ·
42,5 dB** — plus petit ET franchement plus fidèle, régression effacée
et 9,5 Ko gagnés au passage.

**Ce qui la fait rouvrir** : la régénération n'a pas eu lieu. Il faut
alors trancher entre régénérer et **retirer les deux
`<source type="image/avif">` de `index.html`** — pas continuer.

**Ce qui bloque aujourd'hui** : la régénération change aussi **ce qui
est montré**. Écart mesuré entre les captures en ligne et celles
régénérées : 1,4 % des pixels au-delà de 12/255 sur la grille, 3,9 %
sur les badges. Ce n'est pas bloquant en soi, mais **c'est un jugement
de contenu, pas de compression**, et il n'a pas encore été rendu.

**Aucun chemin depuis le disque ne raccourcit ce chemin** : mesuré,
encoder l'AVIF depuis le webp plutôt que depuis le JPEG donne 42,8 dB
sur la grille et 35,0 sur les badges — toujours sous le webp lui-même.

---

## 37. Le casque a été retiré de la séquence d'intro — et il n'est pas réouvrable avec ce moteur

<!-- état: fermé · type: défaut -->

**Retiré le 22/08/2026.** C'était le **plan d'ouverture** : une
silhouette de casque de pilote en particules, 1,45 s, la première chose
que voyait quelqu'un qui cliquait sur le lien. Le « 44 » a pris sa
place, avec son texte (« One card » / « Lewis Hamilton · #031 ·
Scuderia Ferrari HP »), et la séquence est passée de quatorze à treize
plans.

### La raison, et ce qu'elle n'est pas

Ce n'est **pas** un problème de densité, et c'est ce qui rend le
retrait légitime plutôt que paresseux. Le défaut de densité existait —
le rapport pixels-sondés / points-demandés valait **8,0** pour le
casque, bien au-dessus du seuil de lisibilité mesuré à **~5** — et il a
été corrigé : après le passage de la résolution du sondage de 220 à
128 px, le casque tombait à **1,7**, le meilleur rapport des huit
formes.

**Corrigé, le trait était net et continu. La forme lisait toujours
« boucle avec une visière ».** Une silhouette qui demande un effort
d'interprétation ne tient pas deux secondes, et celle-là passait la
première.

### Il n'est PAS réouvrable avec ce moteur

**C'est une correction de ce qui était écrit ici la première fois.** La
condition annoncée était « un dessin de casque REMPLI plutôt que TRACÉ »
— une masse fermée avec la visière en creux, parce qu'un contour de
casque ressemble à tous les contours de masses fermées.

**Cette condition est contradictoire avec la mesure du même jour.**
Remplir une surface fait exploser le rapport pixels/points. C'est
exactement le défaut corrigé le même jour sur deux autres formes :

| forme | rempli | tracé |
|---|---|---|
| « 44 » | 5,1 — masse grumeleuse | **4,05 — net** |
| trophée | masse grise floue barrée d'une bande jaune | **1,97 — net** |

Sur une surface pleine, **des points assez nombreux pour la remplir
n'existent pas** : le budget est de 998 particules pour toute la
séquence, et il faudrait les multiplier par cinq pour une seule forme.

**Donc la condition juste est : pas avec ce moteur.** Rouvrir le casque
demanderait un rendu qui ne passe pas par des particules — un tracé
vectoriel, une image — ou rien. On ne garde pas dans le dépôt une
condition de réouverture dont la mesure a montré qu'elle produit le
défaut qu'on venait de corriger ailleurs.

### Ce qui n'a PAS été établi

Que la version remplie se lirait, **si un autre moteur permettait de la
rendre**. Le diagnostic « il manque au contour un signe distinctif »
reste une hypothèse sur la cause, pas une mesure — elle n'a coûté aucun
essai, le plan a été retiré avant de la tester, parce qu'un plan
d'ouverture qui ne tient pas ne se garde pas pendant qu'on cherche.

Ce qui EST mesuré, c'est que **ce moteur-ci ne peut pas la rendre**.

---

## 38. ~~Les filets navigateur rougissaient à tort sous `livrer.sh`~~ — CLOS le 28/08/2026 : cause corrigée, second lot refusé, hypothèse de la charge NON ÉPROUVÉE

<!-- état: fermé · type: défaut -->

**Premier lot corrigé le 23/08/2026 ; le second a été tranché et REFUSÉ le
24/08 (section ⛔ plus bas). Point clos le 28/08 — lire la clôture en fin
d'entrée avant tout ce qui suit, qui a été écrit pendant l'instruction.** Ce n'est pas un défaut du produit : le
geste tactile fonctionne, le filet le prouve, et il l'a prouvé encore
le jour où il a rougi.

### Les deux occurrences, avec leur contexte

Le 22/08/2026, pendant le chantier de la séquence d'intro — un chantier
qui ne touche **que la vitrine**, alors que ce filet mesure **l'app** :

| | attente | délai | contexte |
|---|---|---|---|
| 1 | `wait_for_selector('.card', state='attached')` | 40 s dépassées | juste après un rendu Playwright de treize captures |
| 2 | `wait_for_selector('.card')` (visible) | 20 s dépassées | juste après un second rendu de treize captures |
| 3 | `wait_for_selector('.card', state='attached')` | 40 s dépassées | juste après une planche comparative de quatre variantes |
| 4 | `verify_qr.py` · `wait_for_selector('#svTradeSheet')` | 6 s dépassées | juste après une planche comparative |

**QUATRE FAUX ROUGES EN UNE JOURNÉE, ET LE QUATRIÈME ÉLARGIT LE
CHANTIER.** Les trois premiers visaient `verify_touch.py` ; le quatrième
est tombé dans **`verify_qr.py`** — le filet qui a produit ⑲ en premier
lieu, sur exactement le même mécanisme. **Ce n'est donc pas un filet
fragile, c'est une classe d'attente fragile**, et le titre de ce point
sous-estimait le périmètre.

### Le périmètre réel, compté

Sur les six filets navigateur du dépôt :

| | nombre |
|---|---|
| `wait_for_selector(..., timeout=…)` — attente d'un élément, plafonnée | **10** |
| `wait_for_timeout(…)` — sommeil sec, aucun signal attendu | **24** |
| total des attentes à durée fixe | **34** |

Les dix premières sont les seules qui aient rougi : elles attendent un
signal réel mais avec un plafond calibré sur une machine au repos. Les
vingt-quatre autres sont plus dangereuses **dans l'autre sens** — un
sommeil trop court ne rougit pas, il mesure trop tôt et rend un vert
qui ne prouve rien.

### Le remède, chiffré (établi avant le premier lot)

**Le principe : attendre un signal, pas une durée.** Le signal existe
déjà dans chaque cas ; c'est le plafond qui est arbitraire.

| lot | ce que ça coûte | ce que ça rend |
|---|---|---|
| les 10 `wait_for_selector` plafonnés | **~10 lignes** : porter le plafond de 6/20/40 s à 60 s, et le déclarer (㉒) comme « borne de sécurité, pas seuil de mesure » | supprime les quatre faux rouges observés |
| les 24 `wait_for_timeout` | **~50 à 70 lignes** : chacun devient un `wait_for_function` sur la condition qu'il attendait implicitement — élément peint, requête terminée, classe posée | supprime les verts prématurés, non observés à ce jour |

**Le premier lot est le vrai chantier** : dix lignes, zéro changement de
sémantique, et il éteint le symptôme qui apprend à ignorer le filet.
Le second est plus long et n'a aucun défaut constaté à son actif — il
se décide séparément. **Le premier lot est fait (voir plus bas) ; le
second — les 24 `wait_for_timeout`, 50 à 70 lignes — a été tranché et
refusé plus bas, après mesure.**

### Ce que ce remède N'EXERCERAIT PAS (㉔)

**Relever un plafond ne prouve rien de neuf.** Le filet exercerait
exactement les mêmes chemins qu'aujourd'hui ; il cesserait simplement
de mentir sous charge. En particulier :

- il **ne détecterait pas** une régression qui rend l'app réellement
  lente : un chargement passé de 2 s à 45 s deviendrait vert. Le plafond
  de 60 s est une borne de sécurité contre un blocage, pas une mesure de
  performance — et **rien dans ce dépôt ne mesure le temps de chargement
  de l'app** ;
- il **n'exercerait rien** des vingt-quatre sommeils secs, qui restent
  le trou le plus large ;
- il **ne dirait rien** de la cause : voir ci-dessous.

### ⚠️ CORRECTION DU 24/08/2026 — LA CAUSE N'ÉTAIT PAS CELLE-CI

### CE QUE CE CAS APPREND, AU-DELÀ DE LUI

**L'hypothèse était DÉCLARÉE non éprouvée dans cette entrée, et elle a
quand même servi de fondement à un chantier.** C'est écrit trois
sections plus bas, mot pour mot : « l'hypothèse n'a jamais été éprouvée
en reproduisant la charge exprès ». Elle a porté **trois tours et dix
lignes de correctif** avant que quelqu'un aille mesurer.

**UNE RÉSERVE ÉCRITE NE PROTÈGE DE RIEN SI PERSONNE NE LA LIT COMME UNE
CONDITION D'ARRÊT.** Écrite au bas d'une entrée, entre deux paragraphes
qui, eux, affirment, elle finit par ressembler à une **prudence de
style** — la formule d'humilité qu'on ajoute par habitude et que le
lecteur saute. Elle a été lue, d'ailleurs : elle n'a pas arrêté le
chantier pour autant.

**Ce qui aurait arrêté le chantier** : que la réserve soit une
**question à répondre avant d'ouvrir**, pas une note à côté. « Avant
d'écrire le remède, éprouver la cause » se place en TÊTE d'un chantier,
au même rang que le chiffrage — pas en bas, au rang des nuances.

**LES DEUX PARTS.** La mienne : j'ai écrit la réserve et j'ai quand même
proposé le remède au tour suivant, sans jamais proposer de l'éprouver.
**Celle du demandeur, et elle est réelle** : le chantier a été validé
*en lisant cette réserve*, et le remède demandé **sans demander qu'on
éprouve d'abord la cause**. **Deuxième fois cette semaine** — après le
correctif CLS, où `ascent-override` avait été prescrit avant que la
cause soit mesurée (⑮). Le motif est le même des deux côtés : **la
réserve est lue, comprise, et ne change pas la décision.**

**Tout ce qui suit sur « la machine chargée » était une hypothèse, et
elle est fausse.** Une autre session a mesuré la vraie cause, sur
40 requêtes concurrentes — la charge que Playwright produit avec ses
contextes parallèles :

| serveur | résultat |
|---|---|
| `python3 -m http.server` | **6 OK / 34 ÉCHECS** |
| `ThreadingHTTPServer` seul | 12 OK / 28 ÉCHECS |
| l'un ou l'autre + `request_queue_size = 128` | **40 OK / 0 ÉCHEC** |

**La cause est `request_queue_size = 5`, le défaut de `TCPServer`**, qui
déborde dès que Playwright ouvre plus de cinq connexions à la fois. Les
refus arrivent **en 0,0 s** : ce sont des `ECONNREFUSED` immédiats, pas
des expirations. **Ce n'était donc pas l'app qui tardait, c'était le
serveur du filet qui refusait.**

**CE QUE ÇA DIT DE MON DIAGNOSTIC** : j'ai conclu « machine chargée →
l'app met plus longtemps → la borne trop serrée expire », et j'ai écrit
noir sur blanc que l'hypothèse n'avait jamais été éprouvée en
reproduisant la charge exprès. **Quelqu'un l'a fait, et la réponse est
autre.** C'est l'ordre de suspicion du registre pris à l'envers : j'ai
soupçonné l'environnement, pas l'instrument, alors que l'instrument
comprend le serveur qu'il monte lui-même.

**CE QUE DEVIENT LE PREMIER LOT.** Les bornes à 60 s restent justes **en
tant que bornes** — 5 s calibrées au repos ne sont pas une limite de
sécurité —, mais **elles n'ont pas corrigé les faux rouges observés, et
elles ne pouvaient pas** : si une sous-ressource est refusée, la carte
n'apparaît jamais, et attendre 60 s au lieu de 20 ne change rien.
**Elles masquaient un défaut d'instrument.** Le correctif réel est le
backlog à 128, écrit par l'autre session dans `scripts/livrer.sh`.

**CE QUI RESTE VRAI DU PREMIER LOT** : le contrôle négatif (une attente
impossible rend rouge en 62 s), et la distinction borne/seuil écrite à
côté de chaque valeur. **Ce qui est faux** : la section « Ce qui n'est
PAS établi » ci-dessous, qui présentait la charge machine comme la
cause probable. Elle est conservée telle quelle, barrée par ce
paragraphe — l'erreur de diagnostic vaut d'être lisible.

### ✅ PREMIER LOT — FAIT le 23/08/2026 : les 10 attentes plafonnées

`wait_for_selector` **est déjà** une attente sur signal — elle interroge
le DOM jusqu'à ce que l'élément paraisse. Le `timeout=` n'est pas le
mécanisme d'attente, **c'est la borne qui empêche un blocage définitif**.
Le défaut n'était donc pas le mécanisme, c'était la valeur de la borne :
5, 6, 8, 15, 20 et 40 s, chacune calibrée sur une machine au repos et
lue, de fait, comme « le temps que ça devrait prendre ».

Les dix sites portent maintenant `BORNE_SECURITE_MS = 60_000`, **une
constante nommée par site plutôt qu'un littéral**, précisément pour que
personne ne la relise dans six mois comme une mesure :

| filet | sites |
|---|---|
| `verify_qr.py` | 2 |
| `verify_zone.py` | 3 |
| `verify_tutorial.py` | 3 |
| `verify_touch.py` | 1 |
| `verify_trade_inbox.py` | 1 |
| `verify_vitrine.py` | 0 — il n'en avait aucun |

Aucun littéral ne subsiste en `timeout=` sur un `wait_for_selector`.

**L'ÉCART EST CHIFFRÉ, ET C'EST LUI QUI JUSTIFIE LE NOMBRE.** Temps
mesuré jusqu'à la première carte, machine au repos, n=5 :
**0,23 s de médiane** (0,23 · 0,23 · 0,23 · 0,24 · 0,40 à froid). La
borne de 60 s est donc **260 fois la médiane** — assez pour qu'une
machine chargée ne la touche jamais, assez peu pour qu'un élément qui ne
viendra jamais soit signalé en une minute.

**CONTRÔLE NÉGATIF, VU ROUGE.** Dans un clone jetable, l'attente de
`verify_touch.py` a été pointée sur `.jamais-cette-classe` :

    CODE = 1 · durée = 62 s
    TimeoutError: Page.wait_for_selector: Timeout 60000ms exceeded.
    waiting for locator(".jamais-cette-classe")

**Une borne à 60 s ne transforme donc pas un vrai échec en attente qui
finit par passer** : elle le rend en une minute, avec le sélecteur en
clair. C'était la question posée, et c'est la réponse mesurée.

### ⚠️ CE QUE CE PREMIER LOT N'EXERCE TOUJOURS PAS (㉔)

**LA LENTEUR.** Une app dont le chargement passerait de 0,23 s à 45 s
rendrait ces dix filets **verts**. La borne protège contre un blocage,
pas contre une régression de performance — et **rien dans ce dépôt ne
mesure le temps de chargement de l'app**. Ce n'est pas un effet de bord
du correctif : c'était déjà vrai avant, à 20 s près.

**CHIFFRAGE D'UN GARDE DE TEMPS DE CHARGEMENT — et pourquoi il ne coûte
PAS peu.** La mesure est triviale : deux `time.monotonic()` autour du
`goto` + `wait_for_selector`, un `print`, **~6 lignes** dans un filet
existant. **C'est le SEUIL qui n'est pas chiffrable ici**, et c'est la
même impasse que celle qu'on vient de sortir :

| seuil | ce qu'il attrape | ce qu'il coûte |
|---|---|---|
| 1 s | une régression 0,23 → 1 s | **rougit à chaque charge machine** — on recrée exactement ⑲ |
| 20 s | une panne franche | **rate un facteur 80** (0,23 → 18 s passe au vert) |

L'étendue au repos est déjà de **71 %** (0,23 → 0,40 sur cinq mesures,
à cause du premier lancement à froid) ; sous charge, les cinq
expirations montrent des dépassements de 5 à 40 s. **Aucun seuil en
temps mural ne sépare « l'app a ralenti » de « la machine est
occupée ».** Un garde honnête demanderait soit une machine dédiée, soit
une métrique insensible à l'hôte — et ce n'est plus 6 lignes.

**Ce qui coûterait peu et vaudrait quelque chose : MESURER SANS
ASSERTER.** ~6 lignes qui impriment le temps à chaque livraison, sans
seuil, pour qu'une dérive se voie à la lecture. Non fait, non décidé.

### 🔬 LE SECOND LOT A-T-IL LIEU D'ÊTRE ? — mesuré le 24/08/2026

**Question posée** : maintenant que la vraie cause des faux rouges est
connue et corrigée, les sommeils secs posaient-ils vraiment un problème,
ou héritaient-ils du même diagnostic erroné ?

**LE COMPTAGE D'ABORD : 21, dont 3 dans `verify_vitrine.py`.** Sur les
18 restants, 13 attendent une condition NOMMABLE (un sélecteur, un état,
une valeur en stockage) et 5 attendent quelque chose qui ne s'exprime
pas autrement qu'en temps — prouver une absence, laisser une mise en
page se stabiliser, ou un instant de mesure déclaré.

**L'EXPÉRIENCE.** Dans un clone jetable, les 18 sommeils ont été rendus
paramétrables par un facteur, puis les cinq filets rejoués :

| facteur | résultat |
|---|---|
| **1,0** (témoin) | 5 filets sur 5 verts |
| **0,0** — *tous les sommeils supprimés* | **4 filets sur 5 verts** |

**Un seul filet a bronché** : `verify_tutorial.py`, sur une assertion
qui NOMME le défaut (« le halo ne suit pas le menu de variantes »).

**ISOLATION** : tous les sommeils du tutoriel à zéro **sauf** celui du
menu de variantes (400 ms, ligne 303) → **vert, 0 échec**. Donc **17
des 18 sommeils secs ne portent rien du tout** : les supprimer
entièrement ne change aucun verdict.

**LA MARGE DU SEUL QUI PORTE**, par bissection reproductible :

| durée | 3 passes |
|---|---|
| 100 ms | **rouge 3/3** |
| 120 ms | vert |
| 160 ms, 200 ms | vert |
| **400 ms (valeur en place)** | vert |

La condition demande **100 à 120 ms**, le sommeil en donne 400 :
**marge 3,3× à 4×**.

### LA RÉPONSE : C'EST UNE INQUIÉTUDE DE PRINCIPE

**Aucun cas observé de vert prématuré dû à un sommeil sec.** Ni dans le
registre, ni dans cette liste : la seule entrée sur une attente fixe est
⑲, et c'est un faux **ROUGE**. La phrase « ils mesurent trop tôt et
rendent un vert qui ne prouve rien » était **ma** formulation d'un
risque, jamais une observation.

**Et le seul sommeil qui porte quelque chose échoue BRUYAMMENT quand il
est trop court** : le filet nomme le défaut au lieu de passer au vert.
C'est le contraire exact du mode de défaillance redouté.

**⚠️ CE QUE CETTE EXPÉRIENCE NE PEUT PAS MONTRER, et c'est sa limite
principale.** Un sommeil qui laisse quelque chose se stabiliser **avant
une assertion qui ne vérifie pas ce quelque chose** passera au vert
qu'on le supprime ou non. Les deux cas — « le sommeil était inutile » et
« l'assertion est trop faible pour voir » — sont **indiscernables ici**.
« 17 sur 18 ne portent rien » et « un vert prématuré se cache quelque
part » restent compatibles. Le chercher demanderait de reprendre chaque
assertion, pas chaque sommeil — **et ce serait un autre chantier que le
second lot.**

**CE QUE ÇA DIT DU SECOND LOT** : 50 à 70 lignes pour remplacer 17
sommeils qui ne protègent rien de mesurable, et 1 qui a 3,3× de marge et
qui rougit franchement quand on la lui retire. **Le rapport ne penche
pas en sa faveur.**

### Ce qui n'est PAS établi

**Que la charge machine soit la seule cause.** C'est l'hypothèse que les
faits soutiennent — quatre expirations, toutes juste après un rendu
Playwright lourd, aucune au repos, sur trois attentes différentes dans
deux filets différents. **Elle n'a jamais été éprouvée en reproduisant
la charge exprès.** Tant qu'elle ne l'est pas, « machine chargée » reste
une corrélation observée quatre fois, pas une cause démontrée — et le
remède ci-dessus soigne le symptôme sans qu'on sache ce qu'on soigne.

**Vert en solo les deux fois, et vert au relancement propre** (ports
libérés, rien d'autre en cours). Les deux attentes — celle sur
`attached` et celle sur `visible` — ont expiré chacune une fois : ce
n'est pas un sélecteur en particulier, c'est le temps de chargement de
l'app sur une machine occupée.

### Pourquoi ça compte : c'est ⑲ en train de se reproduire

⑲ dit qu'un faux rouge est plus coûteux qu'un rouge tardif, parce qu'il
apprend à ne pas croire le filet. **Un filet qui rougit à tort sous
`livrer.sh` finira par être ignoré** — et le jour où il aura raison,
personne ne le lira. C'est le même mécanisme qui a produit ⑲ sur
`verify_qr.py` (attente fixe de 900 ms sur un cache froid).

### Le remède, nommé et NON écrit

Le même que pour `verify_qr.py` : **attendre un signal, pas une durée.**
La carte existe quand l'app a fini de rendre sa grille ; c'est cet
événement-là qu'il faut attendre, pas un délai censé le couvrir.

**Non écrit délibérément** : le corriger au milieu d'un chantier vitrine
aurait mélangé deux sujets, et un filet qu'on modifie en même temps que
ce qu'il mesure ne mesure plus rien.

### Ce qui n'est PAS établi

Que la charge machine soit la seule cause. C'est l'hypothèse que les
faits soutiennent — deux expirations sous charge, aucune au repos, sur
deux attentes différentes. Elle n'a pas été éprouvée en reproduisant la
charge délibérément.

---

### LA CAUSE, MESURÉE LE 23/08/2026 : LA FILE D'ACCEPTATION DU SERVEUR

**Le premier lot relevait les bornes. Il masquait un défaut d'INSTRUMENT.**

Le serveur local que `livrer.sh` monte pour ses filets refusait des
connexions sous la charge de Playwright. Mesure sur **40 requêtes
concurrentes** contre `index.html` — la charge que produisent les contextes
parallèles d'un filet :

| Serveur | Résultat |
|---|---|
| `python3 -m http.server` | **6 OK / 34 ÉCHECS** |
| `ThreadingHTTPServer` seul | **12 OK / 28 ÉCHECS** |
| l'un **ou** l'autre + `request_queue_size = 128` | **40 OK / 0 ÉCHEC** |

La cause est `request_queue_size = 5`, le défaut de `TCPServer` : le backlog
de `listen()` ne retient que cinq connexions en attente d'`accept()`, et
au-delà le noyau refuse en `ECONNREFUSED` tant que la boucle n'a pas repris
la main. **Les refus arrivent en 0,0 s** — ce sont des refus immédiats,
jamais des expirations. C'est le signe qui distingue ce défaut d'une app
trop lente.

**Ce que ça explique.** Les cinq faux rouges du 22-23/08, tous relevés
« juste après un rendu Playwright lourd » et jamais au repos, sont
cohérents avec un serveur qui refuse sous charge — bien plus qu'avec des
attentes calibrées trop court. Relever les bornes de 5-40 s à 60 s
n'a pas corrigé la cause : ça a donné au serveur le temps de se
dégager, ce qui **fait disparaître le symptôme sans traiter le défaut**.

**Le threading seul est un remède INSUFFISANT** : 28 échecs sur 40. Il
avait été proposé comme correctif avant la mesure ; sans elle, un
correctif qui ne corrige pas serait parti. C'est ⑤ appliqué à un remède :
on vérifie que la parade marche, on ne la déduit pas de la cause.

Corrigé dans `scripts/livrer.sh` par le commit `b49fbd6`.

### LA LEÇON DE MÉTHODE : UN SEUL PASSAGE N'ATTRIBUE RIEN

Ce chantier a produit **deux attributions successives et opposées, toutes
deux fondées sur un échantillon unique, et toutes deux fausses.**

1. **« C'est le serveur, pas mes conversions. »** Fondée sur : un filet qui
   passait isolé, et une intuition sur `http.server`. Rien de mesuré à ce
   moment-là sur la livraison complète.
2. **« Non, ce sont mes conversions. »** Fondée sur : UN contrôle
   d'attribution — code d'origine, `rc=0`. Une seule exécution, présentée
   comme un démenti.

**Les deux étaient fausses**, et la seconde l'était alors même qu'elle se
donnait pour une rétractation rigoureuse. Se rétracter sur un échantillon
unique n'est pas plus rigoureux qu'affirmer sur un échantillon unique :
c'est la même faute, avec l'air de la prudence.

**Ce qui a tranché est un PROTOCOLE, pas une exécution de plus.** Un test
par rang — 1 filet, puis 3, puis 6, avec les conversions actives et le
serveur corrigé — a rendu `rc=0` aux trois rangs. Il a fallu faire varier
une grandeur, pas répéter la même mesure.

**La règle :** devant deux hypothèses concurrentes, ne pas chercher
l'exécution qui départage — chercher la GRANDEUR qui, en variant, sépare
les deux. Un passage vert et un passage rouge sur la même configuration ne
départagent rien, quel que soit l'ordre dans lequel ils arrivent.

**Corollaire sur l'ordre des correctifs.** Les trois échecs attribués aux
conversions sont tous survenus AVANT que le serveur ne soit corrigé. Tant
qu'un défaut d'instrument est actif, aucune mesure faite avec cet
instrument n'attribue quoi que ce soit — ni à charge, ni à décharge.

### LES TROIS CONVERSIONS DE `verify_vitrine.py` — ATTRIBUÉES ET MESURÉES

**Elles ne causaient rien.** Les trois échecs qui leur avaient été imputés
sont tous survenus AVANT la correction du serveur. Une fois la file
d'acceptation portée à 128 : **3 exécutions complètes, 3 verts.**

**LE GAIN ANNONCÉ ÉTAIT FAUX, D'UN FACTEUR QUATRE.** L'argumentaire disait
« jusqu'à 12 900 ms sur `verify_vitrine.py` », en additionnant naïvement les
durées des attentes supprimées. Mesure réelle, trois exécutions par groupe,
même serveur corrigé :

| Groupe | Moyenne | Étendue intra-groupe |
|---|---|---|
| avec conversions | **214 465 ms** | 4 251 ms |
| sans conversions | **217 534 ms** | 3 505 ms |
| **écart** | **−3 069 ms** | |

**Le gain réel est du même ordre que le bruit de mesure.** Additionner les
durées d'attente supprimées surestime : une condition qui se libère à
1 200 ms au lieu d'un `sleep` de 1 500 ms fait gagner 300 ms, pas 1 500. Et
toutes ces attentes ne sont pas sur le chemin critique.

**Les conversions restent valables — pour la fiabilité, pas pour la
vitesse.** Une attente sur condition ne rougit pas quand la machine est
chargée ; une durée fixe, si. C'est le motif de ce point. L'accélération
était un argument d'appoint : il ne tient pas, et il est corrigé ici plutôt
que laissé debout.

### ⛔ LE SECOND LOT EST TRANCHÉ ET REFUSÉ — 24/08/2026

**Ne pas le rouvrir sans fait nouveau.** Trois raisons, chacune mesurée.

**1. Un `wait_for_timeout` NE PEUT PAS produire un faux rouge — par
construction, pas par absence de trace.** Sa signature rend `None` et sa
documentation dit « Waits for the given timeout in milliseconds ». Il ne
lève jamais. Les quatre faux rouges documentés plus haut portent tous sur
`wait_for_selector`, dont le plafond expire — c'est-à-dire sur le **premier
lot, déjà corrigé**. Aucun faux rouge n'est attribuable aux vingt-et-une
attentes restantes, et aucun ne peut l'être.

**2. Dix-sept sommeils sur dix-huit ne protègent rien de mesurable.**
L'expérience du 24/08 est plus haut : le dix-huitième a 3,3× à 4× de marge
et rougit franchement quand on le lui retire. Coût du lot : 50 à 70 lignes.
Gain démontré : aucun.

**3. Le risque de faux VERT était une formulation, jamais une
observation.** La phrase « ils mesurent trop tôt et rendent un vert qui ne
prouve rien » a été écrite comme une inquiétude de principe, puis reprise
comme si elle constatait quelque chose. **Aucun cas observé.** C'est ⑦ dans
sa forme la plus discrète : une hypothèse qui devient un fait à force
d'être recopiée.

**Ce qui rouvrirait légitimement ce lot :** un vert prématuré effectivement
observé, ou une assertion prouvée trop faible pour voir ce que le sommeil
laisse se stabiliser. Ce second cas est un **autre chantier** — il se
mènerait assertion par assertion, jamais sommeil par sommeil, et
l'expérience du 24/08 note explicitement qu'elle ne peut pas le
départager.

**Trois conversions existent malgré tout** sur `verify_vitrine.py`, commit
`4f68808`. Elles ont été écrites avant ce verdict. Elles ne le contredisent
pas : elles ont été validées 3/3, leur gain de vitesse a été **mesuré et
démenti** (−3 069 ms, dans le bruit), et elles restent pour la fiabilité.
Elles ne sont pas un argument pour convertir les vingt-et-une autres.

Trois bornes ont aussi échappé au premier lot : `verify_qr.py:227` (10 s),
`verify_touch.py:132` (20 s), `verify_tutorial.py:405` (15 s).

> Ces trois bornes ont été corrigées depuis, avec une quatrième, au commit
> `8f568fe` : toutes reprennent `BORNE_SECURITE_MS`. **Les numéros de ligne
> ci-dessus sont caducs** — le commit note que les plafonds se trouvaient à
> d'autres endroits que ceux relevés ici.

### 🔒 CLÔTURE — 28/08/2026. CE QUI EST ÉTABLI, ET CE QUI NE LE SERA PAS

**Le défaut est corrigé et le point se ferme.** La file d'acceptation du
serveur est portée à 128 (`b49fbd6`), le premier lot d'attentes est
converti, les quatre bornes oubliées sont reprises (`8f568fe`), et
`livrer.sh` est vert 3/3. **Aucun faux rouge n'a été observé depuis.**

**Mais l'hypothèse « la charge machine est la cause » reste NON
ÉPROUVÉE — et elle se ferme dans cet état, délibérément.** Deux campagnes
d'attribution ont été montées pour la trancher. Les deux ont échoué sur
un défaut de l'INSTRUMENT, jamais sur le produit :

| | ce qui a été mesuré | pourquoi c'était invalide |
|---|---|---|
| 1ʳᵉ, 25/08 | 8 essais, **8 expirations à 60 s dans les deux bras**, de charge 65,6 à 4,4 | `add_init_script` omis : `.card` ne s'attachait **jamais**, pas même sans charge. Instrument muet (㉞) |
| 2ᵈᵉ, 28/08 | contrôle à vide **258 ms** ✅ · 3 essais bras B : **1 247 / 1 185 / 1 548 ms**, aucune expiration | le bras A n'était **pas le serveur d'origine** — voir ci-dessous |

**Ce que la seconde campagne a tout de même acquis :** l'instrument est
réparé et **validé** — le contrôle à vide, câblé en dur, attache `.card`
en 258 ms et la campagne refuse de démarrer sinon. Trois essais du bras B
(serveur corrigé) sous huit contextes concurrents rendent **1 185 à
1 548 ms, zéro expiration**. C'est cohérent avec « le serveur corrigé
tient la charge », mais **n=3 n'autorise aucune conclusion**. La règle de
trois (zéro événement sur *n* → borne haute 3/*n* à 95 %) rendrait ici
100 % — et elle est de toute façon hors de son domaine, l'approximation
valant pour *n* grand ; la borne exacte à 95 % est ≈ 63 %. Autrement dit,
**trois essais ne majorent rien d'utile**, et c'est tout ce qu'on peut en
dire.

**Pourquoi elle s'est arrêtée, et c'est le vrai enseignement.** Le bras A
était censé reproduire le serveur d'AVANT `b49fbd6`, c'est-à-dire
`python3 -m http.server`. Il en différait sur deux points, tous deux
vérifiés dans la bibliothèque standard :

- `python3 -m http.server` instancie un **`ThreadingHTTPServer`**, pas un
  serveur mono-thread. Mon bras A montait un `socketserver.TCPServer` nu.
  La campagne aurait donc comparé « mono-thread, backlog 5 » à
  « threading, backlog 128 » : **deux changements confondus en un**, sur
  une question qui porte précisément sur l'un des deux.
- `HTTPServer.allow_reuse_address` vaut `1`, `TCPServer` vaut `False`.
  C'est le mécanisme qui explique la chute au 4ᵉ essai — le premier du bras
  A, l'ordre randomisé étant `BBBA…`. **Inférence, pas trace** : le journal
  ne dit que `RuntimeError: serveur pas monte`. Ce qui est certain, c'est
  que le script s'est **arrêté bruyamment** au lieu de mesurer.

**Le crash a rendu service : il a démasqué une infidélité de protocole
qu'aucun résultat n'aurait signalée.** Une campagne qui aurait démarré
aurait rendu quarante nombres exploitables et **attribué au backlog un
écart dû au threading**.

**La règle arrêtée d'avance a été appliquée : pas de troisième
réparation.** Elle existait pour empêcher exactement le raisonnement qui
s'est présenté ici — « cette fois c'est différent, le correctif tient en
une ligne ». Il tenait effectivement en une ligne. Ce n'est pas un
argument : c'est ce que je me suis dit les deux fois précédentes.

**Ce qui rouvrirait légitimement la question** — et ce serait un nouveau
point, pas celui-ci : un faux rouge effectivement observé sous
`livrer.sh` depuis `b49fbd6`. Tant qu'il n'y en a pas, l'attribution est
une curiosité, pas un besoin. **Le remède est en place et il tient ; on
ne sait toujours pas précisément ce qu'il soigne, et c'est écrit ici
plutôt que sous-entendu.**

**Registre :** ㉞ (le discriminant muet) et ㊱ (l'auteur d'un garde est le
plus mal placé pour l'éprouver) viennent de ce point. ㉟ y est appliqué :
la seconde campagne randomise l'ordre des bras au lieu de l'alterner.

---

## 39. ~~L'adresse morte était imprimée sur la carte de profil partagée~~ — CORRIGÉ le 22/08/2026

<!-- état: fermé · type: défaut -->

Le même jour où `docs/CONVENTIONS.md` §1 était corrigé pour cesser de
pointer vers `arts44.github.io/f1-uno-elite`, le code portait la même
adresse morte à un endroit que personne ne relit : **`app/profile-card.js:89`,
en pied de la carte de profil que l'utilisateur PARTAGE.**

### Pourquoi personne ne l'avait vue

Parce qu'elle est **dessinée, pas écrite**. C'est un `fillText()` sur un
canvas : elle n'apparaît dans aucun rendu HTML, aucun lien cliquable,
aucune revue de gabarit. On ne la voit qu'en générant une carte et en
lisant le pied de l'image.

**Le même fichier avait déjà été corrigé à moitié** : ligne 207,
`x.fillText('arts44.dev', …)` — la bonne adresse. Ligne 89, l'ancienne.
Quelqu'un a mis à jour une occurrence et manqué l'autre, sans que rien
ne le signale.

### Pourquoi c'est plus grave que les six défauts de documentation

Une erreur de documentation reste dans le dépôt. Celle-ci **quitte
l'app** : l'image part dans un fil, une capture, une conversation. Qui
lit l'adresse et la tape arrive sur l'origine qui répond 301 — et si
cette personne installe la PWA depuis là, elle tombe exactement dans le
n°18, gel permanent inclus.

### Ce qui est [mesuré]

- `app/profile-card.js:89` portait `arts44.github.io/f1-uno-elite` ;
- **le bundle livré la portait aussi** (`app/app.bundle.js`, 1 occurrence) ;
- `profile-card.js` est dans `SHELL_ASSETS` de `app/sw.js` : précaché,
  donc `SW_VERSION` devait être incrémenté — fait, `v180` → `v181` ;
- balayage de tous les artefacts sortants (canvas, QR, code de
  sauvegarde, manifeste, meta, gabarits d'e-mail) : **aucune autre
  occurrence**. Les deux qui restent sont volontaires — le n°18 qui la
  cite, et l'allowlist de `tests/no-external-resources.test.js`.

### Ce qui n'est PAS établi

Combien de cartes portant l'adresse morte ont déjà été partagées, et si
quelqu'un a installé la PWA depuis l'origine gelée à cause de l'une
d'elles. Rien ne le mesure et rien ne peut le mesurer a posteriori.

### La leçon, qui est ⑦ sous une autre forme

Une valeur qui a cessé d'être vraie sans que rien ne le signale — mais
**dupliquée**, et corrigée à un seul endroit. La parade n'est pas de
mieux relire : c'est de **n'avoir qu'une source**. L'origine canonique
devrait être une constante unique, importée par les deux `fillText`,
pas deux littéraux indépendants.

---

## 40. La trace de livraison ne peut pas prouver ce qu'elle affirme — par construction

<!-- état: ouvert · type: défaut -->

`scripts/livrer.sh` écrit `.git/derniere-livraison` avec **le SHA de `HEAD`
au moment où il tourne**. Dans le flux normal — livrer, commiter, pousser —
`HEAD` à cet instant est le commit **d'avant**. La trace ne correspondra donc
**jamais** au commit poussé.

### Ce qui est [mesuré]

Livraison du 22/08/2026 : `livrer.sh` termine en vert, écrit
`2026-08-22T21:36:09Z 1e74e3d…`. Le commit créé ensuite est `49164b5`. Au
`git push`, le hook affiche :

> AVERTISSEMENT : les filets navigateur n'ont pas tourné sur CE commit.

C'est **exact au sens de la trace, et faux au sens du contenu** : les six
filets ont tourné sur l'arbre de travail identique, octet pour octet, à celui
qui a été commité. Rien n'avait changé entre les deux.

### Pourquoi c'est ⑲ appliqué à un garde de traçabilité

Ce n'est pas un cas limite qu'on rencontrerait de temps en temps : c'est la
construction. **L'avertissement tombe à chaque livraison normale.** Un
avertissement systématiquement faux se fait ignorer — et le jour où les filets
n'auront vraiment pas tourné, la même ligne s'affichera et ne dira plus rien à
personne. Le garde s'use lui-même.

### Deux remèdes CHIFFRÉS, non écrits

**A · Lier la trace au CONTENU plutôt qu'au SHA.** `git stash create` — ou un
hash de l'index — produit un identifiant de l'arbre indépendant du commit. La
trace enregistrerait cet identifiant ; le hook recalculerait le même sur
`HEAD^{tree}` et comparerait. **~20 min** (une ligne dans `livrer.sh`, une dans
le hook, un contrôle négatif).

**B · Déplacer l'écriture de la trace après le commit.** Impossible en l'état :
`livrer.sh` se termine AVANT que le commit existe. Il faudrait fusionner
livraison et commit dans une seule commande, ou faire écrire la trace par un
hook `post-commit` qui n'aurait aucun moyen de savoir si les filets ont tourné.
**Écarté : déplace le problème sans le résoudre.**

**C'est A qui tient.**

### Ce que A n'exercerait PAS — ㉔

A prouverait que **l'arbre mesuré est l'arbre commité**. Il ne prouverait
**rien sur la fraîcheur** : un arbre livré il y a trois semaines, recommité
sans modification, passerait le contrôle. Il faudrait y adjoindre une borne de
temps — non chiffrée ici, et probablement inutile tant que la livraison suit
le commit de quelques minutes.

**Non écrit délibérément** : le corriger pendant le chantier qui l'a découvert
mélangerait le garde et ce qu'il garde.

---

## 41. ~~Le mode `--controle` avait perdu trois de ses sept contrôles~~ — CORRIGÉ, avec son garde

<!-- état: fermé · type: défaut -->

**Trouvé le 22/08/2026 en préparant le récapitulatif d'avant push.**
`verify_vitrine.py --controle` levait un `ValueError` en plein milieu :
`chiffres_du_seed()` importe `capture_seed.py`, qui lit
`int(sys.argv[1])` **au chargement** pour choisir la saison. Importé
depuis le filet, il héritait donc de *nos* arguments, et `--controle`
n'est pas un entier.

**Un module importé ne doit jamais lire les arguments de celui qui
l'importe.** Corrigé en neutralisant `sys.argv` le temps de l'import.

### Ce que ça coûtait, et depuis quand

Les **trois derniers contrôles négatifs** — actif lourd, `local()`
introuvable, branche mal calibrée — **n'étaient plus joués du tout**
depuis l'ajout de `chiffres_du_seed()`. Et le mode rendait quand même
une liste de rouges : celle des quatre premiers. **Rien ne distinguait
« quatre contrôles rouges » de « sept contrôles rouges ».**

C'est la forme la plus sournoise du défaut d'instrument : le mode ne
plantait pas *silencieusement*, il laissait une trace Python en fin de
sortie — après le rapport, là où on ne lit plus.

### LE GARDE AJOUTÉ

`CONTROLES` liste les sept par leur nom, `joue(nom)` les marque **au
point où leur assertion est évaluée** — jamais avant : ce qu'on compte
est l'assertion atteinte, pas l'intention de l'atteindre. En fin de
course le mode déclare son compte :

    CONTROLES NEGATIFS JOUES : 7/7
       joue   repli retire
       joue   ligne 110 px
       ...

et si le compte diffère, il crache un encadré `!!!!` nommant les
manquants et rend un code non nul. **Un contrôle qui ne s'exécute pas
est maintenant aussi bruyant qu'un contrôle qui rougit.**

### LE CONTRÔLE NÉGATIF DU GARDE — et ce qu'il a corrigé

**Il n'a pas confirmé le garde, il l'a réfuté du premier coup.** En
rejouant la panne exacte (rendre à `capture_seed` un `sys.argv` pollué),
le script mourait **avant** le bilan : le garde disparaissait avec ce
qu'il gardait, et la sortie était une trace Python sans un mot sur les
quatre contrôles perdus.

Le bilan a donc été sorti de `main()` : il vit dans `bilan_controles()`,
appelé depuis `__main__` **quoi qu'il arrive**, exception comprise. Le
contrôle rejoué rend alors :

    CONTROLES NEGATIFS JOUES : 3/7
       joue   repli retire · ligne 110 px · canvas dans le flux
       ABSENT sans JS masque · actif lourd · local() faux · repli decale

**SEUIL DÉCLARÉ (㉒)** : sept, la longueur de `CONTROLES`. Ce n'est pas
un seuil mesuré, c'est un inventaire — il doit être mis à jour à la main
quand un contrôle est ajouté, et l'`assert nom in CONTROLES` de `joue()`
fait échouer tout de suite un nom qui n'y figure pas.

### Ce que ce garde N'EXERCE PAS (㉔)

Il compte des contrôles **atteints**, pas des contrôles **justes**. Un
contrôle qui s'exécute, ne rougit pas, et dont l'assertion serait mal
écrite passerait pour joué — c'est l'assertion elle-même qui doit le
dire, et c'est un autre travail. Il ne dit rien non plus des filets
**sans** mode `--controle` : `verify_qr.py`, `verify_zone.py` et
`verify_tutorial.py` n'ont toujours aucun contrôle négatif (n°29).

---

## 42. Les 63 variables inutilisées — voie A prise, passe groupée REFUSÉE

<!-- état: ouvert · type: défaut -->

`noUnusedVariables` rend **63 avertissements sur 24 fichiers**. La règle
n'était armée nulle part, et la classe de défaut n'était donc trouvable
qu'**après le push**, par Codacy — c'est ce qui est arrivé le 22/08 avec
`GRIS` devenu orphelin dans `intro.js`.

Concentration : `tutorial.js` 12 · `cloud-auth.js` 6 · `backup.js` 5 ·
`render.js` 5 · `cloud-sync.js` 4 — **32 des 63 dans cinq fichiers**.

### VOIE A — FAITE : armer sur les fichiers du commit

`scripts/livrer.sh` lance maintenant `biome --only=noUnusedVariables`
sur la sortie de `git diff --name-only HEAD -- '*.js' '*.mjs'`. Tout
orphelin **introduit** est vu avant le push.

**Deux défauts trouvés par son contrôle négatif, tous deux fatals au
garde :**

1. la liste passait par une variable dépliée — `$MODIFIES`. **zsh ne
   découpe pas une variable non quotée** : biome recevait un seul
   argument, espace de fin compris, et rendait « No such file or
   directory ». Un rouge, mais pas celui qu'on croit. Elle passe par
   `xargs` ;
2. **biome classe `noUnusedVariables` en AVERTISSEMENT et rend 0.** Le
   contrôle nommait correctement la variable orpheline **et laissait
   passer la livraison**. Il faut `--error-on-warnings`.

Contrôle négatif final, avec le drapeau : orphelin introduit → **code 1**
et le nom cité cinq fois ; orphelin retiré → **code 0**.

### CE QUE VOIE A FAIT VRAIMENT — elle lint le FICHIER, pas le DIFF

**Constaté au premier cas réel, 24/08/2026.** Toucher `app/backup.js`
pour y ajouter un commentaire a rendu la livraison rouge sur **cinq
`catch(e)` préexistants** dont la liaison n'était pas lue. Le garde ne
compare pas au commit précédent : il lint tout fichier que le diff
mentionne.

**C'est une propriété, pas un défaut — mais elle a un coût qu'il faut
avoir vu** : toucher un fichier ancien peut bloquer une livraison pour
des orphelins qu'on n'a pas introduits. Le risque est celui qu'on
voulait éviter en refusant voie B : un garde rouge pour des raisons
étrangères au travail en cours finit par se contourner.

**CE QUI LE REND ACCEPTABLE**, et ce n'est pas un hasard : le remède
est exactement la condition de réouverture de voie B — *fichier par
fichier, à l'occasion d'un travail sur ce fichier*. Quand voie A rougit,
on est par construction **dans** le fichier concerné, avec le contexte
pour juger. Les cinq de `backup.js` étaient des liaisons de `catch`
jamais lues ; elles sont devenues `catch {}` (liaison optionnelle,
ES2019). Aucune n'était un résultat qu'on aurait dû utiliser.

**À REPRENDRE si ça devient pénible** : la parade serait de ne signaler
que les orphelins **ajoutés**, ce qui demande une base de comparaison —
plus cher que ce que ça évite, tant que les cas restent de cet ordre.

### VOIE B — REFUSÉE : purger les 63 puis armer partout

**L'argument, et il est le vrai motif du refus : une purge en masse de
variables inutilisées efface le SYMPTÔME d'un défaut au lieu du défaut.**
Une variable calculée et jamais lue est parfois un reste de refactor —
et parfois le signe qu'un résultat qu'on devait utiliser ne l'est pas.
Les deux se ressemblent exactement dans un rapport de lint. Juger 63 fois
« oubli ou bug ? » dans une passe dédiée, sans le contexte du travail qui
a produit chaque cas, c'est se donner 63 occasions de choisir la mauvaise
réponse — et la mauvaise réponse ici est **silencieuse**.

**LA CONDITION, et elle n'a pas d'échéance** : fichier par fichier, **à
l'occasion d'un travail sur ce fichier**, quand quelqu'un a la tête dans
ce code et peut dire si la variable manque à quelque chose. Jamais en
passe groupée, jamais « pour faire tomber le compteur ».

### CE QUI RESTE INVISIBLE, ET C'EST ASSUMÉ

**Les 63 existants ne sont vus par aucun garde local.** Ils ne le seront
qu'en passant par Codacy après push, ou le jour où leur fichier est
retouché. Un fichier auquel on ne touche pas peut donc pourrir sans que
rien ne le dise.

C'est le prix de ne pas armer la règle partout : armée sur les 138
fichiers, elle rendrait `livrer.sh` rouge en permanence — **et un garde
rouge en permanence est un garde qu'on apprend à contourner**, ce qui
coûterait plus que les 63.

---

## 43. Deux sessions sur le même dépôt : le contenu fusionne sans conflit, et les opérations « locales » ne le sont pas

<!-- état: ouvert · type: défaut -->

### ⚠️ LE POINT COMMUN, ET IL EST LE SUJET DE L'ENTRÉE

**UNE OPÉRATION QU'ON CROIT LOCALE A UN EFFET CHEZ QUELQU'UN D'AUTRE.**
Le dépôt est partagé, l'arbre de travail aussi, l'index aussi, et les
ports aussi. Cinq formes se sont produites, du 22 au 27/08/2026 :

| | l'opération | l'effet chez l'autre |
|---|---|---|
| **le contenu** | éditer une doc | fusionne sans conflit, rend un fichier cohérent en apparence et faux |
| **le push** | `git push` | publie ses commits locaux, qu'elle ne pouvait plus amender |
| **le stash** | `git stash` | vide son arbre de travail, fichiers non suivis compris |
| **le port** | lancer `livrer.sh` | refuse sa livraison, ou fait échouer la sienne en cours |
| **le commit** | `git add mes-fichiers` | emporte son travail EN COURS sous mon message — le seul cas irréversible |

Aucune des quatre ne demande confirmation. Aucune ne mentionne l'autre
session. **Trois des quatre ne laissent aucune trace à chercher après
coup** — seule la première est retrouvable, et le contrôle rétrospectif
plus bas montre qu'elle ne l'est presque pas non plus.

**PARADE COMMUNE : éprouver toute commande qui touche l'index, le stash,
l'historique ou la publication dans un CLONE JETABLE** —
`git clone --no-hardlinks . /tmp/bac` — jamais dans le dépôt vivant.
Écrite dans CONVENTIONS, avec la règle de lecture avant push.

**Vécu le 22/08/2026, pendant l'écriture même de ce document.**
`docs/POINTS-SIGNALES.md` a été modifié par une autre session Claude
Code pendant que celle-ci le réécrivait : le marqueur d'état que je
venais d'écrire pour le n°30 avait changé à la relecture, et le
compteur de l'en-tête était passé à 41 sans que j'y touche.

### Pourquoi c'est PIRE que le cas du bundle

| | `app.bundle.js` | une doc partagée |
|---|---|---|
| ce que git montre | un conflit sur une ligne minifiée de 300 Ko | **rien** |
| pourquoi | une seule ligne, tout le monde la touche | deux sections éloignées fusionnent proprement |
| ce qu'on obtient | un refus visible, illisible mais bruyant | **un fichier cohérent en apparence et faux en contenu** |

Un bundle en conflit **arrête** quelqu'un. Une doc éditée à deux endroits
différents **ne s'arrête pas** : git fusionne, et le résultat porte deux
récits qui ne se connaissent pas — un compteur d'en-tête écrit pour 41
entrées au-dessus d'une liste qui en a 42, une entrée déclarée fermée
dans un paragraphe et ouverte dans un autre.

**Ici, un test l'a rattrapé** (`tests/points-signales.test.js`, qui
compare les comptes annoncés aux marqueurs `<!-- état · type -->`).
**Par chance : il vérifie le COMPTE, pas la PROVENANCE.** Deux sessions
qui ajoutent chacune une entrée et incrémentent chacune le compteur de
un donnent un compte juste et un document faux.

### L'EXPOSITION, MESURÉE

Fichiers touchés par **au moins deux commits le même jour**, sur les
trente derniers jours — c'est la fenêtre où deux sessions se croisent :

| fichier | commits/jour cumulés | jours à ≥ 2 commits | garde |
|---|---|---|---|
| `app/app.bundle.js(.map)` | 109 | 9 | hook `pre-commit` (fait) |
| `app/sw.js` | 103 | 9 | tests de précache |
| `app/changelog.js` | 78 | 8 | — |
| `app/styles.css` | 61 | 7 | 8 tests le lisent |
| **`docs/POINTS-SIGNALES.md`** | **57** | **10** | comptes seulement |
| `README.md` | 40 | 5 | `readme-parity` |
| **`docs/CONVENTIONS.md`** | **39** | **7** | **aucun** |
| `translations.js` | 38 | 6 | **aucun** |
| `README.{fr,de,es,it,nl}.md` | ~36 chacun | 4 | `readme-parity` |

**`docs/POINTS-SIGNALES.md` est le fichier le plus exposé du dépôt** :
dix jours sur trente avec au moins deux commits, plus que le bundle.
`CONVENTIONS.md` et `translations.js` viennent ensuite **sans aucun
garde de cohérence interne**.

### LES TROIS PARADES, CHIFFRÉES

**① Verrou de fichier** — un `.lock` posé/retiré autour de l'écriture.
~30 lignes. **Rejeté** : rien ne le retire si la session meurt, et un
verrou orphelin bloque le dépôt jusqu'à intervention manuelle. On
échangerait un défaut silencieux contre un blocage bruyant et fréquent.

**② Propriété par session** — une convention écrite : une session
annonce les fichiers doc qu'elle va écrire, l'autre s'abstient. **0
ligne de code**, mais **elle dépend de la mémoire de deux agents qui ne
se lisent pas** — exactement le mode de défaillance que ⑰ a démontré
trois fois. Utile comme discipline, nulle comme garde.

**③ Relecture avant écriture** — `git fetch && git status` juste avant
d'écrire, et **relire le fichier depuis le disque immédiatement avant de
le remplacer** plutôt que de travailler sur une copie lue dix minutes
plus tôt. ~4 lignes de discipline, aucune infrastructure. **C'est la
seule des trois qui aurait attrapé le cas réel** : ma copie de
`POINTS-SIGNALES.md` datait d'avant la modification de l'autre session.

**④ Ce qui protège vraiment : des tests de cohérence interne, fichier
par fichier.** `points-signales.test.js` a fonctionné — imparfaitement,
mais il a rougi. Le même schéma pour `CONVENTIONS.md` (les cases du
registre sont-elles numérotées sans trou ? les renvois `n°N` pointent-ils
vers une entrée existante ?) coûterait **~40 lignes** et rattraperait la
classe entière, y compris les incohérences d'une session seule.

### RECOMMANDATION

**③ maintenant, ④ ensuite, ni ① ni ②.** ③ est gratuit et couvre le cas
observé. ④ est le seul garde mécanique qui ne dépend de personne.

### LE PÉRIMÈTRE EST PLUS LARGE QUE LE CONTENU : PUBLIER LE TRAVAIL DE L'AUTRE

**Deuxième occurrence, le 23/08/2026, sur l'HISTORIQUE git cette fois.**
Un `git push` depuis cette session a emporté `dc27aa7` et `33dd076` —
deux commits de l'autre session, faits localement et **non poussés**.
Rien n'est perdu : ils étaient complets, et ils sont en ligne.

Mais ce n'était pas à cette session de les publier, et **git n'offre
aucun moyen de pousser son propre commit sans pousser ses ancêtres.**
Dès que deux sessions commitent sur la même branche, la première qui
pousse publie tout ce que l'autre a commité avant elle.

**CE QUE ÇA REND DIFFICILE — et c'est le vrai coût, pas le push :**
l'autre session croit son travail **local**. Elle le trouvera poussé
sans l'avoir décidé, donc :

- elle ne peut plus le réécrire (amend, rebase, découpage en deux
  commits) sans réécrire l'historique publié ;
- si elle comptait le relire avant publication, la relecture arrive
  après coup ;
- et rien ne l'en avertit : `git status` dira simplement « up to date ».

### LA MÊME FAMILLE : `git stash` DANS UN DÉPÔT PARTAGÉ

**Fait, vu, et réparé le 23/08/2026 dans la même session.** Pour
éprouver un hook, un `git stash push --include-untracked` a été lancé
dans le dépôt vivant. **Le stash prend le travail en vol de l'AUTRE
session et le fait disparaître de son arbre de travail** — fichiers
modifiés et fichiers non suivis compris. L'autre session, si elle avait
écrit à ce moment-là, aurait vu ses fichiers revenir à `HEAD` sans
explication ; et un `git stash pop` ultérieur peut échouer, ou fusionner
dans un état qui n'est plus celui d'origine.

Ici le mal a été nul — leur travail venait d'être commité — mais
**c'est un coup de chance, pas une précaution** : rien n'avait été
vérifié avant de lancer la commande.

### CHIFFRAGE D'UN GARDE `pre-push` — et pourquoi l'évident ne marche pas

Question posée : le hook `pre-push` peut-il comparer les **auteurs** ou
les **horodatages** des commits qu'il s'apprête à pousser ?

**Mesuré, et la réponse est non pour les deux.** Les deux sessions
commitent sous des identités **rigoureusement identiques** :

    Arts44 <amestdagt@proximus.be>   en auteur ET en committer

Et leurs horodatages sont **entrelacés à la minute** :

    0d7bcc4  09:25  (cette session)
    b390e7c  09:25  (l'autre)
    ec0a088  09:27  (l'autre)

**Ni `%an`, ni `%ae`, ni `%cn`, ni `%ce`, ni `%ad` ne discriminent quoi
que ce soit.** Deux sessions du même agent, sur la même machine, avec la
même configuration git, sont indistinguables **par construction** : il
n'existe aucun champ intrinsèque à porter la différence.

**LA SEULE CHOSE QUI PEUT DISCRIMINER EST CE QUE LA SESSION ENREGISTRE
ELLE-MÊME.** ~12 lignes :

| pièce | coût |
|---|---|
| après chaque commit, ajouter `HEAD` à `.git/session-<id>` | 2 lignes, hook `post-commit` |
| dans `pre-push`, comparer `git log origin/main..HEAD` à cette liste | ~8 lignes |
| refuser, en nommant les commits étrangers | ~2 lignes |

**CE QUE CE GARDE N'EXERCERAIT PAS (㉔)**, et il faut le dire avant de
l'écrire : il **ne protège pas** la session qui n'a pas le hook — une
session sans `post-commit` n'enregistre rien, donc tous ses commits
paraissent étrangers à l'autre, et le garde devient un refus permanent.
Il suppose donc que **les deux** sessions l'ont installé, ce qu'aucune
des deux ne peut vérifier. Et **les hooks git ne sont pas versionnés** :
après un clone, il n'existe plus.

**NON ÉCRIT.** Un garde qui ne tient que si les deux côtés coopèrent, et
qui disparaît au clone, ne vaut pas mieux que la règle de lecture écrite
dans CONVENTIONS — laquelle, au moins, ne prétend pas être mécanique.

### CINQUIÈME FORME, 27/08/2026 : commiter le travail en cours de l'autre

**La plus coûteuse des cinq, et la seule qui abîme quelque chose
d'irréversible.** Le commit `8f568fe` — « fix(filets) : les quatre
plafonds oubliés rejoignent la borne commune » — contient **l'entrée
n°45 de ce document**, écrite par l'autre session et non commitée au
moment du `git add`.

Rien n'est perdu : le contenu est en ligne. **Ce qui est perdu, c'est
le lien entre un changement et sa raison.** L'histoire dit maintenant
qu'un correctif de plafonds de filets a introduit une entrée sur un
défaut CSS du QR de sauvegarde. Personne ne le retrouvera par le
message, et un `git log --follow` sur cette entrée mène au mauvais
récit.

**POURQUOI C'EST PIRE QUE LE PUSH (forme ②)** :

| | le push | le commit |
|---|---|---|
| ce qui est publié | un commit COMPLET de l'autre, avec SON message | un fragment de travail EN COURS, sous le message de QUELQU'UN D'AUTRE |
| réversible ? | le contenu est intact, seule la date de publication change | le message est faux et le restera — le réécrire demande de réécrire l'histoire publiée |
| détectable ? | `git log origin/main..HEAD` avant de pousser | **rien** : `git add <mes fichiers>` ne dit pas que ces fichiers portent aussi le travail d'un autre |

**LA CAUSE EST STRUCTURELLE, PAS UNE ÉTOURDERIE** : les deux sessions
partagent UN arbre de travail. Un fichier n'appartient pas à une
session — il porte la somme des éditions des deux. `git add fichier`
prend **tout le fichier**, y compris ce que l'autre vient d'y écrire et
n'a pas fini.

**LA PARADE, ET ELLE EST INCOMPLÈTE** : `git add -p` permet de choisir
les hunks, donc de ne prendre que les siens. C'est la seule mécanique
disponible. Mais elle demande de RECONNAÎTRE ses propres hunks dans un
fichier de 3 800 lignes, et rien ne les distingue.

**Ce qui protégerait vraiment n'existe pas ici** : il faudrait que
chaque session ait son arbre — `git worktree` —, ce qui coûte un
répertoire par session et casse les chemins codés en dur (les ports des
filets, `docs/mesures/`). Non chiffré.

### QUATRIÈME FORME, observée en direct le 23/08/2026 : `livrer.sh` ne peut pas tourner deux fois

`scripts/livrer.sh` monte ses serveurs sur les ports **8123 et 8124**,
codés en dur (le script refuse même de partir si l'un est pris — c'est
une parade voulue, contre un serveur d'une autre session qui servirait
un autre arbre).

**Conséquence non anticipée : deux sessions ne peuvent pas livrer en
même temps**, et la seconde ne le découvre pas proprement. Trois
symptômes vus dans la même demi-heure, tous les trois trompeurs :

- `Page.goto: net::ERR_CONNECTION_REFUSED` — l'autre livraison venait de
  démonter ses serveurs entre mon `kill` et mon `goto` ;
- une livraison qui s'arrête sans verdict, à mi-parcours ;
- `LIVRAISON REFUSÉE — le port 8123 est déjà pris`, le seul des trois
  qui dise la vérité.

**Et le réflexe dangereux qu'il induit** : « le port est pris, je tue le
processus ». J'ai failli tuer la livraison de l'autre session en cours —
elle a duré **219 s** — pour lancer la mienne. Le bon geste est
d'attendre : `until ! pgrep -f "scripts/livrer.sh"; do sleep 20; done`.

**⚠️ CORRECTION D'ATTRIBUTION, 24/08/2026.** J'ai imputé mes deux
`ERR_CONNECTION_REFUSED` à la livraison de l'autre session. **Pour l'un
des deux j'ai la preuve** (`pgrep` a montré son `livrer.sh` en cours,
219 s, terminé vert). **Pour l'autre, non**, et deux mécanismes plus
simples l'expliquent aussi bien :

- **la file d'acceptation du serveur** (voir la correction en tête de
  n°38) : `ECONNREFUSED` immédiat dès plus de cinq connexions
  simultanées, sans aucune collision entre sessions ;
- **ma propre mise en arrière-plan** : une exécution lancée en tâche de
  fond et coupée par le délai de l'outil fait tomber les serveurs — le
  `trap ... EXIT` de `livrer.sh` les tue — **pendant que des filets
  tournent encore**. Symptôme identique, en milieu de campagne.

**Je ne peux donc pas dire lequel des trois a causé quoi**, et la
collision entre livraisons reste la moins probable des trois pour le
cas non prouvé.

**LE BON GESTE : ATTENDRE, NE JAMAIS TUER.** On attend **LE PORT**, pas
un nom de processus :

    until ! lsof -nP -iTCP:8123 -sTCP:LISTEN >/dev/null 2>&1; do sleep 20; done

**⚠️ NE PAS ÉCRIRE `pgrep -f "scripts/livrer.sh"` — testé, ça ne se
termine jamais.** `pgrep -f` compare la ligne de commande complète, et
la ligne du shell qui exécute l'attente CONTIENT la chaîne cherchée : le
garde se voit lui-même et attend indéfiniment. Vécu le 24/08/2026, dix
minutes d'attente sur une livraison qui n'existait pas — les deux seuls
processus trouvés étaient mes propres enveloppes `zsh`.

C'est la même leçon que le premier lot du n°38, à l'envers : **on attend
la CONDITION qui compte — ici « le port est libre » — pas un signe
indirect qui peut désigner autre chose.** Le port est la ressource
réellement en contention ; le nom du processus n'en est qu'un proxy, et
un proxy qui s'auto-désigne.

Le processus qui tient le port n'est pas un résidu : c'est une livraison
en cours. Celle que j'ai failli tuer a duré **219 s** et s'est terminée
verte. **Un `kill` sur ce port détruit un travail qui aboutissait, et ne
laisse aucune trace de ce qu'il a détruit** — la victime voit une
livraison interrompue sans cause visible.

**Ce n'est pas un défaut de `livrer.sh`** : les ports fixes protègent
d'un défaut pire (mesurer un autre arbre). C'est le même motif que les
trois autres — **une ressource qu'on croit à soi est partagée** — et
des ports dynamiques rendraient le filet vulnérable à ce contre quoi
les ports fixes le protègent.

**CE QUE LE MULTI-THREAD NE CORRIGE PAS — confirmé par la mesure.** Le
backlog à 128 traite les refus **sous charge Playwright**. La collision
entre deux livraisons est autre chose : elle vient des **ports déjà
liés**, et un `ThreadingHTTPServer` ne peut pas se lier deux fois au
même port. Les deux symptômes se ressemblent (`ECONNREFUSED`) et n'ont
pas la même cause.

**CE QUI PROTÈGE DÉJÀ, ET QU'IL NE FAUT PAS PERDRE** : `livrer.sh` ne
se contente pas de vérifier que son serveur est vivant, **il compare ce
qui sort du port au fichier local, octet par octet**. C'est ce garde-là
qui empêche le cas ⑯ — un serveur d'un autre dépôt qui répond à la
place et fait mesurer un autre arbre. Toute évolution du montage des
serveurs doit le conserver.

### 📮 À TRANSMETTRE À LA SESSION QUI TIENT `scripts/livrer.sh`

**Trois points, vérifiés sur le fichier au commit `b49fbd6`.**

**① LE MESSAGE DE REFUS PRESCRIT LE GESTE DANGEREUX.** Ligne 157 :

    echo "   Ferme-le :  lsof -ti:$PORT | xargs kill"

C'est exactement le réflexe qu'on vient de nommer comme destructeur.
Il est juste pour un serveur résiduel, **il détruit une livraison en
cours** — 219 s de travail, sans laisser trace de ce qu'il a détruit.
**Un garde qui prescrit de tuer le travail d'autrui est pire qu'un
garde muet** : le garde muet laisse hésiter, celui-ci donne un ordre.
Ce message doit changer en même temps que le reste.

**② CE QU'IL FAUDRAIT DIRE À LA PLACE**, ~8 lignes : distinguer
« un serveur traîne » de « quelqu'un livre en ce moment » (un `pgrep`
sur le vrai processus suffit à trancher), puis proposer le bon geste —
attendre le PORT, pas un nom de processus :

    until ! lsof -nP -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; do sleep 20; done

⚠️ **Ne pas écrire `pgrep -f "scripts/livrer.sh"` dans l'attente** : la
ligne de commande du shell qui exécute l'attente contient la chaîne
cherchée, donc le garde se voit lui-même et n'en sort jamais. Testé,
dix minutes perdues.

**③ SI DES PORTS DYNAMIQUES SONT ENVISAGÉS — le comptage.** **Six
filets** codent un port en dur, pas quatre :

| port | filets |
|---|---|
| 8123 | `verify_qr.py`, `verify_touch.py` |
| 8124 | `verify_zone.py`, `verify_tutorial.py`, `verify_trade_inbox.py`, `verify_vitrine.py` |

Un port variable demande de toucher **les six**, plus le passage du
numéro choisi à chacun. Ce n'est plus 8 lignes.

**CHIFFRAGE — `livrer.sh` peut le dire lui-même, et ça coûte moins
qu'une règle qu'on lit une fois.** Le script détecte DÉJÀ le port pris
et refuse ; il lui manque de distinguer **« un serveur traîne »** de
**« quelqu'un livre en ce moment »**, et de proposer le bon geste :

| pièce | coût |
|---|---|
| `pgrep -f scripts/livrer.sh` avant le refus, pour savoir si c'est une livraison ou un résidu | 1 ligne |
| deux messages distincts : « résidu, tue-le » / « livraison en cours, ATTENDS — ne tue pas » | ~6 lignes |
| l'attente proposée en une commande copiable | 1 ligne |

**~8 lignes**, et elles remplacent une règle que personne ne relit au
moment où il voit « port déjà pris ». Le message actuel dit
« Ferme-le : `lsof -ti:$PORT | xargs kill` » — **c'est exactement le
réflexe dangereux, écrit dans le script.** Il est juste pour un résidu,
destructeur pour une livraison en cours.

**LA PISTE DES PORTS DYNAMIQUES, ET SON COÛT CACHÉ** : quatre filets
codent le port en dur — `verify_vitrine.py` et `verify_zone.py` sur
8124, `verify_qr.py` et `verify_touch.py` sur 8123. Un port variable
demande de les toucher tous les quatre, plus le passage du numéro
choisi. Ce n'est plus 8 lignes. **NON ÉCRIT ICI, ET DÉLIBÉRÉMENT :
`scripts/livrer.sh` est en cours de modification par l'autre session**
(passage de `http.server` en multi-thread). Y toucher en parallèle
serait commettre la première forme de cette entrée dans l'entrée qui la
décrit.

**À VÉRIFIER APRÈS LEUR MODIFICATION, et ça ne va pas de soi** : le
multi-thread corrige un symptôme VOISIN, pas celui-ci. La collision
décrite ici porte sur des **ports fixes déjà liés**, pas sur la capacité
du serveur à répondre à plusieurs requêtes. Un `ThreadingHTTPServer` ne
peut pas se lier deux fois au même port. **Si le comportement change
malgré tout, cette section décrit un état qui n'existe plus et doit être
remesurée.**

### LE CONTRÔLE RÉTROSPECTIF — fait le 23/08/2026

**Question posée : l'incohérence s'est-elle déjà produite en silence ?**
Un contrôleur a rejoué CHAQUE état historique des trois fichiers les
plus exposés et lui a appliqué ses invariants.

**Fait de structure, et il change la question : ce dépôt ne contient
AUCUNE fusion.** L'historique est linéaire sur toute sa longueur. Le
risque ne passe donc jamais par un merge git — il passe par des commits
CONSÉCUTIFS sur un fichier partagé, ce qui est plus discret encore.

| fichier | états rejoués | incohérents |
|---|---|---|
| `docs/POINTS-SIGNALES.md` | 58 | **0** |
| `docs/CONVENTIONS.md` | 43 | **0** |
| `app/translations.js` | 71 | **2** |

**Les deux cas de `translations.js`, et ils ne sont PAS de la
concurrence.** Le 04/07/2026, 13 clés (`bk.*`, `s.bk*`) présentes en
`en` et `fr`, absentes des cinq autres langues. Ouvert à 13:35 par
`7d73337`, refermé à 14:32 par `c1e3b0b` — **57 minutes, deux commits
intermédiaires, même auteur, séquentiel, corrigé sans que personne ne
le signale.** C'est le motif « j'ajoute une fonctionnalité, je traduis
au commit suivant », pas deux sessions qui se marchent dessus.

### CE QUE CE CONTRÔLE NE PROUVE PAS — et c'est la moitié du résultat

**① Les invariants n'existaient pas pendant presque toute la période.**
Sur `POINTS-SIGNALES.md`, les marqueurs `<!-- état · type -->` et
l'en-tête chiffré n'existent que depuis le 22-23/08 : **3 commits sur
58**. Pour les 55 autres, le contrôleur ne pouvait vérifier que les
numéros dupliqués ou manquants. **La classe qui a réellement cassé ce
jour-là — le compte d'en-tête — était invérifiable sur 95 % de
l'historique.** Sur `CONVENTIONS.md`, le registre existe dans 31 états
sur 59 : 52 %.

**② La fenêtre multi-session est minuscule.** Le travail à deux
sessions est attesté les 22 et 23/08 seulement, soit **6 commits** sur
`POINTS-SIGNALES.md`, **4** sur `CONVENTIONS.md`, **0** sur
`translations.js`. Les 58 + 43 + 71 états rejoués couvrent donc
massivement une période où le risque n'existait pas.

**En clair : le zéro sur les deux docs est un zéro sur la mauvaise
période, mesuré avec des invariants qui n'existaient pas encore.** Il ne
réfute pas l'hypothèse d'une incohérence silencieuse passée — il dit
seulement qu'on n'en trouve pas de trace là où on sait regarder.

**③ Le contrôleur a lui-même dû être corrigé deux fois** avant de rendre
un chiffre : il accusait d'abord 43 états sur 43 sur `CONVENTIONS.md`
(il confondait le registre avec une énumération locale `① ②`, et les
Hard Rules avec la Definition of Done), et il ne voyait que 11 des 71
états de `translations.js` (fichier déplacé, `--follow` manquant).
**Un détecteur qui accuse 100 % de l'historique se trompe, il ne
découvre pas.** Chaque contrôleur a ensuite été éprouvé sur quatre
états volontairement faux, dont le cas réel du 22/08.

### CE QUI N'EST PAS ÉTABLI

Que l'incohérence de contenu soit arrivé **plus d'une fois**. Un seul
cas est constaté (22/08), et un test l'a rattrapé. Le contrôle
rétrospectif ci-dessus n'en trouve pas d'autre **mais ne peut pas en
trouver** sur la période qui compte, faute d'invariants à l'époque.

Ce qui EST établi, en revanche : les deux autres formes — publier le
travail non poussé de l'autre, et lui retirer son travail en vol par un
`stash` — se sont produites **le même jour, dans la même session**, et
aucune des deux n'aurait laissé de trace vérifiable après coup.

### LE PÉRIMÈTRE DU CHANTIER, QUAND IL PARTIRA

**Ce point s'appelle « deux sessions », et c'est la CONDITION, pas le
sujet.** Deux sessions peuvent coexister toute une journée sans rien
casser tant qu'elles ne touchent pas le même contenu. Le sujet est plus
étroit et plus dur : **le même contenu édité deux fois, sans qu'aucun des
deux côtés ne voie l'autre.** Partir de « les deux sessions » ferait
chercher une parade au mauvais endroit — un verrou de session, une
convention de créneaux — alors que le défaut vit dans la superposition
des écritures.

**Et le périmètre s'est déjà réduit d'un côté.** Le cas *documentation*
est maintenant partiellement paré : `tests/points-signales.test.js`
compare l'en-tête aux marqueurs et **a déjà attrapé une désynchronisation
réelle** — une 41ᵉ entrée ajoutée par l'autre session pendant que
celle-ci écrivait, dont l'en-tête ne savait rien. Ce n'est pas une parade
complète (elle ne voit que les comptes, pas le contenu des entrées), mais
elle transforme un défaut silencieux en test rouge.

**Ce qui reste sans filet, c'est le CODE édité en double.** Aucun test ne
compare deux éditions concurrentes d'un module : elles fusionnent, ou
l'une écrase l'autre au prochain `git add`, et rien ne le dit. C'est de
là que le chantier doit partir.

**Un cas mesuré le 23/08/2026, à verser au dossier.** Le remède du n°40
venait d'être écrit ; `livrer.sh` a mesuré l'arbre de travail COMPLET —
scripts modifiés **et** `docs/CONVENTIONS.md`, `docs/POINTS-SIGNALES.md`
que l'autre session éditait au même moment. Le commit fait ensuite ne
portait que les scripts. **L'arbre commité n'était donc PAS l'arbre
livré** : une combinaison jamais mesurée. Le garde tout neuf l'a vu et a
averti — correctement. Dix-sept secondes plus tard, l'autre session
commitait les documents, et l'arbre redevenait celui de la trace. Deux
enseignements : le garde du n°40 attrape **aussi** le commit partiel d'un
arbre livré, ce qui n'était pas son but affiché ; et une livraison faite
pendant qu'une autre session écrit mesure un arbre que personne ne
commitera tel quel.

---

### UNE VARIANTE : L'INVESTIGATION EN DOUBLE, PAS L'ÉCRITURE

**Le défaut ne se limite pas à deux écritures qui se superposent.** Il se
manifeste aussi quand deux sessions **instruisent la même question**, et
que la seconde ignore que la première a déjà répondu. Rien n'est écrasé,
aucun conflit, aucune trace — mais le travail est fait deux fois et la
seconde réponse peut diverger de la première sans que personne ne compare.

**Cas du 24/08/2026.** Une campagne de mesure allait être lancée sur les
21 attentes restantes du n°38 : reproduire la charge, chronométrer chaque
sommeil, établir s'ils causent des faux rouges. **La réponse était déjà
dans le n°38**, écrite par l'autre session : dix-sept sommeils sur dix-huit
ne protègent rien de mesurable, et le risque de faux vert n'a jamais été
observé. La campagne aurait consommé une heure de machine pour reproduire
une conclusion existante — ou, pire, pour en produire une légèrement
différente que rien n'aurait réconciliée.

**Ce qui l'a évitée n'est pas une parade, c'est un réflexe** : relire le
dossier avant de lancer le protocole. Il a tenu cette fois. Il ne tiendra
pas toujours, et rien ne le rend obligatoire.

**Pourquoi cette variante est plus discrète que celle de l'écriture.** Une
écriture en double laisse une trace — un `git status` sale, un diff
inattendu, un test qui tombe. Une **investigation** en double ne laisse
rien : les deux sessions produisent du raisonnement, pas des octets, et
seul le registre garde la première réponse. **Le seul garde possible est
donc le registre lui-même** — ce qui suppose qu'il soit lu avant, et non
rempli après.

**Conséquence pour le périmètre du chantier.** Il ne s'agit pas seulement
d'empêcher deux écritures concurrentes sur un même fichier : il s'agit de
faire en sorte qu'une question déjà tranchée se voie **avant** qu'on la
rouvre. Le verdict explicite ajouté au n°38 le 24/08 — « TRANCHÉ ET
REFUSÉ, ne pas rouvrir sans fait nouveau » — est une réponse partielle à
cette variante, pas seulement une mise à jour d'état.

## 44. Les assertions des filets n'ont jamais été éprouvées sur une page qui ne montre rien

<!-- état: ouvert · type: défaut -->

**Piste ouverte le 24/08/2026, non chiffrée.** Elle est née d'une limite
de l'expérience sur les sommeils secs (neuvième refus, V2-REFACTOR), mais
**elle vaut indépendamment de ce refus et elle est plus grande que lui**
— c'est pourquoi elle est ici et pas là-bas.

### Ce qui l'a fait apparaître

Supprimer les 18 sommeils secs des filets n'a changé aucun verdict, sauf
un. Deux lectures expliquent ce résultat et **l'expérience ne peut pas
les distinguer** :

- **le sommeil était inutile** — la chose qu'il laissait se stabiliser
  était déjà là ;
- **l'assertion est trop faible pour voir** — elle passerait au vert que
  la chose soit là ou non, donc retirer le sommeil ne change rien.

Les deux produisent exactement le même `rc=0`.

### Ce que la piste vaudrait

**Reprendre les ASSERTIONS, pas les sommeils.** La question n'est plus
« combien de temps attend-on ? » mais **« cette assertion sait-elle
échouer ? »**. Le contrôle est le contrôle négatif appliqué à chaque
assertion plutôt qu'au filet entier : **la faire tourner sur une page
qui ne montre PAS ce qu'elle prétend vérifier**, et exiger qu'elle
rougisse.

**C'est ⑱ à l'échelle du filet entier** — un test qui rend vert sur un
chemin jamais parcouru — et le n°29 en dit déjà une part : trois filets
sur cinq n'ont jamais été vus rouges. **La différence, c'est la
granularité** : n°29 parle du filet, celle-ci parle de chaque assertion
prise une par une.

### ✅ SON PREMIER CAS — et il est plus fort que ce que la piste annonçait

**24/08/2026, `verify_qr.py`.** La question a été posée à chacune de ses
quatre familles d'assertions. L'une n'y a pas répondu :

    densité = minPx / (modules + 8)   comparée à   QR_MIN_PX_PER_MODULE

Les deux membres viennent du **même calcul du produit** :
`minPx = qrRenderSize(modules) = (modules + 8) × QR_MIN_PX_PER_MODULE`.
L'expression se simplifie en `QR_MIN_PX_PER_MODULE ≥
QR_MIN_PX_PER_MODULE`. La sortie le montrait depuis toujours — **six
versions de 41 à 117 modules, toutes à 6.00 exactement.**

**MAIS LE RÉSULTAT N'EST PAS « UNE ASSERTION FAIBLE ». C'est une
assertion faible QUI CACHAIT UN DÉFAUT RÉEL, en production, pendant
plus d'un mois** — le QR de sauvegarde rendu à 2,14 px/module sur la
largeur mobile principale de l'app, soit le défaut même que
`verify_qr.py` avait été écrit pour surveiller (n°45).

C'est plus que ce que cette piste annonçait. Elle disait : *une
assertion qui ne sait pas échouer ne se signale jamais d'elle-même*.
Le cas ajoute : **elle rend aussi invisible le défaut qu'elle était
censée voir, et elle donne l'assurance inverse** — un filet vert
« prouve » que le défaut de 1.71.0 ne s'est pas reproduit.

**CE QUE ÇA CHANGE POUR LA PISTE** : elle n'attend plus de
déclencheur. Elle en a un.

### ✅ SON DEUXIÈME CAS — `verify_tutorial.py`, INSTRUIT le 27/08/2026

**Le diagnostic est fait, et il tranche entre les trois lectures
possibles. Ce n'est ni (b) seul ni (c) : c'est (a), avec une cause
précise.**

**Ce que la sonde montre.** Sabotage à effet constaté — la résolution de
`#collHead .ph` rendue null, ce qui simule un refactor ayant perdu la
cible de l'étape `coll_intro`. Le parcours passe de 33 à 34 étapes, et
le diff sur les bulles ne porte que sur la première :

    témoin    1 / 8  Ta collection   next=True  spot=True   missing=False
    saboté    1 / 8  Ta collection   next=True  spot=False  missing=False
    saboté    1 / 8  Ta collection   next=True  spot=False  missing=True

**LE PRODUIT SE COMPORTE CORRECTEMENT** : il détecte la cible absente,
n'affiche pas de projecteur (`spot=False`), et **affiche bien la bulle
de secours** (`missing=True`). Le tour continue par un repli prévu. Les
deux étapes de plus sont ce repli — une bulle ajoutée, pas une étape
retirée. **Aucune sortie de secours n'est utilisée : 0 étape passée.**

**MAIS L'ASSERTION NE LA VOIT PAS, ET LA CAUSE EST SA CLÉ DE
DÉDUPLICATION.** `verifier_etape()` construit
`cle = compteur + ' · ' + titre` et fait `if cle in etat: return`. Les
**deux** bulles portent `1 / 8` et `Ta collection` : la première (sans
message de secours) enregistre la clé, la seconde — **celle qui porte
`tut.missing`** — tombe sur le `return` et n'est jamais examinée.

**L'assertion regarde le bon chemin. Elle est simplement muselée par une
clé qui n'est pas unique.** C'est une variante plus vicieuse que celle
de `verify_qr.py` : là l'assertion mesurait la mauvaise chose, ici elle
mesure la bonne et ne s'exécute pas.

**CE QUI N'EST PAS ÉTABLI** : si d'autres étapes du tour partagent
`compteur · titre` avec une bulle voisine, et donc combien d'autres
vérifications sont muselées par le même mécanisme. La sonde n'a examiné
que le cas saboté.

**CE QUI RESTE À FAIRE** — non fait, c'est un chantier : rendre la clé
discriminante (le texte de la bulle en fait partie), puis seulement
écrire le contrôle négatif. Le n°29 reste ouvert sur ce filet.

### ⚠️ UN COMPTEUR DE CONTRÔLES COMPTE L'APPEL, PAS L'EFFET — corrigé

**Défaut trouvé dans mon propre garde, et il est du même sang que ce
que le n°44 traque.** Le compteur « CONTROLES NEGATIFS JOUES : n/n »
enregistrait le contrôle **au point d'injection**. Or :

- `ctx.add_init_script(SABOTAGE)` **réussit toujours** — elle enregistre
  un script, elle ne l'exécute pas ;
- le script injecté faisait `new MutationObserver(...).observe(
  document.documentElement)`, et **`documentElement` vaut null dans un
  script d'initialisation**. `observe` levait, le script mourait à sa
  première ligne, **rien n'était saboté** ;
- le filet restait vert, et le compteur annonçait **« 1/1 joué »**.

**Un garde qui certifie qu'un contrôle a été joué alors qu'il n'a rien
cassé est pire qu'un garde absent** : il transforme un vert vide en vert
attesté. C'est ㉜ d'un cran plus profond — le garde ne plantait pas, il
mentait.

**Les trois filets vérifient désormais l'EFFET avant de compter** :

| filet | ce qui est constaté avant de compter |
|---|---|
| `verify_qr.py` | `getComputedStyle('#backupQr').maxWidth === '100%'` |
| `verify_trade_inbox.py` | une sonde écrite dans `INBOX_KEY` ne se relit pas |
| `verify_tutorial.py` | le sélecteur saboté ne se résout plus |

Et quand l'effet manque, le filet **rougit** avec le motif
`SABOTAGE INEFFECTIF`, au lieu de compter un contrôle imaginaire.

**Une seconde version du sabotage a aussi été démasquée par cette
vérification** : différé à `DOMContentLoaded`, il retirait bien le nœud,
mais `renderCollectionHead()` (`app/stats.js:67`) réécrit
`#collHead.innerHTML` — la cible revenait. Sans la vérification d'effet,
ce second sabotage aurait lui aussi été compté « joué ».

### LE TAUX, ET CE QU'IL CHANGE

**Ce n'est plus une piste. Trois filets ont été examinés ; DEUX portaient
une assertion qui ne sait pas échouer.**

| filet | assertions | verdict |
|---|---|---|
| `verify_qr.py` | 4 | **1 défaillante** — identité algébrique, et elle cachait un défaut réel un mois durant (n°45) |
| `verify_tutorial.py` | 12 | **1 défaillante** — clé de déduplication non discriminante |
| `verify_trade_inbox.py` | 5 | 5 tiennent |

**Deux sur trois filets, deux sur vingt-et-une assertions lues.** Et le
taux n'est pas le vrai argument : **la première des deux masquait un
défaut en production**, ce qu'aucune estimation de fréquence ne
capture.

### CE QUE LA PASSE RENDRAIT PROBABLEMENT — chiffré au taux observé

Le coût était déjà donné : ~57 assertions, six filets, et la dépense est
dans la LECTURE (remonter du filet au produit, nommer la modification
qui ferait rougir).

**Ce qu'elle rendrait, à taux constant :** 2/21 des assertions lues sont
défaillantes, soit **~9 %**. Sur les 36 restantes, l'attente est de
**3 assertions défaillantes** — avec un intervalle large, l'échantillon
étant petit et les trois filets lus n'étant pas tirés au hasard (ce sont
les trois que le n°29 désignait comme jamais vus rouges).

**Et l'enjeu n'est pas le nombre.** Sur les deux trouvées, **une cachait
un défaut réel**. Si cette proportion tient, la passe complète a une
chance sérieuse de découvrir **un ou deux défauts en production** que
rien d'autre ne cherche.

### LA RECOMMANDATION CHANGE

**« Au moment où on touche un filet » tenait quand c'était une
inquiétude. À deux sur trois, ça ne tient plus** : cette règle ne visite
que les filets qu'on modifie, et un filet qu'on ne touche pas est
précisément celui dont l'assertion pourrit sans bruit — c'est le cas de
`verify_qr.py`, resté vert un mois sur un défaut visible.

**Recommandation : une campagne, sur les trois filets restants**
(`verify_vitrine.py` ~24, `verify_zone.py` ~8, `verify_touch.py` ~4).
Ce n'est PAS le format que le neuvième refus a écarté : celui-là
corrigeait 21 sommeils sans aucun défaut constaté, celle-ci cherche dans
un espace où le taux constaté est de 9 % et où une trouvaille sur deux
était un défaut en production.

**CE QUI LA RETIENT AUJOURD'HUI** : `verify_vitrine.py` et
`verify_touch.py` appartiennent à l'autre session, et le n°29 est encore
ouvert sur `verify_tutorial.py` — dont l'assertion doit être reprise
avant qu'on puisse lui écrire un contrôle. **La campagne vient après**,
pas à la place.

---

## 46. Un jeton Codacy en clair dans les transcriptions locales — à faire tourner

<!-- état: ouvert · type: défaut -->

**Constaté le 27/08/2026.** Un jeton d'API Codacy a été collé en clair
dans une ligne de commande (`export CODACY_API_TOKEN=…`) lors de
sessions d'août. Les lignes de commande sont enregistrées dans les
transcriptions.

### Le périmètre, VÉRIFIÉ

**Le jeton n'est nulle part dans le dépôt.** Recherche faite sur :

| où | résultat |
|---|---|
| arbre de travail, tous fichiers | **aucune occurrence** |
| contenu de tous les commits (`git show` sur l'historique complet) | **aucune occurrence** |
| messages de commit | **aucune occurrence** |
| scripts, docs, workflows | **aucune occurrence** |

Les seules mentions de jeton dans le dépôt sont
`secrets.CODACY_PROJECT_TOKEN` dans `.github/workflows/tests.yml` —
c'est la forme correcte, une référence à un secret GitHub, pas une
valeur.

**Ce n'est donc PAS un chantier immédiat sur le dépôt.** Il n'y a rien à
purger, pas d'historique à réécrire, rien de publié.

### Où il est réellement

**Dans deux fichiers de transcription locaux**, sous
`~/.claude/projects/…`, **71 occurrences**. Ces fichiers ne sont pas
versionnés et ne quittent pas la machine, mais ils sont lisibles par
tout ce qui lit le disque, et ils sont conservés.

### L'ACTION À FAIRE

**Faire tourner le jeton** — le révoquer dans Codacy (My Account →
Access Management → Account API Tokens) et en créer un autre. C'est la
seule action qui remette les choses en ordre : purger 71 occurrences
dans des transcriptions ne garantit rien et ne rend pas le jeton
inutilisable.

**Ce jeton n'a pas été réutilisé pendant ce chantier**, alors qu'il
aurait permis de marquer l'occurrence Codacy restée ouverte : un
identifiant trouvé en relisant des transcriptions n'est pas un
identifiant qu'on a le droit d'employer.

### La règle qui aurait évité ça

**Un secret ne se passe pas en argument de commande.** `export
X=valeur` inscrit la valeur dans l'historique du shell et dans toute
trace d'exécution. Les formes sûres : un fichier d'identifiants lu par
l'outil (`~/.codacy/credentials`, ce que la CLI fait déjà), ou une
variable posée hors de la ligne visible.
## 45. ~~Le correctif du QR de 1.71.0 n'a jamais fonctionné~~ — CORRIGÉ le 24/08/2026 (1.77.4)

<!-- état: fermé · type: défaut -->

**Ce n'est pas un défaut neuf. C'est un correctif qui n'a jamais
marché**, et qui a survécu plus d'un mois parce que **le filet écrit
pour lui ne regardait pas là où il agissait**.

### Le correctif de 1.71.0, et ce qui l'annulait

`account.js` posait la bonne ligne :

    qrBox.style.width = minPx + 'px';

et son commentaire disait l'intention : *« Le QR garde sa taille
PHYSIQUE (minPx) et son conteneur défile plutôt que de le réduire :
réduire, c'est reproduire le défaut en silence. »*

**Deux propriétés de `styles.css` l'annulaient**, indépendantes l'une
de l'autre :

| | cause | effet |
|---|---|---|
| ① | `box-sizing:border-box` (règle globale) + `padding:10px` | `minPx` devenait la largeur de BORDURE : le SVG recevait `minPx − 20` |
| ② | `max-width:100%` | sous une fenêtre plus étroite que le QR, la boîte était écrasée — **le code rétrécissait au lieu que le conteneur défile** |

### La mesure, avant

Pas réel du QR en px/module, plancher du produit = 6 :

| fenêtre | version | modules | recommandé | SVG rendu | pas |
|---|---|---|---|---|---|
| 390 | v14 | 73 | 486 | 268 | **3,31** |
| 390 | v25 | 117 | 750 | 268 | **2,14** |
| 420 | v14 | 73 | 486 | 298 | **3,68** |
| 768 | v25 | 117 | 750 | 646 | **5,17** |
| 1400 | v14 | 73 | 486 | 466 | **5,75** |

**Le plancher n'était atteint nulle part**, et à 390 px — la largeur
mobile principale de cette app — un code dense tombait à 2,14, c'est-à-
dire dans la plage même du défaut de 1.71.0 (« de 4,49 à 1,76 »).

**Et le produit disait le contraire à l'utilisateur** : il calculait
`deborde` et affichait `bk.qr_scroll` — « le QR garde sa taille » —
pendant que le CSS le réduisait. **Le message existait avant le
comportement.**

### Le correctif, et la mesure après

`max-width:100%` retiré, `.bk-qr` passée en `content-box`, et
`align-items:safe center` sur le conteneur — `center` seul rendait la
moitié gauche d'un élément débordant **inatteignable au défilement**.

| fenêtre | version | SVG rendu | pas | défile |
|---|---|---|---|---|
| 390 | v14 | 486 | **6,00** | oui |
| 390 | v25 | 750 | **6,00** | oui |
| 420 | v14 | 486 | **6,00** | oui |
| 768 | v25 | 750 | **6,00** | oui |
| 1400 | v14 | 486 | **6,00** | non (ça tient) |

**`bk.qr_scroll` dit maintenant vrai** : à 390 px avec un v25, le
conteneur défile réellement, et le message qui l'annonce est affiché.
À 1400 px le QR tient, il n'y a pas de défilement, et c'est le message
normal qui paraît.

### Les deux contrôles négatifs, séparés parce que les causes le sont

Dans un clone jetable, chaque cause remise **seule** :

| état | 390 v14 | 390 v25 | 1400 v14 |
|---|---|---|---|
| corrigé (témoin) | 6,00 | 6,00 | 6,00 |
| ① `max-width:100%` remis seul | **3,56** | **2,30** | 6,00 |
| ② `border-box` remis seul | **5,75** | **5,84** | **5,75** |

Les deux signatures diffèrent, et c'est ce qui prouve qu'elles sont
indépendantes : **① ne rougit que quand ça déborde** (1400 px reste à
6,00), **② rougit partout et de la même quantité** (−20 px de padding,
constants).

### POURQUOI ÇA A SURVÉCU UN MOIS

**`verify_qr.py` existait pour ce défaut et ne pouvait pas le voir.**
Il rendait le QR lui-même, dans son propre `<div style="width:{minPx}">`,
puis vérifiait qu'il se décodait. **Il n'a jamais lu la largeur que
l'app applique.** Le défaut vivait dans deux propriétés CSS que le
filet ne consultait pas.

Son assertion de densité, en plus, était une **identité algébrique** —
voir n°44 : elle comparait `minPx / (modules+8)` à
`QR_MIN_PX_PER_MODULE`, les deux membres venant du même calcul du
produit, et rendait 6,00 sur les six versions balayées.

**La reprise de cette assertion est le vrai correctif de fond**, et
elle reste à écrire : `verify_qr.py` était tenu par une autre session
au moment de ce chantier.
