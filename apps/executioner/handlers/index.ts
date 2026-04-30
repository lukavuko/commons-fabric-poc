import type { Prisma } from "@cfp/db";

export type JobHandler = (payload: Prisma.JsonValue) => Promise<void>;

export const handlers: Record<string, JobHandler> = {
  // Register handlers here as they are implemented.
  // Example:
  // "send-digest": sendDigestHandler,
};
