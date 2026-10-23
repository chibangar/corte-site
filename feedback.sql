-- Run once in the Supabase SQL Editor. Public submissions contain no private data.
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('bug','feature','idea')),
  title text not null check (char_length(trim(title)) between 4 and 120),
  description text not null check (char_length(trim(description)) between 10 and 3000),
  author text not null default 'Anónimo' check (char_length(trim(author)) between 1 and 60),
  created_at timestamptz not null default now()
);
create index feedback_created_at_idx on public.feedback (created_at desc);
alter table public.feedback enable row level security;
revoke all on public.feedback from anon, authenticated;
grant select on public.feedback to anon;
grant insert (kind,title,description,author) on public.feedback to anon;
create policy "Public can read feedback" on public.feedback for select to anon using (true);
create policy "Public can submit feedback" on public.feedback for insert to anon with check (true);
-- Visitors cannot update/delete entries or set IDs/timestamps.
-- Owner moderates/removes spam using the Supabase dashboard.
