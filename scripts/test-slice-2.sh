#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# Slice 2 smoke test — verification gating + subscribe + notification prefs.
#
# Covers:
#   - GraphQL `subscribeToCommunity` rejects unverified user with EMAIL_NOT_VERIFIED
#   - GraphQL `createCommunity` rejects unverified user with EMAIL_NOT_VERIFIED
#   - GraphQL `createEvent` rejects unverified user with EMAIL_NOT_VERIFIED
#     (verification gate fires before the community-role check)
#   - After email verification, `createCommunity` and `subscribeToCommunity` succeed
#   - `updateSubscription` persists per-community notification preferences
#   - `me` query returns emailVerifiedAt
#
# Requires: postgres + auth + server containers running. Pass --no-up if you
# already have the stack up.
#
# Usage (from repo root, run via WSL on Windows):
#   wsl bash scripts/test-slice-2.sh
#   wsl bash scripts/test-slice-2.sh --no-up
# -----------------------------------------------------------------------------

set -euo pipefail

AUTH_URL="${AUTH_URL:-http://localhost:4001}"
GQL_URL="${GQL_URL:-http://localhost:4000/api/graphql}"
PG_CONTAINER="${PG_CONTAINER:-commons-fabric-poc-postgres-1}"
PG_USER="${PG_USER:-cfp}"
PG_DB="${PG_DB:-cfp_dev}"
BRING_UP=1
EMAIL="slice2-smoketest+$(date +%s)@example.com"
PASSWORD="testpass123"
DISPLAY_NAME="Slice 2 Tester"

for arg in "$@"; do
  case "$arg" in
    --no-up) BRING_UP=0 ;;
    -h|--help) grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown arg: $arg" >&2; exit 2 ;;
  esac
done

if [ -t 1 ]; then
  C_GREEN=$'\033[32m'; C_RED=$'\033[31m'; C_DIM=$'\033[2m'; C_RESET=$'\033[0m'
else
  C_GREEN=''; C_RED=''; C_DIM=''; C_RESET=''
fi

pass() { echo "${C_GREEN}✓${C_RESET} $1"; }
fail() { echo "${C_RED}✗${C_RESET} $1" >&2; exit 1; }
step() { echo; echo "${C_DIM}--- $1 ---${C_RESET}"; }

# Issue a GraphQL request. $1 = bearer token (may be empty), $2 = JSON body file.
gql() {
  local token="$1" body_file="$2"
  if [ -n "$token" ]; then
    curl -s -X POST "$GQL_URL" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $token" \
      --data-binary "@$body_file"
  else
    curl -s -X POST "$GQL_URL" \
      -H "Content-Type: application/json" \
      --data-binary "@$body_file"
  fi
}

if [ "$BRING_UP" = "1" ]; then
  step "Bringing up postgres + auth + server"
  docker compose up -d postgres auth server >/dev/null
  for i in 1 2 3 4 5 6 7 8 9 10; do
    if curl -sf "$AUTH_URL/health" >/dev/null 2>&1 && curl -sf "$GQL_URL" -X POST -H 'Content-Type: application/json' -d '{"query":"{ __typename }"}' >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
fi

step "Health checks"
curl -sf "$AUTH_URL/health" >/dev/null || fail "auth /health unreachable"
curl -sf -X POST -H 'Content-Type: application/json' -d '{"query":"{ __typename }"}' "$GQL_URL" >/dev/null || fail "GraphQL endpoint unreachable"
pass "auth + server are healthy"

step "Register an unverified user"
REGISTER_CODE=$(curl -s -o /tmp/cfp_s2_register -w "%{http_code}" \
  -X POST "$AUTH_URL/auth/register" \
  -H "Content-Type: application/json" \
  --data-raw "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"displayName\":\"$DISPLAY_NAME\"}")
[ "$REGISTER_CODE" = "201" ] || fail "register expected 201, got $REGISTER_CODE (body: $(cat /tmp/cfp_s2_register))"
pass "register returned 201"

step "Login (still unverified — should succeed and issue a token)"
LOGIN_RESP=$(curl -s -X POST "$AUTH_URL/auth/login" \
  -H "Content-Type: application/json" \
  --data-raw "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
TOKEN=$(echo "$LOGIN_RESP" | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')
[ -n "$TOKEN" ] || fail "login did not return accessToken (body: $LOGIN_RESP)"
pass "login returned access token"

step "GraphQL me { emailVerifiedAt } returns null pre-verification"
cat > /tmp/cfp_s2_me <<'EOF'
{"query":"{ me { id email emailVerifiedAt } }"}
EOF
ME_RESP=$(gql "$TOKEN" /tmp/cfp_s2_me)
echo "$ME_RESP" | grep -q '"emailVerifiedAt":null' || fail "me.emailVerifiedAt not null pre-verification (resp: $ME_RESP)"
pass "me.emailVerifiedAt is null"

step "subscribeToCommunity (unverified) → EMAIL_NOT_VERIFIED"
cat > /tmp/cfp_s2_sub <<'EOF'
{"query":"mutation($id:ID!){ subscribeToCommunity(communityId:$id){ id } }","variables":{"id":"non-existent-id"}}
EOF
SUB_RESP=$(gql "$TOKEN" /tmp/cfp_s2_sub)
echo "$SUB_RESP" | grep -q '"code":"EMAIL_NOT_VERIFIED"' || fail "expected EMAIL_NOT_VERIFIED on subscribe (resp: $SUB_RESP)"
pass "subscribe correctly gated by EMAIL_NOT_VERIFIED"

step "createCommunity (unverified) → EMAIL_NOT_VERIFIED"
cat > /tmp/cfp_s2_create_c <<'EOF'
{"query":"mutation($i:CreateCommunityInput!){ createCommunity(input:$i){ id } }","variables":{"i":{"name":"Test","description":"d","tags":[],"contactFirstname":"a","contactLastname":"b","contactEmail":"c@d.com","address":"a","city":"c","province":"p","country":"CA"}}}
EOF
CC_RESP=$(gql "$TOKEN" /tmp/cfp_s2_create_c)
echo "$CC_RESP" | grep -q '"code":"EMAIL_NOT_VERIFIED"' || fail "expected EMAIL_NOT_VERIFIED on createCommunity (resp: $CC_RESP)"
pass "createCommunity correctly gated by EMAIL_NOT_VERIFIED"

step "createEvent (unverified) → EMAIL_NOT_VERIFIED (gate fires before role check)"
cat > /tmp/cfp_s2_create_e <<'EOF'
{"query":"mutation($i:CreateEventInput!){ createEvent(input:$i){ id } }","variables":{"i":{"communityId":"non-existent","title":"T"}}}
EOF
CE_RESP=$(gql "$TOKEN" /tmp/cfp_s2_create_e)
echo "$CE_RESP" | grep -q '"code":"EMAIL_NOT_VERIFIED"' || fail "expected EMAIL_NOT_VERIFIED on createEvent (resp: $CE_RESP)"
pass "createEvent correctly gated by EMAIL_NOT_VERIFIED"

step "Verify the email"
TOKEN_DB=$(docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -tA \
  -c "SELECT \"emailVerificationToken\" FROM \"User\" WHERE email='$EMAIL';" | tr -d '[:space:]')
[ -n "$TOKEN_DB" ] || fail "no verification token in DB"
VERIFY_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$AUTH_URL/auth/verify-email/$TOKEN_DB")
[ "$VERIFY_CODE" = "200" ] || fail "verify expected 200, got $VERIFY_CODE"
pass "email verified"

step "createCommunity (verified) → success"
CC_RESP=$(gql "$TOKEN" /tmp/cfp_s2_create_c)
COMMUNITY_ID=$(echo "$CC_RESP" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -n 1)
[ -n "$COMMUNITY_ID" ] || fail "createCommunity did not return id (resp: $CC_RESP)"
pass "createCommunity returned community id ($COMMUNITY_ID)"

step "subscribeToCommunity (verified) → success"
cat > /tmp/cfp_s2_sub2 <<EOF
{"query":"mutation(\$id:ID!){ subscribeToCommunity(communityId:\$id){ id isActive } }","variables":{"id":"$COMMUNITY_ID"}}
EOF
SUB_RESP=$(gql "$TOKEN" /tmp/cfp_s2_sub2)
echo "$SUB_RESP" | grep -q '"isActive":true' || fail "subscribe did not return isActive=true (resp: $SUB_RESP)"
pass "subscribe succeeded"

step "updateSubscription persists notification preferences"
cat > /tmp/cfp_s2_update <<EOF
{"query":"mutation(\$id:ID!,\$i:UpdateSubscriptionInput!){ updateSubscription(communityId:\$id,input:\$i){ calendarFreq calendarPreferredTime calendarChannels announcementFreq } }","variables":{"id":"$COMMUNITY_ID","i":{"calendarFreq":"WEEKLY","calendarPreferredTime":"09:00","calendarChannels":["EMAIL"],"announcementFreq":"REALTIME","announcementChannels":["EMAIL"]}}}
EOF
UPD_RESP=$(gql "$TOKEN" /tmp/cfp_s2_update)
echo "$UPD_RESP" | grep -q '"calendarFreq":"WEEKLY"' || fail "calendarFreq not WEEKLY after update (resp: $UPD_RESP)"
echo "$UPD_RESP" | grep -q '"calendarPreferredTime":"09:00"' || fail "calendarPreferredTime not persisted"
echo "$UPD_RESP" | grep -q '"announcementFreq":"REALTIME"' || fail "announcementFreq not REALTIME after update"
pass "updateSubscription persisted preferences"

step "mySubscriptions reflects the saved preferences"
cat > /tmp/cfp_s2_mysubs <<'EOF'
{"query":"{ mySubscriptions { community { id } calendarFreq calendarChannels } }"}
EOF
MYSUBS_RESP=$(gql "$TOKEN" /tmp/cfp_s2_mysubs)
echo "$MYSUBS_RESP" | grep -q "\"id\":\"$COMMUNITY_ID\"" || fail "subscription not in mySubscriptions"
echo "$MYSUBS_RESP" | grep -q '"calendarFreq":"WEEKLY"' || fail "mySubscriptions.calendarFreq != WEEKLY"
pass "mySubscriptions returns saved preferences"

step "createEvent (verified, no community role) → FORBIDDEN (NOT EMAIL_NOT_VERIFIED)"
cat > /tmp/cfp_s2_create_e2 <<EOF
{"query":"mutation(\$i:CreateEventInput!){ createEvent(input:\$i){ id } }","variables":{"i":{"communityId":"$COMMUNITY_ID","title":"T"}}}
EOF
CE_RESP=$(gql "$TOKEN" /tmp/cfp_s2_create_e2)
# Verified user without ORGANIZER/ADMIN/STEWARD role on the community should be blocked
# by the role check, not the verification check. Confirms gate ordering.
echo "$CE_RESP" | grep -q '"code":"FORBIDDEN"' || fail "expected FORBIDDEN post-verify, got: $CE_RESP"
pass "createEvent correctly hits role check (not verification gate) post-verify"

step "Cleanup"
docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" \
  -c "DELETE FROM \"User\" WHERE email='$EMAIL';" >/dev/null
pass "test user removed (subscription + community cascade)"

echo
echo "${C_GREEN}Slice 2: all checks passed.${C_RESET}"
