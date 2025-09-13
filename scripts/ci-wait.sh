#!/usr/bin/env bash
# ci-wait.sh - watch latest GitHub Actions run and report result

set -euo pipefail

BRANCH="${1:-main}"
INTERVAL="${INTERVAL:-15}" # sekunden zwischen checks

echo "🔎 warte auf workflow-run für branch '$BRANCH'..."

START=$(date +%s)

while true; do
  STATUS=$(gh run list --branch "$BRANCH" --limit 1 --json status,conclusion --jq '.[0].status + " " + (.[0].conclusion // "")')

  case "$STATUS" in
    "completed success")
      END=$(date +%s)
      ELAPSED=$((END - START))
      echo "✅ run success nach $((ELAPSED/60))m $((ELAPSED%60))s"
      exit 0
      ;;
    "completed failure")
      END=$(date +%s)
      ELAPSED=$((END - START))
      echo "❌ run failed nach $((ELAPSED/60))m $((ELAPSED%60))s"
      exit 1
      ;;
    *)
      echo "⏳ $STATUS (warte $INTERVALs...)"
      sleep "$INTERVAL"
      ;;
  esac
done
