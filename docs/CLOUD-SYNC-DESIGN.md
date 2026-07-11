# Cloud sync — document de conception (AUCUN code écrit)

> **Statut : IMPLÉMENTÉ** (variante minimaliste recommandée au § 3 : push/pull manuel,
> Supabase REST pur, lien magique → code OTP après retour d'usage, pas de chiffrement E2E).
> Voir `cloud.js`, `cloud-config.js` et le README. Ce document est conservé comme trace des
> options étudiées et des décisions prises.

**Rappel du contexte.** App 100 % statique sur GitHub Pages (aucun serveur à nous), offline-first
(SW cache-first), zéro dépendance runtime, collection dans `localStorage` scopée par saison.
Existant pertinent : `collectionSnapshot()` (instantané sérialisé), export/import JSON avec
dialogue **fusionner / remplacer**, code de sauvegarde compressé (`CompressionStream` +
base64url) et QR (`backup.js`), compteur `f1uno_changes_since_backup`.

---

## 1. Options de backend

### A. Supabase (Postgres + Auth + API REST auto-générée)
| Critère | Évaluation |
|---|---|
| Effort | **Moyen.** Auth (magic link e-mail) + une table `collections` + règles RLS. L'API REST (PostgREST) et l'auth (GoTrue) sont de simples endpoints HTTP : utilisables en **`fetch()` pur, sans SDK**. |
| Coût | Niveau gratuit : 500 Mo de base, 50 000 utilisateurs actifs/mois, pause du projet après 7 jours d'inactivité (réveil à la 1ʳᵉ requête, latence ponctuelle). Largement suffisant : une collection ≈ 2–10 Ko. |
| Ce que ça impose à l'utilisateur | Créer un compte (e-mail + lien magique, pas de mot de passe nécessaire). |
| Impact « zéro dépendance » | **Nul si on refuse le SDK** (~30 Ko gzip évités) : appels `fetch()` vers l'API REST + endpoints GoTrue documentés. Le code sync peut vivre dans un module `sync.js` chargé **à la demande** (import dynamique) uniquement quand l'option est activée. GitHub Pages reste 100 % statique ; seule une URL + une clé anonyme publique (conçue pour être publiée) figurent dans le code. |

### B. Firebase (Firestore + Auth)
| Critère | Évaluation |
|---|---|
| Effort | Moyen-élevé. Le SDK modulaire reste lourd (~150–250 Ko) ; l'API REST de Firestore existe mais son auth (échange de tokens OAuth2/Identity Platform) est nettement plus pénible en `fetch()` pur que GoTrue. |
| Coût | Plan Spark gratuit généreux (1 Gio, 50 k lectures/j). Compte **Google** requis côté console ; côté utilisateur : e-mail/mot de passe, Google Sign-In, ou auth anonyme (mais l'anonyme ne survit pas à un changement d'appareil — inutile pour du multi-appareils). |
| Ce que ça impose à l'utilisateur | Un compte (souvent Google). |
| Impact « zéro dépendance » | Réaliste seulement **avec** le SDK → casse l'esprit du projet, même isolé en chargement différé. |

### C. GitHub Gist (token personnel collé par l'utilisateur)
| Critère | Évaluation |
|---|---|
| Effort | **Faible.** API REST simple (`GET/PATCH /gists/:id`), `fetch()` pur, zéro compte tiers à administrer. |
| Coût | Gratuit, quotas API très au-dessus du besoin. |
| Ce que ça impose à l'utilisateur | Avoir un compte GitHub **et** générer un *fine-grained PAT* scope `gist`, puis le coller dans l'app (stocké en `localStorage`). UX très « développeur » ; inadaptée à un collectionneur lambda. |
| Impact « zéro dépendance » | Nul (fetch pur). Mais **risque sécurité réel** : un token à demeure dans `localStorage` d'un site public ; s'il fuit, il donne accès à *tous* les gists du compte. |

### D. « Cloud de l'utilisateur » sans backend (fichier dans Drive/iCloud via export)
Pas un vrai sync : c'est déjà couvert par l'export JSON (l'utilisateur range le fichier où il
veut). Mentionné pour l'honnêteté : c'est l'option **zéro effort / zéro infra** qui existe déjà.

### E. Écartées d'office
- **PouchDB/CouchDB** : élégant pour la réplication, mais grosse lib cliente + serveur CouchDB à
  héberger → contraire aux deux principes du projet.
- **WebDAV (Nextcloud…)** : CORS imprévisible selon l'hébergeur, support grand public faible.

## 2. Compatibilité GitHub Pages (pas d'infra à gérer)

Toutes les options retenues ci-dessus fonctionnent depuis un site statique : ce sont des API
HTTPS avec CORS ouvert, appelées depuis le navigateur. **Aucune n'exige un serveur à nous.**
Deux vigilances spécifiques à notre SW :
- les requêtes API ne doivent **jamais** passer par le cache du SW (elles sont cross-origin →
  elles tombent aujourd'hui dans le cache *stale-while-revalidate* runtime ! Il faudra exclure le
  domaine API du handler `fetch`) ;
- la clé « anonyme » Supabase est publique par conception (la sécurité vient des règles RLS), donc
  la committer ne viole pas l'hygiène du repo public.

## 3. Recommandation — et est-ce que ça vaut le coup ?

**Honnêtement : pour l'usage actuel, probablement pas (pas encore).** Le transfert
code + QR couvre déjà très bien le cas « je change d'appareil » et « je copie ma collection sur
la tablette » — quelques secondes, zéro compte, zéro serveur, zéro risque de fuite. Un vrai sync
n'apporte de la valeur que si **tu édites régulièrement sur plusieurs appareils** (ex. le
téléphone à la bourse d'échange, l'ordi à la maison) et que tu veux la convergence automatique
sans y penser. Si cette situation est occasionnelle, la complexité (compte, conflits, états
partiels, support) dépasse le gain.

**Si on y va quand même** : **Supabase en REST pur** (option A), parce que c'est la seule option
qui combine : compatible statique, aucun SDK (principe zéro dépendance préservé), auth simple
pour un non-développeur (lien magique), coût nul à notre échelle, et données requêtables si l'app
évolue. Le Gist est séduisant techniquement mais son modèle de sécurité (PAT dans localStorage)
et son UX le disqualifient pour un utilisateur non technique.

**Alternative minimaliste à considérer d'abord** : un bouton « Sauvegarder dans le cloud /
Restaurer » (push/pull manuel du snapshot existant, sans sync automatique). 80 % de la valeur,
20 % de la complexité — pas de résolution de conflits fine, on réutilise le dialogue
fusionner/remplacer tel quel.

## 4. Modèle de synchronisation proposé (si go)

- **Unité de sync : la saison.** Un document par `(user, season)` contenant le même payload que
  `collectionSnapshot()` (owned + badges manuels + historique), plus `updated_at` et un
  `device_id` informatif. Les préférences (thème, langue, police) ne se synchronisent **pas**
  (choix par appareil).
- **Détection de changement :** on réutilise `f1uno_changes_since_backup` + un
  `f1uno_sync_last_push` par saison. Pull au lancement (si en ligne et activé), push différé
  (debounce ~30 s après la dernière modification) et bouton manuel.
- **Conflits :** v1 pragmatique — comparaison de `updated_at` du serveur avec celui du dernier
  pull local :
  - serveur inchangé depuis notre dernier pull → push direct (fast-forward) ;
  - serveur modifié **et** local modifié → **dialogue explicite réutilisant le flux existant** :
    *fusionner* (la fusion actuelle de l'import : union des possessions, max des quantités,
    OR des flags) ou *garder local / garder serveur*. Pas de fusion silencieuse par carte en v1 ;
    une fusion à granularité carte exigerait des timestamps par entrée (changement de schéma) —
    envisageable en v2 seulement si le besoin est prouvé.
- **Hors-ligne / opt-in :** l'app reste 100 % fonctionnelle sans compte. Le sync est une section
  de Réglages désactivée par défaut ; sans réseau, tout fonctionne et le push repart à la
  reconnexion. Se déconnecter n'efface rien en local.

## 5. Sécurité & vie privée

- **Données concernées :** la collection (peu sensible) + l'e-mail du compte (donnée personnelle).
- **Où :** Supabase permet de choisir la région du projet (ex. `eu-central-1`, Francfort) —
  pertinent RGPD.
- **Isolation :** règles RLS = chaque utilisateur ne lit/écrit que ses lignes.
- **Chiffrement de bout en bout (option)** : puisque `backup.js` sait déjà compresser/encoder le
  snapshot, on peut chiffrer le blob en AES-GCM (WebCrypto) avec une phrase de passe **avant**
  l'envoi — le serveur ne voit alors qu'un ciphertext. Coût : si la phrase est perdue, la
  sauvegarde cloud est irrécupérable (l'app locale reste intacte). À décider (§ décisions).
- **Consentement :** activation explicite avec un texte clair (« ta collection et ton e-mail
  seront stockés chez X en région Y ; désactivable ; suppression du compte = suppression des
  données »), et un bouton « supprimer mes données cloud ».

## 6. Découpage en étapes (chaque étape = un prompt, validation avant la suivante)

1. **Socle sans réseau** : module `sync.js` isolé (import dynamique), abstraction
   `pushSnapshot()/pullSnapshot()` avec un faux backend en mémoire, réutilisation de
   `collectionSnapshot()`/import ; exclusion du domaine API dans `sw.js` ; tests unitaires du
   protocole de décision (fast-forward / conflit). *Validation : le modèle de conflit te convient
   sur des scénarios rejoués.*
2. **Backend réel** : projet Supabase (région UE), table + RLS, auth lien magique en REST pur ;
   section Réglages (connexion/déconnexion, i18n ×7). *Validation : compte créé, login OK sur
   deux navigateurs.*
3. **Push/pull manuel** : boutons « Envoyer / Récupérer », dialogue de conflit
   fusionner/local/serveur. *Validation : scénario deux appareils réel.*
4. **Sync automatique** : pull au lancement, push debouncé, indicateur d'état discret,
   gestion multi-onglets (verrou `localStorage` ou `BroadcastChannel`).
5. **Option E2E** (si retenue) : chiffrement AES-GCM par phrase de passe.
6. **Finitions** : suppression des données cloud, docs README, tests, bump SW.

## 7. Risques et pièges

- **SW & API** : oublier d'exclure le domaine API du cache runtime → réponses périmées servies
  hors-ligne comme si elles étaient fraîches (piège n° 1 dans cette base de code).
- **Horloges locales** : la stratégie LWW/fast-forward doit comparer les `updated_at` **serveur**
  (générés côté Postgres), jamais l'horloge du client.
- **Multi-onglets / multi-appareils simultanés** : deux push concurrents → utiliser une condition
  (`If-Match`/version) côté PostgREST pour détecter l'écrasement.
- **Pérennité du gratuit** : les niveaux gratuits changent (pause après inactivité chez Supabase,
  historique de Heroku…). Atténuation : le cloud n'est **jamais** la seule copie — le local reste
  la source primaire, l'export JSON reste en place.
- **Support utilisateur** : un compte = e-mails de lien magique, délivrabilité, « je n'ai pas reçu
  le mail »… coût humain à ne pas sous-estimer.
- **Dérive du périmètre** : le sync appelle vite « partage de collection entre amis », «
  classements »… À refuser tant que le cœur (une personne, ses appareils) n'est pas stable.
- **Clé anonyme committée** : normale chez Supabase mais elle attire des scanners ; les règles
  RLS doivent être testées comme du code (elles le seront en étape 2).

---

## Décisions attendues avant toute implémentation

1. **Go / no-go** : le besoin multi-appareils régulier existe-t-il vraiment chez toi, ou le
   code + QR suffit-il ? (Ma lecture honnête : § 3.)
2. Si go, **portée v1** : sync automatique complet, ou d'abord l'alternative minimaliste
   « push/pull manuel » ?
3. **Backend** : Supabase REST pur (recommandé) / Gist / autre ?
4. **Auth** : lien magique e-mail (recommandé) / autre ?
5. **Politique de conflit** : dialogue fusionner/local/serveur (recommandé en v1) — OK ?
6. **Chiffrement E2E par phrase de passe** : oui (confidentialité maximale, risque de perte) ou
   non (plus simple, le serveur voit le JSON) ?
7. **Région d'hébergement** : UE (Francfort) ?
8. Validation du **découpage en 6 étapes** (§ 6).
