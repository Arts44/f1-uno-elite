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
CONTROLE = '--controle' in sys.argv

# ══ LE CONTRÔLE NÉGATIF, ET LA VALEUR DU PRODUIT SUR LAQUELLE IL PORTE
# CE FILET N'AVAIT JAMAIS ÉTÉ VU ROUGE (n°29). Il affirme qu'une fiche
# reçue par lien SURVIT au premier lancement ; rien ne prouvait qu'il
# saurait le dire si elle ne survivait pas.
#
# LE DÉFAUT SIMULÉ EST CELUI DU PRODUIT, PAS CELUI DU FILET : on empêche
# l'app d'ÉCRIRE la clé `f1uno_trade_inbox` — la constante INBOX_KEY de
# app/trade-inbox.js:42, c'est-à-dire exactement ce que le défaut de
# 1.74.0 produisait : la fiche arrivait, le premier lancement passait
# par-dessus, et elle n'était plus là. On ne touche à AUCUNE assertion.
#
# SEUIL DÉCLARÉ (㉒) : il n'y en a pas de numérique — l'assertion est
# booléenne (`fiche.stockee`). Ce que le contrôle exige, c'est qu'AU
# MOINS UN échec soit rapporté sur CHACUN des deux chemins, et que le
# code de sortie soit 1. Un contrôle qui rendrait 0 ici voudrait dire
# que le filet ne sait pas voir l'absence de la fiche.
#
# A REPRENDRE si INBOX_KEY change de nom : le contrôle viserait une clé
# qui n'existe plus et rendrait un VERT — donc un faux « le filet sait
# échouer ». C'est le piège que ce filet-ci est censé éviter.
INBOX_KEY = 'f1uno_trade_inbox'
SABOTAGE = """
  const _si = Storage.prototype.setItem;
  Storage.prototype.setItem = function(k, v){
    if (k === '%s') return;          /* la fiche n'est jamais conservee */
    return _si.apply(this, arguments);
  };
""" % INBOX_KEY

# LE REGISTRE DES CONTRÔLES JOUÉS. Un contrôle qui cesse de s'exécuter
# doit être aussi bruyant qu'un contrôle qui rougit (㉜) : le bilan est
# rendu depuis un `finally`, donc même si une exception traverse le
# parcours. Vécu ailleurs : un bilan écrit en fin de fonction ne
# survivait pas à l'exception qu'il devait précisément rendre visible.
CONTROLES = ['chemin DIRECT', 'chemin RACINE']
JOUES = []

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
    if CONTROLE:
        ctx.add_init_script(SABOTAGE)
    pg = ctx.new_page()
    erreurs = []
    pg.on('pageerror', lambda e: erreurs.append(str(e)))
    pg.goto(f'{BASE}{depart}#trade={CODE}')
    pg.wait_for_timeout(2500)

    # LE COMPTEUR COMPTE L'EFFET, PAS L'APPEL. Vécu sur
    # verify_tutorial.py : un script injecté mort à sa première ligne,
    # compté « joué », et un filet vert qui semblait avoir été éprouvé.
    if CONTROLE:
        _neutralise = pg.evaluate(
            "(k) => { try { localStorage.setItem(k, 'sonde'); } catch(e) {}"
            "  const vu = localStorage.getItem(k) === 'sonde';"
            "  if (vu) localStorage.removeItem(k);"
            "  return !vu; }", INBOX_KEY)
        if not _neutralise:
            ECHECS.append(f'{nom} : SABOTAGE INEFFECTIF — la cle {INBOX_KEY}'
                          ' s ecrit encore, le controle n a rien casse')
        else:
            JOUES.append(nom.split('(')[0].strip())

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
if CONTROLE:
    print('  ⚠️ MODE CONTRÔLE : l\'écriture de la clé « %s » est sabotée.' % INBOX_KEY)
    print('     Le filet DOIT rougir sur les deux chemins.')
print(f'  étapes de mise en route attendues : {", ".join(n for n, _ in PREMIER_LANCEMENT)}')
try:
    with sync_playwright() as p:
        nav = p.chromium.launch()
        parcours(nav, '/app/index.html', 'chemin DIRECT (ce que vise le QR)')
        parcours(nav, '/index.html', 'chemin RACINE (lien copié-collé)')
        nav.close()
finally:
    # ── LE BILAN EST RENDU QUOI QU'IL ARRIVE ──────────────────────
    # Dans un `finally`, donc même si une exception traverse le
    # parcours. Un bilan écrit en fin de chemin nominal ne survit pas à
    # l'exception qu'il est censé rendre visible (㉜).
    if CONTROLE:
        manquants = [c for c in CONTROLES if c not in JOUES]
        print('\nCONTROLES NEGATIFS JOUES : %d/%d' % (len(JOUES), len(CONTROLES)))
        for c in CONTROLES:
            print('   %s %s' % ('joue  ' if c in JOUES else 'ABSENT', c))
        if manquants:
            print('\n' + '!' * 62)
            print('CONTROLE(S) NON JOUE(S) : ' + ', '.join(manquants))
            print('Le mode --controle n a pas exerce ce qu il pretend exercer.')
            print('!' * 62)
            ECHECS.append('CONTROLES NON JOUES (%d/%d) : %s — un controle qui ne'
                          ' s execute pas est un controle qui ment'
                          % (len(JOUES), len(CONTROLES), ', '.join(manquants)))

# ══ CE QUE CE CONTRÔLE N'EXERCE PAS (㉔) ═══════════════════════════
# Il prouve que ce filet voit LE défaut qu'on lui montre — une fiche qui
# n'est pas conservée — et RIEN D'AUTRE. Il ne dit pas que le filet
# verrait une fiche TRONQUÉE, une porte `#svFicheRecue` renommée, une
# redirection de la vitrine cassée, ni une erreur de page. Ces quatre
# assertions existent et n'ont jamais été vues rouges.
# UN FILET VU ROUGE UNE FOIS N'EST PAS UN FILET VÉRIFIÉ : c'est UNE de
# ses assertions éprouvée sur UNE branche.

if ECHECS:
    print(f'\n{len(ECHECS)} ÉCHEC(S) :')
    for e in ECHECS:
        print('  ·', e)
    sys.exit(1)
print('\nFICHE REÇUE OK — conservée sur les deux chemins, premier lancement compris')
