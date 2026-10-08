-- Veyra — Milestone 3: uploaded data becomes evidence.
-- The browser uploads a CSV straight to a private Storage bucket, the server
-- profiles it with plain code (no AI), and the result is stored as evidence.

-- ── Storage ─────────────────────────────────────────────────────────────
-- Private bucket. Object paths are {workspace_id}/{investigation_id}/{file_id}.csv,
-- so the first folder decides who may read or write the file.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('uploads', 'uploads', false, 20971520, array['text/csv'])
on conflict (id) do nothing;

create or replace function private.is_member_of_folder(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id::text = (storage.foldername(object_name))[1]
      and m.user_id = (select auth.uid())
  );
$$;
revoke execute on function private.is_member_of_folder(text) from public, anon;
grant execute on function private.is_member_of_folder(text) to authenticated;

create policy "Uploads: members read" on storage.objects
  for select to authenticated
  using (bucket_id = 'uploads' and private.is_member_of_folder(name));
create policy "Uploads: members upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'uploads' and private.is_member_of_folder(name));
create policy "Uploads: members delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'uploads' and private.is_member_of_folder(name));

-- ── Files ───────────────────────────────────────────────────────────────

create table public.files (
  id uuid primary key default gen_random_uuid(),
  investigation_id uuid not null references public.investigations (id) on delete cascade,
  -- Copied from the investigation by a trigger.
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  name text not null check (length(btrim(name)) between 1 and 255),
  storage_path text not null unique,
  size_bytes bigint not null check (size_bytes between 1 and 20971520),
  -- uploading → processing → ready, or failed (with a reason people can read).
  status text not null default 'uploading' check (status in ('uploading', 'processing', 'ready', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index files_investigation_idx on public.files (investigation_id);
create index files_workspace_idx on public.files (workspace_id);
create index files_created_by_idx on public.files (created_by);

-- ── Evidence ────────────────────────────────────────────────────────────

create table public.evidence (
  id uuid primary key default gen_random_uuid(),
  investigation_id uuid not null references public.investigations (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  file_id uuid unique references public.files (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  name text not null check (length(btrim(name)) between 1 and 255),
  category text not null default 'company-data' check (category in (
    'company-data', 'customer-evidence', 'uploaded-research', 'public-research', 'notes'
  )),
  source text not null default 'Uploaded CSV',
  format text not null default 'csv' check (format in ('csv', 'xlsx', 'pdf', 'doc', 'link', 'text', 'dataset')),
  -- Period the data covers, e.g. "1 Jun – 28 Sep 2026".
  coverage text,
  -- What the data contains, in words (generated from the profile).
  summary text not null default '',
  -- Column-by-column profile computed in code: see DatasetProfile in lib/types.ts.
  profile jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index evidence_investigation_idx on public.evidence (investigation_id);
create index evidence_workspace_idx on public.evidence (workspace_id);
create index evidence_created_by_idx on public.evidence (created_by);

create trigger files_updated_at before update on public.files
  for each row execute function public.set_updated_at();
create trigger evidence_updated_at before update on public.evidence
  for each row execute function public.set_updated_at();

-- Like clarifying questions, files and evidence always belong to their investigation's workspace.
create or replace function private.set_row_workspace()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select i.workspace_id into new.workspace_id from public.investigations i where i.id = new.investigation_id;
  return new;
end;
$$;
create trigger files_workspace before insert or update of investigation_id on public.files
  for each row execute function private.set_row_workspace();
create trigger evidence_workspace before insert or update of investigation_id on public.evidence
  for each row execute function private.set_row_workspace();

-- New evidence counts as activity on the investigation.
create trigger evidence_touch after insert on public.evidence
  for each row execute function private.touch_investigation();

-- ── Row Level Security ──────────────────────────────────────────────────

alter table public.files enable row level security;
alter table public.evidence enable row level security;

create policy "Files: members read" on public.files
  for select to authenticated using (private.is_workspace_member(workspace_id));
create policy "Files: members create" on public.files
  for insert to authenticated
  with check (private.is_workspace_member(workspace_id) and created_by = (select auth.uid()));
create policy "Files: members update" on public.files
  for update to authenticated
  using (private.is_workspace_member(workspace_id))
  with check (private.is_workspace_member(workspace_id));
create policy "Files: members delete" on public.files
  for delete to authenticated using (private.is_workspace_member(workspace_id));

create policy "Evidence: members read" on public.evidence
  for select to authenticated using (private.is_workspace_member(workspace_id));
create policy "Evidence: members create" on public.evidence
  for insert to authenticated
  with check (private.is_workspace_member(workspace_id) and created_by = (select auth.uid()));
create policy "Evidence: members update" on public.evidence
  for update to authenticated
  using (private.is_workspace_member(workspace_id))
  with check (private.is_workspace_member(workspace_id));
create policy "Evidence: members delete" on public.evidence
  for delete to authenticated using (private.is_workspace_member(workspace_id));
