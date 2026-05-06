import { Button, LinkButton } from "@/components/primitives";
import {
  CommunityCard,
  type CommunityCardData,
} from "@/components/CommunityCard";
import { SiteNav } from "@/components/SiteNav";
import { gqlFetch } from "@/lib/graphql";
import { useMe } from "@/lib/useMe";
import { useEffect, useState } from "react";

// ─── GraphQL ─────────────────────────────────────────────────────────────────

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

const MY_SUBSCRIBED_IDS = `
  query {
    me {
      subscriptions { community { id } isActive }
    }
  }
`;

const COMMUNITY_ACCESS_QUERY = `
  query CommunityAccess($communityId: ID!) {
    communityAccess(communityId: $communityId) {
      scope
      isSubscribed
      roleName
    }
  }
`;

const SUBSCRIBE = `
  mutation Subscribe($communityId: ID!) {
    subscribeToCommunity(communityId: $communityId) { id }
  }
`;

const UNSUBSCRIBE = `
  mutation Unsubscribe($communityId: ID!) {
    unsubscribeFromCommunity(communityId: $communityId)
  }
`;

// ─── Types ───────────────────────────────────────────────────────────────────

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

type CommunityAccessState = {
  scope: string;
  isSubscribed: boolean;
  roleName: string | null;
};

// ─── Sample data ─────────────────────────────────────────────────────────────

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

// ─── Popup ───────────────────────────────────────────────────────────────────

function CommunityPopup({
  community,
  isSubscribed: initialSubscribed,
  onClose,
  onSubscribeChange,
  isAuthenticated,
}: {
  community: CommunityCardData;
  isSubscribed: boolean;
  onClose: () => void;
  onSubscribeChange: (id: string, subscribed: boolean) => void;
  isAuthenticated: boolean;
}) {
  const [access, setAccess] = useState<CommunityAccessState | null>(null);
  const [subscribeBusy, setSubscribeBusy] = useState(false);
  const [subscribeError, setSubscribeError] = useState("");

  const isSubscribed = access?.isSubscribed ?? initialSubscribed;
  const isMemberOrHigher =
    access?.roleName === "MEMBER" || access?.roleName === "STEWARD";
  const viewerStatus =
    access?.roleName === "STEWARD"
      ? ("steward" as const)
      : access?.roleName === "MEMBER"
        ? ("member" as const)
        : ("none" as const);

  useEffect(() => {
    if (!isAuthenticated) return;
    gqlFetch<{ communityAccess: CommunityAccessState }>(
      COMMUNITY_ACCESS_QUERY,
      { communityId: community.id },
    )
      .then((d) => setAccess(d.communityAccess))
      .catch(() => {});
  }, [community.id, isAuthenticated]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSubscribeToggle = async () => {
    setSubscribeError("");
    setSubscribeBusy(true);
    try {
      if (isSubscribed) {
        await gqlFetch(UNSUBSCRIBE, { communityId: community.id });
        onSubscribeChange(community.id, false);
        setAccess((a) => (a ? { ...a, isSubscribed: false } : a));
      } else {
        await gqlFetch(SUBSCRIBE, { communityId: community.id });
        onSubscribeChange(community.id, true);
        setAccess((a) => (a ? { ...a, isSubscribed: true } : a));
      }
    } catch (err) {
      setSubscribeError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setSubscribeBusy(false);
    }
  };

  const showSubscribeAction = !isMemberOrHigher;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(47,53,44,0.55)] animate-[fadeIn_200ms_ease-out]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative bg-surface rounded-cf-xl max-w-[520px] w-full max-h-[90vh] min-h-[400px] overflow-y-auto animate-[scaleIn_250ms_ease-out]"
        style={{ boxShadow: "var(--cf-shadow-popup)" }}
      >
        {/* Close X */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 p-1.5 rounded-cf-md text-ink-subtle hover:text-ink hover:bg-surface-sunken transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <CommunityCard
          community={community}
          variant="popup"
          viewerStatus={viewerStatus}
          isSubscribed={isSubscribed}
        />

        {subscribeError && (
          <p className="text-xs text-[color:var(--cf-danger)] px-5 -mt-2 pb-2">
            {subscribeError}
          </p>
        )}

        <div className="px-5 py-3.5 flex gap-2 justify-end border-t border-[var(--cf-hairline)]">
          <LinkButton
            variant="primary"
            className="w-30 text-center rounded-cf-xg"
            to={`/communities/${community.id}`}
            onClick={onClose}
          >
            Visit Page
          </LinkButton>

          {showSubscribeAction &&
            (isAuthenticated ? (
              <Button
                variant="secondary"
                className="w-30"
                onClick={!subscribeBusy ? handleSubscribeToggle : undefined}
                disabled={subscribeBusy}
              >
                {subscribeBusy
                  ? "Working…"
                  : isSubscribed
                    ? "Unsubscribe"
                    : "+ Subscribe"}
              </Button>
            ) : (
              <LinkButton
                variant="secondary"
                className="w-30 text-center"
                to="/auth"
              >
                + Subscribe
              </LinkButton>
            ))}

          <button
            type="button"
            onClick={onClose}
            className="w-20 py-1 rounded-cf-lg text-sm font-small border border-[var(--cf-hairline)] text-ink-muted bg-transparent hover:bg-surface-sunken transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Explore() {
  const me = useMe();
  const [communities, setCommunities] = useState<CommunityCardData[]>(SAMPLE);
  const [usingSample, setUsingSample] = useState(true);
  const [popupCommunity, setPopupCommunity] =
    useState<CommunityCardData | null>(null);
  const [subscribedIds, setSubscribedIds] = useState<Set<string>>(new Set());

  // Load communities
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

  // Pre-fetch subscribed IDs when authenticated
  useEffect(() => {
    if (!me.isAuthenticated) return;
    gqlFetch<{
      me: { subscriptions: { community: { id: string }; isActive: boolean }[] };
    }>(MY_SUBSCRIBED_IDS)
      .then((d) => {
        const ids = new Set(
          d.me.subscriptions
            .filter((s) => s.isActive)
            .map((s) => s.community.id),
        );
        setSubscribedIds(ids);
      })
      .catch(() => {});
  }, [me.isAuthenticated]);

  const handleSubscribeChange = (id: string, subscribed: boolean) => {
    setSubscribedIds((prev) => {
      const next = new Set(prev);
      if (subscribed) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  return (
    <div className="max-w-[1200px] w-full mx-auto px-8 flex-1 flex flex-col">
      <SiteNav />

      <main className="flex-1">
        <header className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-5xl font-medium text-ink mb-2 tracking-tight">
                Explore communities
              </h1>
              <p className="text-ink-muted text-lg">
                Discover groups gathering near you.
              </p>
            </div>
            {!me.loading && me.isAuthenticated && (
              <LinkButton variant="secondary" to="/communities/new">
                + New community
              </LinkButton>
            )}
          </div>
          {usingSample && (
            <p className="text-xs text-clay-deep mt-3">
              Showing sample data — connect the backend to load live
              communities.
            </p>
          )}
        </header>

        {/* Toolbar */}
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
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          }}
        >
          {communities.map((c) => (
            <li key={c.id} className="contents">
              <button
                type="button"
                className="text-left w-full cursor-pointer"
                onClick={() => setPopupCommunity(c)}
                aria-label={`Open details for ${c.name}`}
              >
                <CommunityCard
                  community={c}
                  isSubscribed={subscribedIds.has(c.id)}
                />
              </button>
            </li>
          ))}
        </ul>

        <footer className="text-xs text-ink-muted text-center py-12 mt-12">
          Showing {communities.length}{" "}
          {communities.length === 1 ? "community" : "communities"}.
        </footer>
      </main>

      {/* Popup */}
      {popupCommunity && (
        <CommunityPopup
          community={popupCommunity}
          isSubscribed={subscribedIds.has(popupCommunity.id)}
          onClose={() => setPopupCommunity(null)}
          onSubscribeChange={handleSubscribeChange}
          isAuthenticated={me.isAuthenticated}
        />
      )}
    </div>
  );
}
