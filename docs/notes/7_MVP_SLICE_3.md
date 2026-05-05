# MVP — Slice 3: Create/Edit Community + Event Forms

> **Last updated — 2026-05-04.**

---

## Goal

User can create a community and create an event from the UI. Edit flows for both are also wired up. Backend auto-assigns the creator as steward on community creation.

---

## Entry points

| Action           | Where the button lives                                                     | Route                             |
| ---------------- | -------------------------------------------------------------------------- | --------------------------------- |
| Create community | Explore page — top-right area (only shown to authenticated users)          | `/communities/new`                |
| Create event     | Community page → **Calendar tab** — top-right area (steward/editor only)   | `/communities/:id/events/new`     |
| Edit community   | Community page → **Information tab** — "Edit" button (steward/editor only) | `/communities/:id/edit`           |
| Edit event       | Community page → **Calendar tab** → click event tile → Event Popup         | in-popup form, no dedicated route |

Anonymous users never see the "Create community" button.

---

## Server changes

### `createCommunity` — auto-assign steward role

After inserting the community row, upsert a `UserRole` row granting the creator the `STEWARD` role on the new community (same resolver, same transaction via `prisma.$transaction`). Without this the creator immediately loses `event:create` permission.

No GraphQL schema changes needed — the `createCommunity` mutation signature is unchanged.

---

## Routes to add

```
/communities/new                  →  CreateCommunityPage
/communities/:id/edit             →  EditCommunityPage
/communities/:id/events/new       →  CreateEventPage
```

All three are auth-gated (redirect to `/auth` if unauthenticated). Create/edit event additionally requires `event:create` permission on the community (`usePermissions`).

---

## Community form — `CreateCommunityInput` / `UpdateCommunityInput`

### Mandatory fields

| Field              | Input type | Notes                                           |
| ------------------ | ---------- | ----------------------------------------------- |
| `name`             | text       |                                                 |
| `description`      | textarea   |                                                 |
| `contactFirstname` | text       | Pre-populated from `me.firstname` if available  |
| `contactLastname`  | text       | Pre-populated from `me.lastname` if available   |
| `contactEmail`     | email      | Pre-populated from `me.email`                   |
| `address`          | text       |                                                 |
| `city`             | text       |                                                 |
| `province`         | text       |                                                 |
| `postalCode`       | text       | Required in form even though nullable in schema |
| `country`          | text       | Default to "Canada" for PoC                     |

### Optional fields

| Field           | Input type | Notes                     |
| --------------- | ---------- | ------------------------- |
| `website`       | url        | Clearly labelled optional |
| `tags`          | chip input | See tags UX below         |
| `contactNumber` | tel        | Clearly labelled optional |

### Tags UX

Space-separated chip input: as the user presses **Space** after a word, the word becomes a styled chip (rounded, coloured border). Backspace on an empty input removes the last chip. Each chip has an `×` dismiss button. If the space-trigger proves flaky, fall back to **Enter-to-add**.

### Map / location note

Address fields are the only location mechanism for now. A future slice will add lat/lon pin-drop support. The current schema has no `lat`/`lng` columns — defer entirely.

### Verification note

A newly created community has `verifiedEmail = false`. It will only appear on the explore map/list once the contact email is verified (a future flow, not in scope for Slice 3). `verifiedExternally` stays null until a much later slice.

---

## Event form — `CreateEventInput` / `UpdateEventInput`

### Fields

| Field         | Input type          | Required | Notes                                          |
| ------------- | ------------------- | -------- | ---------------------------------------------- |
| `title`       | text                | yes      |                                                |
| `subtitle`    | text                | no       |                                                |
| `description` | textarea            | no       |                                                |
| `eventType`   | radio/select        | no       | `SOCIAL` \| `INFORMATIONAL`                    |
| `location`    | text                | no       |                                                |
| `startsAt`    | datetime-local      | no       |                                                |
| `endsAt`      | datetime-local      | no       |                                                |
| `tags`        | chip input          | no       | Same space-separated chip UX as community form |
| `links`       | repeatable url      | no       | Add/remove rows                                |
| `recurring`   | toggle → sub-fields | no       | See recurring note below                       |

`communityId` is taken from the route param — not a visible form field.

### Release actions

| Button            | Behaviour in Slice 3                                           | Future                                                          |
| ----------------- | -------------------------------------------------------------- | --------------------------------------------------------------- |
| **Save as draft** | `createEvent` (resolver hardcodes `DRAFT`) — **implement now** | —                                                               |
| **Publish now**   | Rendered as disabled button with tooltip "coming soon"         | Slice 5/6 — calls `publishEvent` mutation                       |
| **Schedule**      | Rendered as disabled button with tooltip "coming soon"         | Slice 5/6 — sets `releaseStatus + releasedAt` via `updateEvent` |

### Recurring event UI (stub)

Show a **"Recurring?"** toggle. When toggled on, reveal:

- `RecurrenceSchedule` select (`DAILY / WEEKLY / BIWEEKLY / MONTHLY / ANNUAL`)
- `recurringDow` day-of-week multi-select (`MON … SUN`)

These fields are **not wired** to the mutation payload in Slice 3 — they render as controlled inputs but are omitted from the submit payload. A `// TODO slice-4: wire recurring fields` comment marks the spot.

> Update slice plan: recurring event wiring deferred to Slice 4 or Slice 6 polish.

---

## Edit flows

### Edit community (`updateCommunity`)

Lives on the **Information tab** of the Community page. A steward/editor sees an "Edit" button that either:

- Navigates to `/communities/:id/edit` (dedicated page, same form component in edit mode), or
- Opens an inline edit state on the tab itself.

**Decision:** dedicated route (`/communities/:id/edit`) — simpler for PoC, easier to share the link.

Pre-populates all fields from the current `community` query result. On submit, calls `updateCommunity(id, input)`.

### Edit event (in Event Popup)

The event tile on the Calendar tab is clickable → opens `EventPopup`. If the viewer has `event:edit` permission, the popup renders an **"Edit"** button that toggles the popup into an inline edit form (same fields as the create form, minus `communityId`). On submit, calls `updateEvent(id, input)`.

---

## Deferred to later slices

| Item                                         | Target      |
| -------------------------------------------- | ----------- |
| Recurring event fields wired to mutation     | Slice 4 / 6 |
| Publish now / Schedule release               | Slice 5 / 6 |
| `verifiedEmail` contact-email flow           | Post-MVP    |
| Lat/lon pin-drop location input              | Post-MVP    |
| Domain-matching validation (website ↔ email) | Post-MVP    |

---

## Smoke test — `scripts/test-slice-3.sh`

Cover:

1. Unauthenticated user cannot reach `/communities/new` (redirected).
2. Authenticated + verified user can create a community → response has `id`.
3. Creator has `event:create` permission on the new community immediately after creation.
4. Steward can create a DRAFT event on their community.
5. Steward can update community fields via `updateCommunity`.
6. Steward can update event fields via `updateEvent`.
7. Non-steward verified user gets `FORBIDDEN` on `createEvent`.
