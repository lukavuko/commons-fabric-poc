import type { DayCell, TypeColor } from "@/lib/calendar";
import type { EventRow } from "@/components/EventPopup";
import { CalendarCell } from "./CalendarCell";
import { dateKey } from "@/lib/calendar";

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarGrid({
  weeks,
  events,
  colorMap,
  onCellClick,
}: {
  weeks: DayCell[][];
  events: EventRow[];
  colorMap: Map<string, TypeColor>;
  onCellClick: (cell: DayCell, rect: DOMRect) => void;
}) {
  const eventsByDate = new Map<string, EventRow[]>();
  for (const ev of events) {
    if (!ev.startsAt) continue;
    const key = dateKey(ev.startsAt);
    const arr = eventsByDate.get(key) ?? [];
    arr.push(ev);
    eventsByDate.set(key, arr);
  }

  return (
    <div>
      <div className="grid grid-cols-7">
        {DAY_HEADERS.map((d) => (
          <div
            key={d}
            className="text-xs font-normal text-ink-muted uppercase tracking-widest text-center py-2 pl-2"
          >
            {d}
          </div>
        ))}
      </div>

      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7">
          {week.map((cell) => (
            <CalendarCell
              key={cell.key}
              cell={cell}
              events={eventsByDate.get(cell.key) ?? []}
              colorMap={colorMap}
              onClick={onCellClick}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
