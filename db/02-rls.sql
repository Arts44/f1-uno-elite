-- ══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY — l'isolation entre utilisateurs
--
-- Extrait de pg_policies le 2026-08-13. Six politiques, toutes
-- PERMISSIVE, toutes pour le rôle `authenticated`, toutes bâties sur
-- la même condition : auth.uid() = user_id.
--
-- CE QUI SE JOUE ICI. La clé anon est PUBLIQUE par conception — elle
-- est dans cloud-config.js, lisible par quiconque ouvre l'app. Ce qui
-- protège les données n'est donc pas le secret de la clé, mais ces
-- six lignes. Elles sont la sécurité, à elles seules.
--
-- POURQUOI `with_check` EN PLUS DE `qual`, et pourquoi c'est le point
-- le plus important du fichier : `qual` filtre ce qu'on peut LIRE,
-- `with_check` contraint ce qu'on peut ÉCRIRE. Une politique d'insert
-- sans with_check laisse un utilisateur authentifié écrire une ligne
-- au nom d'un AUTRE — et ça ne se voit pas en lecture, puisque la
-- ligne écrite ne lui reviendra jamais. C'est la faute classique de
-- RLS, et c'est celle qu'un test du dépôt refuse désormais.
--
-- Vérifié depuis l'extérieur, avec la seule clé anon :
--   GET  /rest/v1/collections  → 200 []      aucune ligne ne fuit
--   GET  /rest/v1/feedback     → 200 []      idem
--   POST /rest/v1/collections  → 401, 42501  « new row violates RLS »
-- ══════════════════════════════════════════════════════════

alter table public.collections enable row level security;
alter table public.feedback    enable row level security;

-- ── collections : lecture, écriture, mise à jour, suppression ──
create policy collections_select_own on public.collections
  for select to authenticated
  using (auth.uid() = user_id);

create policy collections_insert_own on public.collections
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy collections_update_own on public.collections
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy collections_delete_own on public.collections
  for delete to authenticated
  using (auth.uid() = user_id);

-- ── feedback : insertion et relecture de SES retours ──
-- Pas de update ni de delete, et c'est un choix : un retour envoyé
-- n'est pas modifiable après coup. Le supprimer n'aurait pas de sens
-- non plus — l'auteur peut demander, la suppression se fait côté
-- serveur, pas depuis un client qu'on ne contrôle pas.
create policy feedback_select_own on public.feedback
  for select to authenticated
  using (auth.uid() = user_id);

create policy feedback_insert_own on public.feedback
  for insert to authenticated
  with check (auth.uid() = user_id);
