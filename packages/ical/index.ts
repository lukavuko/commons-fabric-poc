import ical, { ICalEventRepeatingFreq, ICalWeekday } from "ical-generator";

export type EventData = {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startsAt?: string | Date | null;
  endsAt?: string | Date | null;
  recurring?: string | null;
  recurringDow?: string[];
};

const FREQ_MAP: Record<string, ICalEventRepeatingFreq> = {
  DAILY: ICalEventRepeatingFreq.DAILY,
  WEEKLY: ICalEventRepeatingFreq.WEEKLY,
  BIWEEKLY: ICalEventRepeatingFreq.WEEKLY,
  MONTHLY: ICalEventRepeatingFreq.MONTHLY,
  ANNUAL: ICalEventRepeatingFreq.YEARLY,
};

const DAY_MAP: Record<string, ICalWeekday> = {
  MONDAY: ICalWeekday.MO,
  TUESDAY: ICalWeekday.TU,
  WEDNESDAY: ICalWeekday.WE,
  THURSDAY: ICalWeekday.TH,
  FRIDAY: ICalWeekday.FR,
  SATURDAY: ICalWeekday.SA,
  SUNDAY: ICalWeekday.SU,
};

export function generateIcal(event: EventData): string {
  const cal = ical({ name: "Commons Fabric" });

  const start = event.startsAt ? new Date(event.startsAt) : new Date();
  const end = event.endsAt ? new Date(event.endsAt) : undefined;

  const vevent = cal.createEvent({
    id: event.id,
    summary: event.title,
    description: event.description ?? undefined,
    location: event.location ?? undefined,
    start,
    end,
  });

  if (event.recurring && FREQ_MAP[event.recurring]) {
    const freq = FREQ_MAP[event.recurring];
    const byDay =
      event.recurringDow
        ?.map((d) => DAY_MAP[d])
        .filter((d): d is ICalWeekday => !!d) ?? [];

    vevent.repeating({
      freq,
      interval: event.recurring === "BIWEEKLY" ? 2 : 1,
      ...(byDay.length > 0 ? { byDay } : {}),
    });
  }

  return cal.toString();
}
