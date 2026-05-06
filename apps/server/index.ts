import express from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { typeDefs } from "./graphql/schema.js";
import { resolvers } from "./graphql/resolvers/index.js";
import { buildContext } from "./graphql/context.js";
import { logger } from "./lib/logger.js";
import { prisma } from "@cfp/db";
import { roles, permissions } from "@cfp/defaults";
import { hashPassword } from "@cfp/auth-tokens";
import { generateIcal } from "@cfp/ical";

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

async function ensurePermissionsSeeded() {
  for (const perm of permissions) {
    const existing = await prisma.permission.findFirst({
      where: { name: perm.name },
    });
    if (!existing) {
      await prisma.permission.create({
        data: { name: perm.name, description: perm.description },
      });
      logger.info(`Seeded permission: ${perm.name}`);
    }
  }

  const adminRole = await prisma.role.findFirst({
    where: { name: "ADMIN", isDefault: true },
  });
  if (adminRole) {
    const allPerms = await prisma.permission.findMany();
    for (const perm of allPerms) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: { roleId: adminRole.id, permissionId: perm.id },
      });
    }
    logger.info(`ADMIN role linked to all ${allPerms.length} permissions`);
  }
}

async function ensureAdminUser() {
  const adminEmail = "admin@outlook.com";
  let user = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: adminEmail,
        displayName: "Admin",
        firstname: "Admin",
        passwordHash: await hashPassword("12345678"),
        emailVerifiedAt: new Date(),
      },
    });
    logger.info(`Created admin user: ${adminEmail}`);
  }

  const adminRole = await prisma.role.findFirst({
    where: { name: "ADMIN", isDefault: true },
  });
  if (adminRole) {
    await prisma.userRole.upsert({
      where: {
        userId_entityId: { userId: user.id, entityId: "GLOBAL" },
      },
      update: { roleId: adminRole.id },
      create: {
        userId: user.id,
        entityType: "COMMUNITY",
        entityId: "GLOBAL",
        roleId: adminRole.id,
      },
    });
    logger.info(`Admin user assigned ADMIN role`);
  }
}

async function main() {
  await ensureDefaultRoles();
  await ensurePermissionsSeeded();
  await ensureAdminUser();
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

  app.get("/api/events/:id/ical", async (req, res) => {
    try {
      const event = await prisma.event.findUnique({
        where: { id: req.params.id },
      });
      if (!event || event.releaseStatus !== "PUBLIC") {
        res.status(404).json({ error: "Event not found" });
        return;
      }
      const ics = generateIcal({
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        recurring: event.recurring,
        recurringDow: event.recurringDow,
      });
      const filename =
        event.title.replace(/[^a-zA-Z0-9 ]/g, "").trim() || "event";
      res.setHeader("Content-Type", "text/calendar; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}.ics"`,
      );
      res.send(ics);
    } catch (err) {
      logger.error(err, "Failed to generate iCal");
      res.status(500).json({ error: "Internal server error" });
    }
  });

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
