#!/usr/bin/env bash
# Publie un dossier sur la branche « resultats » sans toucher à la copie de travail (worktree à part).
#   scripts/publier_resultats.sh <dossier source> <destination dans la branche> <message> [fichier.json:dest ...]
# Deux publications en même temps : la seconde est refusée ; elle reprend la branche et réessaie (8 fois).
set -u
SRC="$1"; DEST="$2"; MSG="$3"; shift 3
EXTRA=("$@")
git config user.name "github-actions"
git config user.email "github-actions@users.noreply.github.com"
publier() {
  rm -rf /tmp/res && git worktree prune
  git fetch -q --depth=1 origin resultats || return 1
  git worktree add -q -f /tmp/res FETCH_HEAD || return 1
  mkdir -p "/tmp/res/$DEST"
  cp -r "$SRC/." "/tmp/res/$DEST/"
  for e in "${EXTRA[@]}"; do cp "${e%%:*}" "/tmp/res/${e#*:}"; done
  git -C /tmp/res add -A
  git -C /tmp/res commit -q -m "$MSG" || { echo "rien à publier"; return 0; }
  git -C /tmp/res push -q origin HEAD:resultats
}
for essai in 1 2 3 4 5 6 7 8; do
  if publier; then exit 0; fi
  echo "publication refusée (essai $essai), nouvel essai"
  sleep $((RANDOM % 20 + 10))
done
exit 1
