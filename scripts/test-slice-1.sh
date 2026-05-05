#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# Slice 1 smoke test — exercises the full auth flow end-to-end.
#
# Covers:
#   POST /auth/register
#   GET  /auth/verify-email/:token
#   POST /auth/login
#   POST /auth/resend-verification
#
# Requires the docker compose stack to be reachable on localhost. By default the
# script will bring up postgres + auth itself if --no-up is not passed. It does
# not require the web container.
#
# Usage (from the repo root, run via WSL on Windows):
#   wsl bash scripts/test-slice-1.sh
#   wsl bash scripts/test-slice-1.sh --no-up   # assume stack already running
#
# Exit code: 0 if every step passes, 1 on the first failure.
# -----------------------------------------------------------------------------

set -euo pipefail

AUTH_URL="${AUTH_URL:-http://localhost:4001}"
PG_CONTAINER="${PG_CONTAINER:-commons-fabric-poc-postgres-1}"
PG_USER="${PG_USER:-cfp}"
PG_DB="${PG_DB:-cfp_dev}"
BRING_UP=1
EMAIL="slice1-smoketest+$(date +%s)@example.com"
PASSWORD="testpass123"

for arg in "$@"; do
  case "$arg" in
    --no-up) BRING_UP=0 ;;
    -h|--help)
      grep '^#' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) echo "Unknown arg: $arg" >&2; exit 2 ;;
  esac
done

# ANSI helpers — no color if not a TTY.
if [ -t 1 ]; then
  C_GREEN=$'\033[32m'; C_RED=$'\033[31m'; C_DIM=$'\033[2m'; C_RESET=$'\033[0m'
else
  C_GREEN=''; C_RED=''; C_DIM=''; C_RESET=''
fi

pass() { echo "${C_GREEN}✓${C_RESET} $1"; }
fail() { echo "${C_RED}✗${C_RESET} $1" >&2; exit 1; }
step() { echo; echo "${C_DIM}--- $1 ---${C_RESET}"; }

if [ "$BRING_UP" = "1" ]; then
  step "Bringing up postgres + auth (this may take a moment on first run)"
  docker compose up -d postgres auth >/dev/null
  # Wait for auth /health.
  for i in 1 2 3 4 5 6 7 8 9 10; do
    if curl -sf "$AUTH_URL/health" >/dev/null 2>&1; then break; fi
    sleep 1
  done
fi

step "Health check"
curl -sf "$AUTH_URL/health" >/dev/null || fail "auth /health did not respond"
pass "auth service is healthy"

step "POST /auth/register without displayName (should 400)"
MISSING_CODE=$(curl -s -o /tmp/cfp_missing_body -w "%{http_code}" \
  -X POST "$AUTH_URL/auth/register" \
  -H "Content-Type: application/json" \
  --data-raw "{\"email\":\"missing-display+$(date +%s)@example.com\",\"password\":\"$PASSWORD\"}")
[ "$MISSING_CODE" = "400" ] || fail "register without displayName expected 400, got $MISSING_CODE (body: $(cat /tmp/cfp_missing_body))"
pass "register without displayName correctly rejected with 400"

step "POST /auth/register ($EMAIL) with full profile"
DISPLAY_NAME="Slice Tester"
FIRSTNAME="Slice"
LASTNAME="Tester"
POSTAL_CODE="M5V"
CITY="Toronto"
PHONE="+15555550100"
REGISTER_BODY=$(curl -s -o /tmp/cfp_register_body -w "%{http_code}" \
  -X POST "$AUTH_URL/auth/register" \
  -H "Content-Type: application/json" \
  --data-raw "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"displayName\":\"$DISPLAY_NAME\",\"firstname\":\"$FIRSTNAME\",\"lastname\":\"$LASTNAME\",\"postalCode\":\"$POSTAL_CODE\",\"city\":\"$CITY\",\"phone\":\"$PHONE\"}")
[ "$REGISTER_BODY" = "201" ] || fail "register expected 201, got $REGISTER_BODY (body: $(cat /tmp/cfp_register_body))"
pass "register returned 201"

step "Confirm profile fields persisted"
PROFILE=$(docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -tA \
  -c "SELECT \"displayName\" || '|' || COALESCE(firstname,'') || '|' || COALESCE(lastname,'') || '|' || COALESCE(\"postalCode\",'') || '|' || COALESCE(city,'') || '|' || COALESCE(phone,'') FROM \"User\" WHERE email='$EMAIL';")
EXPECTED="$DISPLAY_NAME|$FIRSTNAME|$LASTNAME|$POSTAL_CODE|$CITY|$PHONE"
[ "$PROFILE" = "$EXPECTED" ] || fail "profile mismatch — got '$PROFILE', expected '$EXPECTED'"
pass "displayName / firstname / lastname / postalCode / city / phone all persisted"

step "Read verification token from database"
TOKEN=$(docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -tA \
  -c "SELECT \"emailVerificationToken\" FROM \"User\" WHERE email='$EMAIL';" | tr -d '[:space:]')
[ -n "$TOKEN" ] || fail "no token found for $EMAIL"
pass "token captured (${TOKEN:0:12}…)"

step "GET /auth/verify-email/:token"
VERIFY_CODE=$(curl -s -o /tmp/cfp_verify_body -w "%{http_code}" \
  "$AUTH_URL/auth/verify-email/$TOKEN")
[ "$VERIFY_CODE" = "200" ] || fail "verify expected 200, got $VERIFY_CODE (body: $(cat /tmp/cfp_verify_body))"
pass "verify returned 200"

step "GET /auth/verify-email/:token a second time (token is single-use)"
# Regression guard for the React StrictMode double-fire bug: the UI used to
# show "expired" on success because the second call always failed. The server
# behavior we depend on is that the second call returns 400, so the client
# guard is the only thing keeping the success state from being overwritten.
REVERIFY_CODE=$(curl -s -o /tmp/cfp_reverify_body -w "%{http_code}" \
  "$AUTH_URL/auth/verify-email/$TOKEN")
[ "$REVERIFY_CODE" = "400" ] || fail "second verify expected 400, got $REVERIFY_CODE (body: $(cat /tmp/cfp_reverify_body))"
pass "second verify correctly returns 400 (token is single-use)"

step "Confirm emailVerifiedAt set in DB"
VERIFIED_AT=$(docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -tA \
  -c "SELECT \"emailVerifiedAt\" FROM \"User\" WHERE email='$EMAIL';" | tr -d '[:space:]')
[ -n "$VERIFIED_AT" ] || fail "emailVerifiedAt is still null"
pass "emailVerifiedAt = $VERIFIED_AT"

step "POST /auth/login"
LOGIN_CODE=$(curl -s -o /tmp/cfp_login_body -w "%{http_code}" \
  -c /tmp/cfp_login_cookies \
  -X POST "$AUTH_URL/auth/login" \
  -H "Content-Type: application/json" \
  --data-raw "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
[ "$LOGIN_CODE" = "200" ] || fail "login expected 200, got $LOGIN_CODE (body: $(cat /tmp/cfp_login_body))"
grep -q '"accessToken"' /tmp/cfp_login_body || fail "login response missing accessToken"
grep -q 'cfp_refresh_token' /tmp/cfp_login_cookies || fail "login response missing refresh cookie"
pass "login returned access token + httpOnly refresh cookie"

step "POST /auth/refresh with cookie"
REFRESH_CODE=$(curl -s -o /tmp/cfp_refresh_body -w "%{http_code}" \
  -b /tmp/cfp_login_cookies \
  -X POST "$AUTH_URL/auth/refresh")
[ "$REFRESH_CODE" = "200" ] || fail "refresh expected 200, got $REFRESH_CODE (body: $(cat /tmp/cfp_refresh_body))"
grep -q '"accessToken"' /tmp/cfp_refresh_body || fail "refresh response missing accessToken"
pass "refresh returned a new access token from the cookie session"

step "POST /auth/resend-verification (already verified — should no-op)"
RESEND_CODE=$(curl -s -o /tmp/cfp_resend_body -w "%{http_code}" \
  -X POST "$AUTH_URL/auth/resend-verification" \
  -H "Content-Type: application/json" \
  --data-raw "{\"email\":\"$EMAIL\"}")
[ "$RESEND_CODE" = "200" ] || fail "resend expected 200, got $RESEND_CODE"
grep -q "already verified" /tmp/cfp_resend_body || fail "resend response did not indicate already-verified state"
pass "resend correctly no-ops on verified account"

step "Cleanup"
docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" \
  -c "DELETE FROM \"User\" WHERE email='$EMAIL';" >/dev/null
pass "test user removed"

echo
echo "${C_GREEN}Slice 1: all checks passed.${C_RESET}"
