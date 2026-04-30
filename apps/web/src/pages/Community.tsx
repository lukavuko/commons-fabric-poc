import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { gqlFetch } from "@/lib/graphql";
import NotFound from "./NotFound";

const COMMUNITY_QUERY = `
  query Community($id: ID!) {
    community(id: $id) {
      id
      name
      city
      province
      description
      website
      tags
      contactEmail
      verifiedEmail
      verifiedExternally
      subscriberCount
      events(upcoming: true) {
        id
        title
        subtitle
        startsAt
        endsAt
        location
        eventType
        rsvpCount
      }
      announcements {
        id
        title
        subtitle
        releasedAt
        likes
      }
    }
  }
`;

type EventRow = {
  id: string;
  title: string;
  subtitle?: string;
  startsAt?: string;
  endsAt?: string;
  location?: string;
  eventType?: string;
  rsvpCount: number;
};

type AnnouncementRow = {
  id: string;
  title: string;
  subtitle?: string;
  releasedAt?: string;
  likes?: number;
};

type CommunityRow = {
  id: string;
  name: string;
  city: string;
  province: string;
  description: string;
  website?: string;
  tags: string[];
  contactEmail: string;
  verifiedEmail: boolean;
  verifiedExternally: boolean;
  subscriberCount: number;
  events: EventRow[];
  announcements: AnnouncementRow[];
};

function formatDate(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Community() {
  const { id } = useParams<{ id: string }>();
  const [community, setCommunity] = useState<CommunityRow | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "missing">("loading");

  useEffect(() => {
    if (!id) {
      setStatus("missing");
      return;
    }
    let cancelled = false;
    gqlFetch<{ community: CommunityRow | null }>(COMMUNITY_QUERY, { id })
      .then((d) => {
        if (cancelled) return;
        if (d.community) {
          setCommunity(d.community);
          setStatus("ok");
        } else {
          setStatus("missing");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("missing");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (status === "loading") {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10 text-sm text-ink-muted">
        Loading…
      </main>
    );
  }

  if (status === "missing" || !community) return <NotFound />;

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <Link to="/" className="text-sm text-zinc-500 hover:text-zinc-800 mb-6 inline-block">
        ← All communities
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">{community.name}</h1>
        <p className="text-zinc-500 mt-1">
          {community.city}, {community.province}
        </p>
        <p className="mt-3 text-zinc-700">{community.description}</p>
        <div className="mt-3 flex flex-wrap gap-2 items-center">
          {community.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
          <span className="text-sm text-zinc-400">
            {community.subscriberCount} subscribers
          </span>
          {community.website && (
            <a
              href={community.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              Website
            </a>
          )}
        </div>
      </div>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
        {community.events.length === 0 ? (
          <p className="text-zinc-400 text-sm">No upcoming events.</p>
        ) : (
          <div className="grid gap-3">
            {community.events.map((event) => (
              <div key={event.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{event.title}</h3>
                    {event.subtitle && (
                      <p className="text-sm text-zinc-500">{event.subtitle}</p>
                    )}
                  </div>
                  <span className="text-xs text-zinc-400">
                    {event.rsvpCount} going
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-zinc-500">
                  {event.startsAt && <span>{formatDate(event.startsAt)}</span>}
                  {event.location && <span>{event.location}</span>}
                  {event.eventType && (
                    <span className="capitalize">
                      {event.eventType.toLowerCase()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Announcements</h2>
        {community.announcements.length === 0 ? (
          <p className="text-zinc-400 text-sm">No announcements yet.</p>
        ) : (
          <div className="grid gap-3">
            {community.announcements.map((ann) => (
              <div key={ann.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{ann.title}</h3>
                    {ann.subtitle && (
                      <p className="text-sm text-zinc-500">{ann.subtitle}</p>
                    )}
                  </div>
                  {ann.likes != null && (
                    <span className="text-xs text-zinc-400">
                      {ann.likes} likes
                    </span>
                  )}
                </div>
                {ann.releasedAt && (
                  <p className="mt-1 text-xs text-zinc-400">
                    {formatDate(ann.releasedAt)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
