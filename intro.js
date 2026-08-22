/* ══════════════════════════════════════════════════════════════════
   LA SÉQUENCE D'INTRO — quatorze plans, vingt secondes, puis gel.

   CHARGÉE SEULEMENT AU CLIC. La page d'accueil ne paie rien pour un
   film que personne n'a demandé : ni octet transféré, ni requête. Le
   chargeur tient en quatre lignes dans index.html.

   ELLE RÉUTILISE LE MOTEUR DU FOND, exposé sur `window.__f1` — mêmes
   particules, mêmes fonctions d'assouplissement, même contrat de
   disposition {x, y, w, h, o, tint}. Rien n'est écrit deux fois.

   ══ LE GARDE D'EXÉCUTION — ON NE DÉTECTE PAS L'APPAREIL ══════════

   Aucune liste d'appareils ici. Une liste est fausse le jour où on
   l'écrit et se périme ensuite ; la séquence, elle, sait se juger.
   On réutilise le raisonnement de fps.js : la cadence de l'appareil
   se détecte sur les intervalles 10 à 50, un SAUT est un intervalle
   au-delà de 1,75 fois cette base — vrai à 60 comme à 120 Hz — et
   c'est la plus longue SÉRIE consécutive qui dit le bégaiement, pas
   une moyenne.

   LA DÉCISION SE PREND UNE FOIS, À 2 SECONDES.

   ⚠️ CES DEUX NOMBRES SONT CHOISIS, NON MESURÉS. Personne ne les a
   calibrés sur un appareil, parce qu'il n'y en avait aucun le jour où
   ils ont été écrits (POINTS-SIGNALES n°32). Ne pas les lire dans un
   mois comme des seuils étalonnés : ce sont des jugements, appuyés sur
   le raisonnement ci-dessous et sur rien d'autre. C'est le cas ⑰ du
   registre, et il a déjà servi trois fois — un relevé unique, ou ici
   un raisonnement sans relevé, se met à voyager comme s'il était
   mesuré.

   CE QUE LE POSTE DE BUREAU A QUAND MÊME ÉTABLI, et qui est une BORNE,
   pas une calibration : en fonctionnement normal, série max = 0 et
   sauts = 0 sur 720 trames (mesure du fond animé, même détecteur).
   Le seuil ne coupe donc pas à tort sur une machine saine. Il ne dit
   rien de ce qu'il fait sur une machine lente.

   CE QUI LES VALIDERAIT : la séquence ouverte sur un appareil réel,
   avec `?fps=1` pour lire la série effective, et le jugement à l'œil
   sur la question que le nombre encode — à partir de quand le
   bégaiement gêne assez pour qu'on préfère l'état final. Tant que ça
   n'a pas eu lieu, le seuil est une hypothèse qui tourne en
   production.

   Les deux nombres et leur raisonnement :

     · le seuil de SÉRIE = 3 sauts consécutifs. À 60 Hz cela vaut
       environ 50 ms d'immobilité, la limite basse de ce qui se voit.
     · la fenêtre = jusqu'à 2 s, et pas 1,5. La base n'est CONNUE
       qu'après 40 intervalles, soit ~0,67 s à 60 Hz : avant, aucun
       saut ne peut être compté. Une décision à 1,5 s ne disposerait
       donc que de ~0,8 s de mesure, dont les premières trames — les
       plus lourdes de toute la séquence, premier rendu et montée en
       température du JIT. À 2 s il reste ~1,3 s de mesure propre, et
       la coupure tombe encore pendant le plan 2 : assez tôt pour se
       lire « ça n'a pas démarré » plutôt que « ça a cassé ».

   UNE SEULE DÉCISION, JAMAIS DEUX. Une séquence qui s'arrête au
   milieu est pire qu'une qui bégaie. Passé 2 s, le garde se tait
   définitivement, quoi qu'il arrive ensuite.

   ══ CE QUE LE GARDE N'EXERCE PAS (㉔) ═══════════════════════════

   Il compte des trames perdues. Il ne mesure NI la chaleur, NI la
   batterie, NI le confort. Un appareil qui tient 60 fps en chauffant
   n'est pas détecté, et un appareil qui bégaie une fois passé les
   2 s ne l'est pas non plus — c'est le prix de la décision unique.
   ET IL N'A ÉTÉ ÉPROUVÉ SUR AUCUN APPAREIL MOBILE : c'est le premier
   contrôle à écrire en octobre. Ce qui EST vérifié, c'est qu'il sait
   couper — un bégaiement artificiel le déclenche, et le filet le
   rejoue à chaque livraison.
   ══════════════════════════════════════════════════════════════════ */

const N = 998, CARTES = 101;

/* LES NOMBRES VIENNENT DU JEU DE DÉMO, PAS D'UNE COLLECTION RÉELLE.
   Ils sont dérivés de capture_seed.py — le même seed qui produit les
   deux captures affichées sous le CTA. Quelqu'un qui lit « 72 of 101 »
   ici puis voit 72/101 dans la capture comprend que c'est la même app,
   pas une illustration. PROVENANCE DÉCLARÉE (㉒) : verify_vitrine.py
   exécute capture_seed.py et échoue si l'un de ces nombres diverge. */
const POSSEDEES = 72, MANQUANTES = 29, WISHLIST = 16, DOUBLES = 8;
const BADGES_OK = 33, BADGES = 120, VARIANTES_031 = 12;

/* ══ LES DOUZE VARIANTES DE #031, DANS LEUR ORDRE ET LEURS TEINTES ══
   L'ordre est celui de capture_seed.py pour la carte 031 ; les teintes
   sont RELEVÉES dans app/styles.css, pas inventées — chacune est la
   couleur dominante que l'app donne à ce type :
     blue/green/red/yellow  = le point haut du radial de `.tv-<type>`
     *_foil                 = le même point haut, éclairci (l'app le fait)
     duals                  = l'ARRÊT MÉDIAN du dégradé, là où les deux
                              couleurs fusionnent (#5c2f8e, #7a9a1a)
     wild                   = `--wild-ink` en thème sombre (#DEDADC) —
                              le wild est noir, et l'app elle-même
                              l'encre en clair sur fond sombre
     nitro                  = la mauve de sa bordure, rgb(200,140,255)
   POURQUOI ÇA COMPTE : le plan s'appelle « 12 variants ». Douze tuiles
   blanches identiques y racontent exactement le contraire de ce que le
   titre annonce. Le sujet du plan EST la différence entre elles. */
const VARIANTES = [
  ['blue',             '#4A90D9'],
  ['green',            '#2ECC71'],
  ['blue_foil',        '#7EC2FF'],
  ['red',              '#FF5040'],
  ['yellow',           '#FFE14D'],
  ['green_foil',       '#5EE694'],
  ['red_foil',         '#FF7A6E'],
  ['yellow_foil',      '#FFEFA0'],
  ['blue_red_foil',    '#5C2F8E'],
  ['green_yellow_foil','#7A9A1A'],
  ['wild_foil',        '#DEDADC'],
  ['nitro_foil',       '#C88CFF'],
];

const ROSSO = '#FF2800';          /* rosso corsa — la couleur de l'écurie */
const ROUGE = '#FF4757', INK = '#F3F0F1', GRIS = '#8A8A98', OR = '#FFD166';

/* LA COLLECTION DE L'AUTRE COLLECTIONNEUR est tirée d'un hachage
   stable — pas d'un aléa, sinon le plan changerait à chaque ouverture
   et le filet ne pourrait rien en dire. Elle contient 68 des 101, dont
   19 qui manquent à la tienne : ce sont les 19 correspondances vertes
   du plan « Compare ». SEUIL CHOISI, NON MESURÉ (㉒) : le 70 du hachage
   l'est — il a été pris pour donner « une collection voisine de la
   tienne, avec de quoi échanger ». Les 68 et les 19, eux, en TOMBENT,
   ils ne sont pas choisis. ET RIEN NE LES VÉRIFIE : ce sont des
   nombres de décor, pas des données ; aucun d'eux n'est écrit à
   l'écran, donc aucun ne peut mentir au lecteur. */
const SIEN = id => ((id * 2654435761 + 40503) >>> 0) % 100 < 70;
const RANG_DON = (() => { const r = {}; let n = 0;
  for (let id = 0; id < CARTES; id++) if (id >= POSSEDEES && SIEN(id)) r[id] = n++;
  return r; })();
const DONS = Object.keys(RANG_DON).length;

/* ══ LES CINQ CRANS, AVEC LEUR DÉCLENCHEUR ET LEURS VRAIES TEINTES ══
   Les libellés sont ceux de translations.js, l'ordre est celui que
   cardRarity() produit pour la #031 (champion, base « mythic »).

   ⚠️ DIVINE ET ETERNAL NE SONT PAS DES COULEURS PLATES, et une première
   version les a rendus indiscernables en croyant le contraire. Les
   métadonnées portent bien un hex pour chacun — #FACC15 et #D99E00,
   deux jaunes voisins — MAIS C'EST PRÉCISÉMENT LA VALEUR DONT L'APP SE
   DÉTOURNE : `rarityChipStyle()` rend '' pour ces deux-là, et
   `RARITY_CSS_PAINTED` les confie à `.rar-divine-bg` et
   `.rar-eternal-bg`. Le hex n'est qu'un repli. Dans le produit :
     divine  = dégradé iridescent animé, violet → bleu → turquoise →
               jaune → rose (styles.css : `.rar-divine-bg`)
     eternal = noir et or, filon doré, bordure et lueur or — le
               commentaire du produit dit « impossible à confondre »
   LE PRODUIT LES DISTINGUE TRÈS BIEN ; c'est ma table qui les avait
   aplatis. Chaque cran porte donc une LISTE de teintes, distribuée sur
   les particules de la bordure et du bandeau — ce qu'un champ de
   particules sait faire et qu'un aplat ne sait pas. */
const CRANS = [
  ['Mythic',     ['#00A86B'],                'the four base colours'],
  ['Ultra Rare', ['#E4002B'],                'any single foil'],
  ['Cosmic',     ['#5B4BE0'],                'a dual foil'],
  ['Divine',     ['#8B5CF6', '#3B82F6', '#14B8A6', '#FACC15', '#F472B6'], 'wild or nitro'],
  ['Eternal',    ['#FACC15', '#FACC15', '#FFF6C9', '#FACC15'], 'the complete set'],
];

/* ══ LE CASQUE A ÉTÉ RETIRÉ, ET IL N'EST PAS RÉOUVRABLE ICI ═══════
   Le plan d'ouverture était une silhouette de casque. Elle ne se lisait
   pas comme un casque — même à densité corrigée (rapport pixels/points
   ramené de 8,0 à 1,7, le meilleur des huit formes), le trait était net
   et continu mais la forme lisait « boucle avec une visière ». Une
   silhouette qui demande un effort d'interprétation ne tient pas deux
   secondes, et celle-là passait la première.

   CE QUE LA MESURE ÉTABLIT, ET QUI FERME LA PORTE : le seul remède
   qu'on sache nommer est de le DESSINER PLEIN plutôt que TRACÉ — une
   masse fermée avec la visière en creux, parce qu'un contour de casque
   ressemble à tous les contours de masses fermées. Or remplir une
   surface fait exploser le rapport pixels/points : c'est exactement le
   défaut qu'on vient de corriger sur le « 44 » (rempli 5,1, tracé
   4,05) et sur le trophée (rempli, il est devenu une masse grise
   floue). SUR UNE SURFACE PLEINE, DES POINTS ASSEZ NOMBREUX POUR LA
   REMPLIR N'EXISTENT PAS — le budget est de 998 pour toute la séquence.

   DONC : le casque n'est pas réouvrable avec ce moteur. Le rouvrir
   demanderait un moteur différent — un tracé vectoriel, une image, un
   rendu qui ne passe pas par des particules — ou rien. On ne remet pas
   dans le code une condition dont la mesure a montré qu'elle produit
   le défaut qu'on vient de corriger.

   Le « 44 » a pris sa place ET SES DEUX LIGNES DE TEXTE. Le plan qui
   portait « 44 / the number on the car » disparaît donc aussi : le
   chiffre est dessiné, il n'a pas besoin d'être aussi écrit. Ce qui
   manquait au casque — un signe qu'on reconnaît sans l'interpréter —
   le 44 l'a par construction. */
const PLANS = [
  ['num',      0.15,  1.90, 'One card',                    'Lewis Hamilton · #031 · Scuderia Ferrari HP'],
  ['eventail', 1.90,  3.20, '<em>12</em> variants',        'on this card — not every card has the same'],
  ['mur',      3.20,  5.00, '<em id="cnt">12</em> across 101 cards', 'every variant counts on its own'],
  ['grille',   5.00,  6.55, '<em>72</em> of 101',          'what you own, card by card'],
  ['manquant', 6.55,  8.15, '<em>29</em> missing',         '16 of them on your wishlist'],
  ['doubles',  8.15,  9.25, '<em>8</em> doubles',          'ready to trade'],
  ['rarete',   9.25, 11.85, '<em id="cran">Mythic</em>',   '<span id="decl">the four base colours</span>'],
  ['qr',      11.85, 13.15, 'Share the list',              'one sheet, one code, no account'],
  ['compare', 13.15, 14.70, 'Compare',                     'what another collector can give you'],
  ['trophee', 14.70, 16.00, '<em>33</em> of 120',          'badges unlocked'],
  ['spa',     16.00, 17.10, '<em>Spa</em>-Francorchamps',  '2025 season · 2026 ready'],
  ['phone',   17.10, 18.30, 'Works offline',               'installed once, then no network needed'],
  ['fin',     18.30, 20.00, '<span id="lg">Seven languages</span>', 'pick yours, it remembers'],
];
/* ══ DEUX PISTES CHIFFRÉES, DÉLIBÉRÉMENT NON PRISES ══════════════

   ① UN BATTEMENT PAR CRAN AU PLAN « rarete ». Aujourd'hui les cinq
   crans passent à 350 ms ; chacun ne porte qu'un changement (la
   couleur de la carte, un déclencheur de plus), ce qui suffit à suivre
   mais pas à s'arrêter sur chacun. COÛT CHIFFRÉ : il faudrait porter
   le plan à 3,40 s, soit 0,80 s à prendre sur « mur », « grille » et
   « qr ». NON PRIS, ET LA RAISON EST BONNE : « mur » et « grille »
   sont deux des plans qui fonctionnent le mieux. Les raccourcir pour
   donner de l'air à un plan qu'on n'a pas encore vu tourner, ce serait
   payer avant de savoir. À rouvrir seulement si « rarete » se révèle
   illisible EN MOUVEMENT, pas sur photo.

   ② LES SEPT LANGUES DESSINÉES PAR LES PARTICULES au plan de sortie —
   le mot « cards » en sept langues, en silhouette tracée, comme le
   « 44 ». REFUSÉ, et pas pour le coût : sept silhouettes de LONGUEURS
   DIFFÉRENTES qui se succèdent sur 1,7 s ne se lisent ni comme dessin
   ni comme texte, elles clignotent. Le « 44 » tient parce qu'il est
   SEUL et qu'il DURE — 1,75 s pour une seule forme. CE PLAN EST DONC
   ASSUMÉ COMME TEXTUEL : la langue est du texte, et c'est le titre qui
   la porte ; le fond ne fait que rappeler la collection. CONDITION DE
   RÉOUVERTURE : un plan de sortie plus long, ou moins de langues
   montrées — deux ou trois au lieu de sept. */

/* LES 1,45 s LIBÉRÉES NE SONT PAS RENDUES, ELLES SONT REDISTRIBUÉES.
   Le plan d'ouverture prend 1,75 s au lieu de 1,20 — c'est le premier
   regard, il porte le nom et l'écurie. Les 0,90 s restantes vont aux
   trois plans qui demandent le plus de lecture : « grille » +0,25,
   « manquant » +0,30 (le geste des 29 qui sortent a besoin de durer)
   et « compare » +0,35 (deux collections à lire, pas une).

   PUIS « rarete » EST PASSÉ DE 2,00 À 2,60 s, et c'est un arbitrage
   assumé. Ce plan doit montrer CINQ montées de cran, chacune avec son
   déclencheur : à 2,00 s ça fait 400 ms par cran, transition d'entrée
   comprise — le premier cran arrive avant que la carte soit posée et
   le dernier n'a pas le temps d'être vu. À 2,60 s, transition plafonnée
   à 800 ms : la carte est POSÉE à 0,80 s, le premier cran tombe à
   0,85 s, puis un cran toutes les 350 ms, et la chaîne complète tient
   350 ms de plus plus toute la transition de sortie.
   CE QUE 2,60 s N'ACHÈTE PAS : un temps de lecture par cran. 350 ms
   suffisent parce que chaque cran ne porte QU'UN changement — la
   couleur de la carte, et un déclencheur de plus dans la rangée. Pour
   un vrai temps d'arrêt sur chacun il faudrait 3,40 s, à prendre sur
   « mur », « grille » et « qr » ; ce n'est pas fait. LES 0,60 s SONT PRISES SUR DEUX PLANS SANS ANIMATION
   INTERNE : « spa » (1,40 → 1,10, une silhouette fixe) et « fin »
   (2,00 → 1,70, dont le cycle des langues est resserré d'autant). */
const LANGUES = ['Seven languages', 'Sept langues', 'Sieben Sprachen', 'Siete idiomas',
                 'Sette lingue', 'Zeven talen', 'Siedem języków'];
/* CE QUI SE MONTRE À CHAQUE CRAN — le déclencheur, pas le nom. Les
   teintes sont celles de VARIANTES, donc les mêmes qu'au plan
   « 12 variants » : la carte monte parce qu'on a réuni CES cartes-là,
   et le spectateur les a vues deux plans plus tôt. `c` est le nombre
   de colonnes de la petite grappe. */
const DECLENCHEURS = [
  { c: 2, t: ['#4A90D9', '#2ECC71', '#FF5040', '#FFE14D'] },   /* les quatre couleurs de base */
  { c: 1, t: ['#7EC2FF'] },                                    /* un foil simple */
  { c: 2, t: ['#5C2F8E', '#7A9A1A'] },                         /* les deux duals */
  { c: 2, t: ['#DEDADC', '#C88CFF'] },                         /* wild et nitro */
  { c: 4, t: VARIANTES.map(v => v[1]) },                       /* le set complet */
];
const DECL_DEB = DECLENCHEURS.reduce((a, d) => (a.push(a[a.length - 1] + d.t.length), a), [0]);
/* LE PAS DES CRANS SE DÉDUIT DE LA DURÉE DU PLAN, il n'est pas posé
   en face d'elle. `CRAN_T0` est le temps qu'il faut pour poser la carte
   — c'est le plafond de la transition, 800 ms, plus 50 — et les cinq
   crans se partagent CE QUI RESTE. Écrit en absolu (« 350 ms »), le
   dernier cran serait tombé hors du plan à la première fois qu'on
   raccourcit « rarete », sans que rien ne le signale. */
const CRAN_T0 = 850;

/* QUELLES CARTES SONT EN DOUBLE — huit indices répartis dans les 72
   possédées AU NOMBRE D'OR. Un pas fixe (« une tous les neuf ») les
   alignait toutes dans la même colonne dès que la grille en comptait
   neuf : une bande verticale, pas huit cartes réparties. Et le nombre
   de colonnes DÉPEND DE LA LARGEUR de l'écran, donc aucun pas entier
   ne peut être premier avec lui à coup sûr. */
const DOUBLES_ID = Array.from({ length: DOUBLES },
  (_, k) => Math.floor((k * 0.6180339887498949 % 1) * POSSEDEES));
const EST_DOUBLE = new Set(DOUBLES_ID);

const DUREE = 20000, DECISION_MS = 2000, SERIE_MAX = 3;

/* L'APOTHÉOSE SE COMPTE DEPUIS LA FIN, PAS DEPUIS LE DÉBUT DU DERNIER
   PLAN. Le lockup et le CTA sont le paiement de la séquence : ils
   doivent paraître 500 ms avant l'arrêt de la boucle, quelle que soit
   la durée qu'on donne au dernier plan. Écrit depuis `debut('fin')`,
   raccourcir ce plan repoussait l'apothéose hors des 20 s — en
   silence, comme toutes les valeurs recopiées. */
const APOTHEOSE = DUREE - 500;

/* L'ÉTALEMENT DES PARTICULES : la dernière part quand 20 % du trajet
   est fait. Le complément se CALCULE (voir plus bas), il ne se recopie
   pas — c'est la même règle que pour les bornes des plans. */
const ETAL = .20;

/* LES INSTANTS SE LISENT DANS PLANS, ILS NE SE RECOPIENT PAS. Trois
   animations internes (le compteur, les crans, les langues) partaient
   d'un littéral en millisecondes recopié à la main depuis le tableau.
   Retirer un plan les a toutes décalées d'un coup, en silence — un
   compteur qui démarre 900 ms trop tard n'échoue nulle part, il se
   voit. Le tableau est désormais la seule source. */
const debut = nom => PLANS[PLANS.findIndex(p => p[0] === nom)][1] * 1000;
const duree = nom => { const p = PLANS[PLANS.findIndex(q => q[0] === nom)];
                       return (p[2] - p[1]) * 1000; };

/* ── SILHOUETTES ─────────────────────────────────────────────────
   Chaque forme est dessinée sur un petit canvas hors écran, ses
   pixels sont échantillonnés, et les particules vont s'y ranger. Les
   formes sont donc extensibles sans le moindre actif image. */
/* LE « 44 » EST TRACÉ, PAS REMPLI, et c'est le rapport pixels/points
   qui l'impose (voir l'encadré du sondage). Rempli, le glyphe rendait
   ~4 600 pixels pour 900 points : à 5 pixels par point on est au seuil,
   et le résultat est une masse grumeleuse. Tracé, il n'en rend qu'une
   fraction — le budget de points va au CONTOUR, qui est ce qui donne sa
   forme à un chiffre. C'est la règle générale : sur une surface pleine,
   des points suffisamment nombreux pour la remplir n'existent pas. */
function dNombre(o, w, h) {
  const S = Math.min(w * .90, h * .76);
  o.font = '800 ' + S + 'px ui-sans-serif, system-ui, sans-serif';
  o.textAlign = 'center'; o.textBaseline = 'middle';
  o.lineWidth = Math.max(2, S * .045);
  o.strokeText('44', w / 2, h / 2 + S * .03);
}
function dQR(o, w, h) {
  const n = 21, S = Math.min(w, h) * .72, m = S / n, x0 = (w - S) / 2, y0 = (h - S) / 2;
  let sd = 7;
  const rnd = () => { sd = (sd * 1103515245 + 12345) & 0x7fffffff; return sd / 0x7fffffff; };
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const fin = (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
    let on;
    if (fin) { const lx = x < 7 ? x : x - (n - 7), ly = y < 7 ? y : y - (n - 7);
      on = (lx === 0 || lx === 6 || ly === 0 || ly === 6) || (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4); }
    else on = rnd() > .5;
    if (on) o.fillRect(x0 + x * m + m * .1, y0 + y * m + m * .1, m * .8, m * .8);
  }
}
function dTrophee(o, w, h) {
  const S = Math.min(w * .86, h * .92), cx = w / 2, cy = h / 2;
  const X = u => cx + (u - 50) / 100 * S, Y = v => cy + (v - 50) / 100 * S;
  o.lineWidth = Math.max(2.8, S * .030);
  /* LA COUPE EST TRACÉE, PAS REMPLIE — ET C'EST UN RETOUR EN ARRIÈRE
     ASSUMÉ. Elle avait été remplie pour qu'un NIVEAU puisse y monter :
     un contour n'a pas de matière à colorer. Mais remplir une surface
     fait exploser le rapport pixels/points (le même calcul que pour le
     « 44 »), et le trophée est devenu une masse grise floue barrée
     d'une bande jaune : moins lisible qu'avant la correction. LE NIVEAU
     SE DIT AUTREMENT — les particules du CONTOUR situées sous le seuil
     s'allument en or, et une LIGNE DE NIVEAU traverse la coupe à la
     hauteur atteinte. Un contour doré au bas d'une coupe plus une ligne
     horizontale se lit « rempli jusque-là » sans qu'il y ait rien à
     remplir. */
  o.beginPath(); o.moveTo(X(29), Y(16)); o.lineTo(X(71), Y(16));
  o.bezierCurveTo(X(71), Y(42), X(65), Y(57), X(50), Y(57));
  o.bezierCurveTo(X(35), Y(57), X(29), Y(42), X(29), Y(16));
  o.closePath(); o.stroke();
  o.beginPath(); o.moveTo(X(29), Y(21));
  o.bezierCurveTo(X(16), Y(21), X(11), Y(29), X(14), Y(37));
  o.bezierCurveTo(X(17), Y(44), X(25), Y(46), X(31), Y(44)); o.stroke();
  o.beginPath(); o.moveTo(X(71), Y(21));
  o.bezierCurveTo(X(84), Y(21), X(89), Y(29), X(86), Y(37));
  o.bezierCurveTo(X(83), Y(44), X(75), Y(46), X(69), Y(44)); o.stroke();
  o.beginPath(); o.moveTo(X(46), Y(57)); o.lineTo(X(46), Y(72));
  o.lineTo(X(54), Y(72)); o.lineTo(X(54), Y(57)); o.stroke();
  o.beginPath(); o.moveTo(X(35), Y(72)); o.lineTo(X(65), Y(72));
  o.lineTo(X(70), Y(84)); o.lineTo(X(30), Y(84)); o.closePath(); o.stroke();
}
function dSpa(o, w, h) {
  const S = Math.min(w * .92, h * .94), cx = w / 2, cy = h / 2;
  const X = u => cx + (u - 50) / 100 * S, Y = v => cy + (v - 50) / 100 * S;
  o.lineWidth = Math.max(3, S * .032);
  o.beginPath(); o.moveTo(X(24), Y(83));
  o.bezierCurveTo(X(16), Y(82), X(11), Y(76), X(13), Y(70));   /* La Source */
  o.bezierCurveTo(X(15), Y(65), X(22), Y(64), X(25), Y(69));
  o.bezierCurveTo(X(27), Y(73), X(31), Y(72), X(33), Y(67));   /* Eau Rouge */
  o.bezierCurveTo(X(35), Y(62), X(33), Y(58), X(36), Y(53));   /* Raidillon */
  o.bezierCurveTo(X(41), Y(44), X(52), Y(30), X(60), Y(21));   /* Kemmel */
  o.bezierCurveTo(X(65), Y(15), X(74), Y(15), X(77), Y(21));   /* Les Combes */
  o.bezierCurveTo(X(80), Y(26), X(75), Y(30), X(78), Y(35));   /* Malmedy */
  o.bezierCurveTo(X(82), Y(41), X(88), Y(38), X(89), Y(44));   /* Rivage */
  o.bezierCurveTo(X(90), Y(50), X(82), Y(50), X(80), Y(56));   /* Pouhon */
  o.bezierCurveTo(X(78), Y(62), X(85), Y(65), X(83), Y(71));   /* Stavelot */
  o.bezierCurveTo(X(81), Y(78), X(70), Y(79), X(60), Y(78));   /* Blanchimont */
  o.bezierCurveTo(X(46), Y(77), X(38), Y(85), X(31), Y(85));   /* Bus Stop */
  o.bezierCurveTo(X(28), Y(85), X(26), Y(84), X(24), Y(83));
  o.stroke();
}
/* LE TÉLÉPHONE EST TRACÉ, PAS REMPLI — dernière des trois formes à
   passer du plein au contour, et la pire des sept avant correction
   (rapport 9,26 contre un seuil de 5). Les huit tuiles de contenu
   étaient des rectangles PLEINS : à elles seules, 4 704 des 7 222
   pixels rendus au sondage. Elles représentent des cartes ; une carte
   se dessine en contour dans toute la séquence, donc le contour est
   aussi le dessin juste. Le châssis garde un trait plus épais que les
   tuiles : c'est lui qui doit dire « téléphone » de loin. */
function dPhone(o, w, h) {
  const ph = Math.min(h * .92, Math.min(w, h) * 1.55), pw = ph / 1.95;
  const x0 = (w - pw) / 2, y0 = (h - ph) / 2;
  o.lineWidth = Math.max(2.2, pw * .038);
  if (o.roundRect) { o.beginPath(); o.roundRect(x0, y0, pw, ph, pw * .15); o.stroke(); }
  else o.strokeRect(x0, y0, pw, ph);
  o.fillRect(x0 + pw * .35, y0 + ph * .032, pw * .30, ph * .012);
  o.lineWidth = Math.max(1.6, pw * .024);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++)
    o.strokeRect(x0 + pw * .11 + c * pw * .41, y0 + ph * .24 + r * ph * .14, pw * .35, ph * .10);
}
/* LE SIGNAL BARRÉ EST LA SEPTIÈME FORME, et la dernière à repasser
   sous le seuil : 1 253 px pour 180 points, soit 6,96. Son trait a été
   affiné (0,15 R → 0,105 R) et son budget porté de 180 à 218 points.
   ⚠️ SON PÉRIMÈTRE N'EST PAS CELUI DES AUTRES (⑦) : les six autres
   silhouettes remplissent la boîte de tracé, celle-ci est un insert
   réduit à 24 % posé dans le coin du téléphone. Le seuil de 5 a été
   calibré sur des formes plein cadre ; rien ne dit qu'il vaut ici. On
   la passe quand même sous le seuil plutôt que d'argumenter — c'est
   moins cher que de défendre une exception. */
function dSignalCoupe(o, w, h) {
  const cx = w * .5, cy = h * .60, R = Math.min(w, h) * .30;
  o.lineWidth = Math.max(1.8, R * .105);
  for (let k = 1; k <= 3; k++) {
    o.beginPath(); o.arc(cx, cy, R * k / 3, Math.PI * 1.22, Math.PI * 1.78); o.stroke();
  }
  o.beginPath(); o.arc(cx, cy, R * .09, 0, 6.2832); o.fill();
  o.beginPath(); o.moveTo(cx - R * .82, cy - R * .82); o.lineTo(cx + R * .82, cy + R * .26); o.stroke();
}

const STYLE = `.intro{position:fixed;inset:0;z-index:900;background:#0B0A0B;
  display:grid;grid-template-rows:1fr;overflow:hidden}
.intro-cv{position:absolute;inset:0;width:100%;height:100%;display:block}
.intro-beats{position:absolute;left:0;right:0;top:0;height:26%;
  display:grid;place-items:center;padding:0 22px;pointer-events:none}
.intro-beat{position:absolute;text-align:center;opacity:0;transform:translateY(9px);
  transition:opacity .28s ease,transform .36s cubic-bezier(.22,.61,.36,1)}
.intro-beat.on{opacity:1;transform:none}
.ib-k{display:block;font-size:clamp(25px,5vw,46px);font-weight:700;letter-spacing:-.03em;
  line-height:1.05;color:var(--tx1);font-variant-numeric:tabular-nums}
.ib-k em{font-style:normal;color:var(--red)}
.ib-s{display:block;margin-top:9px;font-size:clamp(12px,1.7vw,14px);color:var(--tx2)}
.intro-fin{position:absolute;inset:0;display:grid;place-content:center;justify-items:center;
  text-align:center;gap:6px;opacity:0;transition:opacity .7s ease;pointer-events:none}
.intro-fin.on{opacity:1;pointer-events:auto}
.intro-tag{margin:14px 0 4px;font-size:clamp(13px,2vw,16px);color:var(--tx2)}
.intro-x{position:absolute;top:12px;right:12px;z-index:2;background:rgba(26,23,25,.82);
  color:var(--tx2);border:1px solid var(--border);border-radius:999px;padding:9px 16px;
  font:inherit;font-size:13px;cursor:pointer;min-height:40px}
.intro-x:hover,.intro-x:focus-visible{color:var(--tx1);border-color:var(--red)}
`;

/* LES STYLES VOYAGENT AVEC LE MODULE. Ils ne servent à rien tant que
   personne n'a cliqué, et les garder dans index.html coûtait 0,7 Ko
   gzippés à chaque visiteur — sur un plafond où il restait 0,6 Ko de
   marge. Injectés une seule fois, sans requête supplémentaire.
   AUCUN filter:blur : les plans apparaissent par opacité et
   translation, jamais par flou. */
function poserStyles() {
  if (document.getElementById('intro-css')) return;
  const st = document.createElement('style');
  st.id = 'intro-css'; st.textContent = STYLE;
  document.head.appendChild(st);
}

export function ouvrir(declencheur, options = {}) {
  const F1 = window.__f1;
  const doux = F1 ? F1.adoucir : t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const borne = F1 ? F1.borne : t => t < 0 ? 0 : t > 1 ? 1 : t;
  const entre = F1 ? F1.entre : (a, b, t) => a + (b - a) * t;
  const P = (F1 && F1.particules) || Array.from({ length: N }, (_, i) => ({ a: (i * 37 % 97) / 97, b: (i * 61 % 89) / 89 }));

  poserStyles();
  const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── LA SURCOUCHE ── */
  const ov = document.createElement('div');
  ov.className = 'intro';
  ov.setAttribute('role', 'dialog');
  ov.setAttribute('aria-modal', 'true');
  ov.setAttribute('aria-label', 'The set in twenty seconds');
  ov.innerHTML =
    '<canvas class="intro-cv"></canvas>' +
    '<div class="intro-beats"></div>' +
    '<div class="intro-fin"><span class="lockup" role="img" aria-label="F1 UNO Élite">' +
      '<span class="lk-top"><span class="lk-f1">F1</span><span class="lk-uno">UNO</span>' +
      '<span class="lk-elite">Élite</span></span><span class="lk-bar" aria-hidden="true"></span></span>' +
      '<p class="intro-tag">101 cards, 998 variants, one list that remembers.</p>' +
      '<a class="cta" href="app/">Open the app</a></div>' +
    '<button class="intro-x" type="button" aria-label="Close">Close</button>';
  document.body.appendChild(ov);
  document.body.style.overflow = 'hidden';

  const cv = ov.querySelector('.intro-cv'), ctx = cv.getContext('2d');
  const beats = ov.querySelector('.intro-beats'), fin = ov.querySelector('.intro-fin');
  const noeuds = PLANS.map(b => {
    const d = document.createElement('div');
    d.className = 'intro-beat';
    d.innerHTML = '<span class="ib-k">' + b[3] + '</span><span class="ib-s">' + b[4] + '</span>';
    beats.appendChild(d); return d;
  });

  let W = 0, H = 0, BX = { x: 0, y: 0, w: 0, h: 0 }, cache = {};
  const dimensionner = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2), b = cv.getBoundingClientRect();
    W = b.width; H = b.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    /* LA BANDE HAUTE EST RÉSERVÉE AU TEXTE : le canvas n'y dessine
       jamais. Ce n'est pas un masque, c'est une zone de tracé. */
    BX = { x: W * .05, y: H * .28, w: W * .90, h: H * .64 };
    cache = {}; _niv = null;
  };
  const C = () => ({ x: BX.x + BX.w / 2, y: BX.y + BX.h / 2 });
  const _cranMs = () => (duree('rarete') - CRAN_T0) / CRANS.length;
  const U = () => Math.min(BX.w, BX.h);

  /* Échantillonnage hors écran, mis en cache par forme et par taille. */
  function pts(cle, dessin, combien) {
    const ck = cle + '|' + Math.round(BX.w) + 'x' + Math.round(BX.h);
    if (cache[ck]) return cache[ck];
    /* ══ LA RÉSOLUTION DU SONDAGE EST LE LEVIER QUI DÉCIDE ══════════
       CE QUI REND UNE SILHOUETTE LISIBLE N'EST NI L'ÉPAISSEUR DU TRAIT
       NI LE NOMBRE DE PARTICULES PRIS ISOLÉMENT : c'est le RAPPORT
       entre les pixels que la forme rend au sondage et les points qu'on
       lui demande. Un point ne peut ranger qu'un pixel ; au-delà de
       quelques pixels par point, l'échantillonnage saute des morceaux
       de trait et la forme se hache. Relevé sur les huit formes, à
       220 px de large puis à 128 :

                       pixels/points        après
           trophée      2 079 / 700 =  3,0   2,25   lisible
           Spa          3 253 / 640 =  5,1   1,2    passable → net
           casque       4 500 / 560 =  8,0   1,7    haché    → net
           QR           9 207 / 620 = 14,9   3,5    haché    → net
           « 44 »      13 523 / 520 = 26,0   4,05   illisible → net
           téléphone   21 206 / 560 = 37,9   9,26   illisible → passable

       Le « 44 » doit ses 4,05 à DEUX corrections, pas une : la
       résolution du sondage, et le passage du glyphe de REMPLI à TRACÉ.
       Le téléphone, lui, est resté plein et reste le pire des sept —
       9,26, largement au-dessus du seuil. Il se voit, il ne se lit pas
       tout à fait. C'est le prochain à reprendre, et le remède est
       connu : le tracer plutôt que le remplir.

       LE SEUIL SE LIT AUTOUR DE 5 PIXELS PAR POINT : au-dessous, la
       forme se reconnaît ; au-dessus, elle se devine. La colonne
       « après » est mesurée, pas extrapolée.

       DEUX CONSÉQUENCES POUR LA PROCHAINE FORME AJOUTÉE :
       1. Ajouter des particules ne rattrape presque rien — le budget
          total est de 998 pour TOUTE la séquence, donc on ne peut
          jamais multiplier les points par 5. Baisser la résolution du
          sondage, si.
       2. C'est le SEUL levier qui agit sur toutes les formes à la
          fois. Diviser la résolution par 1,7 divise les pixels par 3,
          partout, d'un coup. Et il ne coûte rien : la silhouette est
          ensuite étirée sur la boîte de tracé, et les particules font
          8 px à l'écran — bien plus que le pas du sondage, donc la
          finesse perdue au sondage ne se voit pas.

       CE QUE LE RAPPORT NE DIT PAS : qu'une forme lisible est une forme
       RECONNAISSABLE. Le casque était à 1,7 après correction — le
       meilleur des huit — et il a été retiré quand même, parce qu'un
       tracé net de casque ne se lisait toujours pas comme un casque
       (voir le retrait plus haut). Le rapport garantit qu'on VOIT le
       dessin, jamais qu'on le COMPREND.
       ═══════════════════════════════════════════════════════════════ */
    const ow = 128, oh = Math.max(70, Math.round(128 * BX.h / BX.w));
    const oc = document.createElement('canvas'); oc.width = ow; oc.height = oh;
    const o = oc.getContext('2d');
    o.fillStyle = '#fff'; o.strokeStyle = '#fff'; o.lineCap = 'round'; o.lineJoin = 'round';
    dessin(o, ow, oh);
    const d = o.getImageData(0, 0, ow, oh).data, L = [];
    for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++)
      if (d[(y * ow + x) * 4 + 3] > 110) L.push([BX.x + x / ow * BX.w, BX.y + y / oh * BX.h]);
    if (!L.length) L.push([C().x, C().y]);
    /* LES POINTS SONT TIRÉS AU NOMBRE D'OR, PAS À PAS CONSTANT. La
       liste L est en balayage ligne par ligne ; un pas constant s'y
       aligne périodiquement sur la largeur du sondage et sème les
       points en DIAGONALES régulières. Sur un glyphe plein comme le
       « 44 » ça se voyait franchement : le haut dense, le bas en
       filaments. Un pas irrationnel (φ) ne peut s'aligner sur aucune
       période, donc la couverture est régulière sans être rangée. */
    const out = [], PHI = 0.6180339887498949;
    for (let k = 0; k < combien; k++)
      out.push(L[Math.min(L.length - 1, Math.floor((k * PHI % 1) * L.length))]);
    cache[ck] = out; return out;
  }
  const absent = () => ({ x: C().x, y: H * 1.25, w: 2, h: 2, o: 0 });
  const silhouette = (cle, dessin, combien, taille, tint) => (i) => {
    if (i >= combien) return absent();
    const q = pts(cle, dessin, combien)[i];
    return { x: q[0], y: q[1], w: taille, h: taille, o: 1, tint };
  };

  /* ── LES TREIZE DISPOSITIONS ── */
  const dispo = {
    num:     i => silhouette('num', dNombre, 900, U() * .016, ROSSO)(i),
    /* DOUZE CARTES, DOUZE COULEURS, EN ÉVENTAIL QUI SE CHEVAUCHE.
       La largeur vient du chevauchement : à 50 % de pas, douze cartes
       tiennent dans la boîte en faisant U()*.162 de large, soit près
       du double de l'ancienne tuile. Le chevauchement n'est pas décoratif — c'est
       lui qui dit « une main de cartes » plutôt que « une rangée ». */
    eventail: i => {
      if (i >= VARIANTES.length) return absent();
      const n = VARIANTES.length, w = U() * .162, pas = w * .50;
      const a = (i - (n - 1) / 2) / ((n - 1) / 2);
      return { x: C().x + a * pas * (n - 1) / 2,
               y: C().y - U() * .05 + a * a * U() * .095,
               w, h: w * 1.42, o: 1, tint: VARIANTES[i][1] };
    },
    mur: i => {
      const col = Math.max(16, Math.round(Math.sqrt(N * (BX.w / BX.h))));
      const lig = Math.ceil(N / col), cw = BX.w / (col + 1), ch = BX.h / (lig + 1);
      return { x: BX.x + (i % col + 1) * cw, y: BX.y + ((i / col | 0) + 1) * ch,
               w: cw * .70, h: ch * .78, o: 1 };
    },
    grille: i => _grille(i, false),
    /* LE GESTE EST UN CONTRASTE, DONC IL LUI FAUT LES DEUX TERMES.
       Les 72 possédées restent VISIBLES à leur place (contour à 15 %) :
       si elles s'effacent tout à fait, les 29 ne sortent de rien et il
       ne reste qu'un bloc de cartes posé au milieu. Les 29 sortent de
       la grille, grossissent, et prennent leur couleur — or pour les
       16 de la wishlist, rouge pour les 13 autres. */
    manquant: i => {
      if (i >= CARTES) return absent();
      if (i < POSSEDEES) return { ..._grille(i, false), o: .45, creux: true, tint: undefined };
      const k = i - POSSEDEES, cM = 8, cw = U() * .125, ch = U() * .168;
      const lig = k / cM | 0, nLig = Math.ceil(MANQUANTES / cM);
      /* CHAQUE RANGÉE EST CENTRÉE SUR LA SIENNE, pas sur une rangée
         pleine : la dernière n'en compte que cinq, et alignée à gauche
         elle faisait pencher tout le bloc. */
      const dans = Math.min(cM, MANQUANTES - lig * cM);
      return { x: C().x + ((k % cM) - (dans - 1) / 2) * cw * 1.10,
               y: C().y + (lig - (nLig - 1) / 2) * ch * 1.12,
               w: cw * .86, h: ch * .86, o: 1, creux: true,
               tint: k < WISHLIST ? OR : ROUGE };
    },
    /* ══ UN DOUBLE EST UN SECOND EXEMPLAIRE DE LA MÊME CARTE ════════
       Il se montre donc EN PILE, sur la carte concernée, dans la
       grille. Deux versions ont échoué avant celle-ci — une rangée de
       huit pastilles à part (ce n'est pas ce que le mot veut dire),
       puis une pile trop timide en ROUGE (le rouge dit « erreur », pas
       « tu en as deux »).

       ── LA GÉOMÉTRIE, MESURÉE À 390 px ────────────────────────────
       boîte 351 × 540 · 9 colonnes × 12 rangées
       pas de grille   35,1 × 41,6 px
       carte           21,1 × 29,9 px
       jeu disponible  14,0 px horizontal · 11,6 px vertical
       C'est le VERTICAL qui contraint : au-delà de 11,6 px de décalage,
       la copie mord sur la carte de la rangée du dessous.
           décalage retenu   11,6 / 11,4 px  (55 % / 38 % de la carte)
           pile obtenue      32,6 × 41,3 px  → tient dans le pas
       LE PLAN N'A PAS BESOIN DE MOINS DE CARTES PLUS GRANDES : à ce
       décalage, la carte du dessous montre un liseré de 11,6 px, soit
       55 % de sa largeur. Ce n'est pas un filet de quelques pixels,
       c'est une carte à moitié visible. La taille n'était pas le
       problème.

       ── LA CONVENTION, ET POURQUOI CELLE-LÀ ───────────────────────
       Les deux exemplaires portent LA MÊME TEINTE que les possédées —
       l'un à 100 %, l'autre à 55 % pour la profondeur. Le reste de la
       collection descend à 16 %. La paire ne se distingue donc pas par
       une COULEUR (qui aurait dit « autre chose ») mais par le NOMBRE
       et la BRILLANCE : deux cartes claires là où les autres n'en ont
       qu'une, sombre. C'est exactement ce que le mot « double » dit. */
    doubles: i => {
      if (i >= CARTES + DOUBLES) return absent();
      if (i < CARTES) {
        const g = _grille(i, false);
        if (EST_DOUBLE.has(i)) return { ...g, o: .55, creux: false };
        return { ...g, o: i < POSSEDEES ? .16 : .07, creux: i >= POSSEDEES };
      }
      const g = _grille(DOUBLES_ID[i - CARTES], false);
      return { ...g, x: g.x + g.w * .55, y: g.y + g.h * .38, o: 1, creux: false };
    },
    /* UNE CARTE QUI MONTE DE CRAN, ET LE DÉCLENCHEUR QUI S'ALLUME.
       C'est l'idée du storyboard : LA RARETÉ SE GAGNE, elle n'est pas
       imprimée sur la carte. La version précédente montrait un bloc
       gris et une rangée de pastilles — elle ne racontait ni la montée
       ni la cause. Maintenant : une carte pleine de 14 × 20 particules
       au centre, qui prend la couleur du cran et grandit d'un cran à
       l'autre ; sous elle les cinq déclencheurs, en attente à 10 %
       d'opacité puis allumés à leur tour et CUMULÉS — à la fin la
       chaîne entière est à l'écran, mythic → ultra → cosmic → divine
       → eternal, dans l'ordre que rend cardRarity() pour la #031. Le
       déclencheur du cran EN COURS est dessiné 20 % plus grand que les
       autres : c'est ce qui relie la couleur de la carte à la cause de
       sa montée, au lieu de laisser deux choses changer côte à côte.
       COÛT : 280 + 21 = 301 particules sur les 998. */
    rarete: (i, t) => {
      const cr = Math.max(0, Math.min(CRANS.length - 1,
        Math.floor((t - debut('rarete') - CRAN_T0) / _cranMs())));
      /* ── LA CARTE ────────────────────────────────────────────────
         UN OBJET QUI RESSEMBLE À UNE CARTE, pas un aplat. Une première
         version teintait les quatorze rangées du haut à la couleur du
         cran : la carte disparaissait dans son état, et « une carte qui
         monte » se lisait « un carré qui change de couleur ». La
         convention est celle des vignettes des plans « grille » et
         « manquant », qui elles se lisent : un rapport de carte, des
         coins arrondis, et de la structure dedans.
             bordure (périmètre)  → LA COULEUR DU CRAN
             visuel  (r 1..9)     → clair neutre, comme les vignettes
             bandeau (r 10)       → LA COULEUR DU CRAN, une seconde fois
             corps   (r 11..16)   → panneau sombre + deux lignes de texte
         La couleur du cran est donc un ATTRIBUT de la carte — son
         liseré et sa bande —, jamais sa surface. */
      const CC = 13, CL = 18, NC = CC * CL;
      if (i < NC) {
        const r = i / CC | 0, c = i % CC, u = U() * .042 * (1 + cr * .018);
        const T = CRANS[cr][1];
        const bord = r === 0 || r === CL - 1 || c === 0 || c === CC - 1;
        const bande = r === 10;
        let tint, o = 1;
        if (bord)        tint = T[(r + c) % T.length];
        else if (bande)  tint = T[c % T.length];
        else if (r <= 9) tint = 'rgba(243,240,241,.80)';
        else if (r === 12 && c >= 2 && c <= CC - 3) tint = 'rgba(243,240,241,.62)';
        else if (r === 14 && c >= 2 && c <= 7)      tint = 'rgba(243,240,241,.34)';
        else             tint = '#212227';
        return { x: C().x + (c - (CC - 1) / 2) * u,
                 y: BX.y + BX.h * .34 + (r - (CL - 1) / 2) * u,
                 w: u * .92, h: u * .92, o, tint };
      }
      const k = i - NC;
      if (k >= DECL_DEB[DECL_DEB.length - 1]) return absent();
      let s = 0; while (DECL_DEB[s + 1] <= k) s++;
      const d = DECLENCHEURS[s], j = k - DECL_DEB[s];
      const act = cr === s, cel = U() * (act ? .048 : .040), lg = Math.ceil(d.t.length / d.c);
      const fx = BX.x + BX.w * (s + .5) / CRANS.length;
      return { x: fx + ((j % d.c) - (d.c - 1) / 2) * cel,
               y: BX.y + BX.h * .76 + ((j / d.c | 0) - (lg - 1) / 2) * cel,
               w: cel * .80, h: cel * .80, o: cr >= s ? 1 : .10,
               tint: cr >= s ? d.t[j] : undefined, creux: cr < s };
    },
    qr:      i => silhouette('qr', dQR, 900, U() * .018, INK)(i),
    /* DEUX COLLECTIONS, PAS UN NUAGE, ET SURTOUT PAS LA MÊME DEUX FOIS.
       La première version posait deux blocs, mais (a) les cartes non
       appariées y étaient à 14 % d'opacité sur un contour déjà à 22 %
       de blanc — invisibles, il ne restait que des points verts épars ;
       et (b) LES DEUX GRILLES ÉTAIENT IDENTIQUES, correspondances aux
       mêmes places : ça se lisait « une grille dupliquée », pas « deux
       collections ». Maintenant : à gauche la tienne (les 72 possédées
       en clair, les 29 manquantes en creux sombre — même convention que
       les plans précédents), à droite la sienne, tirée par un hachage
       stable, donc UN AUTRE MOTIF. Et le vert ne marque pas « on a tous
       les deux » mais CE QU'IL PEUT TE DONNER : une carte qu'il a et que
       tu n'as pas. Il y en a 19. Les paires s'allument une à une, des
       deux côtés à la fois — c'est ce lien-là qui fait la lecture. */
    compare: (i, t) => {
      const cc = 7, gw = BX.w * .40, gap = BX.w * .06, mid = BX.x + BX.w * .5;
      const FILET = 36;
      if (i >= CARTES * 2 + FILET) return absent();
      if (i >= CARTES * 2) {
        const k = i - CARTES * 2;
        return { x: mid, y: BX.y + BX.h * (k + .5) / FILET,
                 w: Math.max(1.5, U() * .006), h: BX.h / FILET * .45, o: .34 };
      }
      const mien = i < CARTES, id = mien ? i : i - CARTES;
      const rr = Math.ceil(CARTES / cc), cw = gw / cc, ch = BX.h / (rr + 1);
      const ox = mien ? mid - gap / 2 - gw : mid + gap / 2;
      const aMoi = id < POSSEDEES, aLui = SIEN(id), don = !aMoi && aLui;
      const av = borne((t - debut('compare') - 500) / 700);
      const on = don && RANG_DON[id] / DONS <= av;
      const plein = mien ? aMoi : aLui;
      return { x: ox + (id % cc + .5) * cw, y: BX.y + ((id / cc | 0) + 1) * ch,
               w: cw * .66, h: ch * .70,
               o: on ? 1 : plein ? .40 : .16, creux: !(on && !mien),
               tint: on ? '#22C55E' : plein ? 'rgba(243,240,241,.85)' : undefined };
    },
    trophee: i => {
      const Nt = 700, NL = 44;
      if (i >= Nt + NL) return absent();
      const S = pts('trophee', dTrophee, Nt), g = _niveau(S);
      /* LA LIGNE DE NIVEAU dit ce que le contour doré ne dit qu'à
         moitié. Les particules de la coupe sous le seuil s'allument en
         or — mais un contour doré au bas d'une coupe peut se lire
         « le bas est doré ». Une horizontale qui barre la coupe à la
         hauteur atteinte lève l'ambiguïté sans rien remplir. */
      if (i >= Nt) {
        const j = (i - Nt) / (NL - 1);
        return { x: g.x0 + (g.x1 - g.x0) * j, y: g.seuil,
                 w: U() * .015, h: U() * .010, o: 1, tint: OR };
      }
      const q = S[i], allume = q[1] <= g.bas && q[1] >= g.seuil;
      return { x: q[0], y: q[1], w: U() * .017, h: U() * .017,
               o: allume ? 1 : .55, tint: allume ? OR : GRIS };
    },
    spa:     i => silhouette('spa', dSpa, 900, U() * .016, INK)(i),
    phone:   i => {
      const Np = 780;
      if (i < Np) return silhouette('phone', dPhone, Np, U() * .015, '#CBD5E1')(i);
      if (i < Np + 218) {
        const q = pts('wifi', dSignalCoupe, 218)[i - Np];
        return { x: BX.x + BX.w * .82 + (q[0] - BX.x - BX.w / 2) * .24,
                 y: BX.y + BX.h * .18 + (q[1] - BX.y - BX.h / 2) * .24,
                 w: U() * .013, h: U() * .013, o: 1, tint: ROUGE };
      }
      return absent();
    },
    /* LE FOND DU PLAN FINAL S'EFFACE SOUS LE LOCKUP. C'est le dernier
       plan, celui qui reste : le lockup et le CTA doivent dominer, et
       une grille uniforme à 18 % leur disputait le regard pile là où ils
       sont. L'opacité croît donc avec la distance au bloc final.
       ⚠️ LE CENTRE DU CREUX N'EST PAS CELUI DE LA BOÎTE DE TRACÉ. Une
       première version mesurait la distance à C(), le centre de la
       zone de dessin (y ≈ .60 H) ; or `.intro-fin` est en
       `place-content:center` sur `inset:0`, donc centré sur LA FENÊTRE
       (y = H/2). Les deux diffèrent de 84 px sur un écran de 844, et le
       creux tombait sous le lockup au lieu d'être dessus — invisible à
       la lecture du code, évident sur la capture. */
    fin: i => {
      const g = _grille(i, true);
      if (!g.o) return g;
      /* LE CREUX EST RECTANGULAIRE, PARCE QUE LE BLOC FINAL L'EST.
         Un creux radial laissait des cartes juste à gauche et à droite
         du lockup — là où le mot est le plus large — tout en vidant
         inutilement au-dessus et au-dessous. On prend donc la distance
         de TCHEBYCHEV (le plus grand des deux écarts normalisés), qui
         évide un rectangle. ⚠️ LE CENTRE N'EST PAS CELUI DE LA BOÎTE DE
         TRACÉ : `.intro-fin` est en `place-content:center` sur
         `inset:0`, donc centré sur LA FENÊTRE (H/2), pas sur la zone de
         dessin (≈ .60 H). 84 px d'écart sur un écran de 844 — invisible
         en lisant le code, décisif à l'image. */
      const dx = Math.abs(g.x - W / 2) / (W * .48);
      const dy = Math.abs(g.y - H / 2) / (H * .155);
      const d = borne(Math.max(dx, dy));
      /* CHIFFRÉ. Luminance moyenne des colonnes de cartes à hauteur du
         lockup, hors texte (x 30-95 et 300-365, y 330-385), fond à 11 :
             grille plate à 18 %   moyenne 21,0 · crête 45 (soit 34 sur
                                   le fond) · 2 353 pixels au-dessus de 20
             creux .012 + .17 d²   moyenne 15,7 · crête 33 (22 sur le fond)
             creux .008 + .075 d²  moyenne 12,9 · crête 21 (10 sur le fond)
                                   · 242 pixels au-dessus de 20
         Le contraste des cartes sur le fond passe donc de 34 à 10 — un
         tiers — et le nombre de pixels francs est divisé par dix. C'est
         le troisième réglage qui est retenu : les deux premiers
         baissaient la moyenne sans casser la CRÊTE, et c'est la crête
         qui dispute le regard au mot. */
      return { ...g, o: .008 + .075 * d * d };
    },
  };

  /* LE SEUIL DU TROPHÉE SE CALCULE UNE FOIS PAR TAILLE, pas une fois
     par particule : la version précédente rebalayait les 700 points à
     chaque appel, soit 490 000 comparaisons par trame pour un résultat
     constant. LE NIVEAU MONTE DANS LA COUPE, PAS DANS LE TROPHÉE
     ENTIER : dans les coordonnées de dTrophee la coupe va de Y(16) à
     Y(57) et l'ensemble de Y(16) à Y(84), donc la coupe occupe les
     60 % supérieurs. Calculer sur la hauteur totale mettait le niveau
     dans le socle — « le pied est doré », jamais « la coupe est au
     quart ». */
  let _niv = null, _nivCle = '';
  function _niveau(S) {
    const cle = Math.round(BX.w) + 'x' + Math.round(BX.h);
    if (_niv && _nivCle === cle) return _niv;
    let mn = 1e9, mx = -1e9;
    for (const p of S) { if (p[1] < mn) mn = p[1]; if (p[1] > mx) mx = p[1]; }
    const bas = mn + (mx - mn) * 0.60;
    const seuil = bas - (bas - mn) * (BADGES_OK / BADGES);
    /* LA LIGNE BARRE L'INTÉRIEUR DE LA COUPE, PAS LA LARGEUR TOTALE.
       À la hauteur du seuil, les points les plus à gauche et à droite
       ne sont pas les parois de la coupe : ce sont LES ANSES. Prendre
       les extrêmes donnait une horizontale d'une anse à l'autre, qui
       se lit comme un couvercle. On prend donc les points les plus
       INTÉRIEURS de chaque côté du centre — les deux parois. */
    const cx = C().x; let x0 = -1e9, x1 = 1e9, tol = (mx - mn) * .03;
    for (const p of S) if (Math.abs(p[1] - seuil) <= tol) {
      if (p[0] < cx) { if (p[0] > x0) x0 = p[0]; }
      else if (p[0] < x1) x1 = p[0];
    }
    if (x0 === -1e9 || x1 === 1e9 || x1 < x0) { x0 = x1 = cx; }
    _nivCle = cle; _niv = { bas, seuil, x0, x1 };
    return _niv;
  }
  function _grille(i, pale) {
    if (i >= CARTES) return absent();
    const col = Math.max(9, Math.min(15, Math.round(BX.w / 50)));
    const lig = Math.ceil(CARTES / col), cw = BX.w / (col + 1), ch = BX.h / (lig + 1);
    return { x: BX.x + (i % col + 1) * cw, y: BX.y + ((i / col | 0) + 1) * ch,
             w: cw * .60, h: ch * .72, o: pale ? .18 : 1, creux: i >= POSSEDEES };
  }

  const puce = (x, y, w, h, tint, o, creux) => {
    if (o <= .012 || w <= .2) return;
    ctx.globalAlpha = o;
    ctx.beginPath();
    const r = Math.min(6, w * .18);
    if (ctx.roundRect) ctx.roundRect(x - w / 2, y - h / 2, w, h, r);
    else ctx.rect(x - w / 2, y - h / 2, w, h);
    /* UNE PUCE CREUSE PORTE SA COULEUR, ELLE AUSSI. La première version
       n'appliquait `tint` que sur la branche pleine : une carte demandée
       en creux ET en couleur perdait sa couleur, en silence, sans que
       rien n'échoue. C'est ce qui vidait le plan « 29 missing » — les
       29 y étaient bien dessinées, mais du même gris que les 72 effacées
       derrière elles, et la distinction wishlist / pas wishlist,
       demandée en or et en rouge, n'arrivait jamais à l'écran. */
    if (creux) { ctx.strokeStyle = tint || 'rgba(255,255,255,.22)';
                 ctx.lineWidth = Math.max(1.2, w * .07); ctx.stroke(); }
    else { ctx.fillStyle = tint || 'rgba(243,240,241,.85)'; ctx.fill(); }
    ctx.globalAlpha = 1;
  };

  let gele = false;
  /* TROIS CHEMINS MÈNENT AU PLAN FINAL — mouvement réduit, coupure du
     garde, fin naturelle — et ils passent tous par ici. Une première
     version les écrivait séparément : deux d'entre eux éteignaient les
     beats PUIS appelaient dessiner(), qui les rallumait aussitôt en
     recalculant l'état pour t=20 s. Le plan final restait masqué
     derrière un plan qu'on croyait éteint. */
  const montrerFinal = () => {
    gele = true;
    dessiner(DUREE);
    noeuds.forEach(n => n.classList.remove('on'));
    fin.classList.add('on');
  };
  const dessiner = t => {
    ctx.clearRect(0, 0, W, H);
    let k = 0;
    for (let j = 0; j < PLANS.length; j++) if (t >= PLANS[j][1] * 1000) k = j;
    const prec = PLANS[Math.max(0, k - 1)][0], cur = PLANS[k][0];
    const d0 = PLANS[k][1] * 1000, d1 = PLANS[k][2] * 1000;
    /* LA TRANSITION EST PLAFONNÉE À 800 ms, PAS SEULEMENT PROPORTIONNELLE.
       Écrite « 56 % de la durée du plan », elle s'allonge avec lui : un
       plan de 2,6 s donnait 1,46 s de vol, si bien que la carte du plan
       « rarete » n'était assemblée qu'au TROISIÈME de ses cinq crans —
       les deux premiers se jouaient sur des particules encore en l'air.
       Mesuré en photographiant les cinq crans un par un ; invisible en
       lisant le code, puisque 56 % est parfaitement raisonnable pour un
       plan de 1,3 s. Une proportion sans plafond est un réglage qui se
       dérègle tout seul dès qu'on change la durée. */
    const u = doux(borne((t - d0) / Math.min((d1 - d0) * .56, 800)));

    /* LA MAIN PASSE DU DERNIER PLAN AU PLAN FINAL AVANT LA FIN DE LA
       SÉQUENCE, pas après. Piège payé une fois : le seuil du plan final
       valait « début du dernier plan + 2,2 s », soit 20,2 s — au-delà
       des 20 s de la séquence. Le gel arrivait sur un écran qui montrait
       encore le dernier plan et jamais le lockup. Les deux seuils se
       relaient et se comptent DEPUIS LA FIN (voir APOTHEOSE) : le beat
       s'éteint à 19,4 s, le final paraît à 19,5 s, et il reste 500 ms
       avant l'arrêt de la boucle — vrai quelle que soit la durée du
       dernier plan. */
    noeuds.forEach((n, j) => n.classList.toggle('on',
      j === k && t >= d0 + Math.min(260, (d1 - d0) * .18) &&
      !(j === PLANS.length - 1 && t > APOTHEOSE - 100)));
    fin.classList.toggle('on', t >= APOTHEOSE);

    const cnt = ov.querySelector('#cnt');
    /* LE COMPTEUR EST POSÉ AVANT LA MOITIÉ DU PLAN, ET C'EST LA
       CONTRAINTE QUI EST ÉCRITE, PAS SA SOLUTION. La montée dure
       « la moitié du plan moins 250 ms », donc elle s'arrête 150 ms
       avant le milieu quelle que soit la durée du plan — aujourd'hui
       750 ms sur un plan de 1,80 s. Deux versions ont échoué avant :
       1,5 s finissait 100 ms avant la bascule (jamais lu), puis 1,1 s
       finissait encore APRÈS le milieu — et c'est au milieu qu'on
       photographie. Un compteur saisi à mi-course produit un « 923 »
       qui se lit comme une donnée fausse alors que rien n'est faux.
       Écrire « 700 ms » aurait résolu le cas d'aujourd'hui et rouvert
       le défaut au premier raccourcissement du plan. */
    if (cnt) cnt.textContent = cur === 'mur'
      ? Math.round(entre(VARIANTES_031, N,
          doux(borne((t - debut('mur') - 100) / (duree('mur') / 2 - 250))))) : N;
    const cran = ov.querySelector('#cran'), decl = ov.querySelector('#decl');
    if (cran && cur === 'rarete') {
      const idx = Math.min(CRANS.length - 1,
        Math.floor((t - debut('rarete') - CRAN_T0) / _cranMs()));
      if (idx >= 0) {
        const T = CRANS[idx][1];
        cran.textContent = CRANS[idx][0];
        decl.textContent = CRANS[idx][2];
        /* UN CRAN À PLUSIEURS TEINTES S'ÉCRIT EN DÉGRADÉ, comme dans
           l'app : divine y est un dégradé détouré sur le texte, pas une
           couleur. Un seul hex les rendait, lui et eternal, jaunes tous
           les deux. */
        if (T.length > 1) {
          cran.style.color = 'transparent';
          cran.style.backgroundImage = 'linear-gradient(100deg,' + T.concat(T[0]).join(',') + ')';
          cran.style.backgroundClip = cran.style.webkitBackgroundClip = 'text';
        } else {
          cran.style.color = T[0];
          cran.style.backgroundImage = 'none';
        }
      }
    }
    const lg = ov.querySelector('#lg');
    /* LE PAS DU CYCLE DES LANGUES SE CALCULE, il ne se recopie pas :
       les sept doivent passer entre le début du plan et l'apothéose,
       quelle que soit la durée qu'on donne à l'un ou à l'autre. */
    if (lg && cur === 'fin') lg.textContent = LANGUES[Math.min(LANGUES.length - 1,
      Math.floor((t - debut('fin')) / ((APOTHEOSE - debut('fin')) / LANGUES.length)))];

    for (let i = 0; i < N; i++) {
      const A = dispo[prec](i, t), Z = dispo[cur](i, t);
      /* UN SEUL CHIFFRE, PAS DEUX QUI DOIVENT S'ADDITIONNER À 1. Écrit
         « (u - a*.20) / .80 », changer l'un sans l'autre laisse les
         dernières particules ne jamais atteindre leur place, ou les
         premières y arriver trop tôt — sans que rien n'échoue. */
      const uu = doux(borne((u - P[i].a * ETAL) / (1 - ETAL)));
      const w = entre(A.w, Z.w, uu), h = entre(A.h, Z.h, uu), o = entre(A.o, Z.o, uu);
      puce(entre(A.x, Z.x, uu), entre(A.y, Z.y, uu), w, h,
           uu > .5 ? Z.tint : A.tint, o, uu > .5 ? !!Z.creux : !!A.creux);
    }
  };

  /* ── FERMETURE, FOCUS, ÉCHAP ── */
  const rendable = declencheur && declencheur.focus ? declencheur : null;
  const focusables = () => [...ov.querySelectorAll('a[href],button')];
  const surTouche = e => {
    if (e.key === 'Escape') { fermer(); return; }
    if (e.key !== 'Tab') return;
    const f = focusables(); if (!f.length) return;
    const prem = f[0], der = f[f.length - 1];
    if (e.shiftKey && document.activeElement === prem) { e.preventDefault(); der.focus(); }
    else if (!e.shiftKey && document.activeElement === der) { e.preventDefault(); prem.focus(); }
  };
  function fermer() {
    gele = true;
    removeEventListener('keydown', surTouche, true);
    removeEventListener('resize', surTaille);
    ov.remove();
    document.body.style.overflow = '';
    if (rendable) rendable.focus();
  }
  ov.querySelector('.intro-x').addEventListener('click', fermer);
  ov.addEventListener('click', e => { if (e.target === ov) fermer(); });
  addEventListener('keydown', surTouche, true);
  const surTaille = () => { dimensionner(); if (gele) dessiner(DUREE); };
  addEventListener('resize', surTaille, { passive: true });

  dimensionner();
  ov.querySelector('.intro-x').focus();

  /* MOUVEMENT RÉDUIT : le lien mène DIRECTEMENT au plan final. Pas une
     séquence accélérée, pas une image fixe du premier plan — l'état de
     fin, celui qui porte le lockup et le bouton. */
  if (reduit || options.direct) {
    montrerFinal();
    return { fermer, coupe: false };
  }

  /* ── LE GARDE ── */
  let prec2 = 0, total = 0, base = 0, serie = 0, pireSerie = 0, decide = false;
  const ech = [];
  const juger = ts => {
    if (prec2) {
      const dt = ts - prec2; total++;
      if (total > 10 && ech.length < 40) {
        ech.push(dt);
        if (ech.length === 40) base = [...ech].sort((a, b) => a - b)[20];
      }
      if (base && dt > base * 1.75) { serie++; if (serie > pireSerie) pireSerie = serie; }
      else if (base) serie = 0;
    }
    prec2 = ts;
    return pireSerie >= SERIE_MAX;
  };

  let t0 = null, coupe = false;
  const trame = ts => {
    if (gele) return;
    if (t0 === null) t0 = ts;
    const t = ts - t0;
    if (!decide && t <= DECISION_MS) {
      if (juger(ts) || (options.forcerCoupure && t > 900)) {
        decide = true; coupe = true;
        montrerFinal();
        ov.dataset.coupe = '1';
        return;
      }
    } else if (t > DECISION_MS) { decide = true; }
    dessiner(Math.min(t, DUREE));
    if (t < DUREE) requestAnimationFrame(trame);
    else { montrerFinal(); ov.dataset.gele = '1'; }
  };
  requestAnimationFrame(trame);
  return { fermer, get coupe() { return coupe; } };
}
