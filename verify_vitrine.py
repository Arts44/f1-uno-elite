"""FILET — LA VITRINE

POURQUOI IL EXISTE. `tests/vitrine-budget.test.js` ne charge JAMAIS la
page : il lit des tailles sur disque et fait des expressions régulières
sur le source. C'est le même écart que 3 570 Ko sur disque contre
2 031 Ko transférés sur le précache — facteur 1,76. Un plafond posé sur
le disque ne surveille pas ce qui transite, et aucun test ne regardait
ni le décalage de mise en page ni la position du bouton.

CE QU'IL VÉRIFIE, par ordre d'importance :

  ① LE CTA NE BOUGE PAS. Position ET hauteur, police bloquee puis
     police chargee. C'est le bouton qui se deplacait de 25 px pendant
     le chargement — unique conversion de la page — et c'est
     l'assertion qui compte. Le CLS n'en est que la consequence
     chiffree.
  ② CLS < 0,1 aux deux fenetres.
  ③ Poids transfere hors beacon <= 120 Ko.
  ④ LCP RELEVE, PAS ASSERTI : 108 ms en local contre 5 091 ms au P90
     mesure par Cloudflare sur du trafic reel — facteur 47. En faire un
     seuil serait prendre une decision de performance sur un chiffre
     qui ne vaut qu'en avant/apres sur la meme machine.

CONTROLES NEGATIFS (--controle), les trois vus rouges :
  · face de repli retiree           -> le CLS doit remonter
  · actif lourd injecte             -> le plafond doit crever
  · local() introuvable             -> le CLS doit revenir a 0,1929,
    la valeur d'avant correctif. C'est LUI qui garantit que le
    correctif ne peut jamais faire pire que de ne rien faire.

    python3 -m http.server 8124        # a la racine du depot
    python3 verify_vitrine.py [--controle]
"""
import pathlib
import sys

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent
CONTROLE = '--controle' in sys.argv
URL = 'http://localhost:8124/index.html'
BEACON = 'cloudflareinsights.com'
PLAFOND_KO = 120
CLS_MAX = 0.1
CLS_AVANT_CORRECTIF = 0.1929      # mesure du 19/08/2026, sans face de repli
FENETRES = [('mobile 390', 390, 844), ('desktop 1280', 1280, 800)]

VITALS = """
new Promise(res => {
  let lcp = 0, cls = 0;
  new PerformanceObserver(l => { for (const e of l.getEntries()) if (e.startTime > lcp) lcp = e.startTime; })
    .observe({type: 'largest-contentful-paint', buffered: true});
  new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) cls += e.value; })
    .observe({type: 'layout-shift', buffered: true});
  setTimeout(() => {
    const r = document.querySelector('.cta').getBoundingClientRect();
    res({lcp: Math.round(lcp), cls: Math.round(cls * 10000) / 10000,
         cta_y: Math.round(r.y), cta_h: Math.round(r.height)});
  }, 3000);
})
"""


def charger(br, w, h, css='', police=True, lourd=False, remplace=None):
    """Une visite. `police=False` bloque le woff2 : c'est l'etat de repli
    PUR, celui qui doit deja placer le CTA a sa position definitive."""
    octets = {'n': 0}
    c = br.new_context(viewport={'width': w, 'height': h})
    if not police:
        c.route('**/space-grotesk-var.woff2', lambda r: r.abort())
    pg = c.new_page()
    if css or lourd or remplace:
        html = (ROOT / 'index.html').read_text()
        if remplace:
            avant, apres = remplace
            assert avant in html, 'motif de controle introuvable : ' + avant
            html = html.replace(avant, apres)
        if css:
            html = html.replace('</style>', css + '</style>')
        if lourd:
            html = html.replace('</body>', '<img src="app/screenshots/desktop-collection.png" '
                                           'width="10" height="10" alt=""></body>')
        pg.route('**/index.html', lambda route: route.fulfill(
            status=200, content_type='text/html; charset=utf-8', body=html))
    pg.on('response', lambda r: octets.__setitem__(
        'n', octets['n'] + (0 if BEACON in r.url else int(r.headers.get('content-length') or 0))))
    pg.goto(URL, wait_until='load')
    v = pg.evaluate(VITALS)
    c.close()
    return {**v, 'ko': round(octets['n'] / 1024, 1)}


def main():
    echecs = []
    with sync_playwright() as p:
        br = p.chromium.launch(headless=True, args=['--disable-gpu'])
        # Le retrait de la face de repli sert au controle negatif ①.
        sans_repli = "body{font-family:'Space Grotesk',system-ui,sans-serif}" if CONTROLE else ''
        # On REMPLACE la source de la vraie face — en ajouter une
        # seconde ne retirait rien, et le controle rendait vert sur une
        # page inchangee. Premiere version ecrite ici, corrigee sur
        # mesure.
        LOCAL_VRAI = "src:local('Helvetica Neue'),local('Arial');"
        LOCAL_FAUX = "src:local('Police Absente 42');"

        for nom, w, h in FENETRES:
            repli = charger(br, w, h, css=sans_repli, police=False)
            plein = charger(br, w, h, css=sans_repli)
            print('  %-14s CTA repli y=%d h=%d · charge y=%d h=%d · CLS %.4f · LCP %d ms · %.1f Ko'
                  % (nom, repli['cta_y'], repli['cta_h'], plein['cta_y'], plein['cta_h'],
                     plein['cls'], plein['lcp'], plein['ko']))
            if abs(repli['cta_y'] - plein['cta_y']) > 1 or abs(repli['cta_h'] - plein['cta_h']) > 1:
                echecs.append('%s : le CTA bouge — y %d->%d, h %d->%d'
                              % (nom, repli['cta_y'], plein['cta_y'], repli['cta_h'], plein['cta_h']))
            if plein['cls'] >= CLS_MAX:
                echecs.append('%s : CLS %.4f, plafond %.2f' % (nom, plein['cls'], CLS_MAX))
            if plein['ko'] > PLAFOND_KO:
                echecs.append('%s : %.1f Ko transferes, plafond %d Ko' % (nom, plein['ko'], PLAFOND_KO))

        lourd = charger(br, 390, 844, lourd=CONTROLE)
        print('  %-14s %.1f Ko' % ('actif lourd', lourd['ko']))
        if CONTROLE and lourd['ko'] <= PLAFOND_KO:
            echecs.append('controle negatif : l actif lourd n a pas creve le plafond (%.1f Ko)' % lourd['ko'])

        # CONTROLE NEGATIF ③ — sans police locale, on doit RETOMBER sur
        # la valeur d'avant correctif. Ni mieux, ni pire.
        if CONTROLE:
            degrade = charger(br, 390, 844, remplace=(LOCAL_VRAI, LOCAL_FAUX))
            print('  %-14s CLS %.4f (attendu ~%.4f)' % ('local() faux', degrade['cls'], CLS_AVANT_CORRECTIF))
            if abs(degrade['cls'] - CLS_AVANT_CORRECTIF) > 0.02:
                echecs.append('degradation : CLS %.4f, attendu ~%.4f — le correctif ne degrade plus comme avant'
                              % (degrade['cls'], CLS_AVANT_CORRECTIF))
        br.close()

    if echecs:
        print('\nVITRINE : ECHEC')
        for e in echecs:
            print('  x', e)
        return 1
    print('\nVITRINE OK')
    return 0


if __name__ == '__main__':
    sys.exit(main())
