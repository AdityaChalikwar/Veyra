import { ago } from "@/lib/time";
import type { ActionItem, InvestigationNote, Recommendation } from "@/lib/types";

const inv = "dau-decline";

export const dauRecommendations: Recommendation[] = [
  {
    id: "r-onboarding",
    investigationId: inv,
    title: "Investigate and redesign onboarding for paid social users before increasing acquisition spend.",
    rationale:
      "The decline is concentrated in new paid-social users, and onboarding completion fell sharply after the April redesign. Fixing activation first means any extra acquisition spend isn't wasted on users who drop out.",
    impact: "high",
    effort: "medium",
    risk: "medium",
    confidence: "medium-high",
    supportingFindingIds: ["f-paid-social", "f-onboarding", "f-dau-drop"],
    wouldChangeIf: [
      "If cohort analysis shows that activation decline began before the onboarding release.",
      "If paid-social targeting changed in March or April — acquisition quality would become the lead explanation.",
    ],
    isPrimary: true,
  },
  {
    id: "r-rollback",
    investigationId: inv,
    title: "Roll back to the previous onboarding",
    rationale: "The fastest way to test the onboarding hypothesis, but it gives up anything the redesign improved.",
    impact: "medium",
    effort: "low",
    risk: "medium",
    confidence: "medium",
    supportingFindingIds: ["f-onboarding"],
    wouldChangeIf: [],
    isPrimary: false,
  },
  {
    id: "r-spend",
    investigationId: inv,
    title: "Increase paid-social spend to replace lost users",
    rationale: "Brings more users in without addressing why they don't stay, so cost per retained user would rise.",
    impact: "low",
    effort: "low",
    risk: "high",
    confidence: "low",
    supportingFindingIds: [],
    wouldChangeIf: [],
    isPrimary: false,
  },
  {
    id: "r-shift",
    investigationId: inv,
    title: "Shift budget towards organic and referral growth",
    rationale: "These segments held up best, but they grow slowly and won't close a 48K gap on their own.",
    impact: "medium",
    effort: "medium",
    risk: "low",
    confidence: "medium",
    supportingFindingIds: ["f-organic-stable"],
    wouldChangeIf: [],
    isPrimary: false,
  },
  {
    id: "r-winback",
    investigationId: inv,
    title: "Run a win-back campaign for recently lapsed users",
    rationale: "Cheap to try and may recover some users, but it treats the symptom rather than the cause.",
    impact: "low",
    effort: "low",
    risk: "low",
    confidence: "low-medium",
    supportingFindingIds: [],
    wouldChangeIf: [],
    isPrimary: false,
  },
];

export const dauActions: ActionItem[] = [
  {
    id: "a1",
    investigationId: inv,
    week: 1,
    title: "Analyze onboarding funnel",
    detail: "Find which step loses paid-social users, and run the before/after cohort analysis to close the main evidence gap.",
    owner: "Marcus Lee · Product Analyst",
    status: "in-progress",
    expectedOutcome: "Know which onboarding step causes the drop, and whether it started with the redesign.",
    measurement: "Step completion by acquisition source, before vs after 14 April.",
  },
  {
    id: "a2",
    investigationId: inv,
    week: 2,
    title: "Interview 10 affected users",
    detail: "Talk to paid-social signups from May–August who didn't finish onboarding.",
    owner: "Sam Okafor · UX Research",
    status: "not-started",
    expectedOutcome: "Understand, in users' words, why they drop out.",
    measurement: "10 interviews completed; top three friction themes documented.",
  },
  {
    id: "a3",
    investigationId: inv,
    week: 3,
    title: "Prototype alternative onboarding",
    detail: "A shorter flow that lets people try the app before creating an account.",
    owner: "Elena Ruiz · Product Design",
    status: "not-started",
    expectedOutcome: "A tested prototype ready to build.",
    measurement: "Usability test: at least 8 of 10 participants complete onboarding unaided.",
  },
  {
    id: "a4",
    investigationId: inv,
    week: 4,
    title: "Run experiment",
    detail: "A/B test the new onboarding against the current one for new paid-social signups.",
    owner: "Priya Shah · Product Lead",
    status: "not-started",
    expectedOutcome: "Evidence on whether the new flow recovers activation.",
    measurement: "Onboarding completion and 7-day retention for paid-social signups.",
  },
];

export function buildDauNotes(): InvestigationNote[] {
  return [
    {
      id: "n1",
      investigationId: inv,
      author: "Priya Shah",
      text: "Check the Android vs iOS split for onboarding drop-off before the interviews.",
      createdAt: ago({ hours: 3 }),
    },
    {
      id: "n2",
      investigationId: inv,
      author: "Marcus Lee",
      text: "Marketing says paid-social targeting didn't change in April. Worth confirming in the ads account history.",
      createdAt: ago({ days: 1 }),
    },
  ];
}
