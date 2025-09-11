#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

BASE="http://127.0.0.1:3000"
EMAIL="bob2@example.com"
PASS="secret6"

log() { printf "\n=== %s ===\n" "$*"; }

# 0) Health
log "Healthcheck"
curl -sS "$BASE/health" | sed 's/},{/},\n{/g'; echo

# 1) Login
log "Login"
TOKEN=$(curl -sS -X POST "$BASE/api/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" \
  | sed -E 's/.*"token":"?([^"]+)".*/\1/')
if [[ -z "${TOKEN:-}" || "$TOKEN" == "null" ]]; then
  echo "Login fehlgeschlagen – check Email/Passwort"; exit 1
fi
echo "TOKEN_LEN=${#TOKEN}"

# 2) Projekt anlegen
log "Projekt anlegen"
PROJECT_JSON=$(curl -sS -X POST "$BASE/api/projects" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Smoke Project","description":"Demo"}')
echo "$PROJECT_JSON"
PROJECT_ID=$(echo "$PROJECT_JSON" | sed -E 's/.*"id":([0-9]+).*/\1/')
echo "PROJECT_ID=$PROJECT_ID"

# 3) Account anlegen
log "Account anlegen"
ACCOUNT_JSON=$(curl -sS -X POST "$BASE/api/projects/$PROJECT_ID/accounts" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"platform":"TIKTOK","handle":"demo_handle"}')
echo "$ACCOUNT_JSON"
ACCOUNT_ID=$(echo "$ACCOUNT_JSON" | sed -E 's/.*"id":([0-9]+).*/\1/')
echo "ACCOUNT_ID=$ACCOUNT_ID"

# 4) Post anlegen (Draft)
log "Post (Draft) anlegen"
POST_JSON=$(curl -sS -X POST "$BASE/api/projects/$PROJECT_ID/posts" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"platform\":\"TIKTOK\",\"caption\":\"Hello world\",\"accountIds\":[${ACCOUNT_ID}]}");
echo "$POST_JSON"
POST_ID=$(echo "$POST_JSON" | sed -E 's/.*"id":([0-9]+).*/\1/')
echo "POST_ID=$POST_ID"

# 5) Post updaten (Caption)
log "Post Caption updaten"
curl -sS -X PATCH "$BASE/api/projects/$PROJECT_ID/posts/$POST_ID" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"caption":"Updated caption","status":"DRAFT"}' | sed 's/},{/},\n{/g'; echo

# 6) Post schedulen (+15min)
log "Post schedulen (+15min)"
WHEN=$(python3 - <<'PY'
from datetime import datetime, timedelta, timezone
print((datetime.now(timezone.utc)+timedelta(minutes=15)).strftime("%Y-%m-%dT%H:%M:%SZ"))
PY
)
echo "WHEN=$WHEN"
curl -sS -X PATCH "$BASE/api/projects/$PROJECT_ID/posts/$POST_ID" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"status\":\"SCHEDULED\",\"scheduledAt\":\"$WHEN\"}" | sed 's/},{/},\n{/g'; echo

# 7) Media setzen (optional)
log "Media URL setzen"
curl -sS -X PATCH "$BASE/api/projects/$PROJECT_ID/posts/$POST_ID" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"mediaUrl":"https://example.com/demo.jpg"}' | sed 's/},{/},\n{/g'; echo

# 8) Übersicht
log "Posts im Projekt listen"
curl -sS "$BASE/api/projects/$PROJECT_ID/posts" \
  -H "Authorization: Bearer $TOKEN" | sed 's/},{/},\n{/g'; echo

# 9) Cleanup (Post, Account, Projekt löschen)
log "Cleanup: Post löschen"
curl -sS -X DELETE "$BASE/api/projects/$PROJECT_ID/posts/$POST_ID" \
  -H "Authorization: Bearer $TOKEN"; echo

log "Cleanup: Account löschen"
curl -sS -X DELETE "$BASE/api/projects/$PROJECT_ID/accounts/$ACCOUNT_ID" \
  -H "Authorization: Bearer $TOKEN"; echo

log "Cleanup: Projekt löschen"
curl -sS -X DELETE "$BASE/api/projects/$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN"; echo

log "Fertig ✅"
