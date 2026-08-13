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
