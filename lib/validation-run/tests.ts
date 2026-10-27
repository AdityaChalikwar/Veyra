import { guessDayFirst, parseDate, parseNumber } from "@/lib/analysis/profile";
import { chiSquare, mean, pearson, significance, twoProportions, welch } from "./stats";

/**
 * Veyra's data tests. Claude chooses which test answers which piece of evidence
 * and with which columns; everything here runs in code on the actual rows, so
 * every figure in a result was calculated, never written by the model.
 */

export const TEST_KINDS = {
  "before-after": "Before vs after a date",
  "segment-change": "Change by group",
  "rate-compare": "Share compared",
  correlation: "Two measures together",
  "category-shift": "Mix of categories before vs after",
  "group-compare": "Groups compared over the same days",
} as const;
export type TestKind = keyof typeof TEST_KINDS;

/** What Claude asks for. Empty strings mean "not used". Columns must exist in the dataset. */
export type TestSpec = {
  kind: TestKind;
  /** A measure column to sum or average per day; empty = count rows. */
  metric: string;
  /** Second measure, for correlation. */
  metricB: string;
  dateColumn: string;
  /** ISO date the "after" period starts. */
  splitDate: string;
  groupColumn: string;
  filterColumn: string;
  filterValue: string;
  /** For rate-compare: the column and value that count as a "hit" (e.g. status = crashed). */
  hitColumn: string;
  hitValue: string;
  aggregate: "sum" | "mean";
  /** Days each side of the split; 0 = as many as the data has (up to 90). */
  windowDays: number;
};

export type Table = { headers: string[]; rows: string[][] };

export type TestOutcome =
  | {
      ok: true;
      title: string;
      /** Plain English, figures from the calculation. */
      summary: string;
      figures: { label: string; value: string }[];
      p?: number;
      /** % change, where the test has one. */
      change?: number;
      sample: string;
    }
  | { ok: false; title: string; reason: string };

const fmt = (n: number, digits?: number) =>
  Number.isFinite(n) ? n.toLocaleString("en-GB", { maximumFractionDigits: digits ?? (Math.abs(n) >= 100 ? 0 : Math.abs(n) >= 10 ? 1 : 2) }) : "–";
const pct = (n: number) => `${n > 0 ? "+" : ""}${fmt(n, 1)}%`;
const fmtDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const addDays = (iso: string, days: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Resolves column names case-insensitively; returns -1 when missing. */
function col(t: Table, name: string): number {
  if (!name) return -1;
  return t.headers.findIndex((h) => same(h, name));
}

type Ctx = { t: Table; spec: TestSpec; dateIdx: number; dayFirst: boolean };

function setup(t: Table, spec: TestSpec): Ctx | { error: string } {
  const dateIdx = col(t, spec.dateColumn);
  if (spec.dateColumn && dateIdx < 0) return { error: `The dataset has no column "${spec.dateColumn}".` };
  for (const c of [spec.metric, spec.metricB, spec.groupColumn, spec.filterColumn, spec.hitColumn]) {
    if (c && col(t, c) < 0) return { error: `The dataset has no column "${c}".` };
  }
  const dayFirst = dateIdx >= 0 ? guessDayFirst(t.rows.slice(0, 500).map((r) => r[dateIdx] ?? "")).dayFirst : true;
  return { t, spec, dateIdx, dayFirst };
}

function rowsOf(c: Ctx): string[][] {
  const f = col(c.t, c.spec.filterColumn);
  return f >= 0 && c.spec.filterValue ? c.t.rows.filter((r) => same(r[f] ?? "", c.spec.filterValue)) : c.t.rows;
}

/** Per-day totals (or means) of the metric, or the row count. */
function daily(c: Ctx, rows: string[][], metric = c.spec.metric): Map<string, number> {
  const m = col(c.t, metric);
  const sums = new Map<string, { sum: number; n: number }>();
  for (const r of rows) {
    const day = parseDate(r[c.dateIdx] ?? "", c.dayFirst);
    if (!day) continue;
    const v = m >= 0 ? parseNumber(r[m] ?? "") : 1;
    if (v === null) continue;
    const s = sums.get(day) ?? { sum: 0, n: 0 };
    s.sum += v;
    s.n += 1;
    sums.set(day, s);
  }
  return new Map([...sums].map(([d, s]) => [d, c.spec.aggregate === "mean" && m >= 0 ? s.sum / s.n : s.sum]));
}

/** Splits a daily series around the split date, within the window. */
function split(series: Map<string, number>, splitDate: string, windowDays: number) {
  const days = [...series.keys()].sort();
  const w = windowDays > 0 ? Math.min(windowDays, 90) : 90;
  const from = addDays(splitDate, -w);
  const to = addDays(splitDate, w - 1);
  const before = days.filter((d) => d < splitDate && d >= from);
  const after = days.filter((d) => d >= splitDate && d <= to);
  return { before: before.map((d) => series.get(d)!), after: after.map((d) => series.get(d)!), beforeDays: before, afterDays: after };
}

const what = (spec: TestSpec) => (spec.metric ? `${spec.aggregate === "mean" ? "Average" : "Daily"} ${spec.metric}` : "Rows per day");
const filtered = (spec: TestSpec) => (spec.filterColumn && spec.filterValue ? ` (${spec.filterColumn} = ${spec.filterValue})` : "");
const isoDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

function beforeAfter(c: Ctx): TestOutcome {
  const title = `${what(c.spec)}${filtered(c.spec)} before vs after ${fmtDate(c.spec.splitDate)}`;
  if (c.dateIdx < 0 || !isoDate(c.spec.splitDate)) return { ok: false, title, reason: "This test needs a date column and a split date." };
  const s = split(daily(c, rowsOf(c)), c.spec.splitDate, c.spec.windowDays);
  if (s.before.length < 3 || s.after.length < 3) return { ok: false, title, reason: "Fewer than 3 days of data on one side of the date." };
  const a = mean(s.before);
  const b = mean(s.after);
  const change = a ? ((b - a) / Math.abs(a)) * 100 : NaN;
  const w = welch(s.before, s.after);
  return {
    ok: true,
    title,
    summary: `${what(c.spec)}${filtered(c.spec)} averaged ${fmt(a)} a day before ${fmtDate(c.spec.splitDate)} and ${fmt(b)} after (${pct(change)}); ${significance(w?.p)}.`,
    figures: [
      { label: "Before (daily average)", value: fmt(a) },
      { label: "After (daily average)", value: fmt(b) },
      { label: "Change", value: pct(change) },
    ],
    p: w?.p,
    change,
    sample: `${s.before.length} days before (${fmtDate(s.beforeDays[0])} – ${fmtDate(s.beforeDays.at(-1)!)}), ${s.after.length} days after (${fmtDate(s.afterDays[0])} – ${fmtDate(s.afterDays.at(-1)!)})`,
  };
}

function segmentChange(c: Ctx): TestOutcome {
  const title = `${what(c.spec)}${filtered(c.spec)} by ${c.spec.groupColumn} before vs after ${fmtDate(c.spec.splitDate)}`;
  const g = col(c.t, c.spec.groupColumn);
  if (c.dateIdx < 0 || g < 0 || !isoDate(c.spec.splitDate)) return { ok: false, title, reason: "This test needs a date column, a group column and a split date." };
  const groups = new Map<string, string[][]>();
  for (const r of rowsOf(c)) {
    const k = (r[g] ?? "").trim() || "(blank)";
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  const lines = [...groups]
    .map(([k, rows]) => {
      const s = split(daily(c, rows), c.spec.splitDate, c.spec.windowDays);
      const a = mean(s.before);
      const b = mean(s.after);
      return { k, a, b, change: a ? ((b - a) / Math.abs(a)) * 100 : NaN, p: welch(s.before, s.after)?.p, n: s.before.length + s.after.length };
    })
    .filter((l) => l.n >= 6 && Number.isFinite(l.a))
    .sort((x, y) => y.a - x.a)
    .slice(0, 8);
  if (lines.length < 2) return { ok: false, title, reason: "Fewer than two groups have enough days on both sides of the date." };
  const most = [...lines].sort((x, y) => Math.abs(y.change) - Math.abs(x.change))[0];
  return {
    ok: true,
    title,
    summary: `Biggest change: ${most.k}, ${fmt(most.a)} → ${fmt(most.b)} a day (${pct(most.change)}; ${significance(most.p)}). ${lines
      .filter((l) => l !== most)
      .map((l) => `${l.k}: ${fmt(l.a)} → ${fmt(l.b)} (${pct(l.change)})`)
      .join("; ")}.`,
    figures: lines.map((l) => ({ label: l.k, value: `${fmt(l.a)} → ${fmt(l.b)} (${pct(l.change)})` })),
    p: most.p,
    change: most.change,
    sample: `${lines.length} groups, daily values around ${fmtDate(c.spec.splitDate)}`,
  };
}

function rateCompare(c: Ctx): TestOutcome {
  const h = col(c.t, c.spec.hitColumn);
  const title = `Share of rows with ${c.spec.hitColumn} = ${c.spec.hitValue}${filtered(c.spec)}${c.spec.groupColumn ? ` by ${c.spec.groupColumn}` : ` before vs after ${fmtDate(c.spec.splitDate)}`}`;
  if (h < 0 || !c.spec.hitValue) return { ok: false, title, reason: "This test needs the column and value that count as a hit." };
  const rows = rowsOf(c);
  let sides: { label: string; rows: string[][] }[];
  const g = col(c.t, c.spec.groupColumn);
  if (g >= 0) {
    const groups = new Map<string, string[][]>();
    for (const r of rows) groups.set((r[g] ?? "").trim() || "(blank)", [...(groups.get((r[g] ?? "").trim() || "(blank)") ?? []), r]);
    sides = [...groups].map(([label, rs]) => ({ label, rows: rs })).sort((a, b) => b.rows.length - a.rows.length).slice(0, 2);
  } else if (c.dateIdx >= 0 && isoDate(c.spec.splitDate)) {
    const day = (r: string[]) => parseDate(r[c.dateIdx] ?? "", c.dayFirst);
    sides = [
      { label: `Before ${fmtDate(c.spec.splitDate)}`, rows: rows.filter((r) => (day(r) ?? "") < c.spec.splitDate && !!day(r)) },
      { label: `From ${fmtDate(c.spec.splitDate)}`, rows: rows.filter((r) => (day(r) ?? "") >= c.spec.splitDate) },
    ];
  } else return { ok: false, title, reason: "This test needs a group column, or a date column and split date." };
  if (sides.length < 2) return { ok: false, title, reason: "Only one group has data." };
  const hits = sides.map((s) => s.rows.filter((r) => same(r[h] ?? "", c.spec.hitValue)).length);
  const n = sides.map((s) => s.rows.length);
  const test = twoProportions(hits[0], n[0], hits[1], n[1]);
  if (!test) return { ok: false, title, reason: "Fewer than 10 rows on one side." };
  const share = (i: number) => (hits[i] / n[i]) * 100;
  return {
    ok: true,
    title,
    summary: `${sides[0].label}: ${fmt(share(0), 1)}% (${fmt(hits[0])} of ${fmt(n[0])}); ${sides[1].label}: ${fmt(share(1), 1)}% (${fmt(hits[1])} of ${fmt(n[1])}); ${significance(test.p)}.`,
    figures: sides.map((s, i) => ({ label: s.label, value: `${fmt(share(i), 1)}% (${fmt(hits[i])} of ${fmt(n[i])})` })),
    p: test.p,
    change: share(0) ? ((share(1) - share(0)) / share(0)) * 100 : undefined,
    sample: `${fmt(n[0] + n[1])} rows`,
  };
}

function correlation(c: Ctx): TestOutcome {
  const title = `${c.spec.metric} and ${c.spec.metricB} day by day${filtered(c.spec)}`;
  if (c.dateIdx < 0 || !c.spec.metric || !c.spec.metricB) return { ok: false, title, reason: "This test needs a date column and two measures." };
  const rows = rowsOf(c);
  const a = daily(c, rows, c.spec.metric);
  const b = daily(c, rows, c.spec.metricB);
  const days = [...a.keys()].filter((d) => b.has(d)).sort();
  const r = pearson(
    days.map((d) => a.get(d)!),
    days.map((d) => b.get(d)!),
  );
  if (!r) return { ok: false, title, reason: "Fewer than 5 days with both measures." };
  const strength = Math.abs(r.r) >= 0.7 ? "strongly" : Math.abs(r.r) >= 0.4 ? "moderately" : "barely";
  return {
    ok: true,
    title,
    summary: `${c.spec.metric} and ${c.spec.metricB} move ${strength} ${r.r >= 0 ? "together" : "in opposite directions"} (r = ${fmt(r.r, 2)}); ${significance(r.p, "link")}.`,
    figures: [{ label: "Correlation (r)", value: fmt(r.r, 2) }],
    p: r.p,
    sample: `${days.length} days`,
  };
}

/** Groups side by side over the same days (e.g. app versions from a date on): daily values, the top two tested. */
function groupCompare(c: Ctx): TestOutcome {
  const g = col(c.t, c.spec.groupColumn);
  const from = isoDate(c.spec.splitDate) ? c.spec.splitDate : "";
  const title = `${what(c.spec)}${filtered(c.spec)} by ${c.spec.groupColumn}${from ? ` from ${fmtDate(from)}` : ""}`;
  if (c.dateIdx < 0 || g < 0) return { ok: false, title, reason: "This test needs a date column and a group column." };
  const to = from ? addDays(from, (c.spec.windowDays || 90) - 1) : "9999-12-31";
  const groups = new Map<string, string[][]>();
  for (const r of rowsOf(c)) {
    const day = parseDate(r[c.dateIdx] ?? "", c.dayFirst);
    if (!day || (from && (day < from || day > to))) continue;
    const k = (r[g] ?? "").trim() || "(blank)";
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  const lines = [...groups]
    .map(([k, rows]) => {
      const values = [...daily(c, rows).values()];
      return { k, values, m: mean(values) };
    })
    .filter((l) => l.values.length >= 3)
    .sort((x, y) => y.values.length - x.values.length || y.m - x.m)
    .slice(0, 8);
  if (lines.length < 2) return { ok: false, title, reason: "Fewer than two groups have 3 or more days of data in the period." };
  const [a, b] = [...lines.slice(0, 2)].sort((x, y) => x.m - y.m);
  const per = (m: number) => (c.spec.aggregate === "mean" && c.spec.metric ? `${fmt(m)} on average` : `${fmt(m)} a day`);
  const w = welch(a.values, b.values);
  const gap = b.m ? ((a.m - b.m) / Math.abs(b.m)) * 100 : NaN;
  return {
    ok: true,
    title,
    summary: `${lines.map((l) => `${l.k}: ${per(l.m)}`).join("; ")}. ${a.k} vs ${b.k}: ${pct(gap)}; ${significance(w?.p)}.`,
    figures: lines.map((l) => ({ label: l.k, value: `${per(l.m)} (${l.values.length} days)` })),
    p: w?.p,
    change: gap,
    sample: `${lines.reduce((n, l) => n + l.values.length, 0)} group-days${from ? ` from ${fmtDate(from)}` : ""}`,
  };
}

function categoryShift(c: Ctx): TestOutcome {
  const g = col(c.t, c.spec.groupColumn);
  const title = `Mix of ${c.spec.groupColumn}${filtered(c.spec)} before vs after ${fmtDate(c.spec.splitDate)}`;
  if (c.dateIdx < 0 || g < 0 || !isoDate(c.spec.splitDate)) return { ok: false, title, reason: "This test needs a date column, a category column and a split date." };
  const m = col(c.t, c.spec.metric);
  const before = new Map<string, number>();
  const after = new Map<string, number>();
  const from = addDays(c.spec.splitDate, -(c.spec.windowDays || 90));
  const to = addDays(c.spec.splitDate, (c.spec.windowDays || 90) - 1);
  for (const r of rowsOf(c)) {
    const day = parseDate(r[c.dateIdx] ?? "", c.dayFirst);
    if (!day || day < from || day > to) continue;
    const w = m >= 0 ? parseNumber(r[m] ?? "") ?? 0 : 1;
    const k = (r[g] ?? "").trim() || "(blank)";
    const side = day < c.spec.splitDate ? before : after;
    side.set(k, (side.get(k) ?? 0) + w);
  }
  const keys = [...new Set([...before.keys(), ...after.keys()])].sort((a, b) => (before.get(b) ?? 0) + (after.get(b) ?? 0) - (before.get(a) ?? 0) - (after.get(a) ?? 0)).slice(0, 8);
  const bv = keys.map((k) => before.get(k) ?? 0);
  const av = keys.map((k) => after.get(k) ?? 0);
  const test = chiSquare(bv, av);
  if (!test) return { ok: false, title, reason: "Not enough rows on one side of the date." };
  const tb = bv.reduce((a, x) => a + x, 0);
  const ta = av.reduce((a, x) => a + x, 0);
  const shares = keys.map((k, i) => ({ k, b: (bv[i] / tb) * 100, a: (av[i] / ta) * 100 }));
  const moved = [...shares].sort((x, y) => Math.abs(y.a - y.b) - Math.abs(x.a - x.b))[0];
  return {
    ok: true,
    title,
    summary: `The biggest shift is ${moved.k}: ${fmt(moved.b, 1)}% of the total before, ${fmt(moved.a, 1)}% after; ${significance(test.p)}.`,
    figures: shares.map((s) => ({ label: s.k, value: `${fmt(s.b, 1)}% → ${fmt(s.a, 1)}%` })),
    p: test.p,
    sample: `${fmt(tb)} before, ${fmt(ta)} after`,
  };
}

/** Runs one test on a table. Never throws: a test that can't run says why. */
export function runTest(t: Table, spec: TestSpec): TestOutcome {
  const c = setup(t, spec);
  if ("error" in c) return { ok: false, title: TEST_KINDS[spec.kind] ?? "Test", reason: c.error };
  try {
    switch (spec.kind) {
      case "before-after":
        return beforeAfter(c);
      case "segment-change":
        return segmentChange(c);
      case "rate-compare":
        return rateCompare(c);
      case "correlation":
        return correlation(c);
      case "group-compare":
        return groupCompare(c);
      case "category-shift":
        return categoryShift(c);
      default:
        return { ok: false, title: "Test", reason: "Unknown test." };
    }
  } catch (e) {
    console.error("validation test failed", e);
    return { ok: false, title: TEST_KINDS[spec.kind], reason: "The calculation failed on this data." };
  }
}
