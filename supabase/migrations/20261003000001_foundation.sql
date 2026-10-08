-- Veyra — Milestone 1: foundation.
-- Profiles, workspaces (= organisations), membership and business context,
-- with Row Level Security on every table. A workspace is created by the
-- onboarding flow through `save_workspace`; nothing else writes membership.

-- ── Helpers ──────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ── Tables ───────────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 120),
  description text not null default '' check (length(description) <= 500),
  industry text not null check (industry in (
    'Technology', 'Consumer', 'Financial Services', 'Healthcare',
    'Manufacturing', 'Professional Services', 'Other'
  )),
  size text not null check (size in ('1–10', '11–50', '51–200', '201–500', '500+')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type public.workspace_role as enum ('owner', 'member');

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.workspace_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index workspace_members_user_id_idx on public.workspace_members (user_id);

-- Persistent context every investigation draws on. One per workspace.
create table public.business_contexts (
  workspace_id uuid primary key references public.workspaces (id) on delete cascade,
  product text not null default '',
  business_model text not null default '',
  target_customers text not null default '',
  goals text[] not null default '{}',
  priorities text[] not null default '{}',
  key_metrics text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger workspaces_updated_at before update on public.workspaces
  for each row execute function public.set_updated_at();
create trigger business_contexts_updated_at before update on public.business_contexts
  for each row execute function public.set_updated_at();

-- ── Membership checks used by every policy ──────────────────────────────
-- SECURITY DEFINER so policies on workspace_members don't recurse into themselves.

create or replace function public.is_workspace_member(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_workspace_owner(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws and m.user_id = (select auth.uid()) and m.role = 'owner'
  );
$$;

-- ── New users get a profile ──────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Onboarding: create or update the caller's workspace ──────────────────
-- Creates the workspace, the owner membership and an empty business context
-- in one transaction. Re-running onboarding updates the same workspace.

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
  else
    update public.workspaces
    set name = btrim(p_name), description = btrim(p_description), industry = p_industry, size = p_size
    where id = ws;
  end if;

  return ws;
end;
$$;

-- Only signed-in users may call these; nobody calls the trigger function directly.
revoke execute on function public.save_workspace(text, text, text, text) from public, anon;
grant execute on function public.save_workspace(text, text, text, text) to authenticated;
revoke execute on function public.is_workspace_member(uuid) from public, anon;
grant execute on function public.is_workspace_member(uuid) to authenticated;
revoke execute on function public.is_workspace_owner(uuid) from public, anon;
grant execute on function public.is_workspace_owner(uuid) to authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ── Row Level Security ───────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.business_contexts enable row level security;

-- Profiles: you see and edit your own, and see people in your workspaces.
create policy "Profiles: read own or co-members" on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or exists (
      select 1 from public.workspace_members mine
      join public.workspace_members theirs on theirs.workspace_id = mine.workspace_id
      where mine.user_id = (select auth.uid()) and theirs.user_id = profiles.id
    )
  );
create policy "Profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Workspaces: members read; owners update. Creation goes through save_workspace.
create policy "Workspaces: members read" on public.workspaces
  for select to authenticated
  using (public.is_workspace_member(id));
create policy "Workspaces: owners update" on public.workspaces
  for update to authenticated
  using (public.is_workspace_owner(id))
  with check (public.is_workspace_owner(id));

-- Membership: members can see who else is in their workspace. Changes go through functions.
create policy "Members: members read" on public.workspace_members
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

-- Business context: members read and update.
create policy "Business context: members read" on public.business_contexts
  for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy "Business context: members update" on public.business_contexts
  for update to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
