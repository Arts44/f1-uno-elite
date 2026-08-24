#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════
#  LIVRER — la séquence complète, qui s'ARRÊTE au premier rouge.
#
#  POURQUOI CE SCRIPT EXISTE. Trois fois, un push est parti avec un
#  filet rouge : une chaîne `cmd && cmd && git push` continue dès que
#  le maillon qui précède le `&&` réussit, et afficher un code de
#  sortie n'est pas le lire. La règle était écrite dans CONVENTIONS.md
#  — une règle qui ne tient pas après trois occurrences n'est pas une
#  règle, c'est une intention. Voici la parade mécanique.
#
#  `set -e` fait le travail : au PREMIER code non nul, tout s'arrête.
#  Aucune vigilance requise, rien à se rappeler.
#
#  Les filets LENTS (navigateur) ne sont pas dans le hook pre-push :
#  ils prennent des minutes, et un garde insupportable finit contourné
#  par --no-verify. Ils sont ICI, et ils laissent une TRACE horodatée
#  que le hook vérifie. Rapide toujours, lent tracé.
# ══════════════════════════════════════════════════════════
set -euo pipefail
cd "$(dirname "$0")/.."

TRACE=".git/derniere-livraison"
LENTS=${LENTS:-1}          # LENTS=0 pour un commit de documentation seule

# ══ GARDE D'ÉTAT DE POSTE ══════════════════════════════════
# TROIS MANQUES EXPOSÉS PAR DEUX CLONES : pas de hook pre-push (les
# hooks ne sont pas versionnés), pas de node_modules (esbuild
# introuvable), et Biome qui échouait sur un coffre Obsidian présent
# sur le disque. Chacun produisait un échec obscur au milieu de la
# livraison. On les nomme AVANT, avec la commande qui répare.
#
# CE QUE CE GARDE N'EST PAS : une parade versionnée. Il vit dans le
# script, donc il ne protège que les livraisons qui passent par lui —
# un `git push` direct depuis un poste neuf ne voit rien. C'est
# assumé : core.hooksPath aurait eu l'air de résoudre ça et ne l'aurait
# pas fait (config LOCALE, elle ne voyage pas avec le clone, et elle
# désactive les hooks tiers). Voir docs/V2-REFACTOR.md, cinquième refus.
manque() { echo "LIVRAISON REFUSÉE — $1"; echo "   $2"; exit 1; }
[ -x .git/hooks/pre-push ] || manque "le hook pre-push est absent (les hooks ne sont pas versionnés)." \
  "bash scripts/installer-hooks.sh"
[ -d node_modules ] || manque "node_modules est absent : esbuild et Biome sont introuvables." \
  "npm ci"
python3 -c "import playwright" 2>/dev/null || manque "le module Python playwright est absent." \
  "pip3 install --user playwright && python3 -m playwright install chromium"
python3 -c "import cv2" 2>/dev/null || manque "OpenCV est absent : verify_qr.py ne peut pas décoder." \
  "pip3 install --user opencv-python-headless numpy"
python3 -c "from playwright.sync_api import sync_playwright as s
p=s().start(); b=p.chromium.launch(); b.close(); p.stop()" 2>/dev/null \
  || manque "le binaire de navigateur de Playwright est absent ou périmé." \
     "python3 -m playwright install chromium"
echo "── état du poste : hook, dépendances, navigateur ✓ ──"

echo "── build ──"
npm run build

echo "── tests (unitaires) ──"
npm test

echo "── lint ──"
npm run lint

# ── VARIABLES INUTILISÉES, SUR LES FICHIERS DE CE TRAVAIL SEULEMENT ──
# `npm run lint` n'arme que noUndeclaredVariables et noUnusedImports.
# noUnusedVariables rend 63 avertissements sur les 138 fichiers du dépôt,
# presque tous antérieurs — l'armer partout rendrait `livrer.sh` rouge en
# permanence, donc ignoré. On l'arme donc SUR CE QU'ON VIENT D'ÉCRIRE.
# Pourquoi ça vaut la peine : le 22/08/2026, `GRIS` est devenu orphelin
# dans intro.js, aucun test n'a bronché, et c'est CODACY qui l'a signalé
# APRÈS le push. Cette classe de défaut n'était trouvable qu'en ligne.
# CE QUE ÇA N'EXERCE PAS (㉔) : les 63 existants restent invisibles, et
# un fichier qu'on ne touche pas peut pourrir sans que rien ne le dise.
# C'est assumé — voir le refus de la passe groupée dans POINTS-SIGNALES.
# ⚠️ LA LISTE PASSE PAR xargs, PAS PAR UNE VARIABLE DÉPLIÉE. Écrite
# `npx biome … $MODIFIES`, elle marche sous bash et CASSE sous zsh : zsh
# ne découpe pas une variable non quotée, biome recevait donc UN seul
# argument « intro.js » espace compris et rendait « No such file or
# directory » — un ROUGE, mais pas celui qu'on croit. Le contrôle
# négatif l'a vu du premier coup : il attendait le nom d'une variable
# orpheline et a lu une erreur d'entrée/sortie.
LISTE_JS="$(mktemp)"
git diff --name-only --diff-filter=ACM HEAD -- '*.js' '*.mjs' > "$LISTE_JS" 2>/dev/null || true
if [ -s "$LISTE_JS" ]; then
  echo "── variables inutilisées ($(wc -l < "$LISTE_JS" | tr -d ' ') fichier(s) de ce travail) ──"
  # `--error-on-warnings` N'EST PAS DÉCORATIF : biome classe
  # noUnusedVariables en AVERTISSEMENT et rend 0. Sans ce drapeau, le
  # contrôle nommait bien la variable orpheline… et laissait passer la
  # livraison. Deuxième chose que le contrôle négatif a attrapée ici.
  xargs npx --no-install biome lint --error-on-warnings \
        --only=correctness/noUnusedVariables < "$LISTE_JS"
fi
rm -f "$LISTE_JS"

if [ "$LENTS" = "1" ]; then
  echo "── filets navigateur ──"
  # Les serveurs locaux que les filets attendent, montés et démontés
  # ici : trois fois, un filet a échoué parce que le serveur d'une
  # session précédente était tombé — un ROUGE qui n'accusait pas le
  # produit.
  #
  # DEUX PORTS, ET C'EST UN DÉFAUT RATTRAPÉ : ce script ne montait que
  # le 8123, alors que trois filets sur cinq interrogent le 8124. Ils
  # passaient parce qu'un serveur lancé à la main traînait sur la
  # machine — sur un poste propre, la livraison aurait échoué au
  # premier filet, et pour une raison qui n'aurait rien eu à voir avec
  # le produit. Exactement ce que le commentaire ci-dessus prétendait
  # avoir corrigé. Unifier les ports serait mieux ; monter les deux est
  # ce qui rend la parade vraie tout de suite.
  # ET ON VÉRIFIE QUE LE SERVEUR QUI RÉPOND EST LE NÔTRE. Mesuré :
  # si le port est déjà pris, `http.server` meurt aussitôt, `set -e` ne
  # le voit pas — c'est une tâche de fond — et le serveur DÉJÀ EN PLACE
  # continue de répondre. Les filets tournaient alors contre un autre
  # arbre, parfois un autre dépôt, et rendaient vert ou rouge sans que
  # ça parle du produit. Deux contrôles : le processus est vivant, ET
  # ce qui sort du port est identique à l'octet au fichier local.
  PIDS=""
  trap 'kill $PIDS 2>/dev/null || true' EXIT
  for PORT in 8123 8124; do
    # LA FILE D'ACCEPTATION, PAS LE THREADING. Mesure du 23/08/2026 sur
    # 40 requêtes concurrentes — la charge que Playwright produit avec ses
    # contextes parallèles :
    #   `python3 -m http.server`         :  6 OK / 34 ÉCHECS
    #   ThreadingHTTPServer seul         : 12 OK / 28 ÉCHECS
    #   l'un OU l'autre + backlog à 128  : 40 OK /  0 ÉCHEC
    #
    # `request_queue_size` est le backlog de listen() : la file des
    # connexions EN ATTENTE d'accept(). Elle n'en retient que 5 par défaut
    # (TCPServer) ; au-delà le noyau refuse en ECONNREFUSED tant que la
    # boucle n'a pas repris la main. Les refus arrivent en 0,0 s — ce sont
    # bien des refus immédiats, jamais des expirations.
    #
    # LE THREADING N'EST PAS CE QUI CORRIGE, et la mesure le dit : mono
    # + backlog 128 rend déjà 40/0. Il est gardé par prudence pour ne pas
    # sérialiser les requêtes une fois acceptées — **non mesuré, aucun gain
    # observé sur les 40 requêtes du protocole**.
    #
    # CE QUE ÇA EXPLIQUE (n°38) : les faux rouges « juste après un rendu
    # Playwright lourd » étaient le serveur qui refusait, pas l'app qui
    # tardait. Relever les bornes au premier lot masquait un défaut
    # d'INSTRUMENT.
    #
    # Le port passe par argv et non par interpolation dans le corps Python :
    # une interpolation ratée donnerait une SyntaxError, donc un processus
    # mort, donc le message « le port est déjà pris » — un diagnostic FAUX.
    python3 -c '
import sys
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
ThreadingHTTPServer.request_queue_size = 128
ThreadingHTTPServer(("127.0.0.1", int(sys.argv[1])), SimpleHTTPRequestHandler).serve_forever()
' "$PORT" > /dev/null 2>&1 &
    PIDS="$PIDS $!"
    sleep 1
    if ! kill -0 ${PIDS##* } 2>/dev/null; then
      echo "LIVRAISON REFUSÉE — le port $PORT est déjà pris."
      echo "   Un serveur d'une autre session répondrait à la place, et"
      echo "   les filets mesureraient un autre arbre que celui-ci."
      echo "   Ferme-le :  lsof -ti:$PORT | xargs kill"
      exit 1
    fi
    if ! curl -sf "http://localhost:$PORT/index.html" | cmp -s - index.html; then
      echo "LIVRAISON REFUSÉE — le port $PORT ne sert pas CE dépôt."
      echo "   Le processus est vivant mais son contenu ne correspond pas."
      exit 1
    fi
  done
  sleep 1
  python3 verify_tutorial.py
  python3 verify_touch.py
  python3 verify_qr.py
  python3 verify_trade_inbox.py
  python3 verify_zone.py
  python3 verify_vitrine.py
  # La trace porte l'ARBRE mesuré, pas le SHA de HEAD. HEAD au moment
  # où ce script tourne est le commit d'AVANT — dans le flux normal
  # (livrer, commiter, pousser) il ne correspond JAMAIS au commit
  # poussé, donc le hook avertissait à chaque livraison correcte. Un
  # avertissement systématiquement faux se fait ignorer, et le jour où
  # les filets n'auront vraiment pas tourné, la même ligne ne dira plus
  # rien à personne (POINTS-SIGNALES n°40).
  #
  # `git stash create` rend l'arbre des modifications SUIVIES — les
  # fichiers non suivis n'y entrent pas, mesuré : une session qui
  # travaille en parallèle avec ses propres brouillons ne déclenche
  # rien. C'est ce qui empêche le correctif de ⑲ de réintroduire ⑲.
  #
  # LE REPLI `${_S:-HEAD}` N'EST PAS UNE PRÉCAUTION DE STYLE. Sur un
  # arbre PROPRE, `git stash create` ne rend RIEN. Sans ce repli, le
  # hash serait vide et le garde avertirait à chaque livraison depuis
  # un état propre — c'est-à-dire dans le cas NOMINAL de la convention
  # « livrer.sh vert depuis un état propre ». Le correctif aurait été
  # pire que le défaut. Trouvé en cherchant un cas limite, pas en
  # écrivant : ce genre de ligne ne se relit pas, il se teste.
  _S=$(git stash create 2>/dev/null)
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $(git rev-parse "${_S:-HEAD}^{tree}" 2>/dev/null || echo '-')" > "$TRACE"
else
  echo "── filets navigateur SAUTÉS (LENTS=0) ──"
fi

echo
echo "TOUT EST VERT — la livraison peut partir."
