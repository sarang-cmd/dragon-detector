export const FPS_GUARD_STORAGE_KEY = 'dis_effects_auto_disabled';
const FRAME_WINDOW = 60;
const SLOW_FRAME_WINDOWS_TO_TRIP = 3;
const MIN_FPS = 28;
const MAX_FRAME_DELTA_MS = 100;
const MAX_SAMPLE_GAP_MS = 250;

export interface FpsGuardCallbacks {
  onTrip: () => void;
  onRecover: () => void;
}

/**
 * Samples only while a registered ambient effect is mounted. Large tab-switch
 * gaps are clamped and visibility changes reset the sample window.
 */
export class FpsGuard {
  private registrations = 0;
  private frameId: number | null = null;
  private previousFrame: number | null = null;
  private frameCount = 0;
  private windowDuration = 0;
  private slowWindows = 0;
  private tripped = false;
  private started = false;
  private readonly callbacks: FpsGuardCallbacks;

  constructor(callbacks: FpsGuardCallbacks) {
    this.callbacks = callbacks;
  }

  start() {
    if (this.started || typeof window === 'undefined') return;
    this.started = true;
    this.tripped = readPersistedTrip();
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  register(): () => void {
    this.registrations += 1;
    this.schedule();
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      this.registrations = Math.max(0, this.registrations - 1);
      if (this.registrations === 0) this.stopSampling();
    };
  }

  reenable() {
    this.tripped = false;
    this.slowWindows = 0;
    try {
      window.localStorage.removeItem(FPS_GUARD_STORAGE_KEY);
    } catch {
      // The page still works when storage is unavailable.
    }
    this.callbacks.onRecover();
    this.schedule();
  }

  dispose() {
    if (this.started && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
    }
    this.started = false;
    this.registrations = 0;
    this.stopSampling();
  }

  private onVisibilityChange = () => {
    this.resetWindow();
    if (document.hidden) this.stopSampling();
    else this.schedule();
  };

  private schedule() {
    if (
      !this.started ||
      this.tripped ||
      this.registrations === 0 ||
      document.hidden ||
      this.frameId !== null
    ) {
      return;
    }
    this.frameId = window.requestAnimationFrame(this.onFrame);
  }

  private onFrame = (timestamp: number) => {
    this.frameId = null;
    if (this.registrations === 0 || this.tripped || document.hidden) return;

    if (this.previousFrame !== null) {
      const rawDelta = timestamp - this.previousFrame;
      if (rawDelta > MAX_SAMPLE_GAP_MS) {
        this.resetWindow();
        this.previousFrame = timestamp;
        this.schedule();
        return;
      }
      const delta = Math.min(rawDelta, MAX_FRAME_DELTA_MS);
      this.windowDuration += delta;
      this.frameCount += 1;

      if (this.frameCount >= FRAME_WINDOW) {
        const fps = (this.frameCount / Math.max(this.windowDuration, 1)) * 1000;
        this.slowWindows = fps < MIN_FPS ? this.slowWindows + 1 : 0;
        this.frameCount = 0;
        this.windowDuration = 0;
        if (this.slowWindows >= SLOW_FRAME_WINDOWS_TO_TRIP) {
          this.trip();
          return;
        }
      }
    }

    this.previousFrame = timestamp;
    this.schedule();
  };

  private trip() {
    if (this.tripped) return;
    this.tripped = true;
    this.stopSampling();
    try {
      window.localStorage.setItem(FPS_GUARD_STORAGE_KEY, '1');
    } catch {
      // Keep the in-memory trip active for this page even without storage.
    }
    this.callbacks.onTrip();
  }

  private resetWindow() {
    this.previousFrame = null;
    this.frameCount = 0;
    this.windowDuration = 0;
    this.slowWindows = 0;
  }

  private stopSampling() {
    if (this.frameId !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(this.frameId);
    }
    this.frameId = null;
    this.resetWindow();
  }
}

function readPersistedTrip(): boolean {
  try {
    return window.localStorage.getItem(FPS_GUARD_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}
