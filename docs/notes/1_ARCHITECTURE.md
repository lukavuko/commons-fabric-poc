# Commons Fabric Project — Technical Architecture

**Version**: 2.0
**Date**: April 2026
**Status**: Active Development

---

## Executive Summary

Commons Fabric is a federated community-building platform built to solve a real problem: local communities are fragmented across too many tools, too many channels, and too many platforms — none of which talk to each other.

Our answer is a calendar-first, subscription-driven app where communities can publish events and announcements, and members receive curated updates on their own terms (frequency, channel, timing). Web scraping agents will eventually reduce the manual burden of keeping community profiles up to date.

**Founding principles:** autonomy (user and community), visibility (bridging local discovery gaps), governance (integrity of community management), and accessibility through simplicity (low barrier to get value).

**Hard constraints:**

- All data hosted in Canada
- No dependence on highly centralized, profit-seeking services
- $0 budget — free tiers only

---

## Architecture Overview

### The Full Stack at a Glance

```
 ╔══════════════════════════════════════════════════════════════════════╗
 ║                      User Browser (Client)                          ║
 ║              React 19 SPA · Vite · TypeScript · Tailwind            ║
 ║         gqlFetch() → GraphQL queries/mutations · React Router       ║
 ╚══════════════════════════════╤═══════════════════════════════════════╝
                                │ HTTPS
                                ▼
 ╔══════════════════════════════════════════════════════════════════════╗
 ║                    Caddy (production only)                           ║
 ║         Reverse proxy + automatic TLS + static file serving         ║
 ║                                                                      ║
 ║   /auth/*      ──────────────────────────► auth:4001                ║
 ║   /api/graphql ──────────────────────────► server:4000              ║
 ║   /*           ──────────────────────────► /srv (built React SPA)   ║
 ╚════════════╤════════════════════════════════════╤════════════════════╝
              │                                    │
              ▼                                    ▼
 ┌────────────────────────┐          ┌─────────────────────────────────┐
 │      apps/auth         │          │         apps/server             │
 │      Express 5         │          │    Express 5 + Apollo Server 5  │
 │      port 4001         │          │         port 4000               │
 │                        │          │                                 │
 │  POST /auth/register   │          │  POST /api/graphql              │
 │  POST /auth/login      │          │  ├─ Verify JWT (jose)           │
 │  POST /auth/refresh    │          │  ├─ Attach user to context      │
 │  POST /auth/logout     │          │  ├─ Run resolvers               │
 │  GET  /auth/verify-... │          │  │   ├─ Queries (read data)     │
 │                        │          │  │   ├─ Mutations (write data)  │
 │  bcryptjs (passwords)  │          │  │   └─ RBAC enforcement        │
 │  jose (JWT HS256)      │          │  └─ On event/announcement:      │
 │  SHA-256 (token hash)  │          │     INSERT job_queue row        │
 │  SendGrid (verify)     │          │     status = READY              │
 └──────────┬─────────────┘          └──────────────┬──────────────────┘
            │                                       │
            └─────────────────┬─────────────────────┘
                              │ SQL via Prisma (@cfp/db)
                              ▼
 ╔══════════════════════════════════════════════════════════════════════╗
 ║                        PostgreSQL Database                           ║
 ║                                                                      ║
 ║  db  ──  single shared Prisma client across all services   ║
 ║                                                                      ║
 ║  Core data:  User · Community · Hub · Event · Announcement          ║
 ║              Comment · Subscription · UserEvent · Session           ║
 ║                                                                      ║
 ║  Governance: UserRole · Role · RolePermission · Permission          ║
 ║                                                                      ║
 ║  Job queue:  job_queue                                               ║
 ║              SCHEDULED ──► PENDING ──► READY ──► RUNNING            ║
 ║                                                   ├──► COMPLETE     ║
 ║                                                   └──► FAILED       ║
 ║                                           (retry if count < max)    ║
 ╚═══════════╤═══════════════════════════════════════╤═════════════════╝
             │                                       │
             ▼                                       ▼
 ┌───────────────────────┐            ┌──────────────────────────────┐
 │    apps/scheduler     │            │      apps/executioner        │
 │    node-cron          │            │      setInterval (10s poll)  │
 │                       │            │                              │
 │  Every 5 min:         │            │  Picks up READY rows:        │
 │  SCHEDULED → PENDING  │            │  1. Mark RUNNING             │
 │  (within 24h window)  │            │  2. Dispatch by serviceName  │
 │  PENDING → READY      │            │  3. Mark COMPLETE or FAILED  │
 │  (fireAt has passed)  │            │  4. Retry if retries remain  │
 │                       │            │                              │
 │  Inserts scheduled    │            │  Handlers:                   │
 │  digest jobs with     │            │  ├─ notify-realtime-subs     │
 │  future fireAt        │            │  └─ send-weekly-digest       │
 └───────────────────────┘            └──────────────┬───────────────┘
                                                     │
                                                     ▼
                                          ┌─────────────────────┐
                                          │  SendGrid (email)   │
                                          │  Future: SMS, push  │
                                          └─────────────────────┘

 ┌──────────────────────────────────────────────────────────────────┐
 │  migrator (Docker only — runs once on stack startup)             │
 │  npx prisma migrate deploy → exits 0 → all other services start │
 └──────────────────────────────────────────────────────────────────┘
```

### Current Stack Table

| Layer                       | Technology                                  | Version              | Status                                            |
| --------------------------- | ------------------------------------------- | -------------------- | ------------------------------------------------- |
| **Frontend**                | React + Vite (CSR/SPA)                      | React 19.2, Vite 6.0 | ✅                                                |
| **Routing**                 | React Router DOM                            | 7.1.1                | ✅                                                |
| **Styling**                 | Tailwind CSS v4                             | 4.1                  | ✅                                                |
| **GraphQL Client**          | Raw `gqlFetch` (no Apollo Client lib yet)   | —                    | ⚠️ Partial                                        |
| **API server**              | Express 5 + Apollo Server 5                 | 5.1 / 5.5            | ✅                                                |
| **API layer**               | GraphQL `/api/graphql`                      | graphql 16           | ✅                                                |
| **ORM**                     | Prisma 7 + `@prisma/adapter-pg`             | 7.7                  | ✅                                                |
| **Database**                | PostgreSQL                                  | —                    | ✅                                                |
| **Auth service**            | In-house Express (jose + bcryptjs)          | —                    | ✅                                                |
| **Email**                   | SendGrid                                    | 8.1.6                | ⚠️ Wired in auth, not in executioner handlers yet |
| **Scheduler**               | node-cron                                   | 3.x                  | ✅ Running, no jobs inserted yet                  |
| **Executioner**             | setInterval poll                            | —                    | ✅ Running, no handlers wired yet                 |
| **Job queue**               | `job_queue` Postgres table                  | —                    | ✅ Schema ready, migration pending                |
| **Logging**                 | Pino + pino-pretty                          | 10.3                 | ✅                                                |
| **Monorepo**                | npm workspaces                              | —                    | ✅                                                |
| **Local dev orchestration** | Docker Compose                              | —                    | ✅                                                |
| **Production proxy**        | Caddy 2                                     | —                    | ✅ Config ready                                   |
| **RBAC enforcement**        | Schema defined, resolvers not enforcing yet | —                    | ⚠️ Partial                                        |
| **ICS export**              | Not implemented                             | —                    | ⬜                                                |
| **GraphQL codegen**         | Not set up                                  | —                    | ⬜                                                |

---

## A Deeper Dive

### Frontend — React SPA + Vite

The frontend is a **client-side rendered (CSR) single-page application**. All rendering happens in the user's browser — the server just delivers static files (HTML, JS, CSS).

**Why CSR over SSR?** The app is deeply personalized (per-user subscriptions, community roles, notification preferences), updates frequently, and needs instant UI feedback without full page reloads. SSR would give us a marginal SEO benefit at the cost of server compute and complexity. Not worth it for a community platform that users are authenticated into.

**Why Vite?** Fastest dev server available. ES module-native, minimal config, and ships a clean production bundle. It also has first-class Tailwind v4 and React plugins.

In production, `apps/web` is built into static files and served by Caddy directly from `/srv`. No node process runs for the frontend in production — just a file server.

---

### API Layer — Apollo Server + GraphQL

The backend exposes a **single GraphQL endpoint** at `/api/graphql` via Apollo Server running on Express.

**Why GraphQL over REST?** The data model here is deeply relational — a feed query needs events, announcements, community info, user RSVPs, and notification preferences in one shot. With REST that's 4–5 endpoints and an overfetch problem. GraphQL lets the client ask for exactly what it needs, and it auto-documents via Apollo Sandbox. It also decouples the DB schema from the API contract, which matters as the schema evolves.

**Why Apollo Server?** Shares the TypeScript ecosystem with the frontend. The context system cleanly handles JWT verification and user attachment per request. Apollo Sandbox (available at `/api/graphql` in dev) acts as a free interactive API explorer.

Resolvers handle all business logic: data access via Prisma, auth checks via context, and side-effects like inserting job queue rows on event creation.

---

### Database & ORM — PostgreSQL + Prisma

**PostgreSQL** because the data model is relational by nature — communities have members, members have roles, roles have permissions, events have RSVPs. Integrity constraints matter here (governance, announcements). A document store would fight the model.

**Prisma 7** handles schema-as-code (`schema.prisma`), generates TypeScript types, builds migration files, and provides a type-safe query builder. One schema file is the source of truth — edit it, run `prisma migrate dev`, done.

The Prisma client lives in `db` and is shared across all services (`@cfp/db`). No service maintains its own connection pool or client instance.

**Key design decisions in the schema:**

- CUIDs on all public-facing models; integer PKs on internal/junction tables
- Polymorphic associations on `UserRole` and `Comment` (no DB FK — enforced via CHECK constraints added manually in migrations)
- `onDelete: Cascade` on personal data; `onDelete: SetNull` on community content (preserves history when a user leaves)

---

### Authentication — In-House Auth Service

`apps/auth` is a minimal Express service handling the full auth lifecycle. We built this ourselves instead of relying on Supabase Auth to satisfy the **Canadian data residency** requirement and remove a third-party dependency from a core trust surface.

**How it works:**

- **Registration:** bcrypt-hash the password, generate a random email verification token, store both on the User, send a verification email via SendGrid
- **Login:** verify password hash → issue a short-lived JWT access token (3h, signed with `JWT_SECRET`) + a long-lived refresh token (30d, signed with `JWT_REFRESH_SECRET`) → store SHA-256 hash of the refresh token in the `sessions` table
- **Token refresh:** verify refresh token JWT signature → look up SHA-256 hash in sessions → issue new access token
- **Logout:** delete the session row (revokes the refresh token)

**Why SHA-256 for token storage (not bcrypt)?** The refresh token is already a signed JWT — its integrity is guaranteed by the signature. SHA-256 gives us a fast, deterministic lookup key for the sessions table without the computational overhead of bcrypt (which is intentionally slow and non-deterministic for password protection).

The `apps/server` GraphQL service validates access tokens using `jose.jwtVerify` with the same `JWT_SECRET`. No auth service HTTP call on every request — just a local signature check.

---

### Microservice Architecture

The repo is structured as an **npm workspaces monorepo** with five independent services:

```
apps/
  web/          React + Vite frontend
  server/       GraphQL API
  auth/         Auth service
  scheduler/    Job queue promotion
  executioner/  Job runner
packages/
  db/           Shared Prisma client + schema
```

**Why separate services?** Each runs independently in its own Docker container, can be restarted, scaled, or replaced without touching the others. The scheduler and executioner are the most natural candidates for isolation — they have no user-facing interface and have different uptime and resource profiles than the API.

**How do they communicate?** Only through the shared PostgreSQL database. No inter-service HTTP calls. This is an intentional constraint — it means any service can go down and come back up without causing cascading failures. The job queue table is the contract between the scheduler and the executioner.

---

### Scheduled Jobs & Notification System

Two types of notifications with different latency requirements:

**Realtime notifications** (subscribers who want instant updates):
When a steward creates an event or announcement, the GraphQL resolver inserts a `job_queue` row with `status = READY` and `serviceName = "notify-realtime-subscribers"`. The executioner picks it up within its next poll cycle (≤10s). The handler queries all realtime subscribers for that community and dispatches emails.

**Periodic digests** (subscribers who want weekly/daily/etc. summaries):
The scheduler inserts `job_queue` rows with `status = SCHEDULED` and a `fireAt` matching the user's preferred digest time. The promotion loop transitions them through `SCHEDULED → PENDING → READY` as the time approaches. The executioner handler collects all undelivered content since the last digest and sends one batched email.

**Job lifecycle:**

| Status      | Meaning                                                                         |
| ----------- | ------------------------------------------------------------------------------- |
| `SCHEDULED` | Registered, but not for today's 24 hour window (ie. fires tomorrow or later)    |
| `PENDING`   | To be launched at some point today, within the next 24h — scheduler is watching |
| `READY`     | Current time has passed the `fireAt` time and is now awaiting the executioner   |
| `RUNNING`   | Executioner has picked it up and started the job                                |
| `COMPLETE`  | Job finished successfully                                                       |
| `FAILED`    | Job failed after exhausting retries if more than 1 specified                    |

On failure: `retryCount` increments, status resets to `READY` if `retryCount < maxRetries`. Final failure records the `errorMessage` for debugging.

---

### Deployment — Docker Compose + VPS

Every service ships as a Docker container. `docker-compose.yml` at the repo root orchestrates the full stack locally and in production.

**Startup order is enforced:**

```
postgres (healthcheck: pg_isready)
  └─► migrator (prisma migrate deploy, exits 0)
        └─► auth · server · scheduler · executioner
              └─► web
```

The migrator service runs `prisma migrate deploy` on every `docker compose up` and must exit successfully before any application service starts. This guarantees the schema is always up to date before code runs.

**Production override** (`docker-compose.prod.yml`):

- Swaps the Vite dev server for a Caddy container (pre-built static files + reverse proxy + automatic TLS)
- Sets `NODE_ENV=production` across all services

---

### Hosting

| Service                    | Target                                                   | Rationale                                                         |
| -------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------- |
| **All containers**         | Oracle Cloud Free (Montreal/Toronto) or Fly.io (Toronto) | Always-on, Canadian region, free tier                             |
| **Database**               | Aiven (CA region) or self-hosted on Oracle Cloud         | Canadian residency, free tier available                           |
| **Email**                  | SendGrid                                                 | 100 emails/day free; swap for Resend (3k/month) when limits hit   |
| **Frontend (alternative)** | Cloudflare Pages / Netlify                               | If we want CDN-distributed static hosting separately from the VPS |

---

### Infrastructure as Code — Pulumi

Infrastructure is managed with **Pulumi (TypeScript)** in the `infra/` directory. It's not a workspace package — it has its own `node_modules` and is managed independently with the Pulumi CLI.

**Why Pulumi?** Same language as the rest of the stack. No HCL, no YAML DSL — just TypeScript. Providers exist for every service we need (Oracle Cloud, Fly.io, Cloudflare, Aiven). State is stored in Pulumi Cloud (free for individuals/small teams) or any S3-compatible backend.

**What it manages:**

- **Bootstrap** — installs Docker on the VPS, clones the repo into `/opt/cfp`
- **Deploy** — pulls latest `main`, rebuilds containers, runs `docker compose up --build` with the prod override
- **DNS** (Cloudflare) — commented out until the domain is confirmed, then uncomment and `pulumi up`

**First-time setup:**

```bash
cd infra
npm install
pulumi stack init dev

# Required secrets (never committed):
pulumi config set --secret cfp-poc:host <vps-ip>
pulumi config set --secret cfp-poc:sshPrivateKey "$(cat ~/.ssh/id_rsa)"

pulumi up   # preview → confirm → apply
```

**Subsequent deploys** (`pulumi up`) SSH into the VPS, pull the latest code, and restart the stack. Caddy handles TLS certificate issuance automatically on first run — no cert management needed.

---

### CI/CD

Migrations are applied in two complementary places to prevent schema drift from ever reaching production:

1. **Docker Compose** — the `migrator` service runs on every `docker compose up`, local or remote. A failed migration aborts the deploy before any service starts.

2. **CI/CD pipeline** (GitHub Actions) — a migration step runs `prisma migrate deploy` against the production DB before rolling out new containers. Failed migration = no deploy.

**Development workflow:**

```bash
cd db
npx prisma migrate dev --name <description>   # generate + apply migration
npx prisma generate                            # regenerate client types
```

Changes to `schema.prisma` need a migration before any service can use new fields. The generated client is re-exported from `@cfp/db` so all services pick it up automatically after `npm install`.

---

## Development Workflow

**First-time setup:**

```bash
git clone <repo>
cd commons-fabric-poc
cp .env.example .env        # fill in DATABASE_URL, JWT_SECRET, etc.
npm install

cd db
npx prisma migrate dev --name init   # requires a direct (non-pooled) DB URL
npx prisma generate
cd ../..

npm run dev    # starts all 5 services concurrently
```

**Adding a database field:**

```bash
# 1. Edit db/prisma/schema.prisma
# 2. Generate and apply migration
cd db && npx prisma migrate dev --name <description>
# 3. Types regenerate automatically — import from @cfp/db
```

**Adding a GraphQL field:**
Edit `apps/server/graphql/schema.ts` for the type definition, then add the resolver in `apps/server/graphql/resolvers/`. Apollo Sandbox at `http://localhost:4000/api/graphql` reflects changes live.

**Adding a job handler:**
Register the handler function in `apps/executioner/handlers/index.ts` under a `serviceName` key. Insertions into `job_queue` with that `serviceName` will be routed to it automatically.

**Running tests:**

```bash
npm run test                              # all workspaces
npm run test --workspace=apps/auth        # single service
```

**Full Docker stack locally:**

```bash
docker compose up --build
# postgres → migrator → auth/server/scheduler/executioner → web
```

---

## Back Pocket Alternatives

| Decision              | Current Choice             | Alternative                            | Switch When                                                                                                                          |
| --------------------- | -------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Database host**     | Supabase / self-host       | **Neon.tech** or **Aiven (CA)**        | Canadian residency becomes a hard legal requirement                                                                                  |
| **Auth**              | In-house (jose + bcryptjs) | **Auth.js / Lucia**                    | Need OAuth providers or more complex session management                                                                              |
| **Email**             | SendGrid (100/day free)    | **Resend** (3,000/month free)          | Free tier limits are hit in testing                                                                                                  |
| **Backend runtime**   | Express 5 + Node.js        | **Fastify**                            | Hit Express performance ceiling or want built-in schema validation                                                                   |
| **GraphQL transport** | Apollo Server              | **tRPC**                               | Team goes TypeScript-only and wants end-to-end types without codegen. High switching cost — greenfield decision only                 |
| **GraphQL client**    | Raw `gqlFetch`             | **@apollo/client**                     | UI state complexity grows (optimistic updates, caching, subscriptions)                                                               |
| **Monorepo tooling**  | npm workspaces             | **Turborepo**                          | CI build times become painful (adds incremental build caching)                                                                       |
| **Static hosting**    | Caddy on VPS               | **Cloudflare Pages / Netlify**         | Want global CDN distribution without managing the proxy                                                                              |
| **Job queue**         | Postgres `job_queue` table | **BullMQ (Redis)**                     | Job volume grows large enough that Postgres polling becomes a bottleneck                                                             |
| **IaC**               | Pulumi (TypeScript)        | **OpenTofu** (OSS Terraform fork, HCL) | Team has prior Terraform experience or needs a provider not yet in Pulumi's ecosystem                                                |
| **IaC**               | Pulumi (TypeScript)        | **Ansible**                            | Configuration management over a fleet of VMs rather than cloud resource provisioning                                                 |
| **IaC**               | Pulumi (TypeScript)        | **Kamal** (Shopify)                    | Simplest possible Docker-to-VPS deploy — single YAML config, zero-downtime rolling restarts via SSH, no resource provisioning needed |

---

## Stack Risks & Mitigation

**GraphQL N+1 queries**
Nested resolvers can trigger one DB query per item in a list. Mitigate by using Prisma's `include` to eager-load relations and applying DataLoader-style batching where lists get large. Monitor query counts early.

**Email deliverability**
SendGrid's free tier caps at 100 emails/day — enough for testing, not for a live community. Configure SPF and DKIM records for the sending domain before any pilot. Swap to Resend when limits are hit (3,000/month free).

**Migration safety**
`prisma migrate deploy` is non-destructive by default, but destructive migrations (column drops, renames) need care. Always review generated SQL before running in production. The CI/CD gate prevents deploying before migrations succeed, but it doesn't prevent a bad migration from running.

**Auth surface area**
Rolling your own auth means owning the security. The current implementation covers the basics (bcrypt, JWT, session revocation) but has no rate limiting on login attempts, no account lockout, and no OAuth. Add rate limiting (e.g. `express-rate-limit`) before any public pilot.

**Data residency**
The constraint is Canadian hosting. Oracle Cloud (Montreal/Toronto) and Aiven (CA region) satisfy this. Fly.io has a Toronto region for the backend. Verify any new service's region before wiring it in.

**RBAC not yet enforced**
The role/permission schema exists but resolvers only call `requireAuth()` — they don't check `UserRole`/`Permission`. Any authenticated user can currently mutate anything. Enforcement must be in place before community steward features are exposed.
