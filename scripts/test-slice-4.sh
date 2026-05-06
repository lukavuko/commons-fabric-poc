#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# Slice 4 smoke test — personal calendar, .ics download, RSVP, myCalendar query.
#
# Covers:
#   - myCalendar query returns events from subscribed communities
#   - myCalendar filters by releaseStatus (only PUBLIC)
#   - myCalendar respects fromDate/toDate range
#   - GET /api/events/:id/ical returns valid .ics for PUBLIC events
#   - GET /api/events/:id/ical returns 404 for DRAFT events
#   - rsvpToEvent + cancelRsvp round-trip
#   - myRsvp field reflects current status
#
# Requires: postgres + auth + server containers running. Pass --no-up if you
# already have the stack up.
#
# Usage (from repo root, run via WSL on Windows):
#   wsl bash scripts/test-slice-4.sh
#   wsl bash scripts/test-slice-4.sh --no-up
# -----------------------------------------------------------------------------

set -euo pipefail

AUTH_URL="${AUTH_URL:-http://localhost:4001}"
GQL_URL="${GQL_URL:-http://localhost:4000/api/graphql}"
SERVER_URL="${SERVER_URL:-http://localhost:4000}"
PG_CONTAINER="${PG_CONTAINER:-commons-fabric-poc-postgres-1}"
PG_USER="${PG_USER:-cfp}"
PG_DB="${PG_DB:-cfp_dev}"
BRING_UP=1
EMAIL="slice4-smoketest+$(date +%s)@example.com"
PASSWORD="testpass123"
DISPLAY_NAME="Slice 4 Tester"

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

# ── Setup: register, verify, login ───────────────────────────────────────────

step "Register + verify + login"
curl -s -o /dev/null -w '' \
  -X POST "$AUTH_URL/auth/register" \
  -H "Content-Type: application/json" \
  --data-raw "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"displayName\":\"$DISPLAY_NAME\"}" >/dev/null

TOKEN_DB=$(docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -tA \
  -c "SELECT \"emailVerificationToken\" FROM \"User\" WHERE email='$EMAIL';" | tr -d '[:space:]')
curl -s -o /dev/null "$AUTH_URL/auth/verify-email/$TOKEN_DB"

LOGIN_RESP=$(curl -s -X POST "$AUTH_URL/auth/login" \
  -H "Content-Type: application/json" \
  --data-raw "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
TOKEN=$(echo "$LOGIN_RESP" | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')
[ -n "$TOKEN" ] || fail "login did not return accessToken"
pass "user registered, verified, logged in"

# ── Create a community + events ──────────────────────────────────────────────

step "Create community"
cat > /tmp/cfp_s4_create_c <<'EOF'
{"query":"mutation($i:CreateCommunityInput!){ createCommunity(input:$i){ id } }","variables":{"i":{"name":"Calendar Test Community","description":"For slice 4","tags":["test"],"contactFirstname":"Test","contactLastname":"User","contactEmail":"t@t.com","address":"123 Main","city":"Toronto","province":"ON","country":"CA"}}}
EOF
CC_RESP=$(gql "$TOKEN" /tmp/cfp_s4_create_c)
COMMUNITY_ID=$(echo "$CC_RESP" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -n 1)
[ -n "$COMMUNITY_ID" ] || fail "createCommunity failed (resp: $CC_RESP)"
pass "community created ($COMMUNITY_ID)"

step "Create a DRAFT event (should not appear in myCalendar)"
FUTURE_DATE=$(date -u -d "+7 days" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -v+7d +%Y-%m-%dT%H:%M:%SZ)
cat > /tmp/cfp_s4_create_draft <<EOF
{"query":"mutation(\$i:CreateEventInput!){ createEvent(input:\$i){ id releaseStatus } }","variables":{"i":{"communityId":"$COMMUNITY_ID","title":"Draft Event","startsAt":"$FUTURE_DATE"}}}
EOF
DRAFT_RESP=$(gql "$TOKEN" /tmp/cfp_s4_create_draft)
DRAFT_ID=$(echo "$DRAFT_RESP" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -n 1)
[ -n "$DRAFT_ID" ] || fail "createEvent (draft) failed (resp: $DRAFT_RESP)"
pass "draft event created ($DRAFT_ID)"

step "Publish an event (should appear in myCalendar)"
cat > /tmp/cfp_s4_create_pub <<EOF
{"query":"mutation(\$i:CreateEventInput!){ createEvent(input:\$i){ id releaseStatus } }","variables":{"i":{"communityId":"$COMMUNITY_ID","title":"Public Meetup","startsAt":"$FUTURE_DATE","location":"City Hall","eventType":"SOCIAL"}}}
EOF
PUB_RESP=$(gql "$TOKEN" /tmp/cfp_s4_create_pub)
PUB_ID=$(echo "$PUB_RESP" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -n 1)
[ -n "$PUB_ID" ] || fail "createEvent (public) failed (resp: $PUB_RESP)"

cat > /tmp/cfp_s4_publish <<EOF
{"query":"mutation(\$id:ID!){ publishEvent(id:\$id){ id releaseStatus } }","variables":{"id":"$PUB_ID"}}
EOF
PUBLISH_RESP=$(gql "$TOKEN" /tmp/cfp_s4_publish)
echo "$PUBLISH_RESP" | grep -q '"releaseStatus":"PUBLIC"' || fail "publishEvent did not return PUBLIC (resp: $PUBLISH_RESP)"
pass "public event created and published ($PUB_ID)"

# ── myCalendar query ─────────────────────────────────────────────────────────

step "myCalendar returns only PUBLIC events"
FROM_DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ)
TO_DATE=$(date -u -d "+90 days" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -v+90d +%Y-%m-%dT%H:%M:%SZ)
cat > /tmp/cfp_s4_calendar <<EOF
{"query":"query(\$from:DateTime,\$to:DateTime){ myCalendar(fromDate:\$from,toDate:\$to){ id title releaseStatus community { id name } } }","variables":{"from":"$FROM_DATE","to":"$TO_DATE"}}
EOF
CAL_RESP=$(gql "$TOKEN" /tmp/cfp_s4_calendar)
echo "$CAL_RESP" | grep -q "\"id\":\"$PUB_ID\"" || fail "myCalendar missing published event (resp: $CAL_RESP)"
echo "$CAL_RESP" | grep -q "\"id\":\"$DRAFT_ID\"" && fail "myCalendar should NOT include draft event"
echo "$CAL_RESP" | grep -q '"name":"Calendar Test Community"' || fail "myCalendar event missing community.name"
pass "myCalendar returns public event with community name, excludes draft"

step "myCalendar requires auth"
cat > /tmp/cfp_s4_cal_noauth <<'EOF'
{"query":"{ myCalendar { id } }"}
EOF
NOAUTH_RESP=$(gql "" /tmp/cfp_s4_cal_noauth)
echo "$NOAUTH_RESP" | grep -qi 'error\|unauthorized\|unauthenticated' || fail "myCalendar should reject unauthenticated (resp: $NOAUTH_RESP)"
pass "myCalendar rejects unauthenticated requests"

# ── .ics download ────────────────────────────────────────────────────────────

step "GET /api/events/:id/ical for PUBLIC event"
ICS_RESP=$(curl -s -w "\n%{http_code}" "$SERVER_URL/api/events/$PUB_ID/ical")
ICS_CODE=$(echo "$ICS_RESP" | tail -1)
ICS_BODY=$(echo "$ICS_RESP" | sed '$d')
[ "$ICS_CODE" = "200" ] || fail "ical expected 200, got $ICS_CODE"
echo "$ICS_BODY" | grep -q "BEGIN:VCALENDAR" || fail ".ics missing BEGIN:VCALENDAR"
echo "$ICS_BODY" | grep -q "BEGIN:VEVENT" || fail ".ics missing BEGIN:VEVENT"
echo "$ICS_BODY" | grep -q "Public Meetup" || fail ".ics missing event title"
echo "$ICS_BODY" | grep -q "City Hall" || fail ".ics missing location"
pass ".ics download returns valid iCal with event details"

step "GET /api/events/:id/ical for DRAFT event → 404"
DRAFT_ICS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$SERVER_URL/api/events/$DRAFT_ID/ical")
[ "$DRAFT_ICS_CODE" = "404" ] || fail "ical for draft expected 404, got $DRAFT_ICS_CODE"
pass ".ics correctly returns 404 for draft events"

step "GET /api/events/:id/ical for non-existent event → 404"
FAKE_ICS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$SERVER_URL/api/events/non-existent-id/ical")
[ "$FAKE_ICS_CODE" = "404" ] || fail "ical for fake id expected 404, got $FAKE_ICS_CODE"
pass ".ics correctly returns 404 for non-existent events"

# ── RSVP round-trip ──────────────────────────────────────────────────────────

step "RSVP to event as GOING"
cat > /tmp/cfp_s4_rsvp <<EOF
{"query":"mutation(\$eid:ID!,\$s:RSVPStatus!){ rsvpToEvent(eventId:\$eid,status:\$s){ id rsvpStatus } }","variables":{"eid":"$PUB_ID","s":"GOING"}}
EOF
RSVP_RESP=$(gql "$TOKEN" /tmp/cfp_s4_rsvp)
echo "$RSVP_RESP" | grep -q '"rsvpStatus":"GOING"' || fail "RSVP did not return GOING (resp: $RSVP_RESP)"
pass "RSVP set to GOING"

step "myCalendar reflects myRsvp = GOING"
cat > /tmp/cfp_s4_cal_rsvp <<EOF
{"query":"query(\$from:DateTime,\$to:DateTime){ myCalendar(fromDate:\$from,toDate:\$to){ id myRsvp rsvpCount } }","variables":{"from":"$FROM_DATE","to":"$TO_DATE"}}
EOF
CAL_RSVP=$(gql "$TOKEN" /tmp/cfp_s4_cal_rsvp)
echo "$CAL_RSVP" | grep -q '"myRsvp":"GOING"' || fail "myCalendar.myRsvp not GOING (resp: $CAL_RSVP)"
pass "myCalendar shows myRsvp = GOING"

step "cancelRsvp removes the RSVP"
cat > /tmp/cfp_s4_cancel <<EOF
{"query":"mutation(\$eid:ID!){ cancelRsvp(eventId:\$eid) }","variables":{"eid":"$PUB_ID"}}
EOF
CANCEL_RESP=$(gql "$TOKEN" /tmp/cfp_s4_cancel)
echo "$CANCEL_RESP" | grep -qi 'error' && fail "cancelRsvp failed (resp: $CANCEL_RESP)"

CAL_AFTER=$(gql "$TOKEN" /tmp/cfp_s4_cal_rsvp)
echo "$CAL_AFTER" | grep -q '"myRsvp":null' || fail "myRsvp not null after cancel (resp: $CAL_AFTER)"
pass "cancelRsvp clears myRsvp to null"

# ── Cleanup ──────────────────────────────────────────────────────────────────

step "Cleanup"
docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" \
  -c "DELETE FROM \"User\" WHERE email='$EMAIL';" >/dev/null
pass "test user removed (events + community cascade)"

echo
echo "${C_GREEN}Slice 4: all checks passed.${C_RESET}"
