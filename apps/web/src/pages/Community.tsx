import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { gqlFetch, GraphQLClientError } from "@/lib/graphql";
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
} from "@/components";
import { TagsInput } from "@/components/TagsInput";
import { SubscriptionPreferences } from "@/components/SubscriptionPreferences";
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

const MY_SUBS_QUERY = `
  query MySubsForCommunity {
    mySubscriptions {
      community { id }
      isActive
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

const UPDATE_EVENT = `
  mutation UpdateEvent($id: ID!, $input: UpdateEventInput!) {
    updateEvent(id: $id, input: $input) {
      id title subtitle description eventType location startsAt endsAt tags releaseStatus rsvpCount myRsvp
    }
  }
`;

const PUBLISH_EVENT = `
  mutation PublishEvent($id: ID!) {
    publishEvent(id: $id) {
      id releaseStatus releasedAt
    }
  }
`;

const RSVP = `
  mutation Rsvp($eventId: ID!, $status: RSVPStatus!) {
    rsvpToEvent(eventId: $eventId, status: $status) { id rsvpStatus }
  }
`;

const CANCEL_RSVP = `
  mutation CancelRsvp($eventId: ID!) {
    cancelRsvp(eventId: $eventId)
  }
`;

// ─── Types ───────────────────────────────────────────────────────────────────

type RSVPStatus = "GOING" | "INTERESTED" | "NOT_GOING";

type EventRow = {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  location?: string;
  eventType?: string;
  releaseStatus: string;
  tags: string[];
  rsvpCount: number;
  myRsvp?: RSVPStatus | null;
};

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(iso?: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toDatetimeLocal(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 16);
}

// ─── EventPopup ──────────────────────────────────────────────────────────────

function EventPopup({
  event,
  canEdit,
  isAuthenticated,
  onClose,
  onUpdated,
}: {
  event: EventRow;
  canEdit: boolean;
  isAuthenticated: boolean;
  onClose: () => void;
  onUpdated: (updated: EventRow) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: event.title,
    subtitle: event.subtitle ?? "",
    description: event.description ?? "",
    eventType: event.eventType ?? "SOCIAL",
    location: event.location ?? "",
    startsAt: toDatetimeLocal(event.startsAt),
    endsAt: toDatetimeLocal(event.endsAt),
    tags: event.tags ?? [],
  });
  const [editError, setEditError] = useState("");
  const [editBusy, setEditBusy] = useState(false);
  const [rsvpBusy, setRsvpBusy] = useState(false);
  const [localRsvp, setLocalRsvp] = useState<RSVPStatus | null>(
    event.myRsvp ?? null,
  );
  const [localCount, setLocalCount] = useState(event.rsvpCount);
  const backdropRef = useRef<HTMLDivElement>(null);

  const editField =
    (key: string) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setEditForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    setEditError("");
    setEditBusy(true);
    try {
      const input: Record<string, unknown> = {
        title: editForm.title.trim(),
        subtitle: editForm.subtitle.trim() || null,
        description: editForm.description.trim() || null,
        eventType: editForm.eventType,
        location: editForm.location.trim() || null,
        startsAt: editForm.startsAt
          ? new Date(editForm.startsAt).toISOString()
          : null,
        endsAt: editForm.endsAt
          ? new Date(editForm.endsAt).toISOString()
          : null,
        tags: editForm.tags,
      };
      const data = await gqlFetch<{ updateEvent: EventRow }>(UPDATE_EVENT, {
        id: event.id,
        input,
      });
      onUpdated(data.updateEvent);
      setEditing(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setEditBusy(false);
    }
  };

  const handlePublish = async () => {
    setEditBusy(true);
    try {
      const data = await gqlFetch<{ publishEvent: EventRow }>(PUBLISH_EVENT, {
        id: event.id,
      });
      onUpdated({ ...event, ...data.publishEvent });
      setEditing(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Publish failed.");
    } finally {
      setEditBusy(false);
    }
  };

  const handleRsvp = async (status: RSVPStatus) => {
    if (!isAuthenticated) return;
    setRsvpBusy(true);
    try {
      if (localRsvp === status) {
        await gqlFetch(CANCEL_RSVP, { eventId: event.id });
        if (status === "GOING") setLocalCount((c) => Math.max(0, c - 1));
        setLocalRsvp(null);
      } else {
        await gqlFetch(RSVP, { eventId: event.id, status });
        if (status === "GOING" && localRsvp !== "GOING")
          setLocalCount((c) => c + 1);
        if (localRsvp === "GOING" && status !== "GOING")
          setLocalCount((c) => Math.max(0, c - 1));
        setLocalRsvp(status);
      }
    } finally {
      setRsvpBusy(false);
    }
  };

  const display = editing ? editForm : event;
  const isDraft = event.releaseStatus === "DRAFT";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative bg-surface rounded-cf-xl shadow-cf-card w-full max-w-lg max-h-[90vh] overflow-y-auto z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              {editing ? (
                <FormField label="Title">
                  {({ id }) => (
                    <Input
                      id={id}
                      value={editForm.title}
                      onChange={editField("title")}
                      required
                    />
                  )}
                </FormField>
              ) : (
                <h2 className="font-display text-2xl font-medium text-ink tracking-tight">
                  {event.title}
                </h2>
              )}
              {!editing && event.subtitle && (
                <p className="text-sm text-ink-muted mt-0.5">
                  {event.subtitle}
                </p>
              )}
              {editing && (
                <div className="mt-3">
                  <FormField label="Subtitle" hint="Optional">
                    {({ id }) => (
                      <Input
                        id={id}
                        value={editForm.subtitle}
                        onChange={editField("subtitle")}
                      />
                    )}
                  </FormField>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 text-ink-subtle hover:text-ink transition-colors p-1"
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
          </div>

          {/* Status badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {isDraft && <StateBadge label="Draft" tone="clay" />}
            {!editing && event.eventType && (
              <Tag tone="neutral">{event.eventType.toLowerCase()}</Tag>
            )}
            {!editing && localCount > 0 && (
              <Tag tone="sage">{localCount} going</Tag>
            )}
          </div>

          {/* Body */}
          {editing ? (
            <div className="flex flex-col gap-4">
              <FormField label="Description" hint="Optional">
                {({ id }) => (
                  <Textarea
                    id={id}
                    value={editForm.description}
                    onChange={editField("description")}
                  />
                )}
              </FormField>
              <FormField label="Type">
                {({ id }) => (
                  <select
                    id={id}
                    value={editForm.eventType}
                    onChange={
                      editField(
                        "eventType",
                      ) as React.ChangeEventHandler<HTMLSelectElement>
                    }
                    className="w-full bg-page rounded-cf-md px-3.5 py-2.5 text-sm text-ink shadow-[inset_0_0_0_1px_var(--cf-hairline)] focus:shadow-[inset_0_0_0_1px_rgba(80,101,72,0.45)] transition-shadow outline-none"
                  >
                    <option value="SOCIAL">Social</option>
                    <option value="INFORMATIONAL">Informational</option>
                  </select>
                )}
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Starts at" hint="Optional">
                  {({ id }) => (
                    <Input
                      id={id}
                      type="datetime-local"
                      value={editForm.startsAt}
                      onChange={editField("startsAt")}
                    />
                  )}
                </FormField>
                <FormField label="Ends at" hint="Optional">
                  {({ id }) => (
                    <Input
                      id={id}
                      type="datetime-local"
                      value={editForm.endsAt}
                      onChange={editField("endsAt")}
                    />
                  )}
                </FormField>
              </div>
              <FormField label="Location" hint="Optional">
                {({ id }) => (
                  <Input
                    id={id}
                    value={editForm.location}
                    onChange={editField("location")}
                  />
                )}
              </FormField>
              <FormField label="Tags" hint="Press space or Enter to add">
                {({ id }) => (
                  <TagsInput
                    id={id}
                    value={editForm.tags}
                    onChange={(tags) => setEditForm((f) => ({ ...f, tags }))}
                  />
                )}
              </FormField>
              {editError && <Alert tone="danger">{editError}</Alert>}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--cf-hairline)]">
                <Button type="button" onClick={handleSave} disabled={editBusy}>
                  {editBusy ? "Saving…" : "Save draft"}
                </Button>
                {isDraft && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handlePublish}
                    disabled={editBusy}
                  >
                    Publish now
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditing(false)}
                  disabled={editBusy}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {event.description && (
                <p className="text-sm text-ink leading-relaxed">
                  {event.description}
                </p>
              )}

              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                {event.startsAt && (
                  <>
                    <dt className="text-ink-muted">Starts</dt>
                    <dd className="text-ink">{fmt(event.startsAt)}</dd>
                  </>
                )}
                {event.endsAt && (
                  <>
                    <dt className="text-ink-muted">Ends</dt>
                    <dd className="text-ink">{fmt(event.endsAt)}</dd>
                  </>
                )}
                {event.location && (
                  <>
                    <dt className="text-ink-muted">Location</dt>
                    <dd className="text-ink">{event.location}</dd>
                  </>
                )}
              </dl>

              {event.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {event.tags.map((t) => (
                    <Tag key={t} tone="neutral">
                      {t}
                    </Tag>
                  ))}
                </div>
              )}

              {/* RSVP */}
              {isAuthenticated && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--cf-hairline)]">
                  {(["GOING", "INTERESTED", "NOT_GOING"] as RSVPStatus[]).map(
                    (s) => (
                      <button
                        key={s}
                        type="button"
                        disabled={rsvpBusy}
                        onClick={() => handleRsvp(s)}
                        className={`px-3 py-1.5 rounded-cf-pill text-xs font-medium transition-colors disabled:opacity-50 ${
                          localRsvp === s
                            ? "bg-sage-deep text-surface"
                            : "bg-[rgba(80,101,72,0.08)] text-ink hover:bg-[rgba(80,101,72,0.14)]"
                        }`}
                      >
                        {s === "GOING"
                          ? "Going"
                          : s === "INTERESTED"
                            ? "Interested"
                            : "Not going"}
                      </button>
                    ),
                  )}
                </div>
              )}

              {canEdit && (
                <div className="pt-2 border-t border-[var(--cf-hairline)]">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setEditing(true)}
                  >
                    Edit event
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Subscribe block ──────────────────────────────────────────────────────────

function SubscribeBlock({
  isAuthenticated,
  isVerified,
  canSubscribe,
  isLoadingMe,
  isSubscribed,
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
  isSubscribed: boolean;
  busy: boolean;
  error: string;
  showPrefs: boolean;
  onSubscribe: () => void;
  onUnsubscribe: () => void;
  onTogglePrefs: () => void;
  communityId: string;
}) {
  if (isLoadingMe) return null;

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

  const [isSubscribed, setIsSubscribed] = useState(false);
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
    if (!id || !me.isAuthenticated) {
      setIsSubscribed(false);
      return;
    }
    let cancelled = false;
    gqlFetch<{
      mySubscriptions: Array<{ community: { id: string }; isActive: boolean }>;
    }>(MY_SUBS_QUERY)
      .then((d) => {
        if (cancelled) return;
        setIsSubscribed(
          !!d.mySubscriptions.find((s) => s.community.id === id && s.isActive),
        );
      })
      .catch(() => {});
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
      setIsSubscribed(true);
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
      setIsSubscribed(false);
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
        <main className="max-w-4xl mx-auto w-full py-10 text-sm text-ink-muted">
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
        <main className="max-w-4xl mx-auto w-full py-10">
          <Link
            to="/explore"
            className="text-sm text-ink-muted hover:text-ink mb-6 inline-block"
          >
            ← Explore
          </Link>

          {/* Community header */}
          <div className="mb-6">
            <div className="flex flex-wrap items-start gap-3 mb-2">
              <h1 className="font-display text-4xl font-medium text-ink tracking-tight">
                {community.name}
              </h1>
              {(community.verifiedEmail || community.verifiedExternally) && (
                <VerifiedBadge />
              )}
            </div>
            <p className="text-ink-muted text-sm">
              {community.city}, {community.province} ·{" "}
              {community.subscriberCount} subscribers
            </p>
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
              isSubscribed={isSubscribed}
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
          <div className="flex gap-0 border-b border-[var(--cf-hairline)] mb-8">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab.key
                    ? "border-sage-deep text-sage-deep"
                    : "border-transparent text-ink-muted hover:text-ink"
                }`}
              >
                {tab.label}
              </button>
            ))}
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
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-widest">
                  Upcoming events
                </h2>
                {can("event:create") && (
                  <LinkButton
                    variant="secondary"
                    to={`/communities/${community.id}/events/new`}
                  >
                    + New event
                  </LinkButton>
                )}
              </div>

              {community.events.length === 0 ? (
                <p className="text-sm text-ink-muted">No upcoming events.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {community.events.map((event) => (
                    <li key={event.id}>
                      <button
                        type="button"
                        onClick={() => setPopup(event)}
                        className="w-full text-left bg-surface rounded-cf-xl shadow-cf-card hover:shadow-cf-card-hover transition-shadow p-5 flex flex-col gap-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-ink">
                              {event.title}
                            </p>
                            {event.subtitle && (
                              <p className="text-sm text-ink-muted">
                                {event.subtitle}
                              </p>
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
                            <span className="capitalize">
                              {event.eventType.toLowerCase()}
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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
