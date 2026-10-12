import type { ColumnProfile, DataMetric, DatasetProfile } from "@/lib/types";
import { assessEvidence } from "./confidence";
import { clip, fmtInt, formatNumber, formatRange, pct } from "./format";

/**
 * The analysis pack: everything the model is allowed to know about the data,
 * worked out in code from the stored evidence profiles. The model reads these
 * numbers; it never calculates them. Each dataset gets a reference ("E1") that
 * findings cite, and the pack is saved with each analysis run.
 */

export type PackColumn = {
  name: string;
  type: ColumnProfile["type"];
  filled: number;
  /** Share of rows with a value, 0–1. */
  fillRate: number;
  distinct: number;
  number?: ColumnProfile["number"];
  date?: ColumnProfile["date"];
  top?: { value: string; count: number; share: number }[];
};

export type PackDataset = {
  ref: string;
  evidenceId: string;
  name: string;
  rows: number;
  period?: { from: string; to: string };
  dateColumn?: string;
  /** Only the first rows of a very large file were read. */
  truncated: boolean;
  issues: string[];
  columns: PackColumn[];
  preview: DatasetProfile["preview"];
  /** Where the data came from, e.g. "Demo ERP — Northwind Home" or "Uploaded CSV". */
  source?: string;
  /** Calculations over the full dataset, worked out in code (trends, breakdowns, rates). */
  metrics?: DataMetric[];
  /** How far this evidence can be trusted, worked out in code. */
  confidence?: { level: "low" | "medium" | "high"; reason: string };
};

export type AnalysisPack = {
  datasets: PackDataset[];
  /** Plain statements about what the data can't support, worked out in code. */
  limits: string[];
};

export type PackInput = { id: string; name: string; profile: DatasetProfile; source?: string; metrics?: DataMetric[] };

const TOP_VALUES = 8;
const MASK = "•••";

/**
 * Columns that probably hold personal data. Their sample values are masked and
 * their common values left out, so names, emails and phone numbers never
 * reach the AI. (Data from connected sources is masked earlier, by field.)
 */
export function isPersonalColumn(name: string): boolean {
  const n = name.toLowerCase();
  return (
    /e-?mail|phone|mobile|telephone|address|postcode|post code|zip|passport|national id|ssn|date of birth|dob/.test(n) ||
    /^(name|full ?name|first ?name|last ?name|surname)$/.test(n.trim()) ||
    /(customer|client|contact|user|person|buyer|employee|cust)[ _-]?name/.test(n)
  );
}
const MAX_COLUMNS = 60;

export function buildPack(items: PackInput[]): AnalysisPack {
  const datasets = items.map<PackDataset>((item, i) => {
    const p = item.profile;
    return {
      ref: `E${i + 1}`,
      evidenceId: item.id,
      name: item.name,
      rows: p.rowCount,
      period: p.dateRange,
      dateColumn: p.dateColumn,
      truncated: p.truncated,
      issues: p.issues,
      source: item.source,
      metrics: item.metrics?.length ? item.metrics : undefined,
      confidence: assessEvidence(p, item.metrics),
      columns: p.columns.slice(0, MAX_COLUMNS).map((c) => ({
        name: c.name,
        type: c.type,
        filled: c.filled,
        fillRate: p.rowCount ? c.filled / p.rowCount : 0,
        distinct: c.distinct,
        number: c.number,
        date: c.date,
        top: isPersonalColumn(c.name) ? undefined : c.top?.slice(0, TOP_VALUES).map((t) => ({ ...t, share: p.rowCount ? t.count / p.rowCount : 0 })),
      })),
      preview: {
        columns: p.preview.columns,
        rows: p.preview.rows.map((row) => row.map((v, i) => (v && isPersonalColumn(p.preview.columns[i] ?? "") ? MASK : v))),
      },
    };
  });

  const limits: string[] = [
    datasets.some((d) => d.metrics)
      ? "Datasets from connected sources come with metrics calculated over every row (trends by month, breakdowns, rates). Anything not in those metrics or the column summaries is not available."
      : "Each dataset is described by column summaries and a few sample rows. Row-level patterns, trends over time and relationships between columns are not available.",
  ];
  if (datasets.some((d) => d.metrics) && datasets.some((d) => !d.metrics)) {
    limits.push("Uploaded files have column summaries only, with no trends; compare them with connected data carefully.");
  }
  for (const d of datasets) {
    if (!d.period) limits.push(`${d.ref} has no date column, so what period it covers is unknown.`);
    if (d.truncated) limits.push(`${d.ref} is a very large file; only its first rows were read.`);
    if (d.columns.length < d.rows && d.columns.length >= MAX_COLUMNS) limits.push(`${d.ref} has more columns than were included.`);
  }
  if (datasets.length === 1) limits.push("There is one dataset, so nothing here can be cross-checked against another source.");
  return { datasets, limits };
}

/** The pack as text for the prompt. Every number shown comes straight from the profile. */
export function renderPack(pack: AnalysisPack): string {
  const out: string[] = [];
  for (const d of pack.datasets) {
    out.push(`## ${d.ref}: ${d.name}${d.source ? ` (from ${d.source})` : ""}`);
    out.push(`Rows: ${fmtInt(d.rows)}${d.period ? ` · Period: ${formatRange(d.period.from, d.period.to)} (column “${d.dateColumn}”)` : " · Period: unknown"}`);
    if (d.confidence) out.push(`Evidence confidence: ${d.confidence.level}. ${d.confidence.reason}`);
    if (d.issues.length) out.push(`Data issues: ${d.issues.join(" | ")}`);
    out.push("Columns:");
    for (const c of d.columns) out.push(`- ${renderColumn(c)}`);
    if (d.preview.rows.length) {
      out.push(`Sample rows (${d.preview.rows.length}; personal details masked): ${d.preview.columns.join(" | ")}`);
      for (const r of d.preview.rows) out.push(`  ${r.map((v) => clip(v, 40)).join(" | ")}`);
    }
    for (const m of d.metrics ?? []) {
      out.push(`Metric “${m.title}” (${m.unit}):`);
      out.push(`  ${m.columns.join(" | ")}`);
      for (const row of m.rows) out.push(`  ${row.map((v) => (typeof v === "number" ? v.toLocaleString("en", { maximumFractionDigits: 2 }) : clip(v, 40))).join(" | ")}`);
      if (m.note) out.push(`  Note: ${m.note}`);
    }
    out.push("");
  }
  out.push("Limits worked out in code:");
  for (const l of pack.limits) out.push(`- ${l}`);
  return out.join("\n");
}

function renderColumn(c: PackColumn): string {
  const parts = [`“${c.name}” (${c.type}, ${pct(c.fillRate)} filled, ${fmtInt(c.distinct)} distinct)`];
  if (c.number) {
    const n = c.number;
    parts.push(
      `min ${formatNumber(n.min)}, max ${formatNumber(n.max)}, mean ${formatNumber(n.mean)}, median ${formatNumber(n.median)}, sum ${formatNumber(n.sum)}`,
    );
  }
  if (c.date) parts.push(`${c.date.from} to ${c.date.to}`);
  if (c.top?.length) parts.push(`top values: ${c.top.map((t) => `${clip(t.value, 40)} ${pct(t.share)} (${fmtInt(t.count)})`).join(", ")}`);
  return parts.join("; ");
}
