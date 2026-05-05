export { communityPermissions } from "./community.js";
export { eventPermissions } from "./event.js";
export { announcementPermissions } from "./announcement.js";
export { commentPermissions } from "./comment.js";
export { memberPermissions } from "./member.js";
export { hubPermissions } from "./hub.js";

import { communityPermissions } from "./community.js";
import { eventPermissions } from "./event.js";
import { announcementPermissions } from "./announcement.js";
import { commentPermissions } from "./comment.js";
import { memberPermissions } from "./member.js";
import { hubPermissions } from "./hub.js";

export const permissions = [
  ...communityPermissions,
  ...eventPermissions,
  ...announcementPermissions,
  ...commentPermissions,
  ...memberPermissions,
  ...hubPermissions,
] as const;

export type PermissionDefinition = (typeof permissions)[number];
export type PermissionName = PermissionDefinition["name"];
