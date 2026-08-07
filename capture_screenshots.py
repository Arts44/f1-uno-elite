"""Gel visuel — génération de TOUTES les captures du dépôt.

Outil de développement (comme extract_data.mjs) : il n'est pas chargé
par l'app. Il vit dans le dépôt parce qu'un gel visuel doit pouvoir
être rejoué après un clone frais — la version scratchpad de la 1.21
avait disparu avec sa session.

    python3 -m http.server 8124        # dans Collections/F1/
    python3 capture_screenshots.py

Ce qu'il produit :
  screenshots/*.jpg|png          états partagés (EN), dimensions historiques
  screenshots/i18n/<st>.<lg>.jpg 4 états × 7 langues

Le SEED est calculé ICI à partir de data/cards-2025.json : même entrée,
même sortie, aucune dérive possible entre deux gels. Il met en scène
l'app à son meilleur — sets complets, champion Éternel, badges datés,
objectif épinglé, cloud connecté — sans jamais afficher de vraie
donnée personnelle (adresse e-mail et jetons sont fictifs).

Le contrôle anti-collision des étoiles ✦ de la tuile Éternel fait
échouer le script (exit 1) : une capture qui montre un chevauchement
ne doit pas atteindre le README.
"""
import json, sys, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent
SHOTS = ROOT / 'screenshots'
I18N = SHOTS / 'i18n'
I18N.mkdir(parents=True, exist_ok=True)
LANGS = ['en', 'fr', 'es', 'zh', 'it', 'nl', 'de']
URL = 'http://localhost:8124/index.html'
FAILS = []

# ══════════════════════════════════════════════════════════
#   SEED — déterministe, calculé depuis les données du dépôt
# ══════════════════════════════════════════════════════════
CARDS = json.loads((ROOT / 'data' / 'cards-2025.json').read_text())
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
    'f1uno_owned_2025': json.dumps(OWNED),
    'f1uno_auto_badges_2025': json.dumps(AUTO_BADGES),
    'f1uno_badges_2025': json.dumps(MANUAL_BADGES),
    'f1uno_history_2025': json.dumps(HISTORY),
    'f1uno_pinned_badge_2025': 'pilote_all',   # objectif épinglé
    'f1uno_title': json.dumps({'id': 'gp_all', 'name': 'GP collector', 'emoji': '🏁', 'source': 'badge'}),
    'f1uno_cloud_session': json.dumps(CLOUD_SESSION),
    'f1uno_backup_inc_sec': 'false',
}


def init_script(lang, theme, **over):
    seed = dict(SEED, f1uno_lang=lang, f1uno_theme=theme)
    seed.update(over)
    return ';'.join(f'localStorage.setItem({json.dumps(k)},{json.dumps(v)})'
                    for k, v in seed.items()) + ';'


# ══════════════════════════════════════════════════════════
#   Helpers
# ══════════════════════════════════════════════════════════
def new_page(ctx, hide_nav=False, wait='.card'):
    page = ctx.new_page()
    page.goto(URL)
    page.wait_for_load_state('networkidle')
    if wait:
        page.wait_for_selector(wait, timeout=15000)
    if hide_nav:
        page.add_style_tag(content='.bottom-nav{display:none!important}')
    # bandeau de mise à jour : hors sujet sur une capture de gel
    page.add_style_tag(content='#updateBanner,.update-banner{display:none!important}')
    page.wait_for_timeout(600)
    return page


def card(page, num):
    return page.locator('.card').filter(has_text=f'#{num}').first


def clip_shot(page, box, path, pad, quality=85):
    page.screenshot(path=str(path), quality=quality, type='jpeg', clip={
        'x': max(box['x'] - pad, 0), 'y': max(box['y'] - pad, 0),
        'width': box['width'] + 2 * pad, 'height': box['height'] + 2 * pad,
    })


def check_overlaps(page):
    """Aucune étoile ✦ de la tuile Éternel ne doit chevaucher un élément."""
    return page.evaluate("""() => {
      const overlap=(a,b)=>a&&b&&!(a.right<b.left||b.right<a.left||a.bottom<b.top||b.bottom<a.top);
      const out=[];
      const t4=[...document.querySelectorAll('.card')].find(c=>c.querySelector('.card-num')?.textContent.startsWith('#004'));
      if(!t4) return ['tuile #004 introuvable'];
      const rT=s=>{const e=t4.querySelector(s);return e?e.getBoundingClientRect():null;};
      const tEls={crown:rT('.crown'),flag:rT('.set-flag'),qbtn:rT('.qbtn'),chip:rT('.card-rarity')};
      for(const s of ['s1','s2','s3']){const sr=rT('.eternal-spark.'+s);
        for(const k of Object.keys(tEls)) if(overlap(sr,tEls[k])) out.push('tile:'+s+'x'+k);}
      t4.click();
      const vis=document.querySelector('.modal-visual');
      if(vis){
        const rM=s=>{const e=vis.querySelector(s);return e?e.getBoundingClientRect():null;};
        const mEls={close:rM('.modal-close'),flag:rM('.set-flag')};
        for(const s of ['s1','s2','s3']){const sr=rM('.eternal-spark.'+s);
          for(const k of Object.keys(mEls)) if(overlap(sr,mEls[k])) out.push('modal:'+s+'x'+k);}
      }
      document.querySelector('[data-action="closeModal"], .modal-close')?.click();
      return out;
    }""")


def go(page, view):
    page.evaluate(f'document.querySelector(`.bn-tab[data-view="{view}"]`).click()')


# ══════════════════════════════════════════════════════════
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    def ctx_for(lang='en', theme='dark', w=800, h=500, scale=2, **over):
        c = browser.new_context(viewport={'width': w, 'height': h}, device_scale_factor=scale)
        c.add_init_script(init_script(lang, theme, **over))
        return c

    def shot(page, name, png=False):
        if png:
            page.screenshot(path=str(SHOTS / name))
        else:
            page.screenshot(path=str(SHOTS / name), type='jpeg', quality=85)

    # ── 1. i18n ×7 : les 4 états qui portent du texte traduit ──
    for lang in LANGS:
        c = ctx_for(lang, 'dark', 1200, 800)
        page = new_page(c, hide_nav=True)
        if lang == 'en':
            ov = check_overlaps(page)
            if ov:
                FAILS.append(f'étoiles Éternel en collision : {ov}')
            page.wait_for_timeout(300)
        t4 = card(page, '004')
        t4.scroll_into_view_if_needed()
        page.wait_for_timeout(400)
        clip_shot(page, t4.bounding_box(), I18N / f'eternal-tile.{lang}.jpg', 26)
        c.close()

        c = ctx_for(lang, 'light', 1200, 800)
        page = new_page(c, hide_nav=True)
        t5 = card(page, '005')
        t5.scroll_into_view_if_needed()
        page.wait_for_timeout(200)
        t5.locator('.qbtn').click()
        page.wait_for_selector('.qadd-pop')
        clip_shot(page, t5.bounding_box(), I18N / f'quick-add.{lang}.jpg', 16)

        t = card(page, '060')
        t.scroll_into_view_if_needed()
        page.wait_for_timeout(200)
        t.locator('.qbtn').click()
        page.wait_for_selector('.qadd-pop')
        page.locator('.qadd-pop .qadd-type').first.click()
        page.wait_for_selector('.toast.show')
        page.wait_for_timeout(250)
        clip_shot(page, page.locator('#toast').bounding_box(), I18N / f'toast.{lang}.jpg', 22)
        page.locator('.toast-action').click()
        page.wait_for_timeout(200)

        go(page, 'stats')
        page.wait_for_selector('.sv-donut')
        page.wait_for_timeout(400)
        tgt = page.locator('.sv-donut-row') if page.locator('.sv-donut-row').count() else page.locator('.sv-donut')
        tgt.first.scroll_into_view_if_needed()
        page.wait_for_timeout(300)
        b = tgt.first.bounding_box()
        clip_shot(page, {'x': b['x'], 'y': b['y'] - 40, 'width': b['width'], 'height': b['height'] + 40},
                  I18N / f'stats-rarity.{lang}.jpg', 12)
        c.close()
        print(f'[{lang}] 4 captures i18n OK')

    # ── 2. États partagés (EN) — dimensions historiques ──
    def desktop(theme, name, fn=None, wait='.card'):
        c = ctx_for('en', theme, 800, 500, 2)
        page = new_page(c, wait=wait)
        if fn:
            fn(page)
        shot(page, name)
        c.close()

    def mobile(theme, name, fn=None, wait='.card', png=False, w=375, h=812, scale=2):
        c = ctx_for('en', theme, w, h, scale)
        page = new_page(c, wait=wait)
        if fn:
            fn(page)
        shot(page, name, png)
        c.close()

    desktop('dark', 'grid-desktop-dark.jpg')
    desktop('light', 'grid-desktop-light.jpg')

    def open_modal(pg):
        card(pg, '004').click()
        pg.wait_for_selector('.modal-visual')
        pg.wait_for_timeout(500)
    desktop('dark', 'modal-dark.jpg', open_modal)
    desktop('light', 'modal-light.jpg', open_modal)

    def open_stats(pg):
        go(pg, 'stats')
        pg.wait_for_selector('.sv-donut')
        pg.wait_for_timeout(400)
    desktop('dark', 'stats-dark.jpg', open_stats)
    desktop('light', 'stats-light.jpg', open_stats)

    mobile('dark', 'grid-mobile-dark.jpg')
    mobile('light', 'grid-mobile-light.jpg')
    mobile('dark', 'modal-mobile-dark.jpg', open_modal)
    mobile('light', 'modal-mobile-light.jpg', open_modal)

    # PWA manifest — tailles EXACTES déclarées, @1x
    mobile('dark', 'desktop-collection.png', png=True, w=1280, h=800, scale=1)
    mobile('dark', 'mobile-collection.png', png=True, w=390, h=844, scale=1)
    print('captures historiques OK')

    # ── 3. Surfaces nées depuis le gel v1 ──
    def open_badges(pg):
        go(pg, 'badges')
        pg.wait_for_selector('.badge-fam')
        pg.wait_for_timeout(900)   # anneau + compteur animés : on capture APRÈS
    mobile('dark', 'badges-dark.jpg', open_badges)
    mobile('light', 'badges-light.jpg', open_badges)

    def open_badge_detail(pg):
        open_badges(pg)
        pg.evaluate('document.querySelector(`.badge-tile[data-badge="gp_all"]`).click()')
        pg.wait_for_selector('.badge-detail.open')
        pg.evaluate('document.querySelector(".badge-detail.open").scrollIntoView({block:"center"})')
        pg.wait_for_timeout(400)
    mobile('dark', 'badges-detail.jpg', open_badge_detail)

    def open_account(pg):
        go(pg, 'account')
        pg.wait_for_selector('#cloudArea')
        pg.wait_for_timeout(700)
    mobile('dark', 'account-dark.jpg', open_account)
    mobile('light', 'account-light.jpg', open_account)

    def open_settings(pg):
        go(pg, 'settings')
        pg.wait_for_selector('.set-security')
        pg.evaluate('document.querySelector(".set-security").scrollIntoView({block:"center"})')
        pg.wait_for_timeout(400)
    mobile('dark', 'settings-dark.jpg', open_settings)

    # Saisie OTP au repos — cases vides, aucun code réel à l'écran.
    # Contexte DÉDIÉ déconnecté : add_init_script rejoue le seed à chaque
    # navigation, donc supprimer la session puis recharger la restaurerait.
    # Une valeur illisible suffit : loadSession() la rejette et renvoie null.
    c = ctx_for('en', 'dark', 375, 812, 2, f1uno_cloud_session='')
    page = new_page(c)
    go(page, 'account')
    page.wait_for_selector('#cloudCodeRow', state='attached')
    page.evaluate("""() => {
      document.getElementById('cloudEmail').value = 'demo@f1uno.app';
      document.getElementById('cloudCodeRow').style.display = '';
      document.getElementById('cloudCode').focus();
      document.getElementById('cloudArea').scrollIntoView({block:'center'});
    }""")
    page.wait_for_timeout(600)
    shot(page, 'otp-input.jpg')
    c.close()

    # Écran PIN au boot (le seed active le PIN → data-boot=login)
    c = ctx_for('en', 'dark', 375, 812, 2, f1uno_pin_enabled='true',
                f1uno_pin_hash='0' * 40)
    page = c.new_page()
    page.goto(URL)
    page.wait_for_selector('#pin-segs', timeout=15000)
    page.wait_for_timeout(600)
    # 2 chiffres : pinKey() se protège du double-clic pendant 50 ms,
    # il faut donc espacer les appuis — sinon le second est ignoré.
    for idx in (0, 4):
        page.evaluate(f'document.querySelectorAll("#login-screen [data-digit]")[{idx}].click()')
        page.wait_for_timeout(120)
    page.wait_for_timeout(400)
    shot(page, 'pin-screen.jpg')
    c.close()

    # Nav bead — la pastille DÉBORDE au-dessus de la barre : le cadrage
    # doit prendre l'union des deux boîtes, sinon elle est décapitée.
    c = ctx_for('en', 'dark', 375, 812, 3)
    page = new_page(c)
    page.wait_for_timeout(500)
    b = page.evaluate("""() => {
      const bar = document.getElementById('bottomNav').getBoundingClientRect();
      const bead = document.getElementById('navBead').getBoundingClientRect();
      const top = Math.min(bar.top, bead.top), bottom = Math.max(bar.bottom, bead.bottom);
      return {x: bar.left, y: top, width: bar.width, height: bottom - top};
    }""")
    clip_shot(page, b, SHOTS / 'nav-bead.jpg', 16)
    c.close()

    # Fiche d'un Grand Prix — les tracés corrigés depuis les relevés GPS
    def open_gp(pg):
        card(pg, '091').click()          # Belgian GP — Spa-Francorchamps
        pg.wait_for_selector('.modal-visual')
        pg.wait_for_timeout(600)
    mobile('dark', 'circuit-gp.jpg', open_gp)
    print('nouvelles surfaces OK')

    browser.close()

if FAILS:
    print('ÉCHECS :', *FAILS, sep='\n  ')
    sys.exit(1)
print(f'\nTOUTES CAPTURES OK — seed : {OWNED_COUNT}/101 cartes, '
      f'{len(AUTO_BADGES)} badges auto, {len(MANUAL_BADGES)} manuels')
