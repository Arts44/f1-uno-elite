"""Parcours réel du tutoriel — la visite guidée ne doit RIEN laisser derrière.

    python3 -m http.server 8124        # dans le dossier du dépôt
    python3 verify_tutorial.py

══════════════════════════════════════════════════════════
POURQUOI CE SCRIPT EXISTE, ET POURQUOI IL EST SÉPARÉ

Le tutoriel est le PREMIER parcours qu'un nouvel utilisateur verra, et il
écrit dans sa collection réelle : il ajoute des cartes, débloque des
badges, change le thème et la langue. Tout cela doit être défait à la
sortie, sinon la démonstration abîme des données qui ne lui appartiennent
pas.

`tests/tutorial.test.js` vérifie déjà cette restauration — sur un
localStorage SIMULÉ, avec un faux DOM qui répond `querySelectorAll: []`.
Il ne peut donc pas voir : une cible disparue, un projecteur hors écran,
une étape qui ne progresse pas, ni une ré-hydratation mémoire ratée. Ce
script exerce le vrai parcours dans un vrai navigateur.

IL NE FAIT PAS PARTIE DE capture_screenshots.py, et c'est délibéré :
celui-là produit des captures déterministes, une fonction critique qui a
coûté quatre passes de correction. On ne mélange pas les deux. Le seed
est partagé, comme le fait déjà capture_demos.py — c'est la seule chose
qui doit rester identique entre eux.

══════════════════════════════════════════════════════════
LES DEUX VÉRIFICATIONS, ET POURQUOI IL EN FAUT DEUX

1. LE DIFF localStorage, clé par clé, RELU APRÈS COUP. Jamais la valeur
   qu'on croyait avoir écrite : la valeur que le navigateur rend quand on
   la redemande. C'est ce qui voit un échec avalé par un `catch`.

2. L'EMPREINTE AFFICHÉE, avant et après. Un localStorage correct avec une
   mémoire polluée est exactement ce que produirait un
   `loadManualBadges()` en échec — et c'est CE QUE L'UTILISATEUR VOIT.
   Vérifier le stockage sans vérifier l'écran laisserait passer la panne
   la plus visible des deux.

⚠️ IL LIT `index.html`, DONC `app.bundle.js`. Une modification de
`tutorial.js` NON RECONSTRUITE ne change rien à ce que ce script voit.
Payé une fois : un contrôle négatif (retirer une clé de `tutorialKeys()`)
est passé au VERT, non parce que le garde était mauvais mais parce que le
bundle datait. `npm run build` avant toute vérification qui touche un
module bundlé.

CE QU'IL NE PROUVE PAS, et il faut le dire : ni que l'explication est
compréhensible, ni que le projecteur pointe la bonne chose. Il tourne en
UNE langue à UNE taille — les débordements de bulle dans les six autres
langues restent le trou n°16 de docs/POINTS-SIGNALES.md.

VÉRIFIÉ COMME UN GARDE DOIT L'ÊTRE — vu échouer avant d'être cru :
  · `f1uno_owned_<saison>` retiré de tutorialKeys() → le diff le voit ;
  · ré-hydratation mémoire neutralisée → l'empreinte affichée le voit
    (`has-favorite` 15 → 14), alors que localStorage est intact.
Et vu passer TROIS FOIS DE SUITE avant d'être déclaré stable.
══════════════════════════════════════════════════════════
"""
import sys

from playwright.sync_api import sync_playwright

from capture_seed import init_script

URL = 'http://localhost:8124/app/index.html'
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

ECHECS = []

# Les deux SEULES clés qu'un tutoriel terminé a le droit de laisser
# derrière lui. Elles ne sont pas dans tutorialKeys() et c'est voulu :
# « j'ai vu la visite » est un fait qui survit à la visite.
CHANGEMENTS_ATTENDUS = {
    'f1uno_onboarded': 'markTutorialSeen() — sinon la visite se relance à chaque ouverture',
    'f1uno_tut_skipped': '_end() — le hint d’ajout rapide ne vise que ceux qui ont sauté',
}

# Garde-fou de boucle : 33 étapes, plus la marge des étapes d'action qui
# demandent un second geste. Au-delà, le tour est bloqué — c'est un échec,
# pas une raison d'attendre plus longtemps.
MAX_TOURS = 80

# Une étape attend parfois sa cible (défilement, rendu d'une vue). Six
# secondes suffisaient à 28 étapes sur 33 — la marge manquante faisait
# passer un simple retard pour un blocage. C'est le faux rouge du n°38,
# décrit ici avant d'être nommé là-bas : ce plafond est de la MÊME famille
# que les autres, il rejoint donc la borne commune.
ATTENTE_MS = BORNE_SECURITE_MS


def instantane(page):
    """Tout localStorage, RELU depuis le navigateur."""
    return page.evaluate("""() => {
      const o = {};
      for(let i = 0; i < localStorage.length; i++){
        const k = localStorage.key(i);
        o[k] = localStorage.getItem(k);
      }
      return o;
    }""")


def empreinte_affichee(page):
    """Ce que l'utilisateur VOIT — pas ce que le stockage contient.

    Trois surfaces qui dépendent de la MÉMOIRE (coll, manualBadges) et
    non du stockage : la grille, le bandeau de Collection, la page Badges.
    Une mémoire polluée les fait mentir avec un localStorage correct.
    """
    return page.evaluate("""() => {
      const cartes = [...document.querySelectorAll('.card')];

      /* ⚠️ ON NE PREND QUE LES CLASSES DE STATUT, jamais className en
         entier. Les tuiles portent aussi des classes d'ANIMATION
         (`fx-idle` sur 95 des 101) qui dépendent de l'instant : les
         inclure ferait échouer une exécution saine une fois sur deux.
         C'est la leçon du non-déterminisme des captures (n°11), payée
         une seconde fois ici. */
      const STATUT = c => [...c.classList]
        .filter(k => k.startsWith('has-') || k === 'set-complete').sort().join('.');

      /* Les COMPTES seuls ne suffisent pas : une carte perdue et une
         carte gagnée se compensent. La signature par carte voit un
         statut déplacé d'une tuile à l'autre. */
      let h = 0;
      const sig = cartes.map(STATUT).join('|');
      for(let i = 0; i < sig.length; i++){ h = ((h << 5) - h + sig.charCodeAt(i)) | 0; }

      const parClasse = {};
      cartes.forEach(c => c.classList.forEach(k => {
        if(k.startsWith('has-') || k === 'set-complete') parClasse[k] = (parClasse[k] || 0) + 1;
      }));

      /* ⚠️ textContent, PAS innerText — et ce n'est pas un détail de
         style. `innerText` est le texte TEL QUE MIS EN PAGE : sur un
         élément momentanément masqué (une vue en cours de transition
         après la restauration), il perd les retours à la ligne que la
         mise en page insérait, et le même contenu se compare comme
         différent. Mesuré : trois exécutions saines échouaient sur
         `72/101 ✓ Possédées` contre `72/101✓ Possédées`, sans qu'une
         seule donnée ait bougé.
         `textContent` ne dépend d'aucune mise en page ; les espaces sont
         normalisés pour absorber l'indentation du gabarit. */
      const bandeau = ((document.getElementById('collHead') || {}).textContent || '')
        .replace(/\\s+/g, ' ').trim();

      return {
        cartes_total: cartes.length,
        statuts: JSON.stringify(parClasse),
        signature_grille: h,
        bandeau_collection: bandeau,
        theme: document.documentElement.getAttribute('data-theme') || '',
        langue: document.documentElement.lang || '',
      };
    }""")


def compteur(page):
    el = page.locator('.tut-count')
    return el.inner_text().strip() if el.count() else ''


def attendre(page, condition, timeout_ms):
    """True si la condition arrive à temps, False sinon.

    L'appelant DÉCIDE de ce qu'un False veut dire — un timeout n'est pas
    toujours un échec (un toast qui traîne se contourne, une étape qui ne
    progresse pas se diagnostique). Un try/except/pass inline dirait
    « on s'en moque » ; ce helper dit « on a regardé, et voilà quoi ».
    """
    try:
        page.wait_for_function(condition, timeout=timeout_ms)
        return True
    except Exception:
        return False


# Fragment stable du message « cible absente » (tut.missing, fr). S'il
# apparaît dans une bulle, une cible du parcours a DISPARU — c'est LA
# panne qu'un refactor d'interface produit et qu'aucun test unitaire ne
# voit, puisque le faux DOM ne trouve jamais rien.
#
# ⚠️ Fragment choisi SANS apostrophe : le gabarit écrit « l'écran » avec
# l'apostrophe ASCII, et la version typographique « l’écran » ne le
# matche pas. Payé une fois — le contrôle négatif tombait dans la
# mauvaise branche à cause d'un caractère invisible à l'œil.
MSG_CIBLE_ABSENTE = 'écran pour l'


def verifier_etape(page, etat):
    """Les trois assertions de robustesse, à CHAQUE étape.

    `etat` retient les étapes déjà signalées : une étape au long cours
    (l'utilisateur simulé y passe plusieurs tours de boucle) ne doit
    produire qu'UN échec, pas un par tour.
    """
    cle = compteur(page) + ' · ' + (page.locator('.tut-title').inner_text().strip()
                                    if page.locator('.tut-title').count() else '?')
    if cle in etat:
        return
    etat.add(cle)

    # 1. La cible existe. Le moteur a sa propre sortie de secours (texte
    #    tut.missing + Suivant forcé) : le tour CONTINUE, mais l'étape
    #    n'a rien montré — pour nous c'est un échec, pas une variante.
    texte = page.locator('.tut-text').inner_text() if page.locator('.tut-text').count() else ''
    if MSG_CIBLE_ABSENTE in texte:
        ECHECS.append(f'cible ABSENTE à l’étape « {cle} » : la bulle affiche '
                      'le message de secours — un refactor a perdu cette cible')
        return

    # 2. Le projecteur (ou l'indicateur « plus haut/bas ») est là. Une
    #    étape d'action sans halo ni flèche grise l'écran sans rien
    #    désigner : l'utilisateur ne sait pas quoi faire.
    spot = page.locator('.tut-spot').bounding_box()
    away = page.locator('.tut-away').count() > 0
    if not spot and not away and not page.locator('#tutNext').count():
        ECHECS.append(f'étape d’action sans halo ni indicateur à « {cle} » : '
                      'rien ne désigne le geste attendu')

    # 3. Le halo reste dans l'écran.
    if spot:
        vp = page.viewport_size
        if spot['x'] + spot['width'] < 0 or spot['x'] > vp['width'] \
           or spot['y'] + spot['height'] < 0 or spot['y'] > vp['height']:
            ECHECS.append(f'projecteur hors écran à « {cle} » : {spot}')


def parcourir(page):
    """Avance jusqu'à la fin du tour. Renvoie (etapes, actions, sautees)."""
    etapes = actions = surplace = 0
    sautees = []
    vues = set()
    for _ in range(MAX_TOURS):
        if not page.locator('.tut-bubble').count():
            break                                  # le tour est terminé
        etapes += 1
        verifier_etape(page, vues)
        avant = compteur(page)

        suivant = page.locator('#tutNext').count() > 0
        if suivant:
            page.locator('#tutNext').click()
        else:
            # Étape d'ACTION : on fait le geste pour de vrai. C'est tout
            # l'intérêt — un tour qui n'écrit rien n'a rien à restaurer,
            # et le test passerait pour de mauvaises raisons.
            #
            # Mais d'abord : laisser passer les toasts. Mesuré à l'étape
            # « Direction les stats » : le toast d'annulation de l'ajout
            # rapide couvre la barre de nav EXACTEMENT là où le tour dit
            # d'appuyer — elementFromPoint(centre du projecteur) rendait
            # `toast show`, pas l'onglet. Un utilisateur attend que la
            # célébration retombe ; le script fait pareil. (Le fond du
            # problème — le projecteur désigne une cible momentanément
            # recouverte — est au n°17 de POINTS-SIGNALES.)
            # ⚠️ AUCUNE attente de toast ici, et c'est VOULU (n°17).
            # Ce script attendait la retombée des toasts avant de
            # cliquer — un contournement : l'app elle-même laissait le
            # toast recouvrir l'onglet que le projecteur désignait.
            # Depuis le correctif (styles.css :
            # `body:has(.tut-overlay) .toast{bottom:130px}`), le toast
            # ne recouvre plus jamais la zone désignée pendant le tour.
            # SI CE PARCOURS SE MET À ÉCHOUER à « Direction les stats »
            # (clic sans progression), c'est ce CSS qui a régressé —
            # pas le parcours qui est instable. Le contournement retiré
            # est devenu le garde.
            sp = page.locator('.tut-spot').bounding_box()
            if sp:
                page.mouse.click(sp['x'] + sp['width'] / 2, sp['y'] + sp['height'] / 2)
                actions += 1
                # L'ajout rapide est un geste en DEUX temps : le « + »
                # ouvre un menu de variantes, et l'étape ne valide que
                # sur le choix d'une variante. On fait le second geste
                # comme un utilisateur le ferait. (Le projecteur, lui,
                # reste sur le « + » — c'est le n°17 de POINTS-SIGNALES.)
                page.wait_for_timeout(400)
                menu = page.locator('.qadd-type').first
                if menu.count():
                    m = menu.bounding_box()
                    # n°17 partie A : une fois le menu ouvert, le halo
                    # doit le RECOUVRIR — c'est lui l'étape suivante du
                    # geste. Un halo resté sur le « + » désigne un bouton
                    # déjà pressé.
                    sp2 = page.locator('.tut-spot').bounding_box()
                    if m and sp2:
                        recouvre = (sp2['x'] < m['x'] + m['width']
                                    and sp2['x'] + sp2['width'] > m['x']
                                    and sp2['y'] < m['y'] + m['height']
                                    and sp2['y'] + sp2['height'] > m['y'])
                        if not recouvre:
                            ECHECS.append(
                                'le halo ne suit pas le menu de variantes '
                                f'(halo {sp2}, première variante {m}) — '
                                'le second temps du geste n’est pas éclairé')
                    if m:
                        page.mouse.click(m['x'] + m['width'] / 2,
                                         m['y'] + m['height'] / 2)
                        actions += 1

        # On attend un CHANGEMENT D'ÉTAT observable, jamais une durée :
        # c'est la leçon du non-déterminisme des captures (n°11).
        try:
            page.wait_for_function(
                '([sel, avant]) => {'
                ' if(!document.querySelector(".tut-bubble")) return true;'
                ' const el = document.querySelector(sel);'
                ' return el && el.textContent.trim() !== avant; }',
                arg=['.tut-count', avant], timeout=ATTENTE_MS)
        except Exception:
            titre = page.locator('.tut-title').inner_text().strip() \
                if page.locator('.tut-title').count() else '?'

            # « Suivant » a DÉJÀ été cliqué : on ne re-clique pas. Le
            # faire enverrait deux avances d'un coup et sauterait une
            # étape en silence — le compte final mentirait sur ce qui a
            # été exercé. `_runStep()` attend parfois sa cible ; on lui
            # laisse un tour de boucle de plus, et c'est le compteur de
            # sur-place qui tranche.
            if suivant:
                surplace += 1
                # SEUIL DECLARE (㉒) : trois tours sans progression. Un
                # seul ne suffit pas — `_runStep()` attend parfois sa cible
                # et un tour de boucle passe legitimement sans avancer.
                # Trois est le premier compte ou l'attente cesse d'etre une
                # explication plausible. Non mesure : choisi, et declare
                # comme choisi.
                if surplace >= 3:
                    ECHECS.append(f'tour bloqué à l’étape « {avant} · {titre} » : '
                                  f'« Suivant » cliqué 3 fois sans progression')
                    break
                continue

            # La cible a DISPARU pendant qu'on attendait ? Le moteur
            # affiche alors son message de secours avec un « Suivant »
            # forcé — et PAS de « Passer l'étape » (l'étape n'est plus
            # une action). On produit le diagnostic précis, puis on
            # avance par ce Suivant pour que la restauration finale
            # tourne quand même et que le diff reste lisible.
            texte = page.locator('.tut-text').inner_text() \
                if page.locator('.tut-text').count() else ''
            if MSG_CIBLE_ABSENTE in texte:
                ECHECS.append(f'cible ABSENTE à l’étape « {avant} · {titre} » : '
                              'la bulle affiche le message de secours — un '
                              'refactor a perdu cette cible')
                if page.locator('#tutNext').count():
                    page.locator('#tutNext').click()
                    page.wait_for_timeout(500)
                continue

            # Étape d'action dont le geste n'a pas pris : sortie de
            # secours de l'app. On la NOMME — un saut silencieux ferait
            # passer un tour bloqué pour un tour réussi.
            # `#tutSkipStep` seulement : passer le CHAPITRE sauterait
            # plusieurs étapes d'un coup.
            if page.locator('#tutSkipStep').count():
                page.locator('#tutSkipStep').click()
                sautees.append(f'{avant} · {titre}')
                page.wait_for_timeout(500)
            else:
                ECHECS.append(f'tour bloqué à l’étape « {avant} · {titre} » : '
                              'le geste ne prend pas et aucune sortie n’est offerte')
                break
        else:
            surplace = 0
    else:
        ECHECS.append(f'le tour n’est pas terminé après {MAX_TOURS} gestes — '
                      'une étape ne progresse pas')
    return etapes, actions, sautees


with sync_playwright() as p:
    navigateur = p.chromium.launch()
    ctx = navigateur.new_context(viewport={'width': 375, 'height': 812},
                                 device_scale_factor=2)
    ctx.add_init_script(init_script('fr', 'dark'))
    page = ctx.new_page()
    try:
        # Borne de securite, PAS seuil de mesure. Un serveur ABSENT ne
        # consomme pas ce plafond : le refus est immediat (commit b49fbd6,
        # « les refus arrivent en 0,0 s », n=40). Le plafond ne borne donc
        # que le cas LENT — le faux rouge sous charge.
        page.goto(URL, timeout=BORNE_SECURITE_MS)
    except Exception as e:
        # DEUX FAMILLES, DEUX MESSAGES. Le relevement 15 s -> 60 s rend le
        # diagnostic quatre fois plus lent pour tout ce qui n'est PAS un
        # refus de connexion : une page servie mais qui ne finit pas de
        # charger, une sous-ressource qui cale, un autre service sur le
        # port. Leur annoncer « injoignable » serait faux.
        if 'ERR_CONNECTION_REFUSED' in str(e):
            print(f'ÉCHEC : {URL} injoignable — lance `python3 -m http.server 8124`\n{e}')
        else:
            print(f'ÉCHEC : {URL} a repondu mais n a pas fini de charger dans la'
                  f' borne de securite — ce n est PAS un serveur absent.\n{e}')
        sys.exit(1)
    page.wait_for_selector('.card', timeout=BORNE_SECURITE_MS)
    page.wait_for_timeout(600)

    avant_ls = instantane(page)
    avant_vu = empreinte_affichee(page)

    # On entre par « Rejouer » des Réglages : c'est le chemin réel, et il
    # ne dépend pas de l'état « déjà vu ».
    page.evaluate('document.querySelector(".bn-tab[data-view=\\"settings\\"]").click()')
    page.wait_for_selector('#replayTutBtn', timeout=BORNE_SECURITE_MS)
    page.evaluate('document.getElementById("replayTutBtn").click()')
    page.wait_for_selector('.tut-bubble', timeout=BORNE_SECURITE_MS)
    page.wait_for_timeout(1200)

    etapes, actions, sautees = parcourir(page)

    # Le tour doit s'être TERMINÉ, pas avoir été quitté : seule la fin
    # normale passe par _end(false) → restoreState().
    if page.locator('.tut-overlay').count():
        ECHECS.append('l’overlay du tutoriel est encore là après le parcours')
    page.wait_for_timeout(1200)          # restoreState + re-rendus

    apres_ls = instantane(page)
    apres_vu = empreinte_affichee(page)

    # ── 1. Le diff localStorage, clé par clé ──────────────────────
    for k in sorted(set(avant_ls) | set(apres_ls)):
        a, b = avant_ls.get(k), apres_ls.get(k)
        if a == b:
            continue
        if k in CHANGEMENTS_ATTENDUS:
            continue
        etat = 'ajoutée' if a is None else ('supprimée' if b is None else 'modifiée')
        ECHECS.append(f'clé {etat} par le tutoriel et NON restaurée : {k}\n'
                      f'    avant : {str(a)[:110]}\n'
                      f'    après : {str(b)[:110]}')

    # ── 2. L'empreinte affichée ───────────────────────────────────
    for champ in avant_vu:
        if avant_vu[champ] != apres_vu[champ]:
            ECHECS.append(
                f'l’écran ne montre plus l’état d’avant — {champ} : '
                f'{avant_vu[champ]!r} → {apres_vu[champ]!r}\n'
                '    (localStorage peut être correct : c’est la MÉMOIRE '
                'qui n’a pas été ré-hydratée)')

    ctx.close()
    navigateur.close()

print(f'\nparcours : {etapes} étapes atteintes, {actions} gestes réels, '
      f'{len(sautees)} passée(s)')
# Une étape passée est un ÉCHEC, pas un avertissement. Le parcours sain
# fait 0 passée depuis que le script joue le geste complet ; un saut qui
# réapparaît signifie qu'un geste guidé ne prend plus — et un garde qui
# avertit sans échouer n'est pas un garde (exit 0 = personne ne lit).
for s_ in sautees:
    ECHECS.append(f'étape passée par la sortie de secours : {s_} — '
                  'le geste guidé ne prend plus dans le temps imparti')
print(f'clés comparées : {len(set(avant_ls) | set(apres_ls))}, '
      f'dont {len(CHANGEMENTS_ATTENDUS)} autorisées à changer')

if ECHECS:
    print(f'\n{len(ECHECS)} ÉCHEC(S) :')
    for e in ECHECS:
        print(f'  · {e}')
    sys.exit(1)
print('\nTUTORIEL OK — rien laissé derrière, à l’écran comme dans le stockage')
