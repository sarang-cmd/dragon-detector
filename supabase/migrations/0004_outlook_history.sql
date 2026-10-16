-- Append-only outlook history so past forecasts stay viewable.
-- Run this in the Supabase SQL editor (project mhbsnmtqzjehwglzcaay).
-- Public read (past weather text is public); writes only through the
-- locked-down function, which caps history at 50 rows per unit system.

create table if not exists public.outlook_history (
  id bigint generated always as identity primary key,
  units text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.outlook_history enable row level security;

drop policy if exists "outlook_history_public_read" on public.outlook_history;
create policy "outlook_history_public_read"
  on public.outlook_history for select
  using (true);

create or replace function public.append_outlook_history(p_units text, p_payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.outlook_history (units, payload) values (p_units, p_payload);
  delete from public.outlook_history a
  using public.outlook_history b
  where a.units = p_units
    and b.units = p_units
    and a.id <= b.id - 50;
end;
$$;

grant execute on function public.append_outlook_history(text, jsonb) to anon, authenticated;
