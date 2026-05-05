export const hubPermissions = [
  {
    name: "hub:internal-view",
    description:
      "View internal hub entities such as events, calendars, and analytics.",
  },
  {
    name: "hub:entity-manage",
    description:
      "Create and modify hub-level entities and manage hub interactions.",
  },
  {
    name: "hub:communities-edit",
    description: "Add or remove communities from the hub.",
  },
  {
    name: "hub:community-approve",
    description: "Approve a community's request to join the hub.",
  },
  {
    name: "hub:community-reject",
    description: "Reject a community's request to join the hub.",
  },
] as const;
