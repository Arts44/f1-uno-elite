/* ══════════════════════════════════════════════════════════
   LE GRAPHE D'IMPORTS — arêtes interdites et composante mesurée

   POURQUOI CE TEST EXISTE. Le découpage de badges.js (v2) n'a pas été
   motivé par une métrique de complexité mais par les cycles d'import où
   le module était pris. Le pire — `storage.js → badges.js` — est de la
   même famille que la fuite inter-saisons corrigée en 1.52.1 : un
   module qui lit l'état d'un autre pendant que celui-ci l'initialise.

   ⚠️ LA PREMIÈRE EXÉCUTION A CORRIGÉ LE PLAN. Voir le bloc « ce que la
   mesure a appris », plus bas : l'app ne contient pas plusieurs cycles,
   elle en contient UN, et les 22 modules sont dedans. L'instrument a
   donc été refait — il vérifie des ARÊTES nommées, pas des composantes.
   ══════════════════════════════════════════════════════════ */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const RACINE = new URL('../', import.meta.url);
const HORS = new Set(['app.bundle.js', 'sw.js', 'compare_captures.js']);

const modules = readdirSync(RACINE)
  .filter(f => f.endsWith('.js') && !HORS.has(f));

/** graphe[m] = [modules locaux importés par m] */
const graphe = {};
for(const m of modules){
  const src = readFileSync(new URL(m, RACINE), 'utf8');
  const cibles = new Set();
  // `import … from './x.js'` ET `import('./x.js')` (dynamique)
  for(const re of [/from\s+'\.\/([\w.-]+\.js)'/g, /import\(\s*'\.\/([\w.-]+\.js)'\s*\)/g]){
    for(const mm of src.matchAll(re)) if(modules.includes(mm[1])) cibles.add(mm[1]);
  }
  graphe[m] = [...cibles];
}

/* ── Tarjan : composantes fortement connexes ────────────────────── */
function composantes(g){
  let idx = 0;
  const num = {}, bas = {}, pile = [], surPile = {}, out = [];
  const parcourir = v => {
    num[v] = bas[v] = idx++;
    pile.push(v); surPile[v] = true;
    for(const w of g[v] || []){
      if(num[w] === undefined){ parcourir(w); bas[v] = Math.min(bas[v], bas[w]); }
      else if(surPile[w]) bas[v] = Math.min(bas[v], num[w]);
    }
    if(bas[v] === num[v]){
      const c = [];
      let w;
      do { w = pile.pop(); surPile[w] = false; c.push(w); } while(w !== v);
      out.push(c.sort());
    }
  };
  for(const v of Object.keys(g)) if(num[v] === undefined) parcourir(v);
  return out.filter(c => c.length > 1).map(c => c.join(' ⇄ ')).sort();
}

/* ══════════════════════════════════════════════════════════
   CE QUE LA PREMIÈRE EXÉCUTION A APPRIS, et qui corrige le plan

   L'intention initiale était : « le découpage casse deux cycles ».
   Mesuré, c'est faux — et la mesure est plus intéressante que
   l'intention. L'application entière forme UNE SEULE composante
   fortement connexe de 22 modules : depuis n'importe lequel, on
   revient à n'importe lequel. Parler DES cycles de badges.js n'avait
   pas de sens ; il n'y en a qu'un, et tout le monde est dedans.

   Conséquence sur l'instrument : à la maille des composantes, « aucun
   cycle nouveau » ne veut rien dire — la composante restera une après
   le découpage. Ce qui se vérifie, et qui compte, ce sont les ARÊTES
   nommées : `storage.js → badges.js` est celle qui a produit un bug
   réel (fuite inter-saisons, 1.52.1), parce qu'un module y lisait
   l'état d'un autre pendant son initialisation.

   Ce test garde donc trois choses :
     · des arêtes INTERDITES, nommées une par une, avec leur raison ;
     · la TAILLE de la composante, qui ne doit pas grandir ;
     · la liste des modules qui n'en font pas partie — les feuilles
       saines, qu'on veut voir se multiplier.
   ══════════════════════════════════════════════════════════ */

/* Arêtes interdites : [depuis, vers, pourquoi]. Une ligne s'ajoute ici
   quand un découpage vient d'en supprimer une, pour qu'elle ne
   revienne pas par distraction. */
const ARETES_INTERDITES = [
  ['storage.js', 'badges.js',
   'storage lit l’état des badges pour la sauvegarde ; passer par '
   + 'badges-store.js évite de dépendre d’un module qui dépend de lui. '
   + 'C’est la famille du bug de fuite inter-saisons (1.52.1).'],
  ['badges-store.js', 'storage.js',
   'le store lit ses clés dans storage-keys.js, jamais dans storage.js'],
  ['badges-store.js', 'badges.js',
   'un store qui dépend de sa vue n’est plus un store'],
  ['storage-keys.js', 'storage.js',
   'la règle de nommage ne doit dépendre que de la saison courante'],
  ['badge-cards.js', 'badges.js',
   'la correspondance badge → cartes doit rester utilisable sans la vue '
   + '— c’est ce qui la rend réemployable par l’export de liste d’échange'],
  ['profile-card.js', 'badges.js',
   'la plomberie canvas → PNG → partage doit servir à autre chose '
   + 'qu’aux badges ; c’est tout l’intérêt de l’avoir extraite'],
];

/* Taille de la composante géante, MESURÉE. Elle ne doit pas grandir :
   un nouveau module qui s'y ajoute est un module qui aurait pu rester
   une feuille.

   CE QUE LE DÉCOUPAGE A DONNÉ, mesuré et non supposé : la composante
   n'a pas MAIGRI — elle contient toujours les mêmes 22 modules. Ce qui
   a changé, c'est que les trois modules extraits (storage-keys,
   badges-store, season) sont restés DEHORS.

   Ce n'était pas acquis : mesurés juste après leur création, les deux
   premiers étaient DEDANS. La cause tenait à une seule donnée — la
   saison courante vivait dans data.js, qui importe render et stats,
   si bien que « connaître l'année » revenait à hériter de la moitié de
   l'app. D'où season.js, quinze lignes sans aucune dépendance. */
const TAILLE_MAX_COMPOSANTE = 22;

/* Plancher des feuilles : 16 après le découpage. Il ne doit pas
   BAISSER — une feuille qui rejoint la composante est une régression
   structurelle, et c'est exactement ce qui s'est produit deux fois
   pendant ce chantier avant d'être corrigé. */
const MIN_FEUILLES = 16;

describe('graphe d’imports', () => {
  const scc = composantes(graphe);
  const geante = scc.length ? scc[0].split(' ⇄ ') : [];

  for(const [depuis, vers, pourquoi] of ARETES_INTERDITES){
    test(`${depuis} n’importe pas ${vers}`, () => {
      if(!graphe[depuis]) return;   // module pas encore créé : rien à tenir
      assert.ok(!graphe[depuis].includes(vers), pourquoi);
    });
  }

  test('la composante fortement connexe ne grandit pas', () => {
    assert.ok(geante.length <= TAILLE_MAX_COMPOSANTE,
      `${geante.length} modules enchevêtrés (plafond ${TAILLE_MAX_COMPOSANTE}) : `
      + `${geante.join(', ')}`);
  });

  test('il n’existe qu’UNE composante enchevêtrée, pas plusieurs poches', () => {
    // Plusieurs composantes distinctes seraient PIRE qu'une seule : des
    // enchevêtrements séparés se raisonnent moins bien qu'un connu.
    assert.ok(scc.length <= 1, `${scc.length} composantes : ${scc.join(' | ')}`);
  });

  test('les modules HORS composante sont listés — ce sont les feuilles saines', () => {
    const dehors = modules.filter(m => !geante.includes(m)).sort();
    assert.ok(dehors.length > 0, 'aucune feuille : tout le dépôt serait enchevêtré');
    // Pas d'assertion sur le contenu : c'est un indicateur, affiché par
    // le nom du test. Chaque module extrait devrait l'agrandir.
    assert.ok(dehors.length >= MIN_FEUILLES,
      `${dehors.length} feuilles au lieu de ${MIN_FEUILLES} — une est rentrée `
      + `dans la composante : ${dehors.join(', ')}`);
  });
});
