-- Milestone 10: secondary research. Veyra researches a question on the public web and
-- records the answer on the research task, with its sources, kept apart from the team's own.

alter table public.research_tasks
  add column researched_by text not null default 'team' check (researched_by in ('team', 'veyra')),
  -- Veyra's research: { answer, facts: [{ text, sources }], views: [{ text, sources }], unknowns, sources: [{ url, title }] }.
  add column research jsonb;
comment on column public.research_tasks.research is 'Web research by Veyra: the answer, facts and views kept apart, each citing pages a search returned.';

grant update (status, outcome, researched_by, research) on public.research_tasks to authenticated;

alter table public.ai_usage drop constraint ai_usage_kind_check;
alter table public.ai_usage add constraint ai_usage_kind_check
  check (kind in ('analysis', 'questions', 'problem', 'opportunities', 'validation', 'brief', 'validation-run', 'ask', 'research'));

-- Web research goes into Business Memory as its own kind, never as customer insight.
alter table public.memory_entries drop constraint memory_entries_kind_check;
alter table public.memory_entries add constraint memory_entries_kind_check check (kind in (
  'validated-problem', 'rejected-hypothesis', 'customer-insight', 'market-research', 'decision', 'experiment', 'outcome', 'lesson'
));
