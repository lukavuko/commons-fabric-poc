import { fmt } from "@/lib/date";
import { StateBadge, Tag } from "@/components/primitives";
import type { RSVPStatus } from "@/lib/types";

export type EventTileEvent = {
  id: string;
  title: string;
  subtitle?: string;
  startsAt?: string;
  endsAt?: string;
  location?: string;
  eventType?: string;
  releaseStatus: string;
  tags: string[];
  rsvpCount: number;
  myRsvp?: RSVPStatus | null;
};

export function EventTile({
  event,
  onClick,
  showCommunityName,
  communityName,
}: {
  event: EventTileEvent;
  onClick: () => void;
  showCommunityName?: boolean;
  communityName?: string;
}) {
  const rsvpClass =
    event.myRsvp === "GOING"
      ? "ring-2 ring-sage-deep/40 bg-[rgba(80,101,72,0.04)]"
      : event.myRsvp === "NOT_GOING"
        ? "opacity-25"
        : "";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left bg-surface rounded-cf-xl shadow-cf-card hover:shadow-cf-card-hover transition-shadow p-5 flex flex-col gap-2 ${rsvpClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={`text-ink ${event.myRsvp === "GOING" ? "font-semibold" : "font-medium"}`}
          >
            {event.title}
          </p>
          {event.subtitle && (
            <p className="text-sm text-ink-muted">{event.subtitle}</p>
          )}
          {showCommunityName && communityName && (
            <p className="text-xs text-ink-muted mt-0.5">{communityName}</p>
          )}
        </div>
        <div className="flex gap-1.5 shrink-0">
          {event.releaseStatus === "DRAFT" && (
            <StateBadge label="Draft" tone="clay" />
          )}
          {event.rsvpCount > 0 && (
            <Tag tone="sage">{event.rsvpCount} going</Tag>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-ink-muted">
        {event.startsAt && <span>{fmt(event.startsAt)}</span>}
        {event.location && <span>{event.location}</span>}
        {event.eventType && (
          <span className="capitalize">{event.eventType.toLowerCase()}</span>
        )}
      </div>
    </button>
  );
}
