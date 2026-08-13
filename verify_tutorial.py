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

URL = 'http://localhost:8124/index.html'
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
# passer un simple retard pour un blocage.
ATTENTE_MS = 15000


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


def parcourir(page):
    """Avance jusqu'à la fin du tour. Renvoie (etapes, actions, sautees)."""
    etapes = actions = surplace = 0
    sautees = []
    for _ in range(MAX_TOURS):
        if not page.locator('.tut-bubble').count():
            break                                  # le tour est terminé
        etapes += 1
        avant = compteur(page)

        suivant = page.locator('#tutNext').count() > 0
        if suivant:
            page.locator('#tutNext').click()
        else:
            # Étape d'ACTION : on fait le geste pour de vrai. C'est tout
            # l'intérêt — un tour qui n'écrit rien n'a rien à restaurer,
            # et le test passerait pour de mauvaises raisons.
            sp = page.locator('.tut-spot').bounding_box()
            if sp:
                page.mouse.click(sp['x'] + sp['width'] / 2, sp['y'] + sp['height'] / 2)
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
                if surplace >= 3:
                    ECHECS.append(f'tour bloqué à l’étape « {avant} · {titre} » : '
                                  f'« Suivant » cliqué 3 fois sans progression')
                    break
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


def verifier_projecteur(page):
    """Le halo doit rester dans l'écran. Hors cadre = l'utilisateur ne
    voit pas ce qu'on lui montre, et rien ne le lui dit."""
    b = page.locator('.tut-spot').bounding_box()
    if not b:
        return
    vp = page.viewport_size
    if b['x'] + b['width'] < 0 or b['x'] > vp['width'] \
       or b['y'] + b['height'] < 0 or b['y'] > vp['height']:
        ECHECS.append(f'projecteur hors écran à l’étape « {compteur(page)} » : {b}')


with sync_playwright() as p:
    navigateur = p.chromium.launch()
    ctx = navigateur.new_context(viewport={'width': 375, 'height': 812},
                                 device_scale_factor=2)
    ctx.add_init_script(init_script('fr', 'dark'))
    page = ctx.new_page()
    try:
        page.goto(URL, timeout=15000)
    except Exception as e:
        print(f'ÉCHEC : {URL} injoignable — lance `python3 -m http.server 8124`\n{e}')
        sys.exit(1)
    page.wait_for_selector('.card', timeout=15000)
    page.wait_for_timeout(600)

    avant_ls = instantane(page)
    avant_vu = empreinte_affichee(page)

    # On entre par « Rejouer » des Réglages : c'est le chemin réel, et il
    # ne dépend pas de l'état « déjà vu ».
    page.evaluate('document.querySelector(".bn-tab[data-view=\\"settings\\"]").click()')
    page.wait_for_selector('#replayTutBtn', timeout=8000)
    page.evaluate('document.getElementById("replayTutBtn").click()')
    page.wait_for_selector('.tut-bubble', timeout=8000)
    page.wait_for_timeout(1200)
    verifier_projecteur(page)

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
for s_ in sautees:
    print(f'  ⚠ passée par la sortie de secours : {s_}')
print(f'clés comparées : {len(set(avant_ls) | set(apres_ls))}, '
      f'dont {len(CHANGEMENTS_ATTENDUS)} autorisées à changer')

if ECHECS:
    print(f'\n{len(ECHECS)} ÉCHEC(S) :')
    for e in ECHECS:
        print(f'  · {e}')
    sys.exit(1)
print('\nTUTORIEL OK — rien laissé derrière, à l’écran comme dans le stockage')
