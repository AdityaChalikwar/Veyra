"use server";

import { revalidatePath } from "next/cache";
import { checkValidationCall, draftValidationPlan, type CallCheck, type HypothesisToTest } from "@/lib/analysis/validation";
import { cleanNeeds, type EvidenceNeed } from "@/lib/analysis/evidence-needs";
import type { AnalysisPack } from "@/lib/analysis/pack";
import type { Json } from "@/lib/supabase/database.types";
import { takeAiAllowance } from "@/lib/ai/usage";
import { requireWorkspace } from "@/lib/auth";
import { getBusinessContext } from "@/lib/data";
import { forget, remember } from "@/lib/data/memory";
import { createClient } from "@/lib/supabase/server";

/**
 * Hypothesis validation (Milestone 9): plan a test, collect evidence for and
 * against, then settle it as confirmed, rejected or unclear with a reason.
 * The database insists on the reason and at least one piece of evidence, and
 * moves the hypothesis's status with the validation.
 */

type Result = { ok: true } | { error: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RETRY = "Something went wrong. Reload the page and try again.";
const RELATIONS = ["supports", "contradicts"] as const;
const OUTCOMES = ["confirmed", "rejected", "unclear"] as const;

/** A hypothesis from the latest finished analysis, with what a validation needs to know. */
async function loadHypothesis(investigationId: string, ref: string) {
  const supabase = await createClient();
  const { data: run } = await supabase
    .from("analysis_runs")
    .select("id, pack")
    .eq("investigation_id", investigationId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!run) return null;
  const [{ data: h }, { data: findings }, { data: inv }] = await Promise.all([
    supabase
      .from("hypotheses")
      .select("id, ref, title, statement, assumptions, validation_method, evidence_status, validation_id")
      .eq("analysis_run_id", run.id)
      .eq("ref", ref)
      .maybeSingle(),
    supabase.from("findings").select("ref, title, statement, position").eq("analysis_run_id", run.id).order("position"),
    supabase.from("investigations").select("problem, is_sample").eq("id", investigationId).maybeSingle(),
  ]);
  if (!h || !inv || inv.is_sample) return null;
  const hypothesis: HypothesisToTest = {
    ref: h.ref,
    title: h.title,
    statement: h.statement,
    assumptions: h.assumptions,
    validationMethod: h.validation_method,
    evidenceStatus: h.evidence_status,
  };
  return {
    row: h,
    hypothesis,
    problem: inv.problem,
    pack: run.pack as unknown as AnalysisPack,
    findings: (findings ?? []).map((f) => `- ${f.ref}: ${f.title ? `${f.title}. ` : ""}${f.statement}`),
  };
}

/**
 * Starts validating a hypothesis: Veyra drafts the plan (or, without AI, it
 * starts from the analysis's suggested test). The team edits it afterwards.
 */
export async function planValidation(investigationId: string, ref: string, useAi: boolean): Promise<Result> {
  const { company } = await requireWorkspace();
  if (!UUID.test(investigationId) || !/^H\d{1,3}$/.test(ref)) return { error: RETRY };
  const loaded = await loadHypothesis(investigationId, ref);
  if (!loaded) return { error: "This hypothesis is no longer in the latest analysis. Reload the page." };
  if (loaded.row.validation_id) return { error: "This hypothesis is already being validated." };

  let plan: { method: string; test: string; confirmIf: string; rejectIf: string; evidenceNeeded: unknown[] } = {
    method: "",
    test: loaded.hypothesis.validationMethod,
    confirmIf: "",
    rejectIf: "",
    evidenceNeeded: [],
  };
  if (useAi) {
    const allowance = await takeAiAllowance(company.id, "validation");
    if ("error" in allowance) return allowance;
    const drafted = await draftValidationPlan(await getBusinessContext(), loaded.problem, loaded.pack, loaded.hypothesis, loaded.findings);
    if (!drafted.ok) return { error: drafted.failure.error };
    plan = drafted.data;
  }

  const supabase = await createClient();
  const { data: v, error } = await supabase
    .from("validations")
    .insert({
      investigation_id: investigationId,
      hypothesis_title: loaded.hypothesis.title.slice(0, 200),
      hypothesis_statement: loaded.hypothesis.statement.slice(0, 2000),
      method: plan.method.slice(0, 200),
      test: plan.test.slice(0, 2000),
      confirm_if: plan.confirmIf.slice(0, 1000),
      reject_if: plan.rejectIf.slice(0, 1000),
      evidence_needed: cleanNeeds(plan.evidenceNeeded) as unknown as Json,
    })
    .select("id")
    .single();
  if (error || !v) return { error: "Couldn't save the plan. Try again in a moment." };
  const { error: linkError } = await supabase.from("hypotheses").update({ validation_id: v.id }).eq("id", loaded.row.id);
  if (linkError) {
    await supabase.from("validations").delete().eq("id", v.id);
    return { error: "Couldn't save the plan. Try again in a moment." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export type PlanEdit = { method: string; test: string; confirmIf: string; rejectIf: string; evidenceNeeded: EvidenceNeed[] };

/** The team's own wording of the plan. */
export async function updateValidationPlan(validationId: string, edit: PlanEdit): Promise<Result> {
  await requireWorkspace();
  if (!UUID.test(validationId)) return { error: RETRY };
  const method = edit.method.trim();
  const test = edit.test.trim();
  if (!test) return { error: "Say what the test is." };
  if (method.length > 200 || test.length > 2000 || edit.confirmIf.length > 1000 || edit.rejectIf.length > 1000) return { error: "Shorten the plan a little." };
  const supabase = await createClient();
  const { error, count } = await supabase
    .from("validations")
    .update(
      { method, test, confirm_if: edit.confirmIf.trim(), reject_if: edit.rejectIf.trim(), evidence_needed: cleanNeeds(edit.evidenceNeeded) as unknown as Json },
      { count: "exact" },
    )
    .eq("id", validationId);
  if (error || !count) return { error: "Couldn't save the plan. Try again in a moment." };
  revalidatePath("/", "layout");
  return { ok: true };
}

/** The checklist item a piece of evidence covers, if it is one of the plan's. */
function needFor(needed: Json, needId?: string): string | null {
  return needId && cleanNeeds(needed).some((n) => n.id === needId) ? needId : null;
}

/** Moves a planned validation to in progress, as evidence starts coming in. */
async function markStarted(validationId: string) {
  const supabase = await createClient();
  await supabase.from("validations").update({ status: "in-progress" }).eq("id", validationId).eq("status", "planned");
}

/** Evidence for or against: a note, or a finished research task's outcome. */
export async function addValidationNote(
  validationId: string,
  note: { relation: (typeof RELATIONS)[number]; body?: string; researchTaskId?: string; needId?: string },
): Promise<Result> {
  await requireWorkspace();
  if (!UUID.test(validationId) || !RELATIONS.includes(note.relation)) return { error: RETRY };
  const supabase = await createClient();
  const { data: v } = await supabase.from("validations").select("id, investigation_id, status, evidence_needed").eq("id", validationId).maybeSingle();
  if (!v) return { error: "This validation no longer exists." };
  if (v.status === "settled") return { error: "This validation is settled. Reopen it to add evidence." };
  const needId = needFor(v.evidence_needed, note.needId);

  let body = (note.body ?? "").trim();
  let kind: "note" | "research-task" = "note";
  let researchTaskId: string | null = null;
  if (note.researchTaskId) {
    if (!UUID.test(note.researchTaskId)) return { error: RETRY };
    const { data: task } = await supabase.from("research_tasks").select("id, title, outcome").eq("id", note.researchTaskId).eq("investigation_id", v.investigation_id).maybeSingle();
    if (!task) return { error: "That research task no longer exists." };
    if (!task.outcome.trim()) return { error: "Record what the research found first (in the Research tab)." };
    body = `${task.title}: ${task.outcome.trim()}`;
    kind = "research-task";
    researchTaskId = task.id;
  }
  if (!body) return { error: "Write what you found." };
  if (body.length > 4000) return { error: "Shorten the note a little." };

  const { error } = await supabase
    .from("validation_notes")
    .insert({ validation_id: validationId, investigation_id: v.investigation_id, kind, research_task_id: researchTaskId, body, relation: note.relation, need_id: needId });
  if (error) return { error: "Couldn't save it. Try again in a moment." };
  await markStarted(validationId);
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Evidence for or against from a dataset in the investigation. */
export async function addValidationDataset(
  validationId: string,
  link: { evidenceId: string; relation: (typeof RELATIONS)[number]; shows: string; needId?: string },
): Promise<Result> {
  await requireWorkspace();
  if (!UUID.test(validationId) || !UUID.test(link.evidenceId) || !RELATIONS.includes(link.relation)) return { error: RETRY };
  const shows = link.shows.trim();
  if (!shows) return { error: "Say what this data shows for the hypothesis." };
  if (shows.length > 1000) return { error: "Shorten it a little." };
  const supabase = await createClient();
  const { data: v } = await supabase.from("validations").select("id, investigation_id, status, evidence_needed").eq("id", validationId).maybeSingle();
  if (!v) return { error: "This validation no longer exists." };
  if (v.status === "settled") return { error: "This validation is settled. Reopen it to add evidence." };
  const { error } = await supabase.from("evidence_links").insert({
    investigation_id: v.investigation_id,
    evidence_id: link.evidenceId,
    validation_id: validationId,
    relation: link.relation,
    shows,
    need_id: needFor(v.evidence_needed, link.needId),
  });
  if (error) return { error: "Couldn't link that data. Try again in a moment." };
  await markStarted(validationId);
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Removes a note or a dataset link from an unsettled validation. */
export async function removeValidationEvidence(kind: "note" | "dataset", id: string): Promise<Result> {
  await requireWorkspace();
  if (!UUID.test(id)) return { error: RETRY };
  const supabase = await createClient();
  const table = kind === "note" ? "validation_notes" : "evidence_links";
  const { data: row } = await supabase.from(table).select("validation_id").eq("id", id).maybeSingle();
  if (!row?.validation_id) return { error: "That evidence no longer exists." };
  const { data: v } = await supabase.from("validations").select("status").eq("id", row.validation_id).maybeSingle();
  if (v?.status === "settled") return { error: "This validation is settled. Reopen it to change its evidence." };
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) return { error: "Couldn't remove it. Try again in a moment." };
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * The team's call: confirmed, rejected or unclear, with the reason. A confirmed
 * or rejected hypothesis goes into Business Memory.
 */
export async function settleValidation(validationId: string, outcome: (typeof OUTCOMES)[number], reason: string): Promise<Result> {
  const { company } = await requireWorkspace();
  if (!UUID.test(validationId) || !OUTCOMES.includes(outcome)) return { error: RETRY };
  const why = reason.trim();
  if (why.length < 3) return { error: "Say why. The reason is what the team will rely on later." };
  if (why.length > 2000) return { error: "Shorten the reason a little." };
  const supabase = await createClient();
  const { data: v, error } = await supabase
    .from("validations")
    .update({ status: "settled", outcome, reason: why })
    .eq("id", validationId)
    .select("id, investigation_id, hypothesis_title, hypothesis_statement")
    .maybeSingle();
  if (error) {
    return { error: /evidence/i.test(error.message) ? "Add at least one piece of evidence before settling it." : "Couldn't save the result. Try again in a moment." };
  }
  if (!v) return { error: "This validation no longer exists." };

  if (outcome === "unclear") {
    await forget(supabase, v.investigation_id, { validationId });
  } else {
    await remember(supabase, {
      workspaceId: company.id,
      investigationId: v.investigation_id,
      kind: outcome === "confirmed" ? "validated-problem" : "rejected-hypothesis",
      title: v.hypothesis_title || v.hypothesis_statement.slice(0, 120),
      body: `${v.hypothesis_statement}\n${outcome === "confirmed" ? "Confirmed" : "Rejected"} because: ${why}`,
      source: { validationId },
    });
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Takes back a call, e.g. when new evidence arrives. Its memory entry is hidden. */
export async function reopenValidation(validationId: string): Promise<Result> {
  await requireWorkspace();
  if (!UUID.test(validationId)) return { error: RETRY };
  const supabase = await createClient();
  const { data: v, error } = await supabase
    .from("validations")
    .update({ status: "in-progress", outcome: null })
    .eq("id", validationId)
    .select("investigation_id")
    .maybeSingle();
  if (error || !v) return { error: "Couldn't reopen it. Try again in a moment." };
  await forget(supabase, v.investigation_id, { validationId });
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Removes a validation that hasn't been settled; the hypothesis goes back to open. */
export async function deleteValidation(validationId: string): Promise<Result> {
  await requireWorkspace();
  if (!UUID.test(validationId)) return { error: RETRY };
  const supabase = await createClient();
  const { error, count } = await supabase.from("validations").delete({ count: "exact" }).eq("id", validationId).neq("status", "settled");
  if (error || !count) return { error: "Couldn't remove it. A settled validation has to be reopened first." };
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Veyra's second opinion on a call before the team makes it. Advice only: nothing is saved. */
export async function checkCall(
  validationId: string,
  outcome: (typeof OUTCOMES)[number],
  reason: string,
): Promise<{ ok: true; check: CallCheck } | { error: string }> {
  const { company } = await requireWorkspace();
  if (!UUID.test(validationId) || !OUTCOMES.includes(outcome)) return { error: RETRY };
  const supabase = await createClient();
  const { data: v } = await supabase
    .from("validations")
    .select("id, investigation_id, method, test, confirm_if, reject_if, evidence_needed, validation_notes (relation, body, need_id), evidence_links (relation, shows, need_id, evidence (name))")
    .eq("id", validationId)
    .maybeSingle();
  if (!v) return { error: "This validation no longer exists." };
  const evidence = [
    ...v.validation_notes.map((n) => ({ relation: n.relation, text: n.body, needId: n.need_id ?? undefined })),
    ...v.evidence_links.map((l) => ({ relation: l.relation, text: `${l.evidence?.name ?? "Dataset"}: ${l.shows}`, needId: l.need_id ?? undefined })),
  ];
  if (!evidence.length) return { error: "Add some evidence first, so there is something to check." };
  const { data: h } = await supabase.from("hypotheses").select("ref").eq("validation_id", validationId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const loaded = h ? await loadHypothesis(v.investigation_id, h.ref) : null;
  if (!loaded) return { error: "This hypothesis is no longer in the latest analysis." };

  const allowance = await takeAiAllowance(company.id, "validation");
  if ("error" in allowance) return allowance;
  const result = await checkValidationCall(await getBusinessContext(), loaded.problem, loaded.pack, loaded.hypothesis, loaded.findings, {
    plan: { method: v.method, test: v.test, confirmIf: v.confirm_if, rejectIf: v.reject_if, evidenceNeeded: cleanNeeds(v.evidence_needed) },
    evidence,
    outcome,
    reason: reason.trim().slice(0, 2000),
  });
  if (!result.ok) return { error: result.failure.error };
  return { ok: true, check: result.data };
}
