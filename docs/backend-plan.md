# Backend plan

The frontend runs on mock data. Every screen gets its data through `lib/data/`, and
`lib/types.ts` defines the shapes. The backend replaces the bodies of these functions;
the screens shouldn't need to change.

This file tracks what each function will need from the real backend. Keep it updated as
the frontend grows.

Veyra is a product discovery system: it helps product teams understand what problem to
solve before deciding what to build. The backend's job is to store the investigation as
structured records (evidence, findings, hypotheses, research, problem, opportunities,
next step, validation) and to run analysis over company data, not to host a chat.

## Status

| Milestone | State |
|---|---|
| 1. Foundation — Supabase Auth (email + password; Google when enabled), protected pages, profiles, workspaces, membership, business context, RLS | **Done** (`supabase/migrations/20261003*`) |
| 2. Investigations, clarifying questions, plan, sample investigation, password reset | **Done** (`supabase/migrations/20261005*`) |
| 3. CSV upload (private Storage) and profiling in code → evidence | **Done** (`supabase/migrations/20261006*`, `lib/analysis/profile.ts`) |
| 4. AI analysis pipeline (Claude) | Next |
| 5. Decisions, validation, Decision Brief | |
| 6. Business Memory, clean-up of mocks | |

Every workspace gets a **sample investigation** (DAU Decline): a real row, so it can
be listed and removed, whose content is the demo in `/mocks` until evidence and
analysis are stored. Real investigations show a **brief** (problem, context,
clarifying questions with editable answers, plan) until their data is analysed.

Uploads: the browser sends the CSV straight to the private `uploads` bucket at
`{workspace_id}/{investigation_id}/{file_id}.csv` (server actions are capped at 1 MB);
the server then downloads it, profiles it with plain code (`profileCsv`: column types,
totals, date range, issues, preview) and stores an `evidence` row with the profile. No AI
touches the numbers. Storage access is limited to members of the folder's workspace.

Architecture: everything server-side runs in the Next.js app (server components, server
actions, `app/auth/callback`). The server acts as the signed-in user, so Row Level
Security applies to every query; no secret key is used. Membership checks live in the
`private` schema so they aren't exposed through the API.

## Principles the backend must preserve

- **Traceability.** Every finding, hypothesis, problem statement and opportunity
  references the evidence (and other findings) it came from. Store these links; don't
  just generate prose.
- **Kinds stay distinct.** Observation, interpretation, insight, hypothesis and open
  question are different records with a confidence level, not labels on free text.
  Hypotheses also carry an evidence strength and supporting/contradicting evidence ids.
- **Provenance is recorded.** Each evidence item has a category (company data, customer
  evidence, uploaded research, public research, notes), a source, a dataset and a period.
  Public research carries a quality note and is never treated as proof about the business.
- **Problem before solution.** Opportunities and solution ideas hang off a validated
  problem. The recommended next step is often research or validation, not "build X".
- **People approve changes.** Research and new evidence produce *proposals*. The
  investigation changes only when someone accepts one, and the decision is recorded.
- **Nothing is invented.** If the AI can't answer from the investigation's evidence, it
  says so.

## Functions and what they need

| Function (file) | Real implementation |
|---|---|
| ✅ Sign-up, log-in, Google, sign-out (`app/auth/actions.ts`, `app/auth/callback`) | Supabase Auth with cookie sessions (`@supabase/ssr`). |
| ✅ `getCurrentUser`, `getCompany` (`index.ts`, via `lib/auth.ts`); `saveCompany` (`app/onboarding/actions.ts`) | `profiles`, `workspaces`, `workspace_members`; onboarding calls the `save_workspace` database function. |
| ✅ `getBusinessContext` (`index.ts`); `saveBusinessContext` (`app/(app)/context/actions.ts`) | `business_contexts`, editable by workspace members; to be fed into every AI call. |
| `listInvestigations`, `listActiveInvestigations`, `getInvestigationSummary` (`index.ts`) | Investigations table with status (planning → completed), counts of evidence, hypotheses and open questions, and overall confidence. |
| `listOpenQuestions`, `listProblems`, `listOpportunities`, `listValidations` (`index.ts`) | Cross-investigation views over the same records, for the dashboard and the Problems / Opportunities / Validation pages. |
| `listRecentDecisions`, `listDecisions` (`index.ts`) | Decision log with rationale and measured outcome. Accepting a next step or a proposal creates a record. |
| `listRecentEvidence`, `listAllEvidence` (`index.ts`) | Evidence table joined to investigation titles, grouped by category. |
| `listMemoryHighlights`, `getBusinessMemory` (`index.ts`) | Memory entries (validated problems, rejected hypotheses, experiments, learnings…) plus "problem → decision → experiment → result → learning" stories, written when investigations close. |
| `listDataSources` (`index.ts`) | Connector registry grouped as company systems (analytics, ERP, CRM, sales, docs, finance), customer evidence (support, feedback, surveys, research) and external. Sync status and headline metrics per source. |
| `getInvestigationWorkspace` (`index.ts`) | Aggregates an investigation's stages, plan, KPIs, charts, map, evidence, findings, open questions, hypotheses, research tasks, customer understanding, market context, problem statement, opportunities, next step, validations, related memory, conversation and proposals. Likely several endpoints. |
| `generateClarifyingQuestions` (`investigations.ts`) | AI call using the problem, trigger, outcome, known context, selected data sources and business context. Questions should reference what the data already shows (e.g. a release date). |
| `planInvestigation` (`investigations.ts`) | Chooses methods for this problem and explains which frameworks it *won't* use and why. Adaptive, not a fixed checklist. |
| `createInvestigation` (`investigations.ts`) | Persist the draft, answers and plan; start the first analyses on connected data. |
| `runResearchTask` (`research.ts`) | Run an analysis task against connected data (e.g. activation by channel, before/after a release) or a public-research scan. Returns new evidence, a finding, answered questions and proposals. Asynchronous. |
| `analyseExistingFeedback` (`research.ts`) | Cluster support tickets and feedback into themes with counts and quotes; return an insight and proposals. |
| `getInterviewGuide` (`research.ts`) | Generate an interview guide from the open questions and active hypotheses. |
| `getValidationResult` (`validation.ts`) | Collect a running validation's results (interview notes, a before/after analysis) and say whether the success signal was met. The team records the verdict: confirming a hypothesis validates the problem and opens opportunity discovery; the result is stored as a finding and answers its open questions. |
| Discovery progress (`deriveProgress` in `WorkspaceFrame`) | Today worked out in the browser from what the team did. The backend should store stage changes and the opportunity choice, so progress and the report survive a refresh. |
| Investigation report (Report tab) | Built from the investigation's records. Today "Download PDF" uses the browser's print-to-PDF; a server-rendered PDF can come later for sharing by link or email. |
| `analyseEvidence` (`evidence.ts`) | Upload to storage, parse (CSV/Excel/PDF/links), run AI analysis against the investigation, return a summary and proposals. |
| `reviewProposal` (`evidence.ts`) | Record accept/dismiss and apply accepted changes (link evidence to a finding, support or contradict a hypothesis). |
| Workspace next step, validation, notes (`getInvestigationWorkspace`) | Replaces the old recommendations / action plan. Next step with type, reasoning, "why not build yet", what would change it and alternatives; validation plans per hypothesis with method, success signal and status. Needs write endpoints for accepting the next step, starting a validation and adding notes. |
| `askVeyra` (`assistant.ts`) | AI chat grounded in the investigation's records; replies carry `refs` to the artifacts they discuss. Store the conversation. |

## Still local-only in the preview

- Evidence added, research results, feedback themes, proposals and chat messages live in browser memory and reset on refresh.
- Accepted next steps, validation results and verdicts, the chosen opportunity and notes inside the workspace aren't saved.
- Only the DAU Decline investigation has full workspace data. Other problems get a generic plan based on their trigger.
