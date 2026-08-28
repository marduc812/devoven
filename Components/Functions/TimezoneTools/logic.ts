// Pure TypeScript — no browser-only APIs.
// Uses Date and Intl (available in Node/V8, not browser-only).

export type TimezoneResult = {
  timezone: string;
  label: string;
  time: string;
  date: string;
  offset: string;
};

const MAJOR_TIMEZONES = [
  { tz: 'UTC', label: 'UTC' },
  { tz: 'America/New_York', label: 'New York (ET)' },
  { tz: 'America/Chicago', label: 'Chicago (CT)' },
  { tz: 'America/Denver', label: 'Denver (MT)' },
  { tz: 'America/Los_Angeles', label: 'Los Angeles (PT)' },
  { tz: 'America/Sao_Paulo', label: 'São Paulo (BRT)' },
  { tz: 'Europe/London', label: 'London (GMT/BST)' },
  { tz: 'Europe/Paris', label: 'Paris (CET)' },
  { tz: 'Asia/Kolkata', label: 'Mumbai (IST)' },
  { tz: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { tz: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { tz: 'Australia/Sydney', label: 'Sydney (AEST)' },
];

function parseInputDate(input: string): Date | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Try to extract timezone identifier at the end
  // Format: "2024-01-15 14:30 UTC" or "2024-01-15 14:30 America/New_York"
  // or plain ISO: "2024-01-15T14:30:00Z"
  const isoMatch = trimmed.match(
    /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}(?::\d{2})?)\s+([A-Za-z/_]+)$/,
  );

  if (isoMatch) {
    const datePart = isoMatch[1];
    // The seconds are optional in the input, so add them when they are missing
    // rather than always appending ':00' - "14:30:00" would become
    // "14:30:00:00", which is not a date any more.
    const timePart = isoMatch[2].length === 5 ? isoMatch[2] + ':00' : isoMatch[2];
    const tzPart = isoMatch[3];

    if (tzPart === 'UTC' || tzPart === 'Z') {
      const d = new Date(datePart + 'T' + timePart + 'Z');
      return isNaN(d.getTime()) ? null : d;
    }

    // For named timezones, parse as if local then adjust using Intl
    // Strategy: create a Date in UTC, then figure out the offset in that timezone at that moment
    const tentative = new Date(datePart + 'T' + timePart + 'Z');
    if (isNaN(tentative.getTime())) return null;

    try {
      // Get the UTC offset for this timezone at roughly this time
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tzPart,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
      });

      // Binary-search style: find the UTC time that equals the wall-clock input in tzPart
      // We'll do two iterations to get within a minute
      let utcMs = tentative.getTime();
      for (let iter = 0; iter < 3; iter++) {
        const probe = new Date(utcMs);
        const parts = formatter.formatToParts(probe);
        const get = (type: string) => parseInt(parts.find((p) => p.type === type)!.value, 10);
        const wallHour = get('hour') === 24 ? 0 : get('hour');
        const wallMin = get('minute');
        const wallSec = get('second');
        const wallYear = get('year');
        const wallMonth = get('month');
        const wallDay = get('day');

        const wallMs = Date.UTC(wallYear, wallMonth - 1, wallDay, wallHour, wallMin, wallSec);
        const targetMs = new Date(datePart + 'T' + timePart + 'Z').getTime();
        utcMs += targetMs - wallMs;
      }

      const result = new Date(utcMs);
      return isNaN(result.getTime()) ? null : result;
    } catch {
      return null;
    }
  }

  // Try plain ISO
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
}

function getOffset(tz: string, date: Date): string {
  try {
    // Use Intl to get offset by comparing UTC time representation
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit', minute: '2-digit',
      hour12: false,
      timeZoneName: 'shortOffset',
    });
    const parts = formatter.formatToParts(date);
    const tzNamePart = parts.find((p) => p.type === 'timeZoneName');
    return tzNamePart ? tzNamePart.value : '';
  } catch {
    return '';
  }
}

export function convertTimezone(input: string): TimezoneResult[] {
  const date = parseInputDate(input);
  if (!date) return [];

  return MAJOR_TIMEZONES.map(({ tz, label }) => {
    try {
      const dateFmt = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric', month: '2-digit', day: '2-digit',
      });
      const timeFmt = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
      });

      return {
        timezone: tz,
        label,
        date: dateFmt.format(date),
        time: timeFmt.format(date),
        offset: getOffset(tz, date),
      };
    } catch {
      return { timezone: tz, label, date: 'N/A', time: 'N/A', offset: '' };
    }
  });
}

export function getExampleInput(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  const h = String(now.getUTCHours()).padStart(2, '0');
  const min = String(now.getUTCMinutes()).padStart(2, '0');
  return y + '-' + m + '-' + d + ' ' + h + ':' + min + ' UTC';
}
