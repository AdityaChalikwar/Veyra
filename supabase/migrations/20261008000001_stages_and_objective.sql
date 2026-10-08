-- Investigation objective, current stage, and a history of stages.
--
-- Stages move forward only because of things that happened (an investigation
-- was created, evidence was added or removed), so the database moves them
-- itself with triggers. People can read stages but can't write them directly.

alter table public.investigations
  add column objective text not null default '' check (length(objective) <= 2000),
  add column current_stage text not null default 'problem_definition' check (current_stage in (
    'problem_definition', 'add_data', 'analysis', 'problem_validation', 'opportunity_discovery'
  ));

create table public.investigation_stages (
  id uuid primary key default gen_random_uuid(),
  investigation_id uuid not null references public.investigations (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  stage text not null check (stage in (
    'problem_definition', 'add_data', 'analysis', 'problem_validation', 'opportunity_discovery'
  )),
  started_at timestamptz not null default now(),
  -- Null while the stage is in progress.
  completed_at timestamptz,
  unique (investigation_id, stage)
);
create index investigation_stages_workspace_idx on public.investigation_stages (workspace_id);

alter table public.investigation_stages enable row level security;
create policy "Stages: members read" on public.investigation_stages
  for select to authenticated using (private.is_workspace_member(workspace_id));
-- No insert/update/delete policies: only the functions below change stages.

-- ── Moving between stages ───────────────────────────────────────────────

create or replace function private.stage_order(s text)
returns int
language sql
immutable
set search_path = ''
as $$
  select array_position(
    array['problem_definition', 'add_data', 'analysis', 'problem_validation', 'opportunity_discovery'], s
  );
$$;

-- Makes `target` the current stage: every earlier stage is marked done, the
-- target is (re)opened, and any later stage is removed.
create or replace function private.set_stage(inv uuid, target text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  ws uuid;
  s text;
begin
  select workspace_id into ws from public.investigations where id = inv;
  if ws is null then return; end if;

  foreach s in array array['problem_definition', 'add_data', 'analysis', 'problem_validation', 'opportunity_discovery'] loop
    if private.stage_order(s) < private.stage_order(target) then
      insert into public.investigation_stages (investigation_id, workspace_id, stage, completed_at)
      values (inv, ws, s, now())
      on conflict (investigation_id, stage) do update
        set completed_at = coalesce(public.investigation_stages.completed_at, now());
    elsif s = target then
      insert into public.investigation_stages (investigation_id, workspace_id, stage)
      values (inv, ws, s)
      on conflict (investigation_id, stage) do update set completed_at = null;
    else
      delete from public.investigation_stages where investigation_id = inv and stage = s;
    end if;
  end loop;

  perform set_config('veyra.stage_change', 'on', true);
  update public.investigations set current_stage = target where id = inv;
  perform set_config('veyra.stage_change', 'off', true);
end;
$$;
revoke execute on function private.set_stage(uuid, text) from public, anon, authenticated;

-- Direct edits can't change the stage or turn an investigation into the sample.
create or replace function private.guard_investigation_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.current_stage is distinct from old.current_stage
     and coalesce(current_setting('veyra.stage_change', true), 'off') <> 'on' then
    new.current_stage := old.current_stage;
  end if;
  new.is_sample := old.is_sample;
  return new;
end;
$$;
create trigger investigations_guard before update on public.investigations
  for each row execute function private.guard_investigation_update();

-- A new investigation has its problem defined; next comes data.
create or replace function private.on_investigation_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not new.is_sample then
    perform private.set_stage(new.id, 'add_data');
  end if;
  return new;
end;
$$;
create trigger investigations_initial_stage after insert on public.investigations
  for each row execute function private.on_investigation_created();

-- First evidence moves the investigation on to analysis; removing the last
-- piece of evidence moves it back to adding data.
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
  elsif tg_op = 'DELETE' and stage = 'analysis'
        and not exists (select 1 from public.evidence e where e.investigation_id = inv) then
    perform private.set_stage(inv, 'add_data');
  end if;
  return null;
end;
$$;
create trigger evidence_moves_stage after insert or delete on public.evidence
  for each row execute function private.on_evidence_changed();

revoke execute on function private.on_investigation_created() from public, anon, authenticated;
revoke execute on function private.on_evidence_changed() from public, anon, authenticated;

-- ── Existing rows ───────────────────────────────────────────────────────

-- The sample's stages are part of its demo content.
select set_config('veyra.stage_change', 'on', true);
update public.investigations set current_stage = 'analysis' where is_sample;
select set_config('veyra.stage_change', 'off', true);

do $$
declare
  r record;
begin
  for r in select i.id, exists (select 1 from public.evidence e where e.investigation_id = i.id) as has_evidence
           from public.investigations i where not i.is_sample loop
    perform private.set_stage(r.id, case when r.has_evidence then 'analysis' else 'add_data' end);
  end loop;
end $$;

-- ── Creating an investigation, now with an objective ────────────────────
-- A new overload; the previous signature is no longer callable.

create or replace function public.create_investigation(
  p_workspace_id uuid,
  p_title text,
  p_problem text,
  p_objective text,
  p_topic text,
  p_trigger text,
  p_outcome text,
  p_known_context text,
  p_attachments text[],
  p_data_source_ids text[],
  p_plan jsonb,
  p_questions jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  inv uuid;
begin
  insert into public.investigations (
    workspace_id, title, problem, objective, topic, trigger, outcome, known_context, attachments, data_source_ids, plan
  )
  values (
    p_workspace_id, btrim(p_title), btrim(p_problem), btrim(coalesce(p_objective, '')), p_topic, p_trigger, p_outcome,
    coalesce(p_known_context, ''), coalesce(p_attachments, '{}'), coalesce(p_data_source_ids, '{}'), p_plan
  )
  returning id into inv;

  insert into public.clarifying_questions (investigation_id, workspace_id, position, question, hint, answer)
  select inv, p_workspace_id, (q.ord - 1)::int, q.value ->> 'question', coalesce(q.value ->> 'hint', ''), coalesce(q.value ->> 'answer', '')
  from jsonb_array_elements(coalesce(p_questions, '[]'::jsonb)) with ordinality as q(value, ord);

  return inv;
end;
$$;

revoke execute on function public.create_investigation(uuid, text, text, text, text, text, text, text, text[], text[], jsonb, jsonb) from public, anon;
grant execute on function public.create_investigation(uuid, text, text, text, text, text, text, text, text[], text[], jsonb, jsonb) to authenticated;
revoke execute on function public.create_investigation(uuid, text, text, text, text, text, text, text[], text[], jsonb, jsonb) from public, anon, authenticated;
