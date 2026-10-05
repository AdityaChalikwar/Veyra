"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspace } from "@/lib/auth";
import { deriveTitle, inferTopic } from "@/lib/investigation-text";
import { OUTCOMES, TRIGGERS } from "@/lib/options";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import type { InvestigationDraft } from "@/lib/types";

const MAX_PROBLEM = 2000;
const MAX_TEXT = 5000;
const MAX_ITEMS = 20;

/** Saves the New Investigation draft — problem, context, answered questions and plan — as an investigation. */
export async function createInvestigation(draft: InvestigationDraft): Promise<{ id: string } | { error: string }> {
  const { company } = await requireWorkspace();
  const problem = draft.problem.trim();
  if (!problem) return { error: "Describe the problem first." };
  if (problem.length > MAX_PROBLEM) return { error: "Shorten the problem description a little." };

  const trigger = TRIGGERS.some((t) => t.value === draft.trigger) ? draft.trigger : null;
  const outcome = OUTCOMES.some((o) => o.value === draft.outcome) ? draft.outcome : null;
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
    p_topic: inferTopic(problem),
    p_trigger: trigger,
    p_outcome: outcome,
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

/** Deletes an investigation and everything in it (including the sample). */
export async function deleteInvestigation(investigationId: string): Promise<{ ok: true } | { error: string }> {
  await requireWorkspace();
  const supabase = await createClient();
  const { error, count } = await supabase.from("investigations").delete({ count: "exact" }).eq("id", investigationId);
  if (error || !count) return { error: "Couldn't delete this investigation." };
  revalidatePath("/", "layout");
  return { ok: true };
}
