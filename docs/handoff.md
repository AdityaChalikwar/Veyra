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
Claude call. Next: Milestone 6 (decisions, validation, report), then 7 (memory).

## Since Milestone 5
- No business details at sign-up; workspace created automatically; context optional.
- One-click demo (`setUpDemo`). Connecting the Demo ERP always switches the business context to
  Northwind Home (own context saved on the source, restored on disconnect), so the AI sees one company.
  The old onboarding "Company profile" card was removed from Business Context.
- Sample investigation rebuilt as "Kitchen Returns Spike" (`mocks/sample-investigation.ts`),
  numbers matching the Demo ERP.
- Daily AI usage limit per person (`AI_DAILY_LIMIT`, default 25).

## Later
- Secondary research with Claude's web search, feedback themes, interview guide, validation,
  Ask Veyra, decision brief, memory.
