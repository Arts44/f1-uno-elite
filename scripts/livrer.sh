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
