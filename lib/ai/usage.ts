import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * A daily limit on AI calls per person, because every call is paid for by the
 * app's own API key. Set AI_DAILY_LIMIT to change it (default 25 a day).
 */

const DEFAULT_LIMIT = 25;
const DAY_MS = 24 * 60 * 60 * 1000;

export function dailyLimit(): number {
  const n = Number(process.env.AI_DAILY_LIMIT);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_LIMIT;
}

/**
 * Records one AI call for the signed-in person, or refuses it when they've
 * reached today's limit. Call it just before calling the model.
 */
export async function takeAiAllowance(workspaceId: string, kind: "analysis" | "questions" | "problem" | "opportunities" | "validation" | "brief" | "validation-run"): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const since = new Date(Date.now() - DAY_MS).toISOString();
  const { count, error } = await supabase.from("ai_usage").select("id", { count: "exact", head: true }).gte("created_at", since);
  if (error) return { error: "Couldn't check your AI usage. Try again in a moment." };
  const limit = dailyLimit();
  if ((count ?? 0) >= limit) {
    return { error: `You've used today's ${limit} AI requests. They refresh over the next 24 hours.` };
  }
  const { error: insertError } = await supabase.from("ai_usage").insert({ workspace_id: workspaceId, kind });
  if (insertError) return { error: "Couldn't record your AI usage. Try again in a moment." };
  return { ok: true };
}
