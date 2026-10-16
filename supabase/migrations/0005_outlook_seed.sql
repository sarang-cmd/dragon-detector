-- Seed data so the outlook works with zero external APIs: a current cache
-- row per unit system plus a short history. Real builds overwrite these as
-- soon as Open-Meteo/Groq are reachable; until then the site (and the debug
-- panel's history viewer) shows these clearly-sampled values.
-- Run this in the Supabase SQL editor AFTER 0002/0004.

-- current cache: metric
select public.refresh_outlook_cache('metric', jsonb_build_object(
  'generatedAt', (now() - interval '6 minutes')::text,
  'units', 'metric',
  'statisticalHeadline', 'Sample outlook: temperatures holding steady. Staying dry for the next 12 hours.',
  'tempDirection', 'steady',
  'rainExpected', false,
  'ai', null,
  'aiModel', null,
  'hours', jsonb_build_array(
    jsonb_build_object('time', (now())::text, 'tempC', 11.0, 'precipProb', 5, 'precipMm', 0, 'windKmh', 6.0, 'humidityPct', 78),
    jsonb_build_object('time', (now() + interval '1 hour')::text, 'tempC', 12.0, 'precipProb', 5, 'precipMm', 0, 'windKmh', 6.5, 'humidityPct', 75),
    jsonb_build_object('time', (now() + interval '2 hours')::text, 'tempC', 13.0, 'precipProb', 10, 'precipMm', 0, 'windKmh', 7.0, 'humidityPct', 71),
    jsonb_build_object('time', (now() + interval '3 hours')::text, 'tempC', 14.0, 'precipProb', 10, 'precipMm', 0, 'windKmh', 7.5, 'humidityPct', 66),
    jsonb_build_object('time', (now() + interval '4 hours')::text, 'tempC', 14.5, 'precipProb', 15, 'precipMm', 0, 'windKmh', 8.0, 'humidityPct', 62),
    jsonb_build_object('time', (now() + interval '5 hours')::text, 'tempC', 15.0, 'precipProb', 15, 'precipMm', 0, 'windKmh', 8.0, 'humidityPct', 60),
    jsonb_build_object('time', (now() + interval '6 hours')::text, 'tempC', 14.5, 'precipProb', 20, 'precipMm', 0, 'windKmh', 7.5, 'humidityPct', 62),
    jsonb_build_object('time', (now() + interval '7 hours')::text, 'tempC', 13.5, 'precipProb', 20, 'precipMm', 0, 'windKmh', 7.0, 'humidityPct', 66),
    jsonb_build_object('time', (now() + interval '8 hours')::text, 'tempC', 12.5, 'precipProb', 10, 'precipMm', 0, 'windKmh', 6.0, 'humidityPct', 70),
    jsonb_build_object('time', (now() + interval '9 hours')::text, 'tempC', 11.5, 'precipProb', 10, 'precipMm', 0, 'windKmh', 5.5, 'humidityPct', 74),
    jsonb_build_object('time', (now() + interval '10 hours')::text, 'tempC', 11.0, 'precipProb', 5, 'precipMm', 0, 'windKmh', 5.0, 'humidityPct', 77),
    jsonb_build_object('time', (now() + interval '11 hours')::text, 'tempC', 10.5, 'precipProb', 5, 'precipMm', 0, 'windKmh', 4.5, 'humidityPct', 79)
  ),
  'tempMinNext12h', 10.5,
  'tempMaxNext12h', 15.0,
  'sample', true
));

-- current cache: imperial
select public.refresh_outlook_cache('imperial', jsonb_build_object(
  'generatedAt', (now() - interval '6 minutes')::text,
  'units', 'imperial',
  'statisticalHeadline', 'Sample outlook: temperatures holding steady. Staying dry for the next 12 hours.',
  'tempDirection', 'steady',
  'rainExpected', false,
  'ai', null,
  'aiModel', null,
  'hours', jsonb_build_array(
    jsonb_build_object('time', (now())::text, 'tempC', 11.0, 'precipProb', 5, 'precipMm', 0, 'windKmh', 6.0, 'humidityPct', 78),
    jsonb_build_object('time', (now() + interval '3 hours')::text, 'tempC', 14.0, 'precipProb', 10, 'precipMm', 0, 'windKmh', 7.5, 'humidityPct', 66),
    jsonb_build_object('time', (now() + interval '6 hours')::text, 'tempC', 14.5, 'precipProb', 20, 'precipMm', 0, 'windKmh', 7.5, 'humidityPct', 62),
    jsonb_build_object('time', (now() + interval '9 hours')::text, 'tempC', 11.5, 'precipProb', 10, 'precipMm', 0, 'windKmh', 5.5, 'humidityPct', 74)
  ),
  'tempMinNext12h', 10.5,
  'tempMaxNext12h', 15.0,
  'sample', true
));

-- a short history so the panel viewer is not empty on day one
select public.append_outlook_history('metric', jsonb_build_object(
  'generatedAt', (now() - interval '3 hours')::text,
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

select public.append_outlook_history('metric', jsonb_build_object(
  'generatedAt', (now() - interval '90 minutes')::text,
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
