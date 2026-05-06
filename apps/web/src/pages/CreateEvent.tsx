import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { SiteNav } from "@/components/SiteNav";
import {
  Alert,
  Button,
  FormField,
  Input,
  LinkButton,
  Textarea,
} from "@/components/primitives";
import { TagsInput } from "@/components/TagsInput";
import { gqlFetch } from "@/lib/graphql";
import { usePermissions } from "@/lib/usePermissions";

const CREATE_EVENT = `
  mutation CreateEvent($input: CreateEventInput!) {
    createEvent(input: $input) {
      id
    }
  }
`;

interface FormState {
  title: string;
  subtitle: string;
  description: string;
  eventType: "SOCIAL" | "INFORMATIONAL";
  location: string;
  startsAt: string;
  endsAt: string;
  tags: string[];
  recurring: boolean;
  recurringSchedule: string;
}

const EMPTY: FormState = {
  title: "",
  subtitle: "",
  description: "",
  eventType: "SOCIAL",
  location: "",
  startsAt: "",
  endsAt: "",
  tags: [],
  recurring: false,
  recurringSchedule: "WEEKLY",
};

export default function CreateEvent() {
  const { id: communityId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can, loading: permsLoading } = usePermissions(
    communityId,
    "COMMUNITY",
  );
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const field =
    (key: keyof FormState) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!communityId) return;
    setError("");
    setBusy(true);
    try {
      const input: Record<string, unknown> = {
        communityId,
        title: form.title.trim(),
        ...(form.subtitle.trim() ? { subtitle: form.subtitle.trim() } : {}),
        ...(form.description.trim()
          ? { description: form.description.trim() }
          : {}),
        eventType: form.eventType,
        ...(form.location.trim() ? { location: form.location.trim() } : {}),
        ...(form.startsAt
          ? { startsAt: new Date(form.startsAt).toISOString() }
          : {}),
        ...(form.endsAt ? { endsAt: new Date(form.endsAt).toISOString() } : {}),
        tags: form.tags,
      };
      const data = await gqlFetch<{ createEvent: { id: string } }>(
        CREATE_EVENT,
        { input },
      );
      navigate(`/communities/${communityId}?event=${data.createEvent.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  if (!permsLoading && !can("event:create")) {
    return (
      <div className="max-w-[1200px] w-full mx-auto px-8 flex-1 flex flex-col">
        <SiteNav />
        <main className="max-w-[640px] mx-auto w-full py-10">
          <Alert tone="danger">
            You don't have permission to create events here.
          </Alert>
        </main>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] w-full mx-auto px-8 flex-1 flex flex-col">
      <SiteNav />
      <main className="max-w-[640px] mx-auto w-full py-10">
        <Link
          to={`/communities/${communityId}`}
          className="text-sm text-ink-muted hover:text-ink mb-6 inline-block"
        >
          ← Community
        </Link>

        <h1 className="font-display text-4xl font-medium text-ink mb-10 tracking-tight">
          New event
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-10">
          <section className="flex flex-col gap-4">
            <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-widest">
              Details
            </h2>
            <FormField label="Title">
              {({ id }) => (
                <Input
                  id={id}
                  value={form.title}
                  onChange={field("title")}
                  required
                  placeholder="Summer Social"
                />
              )}
            </FormField>
            <FormField label="Subtitle" hint="Optional">
              {({ id }) => (
                <Input
                  id={id}
                  value={form.subtitle}
                  onChange={field("subtitle")}
                  placeholder="A brief tagline"
                />
              )}
            </FormField>
            <FormField label="Description" hint="Optional">
              {({ id }) => (
                <Textarea
                  id={id}
                  value={form.description}
                  onChange={field("description")}
                  placeholder="What should attendees know?"
                />
              )}
            </FormField>
            <FormField label="Type">
              {({ id }) => (
                <select
                  id={id}
                  value={form.eventType}
                  onChange={
                    field(
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
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-widest">
              When &amp; where
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Starts at" hint="Optional">
                {({ id }) => (
                  <Input
                    id={id}
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={field("startsAt")}
                  />
                )}
              </FormField>
              <FormField label="Ends at" hint="Optional">
                {({ id }) => (
                  <Input
                    id={id}
                    type="datetime-local"
                    value={form.endsAt}
                    onChange={field("endsAt")}
                  />
                )}
              </FormField>
            </div>
            <FormField label="Location" hint="Optional">
              {({ id }) => (
                <Input
                  id={id}
                  value={form.location}
                  onChange={field("location")}
                  placeholder="123 Main St or Online"
                />
              )}
            </FormField>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-widest">
              Tags
            </h2>
            <FormField label="Tags" hint="Press space or Enter to add">
              {({ id }) => (
                <TagsInput
                  id={id}
                  value={form.tags}
                  onChange={(tags) => setForm((f) => ({ ...f, tags }))}
                />
              )}
            </FormField>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-widest">
              Recurring
            </h2>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.recurring}
                onChange={(e) =>
                  setForm((f) => ({ ...f, recurring: e.target.checked }))
                }
                className="w-4 h-4 rounded accent-sage-deep"
              />
              <span className="text-sm text-ink">This event repeats</span>
            </label>

            {form.recurring && (
              <div className="flex flex-col gap-4 pl-7 pt-1 opacity-60 pointer-events-none select-none">
                <p className="text-xs text-ink-muted">
                  Recurring schedule will be configurable in a future update.
                </p>
                <FormField label="Repeat schedule">
                  {({ id }) => (
                    <select
                      id={id}
                      disabled
                      className="w-full bg-page rounded-cf-md px-3.5 py-2.5 text-sm text-ink shadow-[inset_0_0_0_1px_var(--cf-hairline)] outline-none opacity-50 cursor-not-allowed"
                    >
                      <option value="WEEKLY">Weekly</option>
                      <option value="BIWEEKLY">Biweekly</option>
                      <option value="MONTHLY">Monthly</option>
                      <option value="DAILY">Daily</option>
                      <option value="ANNUAL">Annual</option>
                    </select>
                  )}
                </FormField>
                <div className="flex flex-wrap gap-3">
                  {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(
                    (day) => (
                      <label
                        key={day}
                        className="flex items-center gap-1.5 text-xs text-ink cursor-not-allowed"
                      >
                        <input
                          type="checkbox"
                          disabled
                          className="w-3.5 h-3.5 rounded accent-sage-deep"
                        />
                        {day}
                      </label>
                    ),
                  )}
                </div>
              </div>
            )}
          </section>

          {error && <Alert tone="danger">{error}</Alert>}

          <div className="flex items-center gap-3 flex-wrap">
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save as draft"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled
              title="Coming soon"
            >
              Publish now
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled
              title="Coming soon"
            >
              Schedule
            </Button>
            <LinkButton variant="ghost" to={`/communities/${communityId}`}>
              Cancel
            </LinkButton>
          </div>
        </form>
      </main>
    </div>
  );
}
