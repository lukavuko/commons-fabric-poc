import { useEffect, useState } from "react";
import { gqlFetch } from "@/lib/graphql";
import { useMe } from "@/lib/useMe";
import { SiteNav } from "@/components/SiteNav";
import { EventTile, type EventTileEvent } from "@/components/EventTile";
import { EventPopup, type EventRow } from "@/components/EventPopup";

const MY_CALENDAR = `
  query MyCalendar($fromDate: DateTime, $toDate: DateTime) {
    myCalendar(fromDate: $fromDate, toDate: $toDate) {
      id title subtitle description startsAt endsAt location eventType
      releaseStatus tags rsvpCount myRsvp
      community { id name }
    }
  }
`;

type CalendarEvent = EventRow & {
  community: { id: string; name: string };
};

function groupByDate(events: CalendarEvent[]) {
  const groups: { date: string; events: CalendarEvent[] }[] = [];
  for (const ev of events) {
    const key = ev.startsAt
      ? new Date(ev.startsAt).toLocaleDateString("en-CA", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "No date";
    const last = groups[groups.length - 1];
    if (last?.date === key) {
      last.events.push(ev);
    } else {
      groups.push({ date: key, events: [ev] });
    }
  }
  return groups;
}

export default function Calendar() {
  const me = useMe();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [popup, setPopup] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    if (me.loading || !me.isAuthenticated) return;
    const from = new Date().toISOString();
    const to = new Date(Date.now() + 90 * 86_400_000).toISOString();
    gqlFetch<{ myCalendar: CalendarEvent[] }>(MY_CALENDAR, {
      fromDate: from,
      toDate: to,
    })
      .then((d) => setEvents(d.myCalendar))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load."),
      )
      .finally(() => setLoading(false));
  }, [me.loading, me.isAuthenticated]);

  const groups = groupByDate(events);

  return (
    <div className="max-w-[1200px] w-full mx-auto px-8 flex-1 flex flex-col">
      <SiteNav />

      <main className="flex-1">
        <header className="mb-8">
          <h1 className="font-display text-5xl font-medium text-ink mb-2 tracking-tight">
            My calendar
          </h1>
          <p className="text-ink-muted text-lg">
            Upcoming events from your subscriptions.
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
          <div className="flex flex-col gap-8">
            {groups.map((g) => (
              <section key={g.date}>
                <h2 className="font-display text-lg font-medium text-ink mb-3">
                  {g.date}
                </h2>
                <ul className="flex flex-col gap-3">
                  {g.events.map((ev) => (
                    <li key={ev.id}>
                      <EventTile
                        event={ev}
                        onClick={() => setPopup(ev)}
                        showCommunityName
                        communityName={ev.community.name}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
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
