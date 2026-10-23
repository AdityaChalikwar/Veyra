import "server-only";
import { getBusinessContext, getInvestigationWorkspace } from "@/lib/data";
import { memoryNotes } from "@/lib/data/memory";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { assembleBrief } from "./build";
import { judgeBrief } from "./generate";

/**
 * Writes and saves a new Decision Brief from everything the investigation holds
 * now. Used by the brief's button (after the daily AI limit) and by validation
 * runs, which rewrite the brief after a verdict.
 */
export async function writeBriefFor(investigationId: string): Promise<{ ok: true } | { error: string }> {
  const ws = await getInvestigationWorkspace(investigationId);
  if (!ws?.live) return { error: "This investigation no longer exists." };
  if (!ws.live.run) return { error: "Analyse your data first. The brief builds on the findings." };
  const live = { ...ws, live: ws.live };
  const supabase = await createClient();
  const judged = await judgeBrief(live, await getBusinessContext(), await memoryNotes(supabase, investigationId, 10));
  if (!judged.ok) return { error: judged.failure.error };
  const { error } = await supabase.from("decision_briefs").insert({ investigation_id: investigationId, content: assembleBrief(live, judged.data) as unknown as Json });
  return error ? { error: "The brief was written but couldn't be saved. Try again." } : { ok: true };
}
