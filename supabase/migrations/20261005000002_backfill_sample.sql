-- Workspaces created before Milestone 2 get the sample investigation too.
insert into public.investigations (workspace_id, created_by, title, problem, topic, trigger, outcome, status, confidence, is_sample)
select w.id, w.created_by, 'DAU Decline', 'DAU has fallen 40% over the last 8 weeks.', 'engagement',
       'metric-changed', 'understand-change', 'investigating', 'medium', true
from public.workspaces w
where not exists (select 1 from public.investigations i where i.workspace_id = w.id and i.is_sample);
