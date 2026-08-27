export type DurationParts = { hours: number; minutes: number; seconds: number };

/**
 * Formats a millisecond duration as HH:MM:SS, dropping the hours field when
 * the duration is under an hour. Negative input clamps to zero.
 */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
}

export function toMs(hours: number, minutes: number, seconds: number): number {
  return ((hours * 3600) + (minutes * 60) + seconds) * 1000;
}

export function splitMs(ms: number): DurationParts {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    hours: Math.floor(total / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

/**
 * Parses a `?from=` duration value into milliseconds. Accepts bare seconds
 * ("300"), unit notation ("5m30s", "1h 5m"), and clock notation ("1:30",
 * "1:02:03"). Returns null for anything unparseable or non-positive.
 */
export function parseDurationParam(value: string): number | null {
  const input = value.trim().toLowerCase();
  if (!input) return null;

  if (/^\d+$/.test(input)) {
    const seconds = parseInt(input, 10);
    return seconds > 0 ? seconds * 1000 : null;
  }

  if (input.includes(':')) {
    const parts = input.split(':');
    if (parts.length > 3 || parts.some(p => !/^\d+$/.test(p))) return null;
    const nums = parts.map(p => parseInt(p, 10));
    while (nums.length < 3) nums.unshift(0);
    const ms = toMs(nums[0], nums[1], nums[2]);
    return ms > 0 ? ms : null;
  }

  const compact = input.replace(/\s/g, '');
  const unitPattern = /(\d+)([hms])/g;
  let match: RegExpExecArray | null;
  let consumed = 0;
  let ms = 0;

  while ((match = unitPattern.exec(compact)) !== null) {
    const amount = parseInt(match[1], 10);
    if (match[2] === 'h') ms += amount * 3600000;
    else if (match[2] === 'm') ms += amount * 60000;
    else ms += amount * 1000;
    consumed += match[0].length;
  }

  // Reject input containing anything beyond the matched unit groups.
  if (consumed === 0 || consumed !== compact.length) return null;

  return ms > 0 ? ms : null;
}
