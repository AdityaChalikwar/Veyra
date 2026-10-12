import { z } from "zod";

/**
 * What Claude returns for an analysis. Findings and hypotheses cite datasets by
 * reference ("E1", "E2"…), each with whether it supports, contradicts or can't
 * settle the statement and what it shows; findings, hypotheses and the problem
 * cite each other by id ("F1", "H1"). Kept to plain types so the same shape is the
 * structured-output schema, the validator and the stored result.
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
  statement: z.string(),
  confidence: level,
  confidenceReason: z.string().describe("Why the confidence is what it is, including what limits it"),
  observed: z
    .object({
      measure: z.string().describe('What was measured, e.g. "Kitchen return rate"'),
      values: z.string().describe('The values seen, copied from the pack, e.g. "4.1% → 9.8%" or "214 notes"'),
      period: z.string().describe('The period they cover, e.g. "Jun – Sep 2026"'),
    })
    .describe("The measured values behind the statement. Empty strings if the finding has no single measured value"),
  evidence: z.array(citationSchema).describe("Every dataset this rests on or that contradicts it. At least one must support it"),
  basedOnFindings: z.array(z.string()).describe("For interpretations and insights: the finding ids they build on. Empty for observations"),
});

export const hypothesisSchema = z.object({
  id: z.string().describe('"H1", "H2"…'),
  statement: z.string(),
  rationale: z.string(),
  confidence: level,
  evidenceStrength: z.enum(["weak", "moderate", "strong"]),
  supportingFindings: z.array(z.string()),
  contradictingFindings: z.array(z.string()),
  evidence: z
    .array(citationSchema)
    .describe("Datasets that support or contradict it, and those checked that can't settle it (insufficient)"),
  validationMethod: z.string().describe("How the team could test this, usually with customers or a controlled comparison"),
});

export const openQuestionSchema = z.object({
  question: z.string(),
  whyItMatters: z.string(),
  wouldBeAnsweredBy: z.string().describe("The data or research that would answer it"),
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

export const analysisSchema = z.object({
  summary: z.string().describe("Two or three plain sentences: what the evidence says and how far to trust it"),
  findings: z.array(findingSchema),
  hypotheses: z.array(hypothesisSchema),
  openQuestions: z.array(openQuestionSchema),
  refinedProblem: refinedProblemSchema,
  opportunities: z.array(opportunitySchema),
  nextStep: nextStepSchema,
  dataLimits: z.array(z.string()).describe("Things this data cannot show"),
});

export type AnalysisCitation = z.infer<typeof citationSchema>;
export type AnalysisFinding = z.infer<typeof findingSchema>;
export type AnalysisHypothesis = z.infer<typeof hypothesisSchema>;
export type AnalysisOpenQuestion = z.infer<typeof openQuestionSchema>;
export type AnalysisOpportunity = z.infer<typeof opportunitySchema>;
export type AnalysisNextStep = z.infer<typeof nextStepSchema>;
export type AnalysisResult = z.infer<typeof analysisSchema>;
