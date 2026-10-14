import type { DatasetProfile } from "@/lib/types";
import { fmtInt, pct } from "./format";

export type EvidenceConfidence = "low" | "medium" | "high";

/**
 * How far one item of evidence can be trusted, worked out in code from its
 * size, the period it covers and its quality. No AI: the same data always
 * gets the same answer, with the reasons spelled out.
 */
export function assessEvidence(profile: DatasetProfile, opts: { connected?: boolean } = {}): { level: EvidenceConfidence; reason: string } {
  const rows = profile.rowCount;
  const days = profile.dateRange ? Math.round((Date.parse(profile.dateRange.to) - Date.parse(profile.dateRange.from)) / 86_400_000) : 0;
  const fill = profile.columns.length && rows ? profile.columns.reduce((sum, c) => sum + c.filled / rows, 0) / profile.columns.length : 0;
  const issues = profile.issues.length;

  const strengths: string[] = [];
  const limits: string[] = [];
  if (rows >= 500) strengths.push(`${fmtInt(rows)} rows`);
  else if (rows < 50) limits.push(`only ${fmtInt(rows)} rows`);
  if (!profile.dateRange) limits.push("no dates, so the period is unknown");
  else if (days >= 60) strengths.push(`${Math.round(days / 30)} months of dates`);
  else limits.push(`a short period (${days + 1} days)`);
  if (fill < 0.8) limits.push(`${pct(1 - fill)} of values missing`);
  else if (fill >= 0.95) strengths.push("few missing values");
  if (issues) limits.push(`${issues} data ${issues === 1 ? "issue" : "issues"} found`);
  if (profile.truncated) limits.push("only the first rows were read");
  if (opts.connected) strengths.push("checked and mapped from a connected system");

  const level: EvidenceConfidence = limits.length >= 2 || rows < 50 ? "low" : limits.length === 0 && strengths.length >= 2 ? "high" : "medium";
  const parts = [strengths.length && `Strengths: ${strengths.join(", ")}.`, limits.length && `Limits: ${limits.join(", ")}.`].filter(Boolean);
  return { level, reason: parts.join(" ") || "Nothing stands out either way." };
}
