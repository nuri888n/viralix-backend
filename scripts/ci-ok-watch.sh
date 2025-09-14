#!/usr/bin/env bash
set -euo pipefail

REPO="nuri888n/viralix-backend"
WF="CI Smoke + E2E"
BR="main"

echo "⏳ warte auf nächsten Run von \"$WF\" auf $BR …"

last_id=""

while true; do
  # neuesten Run holen
  id=$(gh run list --repo "$REPO" --branch "$BR" --workflow "$WF" \
        --limit 1 --json databaseId --jq '.[0].databaseId' 2>/dev/null || echo "")

  if [[ -n "$id" && "$id" != "$last_id" ]]; then
    last_id="$id"
    echo "▶ beobachte Run $id"
  fi

  if [[ -n "$id" ]]; then
    state=$(gh run view "$id" --repo "$REPO" --json status,conclusion \
              --jq '[.status,.conclusion]|join(" ")')
    status=${state%% *}
    conclusion=${state#* }

    if [[ "$status" == "completed" ]]; then
      if [[ "$conclusion" == "success" ]]; then
        echo "✅ Run $id erfolgreich!"
      else
        echo "❌ Run $id fehlgeschlagen ($conclusion)"
      fi
      break
    else
      echo "… status: $status"
    fi
  fi

  sleep 10
done
