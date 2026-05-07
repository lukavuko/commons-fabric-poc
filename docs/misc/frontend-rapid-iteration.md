# Frontend Rapid Iteration (Local OS + Local Browser)

Run Vite natively on Windows for instant HMR — no Docker rebuild for UI changes.

## Architecture

```
Windows (native)              WSL / Docker
┌──────────────┐         ┌──────────────────┐
│  Vite :5173  │────────▶│  server :4000    │
│  (HMR, CSS)  │────────▶│  auth   :4001    │
│              │         │  postgres :5432  │
└──────────────┘         └──────────────────┘
     ▲
     │
  Browser
```

Frontend runs on Windows. Backend stays in Docker. Vite proxies API calls to `localhost` ports exposed by Docker.

## Prerequisites

- Node.js installed on Windows (matching the project's version)
- Backend stack running in Docker (`docker compose up -d` via WSL)
- `pnpm install` or `npm install` done at repo root

## Step-by-Step

### 1. Start backend services (skip the `web` container)

```bash
wsl bash -c "docker compose up -d postgres migrator auth server scheduler executioner"
```

This starts everything except the `web` service. The `server` (:4000) and `auth` (:4001) ports are exposed to Windows via Docker's port mappings.

### 2. Override the Vite proxy targets

The checked-in `vite.config.ts` proxies to Docker DNS names (`http://server:4000`). For native Windows execution, create a local override:

**`apps/web/vite.config.local.ts`** (gitignored):

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:4000",
      "/auth": "http://localhost:4001",
    },
  },
});
```

### 3. Run Vite natively

```
cd apps/web
npx vite --config vite.config.local.ts
```

Or add a convenience script to `apps/web/package.json`:

```json
"dev:local": "vite --config vite.config.local.ts"
```

### 4. Open browser

Navigate to `http://localhost:5173`. Vite HMR is now instant — edit any file in `apps/web/src/` and see changes in <100ms.

## When to Use Which

| Scenario                                                        | Command                                      |
| --------------------------------------------------------------- | -------------------------------------------- |
| **UI/UX iteration** (styles, layout, components)                | `npx vite --config vite.config.local.ts`     |
| **Full integration test** (auth flows, API calls)               | Same — just ensure backend containers are up |
| **Backend + frontend together** (schema changes, new endpoints) | `docker compose up -d --build` (full stack)  |
| **Final smoke test before commit**                              | Full Docker stack to match production        |

## Troubleshooting

### Proxy errors (ECONNREFUSED)

Backend containers aren't running or ports aren't exposed. Verify:

```powershell
# Check containers are up
wsl bash -c "docker compose ps"

# Test API reachability from Windows
curl http://localhost:4000/api
curl http://localhost:4001/auth/health
```

### Port conflict on 5173

The Docker `web` container is still running. Stop it:

```bash
wsl bash -c "docker compose stop web"
```

### Node module mismatches

If `node_modules` was installed inside WSL/Docker, native Windows Node may choke on platform-specific binaries. Fix:

```powershell
cd apps/web
rm -r node_modules
npm install
```

Or from repo root if using workspaces:

```powershell
rm -r node_modules
npm install
```

### Missing Tailwind styles

Tailwind v4 uses `@tailwindcss/vite` plugin — it's already in the config. If styles are missing, ensure `npm install` completed on Windows (the vite plugin needs native binaries).
