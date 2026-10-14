import type { DataMetric, Finding } from "@/lib/types";

/**
 * Which worked-out metrics to draw on a real investigation's overview: trends
 * over time from the evidence the findings rest on, the ones closest to what the
 * findings measured first. Each chart has one axis, so a metric that mixes
 * scales (orders and revenue) shows its first measure only, and at most four
 * lines (the four that moved most; the table keeps them all).
 */

export type ChartSpec = {
  key: string;
  evidenceId: string;
  title: string;
  unit: string;
  /** x labels, oldest first. */
  periods: string[];
  series: { name: string; values: (number | null)[] }[];
  /** All series, for the table view. */
  metric: DataMetric;
  note?: string;
};

const MAX_CHARTS = 2;
const MAX_SERIES = 4;
const TIME_LIKE = /^(Week of )?\d{4}-\d{2}(-\d{2})?$/;

const words = (s: string) => new Set(s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2));

function toSpec(evidenceId: string, m: DataMetric): ChartSpec | null {
  if (m.rows.length < 3 || !m.rows.every((r) => TIME_LIKE.test(String(r[0])))) return null;
  let series = m.columns.slice(1).map((name, i) => ({
    name,
    values: m.rows.map((r) => (typeof r[i + 1] === "number" ? (r[i + 1] as number) : null)),
  }));
  series = series.filter((s) => s.values.filter((v) => v !== null).length >= 2);
  if (!series.length) return null;

  let note: string | undefined;
  const peaks = series.map((s) => Math.max(...s.values.map((v) => Math.abs(v ?? 0))));
  if (Math.max(...peaks) > 10 * Math.max(Math.min(...peaks), 1e-9) && series.length > 1) {
    series = series.slice(0, 1);
    note = "Showing the first measure; the others are on a different scale and are in the table.";
  } else if (series.length > MAX_SERIES) {
    const moved = (s: (typeof series)[number]) => {
      const vals = s.values.filter((v): v is number => v !== null);
      return Math.abs(vals[vals.length - 1] - vals[0]) / Math.max(Math.abs(vals[0]), 1e-9);
    };
    const keep = new Set([...series].sort((a, b) => moved(b) - moved(a)).slice(0, MAX_SERIES).map((s) => s.name));
    note = `Showing the ${MAX_SERIES} that changed most of ${series.length}; all are in the table.`;
    series = series.filter((s) => keep.has(s.name));
  }
  return { key: `${evidenceId}:${m.id}`, evidenceId, title: m.title, unit: m.unit, periods: m.rows.map((r) => String(r[0])), series, metric: m, note };
}

export function pickCharts(sources: { evidenceId: string; metrics?: DataMetric[] }[], findings: Finding[]): ChartSpec[] {
  const cited = new Set(findings.flatMap((f) => f.evidenceIds));
  const measures = findings.filter((f) => f.observed?.measure).map((f) => words(f.observed!.measure));
  const scored = sources.flatMap((s) =>
    (s.metrics ?? []).flatMap((m) => {
      const spec = toSpec(s.evidenceId, m);
      if (!spec) return [];
      const title = words(m.title);
      const overlap = Math.max(0, ...measures.map((w) => [...w].filter((x) => title.has(x)).length));
      const score = overlap * 10 + (cited.has(s.evidenceId) ? 5 : 0) + (spec.series.length > 1 ? 2 : 0);
      return [{ spec, score }];
    }),
  );
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_CHARTS)
    .map((x) => x.spec);
}

/** "Week of 2026-06-29" → "29 Jun"; "2026-07" → "Jul 26". */
export function shortPeriod(label: string): string {
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const m = label.match(/(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (!m) return label;
  const month = MONTHS[Number(m[2]) - 1];
  return m[3] ? `${Number(m[3])} ${month}` : `${month} ${m[1].slice(2)}`;
}
