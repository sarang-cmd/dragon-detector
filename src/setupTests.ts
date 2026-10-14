// Minimal globals for test environment.
// Next.js and some browser libs expect fetch and ResizeObserver.

if (typeof globalThis.fetch === 'undefined') {
  // Provide a no-op fetch for runtime expectations in tests.
  globalThis.fetch = async () => {
    return new Response('{}', { status: 200, statusText: 'OK' })
  }
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserver
}
