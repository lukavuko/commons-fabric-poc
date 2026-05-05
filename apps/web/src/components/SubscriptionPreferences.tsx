import { useEffect, useState } from "react";
import { gqlFetch } from "../lib/graphql";
import { Alert, Button, FormField, Input } from "./primitives";

type Frequency =
  | "NEVER"
  | "REALTIME"
  | "DAILY"
  | "WEEKLY"
  | "BIWEEKLY"
  | "MONTHLY";

type Channel = "EMAIL" | "SMS";

const FREQUENCIES: Frequency[] = [
  "NEVER",
  "REALTIME",
  "DAILY",
  "WEEKLY",
  "BIWEEKLY",
  "MONTHLY",
];

const FREQ_LABEL: Record<Frequency, string> = {
  NEVER: "Never",
  REALTIME: "Real-time",
  DAILY: "Daily digest",
  WEEKLY: "Weekly digest",
  BIWEEKLY: "Biweekly digest",
  MONTHLY: "Monthly digest",
};

interface Prefs {
  calendarFreq: Frequency | null;
  calendarPreferredTime: string | null;
  calendarChannels: Channel[];
  announcementFreq: Frequency | null;
  announcementPreferredTime: string | null;
  announcementChannels: Channel[];
}

const EMPTY: Prefs = {
  calendarFreq: null,
  calendarPreferredTime: null,
  calendarChannels: [],
  announcementFreq: null,
  announcementPreferredTime: null,
  announcementChannels: [],
};

const MY_SUBS = `
  query MySubscriptions {
    mySubscriptions {
      community { id }
      calendarFreq
      calendarPreferredTime
      calendarChannels
      announcementFreq
      announcementPreferredTime
      announcementChannels
    }
  }
`;

const UPDATE_SUB = `
  mutation UpdateSubscription($communityId: ID!, $input: UpdateSubscriptionInput!) {
    updateSubscription(communityId: $communityId, input: $input) {
      calendarFreq
      calendarPreferredTime
      calendarChannels
      announcementFreq
      announcementPreferredTime
      announcementChannels
    }
  }
`;

export function SubscriptionPreferences({
  communityId,
}: {
  communityId: string;
}) {
  const [prefs, setPrefs] = useState<Prefs>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    gqlFetch<{
      mySubscriptions: Array<Prefs & { community: { id: string } }>;
    }>(MY_SUBS)
      .then((data) => {
        if (cancelled) return;
        const found = data.mySubscriptions.find(
          (s) => s.community.id === communityId,
        );
        if (found) {
          setPrefs({
            calendarFreq: found.calendarFreq,
            calendarPreferredTime: found.calendarPreferredTime,
            calendarChannels: found.calendarChannels ?? [],
            announcementFreq: found.announcementFreq,
            announcementPreferredTime: found.announcementPreferredTime,
            announcementChannels: found.announcementChannels ?? [],
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Could not load preferences",
        );
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [communityId]);

  const update = <K extends keyof Prefs>(key: K, value: Prefs[K]) =>
    setPrefs((prev) => ({ ...prev, [key]: value }));

  const toggleChannel = (
    key: "calendarChannels" | "announcementChannels",
    channel: Channel,
  ) =>
    setPrefs((prev) => {
      const set = new Set(prev[key]);
      if (set.has(channel)) set.delete(channel);
      else set.add(channel);
      return { ...prev, [key]: Array.from(set) };
    });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await gqlFetch(UPDATE_SUB, {
        communityId,
        input: {
          calendarFreq: prefs.calendarFreq,
          calendarPreferredTime: prefs.calendarPreferredTime || null,
          calendarChannels: prefs.calendarChannels,
          announcementFreq: prefs.announcementFreq,
          announcementPreferredTime: prefs.announcementPreferredTime || null,
          announcementChannels: prefs.announcementChannels,
        },
      });
      setSavedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-ink-muted">Loading preferences…</p>;
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-5">
      <Section
        title="Calendar"
        hint="When and how you'd like to hear about new events."
        freq={prefs.calendarFreq}
        time={prefs.calendarPreferredTime}
        channels={prefs.calendarChannels}
        onFreq={(v) => update("calendarFreq", v)}
        onTime={(v) => update("calendarPreferredTime", v)}
        onToggleChannel={(c) => toggleChannel("calendarChannels", c)}
      />
      <Section
        title="Announcements"
        hint="When and how you'd like to hear about new posts."
        freq={prefs.announcementFreq}
        time={prefs.announcementPreferredTime}
        channels={prefs.announcementChannels}
        onFreq={(v) => update("announcementFreq", v)}
        onTime={(v) => update("announcementPreferredTime", v)}
        onToggleChannel={(c) => toggleChannel("announcementChannels", c)}
      />

      {error && <Alert tone="danger">{error}</Alert>}
      {savedAt && !error && <Alert tone="success">Preferences saved.</Alert>}

      <Button type="submit" disabled={saving} className="self-start">
        {saving ? "Saving…" : "Save preferences"}
      </Button>
    </form>
  );
}

function Section({
  title,
  hint,
  freq,
  time,
  channels,
  onFreq,
  onTime,
  onToggleChannel,
}: {
  title: string;
  hint: string;
  freq: Frequency | null;
  time: string | null;
  channels: Channel[];
  onFreq: (f: Frequency | null) => void;
  onTime: (t: string) => void;
  onToggleChannel: (c: Channel) => void;
}) {
  const showTime = freq && freq !== "NEVER" && freq !== "REALTIME";
  return (
    <div className="flex flex-col gap-3 p-4 rounded-cf-md bg-[rgba(80,101,72,0.04)]">
      <div>
        <h3 className="font-medium text-ink text-sm">{title}</h3>
        <p className="text-xs text-ink-muted mt-0.5">{hint}</p>
      </div>

      <FormField label="Cadence">
        {({ id }) => (
          <select
            id={id}
            value={freq ?? ""}
            onChange={(e) =>
              onFreq((e.target.value || null) as Frequency | null)
            }
            className="w-full bg-page rounded-cf-md px-3.5 py-2.5 text-sm text-ink shadow-[inset_0_0_0_1px_var(--cf-hairline)] focus:shadow-[inset_0_0_0_1px_rgba(80,101,72,0.45)] transition-shadow"
          >
            <option value="">— not set —</option>
            {FREQUENCIES.map((f) => (
              <option key={f} value={f}>
                {FREQ_LABEL[f]}
              </option>
            ))}
          </select>
        )}
      </FormField>

      {showTime && (
        <FormField
          label="Preferred delivery time"
          hint="Local time, 24-hour. Used for scheduled digests."
        >
          {({ id }) => (
            <Input
              id={id}
              type="time"
              value={time ?? ""}
              onChange={(e) => onTime(e.target.value)}
            />
          )}
        </FormField>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs font-medium text-ink-muted tracking-wide">
          Channels
        </legend>
        <label className="inline-flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={channels.includes("EMAIL")}
            onChange={() => onToggleChannel("EMAIL")}
          />
          Email
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-ink-subtle">
          <input type="checkbox" disabled />
          SMS <span className="text-xs">(coming soon)</span>
        </label>
      </fieldset>
    </div>
  );
}
