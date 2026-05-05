# MVP — Slice 1: Auth End-to-End

> **Status — 2026-05-03.** Complete. Verified via `scripts/test-slice-1.sh` against the local Docker stack. Backend functional; frontend wired and typechecked but not yet manually browser-tested.

This slice closes the loop on user identity: a visitor can create an account, receive a one-time verification link, activate their account, and log in. Every subsequent slice depends on this flow being in place.

---

## What was built

### Web (`apps/web`)

| File                            | Change                                                                                                                                                                                                                                                |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/auth.ts`               | Added `verifyEmail(token)` and `resendVerification(email)` REST helpers alongside the pre-existing `register` / `login` / `logout` / `refreshAccessToken` / `getAccessToken`. Tokens stored in `localStorage` under `access_token` / `refresh_token`. |
| `src/components/primitives.tsx` | Added three reusable form primitives: `Input`, `FormField` (label + hint + error), and `Alert` (danger / info / success tones). All draw from the locked Soft Botanical tokens — no raw hex values.                                                   |
| `src/components/AuthShell.tsx`  | New shared layout for auth-adjacent pages (Sign In, Sign Up, Verify Email). Centered card, Commons Fabric wordmark home link. Reused by both `Auth.tsx` and `VerifyEmail.tsx`.                                                                        |
| `src/components/index.ts`       | Barrel exports updated to surface `Input`, `FormField`, `Alert`, `AuthShell`.                                                                                                                                                                         |
| `src/pages/Auth.tsx`            | Full rewrite. Replaced the stubbed-GraphQL signup/login with calls to the REST `lib/auth.ts` helpers. Sign-up success now renders a "Check your email" state instead of navigating; sign-in routes to `/`. Restyled with the new primitives.          |
| `src/pages/VerifyEmail.tsx`     | New. Reads `?token=` from the URL query, calls `GET /auth/verify-email/:token`, and renders one of four states: verifying / success / invalid-or-expired / missing-token. The error and missing-token states embed an inline resend form.             |
| `src/App.tsx`                   | Added `/verify-email` route.                                                                                                                                                                                                                          |

### Auth service (`apps/auth`)

| File             | Change                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `routes/auth.ts` | Added `POST /auth/resend-verification`. Issues a fresh token, persists it on the user, and re-sends the verification email. The endpoint deliberately returns the same 200 message whether or not an account exists for the given email, to avoid leaking account existence. Already-verified accounts return a distinct success message and skip token generation.                |
| `lib/email.ts`   | Added a transport-toggle. `EMAIL_TRANSPORT=console` (default in dev) prints the verification link to stdout instead of sending; `EMAIL_TRANSPORT=sendgrid` delivers via Sendgrid. The from-address now reads `SENDGRID_FROM_EMAIL` first, falling back to `FROM_EMAIL`, then a hardcoded default. The Sendgrid client is only initialized when the transport is set to `sendgrid`. |
| `index.ts`       | Registered `cors` middleware. Allowed origins read from `WEB_ORIGIN` (comma-separated; default `http://localhost:5173`), with `credentials: true`. Without this the browser blocked every cross-origin call from the web app to the auth service — `curl` and the smoke test passed but the UI could not.                                                                          |
| `package.json`   | Added `cors` (runtime) and `@types/cors` (dev) dependencies.                                                                                                                                                                                                                                                                                                                       |

### Database (`db`)

| File                                                                              | Change                                                                                                                                                                                                                                                                                   |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prisma.config.ts`                                                                | Replaced the strict `env("DATABASE_URL")` helper from `prisma/config` with `process.env.DATABASE_URL ?? ""`. The strict helper threw at Docker build time during `prisma generate`, which doesn't actually need the URL. Migrations and runtime clients still require the var to be set. |
| `prisma/migrations/20260502020000_add_auth_fields_session_jobqueue/migration.sql` | New tracked migration. Adds `User.passwordHash`, `User.emailVerificationToken` (unique index), the `sessions` table (refresh token storage), the `job_queue` table, and the `JobStatus` enum. The schema had drifted ahead of migrations; this brings them back in sync.                 |

### Docker (all four service Dockerfiles)

`apps/{auth,server,scheduler,executioner}/Dockerfile` — appended `--include-workspace-root` to every `npm ci --workspace=` invocation. Without it, the root `tsx` dev-dependency is excluded from the image, and the runtime entrypoint (`node --import=tsx/esm index.ts`) crashes with `ERR_MODULE_NOT_FOUND: 'tsx'`.

### Environment

`.env` — added `EMAIL_TRANSPORT="console"` with switch-back instructions. The Supabase `DATABASE_URL` and `DIRECT_URL` are commented out (retained for reference) and replaced with the local Docker URL `postgresql://cfp:cfp@postgres:5432/cfp_dev`.

---

## API surface (auth service)

All endpoints live under `http://localhost:4001/auth` in development. Bodies are `application/json`.

| Method | Path                        | Body                  | Returns                             | Notes                                                                                                                                                                                                                |
| ------ | --------------------------- | --------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/auth/register`            | `{ email, password }` | `201 { message }`                   | Username auto-derived from `email.split("@")[0]`. Verification email queued via the configured transport. Existing email → `409 { error }`.                                                                          |
| `POST` | `/auth/login`               | `{ email, password }` | `200 { accessToken, refreshToken }` | Access JWT TTL: 3h. Refresh JWT TTL: 30d. Refresh token hashed (SHA-256) before being persisted in the `sessions` table. Updates `User.lastloginAt`.                                                                 |
| `POST` | `/auth/refresh`             | `{ refreshToken }`    | `200 { accessToken }`               | Verifies signature _and_ matches the SHA-256 hash against `sessions`. Returns 401 if the session row is missing or expired.                                                                                          |
| `POST` | `/auth/logout`              | `{ refreshToken? }`   | `200 { message }`                   | Deletes the matching session row if present. Returns 200 even when no session matches (idempotent).                                                                                                                  |
| `GET`  | `/auth/verify-email/:token` | —                     | `200 { message }` / `400 { error }` | Sets `emailVerifiedAt`, clears the token. The token is single-use — it is nulled on success.                                                                                                                         |
| `POST` | `/auth/resend-verification` | `{ email }`           | `200 { message }`                   | **Existence-leak-safe**: returns the same generic message whether the account exists or not. If the account exists and is already verified, returns a distinct (but still 200) message and skips token regeneration. |
| `GET`  | `/health`                   | —                     | `200 { ok: true }`                  | Liveness probe.                                                                                                                                                                                                      |

---

## Email transport — switching between console and Sendgrid

The transport is selected by the `EMAIL_TRANSPORT` environment variable read by the auth service.

**Console mode (default, no Sendgrid required).**

```
EMAIL_TRANSPORT=console
```

Verification emails are not sent. Instead, the auth service writes a line to stdout:

```
[email:console] verification link for user@example.com
  http://localhost:5173/verify-email?token=<32-byte-hex>
  (set EMAIL_TRANSPORT=sendgrid to deliver via Sendgrid)
```

Visible via `docker logs commons-fabric-poc-auth-1` (or the `wsl docker logs` equivalent). This is the recommended dev mode — it decouples the auth flow from network reachability and Sendgrid account state.

**Sendgrid mode (real delivery).**

```
EMAIL_TRANSPORT=sendgrid
SENDGRID_API_KEY=SG.<key with "Mail Send" permission>
SENDGRID_FROM_EMAIL=<a sender verified in your Sendgrid account>
```

To switch:

1. Set `EMAIL_TRANSPORT=sendgrid` in `.env`.
2. Confirm `SENDGRID_FROM_EMAIL` is verified — either via Single Sender Verification in the Sendgrid dashboard, or via Domain Authentication if you control the DNS for the from-domain. **Sendgrid returns `403 Forbidden` if the sender is unverified.** This is what surfaced during Slice 1 smoke-testing and is the reason the console fallback exists.
3. Restart the auth container with `--force-recreate` so it picks up the new env vars (a plain `restart` does not reload `env_file`):

   ```
   docker compose up -d --force-recreate auth
   ```

4. If you also changed `apps/auth/lib/email.ts`, rebuild the image first: `docker compose up -d --build --force-recreate auth`.

---

## Smoke test — `scripts/test-slice-1.sh`

A bash script exercises every endpoint above end-to-end. It captures the verification token directly from Postgres (more reliable than scraping logs) and uses a timestamped email so reruns never collide.

**Run it from the repo root via WSL:**

```
wsl bash scripts/test-slice-1.sh
```

By default the script will bring up `postgres` and `auth` itself if they aren't already running. Pass `--no-up` if you've already started the stack and want to skip the compose call.

**What the script verifies, in order:**

1. `GET /health` returns 200.
2. `POST /auth/register` returns 201 for a fresh email.
3. The `User.emailVerificationToken` column was populated (read directly from Postgres).
4. `GET /auth/verify-email/:token` returns 200.
5. `User.emailVerifiedAt` is now set.
6. `POST /auth/login` returns 200 with both `accessToken` and `refreshToken` in the body.
7. `POST /auth/resend-verification` on the now-verified account returns the "already verified" message.
8. The test user is deleted at the end so the run leaves no residue.

Exit code is `0` on success, `1` on the first failure, and `2` for unknown CLI arguments.

**Configurable via env vars** (defaults shown):

| Var            | Default                         | Purpose                                                         |
| -------------- | ------------------------------- | --------------------------------------------------------------- |
| `AUTH_URL`     | `http://localhost:4001`         | Auth service base URL. Override to test against a remote stack. |
| `PG_CONTAINER` | `commons-fabric-poc-postgres-1` | Postgres container name.                                        |
| `PG_USER`      | `cfp`                           | Postgres user.                                                  |
| `PG_DB`        | `cfp_dev`                       | Postgres database.                                              |

---

## Known gaps deferred to end-of-MVP code review

These are tracked here because they are real but out-of-scope for Slice 1 alone. The end-of-MVP code review pass should pick them up.

1. **Failed email send leaves an orphan user row.** `register` calls `prisma.user.create` and then `sendVerificationEmail` sequentially. If the email send throws (Sendgrid 403, network error), the user row already exists but no link was delivered. Subsequent attempts to register the same email return 409 instead of retrying delivery. Fix path: wrap in a transaction _or_ perform the send first (with a deterministic token) and only persist on success, _or_ surface a "resend verification" affordance from the existing-email error.

2. **Username auto-derivation can collide across email domains.** `username = email.split("@")[0]` means `john@a.com` and `john@b.com` collide on the `User.username` unique constraint, causing the second signup to fail with a Prisma error rather than a friendly message. Fix path: append a short random suffix on collision, or accept an optional `username` field on the form and only auto-derive when it's blank.

3. **Email verification page state machine could surface a "still verifying" timeout.** Currently the page shows "Verifying your email…" indefinitely if the network call hangs. A timeout with retry would harden the UX. Low priority for MVP.

---

## Next slice

Slice 2 — Subscribe button on the Community popup / Community page / Community Calendar, gate `subscribeToCommunity` / `createCommunity` / `createEvent` resolvers on `emailVerifiedAt`, and build the Notification Preferences UI.
