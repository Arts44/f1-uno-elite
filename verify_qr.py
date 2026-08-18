#!/usr/bin/env python3
"""══════════════════════════════════════════════════════════
LE FILET DU QR — encoder, RASTERISER, puis DÉCODER AVEC UN LECTEUR
TIERS, et exiger la charge identique.

POURQUOI UN DÉCODEUR INDÉPENDANT, ET POURQUOI CE N'EST PAS NÉGOCIABLE.
Ce script décode avec OpenCV (cv2.QRCodeDetector), qui n'a AUCUN lien
avec `qrcodegen.js` — l'encodeur du dépôt. C'est l'argument entier du
test : décoder avec l'encodeur ne prouverait que sa cohérence avec
lui-même, jamais qu'un lecteur du monde réel y arrive. Le jour où
quelqu'un « simplifiera » en réutilisant qrcodegen pour lire, ce
fichier ne prouvera plus rien — il ne restera qu'un aller-retour dans
la même bibliothèque, exactement le trou que POINTS-SIGNALES signalait
(« makeBackupQrSvg testé, mais aucun décodeur indépendant »).

CE QU'IL ATTRAPE, et qui a coûté un bug en production (1.71.0) : un QR
correct mais TROP DENSE pour sa taille de rendu. Le QR de la fiche
d'échange faisait 3,38 px/module ; recadré il se décodait, mais aucun
lecteur ne le trouvait dans l'image — sur iPad, l'app s'ouvrait puis
refusait le code. Le plancher QR_MIN_PX_PER_MODULE = 6 vient de là, et
ce script vérifie qu'il est TENU aux tailles réellement rendues.

LES DEUX QR sont couverts : la fiche d'échange ET la sauvegarde. Le
second est le plus grave — un QR de sauvegarde illisible, c'est une
collection perdue.

OpenCV est un outil de VÉRIFICATION, hors dépôt (pip3 install --user
opencv-python-headless), comme Playwright et cairosvg. La règle zéro
dépendance porte sur ce que l'app EMBARQUE. S'il manque, ce script le
DIT et sort en échec — il ne passe jamais au vert en silence.
══════════════════════════════════════════════════════════"""
import sys, os, json

MANQUE_CV2 = """
╔══════════════════════════════════════════════════════════╗
║  VÉRIFICATION QR NON FAITE — OpenCV absent               ║
╚══════════════════════════════════════════════════════════╝
Ce filet exige un décodeur INDÉPENDANT de qrcodegen. Sans lui, il n'y
a pas de demi-vérification possible : un aller-retour dans l'encodeur
du dépôt ne prouverait rien.

  pip3 install --user opencv-python-headless numpy

(Outil de vérification hors dépôt, comme Playwright — voir
docs/CONVENTIONS.md, « outils de vérification ».)
"""
try:
    import cv2
except ImportError:
    print(MANQUE_CV2)
    sys.exit(1)

from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from capture_seed import init_script, SEASON

URL = 'http://localhost:8123/app/index-dev.html'
TMP = os.environ.get('QR_TMP', '/tmp/f1uno-qr')
os.makedirs(TMP, exist_ok=True)
ECHECS = []

def decode(path):
    """Décodage par lecteur TIERS. Renvoie le texte, ou None."""
    img = cv2.imread(path)
    if img is None: return None
    d = cv2.QRCodeDetector()
    txt, _, _ = d.detectAndDecode(img)
    if txt: return txt
    ok, infos, _, _ = d.detectAndDecodeMulti(img)
    return next((i for i in (infos or []) if i), None) if ok else None

def verifier(nom, path, attendu, contexte):
    got = decode(path)
    if got is None:
        ECHECS.append(f'{nom} : AUCUN QR DÉCODÉ dans {contexte} — '
                      f'illisible pour un lecteur réel (c\'est le bug de 1.71.0)')
        return
    if got != attendu:
        i = next((k for k,(a,b) in enumerate(zip(attendu,got)) if a != b), min(len(attendu),len(got)))
        ECHECS.append(f'{nom} : charge CORROMPUE dans {contexte}\n'
                      f'    1re divergence index {i}\n'
                      f'    attendu : …{attendu[max(0,i-20):i+20]}…\n'
                      f'    obtenu  : …{got[max(0,i-20):i+20]}…')
        return
    print(f'  ✓ {nom} — charge identique, décodée dans {contexte}')

with sync_playwright() as p:
    nav = p.chromium.launch()
    ctx = nav.new_context(viewport={'width': 390, 'height': 844})
    ctx.add_init_script(init_script('fr', 'dark'))
    pg = ctx.new_page()
    pg.goto(URL); pg.wait_for_timeout(900)
    try: pg.click('#updateBanner .ub-close', timeout=700)
    except Exception: pass

    print('── densités rendues (plancher = 6 px/module) ──')
    dens = pg.evaluate("""async () => {
      const bk = await import('./backup.js');
      const col = await import('./collector.js');
      const out = { plancher: bk.QR_MIN_PX_PER_MODULE, cas: [] };

      /* LE QR DE SAUVEGARDE, balayé sur ses VERSIONS RÉELLES. Le seed
         produit un code trop gros (tooBig, aucun QR proposé) : tester la
         seule collection de démonstration ne prouverait rien. On balaie
         donc les longueurs de charge qui donnent chaque version
         affichable — c'est exactement la zone où le QR de sauvegarde
         était illisible (mesuré : 4,49 à 1,76 px/module à 220 px). */
      /* CHARGE RÉALISTE, ET C'EST UN PIÈGE PAYÉ : une charge dégénérée
         ('A' répété 700 fois) produit de grandes zones uniformes qui
         empêchent OpenCV de TROUVER le code — le banc criait au défaut
         alors que le même QR avec un base64 varié se décodait très bien.
         Un banc doit rendre des données réalistes, sinon il mesure son
         propre artefact. On fabrique donc du base64url plausible. */
      const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
      const charge = n => { let s = ''; for(let i = 0; i < n; i++) s += B64[(i*37 + i*i*11) % 64]; return s; };
      for(const n of [80, 200, 400, 700, 1200]){
        const link = 'https://arts44.dev/app/#backup=F1U1.' + charge(n);
        const q = bk.makeBackupQrSvg(link);
        if(q.tooBig) continue;
        out.cas.push({ nom: `sauvegarde v${q.version}`, lien: link, svg: q.svg,
                       modules: q.modules, version: q.version, minPx: q.minPx,
                       densite: q.minPx / (q.modules + 8) });
      }

      /* LA FICHE D'ÉCHANGE, sur la collection réelle. */
      const { want, offer } = col.tradeList();
      const tcode = await bk.encodeTradeCode({ v:1, season:2025,
        want: want.map(x=>x.id), offer: offer.map(x=>[x.id, x.types.map(t=>[t.type,t.qty])]) });
      const tlink = bk.buildTradeLink(tcode);
      const tr = bk.makeBackupQrSvg(tlink);
      out.trade = { nom: `échange v${tr.version}`, lien: tlink, svg: tr.svg,
                    modules: tr.modules, version: tr.version, minPx: tr.minPx,
                    densite: tr.minPx / (tr.modules + 8) };
      out.cas.push(out.trade);
      return out;
    }""")
    if not dens['cas']:
        ECHECS.append('aucun QR à vérifier — makeBackupQrSvg les a tous refusés')
    for d in dens['cas']:
        etat = 'OK' if d['densite'] >= dens['plancher'] else 'SOUS LE PLANCHER'
        print(f"  {d['nom']:16s}: {d['modules']:3d} modules · rendu {d['minPx']:4d} px · "
              f"{d['densite']:.2f} px/module — {etat}")
        if d['densite'] < dens['plancher']:
            ECHECS.append(f"{d['nom']} : {d['densite']:.2f} px/module sous le plancher de {dens['plancher']}")

    print('\n── décodage par lecteur tiers (OpenCV) ──')
    # 1. Chaque QR, rendu à sa taille minimale.
    #    Le viewport suit la taille du QR : une capture d'élément plus
    #    large que la fenêtre revient tronquée, et ce serait un défaut du
    #    HARNAIS pris pour un défaut du produit (vécu : v19 à 606 px dans
    #    une fenêtre de 390 px « échouait » alors que le QR était bon).
    for d in dens['cas']:
        pg.set_viewport_size({'width': max(420, d['minPx'] + 60),
                              'height': max(420, d['minPx'] + 60)})
        pg.set_content(f'<body style="margin:0;background:#fff">'
                       f'<div id="q" style="width:{d["minPx"]}px;height:{d["minPx"]}px">{d["svg"]}</div></body>')
        pg.wait_for_timeout(250)
        f = f'{TMP}/qr-{d["nom"].replace(" ","-")}.png'
        pg.locator('#q').screenshot(path=f)
        verifier(d['nom'], f, d['lien'], f'un rendu de {d["minPx"]} px')

    # 2. La FICHE PNG entière — le vrai artefact partagé, et le chemin
    #    qui a échoué : c'est ici que le QR doit être TROUVÉ, pas
    #    seulement lisible une fois recadré.
    ctx2 = nav.new_context(viewport={'width': 375, 'height': 812})
    ctx2.add_init_script(init_script('fr', 'dark'))
    pg2 = ctx2.new_page()
    pg2.goto(URL); pg2.wait_for_timeout(900)
    try: pg2.click('#updateBanner .ub-close', timeout=700)
    except Exception: pass
    pg2.click('.bn-tab[data-view="stats"]')
    pg2.wait_for_selector('#svTradeSheet', timeout=6000)
    try:
        with pg2.expect_download(timeout=10000) as dl:
            pg2.click('#svTradeSheet')
        fiche = f'{TMP}/fiche.png'
        dl.value.save_as(fiche)
        verifier('FICHE PNG', fiche, dens['trade']['lien'], "l'image ENTIÈRE (sans recadrage)")
    except Exception as e:
        ECHECS.append(f'fiche non produite : {str(e)[:100]}')
    nav.close()

print()
if ECHECS:
    print(f'{len(ECHECS)} ÉCHEC(S) :')
    for e in ECHECS: print('  ·', e)
    sys.exit(1)
print('QR OK — les deux codes sont lisibles par un décodeur indépendant, charge intacte')
