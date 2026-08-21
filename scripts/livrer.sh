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
    python3 -m http.server "$PORT" > /dev/null 2>&1 &
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
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $(git rev-parse HEAD 2>/dev/null || echo '-')" > "$TRACE"
else
  echo "── filets navigateur SAUTÉS (LENTS=0) ──"
fi

echo
echo "TOUT EST VERT — la livraison peut partir."
