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

Le SEED est calculé ICI à partir de data/cards-<SEASON>.json : même entrée,
même sortie, aucune dérive possible entre deux gels. Il met en scène
l'app à son meilleur — sets complets, champion Éternel, badges datés,
objectif épinglé, cloud connecté — sans jamais afficher de vraie
donnée personnelle (adresse e-mail et jetons sont fictifs).

Le contrôle anti-collision des étoiles ✦ de la tuile Éternel fait
échouer le script (exit 1) : une capture qui montre un chevauchement
ne doit pas atteindre le README.
"""
import atexit, json, os, sys, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent
SHOTS = ROOT / 'screenshots'
I18N = SHOTS / 'i18n'
I18N.mkdir(parents=True, exist_ok=True)
LANGS = ['en', 'fr', 'es', 'zh', 'it', 'nl', 'de']
URL = 'http://localhost:8124/app/index.html'
FAILS = []

# ══════════════════════════════════════════════════════════
#   LE SCRIPT NE PEUT PLUS MOURIR EN SILENCE
#
#   Vécu : check_seed_honesty() levait une exception (une syntaxe
#   f'...' de Python écrite dans un corps JS) et mourait AVANT le
#   `if FAILS` final. Tout ce qui précédait — y compris le contrôle
#   anti-collision — n'était donc jamais rapporté, pendant que le
#   script affichait une trentaine de lignes « OK ». Un contrôle qui
#   échoue sans le dire est pire qu'un contrôle absent : il donne la
#   confiance sans la vérification.
#
#   Le rapport ci-dessous s'affiche À LA SORTIE, quoi qu'il arrive :
#   fin normale, échec de contrôle, ou exception n'importe où. Il
#   distingue les deux cas, parce qu'ils n'ont pas le même sens —
#   « des contrôles ont échoué » ≠ « des contrôles n'ont pas tourné ».
#   os._exit contourne les autres gestionnaires atexit : à ce stade
#   il n'y a plus rien à ranger, et le code de sortie doit survivre.
# ══════════════════════════════════════════════════════════
_REACHED_END = False


@atexit.register
def _rapport_final():
    if FAILS:
        print('\nÉCHECS :', *FAILS, sep='\n  ')
    if not _REACHED_END:
        print('\n⚠️  RAPPORT INCOMPLET — le script s\'est arrêté avant la fin.')
        print('   Les contrôles suivants N\'ONT PAS TOURNÉ. Ne considère aucune')
        print('   capture comme validée : lis la trace ci-dessus et relance.')
        sys.stdout.flush()
        os._exit(1)
    if FAILS:
        sys.stdout.flush()
        os._exit(1)

# ── Le SEED vit dans capture_seed.py : les démos en ont besoin
#    aussi, et un module partagé vaut mieux qu'un script qui en
#    exécute un autre.
from capture_seed import SEED, init_script, SEASON, OWNED_COUNT, seed_presque_vide, \
    AUTO_BADGES, MANUAL_BADGES, CLOUD_SESSION

# ── Bande de comparaison des 5 familles de foil (injectée par Playwright).
# Le même visuel de carte est cloné cinq fois et reçoit tour à tour la
# classe de chaque famille : ce qui diffère à l'écran ne peut donc venir
# que du traitement foil, pas de la carte.
FOIL_STRIP_JS = """() => {
  const src = [...document.querySelectorAll('.card')]
    .find(c => c.className.includes('tv-') && c.className.includes('_foil'));
  if(!src) return false;
  const FAM = [['Foil', 'tv-green_foil'], ['Dual', 'tv-blue_red_foil'],
               ['Promo', 'tv-promo-red'], ['Nitro', 'tv-nitro_foil'],
               ['Wild', 'tv-wild_foil']];
  const box = document.createElement('div');
  box.id = 'foilStrip';
  box.style.cssText = 'position:fixed;inset:0;z-index:99999;background:var(--bg);'
    + 'display:flex;align-items:center;justify-content:center;gap:22px;padding:24px;';
  for(const [label, cls] of FAM){
    const w = document.createElement('div');
    w.style.cssText = 'width:210px;display:flex;flex-direction:column;gap:8px;';
    const t = document.createElement('div');
    t.textContent = label;
    t.style.cssText = 'font:700 11px var(--font-d);letter-spacing:.12em;'
      + 'text-transform:uppercase;color:var(--tx3);text-align:center;';
    const card = src.cloneNode(true);
    card.classList.remove('fx-idle');
    [...card.classList].filter(x => x.startsWith('tv-')).forEach(x => card.classList.remove(x));
    card.classList.add(cls);
    const v = card.querySelector('.card-visual');
    [...v.classList].filter(x => x.startsWith('tv-')).forEach(x => v.classList.remove(x));
    v.classList.add(cls);
    w.append(t, card);
    box.appendChild(w);
  }
  document.body.appendChild(box);
  return true;
}"""

# ══════════════════════════════════════════════════════════
#   GEL DES ANIMATIONS — pour que deux gels soient IDENTIQUES
#
#   Avant : seules les bandes foil de la planche de comparaison
#   étaient figées. Résultat mesuré — deux exécutions du même script
#   produisaient 42 fichiers différents sur 52, avec un SSIM de
#   0,999988 : visuellement identiques, jamais identiques à l'octet.
#   Un diff de captures ne disait donc rien, et c'est exactement ce
#   qui a failli faire attribuer 41 fichiers modifiés à un refactor
#   qui n'y était pour rien.
#
#   LA PHASE EST CHOISIE, PAS SUBIE. Figer à l'image 0 rendrait les
#   effets invisibles — un balayage foil hors champ, un halo éteint,
#   des étoiles à 25 % d'opacité. Chaque animation est donc arrêtée
#   là où elle se MONTRE, et le choix est écrit ici :
#
#     foil-pass        0.225  la bande traverse le centre de la tuile
#     wild-spin        0.30   les faisceaux en diagonale, pas alignés
#     eternalSweep     0.14   le rai à mi-course (la traversée dure 28 %)
#     eternalGlow      0.50   le halo à son maximum
#     eternalTwinkle   0.50   étoiles pleine opacité, taille max
#     divineShift      0.50   dégradé au point le plus contrasté
#     sv-foil-dot      0.50   pastille à saturation maximale
#     prog-full-shine  0.35   le reflet SUR la barre, pas au-delà
#     skShimmer        0.50   lueur du squelette au milieu de sa course
#
#   Les animations d'ENTRÉE (vues, modales, toasts, cases PIN) et
#   toutes les transitions CSS sont au contraire menées à leur FIN :
#   les figer à mi-course montrerait un élément à moitié arrivé, ce
#   qui serait stable et faux. finish() les place à leur état final.
#
#   Le gel se réarme en continu : chaque changement de vue recrée des
#   éléments, donc de nouvelles animations. Un intervalle les rattrape.
# ══════════════════════════════════════════════════════════
FREEZE_JS = """() => {
  const PHASES = {
    'foil-pass': 0.225, 'wild-spin': 0.30, 'eternalSweep': 0.14,
    'eternalGlow': 0.50, 'eternalTwinkle': 0.50, 'divineShift': 0.50,
    'sv-foil-dot': 0.50, 'prog-full-shine': 0.35, 'skShimmer': 0.50,
    'eternalStars': 0.50,
  };
  const gel = () => {
    for(const a of document.getAnimations()){
      try {
        const nom = a.animationName || (a.transitionProperty ? '__transition' : '');
        const t = a.effect.getComputedTiming();
        const d = typeof t.duration === 'number' ? t.duration : 0;
        /* PIÈGE : finish() sur une animation INFINIE lève
           InvalidStateError — on ne peut pas terminer ce qui ne finit
           pas. L'exception était avalée, donc `eternalStars`, absente de
           la table, continuait de tourner et suffisait à faire varier
           20 captures sur 52. Toute animation infinie est donc mise en
           pause, à sa phase si elle en a une, à 0,5 sinon. */
        const infinie = t.iterations === Infinity;
        const phase = PHASES[nom] !== undefined ? PHASES[nom] : (infinie ? 0.5 : undefined);
        if(phase === undefined || !d){ if(!infinie) a.finish(); continue; }
        a.currentTime = d * phase;
        a.pause();
      } catch(e){ /* une animation déjà terminée refuse finish() : sans effet */ }
    }
  };
  /* SMIL — le dernier tiers du problème, et le plus discret.
     Les dégradés Divin et Éternel du donut tournent par
     <animateTransform>, une animation SVG qui n'apparaît PAS dans
     document.getAnimations() : elle vit dans une autre horloge. Elle
     seule faisait varier les 7 captures stats-rarity.
     Phase 2,25 s sur les 9 s du tour complet = un quart de tour : le
     dégradé se lit en diagonale, pas à son orientation de départ. */
  document.querySelectorAll('svg').forEach(svg => {
    if(typeof svg.pauseAnimations === 'function'){
      try { svg.setCurrentTime(2.25); svg.pauseAnimations(); } catch(e){}
    }
  });
  gel();
  clearInterval(window.__gelTimer);
  window.__gelTimer = setInterval(gel, 40);
  return document.getAnimations().length;
}"""

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
    # `content-visibility:auto` (styles.css) laisse le navigateur SAUTER le
    # rendu des tuiles hors écran : excellent à l'usage, incompatible avec
    # un gel. Une tuile non rendue n'a pas d'animation à figer, et reprend
    # à une phase quelconque en entrant dans le cadre. On rend donc tout,
    # pendant la capture seulement — c'est le seul endroit où la lenteur
    # ne coûte rien et où le déterminisme coûte tout.
    page.add_style_tag(content='.card{content-visibility:visible!important}')
    page.wait_for_timeout(600)
    page.evaluate(FREEZE_JS)      # phases choisies, puis réarmement continu
    page.wait_for_timeout(150)
    return page


def card(page, num):
    return page.locator('.card').filter(has_text=f'#{num}').first


def scroll_stable(page, locator, marge=100):
    """Amène l'élément à une position de défilement EXACTE et attend l'arrêt.

    `scroll_into_view_if_needed()` garantit la visibilité, pas la position :
    d'une exécution à l'autre, le même élément se retrouvait à ±6 px, et le
    `clip` calculé depuis son cadre décalait toute la capture. Trois
    captures `quick-add.*` sur sept en vivaient — visible seulement en
    comparant deux exécutions du MÊME code.

    On impose donc la position au lieu de la subir, puis on attend que
    `scrollY` ne bouge plus (un défilement fluide, une ancre de mise en
    page ou un rendu tardif peuvent encore la déplacer après coup).
    """
    locator.scroll_into_view_if_needed()
    handle = locator.element_handle()
    page.evaluate(
        """([el, marge]) => {
          const y = Math.round(el.getBoundingClientRect().top + window.scrollY - marge);
          document.documentElement.style.scrollBehavior = 'auto';
          window.scrollTo(0, Math.max(0, y));
        }""",
        [handle, marge],
    )
    page.wait_for_function(
        """() => {
          if(window.__lastY === window.scrollY){ window.__stable = (window.__stable||0) + 1; }
          else { window.__stable = 0; window.__lastY = window.scrollY; }
          return window.__stable >= 3;
        }""",
        timeout=5000,
    )
    page.evaluate('() => { window.__stable = 0; window.__lastY = -1; }')


def clip_shot(page, box, path, pad, quality=85):
    """`box` peut être un cadre déjà mesuré OU un locator — préférez le locator.

    LA FAUTE QUE ÇA CORRIGE. On mesurait le cadre, PUIS on figeait, PUIS on
    déclenchait. Or le gel mène les animations d'entrée à leur fin : il peut
    donc déplacer la mise en page de quelques pixels ENTRE la mesure et la
    capture. Le `clip` ne désignait alors plus tout à fait la même région, et
    l'image entière se retrouvait décalée de ~6 px.

    Trois captures `quick-add.*` sur sept en vivaient, mais pas les mêmes
    d'une exécution à l'autre : c'est la signature d'une course, pas d'un
    défaut de rendu. En passant le locator, le cadre est relu APRÈS le gel —
    la fenêtre entre mesure et déclenchement disparaît.
    """
    page.evaluate(FREEZE_JS)   # juste avant le déclenchement, pas 120 ms plus tôt
    if hasattr(box, 'bounding_box'):
        box = box.bounding_box()
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
      const tEls={crown:rT('.crown'),flag:rT('.set-flag'),qbtn:rT('.qbtn'),chip:rT('.card-rarity'),
                  repl:rT('.replacement-icon'),
                  dir:rT('.director-icon')};
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
    # Drapeaux de rendu DÉTERMINISTE. Sans eux, il restait un bruit
    # d'anti-crénelage : une poignée de pixels à 3/255 sur un contour SVG,
    # invisible à l'œil mais suffisant pour qu'un diff mente.
    browser = p.chromium.launch(headless=True, args=[
        '--disable-gpu', '--force-color-profile=srgb', '--disable-lcd-text',
        '--disable-font-subpixel-positioning', '--disable-partial-raster',
        '--disable-skia-runtime-opts', '--run-all-compositor-stages-before-draw',
    ])

    def ctx_for(lang='en', theme='dark', w=800, h=500, scale=2, **over):
        c = browser.new_context(viewport={'width': w, 'height': h}, device_scale_factor=scale)
        c.add_init_script(init_script(lang, theme, **over))
        # LE SEED PORTE UNE SESSION CLOUD FICTIVE, et la page Compte lit la
        # date de dernière sauvegarde en réseau. La requête partait donc
        # VRAIMENT vers Supabase, échouait au bout d'un temps variable, et
        # la capture attrapait tantôt le « … » d'attente, tantôt le « none
        # yet » résolu. Mesuré : 131 niveaux d'écart entre deux exécutions
        # sur account-dark et account-light.
        #
        # Un gel visuel n'a rien à faire sur le réseau : on coupe l'origine
        # à la racine. L'échec devient immédiat et identique à chaque fois.
        c.route('**://*.supabase.co/**', lambda r: r.abort())
        return c

    def shot(page, name, png=False):
        if png:
            page.evaluate(FREEZE_JS)
            page.screenshot(path=str(SHOTS / name))
        else:
            page.evaluate(FREEZE_JS)
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
        clip_shot(page, t4, I18N / f'eternal-tile.{lang}.jpg', 26)
        c.close()

        c = ctx_for(lang, 'light', 1200, 800)
        page = new_page(c, hide_nav=True)
        t5 = card(page, '005')
        scroll_stable(page, t5)
        t5.locator('.qbtn').click()
        page.wait_for_selector('.qadd-pop')
        clip_shot(page, t5, I18N / f'quick-add.{lang}.jpg', 16)

        t = card(page, '060')
        scroll_stable(page, t)
        t.locator('.qbtn').click()
        page.wait_for_selector('.qadd-pop')
        page.locator('.qadd-pop .qadd-type').first.click()
        page.wait_for_selector('.toast.show')
        page.wait_for_timeout(250)
        clip_shot(page, page.locator('#toast'), I18N / f'toast.{lang}.jpg', 22)
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
    # 1.45.0 : Stats est passée en colonne principale + rail collant,
    # et le rail n'apparaît qu'au-delà de 1000 px. À 800 px, la capture
    # montrait une mise en page qui n'existe plus.
    def desktop_wide(theme, name, fn=None, wait='.card'):
        c = ctx_for('en', theme, 1280, 860, 2)
        page = new_page(c, wait=wait)
        if fn:
            fn(page)
        shot(page, name)
        c.close()
    desktop_wide('dark', 'stats-dark.jpg', open_stats)
    desktop_wide('light', 'stats-light.jpg', open_stats)

    mobile('dark', 'grid-mobile-dark.jpg')
    mobile('light', 'grid-mobile-light.jpg')
    mobile('dark', 'modal-mobile-dark.jpg', open_modal)
    mobile('light', 'modal-mobile-light.jpg', open_modal)

    # PWA manifest — tailles EXACTES déclarées, @1x
    mobile('dark', 'desktop-collection.png', png=True, w=1280, h=800, scale=1)
    mobile('dark', 'mobile-collection.png', png=True, w=390, h=844, scale=1)
    # Ces DEUX captures appartiennent au manifest (écrans d'installation
    # PWA) : elles vivent dans app/screenshots/ et sont précachées —
    # les autres restent à la racine pour le README et la vitrine.
    for f in ('desktop-collection.png', 'mobile-collection.png'):
        (ROOT / 'app' / 'screenshots').mkdir(exist_ok=True)
        (SHOTS / f).replace(ROOT / 'app' / 'screenshots' / f)
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
        # La ligne « dernière sauvegarde » se remplit en asynchrone : on
        # attend l'état RÉSOLU, pas une durée. Attendre 700 ms, c'était
        # parier sur la latence.
        pg.wait_for_function(
            '() => { const e = document.getElementById("cloudLastBackup");'
            ' return !e || e.textContent.trim() !== "\u2026"; }', timeout=8000)
        pg.wait_for_timeout(300)
    mobile('dark', 'account-dark.jpg', open_account)
    mobile('light', 'account-light.jpg', open_account)

    def open_settings(pg):
        go(pg, 'settings')
        pg.wait_for_selector('.set-security')
        pg.evaluate('document.querySelector(".set-security").scrollIntoView({block:"center"})')
        pg.wait_for_timeout(400)
    mobile('dark', 'settings-dark.jpg', open_settings)

    # ══════════════════════════════════════════════════════════
    # LES SURFACES DE 1.64.0 → 1.72.0 — sept versions que la planche
    # de captures ne montrait pas.
    # ══════════════════════════════════════════════════════════

    # 1.64.0 + 1.65.0 — la matrice 4×4 et le cran suivant, dans la fiche
    def open_matrice(pg):
        card(pg, '044').click()
        pg.wait_for_selector('.mo-mx')
        pg.evaluate('document.querySelector(".mo-mx").scrollIntoView({block:"center"})')
        pg.wait_for_timeout(400)
    mobile('dark', 'matrice-dark.jpg', open_matrice)
    mobile('light', 'matrice-light.jpg', open_matrice)

    def open_cran(pg):
        card(pg, '044').click()
        pg.wait_for_selector('#moNext')
        pg.evaluate('document.querySelector("#moNext").scrollIntoView({block:"center"})')
        pg.wait_for_timeout(400)
    mobile('dark', 'cran-suivant.jpg', open_cran)

    # 1.66.0 — les stats renversées : héros du manque + les trois portes
    def open_stats_haut(pg):
        go(pg, 'stats')
        pg.wait_for_selector('.sv-lack')
        pg.wait_for_timeout(400)
    mobile('dark', 'stats-renversees-dark.jpg', open_stats_haut)
    mobile('light', 'stats-renversees-light.jpg', open_stats_haut)

    # 1.72.0 — L'ÉTAT PRESQUE VIDE, celui que voit un nouvel utilisateur.
    # C'est l'angle mort qui a laissé six défauts en production : les 40
    # captures étaient toutes prises sur le seed à 72 cartes.
    def mobile_vide(theme, name, fn=None, n=1, wait='.card'):
        c = ctx_for('en', theme, 375, 812, 2, **seed_presque_vide(n))
        page = new_page(c, wait=wait)
        if fn:
            fn(page)
        shot(page, name)
        c.close()
    mobile_vide('dark', 'stats-presque-vide.jpg', open_stats_haut, n=1)
    mobile_vide('light', 'stats-presque-vide-light.jpg', open_stats_haut, n=1)
    mobile_vide('dark', 'stats-vide.jpg', open_stats_haut, n=0)

    # 1.67.0 — la célébration de palier (statique par construction)
    def open_palier(pg):
        card(pg, '044').click()
        pg.wait_for_selector('.mo-mx')
        pg.evaluate("""() => {
          const cell = document.querySelector('#moTypeRows .mo-mx-cell[data-type="nitro_foil"]');
          if(cell) cell.click();
        }""")
        pg.wait_for_timeout(200)
        pg.click('#moTypeRows .mqbtn[data-delta="1"]')
        pg.wait_for_selector('#tierCele', timeout=4000)
        pg.wait_for_timeout(400)
    mobile('dark', 'palier-dark.jpg', open_palier)

    # 1.69.0 — la fiche d'échange : son QR à la bonne densité
    def open_fiche_echange(pg):
        go(pg, 'stats')
        pg.wait_for_selector('#svTradeSheet')
        pg.evaluate('document.querySelector("#svTradeSheet").scrollIntoView({block:"center"})')
        pg.wait_for_timeout(400)
    mobile('dark', 'fiche-echange-bouton.jpg', open_fiche_echange)

    # 1.70.0 — l'état vide du Compte (aucune sauvegarde jamais faite)
    def open_compte_vide(pg):
        go(pg, 'account')
        pg.wait_for_timeout(700)
    c = ctx_for('en', 'dark', 375, 812, 2, f1uno_cloud_session='',
                f1uno_last_backup='', **seed_presque_vide(0))
    page = new_page(c, wait='body')
    open_compte_vide(page)
    shot(page, 'compte-vide.jpg')
    c.close()

    # ══════════════════════════════════════════════════════════
    # LES VARIANTES DE LA VITRINE (1.73.0) — le LCP mesuré par
    # Cloudflare sur du trafic réel : 5 091 ms au P90, 13 % des visites
    # en « Poor ». Les deux captures pesaient 246 Ko sur les 277 Ko de
    # la page, soit 89 % du poids.
    #
    # CE QUE LA MESURE A CORRIGÉ dans l'hypothèse de départ : la capture
    # LCP n'était PAS sur-dimensionnée (1600 px pour 760 px CSS = 1,05×
    # sur un écran 2×, ce qui est correct). Le coupable était le FORMAT.
    # Redimensionner seul : −9 %. Passer en WebP : −62 %.
    # La seconde image, elle, cumulait les deux : 750 px pour 200 px
    # d'affichage, ET masquée sous 720 px tout en étant téléchargée.
    #
    # Ces variantes sortent du MÊME script que les captures du README —
    # jamais d'une compression manuelle, qui dériverait. Les captures du
    # README ne changent pas : ce sont des sorties EN PLUS.
    # ══════════════════════════════════════════════════════════
    def _avif(source_jpg, sortie_avif):
        """AVIF q60, encodé par `avifenc`. Trois choses valent d'être dites.

        POURQUOI q60 ET PAS PLUS BAS. Mesuré le 21/08/2026 à la TAILLE DE
        RENDU (350x220 et 200x431, en x2), écart à la source JPEG :
            webp actuel  45 392 o · PSNR 43,8 dB
            AVIF q60     35 836 o · PSNR 48,2 dB   ← retenu
            AVIF q50     27 122 o · PSNR 46,1 dB
        q50 économise 14,7 Ko de plus — MAIS ces octets tombent sur le
        chemin des navigateurs modernes, qui n'est PAS le chemin contraint :
        le plafond de 112 Ko modélise le PIRE cas, celui du repli webp, et
        aucune quantité d'AVIF ne le fait bouger. q50 paierait donc en
        fidélité une économie qui ne desserre rien. q60 est le plus fidèle
        des trois candidats ET déjà 21 % plus léger que l'existant.
        NE PAS DESCENDRE LA QUALITÉ en croyant gagner quelque chose.

        POURQUOI `avifenc` ET PAS Pillow. Pillow sait écrire de l'AVIF et
        il est déjà installé — mais mesuré à qualité et vitesse
        comparables, il rend 44,0 dB pour 32,8 Ko là où avifenc rend
        48,2 dB pour 35,8 Ko. Le même format, un encodeur moins bon.

        POURQUOI `avifenc` ET PAS Pillow, MALGRÉ LA DÉPENDANCE EXTERNE.
        Pillow sait écrire les deux formats et il est déjà installé. Sur
        le WEBP il égale `cwebp -m 6` À L'OCTET PRÈS ; sur l'AVIF, à
        réglages comparables, il rend 44,0 dB pour 32,8 Ko là où avifenc
        rend 48,2 dB pour 35,8 Ko. C'est ce fait-là qui justifie le
        binaire, et lui seul — ne pas unifier sur Pillow pour simplifier.

        DÉTERMINISME vérifié : deux encodages successifs de la même source
        donnent le même condensé. C'est la règle de ce fichier — mêmes
        octets à chaque exécution.

        ⚠️ CORRECTION DU MESSAGE DE COMMIT `05ae3f8`, qui est poussé et ne
        peut plus être amendé. Il annonce « plus petit ET plus fidèle » :
        LA SECONDE MOITIÉ EST FAUSSE, et elle l'est pour les navigateurs
        qui lisent l'AVIF, c'est-à-dire la majorité. La mesure de départ
        comparait des candidats encodés depuis le JPEG à une référence qui
        ÉTAIT ce JPEG, en face d'un webp encodé depuis le PNG de capture —
        la référence n'était pas à égale distance des deux termes
        (registre ㉕). Refait contre le vrai maître :

            grille   webp 45 392 o · 43,7 dB   AVIF servi 35 836 o · 43,1 dB
            badges   webp 27 042 o · 35,7 dB   AVIF servi 23 713 o · 34,4 dB

        L'AVIF servi est donc PLUS PETIT et LÉGÈREMENT MOINS FIDÈLE que
        le webp qu'il précède. Cause : il est encodé depuis le JPEG, donc
        deuxième génération de perte, quand le webp est première
        génération. Le format n'est pas en cause — encodé depuis l'image
        EN MÉMOIRE, l'AVIF rend 30 011 o à 47,8 dB et 19 997 o à 42,5 dB,
        soit plus petit ET franchement plus fidèle.
        AUCUN CHEMIN DEPUIS LE DISQUE NE RATTRAPE ÇA : mesuré, passer par
        le webp plutôt que par le JPEG donne 42,8 dB sur la grille et
        35,0 sur les badges — toujours sous le webp lui-même. La
        correction passe par une REGÉNÉRATION des captures, pas par un
        changement de source.

        DÉCISION DU 21/08/2026 — LES SOURCES AVIF RESTENT, ET C'EST BORNÉ.
        Trois raisons : l'écart vaut 0,6 à 1,3 dB sur des images jugées
        indiscernables à taille de rendu réelle — régression réelle,
        invisible ; le retrait coûterait 12,6 Ko et ferait deux
        allers-retours publics sur le même fichier en deux jours ; et le
        défaut est documenté ici, là où il vit.
        LA BORNE FAIT LA DÉCISION : elle vaut JUSQU'À LA RÉGÉNÉRATION des
        captures, et pas au-delà. Si la régénération n'a pas eu lieu, ce
        n'est plus une régression différée, c'est une régression acceptée
        — et il faut alors rouvrir : soit régénérer, soit retirer les
        deux <source type="image/avif"> de index.html. Suivi au n°36.
        """
        import shutil, subprocess
        if not shutil.which('avifenc'):
            raise SystemExit(
                "\nCAPTURES NON GÉNÉRÉES — `avifenc` est absent.\n"
                "  La vitrine sert l'AVIF en premier ; le produire est\n"
                "  obligatoire, pas optionnel. Sans lui les deux <source>\n"
                "  pointeraient vers des fichiers périmés.\n\n"
                "    brew install libavif\n\n"
                "(Outil de génération hors dépôt, comme Playwright et\n"
                "OpenCV — voir docs/CONVENTIONS.md.)")
        subprocess.run(['avifenc', '-q', '60', '-s', '4',
                        str(source_jpg), str(sortie_avif)],
                       check=True, capture_output=True)

    def variante_vitrine(nom_src_fn, sortie, largeur_cible, theme='dark', w=800, h=500):
        """Capture PNG en mémoire, redimensionne, encode en WebP + JPEG."""
        import cv2, numpy as np
        c = ctx_for('en', theme, w, h, 2)
        page = new_page(c)
        if nom_src_fn:
            nom_src_fn(page)
        brut = page.screenshot(type='png')
        c.close()
        img = cv2.imdecode(np.frombuffer(brut, np.uint8), cv2.IMREAD_COLOR)
        hh, ww = img.shape[:2]
        if ww != largeur_cible:
            img = cv2.resize(img, (largeur_cible, round(hh * largeur_cible / ww)),
                             interpolation=cv2.INTER_AREA)
        # q80 : mesuré au chiffrage — le meilleur rapport avant que les
        # aplats sombres de l'app ne commencent à baver.
        cv2.imwrite(str(SHOTS / (sortie + '.webp')), img, [cv2.IMWRITE_WEBP_QUALITY, 80])
        cv2.imwrite(str(SHOTS / (sortie + '.jpg')), img, [cv2.IMWRITE_JPEG_QUALITY, 82])
        _avif(SHOTS / (sortie + '.jpg'), SHOTS / (sortie + '.avif'))
        return img.shape[1], img.shape[0]

    def _badges_mobile(pg):
        go(pg, 'badges')
        pg.wait_for_selector('.badge-fam')
        pg.wait_for_timeout(900)

    wv = variante_vitrine(None, 'vitrine-grid', 1520)
    mv = variante_vitrine(_badges_mobile, 'vitrine-badges', 400, w=375, h=812)
    print(f'variantes vitrine OK — grid {wv[0]}x{wv[1]}, badges {mv[0]}x{mv[1]}')

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

    # ── Tutoriel refondu (1.47.0) — un chapitre en situation.
    # On entre par le bouton « Rejouer » des Réglages : c'est le chemin
    # réel, et il ne dépend pas de l'état « déjà vu ».
    c = ctx_for('en', 'dark', 375, 812, 2)
    page = new_page(c)
    go(page, 'settings')
    page.wait_for_selector('#replayTutBtn')
    page.evaluate('document.getElementById("replayTutBtn").click()')
    page.wait_for_selector('.tut-bubble')
    page.wait_for_timeout(1800)          # défilement + placement stabilisés
    # Avancer jusqu'à une étape d'observation : la bulle y montre la
    # rangée d'actions complète (Quitter · Précédent · Passer · Suivant).
    #
    # CETTE BOUCLE ÉTAIT LA SECONDE SOURCE DE NON-DÉTERMINISME. Elle
    # attendait 1600 ms après chaque clic et sortait dès que #tutNext
    # existait : selon la vitesse de la machine, elle s'arrêtait à
    # l'étape 2 ou à l'étape 3, et le projecteur .tut-spot se retrouvait
    # sur une autre tuile. Deux exécutions du même code produisaient donc
    # deux captures différentes — 120 952 pixels d'écart, mesurés.
    #
    # On attend maintenant un CHANGEMENT D'ÉTAT observable (le compteur
    # « n / of » de la bulle), pas une durée. Et l'étape atteinte est
    # vérifiée : une capture qui montre une autre étape est un échec, pas
    # une variante acceptable.
    compteur = lambda: page.locator('.tut-count').inner_text().strip()
    for _ in range(4):
        if page.locator('#tutNext').count():
            break
        avant = compteur()
        sp = page.locator('.tut-spot').bounding_box()
        if sp:
            page.mouse.click(sp['x'] + sp['width'] / 2, sp['y'] + sp['height'] / 2)
        try:
            page.wait_for_function(
                '([sel, avant]) => {'
                ' const el = document.querySelector(sel);'
                ' return el && el.textContent.trim() !== avant; }',
                arg=['.tut-count', avant], timeout=8000)
        except Exception:
            break
    page.wait_for_selector('#tutNext', timeout=8000)
    ETAPE_ATTENDUE = '1 / 8'
    atteinte = compteur()
    if atteinte != ETAPE_ATTENDUE:
        FAILS.append(f'tutoriel : capture prise à l\'étape {atteinte}, '
                     f'attendu {ETAPE_ATTENDUE} — la capture ne serait pas reproductible')
    if not page.locator('.tut-rail').count():
        FAILS.append('tutoriel : le rail de chapitres est absent de la capture')
    shot(page, 'tutorial-chapter.jpg')
    c.close()

    # ── Les cinq familles de foil au niveau « moyen » (1.46.x).
    # Même carte, cinq traitements, bande figée au MÊME instant du cycle
    # pour que la comparaison reste honnête d'un gel à l'autre.
    c = ctx_for('en', 'dark', 1280, 560, 2)
    page = new_page(c, hide_nav=True)
    page.evaluate(FOIL_STRIP_JS)
    page.wait_for_timeout(500)
    page.evaluate(FREEZE_JS)
    page.wait_for_timeout(300)
    shot(page, 'foil-family.jpg')
    c.close()
    print('nouvelles surfaces OK')

    browser.close()

# ══════════════════════════════════════════════════════════
#   HONNÊTETÉ DU SEED — vérifiée, pas promise
#
#   Le seed PRÉ-DATE une liste de badges auto pour que les captures
#   montrent une progression crédible. Rien n'empêcherait d'y glisser
#   un badge que la collection ne justifie pas : la règle « une fois
#   débloqué, toujours débloqué » l'afficherait quand même.
#   On recharge donc l'app SANS cette liste et on laisse
#   seedNewAutoBadges() dériver les badges réellement mérités depuis
#   la seule collection. Tout badge pré-daté hors de cette dérivation
#   est un mensonge : la capture échoue.
# ══════════════════════════════════════════════════════════
def check_seed_honesty(browser_factory):
    pre_dated = set(json.loads(SEED[f'f1uno_auto_badges_{SEASON}']).keys())
    with browser_factory() as pw:
        b = pw.chromium.launch(headless=True)
        c = b.new_context(viewport={'width': 420, 'height': 900})
        c.add_init_script(init_script('en', 'dark', **{f'f1uno_auto_badges_{SEASON}': '{}'}))
        pg = c.new_page()
        pg.goto(URL)
        pg.wait_for_selector('.card', timeout=20000)
        pg.wait_for_timeout(1500)
        # La clé passe en ARGUMENT : écrite dans le corps JS, la syntaxe
        # f'...' de Python n'y était pas interpolée et le navigateur la
        # lisait comme du JS invalide — le contrôle plantait au lieu de
        # contrôler, et il plantait AVANT le rapport des échecs.
        derived = set(pg.evaluate("""(key) => {
          const raw = localStorage.getItem(key);
          return raw ? Object.keys(JSON.parse(raw)) : [];
        }""", f'f1uno_auto_badges_{SEASON}'))
        c.close()
        b.close()
    undeserved = sorted(pre_dated - derived)
    if undeserved:
        FAILS.append('badges pré-datés sans condition satisfaite : ' + ', '.join(undeserved))
    else:
        print(f'seed honnête : {len(pre_dated)} badges pré-datés, tous mérités '
              f'({len(derived)} dérivés de la collection)')


check_seed_honesty(sync_playwright)

# Tous les contrôles ont TOURNÉ (qu'ils passent ou non). Le rapport de
# sortie peut désormais parler d'échecs plutôt que d'absence de contrôle.
_REACHED_END = True
if FAILS:
    sys.exit(1)
print(f'\nTOUTES CAPTURES OK — seed : {OWNED_COUNT}/101 cartes, '
      f'{len(AUTO_BADGES)} badges auto, {len(MANUAL_BADGES)} manuels')
