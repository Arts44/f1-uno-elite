/* ══════════════════════════════════════════════════════════
   LE BUDGET DE LA VITRINE (1.73.0) — ce qui décide si quelqu'un
   qui arrive de Reddit reste.

   POURQUOI CE GARDE EXISTE. Cloudflare a mesuré sur du trafic
   RÉEL : élément LCP = la capture de la grille, 5 091 ms au P90,
   13 % des visites en « Poor », 25 % en « Needs Improvement ».
   Les deux captures pesaient 246 Ko sur 277 — 89 % de la page —
   et l'une d'elles était masquée sous 720 px tout en étant
   téléchargée. Rien ne le disait : aucun test ne regardait le
   poids, et la prochaine capture ajoutée aurait ramené le
   problème en silence.

   LE PLAFOND : 112 Ko hors beacon Cloudflare (exception nommée,
   documentée dans les 7 README — et l'ironie mérite d'être
   notée : le seul script externe de la page est précisément ce
   qui a permis de découvrir qu'elle était lente).

   ══ L'UNITÉ A CHANGÉ LE 21/08/2026, LE JOUR OÙ CE TEST A ROUGI ══

   Il faut le dire dans cet ordre, pour que le prochain puisse juger
   au lieu de faire confiance : ce test comptait les octets SUR
   DISQUE, il est passé au rouge en ajoutant un fond animé à la
   vitrine (120,1 Ko contre 120), et c'est CE JOUR-LÀ qu'on a
   regardé l'unité. Un instrument qu'on corrige le jour où il gêne
   mérite d'être relu de près ; voici de quoi le faire.

   LA MESURE QUI TRANCHE, prise sur la production, pas déduite :

       curl -I -H 'Accept-Encoding: gzip' https://arts44.dev/index.html
       → content-encoding: gzip
       → content-length: 6681

   6 681 octets, quand le même fichier en pesait 14 433 sur disque.
   GitHub Pages sert le HTML compressé : le visiteur ne télécharge
   JAMAIS les octets que ce test comptait. Le facteur est de 2,26 sur
   index.html — c'est la même famille d'écart que les 3 570 Ko sur
   disque contre 2 031 Ko transférés du précache (facteur 1,76), déjà
   payée une fois.

   Les quatre autres actifs restent comptés sur disque : webp, woff2
   et ico sont DÉJÀ compressés, gzip ne leur reprend rien et le
   serveur ne les recompresse pas.

   POURQUOI 112 ET PAS 120 REPORTÉ. Changer l'unité sans redécider le
   nombre se serait offert 12,4 Ko que personne n'a accordés — 120
   avait été fixé contre des octets de disque, il ne veut rien dire
   contre des octets transférés. Le nombre est reconstruit :

     · pire cas mesuré ce jour (desktop, les deux captures) : 107,6 Ko
     · réserve : 4 Ko, soit DEUX blocs de commentaire de calibrage au
       tarif mesuré ici même (le fond animé en a coûté 2,0 Ko gzippés).
       C'est le vrai moteur de croissance de ce fichier : dans ce
       dépôt, chaque correctif emporte sa mesure.
     · total : 112 Ko, soit 4,4 Ko de marge.

   C'est VOLONTAIREMENT plus serré que les 16 Ko d'avant. Une marge
   étroite force la prochaine addition à être une décision — trimer,
   ou redécider le nombre avec un argument — et c'est exactement ce
   qui vient de se produire ici, avec un bon résultat.

   ══ LA MARGE EST À 0,80 Ko. LA PROCHAINE ADDITION ÉLAGUE D'ABORD ══
   (mesuré le 22/08/2026 : pire cas 111,20 Ko sur 112)

   Ce n'est plus une formule, c'est l'état du fichier. La séquence
   d'intro a coûté 1,27 Ko gzippés à index.html — le bouton, le
   chargeur de quatre lignes, les styles du lien, l'exclusion `.intro`
   de la règle d'empilement, le repli du pied de page — et la marge est
   passée de 2,08 à 0,80 Ko.

   INVENTAIRE DE CE QUI EST DISPONIBLE, s'il faut vraiment de la place.
   Les commentaires font 18,8 Ko bruts sur 31,4 — 29 blocs de commentaire
   CSS/JS et 5 blocs de commentaire HTML. TOUT retirer rendrait 8,91 Ko gzippés : 13,58 → 4,68,
   marge à 9,71 Ko. Les six plus gros, mesurés isolément :

     face de repli ajustée (le CTA ne bouge plus)   4 133 o → 2 265 o gz
     ligne cinétique (1.78.0)                       2 298 o → 1 345 o gz
     fond animé — la forme B                        1 522 o →   963 o gz
     non mesuré sur appareil mobile (assumé)        1 515 o →   955 o gz
     LCP : fetchpriority, width/height              1 040 o →   653 o gz
     le moteur de particules                          971 o →   620 o gz

   ⚠️ LA RÉSERVE, ET ELLE PASSE DEVANT L'INVENTAIRE. Ces blocs sont ce
   que ce dépôt appelle du travail. Celui de 2,3 Ko sur la face de repli
   porte l'intervalle sûr mesuré [104 %, 106 %] qui a produit
   `size-adjust: 105 %`, et la raison pour laquelle `local('Arial')` a
   été retiré — une garantie « jamais pire » qui était fausse d'une
   branche. Le déplacer dans docs/ le sépare de la ligne qu'il explique,
   et CE DÉPÔT A DÉJÀ PAYÉ PLUSIEURS FOIS le prix d'un réglage dont la
   raison vivait ailleurs.

   DÉCISION PRISE LE 22/08/2026 : on ne déplace rien. 3,6 Ko — ce que
   rendraient les deux plus gros blocs — ne valent pas de couper le lien
   entre un réglage et sa mesure. L'inventaire ci-dessus est là pour que
   la prochaine décision soit chiffrée, pas pour être exécuté.

   CE QUE CE PLAFOND NE COUVRE PAS : le code de la séquence complète,
   chargé seulement au clic, n'entre pas dans le chargement initial et
   n'est donc pas compté. S'il devenait chargé d'office, il faudrait
   redécider ce nombre — pas l'ignorer.

   ══ L'AVIF NE COMPTE PAS ICI, ET C'EST VOULU (21/08/2026) ══

   Les deux captures ont désormais une variante AVIF, servie en premier
   par le <picture>. Ce test continue de sommer les fichiers WEBP, et il
   ne faut pas le « corriger » : le plafond modélise le PIRE cas, celui
   du visiteur dont le navigateur ne lit pas l'AVIF — Safari iOS avant
   16.4, notamment. Ce visiteur télécharge exactement ce qu'il
   téléchargeait avant, et c'est lui que le plafond protège.

   LE GAIN DU CHEMIN MODERNE, noté à côté sans y toucher :
     · pire cas, chemin webp          109,6 Ko  ← ce que ce test mesure
     · chemin AVIF q60                 97,0 Ko  (marge 15,0)
   Descendre le plafond sur le chemin moderne le retirerait à celui qui
   en a le plus besoin. La décision a été prise le 21/08/2026 et elle
   n'est pas un oubli.

   ══ LA MARGE EST À 1,0 Ko — ET ELLE A DÉJÀ SERVI (22/08/2026) ══

   LA PROCHAINE ADDITION À LA VITRINE DEVRA SOIT ÉLAGUER, SOIT ROUVRIR
   CE NOMBRE. Et rouvrir serait la TROISIÈME révision en trois jours :
   120 → 112 le 21/08 en passant des octets de disque aux octets
   transférés, puis une reconduction le 22. Une troisième demanderait
   un argument plus solide que les deux précédentes — la première
   corrigeait une unité fausse, la seconde ne bougeait rien. Une
   révision qui ne ferait que loger la dernière addition n'en est pas
   une : c'est le plafond qui suit le code au lieu de le contraindre.

   CE QUE LA MARGE ÉTROITE VIENT DE PRODUIRE, dès le premier essai.
   La séquence d'intro apportait ses styles de surcouche dans
   index.html : 0,7 Ko gzippés payés par CHAQUE visiteur, pour des
   règles inutiles tant que personne n'a cliqué. La marge tombait à
   0,6 Ko. Ils ont déménagé dans intro.js, qui les injecte à
   l'ouverture — zéro octet au chargement, zéro requête de plus.
   Sans la marge étroite, ils seraient restés là où ils étaient, et
   personne n'aurait regardé. C'est exactement ce que la note du 21/08
   annonçait : « une marge étroite force la prochaine addition à être
   une décision ». Elle l'a forcée au premier essai.

   LA MESURE DU JOUR, pour qu'on sache dans six mois si 112 était une
   marge confortable ou une limite atteinte de justesse :
     · mobile 390 px  :  76 Ko  (la seconde image n'est PAS transférée)
     · desktop 1280 px: 102 Ko  (les deux images)
     · pire cas du test (somme, index.html gzippé) : 107,6 Ko

   ── DEUX RÉSERVES SUR TOUS LES CHIFFRES DE CE FICHIER ──

   ① LE LOCAL NE DIT RIEN DU TERRAIN. Mesuré le 19/08/2026 : LCP
   local 108 ms sur mobile 390, contre 5 091 ms au P90 mesuré par
   Cloudflare sur du trafic réel. FACTEUR 47. Aucune décision de
   performance ne se prend sur le local seul ; une mesure locale ne
   vaut qu'en AVANT/APRÈS sur la même machine, jamais comme un
   chiffre absolu. C'est le cas ① du registre des instruments
   menteurs — la condition de rendu n'est pas celle du terrain.

   ② LE BEACON N'A PAS ÉTÉ MESURÉ. L'environnement de mesure n'a pas
   d'accès à cloudflareinsights.com : le relevé a compté 0,0 Ko pour
   lui. Le total est donc « hors beacon » par ACCIDENT autant que par
   choix, et le poids réel vu par un visiteur est celui-ci PLUS le
   beacon, dont on ne connaît pas la taille. À redire partout où ces
   chiffres sont cités.

   ── MESURE DU 19/08/2026, après le correctif de décalage ──
     · mobile 390  : 74,5 Ko · LCP 48 ms · CLS 0,0033
     · desktop 1280: 100,9 Ko · LCP 32 ms · CLS 0,0010
   Le CLS valait 0,1929 en mobile avant la face de repli ajustée.
   ══════════════════════════════════════════════════════════ */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const ROOT = new URL('../', import.meta.url);
const ko = p => statSync(new URL(p, ROOT)).size / 1024;
/* index.html se compte GZIPPÉ — voir l'en-tête : c'est ce que le
   serveur envoie. Les autres actifs sont déjà compressés. */
const koGzip = p => gzipSync(readFileSync(new URL(p, ROOT)), { level: 9 }).length / 1024;
const htmlBrut = readFileSync(new URL('index.html', ROOT), 'utf8');
/* Les commentaires sont RETIRÉS avant analyse : un commentaire qui
   mentionne une balise en fabriquerait une fausse — le dépôt a déjà
   payé ce piège sur le plancher de --card-h. */
const html = htmlBrut.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '');

export const BUDGET_VITRINE_KO = 112;
/* Mesuré le 21/08/2026 sur le transfert RÉEL (Playwright, en-têtes
   content-length), pas sur la somme des fichiers du dépôt. */
const MESURE_DU_JOUR = { mobile: 76, desktop: 102 };

/* Le pire cas : desktop, les deux captures, index.html tel qu'il est
   servi. Une seule définition, utilisée par l'assertion ET par son
   contrôle négatif — sinon le contrôle éprouve un autre calcul que
   celui qui garde le dépôt. */
const pireCas = (supplementKo = 0) =>
  koGzip('index.html') + ko('screenshots/vitrine-grid.webp')
  + ko('screenshots/vitrine-badges.webp') + ko('app/fonts/space-grotesk-var.woff2')
  + ko('app/favicon.ico') + supplementKo;

describe('budget de la vitrine — 112 Ko transférés, hors beacon', () => {
  test('le pire cas (desktop : les deux images) tient sous le plafond', () => {
    const poids = pireCas();
    assert.ok(poids <= BUDGET_VITRINE_KO,
      `la vitrine pèse ${poids.toFixed(1)} Ko, plafond ${BUDGET_VITRINE_KO} Ko — `
      + `mesure du jour : ${MESURE_DU_JOUR.desktop} Ko desktop, ${MESURE_DU_JOUR.mobile} Ko mobile`);
  });

  /* CONTRÔLE NÉGATIF — SEUIL DÉCLARÉ (㉒).
     Le garde doit savoir voir rouge. On injecte 8 Ko d'actif.
     Pourquoi 8 : la marge mesurée le 21/08/2026 est de 4,4 Ko
     (107,6 contre 112) ; 8 Ko la dépasse sans ambiguïté, et reste en
     dessous de la plus petite capture réelle (26,4 Ko), donc le
     contrôle représente une addition PLAUSIBLE et pas une caricature.
     À REVÉRIFIER si la marge change : si le pire cas descendait sous
     104 Ko, 8 Ko ne suffiraient plus à crever le plafond et ce
     contrôle deviendrait vert sans rien prouver — c'est précisément
     le cas ㉒ qui l'a fait écrire. */
  test('CONTRÔLE NÉGATIF : 8 Ko d’actif en plus doivent crever le plafond', () => {
    const marge = BUDGET_VITRINE_KO - pireCas();
    assert.ok(marge < 8,
      `la marge est de ${marge.toFixed(1)} Ko : 8 Ko d’injection ne crèvent plus le `
      + `plafond, ce contrôle ne prouve plus rien — relire le seuil déclaré au-dessus`);
    assert.ok(pireCas(8) > BUDGET_VITRINE_KO,
      `8 Ko injectés donnent ${pireCas(8).toFixed(1)} Ko et le plafond de `
      + `${BUDGET_VITRINE_KO} tient encore — le garde ne voit pas rouge`);
  });

  test('l’image LCP reste sous 60 Ko — c’est elle que Cloudflare chronomètre', () => {
    assert.ok(ko('screenshots/vitrine-grid.webp') < 60);
  });

  test('la capture masquée sous 720 px est en lazy — 116 Ko en jeu sur mobile', () => {
    const mobile = html.match(/<picture class="pic-mobile">[\s\S]*?<\/picture>/)[0];
    assert.match(mobile, /loading="lazy"/);
    assert.match(mobile, /decoding="async"/);
  });

  test('l’image LCP est priorisée, et JAMAIS en lazy', () => {
    const desktop = html.match(/<picture class="pic-desktop">[\s\S]*?<\/picture>/)[0];
    assert.match(desktop, /fetchpriority="high"/);
    assert.ok(!/loading="lazy"/.test(desktop), 'lazy sur le LCP le retarderait — l’inverse du but');
  });

  test('WebP servi avec repli JPEG : personne ne reste sans image', () => {
    for(const nom of ['vitrine-grid', 'vitrine-badges']){
      assert.match(html, new RegExp(`srcset="screenshots/${nom}\\.webp" type="image/webp"`));
      assert.match(html, new RegExp(`src="screenshots/${nom}\\.jpg"`));
    }
  });

  test('width/height posés partout — le zéro décalage de mise en page tient', () => {
    const imgs = html.match(/<img[^>]*>/g) || [];
    assert.ok(imgs.length >= 2);
    for(const i of imgs){
      assert.match(i, /width="\d+"/, i.slice(0, 60));
      assert.match(i, /height="\d+"/, i.slice(0, 60));
    }
  });

  test('les variantes sortent du script déterministe, jamais d’une compression à la main', () => {
    const script = readFileSync(new URL('capture_screenshots.py', ROOT), 'utf8');
    assert.match(script, /def variante_vitrine/);
    assert.match(script, /IMWRITE_WEBP_QUALITY, 80/);
    assert.match(script, /vitrine-grid/);
  });

  test('un seul script externe : le beacon, exception nommée', () => {
    // Le tag fourni par Cloudflare utilise des apostrophes SIMPLES :
    // un motif qui n'accepte que les doubles ne verrait aucun script
    // externe et passerait au vert en mentant.
    const externes = [...html.matchAll(/<script[^>]*src=['"](https?:[^'"]+)['"]/g)].map(m => m[1]);
    assert.equal(externes.length, 1, `scripts externes: ${externes.join(', ')}`);
    assert.match(externes[0], /static\.cloudflareinsights\.com/);
  });
});
