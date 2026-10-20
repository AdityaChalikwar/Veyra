-- Milestone 8: problem definition and opportunity discovery.
--
--   problem_definitions  the refined problem, written after the analysis on request: who is affected,
--                        what they're trying to do, what's in the way, the business impact, confidence
--                        and unresolved assumptions. The newest one is the current one.
--   opportunities        opportunity areas found from a problem definition: the customer problem each
--                        addresses, potential impact, confidence, assumptions and validation needs.
--                        Not features. The team moves their status (open / pursuing / parked).
-- Both cite evidence through evidence_links, like findings and hypotheses. Reaching opportunities
-- moves the investigation to its last stage, Opportunity discovery.

create table public.problem_definitions (
  id uuid primary key default gen_random_uuid(),
  investigation_id uuid not null references public.investigations (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  -- The analysis it was written from; a later analysis makes it out of date.
  analysis_run_id uuid references public.analysis_runs (id) on delete set null,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  statement text not null check (char_length(statement) <= 1000),
  affected text not null default '' check (char_length(affected) <= 1000),
  need text not null default '' check (char_length(need) <= 1000),
  obstacle text not null default '' check (char_length(obstacle) <= 1000),
  business_impact text not null default '' check (char_length(business_impact) <= 1000),
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  confidence_reason text not null default '',
  assumptions text[] not null default '{}',
  finding_refs text[] not null default '{}',
  hypothesis_refs text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index problem_definitions_investigation_idx on public.problem_definitions (investigation_id, created_at desc);

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  investigation_id uuid not null references public.investigations (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  problem_definition_id uuid not null references public.problem_definitions (id) on delete cascade,
  position int not null default 0,
  title text not null check (char_length(title) <= 200),
  customer_problem text not null default '' check (char_length(customer_problem) <= 1000),
  potential_impact text not null default '' check (char_length(potential_impact) <= 1000),
  impact_level text not null check (impact_level in ('high', 'medium', 'low')),
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  assumptions text[] not null default '{}',
  validation_needs text[] not null default '{}',
  finding_refs text[] not null default '{}',
  status text not null default 'open' check (status in ('open', 'pursuing', 'parked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index opportunities_investigation_idx on public.opportunities (investigation_id);
create index opportunities_problem_idx on public.opportunities (problem_definition_id);

-- Evidence links can now point at a problem definition or an opportunity too: exactly one target.
alter table public.evidence_links
  add column problem_definition_id uuid references public.problem_definitions (id) on delete cascade,
  add column opportunity_id uuid references public.opportunities (id) on delete cascade;
alter table public.evidence_links drop constraint evidence_links_check;
alter table public.evidence_links add constraint evidence_links_one_target
  check (num_nonnulls(finding_id, hypothesis_id, problem_definition_id, opportunity_id) = 1);
create index evidence_links_problem_idx on public.evidence_links (problem_definition_id);
create index evidence_links_opportunity_idx on public.evidence_links (opportunity_id);

alter policy "Evidence links: members create" on public.evidence_links
  with check (
    private.is_workspace_member(workspace_id)
    and exists (select 1 from public.evidence e where e.id = evidence_id and e.investigation_id = evidence_links.investigation_id)
    and (finding_id is null or exists (select 1 from public.findings f where f.id = finding_id and f.investigation_id = evidence_links.investigation_id))
    and (hypothesis_id is null or exists (select 1 from public.hypotheses h where h.id = hypothesis_id and h.investigation_id = evidence_links.investigation_id))
    and (problem_definition_id is null or exists (select 1 from public.problem_definitions p where p.id = problem_definition_id and p.investigation_id = evidence_links.investigation_id))
    and (opportunity_id is null or exists (select 1 from public.opportunities o where o.id = opportunity_id and o.investigation_id = evidence_links.investigation_id))
  );

-- workspace_id always comes from the investigation.
create trigger problem_definitions_workspace before insert or update of investigation_id on public.problem_definitions
  for each row execute function private.set_row_workspace();
create trigger opportunities_workspace before insert or update of investigation_id on public.opportunities
  for each row execute function private.set_row_workspace();
create trigger opportunities_touch before update on public.opportunities
  for each row execute function private.touch_updated_at();

-- Finding opportunities completes Problem validation and opens Opportunity discovery.
create or replace function private.on_opportunities_found()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  stage text;
begin
  select current_stage into stage from public.investigations where id = new.investigation_id;
  if stage = 'problem_validation' then
    perform private.set_stage(new.investigation_id, 'opportunity_discovery');
  end if;
  update public.investigations set updated_at = now() where id = new.investigation_id;
  return null;
end;
$$;
create trigger opportunities_move_stage after insert on public.opportunities
  for each row execute function private.on_opportunities_found();

-- ── Row Level Security ───────────────────────────────────────────────────

alter table public.problem_definitions enable row level security;
alter table public.opportunities enable row level security;

create policy "Problem definitions: members read" on public.problem_definitions
  for select to authenticated using (private.is_workspace_member(workspace_id));
create policy "Problem definitions: members create" on public.problem_definitions
  for insert to authenticated with check (
    private.is_workspace_member(workspace_id)
    and (analysis_run_id is null or exists (select 1 from public.analysis_runs r where r.id = analysis_run_id and r.investigation_id = problem_definitions.investigation_id))
  );
create policy "Problem definitions: members delete" on public.problem_definitions
  for delete to authenticated using (private.is_workspace_member(workspace_id));

create policy "Opportunities: members read" on public.opportunities
  for select to authenticated using (private.is_workspace_member(workspace_id));
create policy "Opportunities: members create" on public.opportunities
  for insert to authenticated with check (
    private.is_workspace_member(workspace_id)
    and exists (select 1 from public.problem_definitions p where p.id = problem_definition_id and p.investigation_id = opportunities.investigation_id)
  );
create policy "Opportunities: members update" on public.opportunities
  for update to authenticated using (private.is_workspace_member(workspace_id)) with check (private.is_workspace_member(workspace_id));
create policy "Opportunities: members delete" on public.opportunities
  for delete to authenticated using (private.is_workspace_member(workspace_id));

grant select, insert, delete on public.problem_definitions to authenticated;
grant select, insert, delete on public.opportunities to authenticated;
-- The team moves an opportunity's status, never what it says or where it belongs.
-- (status-only updates: see the end of this file)

-- Writing the problem and finding opportunities each count towards the daily AI limit.
alter table public.ai_usage drop constraint ai_usage_kind_check;
alter table public.ai_usage add constraint ai_usage_kind_check check (kind in ('analysis', 'questions', 'problem', 'opportunities'));

-- New tables get every privilege by default: take back full updates so only status can change.
revoke update on public.opportunities from authenticated, anon;
grant update (status) on public.opportunities to authenticated;
revoke update on public.hypotheses from authenticated, anon;
grant update (status) on public.hypotheses to authenticated;

-- A problem rests on facts; its cause stays open until a hypothesis is validated.
alter table public.problem_definitions
  add column cause_status text not null default 'open' check (cause_status in ('open', 'validated'));
comment on column public.problem_definitions.cause_status is 'open = no hypothesis about the cause was validated when this was written, so the definition is provisional and its obstacle is not yet known.';
alter table public.opportunities
  add column depends_on text[] not null default '{}';
comment on column public.opportunities.depends_on is 'Hypothesis refs this opportunity assumes are true. Empty while the cause is open.';
