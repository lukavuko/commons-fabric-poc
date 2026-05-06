# Dev Command Reference

Commands learned from real sessions — what works, what to avoid, and why.

---

## Docker

### Start stack

```bash
wsl bash -c "cd /mnt/c/Users/Luka/Docs/commons-fabric-poc && docker compose up -d"
```

✅ Works. `docker` is only accessible via WSL — not in Windows or PowerShell PATH.

### Rebuild and start all containers

```bash
wsl bash -c "cd /mnt/c/Users/Luka/Docs/commons-fabric-poc && docker compose up -d --build"
```

✅ Works. Use after code changes to auth/server/web services.

### Start only postgres

```bash
wsl bash -c "cd /mnt/c/Users/Luka/Docs/commons-fabric-poc && docker compose up -d postgres"
```

✅ Works. Use when you only need the DB (e.g., before running migrations).

### Check container status

```bash
wsl bash -c "cd /mnt/c/Users/Luka/Docs/commons-fabric-poc && docker compose ps"
```

✅ Works.

### View service logs

```bash
wsl bash -c "cd /mnt/c/Users/Luka/Docs/commons-fabric-poc && docker compose logs <service> 2>&1 | tail -20"
```

✅ Works. Services: `auth`, `server`, `web`, `migrator`, `scheduler`, `executioner`, `postgres`.

### Run SQL inside the postgres container

```bash
wsl bash -c "cd /mnt/c/Users/Luka/Docs/commons-fabric-poc && docker compose exec postgres psql -U cfp -d cfp_dev -c '<SQL>'"
```

✅ Works. Use for manual DB operations — postgres is only reachable inside the Docker network.

---

## Database / Prisma

### Regenerate Prisma client (no DB needed)

```powershell
cd C:\Users\Luka\Docs\commons-fabric-poc\packages\db
npx prisma generate
```

✅ Works from Windows PowerShell. Run after any schema.prisma change.

### Run `prisma migrate dev` — what FAILS

**From Windows PowerShell:**

```powershell
# ❌ FAILS — P1001, can't reach postgres:5432
npx prisma migrate dev --name <name>
```

**From WSL with URL override:**

```bash
# ❌ FAILS — prisma.config.ts loads .env via dotenv which hardcodes postgres:5432,
# and even DATABASE_URL override in shell still fails from outside Docker network
DATABASE_URL='postgresql://cfp:cfp@localhost:5432/cfp_dev' npx prisma migrate dev --name <name>
```

**Root cause:** `prisma.config.ts` loads `../../.env` via dotenv. `.env` sets `DATABASE_URL=postgresql://cfp:cfp@postgres:5432/cfp_dev`. The hostname `postgres` only resolves inside Docker's network — not from the host or WSL.

### Workaround for schema changes (dev mode)

Apply SQL directly via psql, then regenerate the client:

```bash
# 1. Apply the DDL change
wsl bash -c "cd /mnt/c/Users/Luka/Docs/commons-fabric-poc && docker compose exec postgres psql -U cfp -d cfp_dev -c 'ALTER TABLE \"User\" DROP COLUMN IF EXISTS \"username\";'"

# 2. Regenerate Prisma client
cd C:\Users\Luka\Docs\commons-fabric-poc\packages\db && npx prisma generate
```

✅ Works. Sufficient for dev — migration history tracking deferred.

### Migrator container behaviour

- Runs `prisma migrate deploy` from migration files baked into the image at build time.
- Exits cleanly with "No pending migrations to apply." when up to date — this is expected.
- Migration files live inside the Docker image; `packages/db/prisma/migrations/` on the host may be empty.

### DATABASE_URL values

| Context                  | URL                                           |
| ------------------------ | --------------------------------------------- |
| Inside Docker containers | `postgresql://cfp:cfp@postgres:5432/cfp_dev`  |
| Host (if pg_hba allows)  | `postgresql://cfp:cfp@localhost:5432/cfp_dev` |

---

## TypeScript / Type Checking

### Typecheck a single workspace

```powershell
npx tsc --project apps/web/tsconfig.json --noEmit
npx tsc --project apps/server/tsconfig.json --noEmit
npx tsc --project apps/auth/tsconfig.json --noEmit
```

✅ Works from project root on Windows.

### Typecheck all — one-liner

```powershell
npx tsc --project apps/web/tsconfig.json --noEmit 2>&1; `
npx tsc --project apps/server/tsconfig.json --noEmit 2>&1; `
npx tsc --project apps/auth/tsconfig.json --noEmit 2>&1; `
Write-Host "ALL CLEAN"
```

✅ Works. `ALL CLEAN` line confirms zero errors across all workspaces.

---

## Design System Notes

### primitives.tsx type constraints

| Component    | `tone` values                                        |
| ------------ | ---------------------------------------------------- |
| `StateBadge` | `"clay" \| "sage"` only — `"neutral"` is **invalid** |
| `Tag`        | `"sage" \| "clay" \| "neutral"` — all three valid    |

### CSS variables (globals.css)

- `--cf-clay` → `#c49a82` — usable in inline styles and `bg-[var(--cf-clay)]`
- `--cf-shadow-popup` → defined, use for modal/popup shadows
- `--cf-hairline` → `rgba(47,53,44,0.08)` — section divider borders
- Tailwind bridge: `bg-clay`, `text-sage-deep`, `rounded-cf-xl`, `shadow-cf-popup` etc. all resolve via `@theme inline` in globals.css
