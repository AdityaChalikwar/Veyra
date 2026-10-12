-- An investigation can have several triggers and several outcomes.
-- New array columns replace the single `trigger` / `outcome` columns, which are
-- kept (and backfilled from) for existing rows but no longer written.

alter table public.investigations
  add column triggers text[] not null default '{}'
    check (triggers <@ array['metric-changed', 'customer-feedback', 'stakeholder-request', 'market-opportunity', 'competitive-pressure', 'product-idea', 'other']::text[]),
  add column outcomes text[] not null default '{}'
    check (outcomes <@ array['understand-change', 'identify-customer-problem', 'find-opportunities', 'evaluate-market', 'validate-idea', 'improve-product', 'decide-what-next', 'other']::text[]);

comment on column public.investigations.trigger is 'Deprecated: use triggers.';
comment on column public.investigations.outcome is 'Deprecated: use outcomes.';

update public.investigations
set triggers = case when trigger is null then '{}' else array[trigger] end,
    outcomes = case when outcome is null then '{}' else array[outcome] end
where trigger is not null or outcome is not null;
