/* ══════════════════════════════════════════════════════════
   PARITÉ DES 7 README.

   Pourquoi ce test existe. Le compte de tests a traîné à « 385 »
   pendant des versions, dans 5 emplacements × 7 fichiers, sans que
   rien ne le signale. Une doc en sept langues dérive en silence :
   personne ne relit les six traductions à chaque changement.

   CE QUE CE TEST N'IMPOSE PAS. Les 7 fichiers ne sont PAS des
   miroirs, et c'est délibéré : README.md est le vaisseau amiral
   (notes d'ingénierie détaillées en puces, ordre de sections
   propre), les six traductions sont des versions condensées qui
   renvoient à l'anglais pour le détail. Exiger l'identité
   structurelle des 7 reviendrait à demander la suppression de ce
   choix éditorial.

   CE QU'IL IMPOSE, et qui doit être vrai quoi qu'il arrive :
     · les 6 traductions sont structurellement identiques ENTRE
       ELLES — elles n'ont aucune raison de diverger ;
     · les badges, les liens externes et le disclaimer sont les
       mêmes dans les 7 ;
     · chaque README pointe vers SES captures localisées, jamais
       vers celles d'une autre langue ;
     · le sélecteur de langue de chaque fichier lie les six autres
       et pas lui-même ;
     · aucun chiffre périmé ne survit dans un fichier alors qu'il a
       été mis à jour dans un autre.
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const LANGS = ['fr', 'es', 'zh', 'it', 'nl', 'de'];
const TOUS = ['README.md', ...LANGS.map(l => `README.${l}.md`)];
const REF_TRAD = 'README.fr.md';   // référence des traductions entre elles

const lire = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const sansCode = s => s.replace(/```[\s\S]*?```/g, '');

const titres = s => [...sansCode(s).matchAll(/^(#{1,6})\s+(.*)$/gm)]
  .map(m => m[1].length);

/* Un badge lié : [![alt](image)](cible). Un badge nu : ![alt](image). */
const badges = s => [
  ...[...s.matchAll(/\[!\[[^\]]*\]\(([^)\s]+)\)\]\(([^)\s]+)\)/g)]
    .map(m => `${m[1]} → ${m[2]}`),
  ...[...s.matchAll(/(?<!\[)!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g)]
    .map(m => m[1]),
].sort();

const images = s => [...s.matchAll(/!\[[^\]]*\]\((?!https?:\/\/)([^)\s]+)\)/g)]
  .map(m => m[1]);

const liensExternes = s => [...new Set(
  [...s.matchAll(/(?<!!)\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g)].map(m => m[1]),
)].sort();

const tableaux = s => {
  const out = []; let bloc = [];
  for(const l of sansCode(s).split('\n')){
    const t = l.trim();
    if(t.startsWith('|') && t.endsWith('|')) bloc.push(t);
    else { if(bloc.length >= 2) out.push(`${bloc.length}×${bloc[0].split('|').length - 2}`); bloc = []; }
  }
  if(bloc.length >= 2) out.push(`${bloc.length}×${bloc[0].split('|').length - 2}`);
  return out;
};

const puces = s => {
  const out = []; let n = 0;
  for(const l of sansCode(s).split('\n')){
    if(/^\s*[-*+]\s+\S/.test(l)) n++;
    else if(n){ out.push(n); n = 0; }
  }
  if(n) out.push(n);
  return out;
};

/* ══════════════════════════════════════════════════════════
   1. LES SIX TRADUCTIONS SONT DES MIROIRS L'UNE DE L'AUTRE
   ══════════════════════════════════════════════════════════ */
describe('README — les 6 traductions sont structurellement identiques', () => {
  const ref = lire(REF_TRAD);

  for(const lg of LANGS.filter(l => `README.${l}.md` !== REF_TRAD)){
    const f = `README.${lg}.md`;
    const s = lire(f);

    test(`${f} — mêmes niveaux de titres, dans le même ordre`, () => {
      assert.deepEqual(titres(s), titres(ref),
        `${f} : un titre a été ajouté, retiré ou changé de niveau`);
    });

    test(`${f} — mêmes tableaux (lignes × colonnes)`, () => {
      assert.deepEqual(tableaux(s), tableaux(ref),
        `${f} : une traduction ne change pas le nombre de lignes d'un tableau`);
    });

    test(`${f} — mêmes blocs de liste, mêmes nombres de puces`, () => {
      assert.deepEqual(puces(s), puces(ref),
        `${f} : une puce a été ajoutée ou perdue à la traduction`);
    });

    test(`${f} — mêmes images, dans le même ordre`, () => {
      const attendu = images(ref).map(p => p.replace('.fr.', `.${lg}.`));
      assert.deepEqual(images(s), attendu, `${f} : ordre ou chemin d'image divergent`);
    });
  }
});

/* ══════════════════════════════════════════════════════════
   2. CE QUI DOIT ÊTRE IDENTIQUE DANS LES SEPT
   ══════════════════════════════════════════════════════════ */
describe('README — invariants communs aux 7 langues', () => {
  const refBadges = badges(lire('README.md'));
  const refLiens = liensExternes(lire('README.md'));

  for(const f of TOUS){
    const s = lire(f);

    test(`${f} — mêmes badges (image et cible)`, () => {
      assert.deepEqual(badges(s), refBadges,
        `${f} : un badge manque, est en trop, ou pointe ailleurs`);
    });

    test(`${f} — badges syntaxiquement valides`, () => {
      // Le crochet ouvrant d'un badge lié a déjà été perdu une fois
      // dans les six traductions : ![alt](img)](cible) s'affiche comme
      // une image suivie du texte brut « ](https://… ) ».
      const orphelins = [...s.matchAll(/(?<!\[)!\[[^\]]*\]\([^)\s]+\)\]\(/g)];
      assert.equal(orphelins.length, 0,
        `${f} : badge lié sans son crochet ouvrant — le lien s'affichera en texte brut`);
    });

    test(`${f} — mêmes liens externes`, () => {
      assert.deepEqual(liensExternes(s), refLiens,
        `${f} : un lien externe manque ou a été ajouté`);
    });

    test(`${f} — disclaimer fan project présent`, () => {
      for(const marqueur of ['Mattel', 'Formula 1']){
        assert.ok(s.includes(marqueur), `${f} : « ${marqueur} » absent du disclaimer`);
      }
    });
  }
});

/* ══════════════════════════════════════════════════════════
   3. SÉLECTEUR DE LANGUE
   ══════════════════════════════════════════════════════════ */
describe('README — le sélecteur de langue de chaque fichier', () => {
  for(const f of TOUS){
    const lg = f === 'README.md' ? 'en' : f.split('.')[1];
    const premiere = lire(f).split('\n')[0];

    test(`${f} — lie les six autres langues`, () => {
      const autres = ['', ...LANGS].filter(l => l !== (lg === 'en' ? '' : lg));
      for(const a of autres){
        const cible = a === '' ? 'README.md' : `README.${a}.md`;
        assert.ok(premiere.includes(`(${cible})`),
          `${f} : le sélecteur ne lie pas ${cible}`);
      }
    });

    test(`${f} — ne se lie pas lui-même`, () => {
      const soi = lg === 'en' ? 'README.md' : `README.${lg}.md`;
      assert.ok(!premiere.includes(`(${soi})`),
        `${f} : la langue courante doit être marquée active, pas liée`);
    });
  }
});

/* ══════════════════════════════════════════════════════════
   4. CAPTURES LOCALISÉES — chacun pointe vers SA langue
   ══════════════════════════════════════════════════════════ */
describe('README — captures localisées', () => {
  for(const f of TOUS){
    const lg = f === 'README.md' ? 'en' : f.split('.')[1];

    test(`${f} — toutes ses captures i18n sont en .${lg}`, () => {
      const loc = images(lire(f)).filter(p => p.includes('/i18n/'));
      assert.ok(loc.length > 0, `${f} : aucune capture localisée trouvée`);
      for(const p of loc){
        assert.ok(p.endsWith(`.${lg}.jpg`),
          `${f} : ${p} pointe vers une autre langue que ${lg}`);
      }
    });
  }
});

/* ══════════════════════════════════════════════════════════
   5. CHIFFRES — aucune valeur périmée ne survit quelque part

   C'est le défaut le plus probable et le plus embarrassant :
   un chiffre corrigé dans un fichier et oublié dans six.
   ══════════════════════════════════════════════════════════ */
describe('README — les chiffres ne dérivent pas', () => {
  // Valeurs qui ont été vraies puis ont changé. Aucune ne doit
  // subsister nulle part. Ajouter ici toute valeur qu'on remplace.
  const PERIMES = [
    ['385 tests', 'compte de tests d\'avant 1.42'],
    ['470 tests', 'compte de tests d\'avant le chantier bugs'],
    ['511 tests', 'compte de tests d\'avant les tests fmt* et aléa'],
    ['519 tests', 'compte de tests d\'avant la parité README'],
    ['111 badges', 'nombre de badges d\'avant la v3'],
  ];

  for(const f of TOUS){
    const s = lire(f);
    test(`${f} — aucun chiffre périmé`, () => {
      for(const [valeur, quoi] of PERIMES){
        assert.ok(!s.includes(valeur), `${f} : « ${valeur} » (${quoi}) traîne encore`);
      }
    });
  }

  // Les faits chiffrés doivent être présents partout, avec la même
  // valeur. Le séparateur décimal est laissé libre : 62,72 en
  // français et 62.72 en anglais sont la même mesure.
  const FAITS = [
    { nom: 'compte de tests', motif: /\b623\b/ },
    { nom: 'nombre de cartes', motif: /\b101\b/ },
    { nom: 'nombre de badges', motif: /\b120\b/ },
    { nom: 'couverture', motif: /\b62[.,]72\b/ },
  ];

  for(const f of TOUS){
    const s = sansCode(lire(f));
    for(const { nom, motif } of FAITS){
      test(`${f} — ${nom} présent et à jour`, () => {
        assert.match(s, motif, `${f} : le ${nom} est absent ou a une autre valeur`);
      });
    }
  }
});
