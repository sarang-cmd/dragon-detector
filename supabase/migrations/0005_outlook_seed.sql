-- Seed data so the outlook works with zero external APIs: a current cache
-- row per unit system plus a short history. Real builds overwrite these as
-- soon as Open-Meteo/Groq are reachable; until then the site (and the debug
-- panel's history viewer) shows these clearly-sampled values.
--
-- Run order matters (each file only needs the ones before it):
--   0002_outlook_cache.sql  -> creates outlook_cache + refresh function
--   0004_outlook_history.sql -> creates outlook_history + append function
--   0005 (this file)        -> inserts sample rows, needs both tables
-- Select ALL lines before running (Cmd/Ctrl+A then Run). Running only a
-- highlighted fragment will fail with a syntax error pointing at the
-- highlighted lines.

do $$
declare
  has_cache boolean := to_regclass('public.outlook_cache') is not null;
  has_history boolean := to_regclass('public.outlook_history') is not null;
  base timestamptz := date_trunc('hour', now());
  h jsonb;
  i integer;
begin
  if not has_cache then
    raise notice 'SKIPPED: public.outlook_cache is missing. Run 0002_outlook_cache.sql first, then re-run this file.';
    return;
  end if;

  -- current cache row: metric
  h := '[]'::jsonb;
  for i in 0..11 loop
    h := h || jsonb_build_object(
      'time', (base + (i || ' hours')::interval),
      'tempC', (array[11.0,12.0,13.0,14.0,14.5,15.0,14.5,13.5,12.5,11.5,11.0,10.5])[i+1],
      'precipProb', (array[5,5,10,10,15,15,20,20,10,10,5,5])[i+1],
      'precipMm', 0,
      'windKmh', (array[6.0,6.5,7.0,7.5,8.0,8.0,7.5,7.0,6.0,5.5,5.0,4.5])[i+1],
      'humidityPct', (array[78,75,71,66,62,60,62,66,70,74,77,79])[i+1]
    );
  end loop;
  perform public.refresh_outlook_cache('metric', jsonb_build_object(
    'generatedAt', now() - interval '6 minutes',
    'units', 'metric',
    'statisticalHeadline', 'Sample outlook: temperatures holding steady. Staying dry for the next 12 hours.',
    'tempDirection', 'steady',
    'rainExpected', false,
    'ai', null,
    'aiModel', null,
    'hours', h,
    'tempMinNext12h', 10.5,
    'tempMaxNext12h', 15.0,
    'sample', true
  ));

  -- current cache row: imperial (same model values, converted on display)
  perform public.refresh_outlook_cache('imperial', jsonb_build_object(
    'generatedAt', now() - interval '6 minutes',
    'units', 'imperial',
    'statisticalHeadline', 'Sample outlook: temperatures holding steady. Staying dry for the next 12 hours.',
    'tempDirection', 'steady',
    'rainExpected', false,
    'ai', null,
    'aiModel', null,
    'hours', h,
    'tempMinNext12h', 10.5,
    'tempMaxNext12h', 15.0,
    'sample', true
  ));

  if not has_history then
    raise notice 'Cache seeded. History table missing: run 0004_outlook_history.sql first if you want past outlooks too.';
    return;
  end if;

  -- a short history so the panel viewer is not empty on day one
  perform public.append_outlook_history('metric', jsonb_build_object(
    'generatedAt', now() - interval '3 hours',
    'units', 'metric',
    'statisticalHeadline', 'Sample outlook: cooling down later. Rain likely in about 4 hours (up to 65%).',
    'tempDirection', 'falling',
    'rainExpected', true,
    'ai', null,
    'aiModel', null,
    'hours', '[]'::jsonb,
    'tempMinNext12h', 9.0,
    'tempMaxNext12h', 14.0,
    'sample', true
  ));
  perform public.append_outlook_history('metric', jsonb_build_object(
    'generatedAt', now() - interval '90 minutes',
    'units', 'metric',
    'statisticalHeadline', 'Sample outlook: temperatures holding steady. Staying dry for the next 12 hours.',
    'tempDirection', 'steady',
    'rainExpected', false,
    'ai', null,
    'aiModel', null,
    'hours', '[]'::jsonb,
    'tempMinNext12h', 10.0,
    'tempMaxNext12h', 14.5,
    'sample', true
  ));

  raise notice 'Outlook seed complete: current cache + 2 history rows.';
end;
$$;
