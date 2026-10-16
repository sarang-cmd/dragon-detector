import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FpsGuard, FPS_GUARD_STORAGE_KEY } from './fps-guard';

let nextId = 1;
let frameTime = 0;
const callbacks = new Map<number, FrameRequestCallback>();

function runFrames(count: number, intervalMs = 50) {
  for (let i = 0; i < count && callbacks.size > 0; i += 1) {
    const [id, callback] = callbacks.entries().next().value ?? [];
    if (id == null || !callback) break;
    callbacks.delete(id);
    frameTime += intervalMs;
    callback(frameTime);
  }
}

describe('FpsGuard', () => {
  beforeEach(() => {
    nextId = 1;
    frameTime = 0;
    callbacks.clear();
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      const id = nextId++;
      callbacks.set(id, callback);
      return id;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      callbacks.delete(id);
    });
    localStorage.clear();
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not sample without ambient registrations, then trips and persists after slow windows', () => {
    const onTrip = vi.fn();
    const onRecover = vi.fn();
    const guard = new FpsGuard({ onTrip, onRecover });
    guard.start();
    expect(callbacks.size).toBe(0);

    const unregister = guard.register();
    runFrames(60 * 3 + 2, 50);
    expect(onTrip).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(FPS_GUARD_STORAGE_KEY)).toBe('1');

    guard.reenable();
    expect(onRecover).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(FPS_GUARD_STORAGE_KEY)).toBeNull();
    unregister();
    guard.dispose();
  });

  it('reference-counts active effects and stops sampling after they unmount', () => {
    const guard = new FpsGuard({ onTrip: vi.fn(), onRecover: vi.fn() });
    guard.start();
    const first = guard.register();
    const second = guard.register();
    expect(callbacks.size).toBe(1);
    first();
    runFrames(10, 50);
    expect(callbacks.size).toBe(1);
    second();
    expect(callbacks.size).toBe(0);
    guard.dispose();
  });
});
