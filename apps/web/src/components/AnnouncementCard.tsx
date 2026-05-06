import { Link } from "react-router-dom";
import { Tag, StateBadge } from "@/components/primitives";
import type { ReleaseStatus } from "@/lib/types";

export type AnnouncementCardData = {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  tags: string[];
  releaseStatus: ReleaseStatus;
  releasedAt?: string | null;
  updatedAt?: string | null;
  likes?: number | null;
  views?: number | null;
  authorName?: string | null;
  community: {
    id: string;
    name: string;
  };
};

const statusConfig: Record<
  ReleaseStatus,
  { label: string; tone: "clay" | "sage" } | null
> = {
  DRAFT: { label: "Draft", tone: "clay" },
  PENDING: { label: "Scheduled", tone: "sage" },
  HIDDEN: { label: "Hidden", tone: "clay" },
  PUBLIC: null,
  ARCHIVED: { label: "Archived", tone: "clay" },
};

function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

function compactNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

export function AnnouncementCard({
  announcement,
}: {
  announcement: AnnouncementCardData;
}) {
  const badge = statusConfig[announcement.releaseStatus];
  const isArchived = announcement.releaseStatus === "ARCHIVED";

  return (
    <div
      className={`group bg-surface rounded-cf-lg shadow-cf-card hover:shadow-cf-card-hover
        transition-shadow duration-200 ${isArchived ? "opacity-60" : ""}`}
    >
      {/* Collapsed row — always visible */}
      <div className="flex items-center gap-3 px-5 py-3.5 min-h-[56px]">
        {/* Status badge */}
        {badge && (
          <div className="shrink-0">
            <StateBadge label={badge.label} tone={badge.tone} />
          </div>
        )}

        {/* Title + subtitle */}
        <div className="flex-1 min-w-0 flex items-baseline gap-2">
          <h3 className="font-display text-base font-medium text-ink truncate">
            {announcement.title}
          </h3>
          {announcement.subtitle && (
            <span className="text-sm text-ink-muted truncate hidden sm:inline">
              {announcement.subtitle}
            </span>
          )}
        </div>

        {/* Meta: likes, views, time */}
        <div className="shrink-0 flex items-center gap-3 text-xs text-ink-muted tabular-nums">
          {announcement.likes != null && announcement.likes > 0 && (
            <span className="flex items-center gap-1">
              <svg
                aria-hidden
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
              {compactNumber(announcement.likes)}
            </span>
          )}
          {announcement.views != null && announcement.views > 0 && (
            <span className="flex items-center gap-1">
              <svg
                aria-hidden
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {compactNumber(announcement.views)}
            </span>
          )}
          {announcement.releasedAt && (
            <span>{relativeTime(announcement.releasedAt)}</span>
          )}
          {!announcement.releasedAt && announcement.updatedAt && (
            <span>edited {relativeTime(announcement.updatedAt)}</span>
          )}
        </div>
      </div>

      {/* Expandable section — slides open on hover via grid row trick */}
      <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-out">
        <div className="overflow-hidden">
          <div className="px-5 pb-4 pt-0">
            <div className="border-t border-[color:var(--cf-hairline)] pt-3">
              {/* Community link */}
              <Link
                to={`/communities/${announcement.community.id}`}
                className="text-xs text-sage-deep hover:text-[#3E4D38] mb-2 inline-block"
              >
                {announcement.community.name}
              </Link>

              {/* Subtitle (visible on mobile where it's hidden in collapsed row) */}
              {announcement.subtitle && (
                <p className="text-sm text-ink-muted italic mb-2 sm:hidden">
                  {announcement.subtitle}
                </p>
              )}

              {/* Description */}
              {announcement.description && (
                <p className="text-sm text-ink mb-3 leading-relaxed">
                  {announcement.description}
                </p>
              )}

              {/* Tags + author row */}
              <div className="flex items-end justify-between gap-4 flex-wrap">
                {announcement.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {announcement.tags.map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </div>
                )}

                {announcement.authorName && (
                  <p className="text-xs text-ink-muted ml-auto whitespace-nowrap">
                    — {announcement.authorName}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
