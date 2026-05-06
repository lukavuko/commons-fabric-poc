/* eslint-disable @typescript-eslint/no-explicit-any */
import { GraphQLError } from "graphql";
import { Context } from "../context.js";

const updateUserFields = [
  "firstname",
  "lastname",
  "phone",
  "displayName",
  "postalCode",
  "city",
] as const;

const communityFields = [
  "name",
  "website",
  "description",
  "tags",
  "contactFirstname",
  "contactLastname",
  "contactEmail",
  "contactNumber",
  "address",
  "city",
  "province",
  "postalCode",
  "country",
] as const;

const createEventFields = [
  "communityId",
  "title",
  "subtitle",
  "description",
  "eventType",
  "links",
  "tags",
  "location",
  "startsAt",
  "endsAt",
  "recurring",
  "recurringDow",
] as const;

const updateEventFields = [
  "title",
  "subtitle",
  "description",
  "eventType",
  "links",
  "tags",
  "location",
  "startsAt",
  "endsAt",
  "recurring",
  "recurringDow",
  "releaseStatus",
] as const;

const createAnnouncementFields = [
  "communityId",
  "title",
  "subtitle",
  "description",
  "tags",
] as const;

const subscriptionFields = [
  "calendarFreq",
  "calendarPreferredTime",
  "calendarChannels",
  "announcementFreq",
  "announcementPreferredTime",
  "announcementChannels",
] as const;

function pickInput<const T extends readonly string[]>(
  input: Record<string, unknown> | undefined,
  allowedFields: T,
): Partial<Record<T[number], any>> {
  if (!input) return {};
  return Object.fromEntries(
    allowedFields
      .filter((field) => Object.hasOwn(input, field))
      .map((field) => [field, input[field]]),
  ) as Partial<Record<T[number], any>>;
}

export const Mutation = {
  signUp: async (
    _: unknown,
    _args: { email: string; password: string },
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
      data: pickInput(args.input, updateUserFields),
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
        data: {
          ...pickInput(args.input, communityFields),
          creatorId: user.id,
        } as any,
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
      await tx.subscription.upsert({
        where: {
          userId_communityId: {
            userId: user.id,
            communityId: community.id,
          },
        },
        update: {
          isActive: true,
          tsUnsubscribed: null,
        },
        create: {
          userId: user.id,
          communityId: community.id,
          isActive: true,
          calendarChannels: ["EMAIL"],
          announcementChannels: ["EMAIL"],
        },
      });
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
      data: pickInput(args.input, communityFields),
    });
  },

  createEvent: async (
    _: unknown,
    args: { input: Record<string, unknown> },
    ctx: Context,
  ) => {
    const communityId = args.input.communityId as string;
    ctx.requireEmailVerified();
    const user = await ctx.requirePermission("event:create", communityId);
    return ctx.prisma.event.create({
      data: {
        ...pickInput(args.input, createEventFields),
        creatorId: user.id,
        releaseStatus: "DRAFT",
      } as any,
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
      data: pickInput(args.input, updateEventFields),
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
        ...pickInput(args.input, createAnnouncementFields),
        authorId: user.id,
        releaseStatus: "DRAFT",
      } as any,
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
        ...pickInput(args.input, subscriptionFields),
      },
      create: {
        userId: user.id,
        communityId: args.communityId,
        isActive: true,
        ...pickInput(args.input, subscriptionFields),
      },
    });
  },

  unsubscribeFromCommunity: async (
    _: unknown,
    args: { communityId: string },
    ctx: Context,
  ) => {
    const user = ctx.requireAuth();
    const userRole = await ctx.prisma.userRole.findUnique({
      where: {
        userId_entityId: { userId: user.id, entityId: args.communityId },
      },
      include: { role: true },
    });
    if (userRole?.role.name === "MEMBER" || userRole?.role.name === "STEWARD") {
      throw new GraphQLError("Community roles inherit subscription access", {
        extensions: { code: "FORBIDDEN" },
      });
    }
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
      data: pickInput(args.input, subscriptionFields),
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
