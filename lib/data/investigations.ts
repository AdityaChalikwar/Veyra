/**
 * Helpers for the New Investigation flow, used in the browser while the draft
 * is being written. Plans come from fixed sets for now; clarifying questions
 * are written by AI (`suggestQuestions`). Saving happens in
 * app/(app)/investigations/actions.ts.
 */
import { dauPlan, exampleProblems, planTemplates } from "@/mocks/new-investigation";
import type { InvestigationDraft, InvestigationPlan } from "@/lib/types";

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

export function emptyDraft(problem = ""): InvestigationDraft {
  return { problem, objective: "", triggers: [], outcomes: [], knownContext: "", attachments: [], dataSourceIds: [] };
}

/** Veyra chooses methods for this problem — and says which it's leaving out. */
export async function planInvestigation(draft: InvestigationDraft): Promise<InvestigationPlan> {
  await delay(1100);
  if (isDemoProblem(draft.problem)) return structuredClone(dauPlan);
  return structuredClone(planTemplates[draft.triggers[0] ?? "other"]);
}
