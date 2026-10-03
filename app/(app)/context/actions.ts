"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspace } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { BusinessContext } from "@/lib/types";

export type BusinessContextInput = Omit<BusinessContext, "company">;

const MAX_TEXT = 500;
const MAX_ITEMS = 10;

const cleanList = (items: string[]) =>
  items
    .map((i) => i.trim())
    .filter(Boolean)
    .slice(0, MAX_ITEMS)
    .map((i) => i.slice(0, 200));

/** Saves the workspace's business context. Every investigation reads it. */
export async function saveBusinessContext(input: BusinessContextInput): Promise<{ ok: true } | { error: string }> {
  const { company } = await requireWorkspace();
  const supabase = await createClient();
  const { error } = await supabase
    .from("business_contexts")
    .update({
      product: input.product.trim().slice(0, MAX_TEXT),
      business_model: input.businessModel.trim().slice(0, MAX_TEXT),
      target_customers: input.targetCustomers.trim().slice(0, MAX_TEXT),
      goals: cleanList(input.goals),
      priorities: cleanList(input.priorities),
      key_metrics: cleanList(input.keyMetrics),
    })
    .eq("workspace_id", company.id);
  if (error) return { error: "Couldn't save the business context. Try again in a moment." };
  revalidatePath("/", "layout");
  return { ok: true };
}
