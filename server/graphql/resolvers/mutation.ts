/* eslint-disable @typescript-eslint/no-explicit-any */
import { GraphQLError } from "graphql";
import { Context } from "../context";
import { supabaseAdmin } from "../../lib/supabase";

export const Mutation = {
  signUp: async (
    _: unknown,
    args: { email: string; password: string; username: string },
    ctx: Context
  ) => {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: args.email,
      password: args.password,
      email_confirm: true,
      user_metadata: { username: args.username },
    });

    if (error || !data.user)
      throw new GraphQLError(error?.message ?? "Sign up failed");

    const user = await ctx.prisma.user.upsert({
      where: { id: data.user.id },
      update: {},
      create: { id: data.user.id, email: args.email, username: args.username },
    });

    const { data: session } = await supabaseAdmin.auth.signInWithPassword({
      email: args.email,
      password: args.password,
    });
    if (!session.session)
      throw new GraphQLError("Could not create session after sign up");

    return { user, token: session.session.access_token };
  },

  signIn: async (
    _: unknown,
    args: { email: string; password: string },
    ctx: Context
  ) => {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: args.email,
      password: args.password,
    });
    if (error || !data.session)
      throw new GraphQLError(error?.message ?? "Sign in failed");

    const user = await ctx.prisma.user.upsert({
      where: { id: data.user.id },
      update: { lastloginAt: new Date() },
      create: {
        id: data.user.id,
        email: args.email,
        username:
          data.user.user_metadata?.username ?? args.email.split("@")[0],
      },
    });

    return { user, token: data.session.access_token };
  },

  signOut: () => true,

  createCommunity: async (
    _: unknown,
    args: { input: Record<string, unknown> },
    ctx: Context
  ) => {
    const user = ctx.requireAuth();
    return ctx.prisma.community.create({
      data: { ...(args.input as any), creatorId: user.id },
    });
  },

  updateCommunity: async (
    _: unknown,
    args: { id: string; input: Record<string, unknown> },
    ctx: Context
  ) => {
    await ctx.requireCommunityRole(args.id, ["ORGANIZER", "ADMIN", "STEWARD"]);
    return ctx.prisma.community.update({
      where: { id: args.id },
      data: args.input as object,
    });
  },

  createEvent: async (
    _: unknown,
    args: { input: Record<string, unknown> },
    ctx: Context
  ) => {
    const communityId = args.input.communityId as string;
    await ctx.requireCommunityRole(communityId, [
      "ORGANIZER",
      "ADMIN",
      "STEWARD",
    ]);
    const user = ctx.requireAuth();
    return ctx.prisma.event.create({
      data: { ...(args.input as any), creatorId: user.id, releaseStatus: "DRAFT" },
    });
  },

  updateEvent: async (
    _: unknown,
    args: { id: string; input: Record<string, unknown> },
    ctx: Context
  ) => {
    const event = await ctx.prisma.event.findUniqueOrThrow({
      where: { id: args.id },
    });
    await ctx.requireCommunityRole(event.communityId, [
      "ORGANIZER",
      "ADMIN",
      "STEWARD",
    ]);
    return ctx.prisma.event.update({
      where: { id: args.id },
      data: args.input as object,
    });
  },

  deleteEvent: async (_: unknown, args: { id: string }, ctx: Context) => {
    const event = await ctx.prisma.event.findUniqueOrThrow({
      where: { id: args.id },
    });
    await ctx.requireCommunityRole(event.communityId, [
      "ORGANIZER",
      "ADMIN",
      "STEWARD",
    ]);
    await ctx.prisma.event.delete({ where: { id: args.id } });
    return true;
  },

  publishEvent: async (_: unknown, args: { id: string }, ctx: Context) => {
    const event = await ctx.prisma.event.findUniqueOrThrow({
      where: { id: args.id },
    });
    await ctx.requireCommunityRole(event.communityId, [
      "ORGANIZER",
      "ADMIN",
      "STEWARD",
    ]);
    return ctx.prisma.event.update({
      where: { id: args.id },
      data: { releaseStatus: "PUBLIC", releasedAt: new Date() },
    });
  },

  createAnnouncement: async (
    _: unknown,
    args: { input: Record<string, unknown> },
    ctx: Context
  ) => {
    const communityId = args.input.communityId as string;
    await ctx.requireCommunityRole(communityId, [
      "ORGANIZER",
      "ADMIN",
      "STEWARD",
      "MODERATOR",
    ]);
    const user = ctx.requireAuth();
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
    ctx: Context
  ) => {
    const ann = await ctx.prisma.announcement.findUniqueOrThrow({
      where: { id: args.id },
    });
    await ctx.requireCommunityRole(ann.communityId, [
      "ORGANIZER",
      "ADMIN",
      "STEWARD",
    ]);
    return ctx.prisma.announcement.update({
      where: { id: args.id },
      data: { releaseStatus: "PUBLIC", releasedAt: new Date() },
    });
  },

  subscribeToCommunity: async (
    _: unknown,
    args: { communityId: string; input?: Record<string, unknown> },
    ctx: Context
  ) => {
    const user = ctx.requireAuth();
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
    ctx: Context
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
    ctx: Context
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
    ctx: Context
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
    ctx: Context
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
    ctx: Context
  ) => {
    const comment = await ctx.prisma.comment.findUniqueOrThrow({
      where: { id: Number(args.id) },
    });
    await ctx.requireCommunityRole(comment.communityId, [
      "MODERATOR",
      "ORGANIZER",
      "ADMIN",
      "STEWARD",
    ]);
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
