"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { COMPANY_SIZES, INDUSTRIES } from "@/lib/options";
import { createClient } from "@/lib/supabase/server";
import type { CompanySize, Industry } from "@/lib/types";

export type CompanyInput = { name: string; description: string; industry: Industry; size: CompanySize };

/** Creates the user's workspace on first onboarding; updates it when onboarding is run again. */
export async function saveCompany(input: CompanyInput): Promise<{ ok: true } | { error: string }> {
  await requireUser();
  const name = input.name.trim();
  const description = input.description.trim();
  if (!name || !description) return { error: "Add your company name and what it does." };
  if (name.length > 120 || description.length > 500) return { error: "Keep the name and description shorter." };
  if (!INDUSTRIES.includes(input.industry) || !COMPANY_SIZES.some((s) => s.value === input.size)) {
    return { error: "Choose an industry and company size." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_workspace", {
    p_name: name,
    p_description: description,
    p_industry: input.industry,
    p_size: input.size,
  });
  if (error) return { error: "Couldn't save your company. Try again in a moment." };

  revalidatePath("/", "layout");
  return { ok: true };
}
