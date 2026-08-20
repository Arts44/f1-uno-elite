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
  python3 -m http.server 8123 > /dev/null 2>&1 &
  SRV=$!
  python3 -m http.server 8124 > /dev/null 2>&1 &
  SRV2=$!
  trap 'kill $SRV $SRV2 2>/dev/null || true' EXIT
  sleep 2
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
