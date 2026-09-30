/** Workspace tabs. `slug` is the URL segment under /investigations/[id]; Overview is the index. */
export const WORKSPACE_TABS = [
  { slug: "", label: "Overview" },
  { slug: "questions", label: "Questions" },
  { slug: "evidence", label: "Evidence" },
  { slug: "findings", label: "Findings" },
  { slug: "hypotheses", label: "Hypotheses" },
  { slug: "diagnosis", label: "Diagnosis" },
  { slug: "recommendations", label: "Recommendations" },
  { slug: "action-plan", label: "Action Plan" },
  { slug: "notes", label: "Notes" },
] as const;

export type WorkspaceTabSlug = (typeof WORKSPACE_TABS)[number]["slug"];
