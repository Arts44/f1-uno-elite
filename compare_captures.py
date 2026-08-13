"""Vérifie que les captures commitées correspondent encore à l'app.

    python3 -m http.server 8124        # dans Collections/F1/
    python3 compare_captures.py

Régénère les captures dans un dossier temporaire et les compare aux
fichiers du dépôt. Sortie 0 si rien de VISIBLE n'a changé, 1 sinon, avec
le détail chiffré de chaque écart.

══════════════════════════════════════════════════════════
POURQUOI CE FICHIER EXISTE — et pourquoi il ne compare pas les octets

Le gel visuel a longtemps promis des captures « identiques à l'octet
d'une exécution à l'autre ». Cette promesse a été mesurée trois fois :

  · 42 fichiers sur 52 différaient  → gel des animations (1.59.3)
  · 4 fichiers différaient          → cadre mesuré avant le gel, boucle
                                       du tutoriel sortant sur une durée
  · 1 à 3 fichiers différaient      → lecture réseau asynchrone sur la
                                       page Compte (131 niveaux d'écart)

Chaque correction a supprimé une cause RÉELLE, et chaque « zéro » annoncé
ensuite s'est révélé être un échantillon de taille un. Ce qui subsiste
après les trois est d'une autre nature : un bruit d'anti-crénelage de
quelques dizaines de pixels, à 3 à 10 niveaux sur 255, sur un halo ou un
contour SVG. Invisible à l'œil, hors de portée du code applicatif, et
présent même avec les drapeaux de rendu déterministe de Chromium.

On ne peut donc pas promettre l'octet. On peut promettre — et VÉRIFIER —
qu'aucune différence visible ne subsiste. C'est ce que fait ce script :
il remplace une affirmation invérifiable par un seuil chiffré.

LES DEUX SEUILS, et pourquoi ils sont deux. Un seul seuil sur l'amplitude
laisserait passer une image entière décalée d'un niveau ; un seul seuil
sur le nombre de pixels laisserait passer trois pixels devenus noirs au
milieu d'un visage. On exige donc les deux : peu de pixels touchés, ET
faiblement.
══════════════════════════════════════════════════════════
"""
import pathlib
import shutil
import subprocess  # nosec B404 — appelle python3 sur un script du dépôt, sans shell
import sys
import tempfile

try:
    from PIL import Image, ImageChops
except ImportError:                                   # pragma: no cover
    print('Pillow est requis :  python3 -m pip install pillow')
    sys.exit(2)

ROOT = pathlib.Path(__file__).resolve().parent
SHOTS = ROOT / 'screenshots'

# Un pixel « touché » diffère d'au moins 1 niveau. Le bruit mesuré sur
# quatre exécutions consécutives plafonne à 10 niveaux et 625 pixels sur
# une image de 1,2 million (0,05 %). Les seuils gardent une marge de 60 %
# sur l'amplitude et d'un facteur 8 sur le nombre — et refusent tout ce
# qui se voit. Vérifié sur quatre cas fabriqués, à la taille réelle des
# captures :
#
#   bruit réel (625 px, 10 niveaux) ............ toléré
#   un texte qui change (156 px, 178 niveaux) .. REFUSÉ
#   trois pixels noirs (3 px, 24 niveaux) ...... REFUSÉ
#   image entière décalée d'un niveau .......... REFUSÉ
#
# Le troisième cas est celui qui a fixé l'amplitude à 16 : à 24, trois
# pixels devenus noirs passaient.
MAX_NIVEAU = 16          # amplitude maximale tolérée, sur 255
MAX_PROPORTION = 0.004   # 0,4 % des pixels d'une image


def compare(a_path, b_path):
    """(pixels touchés, proportion, amplitude max) ou None si tailles différentes."""
    a = Image.open(a_path).convert('RGB')
    b = Image.open(b_path).convert('RGB')
    if a.size != b.size:
        return None
    diff = ImageChops.difference(a, b)
    touches = sum(1 for p in diff.getdata() if p != (0, 0, 0))
    ampli = max(c[1] for c in diff.getextrema())
    return touches, touches / (a.size[0] * a.size[1]), ampli


def main():
    tmp = pathlib.Path(tempfile.mkdtemp(prefix='captures-'))
    sauve = tmp / 'commitees'
    shutil.copytree(SHOTS, sauve)
    print(f'captures commitées mises de côté dans {sauve}')
    print('régénération…')
    # shell=False, arguments en liste : rien n'est interprété par un shell.
    r = subprocess.run([sys.executable, str(ROOT / 'capture_screenshots.py')],  # nosec B603
                       cwd=str(ROOT), capture_output=True, text=True, check=False)
    if r.returncode != 0:
        print(r.stdout[-2000:])
        print('la régénération a ÉCHOUÉ — rien n\'est comparable, voir ci-dessus')
        return 1

    ecarts, absents, tailles = [], [], []
    for ref in sorted(sauve.rglob('*.jpg')) + sorted(sauve.rglob('*.png')):
        rel = ref.relative_to(sauve)
        neuf = SHOTS / rel
        if not neuf.exists():
            absents.append(str(rel))
            continue
        res = compare(ref, neuf)
        if res is None:
            tailles.append(str(rel))
            continue
        touches, prop, ampli = res
        if touches and (ampli > MAX_NIVEAU or prop > MAX_PROPORTION):
            ecarts.append((str(rel), touches, prop, ampli))
        elif touches:
            print(f'  bruit toléré  {rel}: {touches} px, {prop*100:.4f} %, ampli {ampli}')

    print()
    for rel in absents:
        print(f'ABSENT de la régénération : {rel}')
    for rel in tailles:
        print(f'TAILLE DIFFÉRENTE : {rel}')
    for rel, n, prop, ampli in ecarts:
        print(f'ÉCART VISIBLE  {rel}: {n} px ({prop*100:.3f} %), amplitude {ampli}/255')

    if ecarts or absents or tailles:
        print(f'\n❌ {len(ecarts) + len(absents) + len(tailles)} capture(s) ont changé '
              f'VISIBLEMENT. Regarde-les avant de committer.')
        return 1
    print('✅ aucune différence visible — seuils : amplitude ≤ '
          f'{MAX_NIVEAU}/255 et ≤ {MAX_PROPORTION*100:g} % des pixels.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
