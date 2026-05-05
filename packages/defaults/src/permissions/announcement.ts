export const announcementPermissions = [
  {
    name: "announcement:draft",
    description: "Create a new announcement draft.",
  },
  {
    name: "announcement:publish",
    description: "Publish a draft announcement to the community.",
  },
  {
    name: "announcement:hide",
    description: "Hide a published announcement from public view.",
  },
  {
    name: "announcement:archive",
    description:
      "Archive an announcement — freezes comments but keeps it visible.",
  },
] as const;
