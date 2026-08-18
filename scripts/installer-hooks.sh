#!/usr/bin/env bash
# Installe le hook pre-push. Les hooks git NE SONT PAS VERSIONNÉS (le
# dépôt le sait déjà pour pre-commit) : ce script l'est, lui, pour que
# la parade se réinstalle en une commande après un clone.
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
