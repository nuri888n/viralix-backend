#!/usr/bin/env bash
set -euo pipefail

BASE="${BASE:-http://localhost:3000}"

log(){ printf "\n=== %s ===\n" "$*"; }

wait_for_server() {
  log "Warte auf Server unter $BASE ..."
  for i in {1..30}; do
    if curl -fsS "$BASE/health" >/dev/null 2>&1 || curl -fsS "$BASE/debug/token/1" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.5
  done
  echo "❌ Server nicht erreichbar unter $BASE" >&2
  exit 1
}

authH(){ printf "Authorization: Bearer %s" "$TOKEN"; }

# ========== Ablauf ==========
wait_for_server

log "Hole Token"
TOKEN="$(curl -s "$BASE/debug/token/1" | jq -r .token)"

log "Accounts anlegen (INSTAGRAM/TIKTOK)"
ACC_IG="$(curl -s -X POST "$BASE/accounts" \
  -H "$(authH)" -H "Content-Type: application/json" \
  -d '{"projectId":1,"platform":"INSTAGRAM","handle":"@qa_ig"}' | jq -r .id)"
ACC_TT="$(curl -s -X POST "$BASE/accounts" \
  -H "$(authH)" -H "Content-Type: application/json" \
  -d '{"projectId":1,"platform":"TIKTOK","handle":"@qa_tt"}' | jq -r .id)"
echo "ACC_IG=$ACC_IG ACC_TT=$ACC_TT"

log "Post erstellen"
POST_ID="$(curl -s -X POST "$BASE/posts" \
  -H "$(authH)" -H "Content-Type: application/json" \
  -d '{"projectId":1,"caption":"hello from qa"}' | jq -r .id)"
echo "POST_ID=$POST_ID"

log "Accounts ↔ Post append"
curl -s -X PATCH "$BASE/posts/$POST_ID/accounts" \
  -H "$(authH)" -H "Content-Type: application/json" \
  -d "{\"accountIds\":[${ACC_IG},${ACC_TT}],\"mode\":\"append\"}" | jq .

log "Accounts ↔ Post replace (nur IG behalten)"
curl -s -X PATCH "$BASE/posts/$POST_ID/accounts" \
  -H "$(authH)" -H "Content-Type: application/json" \
  -d "{\"accountIds\":[${ACC_IG}],\"mode\":\"replace\"}" | jq .

log "Post caption updaten"
curl -s -X PUT "$BASE/posts/$POST_ID" \
  -H "$(authH)" -H "Content-Type: application/json" \
  -d '{"caption":"updated by qa script"}' | jq .

log "Post anzeigen (final)"
curl -s "$BASE/posts/$POST_ID" -H "$(authH)" | jq .

if [[ "${CLEANUP:-0}" == "1" ]]; then
  log "Cleanup aktiv – lösche Testdaten"
  curl -s -X DELETE "$BASE/posts/$POST_ID" -H "$(authH)" | jq .
  [[ -n "${ACC_IG:-}" ]] && curl -s -X DELETE "$BASE/accounts/$ACC_IG" -H "$(authH)" | jq .
  [[ -n "${ACC_TT:-}" ]] && curl -s -X DELETE "$BASE/accounts/$ACC_TT" -H "$(authH)" | jq .
fi

log "QA-Flow abgeschlossen ✅"
