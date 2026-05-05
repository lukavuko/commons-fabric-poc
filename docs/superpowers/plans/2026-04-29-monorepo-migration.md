# Monorepo Migration & Service Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the single-package repo into an npm workspaces monorepo with five apps (web, server, auth, scheduler, executioner) and one shared package (db), with full Docker Compose local dev support and a minimal in-house auth service.

**Architecture:** npm workspaces with `apps/` and `packages/` directories. `db` owns Prisma and exports a shared `PrismaClient`. All services communicate only through Postgres — no inter-service HTTP calls. A `migrator` Docker service runs `prisma migrate deploy` and must complete before any app starts.

**Tech Stack:** npm workspaces, Prisma 7, Express 5, `jose` 5 (JWT HS256), `bcryptjs` (password hashing), Node.js built-in `crypto` (token hashing), `node-cron`, `vitest`, Docker Compose, Caddy 2.

---

## File Map

### Root

- Modify: `package.json` — workspaces config, shared devDeps only
- Modify: `tsconfig.json` — base config only (no app-specific paths)
- Create: `docker-compose.yml`
- Create: `docker-compose.prod.yml`
- Create: `.env.example`
- Delete: `prisma.config.ts`, `prisma/`, `server/`, `src/`, `vite.config.ts`, `tsconfig.node.json`, `index.html`, `dist/`

### db

- `db/package.json`
- `db/tsconfig.json`
- `db/index.ts` — exports `prisma` client instance + re-exports Prisma types
- `db/prisma.config.ts` — moved from root, simplified to `DATABASE_URL`
- `db/prisma/schema.prisma` — moved from root + `Session` + `JobQueue` + User auth fields
- `db/prisma/migrations/` — moved from root
- `db/Dockerfile` — runs `prisma migrate deploy`

### apps/web

- `apps/web/package.json`
- `apps/web/tsconfig.json`
- `apps/web/tsconfig.node.json`
- `apps/web/vite.config.ts` — moved from root
- `apps/web/index.html` — moved from root
- `apps/web/src/` — all files moved from root `src/`
- `apps/web/src/lib/auth.ts` — new: HTTP client for apps/auth endpoints
- `apps/web/src/lib/graphql.ts` — update: reads token from localStorage
- `apps/web/Dockerfile` — dev: Vite dev server
- `apps/web/Dockerfile.prod` — prod: Caddy serving built static files
- `apps/web/Caddyfile` — Caddy config: static + reverse proxy

### apps/server

- `apps/server/package.json`
- `apps/server/tsconfig.json`
- `apps/server/index.ts` — moved from `server/index.ts`
- `apps/server/graphql/context.ts` — moved + rewritten: `jose` replaces Supabase
- `apps/server/graphql/schema.ts` — moved unchanged
- `apps/server/graphql/resolvers/` — moved unchanged
- `apps/server/lib/logger.ts` — moved unchanged
- `apps/server/Dockerfile`
- DELETE: `apps/server/lib/prisma.ts` (use `@cfp/db`)
- DELETE: `apps/server/lib/supabase.ts`

### apps/auth

- `apps/auth/package.json`
- `apps/auth/tsconfig.json`
- `apps/auth/index.ts`
- `apps/auth/routes/auth.ts`
- `apps/auth/lib/jwt.ts`
- `apps/auth/lib/hash.ts`
- `apps/auth/lib/email.ts`
- `apps/auth/Dockerfile`
- `apps/auth/tests/hash.test.ts`
- `apps/auth/tests/jwt.test.ts`

### apps/scheduler

- `apps/scheduler/package.json`
- `apps/scheduler/tsconfig.json`
- `apps/scheduler/index.ts`
- `apps/scheduler/lib/promote.ts`
- `apps/scheduler/Dockerfile`
- `apps/scheduler/tests/promote.test.ts`

### apps/executioner

- `apps/executioner/package.json`
- `apps/executioner/tsconfig.json`
- `apps/executioner/index.ts`
- `apps/executioner/lib/poll.ts`
- `apps/executioner/handlers/index.ts`
- `apps/executioner/Dockerfile`
- `apps/executioner/tests/poll.test.ts`

---

## Task 1: Set up npm workspaces root and db

**Files:**

- Modify: `package.json`
- Modify: `tsconfig.json`
- Create: `db/package.json`
- Create: `db/tsconfig.json`
- Create: `db/index.ts`
- Create: `db/prisma.config.ts`
- Move: `prisma/schema.prisma` → `db/prisma/schema.prisma` (with additions)
- Move: `prisma/migrations/` → `db/prisma/migrations/`
- Create: `db/Dockerfile`
- Create: `.env.example`

---

- [ ] **Step 1.1: Rewrite root `package.json` as workspace root**

```json
{
  "name": "cfp-poc",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "concurrently -n web,server,auth,scheduler,executioner -c blue,magenta,green,yellow,cyan \"npm run dev --workspace=apps/web\" \"npm run dev --workspace=apps/server\" \"npm run dev --workspace=apps/auth\" \"npm run dev --workspace=apps/scheduler\" \"npm run dev --workspace=apps/executioner\"",
    "test": "npm run test --workspaces --if-present"
  },
  "devDependencies": {
    "@types/node": "^20.19.39",
    "concurrently": "^9.1.0",
    "tsx": "^4.19.2",
    "typescript": "^5",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 1.2: Rewrite root `tsconfig.json` as base only**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true
  }
}
```

- [ ] **Step 1.3: Create `db/package.json`**

```json
{
  "name": "@cfp/db",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./index.ts"
  },
  "scripts": {
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:deploy": "prisma migrate deploy",
    "prisma:studio": "prisma studio",
    "prisma:reset": "prisma migrate reset"
  },
  "dependencies": {
    "@prisma/adapter-pg": "^7.7.0",
    "@prisma/client": "^7.7.0",
    "pg": "^8.20.0"
  },
  "devDependencies": {
    "dotenv": "^16.0.0",
    "prisma": "^7.7.0"
  }
}
```

- [ ] **Step 1.4: Create `db/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "./dist"
  },
  "include": ["index.ts"]
}
```

- [ ] **Step 1.5: Create `db/index.ts`**

```typescript
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

export const prisma = new PrismaClient({ adapter });

export * from "@prisma/client";
```

- [ ] **Step 1.6: Create `db/prisma.config.ts`**

Remove the Supabase-specific `externalTables` config and use `DATABASE_URL`:

```typescript
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

- [ ] **Step 1.7: Move Prisma files**

```bash
mkdir -p db/prisma
cp -r prisma/migrations db/prisma/migrations
cp prisma/schema.prisma db/prisma/schema.prisma
cp prisma/schema.dbml db/prisma/schema.dbml
```

- [ ] **Step 1.8: Add auth fields to `User` model in `db/prisma/schema.prisma`**

Locate the `User` model and add these three fields before the closing `}`. Also add the `sessions` relation:

```prisma
model User {
  id              String    @id @default(cuid())
  username        String    @unique
  email           String    @unique
  phone           String?
  emailVerifiedAt DateTime?
  phoneVerifiedAt DateTime?
  firstname       String?
  lastname        String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  lastloginAt     DateTime?
  settings        Json?

  // Auth fields (added for in-house auth)
  passwordHash             String?
  emailVerificationToken   String?  @unique

  userRoles             UserRole[]
  createdRoles          Role[]
  createdHubs           Hub[]
  createdCommunities    Community[]
  createdEvents         Event[]
  authoredAnnouncements Announcement[]
  comments              Comment[]
  subscriptions         Subscription[]
  userEvents            UserEvent[]
  sessions              Session[]

  @@index([email])
  @@index([username])
  @@index([lastloginAt], map: "lastlogin_index")
}
```

- [ ] **Step 1.9: Add `JobStatus` enum and `Session` + `JobQueue` models to `db/prisma/schema.prisma`**

Append to the end of the file:

```prisma
// -------------------------------------------------------
// Auth
// -------------------------------------------------------

model Session {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  refreshToken String   @unique  // stores SHA-256 hash of the raw refresh JWT
  expiresAt    DateTime
  createdAt    DateTime @default(now())

  @@index([userId])
  @@map("sessions")
}

// -------------------------------------------------------
// Job Queue
// -------------------------------------------------------

enum JobStatus {
  SCHEDULED
  PENDING
  READY
  RUNNING
  COMPLETE
  FAILED
}

model JobQueue {
  id           String    @id @default(cuid())
  status       JobStatus @default(SCHEDULED)
  serviceName  String
  createdAt    DateTime  @default(now())
  fireAt       DateTime
  startedAt    DateTime?
  completedAt  DateTime?
  payload      Json
  maxRetries   Int       @default(3)
  retryCount   Int       @default(0)
  errorMessage String?

  @@index([status, fireAt])
  @@map("job_queue")
}
```

- [ ] **Step 1.10: Create `db/Dockerfile` (migrator)**

```dockerfile
FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY db/package.json ./db/

RUN npm ci --workspace=db

COPY db/ ./db/

WORKDIR /app/db
CMD ["npx", "prisma", "migrate", "deploy"]
```

- [ ] **Step 1.11: Create `.env.example` at repo root**

```
DATABASE_URL=postgresql://cfp:cfp@localhost:5432/cfp_dev
JWT_SECRET=change-me-in-production-min-32-chars
JWT_REFRESH_SECRET=change-me-refresh-secret-min-32-chars
SENDGRID_API_KEY=SG.xxx
FROM_EMAIL=noreply@commonsfabric.app
APP_URL=http://localhost:5173
```

- [ ] **Step 1.12: Run `npm install` at repo root to create workspace symlinks**

```bash
npm install
```

Expected: `node_modules/@cfp/db` symlinks to `db`.

- [ ] **Step 1.13: Generate Prisma client and create migration**

```bash
cd db
npx prisma migrate dev --name add-auth-and-job-queue
```

Expected: migration file created under `db/prisma/migrations/`, `@prisma/client` regenerated with `Session`, `JobQueue`, `JobStatus`, and the new `User` fields.

- [ ] **Step 1.14: Delete root-level Prisma files**

```bash
rm -rf prisma prisma.config.ts
```

- [ ] **Step 1.15: Commit**

```bash
git add .
git commit -m "feat: set up npm workspaces and move Prisma to db"
```

---

## Task 2: Migrate apps/server

**Files:**

- Create: `apps/server/package.json`
- Create: `apps/server/tsconfig.json`
- Move+Modify: `apps/server/index.ts`
- Move+Modify: `apps/server/graphql/context.ts`
- Move: `apps/server/graphql/schema.ts`
- Move: `apps/server/graphql/resolvers/`
- Move: `apps/server/lib/logger.ts`
- Create: `apps/server/Dockerfile`
- Delete: root `server/`

---

- [ ] **Step 2.1: Create `apps/server/package.json`**

```json
{
  "name": "@cfp/server",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch index.ts",
    "start": "tsx index.ts"
  },
  "dependencies": {
    "@apollo/server": "^5.5.0",
    "@as-integrations/express5": "^1.1.2",
    "@cfp/db": "*",
    "cors": "^2.8.5",
    "express": "^5.1.0",
    "graphql": "^16.13.2",
    "graphql-tag": "^2.12.6",
    "jose": "^5.0.0",
    "pino": "^10.3.1",
    "pino-pretty": "^13.1.3",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0"
  }
}
```

- [ ] **Step 2.2: Create `apps/server/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "./dist"
  },
  "include": ["./**/*.ts"]
}
```

- [ ] **Step 2.3: Move server files**

```bash
mkdir -p apps/server/graphql/resolvers apps/server/lib
cp server/index.ts apps/server/index.ts
cp server/graphql/schema.ts apps/server/graphql/schema.ts
cp server/graphql/resolvers/fields.ts apps/server/graphql/resolvers/fields.ts
cp server/graphql/resolvers/index.ts apps/server/graphql/resolvers/index.ts
cp server/graphql/resolvers/mutation.ts apps/server/graphql/resolvers/mutation.ts
cp server/graphql/resolvers/query.ts apps/server/graphql/resolvers/query.ts
cp server/lib/logger.ts apps/server/lib/logger.ts
```

Do NOT copy `server/lib/prisma.ts` or `server/lib/supabase.ts` — these are replaced.

- [ ] **Step 2.4: Update `apps/server/index.ts` imports**

Change the import path for `buildContext` (no other changes needed in this file):

```typescript
import express from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { typeDefs } from "./graphql/schema.js";
import { resolvers } from "./graphql/resolvers/index.js";
import { buildContext } from "./graphql/context.js";
import { logger } from "./lib/logger.js";

const PORT = Number(process.env.PORT ?? 4000);

async function main() {
  const app = express();
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

  app.use(
    "/api/graphql",
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => buildContext(req),
    }),
  );

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.listen(PORT, () => {
    logger.info(`GraphQL ready at http://localhost:${PORT}/api/graphql`);
  });
}

main().catch((err) => {
  logger.error(err, "Server failed to start");
  process.exit(1);
});
```

- [ ] **Step 2.5: Rewrite `apps/server/graphql/context.ts`**

Replace the Supabase auth check with `jose` JWT verification. The user is now looked up directly by the `sub` claim (which is the User's `id`):

```typescript
import type { Request } from "express";
import { GraphQLError } from "graphql";
import { jwtVerify } from "jose";
import { prisma } from "@cfp/db";

const accessSecret = new TextEncoder().encode(process.env.JWT_SECRET!);

export type AuthUser = { id: string; email: string };

export type Context = {
  user: AuthUser | null;
  prisma: typeof prisma;
  requireAuth: () => AuthUser;
  requireCommunityRole: (
    communityId: string,
    allowedRoles: string[],
  ) => Promise<AuthUser>;
};

export async function buildContext(req: Request): Promise<Context> {
  const auth = req.headers.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  let user: AuthUser | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, accessSecret);
      const userId = payload.sub;
      if (userId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true },
        });
        if (dbUser) user = dbUser;
      }
    } catch {
      // invalid or expired token — user stays null
    }
  }

  const requireAuth = (): AuthUser => {
    if (!user)
      throw new GraphQLError("Authentication required", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    return user;
  };

  const requireCommunityRole = async (
    communityId: string,
    allowedRoles: string[],
  ): Promise<AuthUser> => {
    const authedUser = requireAuth();
    const userRole = await prisma.userRole.findUnique({
      where: {
        userId_entityId: { userId: authedUser.id, entityId: communityId },
      },
      include: { role: true },
    });
    const roleName = userRole?.role.name.toUpperCase() ?? "";
    if (!allowedRoles.map((r) => r.toUpperCase()).includes(roleName)) {
      throw new GraphQLError("Not authorized", {
        extensions: { code: "FORBIDDEN" },
      });
    }
    return authedUser;
  };

  return { user, prisma, requireAuth, requireCommunityRole };
}
```

- [ ] **Step 2.6: Update imports in moved resolver and schema files**

In each file under `apps/server/graphql/resolvers/` and `apps/server/graphql/schema.ts`, update any relative imports that referenced `../lib/prisma` or `../lib/supabase` to use `@cfp/db`. Also add `.js` extensions to all relative imports (required for NodeNext module resolution).

Run this grep to find affected lines:

```bash
grep -rn "lib/prisma\|lib/supabase\|from '\." apps/server/
```

For any import like `from "../lib/prisma"` change to `from "@cfp/db"`.
For any relative import like `from "./schema"` change to `from "./schema.js"`.

- [ ] **Step 2.7: Create `apps/server/Dockerfile`**

```dockerfile
FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY db/package.json ./db/
COPY apps/server/package.json ./apps/server/

RUN npm ci --workspace=apps/server --workspace=db

COPY db/ ./db/
COPY apps/server/ ./apps/server/

RUN cd db && npx prisma generate

WORKDIR /app/apps/server
ENV PORT=4000
EXPOSE 4000
CMD ["node", "--import=tsx/esm", "index.ts"]
```

- [ ] **Step 2.8: Run `npm install` and verify server starts**

```bash
npm install
cd apps/server && npx tsx index.ts
```

Expected: `GraphQL ready at http://localhost:4000/api/graphql`

- [ ] **Step 2.9: Delete original `server/` directory**

```bash
rm -rf server/
```

- [ ] **Step 2.10: Commit**

```bash
git add apps/server/ server/
git commit -m "feat: migrate server to apps/server, replace Supabase auth with jose JWT"
```

---

## Task 3: Migrate apps/web

**Files:**

- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/tsconfig.node.json`
- Move: `apps/web/vite.config.ts`, `apps/web/index.html`, `apps/web/src/`
- Create: `apps/web/src/lib/auth.ts`
- Modify: `apps/web/src/lib/graphql.ts`
- Create: `apps/web/Dockerfile`
- Create: `apps/web/Dockerfile.prod`
- Create: `apps/web/Caddyfile`
- Delete: root `src/`, `vite.config.ts`, `index.html`, `tsconfig.node.json`

---

- [ ] **Step 3.1: Create `apps/web/package.json`**

```json
{
  "name": "@cfp/web",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "date-fns": "^4.1.0",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "react-router-dom": "^7.1.1"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.0",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@vitejs/plugin-react": "^4.3.4",
    "tailwindcss": "^4.1.0",
    "vite": "^6.0.7"
  }
}
```

- [ ] **Step 3.2: Create `apps/web/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3.3: Create `apps/web/tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "skipLibCheck": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 3.4: Move frontend files**

```bash
mkdir -p apps/web
cp -r src apps/web/src
cp vite.config.ts apps/web/vite.config.ts
cp index.html apps/web/index.html
```

- [ ] **Step 3.5: Create `apps/web/src/lib/auth.ts`**

HTTP client for the auth service. Tokens are stored in `localStorage` for PoC convenience:

```typescript
const AUTH_URL = import.meta.env.VITE_AUTH_URL ?? "http://localhost:4001";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export async function register(email: string, password: string): Promise<void> {
  const res = await fetch(`${AUTH_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Registration failed");
  }
}

export async function login(
  email: string,
  password: string,
): Promise<AuthTokens> {
  const res = await fetch(`${AUTH_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Login failed");
  }
  const tokens: AuthTokens = await res.json();
  localStorage.setItem("access_token", tokens.accessToken);
  localStorage.setItem("refresh_token", tokens.refreshToken);
  return tokens;
}

export async function logout(): Promise<void> {
  const refreshToken = localStorage.getItem("refresh_token");
  if (refreshToken) {
    await fetch(`${AUTH_URL}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => {});
  }
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return null;
  const res = await fetch(`${AUTH_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) return null;
  const { accessToken } = await res.json();
  localStorage.setItem("access_token", accessToken);
  return accessToken;
}

export function getAccessToken(): string | null {
  return localStorage.getItem("access_token");
}
```

- [ ] **Step 3.6: Update `apps/web/src/lib/graphql.ts`**

Read the access token from `localStorage` automatically instead of requiring callers to pass it:

```typescript
const GQL_URL =
  import.meta.env.VITE_GRAPHQL_URL ?? "http://localhost:4000/api/graphql";

export async function gqlFetch<T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const token = localStorage.getItem("access_token");
  const res = await fetch(GQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data as T;
}
```

- [ ] **Step 3.7: Update `apps/web/src/lib/supabase.ts` callers**

Search for any component or page that calls Supabase auth methods:

```bash
grep -rn "supabase" apps/web/src/
```

For each auth call (`signIn`, `signOut`, `signUp`), replace with the equivalent from `./auth.ts`. Remove the `supabase.ts` file once it has no callers:

```bash
rm apps/web/src/lib/supabase.ts
```

- [ ] **Step 3.8: Create `apps/web/Dockerfile` (dev)**

```dockerfile
FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/

RUN npm ci --workspace=apps/web

COPY apps/web/ ./apps/web/

WORKDIR /app/apps/web
ENV PORT=5173
EXPOSE 5173
CMD ["npx", "vite", "--host", "0.0.0.0"]
```

- [ ] **Step 3.9: Create `apps/web/Dockerfile.prod` (production with Caddy)**

```dockerfile
# Stage 1: build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
RUN npm ci --workspace=apps/web
COPY apps/web/ ./apps/web/
WORKDIR /app/apps/web
RUN npx vite build

# Stage 2: serve with Caddy
FROM caddy:2-alpine
COPY --from=builder /app/apps/web/dist /srv
COPY apps/web/Caddyfile /etc/caddy/Caddyfile
EXPOSE 80 443
```

- [ ] **Step 3.10: Create `apps/web/Caddyfile`**

```
{
    email {$CADDY_EMAIL}
}

{$DOMAIN:localhost} {
    handle /auth/* {
        reverse_proxy auth:4001
    }
    handle /api/graphql {
        reverse_proxy server:4000
    }
    handle {
        root * /srv
        file_server
        try_files {path} /index.html
    }
}
```

- [ ] **Step 3.11: Delete moved root files**

```bash
rm -rf src/ vite.config.ts index.html tsconfig.node.json dist/
```

- [ ] **Step 3.12: Run `npm install` and verify web app starts**

```bash
npm install
cd apps/web && npx vite
```

Expected: Vite dev server starts at `http://localhost:5173`.

- [ ] **Step 3.13: Commit**

```bash
git add apps/web/ src/ vite.config.ts index.html tsconfig.node.json dist/
git commit -m "feat: migrate frontend to apps/web, replace Supabase auth client"
```

---

## Task 4: Implement apps/auth

**Files:**

- `apps/auth/package.json`
- `apps/auth/tsconfig.json`
- `apps/auth/lib/hash.ts`
- `apps/auth/lib/jwt.ts`
- `apps/auth/lib/email.ts`
- `apps/auth/routes/auth.ts`
- `apps/auth/index.ts`
- `apps/auth/Dockerfile`
- `apps/auth/tests/hash.test.ts`
- `apps/auth/tests/jwt.test.ts`

---

- [ ] **Step 4.1: Create `apps/auth/package.json`**

```json
{
  "name": "@cfp/auth",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch index.ts",
    "start": "tsx index.ts",
    "test": "vitest run"
  },
  "dependencies": {
    "@cfp/db": "*",
    "@sendgrid/mail": "^8.1.6",
    "bcryptjs": "^2.4.3",
    "express": "^5.1.0",
    "jose": "^5.0.0",
    "pino": "^10.3.1",
    "pino-pretty": "^13.1.3"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/express": "^5.0.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 4.2: Create `apps/auth/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "./dist"
  },
  "include": ["./**/*.ts"]
}
```

- [ ] **Step 4.3: Write failing tests for `hash.ts`**

Create `apps/auth/tests/hash.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, hashToken } from "../lib/hash.js";

describe("hashPassword / verifyPassword", () => {
  it("hashes a password and verifies correctly", async () => {
    const hash = await hashPassword("secret123");
    expect(hash).not.toBe("secret123");
    expect(await verifyPassword("secret123", hash)).toBe(true);
  });

  it("rejects wrong password", async () => {
    const hash = await hashPassword("secret123");
    expect(await verifyPassword("wrongpassword", hash)).toBe(false);
  });
});

describe("hashToken", () => {
  it("produces a deterministic SHA-256 hex string", () => {
    const h1 = hashToken("my-token");
    const h2 = hashToken("my-token");
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64);
  });

  it("different inputs produce different hashes", () => {
    expect(hashToken("token-a")).not.toBe(hashToken("token-b"));
  });
});
```

- [ ] **Step 4.4: Run hash tests — expect FAIL**

```bash
cd apps/auth && npx vitest run tests/hash.test.ts
```

Expected: FAIL — `../lib/hash.js` not found.

- [ ] **Step 4.5: Create `apps/auth/lib/hash.ts`**

```typescript
import bcrypt from "bcryptjs";
import { createHash } from "crypto";

const ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
```

- [ ] **Step 4.6: Run hash tests — expect PASS**

```bash
cd apps/auth && npx vitest run tests/hash.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 4.7: Write failing tests for `jwt.ts`**

Create `apps/auth/tests/jwt.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

process.env.JWT_SECRET = "test-secret-that-is-long-enough-32ch";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-long-enough-32c";

import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../lib/jwt.js";

describe("access tokens", () => {
  it("signs and verifies an access token", async () => {
    const token = await signAccessToken("user-123");
    const payload = await verifyAccessToken(token);
    expect(payload.sub).toBe("user-123");
  });

  it("rejects a token signed with the wrong secret", async () => {
    const token = await signRefreshToken("user-123");
    await expect(verifyAccessToken(token)).rejects.toThrow();
  });
});

describe("refresh tokens", () => {
  it("signs and verifies a refresh token", async () => {
    const token = await signRefreshToken("user-456");
    const payload = await verifyRefreshToken(token);
    expect(payload.sub).toBe("user-456");
  });
});
```

- [ ] **Step 4.8: Run JWT tests — expect FAIL**

```bash
cd apps/auth && npx vitest run tests/jwt.test.ts
```

Expected: FAIL — `../lib/jwt.js` not found.

- [ ] **Step 4.9: Create `apps/auth/lib/jwt.ts`**

```typescript
import { SignJWT, jwtVerify } from "jose";

const accessSecret = () => new TextEncoder().encode(process.env.JWT_SECRET!);
const refreshSecret = () =>
  new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!);

export async function signAccessToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("3h")
    .sign(accessSecret());
}

export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(refreshSecret());
}

export async function verifyAccessToken(
  token: string,
): Promise<{ sub: string }> {
  const { payload } = await jwtVerify(token, accessSecret());
  if (!payload.sub) throw new Error("Missing sub claim");
  return { sub: payload.sub };
}

export async function verifyRefreshToken(
  token: string,
): Promise<{ sub: string }> {
  const { payload } = await jwtVerify(token, refreshSecret());
  if (!payload.sub) throw new Error("Missing sub claim");
  return { sub: payload.sub };
}
```

- [ ] **Step 4.10: Run JWT tests — expect PASS**

```bash
cd apps/auth && npx vitest run tests/jwt.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 4.11: Create `apps/auth/lib/email.ts`**

```typescript
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const FROM_EMAIL = process.env.FROM_EMAIL ?? "noreply@commonsfabric.app";
const APP_URL = process.env.APP_URL ?? "http://localhost:5173";

export async function sendVerificationEmail(
  to: string,
  token: string,
): Promise<void> {
  const link = `${APP_URL}/verify-email?token=${token}`;
  await sgMail.send({
    to,
    from: FROM_EMAIL,
    subject: "Verify your Commons Fabric email",
    text: `Verify your email: ${link}`,
    html: `<p>Click to verify your email: <a href="${link}">Verify Email</a></p>`,
  });
}
```

- [ ] **Step 4.12: Create `apps/auth/routes/auth.ts`**

```typescript
import { Router } from "express";
import { randomBytes } from "crypto";
import { prisma } from "@cfp/db";
import { hashPassword, verifyPassword, hashToken } from "../lib/hash.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../lib/jwt.js";
import { sendVerificationEmail } from "../lib/email.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing)
    return res.status(409).json({ error: "Email already registered" });

  const passwordHash = await hashPassword(password);
  const emailVerificationToken = randomBytes(32).toString("hex");
  const username = email.split("@")[0];

  await prisma.user.create({
    data: { email, username, passwordHash, emailVerificationToken },
  });

  await sendVerificationEmail(email, emailVerificationToken);
  res.status(201).json({ message: "Verification email sent" });
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash)
    return res.status(401).json({ error: "Invalid credentials" });

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const accessToken = await signAccessToken(user.id);
  const refreshToken = await signRefreshToken(user.id);

  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastloginAt: new Date() },
  });

  res.json({ accessToken, refreshToken });
});

authRouter.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(400).json({ error: "refreshToken is required" });

  let userId: string;
  try {
    const payload = await verifyRefreshToken(refreshToken);
    userId = payload.sub;
  } catch {
    return res.status(401).json({ error: "Invalid refresh token" });
  }

  const tokenHash = hashToken(refreshToken);
  const session = await prisma.session.findUnique({
    where: { refreshToken: tokenHash },
  });

  if (!session || session.userId !== userId || session.expiresAt < new Date()) {
    return res.status(401).json({ error: "Session not found or expired" });
  }

  const accessToken = await signAccessToken(userId);
  res.json({ accessToken });
});

authRouter.post("/logout", async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await prisma.session.deleteMany({ where: { refreshToken: tokenHash } });
  }
  res.json({ message: "Logged out" });
});

authRouter.get("/verify-email/:token", async (req, res) => {
  const { token } = req.params;
  const user = await prisma.user.findUnique({
    where: { emailVerificationToken: token },
  });
  if (!user) return res.status(400).json({ error: "Invalid or expired token" });

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifiedAt: new Date(), emailVerificationToken: null },
  });

  res.json({ message: "Email verified" });
});
```

- [ ] **Step 4.13: Create `apps/auth/index.ts`**

```typescript
import express from "express";
import { authRouter } from "./routes/auth.js";
import pino from "pino";

const logger = pino({ transport: { target: "pino-pretty" } });
const app = express();
app.use(express.json());
app.use("/auth", authRouter);
app.get("/health", (_req, res) => res.json({ ok: true }));

const PORT = Number(process.env.PORT ?? 4001);
app.listen(PORT, () => logger.info(`Auth service running on port ${PORT}`));
```

- [ ] **Step 4.14: Create `apps/auth/Dockerfile`**

```dockerfile
FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY db/package.json ./db/
COPY apps/auth/package.json ./apps/auth/

RUN npm ci --workspace=apps/auth --workspace=db

COPY db/ ./db/
COPY apps/auth/ ./apps/auth/

RUN cd db && npx prisma generate

WORKDIR /app/apps/auth
ENV PORT=4001
EXPOSE 4001
CMD ["node", "--import=tsx/esm", "index.ts"]
```

- [ ] **Step 4.15: Run `npm install` and smoke test the auth service**

```bash
npm install
cd apps/auth && npx tsx index.ts
```

In a second terminal:

```bash
curl -s -X POST http://localhost:4001/health
```

Expected: `{"ok":true}`

- [ ] **Step 4.16: Commit**

```bash
git add apps/auth/
git commit -m "feat: implement minimal auth service (register, login, refresh, logout, verify-email)"
```

---

## Task 5: Implement apps/scheduler

**Files:**

- `apps/scheduler/package.json`
- `apps/scheduler/tsconfig.json`
- `apps/scheduler/lib/promote.ts`
- `apps/scheduler/index.ts`
- `apps/scheduler/Dockerfile`
- `apps/scheduler/tests/promote.test.ts`

---

- [ ] **Step 5.1: Create `apps/scheduler/package.json`**

```json
{
  "name": "@cfp/scheduler",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch index.ts",
    "start": "tsx index.ts",
    "test": "vitest run"
  },
  "dependencies": {
    "@cfp/db": "*",
    "node-cron": "^3.0.3",
    "pino": "^10.3.1",
    "pino-pretty": "^13.1.3"
  },
  "devDependencies": {
    "@types/node-cron": "^3.0.11",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 5.2: Create `apps/scheduler/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "./dist"
  },
  "include": ["./**/*.ts"]
}
```

- [ ] **Step 5.3: Write failing tests for `promote.ts`**

Create `apps/scheduler/tests/promote.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUpdateMany = vi.fn().mockResolvedValue({ count: 0 });

vi.mock("@cfp/db", () => ({
  prisma: { jobQueue: { updateMany: mockUpdateMany } },
  JobStatus: { SCHEDULED: "SCHEDULED", PENDING: "PENDING", READY: "READY" },
}));

const { promoteJobs } = await import("../lib/promote.js");

describe("promoteJobs", () => {
  beforeEach(() => mockUpdateMany.mockClear());

  it("calls updateMany twice (SCHEDULED→PENDING and PENDING→READY)", async () => {
    await promoteJobs();
    expect(mockUpdateMany).toHaveBeenCalledTimes(2);
  });

  it("promotes SCHEDULED jobs whose fireAt is within 24h to PENDING", async () => {
    await promoteJobs();
    const [firstCall] = mockUpdateMany.mock.calls;
    expect(firstCall[0].where.status).toBe("SCHEDULED");
    expect(firstCall[0].data).toEqual({ status: "PENDING" });
  });

  it("promotes PENDING jobs whose fireAt has passed to READY", async () => {
    await promoteJobs();
    const [, secondCall] = mockUpdateMany.mock.calls;
    expect(secondCall[0].where.status).toBe("PENDING");
    expect(secondCall[0].data).toEqual({ status: "READY" });
  });
});
```

- [ ] **Step 5.4: Run promote tests — expect FAIL**

```bash
cd apps/scheduler && npx vitest run tests/promote.test.ts
```

Expected: FAIL — `../lib/promote.js` not found.

- [ ] **Step 5.5: Create `apps/scheduler/lib/promote.ts`**

```typescript
import { prisma, JobStatus } from "@cfp/db";

const PENDING_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function promoteJobs(): Promise<void> {
  const now = new Date();
  const pendingCutoff = new Date(now.getTime() + PENDING_WINDOW_MS);

  await prisma.jobQueue.updateMany({
    where: { status: JobStatus.SCHEDULED, fireAt: { lte: pendingCutoff } },
    data: { status: JobStatus.PENDING },
  });

  await prisma.jobQueue.updateMany({
    where: { status: JobStatus.PENDING, fireAt: { lte: now } },
    data: { status: JobStatus.READY },
  });
}
```

- [ ] **Step 5.6: Run promote tests — expect PASS**

```bash
cd apps/scheduler && npx vitest run tests/promote.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 5.7: Create `apps/scheduler/index.ts`**

```typescript
import cron from "node-cron";
import pino from "pino";
import { promoteJobs } from "./lib/promote.js";

const logger = pino({ transport: { target: "pino-pretty" } });

logger.info("Scheduler starting");

// Promote jobs every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  try {
    await promoteJobs();
    logger.info("Job promotion complete");
  } catch (err) {
    logger.error(err, "Job promotion failed");
  }
});
```

- [ ] **Step 5.8: Create `apps/scheduler/Dockerfile`**

```dockerfile
FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY db/package.json ./db/
COPY apps/scheduler/package.json ./apps/scheduler/

RUN npm ci --workspace=apps/scheduler --workspace=db

COPY db/ ./db/
COPY apps/scheduler/ ./apps/scheduler/

RUN cd db && npx prisma generate

WORKDIR /app/apps/scheduler
CMD ["node", "--import=tsx/esm", "index.ts"]
```

- [ ] **Step 5.9: Run `npm install` and smoke test**

```bash
npm install
cd apps/scheduler && npx tsx index.ts
```

Expected: `Scheduler starting` log with no errors.

- [ ] **Step 5.10: Commit**

```bash
git add apps/scheduler/
git commit -m "feat: implement scheduler service with job promotion loop"
```

---

## Task 6: Implement apps/executioner

**Files:**

- `apps/executioner/package.json`
- `apps/executioner/tsconfig.json`
- `apps/executioner/handlers/index.ts`
- `apps/executioner/lib/poll.ts`
- `apps/executioner/index.ts`
- `apps/executioner/Dockerfile`
- `apps/executioner/tests/poll.test.ts`

---

- [ ] **Step 6.1: Create `apps/executioner/package.json`**

```json
{
  "name": "@cfp/executioner",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch index.ts",
    "start": "tsx index.ts",
    "test": "vitest run"
  },
  "dependencies": {
    "@cfp/db": "*",
    "@sendgrid/mail": "^8.1.6",
    "pino": "^10.3.1",
    "pino-pretty": "^13.1.3"
  },
  "devDependencies": {
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 6.2: Create `apps/executioner/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "./dist"
  },
  "include": ["./**/*.ts"]
}
```

- [ ] **Step 6.3: Create `apps/executioner/handlers/index.ts`**

```typescript
import type { Prisma } from "@cfp/db";

export type JobHandler = (payload: Prisma.JsonValue) => Promise<void>;

export const handlers: Record<string, JobHandler> = {
  // Register handlers here as they are implemented.
  // Example:
  // "send-digest": sendDigestHandler,
};
```

- [ ] **Step 6.4: Write failing tests for `poll.ts`**

Create `apps/executioner/tests/poll.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { JobQueue } from "@cfp/db";

const mockFindMany = vi.fn();
const mockUpdate = vi.fn().mockResolvedValue({});
const mockSuccessHandler = vi.fn().mockResolvedValue(undefined);
const mockFailHandler = vi.fn().mockRejectedValue(new Error("boom"));

vi.mock("@cfp/db", () => ({
  prisma: { jobQueue: { findMany: mockFindMany, update: mockUpdate } },
  JobStatus: {
    READY: "READY",
    RUNNING: "RUNNING",
    COMPLETE: "COMPLETE",
    FAILED: "FAILED",
  },
}));

vi.mock("../handlers/index.js", () => ({
  handlers: { "ok-job": mockSuccessHandler, "bad-job": mockFailHandler },
}));

const { pollAndExecute } = await import("../lib/poll.js");

const makeJob = (overrides: Partial<JobQueue> = {}): JobQueue =>
  ({
    id: "j1",
    serviceName: "ok-job",
    payload: {},
    retryCount: 0,
    maxRetries: 3,
    ...overrides,
  }) as JobQueue;

describe("pollAndExecute", () => {
  beforeEach(() => {
    mockUpdate.mockClear();
    mockSuccessHandler.mockClear();
    mockFailHandler.mockClear();
  });

  it("does nothing when no READY jobs exist", async () => {
    mockFindMany.mockResolvedValue([]);
    await pollAndExecute();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("marks job RUNNING then COMPLETE on success", async () => {
    mockFindMany.mockResolvedValue([makeJob()]);
    await pollAndExecute();
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "RUNNING" }),
      }),
    );
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "COMPLETE" }),
      }),
    );
  });

  it("requeues as READY when failure and retries remain", async () => {
    mockFindMany.mockResolvedValue([
      makeJob({ serviceName: "bad-job", retryCount: 0, maxRetries: 3 }),
    ]);
    await pollAndExecute();
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "READY", retryCount: 1 }),
      }),
    );
  });

  it("marks FAILED when retry count reaches max", async () => {
    mockFindMany.mockResolvedValue([
      makeJob({ serviceName: "bad-job", retryCount: 2, maxRetries: 3 }),
    ]);
    await pollAndExecute();
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "FAILED",
          errorMessage: "boom",
        }),
      }),
    );
  });

  it("marks FAILED with message for unknown service", async () => {
    mockFindMany.mockResolvedValue([
      makeJob({ serviceName: "unknown", retryCount: 2, maxRetries: 3 }),
    ]);
    await pollAndExecute();
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "FAILED" }),
      }),
    );
  });
});
```

- [ ] **Step 6.5: Run poll tests — expect FAIL**

```bash
cd apps/executioner && npx vitest run tests/poll.test.ts
```

Expected: FAIL — `../lib/poll.js` not found.

- [ ] **Step 6.6: Create `apps/executioner/lib/poll.ts`**

```typescript
import { prisma, JobStatus } from "@cfp/db";
import { handlers } from "../handlers/index.js";

export async function pollAndExecute(): Promise<void> {
  const jobs = await prisma.jobQueue.findMany({
    where: { status: JobStatus.READY },
    orderBy: { fireAt: "asc" },
    take: 10,
  });

  for (const job of jobs) {
    await prisma.jobQueue.update({
      where: { id: job.id },
      data: { status: JobStatus.RUNNING, startedAt: new Date() },
    });

    try {
      const handler = handlers[job.serviceName];
      if (!handler)
        throw new Error(
          `No handler registered for service: ${job.serviceName}`,
        );
      await handler(job.payload);
      await prisma.jobQueue.update({
        where: { id: job.id },
        data: { status: JobStatus.COMPLETE, completedAt: new Date() },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const newRetryCount = job.retryCount + 1;
      if (newRetryCount < job.maxRetries) {
        await prisma.jobQueue.update({
          where: { id: job.id },
          data: {
            status: JobStatus.READY,
            retryCount: newRetryCount,
            errorMessage,
          },
        });
      } else {
        await prisma.jobQueue.update({
          where: { id: job.id },
          data: {
            status: JobStatus.FAILED,
            retryCount: newRetryCount,
            errorMessage,
            completedAt: new Date(),
          },
        });
      }
    }
  }
}
```

- [ ] **Step 6.7: Run poll tests — expect PASS**

```bash
cd apps/executioner && npx vitest run tests/poll.test.ts
```

Expected: 5 tests pass.

- [ ] **Step 6.8: Create `apps/executioner/index.ts`**

```typescript
import pino from "pino";
import { pollAndExecute } from "./lib/poll.js";

const logger = pino({ transport: { target: "pino-pretty" } });
const POLL_INTERVAL_MS = 10_000;

logger.info("Executioner starting, polling every %dms", POLL_INTERVAL_MS);

async function loop() {
  try {
    await pollAndExecute();
  } catch (err) {
    logger.error(err, "Poll cycle failed");
  }
  setTimeout(loop, POLL_INTERVAL_MS);
}

loop();
```

- [ ] **Step 6.9: Create `apps/executioner/Dockerfile`**

```dockerfile
FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY db/package.json ./db/
COPY apps/executioner/package.json ./apps/executioner/

RUN npm ci --workspace=apps/executioner --workspace=db

COPY db/ ./db/
COPY apps/executioner/ ./apps/executioner/

RUN cd db && npx prisma generate

WORKDIR /app/apps/executioner
CMD ["node", "--import=tsx/esm", "index.ts"]
```

- [ ] **Step 6.10: Run `npm install` and smoke test**

```bash
npm install
cd apps/executioner && npx tsx index.ts
```

Expected: `Executioner starting, polling every 10000ms` log, no errors.

- [ ] **Step 6.11: Commit**

```bash
git add apps/executioner/
git commit -m "feat: implement executioner service with poll loop, retry logic, and handler registry"
```

---

## Task 7: Wire Docker Compose

**Files:**

- `docker-compose.yml`
- `docker-compose.prod.yml`

---

- [ ] **Step 7.1: Create `docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: cfp
      POSTGRES_PASSWORD: cfp
      POSTGRES_DB: cfp_dev
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U cfp -d cfp_dev"]
      interval: 5s
      timeout: 5s
      retries: 10
    volumes:
      - postgres_data:/var/lib/postgresql/data

  migrator:
    build:
      context: .
      dockerfile: db/Dockerfile
    environment:
      DATABASE_URL: ${DATABASE_URL}
    depends_on:
      postgres:
        condition: service_healthy

  auth:
    build:
      context: .
      dockerfile: apps/auth/Dockerfile
    ports:
      - "4001:4001"
    env_file: .env
    depends_on:
      migrator:
        condition: service_completed_successfully

  server:
    build:
      context: .
      dockerfile: apps/server/Dockerfile
    ports:
      - "4000:4000"
    env_file: .env
    depends_on:
      migrator:
        condition: service_completed_successfully

  scheduler:
    build:
      context: .
      dockerfile: apps/scheduler/Dockerfile
    env_file: .env
    depends_on:
      migrator:
        condition: service_completed_successfully

  executioner:
    build:
      context: .
      dockerfile: apps/executioner/Dockerfile
    env_file: .env
    depends_on:
      migrator:
        condition: service_completed_successfully

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - "5173:5173"
    depends_on:
      - server
      - auth

volumes:
  postgres_data:
```

- [ ] **Step 7.2: Create `docker-compose.prod.yml`**

```yaml
services:
  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile.prod
    ports:
      - "80:80"
      - "443:443"
    environment:
      DOMAIN: ${DOMAIN}
      CADDY_EMAIL: ${CADDY_EMAIL}
    volumes:
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - server
      - auth

  auth:
    environment:
      NODE_ENV: production

  server:
    environment:
      NODE_ENV: production

  scheduler:
    environment:
      NODE_ENV: production

  executioner:
    environment:
      NODE_ENV: production

volumes:
  caddy_data:
  caddy_config:
```

- [ ] **Step 7.3: Copy `.env.example` to `.env` and fill in local values**

```bash
cp .env.example .env
```

Edit `.env`:

```
DATABASE_URL=postgresql://cfp:cfp@postgres:5432/cfp_dev
JWT_SECRET=local-dev-secret-change-for-production
JWT_REFRESH_SECRET=local-dev-refresh-secret-change-for-prod
SENDGRID_API_KEY=SG.placeholder
FROM_EMAIL=noreply@commonsfabric.app
APP_URL=http://localhost:5173
```

Note: `DATABASE_URL` uses `postgres` (the Docker Compose service name) as host when running inside Docker. Use `localhost` for local dev without Docker.

- [ ] **Step 7.4: Verify Docker Compose build**

```bash
docker compose build
```

Expected: all services build without error.

- [ ] **Step 7.5: Start the full stack**

```bash
docker compose up
```

Expected output sequence:

1. `postgres` becomes healthy
2. `migrator` runs and exits with code 0
3. `auth`, `server`, `scheduler`, `executioner` start
4. `web` starts on port 5173

- [ ] **Step 7.6: Smoke test all services**

```bash
# Auth
curl -s http://localhost:4001/health
# Expected: {"ok":true}

# Server
curl -s http://localhost:4000/health
# Expected: {"ok":true}

# Web
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173
# Expected: 200
```

- [ ] **Step 7.7: Commit**

```bash
git add docker-compose.yml docker-compose.prod.yml
git commit -m "feat: wire Docker Compose for full local stack (postgres, migrator, all services)"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement                                                         | Task           |
| ------------------------------------------------------------------------ | -------------- |
| npm workspaces, no Turborepo                                             | Task 1         |
| db owns Prisma, exports client                                           | Task 1         |
| Session model (auth refresh tokens)                                      | Task 1.9       |
| JobQueue model with all columns                                          | Task 1.9       |
| User auth fields (passwordHash, emailVerificationToken)                  | Task 1.8       |
| apps/server migrated, Supabase removed                                   | Task 2         |
| apps/server JWT verified with jose                                       | Task 2.5       |
| apps/web migrated                                                        | Task 3         |
| apps/web auth client (localStorage tokens)                               | Task 3.5       |
| apps/auth: register, login, refresh, logout, verify-email                | Task 4.12      |
| JWT access tokens expire in 3h                                           | Task 4.9       |
| Refresh tokens stored as SHA-256 hash                                    | Task 4.5, 4.12 |
| apps/scheduler: SCHEDULED→PENDING→READY promotion                        | Task 5         |
| apps/executioner: poll READY, retry on failure, FAILED after max retries | Task 6         |
| Docker Compose: postgres + migrator + all services                       | Task 7         |
| Migrator gates all service starts                                        | Task 7.1       |
| Caddy as production static + reverse proxy                               | Task 3.9, 3.10 |
| Caddy routing: /auth/\* → auth:4001, /api/graphql → server:4000          | Task 3.10      |
| docker-compose.prod.yml overrides                                        | Task 7.2       |
| .env.example                                                             | Task 1.11      |
