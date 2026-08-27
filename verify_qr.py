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
import sys, os, tempfile

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
from capture_seed import init_script

URL = 'http://localhost:8123/app/index-dev.html'

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

# Répertoire de travail : un dossier PROPRE au processus (tempfile), pas
# un chemin fixe sous /tmp — un chemin partagé et prévisible se collisionne
# entre deux exécutions et se détourne par lien symbolique.
TMP = os.environ.get('QR_TMP') or tempfile.mkdtemp(prefix='f1uno-qr-')
os.makedirs(TMP, exist_ok=True)
CONTROLE = '--controle' in sys.argv

# ══ LE PLANCHER EST DÉCLARÉ ICI, PAS LU DANS LE PRODUIT (㉒) ═══════
# SEUIL DÉCLARÉ : 6 pixels rendus par module de QR. C'est la valeur que
# le produit s'impose (QR_MIN_PX_PER_MODULE dans app/backup.js), et elle
# est RECOPIÉE ICI DÉLIBÉRÉMENT — c'est le seul cas du dépôt où une
# copie vaut mieux que la lecture (contre-exemple de ㉘).
#
# POURQUOI. L'assertion précédente lisait le plancher DANS le produit et
# le comparait à une largeur elle aussi calculée par le produit :
#     densite = minPx / (modules + 8)   avec   minPx = (modules+8) x 6
# Les deux membres se simplifiaient. L'expression valait « 6 >= 6 »,
# vraie par algèbre, sur les six versions balayées — la sortie affichait
# 6.00 six fois, de 41 à 117 modules. Une assertion dont les deux membres
# viennent de la même source ne mesure rien (n°44).
# Écrit ici, le plancher devient un TÉMOIN EXTÉRIEUR : si le produit
# change sa constante, ce filet rougit et la décision se reprend
# explicitement. C'est ce qu'on veut d'un seuil.
# A REPRENDRE si QR_MIN_PX_PER_MODULE change : le n°32 ligne ⑨ dit que
# ce 6 est une décision jamais mesurée, et qu'une lecture par appareil
# photo pourrait le déplacer.
PLANCHER_PX_PAR_MODULE = 6

# ══ CE QUE CE FILET NE VOYAIT PAS, ET QUI A VÉCU UN MOIS ══════════
# Il rendait le QR LUI-MÊME, dans son propre <div style="width:minPx">,
# puis vérifiait qu'il se décodait. Il n'a JAMAIS lu la largeur que
# l'app applique. Or le défaut de 1.71.0 était exactement là : une
# largeur d'affichage trop petite. Il est revenu (n°45) — deux
# proprietes CSS annulaient la ligne d'account.js — et ce filet est
# reste vert pendant tout ce temps.
# L'assertion `largeur_appliquee()` plus bas regarde donc la LARGEUR
# RENDUE DU SVG dans l'app, pas la taille recommandee par le module.
CONTROLES = ['largeur appliquee']
JOUES = []

ECHECS = []

def _fermer_bandeau(page):
    """Ferme le bandeau de mise à jour s'il est là. Renvoie True si un
    clic a eu lieu — la présence se TESTE, elle ne s'attrape pas."""
    bouton = page.query_selector('#updateBanner .ub-close')
    if bouton and bouton.is_visible():
        bouton.click()
        return True
    return False


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

try:
    with sync_playwright() as p:
        nav = p.chromium.launch()
        ctx = nav.new_context(viewport={'width': 390, 'height': 844})
        ctx.add_init_script(init_script('fr', 'dark'))
        pg = ctx.new_page()
        # ATTENDRE UN SIGNAL, PAS UNE DURÉE. Les 900 ms fixes d'ici
        # suffisaient sur un poste au cache chaud et PAS sur un clone
        # neuf : le graphe de modules n'était pas prêt, l'import dynamique
        # de backup.js échouait, et la livraison rendait ROUGE pour une
        # raison qui n'accusait pas le produit — le miroir exact des faux
        # verts qu'on traque. On attend que la grille soit rendue. 
        pg.goto(URL)
        pg.wait_for_selector('.card', timeout=BORNE_SECURITE_MS)
        pg.wait_for_timeout(200)
        # Le bandeau de mise à jour n'est pas toujours là. On TESTE sa
        # présence au lieu d'attraper l'échec du clic : une exception n'est
        # pas un test de présence, et l'avaler masquerait une vraie panne.
        _fermer_bandeau(pg)

        print(f'── taille recommandee (plancher declare = {PLANCHER_PX_PAR_MODULE} px/module) ──')
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
        # LA TAILLE RECOMMANDÉE, CONTRE UN PLANCHER QUI N'EST PAS LE SIEN.
        # L'ancienne version comparait `minPx/(modules+8)` au plancher DU
        # PRODUIT : les deux membres se simplifiaient et l'assertion valait
        # « 6 >= 6 ». Elle est retirée. Ici le plancher vient du filet, donc
        # un plafond, un arrondi ou un changement de constante dans
        # qrRenderSize() fait rougir.
        for d in dens['cas']:
            exige = (d['modules'] + 8) * PLANCHER_PX_PAR_MODULE
            etat = 'OK' if d['minPx'] >= exige else 'SOUS LE PLANCHER'
            print(f"  {d['nom']:16s}: {d['modules']:3d} modules · recommande {d['minPx']:4d} px · "
                  f"exige {exige:4d} px — {etat}")
            if d['minPx'] < exige:
                ECHECS.append(f"{d['nom']} : taille recommandee {d['minPx']} px, "
                              f"il en faut {exige} pour {PLANCHER_PX_PAR_MODULE} px/module")

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
        _fermer_bandeau(pg2)
        pg2.click('.bn-tab[data-view="stats"]')
        pg2.wait_for_selector('#svTradeSheet', timeout=BORNE_SECURITE_MS)
        try:
            # Borne de securite, PAS seuil de mesure. Oubliee au premier lot.
            # La valeur d'origine etait 10 s, sans calibration consignee.
            with pg2.expect_download(timeout=BORNE_SECURITE_MS) as dl:
                pg2.click('#svTradeSheet')
            fiche = f'{TMP}/fiche.png'
            dl.value.save_as(fiche)
            verifier('FICHE PNG', fiche, dens['trade']['lien'], "l'image ENTIÈRE (sans recadrage)")
        except Exception as e:
            ECHECS.append(f'fiche non produite : {str(e)[:100]}')

        # ══ 3. LA LARGEUR RÉELLEMENT APPLIQUÉE PAR L'APP ═══════════════
        # C'est l'assertion qui manquait, et c'est là que le défaut de
        # 1.71.0 est revenu (n°45). On ne rend plus le QR nous-mêmes : on
        # ouvre le panneau Compte, on demande à l'app d'afficher le sien, et
        # on mesure LE SVG À L'ÉCRAN.
        #
        # LA FENÊTRE EST 390 px, DÉLIBÉRÉMENT : c'est la largeur mobile
        # principale de l'app, et c'est la seule condition où une contrainte
        # de largeur peut écraser le QR. Mesurer sur un écran large ne
        # prouverait rien — le défaut y est invisible.
        #
        # LA CHARGE EST MAÎTRISÉE, PAS CELLE DU SEED : le seed produit un
        # code `tooBig`, donc aucun QR, donc rien à mesurer. On pose une
        # charge de 1200 caractères, qui donne la version la plus dense
        # affichable — le pire cas, celui où la largeur exigée dépasse le
        # plus la fenêtre.
        print('\n── largeur RÉELLEMENT appliquée par l app (fenêtre 390) ──')
        ctx3 = nav.new_context(viewport={'width': 390, 'height': 900})
        ctx3.add_init_script(init_script('fr', 'dark'))
        pg3 = ctx3.new_page()
        pg3.goto(URL)
        pg3.wait_for_selector('.card', timeout=BORNE_SECURITE_MS)
        _fermer_bandeau(pg3)
        pg3.click('.bn-tab[data-view="account"]')
        pg3.wait_for_selector('#backupCodeBtn', timeout=BORNE_SECURITE_MS)
        if CONTROLE:
            # CONTRÔLE NÉGATIF — ON REMET LA CAUSE ①, `max-width:100%`.
            # POURQUOI CELLE-LÀ ET PAS L'AUTRE. Les deux causes du n°45 sont
            # indépendantes et ont des signatures différentes :
            #   ① max-width:100% → 2,14 px/module a 390 px (le QR est écrasé)
            #   ② box-sizing:border-box → 5,75 partout (−20 px de padding)
            # ① est retenue pour trois raisons : elle REPRODUIT le défaut
            # réel de 1.71.0 ; elle échoue d'un facteur ~3, pas de 4 % — un
            # contrôle qui ne rougit que d'un cheveu cesse de rougir au
            # premier réglage voisin, sans que personne ne le remarque ; et
            # elle ne se déclenche QUE si la mesure est prise sur une fenêtre
            # étroite, donc elle éprouve aussi le choix de la fenêtre.
            # CE QU'ELLE N'EXERCE PAS : la cause ②. Une régression du
            # box-sizing seul ferait rougir l assertion (5,75 < 6) mais
            # aucun contrôle ne le vérifie ici.
            pg3.add_style_tag(content='.bk-qr{max-width:100%!important}')
            # LE COMPTEUR COMPTE L'EFFET, PAS L'APPEL. `add_style_tag`
            # peut réussir sans que la règle s'applique — sélecteur qui
            # ne matche plus, spécificité perdue. Vécu sur
            # verify_tutorial.py : un script injecté mort à sa première
            # ligne, compté « joué », et un filet vert qui semblait
            # avoir été éprouvé.
            _mw = pg3.evaluate("() => { const b = document.querySelector('#backupQr');"
                               " return b ? getComputedStyle(b).maxWidth : null; }")
            if _mw != '100%':
                ECHECS.append(f'SABOTAGE INEFFECTIF : max-width calcule = {_mw!r},'
                              ' attendu 100% — le controle n a rien casse')
            else:
                JOUES.append('largeur appliquee')
                print('  controle : max-width:100% pose sur .bk-qr, effet constate')
        applique = pg3.evaluate("""async (n) => {
          const bk = await import('./backup.js');
          const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
          const charge = k => { let s = ''; for (let i = 0; i < k; i++) s += B64[(i*37 + i*i*11) % 64]; return s; };
          const code = 'F1U1.' + charge(n);
          document.querySelector('#backupCodeArea').style.display = 'flex';
          document.querySelector('#backupCodeOut').value = code;
          document.querySelector('#backupQrWrap').style.display = 'none';
          document.querySelector('#backupQrBtn').click();
          const box = document.querySelector('#backupQr');
          const svg = box && box.querySelector('svg');
          const q = bk.makeBackupQrSvg(bk.buildBackupLink(code));
          const wrap = document.querySelector('#backupQrWrap');
          return { modules: q.modules, version: q.version, reco: q.minPx,
                   svg: svg ? Math.round(svg.getBoundingClientRect().width) : 0,
                   defile: wrap.scrollWidth > wrap.clientWidth + 1 };
        }""", 1200)
        ctx3.close()
        exige = (applique['modules'] + 8) * PLANCHER_PX_PAR_MODULE
        pas = applique['svg'] / (applique['modules'] + 8) if applique['svg'] else 0
        print(f"  v{applique['version']:<2d} {applique['modules']:3d} modules · recommande "
              f"{applique['reco']:4d} px · SVG RENDU {applique['svg']:4d} px · "
              f"{pas:.2f} px/module · conteneur defile : {'oui' if applique['defile'] else 'non'}")
        if applique['svg'] < exige:
            ECHECS.append(f"largeur APPLIQUEE {applique['svg']} px pour un QR qui en exige "
                          f"{exige} ({pas:.2f} px/module, plancher {PLANCHER_PX_PAR_MODULE}) — "
                          f"c est le defaut de 1.71.0 (n°45), pas la taille recommandee")
        nav.close()

finally:
    # ⚠️ LE `finally` N'EST PAS DÉCORATIF — SON ABSENCE A ÉTÉ VUE.
    # Première version : le bilan était écrit au niveau du module, APRÈS
    # le bloc playwright. Le contrôle ㉜-b — faire traverser une exception
    # — l'a montré PERDU : le script mourait avant de l'atteindre, et le
    # mode --controle rendait un code 1 sans dire combien de contrôles il
    # avait joués. Exactement le défaut que ce bilan existe pour rendre
    # visible, dans le mécanisme censé le rendre visible.
    #
    # ⚠️ ET LE VERDICT N'EST PAS ICI, DÉLIBÉRÉMENT. Un `sys.exit()` dans
    # un `finally` REMPLACE l'exception en cours : le code de sortie
    # serait juste, et la trace disparaîtrait. On ne met dans le `finally`
    # que ce qui doit être DIT quoi qu'il arrive ; le verdict, lui, reste
    # sur le chemin normal, pour qu'une panne remonte sa trace intacte.
    if CONTROLE:
        _manquants = [c for c in CONTROLES if c not in JOUES]
        print('\nCONTROLES NEGATIFS JOUES : %d/%d' % (len(JOUES), len(CONTROLES)))
        for c in CONTROLES:
            print('   %s %s' % ('joue  ' if c in JOUES else 'ABSENT', c))
        if _manquants:
            print('\n' + '!' * 62)
            print('CONTROLE(S) NON JOUE(S) : ' + ', '.join(_manquants))
            print('Le mode --controle n a pas exerce ce qu il pretend exercer.')
            print('!' * 62)
            ECHECS.append('CONTROLES NON JOUES (%d/%d) : %s — un controle qui ne s execute'
                          ' pas est un controle qui ment'
                          % (len(JOUES), len(CONTROLES), ', '.join(_manquants)))

# ══ CE QUE CE FILET N'EXERCE PAS (㉔) ══════════════════════════════
# Le contrôle négatif prouve que ce filet voit LE défaut qu'on lui
# montre — un QR écrasé par une contrainte de largeur — et RIEN D'AUTRE.
# Il ne dit pas qu'il verrait : un encodeur qui produit un code faux, une
# charge corrompue d'un octet, la fiche PNG qui cesse d'être produite, ou
# la cause ② du n°45 (le padding qui mange 20 px). Ces assertions
# existent et n'ont jamais été vues rouges.
# UN FILET VU ROUGE UNE FOIS N'EST PAS UN FILET VÉRIFIÉ : c'est UNE de
# ses assertions éprouvée sur UNE branche.

print()
if ECHECS:
    print(f'{len(ECHECS)} ÉCHEC(S) :')
    for e in ECHECS: print('  ·', e)
    sys.exit(1)
print('QR OK — codes lisibles par un décodeur indépendant, charge intacte, '
      'largeur appliquée conforme au plancher')
