import { Link } from "react-router-dom";
import { Card, Tag, VerifiedBadge, StateBadge, LinkButton, Button } from "./primitives";

export type CommunityViewerStatus =
  | "none"
  | "subscriber"
  | "member"
  | "volunteer"
  | "moderator"
  | "co-steward"
  | "steward";

export type CommunityCardData = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  city?: string;
  province?: string;
  verified: boolean; // verifiedEmail || verifiedExternally
  subscriberCount: number;
  eventsThisWeek?: number;
  /** Optional decorative blob color seed; falls back to sage. */
  accent?: "sage" | "clay" | "mixed";
};

type Props = {
  community: CommunityCardData;
  viewerStatus?: CommunityViewerStatus;
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

export function CommunityCard({
  community,
  viewerStatus = "none",
  variant = "gallery",
  onSubscribe,
  onJoin,
}: Props) {
  const isMember = viewerStatus !== "none" && viewerStatus !== "subscriber";
  const isSubscriber = viewerStatus === "subscriber";
  const blob = blobByAccent[community.accent ?? "sage"];
  const compact = variant === "popup";
  const detailHref = `/communities/${community.id}`;

  return (
    <Card className={compact ? "p-5" : ""}>
      {/* Decorative botanical blob — purely decorative, hidden from a11y tree */}
      <div
        aria-hidden
        className={`${blob} ${compact ? "h-20" : "h-28"} mb-4`}
        style={{ borderRadius: "60% 40% 65% 35% / 50% 60% 40% 50%" }}
      />

      {/* Verified / joined badges row */}
      <div className="flex items-center gap-2 mb-2 min-h-[20px]">
        {community.verified && <VerifiedBadge />}
        {isMember && <StateBadge label={`You're a ${viewerStatus}`} tone="clay" />}
        {isSubscriber && <StateBadge label="Subscribed" tone="sage" />}
      </div>

      <h3 className="font-display text-lg font-medium text-ink mb-1.5">
        <Link
          to={detailHref}
          className="hover:text-sage-deep focus:outline-none rounded-cf-xs"
        >
          {community.name}
        </Link>
      </h3>

      {(community.city || community.province) && (
        <p className="text-xs text-ink-muted mb-2">
          {[community.city, community.province].filter(Boolean).join(", ")}
        </p>
      )}

      <p
        className={`text-sm text-ink-muted mb-4 ${compact ? "line-clamp-2" : "line-clamp-3"}`}
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
            · <span className="tabular-nums">{community.eventsThisWeek}</span>{" "}
            events this week
          </>
        )}
      </div>

      {/* Z-trace contract: CTAs bottom-right of card. We use full-width on
          narrow widths and bottom-right alignment within the card flow. */}
      <div className="flex gap-2 justify-end">
        {!isMember && (
          <Button
            variant="secondary"
            onClick={onSubscribe ? () => onSubscribe(community.id) : undefined}
            aria-label={`${isSubscriber ? "Unsubscribe from" : "Subscribe to"} ${community.name}`}
          >
            {isSubscriber ? "Unsubscribe" : "Subscribe"}
          </Button>
        )}
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
    </Card>
  );
}
