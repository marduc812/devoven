export interface CalendarWeekResult {
  date: string;            // ISO date e.g. 2024-03-15
  isoWeek: number;        // ISO week number 1-53
  isoYear: number;        // ISO week year (may differ from calendar year)
  dayOfYear: number;
  dayOfWeek: string;      // Monday, Tuesday, ...
  quarter: number;        // 1-4
  isLeapYear: boolean;
  daysLeftInYear: number;
  weekDates: string[];    // Mon-Sun dates of the week
  yearProgress: string;   // percentage
}

export interface BusinessDaysResult {
  date1: string;
  date2: string;
  businessDays: number;
  calendarDays: number;
  weekendDays: number;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function dayOfYear(date: Date): number {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

// ISO 8601 week number
export function isoWeekNumber(date: Date): { week: number; year: number } {
  // Thursday of the current week (ISO weeks start Monday)
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7; // 1=Mon ... 7=Sun
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // Thursday of this week
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { week, year: d.getUTCFullYear() };
}

export function parseDate(input: string): Date {
  const trimmed = input.trim();

  // Try ISO: 2024-03-15
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1]);
    const m = parseInt(isoMatch[2]) - 1;
    const d = parseInt(isoMatch[3]);
    const date = new Date(Date.UTC(y, m, d));
    if (isNaN(date.getTime())) throw new Error('Invalid date');
    return date;
  }

  // Try "March 15, 2024" or "15 March 2024"
  const longMatch = trimmed.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/) ||
                    trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (longMatch) {
    let monthStr: string, day: number, year: number;
    if (/^[A-Za-z]/.test(longMatch[1])) {
      monthStr = longMatch[1];
      day = parseInt(longMatch[2]);
      year = parseInt(longMatch[3]);
    } else {
      day = parseInt(longMatch[1]);
      monthStr = longMatch[2];
      year = parseInt(longMatch[3]);
    }
    const monthIdx = MONTH_NAMES.findIndex(n => n.toLowerCase().startsWith(monthStr.toLowerCase()));
    if (monthIdx === -1) throw new Error(`Unknown month: ${monthStr}`);
    const date = new Date(Date.UTC(year, monthIdx, day));
    if (isNaN(date.getTime())) throw new Error('Invalid date');
    return date;
  }

  // Try US format MM/DD/YYYY
  const usMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usMatch) {
    const date = new Date(Date.UTC(parseInt(usMatch[3]), parseInt(usMatch[1]) - 1, parseInt(usMatch[2])));
    if (isNaN(date.getTime())) throw new Error('Invalid date');
    return date;
  }

  throw new Error('Cannot parse date. Use: "2024-03-15", "March 15, 2024", or "03/15/2024"');
}

export function getCalendarWeek(input: string): CalendarWeekResult {
  const date = parseDate(input);
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth(); // 0-indexed
  const d = date.getUTCDate();
  const dowIndex = date.getUTCDay(); // 0=Sun

  const { week, year: isoYear } = isoWeekNumber(date);
  const doy = dayOfYear(date);
  const leap = isLeapYear(y);
  const totalDays = leap ? 366 : 365;
  const daysLeft = totalDays - doy;
  const quarter = Math.floor(m / 3) + 1;
  const progress = ((doy / totalDays) * 100).toFixed(1);

  // Get Monday of the ISO week containing this date
  const isoDay = dowIndex === 0 ? 7 : dowIndex; // 1=Mon, 7=Sun
  const mondayOffset = 1 - isoDay; // negative to go back to Monday
  const monday = new Date(Date.UTC(y, m, d + mondayOffset));

  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const wd = new Date(monday.getTime() + i * 86400000);
    const wy = wd.getUTCFullYear();
    const wm = String(wd.getUTCMonth() + 1).padStart(2, '0');
    const wdd = String(wd.getUTCDate()).padStart(2, '0');
    weekDates.push(`${wy}-${wm}-${wdd} (${DAY_NAMES[wd.getUTCDay()]})`);
  }

  return {
    date: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    isoWeek: week,
    isoYear,
    dayOfYear: doy,
    dayOfWeek: DAY_NAMES[dowIndex],
    quarter,
    isLeapYear: leap,
    daysLeftInYear: daysLeft,
    weekDates,
    yearProgress: `${progress}%`,
  };
}

export function formatCalendarWeek(r: CalendarWeekResult): string {
  const lines: string[] = [
    `=== Calendar Info for ${r.date} ===`,
    ``,
    `Day of Week:       ${r.dayOfWeek}`,
    `ISO Week Number:   W${String(r.isoWeek).padStart(2, '0')} of ${r.isoYear}`,
    `Day of Year:       ${r.dayOfYear}`,
    `Quarter:           Q${r.quarter}`,
    `Leap Year:         ${r.isLeapYear ? 'Yes' : 'No'}`,
    `Days Left in Year: ${r.daysLeftInYear}`,
    `Year Progress:     ${r.yearProgress}`,
    ``,
    `=== Week (Mon-Sun) ===`,
    ...r.weekDates.map((d, i) => `  ${i === 0 ? '→ Mon' : i === 1 ? '  Tue' : i === 2 ? '  Wed' : i === 3 ? '  Thu' : i === 4 ? '  Fri' : i === 5 ? '  Sat' : '  Sun'}: ${d}`),
  ];
  return lines.join('\n');
}

export function countBusinessDays(date1Str: string, date2Str: string): BusinessDaysResult {
  const d1 = parseDate(date1Str);
  const d2 = parseDate(date2Str);
  const start = d1 < d2 ? d1 : d2;
  const end = d1 < d2 ? d2 : d1;

  let current = new Date(start.getTime());
  let businessDays = 0;
  let calendarDays = 0;
  let weekendDays = 0;

  while (current < end) {
    const dow = current.getUTCDay();
    calendarDays++;
    if (dow === 0 || dow === 6) {
      weekendDays++;
    } else {
      businessDays++;
    }
    current = new Date(current.getTime() + 86400000);
  }

  const fmt = (d: Date) => {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  return {
    date1: fmt(start),
    date2: fmt(end),
    businessDays,
    calendarDays,
    weekendDays,
  };
}
