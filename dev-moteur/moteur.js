/* =====================================================================
   MOTEUR MARKDOWN — tutoriel Obsidian
   =====================================================================

   Écrit à la main, sans dépendance. Il transforme une chaîne Markdown
   (dialecte Obsidian) en HTML. Deux passes explicites :

     rendreBlocs()  découpe le texte ligne par ligne en blocs
                    (titres, listes, tableaux, citations, callouts,
                    blocs de code, maths, frontmatter, séparateurs)
     rendreInline() traite ce qui vit à l'intérieur d'une ligne
                    (emphase, code, liens, wikilinks, embeds, tags…)

   Aucun AST, aucun système de greffons. Une construction = une fonction.

   ---------------------------------------------------------------------
   ÉCHAPPEMENT — les quatre règles, valables dans tout le tutoriel
   ---------------------------------------------------------------------
   R1. Un span de code protège tout : `[[note]]` s'affiche littéralement.
       AUCUNE syntaxe n'est interprétée à l'intérieur. C'est le moyen
       par défaut pour montrer de la syntaxe dans la prose.
   R2. L'antislash neutralise le caractère qui suit : \[\[note\]\]
       affiche [[note]] hors d'un span de code.
   R3. Un bloc se clôt avec au moins autant de marqueurs qu'à
       l'ouverture. Pour montrer un bloc de code à trois accents graves,
       on ouvre le bloc englobant avec quatre. Idem pour ~~~.
   R4. Dans un <script type="text/markdown">, la seule séquence
       interdite est la balise fermante ; on l'écrit <\/script.

   ---------------------------------------------------------------------
   SÉCURITÉ
   ---------------------------------------------------------------------
   Tout texte est échappé (echapperHTML) AVANT toute transformation.
   Le moteur n'émet jamais de HTML venu de la source : le HTML brut
   dans le Markdown est affiché tel quel, pas exécuté. Les URL passent
   par urlSure() qui refuse tout schéma exotique — javascript: et
   data: sont neutralisés.
   ===================================================================== */

/* ------------------------------------------------------------------ */
/* Utilitaires                                                         */
/* ------------------------------------------------------------------ */

/** Échappe les cinq caractères qui ont un sens en HTML. */
function echapperHTML(texte) {
  return texte
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Ne laisse passer qu'une URL inoffensive. Tout schéma inconnu
 * (javascript:, data:, vbscript:…) devient un lien mort.
 */
function urlSure(url) {
  const nettoyee = url.trim();
  if (/^(https?:|mailto:|#|\.{0,2}\/)/i.test(nettoyee)) return nettoyee;
  if (/^[a-z][a-z0-9+.-]*:/i.test(nettoyee)) return '#';
  return nettoyee; // chemin relatif nu : « note.md », « img/photo.png »
}

/** Transforme « Mon Titre ! » en « mon-titre » pour les ancres. */
function ancre(texte) {
  return texte
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section';
}

/* ------------------------------------------------------------------ */
/* Callouts : familles reconnues par Obsidian                          */
/* ------------------------------------------------------------------ */

const ALIAS_CALLOUT = {
  note: 'note',
  abstract: 'abstract', summary: 'abstract', tldr: 'abstract',
  info: 'info',
  todo: 'todo',
  tip: 'tip', hint: 'tip', important: 'tip',
  success: 'success', check: 'success', done: 'success',
  question: 'question', help: 'question', faq: 'question',
  warning: 'warning', caution: 'warning', attention: 'warning',
  failure: 'failure', fail: 'failure', missing: 'failure',
  danger: 'danger', error: 'danger',
  bug: 'bug',
  example: 'example',
  quote: 'quote', cite: 'quote'
};

const TITRE_CALLOUT = {
  note: 'Note', abstract: 'Résumé', info: 'Info', todo: 'À faire',
  tip: 'Astuce', success: 'Réussi', question: 'Question',
  warning: 'Attention', failure: 'Échec', danger: 'Danger',
  bug: 'Bogue', example: 'Exemple', quote: 'Citation'
};

/* ------------------------------------------------------------------ */
/* PASSE INLINE                                                        */
/* ------------------------------------------------------------------ */

/*
   Trois temps, pour que R1 et R2 tiennent sans qu'aucune expression
   régulière ne « traverse » un span de code :
     1. extraire spans de code et échappements, remplacés par un jeton
        NUL + index + NUL (le caractère NUL ne peut pas venir du texte) ;
     2. échapper le HTML puis appliquer les transformations ;
     3. réinjecter les fragments protégés.
*/

const JETON = String.fromCharCode(0); // caractere NUL : impossible dans du texte saisi
const RE_JETON = /\u0000(\d+)\u0000/g;

/** Extrait spans de code et échappements. Renvoie {texte, protege}. */
function extraireFragmentsProteges(source) {
  const protege = [];
  let texte = '';
  let i = 0;

  const garder = (html) => {
    protege.push(html);
    texte += JETON + (protege.length - 1) + JETON;
  };

  while (i < source.length) {
    const c = source[i];

    // R2 — antislash : le caractère suivant est littéral.
    if (c === '\\' && i + 1 < source.length && /[\\`*_{}\[\]()#+\-.!|>~^$%=]/.test(source[i + 1])) {
      garder(echapperHTML(source[i + 1]));
      i += 2;
      continue;
    }

    // R1 — span de code : n accents graves … n accents graves.
    if (c === '`') {
      let n = 0;
      while (source[i + n] === '`') n++;
      const ouverture = '`'.repeat(n);
      const fin = source.indexOf(ouverture, i + n);
      if (fin !== -1) {
        let contenu = source.slice(i + n, fin);
        // Un espace de garde de chaque côté est retiré.
        if (contenu.startsWith(' ') && contenu.endsWith(' ') && contenu.trim() !== '') {
          contenu = contenu.slice(1, -1);
        }
        garder('<code>' + echapperHTML(contenu) + '</code>');
        i = fin + n;
        continue;
      }
    }

    texte += c;
    i++;
  }

  return { texte, protege };
}

/** Réinjecte les fragments protégés à la place de leurs jetons. */
function reinjecter(html, protege) {
  return html.replace(RE_JETON, (_, n) => protege[Number(n)]);
}

/** Découpe « cible#titre^bloc|alias » d'un wikilink. */
function analyserWikilink(brut) {
  const barre = brut.indexOf('|');
  const cible = (barre === -1 ? brut : brut.slice(0, barre)).trim();
  const alias = barre === -1 ? '' : brut.slice(barre + 1).trim();

  const bloc = cible.match(/\^([\w-]+)\s*$/);
  const sansBloc = bloc ? cible.slice(0, bloc.index).trim() : cible;
  const diese = sansBloc.indexOf('#');
  const note = (diese === -1 ? sansBloc : sansBloc.slice(0, diese)).trim();
  const titre = diese === -1 ? '' : sansBloc.slice(diese + 1).trim();

  let libelle = alias;
  if (!libelle) {
    if (note && titre) libelle = note + ' > ' + titre;
    else if (note) libelle = note;
    else if (titre) libelle = titre;
    else libelle = brut;
  }
  return { note, titre, bloc: bloc ? bloc[1] : '', alias, libelle };
}

/**
 * Rend le contenu d'une ligne. `ctx.notes` collecte les appels de notes
 * de bas de page, dans l'ordre d'apparition.
 */
function rendreInline(source, contexte) {
  const ctx = contexte || { notes: [] };
  const { texte, protege } = extraireFragmentsProteges(source);
  let h = echapperHTML(texte);

  // Commentaires %%invisibles%% — Obsidian ne les affiche jamais.
  h = h.replace(/%%[\s\S]*?%%/g, '');

  // Maths inline $…$ : affichées brutes, jamais calculées (cf. ch. 4).
  h = h.replace(/\$([^$\n]+)\$/g, (_, f) => '<span class="math math-inline">' + f + '</span>');

  // Embed ![[cible]] — on nomme honnêtement ce qui serait inséré.
  h = h.replace(/!\[\[([^\]\n]+)\]\]/g, (_, brut) => {
    const l = analyserWikilink(brut);
    const quoi = l.bloc ? 'bloc ^' + l.bloc
      : l.titre ? 'section « ' + l.titre + ' »'
        : 'note entière';
    return '<span class="embed"><span class="embed-etiq">incorporé</span>'
      + '<span class="embed-cible">' + (l.note || l.titre) + '</span>'
      + '<span class="embed-quoi">' + quoi + '</span></span>';
  });

  // Wikilink [[cible|alias]]
  h = h.replace(/\[\[([^\]\n]+)\]\]/g, (_, brut) => {
    const l = analyserWikilink(brut);
    const cible = (l.note || '') + (l.titre ? '#' + l.titre : '') + (l.bloc ? '^' + l.bloc : '');
    return '<a class="lien-interne" href="#" data-cible="' + cible
      + '" title="Note : ' + cible + '">' + l.libelle + '</a>';
  });

  // Image ![alt](url)
  h = h.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g,
    (_, alt, url, titre) => '<img src="' + urlSure(url) + '" alt="' + alt + '"'
      + (titre ? ' title="' + titre + '"' : '') + ' loading="lazy">');

  // Lien Markdown [texte](url)
  h = h.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g, (_, txt, url, titre) => {
    const u = urlSure(url);
    const externe = /^https?:/i.test(u);
    return '<a href="' + u + '"' + (titre ? ' title="' + titre + '"' : '')
      + (externe ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + txt + '</a>';
  });

  // URL nue
  h = h.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g,
    (_, avant, url) => avant + '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + url + '</a>');

  // Appel de note de bas de page [^id]
  h = h.replace(/\[\^([\w-]+)\]/g, (_, id) => {
    if (!ctx.notes.includes(id)) ctx.notes.push(id);
    const n = ctx.notes.indexOf(id) + 1;
    return '<sup class="renvoi"><a href="#nbp-' + id + '" id="renvoi-' + id
      + '" aria-label="Note de bas de page ' + n + '">' + n + '</a></sup>';
  });

  // Emphase — le gras avant l'italique, sinon ** est mangé par *.
  h = h.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  h = h.replace(/(^|[^\w*])\*([^*\n]+)\*(?![\w*])/g, '$1<em>$2</em>');
  h = h.replace(/(^|[^\w_])__([^_\n]+)__(?![\w_])/g, '$1<strong>$2</strong>');
  h = h.replace(/(^|[^\w_])_([^_\n]+)_(?![\w_])/g, '$1<em>$2</em>');
  h = h.replace(/~~([^~\n]+)~~/g, '<del>$1</del>');
  h = h.replace(/==([^=\n]+)==/g, '<mark>$1</mark>');

  // Tag #mon-tag (jamais en début de ligne : ce serait un titre, déjà traité)
  h = h.replace(/(^|[\s(])#([A-Za-zÀ-ÿ][\w\/À-ÿ-]*)/g,
    (_, avant, tag) => avant + '<a class="tag" href="#" data-tag="' + tag + '">#' + tag + '</a>');

  return reinjecter(h, protege);
}

/* ------------------------------------------------------------------ */
/* PASSE BLOCS                                                         */
/* ------------------------------------------------------------------ */

/** Vrai si la ligne ouvre un bloc : sert à couper un paragraphe. */
function ouvreUnBloc(ligne) {
  return /^ {0,3}(#{1,6}\s|>|```|~~~|\$\$|\|)/.test(ligne)
    || /^ {0,3}([-*+]|\d+[.)])\s/.test(ligne)
    || /^ {0,3}(-{3,}|\*{3,}|_{3,})\s*$/.test(ligne)
    || ligne.trim() === '';
}

/** Ligne de séparation d'un tableau : |---|:--:|---:| */
function estSeparateurTableau(ligne) {
  return /^\s*\|?(\s*:?-{2,}:?\s*\|)+\s*:?-{2,}:?\s*\|?\s*$/.test(ligne)
    || /^\s*\|(\s*:?-{2,}:?\s*\|)+\s*$/.test(ligne);
}

/** Alignements déduits de la ligne de séparation. */
function alignementsTableau(ligne) {
  return ligne.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => {
    const t = c.trim();
    if (t.startsWith(':') && t.endsWith(':')) return 'center';
    if (t.endsWith(':')) return 'right';
    if (t.startsWith(':')) return 'left';
    return '';
  });
}

/** Découpe « | a | b | » en ['a','b'] en respectant la barre échappée. */
function cellulesDe(ligne) {
  const brut = ligne.trim().replace(/^\|/, '').replace(/\|$/, '');
  const cellules = [];
  let courante = '';
  for (let i = 0; i < brut.length; i++) {
    if (brut[i] === '\\' && brut[i + 1] === '|') { courante += '\\|'; i++; continue; }
    if (brut[i] === '|') { cellules.push(courante); courante = ''; continue; }
    courante += brut[i];
  }
  cellules.push(courante);
  return cellules.map((c) => c.trim());
}

/**
 * Rend une suite de lignes. Appelée récursivement pour le contenu des
 * citations, des callouts et des éléments de liste.
 */
function rendreBlocs(lignes, ctx) {
  let html = '';
  let i = 0;

  while (i < lignes.length) {
    const ligne = lignes[i];

    /* --- ligne vide ------------------------------------------------ */
    if (ligne.trim() === '') { i++; continue; }

    /* --- bloc de code clôturé (R3) --------------------------------- */
    const fence = ligne.match(/^(\s*)(`{3,}|~{3,})(.*)$/);
    if (fence) {
      const marqueur = fence[2][0];
      const longueur = fence[2].length;
      const langue = fence[3].trim().split(/\s+/)[0];
      const corps = [];
      i++;
      while (i < lignes.length) {
        const f = lignes[i].match(/^\s*(`{3,}|~{3,})\s*$/);
        if (f && f[1][0] === marqueur && f[1].length >= longueur) { i++; break; }
        corps.push(lignes[i]);
        i++;
      }
      html += '<pre class="bloc-code"' + (langue ? ' data-langue="' + echapperHTML(langue) + '"' : '')
        + '><code>' + echapperHTML(corps.join('\n')) + '</code></pre>';
      continue;
    }

    /* --- bloc de maths $$ … $$ ------------------------------------- */
    if (/^\s*\$\$\s*$/.test(ligne)) {
      const corps = [];
      i++;
      while (i < lignes.length && !/^\s*\$\$\s*$/.test(lignes[i])) { corps.push(lignes[i]); i++; }
      i++;
      html += '<div class="math math-bloc">' + echapperHTML(corps.join('\n')) + '</div>';
      continue;
    }

    /* --- commentaire %% … %% sur plusieurs lignes ------------------ */
    if (/^\s*%%/.test(ligne) && !/%%[\s\S]*%%/.test(ligne)) {
      i++;
      while (i < lignes.length && !/%%/.test(lignes[i])) i++;
      i++;
      continue;
    }

    /* --- séparateur ------------------------------------------------ */
    if (/^ {0,3}(-{3,}|\*{3,}|_{3,})\s*$/.test(ligne)) { html += '<hr>'; i++; continue; }

    /* --- titre ----------------------------------------------------- */
    const titre = ligne.match(/^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/);
    if (titre) {
      const n = titre[1].length;
      html += '<h' + n + ' id="' + ancre(titre[2]) + '">' + rendreInline(titre[2], ctx) + '</h' + n + '>';
      i++;
      continue;
    }

    /* --- citation ou callout --------------------------------------- */
    if (/^ {0,3}>/.test(ligne)) {
      const interieur = [];
      while (i < lignes.length && /^ {0,3}>/.test(lignes[i])) {
        interieur.push(lignes[i].replace(/^ {0,3}> ?/, ''));
        i++;
      }
      html += rendreCitation(interieur, ctx);
      continue;
    }

    /* --- tableau --------------------------------------------------- */
    if (ligne.includes('|') && i + 1 < lignes.length && estSeparateurTableau(lignes[i + 1])) {
      const entetes = cellulesDe(ligne);
      const aligns = alignementsTableau(lignes[i + 1]);
      i += 2;
      const corps = [];
      while (i < lignes.length && lignes[i].includes('|') && lignes[i].trim() !== '') {
        corps.push(cellulesDe(lignes[i]));
        i++;
      }
      html += rendreTableau(entetes, aligns, corps, ctx);
      continue;
    }

    /* --- liste ----------------------------------------------------- */
    if (/^ {0,3}([-*+]|\d+[.)])\s/.test(ligne)) {
      const debut = i;
      while (i < lignes.length && lignes[i].trim() !== '') i++;
      html += rendreListe(lignes.slice(debut, i), ctx);
      continue;
    }

    /* --- paragraphe ------------------------------------------------ */
    const para = [ligne];
    i++;
    while (i < lignes.length && !ouvreUnBloc(lignes[i])) { para.push(lignes[i]); i++; }
    const rendu = rendreInline(para.join('\n'), ctx).replace(/\n/g, '<br>').trim();
    if (rendu !== '') html += '<p>' + rendu + '</p>';
  }

  return html;
}

/** Citation simple, ou callout si la première ligne porte [!type]. */
function rendreCitation(lignes, ctx) {
  const tete = (lignes[0] || '').match(/^\s*\[!([\w-]+)\]([+-]?)\s*(.*)$/);
  if (!tete) {
    return '<blockquote>' + rendreBlocs(lignes, ctx) + '</blockquote>';
  }

  const type = ALIAS_CALLOUT[tete[1].toLowerCase()] || 'note';
  const repli = tete[2];                        // '' fixe, '+' ouvert, '-' fermé
  const titre = tete[3].trim() || TITRE_CALLOUT[type];
  const corps = rendreBlocs(lignes.slice(1), ctx);
  const titreHTML = rendreInline(titre, ctx);

  if (repli === '') {
    return '<div class="callout" data-callout="' + type + '">'
      + '<div class="callout-titre">' + titreHTML + '</div>'
      + (corps ? '<div class="callout-corps">' + corps + '</div>' : '')
      + '</div>';
  }
  return '<details class="callout callout-pliable" data-callout="' + type + '"'
    + (repli === '+' ? ' open' : '') + '>'
    + '<summary class="callout-titre">' + titreHTML + '</summary>'
    + '<div class="callout-corps">' + corps + '</div></details>';
}

function rendreTableau(entetes, aligns, corps, ctx) {
  const cel = (c, n, balise) => {
    const a = aligns[n] ? ' style="text-align:' + aligns[n] + '"' : '';
    return '<' + balise + a + '>' + rendreInline(c.replace(/\\\|/g, '|'), ctx) + '</' + balise + '>';
  };
  let h = '<div class="table-defile"><table><thead><tr>';
  entetes.forEach((c, n) => { h += cel(c, n, 'th'); });
  h += '</tr></thead><tbody>';
  corps.forEach((ligne) => {
    h += '<tr>';
    for (let n = 0; n < entetes.length; n++) h += cel(ligne[n] || '', n, 'td');
    h += '</tr>';
  });
  return h + '</tbody></table></div>';
}

/**
 * Listes, imbrication comprise. On avance avec une pile d'indentations :
 * plus profond → on ouvre une liste, moins profond → on en ferme.
 * Une puce dont le contenu commence par [ ] ou [x] devient une tâche.
 */
function rendreListe(lignes, ctx) {
  const items = [];
  lignes.forEach((ligne) => {
    const m = ligne.match(/^(\s*)([-*+]|\d+[.)])\s+([\s\S]*)$/);
    if (m) {
      items.push({ indent: m[1].length, ordonnee: /\d/.test(m[2]), texte: m[3] });
    } else if (items.length) {
      items[items.length - 1].texte += '\n' + ligne.trim();
    }
  });

  let html = '';
  const pile = []; // { indent, ordonnee }
  const fermer = () => { const t = pile.pop(); html += t.ordonnee ? '</li></ol>' : '</li></ul>'; };

  items.forEach((item) => {
    while (pile.length && item.indent < pile[pile.length - 1].indent) fermer();

    if (!pile.length || item.indent > pile[pile.length - 1].indent) {
      html += item.ordonnee ? '<ol>' : '<ul>';
      pile.push({ indent: item.indent, ordonnee: item.ordonnee });
    } else {
      html += '</li>';
    }

    const tache = item.texte.match(/^\[([ xX\/-])\]\s+([\s\S]*)$/);
    if (tache) {
      const etat = tache[1].toLowerCase();
      const fait = etat === 'x';
      html += '<li class="tache' + (fait ? ' tache-faite' : '') + '" data-etat="' + etat.trim() + '">'
        + '<input type="checkbox" disabled' + (fait ? ' checked' : '')
        + ' aria-label="' + (fait ? 'Tâche faite' : 'Tâche à faire') + '"> '
        + rendreInline(tache[2], ctx);
    } else {
      html += '<li>' + rendreInline(item.texte, ctx);
    }
  });

  while (pile.length) fermer();
  return html;
}

/* ------------------------------------------------------------------ */
/* Frontmatter YAML                                                    */
/* ------------------------------------------------------------------ */

/**
 * Détache le frontmatter du corps. Sous-ensemble volontairement étroit
 * de YAML : ce qu'Obsidian écrit lui-même dans le panneau Propriétés,
 * soit « clé: valeur », les listes en tirets et les listes [a, b].
 */
function detacherFrontmatter(source) {
  if (!/^---\n/.test(source)) return { proprietes: null, corps: source };
  const fin = source.indexOf('\n---', 4);
  if (fin === -1) return { proprietes: null, corps: source };

  const brut = source.slice(4, fin).split('\n');
  const finLigne = source.indexOf('\n', fin + 1);
  const corps = finLigne === -1 ? '' : source.slice(finLigne + 1);
  const proprietes = [];

  brut.forEach((ligne) => {
    if (/^\s*$/.test(ligne) || /^\s*#/.test(ligne)) return;
    const tiret = ligne.match(/^\s+-\s+(.*)$/);
    if (tiret && proprietes.length) {
      proprietes[proprietes.length - 1].valeurs.push(tiret[1].trim());
      return;
    }
    const paire = ligne.match(/^([\w .\/-]+):\s*(.*)$/);
    if (!paire) return;
    const valeur = paire[2].trim();
    const liste = valeur.match(/^\[(.*)\]$/);
    proprietes.push({
      cle: paire[1].trim(),
      valeurs: liste
        ? liste[1].split(',').map((v) => v.trim()).filter(Boolean)
        : (valeur === '' ? [] : [valeur])
    });
  });

  return { proprietes, corps };
}

/** Devine le type d'une propriété — c'est ce que fait Obsidian. */
function typeDePropriete(prop) {
  if (prop.valeurs.length === 0) return 'vide';
  if (prop.valeurs.length > 1) return 'liste';
  const v = prop.valeurs[0];
  if (/^(true|false)$/i.test(v)) return 'case';
  if (/^-?\d+(\.\d+)?$/.test(v)) return 'nombre';
  if (/^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2})?$/.test(v)) return 'date';
  return 'texte';
}

function rendreFrontmatter(proprietes, ctx) {
  if (!proprietes || !proprietes.length) return '';
  let h = '<div class="proprietes"><div class="proprietes-titre">Propriétés</div><dl>';
  proprietes.forEach((p) => {
    const type = typeDePropriete(p);
    h += '<div class="propriete" data-type="' + type + '">';
    h += '<dt>' + echapperHTML(p.cle) + '<span class="prop-type">' + type + '</span></dt>';
    h += '<dd>' + (p.valeurs.length
      ? p.valeurs.map((v) => '<span class="prop-val">' + rendreInline(v, ctx) + '</span>').join('')
      : '<span class="prop-vide">—</span>') + '</dd>';
    h += '</div>';
  });
  return h + '</dl></div>';
}

/* ------------------------------------------------------------------ */
/* Notes de bas de page                                                */
/* ------------------------------------------------------------------ */

/** Retire les définitions [^id]: … du corps et les met de côté. */
function detacherNotesBas(source) {
  const definitions = {};
  const gardees = [];
  let courante = null;

  source.split('\n').forEach((ligne) => {
    const def = ligne.match(/^\[\^([\w-]+)\]:\s*(.*)$/);
    if (def) { courante = def[1]; definitions[courante] = def[2]; return; }
    if (courante !== null && /^\s{2,}\S/.test(ligne)) {
      definitions[courante] += '\n' + ligne.trim();
      return;
    }
    courante = null;
    gardees.push(ligne);
  });

  return { definitions, corps: gardees.join('\n') };
}

function rendreNotesBas(ordre, definitions, ctx) {
  if (!ordre.length) return '';
  let h = '<section class="notes-bas" aria-label="Notes de bas de page"><hr><ol>';
  ordre.forEach((id) => {
    const texte = definitions[id] === undefined
      ? '<em>définition manquante</em>'
      : rendreInline(definitions[id], ctx);
    h += '<li id="nbp-' + id + '">' + texte
      + ' <a class="retour" href="#renvoi-' + id + '" aria-label="Retour au texte">&#8617;</a></li>';
  });
  return h + '</ol></section>';
}

/* ------------------------------------------------------------------ */
/* Entrée publique                                                     */
/* ------------------------------------------------------------------ */

/** Rend une source Markdown complète en HTML. Seule entrée utilisée. */
function rendreMarkdown(source) {
  const normalisee = String(source).replace(/\r\n?/g, '\n').replace(/\t/g, '    ');
  const { proprietes, corps } = detacherFrontmatter(normalisee);
  const { definitions, corps: sansNotes } = detacherNotesBas(corps);

  const ctx = { notes: [] };
  const enTete = rendreFrontmatter(proprietes, ctx);
  const contenu = rendreBlocs(sansNotes.split('\n'), ctx);
  const bas = rendreNotesBas(ctx.notes, definitions, ctx);

  return enTete + contenu + bas;
}

export {
  rendreMarkdown, rendreInline, rendreBlocs, echapperHTML,
  detacherFrontmatter, detacherNotesBas, analyserWikilink, urlSure, ancre
};
