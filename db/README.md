# `db/` — le schéma Supabase, versionné

Ce dossier contient ce qui protège les données de **tous** les
utilisateurs : les politiques RLS, les contraintes, et les déclencheurs.

## Pourquoi ce dossier existe

Jusqu'ici, tout ça n'existait **que dans le dashboard Supabase**.
`find . -name "*.sql"` ne renvoyait rien. Le README décrivait les règles
avec précision — mais une description n'est ni relisible en diff, ni
restaurable après une fausse manœuvre, ni testable.

Pour deux utilisateurs, c'était théorique. Pour ouvrir l'app, c'était le
risque principal : **la sécurité de tous les comptes reposait sur des
règles que personne ne pouvait relire dans le dépôt**, dont la moindre
modification accidentelle était invisible et irréversible.

## Ce que ces fichiers sont — et ne sont pas

**Ce sont des extraits fidèles**, obtenus par `pg_policies`,
`pg_constraint` et `pg_get_functiondef`, pas des reconstructions à partir
du comportement observé. La différence compte : un fichier qui
*ressemble* au schéma donnerait la confiance sans la vérification —
exactement le défaut que ce dépôt traque partout ailleurs.

**Ce n'est pas un système de migrations.** Il n'y a ni numéro de
version, ni ordre d'application garanti, ni retour arrière. C'est une
photographie relisible et rejouable sur un projet neuf. Le jour où le
schéma évoluera souvent, il faudra autre chose ; aujourd'hui il ne
change presque jamais.

## Ce qui est expurgé, et comment le remplir

Deux valeurs ne peuvent pas vivre dans un dépôt public :

| Marqueur | Quoi | Où le renseigner |
|---|---|---|
| `<ADRESSE_MAINTENEUR>` | L'adresse qui reçoit les notifications de feedback | Directement dans la fonction, côté dashboard |
| `vault.decrypted_secrets` → `resend_api_key` | La clé API Resend | **Déjà** dans le Vault Supabase — le SQL ne fait que la LIRE par son nom |

Le second point mérite d'être souligné : la clé n'apparaît nulle part
dans ces fichiers, même expurgée. Elle est lue à l'exécution depuis le
Vault, par son nom. C'est la bonne façon de faire, et c'est pourquoi ce
dossier peut être public.

> ⚠️ **Ne jamais exécuter `select * from vault.decrypted_secrets`** et
> ne jamais coller sa sortie où que ce soit. Si ça arrive, la clé est à
> considérer comme exposée et à faire tourner.

## Ce qui manque encore — et pourquoi ce n'est pas versionné

**`03-functions.sql` n'existe pas encore.** Les trois déclencheurs ont
été extraits verbatim, mais le **corps** des fonctions qu'ils appellent
ne l'a pas été : ce qui en a été transmis était un résumé du
comportement, pas la sortie de `pg_get_functiondef`.

Recoller une reconstruction fidèle à ce résumé produirait un fichier qui
*ressemble* au schéma sans en être un — la confiance sans la
vérification, exactement ce que ce dossier existe pour supprimer. Le
fichier arrivera d'un bloc, complet, ou n'arrivera pas.

Les trois déclencheurs, en attendant qu'ils aient leurs fonctions :

```sql
-- BEFORE INSERT OR UPDATE : la date est posée aussi à la création,
-- sinon une ligne jamais modifiée n'en aurait pas.
CREATE TRIGGER collections_set_updated_at
  BEFORE INSERT OR UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- BEFORE INSERT : la limite doit refuser AVANT l'écriture, sinon elle
-- compterait des lignes déjà insérées.
CREATE TRIGGER feedback_throttle
  BEFORE INSERT ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION feedback_throttle();

-- AFTER INSERT : la notification part une fois la ligne sûre. L'ordre
-- entre les deux n'est pas un détail — le throttle refuse d'abord.
CREATE TRIGGER feedback_email
  AFTER INSERT ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION notify_feedback_email();
```

La requête qui manque :

```sql
select p.proname, pg_get_functiondef(p.oid)
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' order by p.proname;
```

Deux choses à ne pas perdre en recollant `notify_feedback_email()` :
l'**échappement `& < >`** (le message d'un utilisateur entre dans un
corps HTML) et le **`return new` du bloc `exception`** (c'est lui qui
garantit qu'un e-mail raté ne bloque jamais l'enregistrement du retour).

## Rejouer sur un projet neuf

Dans l'ordre, depuis le SQL Editor :

1. `01-tables.sql` — les deux tables et leurs contraintes
2. `02-rls.sql` — activation de RLS **et** les six politiques
3. `03-functions.sql` — les trois fonctions et leurs déclencheurs *(à venir)*

Puis, hors SQL : créer le secret `resend_api_key` dans le Vault, et
remplacer `<ADRESSE_MAINTENEUR>` dans `notify_feedback_email()`.

**L'étape 2 n'est pas optionnelle et son ordre non plus.** Une table
créée sans RLS est lisible par n'importe quel porteur de la clé anon —
qui est publique par conception, dans `cloud-config.js`. Entre la
création de la table et l'activation de RLS, la porte est ouverte.

## Le garde-fou automatique

[`tests/db-rls.test.js`](../tests/db-rls.test.js) lit ces fichiers et
échoue si :

- une des deux tables perd `auth.uid() = user_id` ;
- une politique d'écriture (`insert`, `update`) perd son `with_check` —
  la faute classique : filtrer la lecture et laisser écrire au nom d'un
  autre ;
- `enable row level security` disparaît pour une table ;
- une adresse e-mail en clair réapparaît.

Ce test ne parle pas au serveur : il vérifie que **le fichier versionné
dit toujours ce qu'il doit dire**. Que le serveur soit conforme au
fichier reste une vérification manuelle, décrite ci-dessous.

## Vérifier que le serveur correspond encore

Les deux requêtes qui ont produit ces fichiers, à relancer pour comparer :

```sql
select tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename in ('collections','feedback')
order by tablename, cmd, policyname;

select relname, relrowsecurity, relforcerowsecurity
from pg_class where relname in ('collections','feedback');
```
