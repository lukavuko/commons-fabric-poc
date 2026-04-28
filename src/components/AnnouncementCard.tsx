import { Link } from "react-router-dom";
import { Card, Tag, Button } from "./primitives";

export type AnnouncementCardData = {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  tags: string[];
  releasedAt?: string | Date | null;
  isPinned?: boolean;
  community: {
    id: string;
    name: string;
  };
  authorName?: string | null;
};

type Props = {
  announcement: AnnouncementCardData;
  /** "feed" shows full preview; "popup" is the modal expansion. */
  variant?: "feed" | "popup";
  onOpen?: (id: string) => void;
  onSaveToEmail?: (id: string) => void;
};

function relativeTime(d: Date): string {
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} d ago`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function AnnouncementCard({
  announcement,
  variant = "feed",
  onOpen,
  onSaveToEmail,
}: Props) {
  const released = announcement.releasedAt
    ? announcement.releasedAt instanceof Date
      ? announcement.releasedAt
      : new Date(announcement.releasedAt)
    : null;
  const compact = variant !== "feed";

  return (
    <Card className={compact ? "p-5" : ""}>
      {announcement.isPinned && (
        <div className="flex items-center gap-1.5 text-xs text-clay-deep font-medium mb-2">
          <svg
            aria-hidden
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m12 17 1 5h-2l1-5Z" />
            <path d="M9 11h6l-1-7H10l-1 7Z" />
            <path d="M7 11h10v3H7Z" />
          </svg>
          Pinned
        </div>
      )}

      <div className="flex items-baseline gap-2 mb-2 flex-wrap">
        <Link
          to={`/communities/${announcement.community.id}`}
          className="text-xs text-sage-deep hover:text-[#3E4D38]"
        >
          {announcement.community.name}
        </Link>
        {released && (
          <span className="text-xs text-ink-muted tabular-nums">
            · {relativeTime(released)}
          </span>
        )}
      </div>

      <h3 className="font-display text-lg font-medium text-ink mb-1.5">
        {announcement.title}
      </h3>
      {announcement.subtitle && (
        <p className="text-sm text-ink-muted mb-3 italic">
          {announcement.subtitle}
        </p>
      )}

      {announcement.description && (
        <p
          className={`text-sm text-ink mb-4 ${compact ? "line-clamp-2" : "line-clamp-4"}`}
        >
          {announcement.description}
        </p>
      )}

      {announcement.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {announcement.tags.slice(0, compact ? 3 : 5).map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      )}

      {announcement.authorName && (
        <p className="text-xs text-ink-muted mb-4 mt-auto">
          — {announcement.authorName}
        </p>
      )}

      <div className="flex gap-2 justify-end">
        <Button
          variant="secondary"
          onClick={onSaveToEmail ? () => onSaveToEmail(announcement.id) : undefined}
          aria-label={`Email myself "${announcement.title}"`}
        >
          Email to me
        </Button>
        <Button
          variant="primary"
          onClick={onOpen ? () => onOpen(announcement.id) : undefined}
        >
          Read
        </Button>
      </div>
    </Card>
  );
}
