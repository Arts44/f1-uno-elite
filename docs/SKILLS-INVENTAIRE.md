# Inventaire des skills Claude Code — `~/.claude/skills/`

> **Pourquoi ce fichier vit ici.** `~/.claude/skills/` n'est dans aucun dépôt : aucune
> suppression n'y est récupérable. Ce document est le seul registre versionné de ce qui a
> été retiré, quand, et pourquoi. Il n'a aucun effet sur le code de F1 UNO Élite — il est
> hébergé ici faute de dépôt dédié.

**Dernier audit : 2026-08-22** · 42 → **33 skills** · 641 → 429 fichiers · 44 Mo → 12 Mo
**Depuis :** +1 ajout inspecté le 2026-09-03 → **34 skills** (voir §6 et §9)
**Archive de sécurité : `~/skills-backup-20260822.tar.gz`** (36 Mo, 769 entrées, les 42 d'avant)

---

## 1. Le piège du `tar -h` — à ne pas réapprendre

`no-ai-slop` n'est pas un dossier : c'est un **lien symbolique** vers
`~/.agents/skills/no-ai-slop`, posé par l'installeur `npx skills`.

```bash
# FAUX — archive le lien, pas son contenu
tar -czf ~/skills-backup.tar.gz -C ~/.claude skills

# JUSTE — déréférence les liens
tar -czhf ~/skills-backup.tar.gz -C ~/.claude skills
```

Sans le `-h`, l'archive contient un lien de 31 octets. Le jour où la cible disparaît, la
restauration rend un lien mort et le skill est perdu malgré la sauvegarde.
**Vérifier une archive, c'est en extraire un fichier, pas lire le code de retour.**

---

## 2. Les neuf skills de méthode — règle d'invocation

### Systématiques

| Skill | Quand | Sa loi |
|---|---|---|
| `systematic-debugging` | Toute recherche de cause | *Aucun correctif sans investigation de cause racine d'abord* |
| `verification-before-completion` | Tout verdict `[mesuré]` / `[déduit]` | *Aucune annonce d'achèvement sans preuve fraîche — la commande doit avoir tourné dans le message courant* |
| `requesting-code-review` | Avant tout push touchant du code applicatif | Dépêche un sous-agent relecteur avec BASE_SHA/HEAD_SHA |
| `receiving-code-review` | À la suite du précédent | Interdit l'acquiescement performatif : vérifier avant d'appliquer |

`systematic-debugging` embarque **`condition-based-waiting.md`** : remplacer les attentes en
durée fixe par des attentes sur condition. C'est le remède aux constantes magiques de délai
(cf. la constante de 120 ms du chantier tutoriel).

### Conditionnels

| Skill | Déclencheur |
|---|---|
| `test-driven-development` | DockFolder, qui a zéro test. Règle dure : code écrit avant le test → supprimer et recommencer |
| `writing-plans` / `executing-plans` | Chantiers multi-sessions **seulement**. Découpe en étapes de 2 à 5 min — cérémonie sur une correction de deux lignes |
| `using-git-worktrees` | Travail risqué à isoler. **Ce n'est pas du parallélisme** : c'est garantir qu'un espace isolé existe |
| `finishing-a-development-branch` | Travail sur branches |

---

## 3. Suppressions du 2026-08-22

| Skill | Raison |
|---|---|
| `huashu-design` | 32 Mo, 188 fichiers — 73 % du dossier à lui seul. Intégralement en chinois : illisible et injugeable par le mainteneur |
| `taste-skill-v1` | Obsolescence **déclarée par lui-même** (« preserved for projects depending on its exact behavior ») — aucun projet n'en dépend. Pas pour duplication : 3,1 % de recouvrement seulement avec v2 |
| `using-superpowers` | **Inerte** : superpowers installé en version A, sans le hook `SessionStart`. Ce skill ne sert qu'à s'auto-injecter au démarrage. Vérifié : aucun hook dans `settings.json`, aucun `session-start` sur le disque |
| `brandkit` | Aucun usage |
| `slides` | Pas de présentations |
| `llm-council` | Aucun usage |
| `brainstorming` | Injonction non désirée : « You MUST use this before any creative work » |
| `imagegen-frontend-web` | Jamais invoqué |
| `imagegen-frontend-mobile` | Jamais invoqué |

**Contrôle négatif effectué** : `Skill(llm-council)` → `Unknown skill: llm-council`.
Échec explicite, pas de repli silencieux.

**Non supprimé malgré le projet initial** : `image-to-code-skill` — voir §5.4.

---

## 4. Renommage

`output-skill` déclarait `name: full-output-enforcement` dans son frontmatter alors que son
dossier s'appelle `output-skill`. Divergence corrigée **vers le nom du dossier**, qui fait foi :
le listing exposé par le harness nomme le skill d'après son dossier. Une invocation de
`full-output-enforcement` aurait échoué.

---

## 5. Les quatre erreurs de l'audit, et ce qui les a démasquées

La liste de suppression initiale reposait sur la lecture des descriptions. **Trois classements
du mainteneur étaient faux, et une affirmation de l'assistant l'était aussi** (§5.4).
Ce qui les a démasqués : **mesurer la similarité de contenu** (Jaccard sur 5-grammes de mots,
hors frontmatter) au lieu de se fier aux descriptions, et **vérifier par `grep`** au lieu de
prolonger une supposition.

| Erreur | Ce que la mesure a montré |
|---|---|
| « `ui-styling` et `ui-ux-pro-max` recouverts par `frontend-design` » | 0,0 % de recouvrement. `ui-ux-pro-max` porte **14 bases CSV**, `ui-styling` **54 polices .ttf** + générateurs shadcn/Tailwind. `frontend-design` est 8 Ko de prose. **Un texte ne remplace ni une base de données ni un outil** |
| « `gpt-tasteskill` doublon de `taste-skill` » | **0,0 %** de recouvrement. Moteur distinct : randomisation Python, structure AIDA, grilles bento, physique GSAP |
| « `soft-skill`, direction esthétique contradictoire » | Erreur de catégorie : sa première ligne est *« If your generated code includes ANY of the following, the design instantly fails »*. C'est une liste de garde-fous, plus proche de `karpathy-guidelines` |

**Résultat général de la mesure : aucun doublon textuel dans tout le dossier.** Toutes les
paires sous 3,2 %. Le recouvrement perçu était **territorial** — plusieurs skills revendiquent
le mot « design » dans leur description et se disputent le déclenchement — et non une
redondance de contenu.

### 5.4 — Une quatrième erreur, celle de l'assistant

Au cours de l'audit, l'assistant a affirmé que `image-to-code-skill` **« dépend d'un serveur
MCP Figma qui n'est pas encore autorisé »**. Le mainteneur a bâti une condition de suppression
sur cette affirmation : *« confirme que le MCP Figma n'est pas autorisé — s'il ne peut pas
fonctionner, il part »*.

Vérification faite : **0 occurrence de « figma »** dans son `SKILL.md`. Le skill génère lui-même
ses images de design puis code d'après elles. Il ne dépend pas de Figma. L'affirmation était
inventée — elle prolongeait une supposition du prompt sans jamais avoir été vérifiée.

**Ce qu'il faut en retenir :** une affirmation non vérifiée émise par l'assistant a failli
faire supprimer irréversiblement un skill. C'est le même mécanisme que les trois erreurs
précédentes — lire, supposer, conclure — appliqué cette fois par l'outil et non par le
mainteneur. D'où la règle : **soupçonner l'instrument avant le produit**, et exiger
`[mesuré]` / `[déduit]` sur chaque verdict, y compris ceux de l'assistant.

**Le cas symétrique est arrivé le 2026-09-03, et il vient d'une source qu'on croit
neutre : la `description:` du dépôt lui-même.** Voir §9 — elle annonçait six frameworks,
dont un absent de tout le corpus, et elle allait décider d'un classement. Registre
CONVENTIONS.md ㊷.

---

## 6. Les 34 skills actifs

**Méthode (13)** — `systematic-debugging` · `test-driven-development` ·
`verification-before-completion` · `writing-plans` · `executing-plans` ·
`requesting-code-review` · `receiving-code-review` · `using-git-worktrees` ·
`finishing-a-development-branch` · `subagent-driven-development` ·
`dispatching-parallel-agents` · `writing-skills` · `karpathy-guidelines`

**Outils (4)** — `repo-map` · `webapp-testing` · `no-ai-slop` → *(lien)* · `output-skill`

**Design — textes (7)** — `frontend-design` *(le seul invoqué)* · `taste-skill` ·
`gpt-tasteskill` · `redesign-skill` · `stitch-skill` · `brutalist-skill` · `minimalist-skill`

**Design — outils et données (5)** — `impeccable` *(23 sous-commandes)* ·
`ui-ux-pro-max` *(14 CSV)* · `ui-styling` *(54 polices)* · `design` · `design-system`

**Autres (4)** — `soft-skill` *(garde-fous)* · `brand` · `banner-design` *(gardé pour
montage TikTok à venir)* · `image-to-code-skill`

**Audit — hors chaîne design (1)** — `apple-design-skill` *(ajouté le 2026-09-03,
§9 · **ne couvre PAS SwiftUI**)*

---

## 7. Concurrence au déclenchement — état de la question

**`[mesuré]`** Avant élagage (42 skills), le listing coûtait **13 543 caractères ≈ 3 343 tokens
à chaque tour**. Les 9 skills supprimés en représentaient 37 %. Après suppressions (33 skills) :
**8 970 caractères ≈ 2 242 tokens**. Aucune description ne dépasse le plafond de 1 536
caractères par skill.

**`[mesuré]`** Écrire « Skills : frontend-design » dans un prompt est une **instruction au
modèle, pas un filtre appliqué par le harness**. Les descriptions des 32 autres skills restent
présentes dans le contexte et restent éligibles. **Donc oui : un autre skill peut se déclencher
en plus.**

**`[non mesurable depuis l'intérieur]`** La *fréquence* à laquelle un skill se déclenche à tort
ne peut pas être établie par le modèle sur lui-même : cela demanderait une expérience contrôlée
que la session ne permet pas. Tout chiffre avancé sur ce point serait fabriqué.

**`[non mesurable depuis l'intérieur]`** La *fréquence* à laquelle un skill se déclenche à tort.
Cela demanderait une expérience contrôlée sur le comportement du modèle, que la session ne
permet pas. **Tout taux avancé sur ce point serait fabriqué.**

C'est précisément parce que cette fréquence est inconnue que l'élagage au goût a été écarté :
supprimer irréversiblement sur une grandeur non mesurée aurait répété les quatre erreurs du §5.

### 7.1 — La configuration retenue : `skillOverrides`

**Raison : neutraliser la concurrence au déclenchement sans détruire.** Le mode `name-only`
retire la description du listing tout en y laissant le nom — le skill reste invocable
explicitement, le budget de contexte est récupéré, et la manœuvre se révoque en supprimant une
ligne. Aucune information n'est perdue, contrairement à une suppression.

Les trois modes, du moins au plus restrictif :

| Mode | Vu du modèle | Invocable explicitement | Budget récupéré |
|---|---|---|---|
| `name-only` | nom seul | **oui** | oui |
| `user-invocable-only` | masqué | par `/nom` | oui |
| `off` | masqué | non | oui |

**17 skills en `name-only`** — tout le bloc design sauf `frontend-design` (seul invoqué),
plus trois skills d'orchestration sans usage actuel :
`banner-design`, `brand`, `brutalist-skill`, `design`, `design-system`,
`dispatching-parallel-agents`, `gpt-tasteskill`, `image-to-code-skill`, `impeccable`,
`minimalist-skill`, `redesign-skill`, `stitch-skill`, `subagent-driven-development`,
`taste-skill`, `ui-styling`, `ui-ux-pro-max`, `writing-skills`.

`dispatching-parallel-agents` et `subagent-driven-development` servent à du travail parallèle
qui n'a pas lieu ici ; `writing-skills` ne sert que pour écrire ses propres skills — il sera
invoqué explicitement ce jour-là.

**`[mesuré]`** Trajectoire complète du listing, par tour :

| État | Skills | Coût |
|---|---:|---:|
| Départ | 42 | ≈ 3 343 tokens |
| Après les 9 suppressions | 33 | ≈ 2 242 tokens |
| Après `name-only` sur 17 | 33 | **≈ 901 tokens** |

Descriptions masquées : 5 884 car. ≈ 1 471 tokens. Noms nus conservés : 239 car. ≈ 59 tokens.
16 skills pleinement visibles : 3 367 car. ≈ 841 tokens.
**Gain total ≈ 2 442 tokens par tour, soit 74 % du listing de départ** — dont 1 412 obtenus
sans rien détruire.

### 7.2 — Le faux positif : quand l'instrument de mesure est périmé

Après avoir écrit `skillOverrides`, l'assistant a invoqué `minimalist-skill` pour vérifier que
le mode `name-only` laissait le skill atteignable. **Le skill a répondu intégralement.** Le
test semblait concluant. Il ne valait rien.

**Pourquoi :** le listing des skills est construit **au démarrage de la session**. La session
qui a écrit la configuration avait donc été initialisée *avant* cette écriture. L'invocation a
réussi sous l'**ancien** état, pas sous le nouveau. Le test mesurait la configuration qu'il
était censé remplacer.

**La règle générale :** un test qui vérifie l'effet d'un changement de configuration ne vaut
rien s'il tourne dans la session qui a précédé ce changement. **L'état de la session est un
instrument, et il était périmé.** C'est le cas d'école de « soupçonner l'instrument avant le
produit » : le résultat était juste, la mesure était fausse, et un faux positif sur ce point
aurait laissé croire qu'une configuration cassée était saine.

**La parade :** toute vérification d'un changement de configuration se joue **dans une session
neuve**.

**`[à vérifier — session neuve]`** Invoquer l'un des 17 skills en `name-only` et confirmer
qu'il se charge. S'il devient inatteignable, retirer son entrée : une configuration qui ment
sur ce qui est disponible est pire qu'une suppression.

### 7.3 — `name-only` vérifié en session neuve — 2026-08-23

**Résultat : succès. Aucun échec.** Les 17 skills en `name-only` sont validés
tels quels ; le gain de ~1 356 tokens par tour est acquis sans perte de capacité.

**Ce test est valide, contrairement à celui du §7.2** : le listing de la session
d'essai a été construit **après** l'écriture de `skillOverrides`, et non avant.
C'est la parade du §7.2 appliquée.

**Ce qui a été éprouvé**, sur `impeccable` :

| Vérification | Résultat |
|---|---|
| Le skill se charge sur invocation explicite | ✅ SKILL.md complet, table des 23 sous-commandes |
| Le contenu est intégral, pas tronqué | ✅ y compris la note de coexistence ajoutée localement |
| Les **scripts** du skill fonctionnent | ✅ `context.mjs` et `detect.mjs` ont rendu leur sortie |

Le troisième point est le moins évident et le plus utile : un skill en `name-only`
n'est pas seulement *résolvable par son nom*, il est **pleinement opérationnel**,
scripts compris. `skillOverrides` agit sur le listing envoyé au modèle, jamais sur
la résolution ni sur le contenu chargé.

**Portée de la preuve — `[mesuré]` sur 1 des 17.** Le mécanisme est commun aux
dix-sept, donc la généralisation est solide, mais elle reste **une déduction pour
les seize autres**. Un échec isolé sur l'un d'eux resterait possible et se verrait
à l'usage : le skill dirait qu'il ne se trouve pas.

**Défaut relevé au passage, non corrigé** : le SKILL.md d'`impeccable` indique
`node .claude/skills/impeccable/scripts/context.mjs`, chemin relatif au projet, qui
échoue puisque le skill est installé en global. Le bon chemin est
`~/.claude/skills/impeccable/scripts/`. Le skill prévoit lui-même le cas — *« si le
runtime montre le répertoire de base chargé, utilisez-le »* — mais la ligne
d'exemple, elle, est fausse pour une installation globale.

---

## 8. L'archive de sauvegarde — où elle est, comment l'ouvrir

**`~/skills-backup-20260822.tar.gz`** · 36 Mo · 769 entrées · les **42** skills d'avant élagage.

Hors dépôt, donc hors de portée d'un reclone. C'est le **seul** recours pour les neuf skills
supprimés du §3.

```bash
# Voir ce qu'elle contient
tar -tzf ~/skills-backup-20260822.tar.gz | grep -E '^skills/[^/]+/$'

# Restaurer UN skill précis (exemple : llm-council)
tar -xzf ~/skills-backup-20260822.tar.gz -C ~/.claude skills/llm-council

# Restaurer tout le dossier tel qu'il était le 2026-08-22
tar -xzf ~/skills-backup-20260822.tar.gz -C ~/.claude
```

Recréer une archive après toute modification du dossier — **avec le `-h` du §1** :

```bash
tar -czhf ~/skills-backup-$(date +%Y%m%d).tar.gz -C ~/.claude skills
```

---

## 9. `apple-design-skill` — ajouté le 2026-09-03

**Source :** `github.com/dickwu/apple-design-skill` · 608 Ko installés, 59 fichiers.
**Installé** dans `~/.claude/skills/apple-design-skill/`, **`name-only`** dans
`settings.json` — 18ᵉ skill de cette liste.

### Ce qu'il est

Un **auditeur** de conformité aux Human Interface Guidelines pour applications natives et
cross-platform. 53 documents de référence en prose, routés par `references/hig-lookup.md`.
Il rend des constats citables, classés par sévérité.

**Hors de la chaîne de priorité design.** Les autres skills design *créent* ; celui-ci
*audite*. Ce ne sont pas les mêmes gestes, et les mettre en concurrence les ferait se
disputer des tâches disjointes.

### ⚠️ IL NE COUVRE PAS SwiftUI — ET SA DESCRIPTION DIT LE CONTRAIRE

**C'est la raison d'être de cette entrée.** La `description:` de son frontmatter énumère
« Flutter, Tauri, Electron, React Native, **SwiftUI**, and AppKit/UIKit ».

Mesure du contenu, à refaire si l'on en doute :

```bash
grep -ric swiftui ~/.claude/skills/apple-design-skill/references/hig/*.md | awk -F: '{s+=$2} END{print s}'
# → 0
```

`SwiftUI` apparaît **3 fois dans le dépôt, 0 fois dans les 53 fichiers de référence** :
dans cette description, dans le `README.md` qui répète la même promesse, et dans une
ligne de table de traduction (`| UIKit / SwiftUI | Framework UI layer | ... |`).
**Aucun code, aucune API, aucun pattern d'implémentation.** C'est un corpus de principes délibérément
framework-agnostique — sa table de terminologie sert précisément à *traduire* le
vocabulaire Apple vers Flutter ou Electron.

**Une session future qui lira la description en conclura le contraire.** C'est déjà
arrivé le jour de l'installation : le classement « premier choix pour tout projet
SwiftUI » avait été décidé sur cette ligne, et seule la mesure du corpus l'a défait.

### Coût mesuré

**Comptes de mots mesurés AVANT l'ajout de la note locale** (264 mots). Le plancher réel
est donc aujourd'hui de 10 423 mots ≈ 13 900 tokens — refaire la mesure rend ce
nombre-là, et non celui du tableau.

| | mots | |
|---|---|---|
| `SKILL.md` + `hig-lookup.md` | 2 183 | au déclenchement |
| `accessibility` + `color` + `layout` + `typography` | 7 976 | **imposés à chaque revue** |
| **plancher** | **10 159** | **≈ 13 500 tokens** |
| en pratique (+ 3 à 8 fichiers) | | **18 000 à 25 000 tokens** |
| corpus de référence (`references/hig/`) | 74 609 | ≈ 99 000 — **jamais chargé d'un bloc** |

Le plancher n'est pas annoncé par le README : il vient de la section « Always load for
any review » du `SKILL.md`. La divulgation progressive est réelle, mais elle a un
plancher, et c'est le plancher qui se paie à chaque invocation.

### Innocuité — cinq contrôles, tous à zéro

Scripts exécutables : **0** · fichiers de code (`.sh`/`.py`/`.js`) : **0** · appels
réseau (`curl`, `fetch`, `subprocess`, `eval`, `npx`) : **0** · clés ou identifiants :
**0** · écritures hors de son dossier (`~/`, `/Users/`, `settings.json`, `.claude`) :
**0**.

Le skill est **intégralement du Markdown**. Les 109 URL citent `developer.apple.com` ;
les 3 URL GitHub sont dans le README, pour l'installation. `.git` retiré à la copie.

### Note locale posée en tête de son `SKILL.md`

Elle reprend la formulation ci-dessus, le plancher de tokens, et la mesure du
« ne couvre pas SwiftUI ». **Elle est placée APRÈS le frontmatter YAML** — le déplacer en
première ligne casserait le chargement du skill.
