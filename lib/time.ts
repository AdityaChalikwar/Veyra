const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** ISO timestamp for a moment in the past, relative to now. Used by mock data. */
export function ago({ minutes = 0, hours = 0, days = 0 }: { minutes?: number; hours?: number; days?: number }) {
  return new Date(Date.now() - minutes * MINUTE - hours * HOUR - days * DAY).toISOString();
}

export function formatRelative(iso: string, now = Date.now()) {
  const diff = now - new Date(iso).getTime();
  if (diff < HOUR) {
    const m = Math.max(1, Math.round(diff / MINUTE));
    return `${m} minute${m === 1 ? "" : "s"} ago`;
  }
  if (diff < DAY) {
    const h = Math.round(diff / HOUR);
    return `${h} hour${h === 1 ? "" : "s"} ago`;
  }
  const d = Math.round(diff / DAY);
  if (d < 7) return d === 1 ? "Yesterday" : `${d} days ago`;
  if (d < 30) {
    const w = Math.round(d / 7);
    return `${w} week${w === 1 ? "" : "s"} ago`;
  }
  return formatDate(iso);
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
