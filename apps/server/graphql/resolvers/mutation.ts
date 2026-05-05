/* eslint-disable @typescript-eslint/no-explicit-any */
import { GraphQLError } from "graphql";
import { Context } from "../context.js";

export const Mutation = {
  signUp: async (
    _: unknown,
    _args: { email: string; password: string; username: string },
    _ctx: Context,
  ) => {
    throw new GraphQLError("signUp is handled by the auth service", {
      extensions: { code: "NOT_IMPLEMENTED" },
    });
  },

  signIn: async (
    _: unknown,
    _args: { email: string; password: string },
    _ctx: Context,
  ) => {
    throw new GraphQLError("signIn is handled by the auth service", {
      extensions: { code: "NOT_IMPLEMENTED" },
    });
  },

  signOut: () => true,

  updateMe: async (
    _: unknown,
    args: { input: Record<string, unknown> },
    ctx: Context,
  ) => {
    const user = ctx.requireAuth();
    return ctx.prisma.user.update({
      where: { id: user.id },
      data: args.input as object,
    });
  },

  deleteMe: async (_: unknown, _args: unknown, ctx: Context) => {
    const user = ctx.requireAuth();
    await ctx.prisma.user.delete({ where: { id: user.id } });
    return true;
  },

  createCommunity: async (
    _: unknown,
    args: { input: Record<string, unknown> },
    ctx: Context,
  ) => {
    const user = ctx.requireEmailVerified();
    return ctx.prisma.$transaction(async (tx) => {
      const community = await tx.community.create({
        data: { ...(args.input as any), creatorId: user.id },
      });
      const stewardRole = await tx.role.findFirst({
        where: { name: "STEWARD", isDefault: true },
      });
      if (stewardRole) {
        await tx.userRole.create({
          data: {
            userId: user.id,
            entityType: "COMMUNITY",
            entityId: community.id,
            roleId: stewardRole.id,
          },
        });
      }
      return community;
    });
  },

  updateCommunity: async (
    _: unknown,
    args: { id: string; input: Record<string, unknown> },
    ctx: Context,
  ) => {
    await ctx.requirePermission("community:edit", args.id);
    return ctx.prisma.community.update({
      where: { id: args.id },
      data: args.input as object,
    });
  },

  createEvent: async (
    _: unknown,
    args: { input: Record<string, unknown> },
    ctx: Context,
  ) => {
    const communityId = args.input.communityId as string;
    const user = await ctx.requirePermission("event:create", communityId);
    return ctx.prisma.event.create({
      data: {
        ...(args.input as any),
        creatorId: user.id,
        releaseStatus: "DRAFT",
      },
    });
  },

  updateEvent: async (
    _: unknown,
    args: { id: string; input: Record<string, unknown> },
    ctx: Context,
  ) => {
    const event = await ctx.prisma.event.findUniqueOrThrow({
      where: { id: args.id },
    });
    await ctx.requirePermission("event:edit", event.communityId);
    return ctx.prisma.event.update({
      where: { id: args.id },
      data: args.input as object,
    });
  },

  deleteEvent: async (_: unknown, args: { id: string }, ctx: Context) => {
    const event = await ctx.prisma.event.findUniqueOrThrow({
      where: { id: args.id },
    });
    await ctx.requirePermission("event:delete", event.communityId);
    await ctx.prisma.event.delete({ where: { id: args.id } });
    return true;
  },

  publishEvent: async (_: unknown, args: { id: string }, ctx: Context) => {
    const event = await ctx.prisma.event.findUniqueOrThrow({
      where: { id: args.id },
    });
    await ctx.requirePermission("event:publish", event.communityId);
    return ctx.prisma.event.update({
      where: { id: args.id },
      data: { releaseStatus: "PUBLIC", releasedAt: new Date() },
    });
  },

  createAnnouncement: async (
    _: unknown,
    args: { input: Record<string, unknown> },
    ctx: Context,
  ) => {
    const communityId = args.input.communityId as string;
    const user = await ctx.requirePermission(
      "announcement:create",
      communityId,
    );
    return ctx.prisma.announcement.create({
      data: {
        ...(args.input as any),
        authorId: user.id,
        releaseStatus: "DRAFT",
      },
    });
  },

  publishAnnouncement: async (
    _: unknown,
    args: { id: string },
    ctx: Context,
  ) => {
    const ann = await ctx.prisma.announcement.findUniqueOrThrow({
      where: { id: args.id },
    });
    await ctx.requirePermission("announcement:publish", ann.communityId);
    return ctx.prisma.announcement.update({
      where: { id: args.id },
      data: { releaseStatus: "PUBLIC", releasedAt: new Date() },
    });
  },

  subscribeToCommunity: async (
    _: unknown,
    args: { communityId: string; input?: Record<string, unknown> },
    ctx: Context,
  ) => {
    const user = ctx.requireEmailVerified();
    return ctx.prisma.subscription.upsert({
      where: {
        userId_communityId: { userId: user.id, communityId: args.communityId },
      },
      update: {
        isActive: true,
        tsUnsubscribed: null,
        ...(args.input ?? {}),
      },
      create: {
        userId: user.id,
        communityId: args.communityId,
        isActive: true,
        ...(args.input ?? {}),
      },
    });
  },

  unsubscribeFromCommunity: async (
    _: unknown,
    args: { communityId: string },
    ctx: Context,
  ) => {
    const user = ctx.requireAuth();
    await ctx.prisma.subscription.update({
      where: {
        userId_communityId: { userId: user.id, communityId: args.communityId },
      },
      data: { isActive: false, tsUnsubscribed: new Date() },
    });
    return true;
  },

  updateSubscription: async (
    _: unknown,
    args: { communityId: string; input: Record<string, unknown> },
    ctx: Context,
  ) => {
    const user = ctx.requireAuth();
    return ctx.prisma.subscription.update({
      where: {
        userId_communityId: { userId: user.id, communityId: args.communityId },
      },
      data: args.input as object,
    });
  },

  rsvpToEvent: async (
    _: unknown,
    args: { eventId: string; status: string },
    ctx: Context,
  ) => {
    const user = ctx.requireAuth();
    const rsvpStatus = args.status as "GOING" | "INTERESTED" | "NOT_GOING";
    const existing = await ctx.prisma.userEvent.findFirst({
      where: { userId: user.id, eventId: args.eventId },
    });
    if (existing) {
      return ctx.prisma.userEvent.update({
        where: { id: existing.id },
        data: { rsvpStatus },
      });
    }
    return ctx.prisma.userEvent.create({
      data: { userId: user.id, eventId: args.eventId, rsvpStatus },
    });
  },

  cancelRsvp: async (_: unknown, args: { eventId: string }, ctx: Context) => {
    const user = ctx.requireAuth();
    await ctx.prisma.userEvent.deleteMany({
      where: { userId: user.id, eventId: args.eventId },
    });
    return true;
  },

  postComment: async (
    _: unknown,
    args: { input: Record<string, unknown> },
    ctx: Context,
  ) => {
    const user = ctx.requireAuth();
    return ctx.prisma.comment.create({
      data: {
        authorId: user.id,
        communityId: args.input.communityId as string,
        content: args.input.content as string,
        parentEntityType: args.input.parentEntityType as
          | "ANNOUNCEMENT"
          | "EVENT",
        parentEntityId: args.input.parentEntityId as string,
        parentCommentId: args.input.parentCommentId
          ? Number(args.input.parentCommentId)
          : null,
        commentStatus: "PENDING",
      },
    });
  },

  moderateComment: async (
    _: unknown,
    args: { id: string; status: string },
    ctx: Context,
  ) => {
    const comment = await ctx.prisma.comment.findUniqueOrThrow({
      where: { id: Number(args.id) },
    });
    await ctx.requirePermission("comment:moderate", comment.communityId);
    return ctx.prisma.comment.update({
      where: { id: Number(args.id) },
      data: {
        commentStatus: args.status as
          | "APPROVED"
          | "REJECTED"
          | "HIDDEN"
          | "LOCKED"
          | "PENDING",
      },
    });
  },
};
