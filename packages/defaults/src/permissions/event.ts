export const eventPermissions = [
  {
    name: "event:view-public",
    description: "View, save, or download public community events.",
  },
  {
    name: "event:view-private",
    description: "View, save, or download private/member-only events.",
  },
  {
    name: "event:rsvp",
    description: "RSVP to calendar events.",
  },
  {
    name: "event:create",
    description: "Create new community events.",
  },
  {
    name: "event:edit",
    description: "Edit existing community events.",
  },
  {
    name: "event:delete",
    description: "Delete community events.",
  },
  {
    name: "event:publish",
    description: "Publish a draft event to PUBLIC status.",
  },
] as const;
