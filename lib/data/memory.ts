import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";
import type { MemoryNote } from "@/lib/analysis/run";

/**
 * Business Memory as structured rows (Milestone 9): what investigations
 * validated, rejected, learned from customers, decided, tried and found out.
 * Written as the team works — settling a hypothesis, finishing a research
 * task, recording a decision or its result — and read back as context for
 * every new analysis.
 */

export type MemoryKind = "validated-problem" | "rejected-hypothesis" | "customer-insight" | "market-research" | "decision" | "experiment" | "outcome" | "lesson";

/** What a memory entry came from, e.g. { validationId }. One entry per source: writing again updates it. */
type Source = { validationId: string } | { researchTaskId: string } | { decisionId: string; part: "decision" | "outcome" } | { briefId: string; lesson: number };

type Client = SupabaseClient<Database>;

export async function remember(
  supabase: Client,
  entry: { workspaceId: string; investigationId: string; kind: MemoryKind; title: string; body: string; source: Source },
): Promise<void> {
  const title = entry.title.trim().slice(0, 300) || "Untitled";
  const body = entry.body.trim().slice(0, 4000);
  let query = supabase.from("memory_entries").select("id").eq("investigation_id", entry.investigationId);
  for (const [key, value] of Object.entries(entry.source)) query = query.eq(`source->>${key}`, String(value));
  const { data: existing } = await query.limit(1).maybeSingle();
  const { error } = existing
    ? await supabase.from("memory_entries").update({ title, body, archived: false }).eq("id", existing.id)
    : await supabase.from("memory_entries").insert({
        workspace_id: entry.workspaceId,
        investigation_id: entry.investigationId,
        kind: entry.kind,
        title,
        body,
        source: entry.source as unknown as Json,
      });
  if (error) console.error("memory entry not saved", error.message);
}

/** Hides the entries a source wrote, e.g. when a settled hypothesis is reopened. */
export async function forget(supabase: Client, investigationId: string, source: Partial<Record<string, string>>): Promise<void> {
  let query = supabase.from("memory_entries").update({ archived: true }).eq("investigation_id", investigationId);
  for (const [key, value] of Object.entries(source)) if (value) query = query.eq(`source->>${key}`, value);
  await query;
}

/** Recent memory from other investigations, for an analysis to build on. */
export async function memoryNotes(supabase: Client, excludeInvestigationId?: string, limit = 20): Promise<MemoryNote[]> {
  let query = supabase.from("memory_entries").select("kind, title, body, investigation_id").eq("archived", false).order("created_at", { ascending: false }).limit(limit);
  if (excludeInvestigationId) query = query.or(`investigation_id.is.null,investigation_id.neq.${excludeInvestigationId}`);
  const { data } = await query;
  return (data ?? []).map((m) => ({ kind: m.kind, title: m.title, body: m.body }));
}

/** A settled hypothesis in memory: confirmed → validated problem, rejected → rejected hypothesis, unclear → nothing. */
export async function rememberValidation(
  supabase: Client,
  v: { id: string; workspaceId: string; investigationId: string; title: string; statement: string },
  outcome: "confirmed" | "rejected" | "unclear",
  reason: string,
  by: "team" | "veyra" = "team",
): Promise<void> {
  if (outcome === "unclear") return forget(supabase, v.investigationId, { validationId: v.id });
  await remember(supabase, {
    workspaceId: v.workspaceId,
    investigationId: v.investigationId,
    kind: outcome === "confirmed" ? "validated-problem" : "rejected-hypothesis",
    title: v.title || v.statement.slice(0, 120),
    body: `${v.statement}\n${outcome === "confirmed" ? "Confirmed" : "Rejected"}${by === "veyra" ? " by Veyra's validation" : ""} because: ${reason}`,
    source: { validationId: v.id },
  });
}
