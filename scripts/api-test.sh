#!/usr/bin/env bash
set -euo pipefail

BASE="http://127.0.0.1:3000"
EMAIL="demo@example.com"
PASSWORD="secret123"

echo "== 1) Healthcheck =="
curl -s $BASE/health | jq .

echo
echo "== 2) Login =="
TOKEN=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"'"$EMAIL"'","password":"'"$PASSWORD"'"}' | jq -r .token)
echo "TOKEN=$TOKEN"

echo
echo "== 3) Projekt anlegen =="
PROJECT_ID=$(curl -s -X POST $BASE/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"demo-project"}' | jq -r .id)
echo "PROJECT_ID=$PROJECT_ID"

echo
echo "== 4) Account anlegen =="
ACCOUNT_ID=$(curl -s -X POST $BASE/projects/$PROJECT_ID/accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"platform":"tiktok","username":"demoUser"}' | jq -r .id)
echo "ACCOUNT_ID=$ACCOUNT_ID"

echo
echo "== 5) Post anlegen =="
POST_ID=$(curl -s -X POST $BASE/projects/$PROJECT_ID/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"accountId":"'"$ACCOUNT_ID"'","caption":"hello from bash 🚀"}' | jq -r .id)
echo "POST_ID=$POST_ID"

echo
echo "== 6) Daten abrufen =="
curl -s $BASE/projects/$PROJECT_ID -H "Authorization: Bearer $TOKEN" | jq .

echo
echo "== 7) Cleanup (Post, Account, Project löschen) =="
curl -s -X DELETE $BASE/projects/$PROJECT_ID/posts/$POST_ID -H "Authorization: Bearer $TOKEN"
curl -s -X DELETE $BASE/projects/$PROJECT_ID/accounts/$ACCOUNT_ID -H "Authorization: Bearer $TOKEN"
curl -s -X DELETE $BASE/projects/$PROJECT_ID -H "Authorization: Bearer $TOKEN"

echo
echo "✅ Testdurchlauf fertig!"
