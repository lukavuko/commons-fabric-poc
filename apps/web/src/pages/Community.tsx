import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { gqlFetch, GraphQLClientError } from "@/lib/graphql";
import { fmt } from "@/lib/date";
import { useMe } from "@/lib/useMe";
import { usePermissions } from "@/lib/usePermissions";
import {
  Alert,
  Button,
  FormField,
  Input,
  LinkButton,
  StateBadge,
  Tag,
  Textarea,
  VerifiedBadge,
} from "@/components/primitives";
import { TagsInput } from "@/components/TagsInput";
import { SubscriptionPreferences } from "@/components/SubscriptionPreferences";
import { EventPopup, type EventRow } from "@/components/EventPopup";
import { EventTile } from "@/components/EventTile";
import { CommunityCalendar } from "@/components/CommunityCalendar";
import { SiteNav } from "@/components/SiteNav";
import NotFound from "./NotFound";

// ─── GraphQL ────────────────────────────────────────────────────────────────

const COMMUNITY_QUERY = `
  query Community($id: ID!) {
    community(id: $id) {
      id
      name
      website
      description
      tags
      contactFirstname
      contactLastname
      contactEmail
      contactNumber
      address
      city
      province
      postalCode
      country
      verifiedEmail
      verifiedExternally
      subscriberCount
      events(upcoming: true) {
        id
        title
        subtitle
        description
        startsAt
        endsAt
        location
        eventType
        releaseStatus
        tags
        rsvpCount
        myRsvp
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

type AnnouncementRow = {
  id: string;
  title: string;
  subtitle?: string;
  releasedAt?: string;
  likes?: number;
};

type CommunityData = {
  id: string;
  name: string;
  website?: string;
  description: string;
  tags: string[];
  contactFirstname: string;
  contactLastname: string;
  contactEmail: string;
  contactNumber?: string;
  address: string;
  city: string;
  province: string;
  postalCode?: string;
  country: string;
  verifiedEmail: boolean;
  verifiedExternally: boolean;
  subscriberCount: number;
  events: EventRow[];
  announcements: AnnouncementRow[];
};

type Tab = "information" | "calendar" | "announcements";
type CommunityScope = "PUBLIC" | "SUBSCRIBER" | "MEMBER" | "STEWARD";
type CommunityAccessState = {
  scope: CommunityScope;
  isSubscribed: boolean;
  roleName: string | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatScope(scope: CommunityScope) {
  return (
    {
      PUBLIC: "Public",
      SUBSCRIBER: "Subscriber",
      MEMBER: "Member",
      STEWARD: "Steward",
    } satisfies Record<CommunityScope, string>
  )[scope];
}

function ScopeBadge({
  scope,
  loading,
}: {
  scope: CommunityScope;
  loading: boolean;
}) {
  const styles: Record<CommunityScope, string> = {
    PUBLIC: "bg-[rgba(47,53,44,0.06)] text-ink-muted",
    SUBSCRIBER: "bg-[rgba(80,101,72,0.10)] text-sage-deep",
    MEMBER: "bg-[rgba(80,101,72,0.14)] text-sage-deep",
    STEWARD: "bg-[rgba(140,90,63,0.12)] text-clay-deep",
  };

  return (
    <span
      aria-label={`Community scope: ${loading ? "loading" : formatScope(scope)}`}
      className={`inline-flex min-h-8 items-center gap-2 rounded-cf-pill px-3 text-xs font-semibold ${styles[scope]}`}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-cf-pill bg-current opacity-75"
      />
      {loading ? "Scope..." : formatScope(scope)}
    </span>
  );
}

// ─── Subscribe block ──────────────────────────────────────────────────────────

function SubscribeBlock({
  isAuthenticated,
  isVerified,
  canSubscribe,
  isLoadingMe,
  access,
  busy,
  error,
  showPrefs,
  onSubscribe,
  onUnsubscribe,
  onTogglePrefs,
  communityId,
}: {
  isAuthenticated: boolean;
  isVerified: boolean;
  canSubscribe: boolean;
  isLoadingMe: boolean;
  access: CommunityAccessState | null;
  busy: boolean;
  error: string;
  showPrefs: boolean;
  onSubscribe: () => void;
  onUnsubscribe: () => void;
  onTogglePrefs: () => void;
  communityId: string;
}) {
  if (isLoadingMe || access === null) return null;
  const { isSubscribed, scope } = access;
  const hasInheritedSubscription = scope === "MEMBER" || scope === "STEWARD";

  if (!isAuthenticated) {
    return (
      <Alert tone="info">
        <Link to="/auth" className="underline underline-offset-2">
          Sign in
        </Link>{" "}
        to subscribe and get notified.
      </Alert>
    );
  }

  if (canSubscribe && !isVerified) {
    return (
      <div className="flex flex-col gap-3">
        <Alert tone="info">
          Verify your email to subscribe.{" "}
          <Link to="/auth" className="underline underline-offset-2">
            Resend link
          </Link>
          .
        </Alert>
        <Button variant="secondary" disabled>
          Subscribe
        </Button>
      </div>
    );
  }

  if (hasInheritedSubscription) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <StateBadge label={`${formatScope(scope)} access`} tone="sage" />
          {isSubscribed && (
            <Button variant="secondary" onClick={onTogglePrefs}>
              {showPrefs ? "Hide notifications" : "Manage notifications"}
            </Button>
          )}
        </div>
        {error && <Alert tone="danger">{error}</Alert>}
        {showPrefs && isSubscribed && (
          <SubscriptionPreferences communityId={communityId} />
        )}
      </div>
    );
  }

  if (!isSubscribed) {
    return (
      <div className="flex flex-col gap-3 items-start">
        <Button onClick={onSubscribe} disabled={busy}>
          {busy ? "Subscribing…" : "Subscribe"}
        </Button>
        {error && <Alert tone="danger">{error}</Alert>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <StateBadge label="Subscribed" tone="sage" />
        <Button variant="secondary" onClick={onTogglePrefs}>
          {showPrefs ? "Hide notifications" : "Manage notifications"}
        </Button>
        <Button variant="ghost" onClick={onUnsubscribe} disabled={busy}>
          {busy ? "Working…" : "Unsubscribe"}
        </Button>
      </div>
      {error && <Alert tone="danger">{error}</Alert>}
      {showPrefs && <SubscriptionPreferences communityId={communityId} />}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Community() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const me = useMe();
  const { can } = usePermissions(id, "COMMUNITY");

  const [community, setCommunity] = useState<CommunityData | null>(null);
  const [pageStatus, setPageStatus] = useState<"loading" | "ok" | "missing">(
    "loading",
  );
  const [activeTab, setActiveTab] = useState<Tab>("information");
  const [popup, setPopup] = useState<EventRow | null>(null);

  const [access, setAccess] = useState<CommunityAccessState | null>(null);
  const [subBusy, setSubBusy] = useState(false);
  const [subError, setSubError] = useState("");
  const [showPrefs, setShowPrefs] = useState(false);

  useEffect(() => {
    if (!id) {
      setPageStatus("missing");
      return;
    }
    let cancelled = false;
    gqlFetch<{ community: CommunityData | null }>(COMMUNITY_QUERY, { id })
      .then((d) => {
        if (cancelled) return;
        if (d.community) {
          setCommunity(d.community);
          setPageStatus("ok");
          // If linked to a specific event via ?event=, open popup
          const linkedEventId = searchParams.get("event");
          if (linkedEventId) {
            const found = d.community.events.find(
              (e) => e.id === linkedEventId,
            );
            if (found) {
              setPopup(found);
              setActiveTab("calendar");
            }
          }
        } else {
          setPageStatus("missing");
        }
      })
      .catch(() => {
        if (!cancelled) setPageStatus("missing");
      });
    return () => {
      cancelled = true;
    };
  }, [id, searchParams]);

  useEffect(() => {
    setAccess(null);
    if (!id) return;
    let cancelled = false;
    gqlFetch<{ communityAccess: CommunityAccessState }>(
      COMMUNITY_ACCESS_QUERY,
      { communityId: id },
    )
      .then((d) => {
        if (!cancelled) setAccess(d.communityAccess);
      })
      .catch(() => {
        if (!cancelled)
          setAccess({ scope: "PUBLIC", isSubscribed: false, roleName: null });
      });
    return () => {
      cancelled = true;
    };
  }, [id, me.isAuthenticated]);

  const handleSubscribe = async () => {
    if (!id) return;
    setSubBusy(true);
    setSubError("");
    try {
      await gqlFetch(SUBSCRIBE, { communityId: id });
      setAccess((current) =>
        current
          ? {
              ...current,
              isSubscribed: true,
              scope: current.scope === "PUBLIC" ? "SUBSCRIBER" : current.scope,
            }
          : current,
      );
      setShowPrefs(true);
    } catch (err) {
      if (
        err instanceof GraphQLClientError &&
        err.code === "EMAIL_NOT_VERIFIED"
      ) {
        setSubError("Verify your email to subscribe.");
      } else {
        setSubError(err instanceof Error ? err.message : "Could not subscribe");
      }
    } finally {
      setSubBusy(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!id) return;
    setSubBusy(true);
    setSubError("");
    try {
      await gqlFetch(UNSUBSCRIBE, { communityId: id });
      setAccess((current) =>
        current
          ? { ...current, isSubscribed: false, scope: "PUBLIC" }
          : current,
      );
      setShowPrefs(false);
    } catch (err) {
      setSubError(err instanceof Error ? err.message : "Could not unsubscribe");
    } finally {
      setSubBusy(false);
    }
  };

  const handleEventUpdated = (updated: EventRow) => {
    setCommunity((c) =>
      c
        ? {
            ...c,
            events: c.events.map((e) =>
              e.id === updated.id ? { ...e, ...updated } : e,
            ),
          }
        : c,
    );
    setPopup((p) => (p && p.id === updated.id ? { ...p, ...updated } : p));
  };

  if (pageStatus === "loading") {
    return (
      <div className="max-w-[1200px] w-full mx-auto px-8 flex-1 flex flex-col">
        <SiteNav />
        <main className="max-w-[920px] mx-auto w-full py-10 text-sm text-ink-muted">
          Loading…
        </main>
      </div>
    );
  }

  if (pageStatus === "missing" || !community) return <NotFound />;

  const tabs: { key: Tab; label: string }[] = [
    { key: "information", label: "Information" },
    {
      key: "calendar",
      label: `Calendar${community.events.length ? ` (${community.events.length})` : ""}`,
    },
    {
      key: "announcements",
      label: `Announcements${community.announcements.length ? ` (${community.announcements.length})` : ""}`,
    },
  ];
  return (
    <>
      <div className="max-w-[1200px] w-full mx-auto px-8 flex-1 flex flex-col">
        <SiteNav />
        <main className="max-w-[920px] mx-auto w-full py-10">
          <Link
            to="/explore"
            className="text-sm text-ink-muted hover:text-ink mb-6 inline-block"
          >
            ← Explore
          </Link>

          {/* Community header */}
          <div className="mb-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-start gap-3 mb-2">
                  <h1 className="font-display text-4xl font-medium text-ink tracking-tight">
                    {community.name}
                  </h1>
                  {(community.verifiedEmail ||
                    community.verifiedExternally) && <VerifiedBadge />}
                </div>
                <p className="text-ink-muted text-sm">
                  {community.city}, {community.province} ·{" "}
                  {community.subscriberCount} subscribers
                </p>
              </div>
              <div className="shrink-0 sm:pt-1">
                <ScopeBadge
                  scope={access?.scope ?? "PUBLIC"}
                  loading={me.loading || access === null}
                />
              </div>
            </div>
            {community.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {community.tags.map((t) => (
                  <Tag key={t} tone="sage">
                    {t}
                  </Tag>
                ))}
              </div>
            )}
          </div>

          {/* Subscribe block */}
          <div className="mb-8">
            <SubscribeBlock
              isAuthenticated={me.isAuthenticated}
              isVerified={me.isVerified}
              canSubscribe={can("community:subscribe")}
              isLoadingMe={me.loading}
              access={access}
              busy={subBusy}
              error={subError}
              showPrefs={showPrefs}
              onSubscribe={handleSubscribe}
              onUnsubscribe={handleUnsubscribe}
              onTogglePrefs={() => setShowPrefs((v) => !v)}
              communityId={community.id}
            />
          </div>

          {/* Tab bar */}
          <div className="flex items-end border-b border-[var(--cf-hairline)] mb-8">
            <div className="flex gap-0">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2.5 text-base font-medium transition-colors border-b-2 -mb-px ${
                    activeTab === tab.key
                      ? "border-sage-deep text-sage-deep"
                      : "border-transparent text-ink-muted hover:text-ink"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {can("event:create") && (
              <div className="ml-auto pb-2">
                <LinkButton
                  variant="secondary"
                  to={`/communities/${community.id}/events/new`}
                >
                  + Create event
                </LinkButton>
              </div>
            )}
          </div>

          {/* Information tab */}
          {activeTab === "information" && (
            <div className="flex flex-col gap-6">
              <section>
                <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-widest mb-3">
                  About
                </h2>
                <p className="text-sm text-ink leading-relaxed">
                  {community.description}
                </p>
                {community.website && (
                  <a
                    href={community.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-sage-deep hover:underline mt-2 inline-block"
                  >
                    {community.website}
                  </a>
                )}
              </section>

              <section>
                <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-widest mb-3">
                  Contact
                </h2>
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
                  <dt className="text-ink-muted">Name</dt>
                  <dd className="text-ink">
                    {community.contactFirstname} {community.contactLastname}
                  </dd>
                  <dt className="text-ink-muted">Email</dt>
                  <dd className="text-ink">
                    <a
                      href={`mailto:${community.contactEmail}`}
                      className="hover:underline"
                    >
                      {community.contactEmail}
                    </a>
                  </dd>
                  {community.contactNumber && (
                    <>
                      <dt className="text-ink-muted">Phone</dt>
                      <dd className="text-ink">{community.contactNumber}</dd>
                    </>
                  )}
                </dl>
              </section>

              <section>
                <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-widest mb-3">
                  Address
                </h2>
                <address className="not-italic text-sm text-ink">
                  {community.address}
                  <br />
                  {community.city}, {community.province}
                  {community.postalCode ? ` ${community.postalCode}` : ""}
                  <br />
                  {community.country}
                </address>
              </section>

              {can("community:edit") && (
                <div>
                  <LinkButton
                    variant="secondary"
                    to={`/communities/${community.id}/edit`}
                  >
                    Edit community
                  </LinkButton>
                </div>
              )}
            </div>
          )}

          {/* Calendar tab */}
          {activeTab === "calendar" && (
            <CommunityCalendar
              events={community.events}
              canEdit={can("event:edit")}
              onEventClick={(event) => setPopup(event)}
            />
          )}

          {/* Announcements tab */}
          {activeTab === "announcements" && (
            <div className="flex flex-col gap-3">
              {community.announcements.length === 0 ? (
                <p className="text-sm text-ink-muted">No announcements yet.</p>
              ) : (
                community.announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="bg-surface rounded-cf-xl shadow-cf-card p-5 flex flex-col gap-1"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-ink">{ann.title}</p>
                        {ann.subtitle && (
                          <p className="text-sm text-ink-muted">
                            {ann.subtitle}
                          </p>
                        )}
                      </div>
                      {ann.likes != null && ann.likes > 0 && (
                        <span className="text-xs text-ink-muted shrink-0">
                          {ann.likes} likes
                        </span>
                      )}
                    </div>
                    {ann.releasedAt && (
                      <p className="text-xs text-ink-muted">
                        {fmt(ann.releasedAt)}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>

      {popup && (
        <EventPopup
          event={popup}
          canEdit={can("event:edit")}
          isAuthenticated={me.isAuthenticated}
          onClose={() => setPopup(null)}
          onUpdated={handleEventUpdated}
        />
      )}
    </>
  );
}
