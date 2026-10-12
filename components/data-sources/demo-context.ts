import type { BusinessContext } from "@/lib/types";

/** True when the team has written their own business context (so switching to the demo's needs their OK). */
export function hasOwnContext(c: BusinessContext): boolean {
  const filled = !!(c.company || c.product || c.businessModel || c.targetCustomers || c.goals.length || c.priorities.length || c.keyMetrics.length);
  return filled && c.company !== "Northwind Home";
}

/** Asks before replacing the team's own business context with the demo company's. */
export function confirmContextSwitch(ownContext: boolean): boolean {
  if (!ownContext) return true;
  return window.confirm(
    "Switch your business context to Northwind Home while you use the demo data? Your own is kept and comes back when you disconnect the demo.\n\nOK to switch, Cancel to keep yours.",
  );
}
