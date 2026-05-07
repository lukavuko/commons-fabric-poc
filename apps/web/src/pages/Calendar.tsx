import { useEffect, useState } from "react";
import { gqlFetch } from "@/lib/graphql";
import { useMe } from "@/lib/useMe";
import { SiteNav } from "@/components/SiteNav";
import { CommunityCalendar } from "@/components/CommunityCalendar";
import { EventPopup, type EventRow } from "@/components/EventPopup";

const MY_CALENDAR = `
  query MyCalendar {
    myCalendar {
      id title subtitle description startsAt endsAt location eventType
      releaseStatus tags rsvpCount myRsvp
      community { id name }
    }
  }
`;

type CalendarEvent = EventRow & {
  community: { id: string; name: string };
};

export default function Calendar() {
  const me = useMe();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [popup, setPopup] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    if (me.loading || !me.isAuthenticated) return;
    gqlFetch<{ myCalendar: CalendarEvent[] }>(MY_CALENDAR)
      .then((d) => setEvents(d.myCalendar))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load."),
      )
      .finally(() => setLoading(false));
  }, [me.loading, me.isAuthenticated]);

  return (
    <div className="max-w-[920px] w-full mx-auto px-8 flex-1 flex flex-col">
      <SiteNav />

      <main className="flex-1">
        <header className="mb-8">
          <h1 className="font-display text-5xl font-medium text-ink mb-2 tracking-tight">
            My calendar
          </h1>
          <p className="text-ink-muted text-lg">
            Upcoming events from your subscriptions and memberships.
          </p>
        </header>

        {me.loading || loading ? (
          <p className="text-sm text-ink-muted">Loading…</p>
        ) : !me.isAuthenticated ? (
          <p className="text-sm text-ink-muted">
            Sign in to see your calendar.
          </p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-ink-muted">
            No upcoming events. Subscribe to communities to see their events
            here.
          </p>
        ) : (
          <CommunityCalendar
            events={events}
            canEdit={false}
            onEventClick={(ev) =>
              setPopup(events.find((e) => e.id === ev.id) ?? null)
            }
          />
        )}
      </main>

      {popup && (
        <EventPopup
          event={popup}
          canEdit={false}
          isAuthenticated={me.isAuthenticated}
          onClose={() => setPopup(null)}
          onUpdated={(updated) => {
            setEvents((prev) =>
              prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e)),
            );
            setPopup(null);
          }}
        />
      )}
    </div>
  );
}
