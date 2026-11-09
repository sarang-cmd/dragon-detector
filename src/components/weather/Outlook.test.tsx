import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';
import { SWRConfig } from 'swr';
import { Outlook } from './Outlook';
import type { OutlookPayload } from '@/lib/outlook';

/**
 * The hero must never go quiet about the AI sentence: it says what it is
 * doing while the model works, and it says so plainly when the model cannot
 * answer. These tests pin each of those states.
 */

function hour(time: string, tempC: number) {
  return {
    time,
    tempC,
    precipProb: 30,
    precipMm: 0.1,
    windKmh: 9,
    humidityPct: 80,
  };
}

function payload(over: Partial<OutlookPayload> = {}): OutlookPayload {
  return {
    generatedAt: new Date().toISOString(),
    units: 'metric',
    statisticalHeadline: 'Holding near 3°C with rain likely later.',
    tempDirection: 'steady',
    rainExpected: true,
    ai: null,
    aiModel: null,
    aiStatus: 'pending',
    hours: [
      hour('2026-11-09T18:00:00', 3),
      hour('2026-11-09T19:00:00', 2.4),
      hour('2026-11-09T20:00:00', 1.8),
    ],
    tempMinNext12h: 1,
    tempMaxNext12h: 4,
    ...over,
  };
}

function jsonResponse(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as unknown as Response;
}

interface Pending {
  resolve: (body: unknown) => void;
  reject: (err: unknown) => void;
}

let pendingAi: Pending | null = null;
let baseResponse: () => Response;

function installFetch() {
  const mock = vi.fn(async (input: unknown, init?: RequestInit) => {
    const url = String(input);
    if (url.includes('ai=1')) {
      return new Promise<Response>((resolve, reject) => {
        if (init?.signal?.aborted) {
          reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
          return;
        }
        init?.signal?.addEventListener('abort', () => {
          reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
        });
        pendingAi = {
          resolve: (body) => resolve(jsonResponse(body)),
          reject,
        };
      });
    }
    return baseResponse();
  });
  vi.stubGlobal('fetch', mock);
  return mock;
}

function renderOutlook() {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <Outlook unitSystem="metric" />
    </SWRConfig>
  );
}

beforeEach(() => {
  pendingAi = null;
  baseResponse = () => jsonResponse(payload());
  installFetch();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Outlook AI states', () => {
  it('announces the generation and stops it on request', async () => {
    renderOutlook();

    await waitFor(() => {
      expect(screen.getByText('Generating your AI outlook…')).toBeTruthy();
    });
    // The statistics stay on screen instead of a blank space.
    expect(screen.getByText(/Holding near 3°C/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /stop/i }));

    await waitFor(() => {
      expect(screen.getByText(/Generation stopped/)).toBeTruthy();
    });
    expect(screen.queryByText('Generating your AI outlook…')).toBeNull();
    expect(screen.getByRole('button', { name: /generate/i })).toBeTruthy();
  });

  it('shows the sentence once the model answers', async () => {
    renderOutlook();

    await waitFor(() => expect(pendingAi).not.toBeNull());
    pendingAi?.resolve(payload({ ai: 'Rain clears by eight.', aiStatus: 'ready' }));

    await waitFor(() => {
      expect(screen.getByText('Rain clears by eight.')).toBeTruthy();
    });
    expect(screen.getByText(/AI outlook/)).toBeTruthy();
  });

  it('says so when the model cannot answer, and offers a retry', async () => {
    renderOutlook();

    await waitFor(() => expect(pendingAi).not.toBeNull());
    pendingAi?.resolve(payload({ ai: null, aiStatus: 'unavailable' }));

    await waitFor(() => {
      expect(screen.getByText(/AI outlook unavailable/)).toBeTruthy();
    });
    expect(screen.getByText(/Holding near 3°C/)).toBeTruthy();

    // Retry asks the server to ignore the stored failure, then succeeds.
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    await waitFor(() => expect(pendingAi).not.toBeNull());
    pendingAi?.resolve(payload({ ai: 'Rain clears by eight.', aiStatus: 'ready' }));
    await waitFor(() => {
      expect(screen.getByText('Rain clears by eight.')).toBeTruthy();
    });
  });

  it('asks the server to retry past a stored failure', async () => {
    const fetchMock = installFetch();
    renderOutlook();

    await waitFor(() => expect(pendingAi).not.toBeNull());
    pendingAi?.resolve(payload({ ai: null, aiStatus: 'unavailable' }));
    await waitFor(() => {
      expect(screen.getByText(/AI outlook unavailable/)).toBeTruthy();
    });

    pendingAi = null;
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    await waitFor(() => expect(pendingAi).not.toBeNull());

    const aiCalls = fetchMock.mock.calls.filter((call) =>
      String(call[0]).includes('ai=1')
    );
    expect(aiCalls).toHaveLength(2);
    expect(String(aiCalls[1][0])).toContain('fresh=1');
  });

  it('keeps the copy honest when the whole endpoint fails', async () => {
    baseResponse = () =>
      ({ ok: false, status: 502, json: async () => ({ error: 'x' }) }) as unknown as Response;
    renderOutlook();

    await waitFor(() => {
      expect(screen.getByText(/isn't loading right now/)).toBeTruthy();
    });
    expect(screen.getByRole('button', { name: /retry/i })).toBeTruthy();
  });

  it('renders a stored sentence without asking the model again', async () => {
    baseResponse = () =>
      jsonResponse(payload({ ai: 'Dry overnight.', aiStatus: 'ready' }));
    const fetchMock = installFetch();
    renderOutlook();

    await waitFor(() => {
      expect(screen.getByText('Dry overnight.')).toBeTruthy();
    });
    expect(
      fetchMock.mock.calls.filter((call) => String(call[0]).includes('ai=1'))
    ).toHaveLength(0);
  });
});
