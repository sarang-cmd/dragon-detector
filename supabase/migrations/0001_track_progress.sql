-- Learning-track progress, one row per user.
-- Run this in the Supabase SQL editor (project mhbsnmtqzjehwglzcaay).
-- RLS: users can only read/write their own row. The anon key is safe to
-- expose because every access path is filtered by auth.uid().

create table if not exists public.track_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  xp integer not null default 0,
  completed_lessons text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.track_progress enable row level security;

drop policy if exists "track_progress_owner_read" on public.track_progress;
create policy "track_progress_owner_read"
  on public.track_progress for select
  using (auth.uid() = user_id);

drop policy if exists "track_progress_owner_write" on public.track_progress;
create policy "track_progress_owner_write"
  on public.track_progress for insert
  with check (auth.uid() = user_id);

drop policy if exists "track_progress_owner_update" on public.track_progress;
create policy "track_progress_owner_update"
  on public.track_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
