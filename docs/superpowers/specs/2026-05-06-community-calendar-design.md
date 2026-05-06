# Community Calendar Tab — Design Spec

> Replaces the current event-list Calendar tab on the Community page with a month-grid calendar featuring event-type filtering, stacked event indicators, and date-cell popovers.

---

## 1. Scope

**In scope:** Month-grid calendar view, event-type filter bar, date-cell popover, month navigation, today indicator.

**Out of scope (future):** Collapsible right-side agenda pane, week view, drag-to-create events.

**Integration point:** Replaces the `activeTab === "calendar"` block in `apps/web/src/pages/Community.tsx` (lines 604–635). Reuses existing `EventPopup` component for event detail/edit. Data source is `community.events` already fetched by `COMMUNITY_QUERY`.

---

## 2. Data Model

No schema changes. The calendar consumes the existing `EventRow` type:

```ts
type EventRow = {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  location?: string;
  eventType?: string; // free-text, set by event creator
  releaseStatus: string; // DRAFT | PENDING | HIDDEN | PUBLIC | ARCHIVED
  tags: string[];
  rsvpCount: number;
  myRsvp?: RSVPStatus | null;
};
```

**Event type extraction:** Compile unique `eventType` values from the community's events array. Falsy values are excluded. This drives the filter bar.

**Visible events:** Only events with `releaseStatus === "PUBLIC"` (or `"DRAFT"` if the user has `event:edit` permission) are shown. This matches the current behavior.

---

## 3. Filter Bar

**Position:** Above the calendar grid, below the "Upcoming events" header and "+ New event" button row.

**Appearance:** Horizontal row of pill-shaped tags. One pill per unique `eventType` found in the event set.

**Token mapping per pill:**

- Active state: `bg-surface-sunken text-ink rounded-cf-pill px-3 py-1 text-xs font-medium`
- Inactive state: `bg-transparent text-ink-subtle rounded-cf-pill px-3 py-1 text-xs font-medium border border-[var(--cf-hairline)]` with reduced opacity
- Hover: `hover:bg-surface-sunken` transition

**Behavior:**

- All types are active by default.
- Click a pill to deactivate that type — its events disappear from the grid.
- Click again to reactivate.
- If all types are deactivated, show a subtle empty-state message below the grid: "No events match your filters."
- Filter state is local (useState), not persisted.

**Color coding:** Each event type gets a deterministic accent color from a fixed palette rotation:

1. Sage: `rgba(80,101,72,0.12)` (text: `--cf-sage-deep`)
2. Clay: `rgba(196,154,130,0.18)` (text: `--cf-clay-deep`)
3. Oat: `rgba(228,194,106,0.15)` (text: `#8a7230`)
4. Ink: `rgba(47,53,44,0.08)` (text: `--cf-ink-muted`)

Types are assigned colors in the order they first appear. The same type always gets the same color within a session.

---

## 4. Month Grid

### 4.1 Structure

7-column CSS grid. First row is day-of-week headers (Su Mo Tu We Th Fr Sa). Remaining rows are date cells for the displayed month.

**Outer container:** No border, no shadow. The grid floats on the page background like a notebook page.

**Day-of-week headers:** `text-xs font-semibold text-ink-muted uppercase tracking-widest` centered in each column.

**Grid lines:** Thin horizontal hairlines (`border-b border-[var(--cf-hairline)]`) between week rows only. No vertical lines. No outer border. Notebook ruled-paper feel.

### 4.2 Date Cells

**Cell size:** Flexible height, minimum `80px` tall. Width fills the 7-column grid equally.

**Date number:** Top-left of cell, `text-sm text-ink-muted`. Current month dates use `text-ink-muted`; overflow dates from adjacent months use `text-ink-subtle` and are non-interactive.

**Today indicator:** A thin `1px` border using `--cf-hairline-strong` (roughly `rgba(47,53,44,0.14)`) as a rounded rectangle around the entire cell. No background fill — just the outline. This is the only cell that gets a border.

**Hover (cells with events):** `bg-surface-sunken/50` subtle fill, `cursor-pointer`. Transition duration `60ms` for snappy feedback.

**Hover (empty cells):** No change, `cursor-default`.

### 4.3 Event Pancakes

Events within a cell appear as small horizontal bars stacked vertically, top to bottom.

**Bar appearance:**

- Height: `20px`
- Full cell width minus `4px` padding on each side
- Border-radius: `4px` (`rounded-cf-xs`)
- Background: The accent color assigned to the event's `eventType` (from section 3 palette)
- Text: Event title, truncated with ellipsis, `text-[11px] font-medium px-1.5 leading-[20px]` using the corresponding deep text color

**Stacking rules:**

- Up to 3 event bars visible per cell.
- If more than 3 events on a date, show 2 bars + a "+N more" overflow indicator styled as `text-[10px] text-ink-muted text-center`.

**Spacing:** `2px` gap between stacked bars.

### 4.4 Date-Cell Popover

**Trigger:** Click on any date cell that has events (after filtering).

**Architecture:** A single floating `<div>` positioned absolutely via `getBoundingClientRect()` of the clicked cell. A transparent fixed overlay behind the popover catches outside clicks for dismissal. This avoids inline popover elements inside the CSS grid which cause click-propagation issues.

**Appearance:** A small floating card anchored below (or above, if near bottom edge) the clicked cell.

- `bg-surface rounded-cf-xl shadow-cf-popup p-4`
- Max width: `280px`
- Max height: `320px` with `overflow-y: auto`
- `z-index: 1000` for the popover, `z-index: 999` for the overlay

**Header:** The full date string (e.g., "Wednesday, May 6, 2026") in `font-display text-sm font-medium text-ink`.

**Event list:** Vertical stack of clickable event rows, each containing:

- Left: colored dot (6px circle) matching the event type accent
- Title: `text-sm text-ink font-medium`
- Time + location: `text-xs text-ink-muted`
- Gap between rows: `8px`, separated by `border-b border-[var(--cf-hairline)]` except last

**Interaction:** Click an event row to open `EventPopup` (existing component). Click outside or press Escape to dismiss the popover.

**Empty dates:** Popover does not appear on dates with no events.

---

## 5. Month Navigation

**Position:** Centered below the calendar grid, with `mt-6` spacing.

**Layout:** Horizontal flex row: `[← arrow] [Today button] [→ arrow]`, centered, `gap-3`.

**Arrow buttons:**

- Shape: Rounded square, `w-9 h-9 rounded-cf-sm`
- Background: `bg-transparent`
- Border: `border border-clay-deep`
- Icon: Simple chevron (`<` / `>`) in `text-clay-deep`, `stroke-width: 2`
- Hover: `bg-clay-deep/10`
- The arrows are symmetrical in size and shape

**Today button:**

- Pill shape: `rounded-cf-pill px-4 py-1.5 text-xs font-medium`
- Default: `bg-surface-sunken text-ink`
- Hover: `bg-surface-sunken text-ink` with slight opacity shift
- Disabled (already viewing current month): `opacity-50 cursor-not-allowed`

**Month/year label:** Centered above the grid (not in the navigation bar). `font-sans text-[22px] font-medium text-ink tracking-tight` with `underline underline-offset-[6px] decoration-1` and a `border-b border-[var(--cf-hairline-strong)]` below the label row for visual weight. Uses Inter (not Fraunces) to match the UI tone.

---

## 6. Component Architecture

### New Components

| Component           | File                                                   | Purpose                                                                                                   |
| ------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `CommunityCalendar` | `apps/web/src/components/CommunityCalendar.tsx`        | Top-level calendar: filter bar + grid + navigation. Receives `events: EventRow[]` and `canEdit: boolean`. |
| `CalendarGrid`      | `apps/web/src/components/calendar/CalendarGrid.tsx`    | Pure month grid rendering. Receives processed month data and filtered events.                             |
| `CalendarCell`      | `apps/web/src/components/calendar/CalendarCell.tsx`    | Single date cell with pancake bars. Handles click to open popover.                                        |
| `CalendarPopover`   | `apps/web/src/components/calendar/CalendarPopover.tsx` | Date-click floating event list.                                                                           |
| `EventTypeFilter`   | `apps/web/src/components/calendar/EventTypeFilter.tsx` | Filter bar of toggleable type pills.                                                                      |

### Utility

| Function                                 | File                           | Purpose                                                                                               |
| ---------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `buildMonthGrid(year, month)`            | `apps/web/src/lib/calendar.ts` | Returns a 2D array of date objects for the 6-week grid (includes overflow days from adjacent months). |
| `assignTypeColors(eventTypes: string[])` | `apps/web/src/lib/calendar.ts` | Deterministic color assignment from the 4-color palette.                                              |

### Integration

In `Community.tsx`, the `activeTab === "calendar"` block changes from the current `EventTile` list to:

```tsx
<CommunityCalendar
  events={community.events}
  canEdit={can("event:edit")}
  onEventClick={(event) => setPopup(event)}
/>
```

The `"+ New event"` button stays in the header row above `CommunityCalendar`.

---

## 7. Interactions Summary

| Action                         | Result                                  |
| ------------------------------ | --------------------------------------- |
| Click filter pill              | Toggle event type visibility on/off     |
| Click date cell (has events)   | Open popover with that day's event list |
| Click event in popover         | Open EventPopup (existing)              |
| Click outside popover / Escape | Dismiss popover                         |
| Click ← arrow                  | Previous month                          |
| Click → arrow                  | Next month                              |
| Click "Today"                  | Jump to current month                   |
| Hover date cell (has events)   | Subtle background highlight             |

---

## 8. Responsive Behavior

**Breakpoints:**

| Breakpoint         | Behavior                                                                                                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `> 768px`          | Full grid, standard cell sizing, popover at 280px                                                                                                                           |
| `≤ 768px` (tablet) | Reduced cell padding, smaller font sizes (`text-[10px]` for pancake titles), popover width 260px, filter pills wrap to multiple rows                                        |
| `≤ 480px` (phone)  | Minimum cell height reduced to 60px, pancake bars show max 2 + overflow, date numbers at `text-xs`, popover full-width minus margins, navigation arrows shrink to `w-7 h-7` |

**Key adaptations:**

- Filter bar uses `flex-wrap` so pills flow to a second line on narrow screens.
- Popover on mobile is positioned center-screen rather than anchored to cell (avoids overflow).
- Month grid remains 7 columns at all sizes — cells compress but never collapse.

---

## 9. Permission Scoping

- **"+ New event" button:** Visible only when `can("event:create")` is true for the current user in this community.
- **Draft events:** Visible only when `can("event:edit")` is true. Draft pancakes get a subtle dashed border (`border-dashed border-[var(--cf-hairline)]`) to distinguish from published events.
- **Event editing via popover:** Clicking an event in the popover opens `EventPopup` with `canEdit` prop passed through from the parent.

---

## 10. Visual Mood

The calendar should feel like a page torn from a botanical notebook:

- No outer borders or card shadow on the grid itself — it sits directly on the page
- Hairline ruled lines between weeks only (like notebook ruling)
- Event bars are soft watercolor-like tints, not solid blocks
- Typography uses Inter throughout (including the month label) for a clean UI tone
- Generous whitespace inside cells
- The overall density is low — this is a community calendar, not a corporate scheduler
