/**
 * Evidence analysis — simulated. The real service will parse the file or page,
 * compare it with the investigation and return suggested changes. Here the
 * suggestion comes from keywords in the name, note or link, and file contents
 * are never read.
 */
import type { EvidenceItem, EvidenceProposal, Finding, Hypothesis } from "@/lib/types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type Rule = {
  match: RegExp;
  action: EvidenceProposal["action"];
  targetId: string;
  because: string;
};

const rules: Rule[] = [
  {
    match: /onboard|sign.?up|register|forced|too many steps|first session|configur|setup|set up/i,
    action: "supports-hypothesis",
    targetId: "h-onboarding",
    because: "It describes friction in the new onboarding",
  },
  {
    match: /paid|campaign|\bads?\b|creative|targeting|acquisition|\bcac\b|install/i,
    action: "supports-hypothesis",
    targetId: "h-channel",
    because: "It covers paid acquisition, including who campaigns are reaching",
  },
  {
    match: /competit|rival|market share/i,
    action: "supports-hypothesis",
    targetId: "h-competitor",
    because: "It concerns competitors and their effect on the market",
  },
  {
    match: /funnel|activation|retention|cohort|completion/i,
    action: "supports-finding",
    targetId: "f-activation",
    because: "It covers activation or onboarding funnel data",
  },
];

export type AnalysisResult = { summary: string; proposals: EvidenceProposal[] };

export async function analyseEvidence(
  item: EvidenceItem,
  context: { findings: Finding[]; hypotheses: Hypothesis[] },
): Promise<AnalysisResult> {
  await delay(2500);
  const text = [item.name, item.description, item.url].filter(Boolean).join(" ");
  const fromFileName = item.source === "Uploaded by you";
  const basis = fromFileName ? "Based on the file name (file contents aren't read in this preview): " : "";
  const rule = rules.find((r) => r.match.test(text));

  if (!rule) {
    return {
      summary: `${basis}Veyra couldn't link this to a current finding or hypothesis. It's kept as context.`,
      proposals: [],
    };
  }

  const target =
    rule.action === "supports-hypothesis"
      ? context.hypotheses.find((h) => h.id === rule.targetId)?.statement
      : context.findings.find((f) => f.id === rule.targetId)?.statement;

  return {
    summary: `${basis}${rule.because}.`,
    proposals: [
      {
        id: `p-${item.id}`,
        investigationId: item.investigationId,
        evidenceId: item.id,
        action: rule.action,
        targetId: rule.targetId,
        summary: `Add as supporting evidence for ${rule.action === "supports-hypothesis" ? "the hypothesis" : "the finding"} “${target}”`,
        status: "pending",
      },
    ],
  };
}

/** Records a person's decision on a suggestion. A no-op until the backend exists. */
export async function reviewProposal(proposalId: string, decision: "accepted" | "dismissed"): Promise<void> {
  void proposalId;
  void decision;
}
