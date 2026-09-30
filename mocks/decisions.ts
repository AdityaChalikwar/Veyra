import { ago } from "@/lib/time";
import type { DecisionRecord } from "@/lib/types";

export function buildDecisions(): DecisionRecord[] {
  return [
    { id: "dec-1", investigationId: "smb-onboarding", investigationTitle: "SMB Onboarding", decision: "Interview 10 single-store retailers before scoping any onboarding changes", status: "decided", decidedAt: ago({ hours: 5 }), owner: "Priya Shah", rationale: "Analytics show where small retailers stall, not why." },
    { id: "dec-2", investigationId: "dau-decline", investigationTitle: "DAU Decline", decision: "Hold the paid search budget increase until the DAU investigation concludes", status: "decided", decidedAt: ago({ days: 1 }), owner: "Marcus Lee", rationale: "A channel-mix change is one of the open explanations for the activation drop." },
    { id: "dec-3", investigationId: "expansion-revenue", investigationTitle: "Expansion Revenue Stall", decision: "Launch usage-based pricing for multi-store accounts", status: "validated", decidedAt: "2026-07-10T12:00:00Z", owner: "Sam Okafor", rationale: "Per-store pricing penalised growing accounts.", outcome: "Expansion revenue +9% in Q3." },
    { id: "dec-4", investigationId: "onboarding-conversion-2025", investigationTitle: "Onboarding Conversion Decline", decision: "Simplify onboarding by deferring store configuration", status: "validated", decidedAt: "2025-04-02T12:00:00Z", owner: "Elena Ruiz", rationale: "Interviews showed configuration, not sign-up, was the blocker.", outcome: "Activation +12% in an A/B test." },
  ];
}
