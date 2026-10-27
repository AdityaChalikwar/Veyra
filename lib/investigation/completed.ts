import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * A recorded decision completes an investigation. Its record then stays as it
 * was decided: work that would change it waits until the team reopens it.
 */

export const COMPLETED = { error: "This investigation is completed. Reopen it to change it." } as const;

export async function isCompleted(investigationId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.from("investigations").select("status").eq("id", investigationId).maybeSingle();
  return data?.status === "completed";
}
