-- Recorded station readings for real history (24h/7d charts, CSV).
-- Run this in the Supabase SQL editor (project mhbsnmtqzjehwglzcaay).
-- Public read (weather is public); writes only through the locked-down
-- upsert function, which also trims rows older than 30 days.

create table if not exists public.readings (
  time timestamptz primary key,
  temp_c double precision,
  feels_c double precision,
  humidity_pct double precision,
  pressure_hpa double precision,
  wind_kmh double precision,
  gust_kmh double precision,
  wind_dir double precision,
  rain_rate double precision,
  rain_today double precision,
  uv double precision,
  solar double precision,
  source text not null default 'openmeteo'
);

alter table public.readings enable row level security;

drop policy if exists "readings_public_read" on public.readings;
create policy "readings_public_read"
  on public.readings for select
  using (true);

create or replace function public.record_reading(
  p_time timestamptz,
  p_temp_c double precision,
  p_feels_c double precision,
  p_humidity_pct double precision,
  p_pressure_hpa double precision,
  p_wind_kmh double precision,
  p_gust_kmh double precision,
  p_wind_dir double precision,
  p_rain_rate double precision,
  p_rain_today double precision,
  p_uv double precision,
  p_solar double precision
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.readings (
    time, temp_c, feels_c, humidity_pct, pressure_hpa, wind_kmh,
    gust_kmh, wind_dir, rain_rate, rain_today, uv, solar, source
  ) values (
    p_time, p_temp_c, p_feels_c, p_humidity_pct, p_pressure_hpa, p_wind_kmh,
    p_gust_kmh, p_wind_dir, p_rain_rate, p_rain_today, p_uv, p_solar, 'openmeteo'
  )
  on conflict (time) do update set
    temp_c = excluded.temp_c,
    feels_c = excluded.feels_c,
    humidity_pct = excluded.humidity_pct,
    pressure_hpa = excluded.pressure_hpa,
    wind_kmh = excluded.wind_kmh,
    gust_kmh = excluded.gust_kmh,
    wind_dir = excluded.wind_dir,
    rain_rate = excluded.rain_rate,
    rain_today = excluded.rain_today,
    uv = excluded.uv,
    solar = excluded.solar;
  delete from public.readings where time < now() - interval '30 days';
end;
$$;

grant execute on function public.record_reading(
  timestamptz, double precision, double precision, double precision,
  double precision, double precision, double precision, double precision,
  double precision, double precision, double precision, double precision
) to anon, authenticated;
