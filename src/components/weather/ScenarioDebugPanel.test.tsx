import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ScenarioDebugPanel,
  isDevConsoleEnabled,
  areDevEmailsEnabled,
} from './ScenarioDebugPanel';

vi.mock('swr', () => ({ useSWRConfig: () => ({ mutate: vi.fn() }) }));

function press(key: string, target?: HTMLElement) {
  act(() => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true });
    (target ?? window).dispatchEvent(event);
  });
}

beforeEach(() => {
  sessionStorage.clear();
  window.history.replaceState({}, '', '/');
  // Never resolves: the panel's history fetch would otherwise land a state
  // update after the test has finished.
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('where the console is allowed to run', () => {
  it('ships on the live site too, so effects can be checked against real data', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'production');
    expect(isDevConsoleEnabled()).toBe(true);

    window.history.replaceState({}, '', '/?dev=1');
    render(<ScenarioDebugPanel />);
    expect(screen.getByText('Default')).toBeTruthy();
  });

  it('opens in local development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', '');
    expect(isDevConsoleEnabled()).toBe(true);
  });
});

describe('test emails', () => {
  it('are on for local development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_DEV_EMAILS', '');
    expect(areDevEmailsEnabled()).toBe(true);
  });

  it('are off on the live site unless explicitly switched on', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_DEV_EMAILS', '');
    expect(areDevEmailsEnabled()).toBe(false);

    vi.stubEnv('NEXT_PUBLIC_DEV_EMAILS', '1');
    expect(areDevEmailsEnabled()).toBe(true);
  });

  it('disables the send buttons when switched off', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_DEV_EMAILS', '');
    window.history.replaceState({}, '', '/?dev=1');
    render(<ScenarioDebugPanel />);
    expect(screen.getByText('Signup confirm').closest('button')?.disabled).toBe(true);
  });
});

describe('the ?dev=1 escape hatch', () => {
  it('opens the console without any keypress', () => {
    window.history.replaceState({}, '', '/?dev=1');
    render(<ScenarioDebugPanel />);
    expect(screen.getByText('Default')).toBeTruthy();
  });

  it('opens the console from the hash too', () => {
    window.history.replaceState({}, '', '/#dev');
    render(<ScenarioDebugPanel />);
    expect(screen.getByText('Default')).toBeTruthy();
  });

  it('leaves the console shut on a normal URL', () => {
    window.history.replaceState({}, '', '/');
    render(<ScenarioDebugPanel />);
    expect(screen.queryByText('Default')).toBeNull();
  });
});

describe('developer console shortcut', () => {
  it('opens when d is pressed three times quickly', () => {
    render(<ScenarioDebugPanel />);
    expect(screen.queryByText('Default')).toBeNull();

    press('d');
    press('d');
    press('d');

    expect(screen.getByText('Default')).toBeTruthy();
    expect(screen.getByText(/Shortcut:/)).toBeTruthy();
  });

  it('stays shut after only two presses', () => {
    render(<ScenarioDebugPanel />);
    press('d');
    press('d');
    expect(screen.queryByText('Default')).toBeNull();
  });

  it('stays shut when the presses are too far apart', () => {
    vi.useFakeTimers();
    try {
      render(<ScenarioDebugPanel />);
      press('d');
      act(() => vi.advanceTimersByTime(900));
      press('d');
      act(() => vi.advanceTimersByTime(900));
      press('d');
      expect(screen.queryByText('Default')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('closes on Escape', () => {
    render(<ScenarioDebugPanel />);
    press('d');
    press('d');
    press('d');
    expect(screen.getByText('Default')).toBeTruthy();

    press('Escape');
    expect(screen.queryByText('Default')).toBeNull();
  });

  it('ignores the shortcut while typing in a field', () => {
    render(<ScenarioDebugPanel />);
    const input = document.createElement('input');
    document.body.appendChild(input);
    press('d', input);
    press('d', input);
    press('d', input);
    expect(screen.queryByText('Default')).toBeNull();
    input.remove();
  });

  it('remembers it is unlocked for the rest of the session', () => {
    const { unmount } = render(<ScenarioDebugPanel />);
    press('d');
    press('d');
    press('d');
    expect(sessionStorage.getItem('weather_scenario_unlocked')).toBe('1');
    unmount();
    // A remount (new page view) still shows the panel once opened.
    render(<ScenarioDebugPanel />);
    press('Escape');
  });
});
