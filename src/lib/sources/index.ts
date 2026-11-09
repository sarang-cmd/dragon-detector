import { WeatherSource } from '@/lib/types'
import createMockSource from './mock'
import { createOpenMeteoSource, recordCurrentReading } from './openmeteo'
// The Ecowitt adapter lives in src/sources (see docs/02 and docs/04): it is
// the only module that knows the vendor API. Keys are read server-side only.
import {
  createRealSource,
  hasEcowittCredentials,
  missingCredentialsMessage,
} from '../../sources/ecowitt'

let cachedSource: WeatherSource | null = null
let cachedSourceKind: string | null = null

export function getSource(): WeatherSource {
  const dataSource = (process.env.DATA_SOURCE || 'openmeteo').toLowerCase()

  if (cachedSource && cachedSourceKind === dataSource) {
    return cachedSource
  }

  if (dataSource === 'ecowitt') {
    if (!hasEcowittCredentials()) {
      // Not fatal here: fail per request with an explicit message so the app
      // still boots (build, other routes) without station credentials.
      console.warn(`[sources] DATA_SOURCE=ecowitt — ${missingCredentialsMessage()}`)
    }
    cachedSource = createRealSource()
  } else if (dataSource === 'mock') {
    const scenario = (process.env.MOCK_SCENARIO || 'default').toLowerCase() as
      | 'default'
      | 'storm'
      | 'calm'
      | 'rain'
      | 'offline'
    cachedSource = createMockSource(scenario)
  } else {
    // Default: live Open-Meteo model data, no key required.
    cachedSource = createOpenMeteoSource()
  }

  cachedSourceKind = dataSource
  return cachedSource
}

// For dev-only scenario switching (mock only).
export function setMockScenario(scenario: string) {
  const source = getSource()
  if (process.env.DATA_SOURCE === 'ecowitt') {
    throw new Error('Cannot set scenario when DATA_SOURCE=ecowitt')
  }
  ;(source as any).setScenario?.(scenario)
}
