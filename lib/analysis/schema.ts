import { z } from "zod";

/**
 * What Claude returns for an analysis. Findings and hypotheses cite datasets by
 * reference ("E1", "E2"…), each with whether it supports, contradicts or can't
 * settle the statement and what it shows; findings, hypotheses and the problem
 * cite each other by id ("F1", "H1", "Q1"). The engine first decides which
 * investigation step fits (approach), then fills only what that step and the
 * evidence support. Kept to plain types so the same shape is the
 * structured-output schema, the validator and the stored result. Runs saved
 * before a field existed simply lack it, so readers treat newer fields as optional.
 */

const level = z.enum(["low", "medium", "high"]);

/** One dataset cited by a finding or hypothesis, and what it shows for it. */
export const citationSchema = z.object({
  ref: z.string().describe('The dataset reference from the evidence pack, e.g. "E1"'),
  relation: z
    .enum(["supports", "contradicts", "insufficient"])
    .describe("supports or contradicts the statement; insufficient = this dataset was checked but can't settle it"),
  shows: z.string().describe("What this dataset shows for the statement, quoting its figures exactly as the pack gives them"),
});

export const findingSchema = z.object({
  id: z.string().describe('Short id, "F1", "F2"…'),
  kind: z
    .enum(["observation", "interpretation", "insight"])
    .describe("observation = what the data plainly shows; interpretation = what it may mean; insight = a pattern across findings"),
  title: z.string().describe('A headline of at most 8 words for a card, e.g. "Android users fell after 5.2.0". No figures the statement doesn\'t have'),
  statement: z.string().describe("One or two short sentences"),
  confidence: level,
  confidenceReason: z.string().describe("Why the confidence is what it is, including what limits it"),
  observed: z
    .object({
      measure: z.string().describe('One measure, at most 5 words, e.g. "Android daily active users"'),
      values: z.string().describe('Exactly "start → end" with two figures copied from the pack, e.g. "13,717 → 8,587" or "4.1% → 9.8%", or a single figure. Numbers only, no labels, no lists, no semicolons'),
      period: z.string().describe('The period they cover, short, e.g. "31 Aug – 14 Sep"'),
      effect: z.enum(["worse", "better", "neutral"]).describe("For the business, is this change bad (worse), good (better) or neither?"),
    })
    .describe("The measured values behind the statement. Empty strings if the finding has no single measured value"),
  evidence: z.array(citationSchema).describe("Every dataset this rests on or that contradicts it. At least one must support it"),
  basedOnFindings: z.array(z.string()).describe("For interpretations and insights: the finding ids they build on. Empty for observations"),
});

export const hypothesisSchema = z.object({
  id: z.string().describe('"H1", "H2"…'),
  title: z.string().describe("A headline of at most 8 words for a card"),
  statement: z.string().describe("One or two short sentences"),
  rationale: z.string(),
  confidence: level,
  evidenceStrength: z.enum(["weak", "moderate", "strong"]),
  supportingFindings: z.array(z.string()),
  contradictingFindings: z.array(z.string()),
  evidence: z
    .array(citationSchema)
    .describe("Datasets that support or contradict it, and those checked that can't settle it (insufficient)"),
  assumptions: z.array(z.string()).describe("What must be true for this explanation to hold, and hasn't been checked"),
  validationMethod: z.string().describe("The validation requirement: what would have to be shown, and how, to confirm or reject it"),
});

export const openQuestionSchema = z.object({
  id: z.string().describe('"Q1", "Q2"…'),
  question: z.string(),
  whyItMatters: z.string(),
  missingEvidence: z.string().describe("The evidence that is missing today and would answer it"),
});

export const researchMethods = [
  "data-analysis",
  "customer-interviews",
  "survey",
  "feedback-analysis",
  "usability-testing",
  "experiment",
  "desk-research",
] as const;

export const researchTaskSchema = z.object({
  title: z.string().describe("Short, starting with a verb"),
  question: z.string().describe("The question this research answers"),
  answersQuestion: z.string().describe('The open question it answers, e.g. "Q1". Empty if none'),
  testsHypotheses: z.array(z.string()).describe("Hypothesis ids it helps confirm or reject"),
  method: z.enum(researchMethods),
  methodDetail: z.string().describe("What exactly to do: which data, which customers, how many"),
  priority: z.enum(["high", "medium", "low"]).describe("high = the answer would change the conclusion or the next step"),
  why: z.string(),
});

export const approachSchema = z.object({
  step: z
    .enum(["establish-facts", "explain-change", "fill-gaps", "test-hypotheses"])
    .describe(
      "establish-facts = first confirm what happened and how big it is; explain-change = the change is clear, look for causes; fill-gaps = the evidence can't support conclusions, so lead with unknowns and research; test-hypotheses = earlier hypotheses exist, judge them against current evidence",
    ),
  why: z.string().describe("Why this step fits the problem, objective and evidence now"),
  evidenceSufficiency: z.enum(["sufficient", "partial", "insufficient"]).describe("How far the evidence can answer the problem"),
});

export const refinedProblemSchema = z.object({
  statement: z.string().describe("The problem restated using what the evidence shows. A problem, never a solution"),
  whatEvidenceSuggests: z.string(),
  whoIsAffected: z.string(),
  inTheWay: z.string(),
  consequence: z.string(),
  confidence: level,
  findings: z.array(z.string()),
});

export const opportunitySchema = z.object({
  title: z.string(),
  rationale: z.string(),
  confidence: level,
  findings: z.array(z.string()),
});

export const nextStepSchema = z.object({
  type: z.enum(["research", "analysis", "validation", "solution-exploration", "hold"]),
  title: z.string(),
  detail: z.string(),
  why: z.string(),
  whyNotBuildYet: z.string().describe("Why building something is premature. Empty if it is not"),
  wouldChangeIf: z.array(z.string()),
});

/**
 * The analysis runs in two steps, each a smaller structured output (one schema
 * with everything compiles to a grammar the API rejects as too large):
 * 1. evidence: the approach, then findings and hypotheses.
 * 2. plan: from those, open questions, research tasks, the refined problem,
 *    opportunities and the next step.
 */
export const evidenceStepSchema = z.object({
  approach: approachSchema,
  summary: z.string().describe("At most two short sentences (under 40 words): what the evidence says and how far to trust it"),
  findings: z.array(findingSchema),
  hypotheses: z.array(hypothesisSchema),
  dataLimits: z.array(z.string()).describe("Things this data cannot show"),
});

export const planStepSchema = z.object({
  openQuestions: z.array(openQuestionSchema),
  researchTasks: z.array(researchTaskSchema).describe("What to do to answer the open questions and test the hypotheses, most important first"),
  refinedProblem: refinedProblemSchema,
  opportunities: z.array(opportunitySchema),
  nextStep: nextStepSchema,
});

/** The whole analysis as stored: both steps together. */
export const analysisSchema = evidenceStepSchema.extend(planStepSchema.shape);

export type AnalysisCitation = z.infer<typeof citationSchema>;
export type AnalysisFinding = z.infer<typeof findingSchema>;
export type AnalysisHypothesis = z.infer<typeof hypothesisSchema>;
export type AnalysisOpenQuestion = z.infer<typeof openQuestionSchema>;
export type AnalysisResearchTask = z.infer<typeof researchTaskSchema>;
export type AnalysisApproach = z.infer<typeof approachSchema>;
export type ResearchMethodKey = (typeof researchMethods)[number];
export type AnalysisOpportunity = z.infer<typeof opportunitySchema>;
export type AnalysisNextStep = z.infer<typeof nextStepSchema>;
export type AnalysisResult = z.infer<typeof analysisSchema>;
export type EvidenceStep = z.infer<typeof evidenceStepSchema>;
export type PlanStep = z.infer<typeof planStepSchema>;
