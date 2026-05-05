import { PermissionName, permissions } from "./permissions/index.js";

export { permissions };
export type { PermissionName };

// -------------------------------------------------------
// Types
// -------------------------------------------------------

export type EntityType = "COMMUNITY" | "HUB";

export interface RoleDefinition {
  name: string;
  entityType: EntityType;
  /** true for all roles defined here — only custom roles created by stewards are false */
  isDefault: true;
  /** Role this one inherits from. The seeder resolves the full permission set. */
  inherits?: string;
  /** Permissions granted directly by this role, on top of any inherited set. */
  ownPermissions: PermissionName[];
}

// -------------------------------------------------------
// Implicit (unauthenticated / no-role) permission set
// Used by myPermissions resolver when user has no UserRole for the entity.
// -------------------------------------------------------

// Unverified users or those without accounts can only view and subscribe email
// in which case a 'proxy' anonymous account will be instantiated.
export const ANON_USER: PermissionName[] = [
  "community:view",
  "event:view-public",
];

// Enforce that only verified users can join communities.
export const REGISTERED_USER: PermissionName[] = [
  "community:view",
  "event:view-public",
  "community:subscribe",
  "community:join-request",
  "community:notifications-manage",
];

// -------------------------------------------------------
// Default roles
// -------------------------------------------------------

export const roles: RoleDefinition[] = [
  {
    name: "MEMBER",
    entityType: "COMMUNITY",
    isDefault: true,
    // MEMBER is the base community role — does not inherit ANYONE because
    // ANYONE represents the implicit floor for all users, not a DB role.
    ownPermissions: [
      "community:view",
      "community:subscribe",
      "community:join-request",
      "community:notifications-manage",
      "event:view-public",
      "event:view-private",
      "event:rsvp",
      "member:list-view",
      "member:invite",
      "comment:create",
      "comment:delete",
    ],
  },
  {
    name: "STEWARD",
    entityType: "COMMUNITY",
    isDefault: true,
    inherits: "MEMBER",
    ownPermissions: [
      "event:create",
      "event:edit",
      "event:delete",
      "event:publish",
      "announcement:draft",
      "announcement:publish",
      "announcement:hide",
      "announcement:archive",
      "comment:moderate",
      "member:approve",
      "member:remove",
      "community:edit",
      "community:governance-manage",
      "community:roles-manage",
      "community:roles-assign",
      "community:archive",
      "hub:community-request",
    ],
  },
  {
    name: "HUB_MANAGER",
    entityType: "HUB",
    isDefault: true,
    ownPermissions: [
      "community:view",
      "community:subscribe",
      "community:notifications-manage",
      "event:view-public",
      "event:view-private",
      "hub:internal-view",
      "hub:entity-manage",
      "hub:communities-edit",
      "hub:community-approve",
      "hub:community-reject",
    ],
  },
];

// -------------------------------------------------------
// Resolved permission sets (inheritance expanded)
// Used by the seeder and by myPermissions resolver fallback.
// -------------------------------------------------------

function resolvePermissions(roleName: string): PermissionName[] {
  const role = roles.find((r) => r.name === roleName);
  if (!role) return [];
  const inherited = role.inherits ? resolvePermissions(role.inherits) : [];
  const merged = new Set([...inherited, ...role.ownPermissions]);
  return Array.from(merged);
}

export const resolvedRoles: Record<string, PermissionName[]> =
  Object.fromEntries(roles.map((r) => [r.name, resolvePermissions(r.name)]));
