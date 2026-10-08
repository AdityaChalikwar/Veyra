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

## Milestone 4 — AI analysis: built, needs a live check
Built on `claude/eager-albattani-rpn2r4` (see `docs/backend-plan.md`, "AI analysis"). The
migration `20261009000001_analysis_runs.sql` is applied. Not yet done:
- Run it once for real: `ANTHROPIC_API_KEY` was not set in the cloud session that built it, so
  the Claude call itself (including the `server-side-fallback-2026-07-01` beta and
  `output_config.format`) has never run. Pack, citation checking and the schema were tested
  in code; the stage trigger test timed out over the Supabase MCP (rolled back, no leftovers).
- Check the trigger by hand: complete a run and see `current_stage` become `problem_validation`.
- Findings and hypotheses live inside the run's JSON; they are not rows yet.

## Later
- Secondary research with Claude's web search, feedback themes, interview guide, validation,
  Ask Veyra, decision brief, memory.
