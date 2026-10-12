-- Milestone 6: the evidence engine.
--
-- Every conclusion Veyra shows traces back to evidence rows:
--   evidence        one item of evidence (an uploaded CSV, a snapshot of connected data…),
--                   now with where it came from, how far to trust it, and open metadata
--   findings        what an analysis run concluded, with the values it observed
--   hypotheses      possible explanations from an analysis run, with how well evidence covers them
--   evidence_links  which evidence supports, contradicts, or can't settle each finding and hypothesis
--
-- Sources: connected systems live in data_sources (Demo ERP now; CRM, analytics later).
-- Evidence points at its source, or is an upload with no source row.

-- ── Evidence: source, type of origin, confidence, metadata ─────────────────

alter table public.evidence
  add column source_kind text not null default 'upload'
    check (source_kind in ('upload', 'connector', 'research', 'manual')),
  add column data_source_id uuid references public.data_sources (id) on delete set null,
  add column confidence text check (confidence in ('low', 'medium', 'high')),
  add column metadata jsonb not null default '{}'::jsonb;

comment on column public.evidence.source_kind is 'How the evidence arrived: an upload, a connected source, research, or typed in.';
comment on column public.evidence.confidence is 'How far this evidence can be trusted, worked out in code from its size, period and quality.';
comment on column public.evidence.metadata is 'Open details about the evidence, e.g. {"confidenceReason": "..."}.';

-- Evidence taken from a connected source: record which source.
update public.evidence e
set source_kind = 'connector', data_source_id = s.data_source_id
from public.dataset_snapshots s
where e.snapshot_id = s.id;

create index evidence_data_source_idx on public.evidence (data_source_id);

-- ── Findings ─────────────────────────────────────────────────────────────

create table public.findings (
  id uuid primary key default gen_random_uuid(),
  investigation_id uuid not null references public.investigations (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  analysis_run_id uuid not null references public.analysis_runs (id) on delete cascade,
  ref text not null check (ref ~ '^F[0-9]{1,3}$'),
  position int not null default 0,
  kind text not null check (kind in ('observation', 'interpretation', 'insight')),
  statement text not null check (char_length(statement) <= 2000),
  -- What was measured and the values seen, e.g. {"measure": "Return rate", "values": "4.1% → 9.8%", "period": "Jun – Sep 2026"}.
  observed jsonb,
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  confidence_reason text not null default '',
  based_on text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (analysis_run_id, ref)
);
create index findings_investigation_idx on public.findings (investigation_id);

-- ── Hypotheses ───────────────────────────────────────────────────────────

create table public.hypotheses (
  id uuid primary key default gen_random_uuid(),
  investigation_id uuid not null references public.investigations (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  analysis_run_id uuid not null references public.analysis_runs (id) on delete cascade,
  ref text not null check (ref ~ '^H[0-9]{1,3}$'),
  position int not null default 0,
  statement text not null check (char_length(statement) <= 2000),
  rationale text not null default '',
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  evidence_strength text not null check (evidence_strength in ('weak', 'moderate', 'strong')),
  -- Worked out in code from the links: what the evidence says overall.
  evidence_status text not null check (evidence_status in ('supported', 'contradicted', 'mixed', 'insufficient')),
  supporting_findings text[] not null default '{}',
  contradicting_findings text[] not null default '{}',
  validation_method text not null default '',
  status text not null default 'open' check (status in ('open', 'confirmed', 'rejected')),
  created_at timestamptz not null default now(),
  unique (analysis_run_id, ref)
);
create index hypotheses_investigation_idx on public.hypotheses (investigation_id);

-- ── Evidence links ───────────────────────────────────────────────────────

create table public.evidence_links (
  id uuid primary key default gen_random_uuid(),
  investigation_id uuid not null references public.investigations (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  evidence_id uuid not null references public.evidence (id) on delete cascade,
  finding_id uuid references public.findings (id) on delete cascade,
  hypothesis_id uuid references public.hypotheses (id) on delete cascade,
  relation text not null check (relation in ('supports', 'contradicts', 'insufficient')),
  -- What this evidence shows for the finding or hypothesis, in a sentence.
  shows text not null default '' check (char_length(shows) <= 1000),
  created_at timestamptz not null default now(),
  check ((finding_id is null) <> (hypothesis_id is null))
);
create index evidence_links_evidence_idx on public.evidence_links (evidence_id);
create index evidence_links_finding_idx on public.evidence_links (finding_id);
create index evidence_links_hypothesis_idx on public.evidence_links (hypothesis_id);
create index evidence_links_investigation_idx on public.evidence_links (investigation_id);

-- workspace_id always comes from the investigation, never from the client.
create trigger findings_workspace before insert or update of investigation_id on public.findings
  for each row execute function private.set_row_workspace();
create trigger hypotheses_workspace before insert or update of investigation_id on public.hypotheses
  for each row execute function private.set_row_workspace();
create trigger evidence_links_workspace before insert or update of investigation_id on public.evidence_links
  for each row execute function private.set_row_workspace();

-- ── Row Level Security ───────────────────────────────────────────────────

alter table public.findings enable row level security;
alter table public.hypotheses enable row level security;
alter table public.evidence_links enable row level security;

create policy "Findings: members read" on public.findings
  for select to authenticated using (private.is_workspace_member(workspace_id));
create policy "Findings: members create" on public.findings
  for insert to authenticated with check (
    private.is_workspace_member(workspace_id)
    and exists (select 1 from public.analysis_runs r where r.id = analysis_run_id and r.investigation_id = findings.investigation_id)
  );
create policy "Findings: members delete" on public.findings
  for delete to authenticated using (private.is_workspace_member(workspace_id));

create policy "Hypotheses: members read" on public.hypotheses
  for select to authenticated using (private.is_workspace_member(workspace_id));
create policy "Hypotheses: members create" on public.hypotheses
  for insert to authenticated with check (
    private.is_workspace_member(workspace_id)
    and exists (select 1 from public.analysis_runs r where r.id = analysis_run_id and r.investigation_id = hypotheses.investigation_id)
  );
create policy "Hypotheses: members update" on public.hypotheses
  for update to authenticated using (private.is_workspace_member(workspace_id)) with check (private.is_workspace_member(workspace_id));
create policy "Hypotheses: members delete" on public.hypotheses
  for delete to authenticated using (private.is_workspace_member(workspace_id));

create policy "Evidence links: members read" on public.evidence_links
  for select to authenticated using (private.is_workspace_member(workspace_id));
-- A link may only point at evidence (and a finding or hypothesis) of the same investigation.
create policy "Evidence links: members create" on public.evidence_links
  for insert to authenticated with check (
    private.is_workspace_member(workspace_id)
    and exists (select 1 from public.evidence e where e.id = evidence_id and e.investigation_id = evidence_links.investigation_id)
    and (finding_id is null or exists (select 1 from public.findings f where f.id = finding_id and f.investigation_id = evidence_links.investigation_id))
    and (hypothesis_id is null or exists (select 1 from public.hypotheses h where h.id = hypothesis_id and h.investigation_id = evidence_links.investigation_id))
  );
create policy "Evidence links: members delete" on public.evidence_links
  for delete to authenticated using (private.is_workspace_member(workspace_id));

grant select, insert, delete on public.findings, public.evidence_links to authenticated;
grant select, insert, update, delete on public.hypotheses to authenticated;
