-- ══════════════════════════════════════════════════════════
-- FONCTIONS ET DÉCLENCHEURS
--
-- Extrait verbatim de pg_get_functiondef et pg_get_triggerdef, re-extrait
-- le 2026-08-13 après la bascule vers le domaine vérifié `arts44.dev`.
-- UNE SEULE substitution : l'adresse du DESTINATAIRE des notifications,
-- remplacée par <ADRESSE_MAINTENEUR>. Tout le reste est le code
-- réellement exécuté par la base.
--
-- L'EXPÉDITEUR, LUI, EST UNE VRAIE VALEUR : `noreply@arts44.dev` est
-- publique par nature — elle voyage dans l'en-tête de chaque e-mail
-- envoyé. L'expurger n'aurait rien protégé et aurait rendu le fichier
-- non rejouable.
--
-- LA CLÉ RESEND N'EST PAS ICI, ET NE PEUT PAS Y ÊTRE : la fonction la
-- lit à l'exécution dans le Vault, par son nom (`resend_api_key`).
-- C'est ce choix — fait avant ce dossier — qui rend le versionnement
-- possible sans expurger quoi que ce soit d'autre.
--
-- POUR REJOUER SUR UN PROJET NEUF :
--   1. créer le secret `resend_api_key` dans le Vault ;
--   2. remplacer <ADRESSE_MAINTENEUR> ci-dessous ;
--   3. l'extension pg_net doit être activée (schéma `extensions`).
-- ══════════════════════════════════════════════════════════

-- ── set_updated_at() ──────────────────────────────────────
-- Le SERVEUR est propriétaire de updated_at. Le client ne l'envoie
-- jamais (voir rowFor() dans cloud-sync.js) : une horloge de client
-- n'est pas une source de vérité, et deux appareils désaccordés
-- produiraient un « plus récent » faux.
CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at := now();
  return new;
end;
$function$;

-- ── feedback_throttle() ───────────────────────────────────
-- C'EST ÇA, LA PROTECTION. Le cool-down du client est une courtoisie :
-- il se contourne en rechargeant la page. Cinq retours par heure et par
-- utilisateur, comptés côté base, refusés AVANT l'écriture (le
-- déclencheur est BEFORE INSERT — en AFTER, il compterait des lignes
-- déjà insérées).
--
-- SECURITY DEFINER est nécessaire : la fonction doit compter TOUTES les
-- lignes de l'utilisateur, y compris celles que la RLS lui cacherait
-- dans un autre contexte. `SET search_path TO 'public'` va avec — sans
-- lui, une fonction SECURITY DEFINER est vulnérable à un détournement
-- de résolution de noms.
--
-- L'exception 'rate_limited' remonte telle quelle au client, qui la
-- mappe sur un code typé (feedback.js).
CREATE OR REPLACE FUNCTION public.feedback_throttle()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if (select count(*) from public.feedback
      where user_id = new.user_id
        and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'rate_limited';
  end if;
  return new;
end $function$;

-- ── notify_feedback_email() ───────────────────────────────
-- Trois décisions à ne pas défaire en la modifiant :
--
--   · `if api_key is null then return new` — pas de clé, pas d'e-mail,
--     mais le retour est quand même enregistré ;
--   · l'échappement & < > du message et de l'adresse — ce sont des
--     saisies utilisateur qui entrent dans un corps HTML ;
--   · `exception when others then return new` — un envoi raté ne doit
--     JAMAIS bloquer l'insertion. C'est la ligne qui garantit qu'un
--     problème chez Resend ne fait pas perdre l'avis d'un utilisateur.
--
-- LES QUATRE CHAMPS QUI VIENNENT DU CLIENT SONT ÉCHAPPÉS, et il a fallu
-- versionner ce fichier pour s'en apercevoir : `app_version` et `lang`
-- entraient dans le HTML tels quels, contrairement au message et à
-- l'adresse. Les CHECK les bornent à 20 et 5 caractères — de quoi
-- exclure un script, pas du balisage : `<b>x</b>` tient en 8. Corrigé
-- dans la base d'abord, puis re-extrait ici (point n°13).
--
-- Un test refuse désormais qu'un seul des quatre entre dans le corps
-- HTML sans passer par un replace. Il ne cherche pas le mot
-- « échappement » : il vérifie que chaque safe_* est bien construit par
-- replace() ET qu'aucune source brute n'apparaît dans le HTML.
CREATE OR REPLACE FUNCTION public.notify_feedback_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  api_key text;
  user_email text;
  safe_msg text;
  safe_mail text;
  safe_ver text;
  safe_lang text;
  type_label text;
begin
  select decrypted_secret into api_key
    from vault.decrypted_secrets where name = 'resend_api_key' limit 1;
  if api_key is null then return new; end if;

  select email into user_email from auth.users where id = new.user_id limit 1;

  -- échappement HTML : tout ce qui vient du client
  safe_msg  := replace(replace(replace(new.message, '&','&amp;'), '<','&lt;'), '>','&gt;');
  safe_mail := replace(replace(replace(coalesce(user_email,'?'), '&','&amp;'), '<','&lt;'), '>','&gt;');
  safe_ver  := replace(replace(replace(coalesce(new.app_version,'?'), '&','&amp;'), '<','&lt;'), '>','&gt;');
  safe_lang := replace(replace(replace(coalesce(new.lang,'?'), '&','&amp;'), '<','&lt;'), '>','&gt;');

  type_label := case new.type
    when 'suggestion' then '💡 Suggestion'
    when 'bug'        then '🐞 Bug'
    else                   '💬 Autre'
  end;

  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || api_key,
      'Content-Type', 'application/json'),
    body := jsonb_build_object(
      'from', 'F1 UNO Élite <noreply@arts44.dev>',
      'to', jsonb_build_array('<ADRESSE_MAINTENEUR>'),
      'subject', '[F1 UNO Élite] Nouvel avis — ' || type_label,
      'html',
        '<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #eee">'
        || '<div style="background:#E10600;color:#fff;padding:16px 20px;font-size:18px;font-weight:700">🏁 F1 UNO Élite — Nouvel avis</div>'
        || '<div style="padding:20px">'
        || '<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#111;white-space:pre-wrap">' || safe_msg || '</p>'
        || '<table style="width:100%;font-size:13px;color:#666;border-top:1px solid #eee;padding-top:12px">'
        || '<tr><td style="padding:3px 0;font-weight:600">Type</td><td>' || type_label || '</td></tr>'
        || '<tr><td style="padding:3px 0;font-weight:600">De</td><td>' || safe_mail || '</td></tr>'
        || '<tr><td style="padding:3px 0;font-weight:600">Version</td><td>' || safe_ver || '</td></tr>'
        || '<tr><td style="padding:3px 0;font-weight:600">Langue</td><td>' || safe_lang || '</td></tr>'
        || '<tr><td style="padding:3px 0;font-weight:600">Date</td><td>' || to_char(new.created_at, 'DD/MM/YYYY HH24:MI') || '</td></tr>'
        || '<tr><td style="padding:3px 0;font-weight:600">ID</td><td style="font-family:monospace;font-size:11px">' || new.id || '</td></tr>'
        || '</table></div></div>')
  );
  return new;
exception when others then
  return new;
end $function$;

-- ══════════════════════════════════════════════════════════
-- LES TROIS DÉCLENCHEURS — extraits verbatim de pg_get_triggerdef
-- ══════════════════════════════════════════════════════════

-- BEFORE INSERT OR UPDATE : la date est posée aussi à la création,
-- sinon une ligne jamais modifiée n'en aurait pas.
CREATE TRIGGER collections_set_updated_at
  BEFORE INSERT OR UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- BEFORE INSERT : la limite refuse AVANT l'écriture.
CREATE TRIGGER feedback_throttle
  BEFORE INSERT ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION feedback_throttle();

-- AFTER INSERT : la notification part une fois la ligne sûre. L'ordre
-- entre les deux n'est pas un détail — le throttle refuse d'abord.
CREATE TRIGGER feedback_email
  AFTER INSERT ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION notify_feedback_email();
