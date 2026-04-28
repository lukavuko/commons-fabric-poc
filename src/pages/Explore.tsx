import { useEffect, useState } from "react";
import { SiteNav } from "@/components/SiteNav";
import { CommunityCard, type CommunityCardData } from "@/components/CommunityCard";
import { gqlFetch } from "@/lib/graphql";

const COMMUNITIES_QUERY = `
  query {
    communities(pagination: { limit: 50 }) {
      id
      name
      city
      province
      description
      tags
      verifiedEmail
      verifiedExternally
      subscriberCount
    }
  }
`;

type RawCommunity = {
  id: string;
  name: string;
  city: string;
  province: string;
  description: string;
  tags: string[];
  verifiedEmail: boolean;
  verifiedExternally: boolean;
  subscriberCount: number;
};

// Seeded sample data so the Explore page renders cleanly while the backend is
// still being wired up. Drops to live data the moment the resolver returns.
const SAMPLE: CommunityCardData[] = [
  {
    id: "sample-1",
    name: "Riverdale Food Bank",
    description:
      "A neighborhood food bank serving Riverdale and Leslieville. Volunteers welcome every Saturday — help sort donations, pack hampers, or run our weekend pickup.",
    tags: ["food security", "volunteer", "weekly"],
    city: "Toronto",
    province: "ON",
    verified: true,
    subscriberCount: 142,
    eventsThisWeek: 3,
    accent: "sage",
  },
  {
    id: "sample-2",
    name: "East End Running Club",
    description:
      "Casual 5km runs every Wednesday evening from Withrow Park. All paces welcome — we wait at the corners.",
    tags: ["fitness", "social", "beginner-friendly"],
    city: "Toronto",
    province: "ON",
    verified: false,
    subscriberCount: 87,
    eventsThisWeek: 1,
    accent: "clay",
  },
  {
    id: "sample-3",
    name: "Leslieville Library Friends",
    description:
      "Volunteer-led group supporting the Leslieville branch — book sales, programming, advocacy, and the occasional fundraiser.",
    tags: ["books", "civic", "monthly"],
    city: "Toronto",
    province: "ON",
    verified: true,
    subscriberCount: 56,
    eventsThisWeek: 0,
    accent: "mixed",
  },
  {
    id: "sample-4",
    name: "Toronto Tool Library — East",
    description:
      "Borrow tools instead of buying. Workshops, repair cafes, and community builds for anyone who wants to fix the thing they have.",
    tags: ["sharing", "sustainability", "all-ages"],
    city: "Toronto",
    province: "ON",
    verified: false,
    subscriberCount: 234,
    eventsThisWeek: 2,
    accent: "sage",
  },
  {
    id: "sample-5",
    name: "Withrow Park Stewards",
    description:
      "Volunteer caretakers for Withrow Park. Spring cleanups, summer gardening, fall leaf-pickup. Join for one event or every event.",
    tags: ["nature", "volunteer", "seasonal"],
    city: "Toronto",
    province: "ON",
    verified: true,
    subscriberCount: 64,
    eventsThisWeek: 1,
    accent: "sage",
  },
  {
    id: "sample-6",
    name: "Beach Gardeners",
    description:
      "Community garden plots and a shared greenhouse on Queen East. Open invitation to anyone who wants to grow something.",
    tags: ["gardening", "neighbourhood", "outdoor"],
    city: "Toronto",
    province: "ON",
    verified: false,
    subscriberCount: 41,
    eventsThisWeek: 0,
    accent: "mixed",
  },
];

function toCardData(c: RawCommunity): CommunityCardData {
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    tags: c.tags,
    city: c.city,
    province: c.province,
    verified: c.verifiedEmail || c.verifiedExternally,
    subscriberCount: c.subscriberCount,
    accent: "sage",
  };
}

export default function Explore() {
  const [communities, setCommunities] = useState<CommunityCardData[]>(SAMPLE);
  const [usingSample, setUsingSample] = useState(true);

  useEffect(() => {
    let cancelled = false;
    gqlFetch<{ communities: RawCommunity[] }>(COMMUNITIES_QUERY)
      .then((d) => {
        if (cancelled) return;
        const live = d.communities.map(toCardData);
        if (live.length > 0) {
          setCommunities(live);
          setUsingSample(false);
        }
      })
      .catch(() => {
        /* keep sample data on failure */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-[1200px] w-full mx-auto px-8 flex-1 flex flex-col">
      <SiteNav />

      <main className="flex-1">
        {/* Z-trace: title top-left → toolbar (search + filters) top-right of toolbar
            → gallery body → CTAs bottom-right of every card. */}
        <header className="mb-8">
          <h1 className="font-display text-5xl font-medium text-ink mb-2 tracking-tight">
            Explore communities
          </h1>
          <p className="text-ink-muted text-lg">
            Discover groups gathering near you.
          </p>
          {usingSample && (
            <p className="text-xs text-clay-deep mt-3">
              Showing sample data — connect the backend to load live communities.
            </p>
          )}
        </header>

        {/* Toolbar: search left, filters right */}
        <div className="flex flex-wrap items-center gap-4 mb-10">
          <label className="flex-1 min-w-[280px] bg-surface rounded-cf-lg px-5 py-3 flex items-center gap-2.5 shadow-cf-card focus-within:shadow-cf-card-hover">
            <svg
              aria-hidden
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-sage-deep"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search"
              placeholder="Search communities, tags, or places…"
              className="bg-transparent border-0 outline-none flex-1 text-sm text-ink placeholder:text-ink-subtle"
              aria-label="Search communities"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {[
              { label: "All", active: true },
              { label: "Verified only" },
              { label: "Events this week" },
              { label: "Within 5 km" },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                aria-pressed={chip.active}
                className={`px-4 py-2 rounded-cf-pill text-sm transition-colors ${
                  chip.active
                    ? "bg-sage text-surface"
                    : "bg-surface text-ink-muted hover:text-ink hover:bg-surface-sunken"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery */}
        <ul
          className="grid gap-6"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
        >
          {communities.map((c) => (
            <li key={c.id} className="contents">
              <CommunityCard community={c} />
            </li>
          ))}
        </ul>

        <footer className="text-xs text-ink-muted text-center py-12 mt-12">
          Showing {communities.length} {communities.length === 1 ? "community" : "communities"}.
        </footer>
      </main>
    </div>
  );
}
