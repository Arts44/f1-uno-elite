#!/usr/bin/env python3
"""FILET — LE GESTE TACTILE DE FERMETURE D'UNE FICHE

CE QU'IL EXERCE, ET RIEN D'AUTRE (㉔). Le glissé vers le bas qui ferme
la fiche d'une carte (app/app.js, seuil de 80 px) n'etait exerce par
AUCUN test du depot : aucun contexte `has_touch`, aucun `touchstart`
emis. Les autres filets cliquent avec `page.mouse.click`, qui ne
produit aucun evenement tactile — c'est le cousin du cas ⑨, ou
`element.click()` court-circuitait la couche qu'on pretendait tester.

CE FILET DIT : le chemin s'execute, le seuil discrimine, la fiche se
ferme.

CE FILET NE DIT PAS, et il faut le lire avec :
  · rien du CONFORT du geste ;
  · rien du CONFLIT AVEC LE DEFILEMENT — `.modal` est `overflow-y:auto`,
    et le cas qui inquiete est le glisse vers le bas dans une fiche
    DEJA EN HAUT, qui fermerait ce qu'on voulait remonter. Ce filet ne
    l'eprouve pas ;
  · rien d'un doigt reel sur iOS : les `touchMove` sont reguliers,
    sans inertie, injectes par CDP dans un Chromium de bureau.
Ces trois-la attendent un appareil (POINTS-SIGNALES n°32 et n°35).

L'INJECTION PASSE PAR CDP, PAS PAR DU JS DE PAGE. `Input.dispatchTouchEvent`
traverse la meme couche d'entree qu'un vrai doigt. Des `TouchEvent`
fabriques en JS prouveraient seulement que le gestionnaire repond a ce
qu'on lui donne — le defaut exact que ⑨ decrit.

ON LIT LA CLASSE `.open`, PAS `display`. `.mo` est `display:flex` EN
PERMANENCE ; l'ouverture se porte sur la classe. Une premiere sonde
lisait `display` et rendait `False` sur les trois mecanismes testes,
bouton compris — elle mesurait une constante, et a failli faire
declarer un bug en production qui n'existait pas (registre ㉓).

CONTROLE NEGATIF INTEGRE, ET IL EST PERMANENT, pas derriere un drapeau :
un glisse de 60 px NE DOIT PAS fermer. SEUILS DECLARES (㉒) : le seuil
du produit est 80 px (app/app.js) ; on eprouve 60 en dessous et 120
au-dessus. Si le produit change ce seuil, CES DEUX VALEURS SONT A
REPRENDRE — 60 doit rester sous le seuil et 120 au-dessus, sinon le
filet cesse de discriminer sans rougir.

    python3 -m http.server 8123        # a la racine du depot
    python3 verify_touch.py
"""
import sys

from playwright.sync_api import sync_playwright

sys.path.insert(0, __file__.rsplit('/', 1)[0])
from capture_seed import init_script

URL = 'http://localhost:8123/app/index-dev.html'

# ══ BORNE DE SÉCURITÉ, PAS SEUIL DE MESURE ═════════════════════════
# `wait_for_selector` EST DÉJÀ une attente sur signal : elle interroge
# le DOM jusqu à ce que l élément paraisse. Le `timeout=` n est donc pas
# le mécanisme d attente, c est la BORNE qui empêche un blocage
# définitif quand l élément ne viendra jamais.
#
# CE QUE VALAIENT CES BORNES AVANT, ET POURQUOI C ÉTAIT FAUX : 5, 6, 8,
# 15, 20 et 40 s, chacune calibrée sur une machine AU REPOS — donc lue,
# de fait, comme « le temps que ça devrait prendre ». Cinq expirations
# le 22-23/08/2026, toutes juste après un rendu Playwright lourd, aucune
# au repos, sur trois attentes différentes dans deux filets. Le produit
# n était en cause dans aucune.
#
# ⑲ dit ce que ça coûte : un faux rouge est plus cher qu un rouge tardif,
# parce qu il apprend à ne pas croire le filet. La borne passe donc à
# 60 s — assez pour qu une machine chargée ne la touche jamais, assez
# peu pour qu un élément qui ne viendra JAMAIS soit signalé en une
# minute au lieu de bloquer la livraison.
#
# ⚠️ CE NOMBRE N EST PAS UNE MESURE. Personne n a mesuré que l app se
# charge en moins de 60 s : on a mesuré qu elle se charge en 2 à 4 s au
# repos, et on borne 15 à 30 fois au-dessus. Le lire comme une
# performance attendue serait une erreur, et c est pour ça qu il porte
# ce nom-là plutôt qu un littéral.
#
# CE QUE CETTE BORNE N EXERCE PAS (㉔) : la LENTEUR. Une app dont le
# chargement passerait de 2 s à 45 s rendrait ce filet VERT. Rien dans
# ce dépôt ne mesure le temps de chargement de l app — voir n°38.
BORNE_SECURITE_MS = 60_000

SEUIL_PRODUIT = 80          # app/app.js — `if(dy > 80) closeMo()`
SOUS_LE_SEUIL = 60          # doit NE PAS fermer
SUR_LE_SEUIL = 120          # doit fermer
N = 3
OUVERT = "() => document.getElementById('mo').classList.contains('open')"


def ouvrir(pg):
    pg.locator('.card').first.click()
    pg.wait_for_timeout(500)
    return pg.evaluate(OUVERT)


def glisser(cdp, pg, dy, pas=6):
    b = pg.evaluate("() => { const m = document.querySelector('.modal');"
                    " const r = m.getBoundingClientRect();"
                    " return {x: Math.round(r.x + r.width / 2), y: Math.round(r.y + 30)}; }")
    cdp.send('Input.dispatchTouchEvent',
             {'type': 'touchStart', 'touchPoints': [{'x': b['x'], 'y': b['y']}]})
    for k in range(1, pas + 1):
        cdp.send('Input.dispatchTouchEvent',
                 {'type': 'touchMove',
                  'touchPoints': [{'x': b['x'], 'y': b['y'] + round(dy * k / pas)}]})
    cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
    pg.wait_for_timeout(450)


def main():
    echecs = []
    with sync_playwright() as p:
        br = p.chromium.launch(headless=True, args=['--disable-gpu'])
        for essai in range(1, N + 1):
            c = br.new_context(viewport={'width': 390, 'height': 844}, has_touch=True)
            c.add_init_script(init_script('en', 'dark'))
            pg = c.new_page()
            cdp = c.new_cdp_session(pg)
            pg.goto(URL, wait_until='load')
            # DEUX SIGNAUX, PAS UN SEUL — et surtout pas une duree. La
            # premiere version attendait `.card` VISIBLE en un seul appel :
            # elle passait toujours sur un poste au repos, et a expire dans
            # `livrer.sh`, ou la machine sort de 1 213 tests et d'un autre
            # filet. On attend donc d'abord que la carte soit ATTACHEE — le
            # rendu a eu lieu — puis qu'elle ait une boite. Deux conditions
            # franches valent mieux qu'un plafond genereux (registre ⑲).
            pg.wait_for_selector('.card', state='attached', timeout=BORNE_SECURITE_MS)
            pg.wait_for_function(
                "() => { const c = document.querySelector('.card');"
                " if (!c) return false; const b = c.getBoundingClientRect();"
                " return b.width > 0 && b.height > 0; }", timeout=20000)
            pg.wait_for_timeout(600)

            if not ouvrir(pg):
                echecs.append('essai %d : la fiche ne s ouvre pas au clic' % essai)
                c.close()
                continue

            # DISCRIMINATEUR — le bouton est cable dans la MEME fonction que
            # l ecouteur tactile. S il ne repond pas, ce n est pas le geste
            # qui est en cause mais le harnais, et le reste ne veut rien dire.
            pg.evaluate("() => document.getElementById('modalCloseBtn').click()")
            pg.wait_for_timeout(450)
            bouton = not pg.evaluate(OUVERT)

            ouvrir(pg)
            glisser(cdp, pg, SOUS_LE_SEUIL)
            # Les noms disent CE QU ILS VALENT. Une premiere version les
            # appelait `court` et `long_`, et la ligne d affichage lisait
            # l inverse de ce que le test verifiait : le filet etait juste,
            # son message annoncait le contraire.
            ferme_a_60 = not pg.evaluate(OUVERT)

            if not pg.evaluate(OUVERT):
                ouvrir(pg)
            glisser(cdp, pg, SUR_LE_SEUIL)
            ferme_a_120 = not pg.evaluate(OUVERT)

            print('  essai %d · bouton %s · %d px %s · %d px %s'
                  % (essai, 'ferme' if bouton else 'NE FERME PAS',
                     SOUS_LE_SEUIL, 'FERME (defaut)' if ferme_a_60 else 'ne ferme pas',
                     SUR_LE_SEUIL, 'ferme' if ferme_a_120 else 'NE FERME PAS'))

            if not bouton:
                echecs.append('essai %d : #modalCloseBtn ne ferme pas — le cablage n a pas eu'
                              ' lieu, le verdict sur le geste ne vaut rien' % essai)
            if ferme_a_60:
                echecs.append('essai %d : un glisse de %d px ferme la fiche alors que le seuil'
                              ' du produit est %d px' % (essai, SOUS_LE_SEUIL, SEUIL_PRODUIT))
            if not ferme_a_120:
                echecs.append('essai %d : un glisse de %d px ne ferme pas la fiche'
                              % (essai, SUR_LE_SEUIL))
            c.close()
        br.close()

    if echecs:
        print('\nGESTE TACTILE : ECHEC')
        for e in echecs:
            print('  x', e)
        return 1
    print('\nGESTE TACTILE OK — chemin execute, seuil discriminant')
    return 0


if __name__ == '__main__':
    sys.exit(main())
