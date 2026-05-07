import type { TypeColor } from "@/lib/calendar";

export function EventTypeFilter({
  types,
  colorMap,
  activeTypes,
  onToggle,
}: {
  types: string[];
  colorMap: Map<string, TypeColor>;
  activeTypes: Set<string>;
  onToggle: (type: string) => void;
}) {
  if (types.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {types.map((t) => {
        const active = activeTypes.has(t);
        const color = colorMap.get(t);
        return (
          <button
            key={t}
            type="button"
            onClick={() => onToggle(t)}
            className={`rounded-cf-pill px-3 py-1 text-xs font-medium transition-all duration-100 ${
              active
                ? "bg-surface-sunken text-ink"
                : "bg-transparent text-ink-subtle border border-[var(--cf-hairline)] opacity-60"
            }`}
            style={
              active && color
                ? { backgroundColor: color.bg, color: color.text }
                : undefined
            }
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}
