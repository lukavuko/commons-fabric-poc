# Commons Fabric — PoC

> Connecting local communities across fragmented platforms — one calendar at a time.

A federated community-building platform where local groups publish events and announcements, and members receive curated updates on their own schedule, through their preferred channels, with zero noise.

---

## Contents

- [Prerequisites](#prerequisites)
- [Repo Structure](#repo-structure)
- [Architecture](#architecture)
- [Development](#development)
- [Contact](#contact)

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| **Node.js** | 22+ | |
| **npm** | 10+ | |
| **Docker + Compose** | Latest | Required for the full local stack |
| **PostgreSQL** | 16+ | Aiven, Neon, or local — needs a **direct** (non-pooled) URL for migrations |
| **Pulumi CLI** | 3+ | `npm install -g pulumi` — only needed for infra management |
| **SendGrid API key** | — | Optional for local dev, required in production |

---

## Repo Structure

```
commons-fabric-poc/
│
├── apps/                         # Independently deployable services
│   ├── auth/                     # Auth service — register, login, refresh, logout
│   ├── executioner/              # Job runner — polls job_queue, dispatches handlers
│   ├── scheduler/                # Job scheduler — promotes job_queue row statuses
│   ├── server/                   # GraphQL API — Apollo Server + Express
│   └── web/                      # React + Vite SPA
│
├── packages/
│   └── db/                       # Shared Prisma client + schema (imported as @cfp/db)
│       └── prisma/
│           ├── schema.prisma     # Source of truth for the database
│           ├── schema.dbml       # Visualization-ready copy (dbdiagram.io)
│           └── migrations/       # Versioned SQL migrations
│
├── infra/                        # Pulumi IaC — VPS bootstrap, deploy, DNS
│
├── docs/
│   └── notes/                    # Architecture, features, roles & perms, Q&A
│
├── mockups/                      # UI mockups and design references
│
├── docker-compose.yml            # Local dev stack
├── docker-compose.prod.yml       # Production overrides (Caddy, NODE_ENV=production)
└── .env.example                  # Environment variable template
```

---

## Architecture

Full technical details — stack diagram, service responsibilities, job queue design, hosting options, IaC, and CI/CD — live in [`docs/notes/1_ARCHITECTURE.md`](docs/notes/1_ARCHITECTURE.md).

---

## Development

### Option A — Docker Compose (recommended)

The closest thing to production you can run locally. All five services + Postgres start in the right order, migrations run automatically.

```bash
cp .env.example .env          # fill in your values
docker compose up --build
```

Services come up at:
- Frontend → http://localhost:5173
- GraphQL API → http://localhost:4000/api/graphql
- Auth → http://localhost:4001

### Option B — Local (no Docker)

Run services individually when you want faster iteration on a single service.

```bash
cp .env.example .env
npm install

# Run the DB migration (requires a direct, non-pooled DATABASE_URL)
cd packages/db && npx prisma migrate dev --name init && cd ../..

# Start everything concurrently
npm run dev
```

### Common tasks

```bash
# Database
cd packages/db
npx prisma migrate dev --name <description>   # new migration after schema change
npx prisma generate                            # regenerate types (auto-runs after migrate)
npx prisma studio                              # browse the DB in a UI

# Tests
npm run test                                   # all workspaces
npm run test --workspace=apps/auth             # single service

# Infrastructure (from infra/)
pulumi preview                                 # dry run
pulumi up                                      # apply to VPS
```

### Adding a notification handler

Register a new handler in `apps/executioner/handlers/index.ts` under a `serviceName` key. Any `job_queue` row inserted with that `serviceName` will be routed to it automatically.

---

## Contact

- **Project site** → [commonsfabric.ca](https://commonsfabric.ca/?referrer=luma)
- **Dev log & pins** → [lukavuko.github.io/cfp.github.io](https://lukavuko.github.io/cfp.github.io/)

---

*Commons Fabric PoC — April 2026*
