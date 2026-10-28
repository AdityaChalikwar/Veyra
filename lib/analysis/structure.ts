import type { AnalysisResult, ResearchMethodKey } from "./schema";
import type { Verdict } from "@/lib/types";

/**
 * An analysis run as evidence-engine rows: findings and hypotheses, each with
 * links to the evidence items they rest on. Used to save a finished run, and
 * to read runs saved before the rows existed (whose findings cited datasets as
 * plain references, all supporting).
 */

export type EvidenceRelation = "supports" | "contradicts" | "insufficient";
export type EvidenceStatus = "supported" | "contradicted" | "mixed" | "insufficient";
export type StructuredLink = { evidenceId: string; relation: EvidenceRelation; shows: string };
export type Observed = { measure: string; values: string; period: string; /** Bad, good or neither for the business; absent on older runs. */ effect?: "worse" | "better" | "neutral" };

export type StructuredFinding = {
  ref: string;
  /** Short headline for cards; empty for runs saved before titles existed. */
  title: string;
  kind: "observation" | "interpretation" | "insight";
  statement: string;
  observed?: Observed;
  confidence: "low" | "medium" | "high";
  confidenceReason: string;
  basedOn: string[];
  links: StructuredLink[];
};

export type StructuredHypothesis = {
  ref: string;
  title: string;
  statement: string;
  rationale: string;
  confidence: "low" | "medium" | "high";
  evidenceStrength: "weak" | "moderate" | "strong";
  evidenceStatus: EvidenceStatus;
  supportingFindings: string[];
  contradictingFindings: string[];
  validationMethod: string;
  assumptions: string[];
  links: StructuredLink[];
  /** The team's validation status (saved rows only). */
  status?: "open" | Verdict;
  validationId?: string;
};

export type StructuredQuestion = { ref: string; question: string; whyItMatters: string; missingEvidence: string };

export type StructuredResearchTask = {
  title: string;
  question: string;
  questionRef?: string;
  hypothesisRefs: string[];
  method: ResearchMethodKey;
  methodDetail: string;
  priority: "high" | "medium" | "low";
  rationale: string;
};

export type Approach = {
  step: "establish-facts" | "explain-change" | "fill-gaps" | "test-hypotheses";
  why: string;
  evidenceSufficiency: "sufficient" | "partial" | "insufficient";
};

export type StructuredNextStep = {
  approach?: Approach;
  type: "research" | "analysis" | "validation" | "solution-exploration" | "hold";
  title: string;
  detail: string;
  why: string;
  whyNotBuildYet: string;
  wouldChangeIf: string[];
};

/** A run's artifacts as the screens read them. Research tasks belong to the investigation, so they're read separately. */
export type StructuredRun = {
  findings: StructuredFinding[];
  hypotheses: StructuredHypothesis[];
  openQuestions: StructuredQuestion[];
  nextStep?: StructuredNextStep;
};

type Citation = string | { ref: string; relation: EvidenceRelation; shows: string };

/** What the evidence says overall, from what supports and what contradicts. */
export function evidenceStatus(supports: number, contradicts: number): EvidenceStatus {
  if (supports && contradicts) return "mixed";
  if (supports) return "supported";
  if (contradicts) return "contradicted";
  return "insufficient";
}

export function structureRun(result: AnalysisResult, evidenceFor: (ref: string) => string | undefined) {
  const toLinks = (list: Citation[] | undefined): StructuredLink[] => {
    const out = new Map<string, StructuredLink>();
    for (const c of list ?? []) {
      const cite = typeof c === "string" ? { ref: c, relation: "supports" as const, shows: "" } : c;
      const evidenceId = evidenceFor(cite.ref);
      if (evidenceId && !out.has(evidenceId)) out.set(evidenceId, { evidenceId, relation: cite.relation, shows: cite.shows ?? "" });
    }
    return [...out.values()];
  };

  const findings: StructuredFinding[] = result.findings.map((f) => ({
    ref: f.id,
    title: f.title ?? "",
    kind: f.kind,
    statement: f.statement,
    observed: f.observed?.values?.trim() ? f.observed : undefined,
    confidence: f.confidence,
    confidenceReason: f.confidenceReason,
    basedOn: f.basedOnFindings ?? [],
    links: toLinks(f.evidence as Citation[]),
  }));

  const hypotheses: StructuredHypothesis[] = result.hypotheses.map((h) => {
    const links = toLinks(h.evidence as Citation[] | undefined);
    const supports = h.supportingFindings.length + links.filter((l) => l.relation === "supports").length;
    const contradicts = h.contradictingFindings.length + links.filter((l) => l.relation === "contradicts").length;
    return {
      ref: h.id,
      title: h.title ?? "",
      statement: h.statement,
      rationale: h.rationale,
      confidence: h.confidence,
      evidenceStrength: h.evidenceStrength,
      evidenceStatus: evidenceStatus(supports, contradicts),
      supportingFindings: h.supportingFindings,
      contradictingFindings: h.contradictingFindings,
      validationMethod: h.validationMethod,
      assumptions: h.assumptions ?? [],
      links,
    };
  });

  // Runs saved before questions had ids or named their missing evidence.
  type OldQuestion = { id?: string; question: string; whyItMatters: string; missingEvidence?: string; wouldBeAnsweredBy?: string };
  const openQuestions: StructuredQuestion[] = (result.openQuestions as OldQuestion[]).map((q, i) => ({
    ref: q.id || `Q${i + 1}`,
    question: q.question,
    whyItMatters: q.whyItMatters,
    missingEvidence: q.missingEvidence ?? q.wouldBeAnsweredBy ?? "",
  }));

  const researchTasks: StructuredResearchTask[] = (result.researchTasks ?? []).map((t) => ({
    title: t.title,
    question: t.question,
    questionRef: t.answersQuestion || undefined,
    hypothesisRefs: t.testsHypotheses,
    method: t.method,
    methodDetail: t.methodDetail,
    priority: t.priority,
    rationale: t.why,
  }));

  const nextStep: StructuredNextStep = { ...result.nextStep, approach: result.approach };

  return { findings, hypotheses, openQuestions, researchTasks, nextStep };
}
