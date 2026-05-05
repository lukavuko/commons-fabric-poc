import { Link } from "react-router-dom";
import { Card, Tag, StateBadge, Button } from "./primitives";

export type RSVPStatus = "GOING" | "INTERESTED" | "NOT_GOING" | null;

export type EventCardData = {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  tags: string[];
  location?: string | null;
  startsAt?: string | Date | null;
  endsAt?: string | Date | null;
  recurring?: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "ANNUAL" | null;
  community: {
    id: string;
    name: string;
  };
};

type Props = {
  event: EventCardData;
  rsvpStatus?: RSVPStatus;
  /** "feed" — full card with description; "calendar" — compact, date-led; "popup" — modal preview */
  variant?: "feed" | "calendar" | "popup";
  /** Whether the viewer can RSVP (member of the community). */
  canRSVP?: boolean;
  onRSVP?: (id: string, status: "GOING" | "INTERESTED") => void;
  onAddToCalendar?: (id: string) => void;
};

function toDate(v: string | Date | null | undefined): Date | null {
  if (!v) return null;
  return v instanceof Date ? v : new Date(v);
}

function formatDateBlock(d: Date) {
  return {
    day: d.toLocaleDateString(undefined, { day: "numeric" }),
    month: d.toLocaleDateString(undefined, { month: "short" }).toUpperCase(),
    weekday: d.toLocaleDateString(undefined, { weekday: "short" }),
    time: d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

export function EventCard({
  event,
  rsvpStatus = null,
  variant = "feed",
  canRSVP = false,
  onRSVP,
  onAddToCalendar,
}: Props) {
  const start = toDate(event.startsAt);
  const end = toDate(event.endsAt);
  const block = start ? formatDateBlock(start) : null;
  const compact = variant !== "feed";
  const isGoing = rsvpStatus === "GOING";
  const isInterested = rsvpStatus === "INTERESTED";

  return (
    <Card className={compact ? "p-5" : ""}>
      <div className="flex gap-4 items-start mb-3">
        {/* Date block — anchors the eye on the left, like a postcard postmark */}
        {block && (
          <div
            className="bg-[rgba(80,101,72,0.10)] rounded-cf-md px-3 py-2 text-center min-w-[64px] tabular-nums"
            aria-label={start!.toLocaleDateString(undefined, {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          >
            <div className="text-[10px] tracking-wide text-sage-deep font-medium">
              {block.month}
            </div>
            <div className="font-display text-2xl text-ink leading-tight">
              {block.day}
            </div>
            <div className="text-[10px] text-ink-muted">{block.weekday}</div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Link
              to={`/communities/${event.community.id}`}
              className="text-xs text-sage-deep hover:text-[#3E4D38] truncate"
            >
              {event.community.name}
            </Link>
            {event.recurring && (
              <span className="text-[10px] uppercase tracking-wide text-ink-muted">
                · {event.recurring.toLowerCase()}
              </span>
            )}
            {isGoing && <StateBadge label="Going" tone="clay" />}
            {isInterested && <StateBadge label="Interested" tone="sage" />}
          </div>

          <h3 className="font-display text-lg font-medium text-ink mb-1">
            {event.title}
          </h3>
          {event.subtitle && (
            <p className="text-sm text-ink-muted mb-2">{event.subtitle}</p>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted tabular-nums mb-2">
            {block && (
              <span>
                {block.time}
                {end && start && end.getTime() !== start.getTime() && (
                  <> – {formatDateBlock(end).time}</>
                )}
              </span>
            )}
            {event.location && <span>· {event.location}</span>}
          </div>
        </div>
      </div>

      {!compact && event.description && (
        <p className="text-sm text-ink-muted mb-4 line-clamp-3">
          {event.description}
        </p>
      )}

      {event.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {event.tags.slice(0, compact ? 3 : 5).map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      )}

      <div className="flex gap-2 justify-end mt-auto">
        <Button
          variant="secondary"
          onClick={
            onAddToCalendar ? () => onAddToCalendar(event.id) : undefined
          }
          aria-label={`Add ${event.title} to calendar`}
        >
          Add to calendar
        </Button>
        {canRSVP && (
          <Button
            variant="primary"
            onClick={
              onRSVP
                ? () => onRSVP(event.id, isGoing ? "INTERESTED" : "GOING")
                : undefined
            }
            aria-pressed={isGoing}
          >
            {isGoing ? "Going ✓" : "RSVP"}
          </Button>
        )}
      </div>
    </Card>
  );
}
