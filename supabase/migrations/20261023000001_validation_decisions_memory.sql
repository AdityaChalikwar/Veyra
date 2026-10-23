-- Milestone 9: validation, the Decision Brief, decisions and Business Memory.
--
--   validations        one per hypothesis being tested: the plan (method, what to test, what would
--                      confirm or reject it) and, once settled, the outcome and the reason. A hypothesis's
--                      status now comes only from its validation, and a validation can only be settled
--                      with a reason and at least one piece of evidence.
--   validation_notes   evidence gathered for a validation that isn't a dataset: a note, or a finished
--                      research task's outcome. Datasets link through evidence_links (validation_id).
--   decisions          what the team decided: one of seven outcomes, rationale, the opportunity, rejected
--                      options, risks, owner, success measure, review date. A decided decision completes
--                      the investigation.
--   decision_briefs    the final artifact, saved as a snapshot (content) so it reads the same later and
--                      can be shared by a read-only link (share_token).
--   memory_entries     durable learnings for the workspace: validated problems, rejected hypotheses,
--                      customer insights, decisions, experiments, outcomes, lessons.

-- ── Validations ──────────────────────────────────────────────────────────

create table public.validations (
  id uuid primary key default gen_random_uuid(),
  investigation_id uuid not null references public.investigations (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  -- The hypothesis as it read when validation started; later analyses re-point to it by validation_id.
  hypothesis_title text not null default '' check (char_length(hypothesis_title) <= 200),
  hypothesis_statement text not null check (char_length(hypothesis_statement) <= 2000),
  method text not null default '' check (char_length(method) <= 200),
  test text not null default '' check (char_length(test) <= 2000),
  confirm_if text not null default '' check (char_length(confirm_if) <= 1000),
  reject_if text not null default '' check (char_length(reject_if) <= 1000),
  status text not null default 'planned' check (status in ('planned', 'in-progress', 'settled')),
  outcome text check (outcome in ('confirmed', 'rejected', 'unclear')),
  reason text not null default '' check (char_length(reason) <= 2000),
  settled_at timestamptz,
  settled_by uuid references auth.users (id) on delete set null,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((outcome is null) = (status <> 'settled'))
);
create index validations_investigation_idx on public.validations (investigation_id);

create table public.validation_notes (
  id uuid primary key default gen_random_uuid(),
  validation_id uuid not null references public.validations (id) on delete cascade,
  investigation_id uuid not null references public.investigations (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  kind text not null check (kind in ('note', 'research-task')),
  research_task_id uuid references public.research_tasks (id) on delete set null,
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  relation text not null check (relation in ('supports', 'contradicts')),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index validation_notes_validation_idx on public.validation_notes (validation_id);

-- Hypotheses point at their validation; their status follows it. Unclear is a settled outcome too.
alter table public.hypotheses add column validation_id uuid references public.validations (id) on delete set null;
alter table public.hypotheses drop constraint hypotheses_status_check;
alter table public.hypotheses add constraint hypotheses_status_check check (status in ('open', 'confirmed', 'rejected', 'unclear'));
create index hypotheses_validation_idx on public.hypotheses (validation_id);

-- Datasets can be evidence for a validation too.
alter table public.evidence_links add column validation_id uuid references public.validations (id) on delete cascade;
alter table public.evidence_links drop constraint evidence_links_one_target;
alter table public.evidence_links add constraint evidence_links_one_target
  check (num_nonnulls(finding_id, hypothesis_id, problem_definition_id, opportunity_id, validation_id) = 1);
create index evidence_links_validation_idx on public.evidence_links (validation_id);

alter policy "Evidence links: members create" on public.evidence_links
  with check (
    private.is_workspace_member(workspace_id)
    and exists (select 1 from public.evidence e where e.id = evidence_id and e.investigation_id = evidence_links.investigation_id)
    and (finding_id is null or exists (select 1 from public.findings f where f.id = finding_id and f.investigation_id = evidence_links.investigation_id))
    and (hypothesis_id is null or exists (select 1 from public.hypotheses h where h.id = hypothesis_id and h.investigation_id = evidence_links.investigation_id))
    and (problem_definition_id is null or exists (select 1 from public.problem_definitions p where p.id = problem_definition_id and p.investigation_id = evidence_links.investigation_id))
    and (opportunity_id is null or exists (select 1 from public.opportunities o where o.id = opportunity_id and o.investigation_id = evidence_links.investigation_id))
    and (validation_id is null or exists (select 1 from public.validations v where v.id = validation_id and v.investigation_id = evidence_links.investigation_id))
  );

-- Settling needs a reason and at least one piece of evidence; it then sets the hypotheses' status.
create or replace function private.guard_validation_settle()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'settled' and (old.status is distinct from 'settled' or new.outcome is distinct from old.outcome) then
    if char_length(btrim(new.reason)) < 3 then
      raise exception 'A validation needs a reason to be settled' using errcode = 'check_violation';
    end if;
    if not exists (select 1 from public.validation_notes n where n.validation_id = new.id)
       and not exists (select 1 from public.evidence_links l where l.validation_id = new.id) then
      raise exception 'A validation needs at least one piece of evidence to be settled' using errcode = 'check_violation';
    end if;
    new.settled_at := now();
    new.settled_by := auth.uid();
  elsif new.status <> 'settled' then
    new.outcome := null;
    new.settled_at := null;
    new.settled_by := null;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger validations_guard before update on public.validations
  for each row execute function private.guard_validation_settle();

create or replace function private.on_validation_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.hypotheses
  set status = case when new.status = 'settled' then new.outcome else 'open' end
  where validation_id = new.id;
  update public.investigations set updated_at = now() where id = new.investigation_id;
  return null;
end;
$$;
create trigger validations_set_hypothesis after update of status, outcome on public.validations
  for each row execute function private.on_validation_changed();

-- A hypothesis row's status always comes from its validation, also when a new analysis carries it over.
create or replace function private.hypothesis_status_from_validation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v record;
begin
  if new.validation_id is null then
    new.status := 'open';
  else
    select status, outcome, investigation_id into v from public.validations where id = new.validation_id;
    if v is null or v.investigation_id <> new.investigation_id then
      new.validation_id := null;
      new.status := 'open';
    else
      new.status := case when v.status = 'settled' then v.outcome else 'open' end;
    end if;
  end if;
  return new;
end;
$$;
create trigger hypotheses_status before insert or update of validation_id on public.hypotheses
  for each row execute function private.hypothesis_status_from_validation();

-- ── Decisions ────────────────────────────────────────────────────────────

create table public.decisions (
  id uuid primary key default gen_random_uuid(),
  investigation_id uuid not null references public.investigations (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  outcome text not null check (outcome in (
    'solution-exploration', 'customer-research', 'validate-hypothesis', 'investigate-further',
    'no-intervention', 'escalate', 'prioritize-opportunity'
  )),
  summary text not null check (char_length(btrim(summary)) between 1 and 1000),
  rationale text not null default '' check (char_length(rationale) <= 4000),
  opportunity_id uuid references public.opportunities (id) on delete set null,
  opportunity_title text not null default '',
  escalate_to text not null default '' check (char_length(escalate_to) <= 200),
  options_rejected text[] not null default '{}',
  risks text[] not null default '{}',
  owner text not null default '' check (char_length(owner) <= 200),
  success_measure text not null default '' check (char_length(success_measure) <= 1000),
  review_date date,
  -- Recorded later, when the review happens: what actually happened.
  result text not null default '' check (char_length(result) <= 4000),
  -- Worked out in code when recorded, e.g. "Rests on H2, which isn't validated".
  warnings text[] not null default '{}',
  status text not null default 'decided' check (status in ('proposed', 'decided')),
  decided_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index decisions_investigation_idx on public.decisions (investigation_id, created_at desc);
create index decisions_workspace_idx on public.decisions (workspace_id, created_at desc);

-- A decided decision completes the investigation.
create or replace function private.on_decision_recorded()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'decided' then
    update public.investigations set status = 'completed', updated_at = now() where id = new.investigation_id;
  end if;
  return null;
end;
$$;
create trigger decisions_complete_investigation after insert or update of status on public.decisions
  for each row execute function private.on_decision_recorded();
create trigger decisions_touch before update on public.decisions
  for each row execute function private.touch_updated_at();

-- ── Decision Briefs ──────────────────────────────────────────────────────

create table public.decision_briefs (
  id uuid primary key default gen_random_uuid(),
  investigation_id uuid not null references public.investigations (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  -- The brief as written: every section, with the evidence it cites, so it reads the same later.
  content jsonb not null,
  -- Set to share a read-only link; null when not shared.
  share_token text unique check (share_token is null or char_length(share_token) >= 32),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index decision_briefs_investigation_idx on public.decision_briefs (investigation_id, created_at desc);

-- A shared brief, for anyone with its link. Only the saved snapshot; nothing else is reachable.
create or replace function public.get_shared_brief(token text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object('content', b.content, 'createdAt', b.created_at)
  from public.decision_briefs b
  where token is not null and char_length(token) >= 32 and b.share_token = token
  limit 1;
$$;
revoke all on function public.get_shared_brief(text) from public;
grant execute on function public.get_shared_brief(text) to anon, authenticated;

-- ── Business Memory ──────────────────────────────────────────────────────

create table public.memory_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  investigation_id uuid references public.investigations (id) on delete set null,
  kind text not null check (kind in (
    'validated-problem', 'rejected-hypothesis', 'customer-insight', 'decision', 'experiment', 'outcome', 'lesson'
  )),
  title text not null check (char_length(btrim(title)) between 1 and 300),
  body text not null default '' check (char_length(body) <= 4000),
  -- Where it came from, e.g. {"validationId": "...", "decisionId": "..."}.
  source jsonb not null default '{}'::jsonb,
  archived boolean not null default false,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index memory_entries_workspace_idx on public.memory_entries (workspace_id, created_at desc);
create index memory_entries_investigation_idx on public.memory_entries (investigation_id);
create trigger memory_entries_touch before update on public.memory_entries
  for each row execute function private.touch_updated_at();

-- ── workspace_id from the investigation ──────────────────────────────────

create trigger validations_workspace before insert or update of investigation_id on public.validations
  for each row execute function private.set_row_workspace();
create trigger validation_notes_workspace before insert or update of investigation_id on public.validation_notes
  for each row execute function private.set_row_workspace();
create trigger decisions_workspace before insert or update of investigation_id on public.decisions
  for each row execute function private.set_row_workspace();
create trigger decision_briefs_workspace before insert or update of investigation_id on public.decision_briefs
  for each row execute function private.set_row_workspace();

-- ── Row Level Security ───────────────────────────────────────────────────

alter table public.validations enable row level security;
alter table public.validation_notes enable row level security;
alter table public.decisions enable row level security;
alter table public.decision_briefs enable row level security;
alter table public.memory_entries enable row level security;

create policy "Validations: members read" on public.validations for select to authenticated using (private.is_workspace_member(workspace_id));
create policy "Validations: members create" on public.validations for insert to authenticated with check (private.is_workspace_member(workspace_id));
create policy "Validations: members update" on public.validations for update to authenticated
  using (private.is_workspace_member(workspace_id)) with check (private.is_workspace_member(workspace_id));
create policy "Validations: members delete" on public.validations for delete to authenticated using (private.is_workspace_member(workspace_id));

create policy "Validation notes: members read" on public.validation_notes for select to authenticated using (private.is_workspace_member(workspace_id));
create policy "Validation notes: members create" on public.validation_notes for insert to authenticated with check (
  private.is_workspace_member(workspace_id)
  and exists (select 1 from public.validations v where v.id = validation_id and v.investigation_id = validation_notes.investigation_id)
  and (research_task_id is null or exists (select 1 from public.research_tasks t where t.id = research_task_id and t.investigation_id = validation_notes.investigation_id))
);
create policy "Validation notes: members delete" on public.validation_notes for delete to authenticated using (private.is_workspace_member(workspace_id));

create policy "Decisions: members read" on public.decisions for select to authenticated using (private.is_workspace_member(workspace_id));
create policy "Decisions: members create" on public.decisions for insert to authenticated with check (
  private.is_workspace_member(workspace_id)
  and (opportunity_id is null or exists (select 1 from public.opportunities o where o.id = opportunity_id and o.investigation_id = decisions.investigation_id))
);
create policy "Decisions: members update" on public.decisions for update to authenticated
  using (private.is_workspace_member(workspace_id)) with check (private.is_workspace_member(workspace_id));
create policy "Decisions: members delete" on public.decisions for delete to authenticated using (private.is_workspace_member(workspace_id));

create policy "Decision briefs: members read" on public.decision_briefs for select to authenticated using (private.is_workspace_member(workspace_id));
create policy "Decision briefs: members create" on public.decision_briefs for insert to authenticated with check (private.is_workspace_member(workspace_id));
create policy "Decision briefs: members update" on public.decision_briefs for update to authenticated
  using (private.is_workspace_member(workspace_id)) with check (private.is_workspace_member(workspace_id));
create policy "Decision briefs: members delete" on public.decision_briefs for delete to authenticated using (private.is_workspace_member(workspace_id));

create policy "Memory: members read" on public.memory_entries for select to authenticated using (private.is_workspace_member(workspace_id));
create policy "Memory: members create" on public.memory_entries for insert to authenticated with check (
  private.is_workspace_member(workspace_id)
  and (investigation_id is null or exists (select 1 from public.investigations i where i.id = investigation_id and i.workspace_id = memory_entries.workspace_id))
);
create policy "Memory: members update" on public.memory_entries for update to authenticated
  using (private.is_workspace_member(workspace_id)) with check (private.is_workspace_member(workspace_id));
create policy "Memory: members delete" on public.memory_entries for delete to authenticated using (private.is_workspace_member(workspace_id));

-- ── Privileges: new tables get everything by default; narrow updates to what people may edit ──

revoke update on public.validations, public.decisions, public.decision_briefs, public.memory_entries from authenticated, anon;
grant update (method, test, confirm_if, reject_if, status, outcome, reason) on public.validations to authenticated;
grant update (status, result) on public.decisions to authenticated;
grant update (share_token) on public.decision_briefs to authenticated;
grant update (title, body, archived) on public.memory_entries to authenticated;
-- A hypothesis's status now only follows its validation (set by the trigger above).
revoke update on public.hypotheses from authenticated, anon;
grant update (validation_id) on public.hypotheses to authenticated;
-- Nothing reaches these tables without signing in, except a shared brief through get_shared_brief.
revoke all on public.validations, public.validation_notes, public.decisions, public.decision_briefs, public.memory_entries from anon;

-- Drafting a validation plan, checking a call and writing the Decision Brief each count towards the daily AI limit.
alter table public.ai_usage drop constraint ai_usage_kind_check;
alter table public.ai_usage add constraint ai_usage_kind_check
  check (kind in ('analysis', 'questions', 'problem', 'opportunities', 'validation', 'brief'));

-- The shared brief also shows the decision taken since (summary, owner, dates, result), never the rest of the investigation.
create or replace function public.get_shared_brief(token text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'content', b.content,
    'createdAt', b.created_at,
    'decision', (
      select jsonb_build_object(
        'summary', d.summary, 'outcome', d.outcome, 'owner', d.owner, 'createdAt', d.created_at,
        'reviewDate', d.review_date, 'successMeasure', d.success_measure, 'result', d.result, 'warnings', d.warnings
      )
      from public.decisions d
      where d.investigation_id = b.investigation_id and d.status = 'decided'
      order by d.created_at desc
      limit 1
    )
  )
  from public.decision_briefs b
  where token is not null and char_length(token) >= 32 and b.share_token = token
  limit 1;
$$;
