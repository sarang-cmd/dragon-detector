import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { formatElapsed, RelativeTime } from './RelativeTime';

describe('formatElapsed', () => {
  it('uses "just now" under 5 seconds', () => {
    expect(formatElapsed(0)).toBe('just now');
    expect(formatElapsed(4)).toBe('just now');
  });

  it('formats seconds', () => {
    expect(formatElapsed(40)).toBe('40 s ago');
    expect(formatElapsed(59)).toBe('59 s ago');
  });

  it('formats minutes', () => {
    expect(formatElapsed(60)).toBe('1 min ago');
    expect(formatElapsed(120)).toBe('2 min ago');
    expect(formatElapsed(841)).toBe('14 min ago');
  });

  it('formats hours with minutes', () => {
    expect(formatElapsed(4500)).toBe('1 h 15 min ago');
    expect(formatElapsed(3600)).toBe('1 h ago');
  });
});

describe('RelativeTime', () => {
  it('renders "measured 40 s ago"', () => {
    render(<RelativeTime seconds={40} />);
    // getByText throws when absent, so these are presence assertions.
    expect(screen.getByText('measured')).toBeTruthy();
    expect(screen.getByText('40 s ago')).toBeTruthy();
  });

  it('supports a custom prefix', () => {
    render(<RelativeTime seconds={60} prefix="updated" />);
    expect(screen.getByText('updated')).toBeTruthy();
    expect(screen.getByText('1 min ago')).toBeTruthy();
  });
});
