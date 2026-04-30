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
  requireCommunityRole: (communityId: string, allowedRoles: string[]) => Promise<AuthUser>;
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
    allowedRoles: string[]
  ): Promise<AuthUser> => {
    const authedUser = requireAuth();
    const userRole = await prisma.userRole.findUnique({
      where: { userId_entityId: { userId: authedUser.id, entityId: communityId } },
      include: { role: true },
    });
    const roleName = userRole?.role.name.toUpperCase() ?? "";
    if (!allowedRoles.map((r) => r.toUpperCase()).includes(roleName)) {
      throw new GraphQLError("Not authorized", { extensions: { code: "FORBIDDEN" } });
    }
    return authedUser;
  };

  return { user, prisma, requireAuth, requireCommunityRole };
}
