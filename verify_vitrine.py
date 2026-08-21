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
  ② CLS < 0,1 aux QUATRE fenetres — POLICE RETARDEE DE 900 ms.
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
     CINQ fenetres mobiles, et la phrase COMPLETE sans JS. Le script
     anime, il ne fabrique pas.

CONTROLES NEGATIFS (--controle), tous vus rouges :
  · face de repli retiree           -> le CLS doit remonter
  · actif lourd injecte             -> le plafond doit crever
  · local() introuvable             -> le CLS doit revenir a 0,1929,
    la valeur d'avant correctif. C'est LUI qui garantit que le
    correctif ne peut jamais faire pire que de ne rien faire.
  · ligne portee a 110 px           -> l'element LCP doit basculer sur
    `pitch`, et c'est 320x568 qui le montre. LE CONTROLE A DEJA CHANGE
    DE FENETRE UNE FOIS : il visait 360x640, ou le seuil valait 107 +/- 1
    tant que le pitch faisait cinq lignes ; le pitch passe a trois, ce
    seuil est parti au-dela de 150 px et le controle ne prouvait plus
    rien la. Seuils remesures n=3 sur le fichier actuel :
        320x568 : bascule entre 60 et 72 px   <- ce que 110 eprouve
        360x560 : bascule entre 128 et 136 px
        360x640 : pas de bascule jusqu'a 150 px
    Un controle negatif se recalibre quand la page change, sinon il
    devient un vert de plus.
  · phrase retiree du HTML          -> le controle sans JS doit tomber.
  · face pointee vers une police PRESENTE mais NON calibree (Verdana)
    -> le CLS doit EXPLOSER. C'est la branche que rien n'eprouvait, et
    dont l'absence avait fait ecrire en ligne que le correctif « ne
    peut jamais faire pire que de ne rien faire ». Mesure : 0,3598 a
    360x560 contre 0,0063 sans aucun repli.

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
# REMESUREE a 0,1363 quand le pitch est passe de cinq lignes a trois :
# c'est le MEME defaut sur MOINS de contenu deplace. Les deux chiffres
# ne se comparent pas, leurs perimetres different — pitch long contre
# pitch court. n=3, variance nulle.
CLS_AVANT_CORRECTIF = 0.1363
RETARD_POLICE_MS = 900
# LE JEU DE FENETRES D'UN FILET EST LUI-MEME UNE HYPOTHESE.
# Celui-ci a longtemps ete 390 + 1280, et il rendait VERT pendant que le
# CTA sautait de 25 px a 320 px de large : la face de repli avait ete
# calibree a 375/390 et debordait en dessous. Le filet ne mentait pas,
# il ne regardait pas la ou le defaut vivait. 320x568 et 360x560 sont
# entres ici le 21/08/2026 pour cette raison, et la question a se poser
# devant tout filet est desormais : QUELLE fenetre ne teste-t-il pas ?
FENETRES = [('mobile 320', 320, 568), ('mobile 360', 360, 560),
            ('mobile 390', 390, 844), ('desktop 1280', 1280, 800)]
# L'element LCP se verifie sur les fenetres MOBILES, et le seuil de
# bascule depend de la fenetre — il n'est pas une propriete de la page.
# Mesure du 20/08/2026, n=3 par palier, pitch a cinq lignes :
#     390x844 : aucune bascule jusqu'a 110 px de contenu insere
#     375x667 : aucune bascule jusqu'a 110 px
#     360x640 : bascule a 107 +/- 1 px  (106 -> shot, 108 -> pitch)
#     360x600 : bascule entre 64 et 72 px
#     360x560 : DEJA bascule a 44 px
# La variable reelle n'est pas une hauteur absolue mais l'AIRE VISIBLE
# de la capture comparee a celle du pitch : raccourcir le pitch recule
# le seuil (a trois lignes, la bascule a 360x560 part au-dela de 128 px).
# 360x560 est ici parce qu'un ecran annonce 360x640 offre ~560 px de
# zone de contenu une fois la barre du navigateur deduite.
FENETRES_LCP = [('390x844', 390, 844), ('375x667', 375, 667),
                ('360x640', 360, 640), ('360x560', 360, 560),
                ('320x568', 320, 568), ('320x844', 320, 844)]
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
    # LE HERO ENTIER, pas seulement la phrase. Le fond anime est une
    # amelioration progressive : sans script, la page doit etre celle
    # d'avant lui — et le canvas ne doit pas meme EXISTER, puisqu'il
    # est cree par le script et non ecrit dans le HTML.
    hero = pg.evaluate("""() => {
        const vu = s => { const e = document.querySelector(s);
            if (!e) return null; const b = e.getBoundingClientRect();
            return b.width > 0 && b.height > 0 ? Math.round(b.height) : 0; };
        const cta = document.querySelector('.cta');
        return {lockup: vu('.lockup'), pitch: vu('.pitch'), cta: vu('.cta'),
                cta_href: cta ? cta.getAttribute('href') : null,
                shots: vu('.shots'), canvas: !!document.getElementById('fond')};
    }""")
    c.close()
    return {'texte': texte, 'hauteur': hauteur, 'hero': hero}


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


# CONTROLE NEGATIF DU FOND — on remet le canvas DANS LE FLUX. Seuil
# declare (㉒) : mesure du 21/08/2026, n=3 par case. Un canvas insere
# dans le flux JUSTE AVANT LE CTA fait basculer l element LCP de
# shot-desktop vers pitch sur cinq fenetres sur six des 280 px de haut,
# et sur les six des 360 px. Insere EN TETE de body, comme ici, il en
# fait basculer CINQ sur six a 360 px — 390x844 resiste, il a le plus
# d aire de capture visible. Le seuil depend donc aussi du point
# d insertion, pas seulement de la hauteur : c est la meme regle que
# pour la ligne cinetique, l aire visible de la capture face au pitch.
# Le controle est tenu pour valide si AU MOINS UNE fenetre bascule ;
# s il n en fait basculer aucune, il ne prouve plus rien et le dit.
FOND_DANS_LE_FLUX = ("#fond{position:absolute;top:0;left:0;width:100%;height:520px;z-index:0;",
                     "#fond{position:static;display:block;width:100%;height:360px;z-index:0;")


def charger_fond(br, controle):
    """Le canvas peint-il quelque chose ? Question distincte de « la page
    a-t-elle bouge ». Le controle retire le script du fond."""
    html = (ROOT / 'index.html').read_text()
    if controle:
        html = html.replace("cv.id = 'fond';", "return;")
    c = br.new_context(viewport={'width': 390, 'height': 844})
    pg = c.new_page()
    pg.route('**/index.html', lambda route: route.fulfill(
        status=200, content_type='text/html; charset=utf-8', body=html))
    pg.goto(URL, wait_until='load')
    pg.wait_for_timeout(1500)
    r = pg.evaluate("""() => { const cv = document.getElementById('fond');
        if (!cv) return {present: false, peints: 0};
        const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
        let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
        return {present: true, peints: n}; }""")
    c.close()
    return r


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
        LOCAL_VRAI = "src:local('Helvetica Neue');"
        LOCAL_FAUX = "src:local('Police Absente 42');"
        # LA BRANCHE QUI N AVAIT JAMAIS ETE EPROUVEE : une police
        # PRESENTE mais dont les chasses ne sont pas celles du
        # calibrage. Verdana est sur tous les postes de mesure et
        # affiche un rapport de 95,6 % contre les 105 % reglees.
        LOCAL_AUTRE = "src:local('Verdana');"

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
                echecs.append('%s : ligne %d px, plafond de DESSIN %d — la bascule LCP depend'
                              ' de la fenetre (60-72 px a 320x568), l assertion suivante la couvre'
                              % (nom, v['kin_h'], KIN_MAX_PX))
            if v['el_lcp'] != LCP_ATTENDU:
                echecs.append('%s : element LCP = %s, attendu %s — Cloudflare ne chronometre plus'
                              ' la meme chose' % (nom, v['el_lcp'] or '(aucun)', LCP_ATTENDU))

        # ⑥ LE FOND ANIME — DEUX ASSERTIONS, PAS UNE.
        # Que l'element LCP n'ait pas bouge ne prouve RIEN sur le fond :
        # un canvas qui ne peint pas laisse exactement la meme page. Le
        # piege est concret — un enfant en z-index:-1 se peint derriere
        # le fond de `body`, donc invisible, et toutes les assertions
        # LCP/CLS restent vertes. On compte donc les pixels non
        # transparents du canvas.
        fond = charger_fond(br, CONTROLE)
        print('  %-14s canvas %s · pixels peints %s'
              % ('fond', 'present' if fond['present'] else 'ABSENT', fond['peints']))
        # L assertion tourne DANS LES DEUX MODES : sous --controle la page
        # est sabotee (le script ne cree plus le canvas), donc elle doit
        # rougir. Une assertion qu on desarme pendant le controle ne prouve
        # rien — c est le contraire d un controle negatif.
        if not fond['present']:
            echecs.append('le canvas de fond est absent — le script ne l a pas cree')
        elif fond['peints'] < 1000:
            echecs.append('le canvas de fond ne peint que %d pixels — un fond qui ne'
                          ' peint rien laisse toutes les autres assertions vertes'
                          % fond['peints'])

        # CONTROLE NEGATIF ⑥ — le canvas remis DANS LE FLUX. On rejoue
        # l assertion LCP REELLE sur une page ou le canvas pousse la
        # capture : elle doit tomber aux six fenetres.
        if CONTROLE:
            bascules = 0
            for nom, w, h2 in FENETRES_LCP:
                v = charger(br, w, h2, remplace=FOND_DANS_LE_FLUX,
                            retard_police=RETARD_POLICE_MS)
                if v['el_lcp'] != LCP_ATTENDU:
                    bascules += 1
                    echecs.append('%s : canvas dans le flux, element LCP = %s au lieu de %s'
                                  % (nom, v['el_lcp'] or '(aucun)', LCP_ATTENDU))
            print('  %-14s canvas dans le flux : %d/%d fenetres basculent'
                  % ('controle', bascules, len(FENETRES_LCP)))
            if bascules == 0:
                echecs.append('controle negatif : le canvas dans le flux n a fait basculer'
                              ' AUCUNE fenetre — le controle ne prouve plus rien')

        phrase_off = ('<span class="kin-piste">', '<span class="kin-piste" hidden>') if CONTROLE else None
        nojs = sans_js(br, remplace=phrase_off)
        print('  %-14s sans JS : %d px · %s' % ('390x844', nojs['hauteur'], nojs['texte'] or '(vide)'))
        if nojs['texte'] != PHRASE:
            echecs.append('sans JS : la phrase lue est %r, attendu %r' % (nojs['texte'], PHRASE))
        h = nojs['hero']
        print('  %-14s sans JS : lockup %s · pitch %s · CTA %s (%s) · captures %s · canvas %s'
              % ('390x844', h['lockup'], h['pitch'], h['cta'], h['cta_href'], h['shots'],
                 'PRESENT' if h['canvas'] else 'absent'))
        for cle in ('lockup', 'pitch', 'cta', 'shots'):
            if not h[cle]:
                echecs.append('sans JS : %s absent ou de hauteur nulle — le hero doit etre'
                              ' celui d avant le fond anime' % cle)
        if h['cta_href'] != 'app/':
            echecs.append('sans JS : le CTA pointe vers %r, attendu %r' % (h['cta_href'], 'app/'))
        if h['canvas']:
            echecs.append('sans JS : le canvas de fond EXISTE — il doit etre cree par le'
                          ' script, pas ecrit dans le HTML')

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

            # CONTROLE NEGATIF ⑦ — LA BRANCHE MAL CALIBREE.
            # SEUIL DECLARE (㉒) : mesure du 21/08/2026, face pointee
            # vers Verdana en gardant size-adjust 105 %, CLS 0,3598 a
            # 360x560 contre 0,0063 sans aucun repli — cinquante-sept
            # fois pire que de ne rien faire. On exige donc que le CLS
            # DEPASSE 0,20 : au-dessus du plafond de 0,10 sans etre
            # colle a la valeur mesuree, qui depend de la police
            # presente sur le poste.
            # CE CONTROLE EXISTE PARCE QUE SON ABSENCE A PRODUIT UNE
            # AFFIRMATION FAUSSE EN LIGNE : « le correctif ne peut
            # jamais faire pire que de ne rien faire » etait tire d un
            # controle qui n eprouvait QUE la branche inerte (㉔).
            mal = charger(br, 360, 560, remplace=(LOCAL_VRAI, LOCAL_AUTRE),
                          retard_police=RETARD_POLICE_MS)
            print('  %-14s CLS %.4f (doit DEPASSER 0,20)' % ('repli decale', mal['cls']))
            if mal['cls'] <= 0.20:
                echecs.append('branche mal calibree : CLS %.4f seulement — soit Verdana est'
                              ' absente de ce poste, soit le filet ne sait plus voir le cas'
                              ' ou la face se charge sur les mauvaises chasses' % mal['cls'])
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
