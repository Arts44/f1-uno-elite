# Tester le tutoriel — le plan, ses chiffres et ses réserves

> **Pourquoi ce chantier existe, et pourquoi ce n'est PAS un découpage.**
> `tutorial.js` était la quatrième entrée du backlog v2. La simulation du
> graphe l'a fait refuser (voir [`V2-REFACTOR.md`](V2-REFACTOR.md)) : la
> découpe en trois aggrave, l'extraction de la seule partie pure rapporte
> +1 feuille et 0 arête. **Le vrai sujet est ailleurs** — 11,27 % de
> couverture de fonctions, la pire du dépôt, et le tutoriel est le
> premier parcours que verra un nouvel utilisateur.

---

## ⚠️ LA RÉSERVE À LIRE AVANT DE JUGER CE CHANTIER RATÉ

**La couverture mesurée ne montera pas. C'est attendu, pas un échec.**

`npm run test:cov` instrumente le code sous `node --test`. Le parcours de
ce chantier s'exécute dans un **navigateur**, piloté par Playwright.
Aucune ligne exercée par Playwright n'apparaît dans `coverage/lcov.info`.

Donc, après ce chantier, `tutorial.js` affichera toujours **≈ 11 % de
fonctions couvertes**, et `all files` n'aura pas bougé de plus d'un
dixième de point.

**Ce qui aura changé** : des pannes qui n'étaient détectables par
personne le deviennent. La liste est plus bas, panne par panne.

> Cette phrase est ici parce qu'elle appartient à une famille
> d'affirmations que ce dépôt a déjà dû corriger **quatre fois** dans les
> README : une mesure qui ne bouge pas, lue six mois plus tard, ressemble
> à un travail sans effet. Le chiffre ne mesure pas ce que le chantier
> fait.

---

## Périmètre — ce qu'on ne touche pas

**`capture_screenshots.py` n'est pas transformé en suite de tests.** Il
produit des captures déterministes et c'est déjà une fonction critique,
qui a coûté quatre passes de correction pour y arriver. Le parcours vit
dans un **script séparé**, qui partage le seed comme le fait déjà
[`capture_demos.py`](../capture_demos.py) :

```python
from capture_seed import init_script, SEASON
```

---

## Les pièces, dans l'ordre d'exécution

### 0 — `_zoneOccupee()` ignorait le tutoriel · ~15 min · **FAIT**

Violation de contrat en production, corrigée avant le reste parce qu'elle
n'attendait aucune décision. Le contrat disait « jamais pendant une
action, un tutoriel ou un écran de déverrouillage » ; le code couvrait le
bandeau de mise à jour et celui d'installation, pas le tutoriel.

Le chemin était complet : la visite ajoute des cartes → des badges
tombent → la file de toasts se vide → `badge-toasts.js` appelle
`maybeInviteAfterCelebration()`. **Une des deux invitations d'une vie
pouvait être dépensée sur un écran de démonstration.**

### 2a — le garde unitaire manquant · ~30 min · **FAIT**

Le seul test qui regardait `tutorialKeys()` vérifiait les familles de
**saison**. `f1uno_review` est une clé d'**appareil** : elle n'était dans
le périmètre d'aucune assertion. **Le garde posé avec elle n'avait jamais
été vu échouer — donc jamais vérifié, seulement espéré.**

Deux tests ajoutés, chacun **vu rouge avant d'être vu vert**, et vu rouge
à nouveau en retirant une clé de `tutorialKeys()` :

- `tutorialKeys() couvre les clés d'APPAREIL que le tutoriel touche`
  ([`key-registry.test.js`](../tests/key-registry.test.js)) — six clés,
  chacune avec ce que le tutoriel lui fait ;
- `round-trip : les clés d'APPAREIL touchées par le tour reviennent
  aussi` ([`tutorial.test.js`](../tests/tutorial.test.js)) — y compris
  une clé **absente avant** le tour, qui doit le rester après.

### 2b — le parcours réel · ~3 h · **FAIT** — [`verify_tutorial.py`](../verify_tutorial.py), 240 lignes

Script séparé, partage `capture_seed.py`. **34 étapes atteintes, 10
gestes réels, 1 passée** (« Ajouter sans ouvrir », dont la pastille ne se
laisse pas atteindre par le centre du projecteur — nommée dans la sortie,
jamais silencieuse).

> **Le « coût caché » du chiffrage était faux, et la correction vaut
> d'être écrite.** J'avais annoncé ~20 lignes reprises de
> `capture_screenshots.py` pour franchir l'écran de PIN. **Le seed
> n'active pas le PIN** : `f1uno_pin_enabled` n'est passé qu'en
> *surcharge*, pour la capture de cet écran-là. Il n'y a pas d'écran à
> franchir, donc pas de duplication à arbitrer. Le critère du dépôt
> n'avait pas à s'appliquer — il n'y avait rien à partager.

**La restauration est vérifiée comme AYANT EU LIEU, pas comme ayant été
TENTÉE** : le diff porte sur `localStorage` **relu depuis le navigateur**
après coup, jamais sur la valeur qu'on croyait avoir écrite. C'est ce qui
voit un échec avalé par un `catch`.

**Et le stockage ne suffit pas.** Un `localStorage` correct avec une
mémoire polluée est exactement ce que produirait `loadManualBadges()` en
échec — et c'est **ce que l'utilisateur voit**. Le script compare donc
aussi une **empreinte affichée** : comptes de statuts, signature par
carte, bandeau de Collection, thème, langue.

<details>
<summary><b>Ce que l'audit de ces sept <code>try/catch</code> a donné</b></summary>

La question posée était : « avaler silencieusement l'échec d'une
restauration de données n'est pas la même chose qu'avaler un échec
d'affichage ». Elle est juste, et la réponse est rassurante — avec une
exception.

**L'écriture des données n'est PAS silencieuse.** `applyLocalStorage(snap.ls)`
est appelé **hors** de tout `try` : si la restauration échoue, elle lève,
et le tour ne fait pas semblant d'avoir réussi. C'est le point qui compte.

Les sept `catch` couvrent la **ré-hydratation** et le **ré-affichage** :

| appel | nature | journalisé ? |
|---|---|---|
| `closeMo()` | affichage | non — sans conséquence |
| `loadData()` | mémoire | **oui** (`log`) |
| `loadManualBadges()` | mémoire | **non** ⚠️ |
| `applySavedFont()` | affichage | non |
| `applyLanguage()` | affichage | **oui** (`log`) |
| `switchView()` | affichage | non |
| `renderCollection()` / `updateStats()` | affichage | non |

**Une seule asymétrie** : `loadManualBadges()` est de la même famille que
`loadData()` — remettre en mémoire ce que `localStorage` contient — et
lui n'est pas journalisé. S'il échouait, l'utilisateur verrait les badges
du tutoriel jusqu'au prochain rechargement, avec un `localStorage`
pourtant correct.

**Décision : les `catch` d'affichage restent muets** (un échec de rendu se
voit, et le tour ne doit pas casser sur un détail cosmétique), et
`loadManualBadges()` gagne son `log()` pour aligner les deux appels
mémoire. **Fait avec 2b.**

</details>

### Deux pièges de méthode payés pendant 2b — et qui resserviront

**① Le contrôle négatif est passé au VERT pour une mauvaise raison.**
Retirer `f1uno_owned_<saison>` de `tutorialKeys()` aurait dû faire
échouer le script : il a réussi. La cause n'était pas le garde mais
**`app.bundle.js` non reconstruit** — `index.html` sert le bundle, et le
script ne voyait pas la modification. C'est la même famille que le piège
`--format=iife` : le bundle masque ce qu'on croit avoir changé. **Un
contrôle négatif qui passe au vert doit être suspecté AVANT le garde.**

**② `innerText` n'est pas déterministe.** Trois exécutions saines
échouaient sur `72/101 ✓ Possédées` contre `72/101✓ Possédées`, sans
qu'une donnée ait bougé : `innerText` est le texte **tel que mis en
page**, et sur une vue en transition après la restauration il perd les
retours à la ligne. `textContent` ne dépend d'aucune mise en page.
Même famille : les classes d'animation (`fx-idle`, sur 95 tuiles sur 101)
qui faisaient varier la signature de grille d'une exécution à l'autre —
la signature ne prend que les classes de **statut**.

Les deux sont la leçon du n°11 des captures, repayée dans un autre
décor : **une mesure qui varie sans que rien n'ait changé n'est pas une
mesure.**

### 1 — la robustesse du parcours · ~2 h · ~90 lignes de plus

Même boucle, trois assertions ajoutées par étape : la cible existe, le
projecteur reste dans l'écran, l'étape progresse.

### 3 — extraire `tutorial-snapshot.js` · ~1 h 30

~75 lignes, trois importateurs à repointer, `sw.js` (nouveau fichier
précaché) et un bump `SW_VERSION`.

**Pas pour le graphe** (+1 feuille, 0 arête) : parce que `app.js` importe
aujourd'hui 746 lignes et neuf dépendances pour deux getters
`localStorage`, et parce qu'un moteur mesuré à 0 % s'instrumente plus
franchement qu'un module dont la moyenne est adoucie par la seule partie
déjà sûre.

**Total : ~7 h.** Le premier tiers utile — 0, 2a, 2b — tient en 3 h 30.

---

## Ce que le parcours attrape, panne par panne

| panne | détectable aujourd'hui ? |
|---|---|
| Une des 33 cibles disparaît après un refactor d'interface | **non** — les tests valident les ids et les textes, jamais que `target()` trouve quelque chose dans un vrai DOM |
| Le projecteur se pose hors écran | **non** |
| Une étape n'avance pas — le tour se fige | **non** : le faux DOM de [`_setup.js`](../tests/_setup.js) répond `querySelectorAll: () => []` |
| Le tour laisse une carte, un badge ou un thème derrière lui | **partiellement** — vérifié sur `localStorage` simulé, jamais sur un parcours réel |
| Le tour brûle l'invitation à laisser un avis | **corrigé en pièce 0**, tenu par deux tests |
| Une ré-hydratation échoue et le `catch` l'avale | **non** — c'est ce que le diff clé par clé de 2b rendra visible |

---

## Les réserves — ce que ce chantier ne prouvera PAS

Elles sont ici pour qu'on ne se croie pas couverts.

1. **Ni la compréhensibilité, ni la pertinence.** Le parcours vérifiera
   qu'une étape progresse et qu'une cible existe. Il ne dira **jamais**
   si l'explication est claire, si le projecteur pointe la bonne chose au
   bon moment, ni si l'ordre a un sens pédagogique. **Un tutoriel
   entièrement vert peut être incompréhensible.**
2. **Une seule langue, une seule taille.** Voir le n°16 de
   [`POINTS-SIGNALES.md`](POINTS-SIGNALES.md) : les débordements de bulle
   dans les six autres langues restent un **trou identifié**, pas une
   limite acceptée.
3. **Un seul état de départ** — le seed. Un utilisateur qui lance le tour
   avec une collection vide, ou déjà complète, emprunte des chemins que
   ce parcours ne verra pas.
4. **La couverture mesurée ne montera pas.** Voir l'encadré en tête de
   fichier.
