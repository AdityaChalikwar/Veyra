import Papa from "papaparse";
import type { ColumnProfile, ColumnType, DatasetProfile } from "@/lib/types";
import { clip, fmtInt, formatNumber, formatRange, pct } from "./format";

export { formatNumber, formatRange } from "./format";

/**
 * Describes an uploaded CSV: columns, types, totals, the period it covers and
 * anything that looks wrong. Plain code, no AI — so every number Veyra later
 * reasons about can be traced back to a calculation.
 */

export const MAX_ROWS = 200_000;
const PREVIEW_ROWS = 8;
const DISTINCT_CAP = 10_000;
/** Share of filled values that must parse for a column to get a type. */
const TYPE_THRESHOLD = 0.95;

const EMPTY_TOKENS = new Set(["", "na", "n/a", "null", "none", "-", "—", "nan", "#n/a"]);
const BOOLEAN_TOKENS = new Set(["true", "false", "yes", "no", "y", "n"]);

export type ProfileResult = { ok: true; profile: DatasetProfile; summary: string; coverage?: string } | { ok: false; error: string };

export function profileCsv(raw: string): ProfileResult {
  const text = raw.replace(/^﻿/, "");
  if (!text.trim()) return { ok: false, error: "The file is empty." };

  const parsed = Papa.parse<string[]>(text, { skipEmptyLines: "greedy" });
  const data = parsed.data.filter((r) => Array.isArray(r));
  if (data.length === 0) return { ok: false, error: "Veyra couldn't find any rows in this file." };
  if (data.length === 1) return { ok: false, error: "The file has column names but no rows of data." };

  const headers = cleanHeaders(data[0]);
  if (headers.length < 1) return { ok: false, error: "Veyra couldn't find any columns in this file." };
  const allRows = data.slice(1);
  const truncated = allRows.length > MAX_ROWS;
  const rows = truncated ? allRows.slice(0, MAX_ROWS) : allRows;

  const issues: string[] = [];
  if (text.includes("\uFFFD")) {
    issues.push("Some characters couldn't be read. If names look garbled, save the file as “CSV UTF-8” and upload it again.");
  }
  if (headers.length === 1 && rows.some((r) => r.length > 1)) {
    issues.push("Only one column was found. If the file uses an unusual separator, export it again as a standard CSV.");
  }
  if (headers.every((h) => parseNumber(h) !== null)) {
    issues.push("The first row looks like data, not column names. Check that the file has a header row.");
  }
  const ragged = rows.filter((r) => r.length !== headers.length).length;
  if (ragged > 0) {
    issues.push(
      `${fmtInt(ragged)} ${ragged === 1 ? "row has" : "rows have"} a different number of values than there are columns; extra values were ignored and missing ones left blank.`,
    );
  }
  if (truncated) {
    issues.push(`The file has ${fmtInt(allRows.length)} rows. Veyra read the first ${fmtInt(MAX_ROWS)}.`);
  }

  const columns = headers.map((name, i) => profileColumn(name, rows.map((r) => (r[i] ?? "").trim()), rows.length, issues));

  const dateColumn = pickDateColumn(columns);
  const dateRange = dateColumn?.date;
  if (!dateColumn && rows.length > 0) issues.push("No date column was found, so Veyra can't tell what period this data covers.");

  const profile: DatasetProfile = {
    rowCount: rows.length,
    columnCount: headers.length,
    columns,
    dateColumn: dateColumn?.name,
    dateRange,
    issues,
    preview: {
      columns: headers,
      rows: rows.slice(0, PREVIEW_ROWS).map((r) => headers.map((_, i) => clip(r[i] ?? "", 60))),
    },
    truncated,
  };
  const coverage = dateRange ? formatRange(dateRange.from, dateRange.to) : undefined;
  return { ok: true, profile, summary: describe(profile, coverage), coverage };
}

/* ── Columns ────────────────────────────────────────────────────────── */

function cleanHeaders(row: string[]): string[] {
  const seen = new Map<string, number>();
  return row.map((h, i) => {
    let name = String(h ?? "").trim() || `Column ${i + 1}`;
    const n = seen.get(name.toLowerCase()) ?? 0;
    seen.set(name.toLowerCase(), n + 1);
    if (n > 0) name = `${name} (${n + 1})`;
    return name;
  });
}

function profileColumn(name: string, raw: string[], rowCount: number, issues: string[]): ColumnProfile {
  const values = raw.filter((v) => !EMPTY_TOKENS.has(v.toLowerCase()));
  const filled = values.length;
  const distinctSet = new Set<string>();
  for (const v of values) {
    if (distinctSet.size >= DISTINCT_CAP) break;
    distinctSet.add(v);
  }
  const distinct = distinctSet.size;
  const base = { name, filled, distinct };

  if (filled === 0) {
    issues.push(`“${name}” is empty in every row.`);
    return { ...base, type: "empty" };
  }
  const missingShare = 1 - filled / rowCount;
  if (missingShare >= 0.2) issues.push(`“${name}” is blank in ${pct(missingShare)} of rows.`);

  // Yes/no
  if (values.every((v) => BOOLEAN_TOKENS.has(v.toLowerCase()))) {
    return { ...base, type: "boolean", top: topValues(values.map((v) => normaliseBoolean(v)), 2) };
  }

  // Identifiers: unique-ish values in a column named like an ID or email.
  if (/(^|[\s_-])(id|uuid|guid|email|e-mail)$|^id[\s_-]/i.test(name) && distinct / filled > 0.9) {
    return { ...base, type: "identifier" };
  }

  // Numbers
  const numbers = values.map(parseNumber);
  const numeric = numbers.filter((n): n is number => n !== null);
  if (numeric.length / filled >= TYPE_THRESHOLD) {
    const bad = filled - numeric.length;
    if (bad > 0) issues.push(`“${name}” has ${fmtInt(bad)} ${bad === 1 ? "value that isn't a number" : "values that aren't numbers"}; ${bad === 1 ? "it was" : "they were"} ignored.`);
    return { ...base, type: "number", number: numberStats(numeric) };
  }

  // Dates
  const dayFirst = guessDayFirst(values);
  const dates = values.map((v) => parseDate(v, dayFirst.dayFirst));
  const valid = dates.filter((d): d is string => d !== null);
  if (valid.length / filled >= TYPE_THRESHOLD) {
    if (dayFirst.ambiguous) {
      issues.push(`Dates in “${name}” could be read day-first or month-first (e.g. ${dayFirst.example}); Veyra read them day-first.`);
    }
    const bad = filled - valid.length;
    if (bad > 0) issues.push(`“${name}” has ${fmtInt(bad)} ${bad === 1 ? "value that isn't a date" : "values that aren't dates"}; ${bad === 1 ? "it was" : "they were"} ignored.`);
    let from = valid[0];
    let to = valid[0];
    for (const d of valid) {
      if (d < from) from = d;
      if (d > to) to = d;
    }
    return { ...base, type: "date", date: { from, to } };
  }

  // Categories vs free text
  const type: ColumnType = distinct <= 30 || (filled >= 50 && distinct / filled <= 0.05) ? "category" : "text";
  return type === "category" ? { ...base, type, top: topValues(values, 5) } : { ...base, type };
}

function pickDateColumn(columns: ColumnProfile[]): ColumnProfile | undefined {
  const dated = columns.filter((c) => c.type === "date" && c.date);
  return dated.find((c) => /date|day|week|month|time|created|period/i.test(c.name)) ?? dated[0];
}

/* ── Parsing ────────────────────────────────────────────────────────── */

export function parseNumber(input: string): number | null {
  let s = input.trim();
  if (!s) return null;
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  s = s.replace(/[$€£₹¥\s%]/g, "");
  if (/^[+-]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, "");
  if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s)) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return negative ? -n : n;
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** Returns an ISO date (yyyy-mm-dd) or null. */
export function parseDate(input: string, dayFirst = true): string | null {
  const s = input.trim();
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[ T].*)?$/);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{4})-(\d{1,2})$/);
  if (m) return iso(+m[1], +m[2], 1);
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})(?:[ T].*)?$/);
  if (m) {
    const year = m[3].length === 2 ? 2000 + +m[3] : +m[3];
    return dayFirst ? iso(year, +m[2], +m[1]) : iso(year, +m[1], +m[2]);
  }
  m = s.match(/^(\d{1,2})[\s-]([A-Za-z]{3,9})[\s-,]+(\d{4})$/);
  if (m) {
    const month = MONTHS.indexOf(m[2].slice(0, 3).toLowerCase()) + 1;
    return month ? iso(+m[3], month, +m[1]) : null;
  }
  m = s.match(/^([A-Za-z]{3,9})\s(\d{1,2}),?\s(\d{4})$/);
  if (m) {
    const month = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase()) + 1;
    return month ? iso(+m[3], month, +m[2]) : null;
  }
  return null;
}

function iso(y: number, m: number, d: number): string | null {
  if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCMonth() !== m - 1) return null; // e.g. 31 Feb
  return date.toISOString().slice(0, 10);
}

/** For dd/mm vs mm/dd: decide from values where one part is above 12. */
function guessDayFirst(values: string[]): { dayFirst: boolean; ambiguous: boolean; example?: string } {
  let dayFirst = false;
  let monthFirst = false;
  let example: string | undefined;
  for (const v of values) {
    const m = v.match(/^(\d{1,2})[-/.](\d{1,2})[-/.]\d{2,4}/);
    if (!m) continue;
    example ??= v;
    if (+m[1] > 12) dayFirst = true;
    if (+m[2] > 12) monthFirst = true;
  }
  if (monthFirst && !dayFirst) return { dayFirst: false, ambiguous: false };
  return { dayFirst: true, ambiguous: !!example && !dayFirst && !monthFirst, example };
}

function normaliseBoolean(v: string): string {
  return ["true", "yes", "y"].includes(v.toLowerCase()) ? "Yes" : "No";
}

/* ── Statistics ─────────────────────────────────────────────────────── */

function numberStats(values: number[]) {
  const sorted = Float64Array.from(values).sort();
  let sum = 0;
  for (const v of values) sum += v;
  const mid = sorted.length >> 1;
  const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return { min: sorted[0], max: sorted[sorted.length - 1], mean: sum / values.length, median, sum };
}

function topValues(values: string[], limit: number) {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value, count]) => ({ value: clip(value, 60), count }));
}

/* ── Words ──────────────────────────────────────────────────────────── */

/** A plain-language description of the dataset, built only from the profile. */
function describe(p: DatasetProfile, coverage?: string): string {
  const parts: string[] = [];
  parts.push(
    `${fmtInt(p.rowCount)} ${p.rowCount === 1 ? "row" : "rows"} and ${p.columnCount} ${p.columnCount === 1 ? "column" : "columns"}` +
      (coverage ? `, covering ${coverage} (from “${p.dateColumn}”)` : "") +
      ".",
  );
  const numbers = p.columns.filter((c) => c.type === "number" && c.number).slice(0, 3);
  if (numbers.length) {
    parts.push(
      `Numbers: ${numbers
        .map((c) => `${c.name} totals ${formatNumber(c.number!.sum)} (average ${formatNumber(c.number!.mean)})`)
        .join("; ")}.`,
    );
  }
  const categories = p.columns.filter((c) => c.type === "category" && c.top?.length).slice(0, 2);
  for (const c of categories) {
    // Shares of all rows, so a mostly-blank column doesn't read as "100%".
    const shown = c.top!.slice(0, 3).map((t) => `${t.value} ${pct(t.count / p.rowCount)}`);
    parts.push(`${c.name}: ${shown.join(", ")}${c.distinct > 3 ? " and others" : ""}.`);
  }
  if (p.issues.length) parts.push(`${p.issues.length} ${p.issues.length === 1 ? "thing" : "things"} to check before relying on it.`);
  return parts.join(" ");
}
