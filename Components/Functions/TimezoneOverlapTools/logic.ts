// Timezone offset database (offset from UTC in hours, standard time)
const TZ_OFFSETS: Record<string, number> = {
  // Common abbreviations
  'UTC': 0,
  'GMT': 0,
  'WET': 0,
  'CET': 1,
  'CEST': 2,
  'EET': 2,
  'EEST': 3,
  'MSK': 3,
  'IST': 5.5,
  'PKT': 5,
  'BST_BD': 6,  // Bangladesh
  'ICT': 7,
  'CST_CN': 8,  // China
  'HKT': 8,
  'SGT': 8,
  'JST': 9,
  'KST': 9,
  'AEST': 10,
  'AEDT': 11,
  'NZST': 12,
  // Americas
  'AST': -4,
  'EST': -5,
  'EDT': -4,
  'CST': -6,
  'CDT': -5,
  'MST': -7,
  'MDT': -6,
  'PST': -8,
  'PDT': -7,
  'AKST': -9,
  'HST': -10,
  'BRT': -3,
  'ART': -3,
  'COT': -5,
  'CLT': -4,
  // Africa
  'WAT': 1,
  'CAT': 2,
  'EAT': 3,
};

export interface TimezoneInfo {
  input: string;
  name: string;
  offsetHours: number;
  offsetLabel: string;
}

export interface OverlapResult {
  zones: TimezoneInfo[];
  workingHoursOverlap: number[];  // UTC hours where all zones have working hours
  meetingSuggestions: MeetingSuggestion[];
  grid: GridRow[];
}

export interface MeetingSuggestion {
  utcHour: number;
  times: string[];  // local time in each zone
  score: number;    // higher = better (0-3: all core hours, ...)
  label: string;
}

export interface GridRow {
  utcHour: number;
  utcLabel: string;
  cells: GridCell[];
}

export interface GridCell {
  localHour: number;
  isWorkingHour: boolean;
  label: string;
}

function parseOffset(raw: string): number {
  // e.g. "+5:30", "-8", "+05:30", "UTC+2"
  const m = raw.match(/^[Uu][Tt][Cc]?([+-]\d{1,2}(?:[:.]?\d{0,2})?)$/) ||
            raw.match(/^([+-]\d{1,2}(?:[:.]?\d{0,2})?)$/);
  if (m) {
    const parts = m[1].replace(':', '.').split('.');
    const h = parseInt(parts[0]);
    const min = parts[1] ? parseInt(parts[1]) / 60 : 0;
    return h + (h < 0 ? -min : min);
  }
  return NaN;
}

export function resolveTimezone(input: string): TimezoneInfo {
  const trimmed = input.trim().toUpperCase();

  // Direct lookup
  if (TZ_OFFSETS[trimmed] !== undefined) {
    const off = TZ_OFFSETS[trimmed];
    return {
      input,
      name: trimmed,
      offsetHours: off,
      offsetLabel: formatOffset(off),
    };
  }

  // Try offset parsing (case-insensitive prefix already handled)
  const raw = input.trim();
  const offset = parseOffset(raw);
  if (!isNaN(offset)) {
    return {
      input,
      name: `UTC${formatOffset(offset)}`,
      offsetHours: offset,
      offsetLabel: formatOffset(offset),
    };
  }

  throw new Error(
    `Unknown timezone: "${input}". Use abbreviations (UTC, EST, PST, JST, CET, IST, AEST) or offsets (UTC+5:30, -8).`,
  );
}

function formatOffset(offset: number): string {
  const sign = offset >= 0 ? '+' : '-';
  const abs = Math.abs(offset);
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);
  return m > 0 ? `${sign}${h}:${String(m).padStart(2, '0')}` : `${sign}${h}`;
}

function localHour(utcHour: number, offsetHours: number): number {
  return ((utcHour + offsetHours) % 24 + 24) % 24;
}

function isWorkingHour(h: number): boolean {
  return h >= 9 && h < 17;
}

export function findOverlap(timezoneInputs: string[]): OverlapResult {
  if (timezoneInputs.length < 2) {
    throw new Error('Please provide at least 2 timezone names or offsets, separated by commas.');
  }
  if (timezoneInputs.length > 4) {
    throw new Error('Maximum 4 timezones supported.');
  }

  const zones = timezoneInputs.map(resolveTimezone);

  // Build 24-hour grid
  const grid: GridRow[] = [];
  const workingHoursOverlap: number[] = [];

  for (let utcHour = 0; utcHour < 24; utcHour++) {
    const cells: GridCell[] = zones.map(z => {
      const lh = localHour(utcHour, z.offsetHours);
      return {
        localHour: lh,
        isWorkingHour: isWorkingHour(lh),
        label: `${String(Math.floor(lh)).padStart(2, '0')}:00`,
      };
    });

    const allWorking = cells.every(c => c.isWorkingHour);
    if (allWorking) workingHoursOverlap.push(utcHour);

    const utcLabel = `${String(utcHour).padStart(2, '0')}:00 UTC`;
    grid.push({ utcHour, utcLabel, cells });
  }

  // Generate meeting suggestions from overlap hours
  const meetingSuggestions: MeetingSuggestion[] = workingHoursOverlap.map(utcHour => {
    const times = zones.map(z => {
      const lh = localHour(utcHour, z.offsetHours);
      const suffix = lh < 12 ? 'am' : 'pm';
      const h12 = lh % 12 === 0 ? 12 : lh % 12;
      return `${h12}:00${suffix} (${z.name})`;
    });

    // Score: higher if closer to midday in all zones
    const score = zones.reduce((acc, z) => {
      const lh = localHour(utcHour, z.offsetHours);
      const distFromMid = Math.abs(lh - 13); // ideal around 1pm
      return acc + Math.max(0, 4 - distFromMid);
    }, 0);

    return { utcHour, times, score, label: `${String(utcHour).padStart(2, '0')}:00 UTC` };
  });

  // Sort by score descending
  meetingSuggestions.sort((a, b) => b.score - a.score);

  return { zones, workingHoursOverlap, meetingSuggestions, grid };
}

export function parseTimezoneInput(input: string): string[] {
  return input.split(',').map(s => s.trim()).filter(Boolean);
}
