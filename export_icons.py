"""Exports d'icons/icon.svg — les PNG PWA et le favicon, reproductibles.

    python3 -m http.server 8124        # dans le dossier du dépôt
    python3 export_icons.py

Produit : icons/icon-512.png, icons/icon-192.png, favicon.ico (16+32+48).

POURQUOI UN SCRIPT. Les exports étaient faits à la main : trois fichiers
qui pouvaient diverger de leur source. Ici tout part d'icon.svg — sauf
le 16 px du favicon, DESSINÉ À PART et c'est le point important : à
16 px le lockup empilé fond en bouillie (mesuré sur banc, pixels réels).
Le favicon porte « F1 » seul, Space Grotesk 700, réglé sur la grille.
« É » a été écarté : l'accent mange 3 px et rapetisse la lettre.

Le rendu passe par Chromium (Playwright) parce que le texte SVG dépend
de la police : la rasteriser ailleurs donnerait un autre dessin.
"""
import pathlib
import struct
import sys

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent
URL = 'http://localhost:8124'

# Le gabarit charge la MÊME police variable que l'app (fonts/), puis
# dessine soit l'icon.svg (192/512/32/48), soit le « F1 » du 16 px.
PAGE = """<!doctype html><meta charset="utf-8">
<style>@font-face{font-family:'Space Grotesk';src:url('%s/app/fonts/space-grotesk-var.woff2') format('woff2');font-weight:300 700;}</style>
<canvas id="c"></canvas>
<script>
async function rendre(taille){
  await document.fonts.load("700 100px 'Space Grotesk'");
  await document.fonts.load("500 100px 'Space Grotesk'");
  const c = document.getElementById('c'); c.width = taille; c.height = taille;
  const x = c.getContext('2d');
  if(taille <= 16){
    // « F1 » seul, réglé pour la grille : tuile pleine (le dégradé
    // boue à cette taille), glyphes centrés au demi-pixel près.
    x.fillStyle = '#E8002D';
    x.beginPath(); x.roundRect(0, 0, 16, 16, 3.5); x.fill();
    x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = "700 11px 'Space Grotesk'";
    x.fillText('F1', 8, 9);
  } else {
    const img = new Image();
    await new Promise(res => { img.onload = res; img.src = '%s/app/icons/icon.svg'; });
    x.drawImage(img, 0, 0, taille, taille);
  }
  return c.toDataURL('image/png');
}
</script>"""


def ico(pngs):
    """Assemble un .ico à entrées PNG (accepté par tous les navigateurs
    modernes — et le dépôt ne vise que ceux où l'app tourne)."""
    out = struct.pack('<HHH', 0, 1, len(pngs))
    offset = 6 + 16 * len(pngs)
    corps = b''
    for taille, data in pngs:
        out += struct.pack('<BBBBHHII', taille % 256, taille % 256, 0, 0, 1, 32, len(data), offset)
        corps += data
        offset += len(data)
    return out + corps


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page()
    try:
        pg.goto(URL + '/app/index.html', timeout=8000)
    except Exception:
        print(f'ÉCHEC : {URL} injoignable — lance `python3 -m http.server 8124`')
        sys.exit(1)
    pg.set_content(PAGE % (URL, URL))
    import base64
    sorties = {}
    for taille in (512, 192, 48, 32, 16):
        url = pg.evaluate(f'rendre({taille})')
        sorties[taille] = base64.b64decode(url.split(',', 1)[1])
    b.close()

(ROOT / 'app' / 'icons' / 'icon-512.png').write_bytes(sorties[512])
(ROOT / 'app' / 'icons' / 'icon-192.png').write_bytes(sorties[192])
# Le favicon vit DANS l'app (précaché) ; la vitrine à la racine pointe
# app/favicon.ico — un seul fichier, pas deux copies à désynchroniser.
(ROOT / 'app' / 'favicon.ico').write_bytes(ico([(16, sorties[16]), (32, sorties[32]), (48, sorties[48])]))
print('exports OK — icon-512.png, icon-192.png, favicon.ico (16+32+48)')
