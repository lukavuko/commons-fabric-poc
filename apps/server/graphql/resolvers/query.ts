import { ANON_USER, REGISTERED_USER, resolvedRoles } from "@cfp/defaults";
import { Context } from "../context.js";

async function syncRoleBackedSubscriptions(ctx: Context, userId: string) {
  const roleLinks = await ctx.prisma.userRole.findMany({
    where: { userId, entityType: "COMMUNITY" },
    select: { entityId: true },
  });

  await Promise.all(
    roleLinks.map(({ entityId }) =>
      ctx.prisma.subscription.upsert({
        where: {
          userId_communityId: {
            userId,
            communityId: entityId,
          },
        },
        update: {
          isActive: true,
          tsUnsubscribed: null,
        },
        create: {
          userId,
          communityId: entityId,
          isActive: true,
          calendarChannels: ["EMAIL"],
          announcementChannels: ["EMAIL"],
        },
      }),
    ),
  );
}

export const Query = {
  me: async (_: unknown, __: unknown, ctx: Context) => {
    if (!ctx.user) return null;
    return ctx.prisma.user.findUnique({ where: { id: ctx.user.id } });
  },

  communities: async (
    _: unknown,
    args: {
      filter?: Record<string, unknown>;
      pagination?: { limit?: number; offset?: number };
    },
    ctx: Context,
  ) => {
    const { filter, pagination } = args;
    return ctx.prisma.community.findMany({
      where: {
        ...(filter?.city
          ? { city: { contains: filter.city as string, mode: "insensitive" } }
          : {}),
        ...(filter?.province
          ? {
              province: {
                contains: filter.province as string,
                mode: "insensitive",
              },
            }
          : {}),
        ...(filter?.tags ? { tags: { hasSome: filter.tags as string[] } } : {}),
        ...(filter?.verifiedOnly ? { verifiedEmail: true } : {}),
      },
      take: pagination?.limit ?? 50,
      skip: pagination?.offset ?? 0,
      orderBy: { createdAt: "desc" },
    });
  },

  community: (_: unknown, args: { id: string }, ctx: Context) =>
    ctx.prisma.community.findUnique({ where: { id: args.id } }),

  searchCommunities: (
    _: unknown,
    args: { query: string; limit?: number },
    ctx: Context,
  ) =>
    ctx.prisma.community.findMany({
      where: {
        OR: [
          { name: { contains: args.query, mode: "insensitive" } },
          { description: { contains: args.query, mode: "insensitive" } },
          { tags: { hasSome: [args.query] } },
        ],
      },
      take: args.limit ?? 10,
    }),

  hubs: (_: unknown, __: unknown, ctx: Context) =>
    ctx.prisma.hub.findMany({ orderBy: { name: "asc" } }),

  hub: (_: unknown, args: { id: string }, ctx: Context) =>
    ctx.prisma.hub.findUnique({ where: { id: args.id } }),

  events: async (
    _: unknown,
    args: { communityId?: string; fromDate?: string; toDate?: string },
    ctx: Context,
  ) =>
    ctx.prisma.event.findMany({
      where: {
        releaseStatus: "PUBLIC",
        ...(args.communityId ? { communityId: args.communityId } : {}),
        ...(args.fromDate
          ? { startsAt: { gte: new Date(args.fromDate) } }
          : {}),
        ...(args.toDate ? { startsAt: { lte: new Date(args.toDate) } } : {}),
      },
      orderBy: { startsAt: "asc" },
    }),

  event: (_: unknown, args: { id: string }, ctx: Context) =>
    ctx.prisma.event.findUnique({ where: { id: args.id } }),

  announcements: (_: unknown, args: { communityId: string }, ctx: Context) =>
    ctx.prisma.announcement.findMany({
      where: { communityId: args.communityId, releaseStatus: "PUBLIC" },
      orderBy: { releasedAt: "desc" },
    }),

  announcement: (_: unknown, args: { id: string }, ctx: Context) =>
    ctx.prisma.announcement.findUnique({ where: { id: args.id } }),

  comments: (
    _: unknown,
    args: { parentEntityType: string; parentEntityId: string },
    ctx: Context,
  ) =>
    ctx.prisma.comment.findMany({
      where: {
        parentEntityType: args.parentEntityType as "ANNOUNCEMENT" | "EVENT",
        parentEntityId: args.parentEntityId,
        parentCommentId: null,
        commentStatus: "APPROVED",
      },
      orderBy: { ts: "asc" },
    }),

  myFeed: async (_: unknown, __: unknown, ctx: Context) => {
    const user = ctx.requireAuth();
    const subscriptions = await ctx.prisma.subscription.findMany({
      where: { userId: user.id, isActive: true },
      select: { communityId: true },
    });
    const communityIds = subscriptions.map(
      (s: { communityId: string }) => s.communityId,
    );

    const [upcomingEvents, recentAnnouncements] = await Promise.all([
      ctx.prisma.event.findMany({
        where: {
          communityId: { in: communityIds },
          releaseStatus: "PUBLIC",
          startsAt: { gte: new Date() },
        },
        orderBy: { startsAt: "asc" },
        take: 20,
      }),
      ctx.prisma.announcement.findMany({
        where: { communityId: { in: communityIds }, releaseStatus: "PUBLIC" },
        orderBy: { releasedAt: "desc" },
        take: 20,
      }),
    ]);

    return { upcomingEvents, recentAnnouncements };
  },

  myCalendar: async (
    _: unknown,
    args: { fromDate?: string; toDate?: string },
    ctx: Context,
  ) => {
    const user = ctx.requireAuth();
    const subscriptions = await ctx.prisma.subscription.findMany({
      where: { userId: user.id, isActive: true },
      select: { communityId: true },
    });
    const communityIds = subscriptions.map(
      (s: { communityId: string }) => s.communityId,
    );
    return ctx.prisma.event.findMany({
      where: {
        communityId: { in: communityIds },
        releaseStatus: "PUBLIC",
        ...(args.fromDate
          ? { startsAt: { gte: new Date(args.fromDate) } }
          : {}),
        ...(args.toDate ? { startsAt: { lte: new Date(args.toDate) } } : {}),
      },
      orderBy: { startsAt: "asc" },
    });
  },

  mySubscriptions: async (_: unknown, __: unknown, ctx: Context) => {
    const user = ctx.requireAuth();
    await syncRoleBackedSubscriptions(ctx, user.id);
    return ctx.prisma.subscription.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { tsSubscribed: "desc" },
    });
  },

  communityAccess: async (
    _: unknown,
    args: { communityId: string },
    ctx: Context,
  ) => {
    if (!ctx.user) {
      return {
        scope: "PUBLIC",
        isSubscribed: false,
        roleName: null,
      };
    }

    const user = ctx.requireAuth();
    await syncRoleBackedSubscriptions(ctx, user.id);

    const [subscription, userRole] = await Promise.all([
      ctx.prisma.subscription.findUnique({
        where: {
          userId_communityId: {
            userId: user.id,
            communityId: args.communityId,
          },
        },
        select: { isActive: true },
      }),
      ctx.prisma.userRole.findUnique({
        where: {
          userId_entityId: {
            userId: user.id,
            entityId: args.communityId,
          },
        },
        include: { role: true },
      }),
    ]);

    const roleName = userRole?.role.name ?? null;
    const scope =
      roleName === "STEWARD"
        ? "STEWARD"
        : roleName === "MEMBER"
          ? "MEMBER"
          : subscription?.isActive
            ? "SUBSCRIBER"
            : "PUBLIC";

    return {
      scope,
      isSubscribed: !!subscription?.isActive,
      roleName,
    };
  },

  myPermissions: async (
    _: unknown,
    args: { entityId: string; entityType: "HUB" | "COMMUNITY" },
    ctx: Context,
  ): Promise<string[]> => {
    // return anon permission set for unregistered users
    if (!ctx.user) return [...ANON_USER];

    const userRole = await ctx.prisma.userRole.findUnique({
      where: {
        userId_entityId: { userId: ctx.user.id, entityId: args.entityId },
      },
      include: {
        role: {
          include: {
            rolePermissions: { include: { permission: true } },
          },
        },
      },
    });

    if (!userRole) return [...REGISTERED_USER];

    // Custom roles (isDefault=false) carry explicit RolePermission rows in DB.
    // Default roles fall back to the resolved set from @cfp/defaults, which is
    // cheaper than joining through the (potentially unpopulated) RolePermission
    // table during early development before the seeder runs.
    if (userRole.role.isDefault && resolvedRoles[userRole.role.name]) {
      return resolvedRoles[userRole.role.name];
    }

    return userRole.role.rolePermissions.map((rp) => rp.permission.name);
  },
};
