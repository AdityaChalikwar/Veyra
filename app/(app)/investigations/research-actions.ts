"use server";

import { revalidatePath } from "next/cache";
import { takeAiAllowance } from "@/lib/ai/usage";
import { requireWorkspace } from "@/lib/auth";
import { getBusinessContext } from "@/lib/data";
import { remember } from "@/lib/data/memory";
import { COMPLETED } from "@/lib/investigation/completed";
import { mergeResearch, researchOnWeb, researchOutcome } from "@/lib/research/web";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import type { WebResearch } from "@/lib/types";
import type { RunResult } from "@/lib/validation-run/types";

/** Secondary research: Veyra researches a question on the public web (Milestone 10). */

type Result = { ok: true } | { error: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RETRY = "Something went wrong. Reload the page and try again.";

const MARKET_TITLE = "Competitors and the market";

/** Veyra researches a desk-research task on the web and records what it found, with sources. */
export async function researchTask(taskId: string): Promise<Result> {
  const { company } = await requireWorkspace();
  if (!UUID.test(taskId)) return { error: RETRY };
  const supabase = await createClient();
  const { data: task } = await supabase
    .from("research_tasks")
    .select("id, investigation_id, title, question, method, method_detail, status, research, investigations (problem, status, is_sample)")
    .eq("id", taskId)
    .maybeSingle();
  if (!task?.investigations) return { error: "This research task no longer exists." };
  const inv = task.investigations;
  if (inv.is_sample) return { error: "The sample stays as it is. Try the full demo to run research yourself." };
  if (inv.status === "completed") return COMPLETED;
  if (task.status === "in-progress") return { error: "This research is already running." };

  const allowance = await takeAiAllowance(company.id, "research");
  if ("error" in allowance) return allowance;
  await supabase.from("research_tasks").update({ status: "in-progress" }).eq("id", task.id);

  const [{ data: definition }, { data: runs }] = await Promise.all([
    supabase.from("problem_definitions").select("statement").eq("investigation_id", task.investigation_id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("validation_runs").select("results").eq("investigation_id", task.investigation_id).eq("phase", "completed"),
  ]);
  // What is already known, so research again looks for something new: this task's earlier
  // research, and what validations found on the web.
  const before = (task.research as unknown as WebResearch | null) ?? undefined;
  const fromValidations = (runs ?? []).flatMap((run) =>
    ((run.results as unknown as RunResult[] | null) ?? []).flatMap((x) => (x.kind === "web" ? [x.finding] : [])),
  );
  const known = [...(before ? [before.answer, ...before.facts.map((f) => f.text), ...before.views.map((v) => v.text)] : []), ...fromValidations].slice(0, 30);
  const r = await researchOnWeb(
    await getBusinessContext(),
    inv.problem,
    definition?.statement,
    { title: task.title, question: task.question, detail: task.method_detail },
    known,
  );
  if (!r.ok) {
    await supabase.from("research_tasks").update({ status: task.status === "in-progress" ? "not-started" : task.status }).eq("id", task.id);
    revalidatePath("/", "layout");
    return { error: r.failure.error };
  }

  const research = mergeResearch(before, r.research);
  const outcome = researchOutcome(research);
  const { error } = await supabase
    .from("research_tasks")
    .update({ status: "done", outcome, researched_by: "veyra", research: research as unknown as Json })
    .eq("id", task.id);
  if (error) return { error: "Veyra found the answer, but it couldn't be saved. Try again." };
  await remember(supabase, {
    workspaceId: company.id,
    investigationId: task.investigation_id,
    kind: "market-research",
    title: task.title,
    body: outcome,
    source: { researchTaskId: task.id },
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Competitors and the market, from Customers & Market: how others handle the
 * same problem and what is happening around it. Runs again on the same task.
 */
export async function researchMarket(investigationId: string): Promise<Result> {
  await requireWorkspace();
  if (!UUID.test(investigationId)) return { error: RETRY };
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("research_tasks")
    .select("id")
    .eq("investigation_id", investigationId)
    .eq("title", MARKET_TITLE)
    .limit(1)
    .maybeSingle();
  if (existing) return researchTask(existing.id);
  const { data: inv } = await supabase.from("investigations").select("status, is_sample").eq("id", investigationId).maybeSingle();
  if (!inv) return { error: "This investigation no longer exists." };
  if (inv.is_sample) return { error: "The sample stays as it is. Try the full demo to run research yourself." };
  if (inv.status === "completed") return COMPLETED;
  const { data: created, error } = await supabase
    .from("research_tasks")
    .insert({
      investigation_id: investigationId,
      position: 999,
      title: MARKET_TITLE,
      question:
        "How do competitors and similar companies handle this problem, and is anything happening in the market (releases, news, trends, public reviews) that helps explain it?",
      method: "desk-research",
      method_detail: "Search competitors' products and help pages, industry news and public reviews.",
      priority: "medium",
      rationale: "Asked from Customers & Market: outside context for the problem.",
    })
    .select("id")
    .single();
  if (error || !created) return { error: "Couldn't start the research. Try again in a moment." };
  return researchTask(created.id);
}
