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
 * be listed and removed) but its content is the DAU Decline demo from /mocks,
 * until evidence and analysis are stored in the database.
 */
import "server-only";
import { getSession, getWorkspace } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buildDataSources } from "@/mocks/data-sources";
import { cache } from "react";
import { buildDauWorkspace, dauOpenQuestions } from "@/mocks/dau-investigation";
import { buildDecisions } from "@/mocks/decisions";
import { buildEvidence } from "@/mocks/evidence";
import { buildSampleSummary } from "@/mocks/investigations";
import type { Tables } from "@/lib/supabase/database.types";
import type {
  BusinessContext,
  BusinessMemory,
  Company,
  Confidence,
  DataSource,
  DecisionRecord,
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
  MemoryEntry,
  User,
} from "@/lib/types";

export async function getCurrentUser(): Promise<User | null> {
  return (await getSession())?.user ?? null;
}

/** The signed-in user's company (workspace), or null before onboarding. */
export async function getCompany(): Promise<Company | null> {
  return getWorkspace();
}

/** Persistent business context shared by every investigation. Empty fields until the team fills them in. */
export async function getBusinessContext(): Promise<BusinessContext> {
  const company = await getWorkspace();
  const empty: BusinessContext = {
    company: company?.name ?? "",
    product: "",
    businessModel: "",
    targetCustomers: "",
    goals: [],
    priorities: [],
    keyMetrics: [],
  };
  if (!company) return empty;
  const supabase = await createClient();
  const { data } = await supabase
    .from("business_contexts")
    .select("product, business_model, target_customers, goals, priorities, key_metrics")
    .eq("workspace_id", company.id)
    .maybeSingle();
  if (!data) return empty;
  return {
    company: company.name,
    product: data.product,
    businessModel: data.business_model,
    targetCustomers: data.target_customers,
    goals: data.goals,
    priorities: data.priorities,
    keyMetrics: data.key_metrics,
  };
}

/* ── Investigations ─────────────────────────────────────────────────── */

/** The sample's content still uses these IDs inside /mocks. */
const SAMPLE_MOCK_ID = "dau-decline";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type InvestigationRow = Pick<
  Tables<"investigations">,
  "id" | "title" | "problem" | "topic" | "status" | "confidence" | "is_sample" | "updated_at"
> & { clarifying_questions: { answer: string }[] };

function toSummary(row: InvestigationRow): InvestigationSummary {
  if (row.is_sample) return { ...buildSampleSummary(), id: row.id };
  return {
    id: row.id,
    title: row.title,
    topic: row.topic as InvestigationTopic,
    status: row.status as InvestigationStatus,
    problem: row.problem,
    evidenceCount: 0,
    hypothesisCount: 0,
    // Until analysis exists, unanswered clarifying questions are the open questions.
    openQuestionCount: row.clarifying_questions.filter((q) => !q.answer.trim()).length,
    confidence: row.confidence as Confidence,
    updatedAt: row.updated_at,
  };
}

/** All investigations in the user's workspace, most recently updated first. */
export const listInvestigations = cache(async (): Promise<InvestigationSummary[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("investigations")
    .select("id, title, problem, topic, status, confidence, is_sample, updated_at, clarifying_questions (answer)")
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
    .select("trigger, outcome, known_context, attachments, data_source_ids, plan, created_at, clarifying_questions (id, position, question, hint, answer)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return undefined;
  return {
    summary,
    trigger: data.trigger as InvestigationTrigger | null,
    outcome: data.outcome as InvestigationOutcome | null,
    knownContext: data.known_context,
    attachments: data.attachments,
    dataSourceIds: data.data_source_ids,
    plan: data.plan as InvestigationPlan | null,
    createdAt: data.created_at,
    questions: [...data.clarifying_questions]
      .sort((a, b) => a.position - b.position)
      .map((q) => ({ id: q.id, investigationId: id, question: q.question, hint: q.hint || undefined, answer: q.answer })),
  };
}

/**
 * The full workspace (evidence, findings, hypotheses…). Only the sample has one
 * until analysis is stored; for other investigations this returns undefined
 * and the brief page is shown instead.
 */
export async function getInvestigationWorkspace(id: string): Promise<InvestigationWorkspace | undefined> {
  const summary = await getInvestigationSummary(id);
  if (!summary?.isSample) return undefined;
  const ws = buildDauWorkspace(buildEvidence().filter((e) => e.investigationId === SAMPLE_MOCK_ID));
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

/** Decisions recorded in investigations. Real decisions arrive with Milestone 5. */
export async function listDecisions(): Promise<DecisionRecord[]> {
  const sample = await getSample();
  if (!sample) return [];
  return buildDecisions()
    .filter((d) => d.investigationId === SAMPLE_MOCK_ID)
    .map((d) => ({ ...d, investigationId: sample.id, investigationTitle: sampleTitle(sample) }))
    .sort((a, b) => b.decidedAt.localeCompare(a.decidedAt));
}

/** Every piece of evidence across investigations, newest first. Real evidence arrives with Milestone 3. */
export async function listAllEvidence(): Promise<EvidenceWithContext[]> {
  const sample = await getSample();
  if (!sample) return [];
  return buildEvidence()
    .filter((e) => e.investigationId === SAMPLE_MOCK_ID)
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
    .map((e) => ({ ...e, investigationId: sample.id, investigationTitle: sampleTitle(sample) }));
}

export async function listRecentEvidence(limit = 4): Promise<EvidenceWithContext[]> {
  return (await listAllEvidence()).slice(0, limit);
}

/** Business memory is written as investigations complete; none have yet. */
export async function listMemoryHighlights(limit = 3): Promise<MemoryEntry[]> {
  return (await getBusinessMemory()).entries.slice(0, limit);
}

export async function getBusinessMemory(): Promise<BusinessMemory> {
  return { entries: [], stories: [] };
}

export async function listDataSources(): Promise<DataSource[]> {
  return buildDataSources();
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
    ? dauOpenQuestions.map((q) => ({ investigationId: sample.id, investigationTitle: sampleTitle(sample), question: q.question }))
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
  const dau = buildDauWorkspace([]);
  return [
    ...real,
    {
      investigationId: sample.id,
      investigationTitle: sampleTitle(sample),
      original: dau.problem.original,
      refined: dau.problem.refined,
      status: "refined",
      confidence: dau.problem.confidence,
    },
  ];
}

export type OpportunitySummary = {
  investigationId: string;
  investigationTitle: string;
  title: string;
  evidenceStrength: EvidenceStrength;
  impact: Level;
  confidence: Confidence;
};

/** Opportunities come from analysis (Milestone 4); only the sample has them so far. */
export async function listOpportunities(): Promise<OpportunitySummary[]> {
  const sample = await getSample();
  if (!sample) return [];
  return buildDauWorkspace([]).opportunities.map((o) => ({
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

/** Validations come with Milestone 5; only the sample has them so far. */
export async function listValidations(): Promise<ValidationSummary[]> {
  const sample = await getSample();
  if (!sample) return [];
  return buildDauWorkspace([]).validations.map((v) => ({
    investigationId: sample.id,
    investigationTitle: sampleTitle(sample),
    hypothesis: v.belief,
    test: v.test,
    status: v.status,
  }));
}
