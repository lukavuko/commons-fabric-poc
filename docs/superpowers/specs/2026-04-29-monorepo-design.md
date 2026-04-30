# Monorepo Migration & Service Architecture Design

**Date**: 2026-04-29
**Status**: Approved
**Scope**: Restructure single-package repo into npm workspaces monorepo; add scheduler, executioner, and auth services; define job queue table; define Docker/local dev shape.

---

## 1. Repository Structure

npm workspaces (Option A — no Turborepo, no pnpm). Root `package.json` declares workspaces; each app owns its own `package.json`, `tsconfig.json`, and `Dockerfile`.

```
commons-fabric-poc/
├── apps/
│   ├── web/                  # React + Vite SPA (moved from src/)
│   ├── server/               # Express + Apollo GraphQL (moved from server/)
│   ├── scheduler/            # Cron service — manages job_queue state transitions
│   ├── executioner/          # Job runner — executes READY rows from job_queue
│   └── auth/                 # In-house auth service
├── packages/
│   └── db/                   # Prisma schema, migrations, generated client (shared)
├── package.json              # Root: workspaces declaration + shared devDeps
├── package-lock.json
├── docker-compose.yml        # Local dev: all services + postgres
├── docker-compose.prod.yml   # Production overrides (Caddy, NODE_ENV=production)
└── .env                      # Shared environment variables (never committed)
```

The root-level `prisma/` folder and `prisma.config.ts` move into `packages/db`. The root-level `server/` and `src/` directories move into `apps/server/` and `apps/web/` respectively.

---

## 2. Service Responsibilities

### `apps/auth` — port 4001
Minimal in-house auth service replacing Supabase Auth.

| Endpoint | Purpose |
|---|---|
| `POST /auth/register` | Hash password (bcrypt), create User, send verification email via SendGrid |
| `POST /auth/login` | Verify password, issue JWT access token (3h) + refresh token, write Session row |
| `POST /auth/refresh` | Validate refresh token from DB, issue new access token |
| `POST /auth/logout` | Delete Session row |
| `GET /auth/verify-email/:token` | Mark user email as verified |

JWT access tokens expire in **3 hours** (convenient for testing; tighten for production). Refresh tokens are long-lived and stored hashed in the `Session` table.

### `apps/server` — port 4000
Express + Apollo Server. Validates incoming JWT access tokens by verifying signature against shared `JWT_SECRET` — no longer calls Supabase. Resolver auth logic unchanged.

### `apps/scheduler` — no port
Runs `node-cron` loops that INSERT rows into `job_queue` with the appropriate `fire_at` timestamp and initial status.

A promotion loop runs every few minutes and transitions rows through the state machine:
```
SCHEDULED → PENDING (if it needs to be run on today's date) → READY (fire_at has passed)
```

### `apps/executioner` — no port
Polls `job_queue` for READY rows on a short interval (e.g. every 10s). For each row:
1. Mark RUNNING
2. Dispatch to the handler registered under `service_name`
3. On success: mark COMPLETE, set `completed_at`
4. On failure: increment `retry_count`; if `retry_count < max_retries` requeue as READY, else mark FAILED with `error_message`

### `packages/db` — not a running service
Single source of truth for all database concerns. Exports a configured `PrismaClient` instance. All apps import from `@cfp/db`.

```
packages/db/
├── package.json       # name: "@cfp/db"
├── tsconfig.json
├── index.ts           # exports prisma client + generated types
└── prisma/
    ├── schema.prisma  # gains Session + JobQueue models
    ├── migrations/
    └── schema.dbml
```

---

## 3. Database Models (additions to `schema.prisma`)

### `Session` (auth refresh tokens)

| Column | Type | Notes |
|---|---|---|
| `id` | String (CUID) | PK |
| `userId` | String | FK → User, onDelete: Cascade |
| `refreshToken` | String | Stored hashed (bcrypt) |
| `expiresAt` | DateTime | |
| `createdAt` | DateTime | |

### `JobQueue` (job scheduling queue)

| Column | Type | Notes |
|---|---|---|
| `id` | String (CUID) | PK |
| `status` | Enum | SCHEDULED / PENDING / READY / RUNNING / COMPLETE / FAILED |
| `serviceName` | String | Handler key in executioner |
| `createdAt` | DateTime | When scheduler created the row |
| `fireAt` | DateTime | When row should become READY |
| `startedAt` | DateTime? | When executioner picked it up |
| `completedAt` | DateTime? | When it finished (success or final failure) |
| `payload` | Json | Loose job data: user IDs, entity refs, config |
| `maxRetries` | Int | Default 3 |
| `retryCount` | Int | Default 0 |
| `errorMessage` | String? | Last error string if FAILED |

**State machine:**
```
SCHEDULED → PENDING → READY → RUNNING → COMPLETE
                                       ↘ FAILED (→ READY if retries remain)
```

---

## 4. Docker & Local Dev

### `docker-compose.yml` service order

```
postgres (healthcheck)
  → migrator (prisma migrate deploy, exits)
    → auth, server, scheduler, executioner
      → web (Vite dev server in dev / Caddy in prod)
```

**`postgres`**: official `postgres` image with healthcheck (`pg_isready`).
**`migrator`**: built from `packages/db`; runs `npx prisma migrate deploy` then exits. All app services declare `depends_on: migrator: condition: service_completed_successfully`.
**`web` (production)**: Caddy container serving the pre-built `apps/web/dist/` as static files, acting as a reverse proxy in front of `server` and `auth` for a single entry point. Routing: `/auth/*` → auth:4001, `/graphql` → server:4000, all other paths → static files.

### Environment variables
All services read from a shared root `.env`:
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `SENDGRID_API_KEY`
- `NODE_ENV`

### Production override (`docker-compose.prod.yml`)
- Swaps Vite dev server for Caddy container
- Sets `NODE_ENV=production`
- Removes volume mounts for live reload

---

## 5. CI/CD Migration Strategy

Two complementary layers ensure migrations always run before new code:

**Docker Compose (local + prod parity):** The `migrator` service runs `prisma migrate deploy` on every `docker compose up` and must complete successfully before any app service starts.

**CI/CD pipeline (GitHub Actions or equivalent):** A migration step runs `prisma migrate deploy` against the production `DATABASE_URL` before the deploy step rolls out new containers. If the migration fails, the deploy does not proceed.

---

## 6. Inter-Service Communication Summary

```
Browser   → apps/auth   → packages/db  (Session, User)
Browser   → apps/server → packages/db  (all other models)

apps/scheduler   → packages/db  (INSERT job_queue rows)
apps/executioner → packages/db  (SELECT/UPDATE job_queue rows)
apps/executioner → external     (SendGrid, etc.)

apps/server validates JWTs using shared JWT_SECRET (no Supabase call)
```

No inter-service HTTP calls. All coordination happens through the shared Postgres database.
