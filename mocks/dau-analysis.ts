import { ago } from "@/lib/time";
import type { ChatMessage, Diagnosis, Finding, Hypothesis } from "@/lib/types";

const inv = "dau-decline";

export const dauFindings: Finding[] = [
  {
    id: "f-dau-drop",
    investigationId: inv,
    statement: "DAU declined 40% between April and August.",
    confidence: "high",
    confidenceReason: "Direct measurement from the product analytics export, consistent month to month.",
    evidenceIds: ["ev-dau"],
    detail: {
      metricLabel: "Daily active users",
      before: { label: "April", value: "120K" },
      after: { label: "August", value: "72K" },
      change: "−40%",
      supporting: ["The decline is steady month on month (−10%, −11%, −14%, −13%), not a one-off drop."],
      contradicting: [],
      unknowns: ["Whether the decline has stopped — September data isn't in yet."],
    },
    trail: [
      { text: "Loaded daily active users by month, Jan – Aug 2026.", evidenceId: "ev-dau" },
      { text: "January to April is flat at 118K–121K, so April (120K) is a fair baseline." },
      { text: "August averages 72K: a 40% drop from April." },
      { text: "Confidence is high: one clean source, measured directly, consistent across months." },
    ],
  },
  {
    id: "f-paid-social",
    investigationId: inv,
    statement: "The decline is concentrated among paid social users.",
    confidence: "high",
    confidenceReason: "Large, clear gap between segments in a single consistent dataset.",
    evidenceIds: ["ev-seg", "ev-acq"],
    detail: {
      metricLabel: "Paid-social DAU",
      before: { label: "April", value: "70K" },
      after: { label: "August", value: "27K" },
      change: "−61%",
      supporting: ["Onboarding completion dropped from 71% to 53% over the same period."],
      contradicting: ["Organic users declined only 11%, so the product isn't failing for everyone."],
      unknowns: ["We do not yet know whether acquisition quality changed before or after the onboarding redesign."],
    },
    trail: [
      { text: "Split daily active users by acquisition source for April and August.", evidenceId: "ev-seg" },
      { text: "Paid Social fell from 70K to 27K (−61%). Organic, Referral and Direct fell 8–12%." },
      { text: "Paid Social accounts for 43K of the 48K total drop — about 90%.", evidenceId: "ev-dau" },
      { text: "Paid-social install volume held steady, so fewer signups doesn't explain it.", evidenceId: "ev-acq" },
      { text: "Confidence is high: the gap between segments is large and consistent every month." },
    ],
  },
  {
    id: "f-onboarding",
    investigationId: inv,
    statement: "Onboarding completion dropped 27%.",
    confidence: "high",
    confidenceReason: "Measured directly in the onboarding funnel; the drop starts the week of the redesign.",
    evidenceIds: ["ev-funnel"],
    detail: {
      metricLabel: "Onboarding completion rate",
      before: { label: "Before redesign", value: "71%" },
      after: { label: "August", value: "53%" },
      change: "−27%",
      supporting: ["The drop begins the week the redesigned onboarding shipped (14 April)."],
      contradicting: [],
      unknowns: ["Which step of the new onboarding loses the most users."],
    },
    trail: [
      { text: "Loaded weekly onboarding funnel data, Jan – Aug 2026.", evidenceId: "ev-funnel" },
      { text: "Completion averaged 71% before 14 April and 53% in August." },
      { text: "The change lines up with the onboarding redesign release.", evidenceId: "ev-onboarding-doc" },
    ],
  },
  {
    id: "f-organic-stable",
    investigationId: inv,
    statement: "Organic and referral traffic remained relatively stable.",
    confidence: "medium",
    confidenceReason: "Small declines (8–11%) that could still be seasonal; only one year of data.",
    evidenceIds: ["ev-seg"],
    detail: {
      metricLabel: "Organic + referral DAU",
      before: { label: "April", value: "42K" },
      after: { label: "August", value: "37.7K" },
      change: "−10%",
      supporting: ["Support tickets about onboarding come mostly from new paid-social users."],
      contradicting: ["A 10% dip is still a decline — some of it may share the same cause."],
      unknowns: ["Normal seasonal variation — we don't have 2025 data to compare against."],
    },
    trail: [
      { text: "Compared organic and referral DAU in April and August.", evidenceId: "ev-seg" },
      { text: "Combined they fell from 42K to 37.7K (−10%)." },
      { text: "Confidence is medium: summer seasonality could explain a dip of this size." },
    ],
  },
];

export const dauHypotheses: Hypothesis[] = [
  {
    id: "h-onboarding",
    investigationId: inv,
    statement: "Onboarding redesign is causing activation decline.",
    confidence: "medium-high",
    rationale: "Timing matches the April release and the drop is concentrated in new users, who go through onboarding.",
    supportingFindingIds: ["f-onboarding", "f-paid-social"],
    contradictingFindingIds: ["f-organic-stable"],
    nextTest: "Compare activation for cohorts who signed up before vs after 14 April.",
  },
  {
    id: "h-acquisition-quality",
    investigationId: inv,
    statement: "Paid acquisition quality has deteriorated.",
    confidence: "medium",
    rationale: "Paid social is the worst-hit segment, which could also mean lower-intent users are being acquired.",
    supportingFindingIds: ["f-paid-social"],
    contradictingFindingIds: [],
    nextTest: "Check paid-social targeting and creative changes, and first-session behaviour by campaign.",
  },
  {
    id: "h-value",
    investigationId: inv,
    statement: "Users are finding the product less valuable.",
    confidence: "low-medium",
    rationale: "Early retention fell, but core feature usage for activated users hasn't changed.",
    supportingFindingIds: ["f-dau-drop"],
    contradictingFindingIds: ["f-organic-stable"],
    nextTest: "Interview 10 affected users and review feature usage for activated users.",
  },
  {
    id: "h-competition",
    investigationId: inv,
    statement: "Increased competition is affecting acquisition.",
    confidence: "low",
    rationale: "A competitor launched a similar app in May, but install volume hasn't fallen.",
    supportingFindingIds: [],
    contradictingFindingIds: ["f-paid-social"],
    nextTest: "Compare paid-social cost per install and share of voice before and after May.",
  },
];

export const dauDiagnosis: Diagnosis = {
  investigationId: inv,
  summary:
    "The decline is real and concentrated in new paid-social users. The April onboarding redesign is the leading explanation, but it isn't confirmed.",
  known: [
    { text: "DAU declined 40%.", findingIds: ["f-dau-drop"] },
    { text: "Paid social users declined 61%.", findingIds: ["f-paid-social"] },
    { text: "Onboarding completion declined 27%.", findingIds: ["f-onboarding"] },
  ],
  suspected: [
    {
      text: "The onboarding redesign may be reducing activation among newly acquired users.",
      findingIds: ["f-onboarding", "f-paid-social"],
    },
  ],
  unknown: [{ text: "Whether acquisition quality independently deteriorated." }],
  evidenceGaps: [
    {
      text: "Need cohort analysis comparing users before and after the onboarding redesign.",
      howToClose: "Export activation and 30-day retention by signup week, split by acquisition source.",
    },
  ],
};

export function buildDauConversation(): ChatMessage[] {
  return [
    {
      id: "m1",
      role: "assistant",
      text: "I've analysed the initial information. To investigate the 40% DAU decline, I need to understand a few things first.",
      list: [
        "When did the decline start?",
        "Was this across all user segments or specific ones?",
        "Were there any product, pricing or acquisition changes around this time?",
        "What is the primary business goal here?",
      ],
      createdAt: ago({ days: 15 }),
    },
    {
      id: "m2",
      role: "user",
      text: "The decline started in April. It's mostly new users from paid social. We had an onboarding redesign in April. Goal is to recover DAU to previous levels.",
      createdAt: ago({ days: 15 }),
    },
    {
      id: "m3",
      role: "assistant",
      text: "Thanks. I've analysed the data you added. The strongest signal so far is that the decline is concentrated among paid-social users.",
      refs: [{ kind: "finding", id: "f-paid-social", label: "View Finding" }],
      createdAt: ago({ hours: 2 }),
    },
  ];
}
