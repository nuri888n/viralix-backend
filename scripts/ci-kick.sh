#!/usr/bin/env bash
set -euo pipefail

BRANCH="${1:-main}"
MSG="${2:-ci: kick $(date -u +'%Y-%m-%dT%H:%M:%SZ')}"

echo "› Commit & Push auf $BRANCH …"
git add -A || true
git commit --allow-empty -m "$MSG" >/dev/null || true
git push origin "$BRANCH"

echo "› Warten auf GitHub Actions Run …"
./scripts/ci-wait.sh "$BRANCH"
