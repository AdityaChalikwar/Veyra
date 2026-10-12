-- Veyra — Milestone 5: data onboarding.
-- A workspace connects data sources (Demo ERP today; real ERPs, CRMs and
-- analytics later), chooses datasets, confirms how their fields map onto
-- Veyra's business model, and syncs them. Each sync produces snapshots that
-- never change: a profile and metrics computed in code. Investigations take
-- snapshots as evidence, so the analysis never depends on where data came from.

create table public.data_sources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  kind text not null check (kind in ('erp', 'crm', 'analytics', 'support', 'finance', 'csv', 'research')),
  -- Which connector module reads it (lib/connectors), e.g. 'demo-erp'.
  connector text not null check (length(connector) between 1 and 60),
  name text not null check (length(btrim(name)) between 1 and 120),
  status text not null default 'connected' check (status in ('connected', 'error')),
  -- Non-secret settings only. Credentials for real connectors go in Supabase Vault.
  settings jsonb not null default '{}',
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index data_sources_workspace_idx on public.data_sources (workspace_id);
create index data_sources_created_by_idx on public.data_sources (created_by);
-- One Demo ERP per workspace.
create unique index data_sources_one_demo_erp on public.data_sources (workspace_id) where connector = 'demo-erp';

create table public.source_datasets (
  id uuid primary key default gen_random_uuid(),
  data_source_id uuid not null references public.data_sources (id) on delete cascade,
  -- Copied from the data source by a trigger.
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  key text not null check (length(key) between 1 and 120),
  name text not null,
  description text not null default '',
  approx_rows integer not null default 0,
  selected boolean not null default false,
  -- The Veyra entity this dataset holds; null until chosen.
  entity text check (entity in ('customers', 'products', 'orders', 'inventory', 'purchases', 'returns', 'invoices')),
  -- Schema discovery: fields and a few sample rows as the source returned them.
  schema jsonb,
  -- Veyra field → source field (or null).
  mapping jsonb not null default '{}',
  mapping_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (data_source_id, key)
);
create index source_datasets_workspace_idx on public.source_datasets (workspace_id);

create table public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  data_source_id uuid not null references public.data_sources (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  status text not null default 'running' check (status in ('running', 'completed', 'failed')),
  rows_read integer not null default 0,
  rows_rejected integer not null default 0,
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
create index sync_runs_source_idx on public.sync_runs (data_source_id, started_at desc);
create index sync_runs_workspace_idx on public.sync_runs (workspace_id);
create index sync_runs_created_by_idx on public.sync_runs (created_by);

create table public.dataset_snapshots (
  id uuid primary key default gen_random_uuid(),
  data_source_id uuid not null references public.data_sources (id) on delete cascade,
  source_dataset_id uuid not null references public.source_datasets (id) on delete cascade,
  sync_run_id uuid not null references public.sync_runs (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  entity text not null,
  name text not null,
  -- Where it came from, for provenance: e.g. "Demo ERP".
  source_name text not null,
  row_count integer not null,
  rejected_count integer not null default 0,
  coverage text,
  summary text not null default '',
  -- DatasetProfile under Veyra's field names, personal fields masked.
  profile jsonb not null,
  -- Metrics computed in code (lib/data-layer/metrics.ts).
  metrics jsonb not null default '[]',
  -- What validation found.
  checks jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index dataset_snapshots_dataset_idx on public.dataset_snapshots (source_dataset_id, created_at desc);
create index dataset_snapshots_workspace_idx on public.dataset_snapshots (workspace_id);
create index dataset_snapshots_source_idx on public.dataset_snapshots (data_source_id);
create index dataset_snapshots_run_idx on public.dataset_snapshots (sync_run_id);

-- Evidence can now come from a snapshot. It keeps its own copy of the profile
-- and metrics, so it still stands if the source is disconnected later.
alter table public.evidence
  add column snapshot_id uuid references public.dataset_snapshots (id) on delete set null,
  add column metrics jsonb;
create unique index evidence_one_per_snapshot on public.evidence (investigation_id, snapshot_id) where snapshot_id is not null;
create index evidence_snapshot_idx on public.evidence (snapshot_id);

-- ── Workspace copied from the data source ───────────────────────────────

create or replace function private.set_source_workspace()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select s.workspace_id into new.workspace_id from public.data_sources s where s.id = new.data_source_id;
  return new;
end;
$$;
create trigger source_datasets_workspace before insert or update of data_source_id on public.source_datasets
  for each row execute function private.set_source_workspace();
create trigger sync_runs_workspace before insert or update of data_source_id on public.sync_runs
  for each row execute function private.set_source_workspace();
create trigger dataset_snapshots_workspace before insert or update of data_source_id on public.dataset_snapshots
  for each row execute function private.set_source_workspace();

create trigger data_sources_updated_at before update on public.data_sources
  for each row execute function public.set_updated_at();
create trigger source_datasets_updated_at before update on public.source_datasets
  for each row execute function public.set_updated_at();

-- ── Row Level Security: members of the workspace only ───────────────────

alter table public.data_sources enable row level security;
alter table public.source_datasets enable row level security;
alter table public.sync_runs enable row level security;
alter table public.dataset_snapshots enable row level security;

create policy "Data sources: members read" on public.data_sources
  for select to authenticated using (private.is_workspace_member(workspace_id));
create policy "Data sources: members create" on public.data_sources
  for insert to authenticated
  with check (private.is_workspace_member(workspace_id) and created_by = (select auth.uid()));
create policy "Data sources: members update" on public.data_sources
  for update to authenticated
  using (private.is_workspace_member(workspace_id))
  with check (private.is_workspace_member(workspace_id));
create policy "Data sources: members delete" on public.data_sources
  for delete to authenticated using (private.is_workspace_member(workspace_id));

create policy "Source datasets: members read" on public.source_datasets
  for select to authenticated using (private.is_workspace_member(workspace_id));
create policy "Source datasets: members create" on public.source_datasets
  for insert to authenticated with check (private.is_workspace_member(workspace_id));
create policy "Source datasets: members update" on public.source_datasets
  for update to authenticated
  using (private.is_workspace_member(workspace_id))
  with check (private.is_workspace_member(workspace_id));
create policy "Source datasets: members delete" on public.source_datasets
  for delete to authenticated using (private.is_workspace_member(workspace_id));

create policy "Sync runs: members read" on public.sync_runs
  for select to authenticated using (private.is_workspace_member(workspace_id));
create policy "Sync runs: members create" on public.sync_runs
  for insert to authenticated
  with check (private.is_workspace_member(workspace_id) and created_by = (select auth.uid()));
create policy "Sync runs: members update" on public.sync_runs
  for update to authenticated
  using (private.is_workspace_member(workspace_id))
  with check (private.is_workspace_member(workspace_id));

-- Snapshots are written once and never edited.
create policy "Snapshots: members read" on public.dataset_snapshots
  for select to authenticated using (private.is_workspace_member(workspace_id));
create policy "Snapshots: members create" on public.dataset_snapshots
  for insert to authenticated with check (private.is_workspace_member(workspace_id));
create policy "Snapshots: members delete" on public.dataset_snapshots
  for delete to authenticated using (private.is_workspace_member(workspace_id));
