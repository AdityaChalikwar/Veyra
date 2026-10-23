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
| 6. Evidence engine — evidence confidence and source, findings, hypotheses and evidence links as rows; every finding cites evidence IDs | **Built** (`supabase/migrations/20261015*`, `lib/analysis/structure.ts`, `save.ts`, `confidence.ts`); checked with a simulated run, needs one live Claude check |
| 7. Investigation engine — the engine picks a step, saves open questions, research tasks and the next step as rows, reads earlier runs and research outcomes; uploads get trends worked out in code | **Built** (`supabase/migrations/20261016*`, `lib/analysis/`); checked with simulated runs, needs one live Claude check |
| 8. Problem definition and opportunity discovery — separate steps after the analysis, saved as rows with evidence links; problem never a solution, opportunities never features | **Built** (`supabase/migrations/20261020*`, `lib/analysis/discovery.ts`); checked with saved records, needs one live Claude check |
| 9. Validation, Decision Brief, decisions and Business Memory — hypotheses settled with evidence and a reason, a 12-section brief with one of seven outcomes, PDF and share link, decisions that complete the investigation, structured memory fed back into the AI | **Built** (`supabase/migrations/20261023*`, `lib/analysis/validation.ts`, `lib/brief/`, `lib/data/memory.ts`); checked with saved records and a simulated brief, needs one live Claude check |
| 10. Clean-up of remaining mocks (sample investigation, org pages for problems and opportunities) | |
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

## Evidence engine (Milestone 6)

Every conclusion traces back to evidence rows.

- **Evidence** (`evidence`): source (`source_kind` upload / connector / research / manual, and
  `data_source_id` for connected systems — `data_sources` is the sources table, so CRM or
  analytics connectors slot in the same way), type (`category`: company data, customer evidence,
  uploaded research, public research), title, summary, profile and metrics, `metadata`, and a
  `confidence` worked out in code (`lib/analysis/confidence.ts`: rows, period, missing values,
  issues; the reason is kept in `metadata.confidenceReason`).
- **Findings** (`findings`) and **hypotheses** (`hypotheses`): one row each per analysis run,
  with the run's reference (F1, H1). A finding stores what was `observed` (measure, values,
  period); a hypothesis stores `evidence_status` (supported / contradicted / mixed /
  insufficient), worked out in code from what supports and contradicts it.
- **Evidence links** (`evidence_links`): finding or hypothesis → evidence item, with `relation`
  (supports / contradicts / insufficient) and `shows` (what that evidence shows for it). RLS only
  allows links within one investigation.

The model must cite datasets by reference with a relation and what each shows (the prompt
forbids "based on the data"). `validate.ts` removes citations of datasets that don't exist,
drops findings no dataset supports, and drops observed values whose numbers aren't in the
evidence pack. `save.ts` writes the rows after a completed run (all or nothing); the
workspace reads them, and falls back to the run's JSON for runs saved before Milestone 6.
On screen: finding cards show evidence, dataset and period, observed values, evidence
confidence and "View evidence"; the finding drawer lists every cited item with its relation;
hypotheses show supporting, contradicting and "can't tell yet" evidence; the evidence viewer
shows its confidence and every finding and hypothesis that cites it.

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

## Investigation engine (Milestone 7)

One structured Claude call per run (`lib/analysis/run.ts`), no chat and no agents. Input: business
context, problem, objective, triggers and outcomes, clarifying answers, the evidence pack (profiles,
evidence confidence, and metrics worked out in code), and `<previous_investigation>`: the latest
finished run's findings, hypotheses and open questions plus every research task with its status and
the team's recorded outcome (`lib/analysis/previous.ts`).

The model first picks an **approach** — establish-facts, explain-change, fill-gaps or
test-hypotheses — and rates evidence sufficiency, then fills only what that step supports.
Output (`schema.ts`): findings (observation / interpretation / insight), hypotheses with
assumptions and a validation requirement, open questions (Q1… with why it matters and the missing
evidence), research tasks (question, method, detail, priority), the refined problem, opportunities
and a next step. `validate.ts` cleans references; `save.ts` writes every artifact as rows, all or
nothing:

- `open_questions` and `next_steps` (with the approach) belong to the run.
- `research_tasks` belong to the investigation and outlive the run; a later run doesn't add a task
  with the same title. Members may only change a task's `status` and `outcome` (column grants).

Uploaded CSVs with a date column get **metrics** at upload (`lib/analysis/csv-metrics.ts`): each
numeric column by week (or month for long ranges) as a daily average, and the main measure broken
down by small category columns (e.g. platform, app version). They are stored on the evidence like a
connected source's metrics, shown on the upload card, and given to the model.

Screens: Research Needed lists the tasks (update status and "what you found") and the open
questions with missing evidence; the approach shows there, on Next Step and under the analysis
summary; hypotheses show assumptions and the validation requirement.

Test file: `docs/samples/dau-daily.csv` — daily DAU by platform and app version, Jul–Sep 2026;
total DAU falls about 37% after Android 5.2.0 ships on 8 Sep.

## Readable overview (after Milestone 7)

The analysis runs in **two structured calls** (`lib/analysis/run.ts`): one schema with every
artifact compiled to a grammar the API rejected as too large. Step 1 (effort high) picks the
approach and writes findings and hypotheses; step 2 (effort medium) gets step 1, after its citations
are checked, and writes open questions, research tasks, the refined problem, opportunities and the
next step. Failed runs keep the API's status, request id and message in `analysis_runs.usage.apiError`.

Findings and hypotheses carry a short `title` (cards) besides the statement (side panel). A real
investigation's overview shows, once analysed: headline cards built in code from the findings'
observed values (`lib/analysis/kpis.ts` works out "−37%", "×2.8" or "+5.7 pts" from "A → B"), a
two-sentence summary, and up to two trend charts drawn from the evidence's worked-out metrics
(`lib/analysis/charts.ts`: time-based metrics from cited evidence, closest to what the findings
measured; one axis per chart, at most four lines, each with a table view).

## Problem definition and opportunity discovery (Milestone 8)

Flow: Findings → Hypotheses → Problem → Opportunities (the tabs follow this order). The analysis
no longer writes a refined problem or opportunities, and can't recommend exploring solutions.

- **Problem tab → "Define the problem"** (`defineInvestigationProblem`): one structured Claude call
  (`lib/analysis/discovery.ts`) reading the business context, original problem, objective, the latest
  analysis's findings, hypotheses and open questions, and its evidence pack. Saved in
  `problem_definitions`: statement, affected, need (job), obstacle, business impact, confidence and
  reason, unresolved assumptions, finding and hypothesis refs, and evidence links. The newest one is
  current; it is flagged out of date when a newer analysis exists.
- **Opportunities tab → "Find opportunities"** (`findInvestigationOpportunities`): needs a problem
  definition. Two to four rows in `opportunities`: title, customer problem, potential impact and
  level, confidence, assumptions, validation needs, finding refs, evidence links and a status (open /
  pursuing / parked) — the only column members may change. Finding them again replaces the set.
  The first opportunity moves the investigation to Opportunity discovery (trigger).
- **Checks in code:** a problem statement that starts like a solution ("Redesign…", "Build…") is
  retried once, then refused; an opportunity titled like a feature ("Fix…", "Add…") triggers one
  retry and is otherwise left out; references to findings, hypotheses or datasets that don't exist
  are removed. Both calls count towards the daily AI limit (`ai_usage.kind` problem / opportunities).
- `evidence_links` now points at exactly one of: finding, hypothesis, problem definition, opportunity.
- Solution directions stay locked; they come with a later milestone, for opportunities being pursued.
- **Facts before causes.** Hypotheses aren't validated yet, so the problem rests on findings only.
  `problem_definitions.cause_status` is `open` until a hypothesis is confirmed: the statement may not
  assert a cause ("because", "due to"… triggers one retry, then a refusal), the obstacle is written in
  code as "Not yet known. Possible explanations, none validated yet: H1 — …", confidence is capped at
  medium, and the screen marks the definition Provisional. Opportunities must hold whatever the cause
  turns out to be: one that assumes an open hypothesis (`opportunities.depends_on`) is retried, then
  left out. Once Milestone 9 validates a hypothesis, defining the problem again fills in the cause.


## Validation, Decision Brief, decisions and Business Memory (Milestone 9)

Flow: Hypotheses → **Validation** → (problem defined again with the cause) → **Decision Brief** →
**decision**, which completes the investigation. Everything the team settles or decides goes into
Business Memory, which every later analysis, problem definition and brief reads.

**Validation** (`validations`, `validation_notes`; actions in `app/(app)/investigations/validation-actions.ts`)
- One validation per hypothesis: method, test, "confirmed if", "rejected if", and an **evidence
  needed** checklist (`validations.evidence_needed`, up to 6 items: what to collect, where from —
  your data, interviews, survey, support tickets, experiment, desk research — and how much is
  enough; `lib/analysis/evidence-needs.ts`). Veyra drafts it on request (`draftValidationPlan`, one
  Claude call, `ai_usage.kind` validation) or the team writes it.
- Each piece of evidence can say which checklist item it covers (`need_id` on `validation_notes` and
  `evidence_links`); the card shows "2 of 3 collected", settling warns about what's missing (it
  doesn't block), and the AI check and the Decision Brief see the coverage.
- Evidence for or against: a note, a finished research task's outcome, or a dataset in the
  investigation (`evidence_links.validation_id`). Adding evidence moves it to in progress.
- Settling (confirmed / rejected / unclear) needs a reason and at least one piece of evidence — the
  database refuses otherwise (`private.guard_validation_settle`). "Ask Veyra to check my call"
  (`checkValidationCall`) gives advice only; nothing is saved. Reopening clears the outcome.
- The hypothesis's status follows its validation (triggers); members can only link a hypothesis to a
  validation (`hypotheses.validation_id`), never set its status or rewrite what was validated.
- **Carry-over:** when a new analysis states a validated hypothesis again (same headline, or mostly the
  same words — `lib/analysis/carry-over.ts`), the new row is linked to the same validation and keeps its
  status. The analysis prompt lists settled hypotheses: confirmed ones stay, rejected ones aren't
  proposed again. Settled hypotheses a later run didn't restate still count, as V1, V2…
- A confirmed hypothesis shows "Define again" on the Problem tab: the new definition is no longer
  provisional and may name the cause.
- **Pursuing gate:** an opportunity can be set to Pursuing only when every hypothesis it depends on
  (`depends_on`) is confirmed (`setOpportunityStatus`).

**Decision Brief** (`decision_briefs`; `lib/brief/build.ts`, `lib/brief/generate.ts`; Decision Brief tab)
- Twelve sections: executive summary, what we found, what we believe, evidence, confidence, what we
  don't know, problem to solve, opportunity, possible solution directions, recommended next step,
  validation plan, decision status. Most are assembled in code from the records; one Claude call
  (`ai_usage.kind` brief) writes the summary, beliefs, confidence, recommendation, solution directions,
  next validations and lessons.
- The recommendation is one of seven outcomes: solution exploration, more customer research, validate
  a hypothesis, investigate further, no product intervention, escalate to another function, prioritise
  an opportunity. Code checks it: solution exploration (and any solution directions) only when a
  hypothesis about the cause is confirmed and an opportunity is being pursued — otherwise it becomes
  "validate a hypothesis" or "customer research", with the reason shown; confidence is capped at
  medium without a confirmed cause and at low when all data is weak.
- Saved as a snapshot (`content`, not editable); rewriting adds a new one. PDF via the browser's print
  (only the brief prints). Share: a random token (`share_token`) makes `/brief/<token>` readable by
  anyone with the link through `get_shared_brief` (the brief and the decision taken, nothing else);
  "Stop sharing" removes the token.
- "Start next step": research outcomes create a research task; validate → Validation tab; prioritise /
  solution exploration → Opportunities; no intervention / escalate → the decision form.

**Decisions** (`decisions`; `app/(app)/investigations/decision-actions.ts`)
- Outcome (the seven), one-line summary, rationale, opportunity, escalate-to, options rejected, risks,
  owner, success measure, review date. Prefilled from the brief's recommendation.
- Warnings are worked out in code, not by the person deciding: no validated cause, an opportunity
  resting on unconfirmed hypotheses, a provisional problem, only weak data, unfinished high-priority
  research. The decision is saved with them ("decided despite").
- Recording a decision completes the investigation (trigger). "What happened" is recorded later, on
  the brief or the Decision Log.

**Business Memory** (`memory_entries`; `lib/data/memory.ts`; Business Memory page)
- Structured rows, no vector search. Written automatically: confirmed → validated problem, rejected →
  rejected hypothesis (hidden again if reopened), finished research → customer insight or experiment,
  decision → decision, its result → outcome. Lessons are proposed by the brief and saved by the team.
- Members can hide an entry ("Remove from memory"); hidden entries stop informing the AI.
- The 20 newest entries from other investigations are passed to the analysis and problem/opportunity
  steps (`<business_memory>`), and 10 to the brief, as information, never as data to quote.
- The Decision Log, Validation and Business Memory pages now read these tables (the sample's demo
  entries are listed after them).

## Veyra runs the validation (after Milestone 9)

The team chooses which hypothesis to test and presses **Run validation**; Veyra does the rest
(`lib/validation-run/`, `app/(app)/investigations/run-actions.ts`, table `validation_runs`).

Phases, one per request, each under a lease so a run never runs twice at once (`engine.ts`):
1. **Planning** — any part of the plan the team didn't write (test, confirm-if, reject-if, evidence
   checklist) is drafted, then the plan is **fixed in the run before any result is seen**.
2. **Gathering** — two Claude calls design the work against the datasets' profiles: data tests
   (with exact columns), free text to read, web searches, synced datasets from connected sources to
   add (Veyra adds them to the investigation), and the important evidence nothing can reach.
3. **Needs input** (only if something important is out of reach, asked once) — each request says
   what, why, where to find it, and how much it would change the verdict. The team uploads it,
   connects it, types a few words, or goes ahead without it. New data → the tests are designed again.
4. **Testing** — data tests run **in code** on the real rows (`tests.ts`, `stats.ts`): before/after a
   date, change by group, share compared, two measures together, category mix shift — with Welch's
   t-test, two-proportion z-test, Pearson correlation and chi-square p-values. Rows are read again
   from private storage (uploads) or from the connector with the confirmed mapping (`data.ts`).
   Free text is labelled by Claude and counted in code (examples quoted verbatim). Web search uses
   Claude's `web_search_20260209` tool; only URLs that came back from a search are kept.
5. **Judging** — Claude judges against the fixed plan, then a second call tries to disprove the
   verdict. Code then caps it: medium at most without a data test, with important evidence skipped,
   or without the challenge; "confirmed" needs a supporting result and "rejected" a contradicting one,
   otherwise it becomes unclear.
6. **Settling** — results become evidence notes (`validation_notes.kind` test-result / text-analysis /
   web / answer, `relation` may be neutral, `run_id` set), the validation is settled with
   `settled_by_kind = veyra` and a confidence, and Business Memory is updated.
7. **Follow-through** — redefine the problem (if one exists or the cause was confirmed), refresh the
   opportunities (only when confirmed and none is being pursued, so the team's choice is kept), and
   rewrite the Decision Brief.

Background: each phase is done in `after()` by `POST /api/validation-runs/[id]/advance` (signed-in
user's cookies, 401 otherwise), which then calls itself for the next phase — the run carries on with
the page closed. If that chain is blocked (e.g. deployment protection on previews), an open
Validation tab resumes a run that hasn't moved for 45 seconds (`resumeRun`).

The team stays in charge: **Make this stronger** lists what was skipped or would help; adding it and
**Run again with this** starts a new run with the answers carried over. The manual plan, own
evidence and own call stay available as **Override**. A run counts once towards the daily AI limit
(`ai_usage.kind` validation-run). The Validation tab marks the suggested next hypothesis (one an
opportunity depends on, then the most confident).
