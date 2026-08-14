"""Démos animées — scriptées, reproductibles, à 60 images par seconde.

    python3 -m http.server 8124        # dans Collections/F1/
    python3 capture_demos.py

Produit, pour chacune des quatre démos :
  screenshots/demo-<nom>.gif   33,3 fps — le format qui s'anime dans un
                               README GitHub depuis un fichier du dépôt
  screenshots/demo-<nom>.mp4   60 fps — la version fluide, liée en toutes
                               lettres à côté du GIF

POURQUOI DEUX FORMATS, et pas un choix
--------------------------------------
Le GIF code ses délais en CENTIÈMES de seconde : 30 fps demanderait
33,3 ms, qui n'est pas représentable — on obtiendrait 30/40/30/40 ms,
c'est-à-dire du saccadement régulier. Le pas propre le plus rapide est
3 cs, soit 33,3 fps. C'est au-dessus de la barre, et c'est régulier.
Le MP4 n'a pas cette limite (60 fps exacts, et il pèse moins), mais un
MP4 rangé dans le dépôt ne se lit pas dans un README GitHub : seules les
vidéos téléversées sur leur CDN s'animent, ce qu'un script ne reproduit
pas. D'où : GIF pour l'inline, MP4 pour la fluidité réelle.

LE PIÈGE DE L'ASSEMBLAGE — c'est ici que tout se joue
-----------------------------------------------------
Le screencast CDP est piloté par le CHANGEMENT, pas par l'horloge : il
n'émet AUCUNE image tant que la page ne bouge pas. Mesuré sur une
transition réelle : 13 ms d'intervalle médian (≈ 75 fps) pendant le
mouvement, et rien du tout pendant les pauses.

Assembler ces images à cadence fixe (`-framerate 60`) écrase donc les
pauses et joue le mouvement à la mauvaise vitesse — l'erreur a été faite
une fois, elle se voit immédiatement. On garde donc l'HORODATAGE de
chaque image et on l'assemble avec le démultiplexeur `concat`, une durée
par image, avant de rééchantillonner à cadence constante. Les pauses
reprennent leur longueur, et les 280 ms de la pastille de navigation
sont bien couvertes par ~20 images au lieu de deux.
"""
import base64
import json
import pathlib
import shutil
import subprocess  # nosec B404 - ffmpeg, arguments littéraux, jamais de shell
import sys
import time

from playwright.sync_api import Error, sync_playwright


def log(msg):
    print('   ·', msg)


# ── Appel à ffmpeg ──────────────────────────────────────────────────
# `shell=False` (le défaut), une LISTE d'arguments, et aucune valeur
# venue de l'extérieur : les seuls éléments variables sont des noms de
# fichiers que ce script vient d'écrire lui-même. C'est la forme sûre de
# subprocess ; l'annotation dit à l'analyseur que la question a été
# posée, pas qu'on la fait taire.
def ffmpeg(args, cwd):
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *args],
                   cwd=cwd, check=True, shell=False)  # nosec B603

ROOT = pathlib.Path(__file__).resolve().parent
SHOTS = ROOT / 'screenshots'
TMP = ROOT / '.demo-frames'
URL = 'http://localhost:8124/index.html'

LARGEUR = 360           # largeur de sortie ; le rendu est capturé en ×2
GIF_FPS = '100/3'       # 3 centisecondes — le pas propre le plus rapide du GIF
MP4_FPS = '60'
FAILS = []

# Le SEED déterministe est celui des captures fixes : même entrée, même
# sortie, et la même vérification d'honnêteté des badges.
# Il vivait dans capture_screenshots.py et était récupéré en exécutant la
# moitié de ce fichier (exec + compile sur un découpage par commentaire).
# Ça marchait, c'était fragile et illisible — et Codacy avait raison de
# le signaler. Un module partagé dit ce qu'il fait.
from capture_seed import init_script, SEASON

# ── Curseur de démonstration ────────────────────────────────────────
# Le vrai pointeur n'est pas capturé par un screencast. On en dessine un,
# qui se déplace en 420 ms (assez lent pour être suivi de l'œil) et pulse
# au moment du clic — le lecteur doit voir CE QUI est cliqué.
CURSEUR_CSS = """
#demoCursor{position:fixed;left:0;top:0;width:26px;height:26px;margin:-13px 0 0 -13px;
  border-radius:50%;border:2px solid rgba(255,255,255,.95);
  background:rgba(255,255,255,.18);box-shadow:0 0 0 1.5px rgba(0,0,0,.45),0 2px 10px rgba(0,0,0,.5);
  z-index:2147483647;pointer-events:none;opacity:0;
  transition:left .42s cubic-bezier(.4,0,.2,1),top .42s cubic-bezier(.4,0,.2,1),opacity .2s;}
#demoCursor.on{opacity:1;}
#demoCursor.tap{animation:demoTap .32s ease-out;}
@keyframes demoTap{0%{transform:scale(1);}45%{transform:scale(.62);
  background:rgba(255,255,255,.5);}100%{transform:scale(1);}}
"""

JS_HELPERS = """
window.__demo = {
  init(css){ const s=document.createElement('style'); s.textContent=css; document.head.appendChild(s);
    const c=document.createElement('div'); c.id='demoCursor'; document.body.appendChild(c); },
  moveTo(sel, nth){ const c=document.getElementById('demoCursor');
    const els=[...document.querySelectorAll(sel)]; const e=els[nth||0]; if(!e) return null;
    const b=e.getBoundingClientRect();
    c.style.left=(b.left+b.width/2)+'px'; c.style.top=(b.top+b.height/2)+'px';
    c.classList.add('on'); return {x:b.left+b.width/2, y:b.top+b.height/2}; },
  tap(){ const c=document.getElementById('demoCursor');
    c.classList.remove('tap'); void c.offsetWidth; c.classList.add('tap'); },
  hide(){ document.getElementById('demoCursor').classList.remove('on'); },
};
"""


def _echec(msg):
    print('  ÉCHEC', msg)
    FAILS.append(msg)


class Enregistreur:
    """Capture les images AVEC leur horodatage, puis assemble."""

    def __init__(self, page, context):
        self.page, self.frames = page, []
        self.cdp = context.new_cdp_session(page)
        self.cdp.on('Page.screencastFrame', self._on_frame)

    def _on_frame(self, p):
        self.frames.append((time.perf_counter(), p['data']))
        try:
            self.cdp.send('Page.screencastFrameAck', {'sessionId': p['sessionId']})
        except Error as e:
            # La session CDP se ferme entre la dernière image et le stop :
            # l'accusé de réception arrive après coup et n'a plus de
            # destinataire. Sans conséquence — l'image est déjà collectée —
            # mais on le DIT, plutôt que d'avaler l'exception en silence.
            log(f'ack ignoré (session fermée) : {e}')

    def start(self):
        self.t0 = time.perf_counter()
        self.cdp.send('Page.startScreencast',
                      {'format': 'jpeg', 'quality': 88, 'everyNthFrame': 1})

    def fenetre(self, t0, ms):
        """Images capturées dans les `ms` qui suivent t0."""
        return sum(1 for t, _ in self.frames if t0 <= t < t0 + ms / 1000)

    def stop(self):
        self.cdp.send('Page.stopScreencast')
        self.tfin = time.perf_counter()

    # ── L'assemblage : une durée PAR IMAGE, pas une cadence fixe ──
    def ecrire(self, nom):
        if len(self.frames) < 20:
            _echec(f'{nom} : {len(self.frames)} images seulement')
            return None
        dossier = TMP / nom
        shutil.rmtree(dossier, ignore_errors=True)
        dossier.mkdir(parents=True)
        lignes = []
        for i, (t, data) in enumerate(self.frames):
            f = dossier / f'{i:05d}.jpg'
            f.write_bytes(base64.b64decode(data))
            suivant = self.frames[i + 1][0] if i + 1 < len(self.frames) else self.tfin
            duree = max(suivant - t, 1 / 120)
            lignes.append(f"file '{f.name}'\nduration {duree:.5f}")
        # concat exige que la dernière image soit répétée pour tenir sa durée
        lignes.append(f"file '{self.frames[-1] and f'{len(self.frames)-1:05d}.jpg'}'")
        (dossier / 'liste.txt').write_text('\n'.join(lignes) + '\n', encoding='utf-8')

        base = ['-f', 'concat', '-i', 'liste.txt']
        mp4 = SHOTS / f'demo-{nom}.mp4'
        ffmpeg(base + [
            '-vf', f'fps={MP4_FPS},scale={LARGEUR}:-2:flags=lanczos',
            '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '22', '-movflags', '+faststart',
            str(mp4)], dossier)
        gif = SHOTS / f'demo-{nom}.gif'
        ffmpeg(base + [
            '-vf', (f'fps={GIF_FPS},scale={LARGEUR}:-2:flags=lanczos,split[a][b];'
                    '[a]palettegen=max_colors=160:stats_mode=diff[p];'
                    '[b][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle'),
            '-loop', '0', str(gif)], dossier)

        duree = self.tfin - self.t0
        fps_moy = len(self.frames) / duree
        ecarts = sorted(round((self.frames[i + 1][0] - self.frames[i][0]) * 1000)
                        for i in range(len(self.frames) - 1))
        print(f'  {nom:<12} {duree:.1f}s · {len(self.frames)} images · '
              f'{fps_moy:.0f} fps moyen · médiane {ecarts[len(ecarts)//2]} ms · '
              f'gif {gif.stat().st_size/1024:.0f} Ko · mp4 {mp4.stat().st_size/1024:.0f} Ko')
        return {'nom': nom, 'images': len(self.frames), 'duree': duree,
                'ecart_median_ms': ecarts[len(ecarts) // 2],
                'gif_ko': round(gif.stat().st_size / 1024),
                'mp4_ko': round(mp4.stat().st_size / 1024)}


def page_prete(pw, **seed):
    b = pw.chromium.launch(args=['--disable-frame-rate-limit', '--disable-gpu-vsync',
                                 '--force-device-scale-factor=2'])
    c = b.new_context(viewport={'width': LARGEUR, 'height': 760}, device_scale_factor=2)
    c.add_init_script(init_script('fr', 'dark', **seed))
    pg = c.new_page()
    pg.goto(URL)
    pg.wait_for_selector('.card', timeout=20000)
    pg.wait_for_timeout(1400)          # laisser le squelette finir son fondu
    pg.evaluate(JS_HELPERS)
    pg.evaluate('(css) => window.__demo.init(css)', CURSEUR_CSS)
    return b, c, pg


def viser(pg, sel, nth=0, pause=700):
    """Déplace le curseur, laisse le temps de le suivre, puis clique."""
    ok = pg.evaluate('([s, n]) => window.__demo.moveTo(s, n)', [sel, nth])
    if ok is None:
        _echec(f'cible introuvable : {sel}')
        return False
    pg.wait_for_timeout(pause)         # 420 ms de trajet + temps de lecture
    pg.evaluate('() => window.__demo.tap()')
    pg.wait_for_timeout(160)           # la pulsation avant l'effet
    pg.click(f'{sel} >> nth={nth}')
    return time.perf_counter()


RESULTATS = []

with sync_playwright() as pw:
    # ══ 1. AJOUT RAPIDE — un geste, la tuile bascule, le toast monte ══
    print('— ajout rapide —')
    b, c, pg = page_prete(pw)
    r = Enregistreur(pg, c)
    r.start()
    pg.wait_for_timeout(900)                       # pause d'entrée
    cible = '.card:not(.owned) .qbtn'
    if pg.query_selector(cible) is None:
        cible = '.qbtn'
    viser(pg, cible, 0)
    pg.wait_for_timeout(2600)                      # bascule + toast complet
    pg.evaluate('() => window.__demo.hide()')
    pg.wait_for_timeout(700)                       # boucle : retour au calme
    r.stop()
    RESULTATS.append(r.ecrire('quick-add'))
    b.close()

    # ══ 2. NAVIGATION — la pastille glisse (280 ms) ══
    print('— navigation —')
    b, c, pg = page_prete(pw)
    # ÉCHAUFFEMENT, AVANT d'enregistrer — mesuré le 14/08/2026 : la
    # PREMIÈRE transition d'un contexte neuf plafonne à 8 images/280 ms
    # (29 fps), sous le plancher de 30 — JIT et compositeur à froid. Les
    # suivantes font 32-43 fps. Quatre exécutions, même motif, y compris
    # sur la version d'AVANT le lockup 1.61.0 : ce n'est pas le contenu,
    # c'est le froid. On joue donc les transitions une fois À BLANC :
    # l'app enregistrée est chaude, et le GIF montre le régime réel —
    # pas l'artefact du premier tour. Le plancher, lui, ne bouge pas.
    for vue in ('stats', 'account', 'badges', 'collection'):
        pg.evaluate(f"() => document.querySelector('[data-action=\"switchView\"][data-view=\"{vue}\"]').click()")
        pg.wait_for_timeout(450)
    r = Enregistreur(pg, c)
    r.start()
    pg.evaluate("() => document.querySelector('[data-action=\"switchView\"][data-view=\"badges\"]').click()")
    pg.wait_for_timeout(1400)          # on PART de Badges : boucle propre
    # La pastille de navigation glisse en 280 ms — c'est l'animation la
    # PLUS COURTE des quatre, donc le meilleur test de la chaîne de
    # capture. On compte les images tombées dans cette fenêtre : sous
    # 17, on est en dessous de 60 fps et le glissement devient un saut.
    bead = []
    for vue in ('stats', 'account', 'badges'):
        tclic = viser(pg, f'[data-action="switchView"][data-view="{vue}"]', 0, pause=620)
        pg.wait_for_timeout(1150)                  # transition + lecture
        if tclic:
            bead.append(r.fenetre(tclic, 280))
    pg.evaluate('() => window.__demo.hide()')
    pg.wait_for_timeout(600)
    r.stop()
    info = r.ecrire('nav')
    if bead:
        print(f'  pastille : {bead} images sur les 280 ms du glissement '
              f'→ {[round(x/0.28) for x in bead]} fps (plancher exigé : 30)')
        # Le GARDE-FOU protège le PLANCHER exigé — 30 fps, soit 8 images
        # sur 280 ms. Au-dessus, la capture livre entre 50 et 70 fps selon
        # la lourdeur de la vue d'arrivée : Badges (120 pastilles et leurs
        # anneaux) redescend vers 50, Compte monte vers 70. C'est mesuré à
        # chaque exécution et imprimé — un chiffre affiché vaut mieux
        # qu'un seuil qui ment dans un sens ou dans l'autre.
        if min(bead) < 9:
            _echec(f'glissement de la pastille sous 30 fps : {bead} images/280 ms')
        if info: info['bead_images_280ms'] = bead
    b.close()

    # ══ 3. BADGE — la page Badges, sa progression, un détail ══
    print('— badges —')
    b, c, pg = page_prete(pw)
    r = Enregistreur(pg, c)
    r.start()
    pg.wait_for_timeout(700)
    viser(pg, '[data-action="switchView"][data-view="badges"]', 0, pause=600)
    pg.wait_for_timeout(1500)
    viser(pg, '.badge-tile.un', 0, pause=700)
    pg.wait_for_timeout(2000)                      # ouverture du détail
    pg.evaluate('() => window.__demo.hide()')
    pg.wait_for_timeout(700)
    r.stop()
    RESULTATS.append(r.ecrire('badges'))
    b.close()

    # ══ 4. MULTI-SAISONS — 2025 → 2026 → retour ══
    print('— multi-saisons —')
    b, c, pg = page_prete(pw, **{
        'f1uno_owned_2026': json.dumps({'001': {'blue': {'owned': True, 'qty': 1}}}),
    })
    r = Enregistreur(pg, c)
    r.start()
    pg.wait_for_timeout(900)
    pills = pg.evaluate("() => [...document.querySelectorAll('.season-pill')].map(p => p.textContent.trim())")
    if len(pills) < 2:
        _echec(f'moins de deux saisons affichées : {pills}')
    else:
        autre = 0 if pills[0] != str(SEASON) else 1
        viser(pg, '.season-pill', autre, pause=750)
        pg.wait_for_timeout(2400)                  # état vide + lecture
        retour = 1 - autre
        viser(pg, '.season-pill', retour, pause=750)
        pg.wait_for_timeout(2000)
    pg.evaluate('() => window.__demo.hide()')
    pg.wait_for_timeout(700)
    r.stop()
    RESULTATS.append(r.ecrire('seasons'))
    b.close()

shutil.rmtree(TMP, ignore_errors=True)
(SHOTS / 'demos.json').write_text(
    json.dumps([x for x in RESULTATS if x], ensure_ascii=False, indent=1) + '\n', encoding='utf-8')

print()
if FAILS:
    print('ÉCHECS :', *FAILS, sep='\n  ')
    sys.exit(1)
total = sum(x['gif_ko'] + x['mp4_ko'] for x in RESULTATS if x)
print(f'4 démos OK — {total/1024:.1f} Mo au total')
