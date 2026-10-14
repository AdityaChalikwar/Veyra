-- Short titles for findings and hypotheses: cards show these; the full statement opens on click.
-- Rows saved before this have an empty title, and the screens fall back to the statement.
alter table public.findings add column title text not null default '' check (char_length(title) <= 200);
alter table public.hypotheses add column title text not null default '' check (char_length(title) <= 200);
