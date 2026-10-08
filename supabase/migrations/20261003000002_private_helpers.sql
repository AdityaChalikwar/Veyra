-- Move the membership helpers out of the API-exposed `public` schema.
-- Policies use the `private` copies; the old `public` ones are no longer
-- callable by anyone (they can be dropped in a later clean-up).

create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.is_workspace_member(ws uuid)
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

create or replace function private.is_workspace_owner(ws uuid)
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

revoke execute on function private.is_workspace_member(uuid) from public, anon;
grant execute on function private.is_workspace_member(uuid) to authenticated;
revoke execute on function private.is_workspace_owner(uuid) from public, anon;
grant execute on function private.is_workspace_owner(uuid) to authenticated;

alter policy "Workspaces: members read" on public.workspaces
  using (private.is_workspace_member(id));
alter policy "Workspaces: owners update" on public.workspaces
  using (private.is_workspace_owner(id))
  with check (private.is_workspace_owner(id));
alter policy "Members: members read" on public.workspace_members
  using (private.is_workspace_member(workspace_id));
alter policy "Business context: members read" on public.business_contexts
  using (private.is_workspace_member(workspace_id));
alter policy "Business context: members update" on public.business_contexts
  using (private.is_workspace_member(workspace_id))
  with check (private.is_workspace_member(workspace_id));

revoke execute on function public.is_workspace_member(uuid) from public, anon, authenticated;
revoke execute on function public.is_workspace_owner(uuid) from public, anon, authenticated;

create index if not exists workspaces_created_by_idx on public.workspaces (created_by);
