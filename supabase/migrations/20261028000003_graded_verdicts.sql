-- Graded verdicts. Between confirmed and rejected, a validation can now be "likely" (the tests
-- support it, something isn't ruled out yet) or "unlikely" (the tests point against it).
-- "Unclear" is kept for when the data truly can't tell. A problem whose cause is likely
-- but not confirmed says so.

alter table public.validations drop constraint validations_outcome_check;
alter table public.validations add constraint validations_outcome_check
  check (outcome in ('confirmed', 'likely', 'unclear', 'unlikely', 'rejected'));

alter table public.hypotheses drop constraint hypotheses_status_check;
alter table public.hypotheses add constraint hypotheses_status_check
  check (status in ('open', 'confirmed', 'likely', 'unclear', 'unlikely', 'rejected'));

alter table public.problem_definitions drop constraint problem_definitions_cause_status_check;
alter table public.problem_definitions add constraint problem_definitions_cause_status_check
  check (cause_status in ('open', 'likely', 'validated'));
comment on column public.problem_definitions.cause_status is
  'open = no hypothesis about the cause was supported when this was written (provisional); likely = the cause is supported but not confirmed; validated = confirmed.';
