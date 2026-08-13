-- ══════════════════════════════════════════════════════════
-- LES DEUX TABLES
--
-- Extrait de information_schema.columns et pg_constraint le
-- 2026-08-13. Aucune colonne inventée : ce fichier est une copie, pas
-- une reconstruction à partir de ce que le client envoie.
--
-- ⚠️ Créer ces tables ne suffit PAS. Tant que 02-rls.sql n'a pas
-- tourné, elles sont lisibles et modifiables par n'importe quel
-- porteur de la clé anon — qui est publique par conception. Entre les
-- deux fichiers, la porte est ouverte : les enchaîner.
-- ══════════════════════════════════════════════════════════

-- ── collections ───────────────────────────────────────────
-- Une ligne par (utilisateur, saison). La clé primaire COMPOSITE est
-- ce qui rend le multi-saisons possible sans table supplémentaire, et
-- ce qui fait qu'un push est un upsert : PostgREST résout le conflit
-- sur cette clé (Prefer: resolution=merge-duplicates côté client).
--
-- `data` est un jsonb opaque au serveur : la forme appartient à
-- l'application, documentée dans docs/DATA-FORMAT.md. Le serveur ne la
-- valide pas et n'a pas à la connaître — ce qui veut dire aussi qu'une
-- migration de format se fait côté client, jamais ici.
--
-- ON DELETE CASCADE : quand un compte disparaît de auth.users, ses
-- collections partent avec lui. La zone danger de l'app supprime déjà
-- explicitement, mais une suppression de compte faite ailleurs (côté
-- Supabase) ne doit pas laisser de lignes orphelines.
create table if not exists public.collections (
  user_id     uuid        not null references auth.users(id) on delete cascade,
  season      integer     not null,
  data        jsonb       not null,
  updated_at  timestamptz not null default now(),
  constraint collections_pkey primary key (user_id, season)
);

-- ── feedback ──────────────────────────────────────────────
-- Les quatre CHECK ci-dessous sont la VRAIE validation. Le client
-- vérifie les mêmes bornes (feedback.js : FEEDBACK_MIN/MAX, la liste
-- des types), mais un client se contourne — c'est ici que ça tient.
--
-- `btrim` dans la contrainte de longueur n'est pas cosmétique : sans
-- lui, mille espaces passeraient pour un message.
--
-- app_version et lang sont NULLABLES : un retour reste recevable même
-- si le client ne les envoie pas. Ce sont des aides au tri, pas des
-- données dont dépend le retour lui-même.
create table if not exists public.feedback (
  id           uuid        not null default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  type         text        not null,
  message      text        not null,
  app_version  text,
  lang         text,
  constraint feedback_pkey primary key (id),
  constraint feedback_type_check
    check (type in ('suggestion', 'bug', 'other')),
  constraint feedback_message_check
    check (char_length(btrim(message)) between 3 and 1000),
  constraint feedback_app_version_check check (char_length(app_version) <= 20),
  constraint feedback_lang_check        check (char_length(lang) <= 5)
);

-- ── Index ─────────────────────────────────────────────────
-- Il n'y en a AUCUN au-delà des deux index de clé primaire, et c'est
-- un constat, pas un oubli à corriger : les seules lectures sont
-- « mes lignes », déjà servies par la clé primaire de collections.
-- feedback n'est lu que par son auteur, sur des volumes minuscules.
-- Ajouter un index sur feedback(user_id, created_at) deviendra utile
-- le jour où le throttle comptera sur des milliers de lignes.
