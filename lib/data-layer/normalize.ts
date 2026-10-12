import { formatRange } from "@/lib/analysis/format";
import { parseDate, parseNumber, profileRows } from "@/lib/analysis/profile";
import type { DatasetProfile } from "@/lib/types";
import type { CanonicalEntity, FieldMapping } from "./canonical";

/**
 * Validation and normalization: source rows → rows in Veyra's business model.
 * Rows that can't be trusted are rejected with a reason people can read;
 * everything else is converted to one format (ISO dates, plain numbers).
 */

export type Value = string | number | null;
export type NormalizedRow = Record<string, Value>;

export type Check = { level: "ok" | "warning" | "error"; text: string };

export type NormalizeResult = {
  /** False when the mapping itself makes the data unusable (a required field isn't mapped). */
  usable: boolean;
  rows: NormalizedRow[];
  read: number;
  rejected: number;
  checks: Check[];
};

const PCT = (n: number, of: number) => (of ? `${((n / of) * 100).toFixed(n / of < 0.01 ? 1 : 0)}%` : "0%");

export function normalize(entity: CanonicalEntity, mapping: FieldMapping, source: Record<string, string>[]): NormalizeResult {
  const checks: Check[] = [];
  const missing = entity.fields.filter((f) => f.required && !mapping[f.key]);
  if (missing.length) {
    return {
      usable: false,
      rows: [],
      read: source.length,
      rejected: source.length,
      checks: [{ level: "error", text: `Map ${missing.map((f) => f.label).join(", ")} — ${missing.length === 1 ? "it's" : "they're"} needed to use this data.` }],
    };
  }

  const reasons = new Map<string, number>();
  const reject = (why: string) => reasons.set(why, (reasons.get(why) ?? 0) + 1);
  const seen = new Set<string>();
  const rows: NormalizedRow[] = [];

  for (const raw of source) {
    const row: NormalizedRow = {};
    let bad: string | null = null;
    for (const f of entity.fields) {
      const src = mapping[f.key];
      const text = src ? (raw[src] ?? "").trim() : "";
      if (!text) {
        if (f.required) bad ??= `missing ${f.label.toLowerCase()}`;
        row[f.key] = null;
        continue;
      }
      if (f.type === "date") {
        const d = parseDate(text);
        if (!d) {
          if (f.required) bad ??= `unreadable ${f.label.toLowerCase()}`;
          row[f.key] = null;
        } else row[f.key] = d;
      } else if (f.type === "number" || f.type === "money") {
        const n = parseNumber(text);
        if (n === null) {
          if (f.required) bad ??= `${f.label.toLowerCase()} isn't a number`;
          row[f.key] = null;
        } else if (f.positive && n <= 0) {
          bad ??= `${f.label.toLowerCase()} is zero or negative`;
          row[f.key] = n;
        } else row[f.key] = n;
      } else row[f.key] = text;
    }
    if (!bad && entity.uniqueField) {
      const key = String(row[entity.uniqueField]);
      if (seen.has(key)) bad = `duplicate ${entity.fields.find((f) => f.key === entity.uniqueField)!.label}`;
      seen.add(key);
    }
    if (bad) reject(bad);
    else rows.push(row);
  }

  const rejected = source.length - rows.length;
  checks.push({ level: "ok", text: `${source.length.toLocaleString("en")} rows read.` });
  if (rejected === 0) checks.push({ level: "ok", text: "Every row passed the checks." });
  for (const [why, n] of [...reasons].sort((a, b) => b[1] - a[1])) {
    checks.push({ level: "warning", text: `${n.toLocaleString("en")} ${n === 1 ? "row" : "rows"} (${PCT(n, source.length)}) left out: ${why}.` });
  }
  if (source.length > 0 && rejected / source.length > 0.2) {
    checks.push({ level: "error", text: "More than a fifth of the rows were left out. Check the field mapping before relying on this data." });
  }
  const unmapped = entity.fields.filter((f) => !f.required && !mapping[f.key]);
  if (unmapped.length) checks.push({ level: "warning", text: `Not mapped (optional): ${unmapped.map((f) => f.label).join(", ")}.` });

  return { usable: rows.length > 0, rows, read: source.length, rejected, checks };
}

const MASK = "•••";

/**
 * The profile of normalized rows, under Veyra's field names. Personal fields
 * are masked in the preview and their common values left out, so neither is
 * stored with the snapshot nor sent to the AI.
 */
export function profileNormalized(entity: CanonicalEntity, rows: NormalizedRow[]): { profile: DatasetProfile; summary: string; coverage?: string } {
  const fields = entity.fields;
  const result = profileRows(
    fields.map((f) => f.label),
    rows.map((r) => fields.map((f) => (r[f.key] === null ? "" : String(r[f.key])))),
  );
  const personal = new Set(fields.filter((f) => f.personal).map((f) => f.label));
  const profile: DatasetProfile = {
    ...result.profile,
    columns: result.profile.columns.map((c) => (personal.has(c.name) ? { ...c, top: undefined } : c)),
    preview: {
      columns: result.profile.preview.columns,
      rows: result.profile.preview.rows.map((r) => r.map((v, i) => (personal.has(result.profile.preview.columns[i]) && v ? MASK : v))),
    },
  };
  const dateLabel = entity.dateField ? fields.find((f) => f.key === entity.dateField)?.label : undefined;
  const range = dateLabel ? profile.columns.find((c) => c.name === dateLabel)?.date : undefined;
  if (range) {
    profile.dateColumn = dateLabel;
    profile.dateRange = range;
  }
  const coverage = profile.dateRange ? formatRange(profile.dateRange.from, profile.dateRange.to) : undefined;
  return { profile, summary: result.summary, coverage };
}
