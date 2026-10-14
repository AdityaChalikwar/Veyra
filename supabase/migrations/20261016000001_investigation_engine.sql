-- Milestone 7: the investigation engine.
--
-- Each analysis run now saves every artifact as rows, alongside its findings and hypotheses:
--   hypotheses.assumptions  what must be true for the hypothesis to hold
--   open_questions          what Veyra doesn't know, why it matters and what evidence is missing
--   research_tasks          what to do to find out: question, method, priority, status.
--                           Tasks belong to the investigation and outlive the run that suggested
--                           them; the team moves their status and records what they found.
--   next_steps              the step the engine chose for this run and why, and the recommended next step

alter table public.hypotheses add column assumptions text[] not null default '{}';

-- ── Open questions ───────────────────────────────────────────────────────

create table public.open_questions (
  id uuid primary key default gen_random_uuid(),
  investigation_id uuid not null references public.investigations (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  analysis_run_id uuid not null references public.analysis_runs (id) on delete cascade,
  ref text not null check (ref ~ '^Q[0-9]{1,3}$'),
  position int not null default 0,
  question text not null check (char_length(question) <= 1000),
  why_it_matters text not null default '',
  missing_evidence text not null default '',
  created_at timestamptz not null default now(),
  unique (analysis_run_id, ref)
);
create index open_questions_investigation_idx on public.open_questions (investigation_id);

-- ── Research tasks ───────────────────────────────────────────────────────

create table public.research_tasks (
  id uuid primary key default gen_random_uuid(),
  investigation_id uuid not null references public.investigations (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  analysis_run_id uuid references public.analysis_runs (id) on delete set null,
  position int not null default 0,
  title text not null check (char_length(title) <= 300),
  question text not null check (char_length(question) <= 1000),
  method text not null check (method in (
    'data-analysis', 'customer-interviews', 'survey', 'feedback-analysis',
    'usability-testing', 'experiment', 'desk-research'
  )),
  method_detail text not null default '',
  priority text not null check (priority in ('high', 'medium', 'low')),
  status text not null default 'not-started' check (status in ('not-started', 'in-progress', 'done', 'dropped')),
  rationale text not null default '',
  -- The open question and hypotheses (by the run's references) it helps answer.
  question_ref text,
  hypothesis_refs text[] not null default '{}',
  -- What the team found, recorded when they finish it.
  outcome text not null default '' check (char_length(outcome) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index research_tasks_investigation_idx on public.research_tasks (investigation_id);

-- ── Next steps ───────────────────────────────────────────────────────────

create table public.next_steps (
  id uuid primary key default gen_random_uuid(),
  investigation_id uuid not null references public.investigations (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  analysis_run_id uuid not null unique references public.analysis_runs (id) on delete cascade,
  -- The step the engine judged right for this run, and how much the evidence could support.
  approach text not null check (approach in ('establish-facts', 'explain-change', 'fill-gaps', 'test-hypotheses')),
  approach_reason text not null default '',
  evidence_sufficiency text not null check (evidence_sufficiency in ('sufficient', 'partial', 'insufficient')),
  type text not null check (type in ('research', 'analysis', 'validation', 'solution-exploration', 'hold')),
  title text not null,
  detail text not null default '',
  why text not null default '',
  why_not_build_yet text not null default '',
  would_change_if text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- workspace_id always comes from the investigation.
create trigger open_questions_workspace before insert or update of investigation_id on public.open_questions
  for each row execute function private.set_row_workspace();
create trigger research_tasks_workspace before insert or update of investigation_id on public.research_tasks
  for each row execute function private.set_row_workspace();
create trigger next_steps_workspace before insert or update of investigation_id on public.next_steps
  for each row execute function private.set_row_workspace();

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger research_tasks_touch before update on public.research_tasks
  for each row execute function private.touch_updated_at();

-- ── Row Level Security ───────────────────────────────────────────────────

alter table public.open_questions enable row level security;
alter table public.research_tasks enable row level security;
alter table public.next_steps enable row level security;

create policy "Open questions: members read" on public.open_questions
  for select to authenticated using (private.is_workspace_member(workspace_id));
create policy "Open questions: members create" on public.open_questions
  for insert to authenticated with check (
    private.is_workspace_member(workspace_id)
    and exists (select 1 from public.analysis_runs r where r.id = analysis_run_id and r.investigation_id = open_questions.investigation_id)
  );
create policy "Open questions: members delete" on public.open_questions
  for delete to authenticated using (private.is_workspace_member(workspace_id));

create policy "Research tasks: members read" on public.research_tasks
  for select to authenticated using (private.is_workspace_member(workspace_id));
create policy "Research tasks: members create" on public.research_tasks
  for insert to authenticated with check (
    private.is_workspace_member(workspace_id)
    and (analysis_run_id is null or exists (select 1 from public.analysis_runs r where r.id = analysis_run_id and r.investigation_id = research_tasks.investigation_id))
  );
create policy "Research tasks: members update" on public.research_tasks
  for update to authenticated using (private.is_workspace_member(workspace_id)) with check (private.is_workspace_member(workspace_id));
create policy "Research tasks: members delete" on public.research_tasks
  for delete to authenticated using (private.is_workspace_member(workspace_id));

create policy "Next steps: members read" on public.next_steps
  for select to authenticated using (private.is_workspace_member(workspace_id));
create policy "Next steps: members create" on public.next_steps
  for insert to authenticated with check (
    private.is_workspace_member(workspace_id)
    and exists (select 1 from public.analysis_runs r where r.id = analysis_run_id and r.investigation_id = next_steps.investigation_id)
  );
create policy "Next steps: members delete" on public.next_steps
  for delete to authenticated using (private.is_workspace_member(workspace_id));

grant select, insert, delete on public.open_questions, public.next_steps to authenticated;
grant select, insert, update, delete on public.research_tasks to authenticated;
-- The team edits a task's progress, never what it is or where it belongs.
revoke update on public.research_tasks from authenticated;
grant update (status, outcome) on public.research_tasks to authenticated;
