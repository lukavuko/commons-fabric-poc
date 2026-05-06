import { verifyAccessToken } from "@cfp/auth-tokens";
import { prisma } from "@cfp/db";
import { REGISTERED_USER, resolvedRoles } from "@cfp/defaults";
import type { Request } from "express";
import { GraphQLError } from "graphql";

export type AuthUser = {
  id: string;
  email: string;
  emailVerifiedAt: Date | null;
};

export type Context = {
  user: AuthUser | null;
  prisma: typeof prisma;
  requireAuth: () => AuthUser;
  requireEmailVerified: () => AuthUser;
  requirePermission: (
    permission: string,
    entityId: string,
  ) => Promise<AuthUser>;
};

export async function buildContext(req: Request): Promise<Context> {
  const auth = req.headers.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  let user: AuthUser | null = null;

  if (token) {
    try {
      const { sub: userId } = await verifyAccessToken(token);
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, emailVerifiedAt: true },
      });
      if (dbUser) user = dbUser;
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

  const requireEmailVerified = (): AuthUser => {
    const authedUser = requireAuth();
    if (!authedUser.emailVerifiedAt)
      throw new GraphQLError("Email not verified", {
        extensions: { code: "EMAIL_NOT_VERIFIED" },
      });
    return authedUser;
  };

  const isAdmin = async (userId: string): Promise<boolean> => {
    const adminRole = await prisma.userRole.findFirst({
      where: {
        userId,
        role: { name: "ADMIN", isDefault: true },
      },
    });
    return !!adminRole;
  };

  const requirePermission = async (
    permission: string,
    entityId: string,
  ): Promise<AuthUser> => {
    const authedUser = requireAuth();

    if (await isAdmin(authedUser.id)) return authedUser;

    const userRole = await prisma.userRole.findUnique({
      where: { userId_entityId: { userId: authedUser.id, entityId } },
      include: {
        role: {
          include: { rolePermissions: { include: { permission: true } } },
        },
      },
    });

    let permissions: string[];

    if (!userRole) {
      permissions = [...REGISTERED_USER];
    } else if (userRole.role.isDefault && resolvedRoles[userRole.role.name]) {
      permissions = resolvedRoles[userRole.role.name];
    } else {
      permissions = userRole.role.rolePermissions.map(
        (rp) => rp.permission.name,
      );
    }

    if (!permissions.includes(permission)) {
      throw new GraphQLError("Not authorized", {
        extensions: { code: "FORBIDDEN" },
      });
    }
    return authedUser;
  };

  return { user, prisma, requireAuth, requireEmailVerified, requirePermission };
}
