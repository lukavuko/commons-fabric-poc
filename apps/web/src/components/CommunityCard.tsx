import { Link } from "react-router-dom";
import {
  Card,
  Tag,
  VerifiedBadge,
  StateBadge,
  LinkButton,
  Button,
} from "./primitives";

/**
 * Role-based display state for the viewer. "subscriber" is intentionally
 * absent — subscribing is not a role. Use the `isSubscribed` prop for the
 * subscription badge.
 */
export type CommunityViewerStatus = "none" | "member" | "steward";

export type CommunityCardData = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  city?: string;
  province?: string;
  verified: boolean;
  subscriberCount: number;
  eventsThisWeek?: number;
  accent?: "sage" | "clay" | "mixed";
};

type Props = {
  community: CommunityCardData;
  /** Role of the viewing user for display badges. Default: "none". */
  viewerStatus?: CommunityViewerStatus;
  /** Whether the viewer has an active subscription (independent of role). */
  isSubscribed?: boolean;
  /** Layout variant: gallery card (default) vs map popup (compact). */
  variant?: "gallery" | "popup";
  onSubscribe?: (id: string) => void;
  onJoin?: (id: string) => void;
};

const blobByAccent: Record<NonNullable<CommunityCardData["accent"]>, string> = {
  sage: "bg-[linear-gradient(135deg,#9CAE92,#B6C5A8)]",
  clay: "bg-[linear-gradient(135deg,#C49A82,#D8B499)]",
  mixed: "bg-[linear-gradient(135deg,#9CAE92,#C49A82)]",
};

const roleLabel: Record<CommunityViewerStatus, string | null> = {
  none: null,
  member: "Member",
  steward: "Steward",
};

export function CommunityCard({
  community,
  viewerStatus = "none",
  isSubscribed = false,
  variant = "gallery",
  onSubscribe,
  onJoin,
}: Props) {
  const isMember = viewerStatus !== "none";
  const blob = blobByAccent[community.accent ?? "sage"];
  const compact = variant === "popup";
  const detailHref = `/communities/${community.id}`;
  const label = roleLabel[viewerStatus];

  return (
    <Card className={compact ? "p-5" : ""}>
      <div
        aria-hidden
        className={`${blob} ${compact ? "h-20" : "h-28"} mb-4`}
        style={{ borderRadius: "60% 40% 65% 35% / 50% 60% 40% 50%" }}
      />

      <div className="flex items-center gap-2 mb-2 min-h-[20px]">
        {community.verified && <VerifiedBadge />}
        {label && <StateBadge label={label} tone="clay" />}
        {isSubscribed && !isMember && (
          <StateBadge label="Subscribed" tone="sage" />
        )}
      </div>

      <h3 className="font-display text-lg font-medium text-ink mb-1.5">
        {compact ? (
          community.name
        ) : (
          <Link
            to={detailHref}
            className="hover:text-sage-deep focus:outline-none rounded-cf-xs"
          >
            {community.name}
          </Link>
        )}
      </h3>

      {(community.city || community.province) && (
        <p className="text-xs text-ink-muted mb-2">
          {[community.city, community.province].filter(Boolean).join(", ")}
        </p>
      )}

      <p
        className={`text-sm text-ink-muted mb-4 ${compact ? "" : "line-clamp-3"}`}
      >
        {community.description}
      </p>

      {community.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {community.tags.slice(0, compact ? 3 : 5).map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      )}

      <div className="text-xs text-ink-muted mb-4 mt-auto">
        <span className="tabular-nums">{community.subscriberCount}</span>{" "}
        members
        {community.eventsThisWeek !== undefined && (
          <>
            {" "}
            · <span className="tabular-nums">
              {community.eventsThisWeek}
            </span>{" "}
            events this week
          </>
        )}
      </div>

      {!compact && (
        <div className="flex gap-2 justify-end">
          {!isMember ? (
            <Button
              variant="primary"
              onClick={onJoin ? () => onJoin(community.id) : undefined}
              aria-label={`Join ${community.name}`}
            >
              Join
            </Button>
          ) : (
            <LinkButton variant="primary" to={detailHref}>
              Open
            </LinkButton>
          )}
        </div>
      )}
    </Card>
  );
}
