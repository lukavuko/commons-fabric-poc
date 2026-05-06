export function fmt(iso?: string | null) {
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

export function toDatetimeLocal(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 16);
}
