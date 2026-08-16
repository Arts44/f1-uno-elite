/* ══════════════════════════════════════════════════════════
   ICONS + LIVRÉES (v2.3 phase B) — le système d'icônes SVG et
   les livrées d'écurie tiennent leurs invariants :
   - typeIcon() couvre les 16 types (pastille pour les couleurs
     de base, famille de 5 pour le reste), en SVG currentColor ;
   - teamLiveries est en parité stricte avec teamColors, dans
     data/metadata.json ET data-embedded.js ;
   - chaque geste déclaré a sa classe .lv-<g> dans styles.css.
   ══════════════════════════════════════════════════════════ */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { icon, typeIcon } from '../app/icons.js';

const meta = JSON.parse(readFileSync(new URL('../app/data/metadata.json', import.meta.url), 'utf8'));
const css = readFileSync(new URL('../app/styles.css', import.meta.url), 'utf8');
const embedded = readFileSync(new URL('../app/data-embedded.js', import.meta.url), 'utf8');

describe('typeIcon — la famille de 5 + pastilles', () => {
  test('les 4 couleurs de base donnent une pastille CSS', () => {
    for (const ty of ['blue', 'green', 'red', 'yellow']) {
      const html = typeIcon(ty);
      assert.match(html, new RegExp(`cdot-${ty}`), ty);
      assert.ok(!html.includes('<svg'), `${ty} : pastille, pas de SVG`);
    }
  });

  test('chaque type de metadata.json a une icône non vide', () => {
    for (const ty of Object.keys(meta.cardTypes)) {
      const html = typeIcon(ty);
      assert.ok(html.length > 20, `typeIcon(${ty}) vide`);
    }
  });

  test('foil, nitro, wild, dual, promo sont des SVG distincts', () => {
    const set = new Set(['blue_foil', 'nitro_foil', 'wild_foil', 'blue_red_foil', 'promo_blue'].map(typeIcon));
    assert.equal(set.size, 5, 'deux types partagent le même dessin');
    for (const html of set) assert.match(html, /stroke="currentColor"/);
  });
});

describe('icon() — interface', () => {
  test('les marqueurs de carte existent (sceau, couronne, danger)', () => {
    for (const name of ['seal', 'crown', 'danger', 'star', 'heart', 'check', 'refresh', 'globe']) {
      assert.match(icon(name), /^<svg/, name);
    }
  });
  test('le danger est PLEIN (exception au trait), le sceau aussi', () => {
    assert.match(icon('danger'), /fill="currentColor"/);
    assert.match(icon('seal'), /fill="currentColor"/);
  });
});

/* ── Marqueurs de coin de tuile ──
   Trois marqueurs se posent en absolu sur .card-visual : couronne
   (champion, haut-gauche), pastille réserve (haut-droite) et sceau set
   complet (haut-droite, décalé sous la pastille quand les deux sont là).

   Le défaut corrigé en 1.55.1 : la pastille réserve dessinait `refresh`
   (« recharger ») pendant que la catégorie réserve dessinait `swap`
   (« remplaçant »). Deux tracés pour un concept, visibles côte à côte.
   Rien ne l'attrapait — d'où ces trois tests, qui lisent la SOURCE. */
describe('marqueurs de coin de tuile', () => {
  const render = readFileSync(new URL('../app/render.js', import.meta.url), 'utf8');
  const markerLine = re => (render.match(re) || [''])[0];

  test('le marqueur réserve dessine la MÊME icône que la catégorie réserve', () => {
    const line = markerLine(/<span class="replacement-icon"[^\n]*/);
    assert.ok(line, 'marqueur réserve introuvable dans render.js');
    const used = (line.match(/icon\('([^']+)'\)/) || [])[1];
    assert.equal(used, meta.categories.reserve.icon,
      `la tuile dessine « ${used} », la catégorie « ${meta.categories.reserve.icon} »`);
  });

  test('les trois marqueurs passent par icon() — aucun émoji résiduel', () => {
    for (const cls of ['crown', 'replacement-icon', 'set-flag']) {
      const line = markerLine(new RegExp(`<span class="${cls}"[^\\n]*`));
      assert.ok(line, `marqueur ${cls} introuvable`);
      assert.match(line, /\$\{icon\('/, `${cls} : le marqueur n'utilise pas icon()`);
      assert.ok(!/\p{Extended_Pictographic}/u.test(line), `${cls} : émoji résiduel`);
    }
  });

  /* `swap` et `refresh` sont deux paires d'arcs fléchés : comparés à 12 et
     14 px ils sont le même dessin pour l'œil. Ils ne peuvent donc pas
     désigner deux choses différentes dans la même app. `swap` est réservé
     à la réserve ; les doubles ont `copy`, le rechargement garde `refresh`. */
  test('swap ne sert QU’À la réserve', () => {
    const sources = ['../app/render.js', '../app/stats.js', '../app/badges.js', '../app/update.js', '../app/pin.js']
      .map(f => readFileSync(new URL(f, import.meta.url), 'utf8'));
    const usages = sources.flatMap(s => [...s.matchAll(/icon\('swap'[^)]*\)/g)].map(m => m[0]));
    assert.equal(usages.length, 1,
      `swap est utilisé ${usages.length} fois : il ne doit désigner que la réserve`);
    assert.equal(meta.categories.reserve.icon, 'swap');
  });

  test('les doubles ne dessinent PAS un arc fléché (voisin de swap)', () => {
    const render = readFileSync(new URL('../app/render.js', import.meta.url), 'utf8');
    const stats = readFileSync(new URL('../app/stats.js', import.meta.url), 'utf8');
    assert.match(render, /'doubles',\s*'copy'/, 'le statut « doubles » doit utiliser copy');
    assert.ok(!/icon\('refresh'\)/.test(stats),
      'les outils de collectionneur ne doivent plus emprunter refresh');
    assert.match(icon('copy'), /<rect/, 'copy doit rester un dessin de rectangles, pas un arc');
  });

  test('le sceau glisse sous LES DEUX marqueurs de catégorie', () => {
    // Un seul des deux sélecteurs aurait suffi à laisser passer une
    // superposition : le directeur porte le même rôle que la réserve.
    assert.match(css, /\.replacement-icon\s*~\s*\.set-flag\s*,\s*\n?\s*\.director-icon\s*~\s*\.set-flag\s*\{[^}]*top:\s*var\(--mark-stack\)/,
      'sans ces DEUX règles, sceau et marqueur se superposent au même coin');
    assert.match(css, /--mark-stack:\s*\d+px/, '--mark-stack doit être un jeton, pas une valeur répétée');
  });

  /* ── Les marqueurs de coin sont neutres (1.58.0) ──
     La tuile porte déjà la couleur d'écurie, la rareté et les foils : un
     marqueur teinté de plus est du bruit sur une information secondaire.
     Les quatre se lisent par leur FORME. */
  test('aucun marqueur de coin ne porte de teinte propre', () => {
    const bloc = css.slice(css.indexOf('MARQUEURS DE COIN'), css.indexOf('SET COMPLET'));
    assert.ok(bloc.length > 200, 'bloc des marqueurs introuvable');
    assert.ok(!/var\(--gold|#FACC15|#B8860B|#FF6B35|#FFD700/.test(bloc),
      'un marqueur de coin a repris une teinte');
    for (const jeton of ['--mark-ink', '--mark-scrim', '--mark-box', '--mark-glyph']) {
      assert.match(css, new RegExp(jeton + ':'), `jeton ${jeton} absent`);
    }
  });

  test('l’or reste sur le CORPS de la carte, pas dans le coin', () => {
    // .ic-crown est posée sur une surface de thème (ligne « #004 · ♛ ») :
    // la teinte y est légitime, et sa disparition serait une régression.
    assert.match(css, /\.ic-crown\{color:var\(--gold/);
  });

  test('le directeur porte un marqueur, le Grand Prix n’en porte pas', () => {
    const render = readFileSync(new URL('../app/render.js', import.meta.url), 'utf8');
    assert.match(render, /category==='directeur'\?`<span class="director-icon"[^`]*icon\('headset'\)/,
      'le directeur doit porter le casque-micro de sa catégorie');
    assert.ok(!/category==='gp'\?`<span class="[a-z-]*icon"/.test(render),
      'le Grand Prix ne doit PAS recevoir de marqueur : son tracé de circuit est déjà unique');
    assert.match(render, /ON MARQUE CE QUI SE CONFOND/,
      'la règle doit rester écrite là où les marqueurs sont posés');
  });
});

describe('teamLiveries — parité et couverture CSS', () => {
  test('mêmes clés que teamColors (metadata.json)', () => {
    assert.deepEqual(Object.keys(meta.teamLiveries).sort(), Object.keys(meta.teamColors).sort());
  });

  test('data-embedded.js embarque les mêmes livrées', () => {
    const m = embedded.match(/"teamLiveries":(\{.*?\}\})/s);
    assert.ok(m, 'teamLiveries absent de data-embedded.js');
    assert.deepEqual(JSON.parse(m[1]), meta.teamLiveries);
  });

  test('couleurs valides et bande .lvb présente (arbitrage P1 — les gestes ne peignent plus la tuile)', () => {
    for (const [team, lv] of Object.entries(meta.teamLiveries)) {
      assert.match(lv.c1, /^#[0-9A-Fa-f]{6}$/, team);
      assert.match(lv.c2, /^#[0-9A-Fa-f]{6}$/, team);
    }
    assert.ok(css.includes('.lvb'), 'colonne de livrée .lvb absente de styles.css');
  });

  /* ── Le champ `g` est PARTI, et ce test garde son absence ──
     `g` nommait un geste géométrique (lame, coin, vague…) peint sur la
     tuile jusqu'à l'arbitrage P1 (1.33.0), qui a rendu le fond à la
     rareté et l'écurie au casque. Le dessin est parti ; le champ est
     resté, avec un test qui exigeait son unicité.

     Ce test-là ne gardait rien : aucun code ne lisait `g`. Il ne
     produisait qu'une contrainte de saisie — en ajoutant deux écuries
     factices pour 2026, il a fallu INVENTER deux gestes (`essai-a`,
     `essai-b`) pour le satisfaire. Un test qui fabrique du travail sans
     protéger de comportement est un coût net.

     Et l'implémenter n'était pas mieux : la bande fait 7 px de large.
     C'est le même argument que pour `swap` et `refresh`, deux icônes
     indistinguables à 12-14 px — une géométrie a besoin de surface. À
     7 px, dix gestes seraient dix fois la même colonne. L'écurie est
     d'ailleurs déjà dite trois fois sur la tuile : couleurs de la bande,
     couleur du casque ou du monogramme, et son nom en toutes lettres. */
  test('le champ « g » ne revient pas dans les livrées', () => {
    for (const [team, lv] of Object.entries(meta.teamLiveries)) {
      assert.deepEqual(Object.keys(lv).sort(), ['c1', 'c2'],
        `${team} : une livrée ne porte que ses deux couleurs`);
    }
  });
});

/* ── Le dernier émoji d'interface ───────────────────────────────
   `👁 Parcourir` a survécu à la passe de 1.31.0 qui a remplacé tous
   les émojis par des SVG. Il portait deux fautes à la fois, et la
   seconde explique pourquoi personne ne l'a vu : le bouton avait
   `data-i18n="login.browse"`, or applyLanguage() écrit dans
   textContent — l'émoji était donc effacé au premier rendu, et ne
   restait visible qu'en français, par accident.

   D'où la forme retenue : l'icône est un enfant du bouton, et le
   libellé vit dans un <span data-i18n>. Toute régression qui
   remettrait data-i18n sur le bouton effacerait l'icône en silence
   — ce test est là pour que ce silence fasse du bruit. */
describe('écran de verrouillage — le bouton Parcourir', () => {
  const html = readFileSync(new URL('../app/index.html', import.meta.url), 'utf8');
  const dev = readFileSync(new URL('../app/index-dev.html', import.meta.url), 'utf8');

  for (const [nom, src] of [['index.html', html], ['index-dev.html', dev]]) {
    const ligne = src.split('\n').find(l => l.includes('viewerBrowseBtn'));

    test(`${nom} — aucun émoji dans le bouton`, () => {
      assert.ok(ligne, 'bouton introuvable');
      assert.ok(!/\p{Extended_Pictographic}/u.test(ligne), `${nom} : émoji résiduel`);
    });

    test(`${nom} — le libellé est traduit SANS effacer l’icône`, () => {
      assert.match(ligne, /<svg class="ic"/, `${nom} : l’icône a disparu`);
      assert.ok(!/id="viewerBrowseBtn"[^>]*data-i18n=/.test(ligne),
        `${nom} : data-i18n est revenu sur le bouton — textContent effacera l’icône`);
      assert.match(ligne, /<span data-i18n="login\.browse">/,
        `${nom} : le libellé n’est plus traduit`);
    });
  }
});

/* ══ LE CASQUE : UN dessin, pas trois (1.63.0) ══
   Avant : le symbol des tuiles, l'icône de catégorie et l'icône d'app
   étaient TROIS tracés indépendants — le défaut que le lockup a corrigé.
   Depuis 1.63.0, HELMET_GEOM est l'unique source ; ces tests tiennent
   l'unicité sur le CODE (le tracé lui-même), pas sur les commentaires. */
describe('casque — une seule géométrie', () => {
  const src = readFileSync(new URL('../app/icons.js', import.meta.url), 'utf8');
  test('le tracé du casque n\'existe qu\'UNE fois dans le module', () => {
    const occurrences = src.split('M331.947,226.808').length - 1;
    assert.equal(occurrences, 1,
      'le path du casque doit vivre dans HELMET_GEOM et nulle part ailleurs');
  });
  test('les deux consommateurs passent par HELMET_GEOM', () => {
    assert.match(src, /symbol id="icHelmC1" viewBox="0 0 120 120">\$\{HELMET_GEOM\}/,
      'le symbol des tuiles doit interpoler la constante');
    // Le branchement COMPLET : la branche 'helmet' d'icon() doit rendre
    // HELMET_GEOM — vérifier l'interpolation « quelque part » laissait
    // passer un débranchement (contrôle négatif resté vert, resserré).
    assert.match(src, /if\(name === 'helmet'\)\{\s*return `<svg[^`]*\$\{HELMET_GEOM\}/,
      'icon(\'helmet\') doit rendre la même constante');
  });
  test('les COPIES CUITES des deux HTML portent le même tracé', () => {
    /* Un HTML statique ne peut pas interpoler HELMET_GEOM : index.html et
       index-dev.html portent une copie cuite du symbol. C'est la 4e
       implémentation que l'inventaire avait ratée — découverte parce que
       le DOM servait l'ANCIEN casque pendant que l'icône de catégorie
       servait le nouveau. Ce test tient les copies ensemble. */
    for (const f of ['index.html', 'index-dev.html']) {
      const html = readFileSync(new URL(`../app/${f}`, import.meta.url), 'utf8');
      assert.equal(html.split('M331.947,226.808').length - 1, 1,
        `${f} : la copie cuite doit porter le tracé de HELMET_GEOM, une fois`);
      assert.ok(!html.includes('M20 76c-3-11'),
        `${f} : l'ancien galet ne doit pas rester dans le symbol cuit`);
    }
  });
  test('l\'ancien dessin stroke de la catégorie a bien disparu', () => {
    assert.ok(!src.includes('M3.7 14.3a8.3'),
      'le troisième dessin (icône de catégorie au trait) ne doit pas revenir');
  });
});
