-- Milestone 10: the full demo, team notes and Ask Veyra.

-- Which demo an investigation is, so Veyra can offer the demo's held-back evidence when it asks for it.
alter table public.investigations add column demo_scenario text check (demo_scenario is null or demo_scenario in ('app-drop'));

-- Team notes on an investigation.
create table public.investigation_notes (
  id uuid primary key default gen_random_uuid(),
  investigation_id uuid not null references public.investigations (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  author_id uuid default auth.uid() references auth.users (id) on delete set null,
  author_name text not null default '' check (char_length(author_name) <= 200),
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index investigation_notes_investigation_idx on public.investigation_notes (investigation_id, created_at desc);
create trigger investigation_notes_workspace before insert or update of investigation_id on public.investigation_notes
  for each row execute function private.set_row_workspace();
alter table public.investigation_notes enable row level security;
create policy "Notes: members read" on public.investigation_notes for select to authenticated using (private.is_workspace_member(workspace_id));
create policy "Notes: members create" on public.investigation_notes for insert to authenticated with check (private.is_workspace_member(workspace_id) and author_id = auth.uid());
create policy "Notes: authors delete" on public.investigation_notes for delete to authenticated using (private.is_workspace_member(workspace_id) and author_id = auth.uid());
revoke all on public.investigation_notes from anon;
revoke update on public.investigation_notes from authenticated;

-- Ask Veyra: the conversation about an investigation, answers grounded in its records.
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  investigation_id uuid not null references public.investigations (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  text text not null check (char_length(text) between 1 and 8000),
  list text[] not null default '{}',
  refs jsonb not null default '[]'::jsonb,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index chat_messages_investigation_idx on public.chat_messages (investigation_id, created_at);
create trigger chat_messages_workspace before insert or update of investigation_id on public.chat_messages
  for each row execute function private.set_row_workspace();
alter table public.chat_messages enable row level security;
create policy "Chat: members read" on public.chat_messages for select to authenticated using (private.is_workspace_member(workspace_id));
create policy "Chat: members create" on public.chat_messages for insert to authenticated with check (private.is_workspace_member(workspace_id));
create policy "Chat: members delete" on public.chat_messages for delete to authenticated using (private.is_workspace_member(workspace_id));
revoke all on public.chat_messages from anon;
revoke update on public.chat_messages from authenticated;

alter table public.ai_usage drop constraint ai_usage_kind_check;
alter table public.ai_usage add constraint ai_usage_kind_check
  check (kind in ('analysis', 'questions', 'problem', 'opportunities', 'validation', 'brief', 'validation-run', 'ask'));
