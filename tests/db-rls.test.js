/* ══════════════════════════════════════════════════════════
   LE SCHÉMA VERSIONNÉ DIT-IL TOUJOURS CE QU'IL DOIT DIRE ?

   Ce que ce test garde, et pourquoi ça mérite un test. La clé anon de
   Supabase est PUBLIQUE par conception : elle est dans cloud-config.js,
   lisible par quiconque ouvre l'app. Ce qui protège les collections et
   les retours des utilisateurs n'est donc pas le secret d'une clé, mais
   six lignes de politique RLS. Elles SONT la sécurité.

   CE QUE CE TEST NE FAIT PAS. Il ne parle pas au serveur. Il vérifie
   que le fichier versionné n'a pas perdu ce qui compte — pas que le
   serveur lui ressemble encore. Cette seconde vérification est manuelle
   et documentée dans db/README.md ; la confondre avec celle-ci serait
   se croire protégé par une lecture de fichier.

   LA FAUTE QU'IL CHERCHE EN PRIORITÉ : une politique d'écriture sans
   `with_check`. `using` filtre ce qu'on LIT, `with_check` contraint ce
   qu'on ÉCRIT. Sans le second, un utilisateur authentifié peut insérer
   une ligne au nom d'un autre — et ça ne se voit jamais en lecture,
   puisque la ligne écrite ne lui reviendra pas. C'est le trou classique
   de RLS, silencieux par nature.
   ══════════════════════════════════════════════════════════ */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const lire = f => readFileSync(new URL(`../db/${f}`, import.meta.url), 'utf8');
const rls = lire('02-rls.sql');
const TABLES = ['collections', 'feedback'];

describe('db/ — les politiques RLS restent en place', () => {
  test('le fichier existe et n’est pas vide', () => {
    assert.ok(rls.trim().length > 0, 'db/02-rls.sql est vide');
  });

  for(const table of TABLES){
    test(`${table} — RLS est ACTIVÉE`, () => {
      const re = new RegExp(`alter table\\s+public\\.${table}\\s+enable row level security`, 'i');
      assert.match(rls, re,
        `sans cette ligne, les politiques existent mais ne s'appliquent pas — `
        + 'la table est lisible par n\'importe quel porteur de la clé anon');
    });

    test(`${table} — chaque politique est liée à auth.uid()`, () => {
      const politiques = [...rls.matchAll(
        new RegExp(`create policy\\s+(\\w+)\\s+on\\s+public\\.${table}([\\s\\S]*?);`, 'gi'))];
      assert.ok(politiques.length > 0, `aucune politique déclarée sur ${table}`);
      for(const [, nom, corps] of politiques){
        assert.match(corps, /auth\.uid\(\)\s*=\s*user_id/,
          `${nom} : la condition d'appartenance a disparu — la table devient publique`);
      }
    });

    test(`${table} — toute politique d’ÉCRITURE porte un with check`, () => {
      const politiques = [...rls.matchAll(
        new RegExp(`create policy\\s+(\\w+)\\s+on\\s+public\\.${table}([\\s\\S]*?);`, 'gi'))];
      for(const [, nom, corps] of politiques){
        if(!/for\s+(insert|update)/i.test(corps)) continue;
        assert.match(corps, /with check\s*\(/i,
          `${nom} : insert/update sans with check — un utilisateur pourrait écrire `
          + 'au nom d\'un autre, sans que rien ne le montre en lecture');
      }
    });
  }

  /* ── Un déclencheur sans sa fonction ────────────────────────────
     Le fichier des fonctions est arrivé APRÈS les tables, parce que ce
     qui en avait d'abord été transmis était un résumé du comportement
     et non la sortie de pg_get_functiondef. Recoller une reconstruction
     fidèle au résumé aurait produit un fichier qui RESSEMBLE au schéma
     sans en être un — et un demi-schéma inspire la même confiance qu'un
     schéma entier.

     Ce test garde la propriété qui a manqué pendant ce délai : le
     fichier est rejouable, ou il échoue. */
  test('chaque déclencheur a sa fonction DÉFINIE dans le même fichier', () => {
    const f = lire('03-functions.sql');
    const appelees = [...f.matchAll(/EXECUTE FUNCTION\s+(\w+)\s*\(/gi)].map(m => m[1]);
    assert.ok(appelees.length > 0, 'aucun déclencheur déclaré');
    const definies = [...f.matchAll(/create (?:or replace )?function\s+(?:public\.)?(\w+)/gi)]
      .map(m => m[1]);
    const manquantes = appelees.filter(n => !definies.includes(n));
    assert.deepEqual(manquantes, [],
      `déclencheur(s) sans fonction : ${manquantes.join(', ')} — le fichier n'est `
      + 'pas rejouable tel quel.');
  });

  /* ── Un déclencheur sans sa fonction ────────────────────────────
     Ce test a été écrit, puis RETIRÉ pendant deux commits, et c'est
     volontaire : le corps des fonctions manquait, il aurait laissé la
     suite rouge en permanence — et une suite qui échoue par conception
     ne veut plus rien dire. Le fichier des fonctions étant arrivé
     complet, le test revient avec lui.

     Ce qu'il garde : db/ doit rester REJOUABLE. Un CREATE TRIGGER dont
     la fonction n'est pas définie ici produirait un dossier qui a l'air
     complet et qui échoue à la première exécution sur un projet neuf. */
  test('chaque déclencheur a sa fonction DÉFINIE dans le même fichier', () => {
    const f = lire('03-functions.sql');
    const appelees = [...f.matchAll(/EXECUTE FUNCTION\s+(\w+)\s*\(/gi)].map(m => m[1]);
    assert.equal(appelees.length, 3, 'les trois déclencheurs doivent être là');
    const definies = [...f.matchAll(/create (?:or replace )?function\s+(?:public\.)?(\w+)/gi)]
      .map(m => m[1]);
    const manquantes = appelees.filter(n => !definies.includes(n));
    assert.deepEqual(manquantes, [],
      `déclencheur(s) sans fonction : ${manquantes.join(', ')} — le fichier n'est `
      + 'pas rejouable tel quel sur un projet neuf.');
  });

  /* ── Les trois lignes de notify_feedback_email() qui comptent ───────
     Elles ne se devinent pas à la lecture rapide, et chacune protège
     quelque chose de différent. Les perdre lors d'une modification ne
     casserait rien de visible — c'est bien le problème. */
  test('la notification ne peut pas bloquer l’enregistrement d’un avis', () => {
    /* ANCRÉ EN DÉBUT DE LIGNE, et ce détail a une histoire : la première
       version de ce test cherchait la formule n'importe où dans le
       fichier — et passait au vert grâce au COMMENTAIRE qui la décrit,
       même après avoir supprimé le code. Un garde-fou satisfait par sa
       propre documentation ne garde rien. Vérifié en retirant le bloc :
       rouge maintenant, vert avant. */
    const code = lire('03-functions.sql')
      .split('\n').filter(l => !l.trimStart().startsWith('--')).join('\n');
    assert.match(code, /^exception when others then\s*\n\s*return new;/m,
      'sans ce bloc, une panne chez Resend ferait perdre l’avis de l’utilisateur');
    assert.match(code, /^\s*if api_key is null then return new; end if;/m,
      'pas de clé ne doit pas vouloir dire pas d’avis');
  });

  /* ── LES QUATRE CHAMPS QUI VIENNENT DU CLIENT ───────────────────
     Le point n°13 : `app_version` et `lang` entraient dans le corps
     HTML sans échappement, contrairement au message et à l'adresse.
     Les CHECK les bornent à 20 et 5 caractères — assez pour exclure un
     script, pas pour exclure du balisage : `<b>x</b>` tient en 8.

     CE TEST NE CHERCHE PAS LE MOT « ÉCHAPPEMENT ». Il vérifie deux
     choses qui, ensemble, ne peuvent pas être satisfaites par de la
     prose : que chaque variable safe_* est CONSTRUITE par un replace
     sur sa source, et qu'AUCUNE source brute n'apparaît dans le corps
     HTML. Un champ ajouté demain sans échappement échoue sur la
     seconde même si personne ne pense à étendre la première.

     Les commentaires sont retirés avant analyse — un garde satisfait
     par la documentation qui le décrit ne garde rien (CONVENTIONS §9). */
  // [variable sûre, source telle qu'elle s'écrit] — la source sert à la
  // fois de littéral (messages, recherche dans le HTML) et de motif ; le
  // point de `new.message` est échappé au moment de construire l'expression,
  // pas dans la table, sinon il fuit dans le nom des tests.
  const CHAMPS_CLIENT = [
    ['safe_msg', 'new.message'],
    ['safe_mail', 'user_email'],
    ['safe_ver', 'new.app_version'],
    ['safe_lang', 'new.lang'],
  ];
  const motif = src => src.replace(/\./g, '\\.');

  const codeSql = () => lire('03-functions.sql')
    .split('\n').filter(l => !l.trimStart().startsWith('--')).join('\n');

  for(const [variable, source] of CHAMPS_CLIENT){
    test(`${variable} est construit par un replace sur ${source}`, () => {
      const re = new RegExp(`${variable}\\s*:=\\s*replace\\(replace\\(replace\\([^;]*${motif(source)}`);
      assert.match(codeSql(), re,
        `${variable} n'échappe plus sa source — le champ entre tel quel dans un corps HTML`);
    });
  }

  test('aucune source brute n’entre dans le corps HTML', () => {
    const code = codeSql();
    const html = code.slice(code.indexOf("'html',"), code.lastIndexOf('</div></div>'));
    assert.ok(html.length > 200, 'repère perdu : le corps HTML a changé de forme');
    for(const [variable, source] of CHAMPS_CLIENT){
      assert.ok(!new RegExp(motif(source)).test(html),
        `${source} apparaît dans le HTML sans passer par ${variable}`);
      assert.ok(html.includes(variable),
        `${variable} n'est plus utilisé dans le HTML — l'échappement calculé ne sert à rien`);
    }
  });

  test('le throttle refuse AVANT l’écriture, pas après', () => {
    const f = lire('03-functions.sql');
    assert.match(f, /CREATE TRIGGER feedback_throttle\s+BEFORE INSERT/i,
      'en AFTER, la limite compterait des lignes déjà insérées');
  });

  test('les deux fonctions SECURITY DEFINER fixent leur search_path', () => {
    const f = lire('03-functions.sql');
    for(const m of f.matchAll(/CREATE OR REPLACE FUNCTION public\.(\w+)[\s\S]*?AS \$function\$/g)){
      if(!/SECURITY DEFINER/.test(m[0])) continue;
      assert.match(m[0], /SET search_path TO/,
        `${m[1]} : SECURITY DEFINER sans search_path fixé — détournement de `
        + 'résolution de noms possible');
    }
  });

  /* ── L'EXPÉDITEUR ET LES README NE PEUVENT PLUS BOUGER SÉPARÉMENT ──
     Point n°12 : le jour de la bascule vers un domaine vérifié, deux
     choses changent en même temps — l'expéditeur dans la fonction, et
     la puce « limites honnêtes » des sept README qui explique que le
     domaine de TEST ne délivre qu'au propriétaire du compte.

     Rien ne force ces deux gestes à se suivre, et c'est exactement la
     forme de dérive qu'on a passé une session à traquer : un README
     resté vrai la veille, faux le lendemain, sans que rien ne le dise.
     Ce test les attache l'un à l'autre. Il passe aujourd'hui (les deux
     côtés décrivent le domaine de test) et passera après (aucun des
     deux ne le mentionnera) — mais échoue entre les deux. */
  test('le domaine de test disparaît des DEUX côtés, ou d’aucun', () => {
    const TEST_DOMAIN = 'onboarding@resend.dev';
    const sql = lire('03-functions.sql');
    const READMES = ['README.md', 'README.fr.md', 'README.es.md', 'README.zh.md',
                     'README.it.md', 'README.nl.md', 'README.de.md'];
    const citants = READMES.filter(f =>
      readFileSync(new URL(`../${f}`, import.meta.url), 'utf8').includes(TEST_DOMAIN));

    if(sql.includes(TEST_DOMAIN)){
      assert.equal(citants.length, READMES.length,
        `l'expéditeur est encore ${TEST_DOMAIN}, mais ${READMES.length - citants.length} `
        + 'README ne le disent plus — la doc a bougé avant le code');
    } else {
      assert.deepEqual(citants, [],
        `l'expéditeur a changé, mais ces README décrivent encore le domaine de test : `
        + `${citants.join(', ')}. Voir le point n°12, section B.`);
    }
  });

  test('aucune adresse PERSONNELLE en clair dans db/', () => {
    /* Ce qu'on interdit : l'adresse du mainteneur, remplacée par un
       marqueur documenté. Une adresse personnelle dans un dépôt public,
       c'est du spam garanti et une donnée publiée.

       Ce qu'on autorise, et pourquoi la liste est explicite plutôt que
       « tout ce qui finit par arts44.dev » : une adresse de RÔLE sur le
       domaine du projet est publique par nature — elle voyage dans
       l'en-tête de chaque e-mail envoyé. `herve@arts44.dev` resterait
       refusée, `noreply@arts44.dev` non.

       Cette liste anticipe le point n°12. Sans elle, la bascule vers le
       domaine vérifié ferait rougir la suite au moment précis où on a
       besoin qu'elle dise la vérité sur autre chose. */
    const ROLES = ['noreply', 'no-reply', 'avis', 'feedback', 'contact'];
    const AUTORISEES = new RegExp(
      `^(?:${ROLES.join('|')})@arts44\\.dev$|@(?:resend\\.dev|example\\.(?:com|org))$`);
    for(const f of ['README.md', '02-rls.sql', '01-tables.sql', '03-functions.sql']){
      if(!existsSync(new URL(`../db/${f}`, import.meta.url))) continue;
      const s = lire(f);
      const trouve = s.match(/[\w.+-]+@[\w-]+\.[\w.]+/g) || [];
      const suspects = trouve.filter(a => !AUTORISEES.test(a));
      assert.deepEqual(suspects, [],
        `adresse en clair dans db/${f} — utiliser <ADRESSE_MAINTENEUR>`);
    }
  });

  test('aucune clé API dans db/', () => {
    for(const f of ['README.md', '02-rls.sql', '01-tables.sql', '03-functions.sql']){
      if(!existsSync(new URL(`../db/${f}`, import.meta.url))) continue;
      const s = lire(f);
      assert.ok(!/\bre_[A-Za-z0-9_]{16,}/.test(s), `clé Resend en clair dans db/${f}`);
      assert.ok(!/service_role[^\\n]{0,40}eyJ/.test(s), `JWT service_role dans db/${f}`);
    }
  });
});
