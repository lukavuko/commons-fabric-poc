import { useRef, useState } from "react";
import { gqlFetch } from "@/lib/graphql";
import { fmt, toDatetimeLocal } from "@/lib/date";
import {
  Alert,
  Button,
  FormField,
  Input,
  Tag,
  StateBadge,
  Textarea,
} from "@/components/primitives";
import { TagsInput } from "@/components/TagsInput";

// ─── GraphQL ────────────────────────────────────────────────────────────────

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

import type { RSVPStatus } from "@/lib/types";

export type EventRow = {
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

// ─── Component ───────────────────────────────────────────────────────────────

export function EventPopup({
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

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--cf-hairline)]">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    window.open(`/api/events/${event.id}/ical`, "_blank")
                  }
                >
                  Download .ics
                </Button>
                {canEdit && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setEditing(true)}
                  >
                    Edit event
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
