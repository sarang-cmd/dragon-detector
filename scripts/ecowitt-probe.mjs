#!/usr/bin/env node
/**
 * Probe the Ecowitt real-time API and list every field the station reports.
 *
 * Why this exists: docs/02 says a captured response is "the final authority"
 * for which fields exist, and that file was never captured. Rather than guess
 * whether a WS3500 reports `rainfall.monthly` or `pressure.absolute`, ask it.
 *
 *   pnpm probe:ecowitt
 *   pnpm probe:ecowitt --write     # also save the raw response
 *
 * Secrets: reads only ECOWITT_APPLICATION_KEY, ECOWITT_API_KEY and ECOWITT_MAC
 * from the environment (falling back to .env.local, which is gitignored).
 * It never prints a key, and the URL is masked before it reaches the terminal.
 * The saved response is weather data only.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const KEYS = ['ECOWITT_APPLICATION_KEY', 'ECOWITT_API_KEY', 'ECOWITT_MAC'];
const ENDPOINT = 'https://api.ecowitt.net/api/v3/device/real_time';

// The fields we are actually trying to settle, per docs/02 section 3.
const OF_INTEREST = [
  ['rainfall.event', 'rain accumulation for the current event'],
  ['rainfall.monthly', 'month accumulation'],
  ['rainfall.yearly', 'year accumulation'],
  ['pressure.absolute', 'station pressure (vs sea-level relative)'],
  ['indoor.temperature', 'console indoor — docs say never show publicly'],
  ['indoor.humidity', 'console indoor — docs say never show publicly'],
];

function loadDotEnvLocal() {
  for (const file of ['.env.local', '.env']) {
    try {
      const text = readFileSync(resolve(process.cwd(), file), 'utf8');
      const found = {};
      for (const line of text.split('\n')) {
        const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
        if (!match) continue;
        const value = match[2].trim().replace(/^['"]|['"]$/g, '');
        if (KEYS.includes(match[1]) && value) found[match[1]] = value;
      }
      if (Object.keys(found).length) return { file, values: found };
    } catch {
      // Missing file is normal; process.env may already have everything.
    }
  }
  return { file: null, values: {} };
}

function resolveCredentials() {
  const fromEnv = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]).filter(([, v]) => v));
  if (KEYS.every((k) => fromEnv[k])) return { creds: fromEnv, source: 'environment' };

  const { file, values } = loadDotEnvLocal();
  const merged = { ...values, ...fromEnv };
  if (KEYS.every((k) => merged[k])) return { creds: merged, source: file ?? 'environment' };
  return { creds: merged, source: file };
}

function mask(url) {
  return url.replace(/(application_key|api_key)=[^&]+/g, '$1=***').replace(/mac=([^&]+)/, (_m, v) =>
    v.length > 6 ? `mac=${v.slice(0, 4)}…${v.slice(-2)}` : 'mac=***',
  );
}

/** Every leaf shaped like { time, unit, value } — the shape of a reading. */
function collectReadings(node, prefix = '', out = []) {
  if (!node || typeof node !== 'object') return out;
  for (const [key, value] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && 'value' in value && 'unit' in value) {
      out.push({ path, value: value.value, unit: value.unit });
    } else if (value && typeof value === 'object') {
      collectReadings(value, path, out);
    }
  }
  return out;
}

// Exported so the parsing can be exercised without live credentials.
export { collectReadings, mask, resolveCredentials, KEYS, OF_INTEREST };

export function report(body, { onLine = console.log } = {}) {
  const readings = collectReadings(body.data);
  const lines = [];
  const byGroup = new Map();
  for (const r of readings) {
    const group = r.path.split('.')[0];
    if (!byGroup.has(group)) byGroup.set(group, []);
    byGroup.get(group).push(r);
  }
  for (const [group, items] of byGroup) {
    lines.push(`  ${group}`);
    for (const item of items) {
      const rest = item.path.slice(group.length + 1);
      lines.push(`    ${rest.padEnd(18)} ${String(item.value).padStart(10)} ${item.unit}`);
    }
    lines.push('');
  }
  lines.push('Fields in question:');
  const present = new Set(readings.map((r) => r.path));
  for (const [path, note] of OF_INTEREST) {
    const value = readings.find((r) => r.path === path);
    const shown = value ? `yes (${value.value} ${value.unit})` : 'NO — not reported';
    lines.push(`  ${path.padEnd(22)} ${shown.padEnd(26)} ${note}`);
  }
  for (const line of lines) onLine(line);
  return readings;
}

function main() {
  const write = process.argv.includes('--write');
  const { creds, source } = resolveCredentials();
  const missing = KEYS.filter((k) => !creds[k]);

  if (missing.length) {
    console.error('\nEcowitt probe — missing credentials\n');
    console.error(`  Not found: ${missing.join(', ')}`);
    console.error('  Looked in: the environment' + (source ? ` and ${source}` : ''));
    console.error(
      '\n  Put all three in .env.local (gitignored) and run again:\n' +
        '    ECOWITT_APPLICATION_KEY=...\n' +
        '    ECOWITT_API_KEY=...\n' +
        '    ECOWITT_MAC=...\n',
    );
    process.exit(1);
  }

  const url = new URL(ENDPOINT);
  url.searchParams.set('application_key', creds.ECOWITT_APPLICATION_KEY);
  url.searchParams.set('api_key', creds.ECOWITT_API_KEY);
  url.searchParams.set('mac', creds.ECOWITT_MAC);
  // `all`, not the app's narrower list: the point is to see everything the
  // station is willing to send, including groups the adapter never asks for.
  url.searchParams.set('call_back', 'all');
  // Same metric unit IDs src/sources/ecowitt.ts sends.
  url.searchParams.set('temp_unitid', '1');
  url.searchParams.set('pressure_unitid', '3');
  url.searchParams.set('wind_speed_unitid', '7');
  url.searchParams.set('rainfall_unitid', '12');
  url.searchParams.set('solar_irradiance_unitid', '16');

  console.log(`\nEcowitt probe — ${mask(url.toString())}\n`);

  fetch(url)
    .then(async (response) => {
      const body = await response.json().catch(() => null);
      if (!body) {
        console.error(`No JSON in the response (HTTP ${response.status}).`);
        process.exit(1);
      }
      if (body.code !== 0) {
        console.error(`API error ${body.code}: ${body.msg ?? '(no message)'}`);
        console.error('Check the keys and MAC, and that the device is online.');
        process.exit(1);
      }

      report(body);
      console.log();

      if (write) {
        const target = resolve(process.cwd(), 'docs/sample-real-time.json');
        writeFileSync(target, `${JSON.stringify(body, null, 2)}\n`);
        console.log(`Saved to docs/sample-real-time.json (the final authority per docs/02).`);
        console.log('Check it before committing — it is weather data, but confirm nothing');
        console.log('identifying slipped in.\n');
      } else {
        console.log('Add --write to save this to docs/sample-real-time.json.\n');
      }
    })
    .catch((error) => {
      console.error(`\nRequest failed: ${error?.message ?? error}`);
      process.exit(1);
    });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
