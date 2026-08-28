export const COMMON_TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Sao_Paulo', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Bangkok', 'Asia/Shanghai', 'Asia/Tokyo', 'Asia/Seoul',
  'Australia/Sydney', 'Pacific/Auckland',
];

export function formatWorldClock(isoString?: string): string {
  const date = isoString ? new Date(isoString) : new Date();
  if (isNaN(date.getTime())) throw new Error('Invalid date. Use ISO format: 2024-01-15T10:30:00');

  const results: string[] = [`=== World Clock for ${date.toISOString()} ===\n`];

  for (const tz of COMMON_TIMEZONES) {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
      });
      const formatted = formatter.format(date);
      results.push(`${tz.padEnd(30)} ${formatted}`);
    } catch {
      results.push(`${tz.padEnd(30)} (unavailable)`);
    }
  }

  return results.join('\n');
}

export function convertTimezone(isoString: string, fromTz: string, toTz: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) throw new Error('Invalid date');

  const fmt = (tz: string) => new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).format(date);

  return `From (${fromTz}): ${fmt(fromTz)}\nTo   (${toTz}): ${fmt(toTz)}`;
}
