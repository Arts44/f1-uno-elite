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

  test('le message de l’utilisateur est échappé avant d’entrer dans le HTML', () => {
    const f = lire('03-functions.sql');
    assert.match(f, /safe_msg\s*:=\s*replace\(replace\(replace\(new\.message/,
      'le message part dans un corps HTML : sans échappement, un avis injecte du balisage');
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

  test('aucune adresse e-mail en clair dans db/', () => {
    // Le destinataire des notifications est un marqueur documenté, pas
    // une valeur. Une adresse dans un dépôt public, c'est du spam
    // garanti et une donnée personnelle publiée.
    for(const f of ['README.md', '02-rls.sql', '01-tables.sql', '03-functions.sql']){
      if(!existsSync(new URL(`../db/${f}`, import.meta.url))) continue;
      const s = lire(f);
      const trouve = s.match(/[\w.+-]+@[\w-]+\.[\w.]+/g) || [];
      const suspects = trouve.filter(a => !/@(resend\.dev|example\.(com|org))$/.test(a));
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
