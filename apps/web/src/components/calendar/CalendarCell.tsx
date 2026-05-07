import type { EventRow } from "@/components/EventPopup";
import type { DayCell, TypeColor } from "@/lib/calendar";

export function CalendarCell({
  cell,
  events,
  colorMap,
  onClick,
}: {
  cell: DayCell;
  events: EventRow[];
  colorMap: Map<string, TypeColor>;
  onClick: (cell: DayCell, rect: DOMRect) => void;
}) {
  const hasEvents = events.length > 0;
  const maxVisible = window.innerWidth <= 480 ? 2 : 3;
  const overflow =
    events.length > maxVisible ? events.length - (maxVisible - 1) : 0;
  const visible = overflow > 0 ? events.slice(0, maxVisible - 1) : events;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hasEvents || !cell.isCurrentMonth) return;
    const rect = e.currentTarget.getBoundingClientRect();
    onClick(cell, rect);
  };

  return (
    <div
      className={`min-h-[80px] max-md:min-h-[60px] p-2 transition-colors duration-[60ms] ${
        cell.isToday
          ? "border border-[var(--cf-hairline-strong)] rounded-cf-md"
          : ""
      } ${
        hasEvents && cell.isCurrentMonth
          ? "cursor-pointer hover:bg-surface-sunken/50"
          : "cursor-default"
      }`}
      onClick={handleClick}
    >
      <span
        className={`text-xs max-md:text-xs block mb-1 ${
          cell.isCurrentMonth ? "font-[450]" : "font-thin"
        }`}
        style={
          cell.isCurrentMonth
            ? { color: "rgba(0,0,0,0.82)" }
            : { color: "rgba(0,0,0,0.22)" }
        }
      >
        {cell.day}
      </span>

      {cell.isCurrentMonth && (
        <div className="flex flex-col gap-[2px]">
          {visible.map((ev) => {
            const color = ev.eventType ? colorMap.get(ev.eventType) : undefined;
            const isDraft = ev.releaseStatus === "DRAFT";
            return (
              <div
                key={ev.id}
                className={`h-5 rounded-cf-xs px-1.5 leading-[20px] text-[11px] max-md:text-[10px] font-medium truncate ${
                  isDraft
                    ? "border border-dashed border-[var(--cf-hairline)]"
                    : ""
                }`}
                style={{
                  backgroundColor: color?.bg ?? "rgba(47,53,44,0.08)",
                  color: color?.text ?? "var(--cf-ink-muted)",
                }}
              >
                {ev.title}
              </div>
            );
          })}
          {overflow > 0 && (
            <div className="text-[10px] text-ink-muted text-center">
              +{overflow} more
            </div>
          )}
        </div>
      )}
    </div>
  );
}
