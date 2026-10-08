import "server-only";
import type { AnalysisResult } from "@/lib/analysis/schema";
import type {
  AnalysisRunRecord,
  Confidence,
  DataSource,
  EvidenceItem,
  Finding,
  Hypothesis,
  InvestigationRecord,
  InvestigationWorkspace,
  NextStep,
  OpenQuestion,
  Opportunity,
} from "@/lib/types";

/**
 * The workspace for the team's own investigation, built only from what is saved:
 * the investigation, its uploaded evidence and its latest completed analysis.
 * Anything not produced yet (research, customers, validation…) is left empty so
 * the screens say so instead of showing made-up content.
 */
export function buildLiveWorkspace(record: InvestigationRecord, dataSources: DataSource[]): InvestigationWorkspace {
  const id = record.summary.id;
  const run = record.analysisRuns.find((r): r is AnalysisRunRecord & { result: AnalysisResult } => r.status === "completed" && !!r.result);
  const result = run?.result;

  const evidence: EvidenceItem[] = record.uploads
    .filter((u) => u.status === "ready" && u.evidenceId)
    .map((u) => ({
      id: u.evidenceId!,
      investigationId: id,
      name: u.name,
      category: "company-data",
      source: "Uploaded by you",
      coverage: u.coverage,
      format: "csv",
      addedAt: u.addedAt,
      description: u.summary,
      preview: u.profile ? { columns: u.profile.preview.columns, rows: u.profile.preview.rows.slice(0, 5) } : undefined,
    }));

  // The analysis cites datasets as "E1", "E2"…; map them back to evidence ids.
  const refs = new Map(run?.datasets.map((d) => [d.ref, d.evidenceId]) ?? []);
  const toEvidence = (list: string[]) => list.map((r) => refs.get(r)).filter((e): e is string => !!e && evidence.some((x) => x.id === e));
  const nameOf = (ref: string) => run?.datasets.find((d) => d.ref === ref)?.name;

  const findings: Finding[] = (result?.findings ?? []).map((f) => ({
    id: f.id,
    investigationId: id,
    kind: f.kind,
    statement: f.statement,
    confidence: f.confidence,
    confidenceReason: f.confidenceReason,
    evidenceIds: toEvidence(f.evidence),
    basedOnFindingIds: f.basedOnFindings.length ? f.basedOnFindings : undefined,
    trail: [
      ...f.evidence.map((r) => ({ text: `Read from ${nameOf(r) ?? r}, using figures worked out by plain calculation.`, evidenceId: refs.get(r) })),
      ...(f.basedOnFindings.length ? [{ text: `Builds on ${f.basedOnFindings.join(", ")}.` }] : []),
      { text: f.confidenceReason },
    ],
  }));

  const openQuestions: OpenQuestion[] = result
    ? result.openQuestions.map((q, i) => ({
        id: `q${i + 1}`,
        investigationId: id,
        question: q.question,
        whyItMatters: q.wouldBeAnsweredBy ? `${q.whyItMatters} Answered by: ${q.wouldBeAnsweredBy}` : q.whyItMatters,
      }))
    : // Before any analysis, the clarifying questions nobody answered are what Veyra doesn't know.
      record.questions
        .filter((q) => !q.answer.trim())
        .map((q) => ({ id: q.id, investigationId: id, question: q.question, whyItMatters: q.hint ?? "Unanswered when the investigation was created." }));

  const hypotheses: Hypothesis[] = (result?.hypotheses ?? []).map((h) => ({
    id: h.id,
    investigationId: id,
    label: h.id,
    statement: h.statement,
    confidence: h.confidence,
    evidenceStrength: h.evidenceStrength,
    rationale: h.rationale,
    supportingFindingIds: h.supportingFindings,
    contradictingFindingIds: h.contradictingFindings,
    openQuestions: [],
    validationMethod: h.validationMethod,
    status: "open",
  }));

  const opportunities: Opportunity[] = (result?.opportunities ?? []).map((o, i) => ({
    id: `o${i + 1}`,
    investigationId: id,
    title: o.title,
    description: o.rationale,
    evidenceStrength: o.confidence === "high" ? "strong" : o.confidence === "medium" ? "moderate" : "weak",
    confidence: o.confidence,
    assessment: [],
    ideas: [],
  }));

  const nextStep: NextStep = result
    ? {
        id: "next",
        investigationId: id,
        type: result.nextStep.type,
        title: result.nextStep.title,
        detail: result.nextStep.detail,
        why: result.nextStep.why,
        whyNotBuildYet: result.nextStep.whyNotBuildYet || undefined,
        researchTaskIds: [],
        wouldChangeIf: result.nextStep.wouldChangeIf,
        alternatives: [],
      }
    : evidence.length
      ? {
          id: "next",
          investigationId: id,
          type: "analysis",
          title: "Analyse your data",
          detail: "Veyra reads what your uploaded data shows and turns it into findings, hypotheses and a recommended next step.",
          why: "Your data is uploaded but hasn't been analysed yet.",
          researchTaskIds: [],
          wouldChangeIf: [],
          alternatives: [],
        }
      : {
          id: "next",
          investigationId: id,
          type: "research",
          title: "Add data",
          detail: "Upload a CSV export, such as events, sign-ups, orders or support tickets.",
          why: "Veyra only says what your own data shows, so it needs data first.",
          researchTaskIds: [],
          wouldChangeIf: [],
          alternatives: [],
        };

  const confidence: Confidence = result?.refinedProblem.confidence ?? record.summary.confidence;

  return {
    investigation: {
      ...record.summary,
      confidence,
      evidenceCount: evidence.length,
      hypothesisCount: hypotheses.length,
      openQuestionCount: openQuestions.length,
      subtitle: record.objective,
      trigger: record.trigger ?? "other",
      outcome: record.outcome ?? "other",
      createdAt: record.createdAt,
    },
    stages: record.stages,
    plan: record.plan ?? { summary: "", methods: [], notUsed: [] },
    questions: record.questions,
    kpis: [],
    trend: { title: "", metric: "", unit: "", points: [] },
    rates: { title: "", primaryLabel: "", secondaryLabel: "", points: [] },
    map: { root: { label: record.summary.title, value: "" }, branches: [] },
    evidence,
    findings,
    openQuestions,
    hypotheses,
    researchTasks: [],
    customers: { segments: [], themes: [], tools: [] },
    market: { status: "not-started", summary: "" },
    problem: {
      original: record.summary.problem,
      whatEvidenceSuggests: result?.refinedProblem.whatEvidenceSuggests ?? "",
      refined: result?.refinedProblem.statement ?? "",
      whoIsAffected: result?.refinedProblem.whoIsAffected ?? "",
      tryingTo: "",
      inTheWay: result?.refinedProblem.inTheWay ?? "",
      consequence: result?.refinedProblem.consequence ?? "",
      confidence,
      findingIds: result?.refinedProblem.findings ?? [],
    },
    opportunities,
    nextStep,
    validations: [],
    relatedMemory: [],
    conversation: [],
    proposals: [],
    notes: [],
    live: { record, dataSources, run },
  };
}
