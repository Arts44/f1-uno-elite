#!/usr/bin/env bash
# Installe les hooks pre-push et pre-commit. Les hooks git NE SONT PAS
# VERSIONNÉS : ce script l'est, lui, pour que les parades se
# réinstallent en une commande après un clone.
set -euo pipefail
cd "$(dirname "$0")/.."
cat > .git/hooks/pre-push <<'HOOK'
#!/usr/bin/env bash
# ── PARADE MÉCANIQUE : refuse un push si les gardes sont rouges. ──
# Ne lance QUE ce qui est rapide (tests + lint, ~26 s). Les filets
# navigateur prennent des minutes ; un hook insupportable se contourne,
# donc on vérifie seulement qu'ils ont TOURNÉ sur ce commit.
set -uo pipefail
cd "$(git rev-parse --show-toplevel)"
echo "pre-push : tests + lint…"
if ! npm test > /tmp/prepush-test.log 2>&1; then
  echo "PUSH REFUSÉ — des tests échouent :"; grep -E "^# (pass|fail)" /tmp/prepush-test.log
  echo "   (détail : /tmp/prepush-test.log)"; exit 1
fi
if ! npm run lint > /tmp/prepush-lint.log 2>&1; then
  echo "PUSH REFUSÉ — lint rouge :"; tail -5 /tmp/prepush-lint.log; exit 1
fi
TRACE=".git/derniere-livraison"
HEAD_SHA=$(git rev-parse HEAD)
if [ -f "$TRACE" ] && grep -q "$HEAD_SHA" "$TRACE"; then
  echo "pre-push : filets navigateur passés sur ce commit ✓"
else
  echo "AVERTISSEMENT : les filets navigateur n'ont pas tourné sur CE commit."
  echo "   Lance scripts/livrer.sh, ou assume-le si le commit ne touche que la doc."
fi
echo "pre-push : vert."
HOOK
chmod +x .git/hooks/pre-push
echo "hook pre-push installé."

cat > .git/hooks/pre-commit <<'HOOK'
#!/usr/bin/env bash
# ══ UN ARTEFACT GÉNÉRÉ NE SE COMMITE QU'AVEC SES SOURCES ═══════════
# app/app.bundle.js est la sortie d'esbuild ET il est commité (GitHub
# Pages ne construit rien). Il porte donc UN ÉTAT DE PLUS que ses
# sources : l'instant où il a été construit, avec l'arbre de travail
# tel qu'il était à cet instant — modifications non commitées comprises.
#
# LE CAS RÉEL, 22/08/2026 : deux sessions Claude Code travaillaient sur
# ce dépôt. L'une avait app/changelog.js et app/sw.js modifiés et NON
# commités ; un `npm run build` lancé depuis l'autre aurait produit un
# bundle contenant ce travail en cours, et l'aurait commité sans que
# personne ne l'ait lu. Git n'aurait montré qu'un conflit sur une ligne
# minifiée de 300 Ko — illisible, non résoluble à la main, et le dernier
# `git add app/` gagne en silence.
#
# LA RÈGLE : le bundle ne se commite QUE dans le commit qui modifie ses
# sources, et jamais par une session qui n'a pas écrit ces sources.
#
# LA LISTE DES SOURCES N'EST PAS ÉCRITE ICI, ELLE EST LUE DANS LE
# SOURCEMAP DU BUNDLE QU'ON EST EN TRAIN DE COMMITER — c'est la seule
# liste qui ne se périme pas. Une liste tenue à la main dans ce hook
# serait une COPIE (㉘) : ajouter un module à app.js sans l'ajouter ici
# et le garde laisserait passer, en silence. Le sourcemap, lui, sait
# exactement ce qui est entré dans ce bundle-là.
# CE QUE ÇA EXCLUT AU PASSAGE, et c'est voulu : sw.js, translations.js,
# data-embedded.js, card-descriptions.js et cloud-config.js ne sont PAS
# des sources du bundle — ils sont chargés autrement. Les toucher
# n'autorise donc pas à commiter un bundle.
# ⚠️ NOMS DE VARIABLES EN ASCII, DELIBEREMENT. Ecrits accentues
# (`stagés`, `touchées`), ce hook rendait « No such file or directory »
# puis « unbound variable » selon le shell qui l'execute : le garde
# mourait AVANT sa verification, et laissait donc passer exactement ce
# qu'il devait refuser. Un garde qui plante est un garde qui autorise.
set -uo pipefail
cd "$(git rev-parse --show-toplevel)"

stages=$(git diff --cached --name-only --diff-filter=ACM)
echo "$stages" | grep -qx 'app/app.bundle.js' || exit 0

# Le sourcemap tel qu'il sera commité ; à défaut, celui du disque.
sourcemap=$(git show :app/app.bundle.js.map 2>/dev/null || cat app/app.bundle.js.map 2>/dev/null || true)
if [ -z "$sourcemap" ]; then
  echo "COMMIT REFUSÉ — app.bundle.js est stagé mais son sourcemap est"
  echo "   introuvable : impossible de savoir de quelles sources il sort."
  echo "   Lance  npm run build  puis stage les deux."
  exit 1
fi

sources=$(printf '%s' "$sourcemap" | python3 -c "
import json,sys
try: m=json.load(sys.stdin)
except Exception: sys.exit(3)
print('\n'.join('app/'+s.split('/')[-1] for s in m.get('sources',[])))
") || {
  echo "COMMIT REFUSÉ — sourcemap illisible."; exit 1; }

touchees=$(comm -12 <(echo "$stages" | sort -u) <(echo "$sources" | sort -u))
if [ -n "$touchees" ]; then
  echo "pre-commit : bundle accompagné de $(echo "$touchees" | wc -l | tr -d ' ') source(s) ✓"
  exit 0
fi

echo "════════════════════════════════════════════════════════════════"
echo "COMMIT REFUSÉ — app/app.bundle.js est stagé sans aucune de ses"
echo "   sources. Un bundle reconstruit depuis un arbre de travail qui"
echo "   contient le travail NON COMMITÉ d'une autre session emporte ce"
echo "   travail, sans conflit lisible."
echo
echo "   Sources du bundle non stagées, d'après son sourcemap :"
echo "   $(echo "$sources" | wc -l | tr -d ' ') fichiers, dont app.js, storage.js, render.js…"
echo
echo "   Si tu as vraiment voulu ne recommiter que l'artefact (mise à"
echo "   jour d'esbuild, par exemple), c'est une exception à assumer :"
echo "      git commit --no-verify"
echo "════════════════════════════════════════════════════════════════"
exit 1
HOOK
chmod +x .git/hooks/pre-commit
echo "hook pre-commit installé."
