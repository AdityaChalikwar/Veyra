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

## Next: Milestone 4 — AI analysis
- Compute an analysis pack from the stored evidence profiles in code (numbers never come
  from the model).
- One structured-output Claude call (Anthropic TypeScript SDK, zod schema, streaming) that
  returns findings, hypotheses, open questions, a refined problem statement, first
  opportunities and a recommended next step, each citing the evidence it used.
- Feed in the business context, the problem, objective and clarifying answers.
- Handle refusals and cut-off answers; store each run so results survive a refresh; move the
  stage forward with the database (as the existing triggers do).
- Show results with the existing workspace UI components; hide simulated actions.
- Later: secondary research with Claude's web search, feedback themes, interview guide,
  validation, Ask Veyra, decision brief, memory.
