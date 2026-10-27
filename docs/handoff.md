# Handoff notes for the next session

Read this, `docs/backend-plan.md` and `README.md` before starting.

## Working rules
- The owner isn't an engineer: explain in plain English; keep answers to questions short.
- Work on branch `claude/eager-albattani-rpn2r4`. Don't open a pull request unless asked.
- Never ask for keys, tokens or passwords in chat. `ANTHROPIC_API_KEY` is set in Vercel
  and in the cloud environment; check it exists without printing it.
- Don't touch the owner's own account or data in Supabase. Create test users for tests and
  delete them (and their workspaces and storage files) afterwards.
- Destructive SQL through the Supabase MCP (DROP, bare DELETE) needs confirmation and times
  out: prefer ALTER/REVOKE; wrap test clean-up deletes in a CTE.

## Infrastructure
- Supabase project `aeqnapbkpswcckxtjmah` (ap-south-1). Migrations in `supabase/migrations/`
  are all applied. Types in `lib/supabase/database.types.ts` are maintained by hand.
- Vercel project `prj_8qk8aquDzHJQ7Qj7nNVZgJefwRBb` deploys every push to the branch.
- Local testing: `npm run build`, then `NODE_USE_ENV_PROXY=1 npx next start -p 3100` (Node
  fetch must use the proxy to reach Supabase). Playwright's browser can't reach Supabase
  directly, so browser tests relay `*.supabase.co` requests through Node fetch with
  `context.route`.

## Done
Milestones 1–3 plus the persistence gaps (objective, current stage, stage history moved by
database triggers, edit details, blank new-investigation form). See `docs/backend-plan.md`.

## Milestone 4 — AI analysis: done
Confirmed working on the Vercel preview with a real Claude call. Real investigations use the
same workspace as the sample, built from saved data (`lib/data/live-workspace.ts`); tabs not
backed by real data yet say "comes next". Findings and hypotheses live inside the run's JSON;
they are not rows yet.

## Milestone 5 — Data onboarding + Demo ERP: built
Connect (Data Sources → Connect Demo ERP) → choose datasets → map fields → check → sync
(`app/(app)/data-sources/`, `components/data-sources/`). Connectors in `lib/connectors/`
(interface + Demo ERP generator), the business model, mapping, validation, normalization and
metrics in `lib/data-layer/`. Snapshots become evidence on an investigation's Evidence tab
("Add from your data"); the analysis pack includes their metrics. Not yet checked with a live
Claude call.

## Milestone 6 — Evidence engine: built
Evidence confidence and source, findings, hypotheses and evidence links as rows; the AI must
cite evidence IDs with supports / contradicts / insufficient. See "Evidence engine" in
`docs/backend-plan.md`. Checked with a simulated analysis (real validation and save code, as a
test user); needs one live Claude run. Next: Milestone 7 (decisions, validation, Decision
Brief), then 8 (Business Memory).

## Milestone 7 — Investigation engine: built
Approach step, open questions, research tasks and next step saved as rows; earlier runs and the
team's research outcomes feed the next run; uploads get weekly trends and breakdowns in code. See
"Investigation engine" in `docs/backend-plan.md`. Test with `docs/samples/dau-daily.csv` and the
problem "Our DAU dropped 40%." Checked with simulated runs; needs one live Claude run.
Next: Milestone 8 (decisions, validation, Decision Brief), then 9 (Business Memory).

## Milestone 8 — Problem definition and opportunity discovery: built
Separate "Define the problem" and "Find opportunities" steps after the analysis, saved as rows with
evidence links. See the section in `docs/backend-plan.md`. Checked with saved records and the code
checks; needs one live Claude run. Next: Milestone 9 (validation, decisions, Decision Brief), then 10
(Business Memory).

## Milestone 9 — Validation, Decision Brief, decisions and Business Memory: built
Validate hypotheses with evidence and a reason (AI drafts the plan and can check the call), carry
validations across analysis runs, gate Pursuing on confirmed hypotheses, a 12-section Decision Brief
with one of seven outcomes (PDF and read-only share link), decisions that complete the investigation,
and structured Business Memory fed back into the AI. See the section in `docs/backend-plan.md`.
Checked end to end on the DAU investigation with simulated AI parts; the four new Claude calls (draft
plan, check call, brief, plus the earlier problem/opportunities) need one live run. Next: Milestone 10
(remaining mocks).

## Veyra runs the validation: built
"Run validation" on a hypothesis: Veyra fixes the plan, finds and tests the evidence itself (data
tests in code, connected sources, text, web), asks once for anything important it can't reach (add
it or go ahead), judges and challenges the verdict, settles it, then updates the problem,
opportunities and brief. See the section in `docs/backend-plan.md`. Checked end to end with the AI
steps simulated (planning, the background chain, needs-input, the data tests on real rows from
storage and the Demo ERP, settling, follow-through, the stalled-run resume); the five Claude calls in
a run need one live check.

## Milestone 10 — The whole flow on real data: in progress
- **Full demo** (dashboard: "Try the full demo"): creates "App users dropped in September" with three
  files (daily activity, support tickets, release notes) and holds back a crash export that Veyra asks
  for during validation. Data kit in `lib/demo/app-drop.ts`; the Demo ERP shows the same drop in app orders.
- New data test "groups compared over the same days" (e.g. crash-free sessions by app version).
- Real data on the remaining screens: Notes (saved, with an Activity timeline), Ask Veyra (Claude,
  answers from the investigation's records, saved), Customers & Market, and the Problems,
  Opportunities, Research and Customers pages. Hypothesis counts fixed.
- Sidebar shows the AI requests left today.
- A clear ending (`lib/investigation/guide.ts`): the bar under the progress steps names the one next
  action; "Ready to decide" once a cause is confirmed or nothing likely is left to test; progress ends
  with a Decision step; a recorded decision completes and locks the investigation (Reopen to carry on).
  The Next Step tab was removed.
- Checked live on production with real AI: analysis → validation (Unclear without the crash export,
  Confirmed with it) → problem redefined → opportunities → brief → decision → completed → reopen.
- Next: run the full demo live on production, then rebuild the sample from a real run and remove mocks.

## Since Milestone 5
- No business details at sign-up; workspace created automatically; context optional.
- One-click demo (`setUpDemo`). Connecting the Demo ERP always switches the business context to
  Northwind Home (own context saved on the source, restored on disconnect), so the AI sees one company.
  The old onboarding "Company profile" card was removed from Business Context.
- Sample investigation rebuilt as "Kitchen Returns Spike" (`mocks/sample-investigation.ts`),
  numbers matching the Demo ERP.
- Daily AI usage limit per person (`AI_DAILY_LIMIT`, default 25).

## Later
- Feedback themes, interview guide.
