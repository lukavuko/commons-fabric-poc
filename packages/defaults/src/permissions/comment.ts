export const commentPermissions = [
  {
    name: "comment:create",
    description: "Comment on community events and announcements.",
  },
  {
    name: "comment:delete",
    description: "Delete own comments.",
  },
  {
    name: "comment:moderate",
    description: "Hide, approve, or reject other users' comments.",
  },
] as const;
