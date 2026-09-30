import type { DecisionStatus } from "@/lib/types";

export const decisionStatus: Record<DecisionStatus, { label: string; className: string }> = {
  proposed: { label: "Proposed", className: "bg-slate-100 text-slate-600" },
  decided: { label: "Decided", className: "bg-brand-50 text-brand-700" },
  "in-experiment": { label: "In experiment", className: "bg-violet-50 text-violet-700" },
  validated: { label: "Validated", className: "bg-confirmed-50 text-confirmed-600" },
};
