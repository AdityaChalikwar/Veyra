/**
 * Data access layer.
 *
 * Every screen reads data through these functions — never from `/mocks` directly.
 * To connect the real backend, replace these implementations with API calls;
 * the signatures (and `lib/types.ts`) are the contract the UI depends on.
 */
import { mockCompany } from "@/mocks/company";
import { mockInvestigations } from "@/mocks/investigations";
import { mockUser } from "@/mocks/user";
import type { Company, InvestigationSummary, User } from "@/lib/types";

export async function getCurrentUser(): Promise<User> {
  return mockUser;
}

export async function getCompany(): Promise<Company> {
  return mockCompany;
}

export type CompanyInput = Omit<Company, "id">;

/** Saves the business profile collected during onboarding. */
export async function saveCompany(input: CompanyInput): Promise<Company> {
  return { ...input, id: mockCompany.id };
}

export async function listInvestigations(): Promise<InvestigationSummary[]> {
  return mockInvestigations;
}

export async function getInvestigationSummary(id: string): Promise<InvestigationSummary | undefined> {
  return mockInvestigations.find((i) => i.id === id);
}
