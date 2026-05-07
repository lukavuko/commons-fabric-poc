import type { EventRow } from "@/components/EventPopup";
import { assignTypeColors, buildMonthGrid, type DayCell } from "@/lib/calendar";
import { useMemo, useState } from "react";
import { CalendarGrid } from "./calendar/CalendarGrid";
import { CalendarPopover } from "./calendar/CalendarPopover";
import { EventTypeFilter } from "./calendar/EventTypeFilter";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function CommunityCalendar({
  events,
  canEdit,
  onEventClick,
}: {
  events: EventRow[];
  canEdit: boolean;
  onEventClick: (event: EventRow) => void;
}) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const [popoverCell, setPopoverCell] = useState<{
    cell: DayCell;
    rect: DOMRect;
  } | null>(null);

  const visibleEvents = useMemo(
    () =>
      events.filter(
        (e) =>
          e.releaseStatus === "PUBLIC" ||
          (e.releaseStatus === "DRAFT" && canEdit),
      ),
    [events, canEdit],
  );

  const eventTypes = useMemo(() => {
    const seen: string[] = [];
    for (const e of visibleEvents) {
      if (e.eventType && !seen.includes(e.eventType)) seen.push(e.eventType);
    }
    return seen;
  }, [visibleEvents]);

  const colorMap = useMemo(() => assignTypeColors(eventTypes), [eventTypes]);

  const [activeTypes, setActiveTypes] = useState<Set<string>>(
    () => new Set(eventTypes),
  );

  const filteredEvents = useMemo(
    () =>
      visibleEvents.filter((e) => !e.eventType || activeTypes.has(e.eventType)),
    [visibleEvents, activeTypes],
  );

  const weeks = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  const prevMonth = () => {
    setPopoverCell(null);
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
    setPopoverCell(null);
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else {
      setMonth(month + 1);
    }
  };

  const goToday = () => {
    setPopoverCell(null);
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  };

  const toggleType = (type: string) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
    setPopoverCell(null);
  };

  const handleCellClick = (cell: DayCell, rect: DOMRect) => {
    setPopoverCell({ cell, rect });
  };

  const popoverEvents = popoverCell
    ? filteredEvents.filter((e) => {
        if (!e.startsAt) return false;
        const d = new Date(e.startsAt);
        const cd = popoverCell.cell.date;
        return (
          d.getFullYear() === cd.getFullYear() &&
          d.getMonth() === cd.getMonth() &&
          d.getDate() === cd.getDate()
        );
      })
    : [];

  return (
    <div>
      <EventTypeFilter
        types={eventTypes}
        colorMap={colorMap}
        activeTypes={activeTypes}
        onToggle={toggleType}
      />

      {activeTypes.size === 0 && eventTypes.length > 0 && (
        <p className="text-sm text-ink-muted mt-4">
          No events match your filters.
        </p>
      )}

      {/* Month/year label */}
      <div className="mt-4 mb-8 text-center">
        <span
          className="inline-block text-[22px] font-medium text-ink tracking-tight pb-1 px-4 border-b-2 border-ink/25"
          style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}
        >
          {MONTH_NAMES[month]} {year}
        </span>
      </div>

      <CalendarGrid
        weeks={weeks}
        events={filteredEvents}
        colorMap={colorMap}
        onCellClick={handleCellClick}
      />

      {/* Month navigation */}
      <div className="flex items-center justify-center gap-3 mt-6">
        <button
          type="button"
          onClick={prevMonth}
          className="w-9 h-9 max-sm:w-7 max-sm:h-7 rounded-cf-sm border border-clay-deep flex items-center justify-center text-clay-deep hover:bg-clay-deep/10 transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 2L4 7L9 12" />
          </svg>
        </button>

        <button
          type="button"
          onClick={goToday}
          disabled={isCurrentMonth}
          className={`rounded-cf-pill px-4 py-1.5 text-xs font-medium transition-colors ${
            isCurrentMonth
              ? "bg-surface-sunken text-ink opacity-50 cursor-not-allowed"
              : "bg-surface-sunken text-ink hover:opacity-80 cursor-pointer"
          }`}
        >
          Today
        </button>

        <button
          type="button"
          onClick={nextMonth}
          className="w-9 h-9 max-sm:w-7 max-sm:h-7 rounded-cf-sm border border-clay-deep flex items-center justify-center text-clay-deep hover:bg-clay-deep/10 transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 2L10 7L5 12" />
          </svg>
        </button>
      </div>

      {/* Popover */}
      {popoverCell && popoverEvents.length > 0 && (
        <CalendarPopover
          date={popoverCell.cell.date}
          events={popoverEvents}
          colorMap={colorMap}
          anchorRect={popoverCell.rect}
          onEventClick={(ev) => {
            setPopoverCell(null);
            onEventClick(ev);
          }}
          onClose={() => setPopoverCell(null)}
        />
      )}
    </div>
  );
}
