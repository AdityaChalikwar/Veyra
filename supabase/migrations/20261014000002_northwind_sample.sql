-- The sample investigation now follows Northwind Home, the Demo ERP's fictional
-- retailer, so the sample and the demo data tell one story.

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
    values (ws, uid, 'Kitchen Returns Spike', 'Kitchen product returns have roughly tripled since July.',
            'Understand why Kitchen returns rose before deciding what to change.', 'operations',
            array['metric-changed', 'customer-feedback'], array['understand-change'], 'investigating', 'medium', 'analysis', true);
  else
    update public.workspaces
    set name = btrim(p_name), description = btrim(p_description), industry = p_industry, size = p_size
    where id = ws;
  end if;

  return ws;
end;
$$;

update public.investigations
set title = 'Kitchen Returns Spike',
    problem = 'Kitchen product returns have roughly tripled since July.',
    objective = 'Understand why Kitchen returns rose before deciding what to change.',
    topic = 'operations',
    triggers = array['metric-changed', 'customer-feedback'],
    outcomes = array['understand-change']
where is_sample;
