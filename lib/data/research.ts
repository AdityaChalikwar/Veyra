/**
 * Research that Veyra runs on request — simulated. In the real product these
 * query connected systems (analytics, CRM, support) or public sources. Results
 * arrive as new evidence and observations; links to hypotheses are suggestions
 * a person accepts or dismisses.
 */
import type { EvidenceItem, EvidenceProposal, FeedbackTheme, Finding } from "@/lib/types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type ResearchResult = {
  result: string;
  evidence?: EvidenceItem;
  finding?: Finding;
  proposals: EvidenceProposal[];
  /** Open questions this research answers. */
  answers: string[];
};

const inv = "dau-decline";
const now = () => new Date().toISOString();

export async function runResearchTask(taskId: string): Promise<ResearchResult> {
  await delay(2200);

  if (taskId === "r-channel") {
    const evidence: EvidenceItem = {
      id: "ev-activation-by-channel",
      investigationId: inv,
      name: "Activation by acquisition channel",
      category: "company-data",
      source: "Product Analytics + CRM",
      dataset: "Activation joined to lead source",
      coverage: "Jun – Sep 2026",
      format: "dataset",
      addedAt: now(),
      description: "New-user activation by lead source, before and after 4 August.",
      preview: { columns: ["channel", "before", "after", "change"], rows: [["Paid search", "36%", "23%", "−36%"], ["Partners", "48%", "35%", "−27%"], ["Organic", "45%", "33%", "−27%"]] },
    };
    return {
      result: "Activation fell in every channel — paid search most (−36%), but partners and organic also fell 27%.",
      evidence,
      finding: {
        id: "f-all-channels",
        investigationId: inv,
        kind: "observation",
        statement: "Activation fell in every acquisition channel, not only paid search.",
        confidence: "high",
        confidenceReason: "Activation and lead source are both recorded for every signup.",
        evidenceIds: [evidence.id],
        detail: {
          metricLabel: "Activation, partners and organic",
          before: { label: "Before 4 Aug", value: "45–48%" },
          after: { label: "After", value: "33–35%" },
          change: "−27%",
          supporting: ["Paid search fell most (−36%), so the channel mix adds to the drop."],
          contradicting: [],
          unknowns: [],
        },
        trail: [
          { text: "Joined new-user activation to CRM lead source.", evidenceId: evidence.id },
          { text: "Compared signups before and after 4 August by channel." },
          { text: "Every channel fell by at least 27%, so the channel mix can't be the main cause." },
        ],
      },
      proposals: [
        { id: "p-channel-h2", investigationId: inv, evidenceId: evidence.id, action: "contradicts-hypothesis", targetId: "h-channel", summary: "Mark as contradicting evidence for H2 — activation fell in every channel, not just paid search.", status: "pending" },
        { id: "p-channel-h1", investigationId: inv, evidenceId: evidence.id, action: "supports-hypothesis", targetId: "h-onboarding", summary: "Add as supporting evidence for H1 — a drop across all channels points to something every new user sees.", status: "pending" },
      ],
      answers: ["oq-channel"],
    };
  }

  if (taskId === "r-compare") {
    const evidence: EvidenceItem = {
      id: "ev-steps",
      investigationId: inv,
      name: "Onboarding step completion, before vs after",
      category: "company-data",
      source: "Product Analytics",
      dataset: "Onboarding steps",
      coverage: "Jul – Sep 2026",
      format: "dataset",
      addedAt: now(),
      preview: { columns: ["step", "before", "after"], rows: [["Create account", "96%", "95%"], ["Configure payments & shipping", "—", "58%"], ["Import first product", "74%", "61%"]] },
    };
    return {
      result: "Most new users now stop at the new “Configure payments & shipping” step (58% complete it). Account creation is unchanged.",
      evidence,
      finding: {
        id: "f-config-step",
        investigationId: inv,
        kind: "observation",
        statement: "42% of new users stop at the new configuration step added on 4 August.",
        confidence: "high",
        confidenceReason: "Step-level funnel data for every new user.",
        evidenceIds: [evidence.id],
        trail: [
          { text: "Compared onboarding step completion before and after release 4.2.", evidenceId: evidence.id },
          { text: "Account creation is unchanged (96% → 95%)." },
          { text: "Only 58% complete the new configuration step — the largest drop-off." },
        ],
      },
      proposals: [
        { id: "p-steps-h1", investigationId: inv, evidenceId: evidence.id, action: "supports-hypothesis", targetId: "h-onboarding", summary: "Add as supporting evidence for H1 — the new configuration step is where most users stop.", status: "pending" },
      ],
      answers: ["oq-step", "oq-primary"],
    };
  }

  // r-competitors → public research, clearly labelled
  const evidence: EvidenceItem = {
    id: "ev-competitors-public",
    investigationId: inv,
    name: "Competitor onboarding and pricing scan",
    category: "public-research",
    source: "Public web",
    coverage: "Jul – Sep 2026",
    format: "link",
    addedAt: now(),
    description: "Two competitors shortened onboarding in Q3. No major pricing changes found.",
    qualityNote: "Public sources only; may be incomplete.",
  };
  return {
    result: "No major competitor pricing change since July. Two competitors shortened onboarding — context, not a cause.",
    evidence,
    proposals: [],
    answers: [],
  };
}

export type FeedbackResult = { themes: FeedbackTheme[]; finding: Finding; proposals: EvidenceProposal[] };

/** Groups support tickets and in-app feedback into themes. */
export async function analyseExistingFeedback(): Promise<FeedbackResult> {
  await delay(2400);
  return {
    themes: [
      { theme: "Asked to set up payments and shipping before seeing the store", mentions: 71, example: "“I just wanted to see what my store looks like before connecting everything.”" },
      { theme: "Inventory/ERP connection required too early", mentions: 44, example: "“Why do I need my inventory system connected on day one?”" },
      { theme: "Unclear what to do after signing up", mentions: 29, example: "“I signed up and didn't know where to start.”" },
      { theme: "Pricing questions", mentions: 12, example: "“Is the per-store price monthly?”" },
    ],
    finding: {
      id: "f-feedback-insight",
      investigationId: inv,
      kind: "insight",
      statement: "Most onboarding complaints are about configuration required before merchants see their store.",
      confidence: "medium-high",
      confidenceReason: "Consistent across support tickets and in-app feedback; not yet confirmed in interviews.",
      evidenceIds: ["ev-support", "ev-feedback"],
      basedOnFindingIds: ["f-tickets"],
      trail: [
        { text: "Grouped 186 onboarding tickets and 412 in-app comments into themes.", evidenceId: "ev-support" },
        { text: "The two largest themes (115 mentions) are about configuration before first value.", evidenceId: "ev-feedback" },
        { text: "This matches the 2025 learning in Business Memory about configuration." },
      ],
    },
    proposals: [
      { id: "p-feedback-h1", investigationId: inv, evidenceId: "ev-feedback", action: "supports-hypothesis", targetId: "h-onboarding", summary: "Add in-app feedback as supporting evidence for H1 — complaints centre on upfront configuration.", status: "pending" },
    ],
  };
}

export type InterviewGuide = { goal: string; recruit: string[]; questions: { section: string; items: string[] }[]; avoid: string[] };

/** A draft interview guide for the recently-acquired-users research. */
export function getInterviewGuide(): InterviewGuide {
  return {
    goal: "Understand why merchants who signed up after 4 August didn't reach a live store with products.",
    recruit: [
      "5–8 merchants who signed up after 4 August",
      "At least 3 who didn't activate and 2 who did",
      "Mix of paid search and partner/organic signups",
    ],
    questions: [
      {
        section: "Context",
        items: ["What made you sign up for Acme Commerce?", "What were you hoping to have working by the end of the first day?"],
      },
      {
        section: "The first session",
        items: [
          "Walk me through what happened after you created your account.",
          "Was there a moment you stopped or felt stuck? What was happening?",
          "What did you expect to see first?",
        ],
      },
      {
        section: "Configuration",
        items: ["How did you feel about setting up payments and shipping at that point?", "What would you have needed to finish that step?"],
      },
      { section: "Wrap-up", items: ["If you could change one thing about getting started, what would it be?"] },
    ],
    avoid: ["Don't mention the new onboarding or suggest solutions.", "Ask about what happened, not what they'd like."],
  };
}
