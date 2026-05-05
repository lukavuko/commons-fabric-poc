import { config } from "dotenv";
import { resolve } from "path";
import { defineConfig } from "prisma/config";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
config({ path: resolve(__dirname, "../../.env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Read directly from process.env so `prisma generate` (which doesn't need
    // a real URL) succeeds in build environments where the var is absent.
    // Migrations and runtime clients require the var to be set.
    url: process.env.DATABASE_URL ?? "",
  },
});
