/* ══════════════════════════════════════════════════════════
   LES SEUILS DES FILETS DÉCLARENT CE QU'ILS VALENT (㉒)

   POURQUOI CE GARDE EXISTE. Le registre des instruments menteurs
   demande, au cas ㉒, que « tout contrôle négatif calibré sur un
   seuil mesuré DÉCLARE ce seuil à côté de lui ». C'était une règle,
   et rien ne la vérifiait — trois seuils vivaient nus dans les
   filets, dont une tolérance de 1 px et une tolérance de CLS de
   0,02 que personne n'aurait pu justifier six mois plus tard.

   CE QU'IL EXERCE, ET RIEN DE PLUS (㉔). Il vérifie qu'une
   comparaison à un littéral NON NUL, dans le code Python d'un
   filet, porte la mention `SEUIL DECLARE` dans les douze lignes qui
   la précèdent. Il ne vérifie pas que la déclaration est VRAIE, ni
   qu'elle est à jour, ni que le seuil est bien choisi. Un
   commentaire qui ment lui échappe. Il empêche seulement qu'un
   nombre entre en douce.

   POURQUOI SEULEMENT LES FILETS, ET PAS TOUT LE DÉPÔT. Une variante
   plus large — repérer un nombre non étiqueté dans les commentaires
   et la documentation — a été chiffrée puis REFUSÉE : 1 205 cris sur
   le dépôt, 179 même en se limitant aux nombres portant une unité, et
   une majorité de faux positifs irréductibles, parce que la
   différence entre une mesure et un fait est dans la phrase, pas
   dans le nombre. Un garde qui crie sur tout est désarmé en une
   semaine. Voir V2-REFACTOR, septième chantier refusé.

   POURQUOI LE LITTÉRAL NUL EST IGNORÉ. `> 0`, `<= 0`, `!= 0`
   expriment une présence ou une vacuité, jamais un calibrage. Les
   inclure noierait les sept vrais seuils sous une vingtaine de
   comparaisons structurelles.
   ══════════════════════════════════════════════════════════ */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url);
const MARQUE = /SEUIL DECLARE|SEUIL DÉCLARÉ/;
const SAUT = 4;   // lignes de code tolérées entre le commentaire et le seuil
/* La mention est cherchée dans le BLOC DE COMMENTAIRE CONTIGU qui
   précède la ligne, pas dans un nombre fixe de lignes au-dessus. Une
   fenêtre de N lignes est arbitraire et se retourne contre soi : la
   première version en prenait douze, et un seuil dont la déclaration
   faisait treize lignes ressortait comme nu. Le bloc attaché au code
   est la bonne unité — c'est là qu'un lecteur cherchera. */

/* Les blocs `"""…"""` sont retirés : ils contiennent des en-têtes et du
   JavaScript injecté dans la page, où « < 0.5 » n'est pas un seuil de
   filet. Les commentaires `#` aussi — sinon la déclaration elle-même,
   qui cite souvent le nombre, se déclencherait. */
function seuils(src) {
  const lignes = src.split('\n');
  const hits = [];
  let dans = false;
  lignes.forEach((l, i) => {
    const t = (l.match(/"""/g) || []).length;
    if (dans) { if (t) dans = false; return; }
    if (t === 1) { dans = true; return; }
    const code = l.split('#')[0];
    for (const m of code.match(/\s[<>]=?\s*-?\d+(?:\.\d+)?/g) || []) {
      const v = parseFloat(m.replace(/[<>=\s]/g, ''));
      if (v !== 0) hits.push({ ligne: i + 1, op: m.trim(), texte: code.trim() });
    }
  });
  return hits;
}

const FILETS = readdirSync(ROOT).filter(f => /^verify_.*\.py$/.test(f));

describe('les seuils des filets déclarent ce qu’ils valent (㉒)', () => {
  test('il y a bien des filets à inspecter', () => {
    assert.ok(FILETS.length >= 5, `${FILETS.length} filet(s) trouvé(s) — le garde ne`
      + ' regarderait presque rien');
  });

  for (const f of FILETS) {
    test(`${f} : chaque seuil non nul porte sa déclaration`, () => {
      const lignes = readFileSync(new URL(f, ROOT), 'utf8').split('\n');
      const nus = seuils(lignes.join('\n')).filter(h => {
        /* On remonte jusqu'au PREMIER bloc de commentaire contigu, en
           tolérant au plus SAUT lignes de code entre lui et le seuil —
           un appel s'étale souvent sur deux ou trois lignes, et le
           littéral peut vivre dans un `elif` dont le commentaire coiffe
           le `if`. SEUIL DECLARE (㉒) : SAUT = 4, choisi et non mesuré,
           égal au plus long enjambement observé dans les filets au
           21/08/2026 (trois lignes, dans verify_vitrine). Au-delà, la
           déclaration cesse d'être « à côté » du seuil, ce que ㉒
           demande. */
        const bloc = [];
        let saute = 0;
        for (let i = h.ligne - 2; i >= 0; i--) {
          const l = lignes[i].trim();
          if (l.startsWith('#')) { bloc.push(l); continue; }
          if (bloc.length) break;              // le bloc est fini
          if (l === '' || ++saute > SAUT) break;
        }
        return !MARQUE.test(bloc.join('\n'));
      });
      assert.equal(nus.length, 0,
        `${f} : ${nus.length} seuil(s) sans déclaration — ajouter « SEUIL DECLARE » `
        + 'dans le bloc de commentaire juste au-dessus, avec ce que vaut le nombre '
        + 'et ce qui le ferait changer :\n'
        + nus.map(h => `    ligne ${h.ligne} · ${h.op} · ${h.texte.slice(0, 70)}`).join('\n'));
    });
  }
});
