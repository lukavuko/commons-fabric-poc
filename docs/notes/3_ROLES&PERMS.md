# User Roles & Permissions

## Permission Matrix (Current)

| Permission                                             | Anyone | Member | Steward | Hub Manager |
| ------------------------------------------------------ | ------ | ------ | ------- | ----------- |
| View Community Page Info                               | X      | X      | X       | X           |
| Community Subscribe                                    | X      | X      | X       | X           |
| Community Join Request                                 | X      | X      | X       | X           |
| Manage Notification Preferences                        | X      | X      | X       | X           |
| View/Save/Download Public Events                       | X      | X      | X       | X           |
| View/Save/Download Private Events                      |        | X      | X       | X           |
| View Members List                                      |        | X      | X       | X           |
| RSVP to Calendar Events                                |        | X      | X       | X           |
| Comment on Events/Announcements                        |        | X      | X       | X           |
| Delete own Comments                                    |        | X      | X       | X           |
| Invite Members                                         |        | X      | X       |             |
| Approve New Members                                    |        |        | X       |             |
| Remove Existing Members                                |        |        | X       |             |
| Create Events                                          |        |        | X       |             |
| Edit Events                                            |        |        | X       |             |
| Delete Events                                          |        |        | X       |             |
| Publish Events                                         |        |        | X       |             |
| Draft Announcements                                    |        |        | X       |             |
| Publish Announcements                                  |        |        | X       |             |
| Hide Announcements                                     |        |        | X       |             |
| Archive Announcements                                  |        |        | X       |             |
| Moderate Comments (others')                            |        |        | X       |             |
| Edit Community Page Info                               |        |        | X       |             |
| Configure Community Governance                         |        |        | X       |             |
| Configure Community Roles                              |        |        | X       |             |
| Assign/Revoke Community Roles                          |        |        | X       |             |
| Archive/Delete Community                               |        |        | X       |             |
| View Internal Hub Entities (Events/Calendar/Analytics) |        |        |         | X           |
| Create/Modify Hub Level Entities                       |        |        |         | X           |
| Add/Remove Communities from Hub                        |        |        |         | X           |
| Request to Join a Hub (community action)               |        |        | X       |             |
| Approve Hub Community Request                          |        |        |         | X           |
| Reject Hub Community Request                           |        |        |         | X           |

_Entities: any object users can interact with — Events, Announcements, Community Pages, Hubs._

---

## Architecture Decisions & Design Notes

### RBAC Philosophy

The system follows **permission-level RBAC**, not role-level gating. Roles are organizational containers for permission sets. The frontend and server both work on the resolved permission level:

```
User + Entity (Community/Hub) → UserRole → Role → RolePermissions → Permission names
```

- **Server**: resolvers call `requirePermission(ctx, "event:create", communityId)` rather than `requireCommunityRole(communityId, ["STEWARD"])`.
- **Frontend**: components call `can("event:create")` from a `usePermissions(communityId)` hook rather than checking `viewerStatus === "steward"`.

This design handles custom roles correctly: if a Steward creates a custom ORGANIZER role and grants it `event:create` but not `community:archive`, the frontend and server both honour that without code changes.

### Default vs Custom Roles

- All roles defined in `packages/defaults/src/role_permissions.ts` have `isDefault: true` in the database.
- Stewards may create custom roles (isDefault: false). These carry their own RolePermission rows.
- The frontend detects `isDefault: false` and fetches resolved permissions via `myPermissions(entityId, entityType)` rather than assuming defaults. This is handled transparently in `usePermissions`.

### Subscriber is Not a Role

Anyone (authenticated or not) can subscribe to a community to receive public notifications. Subscribing adds a row to the `Subscription` table and increments the community's subscriber count, but grants no `UserRole`. There is no SUBSCRIBER role in the database.

Email verification is a separate server-side precondition for `subscribeToCommunity` (not a permission). The RBAC layer sees `community:subscribe` as available to ANYONE; the resolver enforces `emailVerifiedAt` independently.

### Permission Scope

Permissions follow `entity:action` naming. Scope (public/private/draft) is an attribute on the resource itself, not embedded in the permission name. Example: `event:view` is the permission; whether the event is `PUBLIC` or `DRAFT` is evaluated by the resolver based on `releaseStatus`.

_Exception: `event:view-private` is kept for the MVP as a pragmatic shortcut distinguishing read access for non-public events. This will be refactored to scope-on-resource when visibility tiers grow beyond public/private._

### Entity Type Scoping

| Role        | entityType | isDefault |
| ----------- | ---------- | --------- |
| MEMBER      | COMMUNITY  | true      |
| STEWARD     | COMMUNITY  | true      |
| HUB_MANAGER | HUB        | true      |

Community sub-entities (Calendar, Event, Announcement, Comment) are scoped under COMMUNITY.
Hub sub-entities are scoped under HUB.

### Role Inheritance

Default roles inherit upward. The seeder resolves full permission sets before inserting:

```
STEWARD inherits MEMBER
MEMBER  (base, no parent)
HUB_MANAGER (base, no parent, HUB-scoped)
```

Custom roles do not inherit; they carry explicit RolePermission rows.

### Roles Deferred to Post-MVP

`VOLUNTEER`, `MODERATOR`, `ORGANIZER`, `CO_STEWARD` — these are custom roles that Stewards may define. They are not default system roles and will not be seeded. Post-MVP a role-builder UI will let Stewards create and assign them.

---

## Permission Catalogue

### Community

| name                             | description                                            |
| -------------------------------- | ------------------------------------------------------ |
| `community:view`                 | View community page info and publicly visible metadata |
| `community:subscribe`            | Subscribe to receive public updates                    |
| `community:join-request`         | Request membership                                     |
| `community:notifications-manage` | Manage personal notification preferences               |
| `community:edit`                 | Edit community page details                            |
| `community:governance-manage`    | Configure governance settings and approval workflows   |
| `community:roles-manage`         | Create and configure community roles                   |
| `community:roles-assign`         | Assign or revoke community roles for members           |
| `community:archive`              | Archive or delete the community                        |
| `hub:community-request`          | Request the community be added to a hub                |

### Event

| name                 | description                                        |
| -------------------- | -------------------------------------------------- |
| `event:view-public`  | View, save, or download public events              |
| `event:view-private` | View, save, or download private/member-only events |
| `event:rsvp`         | RSVP to calendar events                            |
| `event:create`       | Create new community events                        |
| `event:edit`         | Edit existing events                               |
| `event:delete`       | Delete events                                      |
| `event:publish`      | Publish a draft event to PUBLIC status             |

### Announcement

| name                   | description                                               |
| ---------------------- | --------------------------------------------------------- |
| `announcement:draft`   | Create a new announcement draft                           |
| `announcement:publish` | Publish a draft announcement                              |
| `announcement:hide`    | Hide a published announcement                             |
| `announcement:archive` | Archive an announcement (freezes comments, stays visible) |

### Comment

| name               | description                                          |
| ------------------ | ---------------------------------------------------- |
| `comment:create`   | Comment on events and announcements                  |
| `comment:delete`   | Delete own comments                                  |
| `comment:moderate` | Moderate (hide/approve/reject) other users' comments |

### Member

| name               | description                                                   |
| ------------------ | ------------------------------------------------------------- |
| `member:list-view` | View the community member list                                |
| `member:invite`    | Invite a user to join or subscribe (by email or display name) |
| `member:approve`   | Approve new membership requests                               |
| `member:remove`    | Remove existing members                                       |

### Hub

| name                    | description                                              |
| ----------------------- | -------------------------------------------------------- |
| `hub:internal-view`     | View internal hub entities (events, calendar, analytics) |
| `hub:entity-manage`     | Create and modify hub-level entities                     |
| `hub:communities-edit`  | Add or remove communities from the hub                   |
| `hub:community-approve` | Approve a community's hub join request                   |
| `hub:community-reject`  | Reject a community's hub join request                    |
