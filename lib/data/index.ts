/**
 * Data access layer.
 *
 * Every screen reads data through these functions — never from `/mocks` directly.
 * To connect the real backend, replace these implementations with API calls;
 * the signatures (and `lib/types.ts`) are the contract the UI depends on.
 */
import { mockCompany } from "@/mocks/company";
import { buildDecisions } from "@/mocks/decisions";
import { buildDauWorkspace } from "@/mocks/dau-investigation";
import { buildEvidence } from "@/mocks/evidence";
import { buildInvestigations } from "@/mocks/investigations";
import { buildDataSources } from "@/mocks/data-sources";
import { mockMemory, mockStories } from "@/mocks/memory";
import { mockUser } from "@/mocks/user";
import type {
  BusinessMemory,
  Company,
  DataSource,
  DecisionRecord,
  EvidenceWithContext,
  InvestigationSummary,
  InvestigationWorkspace,
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

/**
 * Everything the investigation workspace shows. Only the DAU demo has full
 * workspace data in the preview; other investigations return undefined.
 */
export async function getInvestigationWorkspace(id: string): Promise<InvestigationWorkspace | undefined> {
  if (id !== "dau-decline") return undefined;
  return buildDauWorkspace(buildEvidence().filter((e) => e.investigationId === id));
}

export async function listDecisions(): Promise<DecisionRecord[]> {
  return buildDecisions().sort((a, b) => b.decidedAt.localeCompare(a.decidedAt));
}

export async function getBusinessMemory(): Promise<BusinessMemory> {
  return { entries: mockMemory, stories: mockStories };
}

export async function listDataSources(): Promise<DataSource[]> {
  return buildDataSources();
}

/** Every piece of evidence across investigations, newest first. */
export async function listAllEvidence(): Promise<EvidenceWithContext[]> {
  const titles = new Map(buildInvestigations().map((i) => [i.id, i.title]));
  return buildEvidence()
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
    .map((e) => ({ ...e, investigationTitle: titles.get(e.investigationId) ?? "Investigation" }));
}
