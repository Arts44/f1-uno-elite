#!/usr/bin/env bash
# Libère les PORTS que les filets navigateur laissent occupés, et VÉRIFIE
# que la libération a pris.
#
# POURQUOI CE FICHIER EXISTE. Trois incidents en un seul chantier : des
# `nohup` tués avec l'appel d'outil parent, un serveur mort entre deux
# appels sans que le filet s'en aperçoive, et une charge machine à 420
# laissée par des essais interrompus. À la troisième occurrence, une
# consigne n'est plus une consigne — c'est une intention.
#
# ⚠ PÉRIMÈTRE VOLONTAIREMENT RÉDUIT AUX PORTS, ET C'EST LA LEÇON DU
# FICHIER (voir ㊱ au registre). Trois versions successives ont chassé les
# processus par MOTIF de ligne de commande. Les trois se sont trompées de
# cible sur ce poste :
#
#   1. `pgrep -cf` — **BSD `pgrep` n'a pas d'option `-c`** : erreur
#      d'usage, repli `|| echo 0`, aucun `pkill` jamais appelé, et
#      « ✅ propre » annoncé sur une machine saturée (㉜).
#   2. Motifs de ligne de commande — l'essai à blanc a montré la cible
#      RÉELLE : `chrome_crashpad_handler` matchait le crashpad de
#      **Claude.app**, deux motifs matchaient des **shells de la session
#      courante**, et le serveur n'était même pas trouvé (l'interpréteur
#      résolu s'appelle `Python`, pas `python3`).
#   3. `pgrep -f MOTIF -u UID` — BSD traite tout argument SUIVANT le motif
#      comme un motif supplémentaire : **41 processus visés**, dont
#      `containermanagerd` et Claude Helper. Ils n'ont survécu que parce
#      que les `kill` ont échoué faute d'appartenir à l'utilisateur.
#      C'est de la chance, pas de la conception.
#
# HORS PÉRIMÈTRE — À FAIRE À LA MAIN : les navigateurs Playwright
# résiduels (`~/Library/Caches/ms-playwright`). Aucune chasse par motif
# n'est reconduite ici. Les repérer, les lire, puis décider :
#     pgrep -u "$(id -u)" -fl "$HOME/Library/Caches/ms-playwright"
#
# ⚠ ET LA RESSOURCE N'EST PAS « LE PORT », C'EST « QUI ÉCOUTE SUR LE
# PORT ». Une première rédaction de cet en-tête affirmait que `lsof -ti`
# « rend exactement qui tient le port, sans faux positif possible ».
# C'est FAUX : `lsof -ti:8123` ne filtre ni le protocole ni l'état, donc
# il rend aussi tout processus ayant une connexion ÉTABLIE vers ce port —
# le navigateur client, voire l'application hôte. La réduction de
# périmètre aurait rouvert par ce chemin l'accident qu'elle fermait.
# D'où la forme retenue partout ici, et elle n'est pas négociable :
#     lsof -nP -iTCP:PORT -sTCP:LISTEN -t
# `-sTCP:LISTEN` est ce qui rend la cible sans ambiguïté. Sans lui, ce
# script tue des clients.
#
# PAS DE `set -e` : on veut que TOUS les contrôles soient joués, puis un
# verdict agrégé dans RESTE.
set -uo pipefail

# Recopie de table (㉘) : ces ports sont aussi écrits dans les verify_*.py
# et dans livrer.sh. TOUT NOUVEAU PORT DE FILET S'AJOUTE ICI — sans quoi
# un orphelin survivra et le « propre » sera mensonger.
PORTS=(8123 8124)
SEUIL_CHARGE=${SEUIL_CHARGE:-15}
# Une bascule de dry-run ne se teste pas par égalité : `--essais`, `-n`
# ou un `--essai` passé en $2 tomberaient silencieusement dans le mode
# destructeur. Tout argument non reconnu est une erreur, pas un défaut.
ESSAI=0
case "${1:-}" in
  '')       ;;
  --essai)  ESSAI=1 ;;
  *)        echo "argument inconnu : $1 (attendu : --essai, ou rien)" >&2; exit 2 ;;
esac
[ "$#" -gt 1 ] && { echo "trop d'arguments" >&2; exit 2; }

# Un seuil non numérique ferait basculer l'awk de comparaison en
# comparaison de CHAÎNES et perdrait l'alerte en silence (㉜).
case "${SEUIL_CHARGE:-15}" in
  ''|*[!0-9.]*) echo "SEUIL_CHARGE non numérique : $SEUIL_CHARGE" >&2; exit 2 ;;
esac

# `-sTCP:LISTEN` : voir l'en-tête. Ne JAMAIS revenir à `lsof -ti:PORT`.
tenants() { lsof -nP -iTCP:"$1" -sTCP:LISTEN -t 2>/dev/null || true; }
compte() { grep -c . ; }

# état d'un port : 0 = libre · 1 = occupé · 2 = ILLISIBLE.
#
# Ce troisième état est le cœur du fichier. `tenants` termine par
# `|| true` pour ne pas mourir sous `pipefail` — mais du coup un `lsof`
# absent, en échec ou tronqué par un bac à sable rend une sortie VIDE,
# strictement indiscernable de « port libre ». Le script annoncerait
# alors « ✅ propre » sans avoir rien regardé : ㉜ dans le fichier même
# qui cite ㉜ deux fois. On lit donc le code de retour de `lsof` — 0 avec
# sortie = occupé, 1 = aucun tenant, TOUT LE RESTE (y compris 0 avec une
# sortie vide, qui est anormal) = illisible, et illisible remonte
# jusqu'au verdict.
etat_port() {
  local out rc
  out=$(lsof -nP -iTCP:"$1" -sTCP:LISTEN -t 2>/dev/null); rc=$?
  case "$rc" in
    0) [ -n "$out" ] && return 1 || return 2 ;;
    1) return 0 ;;
    *) return 2 ;;
  esac
}

# nombre de ports NON confirmés libres ; un port illisible compte comme
# restant — ne pas savoir n'est pas rien à signaler.
restants() {
  local r=0 p
  for p in "${PORTS[@]}"; do etat_port "$p" || r=$(( r + 1 )); done
  echo "$r"
}

if [ "$ESSAI" = 1 ]; then
  echo "── ESSAI À BLANC — rien ne sera libéré ──"
  for p in "${PORTS[@]}"; do
    for pid in $(tenants "$p"); do
      printf "   port %-6s %-7s %s\n" "$p" "$pid" "$(ps -o command= -p "$pid" 2>/dev/null | cut -c1-58)"
    done
  done
  echo "  total visé : $(restants)"
  # PAS exit 0 : l'exit code de ce script EST son verdict, et un essai à
  # blanc n'en rend aucun. 2 = « ce n'est pas un verdict ».
  exit 2
fi

echo "── libération ──"
for p in "${PORTS[@]}"; do
  n=$(tenants "$p" | compte)
  : "${n:=0}"        # compte muet (grep introuvable) ≠ « un tenant »
  if [ "$n" != "0" ]; then
    tenants "$p" | xargs kill 2>/dev/null || true
    echo "   port $p : $n processus visé(s)"
  fi
done

# Attendre la CONDITION, pas une durée — puis escalader. Un serveur avec
# connexions ouvertes n'obéit pas toujours à TERM du premier coup.
for _ in $(seq 1 10); do
  reste=$(restants)
  [ "$reste" = "0" ] && break
  sleep 1
done
if [ "${reste:-0}" != "0" ]; then
  echo "── récalcitrants : escalade en -9 ──"
  # xargs sur entrée vide : n'exécute rien sur ce BSD xargs (vérifié).
  # Sous GNU xargs il faudrait `-r`.
  for p in "${PORTS[@]}"; do tenants "$p" | xargs kill -9 2>/dev/null || true; done
  # Là aussi la CONDITION, pas une durée — l.74 le revendiquait déjà et
  # un `sleep 2` fixe la contredisait.
  for _ in $(seq 1 10); do
    reste=$(restants)
    [ "$reste" = "0" ] && break
    sleep 1
  done
fi

echo "── vérification ──"
RESTE=0
for p in "${PORTS[@]}"; do
  etat_port "$p"; case "$?" in
    0) echo "   port $p : libre" ;;
    1) echo "   port $p : ENCORE OCCUPÉ"; RESTE=1 ;;
    *) echo "   port $p : ÉTAT ILLISIBLE (lsof muet) — verdict impossible"; RESTE=1 ;;
  esac
done

# La charge moyenne DÉCROÎT lentement — constante de temps ~60 s, mesuré :
# 420 → 153 en une minute. Un seuil dépassé ici ne signale donc pas un
# processus vivant, mais une traîne récente : toute mesure lancée
# maintenant serait faussée sans le savoir. C'est aussi le SEUL signal que
# ce script conserve sur les navigateurs orphelins, qu'il ne tue plus.
#
# `sysctl vm.loadavg` plutôt qu'un grep sur `uptime` : ce dernier dépend
# du format et de la locale (une virgule décimale ne matcherait rien,
# CHARGE serait vide, et l'awk malformé rendrait rc≠0 — donc AUCUNE
# alerte, ㉜ à nouveau).
CHARGE=$(sysctl -n vm.loadavg 2>/dev/null | awk '{print $2}')
[ -z "$CHARGE" ] && CHARGE=$(cut -d' ' -f1 /proc/loadavg 2>/dev/null)
if [ -z "$CHARGE" ]; then
  echo "── charge ILLISIBLE — verdict impossible ──"   # ne pas savoir ≠ rien à signaler
  RESTE=1
else
  echo "── charge 1 min : $CHARGE (seuil $SEUIL_CHARGE) ──"
  if awk -v c="$CHARGE" -v s="$SEUIL_CHARGE" 'BEGIN{exit !(c>s)}'; then
    echo "   ⚠ TRAÎNE ENCORE ÉLEVÉE — attendre avant de mesurer quoi que ce soit."
    echo "     Décroissance observée : environ 15 % toutes les 10 s."
    echo "     Penser aux navigateurs Playwright, hors périmètre (voir en-tête)."
    RESTE=1
  fi
fi

[ "$RESTE" = "0" ] && echo "✅ propre — une campagne peut partir." \
                   || echo "❌ pas propre — ne pas mesurer maintenant."
exit "$RESTE"

# ── CONTRÔLE NÉGATIF, À REJOUER APRÈS TOUTE MODIFICATION ──────────────
#   cd <racine> && python3 -m http.server 8123 >/dev/null 2>&1 &
#   sleep 1 && bash scripts/nettoyer-filets.sh
# ATTENDU : « port 8123 : 1 processus visé(s) », puis « port 8123 : libre ».
# Si le script annonce 0 visé alors qu'un serveur tourne, il est revenu à
# son défaut d'origine. DEUX LIGNES — et les trois versions fausses de ce
# fichier ont toutes été écrites sans l'avoir jouée (㊱).
#
# ── SECOND CONTRÔLE NÉGATIF : CASSER LE GARDE, PAS CE QU'IL SURVEILLE ──
# ㉜(c) l'exige, et le contrôle ci-dessus ne l'exerce pas : il joue le
# chemin nominal. Celui-ci rend `lsof` introuvable et vérifie que le
# script REFUSE de conclure au lieu d'annoncer « propre » :
#   env PATH=/nonexistent /bin/bash scripts/nettoyer-filets.sh ; echo "rc=$?"
# (chemin ABSOLU du shell : avec `bash` nu, PATH vidé empêche de trouver
#  bash lui-même et le contrôle rend rc=127 sans avoir rien éprouvé.)
# ATTENDU : « port 8123 : ÉTAT ILLISIBLE » et rc=1.
# AVANT correction, ce cas rendait « ✅ propre » par les ports (il ne
# tombait que par la branche « charge illisible » — de la chance).
#
# CE QU'IL NE FAIT PAS (㉔) :
#   · il ne tue AUCUN navigateur Playwright résiduel — hors périmètre,
#     à faire à la main, voir l'en-tête ;
#   · il ne distingue pas un serveur légitime d'une autre session en cours
#     de livraison — à n'utiliser qu'ENTRE deux campagnes, jamais pendant ;
#   · il ne voit rien d'un processus de mesure resté sans port (un script
#     Python suspendu). Seule la charge le signalera ;
#   · lancé depuis un outillage sandboxé, `lsof` peut ne voir qu'un
#     sous-ensemble des processus — un « propre » obtenu là n'a pas la
#     même valeur qu'en terminal.
