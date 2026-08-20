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

   LE PLAFOND : 120 Ko hors beacon Cloudflare (exception nommée,
   documentée dans les 7 README — et l'ironie mérite d'être
   notée : le seul script externe de la page est précisément ce
   qui a permis de découvrir qu'elle était lente).

   LA MESURE DU JOUR, pour qu'on sache dans six mois si 120 était
   une marge confortable ou une limite atteinte de justesse :
     · mobile 390 px  :  73 Ko  (la seconde image n'est PAS transférée)
     · desktop 1280 px:  99 Ko  (les deux images)
     · + favicon 5 Ko ≈ 104 Ko au pire
   Soit ~16 Ko de marge sur le plafond. Confortable, pas large :
   une capture de plus le crève.

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

const ROOT = new URL('../', import.meta.url);
const ko = p => statSync(new URL(p, ROOT)).size / 1024;
const htmlBrut = readFileSync(new URL('index.html', ROOT), 'utf8');
/* Les commentaires sont RETIRÉS avant analyse : un commentaire qui
   mentionne une balise en fabriquerait une fausse — le dépôt a déjà
   payé ce piège sur le plancher de --card-h. */
const html = htmlBrut.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '');

export const BUDGET_VITRINE_KO = 120;
/* Mesuré le 18/08/2026 sur le transfert RÉEL (Playwright, en-têtes
   content-length), pas sur la somme des fichiers du dépôt. */
const MESURE_DU_JOUR = { mobile: 73, desktop: 99 };

describe('budget de la vitrine — 120 Ko hors beacon', () => {
  test('le pire cas (desktop : les deux images) tient sous le plafond', () => {
    const poids = ko('index.html') + ko('screenshots/vitrine-grid.webp')
      + ko('screenshots/vitrine-badges.webp') + ko('app/fonts/space-grotesk-var.woff2')
      + ko('app/favicon.ico');
    assert.ok(poids <= BUDGET_VITRINE_KO,
      `la vitrine pèse ${poids.toFixed(1)} Ko, plafond ${BUDGET_VITRINE_KO} Ko — `
      + `mesure du jour : ${MESURE_DU_JOUR.desktop} Ko desktop, ${MESURE_DU_JOUR.mobile} Ko mobile`);
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
