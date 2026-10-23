"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { takeAiAllowance } from "@/lib/ai/usage";
import { requireWorkspace } from "@/lib/auth";
import { briefGates, OUTCOME_LABEL } from "@/lib/brief/build";
import { writeBriefFor } from "@/lib/brief/write";
import { getInvestigationWorkspace } from "@/lib/data";
import { remember } from "@/lib/data/memory";
import { createClient } from "@/lib/supabase/server";
import type { DecisionBrief, DecisionOutcome } from "@/lib/types";

/**
 * The Decision Brief and decisions (Milestone 9). The brief is written on
 * request and saved as a snapshot; a decision is the team's, recorded with
 * its reasoning, and recording one completes the investigation.
 */

type Result = { ok: true } | { error: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RETRY = "Something went wrong. Reload the page and try again.";
const OUTCOMES = Object.keys(OUTCOME_LABEL) as DecisionOutcome[];

async function liveWorkspace(investigationId: string) {
  const ws = await getInvestigationWorkspace(investigationId);
  return ws?.live ? { ...ws, live: ws.live } : null;
}

/** Writes the Decision Brief from everything the investigation holds now. */
export async function writeDecisionBrief(investigationId: string): Promise<Result> {
  const { company } = await requireWorkspace();
  if (!UUID.test(investigationId)) return { error: RETRY };
  const allowance = await takeAiAllowance(company.id, "brief");
  if ("error" in allowance) return allowance;
  const result = await writeBriefFor(investigationId);
  revalidatePath("/", "layout");
  return result;
}

/** Turns the read-only share link on or off. Off removes the link; turning it on again makes a new one. */
export async function setBriefSharing(briefId: string, on: boolean): Promise<{ ok: true; token?: string } | { error: string }> {
  await requireWorkspace();
  if (!UUID.test(briefId)) return { error: RETRY };
  const token = on ? randomBytes(32).toString("base64url") : null;
  const supabase = await createClient();
  const { error, count } = await supabase.from("decision_briefs").update({ share_token: token }, { count: "exact" }).eq("id", briefId);
  if (error || !count) return { error: "Couldn't change sharing. Try again in a moment." };
  revalidatePath("/", "layout");
  return { ok: true, token: token ?? undefined };
}

/** Saves one of the brief's proposed lessons to Business Memory. */
export async function saveLesson(briefId: string, index: number): Promise<Result> {
  const { company } = await requireWorkspace();
  if (!UUID.test(briefId) || !Number.isInteger(index) || index < 0 || index > 10) return { error: RETRY };
  const supabase = await createClient();
  const { data: brief } = await supabase.from("decision_briefs").select("investigation_id, content").eq("id", briefId).maybeSingle();
  const lesson = (brief?.content as unknown as DecisionBrief | undefined)?.lessons?.[index];
  if (!brief || !lesson) return { error: "That lesson no longer exists." };
  await remember(supabase, {
    workspaceId: company.id,
    investigationId: brief.investigation_id,
    kind: "lesson",
    title: lesson.title,
    body: lesson.body,
    source: { briefId, lesson: index },
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * The brief's recommended step, started: research becomes a research task;
 * the rest open the tab where it happens. Returns the tab to go to.
 */
export async function startRecommendedStep(briefId: string): Promise<{ ok: true; tab: string } | { error: string }> {
  await requireWorkspace();
  if (!UUID.test(briefId)) return { error: RETRY };
  const supabase = await createClient();
  const { data: brief } = await supabase.from("decision_briefs").select("investigation_id, content").eq("id", briefId).maybeSingle();
  const rec = (brief?.content as unknown as DecisionBrief | undefined)?.recommendation;
  if (!brief || !rec) return { error: "This brief no longer exists." };

  switch (rec.outcome) {
    case "customer-research":
    case "investigate-further": {
      const { data: existing } = await supabase.from("research_tasks").select("id").eq("investigation_id", brief.investigation_id).eq("title", rec.title.slice(0, 300)).maybeSingle();
      if (!existing) {
        const { error } = await supabase.from("research_tasks").insert({
          investigation_id: brief.investigation_id,
          title: rec.title.slice(0, 300),
          question: rec.reasoning.slice(0, 1000),
          method: rec.outcome === "customer-research" ? "customer-interviews" : "data-analysis",
          method_detail: rec.wouldChangeIf.length ? `Look for: ${rec.wouldChangeIf.join("; ")}` : "",
          priority: "high",
          rationale: "Recommended by the Decision Brief.",
          position: 0,
        });
        if (error) return { error: "Couldn't create the research task. Try again in a moment." };
      }
      revalidatePath("/", "layout");
      return { ok: true, tab: "research" };
    }
    case "validate-hypothesis":
      return { ok: true, tab: "validation" };
    case "prioritize-opportunity":
    case "solution-exploration":
      return { ok: true, tab: "opportunities" };
    default:
      return { ok: true, tab: "report?decide=1" };
  }
}

export type DecisionForm = {
  outcome: DecisionOutcome;
  summary: string;
  rationale: string;
  opportunityId?: string;
  escalateTo: string;
  optionsRejected: string[];
  risks: string[];
  owner: string;
  successMeasure: string;
  reviewDate?: string;
};

const list = (items: unknown, max = 10) =>
  Array.isArray(items) ? items.filter((s): s is string => typeof s === "string").map((s) => s.trim().slice(0, 500)).filter(Boolean).slice(0, max) : [];

/**
 * Records the team's decision. Warnings — what it rests on that isn't
 * validated — are worked out here, not by the person deciding. The database
 * completes the investigation.
 */
export async function recordDecision(investigationId: string, form: DecisionForm): Promise<Result> {
  const { company } = await requireWorkspace();
  if (!UUID.test(investigationId) || !OUTCOMES.includes(form.outcome)) return { error: RETRY };
  const summary = form.summary.trim();
  if (!summary) return { error: "Write the decision in a sentence." };
  if (summary.length > 1000 || form.rationale.length > 4000 || form.successMeasure.length > 1000) return { error: "Shorten the decision a little." };
  if (form.outcome === "escalate" && !form.escalateTo.trim()) return { error: "Say which team it goes to." };
  if (form.reviewDate && !/^\d{4}-\d{2}-\d{2}$/.test(form.reviewDate)) return { error: "Choose a valid review date." };

  const ws = await liveWorkspace(investigationId);
  if (!ws) return { error: "This investigation no longer exists." };
  const record = ws.live.record;
  const opportunity = form.opportunityId ? record.opportunities.find((o) => o.id === form.opportunityId) : undefined;
  if (form.opportunityId && !opportunity) return { error: "That opportunity no longer exists. Reload the page." };

  const g = briefGates(ws);
  const warnings: string[] = [];
  const restsOnCause = ["solution-exploration", "prioritize-opportunity", "no-intervention"].includes(form.outcome);
  if (restsOnCause && !g.confirmed.length) warnings.push("No hypothesis about the cause has been validated. This decision rests on what is still a guess.");
  if (opportunity) {
    const unconfirmed = opportunity.dependsOn.filter((ref) => ws.hypotheses.find((h) => h.id === ref)?.status !== "confirmed");
    if (unconfirmed.length) warnings.push(`“${opportunity.title}” assumes ${unconfirmed.join(", ")}, which ${unconfirmed.length === 1 ? "isn't" : "aren't"} confirmed.`);
  }
  if (restsOnCause && record.problemDefinition?.causeStatus === "open") warnings.push("The problem definition is provisional: what gets in the way isn't known yet.");
  if (g.allEvidenceWeak) warnings.push("Every dataset behind this investigation has low evidence confidence.");
  const openResearch = record.researchTasks.filter((t) => t.priority === "high" && (t.status === "not-started" || t.status === "in-progress"));
  if (openResearch.length) warnings.push(`${openResearch.length} high-priority research task${openResearch.length === 1 ? " is" : "s are"} unfinished.`);

  const supabase = await createClient();
  const { data: decision, error } = await supabase
    .from("decisions")
    .insert({
      investigation_id: investigationId,
      outcome: form.outcome,
      summary,
      rationale: form.rationale.trim(),
      opportunity_id: opportunity?.id ?? null,
      opportunity_title: opportunity?.title ?? "",
      escalate_to: form.outcome === "escalate" ? form.escalateTo.trim().slice(0, 200) : "",
      options_rejected: list(form.optionsRejected),
      risks: list(form.risks),
      owner: form.owner.trim().slice(0, 200),
      success_measure: form.successMeasure.trim(),
      review_date: form.reviewDate || null,
      warnings,
    })
    .select("id")
    .single();
  if (error || !decision) return { error: "Couldn't record the decision. Try again in a moment." };

  await remember(supabase, {
    workspaceId: company.id,
    investigationId,
    kind: "decision",
    title: summary.slice(0, 300),
    body: [`${OUTCOME_LABEL[form.outcome]}.`, form.rationale.trim(), warnings.length ? `Decided despite: ${warnings.join(" ")}` : ""].filter(Boolean).join("\n"),
    source: { decisionId: decision.id, part: "decision" },
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

/** What happened after a decision. Saved to Business Memory as an outcome. */
export async function recordDecisionResult(decisionId: string, result: string): Promise<Result> {
  const { company } = await requireWorkspace();
  if (!UUID.test(decisionId)) return { error: RETRY };
  const text = result.trim();
  if (!text) return { error: "Write what happened." };
  if (text.length > 4000) return { error: "Shorten it a little." };
  const supabase = await createClient();
  const { data: d, error } = await supabase.from("decisions").update({ result: text }).eq("id", decisionId).select("id, investigation_id, summary").maybeSingle();
  if (error || !d) return { error: "Couldn't save it. Try again in a moment." };
  await remember(supabase, {
    workspaceId: company.id,
    investigationId: d.investigation_id,
    kind: "outcome",
    title: `What happened: ${d.summary}`.slice(0, 300),
    body: text,
    source: { decisionId: d.id, part: "outcome" },
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Hides a memory entry (it stays on record but no longer informs analyses). */
export async function archiveMemory(entryId: string): Promise<Result> {
  await requireWorkspace();
  if (!UUID.test(entryId)) return { error: RETRY };
  const supabase = await createClient();
  const { error, count } = await supabase.from("memory_entries").update({ archived: true }, { count: "exact" }).eq("id", entryId);
  if (error || !count) return { error: "Couldn't remove it. Try again in a moment." };
  revalidatePath("/", "layout");
  return { ok: true };
}
