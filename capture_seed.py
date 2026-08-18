"""SEED de capture — la scène commune aux captures fixes et aux démos.

Ce module ne fait RIEN d'autre que définir des données : l'importer
n'ouvre aucun navigateur et n'écrit aucun fichier. C'est exactement
pourquoi il existe.

Avant, `capture_demos.py` récupérait le seed en exécutant le préfixe de
`capture_screenshots.py` avec `exec(compile(...))` — un script qui lit un
autre script et en exécute la moitié. Ça marchait, et c'était fragile
(le découpage tenait à une chaîne de commentaire) et illisible. Codacy le
signalait à juste titre : Bandit B102, PyLint W0122, Semgrep
exec-detected. Un module partagé rend l'intention explicite et supprime
les trois signalements d'un coup.
"""
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent
URL = 'http://localhost:8124/index.html'

# ══════════════════════════════════════════════════════════
#   SEED — déterministe, calculé depuis les données du dépôt
# ══════════════════════════════════════════════════════════
# La saison est un PARAMÈTRE : elle était écrite en dur à six endroits.
#   python3 capture_screenshots.py [année]      (défaut : 2025)
SEASON = int(sys.argv[1]) if len(sys.argv) > 1 else 2025
CARDS = json.loads((ROOT / 'app' / 'data' / f'cards-{SEASON}.json').read_text())
CARDS = CARDS['cards'] if isinstance(CARDS, dict) else CARDS
BY_ID = {c['id']: c for c in CARDS}

# Dates fixes (le seed ne doit pas bouger d'un jour à l'autre)
DAY = 86400000
BASE = 1754000000000  # 2025-08-01, référence arbitraire mais figée


def _entry(owned=True, qty=1, wishlist=False, doubles=False, favorite=False):
    return {'owned': owned, 'wishlist': wishlist, 'doubles': doubles,
            'favorite': favorite, 'qty': qty}


def build_owned():
    """72 cartes possédées : les 3 petits sets complets, le champion #004
    en set INTÉGRAL (→ rareté Éternelle), et une sélection de pilotes."""
    owned = {}

    # Sets complets : réserve (8), directeurs (9), Grands Prix (23)
    for c in CARDS:
        if c['category'] in ('reserve', 'directeur', 'gp'):
            owned[c['id']] = {t: _entry(qty=1) for t in c['types'][:3]}

    # #004 Fernando Alonso — TOUTES les variantes → set complet → Éternel
    c4 = BY_ID['004']
    owned['004'] = {t: _entry(qty=2 if i < 3 else 1) for i, t in enumerate(c4['types'])}
    owned['004'][c4['types'][0]]['favorite'] = True

    # Pilotes : les 31 premiers non encore pris (progression crédible).
    # Les quotas sont choisis pour que CHAQUE badge pré-daté plus bas soit
    # réellement satisfait — une capture ne doit pas montrer un badge
    # débloqué que la collection ne justifie pas.
    pilots = [c for c in CARDS if c['category'] == 'pilote' and c['id'] not in owned]
    for i, c in enumerate(pilots[:31]):
        types = c['types'][:4] if i % 3 == 0 else c['types'][:2]
        # 'yellow' partout où il existe → le badge Yellow flash (20) tombe
        if 'yellow' in c['types'] and 'yellow' not in types:
            types = types + ['yellow']
        # wild_foil sur 3 pilotes → Wild card (3)
        if i in (2, 6) and 'wild_foil' in c['types']:
            types = types + ['wild_foil']
        owned[c['id']] = {t: _entry(qty=2 if i % 5 == 0 else 1) for t in types}
        # 15 favoris → Super Fan
        if i < 14:
            owned[c['id']][types[0]]['favorite'] = True
        if i % 4 == 0 and len(types) > 1:
            owned[c['id']][types[1]]['doubles'] = True

    # Une promo → Promo king (1)
    promo_card = next(c for c in CARDS if any(t.startswith('promo_') for t in c['types']))
    ptype = next(t for t in promo_card['types'] if t.startswith('promo_'))
    owned.setdefault(promo_card['id'], {})[ptype] = _entry(qty=1)

    # Wishlist sur des cartes NON possédées (badges Rêveur / Ambitieux)
    missing = [c for c in CARDS if c['id'] not in owned]
    for c in missing[:16]:
        owned.setdefault(c['id'], {})[c['types'][0]] = _entry(owned=False, qty=0, wishlist=True)

    return owned


OWNED = build_owned()
OWNED_COUNT = sum(1 for cid, ts in OWNED.items() if any(t.get('owned') for t in ts.values()))

# Badges auto débloqués + DATES (la 1.29 enregistre le timestamp).
# Un badge hérité sans date est laissé à `true` : la capture du détail
# doit aussi pouvoir montrer le repli « Débloqué » simple.
AUTO_BADGES = {
    'first_card':   BASE - 240 * DAY,
    'collector_10': BASE - 232 * DAY,
    'hunter_25':    BASE - 210 * DAY,
    'expert_50':    BASE - 150 * DAY,
    'reserve_all':  BASE - 120 * DAY,
    'director_all': BASE - 96 * DAY,
    'gp_all':       BASE - 60 * DAY,
    'foil_5':       BASE - 205 * DAY,
    'nitro_1':      BASE - 180 * DAY,
    'wild_3':       BASE - 140 * DAY,
    'promo_1':      BASE - 132 * DAY,
    'blue_20':      BASE - 190 * DAY,
    'green_20':     BASE - 175 * DAY,
    'red_20':       BASE - 160 * DAY,
    'yellow_20':    BASE - 155 * DAY,
    'massive_50':   BASE - 145 * DAY,
    'dreamer_5':    BASE - 220 * DAY,
    'ambitious_15': BASE - 100 * DAY,
    'doubler_5':    BASE - 170 * DAY,
    'fan_5':        True,          # ← badge hérité : pas de date connue
    'superfan_15':  BASE - 88 * DAY,
}
MANUAL_BADGES = {
    'spectateur':    BASE - 300 * DAY,
    'premier_achat': BASE - 295 * DAY,
    'cadeau':        BASE - 250 * DAY,
    'echange':       BASE - 200 * DAY,
    'circuit_visit': BASE - 190 * DAY,
    'fan_tv':        BASE - 185 * DAY,
    'gamer':         BASE - 170 * DAY,
    'merch':         BASE - 150 * DAY,
    'launch_day':    BASE - 310 * DAY,
    'sim_racing':    BASE - 120 * DAY,
    'karting':       BASE - 80 * DAY,
    'podcast_f1':    BASE - 40 * DAY,
}

HISTORY = [
    {'date': '2026-03-14', 'owned': 28}, {'date': '2026-04-11', 'owned': 41},
    {'date': '2026-05-09', 'owned': 52}, {'date': '2026-06-13', 'owned': 60},
    {'date': '2026-07-11', 'owned': 67}, {'date': '2026-08-06', 'owned': OWNED_COUNT},
]

# Session cloud FICTIVE : jetons et adresse inventés, expiration lointaine
# pour que getValidSession n'appelle jamais le réseau pendant la capture.
CLOUD_SESSION = {
    'access_token': 'demo.access.token', 'refresh_token': 'demo.refresh.token',
    'expires_at': 4102444800,  # 2100-01-01
    'user': {'id': '00000000-0000-4000-8000-000000000000', 'email': 'demo@f1uno.app'},
}

SEED = {
    'f1uno_version': '2',
    'f1uno_onboarded': 'true',
    'f1uno_setup_done': 'true',
    'f1uno_seen_version': '1.29.0',
    'f1uno_changes_since_backup': '0',
    f'f1uno_owned_{SEASON}': json.dumps(OWNED),
    f'f1uno_auto_badges_{SEASON}': json.dumps(AUTO_BADGES),
    f'f1uno_badges_{SEASON}': json.dumps(MANUAL_BADGES),
    f'f1uno_history_{SEASON}': json.dumps(HISTORY),
    f'f1uno_pinned_badge_{SEASON}': 'pilote_all',   # objectif épinglé
    'f1uno_title': json.dumps({'id': 'gp_all', 'name': 'GP collector', 'emoji': '🏁', 'source': 'badge'}),
    'f1uno_cloud_session': json.dumps(CLOUD_SESSION),
    'f1uno_backup_inc_sec': 'false',
}



# ══════════════════════════════════════════════════════════
# LE SEED « COLLECTION PRESQUE VIDE » (1.72.0)
#
# POURQUOI IL EXISTE. Six défauts d'affichage ont vécu sur la page
# Stats — pluriel faux (« 1 cartes »), libellé de donut débordant de son
# trou, nombre écrit deux fois, cartes phares désignant deux fois la
# même carte — et AUCUNE capture ne les montrait : toutes étaient
# prises sur le seed à 72 cartes. L'état d'un nouvel utilisateur était
# le seul jamais rendu, et c'est celui qui compte le plus.
#
# `seed_presque_vide(n)` produit la même scène avec n cartes possédées
# seulement, badges et historique vidés pour rester cohérent (une
# collection d'une carte n'a pas 40 badges ni douze mois de courbe).
# ══════════════════════════════════════════════════════════
def seed_presque_vide(n=1):
    """Collection de n cartes (une variante chacune), sans badge ni historique."""
    petit = {}
    for card in CARDS[:n]:
        petit[card['id']] = {card['types'][0]: {
            'owned': True, 'wishlist': False, 'doubles': False, 'favorite': False, 'qty': 1}}
    return {
        f'f1uno_owned_{SEASON}': json.dumps(petit),
        f'f1uno_auto_badges_{SEASON}': '{}',
        f'f1uno_badges_{SEASON}': '{}',
        f'f1uno_history_{SEASON}': '[]',
        f'f1uno_pinned_badge_{SEASON}': '',
        'f1uno_title': '',
    }


# ══════════════════════════════════════════════════════════
# « JAMAIS LANCÉE » — l'état qu'aucun seed ne pouvait produire
#
# POURQUOI CE HELPER EXISTE, et pourquoi il ne ressemble à aucun autre :
# tous les autres RENVOIENT des clés à écrire. Celui-ci renvoie le VIDE,
# et c'est tout son intérêt. Un contexte « vierge » au sens des données
# — localStorage effacé, seed neutre — n'est PAS un premier lancement :
# il saute le choix de langue, la mise en route et la proposition de
# tutoriel, c'est-à-dire exactement la séquence qui casse.
#
# Deux fois payé en deux semaines : les six défauts de l'état « 1 carte »
# (aucune capture ne le montrait), puis la fiche d'échange reçue perdue
# au premier lancement — un lien partagé vise pourtant EN PRIORITÉ un
# appareil qui n'a jamais vu l'app.
#
# Usage : un contexte SANS add_init_script, et le parcours joué en
# entier (langue → mise en route → tutoriel). `PREMIER_LANCEMENT`
# documente les étapes à franchir pour que personne n'en oublie une.
# ══════════════════════════════════════════════════════════
PREMIER_LANCEMENT = (
    ('choix de langue', '.lang-opt[data-lang="fr"]'),
    ('mise en route',   '#setupNoBtn'),
    ('tutoriel proposé', '.tut-skip'),
)


def seed_jamais_lancee():
    """Aucune clé : le contexte doit être créé SANS init_script.

    Renvoie un dict vide — l'appelant ne doit rien injecter du tout.
    C'est la seule façon de rendre le vrai premier lancement.
    """
    return {}


def franchir_premier_lancement(page, timeout=2500):
    """Joue le parcours de mise en route comme un humain, dans l'ordre.

    Renvoie la liste des étapes réellement franchies — utile pour
    affirmer dans un test que le parcours a bien eu lieu, plutôt que de
    le supposer.
    """
    franchies = []
    for nom, sel in PREMIER_LANCEMENT:
        loc = page.locator(sel).first
        if loc.count() and loc.is_visible():
            loc.click()
            page.wait_for_timeout(timeout)
            franchies.append(nom)
    return franchies


def init_script(lang, theme, **over):
    seed = dict(SEED, f1uno_lang=lang, f1uno_theme=theme)
    seed.update(over)
    return ';'.join(f'localStorage.setItem({json.dumps(k)},{json.dumps(v)})'
                    for k, v in seed.items()) + ';'
