# MVP — Slice 2: Subscribe + Verification Gating

> **Status — 2026-05-04.** Complete. Verified via `scripts/test-slice-2.sh` against the local Docker stack. Backend and UI functional.

This slice gates mutation access on a verified email address, adds community subscription with per-community notification preferences, and surfaces the Subscribe UI on the Community page.

---

## What was built

### Server (`apps/server`)

| File                            | Change                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `graphql/resolvers/mutation.ts` | Added `EMAIL_NOT_VERIFIED` guard to `createCommunity`, `createEvent`, and `subscribeToCommunity` — all three check `ctx.user.emailVerifiedAt` before proceeding. Gate fires before the community-role check, so unverified users see `EMAIL_NOT_VERIFIED`, not `FORBIDDEN`. Added `updateSubscription` resolver (upserts `Subscription` row) and `unsubscribeFromCommunity` (sets `isActive=false`, stamps `tsUnsubscribed`). |
| `graphql/resolvers/query.ts`    | Added `mySubscriptions` resolver — returns all active `Subscription` rows for the authenticated user, joined with community and preference fields. `me` resolver extended to expose `emailVerifiedAt`.                                                                                                                                                                                                                        |
| `graphql/schema.ts`             | Added `UserSubscription` type (named to avoid conflict with the GraphQL `Subscription` operation type), `UpdateSubscriptionInput`, `mySubscriptions` query, and `updateSubscription` / `subscribeToCommunity` / `unsubscribeFromCommunity` mutations.                                                                                                                                                                         |

### Web (`apps/web`)

| File                                         | Change                                                                                                                                                                                                                                                                                                                 |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/Community.tsx`                    | Added `SubscribeBlock` component (subscribe/unsubscribe button + inline error). Bootstraps `isSubscribed` state from `mySubscriptions` on mount. Shows "Verify your email to subscribe." when the server returns `EMAIL_NOT_VERIFIED`. Subscribe/unsubscribe guarded by `can("community:subscribe")` permission check. |
| `src/components/SubscriptionPreferences.tsx` | New component. Renders per-community notification preference controls (calendar cadence, preferred time, channels; announcement cadence, preferred time, channels). Calls `updateSubscription` mutation on save.                                                                                                       |
| `src/components/index.ts`                    | Barrel updated to export `SubscriptionPreferences`.                                                                                                                                                                                                                                                                    |

### Database (`packages/db`)

The `Subscription` model was already in `schema.prisma` from the initial migration. No new migration was required for Slice 2 — the `Subscription` table, `CommunicationFrequency` enum, and `CommunicationMethod` enum were all in place from `20260418055259_init`.

---

## GraphQL surface

All operations go through the GraphQL endpoint at `http://localhost:4000/graphql` in development.

### Queries

```graphql
query {
  me {
    id
    email
    emailVerifiedAt
  }
}

query {
  mySubscriptions {
    community {
      id
      name
    }
    isActive
    calendarFreq
    calendarPreferredTime
    calendarChannels
    announcementFreq
    announcementPreferredTime
    announcementChannels
  }
}
```

### Mutations

```graphql
mutation ($communityId: ID!, $input: UpdateSubscriptionInput) {
  subscribeToCommunity(communityId: $communityId, input: $input) {
    id
    isActive
  }
}

mutation ($communityId: ID!) {
  unsubscribeFromCommunity(communityId: $communityId)
}

mutation ($communityId: ID!, $input: UpdateSubscriptionInput!) {
  updateSubscription(communityId: $communityId, input: $input) {
    calendarFreq
    calendarPreferredTime
    calendarChannels
    announcementFreq
    announcementPreferredTime
    announcementChannels
  }
}
```

### `UpdateSubscriptionInput` fields

| Field                       | Type                     | Notes                                    |
| --------------------------- | ------------------------ | ---------------------------------------- |
| `calendarFreq`              | `CommunicationFrequency` | `REALTIME \| DAILY \| WEEKLY \| MONTHLY` |
| `calendarPreferredTime`     | `String`                 | `"HH:MM"` format                         |
| `calendarChannels`          | `[CommunicationMethod!]` | `EMAIL \| SMS \| PUSH`                   |
| `announcementFreq`          | `CommunicationFrequency` | same enum                                |
| `announcementPreferredTime` | `String`                 | `"HH:MM"` format                         |
| `announcementChannels`      | `[CommunicationMethod!]` | same enum                                |

All fields are optional on `UpdateSubscriptionInput` — partial updates are supported.

---

## Verification gate behaviour

| Resolver               | Unverified user      | Verified, no role         | Verified + role |
| ---------------------- | -------------------- | ------------------------- | --------------- |
| `subscribeToCommunity` | `EMAIL_NOT_VERIFIED` | succeeds                  | succeeds        |
| `createCommunity`      | `EMAIL_NOT_VERIFIED` | succeeds (no role needed) | succeeds        |
| `createEvent`          | `EMAIL_NOT_VERIFIED` | `FORBIDDEN`               | succeeds        |

Gate ordering: verification check runs first. A verified user without the required community role sees `FORBIDDEN`, not `EMAIL_NOT_VERIFIED`. This ordering is asserted by the smoke test.

---

## Smoke test — `scripts/test-slice-2.sh`

Run from repo root via WSL:

```
wsl bash scripts/test-slice-2.sh
wsl bash scripts/test-slice-2.sh --no-up   # if stack already running
```

**What it verifies:**

1. `subscribeToCommunity` rejects an unverified user with `EMAIL_NOT_VERIFIED`.
2. `createCommunity` rejects an unverified user with `EMAIL_NOT_VERIFIED`.
3. `createEvent` rejects an unverified user with `EMAIL_NOT_VERIFIED`.
4. Verification gate fires before the community-role check (verified user without ORGANIZER role sees `FORBIDDEN`, not `EMAIL_NOT_VERIFIED`).
5. After email verification, `createCommunity` succeeds and returns an `id`.
6. `subscribeToCommunity` (verified) succeeds and returns `isActive: true`.
7. `updateSubscription` persists `calendarFreq`, `calendarPreferredTime`, `calendarChannels`, `announcementFreq`.
8. `mySubscriptions` reflects the saved preferences.
9. `createEvent` (verified, no community role) returns `FORBIDDEN` — not `EMAIL_NOT_VERIFIED`.
10. `me` query returns a non-null `emailVerifiedAt`.

**Configurable env vars** (same defaults as Slice 1):

| Var            | Default                         |
| -------------- | ------------------------------- |
| `AUTH_URL`     | `http://localhost:4001`         |
| `GQL_URL`      | `http://localhost:4000/graphql` |
| `PG_CONTAINER` | `commons-fabric-poc-postgres-1` |
| `PG_USER`      | `cfp`                           |
| `PG_DB`        | `cfp_dev`                       |

---

## Next slice

Slice 3 — Create/Edit Community + Event forms: new form pages wired to existing `createCommunity` / `createEvent` mutations, added to nav. See `docs/notes/7_MVP_SLICE_PLAN.md` for the full slice table.
