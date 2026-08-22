# Inventaire des skills Claude Code — `~/.claude/skills/`

> **Pourquoi ce fichier vit ici.** `~/.claude/skills/` n'est dans aucun dépôt : aucune
> suppression n'y est récupérable. Ce document est le seul registre versionné de ce qui a
> été retiré, quand, et pourquoi. Il n'a aucun effet sur le code de F1 UNO Élite — il est
> hébergé ici faute de dépôt dédié.

**Dernier audit : 2026-08-22** · 42 → **33 skills** · 641 → 429 fichiers · 44 Mo → 12 Mo
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

---

## 6. Les 33 skills actifs

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

**14 skills en `name-only`** (tout le bloc design sauf `frontend-design`, seul invoqué) :
`banner-design`, `brand`, `brutalist-skill`, `design`, `design-system`, `gpt-tasteskill`,
`image-to-code-skill`, `impeccable`, `minimalist-skill`, `redesign-skill`, `stitch-skill`,
`taste-skill`, `ui-styling`, `ui-ux-pro-max`.

**`[mesuré]`** Listing avant : 8 970 car. ≈ **2 242 tokens** par tour (33 skills).
Descriptions retirées : 5 596 car. ≈ 1 399 tokens. Noms nus conservés : ≈ 42 tokens.
**Gain net ≈ 1 356 tokens par tour**, soit une réduction de 60 % du listing.

**`[à vérifier au prochain démarrage]`** Le contrôle négatif joué dans la session de
configuration est un **faux positif** : le listing y avait été construit avant l'écriture de
`skillOverrides`, donc l'invocation a réussi sous l'ancienne configuration. La vérification
valable consiste à invoquer l'un des quatorze **dans une session neuve** et à confirmer qu'il
se charge. Si l'un devient inatteignable, retirer son entrée — une configuration qui ment sur
ce qui est disponible est pire qu'une suppression.

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
