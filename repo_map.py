"""Carte du graphe d'imports — qui dépend de quoi, et qui est piégé où.

    python3 repo_map.py            # la carte complète
    python3 repo_map.py --chiffres # les trois chiffres, pour un diff

══════════════════════════════════════════════════════════
POURQUOI CET OUTIL EXISTE

Lire les 44 modules pour répondre à « qui appelle render.js ? » coûte
~680 000 jetons. Cette carte coûte ~2 000 — et répond mieux, parce
qu'elle voit les ARÊTES, qu'aucune lecture séquentielle ne montre.

Elle a été écrite pendant le découpage v2, après trois surprises que la
lecture de fichiers n'avait pas données :

  · l'app ne contient pas « plusieurs cycles » mais UN SEUL, et tout le
    monde est dedans (22 modules à la première mesure) ;
  · deux modules fraîchement extraits y sont RENTRÉS sans qu'on le voie,
    parce qu'ils importaient la saison courante depuis data.js ;
  · la racine de l'enchevêtrement n'est pas le module le plus gros, mais
    l'arête data.js → render.js, qui ramène l'interface dans tout ce qui
    a besoin du catalogue.

LES TROIS CHIFFRES, et pourquoi trois. Compter les NŒUDS d'une
composante ne veut rien dire pendant un découpage : éclater un module en
sept fait « monter » le compte de 22 à 27 sans que rien n'ait empiré.
On sort donc aussi le nombre d'ARÊTES (la densité réelle de
l'enchevêtrement) et la part des modules du projet qui y sont piégés.

CE QU'ELLE NE VOIT PAS, et il faut le dire : les imports dynamiques
construits (`import(variable)`), les dépendances passant par
`window.__X`, et l'ordre d'exécution. Elle décrit le graphe déclaré,
pas le comportement.
══════════════════════════════════════════════════════════
"""
import pathlib
import re
import sys

RACINE = pathlib.Path(__file__).resolve().parent

# Le bundle est une SORTIE (il contient tout le graphe aplati) ; sw.js
# n'importe rien. Les inclure fausserait la carte.
HORS = {'app.bundle.js', 'sw.js', 'app.bundle.js.map'}

# `import … from './x.js'` et `import('./x.js')` — les deux formes que
# le dépôt utilise. Un import construit dynamiquement échapperait aux
# deux, et c'est une limite assumée (voir l'en-tête).
MOTIFS = [
    re.compile(r"from\s+'\./([\w.-]+\.js)'"),
    re.compile(r"import\(\s*'\./([\w.-]+\.js)'\s*\)"),
]


def graphe():
    modules = sorted(f.name for f in RACINE.glob('*.js') if f.name not in HORS)
    g = {}
    for m in modules:
        src = (RACINE / m).read_text(encoding='utf8')
        cibles = set()
        for motif in MOTIFS:
            for cible in motif.findall(src):
                if cible in modules:
                    cibles.add(cible)
        g[m] = sorted(cibles)
    return g


def composantes(g):
    """Tarjan — les composantes fortement connexes, la plus grande d'abord."""
    index = {}
    bas = {}
    pile = []
    sur_pile = set()
    out = []
    compteur = [0]

    def parcourir(v):
        index[v] = bas[v] = compteur[0]
        compteur[0] += 1
        pile.append(v)
        sur_pile.add(v)
        for w in g.get(v, []):
            if w not in index:
                parcourir(w)
                bas[v] = min(bas[v], bas[w])
            elif w in sur_pile:
                bas[v] = min(bas[v], index[w])
        if bas[v] == index[v]:
            comp = []
            while True:
                w = pile.pop()
                sur_pile.discard(w)
                comp.append(w)
                if w == v:
                    break
            out.append(sorted(comp))

    sys.setrecursionlimit(10000)
    for v in g:
        if v not in index:
            parcourir(v)
    return sorted(out, key=len, reverse=True)


def chiffres(g):
    """Les trois chiffres qui décrivent l'enchevêtrement."""
    comps = [c for c in composantes(g) if len(c) > 1]
    geante = comps[0] if comps else []
    dedans = set(geante)
    aretes = sum(1 for a in geante for b in g[a] if b in dedans)
    return {
        'modules': len(g),
        'noeuds_composante': len(geante),
        'aretes_composante': aretes,
        'part_piegee': round(100 * len(geante) / len(g)) if g else 0,
        'feuilles': sorted(m for m in g if m not in dedans),
        'composantes': len(comps),
    }


def carte(g):
    entrants = {m: [] for m in g}
    for m, cibles in g.items():
        for c in cibles:
            entrants[c].append(m)
    c = chiffres(g)
    dedans = set()
    comps = [x for x in composantes(g) if len(x) > 1]
    if comps:
        dedans = set(comps[0])

    lignes = [
        f"# Carte d'imports — {c['modules']} modules",
        f"# Composante enchevêtrée : {c['noeuds_composante']} modules, "
        f"{c['aretes_composante']} arêtes ({c['part_piegee']} % du dépôt)",
        f"# Feuilles saines : {len(c['feuilles'])}",
        '',
        f"{'module':<24} {'⊣ importé par':>13}  {'importe ⊢':>9}  état",
        '-' * 72,
    ]
    for m in sorted(g, key=lambda x: (-len(entrants[x]), x)):
        etat = 'ENCHEVÊTRÉ' if m in dedans else 'feuille'
        lignes.append(f'{m:<24} {len(entrants[m]):>13}  {len(g[m]):>9}  {etat}')
    lignes += ['', 'FEUILLES : ' + ', '.join(c['feuilles'])]
    return '\n'.join(lignes)


if __name__ == '__main__':
    g = graphe()
    if '--chiffres' in sys.argv:
        c = chiffres(g)
        print(f"noeuds={c['noeuds_composante']} aretes={c['aretes_composante']} "
              f"part={c['part_piegee']}% feuilles={len(c['feuilles'])}")
    else:
        print(carte(g))
