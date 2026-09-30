/**
 * Data access layer.
 *
 * Every screen reads data through these functions — never from `/mocks` directly.
 * To connect the real backend, replace these implementations with API calls;
 * the signatures (and `lib/types.ts`) are the contract the UI depends on.
 */
import { mockCompany } from "@/mocks/company";
import { buildDecisions } from "@/mocks/decisions";
import { buildEvidence } from "@/mocks/evidence";
import { buildInvestigations } from "@/mocks/investigations";
import { mockMemory } from "@/mocks/memory";
import { mockUser } from "@/mocks/user";
import type {
  Company,
  DecisionRecord,
  EvidenceWithContext,
  InvestigationSummary,
  MemoryEntry,
  User,
} from "@/lib/types";

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
  return buildInvestigations();
}

export async function getInvestigationSummary(id: string): Promise<InvestigationSummary | undefined> {
  return buildInvestigations().find((i) => i.id === id);
}

/** Open investigations, most recently updated first. */
export async function listActiveInvestigations(limit?: number): Promise<InvestigationSummary[]> {
  const active = buildInvestigations()
    .filter((i) => i.status !== "completed")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return limit ? active.slice(0, limit) : active;
}

export async function listRecentDecisions(limit = 4): Promise<DecisionRecord[]> {
  return buildDecisions()
    .sort((a, b) => b.decidedAt.localeCompare(a.decidedAt))
    .slice(0, limit);
}

export async function listRecentEvidence(limit = 4): Promise<EvidenceWithContext[]> {
  const titles = new Map(buildInvestigations().map((i) => [i.id, i.title]));
  return buildEvidence()
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
    .slice(0, limit)
    .map((e) => ({ ...e, investigationTitle: titles.get(e.investigationId) ?? "Investigation" }));
}

export async function listMemoryHighlights(limit = 3): Promise<MemoryEntry[]> {
  return mockMemory.slice(0, limit);
}
