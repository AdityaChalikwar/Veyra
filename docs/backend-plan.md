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
| Persistence gaps — investigation objective, current stage, stage history, edit details | **Done** (`supabase/migrations/20261008*`) |
| 4. AI analysis pipeline (Claude) — analysis pack in code, one structured Claude call, stored runs, stage moves to Problem validation | **Done** — confirmed with a real call (`supabase/migrations/20261009*`, `lib/analysis/`); real investigations use the full workspace |
| 5. Data onboarding layer + Demo ERP (see "Data onboarding" below) | **Built** (`supabase/migrations/20261013*`, `lib/connectors/`, `lib/data-layer/`); analysis with ERP metrics needs one live check |
| 6. Decisions, validation, Decision Brief | |
| 7. Business Memory, clean-up of mocks | |
| Later. Real connectors (ERP, CRM, analytics, support, finance), scheduled sync | |

Every workspace gets a **sample investigation** (Kitchen Returns Spike at Northwind Home, the Demo ERP's fictional retailer; its numbers match the Demo ERP): a real row, so it can
be listed and removed, whose content is the demo in `/mocks` until evidence and
analysis are stored. Real investigations use the **same workspace** (tabs, progress,
side panel), built only from saved data by `buildLiveWorkspace` (`lib/data/live-workspace.ts`):
uploads become evidence, and the latest completed analysis fills findings, hypotheses, open
questions, the refined problem, opportunities and the next step. Parts not backed by real
data yet (research, customers & market, validation, notes, report, Ask Veyra) say so
instead of showing demo content, and simulated actions are hidden.

Stages: each investigation has a `current_stage` and an `investigation_stages` history
(when each stage started and finished). Only the database moves them, with triggers:
creating an investigation puts it at **Add data**; the first evidence moves it to
**Analysis**; removing the last evidence moves it back. Members can read stages but not
write them, and a direct edit can't change the stage or the sample flag. Triggers and outcomes are multi-select (`triggers`, `outcomes` arrays). Title, problem,
objective, triggers and outcomes can be edited from the workspace header ("Edit details").
The status badge follows the stage. New
investigations start from a blank form.

AI analysis (`lib/analysis/`): `pack.ts` builds the analysis pack from the stored evidence
profiles in code and gives each dataset a reference (E1, E2…). `run.ts` makes one streamed,
structured-output Claude call (`claude-opus-5-5`, override with `ANALYSIS_MODEL`; server-side
refusal fallback on) with the business context, problem, objective and clarifying answers.
The answer must match the zod schema in `schema.ts`: findings, hypotheses, open questions,
a refined problem, first opportunities, a next step and data limits, each citing datasets or
findings by reference. `validate.ts` drops anything citing something that doesn't exist.
Refusals and cut-off answers are stored as their own run statuses and nothing is shown. Each
run is saved in `analysis_runs` (pack, result, usage), and a completed run moves the
investigation from Analysis to Problem validation via a trigger. The server action is
`analyseInvestigation`; `AnalysisSection` (Overview and Evidence tabs) runs it and summarises
the latest result.
Findings are not yet separate rows: they live in the run's `result`, so accepting or editing
them individually comes later.

Uploads: the browser sends the CSV straight to the private `uploads` bucket at
`{workspace_id}/{investigation_id}/{file_id}.csv` (server actions are capped at 1 MB);
the server then downloads it, profiles it with plain code (`profileCsv`: column types,
totals, date range, issues, preview) and stores an `evidence` row with the profile. No AI
touches the numbers. Storage access is limited to members of the folder's workspace.

Architecture: everything server-side runs in the Next.js app (server components, server
actions, `app/auth/callback`). The server acts as the signed-in user, so Row Level
Security applies to every query; no secret key is used. Membership checks live in the
`private` schema so they aren't exposed through the API.

## Getting started (no business details)

Sign-up asks for nothing about the business. On first visit Veyra creates the person's
workspace (`ensureWorkspace` in `lib/auth.ts`, named "<first name>'s workspace") with the
sample investigation. Business context is optional (`/context`), and has its own company name
(`business_contexts.company_name`).

**Try with demo data** (dashboard, Data Sources) runs `setUpDemo`: connect the Demo ERP, select
every dataset, accept the suggested mappings, sync, and open a new investigation into its story.
Connecting the demo switches the business context to Northwind Home (`DEMO_CONTEXT`); if the
team had written their own, they're asked first, and it's kept in the data source's `settings`
and restored on disconnect. The sidebar shows "Demo data: Northwind Home" while it's connected.

**AI usage limit:** each person gets `AI_DAILY_LIMIT` AI calls (analysis and question writing)
per 24 hours, default 25, recorded in `ai_usage` (`lib/ai/usage.ts`).

## Data onboarding (core product direction)

Company systems, ERP first, are a primary evidence source, not a future mock. Data reaches
an investigation through one pipeline whatever its origin:

```
Business onboarding → Data source onboarding → Connection → Dataset selection
→ Schema discovery → Field mapping → Validation → Sync (snapshot)
→ Veyra business data layer → Evidence → Investigation engine
```

**Rule: the investigation engine never knows where data came from.** It reads normalized
evidence (a dataset snapshot's profile, computed metrics and provenance). ERP, CRM, product
analytics, support, finance, CSV and uploaded research all end up in that same shape.

### Pieces

| Piece | What it is |
|---|---|
| Connector (code, `lib/connectors/`) | One module per source type with the same interface: `listDatasets`, `describe` (schema discovery: fields, types, sample), `read` (rows, paged, optionally since a point in time). Built: **Demo ERP**, **CSV upload**. Later: SAP, Oracle, Dynamics, NetSuite, CRM, analytics… added without touching the engine. |
| `data_sources` | A workspace's connected source: type, name, status, settings. Credentials for real connectors are never stored in plain tables (Supabase Vault, server-side only). |
| `source_datasets` | The datasets chosen from a source (e.g. ERP Orders) with the discovered schema. |
| Field mapping (`source_datasets.mapping`) | Veyra field → source field, per dataset. Suggested from field names and descriptions (`suggestMapping`; AI can help later), confirmed by a person. |
| Canonical model (the Veyra business data layer) | A small set of business entities: customers, products, orders (+ lines), inventory, purchases, returns, invoices. Anything that doesn't map (most CSVs) stays a generic table. |
| `sync_runs` | Each import: when, rows read, rows rejected and why (validation), status. |
| `dataset_snapshots` | What a sync produced: a profile (personal fields masked) and standard metrics computed in code from the normalized rows. Rows themselves aren't stored (Demo ERP regenerates them; real sources keep them). Snapshots don't change, so findings stay traceable to the exact data they used. |
| Evidence | Either an uploaded file or a snapshot (`evidence.snapshot_id`), each with its own copy of profile and metrics, so it outlives a disconnected source. Carries provenance: source, dataset, period. The analysis pack treats both the same (`buildPack`). |
| Metrics layer (code) | Standard, pre-defined calculations per entity — orders and revenue by week, return rate by product, stock-outs, customer counts by segment — computed in code from snapshots. The AI reads results; it never writes queries. |

### Demo ERP

A built-in source with realistic, connected data for one fictional company: customers,
products, orders, inventory, purchases, returns, invoices — about a year of history, with
stories in it (e.g. a supplier change followed by a returns spike) so analysis has something
real to find. It goes through every step of the pipeline (selection, discovery, mapping,
validation, sync), so a real connector later is a new module, not a redesign.

### Known risks and decisions

- **Volume and cost.** A real ERP can have millions of rows; the Supabase free tier holds 500 MB.
  Store full rows only for small sources (Demo ERP, CSV); for large ones, sync aggregates and
  keep raw rows in the source.
- **Background work.** Syncs can outlast a web request (Vercel limit ~5 min) and need a server
  identity. Real connectors need a job runner (Supabase Edge Functions + cron, or a queue) and
  a narrowly-scoped service role. Demo ERP and CSV import within a request.
- **Privacy.** ERP data includes personal data (names, emails, addresses). Only aggregates and
  profiles go to the AI; sample rows sent to it are masked. Today the analysis pack includes a
  few raw preview rows from CSVs — now masked by column name (`isPersonalColumn`), and connected
  data is masked by field (`personal` in the canonical model).
- **Mapping is the hard part.** Every ERP names things differently (SAP's VBAK/VBAP for orders).
  The canonical model stays small and the mapping step is where a person confirms meaning.
- **Freshness vs traceability.** Re-syncing creates a new snapshot; analyses keep citing the
  snapshot they used, and the workspace says when newer data exists.
- **Real connectors need each vendor's access** (API credentials, often a paid tier, IT approval)
  — that's why they come after the MVP.

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
| ✅ `suggestQuestions` (`app/(app)/investigations/actions.ts`, `lib/ai/clarify.ts`) | One structured Claude call: first lists what information solving this problem needs (known, partly known, unknown), then asks 5–6 questions about the gaps. Falls back to standard questions if the AI can't be reached. |
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
