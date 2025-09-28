#!/usr/bin/env bash
set -euo pipefail

# ===== Config =====
BASE="${BASE:-http://127.0.0.1:3000}"
EMAIL="${EMAIL:-test@example.com}"
PASSWORD="${PASSWORD:-secret123}"
NAME="${NAME:-Test User}"

# ===== Helpers =====
need() { command -v "$1" >/dev/null 2>&1 || { echo "❌ '$1' nicht gefunden"; exit 1; }; }
jq_s() { jq -r "$1" 2>/dev/null || true; }

need curl
need jq

say() { echo -e "\n—— $*"; }

# ===== 0) Healthcheck =====
say "Healthcheck: $BASE/health"
if ! curl -fsS "$BASE/health" | jq '.status' | grep -q '"ok"'; then
  echo "❌ Backend nicht erreichbar oder /health != ok"
  exit 1
fi
echo "✅ Backend OK"

# ===== 1) Login (oder Register → Login) =====
say "Login… ($EMAIL)"
TOKEN="$(curl -fsS -X POST "$BASE/api/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | jq_s '.token // empty')"

if [[ -z "$TOKEN" ]]; then
  say "User nicht vorhanden? Registriere…"
  curl -fsS -X POST "$BASE/api/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"$NAME\"}" >/dev/null

  say "Login (zweiter Versuch)…"
  TOKEN="$(curl -fsS -X POST "$BASE/api/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | jq_s '.token // empty')"
fi

if [[ -z "$TOKEN" ]]; then
  echo "❌ Login fehlgeschlagen"
  exit 1
fi
echo "✅ Login OK (Tokenlen: ${#TOKEN})"

# ===== 2) Projekt anlegen =====
say "Projekt anlegen…"
PROJECT_ID="$(curl -fsS -X POST "$BASE/api/projects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo Project","description":"smoketest"}' | jq_s '.id')"

if [[ -z "$PROJECT_ID" ]]; then
  echo "❌ Konnte Projekt-ID nicht lesen"
  exit 1
fi
echo "✅ Projekt ID: $PROJECT_ID"

# ===== 3) Account anlegen =====
say "Account anlegen…"
ACCOUNT_ID="$(curl -fsS -X POST "$BASE/api/projects/$PROJECT_ID/accounts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"platform":"INSTAGRAM","handle":"@nuritest"}' | jq_s '.id')"

if [[ -z "$ACCOUNT_ID" ]]; then
  echo "❌ Konnte Account-ID nicht lesen"
  exit 1
fi
echo "✅ Account ID: $ACCOUNT_ID"

# ===== 4) Post anlegen =====
say "Post anlegen…"
POST_ID="$(curl -fsS -X POST "$BASE/api/projects/$PROJECT_ID/posts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"caption\":\"mein erster post ✨\",\"status\":\"DRAFT\",\"accountIds\":[$ACCOUNT_ID]}" | jq_s '.id')"

if [[ -z "$POST_ID" ]]; then
  echo "❌ Konnte Post-ID nicht lesen"
  exit 1
fi
echo "✅ Post ID: $POST_ID"

# ===== 5) Prüfen (GET) =====
say "GET /api/projects/$PROJECT_ID"
PROJ_JSON="$(curl -fsS -H "Authorization: Bearer $TOKEN" "$BASE/api/projects/$PROJECT_ID")"
echo "$PROJ_JSON" | jq '.' >/dev/null || true

# minimale Checks
HAS_ACC="$(echo "$PROJ_JSON" | jq -r '.accounts | length')"
HAS_POSTS="$(echo "$PROJ_JSON" | jq -r '.posts | length')"
if [[ "$HAS_ACC" -lt 1 || "$HAS_POSTS" -lt 1 ]]; then
  echo "❌ Projekt enthält nicht die erwarteten Ressourcen (accounts=$HAS_ACC, posts=$HAS_POSTS)"
  exit 1
fi
echo "✅ Projekt enthält Account & Post"

# ===== 6) Aufräumen (Delete in richtiger Reihenfolge) =====
say "Löschen: Post → Account → Projekt"
curl -fsS -X DELETE "$BASE/api/projects/$PROJECT_ID/posts/$POST_ID" -H "Authorization: Bearer $TOKEN" >/dev/null
curl -fsS -X DELETE "$BASE/api/projects/$PROJECT_ID/accounts/$ACCOUNT_ID" -H "Authorization: Bearer $TOKEN" >/dev/null
curl -fsS -X DELETE "$BASE/api/projects/$PROJECT_ID" -H "Authorization: Bearer $TOKEN" >/dev/null
echo "✅ Alles gelöscht"

# ===== 7) Final check =====
say "Finaler Check (Projekt sollte weg sein)…"
NOT_FOUND="$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE/api/projects/$PROJECT_ID" | jq -r '.error // empty')"
if [[ "$NOT_FOUND" != "project_not_found" ]]; then
  echo "❌ Projekt existiert noch (oder unerwartete Antwort)"
  exit 1
fi

echo -e "\n🎉 SMOKETEST PASS\n"
