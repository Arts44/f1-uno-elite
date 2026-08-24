#!/usr/bin/env python3
"""LE FILET DE LA FICHE REÇUE (1.74.0)

Ce que rien d'autre ne tient : une fiche reçue par lien doit survivre au
PREMIER LANCEMENT — choix de langue, mise en route, visite guidée. Le
défaut corrigé vivait exactement là, et une vérification partant d'un
localStorage vidé ne pouvait pas le voir : elle saute ces trois écrans.

DEUX CHEMINS, tous deux exigés :
  · direct   : /app/index.html#trade=...   (ce que vise le QR)
  · racine   : /index.html#trade=...       (un lien copié-collé, qui
               passe par la redirection de la vitrine)

Et le parcours est PROUVÉ, pas supposé : franchir_premier_lancement()
renvoie les étapes réellement franchies, et ce script échoue si elles
n'ont pas eu lieu — un test qui ne rencontre jamais la mise en route
serait vert pour rien.

Sortie : 0 si tout passe, 1 sinon. Aucun vert silencieux.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from capture_seed import franchir_premier_lancement, PREMIER_LANCEMENT

BASE = os.environ.get('F1UNO_URL', 'http://localhost:8124')

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

CODE = ("F1T1.bc2xDsIwDIThd7nZg5PGDuRVogwdUrZWahEMiHdHPTEglOUfTv7kFx4oQXD0"
        "-dhWlKjRBM95vaNUaIoQaJrYxBrr7IW9njVlA0tlVEZlVEZlmaU1Wqd1Wqd1KqdyKqdyKqfK"
        "vMz8khOaYFuWvqPUCtUAqRW3vfcVEltrcq7-u4bvGnS4ptEah7fRRt-mMLqd8v_a3h8")
ECHECS = []

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print('Playwright absent — installe-le pour lancer ce filet.')
    print('   pip3 install --user playwright && python3 -m playwright install chromium')
    sys.exit(1)


def parcours(nav, depart, nom):
    """Profil JAMAIS lancé : contexte neuf, AUCUN init_script."""
    ctx = nav.new_context(viewport={'width': 390, 'height': 844})
    pg = ctx.new_page()
    erreurs = []
    pg.on('pageerror', lambda e: erreurs.append(str(e)))
    pg.goto(f'{BASE}{depart}#trade={CODE}')
    pg.wait_for_timeout(2500)

    franchies = franchir_premier_lancement(pg)
    # LE PARCOURS DOIT AVOIR EU LIEU — sinon le test ne prouve rien.
    # SEUIL DECLARE (㉒) : DEUX etapes de premier lancement au moins.
    # Le parcours vierge en compte plusieurs (accueil, configuration) ;
    # en rencontrer moins de deux signifie que le profil n'etait pas
    # vierge, donc que le test s'est deroule sur un etat qu'il ne
    # pretendait pas eprouver. A REPRENDRE si le parcours de premier
    # lancement change de nombre d'etapes.
    if len(franchies) < 2:
        ECHECS.append(f'{nom} : le premier lancement n\'a pas été rencontré '
                      f'(étapes franchies : {franchies or "aucune"}) — '
                      f'ce profil n\'était pas vierge, le test ne prouve rien')
    pg.wait_for_timeout(1200)

    fiche = pg.evaluate("""() => {
      let f = null;
      try { f = JSON.parse(localStorage.getItem('f1uno_trade_inbox') || 'null'); } catch(e){}
      return { stockee: !!f, want: f ? f.want.length : 0, offer: f ? f.offer.length : 0,
               porte: !!document.querySelector('#svFicheRecue') };
    }""")
    if not fiche['stockee']:
        ECHECS.append(f'{nom} : la fiche N\'EST PAS conservée après le premier lancement')
    elif fiche['want'] != 29 or fiche['offer'] != 8:
        ECHECS.append(f'{nom} : fiche tronquée — {fiche["want"]} cherchées, {fiche["offer"]} offertes (attendu 29/8)')
    else:
        print(f'  ✓ {nom} — fiche conservée : {fiche["want"]} cherchées, {fiche["offer"]} offertes '
              f'(étapes franchies : {", ".join(franchies)})')

    # La porte doit apparaître dans Stats
    if fiche['stockee']:
        try:
            pg.click('.bn-tab[data-view="stats"]')
            pg.wait_for_selector('#svFicheRecue', timeout=BORNE_SECURITE_MS)
            print(f'  ✓ {nom} — la porte « fiche reçue » est présente dans Stats')
        except Exception:
            ECHECS.append(f'{nom} : la fiche est stockée mais la porte n\'apparaît pas dans Stats')
    if erreurs:
        ECHECS.append(f'{nom} : erreurs de page — {erreurs[:2]}')
    ctx.close()


print('FILET DE LA FICHE REÇUE — profil JAMAIS lancé, les deux chemins')
print(f'  étapes de mise en route attendues : {", ".join(n for n, _ in PREMIER_LANCEMENT)}')
with sync_playwright() as p:
    nav = p.chromium.launch()
    parcours(nav, '/app/index.html', 'chemin DIRECT (ce que vise le QR)')
    parcours(nav, '/index.html', 'chemin RACINE (lien copié-collé)')
    nav.close()

if ECHECS:
    print(f'\n{len(ECHECS)} ÉCHEC(S) :')
    for e in ECHECS:
        print('  ·', e)
    sys.exit(1)
print('\nFICHE REÇUE OK — conservée sur les deux chemins, premier lancement compris')
