"""FILET — LA ZONE BASSE (1.77.0)

Ce que ce filet prouve, et que les tests purs ne peuvent pas prouver :
la GÉOMÉTRIE. `tests/zone-basse.test.js` couvre l'arbitrage (qui passe,
qui attend, qui revient) ; le mini-DOM du dépôt ne fait aucune mise en
page, c'est écrit dans son en-tête.

TROIS CHOSES, ET AUCUNE N'EST DÉDUITE DU CSS :

  ① CHEVAUCHEMENT NUL. Les surfaces de la zone posées ensemble, aux
     trois largeurs et aux SEPT langues à 320 px. Le néerlandais décide
     (« Er is een nieuwe versie beschikbaar. » passe à trois lignes et
     fait 67 px au lieu de 51) : c'est exactement pour ça qu'aucune
     constante de hauteur ne doit survivre dans le dépôt.

  ② CHACUNE ATTEIGNABLE. elementFromPoint au centre de chaque surface,
     pas `getElementById`. Trois occurrences ont été payées pour cette
     distinction ; on ne la redemande pas.

  ③ `.tut-away` NE CHEVAUCHE RIEN. C'était la dernière affirmation
     géométrique du chantier qui reposait sur une CONSTANTE DÉCLARÉE
     (`height:34px`, d'où le décalage de 48 px de la zone pendant la
     visite) et non sur une mesure. Elle est mesurée ici.

  ④ PENDANT LE TUTORIEL, AUCUNE N'EST CLIQUABLE — et c'est un VRAI
     CLIC qui l'établit, pas la lecture de `pointer-events` (n°25 :
     le CSS disait déjà `pointer-events:none` sur le voile, et le
     bandeau répondait quand même).

CONTRÔLES NÉGATIFS intégrés (--controle) : le filet doit savoir voir
rouge. Il replace un `bottom` en dur et vérifie qu'il détecte alors le
chevauchement, puis rétablit `pointer-events` et vérifie que le clic
passe. Un garde qu'on n'a pas vu échouer n'a pas été vérifié.

    python3 -m http.server 8124        # à la racine du dépôt
    python3 verify_zone.py [--controle]
"""
import json
import pathlib
import sys

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

CONTROLE = '--controle' in sys.argv
# capture_seed lit sys.argv[1] comme une SAISON : on lui retire nos
# propres drapeaux AVANT l'import, sinon il tombe sur « --controle ».
sys.argv = [a for a in sys.argv if not a.startswith('--')]
from capture_seed import SEED  # noqa: E402

URL = 'http://localhost:8124/app/index.html'
LANGS = ['en', 'fr', 'es', 'zh', 'it', 'nl', 'de']


def _tpl(fichier, ancre, ouverture):
    s = (ROOT / 'app' / fichier).read_text()
    i = s.index(ancre)
    j = s.index(ouverture, i) + len(ouverture)
    return s[j:s.index('`;', j)]


# Les balisages sont EXTRAITS des modules, jamais recopiés : si une
# surface change, le filet change avec elle.
T = {
    'updateBanner': ('install-banner update-banner',
                     _tpl('update.js', 'function _poserBanniere()', 'b.innerHTML = `')),
    'whatsNewBanner': ('install-banner update-banner',
                       _tpl('update.js', 'function _poserNouveautes()', 'b.innerHTML = `')),
    'installBanner': ('install-banner',
                      _tpl('install.js', 'function _poserBanniere()', 'b.innerHTML = `')),
    'badgeToast': ('badge-toast show',
                   _tpl('badge-toasts.js', 'function _poserToast(', 'el.innerHTML = `')),
}

POSER = """
([surfaces, avecToast, lang]) => {
  const zone = document.getElementById('zoneBasse');
  if (!zone) return 'CONTENEUR ABSENT';
  for (const [id, cls, html] of surfaces) {
    const el = document.createElement('div');
    el.id = id; el.className = cls;
    el.innerHTML = html
      .replace(/\\$\\{icon\\('[a-z]+'\\)\\}/g, '<svg class="ic" viewBox="0 0 24 24"></svg>')
      /* LES VRAIES CHAÎNES DES SEPT LANGUES. Une substitution générique
         (« OK » partout) aurait donné la même hauteur dans les sept :
         le filet aurait rendu vert sans jamais éprouver le néerlandais,
         qui est précisément le cas qui décide. */
      .replace(/\\$\\{t\\('([a-z._]+)'\\)\\}/g, (_, k) => (window.__T[lang] && window.__T[lang][k]) || k)
      /* Les expressions IMBRIQUÉES du badge-toast (ternaires contenant
         eux-mêmes des `${}`) ne se substituent pas au motif simple : le
         filet rendait alors un libellé tronqué, donc un toast PLUS COURT
         que le vrai — il aurait mesuré une hauteur qui n'existe pas. On
         leur donne les vraies chaînes, et un nom de badge long. */
      .replace(/\\$\\{badges\\.length > 1 \\?[\\s\\S]*?t\\('b\\.toast_one'\\)\\}/g,
               (window.__T[lang] && window.__T[lang]['b.toast_one']) || 'Badge')
      .replace(/\\$\\{badges\\.length > 1 \\?[\\s\\S]*?names\\[0\\]\\}/g,
               'Collectionneur de Grands Prix')
      .replace(/\\$\\{[^{}]*\\}/g, '🏁');
    zone.appendChild(el);
  }
  if (avecToast) {
    const t = document.getElementById('toast');
    t.textContent = 'Carte retirée';
    t.classList.add('show');
  }
  return 'ok';
}
"""

MESURER = r"""
() => {
  const zone = document.getElementById('zoneBasse');
  const noms = [...zone.children].map(e => e.id || e.className);
  const boites = [...zone.children].map(e => {
    const r = e.getBoundingClientRect();
    return {nom: e.id || e.className,
            haut: Math.round(r.top), bas: Math.round(r.bottom),
            g: Math.round(r.left), d: Math.round(r.right), h: Math.round(r.height)};
  }).filter(b => b.h > 0);
  const chev = [];
  for (let i = 0; i < boites.length; i++) for (let j = i + 1; j < boites.length; j++) {
    const a = boites[i], b = boites[j];
    const v = Math.min(a.bas, b.bas) - Math.max(a.haut, b.haut);
    const h = Math.min(a.d, b.d) - Math.max(a.g, b.g);
    if (v > 0 && h > 0) chev.push({paire: a.nom + ' × ' + b.nom, px: v});
  }
  const nav = document.querySelector('.bottom-nav');
  const rn = nav ? nav.getBoundingClientRect() : null;
  const surNav = rn ? boites.filter(b => b.bas > rn.top).map(b => b.nom) : [];
  const atteignables = {};
  for (const el of zone.children) {
    const r = el.getBoundingClientRect();
    if (r.height <= 0) continue;
    const h = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2);
    atteignables[el.id || el.className] = !!h && (h === el || el.contains(h));
  }
  /* LE DÉBORDEMENT SE MESURE SUR LES DESCENDANTS, pas sur la boîte.
     Une surface peut faire 351 px de large pendant que son bouton est
     à x=470 sur un écran de 375 : le conteneur ne rétrécit pas ce
     qu'il ne peut pas rétrécir (min-width:auto). Le premier filet
     écrit ici rendait vert dans ce cas exact. */
  const debords = [];
  for (const el of zone.children) {
    const r = el.getBoundingClientRect();
    if (r.height <= 0) continue;
    if (r.left < 0 || r.right > innerWidth) debords.push(el.id || el.className);
    for (const d of el.querySelectorAll('*')) {
      const rd = d.getBoundingClientRect();
      if (rd.width && (rd.left < 0 || rd.right > innerWidth)) {
        debords.push((el.id || el.className) + ' › ' + (d.className || d.tagName));
        break;
      }
    }
  }
  return {noms, boites, chevauchements: chev, surNav, atteignables, debords};
}
"""

# UN VRAI CLIC, ET LA NUANCE QUI A FAILLI PASSER : `element.click()`
# déclenche le gestionnaire QUELLE QUE SOIT la valeur de
# `pointer-events` — il n'y a aucun test de survol. Le premier filet
# écrit ici comptait 6 clics « passés » pendant le tutoriel alors que
# le CSS était correct : c'est l'instrument qui mentait, pas le produit.
# On clique donc à la SOURIS, aux coordonnées, ce qui passe par le test
# de survol du navigateur.
ARMER = """
() => {
  window.__recus = 0;
  const zone = document.getElementById('zoneBasse');
  zone.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { window.__recus++; }));
  return [...zone.querySelectorAll('button')].map(b => {
    const r = b.getBoundingClientRect();
    return [Math.round((r.left + r.right) / 2), Math.round((r.top + r.bottom) / 2)];
  });
}
"""


def scene(pg, lang='fr', avec_toast=True):
    surfaces = [[i, c, h] for i, (c, h) in T.items()]
    return pg.evaluate(POSER, [surfaces, avec_toast, lang])


def main():
    echecs = []
    with sync_playwright() as p:
        br = p.chromium.launch(headless=True, args=['--disable-gpu'])

        cas = [('320', 320, 720, l) for l in LANGS]
        cas += [('375', 375, 812, 'fr'), ('desktop', 1280, 860, 'fr')]

        for nom, w, h, lang in cas:
            seed = ';'.join(f'localStorage.setItem({json.dumps(k)},{json.dumps(v)})'
                            for k, v in dict(SEED, f1uno_lang=lang, f1uno_theme='dark').items()) + ';'
            c = br.new_context(viewport={'width': w, 'height': h})
            c.add_init_script(seed)
            pg = c.new_page()
            pg.goto(URL)
            pg.wait_for_load_state('networkidle')
            pg.wait_for_selector('.card', timeout=20000)
            if CONTROLE and nom == '375':
                # CONTRÔLE NÉGATIF ① : on rend son bottom en dur à une
                # surface. Le filet DOIT alors voir le chevauchement.
                pg.add_style_tag(content='#updateBanner{position:fixed;bottom:150px;left:50%;'
                                         'transform:translateX(-50%);width:min(480px,calc(100vw - 24px));}')
            r = scene(pg, lang)
            if r != 'ok':
                echecs.append(f'{nom}/{lang} : {r}')
                c.close()
                continue
            pg.wait_for_timeout(250)
            m = pg.evaluate(MESURER)
            etiquette = f'{nom}/{lang}'
            if m['chevauchements']:
                echecs.append(f'{etiquette} : chevauchement ' +
                              ', '.join(f"{x['paire']} {x['px']} px" for x in m['chevauchements']))
            if m['surNav']:
                echecs.append(f"{etiquette} : recouvre la barre de nav — {m['surNav']}")
            if m['debords']:
                echecs.append(f"{etiquette} : déborde de l'écran — {m['debords']}")
            for k, v in m['atteignables'].items():
                if not v:
                    echecs.append(f'{etiquette} : {k} présent mais INATTEIGNABLE')
            haut = max((b['h'] for b in m['boites']), default=0)
            print(f"  {etiquette:<14} {len(m['boites'])} surfaces · "
                  f"plus haute {haut} px · chevauchement {len(m['chevauchements'])}")
            c.close()

        # ③ `.tut-away` contre la zone, pendant la visite guidée
        c = br.new_context(viewport={'width': 375, 'height': 812})
        c.add_init_script(';'.join(f'localStorage.setItem({json.dumps(k)},{json.dumps(v)})'
                                   for k, v in dict(SEED, f1uno_lang='nl').items()) + ';')
        pg = c.new_page()
        pg.goto(URL)
        pg.wait_for_load_state('networkidle')
        pg.wait_for_selector('.card', timeout=20000)
        scene(pg, 'nl')
        pg.evaluate("""() => {
            const o = document.createElement('div'); o.className = 'tut-overlay';
            const a = document.createElement('div'); a.className = 'tut-away down';
            a.textContent = 'Richting de statistieken';
            o.appendChild(a); document.body.appendChild(o);
        }""")
        pg.wait_for_timeout(250)
        aw = pg.evaluate("""() => {
          const a = document.querySelector('.tut-away');
          const ra = a.getBoundingClientRect();
          const pires = [];
          for (const el of document.getElementById('zoneBasse').children) {
            const r = el.getBoundingClientRect();
            if (r.height <= 0) continue;
            const v = Math.min(r.bottom, ra.bottom) - Math.max(r.top, ra.top);
            const h = Math.min(r.right, ra.right) - Math.max(r.left, ra.left);
            if (v > 0 && h > 0) pires.push({nom: el.id || el.className, px: Math.round(v)});
          }
          const nav = document.querySelector('.bottom-nav').getBoundingClientRect();
          return {hauteur_reelle: Math.round(ra.height), chevauchements: pires,
                  bas_a_nav: Math.round(nav.top - ra.bottom)};
        }""")
        print(f"  tut-away       hauteur réelle {aw['hauteur_reelle']} px · "
              f"chevauchement {len(aw['chevauchements'])} · à {aw['bas_a_nav']} px de la nav")
        if aw['chevauchements']:
            echecs.append('tut-away chevauche la zone — ' +
                          ', '.join(f"{x['nom']} {x['px']} px" for x in aw['chevauchements']))
        if aw['hauteur_reelle'] != 34:
            echecs.append(f"tut-away mesure {aw['hauteur_reelle']} px et non 34 : "
                          'le décalage de 48 px de la zone repose sur cette constante')
        c.close()

        # ④ pendant le tutoriel, aucun clic ne passe
        seed = ';'.join(f'localStorage.setItem({json.dumps(k)},{json.dumps(v)})'
                        for k, v in dict(SEED, f1uno_lang='fr', f1uno_theme='dark').items()) + ';'
        c = br.new_context(viewport={'width': 375, 'height': 812})
        c.add_init_script(seed)
        pg = c.new_page()
        pg.goto(URL)
        pg.wait_for_load_state('networkidle')
        pg.wait_for_selector('.card', timeout=20000)
        # La scène du clic est INERTE. Le premier filet cliquait sur le
        # vrai bandeau « Nouveautés » de l'app : son gestionnaire ouvre
        # le changelog, qui recouvre tout — les sept clics suivants
        # tombaient sur la boîte de dialogue et le contrôle POSITIF
        # rendait 1/8. Ce qu'on teste ici est « un clic atteint-il la
        # zone », pas « que fait l'app quand on clique ». 
        pg.evaluate("() => { document.getElementById('zoneBasse').innerHTML = ''; }")
        scene(pg, 'fr', avec_toast=False)
        points = pg.evaluate(ARMER)
        boutons = len(points)
        # contrôle POSITIF : hors tutoriel, les clics passent.
        for x, y in points:
            pg.mouse.click(x, y)
        hors = pg.evaluate('() => window.__recus')
        if hors != boutons:
            echecs.append(f'contrôle positif : {hors}/{boutons} clics reçus hors tutoriel — '
                          'le filet ne sait pas voir un clic passer')
        pg.evaluate("""() => { window.__recus = 0;
            const o = document.createElement('div'); o.className = 'tut-overlay';
            document.body.appendChild(o); }""")
        points = pg.evaluate(ARMER)
        pg.wait_for_timeout(120)
        if CONTROLE:
            # CONTRÔLE NÉGATIF ② : on rétablit pointer-events. Le filet
            # DOIT alors voir les clics passer.
            pg.add_style_tag(content='body:has(.tut-overlay) .zone-basse,'
                                     'body:has(.tut-overlay) .zone-basse > *{pointer-events:auto!important;}')
        for x, y in points:
            pg.mouse.click(x, y)
        pendant = pg.evaluate('() => window.__recus')
        print(f'  tutoriel       {boutons} boutons · clics reçus hors={hors} pendant={pendant}')
        if pendant:
            echecs.append(f'pendant le tutoriel, {pendant} clic(s) sont passés — '
                          'grisé mais actif, c’est le n°25')
        c.close()
        br.close()

    if echecs:
        print('\nZONE BASSE : ÉCHEC')
        for e in echecs:
            print('  ✗', e)
        return 1
    print('\nZONE BASSE OK')
    return 0


if __name__ == '__main__':
    sys.exit(main())
