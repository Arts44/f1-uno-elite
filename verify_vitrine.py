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
  ② CLS < 0,1 aux deux fenetres — POLICE RETARDEE DE 900 ms.
     Sans ce retard, la mesure ne mesure rien : en local le woff2 arrive
     AVANT le premier rendu (15-56 ms contre 20-76 ms de FCP), donc
     aucun echange de police, donc aucun decalage a observer. Le chiffre
     oscillait entre 0,0000 et 0,0035 selon lequel des deux gagnait la
     course. Avec le retard, la face de repli est vraiment eprouvee et
     les valeurs sont stables : 0,0035 / 0,0029 / 0,0031, n=3 par
     fenetre, variance nulle (mesure du 20/08/2026).
  ③ Poids transfere hors beacon <= 120 Ko.
  ④ LCP RELEVE, PAS ASSERTI : 108 ms en local contre 5 091 ms au P90
     mesure par Cloudflare sur du trafic reel — facteur 47. En faire un
     seuil serait prendre une decision de performance sur un chiffre
     qui ne vaut qu'en avant/apres sur la meme machine.

  ⑤ LA LIGNE CINETIQUE : hauteur <= 44 px, element LCP inchange aux
     trois fenetres mobiles, et la phrase COMPLETE sans JS. Le script
     anime, il ne fabrique pas.

CONTROLES NEGATIFS (--controle), les cinq vus rouges :
  · face de repli retiree           -> le CLS doit remonter
  · actif lourd injecte             -> le plafond doit crever
  · local() introuvable             -> le CLS doit revenir a 0,1929,
    la valeur d'avant correctif. C'est LUI qui garantit que le
    correctif ne peut jamais faire pire que de ne rien faire.
  · ligne portee a 110 px           -> l'element LCP doit basculer sur
    `pitch` a 360x640. 110 et pas 60 : un premier releve annoncait la
    bascule des 60 px, refait n=3 elle ne s'y produit pas. Le seuil
    mesure est entre 100 (shot-desktop) et 110 (pitch).
  · phrase retiree du HTML          -> le controle sans JS doit tomber.

    python3 -m http.server 8124        # a la racine du depot
    python3 verify_vitrine.py [--controle]
"""
import pathlib
import sys
import time

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent
CONTROLE = '--controle' in sys.argv
URL = 'http://localhost:8124/index.html'
BEACON = 'cloudflareinsights.com'
PLAFOND_KO = 120
CLS_MAX = 0.1
# Mesure du 20/08/2026, face de repli neutralisee ET police retardee de
# 900 ms : c'est la valeur d'AVANT correctif, ligne cinetique comprise.
# Elle valait 0,1929 avant que la ligne existe — le contenu au-dessus du
# CTA a change, donc la fraction d'ecran deplacee aussi.
CLS_AVANT_CORRECTIF = 0.1867
RETARD_POLICE_MS = 900
FENETRES = [('mobile 390', 390, 844), ('desktop 1280', 1280, 800)]
# L'element LCP se verifie sur les trois fenetres mobiles : c'est a
# 360x640 que la bascule se produit, pas sur les plus grandes.
FENETRES_LCP = [('390x844', 390, 844), ('375x667', 375, 667), ('360x640', 360, 640)]
KIN_MAX_PX = 44
PHRASE = '101 cards, 998 variants to collect.'
LCP_ATTENDU = 'shot-desktop'

VITALS = """
new Promise(res => {
  let lcp = 0, cls = 0, el = '';
  new PerformanceObserver(l => { for (const e of l.getEntries()) if (e.startTime > lcp) {
      lcp = e.startTime; el = e.element ? (e.element.className || e.element.tagName) : ''; } })
    .observe({type: 'largest-contentful-paint', buffered: true});
  new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) cls += e.value; })
    .observe({type: 'layout-shift', buffered: true});
  setTimeout(() => {
    const r = document.querySelector('.cta').getBoundingClientRect();
    const k = document.getElementById('kin');
    res({lcp: Math.round(lcp), cls: Math.round(cls * 10000) / 10000,
         cta_y: Math.round(r.y), cta_h: Math.round(r.height), el_lcp: el,
         kin_h: k ? Math.round(k.getBoundingClientRect().height) : null});
  }, 3000);
})
"""


def sans_js(br, remplace=None):
    """La phrase doit etre LA, entiere, sans une ligne de JS. Le
    contexte est ouvert avec javascript_enabled=False : ce n'est pas un
    script neutralise, c'est un navigateur sans script."""
    c = br.new_context(viewport={'width': 390, 'height': 844}, java_script_enabled=False)
    pg = c.new_page()
    if remplace:
        html = (ROOT / 'index.html').read_text().replace(remplace[0], remplace[1])
        pg.route('**/index.html', lambda route: route.fulfill(
            status=200, content_type='text/html; charset=utf-8', body=html))
    pg.goto(URL, wait_until='load')
    pg.wait_for_timeout(1200)
    el = pg.locator('#kin')
    texte = ' '.join(el.inner_text().split()) if el.count() else ''
    hauteur = round(el.bounding_box()['height']) if el.count() else 0
    c.close()
    return {'texte': texte, 'hauteur': hauteur}


def charger(br, w, h, css='', police=True, lourd=False, remplace=None, retard_police=0):
    """Une visite. `police=False` bloque le woff2 : c'est l'etat de repli
    PUR, celui qui doit deja placer le CTA a sa position definitive."""
    octets = {'n': 0}
    c = br.new_context(viewport={'width': w, 'height': h})
    if not police:
        c.route('**/space-grotesk-var.woff2', lambda r: r.abort())
    elif retard_police:
        # LE CONTROLE DE DEGRADATION NE DOIT PAS DEPENDRE D'UN TIMING.
        # Sans ce retard il rendait 0,0000 une fois sur deux : la police
        # arrivait avant le premier rendu, donc AUCUN echange, donc aucun
        # decalage a mesurer — et le controle validait un correctif qu'il
        # n'avait pas eprouve. On impose le retard, le FOUT est garanti.
        c.route('**/space-grotesk-var.woff2', lambda r: (
            time.sleep(retard_police / 1000), r.continue_())[-1])
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
            plein = charger(br, w, h, css=sans_repli, retard_police=RETARD_POLICE_MS)
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

        # ⑤ LA LIGNE CINETIQUE
        kin_haut = ".kin{height:110px!important}" if CONTROLE else ''
        for nom, w, h in FENETRES_LCP:
            v = charger(br, w, h, css=kin_haut, retard_police=RETARD_POLICE_MS)
            print('  %-14s ligne %s px · element LCP %s' % (nom, v['kin_h'], v['el_lcp']))
            if v['kin_h'] is None:
                echecs.append('%s : la ligne #kin est absente' % nom)
            elif v['kin_h'] > KIN_MAX_PX:
                echecs.append('%s : ligne %d px, plafond de DESSIN %d — la bascule LCP mesuree'
                              ' est entre 100 et 110 px, l assertion suivante la couvre'
                              % (nom, v['kin_h'], KIN_MAX_PX))
            if v['el_lcp'] != LCP_ATTENDU:
                echecs.append('%s : element LCP = %s, attendu %s — Cloudflare ne chronometre plus'
                              ' la meme chose' % (nom, v['el_lcp'] or '(aucun)', LCP_ATTENDU))

        phrase_off = ('<span class="kin-piste">', '<span class="kin-piste" hidden>') if CONTROLE else None
        nojs = sans_js(br, remplace=phrase_off)
        print('  %-14s sans JS : %d px · %s' % ('390x844', nojs['hauteur'], nojs['texte'] or '(vide)'))
        if nojs['texte'] != PHRASE:
            echecs.append('sans JS : la phrase lue est %r, attendu %r' % (nojs['texte'], PHRASE))

        lourd = charger(br, 390, 844, lourd=CONTROLE)
        print('  %-14s %.1f Ko' % ('actif lourd', lourd['ko']))
        if CONTROLE and lourd['ko'] <= PLAFOND_KO:
            echecs.append('controle negatif : l actif lourd n a pas creve le plafond (%.1f Ko)' % lourd['ko'])

        # CONTROLE NEGATIF ③ — sans police locale, on doit RETOMBER sur
        # la valeur d'avant correctif. Ni mieux, ni pire.
        if CONTROLE:
            degrade = charger(br, 390, 844, remplace=(LOCAL_VRAI, LOCAL_FAUX),
                              retard_police=RETARD_POLICE_MS)
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
