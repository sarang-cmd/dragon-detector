import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StaleBanner } from './StaleBanner';

describe('StaleBanner', () => {
  it('renders nothing visible when data is fresh', () => {
    const { container } = render(
      <StaleBanner isStale={false} isOffline={false} seconds={5} />
    );
    expect(container.textContent).toBe('');
  });

  it('shows a calm stale message with elapsed minutes', () => {
    render(
      <StaleBanner isStale={true} isOffline={false} seconds={840} />
    );
    const text = screen.getByRole('status').textContent ?? '';
    expect(text).toContain('Data last measured 14 min ago.');
    expect(text).toContain('The station may be reconnecting.');
  });

  it('shows the offline message when offline', () => {
    render(
      <StaleBanner isStale={false} isOffline={true} seconds={2100} />
    );
    const text = screen.getByRole('status').textContent ?? '';
    expect(text).toContain('Data last measured 35 min ago.');
    expect(text).toContain('The station has not reported in a while');
  });

  it('keeps the wrapper mounted for fresh data so layout does not shift', () => {
    // The grid-rows wrapper must exist even when hidden; it animates from
    // 0fr to 1fr instead of popping in (no layout jump).
    const { container } = render(
      <StaleBanner isStale={false} isOffline={false} seconds={5} />
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).not.toBeNull();
    expect(wrapper.style.gridTemplateRows).toBe('0fr');

    const shown = render(
      <StaleBanner isStale={true} isOffline={false} seconds={700} />
    );
    const shownWrapper = shown.container.firstElementChild as HTMLElement;
    expect(shownWrapper.style.gridTemplateRows).toBe('1fr');
  });
});
