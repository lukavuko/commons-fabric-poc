import express from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { typeDefs } from "./graphql/schema";
import { resolvers } from "./graphql/resolvers/index";
import { buildContext } from "./graphql/context";
import { logger } from "./lib/logger";

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
    })
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
