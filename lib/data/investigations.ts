/**
 * Starting investigations. Mocked for now: questions and plans come from fixed
 * sets, and every new investigation opens the DAU demo workspace. Replace with
 * the AI planner and backend later — the screens only depend on these signatures.
 */
import { dauPlan, demoDraft, demoQuestions, exampleProblems, genericQuestions, planTemplates } from "@/mocks/new-investigation";
import type { ClarifyingQuestion, InvestigationDraft, InvestigationPlan } from "@/lib/types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** True for the DAU demo problem, however it's phrased. */
export function isDemoProblem(problem: string) {
  const p = problem.toLowerCase();
  return /\bdau\b|daily active/.test(p) && /40\s*%/.test(p);
}

/** Example problems to start from. */
export function listExampleProblems(): string[] {
  return [...exampleProblems];
}

/** Pre-fill for the New Investigation flow. */
export function getDemoDraft(): InvestigationDraft {
  return structuredClone(demoDraft);
}

export function emptyDraft(problem = ""): InvestigationDraft {
  return { problem, trigger: null, outcome: null, knownContext: "", attachments: [], dataSourceIds: [] };
}

export async function generateClarifyingQuestions(draft: InvestigationDraft): Promise<ClarifyingQuestion[]> {
  await delay(900);
  return structuredClone(isDemoProblem(draft.problem) ? demoQuestions : genericQuestions);
}

/** Veyra chooses methods for this problem — and says which it's leaving out. */
export async function planInvestigation(draft: InvestigationDraft): Promise<InvestigationPlan> {
  await delay(1100);
  if (isDemoProblem(draft.problem)) return structuredClone(dauPlan);
  return structuredClone(planTemplates[draft.trigger ?? "other"]);
}

export async function createInvestigation(draft: InvestigationDraft): Promise<{ id: string }> {
  void draft;
  await delay(900);
  return { id: "dau-decline" };
}
