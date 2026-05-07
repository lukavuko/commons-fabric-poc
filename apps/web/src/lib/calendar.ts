export type DayCell = {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  key: string;
};

export function buildMonthGrid(year: number, month: number): DayCell[][] {
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  const firstOfMonth = new Date(year, month, 1);
  const startDay = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startDay);

  const weeks: DayCell[][] = [];
  const cursor = new Date(gridStart);

  for (let w = 0; w < 6; w++) {
    const week: DayCell[] = [];
    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(cursor);
      const cellKey = `${cellDate.getFullYear()}-${cellDate.getMonth()}-${cellDate.getDate()}`;
      week.push({
        date: cellDate,
        day: cellDate.getDate(),
        isCurrentMonth: cellDate.getMonth() === month,
        isToday: cellKey === todayKey,
        key: cellKey,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  return weeks;
}

const TYPE_COLORS = [
  { bg: "rgba(80,101,72,0.12)", text: "var(--cf-sage-deep)", dot: "#506548" },
  { bg: "rgba(196,154,130,0.18)", text: "var(--cf-clay-deep)", dot: "#8c5a3f" },
  { bg: "rgba(228,194,106,0.15)", text: "#8a7230", dot: "#8a7230" },
  { bg: "rgba(47,53,44,0.08)", text: "var(--cf-ink-muted)", dot: "#65695a" },
] as const;

export type TypeColor = (typeof TYPE_COLORS)[number];

export function assignTypeColors(eventTypes: string[]): Map<string, TypeColor> {
  const map = new Map<string, TypeColor>();
  for (const t of eventTypes) {
    if (!map.has(t)) {
      map.set(t, TYPE_COLORS[map.size % TYPE_COLORS.length]);
    }
  }
  return map;
}

export function dateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
