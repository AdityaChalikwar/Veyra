import { validationResults } from "@/mocks/dau-investigation";
import type { ValidationResult } from "@/lib/types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Results of a running validation (interviews, a before/after comparison…).
 * Simulated: the real backend collects these from research tools and analytics.
 */
export async function getValidationResult(validationId: string): Promise<ValidationResult | null> {
  await delay(1800);
  return validationResults[validationId] ?? null;
}
