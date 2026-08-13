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

### 2b — le parcours réel · ~3 h · ~180 lignes

Script séparé, 33 étapes, instantané de tout `localStorage` avant et
après, **diff clé par clé**. Toute clé qui diffère est un échec **nommé**,
pas un pourcentage.

> **Coût caché** : le seed active le PIN (`data-boot=login`). Le script
> doit franchir l'écran de déverrouillage comme le fait déjà
> `capture_screenshots.py` (~20 lignes reprises).

**La restauration doit être vérifiée comme AYANT EU LIEU, pas comme ayant
été TENTÉE.** `restoreState()` enchaîne sept `try/catch` ; le diff clé par
clé est justement ce qui voit un échec avalé, puisqu'il regarde le
résultat et non le chemin. C'est la raison pour laquelle le diff porte
sur `localStorage` **relu après coup**, jamais sur la valeur qu'on
croyait avoir écrite.

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
mémoire. Une ligne, à faire avec 2b.

</details>

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
