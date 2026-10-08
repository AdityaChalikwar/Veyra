/** Number and date wording shared by the profiler and the evidence cards (safe in the browser). */

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
export const fmtInt = (n: number) => n.toLocaleString("en");
export const pct = (share: number) => `${Math.round(share * 100)}%`;
export const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export function formatNumber(n: number): string {
  if (Math.abs(n) >= 10_000) return compact.format(n);
  return Number.isInteger(n) ? fmtInt(n) : n.toLocaleString("en", { maximumFractionDigits: 2 });
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDay(isoDate: string, withYear = true): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return `${d} ${MONTH_NAMES[m - 1]}${withYear ? ` ${y}` : ""}`;
}

/** "1 Jun – 28 Sep 2026", or with both years when they differ. */
export function formatRange(from: string, to: string): string {
  if (from === to) return formatDay(from);
  const sameYear = from.slice(0, 4) === to.slice(0, 4);
  return `${formatDay(from, !sameYear)} – ${formatDay(to)}`;
}
