import { WeatherSource } from '@/lib/types'
import createMockSource from './mock'

function createEcowittSource(): WeatherSource {
  return {
    getCurrent: async () => {
      throw new Error('Ecowitt real-time source not implemented')
    },
    getHistory: async () => {
      throw new Error('Ecowitt history source not implemented')
    },
  }
}

let cachedSource: WeatherSource | null = null
let cachedSourceKind: string | null = null

export function getSource(): WeatherSource {
  const dataSource = (process.env.DATA_SOURCE || 'mock').toLowerCase()

  if (cachedSource && cachedSourceKind === dataSource) {
    return cachedSource
  }

  if (dataSource === 'ecowitt') {
    cachedSource = createEcowittSource()
  } else {
    const scenario = (process.env.MOCK_SCENARIO || 'default').toLowerCase() as
      | 'default'
      | 'storm'
      | 'calm'
      | 'rain'
      | 'offline'
    cachedSource = createMockSource(scenario)
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
