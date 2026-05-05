import express from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { typeDefs } from "./graphql/schema.js";
import { resolvers } from "./graphql/resolvers/index.js";
import { buildContext } from "./graphql/context.js";
import { logger } from "./lib/logger.js";
import { prisma } from "@cfp/db";
import { roles } from "@cfp/defaults";

const PORT = Number(process.env.PORT ?? 4000);

async function ensureDefaultRoles() {
  for (const role of roles) {
    const existing = await prisma.role.findFirst({
      where: { name: role.name, isDefault: true },
    });
    if (!existing) {
      await prisma.role.create({
        data: { name: role.name, isDefault: true },
      });
      logger.info(`Seeded default role: ${role.name}`);
    }
  }
}

async function main() {
  await ensureDefaultRoles();
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
