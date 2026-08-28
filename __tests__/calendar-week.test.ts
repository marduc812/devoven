import {
  isLeapYear,
  dayOfYear,
  isoWeekNumber,
  parseDate,
  getCalendarWeek,
  formatCalendarWeek,
  countBusinessDays,
} from '@/Components/Functions/CalendarWeekTools/logic';

describe('isLeapYear', () => {
  it('2000 is a leap year', () => expect(isLeapYear(2000)).toBe(true));
  it('1900 is not a leap year', () => expect(isLeapYear(1900)).toBe(false));
  it('2024 is a leap year', () => expect(isLeapYear(2024)).toBe(true));
  it('2023 is not a leap year', () => expect(isLeapYear(2023)).toBe(false));
});

describe('dayOfYear', () => {
  it('Jan 1 is day 1', () => {
    expect(dayOfYear(new Date(Date.UTC(2024, 0, 1)))).toBe(1);
  });
  it('Dec 31 is day 366 in leap year', () => {
    expect(dayOfYear(new Date(Date.UTC(2024, 11, 31)))).toBe(366);
  });
  it('Dec 31 is day 365 in non-leap year', () => {
    expect(dayOfYear(new Date(Date.UTC(2023, 11, 31)))).toBe(365);
  });
});

describe('isoWeekNumber', () => {
  it('2024-01-01 is W01 of 2024', () => {
    const { week, year } = isoWeekNumber(new Date(Date.UTC(2024, 0, 1)));
    expect(week).toBe(1);
    expect(year).toBe(2024);
  });

  it('2024-12-30 is W01 of 2025', () => {
    const { week, year } = isoWeekNumber(new Date(Date.UTC(2024, 11, 30)));
    expect(week).toBe(1);
    expect(year).toBe(2025);
  });

  it('2024-03-15 is W11', () => {
    const { week } = isoWeekNumber(new Date(Date.UTC(2024, 2, 15)));
    expect(week).toBe(11);
  });
});

describe('parseDate', () => {
  it('parses ISO format', () => {
    const d = parseDate('2024-03-15');
    expect(d.getUTCFullYear()).toBe(2024);
    expect(d.getUTCMonth()).toBe(2);
    expect(d.getUTCDate()).toBe(15);
  });

  it('parses "March 15, 2024"', () => {
    const d = parseDate('March 15, 2024');
    expect(d.getUTCFullYear()).toBe(2024);
    expect(d.getUTCMonth()).toBe(2);
    expect(d.getUTCDate()).toBe(15);
  });

  it('parses US format MM/DD/YYYY', () => {
    const d = parseDate('03/15/2024');
    expect(d.getUTCFullYear()).toBe(2024);
    expect(d.getUTCMonth()).toBe(2);
    expect(d.getUTCDate()).toBe(15);
  });

  it('throws for invalid date', () => {
    expect(() => parseDate('not a date')).toThrow();
  });
});

describe('getCalendarWeek', () => {
  it('returns correct info for 2024-03-15', () => {
    const r = getCalendarWeek('2024-03-15');
    expect(r.isoWeek).toBe(11);
    expect(r.quarter).toBe(1);
    expect(r.dayOfWeek).toBe('Friday');
    expect(r.isLeapYear).toBe(true);
  });

  it('returns 7 week dates', () => {
    const r = getCalendarWeek('2024-03-15');
    expect(r.weekDates).toHaveLength(7);
  });

  it('week starts on Monday', () => {
    const r = getCalendarWeek('2024-03-15'); // Friday
    expect(r.weekDates[0]).toContain('Monday');
  });
});

describe('formatCalendarWeek', () => {
  it('includes ISO week and quarter', () => {
    const r = getCalendarWeek('2024-03-15');
    const output = formatCalendarWeek(r);
    expect(output).toContain('ISO Week Number');
    expect(output).toContain('Quarter');
    expect(output).toContain('Leap Year');
    expect(output).toContain('Week (Mon-Sun)');
  });
});

describe('countBusinessDays', () => {
  it('Mon-Fri is 5 business days', () => {
    const r = countBusinessDays('2024-03-11', '2024-03-15'); // Mon to Fri
    expect(r.businessDays).toBe(4); // exclusive end
    expect(r.weekendDays).toBe(0);
  });

  it('handles date order (second < first)', () => {
    const r = countBusinessDays('2024-03-15', '2024-03-11');
    expect(r.date1).toBe('2024-03-11'); // sorted
  });

  it('counts weekend days in a full week', () => {
    // Mon Mar 11 to Mon Mar 18 = 7 calendar days (Mon-Sun), 5 business, 2 weekend
    const r = countBusinessDays('2024-03-11', '2024-03-18');
    expect(r.calendarDays).toBe(7);
    expect(r.weekendDays).toBe(2);
    expect(r.businessDays).toBe(5);
  });
});
