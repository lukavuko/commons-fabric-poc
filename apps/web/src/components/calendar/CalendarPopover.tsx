import { useEffect, useRef } from "react";
import type { EventRow } from "@/components/EventPopup";
import type { TypeColor } from "@/lib/calendar";

export function CalendarPopover({
  date,
  events,
  colorMap,
  anchorRect,
  onEventClick,
  onClose,
}: {
  date: Date;
  events: EventRow[];
  colorMap: Map<string, TypeColor>;
  anchorRect: DOMRect;
  onEventClick: (event: EventRow) => void;
  onClose: () => void;
}) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    if (!popoverRef.current) return;
    const el = popoverRef.current;
    const viewH = window.innerHeight;
    const spaceBelow = viewH - anchorRect.bottom;

    if (spaceBelow < 200) {
      el.style.top = "";
      el.style.bottom = `${viewH - anchorRect.top + 8}px`;
    } else {
      el.style.top = `${anchorRect.bottom + 8}px`;
      el.style.bottom = "";
    }

    const viewW = window.innerWidth;
    if (viewW <= 480) {
      el.style.left = "16px";
      el.style.right = "16px";
      el.style.maxWidth = "none";
    } else {
      const left = anchorRect.left + anchorRect.width / 2 - 140;
      el.style.left = `${Math.max(8, Math.min(left, viewW - 288))}px`;
      el.style.right = "";
    }
  }, [anchorRect]);

  const dateLabel = date.toLocaleDateString("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <div
        className="fixed inset-0"
        style={{ zIndex: 999 }}
        onClick={onClose}
      />
      <div
        ref={popoverRef}
        className="fixed bg-surface rounded-cf-xl p-4 overflow-y-auto"
        style={{
          zIndex: 1000,
          maxWidth: 280,
          maxHeight: 320,
          boxShadow: "var(--cf-shadow-popup)",
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-display text-sm font-medium text-ink">
            {dateLabel}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-muted hover:text-ink text-sm cursor-pointer ml-2 leading-none"
          >
            ×
          </button>
        </div>

        <ul className="flex flex-col">
          {events.map((ev, i) => {
            const color = ev.eventType ? colorMap.get(ev.eventType) : undefined;
            const time = ev.startsAt
              ? new Date(ev.startsAt).toLocaleTimeString("en-CA", {
                  hour: "numeric",
                  minute: "2-digit",
                })
              : null;
            return (
              <li
                key={ev.id}
                className={`flex items-start gap-2 py-2 cursor-pointer hover:bg-surface-sunken/50 -mx-1 px-1 rounded-cf-xs ${
                  i < events.length - 1
                    ? "border-b border-[var(--cf-hairline)]"
                    : ""
                }`}
                onClick={() => onEventClick(ev)}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                  style={{ backgroundColor: color?.dot ?? "#65695a" }}
                />
                <div className="min-w-0">
                  <p className="text-sm text-ink font-medium truncate">
                    {ev.title}
                  </p>
                  <p className="text-xs text-ink-muted truncate">
                    {[time, ev.location].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
