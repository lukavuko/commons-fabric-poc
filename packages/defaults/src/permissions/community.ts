export const communityPermissions = [
  {
    name: "community:view",
    description: "View community page info and publicly visible metadata.",
  },
  {
    name: "community:subscribe",
    description: "Subscribe to a community to receive public updates.",
  },
  {
    name: "community:join-request",
    description: "Request membership in a community.",
  },
  {
    name: "community:notifications-manage",
    description: "Manage personal notification preferences for a community.",
  },
  {
    name: "community:edit",
    description: "Edit community page details and metadata.",
  },
  {
    name: "community:governance-manage",
    description:
      "Configure community governance settings and approval workflows.",
  },
  {
    name: "community:roles-manage",
    description: "Create and configure community roles.",
  },
  {
    name: "community:roles-assign",
    description: "Assign or revoke community roles for members.",
  },
  {
    name: "community:archive",
    description: "Archive or delete the community.",
  },
  {
    name: "hub:community-request",
    description: "Request the community be added to a hub.",
  },
] as const;
