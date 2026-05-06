# MVP Slice Plan

> **Last updated — 2026-05-04.**

## Slice table

| #   | Slice                                            | Scope                                                                                                                                                                                                                                                                                                                                        | Demo result                                                                                                                                                              |
| --- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Auth end-to-end                                  | REST signup/login/verify/resend, custom email/password auth, `/verify-email` page, console email transport,CORS, Signup vs sign-in visual differentiation + expanded signup fields + VerifyEmail double-fire bug                                                                                                                             | ✅ Done — backend verified by `scripts/test-slice-1.sh`; browser flow live, Browser-tested signup with full profile fields; verify link reliably reports success         |
| 2   | Subscribe + verification gating                  | Subscribe button on Community page/popup; gate `subscribeToCommunity` / `createCommunity` / `createEvent` resolvers on `emailVerifiedAt`; Notification Preferences UI                                                                                                                                                                        | ✅ Done — verified by `scripts/test-slice-2.sh`                                                                                                                          |
| 3   | Create/Edit Community + Event forms              | New form pages (`/communities/new`, `/communities/:id/edit`, `/communities/:id/events/new`); wire to existing GraphQL mutations; auto-assign steward role on community creation ✅ (done — steward `UserRole` + `Subscription` both created atomically in `createCommunity`); event popup edit; recurring event toggle (stubbed — not wired) | User creates a community + event from the UI; steward can edit both                                                                                                      |
| 4   | Personal Calendar + Event Detail Popup with .ics | `/calendar` route, event popup, install `ical-generator`, server `.ics` endpoint, self-email action; wire recurring event fields to mutation (deferred from Slice 3)                                                                                                                                                                         | ✅ Done — `packages/ical/` shared package, `myCalendar` query, REST `.ics` endpoint, shared EventPopup/EventTile/date helpers, `/calendar` page with RSVP visual effects |
| 5   | Notification handlers                            | `send-realtime` + `send-digest` handlers in executioner; enqueue on event publish; consolidation logic                                                                                                                                                                                                                                       | Emails actually go out at the right cadences                                                                                                                             |
| 6   | Polish + code review                             | Wire Explore search filter; Publish now / Schedule release for events; convert CommunityCard click to popup (per MVP spec); restyle Community page with tokens; dispatch code-reviewer subagent                                                                                                                                              | Full demo loop testable; review pass complete                                                                                                                            |

---

## Slice 1.1 — polish detail

Three fixes identified before moving to Slice 2. Status: **complete** (included in Slice 1 polish pass).

### 1. Visually differentiate Sign Up from Sign In

Sign-up mode should feel more "open and inviting" — slightly brighter card surface, sage/clay halo, or botanical accent strip only when `mode === "signup"`. Sign-in stays unchanged. Use `--cf-sun` (reserved for non-text accents) as the differentiator. No new hex values — stay within locked Soft Botanical tokens.

### 2. Expanded signup form

**`apps/web/src/pages/Auth.tsx`** and **`apps/auth/routes/auth.ts`** extended to accept and persist:

Mandatory:

- `email`
- `displayName`
- `password`

Optional (clearly labelled):

- `firstname`
- `lastname`
- `postalCode` ← new schema column
- `city` ← new schema column
- `phone`

Schema decision taken: **Option B** — keep `username` as the stable unique handle, add a non-unique `displayName` column for human-friendly rendering. `postalCode` and `city` added as nullable columns on `User` via a new tracked migration.

### 3. VerifyEmail UI shows "expired" even on success

Root cause: React 19 StrictMode double-mount — `useEffect` fires twice in dev; first call succeeds and clears the token, second call hits "token not found" and overwrites status with error. DB shows user is verified; UI says expired.

Fix: `useRef` guard ensuring the verification fetch fires exactly once even under double-mount. Smoke test extended to assert the second `/verify-email/:token` call returns `400` so the UI bug doesn't regress silently.

---

## Session notes (carry forward)

- Full Slice 1 API surface: `docs/notes/7_MVP_SLICE_1.md`
- Full Slice 2 API surface: `docs/notes/7_MVP_SLICE_2.md`
- Smoke tests: `wsl bash scripts/test-slice-1.sh --no-up` / `wsl bash scripts/test-slice-2.sh --no-up`
- Stack: `wsl docker compose up -d` — web at `localhost:5173`, auth at `localhost:4001`, server (GraphQL) at `localhost:4000`
- Email in console mode — verification links via `wsl docker logs commons-fabric-poc-auth-1`
- Reusable primitives in `apps/web/src/components/primitives.tsx` and `AuthShell.tsx` — extend, don't add new ones
- Three known gaps deferred to end-of-MVP code review (orphan user on email failure, username collision, indefinite "verifying" spinner) — see `7_MVP_SLICE_1.md`
