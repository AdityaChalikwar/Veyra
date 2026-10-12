-- Veyra — Milestone 4: AI analysis.
-- Each analysis of an investigation's evidence is stored as a run, so results
-- survive a refresh and earlier runs stay on record. The numbers sent to the
-- model (`pack`) are computed in code and saved with the answer (`result`).
-- A finished run moves the investigation from Analysis to Problem validation;
-- like every other stage change, only the database does that.

create table public.analysis_runs (
  id uuid primary key default gen_random_uuid(),
  investigation_id uuid not null references public.investigations (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  status text not null default 'running' check (status in ('running', 'completed', 'failed', 'refused', 'truncated')),
  model text not null,
  -- The evidence profiles as sent to the model (computed in code).
  pack jsonb,
  -- The validated analysis: findings, hypotheses, open questions, refined problem, opportunities, next step.
  result jsonb,
  -- Plain-English reason when status is failed, refused or truncated.
  error text,
  stop_reason text,
  usage jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index analysis_runs_investigation_idx on public.analysis_runs (investigation_id, created_at desc);
create index analysis_runs_workspace_idx on public.analysis_runs (workspace_id);
create index analysis_runs_created_by_idx on public.analysis_runs (created_by);

-- A run always belongs to its investigation's workspace.
create trigger analysis_runs_workspace before insert or update of investigation_id on public.analysis_runs
  for each row execute function private.set_row_workspace();

alter table public.analysis_runs enable row level security;

create policy "Analysis runs: members read" on public.analysis_runs
  for select to authenticated using (private.is_workspace_member(workspace_id));
create policy "Analysis runs: members create" on public.analysis_runs
  for insert to authenticated
  with check (private.is_workspace_member(workspace_id) and created_by = (select auth.uid()));
create policy "Analysis runs: members update" on public.analysis_runs
  for update to authenticated
  using (private.is_workspace_member(workspace_id))
  with check (private.is_workspace_member(workspace_id));
create policy "Analysis runs: members delete" on public.analysis_runs
  for delete to authenticated using (private.is_workspace_member(workspace_id));

-- A finished analysis counts as activity, and moves the investigation on to
-- problem validation (only from Analysis: a re-run later changes nothing).
create or replace function private.on_analysis_completed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  stage text;
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    update public.investigations set updated_at = now() where id = new.investigation_id;
    select current_stage into stage from public.investigations where id = new.investigation_id;
    if stage = 'analysis' then
      perform private.set_stage(new.investigation_id, 'problem_validation');
    end if;
  end if;
  return null;
end;
$$;
revoke execute on function private.on_analysis_completed() from public, anon, authenticated;
create trigger analysis_runs_moves_stage after update of status on public.analysis_runs
  for each row execute function private.on_analysis_completed();

-- Removing the last piece of evidence sends the investigation back to adding
-- data, from Analysis or from Problem validation (the analysis it led to is
-- no longer backed by anything).
create or replace function private.on_evidence_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  inv uuid := coalesce(new.investigation_id, old.investigation_id);
  stage text;
begin
  select current_stage into stage from public.investigations where id = inv;
  if stage is null then return null; end if;
  if tg_op = 'INSERT' and stage = 'add_data' then
    perform private.set_stage(inv, 'analysis');
  elsif tg_op = 'DELETE' and stage in ('analysis', 'problem_validation')
        and not exists (select 1 from public.evidence e where e.investigation_id = inv) then
    perform private.set_stage(inv, 'add_data');
  end if;
  return null;
end;
$$;
