#!/usr/bin/env bash
# Purge communities whose name contains "test" (case-insensitive).
# Requires: the server running on localhost:4000 and an admin JWT token.
#
# Usage:
#   1. Sign in as admin:
    #  TOKEN=$(curl -s http://localhost:4001/auth/login \
    #    -H 'Content-Type: application/json' \
    #    -d '{"email":"admin@outlook.com","password":"12345678"}' | jq -r '.token')
#
#   2. Run this script:
#      TOKEN=$TOKEN bash scripts/purge-test-communities.sh

set -euo pipefail

API="http://localhost:4000/api/graphql"

if [ -z "${TOKEN:-}" ]; then
  echo "TOKEN env var required. Sign in as admin first." >&2
  exit 1
fi

echo "Fetching communities..."
COMMUNITIES=$(curl -s "$API" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query":"{ communities(pagination: { limit: 200 }) { id name } }"}')

echo "$COMMUNITIES" | jq -r '.data.communities[] | select(.name | test("test";"i")) | "\(.id)\t\(.name)"' | \
while IFS=$'\t' read -r id name; do
  echo "Deleting: $name ($id)"
  curl -s "$API" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"query\":\"mutation { deleteCommunity(id: \\\"$id\\\") }\"}" | jq .
done

echo "Done."
