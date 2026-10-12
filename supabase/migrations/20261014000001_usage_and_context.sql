-- AI usage, for a daily limit per person; and a company name in the business
-- context (it no longer has to be the workspace's name, so the Demo ERP can
-- describe its fictional company).

create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  kind text not null check (kind in ('analysis', 'questions')),
  created_at timestamptz not null default now()
);
create index ai_usage_user_time_idx on public.ai_usage (user_id, created_at desc);
create index ai_usage_workspace_idx on public.ai_usage (workspace_id);

alter table public.ai_usage enable row level security;
-- People see and record only their own usage; nobody can edit or delete it.
create policy "AI usage: own rows read" on public.ai_usage
  for select to authenticated using (user_id = (select auth.uid()));
create policy "AI usage: own rows create" on public.ai_usage
  for insert to authenticated
  with check (user_id = (select auth.uid()) and private.is_workspace_member(workspace_id));

alter table public.business_contexts
  add column company_name text not null default '' check (length(company_name) <= 120);
