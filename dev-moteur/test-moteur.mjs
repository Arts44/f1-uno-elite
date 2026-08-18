/* =====================================================================
   Tests du moteur Markdown — exécution : node dev-moteur/test-moteur.mjs
   Le moteur transforme une chaîne en chaîne : aucun DOM n'est nécessaire.
   Chaque cas déclare ce qui DOIT apparaître, et parfois ce qui ne doit
   surtout PAS apparaître (les cas d'échappement).
   ===================================================================== */

import { rendreMarkdown } from './moteur.js';

const cas = [];
const test = (nom, source, attendus, interdits) =>
  cas.push({ nom, source, attendus, interdits: interdits || [] });

const G = '`';                 // accent grave, pour écrire des fences sans gymnastique
const F3 = G + G + G;
const F4 = G + G + G + G;

/* --- 1. Titres ---------------------------------------------------- */
test('titres h1 à h6',
  '# Un\n## Deux\n###### Six',
  ['<h1 id="un">Un</h1>', '<h2 id="deux">Deux</h2>', '<h6 id="six">Six</h6>']);

/* --- 2. Emphase --------------------------------------------------- */
test('emphase',
  'du **gras**, de l\'*italique*, du ***deux***, du ~~barré~~ et du ==surligné==',
  ['<strong>gras</strong>', '<em>italique</em>',
    '<strong><em>deux</em></strong>', '<del>barré</del>', '<mark>surligné</mark>']);

test('les underscores intra-mot ne sont pas de l\'italique',
  'un nom_de_variable_python',
  ['nom_de_variable_python'], ['<em>de</em>']);

/* --- 3. Listes ---------------------------------------------------- */
test('liste à puces imbriquée',
  '- un\n- deux\n    - deux-un\n- trois',
  ['<ul><li>un</li><li>deux<ul><li>deux-un</li></ul></li><li>trois</li></ul>']);

test('liste ordonnée',
  '1. un\n2. deux',
  ['<ol>', '<li>un</li>', '<li>deux</li></ol>']);

/* --- 4. Tâches ---------------------------------------------------- */
test('tâches faites et à faire',
  '- [ ] à faire\n- [x] faite\n- [/] en cours',
  ['class="tache"', 'class="tache tache-faite"', 'checked', 'data-etat="/"']);

/* --- 5. Tableaux -------------------------------------------------- */
test('tableau avec alignements',
  '| Gauche | Centre | Droite |\n|:---|:---:|---:|\n| a | b | c |',
  ['<table>', '<th style="text-align:center">Centre</th>',
    '<td style="text-align:right">c</td>']);

test('barre verticale échappée dans une cellule',
  '| a | b |\n|---|---|\n| x \\| y | z |',
  ['<td>x | y</td>']);

/* --- 6. Blocs de code (R3) ---------------------------------------- */
test('bloc de code avec langage',
  F3 + 'js\nconst a = 1;\n' + F3,
  ['data-langue="js"', 'const a = 1;']);

test('R3 — quatre accents graves contiennent trois accents graves',
  F4 + '\n' + F3 + 'js\ncode\n' + F3 + '\n' + F4,
  ['&#96;&#96;&#96;js'.replace(/&#96;/g, G), 'code'],
  ['data-langue="js"']);

test('le HTML dans un bloc de code est affiché, pas exécuté',
  F3 + '\n<script>alert(1)<\/script>\n' + F3,
  ['&lt;script&gt;alert(1)&lt;/script&gt;'], ['<script>alert(1)']);

/* --- 7. Citations et callouts ------------------------------------- */
test('citation simple',
  '> une citation\n> sur deux lignes',
  ['<blockquote><p>une citation\nsur deux lignes</p>'.replace('\n', '<br>')]);

test('callout warning',
  '> [!WARNING] Attention au disque\n> Le corps du callout.',
  ['data-callout="warning"', 'Attention au disque', 'Le corps du callout.']);

test('alias de callout : caution devient warning',
  '> [!caution] Titre',
  ['data-callout="warning"']);

test('callout repliable fermé',
  '> [!tip]- Replié\n> caché',
  ['<details class="callout callout-pliable" data-callout="tip"'],
  ['<details class="callout callout-pliable" data-callout="tip" open']);

test('callout imbriqué dans un callout',
  '> [!info] Dehors\n> > [!bug] Dedans\n> > le corps',
  ['data-callout="info"', 'data-callout="bug"', 'le corps']);

test('type de callout inconnu retombe sur note',
  '> [!licorne] Inventé',
  ['data-callout="note"']);

/* --- 8. Liens internes -------------------------------------------- */
test('wikilink simple',
  'voir [[Ma note]] ici',
  ['class="lien-interne"', 'data-cible="Ma note"', '>Ma note</a>']);

test('wikilink avec alias',
  '[[Ma note|autrement dit]]',
  ['data-cible="Ma note"', '>autrement dit</a>']);

test('wikilink vers un titre et vers un bloc',
  '[[Note#Section]] et [[Note^abc123]]',
  ['data-cible="Note#Section"', 'data-cible="Note^abc123"']);

test('embed de note entière',
  '![[Ma note]]',
  ['class="embed"', 'note entière', 'Ma note']);

test('embed de section',
  '![[Ma note#Chapitre]]',
  ['section « Chapitre »']);

/* --- 9. Liens Markdown et images ---------------------------------- */
test('lien externe ouvre dans un onglet',
  '[Obsidian](https://obsidian.md)',
  ['href="https://obsidian.md"', 'rel="noopener noreferrer"']);

test('image Markdown',
  '![une photo](img/photo.png)',
  ['<img src="img/photo.png" alt="une photo"']);

test('URL javascript: neutralisée',
  '[piège](javascript:alert(1))',
  ['href="#"'], ['href="javascript:']);

/* --- 10. Notes de bas de page ------------------------------------- */
test('note de bas de page',
  'une affirmation[^1].\n\n[^1]: la justification.',
  ['id="renvoi-1"', 'id="nbp-1"', 'la justification.', 'class="notes-bas"']);

/* --- 11. Frontmatter YAML ----------------------------------------- */
test('frontmatter : types devinés',
  '---\ntitre: Ma note\nvu: true\nnote: 4\ncree: 2026-08-18\ntags:\n  - dev\n  - obsidian\n---\n\nLe corps.',
  ['class="proprietes"', 'data-type="texte"', 'data-type="case"',
    'data-type="nombre"', 'data-type="date"', 'data-type="liste"', '<p>Le corps.</p>']);

test('trois tirets sans frontmatter reste un séparateur',
  'du texte\n\n---\n\nd\'autre texte',
  ['<hr>']);

/* --- 12. Maths ---------------------------------------------------- */
test('maths inline et bloc, affichées brutes',
  'inline $E = mc^2$ puis\n\n$$\n\\int_0^1 x dx\n$$',
  ['class="math math-inline"', 'E = mc^2', 'class="math math-bloc"', '\\int_0^1']);

/* --- 13. Commentaires --------------------------------------------- */
test('commentaire inline invisible',
  'avant %%caché%% après',
  ['avant  après'], ['caché']);

test('commentaire multiligne invisible',
  'avant\n\n%%\ntout ceci est caché\n%%\n\naprès',
  ['<p>avant</p>', '<p>après</p>'], ['tout ceci est caché']);

/* --- 14. Échappement R1 et R2 ------------------------------------- */
test('R1 — un span de code n\'interprète rien',
  'écris ' + G + '[[note]]' + G + ' et ' + G + '**gras**' + G,
  ['<code>[[note]]</code>', '<code>**gras**</code>'],
  ['class="lien-interne"', '<strong>gras</strong>']);

test('R2 — l\'antislash neutralise le caractère suivant',
  'ceci \\[\\[n\'est pas\\]\\] un lien, et \\*\\*pas du gras\\*\\*',
  ['[[n&#39;est pas]]', '**pas du gras**'],
  ['class="lien-interne"', '<strong>']);

test('double accent grave pour montrer un accent grave',
  G + G + ' un ' + G + ' seul ' + G + G,
  ['<code>un ' + G + ' seul</code>']);

/* --- 15. Sécurité -------------------------------------------------- */
test('HTML brut dans la prose est affiché, pas exécuté',
  'un <img src=x onerror=alert(1)> pirate',
  ['&lt;img src=x onerror=alert(1)&gt;'], ['<img src=x']);

/* --- 16. Tags ------------------------------------------------------ */
test('tag inline',
  'classé en #projet/obsidian aujourd\'hui',
  ['class="tag"', 'data-tag="projet/obsidian"']);

/* --- 17. Paragraphes ---------------------------------------------- */
test('deux paragraphes séparés',
  'premier\n\nsecond',
  ['<p>premier</p><p>second</p>']);

/* ------------------------------------------------------------------ */
/* Exécution                                                           */
/* ------------------------------------------------------------------ */

let reussis = 0;
const echecs = [];

cas.forEach(({ nom, source, attendus, interdits }) => {
  let html;
  try {
    html = rendreMarkdown(source);
  } catch (e) {
    echecs.push({ nom, raison: 'exception : ' + e.message, html: '' });
    return;
  }
  const manquants = attendus.filter((a) => !html.includes(a));
  const presents = interdits.filter((i) => html.includes(i));
  if (manquants.length === 0 && presents.length === 0) {
    reussis++;
    return;
  }
  echecs.push({
    nom,
    raison: [
      manquants.length ? 'manque : ' + manquants.map((m) => JSON.stringify(m)).join(', ') : '',
      presents.length ? 'ne devrait pas contenir : ' + presents.map((p) => JSON.stringify(p)).join(', ') : ''
    ].filter(Boolean).join(' | '),
    html
  });
});

console.log('');
echecs.forEach((e) => {
  console.log('ÉCHEC  ' + e.nom);
  console.log('       ' + e.raison);
  console.log('       rendu : ' + e.html.slice(0, 400));
  console.log('');
});
console.log(reussis + '/' + cas.length + ' cas passent.');
process.exit(echecs.length ? 1 : 0);
