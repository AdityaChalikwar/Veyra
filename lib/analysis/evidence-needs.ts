/**
 * What evidence a validation needs: a short checklist on the plan. Each item
 * says what to collect, where it comes from and how much is enough; each piece
 * of evidence the team adds can say which item it covers.
 */

export const EVIDENCE_SOURCES = {
  data: "Your data",
  "customer-interviews": "Customer interviews",
  survey: "Survey",
  "support-tickets": "Support tickets",
  experiment: "Experiment",
  "desk-research": "Desk research",
  other: "Other",
} as const;

export type EvidenceSource = keyof typeof EVIDENCE_SOURCES;
export type EvidenceNeed = { id: string; what: string; source: EvidenceSource; enough: string };

export const MAX_NEEDS = 6;

/** Only well-formed items, each with a short id ("N1", "N2"…) kept stable once given. */
export function cleanNeeds(raw: unknown): EvidenceNeed[] {
  if (!Array.isArray(raw)) return [];
  const used = new Set<string>();
  const out: EvidenceNeed[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const what = typeof r.what === "string" ? r.what.trim().slice(0, 300) : "";
    if (!what) continue;
    const source = typeof r.source === "string" && r.source in EVIDENCE_SOURCES ? (r.source as EvidenceSource) : "other";
    const enough = typeof r.enough === "string" ? r.enough.trim().slice(0, 200) : "";
    let id = typeof r.id === "string" && /^N\d{1,2}$/.test(r.id) && !used.has(r.id) ? r.id : "";
    if (!id) for (let n = 1; !id; n++) if (!used.has(`N${n}`)) id = `N${n}`;
    used.add(id);
    out.push({ id, what, source, enough });
    if (out.length === MAX_NEEDS) break;
  }
  return out;
}

/** Which checklist items have at least one piece of evidence against them. */
export function coveredNeeds(needs: EvidenceNeed[], evidence: { needId?: string }[]): Set<string> {
  const ids = new Set(needs.map((n) => n.id));
  return new Set(evidence.map((e) => e.needId).filter((id): id is string => !!id && ids.has(id)));
}
