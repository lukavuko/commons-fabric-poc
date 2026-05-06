# Slice 4 — Personal Calendar + Event Detail Popup with .ics

> **Completed — 2026-05-06.**

## What shipped

### Backend

| Change                                                                                                               | File                                                                      |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `myCalendar(fromDate, toDate)` query — returns PUBLIC events from subscribed communities, ordered by `startsAt asc`  | `apps/server/graphql/schema.ts`, `apps/server/graphql/resolvers/query.ts` |
| `GET /api/events/:id/ical` REST endpoint — generates `.ics` download for any PUBLIC event                            | `apps/server/index.ts`                                                    |
| `@cfp/ical` shared package — `generateIcal(event)` with RRULE support (DAILY/WEEKLY/BIWEEKLY/MONTHLY/ANNUAL + BYDAY) | `packages/ical/index.ts`, `packages/ical/package.json`                    |

### Frontend

| Change                                                                                                                | File                                     |
| --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Shared `EventPopup` component — extracted from Community.tsx; includes RSVP toggle, edit form, "Download .ics" button | `apps/web/src/components/EventPopup.tsx` |
| Shared `EventTile` component — RSVP visual effects: GOING = bold ring, NOT_GOING = 25% opacity, default = neutral     | `apps/web/src/components/EventTile.tsx`  |
| Shared date helpers — `fmt()` and `toDatetimeLocal()`                                                                 | `apps/web/src/lib/date.ts`               |
| Personal calendar page — date-grouped event list, community names, EventPopup on click                                | `apps/web/src/pages/Calendar.tsx`        |
| `/calendar` route                                                                                                     | `apps/web/src/App.tsx`                   |
| Community calendar tab upgraded — uses shared EventTile + EventPopup instead of inline markup                         | `apps/web/src/pages/Community.tsx`       |

## API surface

### GraphQL

```graphql
# Query
myCalendar(fromDate: DateTime, toDate: DateTime): [Event!]!
```

Returns events from subscribed communities where `releaseStatus = PUBLIC` and `startsAt` falls within the optional date range. No pagination limit. Requires authentication.

### REST

```
GET /api/events/:id/ical
```

Returns `text/calendar` attachment. Rejects non-PUBLIC events with 404. No auth required — the URL is shareable.

## RSVP visual effects (EventTile)

| Status            | Effect                                                             |
| ----------------- | ------------------------------------------------------------------ |
| GOING             | `ring-2 ring-sage-deep/40`, light sage background tint, bold title |
| NOT_GOING         | `opacity-25` — nearly invisible                                    |
| INTERESTED / null | Default styling                                                    |

## Decisions

| Decision            | Choice                                | Rationale                                                            |
| ------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| iCal generation     | Shared `packages/ical/`               | Server needs it now; executioner will reuse for email-to-self later  |
| Calendar UI         | Date-sorted list (not grid/week view) | Matches minimalist philosophy; sufficient for MVP                    |
| `.ics` endpoint     | REST GET (not GraphQL)                | File downloads are REST-native                                       |
| Self-email          | Deferred                              | Download `.ics` achieves same outcome; email transport not wired yet |
| Recurring expansion | Not in scope                          | RRULE stored in `.ics`; no occurrence generation for MVP             |

## Skipped (deferred)

- **Email-to-self** — requires executioner email transport (SendGrid). Download `.ics` covers the use case.
- **Recurring event occurrence expansion** — events with `recurring` get an RRULE in the `.ics` but aren't expanded into individual occurrences in the calendar list.

## Verification

```bash
wsl bash scripts/test-slice-4.sh          # full stack
wsl bash scripts/test-slice-4.sh --no-up  # if stack already running
```

Browser checklist:

1. Navigate to `/calendar` while logged in with subscriptions → see subscribed events grouped by date
2. Click event tile → EventPopup opens with detail + RSVP buttons
3. RSVP as GOING → tile becomes bold/prominent; NOT_GOING → tile fades to 25% opacity
4. Click "Download .ics" → browser downloads valid `.ics` file
5. Navigate to `/communities/:id` → calendar tab shows events using shared EventTile
6. Community calendar works for unauthenticated users (view-only, no RSVP in popup)
7. Open downloaded `.ics` in Outlook/Google Calendar → event imports correctly
