import { WeatherSource } from '@/lib/types';
import createMockSource from './mock';
import createRealSource from './ecowitt';

let cachedSource: WeatherSource | null = null;
let cachedScenario: string | null = null;

function computeSource(): WeatherSource {
  const source = (process.env.DATA_SOURCE || 'mock').toLowerCase();
  const scenario = (process.env.MOCK_SCENARIO || 'default').toLowerCase() as string;

  if (cachedSource && cachedScenario === scenario) return cachedSource;

  if (source === 'ecowitt') {
    cachedSource = createRealSource();
  } else {
    cachedSource = createMockSource(scenario as 'default' | 'storm' | 'calm' | 'rain' | 'offline');
    // expose per-request scenario override for the dev debug panel.
    (cachedSource as any).__scenario = scenario;
  }

  cachedScenario = scenario;
  return cachedSource;
}

export function getSource(): WeatherSource {
  return computeSource();
}

export function setScenario(scenario: string) {
  cachedScenario = scenario;
  Object.assign(computeSource(), { __scenario: scenario });
}
