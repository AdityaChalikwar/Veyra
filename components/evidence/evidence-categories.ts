import type { EvidenceCategory } from "@/lib/types";

/** Evidence provenance, in order of the evidence hierarchy. Kept visibly distinct. */
export const categoryLabel: Record<EvidenceCategory, string> = {
  "company-data": "Company data",
  "customer-evidence": "Customer evidence",
  "uploaded-research": "Uploaded research",
  "public-research": "Public research",
  notes: "Notes & links",
};

export const categoryDescription: Record<EvidenceCategory, string> = {
  "company-data": "From your own systems — the strongest evidence.",
  "customer-evidence": "What customers say and do: tickets, feedback, interviews.",
  "uploaded-research": "Reports and research your team provided.",
  "public-research": "Found on the public web. Useful context, weaker evidence.",
  notes: "Notes and links added by the team.",
};

export const categoryOrder: EvidenceCategory[] = ["company-data", "customer-evidence", "uploaded-research", "public-research", "notes"];

/** Accent classes so provenance is visible at a glance, not blended together. */
export const categoryAccent: Record<EvidenceCategory, string> = {
  "company-data": "border-l-brand-500",
  "customer-evidence": "border-l-violet-500",
  "uploaded-research": "border-l-slate-400",
  "public-research": "border-l-uncertain-600",
  notes: "border-l-line-strong",
};
