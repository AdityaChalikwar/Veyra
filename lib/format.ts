/** Relative change as a signed percentage, e.g. -0.61 → "−61%". */
export const formatChange = (change: number) => `${change > 0 ? "+" : "−"}${Math.round(Math.abs(change) * 100)}%`;
