# Next Steps Start Here

_Review this document to see the immediate next steps for project implementation._

_This is maintained in parallel to help polish, refine, and direct additional progress following the implementation plan at @docs/notes/7_MVP_SLICE_PLAN.md_

---

## Immediate Low Hanging Fruit Checklist

_This list may have recurring tasks. In order to support reoccurrence, we strikeout the 'finished tasks' and unstrike them once we need to do them again. If they are one off tasks, leave it for manual review to remove them from the list permanently._

- ~~Read through the @docs/notes/documentation-sync-registry.md and initiate a full codebase <-> docs sync analysis.~~
- ~~Once the documentation-sync-registry.md table is updated, confirm deviations and corrections prior to sync-update.~~
  ~~- Addressing [Tester Comments](#tester-comments) below one at a time.~~
- Addressing the next development Slice (#3 or #4) in the [Slice plan document](./notes/7_MVP_SLICE_PLAN.md).

---

## Latest Code Review Results

_None Currently_

---

## Tester Comments

_A real person going into the application to test how it looks and functions. If any of these are detected as resolved, remove them from the list._

_No open tester comments._

---

## Previously Addressed Code Reviews

---

🤖 Runner: Claude /code-reviewer plugin on Sonnet 4.6 Medium Effort
📝 Runtime: `8:50am EST 05.05.2026`
🟢 Resolved by Codex GPT-5.5 Medium Effort

Code Review found 5 issues:

1. Tokens stored in localStorage — XSS risk
   Both the access and refresh tokens are written to localStorage. Any injected script can read them.
   apps/web/src/lib/auth.ts:47-48, 75 — both setItem("access_token", ...) and setItem("access_token", ...) after refresh. Refresh token is also sent as JSON in the request body (line 58), not as an httpOnly cookie.

2. Vite proxy missing /auth route — broken in Docker
   The proxy only maps /api → server:4000. Auth calls go directly to localhost:4001, which resolves on the host but not inside the container network or in any deployed environment.
   apps/web/vite.config.ts:18-19:
   `    proxy: {
 "/api": "http://server:4000",
 // missing: "/auth": "http://auth:4001"
},`

3. Register route has no try/catch — unhandled rejections
   prisma.user.create() (line 55) and sendVerificationEmail() (line 70) run without any error handling. If the DB write fails or SendGrid throws, Express receives an unhandled rejection. The client gets no response and the request hangs.
   apps/auth/routes/auth.ts:55–71 — entire block is unguarded.

4. updateMe passes GraphQL input directly to Prisma — no field whitelist
   data: args.input as object sends whatever the client sends straight to prisma.user.update. A user could include emailVerified: true, passwordHash: "...", or any other field in the input and it would be written to the DB.
   apps/server/graphql/resolvers/mutation.ts:36:
   data: args.input as object, // no whitelist
   Same pattern exists at mutation.ts:81 (updateCommunity) and mutation.ts:219 (updateSubscription).

5. GraphQL client has no 401 → token refresh path
   apps/web/src/lib/graphql.ts sends the auth header but doesn't handle a 401/expired-token response. When the access token expires, all GraphQL calls silently fail with no refresh attempt and no re-auth prompt.

---
