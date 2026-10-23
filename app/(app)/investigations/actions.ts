"use server";

import { revalidatePath } from "next/cache";
import { assessEvidence } from "@/lib/analysis/confidence";
import { computeCsvMetrics } from "@/lib/analysis/csv-metrics";
import { buildPack } from "@/lib/analysis/pack";
import { profileCsv } from "@/lib/analysis/profile";
import { ANALYSIS_MODEL, runAnalysis } from "@/lib/analysis/run";
import { loadPrevious } from "@/lib/analysis/previous";
import { saveEvidenceRows } from "@/lib/analysis/save";
import { defineProblemFor, findOpportunitiesFor } from "@/lib/analysis/discovery-run";
import { clarify } from "@/lib/ai/clarify";
import { takeAiAllowance } from "@/lib/ai/usage";
import { getBusinessContext, listDataSources } from "@/lib/data";
import { forget, memoryNotes, remember } from "@/lib/data/memory";
import { requireWorkspace } from "@/lib/auth";
import { deriveTitle, inferTopic } from "@/lib/investigation-text";
import { OUTCOMES, TRIGGERS } from "@/lib/options";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { genericQuestions } from "@/mocks/new-investigation";
import type { ClarifyingQuestion, DataMetric, DatasetProfile, InvestigationDraft, InvestigationOutcome, InvestigationTrigger, NeededInfo } from "@/lib/types";

const MAX_PROBLEM = 2000;
/** Must match the bucket's limit (supabase/migrations/20261006000001_uploads_and_evidence.sql). */
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const MAX_TEXT = 5000;
const MAX_OBJECTIVE = 2000;
const MAX_TITLE = 120;
const MAX_ITEMS = 20;

/** Saves the New Investigation draft — problem, context, answered questions and plan — as an investigation. */
export async function createInvestigation(draft: InvestigationDraft): Promise<{ id: string } | { error: string }> {
  const { company } = await requireWorkspace();
  const problem = draft.problem.trim();
  if (!problem) return { error: "Describe the problem first." };
  if (problem.length > MAX_PROBLEM) return { error: "Shorten the problem description a little." };

  const questions = (draft.questions ?? []).slice(0, MAX_ITEMS).map((q) => ({
    question: q.question.trim().slice(0, 1000),
    hint: (q.hint ?? "").slice(0, 1000),
    answer: q.answer.trim().slice(0, MAX_TEXT),
  }));

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_investigation", {
    p_workspace_id: company.id,
    p_title: deriveTitle(problem),
    p_problem: problem,
    p_objective: (draft.objective ?? "").trim().slice(0, MAX_OBJECTIVE),
    p_topic: inferTopic(problem),
    p_triggers: validTriggers(draft.triggers),
    p_outcomes: validOutcomes(draft.outcomes),
    p_known_context: draft.knownContext.trim().slice(0, MAX_TEXT),
    p_attachments: draft.attachments.slice(0, MAX_ITEMS).map((a) => a.slice(0, 300)),
    p_data_source_ids: draft.dataSourceIds.slice(0, MAX_ITEMS),
    p_plan: (draft.plan ?? null) as Json | null,
    p_questions: questions as Json,
  });
  if (error || !data) return { error: "Couldn't save the investigation. Try again in a moment." };

  revalidatePath("/", "layout");
  return { id: data };
}

/**
 * Clarifying questions written for this problem: Veyra works out what it needs
 * to know, then asks about the gaps. On failure the standard questions are
 * returned with the reason, so the flow can carry on.
 */
export async function suggestQuestions(
  draft: InvestigationDraft,
): Promise<{ questions: ClarifyingQuestion[]; needed: NeededInfo[]; error?: string }> {
  const { company } = await requireWorkspace();
  const fallback = (error: string) => ({ questions: structuredClone(genericQuestions), needed: [], error });
  const problem = draft.problem.trim();
  if (!problem || problem.length > MAX_PROBLEM) return fallback("Describe the problem first.");

  const allowance = await takeAiAllowance(company.id, "questions");
  if ("error" in allowance) return fallback(allowance.error);

  const [context, sources] = await Promise.all([getBusinessContext(), listDataSources()]);
  const result = await clarify({
    draft: {
      ...draft,
      problem,
      objective: (draft.objective ?? "").slice(0, MAX_OBJECTIVE),
      knownContext: draft.knownContext.slice(0, MAX_TEXT),
      triggers: validTriggers(draft.triggers),
      outcomes: validOutcomes(draft.outcomes),
      attachments: draft.attachments.slice(0, MAX_ITEMS),
    },
    context,
    sources: sources.filter((s) => draft.dataSourceIds.includes(s.id)).map((s) => s.name),
  });
  if (result.status !== "ok") return fallback(result.error);
  return {
    questions: result.questions.map((q, i) => ({ id: `q-${i + 1}`, question: q.question, hint: q.why, answer: "" })),
    needed: result.needed,
  };
}

export type InvestigationEdit = {
  title: string;
  problem: string;
  objective: string;
  triggers: InvestigationTrigger[];
  outcomes: InvestigationOutcome[];
};

/** Only known values, each once (also guarded by the database). */
const validTriggers = (list: unknown) =>
  Array.isArray(list) ? [...new Set(list.filter((v): v is InvestigationTrigger => TRIGGERS.some((t) => t.value === v)))] : [];
const validOutcomes = (list: unknown) =>
  Array.isArray(list) ? [...new Set(list.filter((v): v is InvestigationOutcome => OUTCOMES.some((o) => o.value === v)))] : [];

/** Updates an investigation's title, problem, objective, triggers and outcomes. The sample can't be edited. */
export async function updateInvestigation(investigationId: string, edit: InvestigationEdit): Promise<{ ok: true } | { error: string }> {
  await requireWorkspace();
  const title = edit.title.trim();
  const problem = edit.problem.trim();
  if (!title) return { error: "Give the investigation a title." };
  if (!problem) return { error: "Describe the problem." };
  if (title.length > MAX_TITLE) return { error: `Keep the title under ${MAX_TITLE} characters.` };
  if (problem.length > MAX_PROBLEM) return { error: "Shorten the problem description a little." };
  if (edit.objective.length > MAX_OBJECTIVE) return { error: "Shorten the objective a little." };

  const supabase = await createClient();
  const { error, count } = await supabase
    .from("investigations")
    .update(
      {
        title,
        problem,
        objective: edit.objective.trim(),
        triggers: validTriggers(edit.triggers),
        outcomes: validOutcomes(edit.outcomes),
      },
      { count: "exact" },
    )
    .eq("id", investigationId)
    .eq("is_sample", false);
  if (error || !count) return { error: "Couldn't save your changes. Try again in a moment." };
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Saves edited answers to an investigation's clarifying questions. */
export async function saveAnswers(
  investigationId: string,
  answers: { id: string; answer: string }[],
): Promise<{ ok: true } | { error: string }> {
  await requireWorkspace();
  const supabase = await createClient();
  for (const a of answers.slice(0, MAX_ITEMS)) {
    const { error } = await supabase
      .from("clarifying_questions")
      .update({ answer: a.answer.trim().slice(0, MAX_TEXT) })
      .eq("id", a.id)
      .eq("investigation_id", investigationId);
    if (error) return { error: "Couldn't save your answers. Try again in a moment." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Deletes an investigation and everything in it (including the sample), uploaded files too. */
export async function deleteInvestigation(investigationId: string): Promise<{ ok: true } | { error: string }> {
  await requireWorkspace();
  const supabase = await createClient();
  const { data: files } = await supabase.from("files").select("storage_path").eq("investigation_id", investigationId);
  const { error, count } = await supabase.from("investigations").delete({ count: "exact" }).eq("id", investigationId);
  if (error || !count) return { error: "Couldn't delete this investigation." };
  if (files?.length) await supabase.storage.from("uploads").remove(files.map((f) => f.storage_path));
  revalidatePath("/", "layout");
  return { ok: true };
}

/* ── Uploads ──────────────────────────────────────────────────────────── */

/**
 * Step 1 of an upload: records the file and returns where the browser should
 * put it. The browser then uploads straight to Storage (server actions are
 * capped at 1 MB), and calls processUpload.
 */
export async function registerUpload(
  investigationId: string,
  file: { name: string; size: number },
): Promise<{ fileId: string; path: string } | { error: string }> {
  const { company } = await requireWorkspace();
  const name = file.name.trim().slice(0, 255);
  if (!/\.csv$/i.test(name)) return { error: "Veyra reads CSV files for now. In Excel or Google Sheets, use File → Download / Save as → CSV." };
  if (file.size <= 0) return { error: "That file is empty." };
  if (file.size > MAX_UPLOAD_BYTES) return { error: "That file is over 20 MB. Upload a smaller export, such as fewer months or fewer columns." };

  const supabase = await createClient();
  const { data: inv } = await supabase.from("investigations").select("id, is_sample").eq("id", investigationId).maybeSingle();
  if (!inv) return { error: "This investigation no longer exists." };
  if (inv.is_sample) return { error: "The sample investigation can't take uploads. Start your own investigation to add data." };

  const fileId = crypto.randomUUID();
  const path = `${company.id}/${investigationId}/${fileId}.csv`;
  const { error } = await supabase
    .from("files")
    .insert({ id: fileId, investigation_id: investigationId, workspace_id: company.id, name, storage_path: path, size_bytes: file.size });
  if (error) return { error: "Couldn't start the upload. Try again in a moment." };
  return { fileId, path };
}

/** Step 2: reads the uploaded CSV, profiles it in code, and saves the result as evidence. */
export async function processUpload(fileId: string): Promise<{ ok: true } | { error: string }> {
  const { company } = await requireWorkspace();
  const supabase = await createClient();
  const { data: file } = await supabase.from("files").select("id, investigation_id, name, storage_path, status").eq("id", fileId).maybeSingle();
  if (!file) return { error: "This upload no longer exists." };
  if (file.status === "ready") return { ok: true };

  const fail = async (message: string) => {
    await supabase.from("files").update({ status: "failed", error: message }).eq("id", fileId);
    revalidatePath("/", "layout");
    return { error: message };
  };

  await supabase.from("files").update({ status: "processing", error: null }).eq("id", fileId);
  const { data: blob, error: downloadError } = await supabase.storage.from("uploads").download(file.storage_path);
  if (downloadError || !blob) return fail("The upload didn't finish. Remove it and upload the file again.");

  const result = profileCsv(await blob.text());
  if (!result.ok) return fail(result.error);

  const trust = assessEvidence(result.profile);
  // Structured observations — trends and breakdowns — worked out in code, like connected data's metrics.
  const metrics = result.table ? computeCsvMetrics(result.table, result.profile) : [];
  const { error } = await supabase.from("evidence").insert({
    investigation_id: file.investigation_id,
    metrics: metrics.length ? (metrics as unknown as Json) : null,
    source_kind: "upload",
    confidence: trust.level,
    metadata: { confidenceReason: trust.reason },
    workspace_id: company.id, // the database also enforces the investigation's own workspace
    file_id: file.id,
    name: file.name.replace(/\.csv$/i, ""),
    category: "company-data",
    source: "Uploaded CSV",
    format: "csv",
    coverage: result.coverage ?? null,
    summary: result.summary,
    profile: result.profile as unknown as Json,
  });
  if (error) return fail("Couldn't save what Veyra found in this file. Try again in a moment.");

  await supabase.from("files").update({ status: "ready", error: null }).eq("id", fileId);
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Removes an uploaded file and the evidence made from it. */
export async function deleteUpload(fileId: string): Promise<{ ok: true } | { error: string }> {
  await requireWorkspace();
  const supabase = await createClient();
  const { data: file } = await supabase.from("files").select("storage_path").eq("id", fileId).maybeSingle();
  if (!file) return { error: "This upload no longer exists." };
  const { error } = await supabase.from("files").delete().eq("id", fileId);
  if (error) return { error: "Couldn't remove this file." };
  await supabase.storage.from("uploads").remove([file.storage_path]);
  revalidatePath("/", "layout");
  return { ok: true };
}

/* ── AI analysis ──────────────────────────────────────────────────────── */

/** A run still "running" after this long died with its request. */
const STALE_RUN_MS = 10 * 60 * 1000;

/**
 * Analyses an investigation's evidence. The numbers come from the stored
 * profiles (worked out in code); Claude reads them and returns findings,
 * hypotheses and a recommended next step. The run is saved either way, and a
 * finished run moves the investigation on (the database does that).
 */
export async function analyseInvestigation(investigationId: string): Promise<{ ok: true } | { error: string }> {
  const { company } = await requireWorkspace();
  const supabase = await createClient();

  const { data: inv } = await supabase
    .from("investigations")
    .select("id, is_sample, problem, objective, triggers, outcomes, known_context, clarifying_questions (position, question, answer)")
    .eq("id", investigationId)
    .maybeSingle();
  if (!inv) return { error: "This investigation no longer exists." };
  if (inv.is_sample) return { error: "The sample investigation is already analysed." };

  const { data: evidence } = await supabase
    .from("evidence")
    .select("id, name, source, profile, metrics, snapshot_id, created_at")
    .eq("investigation_id", investigationId)
    .not("profile", "is", null)
    .order("created_at");
  if (!evidence?.length) return { error: "Add some data first. Veyra needs at least one dataset to analyse." };

  const { data: running } = await supabase
    .from("analysis_runs")
    .select("id, created_at")
    .eq("investigation_id", investigationId)
    .eq("status", "running");
  const now = Date.now();
  const stale = (running ?? []).filter((r) => now - new Date(r.created_at).getTime() > STALE_RUN_MS);
  if ((running?.length ?? 0) > stale.length) return { error: "An analysis is already running. It usually takes a minute or two." };
  for (const r of stale) {
    await supabase
      .from("analysis_runs")
      .update({ status: "failed", error: "This analysis didn't finish.", completed_at: new Date().toISOString() })
      .eq("id", r.id);
  }

  const allowance = await takeAiAllowance(company.id, "analysis");
  if ("error" in allowance) return allowance;

  // Every kind of evidence arrives in the same shape — a profile, plus metrics for connected data — whatever its source.
  const pack = buildPack(
    evidence.map((e) => ({
      id: e.id,
      name: e.name,
      source: e.source,
      profile: e.profile as unknown as DatasetProfile,
      metrics: (e.metrics ?? undefined) as DataMetric[] | undefined,
      connected: !!e.snapshot_id,
    })),
  );
  const { data: run, error: insertError } = await supabase
    .from("analysis_runs")
    .insert({ investigation_id: investigationId, workspace_id: company.id, model: ANALYSIS_MODEL, pack: pack as unknown as Json })
    .select("id")
    .single();
  if (insertError || !run) return { error: "Couldn't start the analysis. Try again in a moment." };
  revalidatePath("/", "layout");

  const outcome = await runAnalysis({
    context: await getBusinessContext(),
    problem: inv.problem,
    objective: inv.objective,
    triggers: inv.triggers as InvestigationTrigger[],
    outcomes: inv.outcomes as InvestigationOutcome[],
    knownContext: inv.known_context,
    questions: [...inv.clarifying_questions].sort((a, b) => a.position - b.position),
    pack,
    previous: await loadPrevious(supabase, investigationId, run.id),
    memory: await memoryNotes(supabase, investigationId),
  });

  const finished = new Date().toISOString();
  const { error: saveError } =
    outcome.status === "completed"
      ? await supabase
          .from("analysis_runs")
          .update({
            status: "completed",
            result: outcome.result as unknown as Json,
            stop_reason: outcome.stopReason,
            usage: { ...outcome.usage, removed: outcome.removed } as Json,
            completed_at: finished,
          })
          .eq("id", run.id)
      : await supabase
          .from("analysis_runs")
          .update({
            status: outcome.status,
            error: outcome.error,
            stop_reason: outcome.stopReason ?? null,
            usage: (outcome.usage || outcome.detail ? { ...outcome.usage, ...(outcome.detail && { apiError: outcome.detail }) } : null) as Json | null,
            completed_at: finished,
          })
          .eq("id", run.id);

  // Findings, hypotheses and their evidence links as rows. If this fails, the screens read the run's JSON instead.
  if (!saveError && outcome.status === "completed") {
    const saved = await saveEvidenceRows(supabase, investigationId, run.id, outcome.result, pack);
    if ("error" in saved) console.error(`Couldn't save evidence rows for run ${run.id}: ${saved.error}`);
  }

  revalidatePath("/", "layout");
  if (saveError) return { error: "The analysis finished but couldn't be saved. Try again." };
  return outcome.status === "completed" ? { ok: true } : { error: outcome.error };
}

const TASK_STATUSES = ["not-started", "in-progress", "done", "dropped"] as const;

/** The team's progress on a research task: its status, and what they found. */
export async function updateResearchTask(
  taskId: string,
  update: { status: (typeof TASK_STATUSES)[number]; outcome: string },
): Promise<{ ok: true } | { error: string }> {
  const { company } = await requireWorkspace();
  if (!/^[0-9a-f-]{36}$/i.test(taskId) || !TASK_STATUSES.includes(update.status)) return { error: "Something went wrong. Reload the page and try again." };
  const outcome = update.outcome.trim();
  if (outcome.length > 4000) return { error: "Shorten what you found a little." };
  const supabase = await createClient();
  const { data: task, error } = await supabase
    .from("research_tasks")
    .update({ status: update.status, outcome })
    .eq("id", taskId)
    .select("id, investigation_id, title, method")
    .maybeSingle();
  if (error || !task) return { error: "Couldn't save it. Try again in a moment." };
  // What finished research found goes into Business Memory: experiments as experiments, the rest as customer insight.
  if (update.status === "done" && outcome) {
    await remember(supabase, {
      workspaceId: company.id,
      investigationId: task.investigation_id,
      kind: task.method === "experiment" ? "experiment" : "customer-insight",
      title: task.title,
      body: outcome,
      source: { researchTaskId: task.id },
    });
  } else {
    await forget(supabase, task.investigation_id, { researchTaskId: task.id });
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Writes the refined problem definition from the latest analysis (the Problem tab's button). */
export async function defineInvestigationProblem(investigationId: string): Promise<{ ok: true } | { error: string }> {
  const { company } = await requireWorkspace();
  if (!/^[0-9a-f-]{36}$/i.test(investigationId)) return { error: "Something went wrong. Reload the page and try again." };
  const allowance = await takeAiAllowance(company.id, "problem");
  if ("error" in allowance) return allowance;
  const result = await defineProblemFor(investigationId);
  revalidatePath("/", "layout");
  return result;
}

/** Finds opportunity areas for the current problem definition (the Opportunities tab's button). */
export async function findInvestigationOpportunities(investigationId: string): Promise<{ ok: true } | { error: string }> {
  const { company } = await requireWorkspace();
  if (!/^[0-9a-f-]{36}$/i.test(investigationId)) return { error: "Something went wrong. Reload the page and try again." };
  const allowance = await takeAiAllowance(company.id, "opportunities");
  if ("error" in allowance) return allowance;
  const result = await findOpportunitiesFor(investigationId);
  revalidatePath("/", "layout");
  return result;
}

const OPPORTUNITY_STATUSES = ["open", "pursuing", "parked"] as const;

/** The team's call on an opportunity: keep it open, pursue it, or park it. */
export async function setOpportunityStatus(opportunityId: string, status: (typeof OPPORTUNITY_STATUSES)[number]): Promise<{ ok: true } | { error: string }> {
  await requireWorkspace();
  if (!/^[0-9a-f-]{36}$/i.test(opportunityId) || !OPPORTUNITY_STATUSES.includes(status)) return { error: "Something went wrong. Reload the page and try again." };
  const supabase = await createClient();
  if (status === "pursuing") {
    const blocked = await unvalidatedDependencies(opportunityId);
    if (blocked === null) return { error: "This opportunity no longer exists." };
    if (blocked.length) {
      return { error: `Validate ${blocked.join(", ")} first. This opportunity assumes ${blocked.length === 1 ? "it is" : "they are"} true, and ${blocked.length === 1 ? "it hasn't" : "they haven't"} been confirmed.` };
    }
  }
  const { error, count } = await supabase.from("opportunities").update({ status }, { count: "exact" }).eq("id", opportunityId);
  if (error || !count) return { error: "Couldn't save it. Try again in a moment." };
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * The hypotheses an opportunity depends on that the team hasn't confirmed, by ref
 * (null if the opportunity is gone). An opportunity is pursued only once what it
 * assumes is validated.
 */
async function unvalidatedDependencies(opportunityId: string): Promise<string[] | null> {
  const supabase = await createClient();
  const { data: o } = await supabase.from("opportunities").select("investigation_id, depends_on").eq("id", opportunityId).maybeSingle();
  if (!o) return null;
  if (!o.depends_on.length) return [];
  const { data: run } = await supabase
    .from("analysis_runs")
    .select("id")
    .eq("investigation_id", o.investigation_id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const [{ data: hypotheses }, { data: settled }] = await Promise.all([
    run ? supabase.from("hypotheses").select("ref, status, validation_id").eq("analysis_run_id", run.id) : Promise.resolve({ data: [] as { ref: string; status: string; validation_id: string | null }[] }),
    supabase.from("validations").select("id, outcome, settled_at").eq("investigation_id", o.investigation_id).eq("status", "settled").order("settled_at"),
  ]);
  // Settled hypotheses the latest run didn't restate are V1, V2… (as in loadDiscoveryInput).
  const linked = new Set((hypotheses ?? []).map((h) => h.validation_id).filter(Boolean));
  const carried = (settled ?? []).filter((v) => !linked.has(v.id)).map((v, i) => ({ ref: `V${i + 1}`, status: v.outcome ?? "unclear" }));
  const confirmed = new Set([...(hypotheses ?? []), ...carried].filter((h) => h.status === "confirmed").map((h) => h.ref));
  return o.depends_on.filter((ref) => !confirmed.has(ref));
}
