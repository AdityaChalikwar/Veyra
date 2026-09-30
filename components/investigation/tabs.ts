/**
 * Workspace tabs, in discovery order: investigate → understand → decide → learn.
 * `slug` is the URL segment under /investigations/[id]; Overview is the index.
 */
export const WORKSPACE_TABS = [
  { slug: "", label: "Overview" },
  { slug: "evidence", label: "Evidence" },
  { slug: "findings", label: "Findings" },
  { slug: "hypotheses", label: "Hypotheses" },
  { slug: "research", label: "Research Needed" },
  { slug: "customers", label: "Customers & Market" },
  { slug: "problem", label: "Problem" },
  { slug: "opportunities", label: "Opportunities" },
  { slug: "next-step", label: "Next Step" },
  { slug: "validation", label: "Validation" },
  { slug: "notes", label: "Notes" },
] as const;

export type WorkspaceTabSlug = (typeof WORKSPACE_TABS)[number]["slug"];
