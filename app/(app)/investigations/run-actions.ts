"use server";

import { after } from "next/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { takeAiAllowance } from "@/lib/ai/usage";
import { requireWorkspace } from "@/lib/auth";
import { forget } from "@/lib/data/memory";
import { COMPLETED, isCompleted } from "@/lib/investigation/completed";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { advanceRun, createRun } from "@/lib/validation-run/engine";
import { kick, originOf } from "@/lib/validation-run/kick";
import { ACTIVE_PHASES, type RunPhase, type RunRequest } from "@/lib/validation-run/types";

/**
 * Veyra validates a hypothesis itself (see lib/validation-run/engine.ts). The
 * team chooses which hypothesis to run, answers any request for evidence Veyra
 * can't reach (or goes ahead without it), and can always override the verdict.
 */

type Result<T = object> = ({ ok: true } & T) | { error: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RETRY = "Something went wrong. Reload the page and try again.";

/** Continues a run in the background, after this request has replied. */
async function continueInBackground(runId: string) {
  const h = await headers();
  const origin = originOf(h);
  const cookie = h.get("cookie");
  if (origin) after(() => kick(origin, cookie, runId));
}

/**
 * Runs Veyra's validation of a hypothesis from the latest analysis. Creates the
 * validation if the team hasn't planned one; a settled one is reopened.
 */
export async function runValidation(investigationId: string, ref: string): Promise<Result<{ runId: string }>> {
  const { company } = await requireWorkspace();
  if (!UUID.test(investigationId) || !/^H\d{1,3}$/.test(ref)) return { error: RETRY };
  const supabase = await createClient();
  const { data: run } = await supabase
    .from("analysis_runs")
    .select("id")
    .eq("investigation_id", investigationId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: h } = run
    ? await supabase.from("hypotheses").select("id, title, statement, validation_method, validation_id").eq("analysis_run_id", run.id).eq("ref", ref).maybeSingle()
    : { data: null };
  const { data: inv } = await supabase.from("investigations").select("is_sample, status").eq("id", investigationId).maybeSingle();
  if (!h || !inv || inv.is_sample) return { error: "This hypothesis is no longer in the latest analysis. Reload the page." };
  if (inv.status === "completed") return COMPLETED;

  let validationId = h.validation_id;
  if (validationId) {
    const { data: active } = await supabase.from("validation_runs").select("id").eq("validation_id", validationId).in("phase", [...ACTIVE_PHASES, "needs-input"]).limit(1).maybeSingle();
    if (active) return { ok: true, runId: active.id };
  }

  const allowance = await takeAiAllowance(company.id, "validation-run");
  if ("error" in allowance) return allowance;

  if (!validationId) {
    const { data: v, error } = await supabase
      .from("validations")
      .insert({ investigation_id: investigationId, hypothesis_title: h.title.slice(0, 200), hypothesis_statement: h.statement.slice(0, 2000), test: h.validation_method.slice(0, 2000) })
      .select("id")
      .single();
    if (error || !v) return { error: "Couldn't start the validation. Try again in a moment." };
    const { error: linkError } = await supabase.from("hypotheses").update({ validation_id: v.id }).eq("id", h.id);
    if (linkError) {
      await supabase.from("validations").delete().eq("id", v.id);
      return { error: "Couldn't start the validation. Try again in a moment." };
    }
    validationId = v.id;
  } else {
    await reopen(validationId, investigationId);
  }

  const created = await createRun(supabase, validationId, investigationId);
  if ("error" in created) return created;
  await continueInBackground(created.id);
  revalidatePath("/", "layout");
  return { ok: true, runId: created.id };
}

/** Reopens a settled validation so a new run can settle it again. */
async function reopen(validationId: string, investigationId: string) {
  const supabase = await createClient();
  const { data: v } = await supabase.from("validations").select("status").eq("id", validationId).maybeSingle();
  if (v?.status === "settled") {
    await supabase.from("validations").update({ status: "in-progress", outcome: null }).eq("id", validationId);
    await forget(supabase, investigationId, { validationId });
  }
}

/** The team's answer to one of Veyra's requests: a few words, or "I've added it" for an upload or a connected source. */
export async function answerRequest(runId: string, requestId: string, answer: { text?: string; added?: boolean }): Promise<Result> {
  await requireWorkspace();
  if (!UUID.test(runId) || !/^Q\d{1,2}$/.test(requestId)) return { error: RETRY };
  const text = (answer.text ?? "").trim();
  if (!answer.added && !text) return { error: "Write your answer first." };
  if (text.length > 2000) return { error: "Shorten the answer a little." };
  const supabase = await createClient();
  const { data: run } = await supabase.from("validation_runs").select("requests, phase").eq("id", runId).maybeSingle();
  if (!run) return { error: "This validation run no longer exists." };
  const requests = (run.requests as unknown as RunRequest[]).map((r) =>
    r.id === requestId ? { ...r, status: "provided" as const, answerText: text || (answer.added ? "Added to the investigation." : r.answerText) } : r,
  );
  const { error } = await supabase.from("validation_runs").update({ requests: requests as unknown as Json }).eq("id", runId);
  if (error) return { error: "Couldn't save it. Try again in a moment." };
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Carries on after Veyra asked for evidence: with whatever the team added
 * (for new data, Veyra designs the tests again to include it), or without it. Anything
 * not provided counts as skipped, and Veyra doesn't ask again.
 */
export async function continueRun(runId: string): Promise<Result> {
  await requireWorkspace();
  if (!UUID.test(runId)) return { error: RETRY };
  const supabase = await createClient();
  const { data: run } = await supabase.from("validation_runs").select("requests, phase").eq("id", runId).maybeSingle();
  if (!run) return { error: "This validation run no longer exists." };
  if (run.phase !== "needs-input") return { ok: true };
  const requests = (run.requests as unknown as RunRequest[]).map((r) => (r.status === "open" ? { ...r, status: "skipped" as const } : r));
  // New data (an upload or a connected source) means designing the tests again; typed answers don't.
  const added = requests.some((r) => r.status === "provided" && r.answer !== "text");
  const { error } = await supabase
    .from("validation_runs")
    .update({ requests: requests as unknown as Json, proceed_without: true, phase: added ? "gathering" : "testing" })
    .eq("id", runId)
    .eq("phase", "needs-input");
  if (error) return { error: "Couldn't continue. Try again in a moment." };
  await continueInBackground(runId);
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * "Make this stronger": after a verdict, the team adds what was missing and
 * Veyra runs the validation again with it. Answers already given carry over.
 */
export async function rerunWithEvidence(runId: string): Promise<Result<{ runId: string }>> {
  const { company } = await requireWorkspace();
  if (!UUID.test(runId)) return { error: RETRY };
  const supabase = await createClient();
  const { data: old } = await supabase.from("validation_runs").select("validation_id, investigation_id, requests, phase").eq("id", runId).maybeSingle();
  if (!old) return { error: "This validation run no longer exists." };
  if (ACTIVE_PHASES.includes(old.phase as RunPhase)) return { error: "This validation is still running." };
  if (await isCompleted(old.investigation_id)) return COMPLETED;
  const allowance = await takeAiAllowance(company.id, "validation-run");
  if ("error" in allowance) return allowance;
  await reopen(old.validation_id, old.investigation_id);
  const created = await createRun(supabase, old.validation_id, old.investigation_id);
  if ("error" in created) return created;
  const carried = (old.requests as unknown as RunRequest[]).filter((r) => r.status === "provided");
  if (carried.length) await supabase.from("validation_runs").update({ requests: carried as unknown as Json, proceed_without: true }).eq("id", created.id);
  await continueInBackground(created.id);
  revalidatePath("/", "layout");
  return { ok: true, runId: created.id };
}

/**
 * Moves a run on from an open Validation tab when the background chain has
 * stalled (e.g. the platform blocked the self-call). Does one phase here.
 */
export async function resumeRun(runId: string): Promise<Result<{ phase: RunPhase }>> {
  await requireWorkspace();
  if (!UUID.test(runId)) return { error: RETRY };
  const result = await advanceRun(runId);
  if ("error" in result) return result;
  if ("busy" in result) return { ok: true, phase: "testing" };
  if (result.more) await continueInBackground(runId);
  revalidatePath("/", "layout");
  return { ok: true, phase: result.phase };
}
