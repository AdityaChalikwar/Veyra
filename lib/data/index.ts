/**
 * Data access layer.
 *
 * Every screen reads data through these functions — never from `/mocks` directly.
 * Functions are moving from mock data to Supabase one area at a time; the
 * signatures (and `lib/types.ts`) are the contract the UI depends on.
 *
 * Real today: the signed-in user, their company (workspace), business context,
 * and investigations (problem, context, clarifying questions, plan).
 *
 * Every workspace also has a sample investigation. Its row is real (so it can
 * be listed and removed) but its content is the Kitchen Returns Spike demo from /mocks,
 * until evidence and analysis are stored in the database.
 */
import "server-only";
import { getSession, requireWorkspace } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buildDataSources } from "@/mocks/data-sources";
import { cache } from "react";
import { formatRange } from "@/lib/analysis/format";
import type { AnalysisPack } from "@/lib/analysis/pack";
import { buildLiveWorkspace } from "./live-workspace";
import { listConnectedSources } from "./sources";
import type { AnalysisResult } from "@/lib/analysis/schema";
import { assessEvidence } from "@/lib/analysis/confidence";
import type { Approach, StructuredFinding, StructuredHypothesis, StructuredLink, StructuredNextStep } from "@/lib/analysis/structure";
import { buildSampleWorkspace, SAMPLE_ID, sampleOpenQuestions } from "@/mocks/sample-investigation";
import { buildDecisions } from "@/mocks/decisions";
import { buildEvidence } from "@/mocks/evidence";
import { buildSampleSummary } from "@/mocks/investigations";
import type { Json, Tables } from "@/lib/supabase/database.types";
import type {
  AnalysisRunRecord,
  BusinessContext,
  BusinessMemory,
  Company,
  Confidence,
  DataMetric,
  DatasetProfile,
  DataSource,
  DecisionRecord,
  EvidenceCategory,
  EvidenceFormat,
  EvidenceStrength,
  EvidenceWithContext,
  InvestigationOutcome,
  InvestigationPlan,
  InvestigationRecord,
  InvestigationStatus,
  InvestigationSummary,
  InvestigationTopic,
  InvestigationTrigger,
  InvestigationWorkspace,
  Level,
  MemoryCategory,
  MemoryEntry,
  MemoryStory,
  StageKey,
  UploadedEvidence,
  User,
  ResearchTaskRecord,
  ProblemDefinitionRecord,
  OpportunityRecord,
  ValidationRecord,
  InvestigationDecision,
  DecisionOutcome,
  DecisionBrief,
} from "@/lib/types";

export async function getCurrentUser(): Promise<User | null> {
  return (await getSession())?.user ?? null;
}

/** The signed-in user's workspace (created on first use). */
export async function getCompany(): Promise<Company | null> {
  return (await requireWorkspace()).company;
}

/** Persistent business context shared by every investigation. Optional: empty until someone fills it in. */
export async function getBusinessContext(): Promise<BusinessContext> {
  const { company } = await requireWorkspace();
  const empty: BusinessContext = { company: "", product: "", businessModel: "", targetCustomers: "", goals: [], priorities: [], keyMetrics: [] };
  const supabase = await createClient();
  const { data } = await supabase
    .from("business_contexts")
    .select("company_name, product, business_model, target_customers, goals, priorities, key_metrics")
    .eq("workspace_id", company.id)
    .maybeSingle();
  if (!data) return empty;
  return {
    company: data.company_name,
    product: data.product,
    businessModel: data.business_model,
    targetCustomers: data.target_customers,
    goals: data.goals,
    priorities: data.priorities,
    keyMetrics: data.key_metrics,
  };
}

/* ── Investigations ─────────────────────────────────────────────────── */

/** Discovery stages in order, as stored in investigation_stages. */
const STAGES: { key: StageKey; label: string }[] = [
  { key: "problem_definition", label: "Problem definition" },
  { key: "add_data", label: "Add data" },
  { key: "analysis", label: "Analysis" },
  { key: "problem_validation", label: "Problem validation" },
  { key: "opportunity_discovery", label: "Opportunity discovery" },
];

/** The sample's content still uses these IDs inside /mocks. */
const SAMPLE_MOCK_ID = SAMPLE_ID;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type InvestigationRow = Pick<
  Tables<"investigations">,
  "id" | "title" | "problem" | "topic" | "status" | "confidence" | "is_sample" | "updated_at" | "current_stage"
> & { clarifying_questions: { answer: string }[]; evidence: { count: number }[] };

/** Where an investigation is, in the words the status badge uses, follows its stage. */
const stageStatus: Record<StageKey, InvestigationStatus> = {
  problem_definition: "planning",
  add_data: "investigating",
  analysis: "investigating",
  problem_validation: "validating",
  opportunity_discovery: "opportunity-discovery",
};

function toSummary(row: InvestigationRow): InvestigationSummary {
  if (row.is_sample) return { ...buildSampleSummary(), id: row.id };
  return {
    id: row.id,
    title: row.title,
    topic: row.topic as InvestigationTopic,
    status: row.status === "completed" ? "completed" : stageStatus[row.current_stage as StageKey],
    problem: row.problem,
    evidenceCount: row.evidence[0]?.count ?? 0,
    hypothesisCount: 0,
    // Until analysis exists, unanswered clarifying questions are the open questions.
    openQuestionCount: row.clarifying_questions.filter((q) => !q.answer.trim()).length,
    confidence: row.confidence as Confidence,
    updatedAt: row.updated_at,
  };
}

/** All investigations in the user's workspace, most recently updated first. */
export const listInvestigations = cache(async (): Promise<InvestigationSummary[]> => {
  // On someone's first visit the workspace (and its sample) is created here, before reading.
  await requireWorkspace();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("investigations")
    .select("id, title, problem, topic, status, confidence, is_sample, updated_at, current_stage, clarifying_questions (answer), evidence (count)")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(`Couldn't load investigations: ${error.message}`);
  // Real investigations first; the sample after them.
  const rows = (data ?? []).map(toSummary);
  return [...rows.filter((r) => !r.isSample), ...rows.filter((r) => r.isSample)];
});

export async function getInvestigationSummary(id: string): Promise<InvestigationSummary | undefined> {
  if (!UUID.test(id)) return undefined;
  return (await listInvestigations()).find((i) => i.id === id);
}

/** Open investigations, most recently updated first (the sample last). */
export async function listActiveInvestigations(limit?: number): Promise<InvestigationSummary[]> {
  const active = (await listInvestigations()).filter((i) => i.status !== "completed");
  return limit ? active.slice(0, limit) : active;
}

/** Everything the brief page shows for a saved (not yet analysed) investigation. */
export async function getInvestigationRecord(id: string): Promise<InvestigationRecord | undefined> {
  const summary = await getInvestigationSummary(id);
  if (!summary || summary.isSample) return undefined;
  const supabase = await createClient();
  const { data } = await supabase
    .from("investigations")
    .select(
      "triggers, outcomes, objective, current_stage, known_context, attachments, data_source_ids, plan, created_at, clarifying_questions (id, position, question, hint, answer), files (id, name, size_bytes, status, error, created_at, evidence (id, summary, coverage, profile, metrics, confidence, metadata)), investigation_stages (stage, completed_at), evidence (id, name, source, coverage, summary, profile, metrics, snapshot_id, file_id, confidence, metadata, created_at), analysis_runs (id, status, model, created_at, completed_at, error, result, pack, usage), findings (analysis_run_id, ref, position, kind, title, statement, observed, confidence, confidence_reason, based_on, evidence_links (evidence_id, relation, shows)), hypotheses (analysis_run_id, ref, position, title, statement, rationale, confidence, evidence_strength, evidence_status, supporting_findings, contradicting_findings, validation_method, assumptions, status, validation_id, evidence_links (evidence_id, relation, shows)), open_questions (analysis_run_id, ref, position, question, why_it_matters, missing_evidence), next_steps (analysis_run_id, approach, approach_reason, evidence_sufficiency, type, title, detail, why, why_not_build_yet, would_change_if), problem_definitions (id, analysis_run_id, cause_status, statement, affected, need, obstacle, business_impact, confidence, confidence_reason, assumptions, finding_refs, hypothesis_refs, created_at, evidence_links (evidence_id, relation, shows), opportunities (id, position, title, customer_problem, potential_impact, impact_level, confidence, assumptions, validation_needs, finding_refs, depends_on, status, evidence_links (evidence_id, relation, shows))), research_tasks (id, analysis_run_id, position, title, question, method, method_detail, priority, status, rationale, question_ref, hypothesis_refs, outcome, created_at, updated_at), validations (id, hypothesis_title, hypothesis_statement, method, test, confirm_if, reject_if, status, outcome, reason, settled_at, created_at, validation_notes (id, kind, relation, body, research_task_id, created_at), evidence_links (id, evidence_id, relation, shows)), decisions (id, outcome, summary, rationale, opportunity_id, opportunity_title, escalate_to, options_rejected, risks, owner, success_measure, review_date, result, warnings, status, created_at), decision_briefs (id, content, share_token, created_at)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return undefined;
  return {
    summary,
    objective: data.objective,
    currentStage: data.current_stage as StageKey,
    stages: STAGES.map(({ key, label }) => {
      const row = data.investigation_stages.find((s) => s.stage === key);
      return { id: key, label, status: !row ? "pending" : row.completed_at ? "done" : "in-progress" };
    }),
    triggers: data.triggers as InvestigationTrigger[],
    outcomes: data.outcomes as InvestigationOutcome[],
    knownContext: data.known_context,
    attachments: data.attachments,
    dataSourceIds: data.data_source_ids,
    plan: data.plan as InvestigationPlan | null,
    createdAt: data.created_at,
    analysisRuns: [...data.analysis_runs]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 10)
      .map((r) => toAnalysisRun(r, data.findings, data.hypotheses, data.open_questions, data.next_steps)),
    ...toDiscovery(data.problem_definitions),
    validations: [...data.validations].sort((a, b) => a.created_at.localeCompare(b.created_at)).map(toValidation),
    decisions: [...data.decisions]
      .filter((d) => d.status === "decided")
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(toDecision),
    brief: [...data.decision_briefs]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 1)
      .map((b) => ({ id: b.id, content: b.content as unknown as DecisionBrief, shareToken: b.share_token ?? undefined, createdAt: b.created_at }))[0],
    researchTasks: [...data.research_tasks]
      .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.position - b.position)
      .map(toResearchTask),
    uploads: [...data.files]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((f) => ({
        fileId: f.id,
        evidenceId: f.evidence?.id,
        name: f.name,
        sizeBytes: f.size_bytes,
        status: f.status as UploadedEvidence["status"],
        error: f.error ?? undefined,
        summary: f.evidence?.summary,
        coverage: f.evidence?.coverage ?? undefined,
        profile: (f.evidence?.profile ?? undefined) as DatasetProfile | undefined,
        metrics: (f.evidence?.metrics ?? undefined) as DataMetric[] | undefined,
        ...trustOf(f.evidence),
        addedAt: f.created_at,
      })),
    sourceEvidence: [...data.evidence]
      .filter((e) => !e.file_id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((e) => ({
        evidenceId: e.id,
        snapshotId: e.snapshot_id ?? undefined,
        name: e.name,
        source: e.source,
        coverage: e.coverage ?? undefined,
        summary: e.summary,
        profile: (e.profile ?? undefined) as DatasetProfile | undefined,
        metrics: (e.metrics ?? []) as DataMetric[],
        ...trustOf(e),
        addedAt: e.created_at,
      })),
    questions: [...data.clarifying_questions]
      .sort((a, b) => a.position - b.position)
      .map((q) => ({ id: q.id, investigationId: id, question: q.question, hint: q.hint || undefined, answer: q.answer })),
  };
}

/** Evidence confidence as stored, or worked out now for evidence saved before it was stored. */
function trustOf(e: { confidence: string | null; metadata: Json; profile: Json | null; snapshot_id?: string | null } | null) {
  if (!e?.profile) return {};
  if (e.confidence) {
    const reason = (e.metadata as { confidenceReason?: string } | null)?.confidenceReason;
    return { confidence: e.confidence as "low" | "medium" | "high", confidenceReason: reason };
  }
  const t = assessEvidence(e.profile as unknown as DatasetProfile, { connected: !!e.snapshot_id });
  return { confidence: t.level, confidenceReason: t.reason };
}

type LinkRow = { evidence_id: string; relation: string; shows: string };
type FindingRow = Pick<Tables<"findings">, "analysis_run_id" | "ref" | "position" | "kind" | "title" | "statement" | "observed" | "confidence" | "confidence_reason" | "based_on"> & { evidence_links: LinkRow[] };
type HypothesisRow = Pick<
  Tables<"hypotheses">,
  | "analysis_run_id"
  | "ref"
  | "position"
  | "title"
  | "statement"
  | "rationale"
  | "confidence"
  | "evidence_strength"
  | "evidence_status"
  | "supporting_findings"
  | "contradicting_findings"
  | "validation_method"
  | "assumptions"
  | "status"
  | "validation_id"
> & { evidence_links: LinkRow[] };
type QuestionRow = Pick<Tables<"open_questions">, "analysis_run_id" | "ref" | "position" | "question" | "why_it_matters" | "missing_evidence">;
type NextStepRow = Pick<
  Tables<"next_steps">,
  "analysis_run_id" | "approach" | "approach_reason" | "evidence_sufficiency" | "type" | "title" | "detail" | "why" | "why_not_build_yet" | "would_change_if"
>;
type ProblemRow = Pick<
  Tables<"problem_definitions">,
  | "id"
  | "analysis_run_id"
  | "cause_status"
  | "statement"
  | "affected"
  | "need"
  | "obstacle"
  | "business_impact"
  | "confidence"
  | "confidence_reason"
  | "assumptions"
  | "finding_refs"
  | "hypothesis_refs"
  | "created_at"
> & {
  evidence_links: LinkRow[];
  opportunities: (Pick<
    Tables<"opportunities">,
    "id" | "position" | "title" | "customer_problem" | "potential_impact" | "impact_level" | "confidence" | "assumptions" | "validation_needs" | "finding_refs" | "depends_on" | "status"
  > & { evidence_links: LinkRow[] })[];
};

/** The newest problem definition and its opportunities. */
function toDiscovery(rows: ProblemRow[]): { problemDefinition?: ProblemDefinitionRecord; opportunities: OpportunityRecord[] } {
  const p = [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  if (!p) return { opportunities: [] };
  const links = (l: LinkRow[]) => toLinks(l);
  return {
    problemDefinition: {
      id: p.id,
      runId: p.analysis_run_id ?? undefined,
      statement: p.statement,
      affected: p.affected,
      need: p.need,
      obstacle: p.obstacle,
      businessImpact: p.business_impact,
      confidence: p.confidence as ProblemDefinitionRecord["confidence"],
      confidenceReason: p.confidence_reason,
      assumptions: p.assumptions,
      findingRefs: p.finding_refs,
      hypothesisRefs: p.hypothesis_refs,
      causeStatus: p.cause_status === "validated" ? "validated" : "open",
      links: links(p.evidence_links),
      createdAt: p.created_at,
    },
    opportunities: [...p.opportunities]
      .sort((a, b) => a.position - b.position)
      .map((o) => ({
        id: o.id,
        title: o.title,
        customerProblem: o.customer_problem,
        potentialImpact: o.potential_impact,
        impactLevel: o.impact_level as OpportunityRecord["impactLevel"],
        confidence: o.confidence as OpportunityRecord["confidence"],
        assumptions: o.assumptions,
        validationNeeds: o.validation_needs,
        findingRefs: o.finding_refs,
        dependsOn: o.depends_on,
        links: links(o.evidence_links),
        status: o.status as OpportunityRecord["status"],
      })),
  };
}

type ResearchTaskRow = Pick<
  Tables<"research_tasks">,
  | "id"
  | "analysis_run_id"
  | "position"
  | "title"
  | "question"
  | "method"
  | "method_detail"
  | "priority"
  | "status"
  | "rationale"
  | "question_ref"
  | "hypothesis_refs"
  | "outcome"
  | "created_at"
  | "updated_at"
>;

function toResearchTask(t: ResearchTaskRow): ResearchTaskRecord {
  return {
    id: t.id,
    runId: t.analysis_run_id ?? undefined,
    title: t.title,
    question: t.question,
    method: t.method as ResearchTaskRecord["method"],
    methodDetail: t.method_detail,
    priority: t.priority as ResearchTaskRecord["priority"],
    status: t.status as ResearchTaskRecord["status"],
    rationale: t.rationale,
    questionRef: t.question_ref ?? undefined,
    hypothesisRefs: t.hypothesis_refs,
    outcome: t.outcome,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  };
}

type ValidationRow = Pick<
  Tables<"validations">,
  "id" | "hypothesis_title" | "hypothesis_statement" | "method" | "test" | "confirm_if" | "reject_if" | "status" | "outcome" | "reason" | "settled_at" | "created_at"
> & {
  validation_notes: Pick<Tables<"validation_notes">, "id" | "kind" | "relation" | "body" | "research_task_id" | "created_at">[];
  evidence_links: { id: string; evidence_id: string; relation: string; shows: string }[];
};

function toValidation(v: ValidationRow): ValidationRecord {
  return {
    id: v.id,
    hypothesisTitle: v.hypothesis_title,
    hypothesisStatement: v.hypothesis_statement,
    method: v.method,
    test: v.test,
    confirmIf: v.confirm_if,
    rejectIf: v.reject_if,
    status: v.status as ValidationRecord["status"],
    outcome: (v.outcome ?? undefined) as ValidationRecord["outcome"],
    reason: v.reason,
    settledAt: v.settled_at ?? undefined,
    notes: [...v.validation_notes]
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((n) => ({
        id: n.id,
        kind: n.kind as "note" | "research-task",
        relation: n.relation as "supports" | "contradicts",
        body: n.body,
        researchTaskId: n.research_task_id ?? undefined,
        createdAt: n.created_at,
      })),
    datasets: v.evidence_links.map((l) => ({ id: l.id, evidenceId: l.evidence_id, relation: l.relation as "supports" | "contradicts", shows: l.shows })),
    createdAt: v.created_at,
  };
}

type DecisionRow = Pick<
  Tables<"decisions">,
  | "id"
  | "outcome"
  | "summary"
  | "rationale"
  | "opportunity_id"
  | "opportunity_title"
  | "escalate_to"
  | "options_rejected"
  | "risks"
  | "owner"
  | "success_measure"
  | "review_date"
  | "result"
  | "warnings"
  | "created_at"
>;

function toDecision(d: DecisionRow): InvestigationDecision {
  return {
    id: d.id,
    outcome: d.outcome as DecisionOutcome,
    summary: d.summary,
    rationale: d.rationale,
    opportunityId: d.opportunity_id ?? undefined,
    opportunityTitle: d.opportunity_title,
    escalateTo: d.escalate_to,
    optionsRejected: d.options_rejected,
    risks: d.risks,
    owner: d.owner,
    successMeasure: d.success_measure,
    reviewDate: d.review_date ?? undefined,
    result: d.result,
    warnings: d.warnings,
    createdAt: d.created_at,
  };
}

const toLinks = (rows: LinkRow[]): StructuredLink[] =>
  rows.map((l) => ({ evidenceId: l.evidence_id, relation: l.relation as StructuredLink["relation"], shows: l.shows }));

type AnalysisRunRow = Pick<Tables<"analysis_runs">, "id" | "status" | "model" | "created_at" | "completed_at" | "error" | "result" | "pack" | "usage">;

function toAnalysisRun(
  r: AnalysisRunRow,
  findingRows: FindingRow[] = [],
  hypothesisRows: HypothesisRow[] = [],
  questionRows: QuestionRow[] = [],
  nextStepRows: NextStepRow[] = [],
): AnalysisRunRecord {
  const findings = findingRows.filter((f) => f.analysis_run_id === r.id).sort((a, b) => a.position - b.position);
  const hypotheses = hypothesisRows.filter((h) => h.analysis_run_id === r.id).sort((a, b) => a.position - b.position);
  const questions = questionRows.filter((q) => q.analysis_run_id === r.id).sort((a, b) => a.position - b.position);
  const next = nextStepRows.find((n) => n.analysis_run_id === r.id);
  const pack = r.pack as unknown as AnalysisPack | null;
  const usage = r.usage as { removed?: string[] } | null;
  return {
    id: r.id,
    status: r.status as AnalysisRunRecord["status"],
    model: r.model,
    createdAt: r.created_at,
    completedAt: r.completed_at ?? undefined,
    error: r.error ?? undefined,
    result: (r.result ?? undefined) as AnalysisResult | undefined,
    datasets: (pack?.datasets ?? []).map((d) => ({
      ref: d.ref,
      evidenceId: d.evidenceId,
      name: d.name,
      period: d.period ? formatRange(d.period.from, d.period.to) : undefined,
    })),
    removed: usage?.removed ?? [],
    structured:
      findings.length || hypotheses.length || next
        ? {
            findings: findings.map((f) => ({
              ref: f.ref,
              title: f.title,
              kind: f.kind as StructuredFinding["kind"],
              statement: f.statement,
              observed: (f.observed ?? undefined) as StructuredFinding["observed"],
              confidence: f.confidence as StructuredFinding["confidence"],
              confidenceReason: f.confidence_reason,
              basedOn: f.based_on,
              links: toLinks(f.evidence_links),
            })),
            hypotheses: hypotheses.map((h) => ({
              ref: h.ref,
              title: h.title,
              statement: h.statement,
              rationale: h.rationale,
              confidence: h.confidence as StructuredHypothesis["confidence"],
              evidenceStrength: h.evidence_strength as StructuredHypothesis["evidenceStrength"],
              evidenceStatus: h.evidence_status as StructuredHypothesis["evidenceStatus"],
              supportingFindings: h.supporting_findings,
              contradictingFindings: h.contradicting_findings,
              validationMethod: h.validation_method,
              assumptions: h.assumptions,
              links: toLinks(h.evidence_links),
              status: h.status as StructuredHypothesis["status"],
              validationId: h.validation_id ?? undefined,
            })),
            openQuestions: questions.map((q) => ({ ref: q.ref, question: q.question, whyItMatters: q.why_it_matters, missingEvidence: q.missing_evidence })),
            nextStep: next && {
              approach: {
                step: next.approach as Approach["step"],
                why: next.approach_reason,
                evidenceSufficiency: next.evidence_sufficiency as Approach["evidenceSufficiency"],
              },
              type: next.type as StructuredNextStep["type"],
              title: next.title,
              detail: next.detail,
              why: next.why,
              whyNotBuildYet: next.why_not_build_yet,
              wouldChangeIf: next.would_change_if,
            },
          }
        : undefined,
  };
}

/**
 * The full workspace (evidence, findings, hypotheses…). The sample's comes from
 * the demo content; the team's own is built from what is saved.
 */
export async function getInvestigationWorkspace(id: string): Promise<InvestigationWorkspace | undefined> {
  const summary = await getInvestigationSummary(id);
  if (!summary) return undefined;
  if (!summary.isSample) {
    const [record, dataSources] = await Promise.all([getInvestigationRecord(id), listDataSources()]);
    return record ? buildLiveWorkspace(record, dataSources) : undefined;
  }
  const ws = buildSampleWorkspace(buildEvidence().filter((e) => e.investigationId === SAMPLE_MOCK_ID));
  return { ...ws, investigation: { ...ws.investigation, id: summary.id } };
}

async function getSample(): Promise<InvestigationSummary | undefined> {
  return (await listInvestigations()).find((i) => i.isSample);
}

const sampleTitle = (s: InvestigationSummary) => `${s.title} (sample)`;

/* ── Across investigations ──────────────────────────────────────────── */

export async function listRecentDecisions(limit = 4): Promise<DecisionRecord[]> {
  return (await listDecisions()).slice(0, limit);
}

/** Decisions recorded in investigations, newest first; then the sample's. */
export async function listDecisions(): Promise<DecisionRecord[]> {
  const supabase = await createClient();
  const [{ data }, sample] = await Promise.all([
    supabase
      .from("decisions")
      .select("id, investigation_id, outcome, summary, rationale, owner, result, warnings, review_date, success_measure, created_at, investigations (title)")
      .eq("status", "decided")
      .order("created_at", { ascending: false })
      .limit(100),
    getSample(),
  ]);
  const real: DecisionRecord[] = (data ?? []).map((d) => ({
    id: d.id,
    investigationId: d.investigation_id,
    investigationTitle: d.investigations?.title ?? "Investigation",
    decision: d.summary,
    status: "decided",
    decidedAt: d.created_at,
    owner: d.owner || "No owner set",
    rationale: d.rationale || undefined,
    outcome: d.result || undefined,
    kind: d.outcome as DecisionOutcome,
    warnings: d.warnings,
    reviewDate: d.review_date ?? undefined,
    successMeasure: d.success_measure || undefined,
  }));
  const fromSample = sample
    ? buildDecisions()
        .filter((d) => d.investigationId === SAMPLE_MOCK_ID)
        .map((d) => ({ ...d, investigationId: sample.id, investigationTitle: sampleTitle(sample) }))
        .sort((a, b) => b.decidedAt.localeCompare(a.decidedAt))
    : [];
  return [...real, ...fromSample];
}

/** Every piece of evidence across investigations, newest first: uploaded data, then the sample's. */
export async function listAllEvidence(): Promise<EvidenceWithContext[]> {
  const supabase = await createClient();
  const [{ data }, sample] = await Promise.all([
    supabase
      .from("evidence")
      .select("id, investigation_id, name, category, source, format, coverage, summary, created_at, investigations (title)")
      .order("created_at", { ascending: false })
      .limit(100),
    getSample(),
  ]);
  const real: EvidenceWithContext[] = (data ?? []).map((e) => ({
    id: e.id,
    investigationId: e.investigation_id,
    investigationTitle: e.investigations?.title ?? "Investigation",
    name: e.name,
    category: e.category as EvidenceCategory,
    source: e.source,
    format: e.format as EvidenceFormat,
    coverage: e.coverage ?? undefined,
    description: e.summary,
    addedAt: e.created_at,
  }));
  const fromSample: EvidenceWithContext[] = sample
    ? buildEvidence()
        .filter((e) => e.investigationId === SAMPLE_MOCK_ID)
        .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
        .map((e) => ({ ...e, investigationId: sample.id, investigationTitle: sampleTitle(sample) }))
    : [];
  return [...real, ...fromSample];
}

export async function listRecentEvidence(limit = 4): Promise<EvidenceWithContext[]> {
  return (await listAllEvidence()).slice(0, limit);
}

export async function listMemoryHighlights(limit = 3): Promise<MemoryEntry[]> {
  return (await getBusinessMemory()).entries.slice(0, limit);
}

const memoryCategory: Record<string, MemoryCategory> = {
  "validated-problem": "validated-problems",
  "rejected-hypothesis": "rejected-hypotheses",
  "customer-insight": "customer-insights",
  decision: "decisions",
  experiment: "experiments",
  outcome: "outcomes",
  lesson: "learnings",
};

/**
 * Business Memory: what investigations validated, ruled out, learned from
 * customers, decided, tried and found out (written as the team works), and
 * each decided investigation's journey from problem to learning.
 */
export async function getBusinessMemory(): Promise<BusinessMemory> {
  await requireWorkspace();
  const supabase = await createClient();
  const [{ data: entries }, { data: decisions }] = await Promise.all([
    supabase
      .from("memory_entries")
      .select("id, investigation_id, kind, title, body, created_at, investigations (title)")
      .eq("archived", false)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("decisions")
      .select("id, investigation_id, summary, result, created_at, investigations (title, problem)")
      .eq("status", "decided")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  const list: MemoryEntry[] = (entries ?? []).map((e) => ({
    id: e.id,
    category: memoryCategory[e.kind] ?? "learnings",
    kind: e.kind,
    title: e.title,
    body: e.body,
    date: e.created_at,
    sourceInvestigationId: e.investigation_id ?? undefined,
    sourceInvestigationTitle: e.investigations?.title,
  }));
  // One story per investigation: its latest decision, with what was tried and learned.
  const seen = new Set<string>();
  const stories: MemoryStory[] = (decisions ?? [])
    .filter((d) => !seen.has(d.investigation_id) && seen.add(d.investigation_id))
    .map((d) => {
      const from = list.filter((e) => e.sourceInvestigationId === d.investigation_id);
      const first = (c: MemoryCategory) => from.find((e) => e.category === c);
      return {
        id: `story-${d.id}`,
        investigationId: d.investigation_id,
        investigationTitle: d.investigations?.title ?? "Investigation",
        date: d.created_at,
        problem: first("validated-problems")?.title ?? d.investigations?.problem ?? "",
        decision: d.summary,
        experiment: (first("experiments") ?? first("customer-insights"))?.title ?? "Nothing run yet",
        result: d.result || "Not measured yet",
        learning: first("learnings")?.title ?? "No lesson saved yet",
      };
    });
  return { entries: list, stories };
}

/**
 * The data sources Veyra knows about, with what is really connected: uploaded
 * files are always available; the ERP is connected once the Demo ERP (or, later,
 * a real ERP) has been set up. Other systems are listed but not yet connectable.
 */
export async function listDataSources(): Promise<DataSource[]> {
  const connected = await listConnectedSources();
  const erp = connected.find((c) => c.kind === "erp");
  const synced = erp?.datasets.filter((d) => d.latest) ?? [];
  const uploads: DataSource = {
    id: "ds-uploads",
    name: "Uploaded files",
    group: "company-systems",
    description: "CSV exports you upload to an investigation.",
    status: "connected",
  };
  return [
    uploads,
    ...buildDataSources().map<DataSource>((s) =>
      s.id === "ds-erp" && erp
        ? {
            ...s,
            name: erp.name,
            status: "connected",
            lastSyncedAt: erp.lastSyncedAt,
            metrics: synced.slice(0, 3).map((d) => ({ label: d.name, value: d.latest!.rowCount.toLocaleString("en") })),
          }
        : { ...s, status: "not-connected", lastSyncedAt: undefined, metrics: undefined },
    ),
  ];
}

/** Open questions across active investigations: unanswered clarifying questions, plus the sample's. */
export async function listOpenQuestions(): Promise<{ investigationId: string; investigationTitle: string; question: string }[]> {
  const supabase = await createClient();
  const [{ data }, sample] = await Promise.all([
    supabase
      .from("clarifying_questions")
      .select("question, position, investigation_id, investigations!inner (title, status, updated_at)")
      .eq("answer", "")
      .neq("investigations.status", "completed"),
    getSample(),
  ]);
  const real = (data ?? [])
    .sort((a, b) => b.investigations.updated_at.localeCompare(a.investigations.updated_at) || a.position - b.position)
    .map((q) => ({ investigationId: q.investigation_id, investigationTitle: q.investigations.title, question: q.question }));
  const fromSample = sample
    ? sampleOpenQuestions.map((q) => ({ investigationId: sample.id, investigationTitle: sampleTitle(sample), question: q.question }))
    : [];
  return [...real, ...fromSample];
}

export type ProblemSummary = {
  investigationId: string;
  investigationTitle: string;
  original?: string;
  refined: string;
  status: "draft" | "refined" | "validated";
  confidence: Confidence;
};

/** Problem statements across investigations. New investigations have the problem as written. */
export async function listProblems(): Promise<ProblemSummary[]> {
  const investigations = await listInvestigations();
  const sample = investigations.find((i) => i.isSample);
  const real: ProblemSummary[] = investigations
    .filter((i) => !i.isSample)
    .map((i) => ({ investigationId: i.id, investigationTitle: i.title, refined: i.problem, status: "draft", confidence: i.confidence }));
  if (!sample) return real;
  const sampleWs = buildSampleWorkspace([]);
  return [
    ...real,
    {
      investigationId: sample.id,
      investigationTitle: sampleTitle(sample),
      original: sampleWs.problem.original,
      refined: sampleWs.problem.refined,
      status: "refined",
      confidence: sampleWs.problem.confidence,
    },
  ];
}

export type OpportunitySummary = {
  investigationId: string;
  investigationTitle: string;
  title: string;
  evidenceStrength: EvidenceStrength;
  impact?: Level;
  confidence: Confidence;
};

/** Opportunities come from analysis (Milestone 4); only the sample has them so far. */
export async function listOpportunities(): Promise<OpportunitySummary[]> {
  const sample = await getSample();
  if (!sample) return [];
  return buildSampleWorkspace([]).opportunities.map((o) => ({
    investigationId: sample.id,
    investigationTitle: sampleTitle(sample),
    title: o.title,
    evidenceStrength: o.evidenceStrength,
    impact: o.impact,
    confidence: o.confidence,
  }));
}

export type ValidationSummary = {
  investigationId: string;
  investigationTitle: string;
  hypothesis: string;
  test: string;
  status: "not-started" | "running" | "completed";
  result?: string;
};

/** Hypotheses being validated across investigations, then the sample's. */
export async function listValidations(): Promise<ValidationSummary[]> {
  const supabase = await createClient();
  const [{ data }, sample] = await Promise.all([
    supabase
      .from("validations")
      .select("investigation_id, hypothesis_title, hypothesis_statement, method, test, status, outcome, reason, updated_at, investigations (title)")
      .order("updated_at", { ascending: false })
      .limit(100),
    getSample(),
  ]);
  const real: ValidationSummary[] = (data ?? []).map((v) => ({
    investigationId: v.investigation_id,
    investigationTitle: v.investigations?.title ?? "Investigation",
    hypothesis: v.hypothesis_title || v.hypothesis_statement,
    test: v.test || v.method || "Not written yet",
    status: v.status === "settled" ? "completed" : v.status === "in-progress" ? "running" : "not-started",
    result: v.outcome ? `${v.outcome.charAt(0).toUpperCase()}${v.outcome.slice(1)}: ${v.reason}` : undefined,
  }));
  const fromSample: ValidationSummary[] = sample
    ? buildSampleWorkspace([]).validations.map((v) => ({
        investigationId: sample.id,
        investigationTitle: sampleTitle(sample),
        hypothesis: v.belief,
        test: v.test,
        status: v.status,
      }))
    : [];
  return [...real, ...fromSample];
}
