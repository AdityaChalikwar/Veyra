import "server-only";
import type { AnalysisResult } from "@/lib/analysis/schema";
import { structureRun } from "@/lib/analysis/structure";
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
  const structured = run?.structured ?? (result ? structureRun(result, (ref) => refs.get(ref)) : { findings: [], hypotheses: [] });
  const live = <T extends { evidenceId: string }>(links: T[]) => links.filter((l) => present.has(l.evidenceId));
  const nameOfEvidence = (id: string) => evidence.find((e) => e.id === id)?.name ?? "a dataset";

  const findings: Finding[] = structured.findings.map((f) => {
    const links = live(f.links);
    return {
      id: f.ref,
      investigationId: id,
      kind: f.kind,
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

  const hypotheses: Hypothesis[] = structured.hypotheses.map((h) => {
    const links = live(h.links);
    const ids = (relation: string) => links.filter((l) => l.relation === relation).map((l) => l.evidenceId);
    return {
      id: h.ref,
      investigationId: id,
      label: h.ref,
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
      status: "open",
    };
  });

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
