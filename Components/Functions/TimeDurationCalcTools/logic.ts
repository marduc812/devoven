export interface DurationBreakdown {
  totalSeconds: number;
  weeks: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  hms: string;
  human: string;
}

// Parse expressions like "2h 30m", "90 minutes", "1d 4h 30m 15s", "2:30:00"
export function parseDuration(input: string): number {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) throw new Error('Empty duration');

  // HH:MM:SS
  const hmsMatch = trimmed.match(/^(\d+):(\d{2}):(\d{2})$/);
  if (hmsMatch) {
    return parseInt(hmsMatch[1]) * 3600 + parseInt(hmsMatch[2]) * 60 + parseInt(hmsMatch[3]);
  }

  // MM:SS
  const mmssMatch = trimmed.match(/^(\d+):(\d{2})$/);
  if (mmssMatch) {
    return parseInt(mmssMatch[1]) * 60 + parseInt(mmssMatch[2]);
  }

  // Named units with optional long forms
  // Support: d/day/days, h/hour/hours, m/min/minute/minutes, s/sec/second/seconds, w/week/weeks
  let total = 0;
  let found = false;

  // Replace long unit names with short ones
  const normalized = trimmed
    .replace(/\bweeks?\b/g, 'w')
    .replace(/\bdays?\b/g, 'd')
    .replace(/\bhours?\b/g, 'h')
    .replace(/\bminutes?\b|\bmins?\b/g, 'm')
    .replace(/\bseconds?\b|\bsecs?\b/g, 's');

  const parts = normalized.match(/([\d.]+)\s*([wdhms])/g);
  if (parts && parts.length > 0) {
    for (const part of parts) {
      const m = part.match(/([\d.]+)\s*([wdhms])/);
      if (!m) continue;
      const val = parseFloat(m[1]);
      found = true;
      switch (m[2]) {
        case 'w': total += val * 604800; break;
        case 'd': total += val * 86400; break;
        case 'h': total += val * 3600; break;
        case 'm': total += val * 60; break;
        case 's': total += val; break;
      }
    }
    if (found) return Math.round(total);
  }

  // Plain number = seconds
  const n = parseFloat(trimmed);
  if (!isNaN(n) && n >= 0) return Math.round(n);

  throw new Error('Cannot parse duration. Try "2h 30m", "1:30:00", "90 minutes", or "3600".');
}

export function breakdown(totalSeconds: number): DurationBreakdown {
  if (totalSeconds < 0) throw new Error('Duration cannot be negative');
  const s = Math.floor(totalSeconds);
  const weeks = Math.floor(s / 604800);
  const days = Math.floor((s % 604800) / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  const totalH = Math.floor(s / 3600);
  const hms = `${totalH}:${pad(minutes)}:${pad(seconds)}`;

  const parts: string[] = [];
  if (weeks > 0) parts.push(`${weeks} week${weeks !== 1 ? 's' : ''}`);
  if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);

  return {
    totalSeconds: s,
    weeks,
    days,
    hours,
    minutes,
    seconds,
    hms,
    human: parts.join(', '),
  };
}

export type Operation = 'add' | 'subtract';

export function combineDurations(
  dur1: string,
  dur2: string,
  operation: Operation,
): number {
  const s1 = parseDuration(dur1);
  const s2 = parseDuration(dur2);
  const result = operation === 'add' ? s1 + s2 : s1 - s2;
  if (result < 0) throw new Error('Result is negative. Second duration is longer than first.');
  return result;
}

export function formatBreakdown(b: DurationBreakdown): string {
  return [
    `=== Duration Breakdown ===`,
    ``,
    `Human readable:    ${b.human}`,
    `HH:MM:SS:          ${b.hms}`,
    ``,
    `=== All Units ===`,
    `Total seconds:     ${b.totalSeconds}`,
    `Total minutes:     ${(b.totalSeconds / 60).toFixed(4)}`,
    `Total hours:       ${(b.totalSeconds / 3600).toFixed(6)}`,
    `Total days:        ${(b.totalSeconds / 86400).toFixed(6)}`,
    `Total weeks:       ${(b.totalSeconds / 604800).toFixed(6)}`,
    ``,
    `=== Components ===`,
    `Weeks:    ${b.weeks}`,
    `Days:     ${b.days}`,
    `Hours:    ${b.hours}`,
    `Minutes:  ${b.minutes}`,
    `Seconds:  ${b.seconds}`,
  ].join('\n');
}
