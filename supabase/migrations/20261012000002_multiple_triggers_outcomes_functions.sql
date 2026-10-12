-- Creating investigations and the sample with several triggers and outcomes.

-- ── Creating an investigation, with several triggers and outcomes ───────
-- A new overload; the previous signature is no longer callable.

create or replace function public.create_investigation(
  p_workspace_id uuid,
  p_title text,
  p_problem text,
  p_objective text,
  p_topic text,
  p_triggers text[],
  p_outcomes text[],
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
    workspace_id, title, problem, objective, topic, triggers, outcomes, known_context, attachments, data_source_ids, plan
  )
  values (
    p_workspace_id, btrim(p_title), btrim(p_problem), btrim(coalesce(p_objective, '')), p_topic,
    coalesce(p_triggers, '{}'), coalesce(p_outcomes, '{}'),
    coalesce(p_known_context, ''), coalesce(p_attachments, '{}'), coalesce(p_data_source_ids, '{}'), p_plan
  )
  returning id into inv;

  insert into public.clarifying_questions (investigation_id, workspace_id, position, question, hint, answer)
  select inv, p_workspace_id, (q.ord - 1)::int, q.value ->> 'question', coalesce(q.value ->> 'hint', ''), coalesce(q.value ->> 'answer', '')
  from jsonb_array_elements(coalesce(p_questions, '[]'::jsonb)) with ordinality as q(value, ord);

  return inv;
end;
$$;

revoke execute on function public.create_investigation(uuid, text, text, text, text, text[], text[], text, text[], text[], jsonb, jsonb) from public, anon;
grant execute on function public.create_investigation(uuid, text, text, text, text, text[], text[], text, text[], text[], jsonb, jsonb) to authenticated;

-- The previous overload stays callable until every deployment uses the new one
-- (the production site may still run older code); it now fills the arrays too.
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
language sql
security invoker
set search_path = ''
as $$
  select public.create_investigation(
    p_workspace_id, p_title, p_problem, p_objective, p_topic,
    case when p_trigger is null then '{}'::text[] else array[p_trigger] end,
    case when p_outcome is null then '{}'::text[] else array[p_outcome] end,
    p_known_context, p_attachments, p_data_source_ids, p_plan, p_questions
  );
$$;

-- ── New workspaces' sample, with the array columns ──────────────────────

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
    insert into public.investigations (
      workspace_id, created_by, title, problem, objective, topic, triggers, outcomes, status, confidence, current_stage, is_sample
    )
    values (ws, uid, 'DAU Decline', 'DAU has fallen 40% over the last 8 weeks.',
            'Understand why daily active users fell before deciding what to build.', 'engagement',
            array['metric-changed'], array['understand-change'], 'investigating', 'medium', 'analysis', true);
  else
    update public.workspaces
    set name = btrim(p_name), description = btrim(p_description), industry = p_industry, size = p_size
    where id = ws;
  end if;

  return ws;
end;
$$;
