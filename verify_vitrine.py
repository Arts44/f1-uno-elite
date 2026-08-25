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
from playwright.sync_api import TimeoutError as PWTimeout

ROOT = pathlib.Path(__file__).resolve().parent
import traceback

CONTROLE = '--controle' in sys.argv

# ══ LE REGISTRE DES CONTROLES JOUES ════════════════════════════════
# UN CONTROLE QUI NE S EXECUTE PAS DOIT ETRE AUSSI BRUYANT QU UN
# CONTROLE QUI ROUGIT. Vecu le 22/08/2026 : chiffres_du_seed() importait
# capture_seed.py, qui lit sys.argv[1] au chargement — sous --controle il
# levait un ValueError, et les TROIS DERNIERS controles negatifs (actif
# lourd, local() introuvable, branche mal calibree) n ont plus ete joues
# du tout. Le mode rendait quand meme une liste de rouges — celle des
# quatre premiers — et rien ne distinguait « quatre controles rouges »
# de « sept controles rouges ». Un mode de controle qui perd la moitie
# de ses controles en silence ne controle plus rien.
#
# On compte donc ce qui a ETE JOUE, et on exige le compte exact. Le
# registre est independant du VERDICT de chaque controle : un controle
# joue qui ne rougit pas est deja signale par sa propre assertion.
CONTROLES = [
    'repli retire', 'ligne 110 px', 'canvas dans le flux', 'sans JS masque',
    'actif lourd', 'local() faux', 'repli decale',
]
JOUES = []


def joue(nom):
    """Marque un controle negatif comme EXECUTE. A appeler au point ou
    son assertion est evaluee, jamais avant : ce qu on compte, c est
    l assertion atteinte, pas l intention de l atteindre."""
    assert nom in CONTROLES, 'controle inconnu : ' + nom
    JOUES.append(nom)
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
    const s = document.querySelector('.shot-desktop');
    res({lcp: Math.round(lcp), cls: Math.round(cls * 10000) / 10000,
         cta_y: Math.round(r.y), cta_h: Math.round(r.height), el_lcp: el,
         kin_h: k ? Math.round(k.getBoundingClientRect().height) : null,
         lcp_src: s ? (s.currentSrc || '').split('/').pop() : null,
         lcp_prio: s ? (s.fetchPriority || s.getAttribute('fetchpriority') || '') : null});
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
    # Attendre que le canvas soit PEINT, pas 1500 ms. Le seuil `>= 1000`
    # n'est pas invente : c'est CELUI DE L'ASSERTION plus bas (peints < 1000
    # = echec). Premiere version fautive : `> 0`, vraie des le premier pixel
    # peint — le filet mesurait alors un fond a peine commence et rougissait.
    # Une condition plus FAIBLE que l'assertion qu'elle precede ne vaut rien.
    # `polling=250` n'est pas cosmetique : par defaut Playwright reevalue a
    # CHAQUE image, et ce predicat relit TOUT le canvas (getImageData sur la
    # surface entiere). Reevalue 60 fois par seconde, il coute plus que
    # l'attente fixe qu'il remplace. Pas de chiffre ici : les mesures faites
    # pendant la mise au point l'ont ete avec un serveur qui saturait, donc
    # avec un instrument fausse — elles ne sont pas citables. La condition rend
    # `true` aussi quand #fond est ABSENT : c'est un etat legitime que la
    # mesure ci-dessous rapporte (present: false), et l'attendre bloquerait.
    # Le timeout est AVALE a dessein : sans ce garde, un fond durablement
    # sous le seuil — la regression meme que ce filet surveille — leverait a
    # 60 s, l'exception remonterait, et TOUT CE QUI SUIT serait abandonne.
    # On perdrait le message precis « le canvas ne peint que N pixels » et
    # les controles d'apres. L'assertion plus bas dit la verite, elle.
    try:
        pg.wait_for_function("""() => {
            const cv = document.getElementById('fond');
            if (!cv) return true;
            if (!cv.width || !cv.height) return false;
            const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
            let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
            return n >= 1000; }""", timeout=60000, polling=250)
    except PWTimeout:
        pass
    r = pg.evaluate("""() => { const cv = document.getElementById('fond');
        if (!cv) return {present: false, peints: 0};
        const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
        let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
        return {present: true, peints: n}; }""")
    c.close()
    return r


def chiffres_du_seed():
    """LES NOMBRES DE LA SEQUENCE VIENNENT DU JEU DE DEMO — provenance
    declaree (㉒). intro.js affiche « 72 of 101 » au-dessus de captures
    qui montrent 72/101 : les deux doivent sortir du MEME seed, sinon la
    page se contredit dans le meme ecran.
    On EXECUTE capture_seed.py — c est du Python, il tourne ici, et c est
    la seule maniere de comparer a la SOURCE plutot qu a une copie.
    A REPRENDRE si le seed change de composition.

    ⚠️ ON NEUTRALISE sys.argv LE TEMPS DE L IMPORT. capture_seed.py est
    AUSSI un script en ligne de commande : au chargement il lit
    `int(sys.argv[1])` pour la saison. Importe depuis ici, il heritait
    donc de NOS arguments — et `--controle` le faisait planter avec un
    ValueError. Consequence : le mode --controle est reste CASSE depuis
    l ajout de cette fonction, et les trois derniers controles negatifs
    (actif lourd, local() introuvable, branche mal calibree) n ont plus
    ete joues du tout, sans que rien ne le signale autrement qu une
    trace en fin de sortie. Un module importe ne doit jamais lire les
    arguments de celui qui l importe."""
    argv = sys.argv
    try:
        sys.argv = [argv[0]]
        import capture_seed as cs
    finally:
        sys.argv = argv
    o = cs.build_owned()
    tenues = [c for c, ts in o.items()
              if any(e.get('owned') and (e.get('qty') or 0) > 0 for e in ts.values())]
    doubles = sum(1 for c, ts in o.items() if any(e.get('doubles') for e in ts.values()))
    wishlist = sum(1 for c, ts in o.items() if any(e.get('wishlist') for e in ts.values()))
    ham = [c for c in cs.CARDS if c['id'] == '031'][0]
    return {
        'CARTES': len(cs.CARDS),
        'POSSEDEES': len(tenues),
        'MANQUANTES': len(cs.CARDS) - len(tenues),
        'WISHLIST': wishlist,
        'DOUBLES': doubles,
        'BADGES_OK': sum(1 for v in cs.AUTO_BADGES.values() if v)
                     + sum(1 for v in cs.MANUAL_BADGES.values() if v),
        'VARIANTES_031': len(ham['types']),
        # LE TOTAL DES VARIANTES N ETAIT PAS DANS LE JEU COMPARE, et c est
        # exactement pour ca qu un « 923 across 101 cards » a pu passer :
        # la constante N de intro.js n etait confrontee a rien.
        'N': sum(len(c['types']) for c in cs.CARDS),
    }


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
            # SEUIL DECLARE (㉒) : tolerance de 1 px sur la position ET la
            # hauteur du CTA. Ce n'est pas une marge de confort, c'est
            # l'arrondi : les rectangles sont arrondis a l'entier avant
            # comparaison, deux mesures identiques peuvent differer d'une
            # unite. A 2 px on laisserait passer un vrai deplacement ; a 0
            # on rougirait sur l'arrondi. Valeurs observees en fonctionnement
            # normal : ecart de 0 sur y, de 0 a 1 sur h.
            if abs(repli['cta_y'] - plein['cta_y']) > 1 or abs(repli['cta_h'] - plein['cta_h']) > 1:
                echecs.append('%s : le CTA bouge — y %d->%d, h %d->%d'
                              % (nom, repli['cta_y'], plein['cta_y'], repli['cta_h'], plein['cta_h']))
            if plein['cls'] >= CLS_MAX:
                echecs.append('%s : CLS %.4f, plafond %.2f' % (nom, plein['cls'], CLS_MAX))
            if plein['ko'] > PLAFOND_KO:
                echecs.append('%s : %.1f Ko transferes, plafond %d Ko' % (nom, plein['ko'], PLAFOND_KO))
        if CONTROLE:
            joue('repli retire')

        # ⑤ LA LIGNE CINETIQUE
        kin_haut = ".kin{height:110px!important}" if CONTROLE else ''
        for nom, w, h in FENETRES_LCP:
            v = charger(br, w, h, css=kin_haut, retard_police=RETARD_POLICE_MS)
            print('  %-14s ligne %s px · element LCP %s · charge %s · prio %s'
                  % (nom, v['kin_h'], v['el_lcp'], v['lcp_src'], v['lcp_prio']))
            if CONTROLE and nom == FENETRES_LCP[-1][0]:
                joue('ligne 110 px')
            if v['kin_h'] is None:
                echecs.append('%s : la ligne #kin est absente' % nom)
            elif v['kin_h'] > KIN_MAX_PX:
                echecs.append('%s : ligne %d px, plafond de DESSIN %d — la bascule LCP depend'
                              ' de la fenetre (60-72 px a 320x568), l assertion suivante la couvre'
                              % (nom, v['kin_h'], KIN_MAX_PX))
            if v['el_lcp'] != LCP_ATTENDU:
                echecs.append('%s : element LCP = %s, attendu %s — Cloudflare ne chronometre plus'
                              ' la meme chose' % (nom, v['el_lcp'] or '(aucun)', LCP_ATTENDU))
            # LE <picture> A DEUX SOURCES DEPUIS LE 21/08/2026. Ajouter une
            # source change ce que le preloader decouvre : ce n'est pas
            # acquis, on le mesure. Deux assertions distinctes, parce que
            # deux choses peuvent casser separement — le FORMAT choisi et
            # la PRIORITE de chargement de l'element LCP.
            if not (v['lcp_src'] or '').endswith('.avif'):
                echecs.append('%s : l element LCP charge %r — Chromium sait lire l AVIF, la'
                              ' source doit etre choisie. Ordre des <source> ou fichier absent ?'
                              % (nom, v['lcp_src']))
            if v['lcp_prio'] != 'high':
                echecs.append('%s : fetchpriority de l element LCP = %r, attendu "high" — l ajout'
                              ' d une source l a deplace ou efface' % (nom, v['lcp_prio']))

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
        # SEUIL DECLARE (㉒) : 1000 pixels non transparents. Le fond en
        # peint 89 166 au repos, mesure du 21/08/2026 ; le plancher est
        # donc a moins de 2 % du releve. Il ne cherche pas a valider le
        # dessin, seulement a separer « peint » de « ne peint rien » — un
        # canvas vide en rend 0. A REPRENDRE si le fond devient beaucoup
        # plus discret : le plancher doit rester tres en dessous de ce que
        # le fond peint reellement.
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
            joue('canvas dans le flux')
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

        # ⑦ LES NOMBRES DE LA SEQUENCE CONTRE LE SEED, a la source
        import re as _re
        src_intro = (ROOT / 'intro.js').read_text()
        attendus = chiffres_du_seed()
        lus = {}
        for cle in attendus:
            m = _re.search(r'\b' + cle + r' = (\d+)', src_intro)
            lus[cle] = int(m.group(1)) if m else None
        print('  %-14s %s' % ('nombres', ' · '.join('%s=%s' % (k, lus[k]) for k in attendus)))
        for k in attendus:
            if lus[k] != attendus[k]:
                echecs.append('intro.js : %s vaut %r, le seed en donne %r — la sequence'
                              ' contredirait la capture affichee sous elle'
                              % (k, lus[k], attendus[k]))

        # LE NOMBRE AFFICHE, PAS SEULEMENT LA CONSTANTE. Le plan du mur
        # anime un compteur de 12 a 998 ; une capture prise a mi-course
        # affichait « 923 across 101 cards » et ressemblait a une donnee
        # fausse. Ce n en etait pas une, mais rien ne verifiait la valeur
        # d ARRIVEE. SEUIL DECLARE (㉒) : le plan « mur » court de 3,20 a
        # 5,00 s, le compteur monte de 3,30 a 4,00 s. ON LIT A 4,20 s,
        # C EST-A-DIRE AU MILIEU DU PLAN — l instant exact ou une capture
        # est prise. Marge : 200 ms apres la fin de la montee, 800 ms
        # avant la bascule. Lire plus tard ne prouverait rien : sur les
        # plans suivants le compteur est force a N par le code.
        c2 = br.new_context(viewport={'width': 390, 'height': 844})
        pg2 = c2.new_page()
        pg2.goto(URL, wait_until='load')
        # Attendre le SIGNAL (#voir cliquable), pas une duree. Le 1200 ms
        # d'avant etait un pari sur la machine ; sous charge il ne suffisait
        # pas, au repos il etait du temps perdu. Le 60 s est une BORNE de
        # securite, pas un seuil de mesure : si #voir n'apparait jamais,
        # echouer en une minute plutot que bloquer la livraison.
        pg2.wait_for_selector('#voir', state='visible', timeout=60000)
        pg2.click('#voir')
        # NE PAS CONVERTIR EN ATTENTE SUR CONDITION. Essaye le 23/08/2026,
        # rejete par la relecture : hors du plan « mur », intro.js:960 ecrit
        # `cnt.textContent = N` directement. Une condition « le compteur vaut
        # N » est donc VRAIE des t=0, la rampe de 3,30 a 4,00 s n est plus
        # jamais observee, et un compteur qui monterait vers le mauvais
        # nombre rendrait le meme VERT. Le 4200 ci-dessous n est pas un pari
        # sur la machine : c est l INSTANT DE MESURE declare au-dessus.
        pg2.wait_for_timeout(4200)
        cnt = pg2.evaluate("""() => { const e = document.getElementById('cnt');
            return e ? e.textContent.trim() : null; }""")
        c2.close()
        print('  %-14s compteur du mur = %s' % ('nombre anime', cnt))
        if cnt != str(attendus['N']):
            echecs.append('le compteur du plan « mur » affiche %r au lieu de 998 —'
                          ' soit il n a pas fini de monter, soit il monte vers le'
                          ' mauvais nombre' % cnt)

        phrase_off = ('<span class="kin-piste">', '<span class="kin-piste" hidden>') if CONTROLE else None
        nojs = sans_js(br, remplace=phrase_off)
        print('  %-14s sans JS : %d px · %s' % ('390x844', nojs['hauteur'], nojs['texte'] or '(vide)'))
        if CONTROLE:
            joue('sans JS masque')
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

        # ⑧ LA SEQUENCE D INTRO — trois choses, et la troisieme est un
        # controle permanent, pas un mode.
        c = br.new_context(viewport={'width': 390, 'height': 844})
        pg = c.new_page()
        req = []
        pg.on('request', lambda r: req.append(r.url))
        pg.goto(URL, wait_until='load')
        pg.wait_for_timeout(2200)
        avant = len([u for u in req if 'intro.js' in u])
        # LE GARDE DOIT SAVOIR COUPER. On force un begaiement et on exige
        # que la sequence saute au plan final — lockup et CTA visibles,
        # pas un ecran vide. Un garde qu on n a pas vu couper n a pas ete
        # verifie. SEUIL DECLARE (㉒) : la coupure reelle se decide sur
        # trois sauts consecutifs avant 2 s ; ici on court-circuite la
        # detection, ce qui eprouve le CHEMIN de coupure, pas le seuil.
        pg.evaluate("() => { document.getElementById('voir').onclick = null;"
                    " import('./intro.js').then(m => m.ouvrir("
                    " document.getElementById('voir'), {forcerCoupure: true})); }")
        # Attendre l'ETAT FINAL de la sequence, pas 2600 ms. `true` aussi
        # quand .intro est absent : la mesure ci-dessous rend None dans ce
        # cas, et l'attendre bloquerait sur un etat legitime.
        try:
            pg.wait_for_function("""() => {
                const o = document.querySelector('.intro');
                if (!o) return true;
                const f = o.querySelector('.intro-fin');
                // `coupe` OU `gele` : la fin NATURELLE de la sequence ecrit
                // `gele` et jamais `coupe` (intro.js). N'attendre que `coupe`
                // ferait perdre 60 s pleines sur le cas rouge — l'assertion
                // plus bas distingue ensuite les deux.
                return !!f && f.classList.contains('on')
                       && (o.dataset.coupe === '1'
                           || o.dataset.gele === '1'); }""",
                timeout=60000,
                # `polling=100` : ce predicat tourne PENDANT la sequence,
                # elle-meme pilotee par requestAnimationFrame et chronometree
                # au dixieme. L'evaluer a chaque image entrerait en
                # concurrence avec la boucle qu'on mesure.
                polling=100)
        except PWTimeout:
            pass
        etat = pg.evaluate("""() => { const o = document.querySelector('.intro');
            if (!o) return null;
            const f = o.querySelector('.intro-fin');
            return {coupe: o.dataset.coupe || '0',
                    final: !!f && f.classList.contains('on'),
                    cta: !!f && !!f.querySelector('.cta'),
                    beats: o.querySelectorAll('.intro-beat.on').length}; }""")
        apres = len([u for u in req if 'intro.js' in u])
        c.close()
        print('  %-14s intro.js au chargement %d · apres coupure forcee %s'
              % ('sequence', avant, etat))
        if avant != 0:
            echecs.append('intro.js est charge par la page d accueil (%d requete(s)) —'
                          ' il ne doit l etre qu au clic' % avant)
        if apres != 1:
            echecs.append('intro.js : %d requete(s) apres le clic, attendu 1' % apres)
        if not etat or etat['coupe'] != '1':
            echecs.append('le garde n a pas coupe malgre un begaiement force —'
                          ' un garde qu on n a pas vu couper n a pas ete verifie')
        elif not etat['final'] or not etat['cta'] or etat['beats']:
            echecs.append('coupure : plan final=%s cta=%s beats restants=%s — l utilisateur'
                          ' doit voir le lockup et le bouton, pas un ecran vide'
                          % (etat['final'], etat['cta'], etat['beats']))

        lourd = charger(br, 390, 844, lourd=CONTROLE)
        print('  %-14s %.1f Ko' % ('actif lourd', lourd['ko']))
        if CONTROLE:
            joue('actif lourd')
        if CONTROLE and lourd['ko'] <= PLAFOND_KO:
            echecs.append('controle negatif : l actif lourd n a pas creve le plafond (%.1f Ko)' % lourd['ko'])

        # CONTROLE NEGATIF ③ — sans police locale, on doit RETOMBER sur
        # la valeur d'avant correctif. Ni mieux, ni pire.
        if CONTROLE:
            degrade = charger(br, 390, 844, remplace=(LOCAL_VRAI, LOCAL_FAUX),
                              retard_police=RETARD_POLICE_MS)
            print('  %-14s CLS %.4f (attendu ~%.4f)' % ('local() faux', degrade['cls'], CLS_AVANT_CORRECTIF))
            # SEUIL DECLARE (㉒) : tolerance de 0,02 autour de
            # CLS_AVANT_CORRECTIF. La valeur de reference vaut 0,1363,
            # mesuree n=3 a variance nulle ; la tolerance couvre le bruit
            # d'une machine plus lente, pas un changement de comportement.
            # Un ecart superieur signifie que la degradation n'est plus la
            # meme — soit le correctif protege moins, soit il protege trop,
            # et les deux valent d'etre vus. A REPRENDRE si le texte du
            # pitch change : la reference bouge avec ce qui s'enroule.
            joue('local() faux')
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
            joue('repli decale')
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


def bilan_controles():
    """LE BILAN SE REND HORS DE main(), ET C EST LE CONTROLE NEGATIF DU
    GARDE QUI L A EXIGE. Ecrit a la fin de main(), il ne survivait pas au
    cas qu il est justement cense couvrir : en rejouant la panne du
    22/08 — chiffres_du_seed() qui leve un ValueError — le script mourait
    AVANT le bilan, et le mode --controle rendait une trace Python sans
    jamais dire qu il avait perdu trois controles. Un garde qui disparait
    avec ce qu il garde ne garde rien. Il vit donc ici, appele quoi qu il
    arrive."""
    manquants = [c for c in CONTROLES if c not in JOUES]
    print('\nCONTROLES NEGATIFS JOUES : %d/%d' % (len(JOUES), len(CONTROLES)))
    for c in CONTROLES:
        print('   %s %s' % ('joue  ' if c in JOUES else 'ABSENT', c))
    if not manquants:
        return 0
    print('\n' + '!' * 64)
    print('CONTROLE(S) NON JOUE(S) : ' + ', '.join(manquants))
    print('Le mode --controle n a pas exerce ce qu il pretend exercer :')
    print('un controle qui ne s execute pas est un controle qui ment.')
    print('!' * 64)
    return 1


if __name__ == '__main__':
    try:
        code = main()
    except BaseException:
        traceback.print_exc()
        code = 1
    if CONTROLE:
        code = bilan_controles() or code
    sys.exit(code)
