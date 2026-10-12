import { ago } from "@/lib/time";
import type { DecisionRecord } from "@/lib/types";

/** Decisions recorded in the sample investigation. */
export function buildDecisions(): DecisionRecord[] {
  return [
    {
      id: "dec-pause",
      investigationId: "kitchen-returns",
      investigationTitle: "Kitchen Returns Spike",
      decision: "Pause new Quanta orders for the four worst ceramic lines until the investigation concludes",
      status: "decided",
      decidedAt: ago({ days: 1 }),
      owner: "Marcus Lee",
      rationale: "Defect returns are concentrated in Kitchen since the switch; pausing limits refunds while we confirm the cause.",
    },
  ];
}
