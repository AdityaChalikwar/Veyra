import { ago } from "@/lib/time";
import type { InvestigationSummary } from "@/lib/types";

/** The sample investigation's headline numbers. Built on each call so "updated 2 hours ago" stays true. */
export function buildSampleSummary(): Omit<InvestigationSummary, "id"> {
  return {
    title: "DAU Decline",
    topic: "engagement",
    status: "investigating",
    problem: "DAU has fallen 40% over the last 8 weeks.",
    evidenceCount: 8,
    hypothesisCount: 3,
    openQuestionCount: 4,
    confidence: "medium",
    updatedAt: ago({ hours: 2 }),
    isSample: true,
  };
}
