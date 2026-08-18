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
            pg.wait_for_selector('#svFicheRecue', timeout=5000)
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
