# Plan de découpe — `cloud.js` (726 lignes, complexité 234)

> Phase 2 du chantier. Ce document dit **ce qu'on découpe**, **ce qu'on
> ne fusionne surtout pas**, et **ce que ça change pour le multi-saisons**.
> Il est écrit avant toute exécution, pour être discuté et pas subi.

## 0. Ce que la cartographie a donné

Faite à la main (pas de skill `repo-map` disponible ici), par extraction
des `import … from './x.js'` sur les 27 modules du dépôt, puis Tarjan.

**Doute d'exhaustivité, déclaré :** la méthode ne voit que les imports
ES **statiques et littéraux**. Un `import()` dynamique ou un accès via
`window.__*` lui échappe. J'ai vérifié : `cloud.js` n'en contient aucun,
et ses seuls accès globaux sont `window.__F1UNO_CLOUD` (la config, un
script classique par conception) et les API navigateur. La carte est
donc complète **pour ce module**. Je ne peux pas l'affirmer avec la même
force pour le dépôt entier.

### Le dépôt est un nœud, et ce n'est pas cloud.js qui le fait

Une seule composante fortement connexe, de **20 modules sur 27** :

```
account, app, backup, badges, cloud, collector, data, difficulty,
feedback, history, i18n, install, pagehead, pin, render,
settings-sync, stats, storage, tutorial, update
```

Hors du nœud, sept modules : `changelog`, `icons`, `logger`,
`otp-input`, `qrcodegen`, `secure-store`, `session`.

Le moyeu est **`i18n.js`**, qui importe `render`, `badges`, `stats` et
`pin` pour re-rendre l'interface au changement de langue. C'est cette
arête-là qui aspire `install.js` et `pagehead.js` dans le nœud — ils
n'ont rien demandé. **Casser ce moyeu est le vrai chantier de cycles,
et il n'est pas dans celui-ci.** Le dire est plus utile que de le
laisser croire réglé.

### Les arêtes de `cloud.js`

| Vers | Ce qui est utilisé | Dans le nœud ? | Ira dans |
|---|---|---|---|
| `logger` | `log` | non | partout |
| `session` | `deniedForViewer` | non | auth + sync |
| `otp-input` | `createSegmentedInput` | non | ui |
| `icons` | `icon` | non | ui |
| `i18n` | `t`, `escapeHtml`, `setSafeHTML` | **oui** | ui |
| `storage` | `collectionSnapshot`, `_showImportDialog` | **oui** | sync |
| `settings-sync` | `backupIncludes` | **oui** | sync |
| `backup` | `markBackupDone` | **oui** | sync |
| `data` | `_currentSeason` | **oui** | sync |

### Qui importe `cloud.js` — et c'est là que le plan se décide

```
app.js       → handleAuthRedirect                                    (auth)
account.js   → cloudSectionHTML, bindCloudSection,
               isCloudSignedIn, cloudDeleteAll                       (ui + sync)
feedback.js  → cloudConfig, isCloudConfigured, authHeaders,
               getValidSession, loadSession, decodeJwtSub,
               sendCooldownRemaining                                 (http + auth)
```

**`feedback.js` est le fait décisif.** Il n'a rien à voir avec la
synchronisation de collection : il envoie un retour utilisateur. Pour
six fonctions d'authentification et de transport, il importe
aujourd'hui un module de 726 lignes qui traîne derrière lui `storage`,
`backup`, `data`, `settings-sync`, `i18n`, `icons` et `otp-input`.

Il existe donc **déjà deux consommateurs distincts du noyau
auth/transport**. Ce n'est pas une frontière que j'invente pour faire
baisser un compteur : c'est une frontière que le code franchit déjà.

---

## 1. La découpe proposée

Quatre modules. Pour chacun, la raison d'exister **sans jamais citer la
métrique de complexité** — c'est le critère.

### `cloud-http.js` — ~55 lignes · le transport

**Contenu :** `cloudConfig`, `isCloudConfigured`, `authHeaders`, et un
`cloudFetch(url, opts)` qui applique la règle de 1.40.0 : un échec
**réseau** devient `'offline'`, un refus **serveur** reste un refus.

**Raison d'exister :** cette règle est une correction documentée, et
elle doit s'appliquer **identiquement** aux huit requêtes du module.
Aujourd'hui elle est recopiée huit fois. Un endroit nommé, c'est la
garantie qu'elle ne dérive pas entre l'authentification et la synchro.
S'y ajoute le commentaire de provenance de `cfg.url` (la réponse aux
alertes SSRF), qui a un seul sujet et mérite un seul fichier.

**Dépendances :** aucune, sauf `logger`. **Hors du nœud.**

> ⚠️ **C'est le plus discutable des quatre.** 55 lignes, c'est petit. Si
> tu juges qu'il n'a pas sa place, il fusionne naturellement dans
> `cloud-auth.js` sans rien coûter d'autre que la perte du « un seul
> endroit » ci-dessus. **Je te laisse trancher** : je penche pour le
> garder, à cause de `feedback.js` qui a besoin de `authHeaders` et
> `cloudConfig` sans avoir besoin d'une session.

### `cloud-auth.js` — ~250 lignes · l'identité

**Contenu :** persistance de session (`load/save/clearSession`),
cycle de vie du jeton (`parseSessionFromHash`, `isSessionExpired`,
`decodeJwtSub`, `_refresh`, `getValidSession`), les appels GoTrue
(`sendMagicLink`, `verifyOtpCode`, `_fetchUser`, `handleAuthRedirect`,
`signOut`, `requestEmailChange`), `classifyOtpError`, les helpers OTP
et `sendCooldownRemaining`.

**Raison d'exister :** c'est **le seul endroit qui détient le secret de
session** et le seul qui parle à GoTrue. Deux consommateurs le veulent
sans le reste (`app.js` et `feedback.js`). Et c'est la partie qu'on doit
pouvoir tester sans DOM ni collection — ce que la phase 1 a rendu
possible à grand-peine, précisément parce que tout est dans un fichier.

**Dépendances :** `cloud-http`, `logger`, `session`. **Hors du nœud.**

### `cloud-sync.js` — ~150 lignes · les données

**Contenu :** `buildUpsertRow`, `_requireOnline`, `_requireSession`,
`pushCollection`, `pullCollection`, `cloudDeleteAll`, `fetchCloudMeta`,
`isCloudSignedIn`.

**Raison d'exister :** c'est le seul module qui connaît **la forme de la
ligne distante** — `(user_id, season, data)` — et la seule frontière que
le multi-saisons traverse. Voir §3.

**Dépendances :** `cloud-auth`, `cloud-http`, `storage`, `settings-sync`,
`backup`, `data`, `session`, `logger`. **Reste dans le nœud** (via
`storage` et `data`) — et c'est normal : synchroniser une collection,
c'est par définition dépendre de la collection.

### `cloud-ui.js` — ~270 lignes · la section Réglages

**Contenu :** `cloudSectionHTML`, `_cloudAreaHTML`, `_refreshCloudArea`,
`_startCooldownUi`, `bindCloudSection`, `_setLastBackup`,
`_fillLastBackup`.

**Raison d'exister :** c'est la seule partie qui touche le DOM et
`i18n`. La séparer, c'est ce qui rend les trois autres testables sans
DOM. La phase 1 a démontré le coût de l'inverse : il a fallu écrire un
mini-DOM entier pour atteindre des fonctions d'authentification pures.

**Dépendances :** `cloud-auth`, `cloud-sync`, `i18n`, `icons`,
`otp-input`. **Reste dans le nœud** (via `i18n`).

### Bilan sur le nœud

Aujourd'hui : `cloud.js` est **dans** la composante de 20 modules.
Après : `cloud-http` et `cloud-auth` en **sortent**, `cloud-sync` et
`cloud-ui` y restent. La composante passe de 20 à 21 modules (on en
ajoute deux dedans, on en retire un, et deux naissent dehors).

**Aucun cycle n'est cassé, aucun n'est créé.** Le sens des flèches est
strictement descendant : `ui → sync → auth → http`. Je le vérifierai
mécaniquement à chaque pas de la phase 3 (le script Tarjan est écrit).

**Ce que ça ne fait pas :** ça ne casse pas `i18n ↔ render/pin/badges/stats`.
Aucune découpe de `cloud.js` ne le peut.

---

## 2. Les 16 % de duplication — cas par cas

Le chiffre vient de la lecture Codacy consignée dans `V2-REFACTOR.md`,
que je n'ai pas rejouée. Compté à la main autrement : **environ 150
lignes sur 726 (≈ 21 %) participent à une forme répétée.** Les deux
mesures ne comptent pas la même chose ; l'ordre de grandeur concorde.

### À FACTORISER — vraie répétition

| # | Forme | Occurrences | Pourquoi c'est de la vraie répétition |
|---|---|---|---|
| 1 | `.catch(() => { throw new Error('offline') })` | **8** | Une seule règle, huit copies. Si une copie dérive, un utilisateur en tunnel est déconnecté au lieu d'être averti. → `cloudFetch` |
| 2 | Construction de session depuis une réponse à jeton | **2** | Lignes 176-181 et 232-237 : **identiques au caractère près**, y compris le `expires_in \|\| 3600`. → `_sessionFromToken(d)` |
| 3 | `401/403 → clearSession() + 'not-signed-in'` | **2** | Identique, et c'est une règle de **sécurité**. Elle ne doit pas exister en deux exemplaires susceptibles de diverger. → helper dans `cloud-sync` |
| 4 | Regex d'e-mail `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/` | **2** | Une règle de validation en deux copies finit toujours par en devenir deux règles. → une constante dans `cloud-ui` |
| 5 | `if(msg){ msg.textContent = t(k); msg.className = 'cloud-msg …' }` | **17** | Il existe DÉJÀ un helper `setMsg`, mais seulement pour `cloudSyncMsg`. Les deux autres zones font à la main ce que la troisième fait proprement. → une fabrique `msgSetter(id)` |

### À NE PAS FUSIONNER — ressemblances accidentelles

| # | Forme | Occurrences | Pourquoi les fusionner serait pire |
|---|---|---|---|
| 6 | Le prologue de garde (`deniedForViewer` → `cloudConfig` → `_requireOnline` → `_requireSession`) | **6-8** | **Ils diffèrent là où ça compte.** `sendMagicLink` et `verifyOtpCode` lèvent `'not-configured'` ; `push`/`pull`/`delete`/`emailChange` lèvent `'not-signed-in'` — dire « pas connecté » à quelqu'un qui essaie justement de se connecter serait absurde. Et **seuls 4 des 5** appellent `_requireOnline()` : `fetchCloudMeta` ne l'appelle pas (constat de la phase 1). Un `guard()` unique devrait **choisir** un code d'erreur et **choisir** une politique hors-ligne — c'est-à-dire trancher en douce une asymétrie qu'un test décrit aujourd'hui noir sur blanc. |
| 7 | Les blocs `if(!resp.ok){ log(…); throw new Error(<code>) }` | **7** | Chacun lève un code de **domaine différent** : `push-failed`, `pull-failed`, `delete-failed`, `email-change-failed`, `code-invalid`, `refresh-failed`, `user-failed` — et deux ont une branche 429 en plus. Un `throwFor(resp, code)` générique économiserait trois lignes par site en rendant illisible quelle panne signifie quoi. **On factorise seulement la lecture du corps pour le log**, pas le `throw`. |
| 8 | Les tables `code d'erreur → clé i18n` | **4** (envoi, vérification, changement d'e-mail, synchro) | Elles ont la même **forme** — `Record<string,string>` — et des **vocabulaires disjoints**. Les fusionner en une table mettrait `cloud.no_data` à portée du gestionnaire d'envoi d'e-mail, et rendrait l'ajout d'une erreur de pull capable de casser l'écran de connexion. Quatre domaines, quatre tables, chacune à côté de son gestionnaire. |

### Le critère, énoncé une fois pour toutes

> **« Ces deux endroits changeront-ils TOUJOURS ensemble ? »**
>
> Si oui, c'est une seule décision écrite deux fois : **factoriser**.
> Si non, ce sont deux décisions qui se ressemblent : **laisser**.
>
> Le critère n'est jamais la similarité du texte. Deux blocs identiques
> au caractère près qui répondent à deux questions différentes doivent
> rester séparés ; deux blocs écrits différemment qui répondent à la
> même question doivent fusionner.
>
> Fusionner deux formes qui se ressemblent par accident est **pire que
> la duplication** : la duplication se voit et se corrige, le mauvais
> couplage se propage en silence et se paie à chaque évolution.

Cette règle vaut au-delà de ce chantier — elle s'applique aux trois
autres modules denses (`badges`, `storage`, `tutorial`) quand leur tour
viendra.

Estimation : les cinq factorisations retirent **~70 lignes** ; les huit
`.catch` à eux seuls en valent 40.

---

## 3. Ce que la découpe change pour le multi-saisons

**C'est la raison du chantier — donc la partie qui doit être la plus
concrète.**

### L'obstacle, aujourd'hui

`cloud.js` importe `_currentSeason` depuis `data.js` — une **liaison
vivante**, lue au moment de l'appel, à trois endroits : `pushCollection`,
`pullCollection`, `fetchCloudMeta`. La saison n'est donc **jamais un
argument** : c'est une variable globale ambiante.

Conséquences directes, mesurables aujourd'hui :

- On ne peut pas pousser 2026 sans **basculer l'application** sur 2026.
- On ne peut pas tirer une saison qu'on n'a pas à l'écran.
- On ne peut pas **savoir quelles saisons existent** dans le cloud : la
  requête filtre `season=eq.<courante>`.
- La ligne « dernière sauvegarde » ne peut afficher qu'**une** date.
- Aucun test ne peut couvrir deux saisons sans manipuler l'état global.

Le serveur, lui, est **déjà prêt** : la clé primaire est
`(user_id, season)`.

### Ce que la découpe change

`cloud-sync.js` devient le **seul** module qui mentionne `season`. La
suite du travail multi-saisons y tient alors en une signature :

| Aujourd'hui | Après le multi-saisons |
|---|---|
| `pushCollection()` lit `_currentSeason` | `pushSeason(season)` — le paramètre remplace le global |
| `pullCollection()` idem | `pullSeason(season)` |
| `fetchCloudMeta()` → une date | `listCloudSeasons()` → `[{season, updated_at}]` (retirer le `eq.`) |

Le défaut « saison courante » remonte alors d'un cran, dans
`cloud-ui.js`, **là où il appartient** : c'est un choix d'interface, pas
une règle de synchronisation.

**Pourquoi c'est plus simple qu'aujourd'hui, concrètement :**

1. **Une seule frontière à traverser.** Le changement touche 3 fonctions
   dans un fichier de 150 lignes, au lieu de 3 fonctions perdues dans
   726 qui portent aussi l'authentification et l'interface.
2. **L'import de `data.js` disparaît de la couche synchro** une fois la
   saison paramétrée. `cloud-sync` sortirait alors du nœud lui aussi —
   il ne lui resterait que `storage`. Ce n'est pas promis ici, c'est
   rendu **atteignable**.
3. **Testable sans état global.** `pushSeason(2026)` se teste avec un
   argument ; `pushCollection()` se teste en basculant une variable de
   module partagée par tout le dépôt — et le bug de saison corrigé au
   chantier précédent (`_applyImport` qui écrasait une saison avec une
   autre) est né exactement de là.
4. **L'interface peut enfin poser la question.** Une liste de saisons
   distantes est un appel, pas une refonte.

> **Ce que la découpe ne fait PAS** : elle n'implémente pas le
> multi-saisons, et elle ne change aucune signature. La phase 3 est un
> déplacement à comportement constant. Ce document dit seulement où le
> travail atterrira, et pourquoi il sera petit.

---

## 4. Les deux constats de la phase 1 — où ils atterrissent

### `fetchCloudMeta()` sans `_requireOnline()`

**Atterrit dans `cloud-sync.js`**, à côté des quatre fonctions qui,
elles, appellent la garde. L'asymétrie qui est aujourd'hui invisible
(dispersée dans 726 lignes) devient **visible à l'œil** : cinq fonctions
voisines, quatre avec la garde, une sans.

**Correction après découpe : une ligne.** Mais elle change le
comportement — donc pas dans le même commit que le déplacement, et pas
sans décider ce qu'on veut vraiment : refuser, ou échouer en silence
comme aujourd'hui. Le test de caractérisation qui fige le comportement
actuel devra être **réécrit sciemment**, pas ajusté en passant.

### Le cool-down en variable de module (`_lastOtpSentAt`)

**Atterrit dans `cloud-ui.js`** — c'est là qu'il est utilisé
(`_startCooldownUi`, le gestionnaire d'envoi), et il n'a rien à faire
dans la couche auth.

À noter : `feedback.js` importe `sendCooldownRemaining` (la fonction
**pure**) et détient son propre `_lastSentAt`. Le motif « helper pur
partagé, état local à chaque consommateur » est donc **déjà celui du
dépôt** — c'est le bon, et il est simplement mal placé ici.

`sendCooldownRemaining` reste dans `cloud-auth.js` (pure, partagée) ;
l'état descend dans `cloud-ui.js`.

**Correction après découpe : facile, et sans changer le comportement.**
L'état devient une variable du module d'UI, avec un `_resetCooldown()`
exporté pour les tests — ce qui supprime le pilotage d'horloge que la
phase 1 a dû mettre en place. À faire dans un commit séparé, après.

---

## 5. Ce que ça donne sur la métrique — et pourquoi on s'en fiche

Estimation grossière de la complexité après découpe : `ui` ≈ 90,
`auth` ≈ 80, `sync` ≈ 50, `http` ≈ 14, pour 234 aujourd'hui.

**Deux des quatre resteront au-dessus du seuil.** C'est attendu et ce
n'est pas un échec : `V2-REFACTOR.md` a déjà tranché que la jauge ne
tombera pas sous 10 % honnêtement, et que le découpage cosmétique est
refusé. Aucun des quatre modules ci-dessus n'existe pour ce chiffre —
chacun a sa raison écrite plus haut, et `feedback.js` en est la preuve
vivante pour deux d'entre eux.

---

## 6. Ordre d'exécution proposé (phase 3)

Un déplacement par commit, `npm test` vert entre chaque, plus la
détection de cycles à chaque pas. `cloud.js` reste un **baril de
ré-export** pendant toute la phase, pour que les trois consommateurs ne
bougent pas — donc chaque pas est un pur déplacement.

1. `cloud-http.js` — config + `authHeaders` + `cloudFetch`. Les 8
   `.catch` deviennent un seul.
2. `cloud-auth.js` — session, jetons, GoTrue. Factorisation n°2
   (`_sessionFromToken`).
3. `cloud-sync.js` — push/pull/delete/meta. Factorisation n°3 (401/403).
4. `cloud-ui.js` — la section Réglages. Factorisations n°4 et n°5.
5. Consommateurs (`app`, `account`, `feedback`) pointés sur les vrais
   modules ; suppression du baril.

**Étape 5 en question :** garder le baril `cloud.js` en permanence est
défendable (surface publique stable). Je propose de le **supprimer** —
sinon `feedback.js` continue d'importer un fichier qui, lui, importe
tout le reste, et on perd exactement le bénéfice visé. À confirmer.

Si un bug apparaît en route : **signalé, pas corrigé dans le commit du
déplacement.**

## 7. Vérification finale (Playwright)

Sur l'app servie en local, avec le vrai Supabase : flux OTP de bout en
bout, un push, un pull, et une session expirée forcée (en écrasant
`expires_at` dans `localStorage`). Un refactor de couche réseau qui
« passe les tests » et casse en production ne vaut rien.
