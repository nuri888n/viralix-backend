#!/usr/bin/env bash
set -euo pipefail

# ── Config ─────────────────────────────────────────────────────────────────────
BASE="${BASE:-http://127.0.0.1:3000}"

# Du kannst hier optional .env-Werte nutzen, falls vorhanden
EMAIL="${EMAIL:-demo@example.com}"
PASSWORD="${PASSWORD:-secret123}"

# Farben (optional)
GREEN="\033[32m"; RED="\033[31m"; YELLOW="\033[33m"; DIM="\033[2m"; NC="\033[0m"

# ── Helpers ────────────────────────────────────────────────────────────────────
need() { command -v "$1" >/dev/null 2>&1 || { echo -e "${RED}✗$NC '$1' fehlt. Bitte installieren."; exit 1; }; }
need curl
need jq

say() { echo -e "${YELLOW}▸$NC $*"; }
ok()  { echo -e "${GREEN}✓$NC $*"; }
err() { echo -e "${RED}✗$NC $*"; }

# Curl mit Standard-Headern
hcurl() {
  curl -sS -H "Content-Type: application/json" "$@"
}

# ── Healthcheck ────────────────────────────────────────────────────────────────
say "Healthcheck: $BASE/health"
if curl -s "$BASE/health" | jq -e '.status=="ok"' >/dev/null 2>&1; then
  ok "Backend up"
else
  err "Backend nicht erreichbar oder /health != ok"
  exit 1
fi

# ── Login (oder Registrierung, falls 401) ─────────────────────────────────────
say "Login für $EMAIL"
LOGIN_RES="$(hcurl -X POST "$BASE/api/login" \
  -d "$(jq -nc --arg e "$EMAIL" --arg p "$PASSWORD" '{email:$e,password:$p}')" || true)"

if echo "$LOGIN_RES" | jq -e '.token' >/dev/null 2>&1; then
  TOKEN="$(echo "$LOGIN_RES" | jq -r '.token')"
  ok "Login ok (Token geholt)"
else
  say "Login fehlgeschlagen – versuche Registrierung…"
  REG_RES="$(hcurl -X POST "$BASE/api/register" \
    -d "$(jq -nc --arg e "$EMAIL" --arg p "$PASSWORD" '{email:$e,password:$p}')" )"
  TOKEN="$(echo "$REG_RES" | jq -r '.token')"
  ok "Registriert & Token geholt"
fi

AUTH=(-H "Authorization: Bearer $TOKEN")

# ── Projekt anlegen ────────────────────────────────────────────────────────────
say "Projekt anlegen"
PROJECT_RES="$(curl -sS "${AUTH[@]}" -H "Content-Type: application/json" \
  -X POST "$BASE/api/projects" \
  -d "$(jq -nc '{name:"E2E Project",description:"created via e2e script"}')")"
PROJECT_ID="$(echo "$PROJECT_RES" | jq -r '.id')"
ok "Project ID=$PROJECT_ID"

# ── Account anlegen ────────────────────────────────────────────────────────────
say "Account anlegen (INSTAGRAM)"
ACCOUNT_RES="$(curl -sS "${AUTH[@]}" -H "Content-Type: application/json" \
  -X POST "$BASE/api/projects/$PROJECT_ID/accounts" \
  -d "$(jq -nc '{platform:"INSTAGRAM",handle:"@e2e_test"}')")"
ACCOUNT_ID="$(echo "$ACCOUNT_RES" | jq -r '.id')"
ok "Account ID=$ACCOUNT_ID"

# ── Post anlegen ───────────────────────────────────────────────────────────────
say "Post anlegen (DRAFT)"
POST_RES="$(curl -sS "${AUTH[@]}" -H "Content-Type: application/json" \
  -X POST "$BASE/api/projects/$PROJECT_ID/posts" \
  -d "$(jq -nc --argjson acc "$ACCOUNT_ID" '{caption:"hello from e2e ✨",status:"DRAFT",accountIds:[$acc]}')" )"
POST_ID="$(echo "$POST_RES" | jq -r '.id')"
ok "Post ID=$POST_ID"

# ── GETs prüfen ────────────────────────────────────────────────────────────────
say "Projekt lesen mit Relationen"
curl -sS "${AUTH[@]}" "$BASE/api/projects/$PROJECT_ID" | jq .

say "Accounts-Liste"
curl -sS "${AUTH[@]}" "$BASE/api/projects/$PROJECT_ID/accounts" | jq .

say "Posts-Liste"
curl -sS "${AUTH[@]}" "$BASE/api/projects/$PROJECT_ID/posts" | jq .

# ── Cleanup (Post, Account, dann Project) ─────────────────────────────────────
say "Cleanup (Post → Account → Project löschen)"
curl -sS "${AUTH[@]}" -X DELETE "$BASE/api/projects/$PROJECT_ID/posts/$POST_ID"     | jq .
curl -sS "${AUTH[@]}" -X DELETE "$BASE/api/projects/$PROJECT_ID/accounts/$ACCOUNT_ID" | jq .
curl -sS "${AUTH[@]}" -X DELETE "$BASE/api/projects/$PROJECT_ID"                    | jq .

ok "E2E fertig ✅"
