-- What evidence a validation needs: a checklist on the plan, and which item each piece of evidence covers.
alter table public.validations
  add column evidence_needed jsonb not null default '[]'::jsonb
    check (jsonb_typeof(evidence_needed) = 'array' and jsonb_array_length(evidence_needed) <= 8);
comment on column public.validations.evidence_needed is 'Checklist: [{id, what, source, enough}]. source: data | customer-interviews | survey | support-tickets | experiment | desk-research | other.';
grant update (evidence_needed) on public.validations to authenticated;

alter table public.validation_notes add column need_id text check (need_id is null or char_length(need_id) <= 40);
alter table public.evidence_links add column need_id text check (need_id is null or char_length(need_id) <= 40);
