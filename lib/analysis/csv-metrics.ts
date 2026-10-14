import type { DataMetric, DatasetProfile } from "@/lib/types";
import { guessDayFirst, parseDate, parseNumber } from "./profile";

/**
 * Structured observations for an uploaded CSV, worked out in code: how each
 * measure moves over time, and how the main one splits by category (e.g. by
 * platform). The AI reads these numbers; it never calculates them. Files
 * without a date column get none, and the pack says so.
 *
 * Rows sharing a date are added up into a daily total first (one row per
 * platform per day is common), then averaged per week or month. Averages and
 * rates (avg_*, *_rate, *_pct, minutes…) are averaged, never added.
 */

const MAX_MEASURES = 4;
const MAX_BREAKDOWNS = 2;
const MAX_CATEGORIES = 8;
const AVERAGE_LIKE = /avg|average|mean|rate|ratio|pct|percent|share|minutes|seconds|duration|score|price|median/i;

type Bucket = { key: string; label: string };

export function computeCsvMetrics(table: { headers: string[]; rows: string[][] }, profile: DatasetProfile): DataMetric[] {
  const dateIdx = profile.dateColumn ? table.headers.indexOf(profile.dateColumn) : -1;
  if (dateIdx < 0 || !profile.dateRange) return [];

  const measures = profile.columns
    .map((c, i) => ({ c, i }))
    .filter(({ c, i }) => c.type === "number" && i !== dateIdx && !/(^|_)(id|year|month|week|day)$/i.test(c.name))
    .slice(0, MAX_MEASURES);
  if (!measures.length) return [];

  const dayFirst = guessDayFirst(table.rows.slice(0, 500).map((r) => r[dateIdx] ?? "")).dayFirst;
  const spanDays = (Date.parse(profile.dateRange.to) - Date.parse(profile.dateRange.from)) / 86_400_000;
  const weekly = spanDays <= 183;
  const bucketOf = (iso: string): Bucket => {
    if (!weekly) return { key: iso.slice(0, 7), label: iso.slice(0, 7) };
    const d = new Date(`${iso}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); // back to Monday
    const monday = d.toISOString().slice(0, 10);
    return { key: monday, label: `Week of ${monday}` };
  };

  // Parse once: the date of each row, and its bucket.
  const dated = table.rows
    .map((r) => ({ r, date: parseDate(r[dateIdx] ?? "", dayFirst) }))
    .filter((x): x is { r: string[]; date: string } => !!x.date);
  if (dated.length < 2) return [];
  const buckets = new Map<string, Bucket>();
  for (const x of dated) {
    const b = bucketOf(x.date);
    if (!buckets.has(b.key)) buckets.set(b.key, b);
  }
  const ordered = [...buckets.values()].sort((a, b) => a.key.localeCompare(b.key));
  if (ordered.length < 2) return [];

  /** Per bucket: each measure's value for a set of rows (daily totals averaged, or plain averages). */
  const series = (rows: typeof dated, col: number, averageLike: boolean): Map<string, number> => {
    const perDay = new Map<string, { sum: number; n: number }>();
    for (const x of rows) {
      const v = parseNumber(x.r[col] ?? "");
      if (v === null) continue;
      const cur = perDay.get(x.date) ?? { sum: 0, n: 0 };
      cur.sum += v;
      cur.n += 1;
      perDay.set(x.date, cur);
    }
    const perBucket = new Map<string, { sum: number; n: number }>();
    for (const [date, { sum, n }] of perDay) {
      const key = bucketOf(date).key;
      const cur = perBucket.get(key) ?? { sum: 0, n: 0 };
      cur.sum += averageLike ? sum / n : sum;
      cur.n += 1;
      perBucket.set(key, cur);
    }
    return new Map([...perBucket].map(([k, { sum, n }]) => [k, round(sum / n)]));
  };

  const period = weekly ? "week" : "month";
  const metrics: DataMetric[] = [];

  const trend = measures.map(({ c, i }) => ({ name: c.name, values: series(dated, i, AVERAGE_LIKE.test(c.name)), averageLike: AVERAGE_LIKE.test(c.name) }));
  metrics.push({
    id: "trend",
    title: `${trend.map((t) => t.name).join(", ")} by ${period}`,
    unit: `daily average per ${period}`,
    columns: [period === "week" ? "Week" : "Month", ...trend.map((t) => t.name)],
    rows: ordered.map((b) => [b.label, ...trend.map((t) => t.values.get(b.key) ?? "")]),
    note:
      "Worked out in code. Rows on the same date are added up into a daily total, then averaged over the days in each period" +
      (trend.some((t) => t.averageLike) ? "; averages and rates are averaged, not added." : ".") +
      (ordered.length > 1 ? ` First and last ${period} may be partial.` : ""),
  });

  // Breakdowns: the main measure split by each small category column.
  const main = measures.find(({ c }) => !AVERAGE_LIKE.test(c.name)) ?? measures[0];
  const categories = profile.columns
    .map((c, i) => ({ c, i }))
    .filter(({ c, i }) => i !== dateIdx && (c.type === "category" || c.type === "text" || c.type === "boolean") && c.distinct >= 2 && c.distinct <= MAX_CATEGORIES)
    .slice(0, MAX_BREAKDOWNS);
  for (const { c, i } of categories) {
    const values = [...new Set(dated.map((x) => (x.r[i] ?? "").trim()).filter(Boolean))].sort();
    const per = values.map((v) => ({ v, s: series(dated.filter((x) => (x.r[i] ?? "").trim() === v), main.i, AVERAGE_LIKE.test(main.c.name)) }));
    metrics.push({
      id: `by-${c.name}`,
      title: `${main.c.name} by ${c.name}, by ${period}`,
      unit: `daily average per ${period}`,
      columns: [period === "week" ? "Week" : "Month", ...values],
      rows: ordered.map((b) => [b.label, ...per.map((p) => p.s.get(b.key) ?? "")]),
      note: `Worked out in code: ${main.c.name} for each ${c.name} value, averaged over the days it appears in each ${period}.`,
    });
  }
  return metrics;
}

function round(n: number): number {
  return Math.abs(n) >= 100 ? Math.round(n) : Math.round(n * 100) / 100;
}
