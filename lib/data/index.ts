/**
 * Data access layer.
 *
 * Every screen reads data through these functions — never from `/mocks` directly.
 * To connect the real backend, replace these implementations with API calls;
 * the signatures (and `lib/types.ts`) are the contract the UI depends on.
 */
import { mockBusinessContext, mockCompany } from "@/mocks/company";
import { buildDataSources } from "@/mocks/data-sources";
import { buildDauWorkspace, dauOpenQuestions } from "@/mocks/dau-investigation";
import { buildDecisions } from "@/mocks/decisions";
import { buildEvidence } from "@/mocks/evidence";
import { buildInvestigations } from "@/mocks/investigations";
import { mockMemory, mockStories } from "@/mocks/memory";
import { otherOpenQuestions, otherOpportunities, otherProblems, otherValidations } from "@/mocks/portfolio";
import { mockUser } from "@/mocks/user";
import type {
  BusinessContext,
  BusinessMemory,
  Company,
  Confidence,
  DataSource,
  DecisionRecord,
  EvidenceStrength,
  EvidenceWithContext,
  InvestigationSummary,
  InvestigationWorkspace,
  Level,
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

/** Persistent business context shared by every investigation. */
export async function getBusinessContext(): Promise<BusinessContext> {
  return mockBusinessContext;
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

export async function listDecisions(): Promise<DecisionRecord[]> {
  return buildDecisions().sort((a, b) => b.decidedAt.localeCompare(a.decidedAt));
}

/** Every piece of evidence across investigations, newest first. */
export async function listAllEvidence(): Promise<EvidenceWithContext[]> {
  const titles = new Map(buildInvestigations().map((i) => [i.id, i.title]));
  return buildEvidence()
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
    .map((e) => ({ ...e, investigationTitle: titles.get(e.investigationId) ?? "Investigation" }));
}

export async function listRecentEvidence(limit = 4): Promise<EvidenceWithContext[]> {
  return (await listAllEvidence()).slice(0, limit);
}

export async function listMemoryHighlights(limit = 3): Promise<MemoryEntry[]> {
  return mockMemory.slice(0, limit);
}

export async function getBusinessMemory(): Promise<BusinessMemory> {
  return { entries: mockMemory, stories: mockStories };
}

export async function listDataSources(): Promise<DataSource[]> {
  return buildDataSources();
}

/** Open questions across active investigations. */
export async function listOpenQuestions(): Promise<{ investigationId: string; investigationTitle: string; question: string }[]> {
  return [
    ...dauOpenQuestions.map((q) => ({ investigationId: q.investigationId, investigationTitle: "DAU Decline", question: q.question })),
    ...otherOpenQuestions,
  ];
}

export type ProblemSummary = {
  investigationId: string;
  investigationTitle: string;
  original?: string;
  refined: string;
  status: "draft" | "refined" | "validated";
  confidence: Confidence;
};

/** Problem statements across investigations. */
export async function listProblems(): Promise<ProblemSummary[]> {
  const dau = buildDauWorkspace([]);
  return [
    {
      investigationId: dau.investigation.id,
      investigationTitle: dau.investigation.title,
      original: dau.problem.original,
      refined: dau.problem.refined,
      status: "refined",
      confidence: dau.problem.confidence,
    },
    ...otherProblems,
  ];
}

export type OpportunitySummary = {
  investigationId: string;
  investigationTitle: string;
  title: string;
  evidenceStrength: EvidenceStrength;
  impact: Level;
  confidence: Confidence;
};

export async function listOpportunities(): Promise<OpportunitySummary[]> {
  const dau = buildDauWorkspace([]);
  return [
    ...dau.opportunities.map((o) => ({
      investigationId: dau.investigation.id,
      investigationTitle: dau.investigation.title,
      title: o.title,
      evidenceStrength: o.evidenceStrength,
      impact: o.impact,
      confidence: o.confidence,
    })),
    ...otherOpportunities,
  ];
}

export type ValidationSummary = {
  investigationId: string;
  investigationTitle: string;
  hypothesis: string;
  test: string;
  status: "not-started" | "running" | "completed";
  result?: string;
};

export async function listValidations(): Promise<ValidationSummary[]> {
  const dau = buildDauWorkspace([]);
  return [
    ...dau.validations.map((v) => ({
      investigationId: dau.investigation.id,
      investigationTitle: dau.investigation.title,
      hypothesis: v.belief,
      test: v.test,
      status: v.status,
    })),
    ...otherValidations,
  ];
}

/**
 * Everything the investigation workspace shows. Only the DAU demo has full
 * workspace data in the preview; other investigations return undefined.
 */
export async function getInvestigationWorkspace(id: string): Promise<InvestigationWorkspace | undefined> {
  if (id !== "dau-decline") return undefined;
  return buildDauWorkspace(buildEvidence().filter((e) => e.investigationId === id));
}
