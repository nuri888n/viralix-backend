#!/bin/bash
set -e

BASE="http://127.0.0.1:3000"

echo "== Smoke Test =="

# 1) Login (oder registrieren, falls nötig)
TOKEN=$(curl -s -X POST "$BASE/api/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secret123"}' \
  | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')

if [ -z "$TOKEN" ]; then
  echo "kein Token, versuche Registrierung..."
  curl -s -X POST "$BASE/api/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"secret123"}' >/dev/null

  TOKEN=$(curl -s -X POST "$BASE/api/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"secret123"}' \
    | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
fi

echo "TOKEN len: ${#TOKEN}"

# 2) Projekt anlegen
PROJECT_ID=$(curl -s -X POST "$BASE/api/projects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"SmokeTest Project","description":"erstellt im Smoketest"}' \
  | sed -n 's/.*"id":\([0-9]*\).*/\1/p')

echo "PROJECT_ID=$PROJECT_ID"

# 3) Account anlegen
ACCOUNT_ID=$(curl -s -X POST "$BASE/api/projects/$PROJECT_ID/accounts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"platform":"INSTAGRAM","handle":"@smoketest"}' \
  | sed -n 's/.*"id":\([0-9]*\).*/\1/p')

echo "ACCOUNT_ID=$ACCOUNT_ID"

# 4) Post anlegen
POST_ID=$(curl -s -X POST "$BASE/api/projects/$PROJECT_ID/posts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"caption":"smoketest post ✨","status":"DRAFT","accountIds":['"$ACCOUNT_ID"']}' \
  | sed -n 's/.*"id":\([0-9]*\).*/\1/p')

echo "POST_ID=$POST_ID"

# 5) Abrufen & prüfen
echo "Projekt laden:"
curl -s -H "Authorization: Bearer $TOKEN" "$BASE/api/projects/$PROJECT_ID"

echo "Accounts laden:"
curl -s -H "Authorization: Bearer $TOKEN" "$BASE/api/projects/$PROJECT_ID/accounts"

echo "Posts laden:"
curl -s -H "Authorization: Bearer $TOKEN" "$BASE/api/projects/$PROJECT_ID/posts"

# 6) Cleanup (erst Post, dann Account, dann Projekt)
curl -s -X DELETE "$BASE/api/projects/$PROJECT_ID/posts/$POST_ID" \
  -H "Authorization: Bearer $TOKEN"

curl -s -X DELETE "$BASE/api/projects/$PROJECT_ID/accounts/$ACCOUNT_ID" \
  -H "Authorization: Bearer $TOKEN"

curl -s -X DELETE "$BASE/api/projects/$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN"

echo "== Smoketest fertig ✅ =="
