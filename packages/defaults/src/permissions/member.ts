export const memberPermissions = [
  {
    name: "member:list-view",
    description: "View the community member list.",
  },
  {
    name: "member:invite",
    description:
      "Invite a user to join or subscribe, by email or display name.",
  },
  {
    name: "member:approve",
    description: "Approve new community membership requests.",
  },
  {
    name: "member:remove",
    description: "Remove existing community members.",
  },
] as const;
