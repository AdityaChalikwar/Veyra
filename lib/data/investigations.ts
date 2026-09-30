/**
 * Creating investigations. Mocked for now: questions come from a fixed set and
 * every new investigation opens the DAU demo workspace. Replace with the AI
 * service and backend later — the screens only depend on these signatures.
 */
import { demoDraft, demoQuestions, genericQuestions } from "@/mocks/new-investigation";
import type { BusinessContext, ClarifyingQuestion, InvestigationDraft } from "@/lib/types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const normalise = (text: string) => text.trim().toLowerCase().replace(/\s+/g, " ");

export function isDemoProblem(problem: string) {
  return normalise(problem) === normalise(demoDraft.problem);
}

/** Pre-fill for the New Investigation form. */
export function getDemoDraft(): InvestigationDraft {
  return structuredClone(demoDraft);
}

/** Context suggested from the business profile when the user brings their own problem. */
export function suggestContext(companyDescription?: string): BusinessContext {
  return { product: companyDescription ?? "", businessModel: "", timePeriod: "" };
}

export async function generateClarifyingQuestions(draft: InvestigationDraft): Promise<ClarifyingQuestion[]> {
  await delay(900);
  return structuredClone(isDemoProblem(draft.problem) ? demoQuestions : genericQuestions);
}

export async function createInvestigation(
  draft: InvestigationDraft,
  questions: ClarifyingQuestion[],
): Promise<{ id: string }> {
  void draft;
  void questions;
  await delay(800);
  return { id: "dau-decline" };
}
