-- Veyra runs validations itself. A run plans and locks the test, gathers evidence from every
-- source it can reach, asks for anything important it can't reach (the team adds it or goes
-- ahead without it), runs the tests in code, judges and challenges the verdict, settles the
-- validation, then updates the problem, opportunities and Decision Brief.

create table public.validation_runs (
  id uuid primary key default gen_random_uuid(),
  validation_id uuid not null references public.validations (id) on delete cascade,
  investigation_id uuid not null references public.investigations (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  -- planning → gathering → (needs-input) → testing → judging → settling → follow-through → completed
  phase text not null default 'planning' check (phase in (
    'planning', 'gathering', 'needs-input', 'testing', 'judging', 'settling', 'follow-through', 'completed', 'failed'
  )),
  -- Progress lines shown to the team: [{at, label, detail, state}]
  steps jsonb not null default '[]'::jsonb,
  -- What Veyra designed: data tests, text analyses and web queries, per checklist item.
  design jsonb,
  -- Evidence Veyra couldn't reach: [{id, needId, what, why, how, impact, answer: upload|text|source, status, answerText, evidenceId}]
  requests jsonb not null default '[]'::jsonb,
  -- Results gathered: data tests (computed in code), text analyses, web findings, team answers.
  results jsonb not null default '[]'::jsonb,
  -- {outcome, confidence, reasoning, challenges[], strengthen[]}
  verdict jsonb,
  -- Follow-through done after settling: problem, opportunities, brief.
  follow_through jsonb not null default '{}'::jsonb,
  -- True once the team chose to go ahead without the evidence asked for.
  proceed_without boolean not null default false,
  error text,
  lease_until timestamptz,
  started_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);
create index validation_runs_validation_idx on public.validation_runs (validation_id, created_at desc);
create index validation_runs_investigation_idx on public.validation_runs (investigation_id, created_at desc);

create trigger validation_runs_workspace before insert or update of investigation_id on public.validation_runs
  for each row execute function private.set_row_workspace();
create trigger validation_runs_touch before update on public.validation_runs
  for each row execute function private.touch_updated_at();

alter table public.validation_runs enable row level security;
create policy "Validation runs: members read" on public.validation_runs for select to authenticated using (private.is_workspace_member(workspace_id));
create policy "Validation runs: members create" on public.validation_runs for insert to authenticated with check (
  private.is_workspace_member(workspace_id)
  and exists (select 1 from public.validations v where v.id = validation_id and v.investigation_id = validation_runs.investigation_id)
);
create policy "Validation runs: members update" on public.validation_runs for update to authenticated
  using (private.is_workspace_member(workspace_id)) with check (private.is_workspace_member(workspace_id));
create policy "Validation runs: members delete" on public.validation_runs for delete to authenticated using (private.is_workspace_member(workspace_id));
revoke all on public.validation_runs from anon;
revoke update on public.validation_runs from authenticated;
grant update (phase, steps, design, requests, results, verdict, follow_through, proceed_without, error, lease_until, completed_at) on public.validation_runs to authenticated;

-- Who settled a validation, and how sure; evidence Veyra found itself carries its details.
alter table public.validations
  add column settled_by_kind text not null default 'team' check (settled_by_kind in ('team', 'veyra')),
  add column confidence text check (confidence in ('low', 'medium', 'high'));
grant update (settled_by_kind, confidence) on public.validations to authenticated;

alter table public.validation_notes drop constraint validation_notes_kind_check;
alter table public.validation_notes add constraint validation_notes_kind_check
  check (kind in ('note', 'research-task', 'test-result', 'web', 'text-analysis', 'answer'));
alter table public.validation_notes add column detail jsonb;
alter table public.validation_notes add column run_id uuid references public.validation_runs (id) on delete cascade;

-- A run counts once towards the daily AI limit.
alter table public.ai_usage drop constraint ai_usage_kind_check;
alter table public.ai_usage add constraint ai_usage_kind_check
  check (kind in ('analysis', 'questions', 'problem', 'opportunities', 'validation', 'brief', 'validation-run'));

-- Evidence Veyra gathers can be neutral: checked, and it neither supports nor contradicts.
alter table public.validation_notes drop constraint validation_notes_relation_check;
alter table public.validation_notes add constraint validation_notes_relation_check check (relation in ('supports', 'contradicts', 'neutral'));
