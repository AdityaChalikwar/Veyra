import { ago } from "@/lib/time";
import type { InvestigationMap, InvestigationWorkspace, Kpi, SegmentComparison, TrendPoint } from "@/lib/types";
import { buildDauConversation, dauDiagnosis, dauFindings, dauHypotheses } from "./dau-analysis";
import { buildDauNotes, dauActions, dauRecommendations } from "./dau-plan";
import { demoDraft, demoQuestions } from "./new-investigation";

const kpis: Kpi[] = [
  { id: "kpi-dau", label: "Daily Active Users", value: "−40%", detail: "Apr 120K → Aug 72K", kind: "decline", icon: "users", sourceEvidenceId: "ev-dau" },
  { id: "kpi-onboarding", label: "Onboarding Completion", value: "−27%", detail: "71% → 53%", kind: "decline", icon: "funnel", sourceEvidenceId: "ev-funnel" },
  { id: "kpi-segment", label: "Affected Segment", value: "Paid Social Users", detail: "−61%, vs −11% organic", kind: "neutral", icon: "segment", sourceEvidenceId: "ev-seg" },
  { id: "kpi-status", label: "Investigation Status", value: "Diagnosing", detail: "72% complete", kind: "status", icon: "status", progress: 72 },
];

// DAU in thousands. Stable until the April onboarding redesign, then declining.
const trend: TrendPoint[] = [
  { period: "Jan", value: 118 },
  { period: "Feb", value: 121 },
  { period: "Mar", value: 119 },
  { period: "Apr", value: 120, annotation: "Onboarding redesign" },
  { period: "May", value: 108 },
  { period: "Jun", value: 96 },
  { period: "Jul", value: 83 },
  { period: "Aug", value: 72 },
];

// DAU in thousands by acquisition source. Sums to the April and August totals above.
const segments: SegmentComparison[] = [
  { segment: "Paid Social", before: 70, after: 27.3, change: -0.61 },
  { segment: "Organic", before: 32, after: 28.5, change: -0.11 },
  { segment: "Referral", before: 10, after: 9.2, change: -0.08 },
  { segment: "Direct", before: 8, after: 7, change: -0.12 },
];

const map: InvestigationMap = {
  root: { label: "DAU Decline", value: "−40%" },
  branches: [
    {
      id: "acquisition",
      label: "Acquisition",
      assessment: "Decline is channel-specific",
      uncertain: false,
      children: [
        { id: "paid-social", label: "Paid Social", value: "−61%", signal: "problem" },
        { id: "organic", label: "Organic", value: "−11%", signal: "minor" },
        { id: "other", label: "Other", value: "−8%", signal: "minor" },
      ],
    },
    {
      id: "product",
      label: "Product",
      assessment: "Possible cause",
      uncertain: true,
      children: [
        { id: "onboarding", label: "Onboarding", value: "−27% completion", signal: "problem" },
        { id: "core", label: "Core Features", value: "No major change", signal: "stable" },
        { id: "release", label: "Recent Release", value: "April 2026", signal: "event" },
      ],
    },
    {
      id: "retention",
      label: "Retention",
      assessment: "Under investigation",
      uncertain: true,
      children: [
        { id: "early", label: "Early Retention", value: "−35%", signal: "problem" },
        { id: "long-term", label: "Long-term", value: "−12%", signal: "minor" },
        { id: "reactivation", label: "Reactivation", value: "Unknown", signal: "unknown" },
      ],
    },
  ],
};

export function buildDauWorkspace(evidence: InvestigationWorkspace["evidence"]): InvestigationWorkspace {
  return {
    investigation: {
      id: "dau-decline",
      title: "DAU Decline",
      topic: "engagement",
      status: "investigating",
      stage: "diagnosis",
      progress: 72,
      headline: "Daily active users down 40% since April. The drop is concentrated in paid-social signups.",
      subtitle: "Understand the 40% decline in daily active users and identify actions to recover engagement.",
      problem: demoDraft.problem,
      goal: demoDraft.goal,
      context: demoDraft.context,
      createdAt: "2026-09-12T09:30:00Z",
      updatedAt: ago({ hours: 2 }),
    },
    kpis,
    trend: { title: "DAU Trend", metric: "Daily active users", unit: "K", points: trend, sourceEvidenceId: "ev-dau" },
    segments: {
      title: "User Segments",
      beforeLabel: "Apr (before)",
      afterLabel: "Aug (after)",
      rows: segments,
      sourceEvidenceId: "ev-seg",
    },
    map,
    questions: demoQuestions.map((q) => ({ ...q, investigationId: "dau-decline" })),
    evidence,
    findings: dauFindings,
    hypotheses: dauHypotheses,
    diagnosis: dauDiagnosis,
    conversation: buildDauConversation(),
    proposals: [],
    recommendations: dauRecommendations,
    actions: dauActions,
    notes: buildDauNotes(),
  };
}
