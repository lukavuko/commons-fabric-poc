import { Context } from "../context.js";

type Parent = Record<string, unknown>;

export const DateTime = {
  serialize: (value: unknown) =>
    value instanceof Date ? value.toISOString() : value,
  parseValue: (value: unknown) => new Date(value as string),
  parseLiteral: (ast: { value: string }) => new Date(ast.value),
};

export const Community = {
  events: (parent: Parent, args: { upcoming?: boolean }, ctx: Context) =>
    ctx.prisma.event.findMany({
      where: {
        communityId: parent.id as string,
        releaseStatus: "PUBLIC",
        ...(args.upcoming ? { startsAt: { gte: new Date() } } : {}),
      },
      orderBy: { startsAt: "asc" },
    }),

  announcements: (parent: Parent, _: unknown, ctx: Context) =>
    ctx.prisma.announcement.findMany({
      where: { communityId: parent.id as string, releaseStatus: "PUBLIC" },
      orderBy: { releasedAt: "desc" },
    }),

  subscriberCount: (parent: Parent, _: unknown, ctx: Context) =>
    ctx.prisma.subscription.count({
      where: { communityId: parent.id as string, isActive: true },
    }),
};

export const Event = {
  community: (parent: Parent, _: unknown, ctx: Context) =>
    ctx.prisma.community.findUniqueOrThrow({
      where: { id: parent.communityId as string },
    }),

  creator: (parent: Parent, _: unknown, ctx: Context) =>
    parent.creatorId
      ? ctx.prisma.user.findUnique({
          where: { id: parent.creatorId as string },
        })
      : null,

  announcement: (parent: Parent, _: unknown, ctx: Context) =>
    parent.announcementId
      ? ctx.prisma.announcement.findUnique({
          where: { id: parent.announcementId as string },
        })
      : null,

  rsvpCount: (parent: Parent, _: unknown, ctx: Context) =>
    ctx.prisma.userEvent.count({
      where: { eventId: parent.id as string, rsvpStatus: "GOING" },
    }),

  myRsvp: async (parent: Parent, _: unknown, ctx: Context) => {
    if (!ctx.user) return null;
    const rsvp = await ctx.prisma.userEvent.findFirst({
      where: { userId: ctx.user.id, eventId: parent.id as string },
    });
    return rsvp?.rsvpStatus ?? null;
  },
};

export const Announcement = {
  community: (parent: Parent, _: unknown, ctx: Context) =>
    ctx.prisma.community.findUniqueOrThrow({
      where: { id: parent.communityId as string },
    }),

  author: (parent: Parent, _: unknown, ctx: Context) =>
    parent.authorId
      ? ctx.prisma.user.findUnique({
          where: { id: parent.authorId as string },
        })
      : null,
};

export const Comment = {
  author: (parent: Parent, _: unknown, ctx: Context) =>
    parent.authorId
      ? ctx.prisma.user.findUnique({
          where: { id: parent.authorId as string },
        })
      : null,

  parentComment: (parent: Parent, _: unknown, ctx: Context) =>
    parent.parentCommentId
      ? ctx.prisma.comment.findUnique({
          where: { id: parent.parentCommentId as number },
        })
      : null,

  replies: (parent: Parent, _: unknown, ctx: Context) =>
    ctx.prisma.comment.findMany({
      where: {
        parentCommentId: parent.id as number,
        commentStatus: "APPROVED",
      },
      orderBy: { ts: "asc" },
    }),
};

export const UserSubscription = {
  community: (parent: Parent, _: unknown, ctx: Context) =>
    ctx.prisma.community.findUniqueOrThrow({
      where: { id: parent.communityId as string },
    }),
};

export const UserEvent = {
  event: (parent: Parent, _: unknown, ctx: Context) =>
    ctx.prisma.event.findUniqueOrThrow({
      where: { id: parent.eventId as string },
    }),
};

export const UserRole = {
  role: (parent: Parent, _: unknown, ctx: Context) =>
    ctx.prisma.role.findUniqueOrThrow({
      where: { id: parent.roleId as number },
    }),
};

export const Hub = {
  communities: async (parent: Parent, _: unknown, ctx: Context) => {
    const links = await ctx.prisma.hubCommunity.findMany({
      where: { hubId: parent.id as string },
    });
    return ctx.prisma.community.findMany({
      where: {
        id: { in: links.map((l: { communityId: string }) => l.communityId) },
      },
    });
  },
};

export const User = {
  subscriptions: (parent: Parent, _: unknown, ctx: Context) =>
    ctx.prisma.subscription.findMany({
      where: { userId: parent.id as string, isActive: true },
    }),

  userRoles: (parent: Parent, _: unknown, ctx: Context) =>
    ctx.prisma.userRole.findMany({ where: { userId: parent.id as string } }),
};
