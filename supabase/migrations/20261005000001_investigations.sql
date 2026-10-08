-- Veyra — Milestone 2: investigations.
-- An investigation is the product's core object. This milestone stores what the
-- New Investigation flow collects: the problem, its context, the clarifying
-- questions and answers, and Veyra's plan. Evidence and analysis arrive later.

create table public.investigations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  title text not null check (length(btrim(title)) between 1 and 120),
  problem text not null check (length(btrim(problem)) between 1 and 2000),
  topic text not null default 'engagement' check (topic in (
    'engagement', 'revenue', 'retention', 'market', 'pricing', 'adoption', 'onboarding', 'operations'
  )),
  trigger text check (trigger in (
    'metric-changed', 'customer-feedback', 'stakeholder-request', 'market-opportunity',
    'competitive-pressure', 'product-idea', 'other'
  )),
  outcome text check (outcome in (
    'understand-change', 'identify-customer-problem', 'find-opportunities', 'evaluate-market',
    'validate-idea', 'improve-product', 'decide-what-next', 'other'
  )),
  known_context text not null default '' check (length(known_context) <= 5000),
  attachments text[] not null default '{}',
  data_source_ids text[] not null default '{}',
  -- Veyra's plan: { summary, methods: [...], notUsed: [...] }.
  plan jsonb,
  status text not null default 'planning' check (status in (
    'planning', 'investigating', 'customer-research', 'problem-definition',
    'opportunity-discovery', 'validating', 'completed'
  )),
  confidence text not null default 'low' check (confidence in ('low', 'medium', 'high')),
  -- The read-only demo investigation every workspace starts with.
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index investigations_workspace_updated_idx on public.investigations (workspace_id, updated_at desc);
create index investigations_created_by_idx on public.investigations (created_by);

create table public.clarifying_questions (
  id uuid primary key default gen_random_uuid(),
  investigation_id uuid not null references public.investigations (id) on delete cascade,
  -- Copied from the investigation by a trigger, so policies need no join.
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  position int not null check (position >= 0),
  question text not null check (length(btrim(question)) between 1 and 1000),
  hint text not null default '' check (length(hint) <= 1000),
  -- Empty means unanswered: Veyra treats it as an unknown.
  answer text not null default '' check (length(answer) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (investigation_id, position)
);
create index clarifying_questions_workspace_idx on public.clarifying_questions (workspace_id);

create trigger investigations_updated_at before update on public.investigations
  for each row execute function public.set_updated_at();
create trigger clarifying_questions_updated_at before update on public.clarifying_questions
  for each row execute function public.set_updated_at();

-- A question always belongs to its investigation's workspace.
create or replace function private.set_question_workspace()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select i.workspace_id into new.workspace_id from public.investigations i where i.id = new.investigation_id;
  return new;
end;
$$;
create trigger clarifying_questions_workspace before insert or update of investigation_id on public.clarifying_questions
  for each row execute function private.set_question_workspace();

-- Answering a question counts as activity on the investigation.
create or replace function private.touch_investigation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.investigations set updated_at = now() where id = new.investigation_id;
  return new;
end;
$$;
create trigger clarifying_questions_touch after update of answer on public.clarifying_questions
  for each row execute function private.touch_investigation();

-- ── Row Level Security ───────────────────────────────────────────────────

alter table public.investigations enable row level security;
alter table public.clarifying_questions enable row level security;

create policy "Investigations: members read" on public.investigations
  for select to authenticated using (private.is_workspace_member(workspace_id));
create policy "Investigations: members create" on public.investigations
  for insert to authenticated
  with check (private.is_workspace_member(workspace_id) and created_by = (select auth.uid()) and not is_sample);
create policy "Investigations: members update" on public.investigations
  for update to authenticated
  using (private.is_workspace_member(workspace_id))
  with check (private.is_workspace_member(workspace_id));
create policy "Investigations: members delete" on public.investigations
  for delete to authenticated using (private.is_workspace_member(workspace_id));

create policy "Questions: members read" on public.clarifying_questions
  for select to authenticated using (private.is_workspace_member(workspace_id));
create policy "Questions: members create" on public.clarifying_questions
  for insert to authenticated with check (private.is_workspace_member(workspace_id));
create policy "Questions: members update" on public.clarifying_questions
  for update to authenticated
  using (private.is_workspace_member(workspace_id))
  with check (private.is_workspace_member(workspace_id));
create policy "Questions: members delete" on public.clarifying_questions
  for delete to authenticated using (private.is_workspace_member(workspace_id));

-- ── Create an investigation with its questions in one step ───────────────
-- Runs as the caller, so the policies above decide whether it's allowed.

create or replace function public.create_investigation(
  p_workspace_id uuid,
  p_title text,
  p_problem text,
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
    workspace_id, title, problem, topic, trigger, outcome, known_context, attachments, data_source_ids, plan
  )
  values (
    p_workspace_id, btrim(p_title), btrim(p_problem), p_topic, p_trigger, p_outcome,
    coalesce(p_known_context, ''), coalesce(p_attachments, '{}'), coalesce(p_data_source_ids, '{}'), p_plan
  )
  returning id into inv;

  insert into public.clarifying_questions (investigation_id, workspace_id, position, question, hint, answer)
  select inv, p_workspace_id, (q.ord - 1)::int, q.value ->> 'question', coalesce(q.value ->> 'hint', ''), coalesce(q.value ->> 'answer', '')
  from jsonb_array_elements(coalesce(p_questions, '[]'::jsonb)) with ordinality as q(value, ord);

  return inv;
end;
$$;

revoke execute on function public.create_investigation(uuid, text, text, text, text, text, text, text[], text[], jsonb, jsonb) from public, anon;
grant execute on function public.create_investigation(uuid, text, text, text, text, text, text, text[], text[], jsonb, jsonb) to authenticated;

-- ── Every new workspace starts with the sample investigation ─────────────

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
    insert into public.investigations (workspace_id, created_by, title, problem, topic, trigger, outcome, status, confidence, is_sample)
    values (ws, uid, 'DAU Decline', 'DAU has fallen 40% over the last 8 weeks.', 'engagement',
            'metric-changed', 'understand-change', 'investigating', 'medium', true);
  else
    update public.workspaces
    set name = btrim(p_name), description = btrim(p_description), industry = p_industry, size = p_size
    where id = ws;
  end if;

  return ws;
end;
$$;
