# 🛰️ Documentation Sync Registry

This registry tracks the parity between high-level documentation and the actual repository state. These discrepancies are logged to ensure that "Ground Truth" established in the codebase, database, and core logic is accurately reflected for all developers. The table below summarizes when was the last time a document has been updated, as well as any discrepencies/deviations that exist with the current repository. These discrepencies are generated on review and logged here until they are resolved, at which point they become cleared.

## 🚦 Status Definitions

| **State** | **Designation** | **Definition**                                               |
| --------- | --------------- | ------------------------------------------------------------ |
| 🟢        | **Healthy**     | Documentation and codebase are in acceptable/good core alignment. |
| 🟡        | **NeedsReview** | It has been some time since the last review. It would be a good time to check for any minor deviations. |
| 🟠        | **Degraded**    | **Sync Required.** Drift detected; terminology has changed; logic has evolved, and documentation is partially misleading.  Documentation may contradict the current repo or database truth and needs to be updated. |
| 🔴        | **Blocked**     | **Sync Required but Blocked.** Requires operator or advisor input to validate the ground truth for the sync or to address any other blocker first. This is where we need to identify and address existing uncertainty, confirm assumptions and procedure, and then proceed to ensure the sync is done correctly the first time. |


## 📁Doc Status Tracker

| Document                                  | Last Updated | Discrepencies with Repo State | Status |
| ----------------------------------------- | :----------- | ----------------------------- | :----: |
| [Core Philosophy](./../dev-philosophy.md) | 2026-05-05   |                               |   🟢    |
| [Architecture](./1_ARCHITECTURE.md)       | ?            |                               |   🟡    |
| [Features](./2_FEATURES.mc)               | 2026-04-22   |                               |   🟡    |
| [Roles & Permissions](./3_ROLES&PERMS.md) | 2026-05-02   |                               |   🟡    |
| [PoC Discussion](./4_PoC_Discussion.md)   | ?            |                               |   🟡    |
| [UI/UX Styling](./5_STYLING.md)           | ?            |                               |   🟡    |
| [Questions]((./6_QUESTIONS.md))           | ?            |                               |   🟡    |
| [MVP Slice Plan](./7_MVP_SLICE_PLAN.md)   | 2026-05-03   |                               |   🟡    |


## 🛠️ Resolution Protocol

When a document reaches a **🟠 Degraded** or **🔴 Blocked** state, the following actions must be taken during the next development cycle:

1. **Determine Ground Truth**: Truth can either be the codebase or the existing docs. If it's obvious basd on recent context, proceed autonomously. If not, we are in a blocked state and **need to confirm next actions** with operator.
2. **Analyze Ground Truth:** Consult the selected source of truth (docs, codebase, database schema, other core backend logic, etc.) in a targetted manner to confirm current system behavior.
3. **Note Doc Discrepencies:** In the table above, note any detected discrepencies or deviations. Once approved for sync, move on to step 4.
4. **Prune Bloat:** Move any obsolete documentation to the @archive.md file in a condensed bullet point way. The format is detailed there for reference. Allows us to track what is being updated.
5. **Atomic Update:** Update the targetted markdown file and this Registry simultaneously in a single "Documentation Sync" commit. Within the registry, strikethrough the applied discrepencies and update the status
6. **Validate:** Ensure the new instructions would allow a new developer to navigate the logic without needing a verbal walkthrough.
