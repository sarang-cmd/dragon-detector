-- Shared outlook cache: one row per unit system, holding the last built
-- payload. All server instances (and all visitors) share it, so the whole
-- site costs a single Open-Meteo + Groq call per 15 minutes.
-- Run this in the Supabase SQL editor (project mhbsnmtqzjehwglzcaay).

create table if not exists public.outlook_cache (
  units text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.outlook_cache enable row level security;

-- Anyone may read the cache (it only holds public forecast text).
drop policy if exists "outlook_cache_public_read" on public.outlook_cache;
create policy "outlook_cache_public_read"
  on public.outlook_cache for select
  using (true);

-- Writes go through a SECURITY DEFINER function so the anon key never gets
-- raw write access: the worst a leaked key can do is trigger a refresh.
create or replace function public.refresh_outlook_cache(p_units text, p_payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.outlook_cache (units, payload, updated_at)
  values (p_units, p_payload, now())
  on conflict (units)
  do update set payload = excluded.payload, updated_at = now();
end;
$$;

grant execute on function public.refresh_outlook_cache(text, jsonb) to anon, authenticated;
