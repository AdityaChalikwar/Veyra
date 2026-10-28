-- Milestone 10: the sample investigation is a real one. Its records were captured from a full
-- run of the demo ("App users dropped in September": analysis, two validation runs, web
-- research, the problem, opportunities, the Decision Brief and the decision), and every
-- workspace gets its own copy with fresh ids. The template's data is loaded separately
-- (20261028000003_sample_template_data.sql).

create table private.sample_template (
  id int primary key default 1 check (id = 1),
  -- { "<table>": [rows…] } for every table the investigation's records live in. The workspace
  -- and the person who ran it are placeholders, filled in for each copy.
  data jsonb not null,
  captured_from text not null default '',
  captured_at timestamptz not null default now()
);
revoke all on private.sample_template from public, anon, authenticated;

-- Copies the template into a workspace as its sample, replacing any earlier sample.
create or replace function private.seed_sample(ws uuid, owner uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  src text;
  m record;
  t text;
  inv uuid;
  -- Parents before children.
  tables text[] := array[
    'investigations', 'investigation_stages', 'clarifying_questions', 'files', 'evidence', 'analysis_runs',
    'findings', 'hypotheses', 'open_questions', 'next_steps', 'problem_definitions', 'opportunities',
    'research_tasks', 'validations', 'validation_notes', 'validation_runs', 'evidence_links', 'decisions',
    'decision_briefs', 'chat_messages'
  ];
begin
  select data::text into src from private.sample_template where id = 1;
  if src is null then
    return null;
  end if;
  delete from public.investigations where workspace_id = ws and is_sample;

  -- Every id gets a fresh one, the same everywhere it appears; the placeholders become
  -- this workspace and its owner.
  for m in select distinct x[1] as old from regexp_matches(src, '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', 'g') as x loop
    src := replace(src, m.old, case m.old
      when '00000000-0000-4000-8000-00000000000a' then ws::text
      when '00000000-0000-4000-8000-00000000000b' then coalesce(owner::text, m.old)
      else gen_random_uuid()::text end);
  end loop;
  if owner is null then
    src := replace(src, '"00000000-0000-4000-8000-00000000000b"', 'null');
  end if;

  -- An exact copy: the records are already consistent, so the triggers that move stages,
  -- set statuses and complete investigations stay out of it.
  perform set_config('session_replication_role', 'replica', true);
  foreach t in array tables loop
    execute format('insert into public.%I select * from jsonb_populate_recordset(null::public.%I, $1)', t, t) using (src::jsonb -> t);
  end loop;
  perform set_config('session_replication_role', 'origin', true);

  select i.id into inv from public.investigations i where i.workspace_id = ws and i.is_sample limit 1;
  return inv;
end;
$$;
revoke execute on function private.seed_sample(uuid, uuid) from public, anon, authenticated;

-- New workspaces get the sample at creation.
create or replace function public.save_workspace(
  p_name text,
  p_description text,
  p_industry text,
  p_size text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  ws uuid;
begin
  if uid is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  select m.workspace_id into ws
  from public.workspace_members m
  where m.user_id = uid and m.role = 'owner'
  order by m.created_at
  limit 1;

  if ws is null then
    insert into public.workspaces (name, description, industry, size, created_by)
    values (btrim(p_name), btrim(p_description), p_industry, p_size, uid)
    returning id into ws;
    insert into public.workspace_members (workspace_id, user_id, role) values (ws, uid, 'owner');
    insert into public.business_contexts (workspace_id) values (ws);
    perform private.seed_sample(ws, uid);
  else
    update public.workspaces
    set name = btrim(p_name), description = btrim(p_description), industry = p_industry, size = p_size
    where id = ws;
  end if;

  return ws;
end;
$$;
