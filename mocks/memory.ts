import type { MemoryEntry } from "@/lib/types";

export const mockMemory: MemoryEntry[] = [
  {
    id: "mem-1",
    category: "learnings",
    title: "Paid-social users are more sensitive to onboarding friction",
    body: "Activation for paid-social signups fell faster than any other channel after the April onboarding change.",
    date: "2026-09-26T12:00:00Z",
    sourceInvestigationId: "dau-decline",
    sourceInvestigationTitle: "DAU Decline",
  },
  {
    id: "mem-2",
    category: "experiments",
    title: "20% annual discount lifted annual-plan conversion by 6%",
    body: "A/B test over 4 weeks, 18,400 checkout visitors. No measurable effect on monthly-plan conversion.",
    date: "2026-08-14T12:00:00Z",
    sourceInvestigationId: "pricing-analysis",
    sourceInvestigationTitle: "Pricing Analysis",
  },
  {
    id: "mem-3",
    category: "segments",
    title: "Referral users retain best",
    body: "Referral signups show 1.6× the 90-day retention of paid-social signups.",
    date: "2026-07-02T12:00:00Z",
    sourceInvestigationId: "feature-adoption",
    sourceInvestigationTitle: "Feature Adoption",
  },
];
