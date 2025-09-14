#!/usr/bin/env bash
set -euo pipefail

REPO="nuri888n/viralix-backend"

# neuesten Run holen
RUN_ID="$(gh run list --repo "$REPO" --limit 1 --json databaseId --jq '.[0].databaseId')"
echo "▶ Run ID: $RUN_ID"

# versuchen, das server.log-Artifact zu laden
if gh run download "$RUN_ID" --repo "$REPO" --name server-log >/dev/null 2>&1; then
  echo "=== server.log (last 120 lines) ==="
  tail -n 120 server-log/server.log
else
  echo "⚠️ Kein Artifact 'server-log' gefunden – zeige Job-Logs."
  echo "=== Job-Namen ==="
  gh run view "$RUN_ID" --repo "$REPO" --json jobs --jq '.jobs[].name'
  echo
  echo "=== Letzte 200 Zeilen aller Job-Logs ==="
  gh run view "$RUN_ID" --repo "$REPO" --log | tail -n 200
fi
