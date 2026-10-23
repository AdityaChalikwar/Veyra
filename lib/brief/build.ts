import type { DecisionBrief, DecisionOutcome, InvestigationWorkspace, LiveInvestigation } from "@/lib/types";

/**
 * The Decision Brief (Milestone 9), assembled in code from the investigation's
 * records. Only the parts that need judgement — the executive summary, what
 * the team believes, overall confidence, the recommendation, solution
 * directions, a validation plan and lessons — come from Claude, and code
 * checks those against the records: solution directions only when the
 * evidence allows them, and confidence no higher than validation supports.
 */

export const OUTCOME_LABEL: Record<DecisionOutcome, string> = {
  "solution-exploration": "Proceed to solution exploration",
  "customer-research": "Conduct more customer research",
  "validate-hypothesis": "Validate a hypothesis",
  "investigate-further": "Investigate further",
  "no-intervention": "No product intervention recommended",
  escalate: "Escalate to another business function",
  "prioritize-opportunity": "Prioritize an opportunity",
};

/** What Claude adds to the brief (see lib/brief/generate.ts). */
export type BriefJudgement = {
  executiveSummary: string;
  beliefSummary: string;
  confidence: { level: Level; reason: string };
  recommendation: { outcome: DecisionOutcome; title: string; reasoning: string; wouldChangeIf: string[]; escalateTo: string };
  solutionDirections: { title: string; description: string; assumptions: string[]; risks: string[] }[];
  validationPlan: { what: string; how: string; successSignal: string }[];
  lessons: { title: string; body: string }[];
};

type Live = InvestigationWorkspace & { live: LiveInvestigation };

/** Where the investigation stands, worked out in code. These decide what the brief may recommend. */
export function briefGates(ws: Live) {
  const record = ws.live.record;
  const linked = new Set(ws.hypotheses.map((h) => h.validationId).filter(Boolean));
  const earlier = record.validations.filter((v) => !linked.has(v.id) && v.status === "settled");
  const validationOf = (id?: string) => record.validations.find((v) => v.id === id);

  const confirmed = [
    ...ws.hypotheses.filter((h) => h.status === "confirmed").map((h) => ({ title: h.title ?? h.label, statement: h.statement, reason: validationOf(h.validationId)?.reason ?? "" })),
    ...earlier.filter((v) => v.outcome === "confirmed").map((v) => ({ title: v.hypothesisTitle, statement: v.hypothesisStatement, reason: v.reason })),
  ];
  const rejected = [
    ...ws.hypotheses.filter((h) => h.status === "rejected").map((h) => ({ title: h.title ?? h.label, statement: h.statement, reason: validationOf(h.validationId)?.reason ?? "" })),
    ...earlier.filter((v) => v.outcome === "rejected").map((v) => ({ title: v.hypothesisTitle, statement: v.hypothesisStatement, reason: v.reason })),
  ];
  const untested = ws.hypotheses.filter((h) => h.status !== "confirmed" && h.status !== "rejected");
  const pursued = record.opportunities.filter((o) => o.status === "pursuing");

  const solutionsAllowed = confirmed.length > 0 && pursued.length > 0;
  const solutionsWhy = !confirmed.length
    ? "Not yet. No hypothesis about the cause has been confirmed, so any solution would rest on a guess."
    : !pursued.length
      ? "Not yet. The cause is confirmed, but no opportunity has been chosen to pursue."
      : `The cause is confirmed and the team is pursuing ${pursued.map((o) => `“${o.title}”`).join(", ")}.`;

  const datasetLevels = ws.evidence.map((e) => e.confidence).filter((c) => !!c);
  return { confirmed, rejected, untested, pursued, solutionsAllowed, solutionsWhy, allEvidenceWeak: datasetLevels.length > 0 && datasetLevels.every((c) => c === "low") };
}

/** The recommendation as code allows it: solution exploration only when the evidence supports it, and so on. */
export function settleRecommendation(rec: BriefJudgement["recommendation"], gates: ReturnType<typeof briefGates>, opportunityCount: number): DecisionBrief["recommendation"] {
  const out: DecisionBrief["recommendation"] = { ...rec, wouldChangeIf: rec.wouldChangeIf.slice(0, 5) };
  const change = (to: DecisionOutcome, why: string) => {
    out.changedFrom = rec.outcome;
    out.changedWhy = why;
    out.outcome = to;
    out.title = OUTCOME_LABEL[to];
  };
  if (rec.outcome === "solution-exploration" && !gates.solutionsAllowed) {
    change(gates.untested.length ? "validate-hypothesis" : "customer-research", `Veyra suggested exploring solutions, but ${gates.solutionsWhy.replace(/^Not yet\. /, "").replace(/^./, (c) => c.toLowerCase())}`);
  } else if (rec.outcome === "prioritize-opportunity" && opportunityCount === 0) {
    change("investigate-further", "Veyra suggested prioritising an opportunity, but none has been found yet.");
  }
  return out;
}

type Level = "low" | "medium" | "high";
const RANK: Record<Level, number> = { low: 0, medium: 1, high: 2 };

export function settleConfidence(c: BriefJudgement["confidence"], gates: ReturnType<typeof briefGates>): DecisionBrief["confidence"] {
  if (gates.allEvidenceWeak && c.level !== "low") return { level: "low", reason: c.reason, capped: "Every dataset behind this investigation has low evidence confidence." };
  if (!gates.confirmed.length && RANK[c.level] > RANK.medium) return { level: "medium", reason: c.reason, capped: "No hypothesis about the cause has been confirmed yet." };
  return c;
}

const unique = (items: string[], max: number) => [...new Set(items.map((s) => s.trim()).filter(Boolean))].slice(0, max);

export function assembleBrief(ws: Live, ai: BriefJudgement, now = new Date().toISOString()): DecisionBrief {
  const record = ws.live.record;
  const gates = briefGates(ws);
  const d = record.problemDefinition;
  const decision = record.decisions[0];
  const label = (status: string) => ({ planned: "Planned", "in-progress": "Collecting evidence", settled: "Settled" })[status] ?? status;

  return {
    version: 1,
    generatedAt: now,
    investigationTitle: ws.investigation.title,
    problemAsked: ws.investigation.problem,
    executiveSummary: ai.executiveSummary,
    found: ws.findings.map((f) => ({
      ref: f.id,
      title: f.title ?? "",
      statement: f.statement,
      observed: f.observed ? `${f.observed.measure ? `${f.observed.measure}: ` : ""}${f.observed.values}${f.observed.period ? ` (${f.observed.period})` : ""}` : undefined,
      confidence: f.confidence,
    })),
    believe: {
      summary: ai.beliefSummary,
      validated: gates.confirmed,
      unvalidated: gates.untested.map((h) => ({ ref: h.label, title: h.title ?? "", statement: h.statement, evidenceStatus: h.status === "unclear" ? "tested, unclear" : (h.evidenceStatus ?? "untested") })),
      rejected: gates.rejected,
    },
    evidence: {
      datasets: ws.evidence.map((e) => ({ name: e.name, source: e.source, coverage: e.coverage, confidence: e.confidence, confidenceReason: e.confidenceReason })),
      validationEvidence: record.validations.reduce((n, v) => n + v.notes.length + v.datasets.length, 0),
      researchDone: record.researchTasks.filter((t) => t.status === "done" && t.outcome.trim()).map((t) => ({ title: t.title, outcome: t.outcome })),
    },
    confidence: settleConfidence(ai.confidence, gates),
    unknowns: {
      openQuestions: ws.openQuestions.map((q) => ({ question: q.question, missingEvidence: q.missingEvidence ?? "" })),
      assumptions: unique([...(d?.assumptions ?? []), ...gates.pursued.flatMap((o) => o.assumptions)], 8),
      untested: gates.untested.map((h) => `${h.label}: ${h.title ?? h.statement}`),
    },
    problem: d
      ? { statement: d.statement, affected: d.affected, need: d.need, obstacle: d.obstacle, businessImpact: d.businessImpact, provisional: d.causeStatus === "open" }
      : null,
    opportunity: {
      pursued: gates.pursued.map((o) => ({ title: o.title, customerProblem: o.customerProblem, potentialImpact: o.potentialImpact, dependsOn: o.dependsOn })),
      others: record.opportunities.filter((o) => o.status !== "pursuing").map((o) => ({ title: o.title, status: o.status })),
    },
    solutionDirections: {
      allowed: gates.solutionsAllowed,
      why: gates.solutionsWhy,
      items: gates.solutionsAllowed ? ai.solutionDirections.slice(0, 4) : [],
    },
    recommendation: settleRecommendation(ai.recommendation, gates, record.opportunities.length),
    validationPlan: {
      existing: record.validations.map((v) => ({ hypothesis: v.hypothesisTitle || v.hypothesisStatement, method: v.method || v.test, status: label(v.status), outcome: v.outcome })),
      proposed: ai.validationPlan.slice(0, 3),
    },
    decisionStatus: decision
      ? { decided: true, summary: decision.summary, outcome: decision.outcome, owner: decision.owner, decidedAt: decision.createdAt }
      : { decided: false },
    lessons: ai.lessons.slice(0, 3),
  };
}
