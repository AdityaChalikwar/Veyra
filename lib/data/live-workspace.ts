import "server-only";
import type { AnalysisResult } from "@/lib/analysis/schema";
import { structureRun, type StructuredRun } from "@/lib/analysis/structure";
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
  ResearchMethod,
  ResearchTask,
  ResearchTaskRecord,
} from "@/lib/types";

const methodLabel: Record<ResearchTaskRecord["method"], ResearchMethod> = {
  "data-analysis": "Analytics",
  "customer-interviews": "Customer interviews",
  survey: "Survey",
  "feedback-analysis": "Feedback analysis",
  "usability-testing": "Usability testing",
  experiment: "Experiment",
  "desk-research": "Desk research",
};

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
    .map<EvidenceItem>((u) => ({
      id: u.evidenceId!,
      investigationId: id,
      name: u.name,
      category: "company-data",
      source: "Uploaded by you",
      coverage: u.coverage,
      format: "csv",
      addedAt: u.addedAt,
      description: u.summary,
      confidence: u.confidence,
      confidenceReason: u.confidenceReason,
      preview: u.profile ? { columns: u.profile.preview.columns, rows: u.profile.preview.rows.slice(0, 5) } : undefined,
    }))
    .concat(
      record.sourceEvidence.map<EvidenceItem>((e) => ({
        id: e.evidenceId,
        investigationId: id,
        name: e.name,
        category: "company-data",
        source: e.source,
        dataset: e.name,
        coverage: e.coverage,
        format: "dataset",
        addedAt: e.addedAt,
        description: e.summary,
        confidence: e.confidence,
        confidenceReason: e.confidenceReason,
        preview: e.profile ? { columns: e.profile.preview.columns, rows: e.profile.preview.rows.slice(0, 5) } : undefined,
      })),
    );

  // Findings and hypotheses come from the saved rows; runs saved before the rows existed are read from their JSON.
  const refs = new Map(run?.datasets.map((d) => [d.ref, d.evidenceId]) ?? []);
  const present = new Set(evidence.map((e) => e.id));
  const structured: StructuredRun = run?.structured ?? (result ? structureRun(result, (ref) => refs.get(ref)) : { findings: [], hypotheses: [], openQuestions: [] });
  const live = <T extends { evidenceId: string }>(links: T[]) => links.filter((l) => present.has(l.evidenceId));
  const nameOfEvidence = (id: string) => evidence.find((e) => e.id === id)?.name ?? "a dataset";

  const findings: Finding[] = structured.findings.map((f) => {
    const links = live(f.links);
    return {
      id: f.ref,
      investigationId: id,
      kind: f.kind,
      title: f.title || undefined,
      statement: f.statement,
      confidence: f.confidence,
      confidenceReason: f.confidenceReason,
      evidenceIds: links.filter((l) => l.relation === "supports").map((l) => l.evidenceId),
      evidenceLinks: links,
      observed: f.observed,
      basedOnFindingIds: f.basedOn.length ? f.basedOn : undefined,
      trail: [
        ...links.map((l) => ({
          text: `${l.relation === "contradicts" ? "Checked against" : "Read from"} ${nameOfEvidence(l.evidenceId)}${l.shows ? `: ${l.shows}` : ", using figures worked out by plain calculation."}`,
          evidenceId: l.evidenceId,
        })),
        ...(f.basedOn.length ? [{ text: `Builds on ${f.basedOn.join(", ")}.` }] : []),
        { text: f.confidenceReason },
      ],
    };
  });

  const tasks: ResearchTask[] = record.researchTasks.map((t) => ({
    id: t.id,
    investigationId: id,
    title: t.title,
    question: t.question,
    method: methodLabel[t.method],
    priority: t.priority,
    status: t.status,
    runnable: false,
    result: t.outcome || undefined,
  }));
  // The open question each run's tasks answer, by the run's own reference.
  const taskFor = (ref: string) => record.researchTasks.find((t) => t.runId === run?.id && t.questionRef === ref && t.status !== "dropped")?.id;

  const openQuestions: OpenQuestion[] = result
    ? structured.openQuestions.map((q) => ({
        id: q.ref,
        investigationId: id,
        question: q.question,
        whyItMatters: q.whyItMatters,
        missingEvidence: q.missingEvidence || undefined,
        researchTaskId: taskFor(q.ref),
      }))
    : // Before any analysis, the clarifying questions nobody answered are what Veyra doesn't know.
      record.questions
        .filter((q) => !q.answer.trim())
        .map((q) => ({ id: q.id, investigationId: id, question: q.question, whyItMatters: q.hint ?? "Unanswered when the investigation was created." }));

  const hypotheses: Hypothesis[] = structured.hypotheses.map((h) => {
    const links = live(h.links);
    const ids = (relation: string) => links.filter((l) => l.relation === relation).map((l) => l.evidenceId);
    return {
      id: h.ref,
      investigationId: id,
      label: h.ref,
      title: h.title || undefined,
      statement: h.statement,
      confidence: h.confidence,
      evidenceStrength: h.evidenceStrength,
      rationale: h.rationale,
      supportingFindingIds: h.supportingFindings,
      contradictingFindingIds: h.contradictingFindings,
      supportingEvidenceIds: ids("supports"),
      contradictingEvidenceIds: ids("contradicts"),
      insufficientEvidenceIds: ids("insufficient"),
      evidenceLinks: links,
      evidenceStatus: h.evidenceStatus,
      openQuestions: [],
      validationMethod: h.validationMethod,
      assumptions: h.assumptions,
      status: "open",
    };
  });

  // Problem definition and opportunities are separate steps the team asks for (Milestone 8).
  const definition = record.problemDefinition;
  const opportunities: Opportunity[] = record.opportunities.map((o) => ({
    id: o.id,
    investigationId: id,
    title: o.title,
    description: o.customerProblem,
    evidenceStrength: o.confidence === "high" ? "strong" : o.confidence === "medium" ? "moderate" : "weak",
    impact: o.impactLevel,
    confidence: o.confidence,
    assessment: [],
    ideas: [],
  }));

  const step = structured.nextStep ?? (result && { ...result.nextStep, approach: result.approach });
  const nextStep: NextStep = step
    ? {
        id: "next",
        investigationId: id,
        type: step.type,
        title: step.title,
        detail: step.detail,
        why: step.why,
        whyNotBuildYet: step.whyNotBuildYet || undefined,
        researchTaskIds: tasks.filter((t) => t.status === "not-started" && t.priority === "high").map((t) => t.id),
        wouldChangeIf: step.wouldChangeIf,
        alternatives: [],
        approach: step.approach,
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

  const confidence: Confidence = definition?.confidence ?? record.summary.confidence;

  return {
    investigation: {
      ...record.summary,
      confidence,
      evidenceCount: evidence.length,
      hypothesisCount: hypotheses.length,
      openQuestionCount: openQuestions.length,
      subtitle: record.objective,
      triggers: record.triggers,
      outcomes: record.outcomes,
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
    researchTasks: tasks,
    customers: { segments: [], themes: [], tools: [] },
    market: { status: "not-started", summary: "" },
    problem: {
      original: record.summary.problem,
      whatEvidenceSuggests: result?.summary ?? "",
      refined: definition?.statement ?? "",
      whoIsAffected: definition?.affected ?? "",
      tryingTo: definition?.need ?? "",
      inTheWay: definition?.obstacle ?? "",
      consequence: definition?.businessImpact ?? "",
      confidence,
      findingIds: definition?.findingRefs ?? [],
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
