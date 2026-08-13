# Seuils de badges — plan, non exécuté

> **Arbitré le 12/08/2026.** Les trois décisions sont prises (§4) et
> l'exécution suit le §5, **un commit par étape** — on touche à un
> mécanisme qui décide de badges déjà enregistrés chez l'utilisateur, et
> chaque étape doit rester révocable seule.

---

## 0. LA RÈGLE QUI PRIME SUR TOUT LE RESTE

**Un badge débloqué reste débloqué. Sans exception. Y compris s'il a été
obtenu à tort.**

Ce n'est pas une facilité d'implémentation, c'est une promesse faite à
l'utilisateur — « une fois débloqué, toujours débloqué » — et la trahir
pour corriger une erreur de calcul serait **pire que l'erreur** :
quelqu'un qui perd un badge ne saura pas pourquoi, et n'aura aucun moyen
de le récupérer. Un faux positif obtenu sur un catalogue partiel n'a pas
été provoqué par l'utilisateur : il n'a pas à en payer le prix.

La correction n'agit donc **que sur les déblocages futurs**.

> **À l'attention de qui lira ce fichier dans six mois et voudra « faire
> le ménage » :** les badges décernés à tort avant cette correction sont
> **laissés en place volontairement**. Ce n'est pas un oubli de migration,
> ce n'est pas une dette. Écrire un script qui les retire serait un
> retour en arrière, pas un nettoyage.

**Bonne nouvelle : cette garantie est déjà structurelle.**
`isAutoBadgeUnlocked()` (badges.js:218) termine par
`return !!autoBadgeUnlocked[badge.id]` — une fois la date écrite, la
valeur renvoyée ne dépend plus du calcul. Changer un dénominateur ne peut
donc **pas** reverrouiller quoi que ce soit. Le plan n'a pas à ajouter
cette garantie : il a seulement à **ne pas la casser**, et un test doit
le vérifier explicitement.

---

## 1. Ce qui est déjà corrigé (et qu'il ne faut pas refaire)

Le garde-fou `partiel` existe depuis le chantier multi-saisons.
Six métriques dont le dénominateur vient du catalogue chargé
(`category_owned`, `category_set`, `champion_owned`, `team_set`,
`teams_owned_count`, `teams_set_count`) sont marquées `partiel` quand
`seasonCatalogueState()` vaut `'partiel'`, et `isAutoBadgeUnlocked()`
**refuse le déblocage** dans ce cas — tout en continuant d'afficher la
progression.

**Le point 3 de POINTS-SIGNALES est donc traité.** Ce qui reste est le
point 1 : les seuils **absolus** qui encodent la taille du catalogue.

---

## 2. Le vrai périmètre : trois badges, pas quarante-quatre

44 badges automatiques portent un seuil numérique. **Presque tous sont
des paliers arbitraires** — 5 wishlist, 20 cartes bleues, 300
exemplaires — et un palier arbitraire survit à un changement de saison
sans rien changer. Ils ne sont pas concernés.

Seuls **trois** encodent une propriété du catalogue :

| Badge | Condition | Ce qui casse en 2026 |
|---|---|---|
| `legend_101` | `owned_count >= 101` | 101 **est** la taille du catalogue 2025. Si 2026 en compte moins, décerné à tort ; plus, inatteignable. |
| `teams_owned_10` | `teams_owned_count >= 10` | 10 **est** le nombre d'écuries 2025. |
| `teamset_all` | `teams_set_count >= 10` | idem. |

Les quatre `*_all` de catégorie (`pilote_all`, `reserve_all`,
`director_all`, `gp_all`) utilisent déjà une métrique relative et sont
couverts par `partiel`.

---

## 3. Le champ `season` — deux cas, pas un

`grep -n "season" badges.js` ne renvoie rien : le champ n'est jamais lu.
Mais les 7 badges qui le portent ne se ressemblent pas.

**(a) Cinq où le champ est faux ET inutile** — `legend_101`,
`pilote_all`, `reserve_all`, `director_all`, `gp_all`. Ils décrivent
« tout posséder », ce qui a un sens dans **n'importe quelle** saison.
Marquer `season: 2025` était une façon de dire « ce total vaut pour
2025 » ; une fois le seuil rendu relatif, la mention n'a plus d'objet.

**(b) Deux où le champ est VRAI et devrait être lu** — `launch_day`
(« j'étais là au lancement ») et `prediction` (« j'ai prédit le champion
2025 »). Ce sont des faits datés : les afficher en 2027 n'a pas de sens.

Traiter les deux cas de la même façon serait l'erreur.

---

## 4. Ce que la correction fait, concrètement

### 4.1 Un total DÉCLARÉ, jamais déduit

`seasonCardCount()` (data.js) lit `metadata.seasons[].cardCount`. C'est
une valeur **déclarée**, qui vaut 101 pour 2025 même si le fichier n'en
contient que 40. Elle ne doit jamais être remplacée par `CARDS_DB.length`
— ce serait réintroduire exactement le bug qu'on corrige.

Nouvelle forme de condition, à côté de `value` :

```json
{ "metric": "owned_count", "of": "season" }
```

`of: 'season'` ⇒ `max = seasonCardCount()`. Si la saison ne déclare pas
son total, la condition est marquée `partiel` — donc **pas de déblocage**,
comme pour les six métriques relatives. Le silence ne devient jamais un
déblocage.

### 4.2 Les écuries ne sont pas déclarées — et c'est un choix à faire

`metadata.seasons[]` déclare `cardCount`, **pas** un nombre d'écuries.
Pour `teams_owned_10` et `teamset_all`, trois options :

- **(A)** ajouter `teamCount` à `seasons[]` — symétrique de `cardCount`,
  une donnée de plus à tenir à jour ;
- **(B)** compter les écuries du catalogue, mais **s'appuyer sur
  `partiel`** : tant que le catalogue est incomplet, pas de déblocage. Le
  compte est alors exact par construction ;
- **(C)** supprimer les deux badges.

**DÉCISION : (B).** Aucune donnée nouvelle, aucune seconde source de
vérité à maintenir, et le mécanisme existe déjà.

Ce que je présentais comme un défaut — « ces deux badges deviennent
indébloquables tant que la saison n'est pas complètement saisie » — n'en
est pas un, et l'arbitrage l'a redressé : **c'est exactement ce que dit
le badge.** « Toutes les écuries » n'a aucun sens sur un catalogue
incomplet. Mieux vaut indébloquable qu'attribué à tort.

### 4.3 Les libellés

15 occurrences de « 101 » dans `translations.js`. Un libellé qui dit
« Posséder les 101 cartes » devient faux en 2026. Deux formulations :

- **interpolée** — « Posséder les {n} cartes », `n` = total déclaré ;
- **générique** — « Posséder toutes les cartes de la saison ».

**DÉCISION : interpolée.** Le chiffre est motivant, et il devient juste
au lieu d'être faux.

Deux pièges à vérifier plutôt qu'à supposer :
- le **pluriel** si `n` valait 1 (il ne vaudra jamais 1 en pratique, mais
  la formulation ne doit pas casser). Le chinois n'a pas de pluriel :
  « 拥有全部 {n} 张卡牌 » reste valide quel que soit `n` ;
- les **15 occurrences** de « 101 » dans `translations.js` ne sont pas
  toutes celles de `legend_101` — et il y en a **hors** de ce fichier
  (README ×7, `docs/` (dont `CONVENTIONS.md`), la description GitHub). Chacune est à
  relire, pas seulement celle du badge.

### 4.4 Le champ `season`

- cas (a) : **retirer** le champ des 5 badges ;
- cas (b) : **le lire** pour `launch_day` et `prediction` — un badge daté
  n'apparaît que dans sa saison.

**DÉCISION : affiché, avec sa saison en étiquette.** Un badge gagné
reste visible même hors de sa saison ; l'étiquette dit *pourquoi* il ne
peut plus être obtenu. Le masquer serait un reverrouillage visuel,
contraire au §0 dans l'esprit sinon dans la lettre.

---

## 5. Ordre d'exécution proposé

1. `of: 'season'` dans `evaluateBadgeCondition` + `partiel` si le total
   n'est pas déclaré. **Tests d'abord** : total déclaré 101 avec 40
   cartes chargées ⇒ pas de déblocage.
2. `legend_101` passe à `of: 'season'`.
3. Écuries selon l'arbitrage n°1.
4. Libellés ×7 selon l'arbitrage n°2.
5. Champ `season` : retrait (a) + lecture (b) selon l'arbitrage n°3.
6. Test de non-régression de la règle du §0 : un badge déjà stocké reste
   renvoyé `true` alors que sa condition n'est plus satisfaite.

## 6. Ce que ce plan NE fait pas

- Il ne touche **aucun badge déjà débloqué**.
- Il ne renumérote pas les paliers arbitraires (5, 20, 300…).
- Il ne touche pas au modèle de difficulté : les trois badges concernés
  gardent leur niveau.
- Il n'ajoute pas de migration de données. Il n'y a rien à migrer : le
  stockage est `{ id: timestamp }`, indépendant des conditions.
