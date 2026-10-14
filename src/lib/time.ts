export const DEFAULT_TIME_ZONE = 'Europe/Berlin';

export function formatInBerlin(date: Date, format: string): string {
  // Keep the helper simple and runtime-safe; real formatting choice (date-fns vs Intl)
  // is a later install decision. For now, this is a minimal pass-through placeholder that
  // compiles and is easy to update once date-fns/date-fns-tz is added.
  return date.toLocaleString('en-GB', {
    timeZone: DEFAULT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function isTodayInBerlin(date: Date): boolean {
  const now = new Date();
  const berlin = new Date(now.toLocaleString('en-US', { timeZone: DEFAULT_TIME_ZONE }));
  const compare = new Date(date.toLocaleString('en-US', { timeZone: DEFAULT_TIME_ZONE }));
  return (
    compare.getFullYear() === berlin.getFullYear() &&
    compare.getMonth() === berlin.getMonth() &&
    compare.getDate() === berlin.getDate()
  );
}
