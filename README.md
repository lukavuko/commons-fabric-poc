# Commons Fabric — PoC

> A federated community-building platform where local groups publish events and announcements, and members receive curated updates on their own schedule, through their preferred channels, with zero noise.

---

## Tech Stack

| Layer         | Technology                                |
| ------------- | ----------------------------------------- |
| Frontend      | React 19, Vite 6, Tailwind CSS 4          |
| API           | Apollo Server 5, GraphQL, Express 5       |
| Auth          | Express 5, JWT (access + refresh)         |
| Database      | PostgreSQL 16, Prisma 7                   |
| Job System    | node-cron scheduler + poll-based executor |
| Notifications | SendGrid (email)                          |
| Infra         | Docker Compose, Pulumi, Caddy             |
| Language      | TypeScript 5 (ESM throughout)             |

---

## Repo Structure

```
commons-fabric-poc/
│
├── apps/
│   ├── auth/               # Auth service — register, login, refresh, logout (Express, :4001)
│   ├── executioner/        # Job runner — polls job_queue, dispatches handlers (SendGrid, pino)
│   ├── scheduler/          # Job scheduler — promotes job_queue rows on cron (node-cron, pino)
│   ├── server/             # GraphQL API — queries, mutations, auth context (Apollo, :4000)
│   └── web/                # SPA — React + Vite + Tailwind (:5173)
│
├── design-system/
│   └── MASTER.md           # Design system reference (colors, typography, components)
│
├── docs/
│   ├── notes/              # Architecture, features, roles, styling, MVP slices
│   ├── misc/               # CLI commands reference
│   ├── superpowers/        # Migration plans and design specs
│   ├── dev-philosophy.md   # Engineering principles
│   └── next-steps.md       # Current priorities and open issues
├── infra/                  # Pulumi IaC — VPS bootstrap, deploy, DNS
│
├── packages/
│   ├── auth-tokens/        # Shared JWT signing/verification + password hashing (@cfp/auth-tokens)
│   ├── defaults/           # Shared constants and defaults (@cfp/defaults)
│   └── db/                 # Prisma client + schema + migrations (@cfp/db)
│       └── prisma/
│           ├── schema.prisma       # Source of truth for the database
│           └── migrations/         # Versioned SQL migrations
│
├── scripts/                # Manual test/verification scripts (test-slice-*.sh)
│
├── docker-compose.yml      # Local dev stack (7 services)
└── docker-compose.prod.yml # Production overrides (Caddy, NODE_ENV=production)
```

---

## Documentation Map

| Document                                                           | Purpose                                                        |
| ------------------------------------------------------------------ | -------------------------------------------------------------- |
| [`docs/notes/1_ARCHITECTURE.md`](docs/notes/1_ARCHITECTURE.md)     | Stack diagram, service responsibilities, hosting, CI/CD        |
| [`docs/notes/2_FEATURES.md`](docs/notes/2_FEATURES.md)             | Feature specs and planned capabilities                         |
| [`docs/notes/3_ROLES&PERMS.md`](docs/notes/3_ROLES&PERMS.md)       | Role hierarchy, permission model                               |
| [`docs/notes/5_STYLING.md`](docs/notes/5_STYLING.md)               | UI conventions, Tailwind usage, design tokens                  |
| [`docs/notes/7_MVP_SLICE_PLAN.md`](docs/notes/7_MVP_SLICE_PLAN.md) | MVP breakdown into implementable slices                        |
| [`docs/dev-philosophy.md`](docs/dev-philosophy.md)                 | Engineering principles (DB as truth, minimalism, transparency) |
| [`docs/next-steps.md`](docs/next-steps.md)                         | Current priorities and open issues                             |
| [`docs/misc/commands.md`](docs/misc/commands.md)                   | Useful CLI commands and workflows                              |
| [`design-system/MASTER.md`](design-system/MASTER.md)               | Design system master reference                                 |

---

---

## Quick Start (Docker Compose)

### Development Prerequisites

| Tool                 | Version | Notes                                                    |
| -------------------- | ------- | -------------------------------------------------------- |
| **Node.js**          | 22+     | [nodejs.org/en/download](https://nodejs.org/en/download) |
| **npm**              | 10+     | Ships with Node.                                         |
| **Docker + Compose** | Latest  | [docs.docker.com/get-docker](https://docs.docker.com/get-docker/) installed in wsl2 if using Windows |
| **PostgreSQL**       | 16+     | [postgresql.org/download](https://www.postgresql.org/download/) — needs a **direct** (non-pooled) URL for migrations |

Create your env file, fill in values (see Environment Variables below), and start docker in wsl. All services + Postgres start in dependency order; migrations run automatically.

```bash
wsl docker compose up --build
```

Boot order: `postgres` → `migrator` → [`auth`, `server`, `scheduler`, `executioner`] → `web`

### Service URLs

| Service     | URL                               |
| ----------- | --------------------------------- |
| Frontend    | http://localhost:5173             |
| GraphQL API | http://localhost:4000/api/graphql |
| Auth        | http://localhost:4001             |

<details>
<summary><strong>Local without Docker</strong></summary>

```bash
cp .env.example .env
npm install

# Run migrations (requires direct DATABASE_URL)
cd packages/db && npx prisma migrate dev --name init && cd ../..

# Start all services concurrently
npm run dev
```

</details>

---

## Environment Variables

| Variable           | Required | Notes                                                   |
| ------------------ | -------- | ------------------------------------------------------- |
| `DATABASE_URL`     | Yes      | Direct (non-pooled) Postgres connection                 |
| `JWT_SECRET`       | Yes      | Signs access + refresh tokens                           |
| `SENDGRID_API_KEY` | Prod     | Optional locally; required for email jobs               |
| `EMAIL_TRANSPORT`  | Yes      | `console` if API_KEY not provided, otherwise `sendgrid` |


---

## Common Commands

```bash
# Development
npm run dev                          # Start all 5 services concurrently
npm run test                         # Run tests across all workspaces

# Database (run from packages/db/)
npx prisma migrate dev --name <desc> # New migration after schema change
npx prisma generate                  # Regenerate client types
npx prisma studio                    # Browse DB in browser UI
npx prisma migrate reset             # Nuke + recreate (destructive)

# Single service
npm run dev --workspace=apps/web     # Just the frontend
npm run test --workspace=apps/auth   # Just auth tests
```

---

_Commons Fabric PoC — May 2026_
