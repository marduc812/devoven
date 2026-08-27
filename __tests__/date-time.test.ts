import {
  parseDate,
  formatDateOutput,
  convertDateFormat,
  listTimezones,
  convertTimezone,
  calculateDuration,
  formatDuration,
  getIsoWeekNumber,
  getUsWeekNumber,
  getDayOfYear,
  getDaysUntilYearEnd,
  getWeekStats,
  formatNextRunTimes,
  utcMidnight,
  addDays,
  toIsoDate,
  isLeapYear,
  daysInYear,
  getQuarter,
  getIsoWeekYear,
  weeksInIsoYear,
  weeksInUsYear,
  startOfIsoWeek,
  startOfUsWeek,
  isoWeekStart,
  usWeekStart,
  getWeekReport,
  getWeekRuler,
} from '../Components/Functions/DateTimeTools/logic';

// ---------------------------------------------------------------------------
// parseDate
// ---------------------------------------------------------------------------

describe('parseDate', () => {
  it('parses ISO 8601 with time and Z', () => {
    const d = parseDate('2026-04-08T12:00:00Z');
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(3); // April = 3
    expect(d.getUTCDate()).toBe(8);
    expect(d.getUTCHours()).toBe(12);
  });

  it('parses ISO 8601 date-only', () => {
    const d = parseDate('2026-01-15');
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(0);
    expect(d.getUTCDate()).toBe(15);
  });

  it('parses Unix timestamp (positive)', () => {
    const d = parseDate('1744108800');
    expect(d.getTime()).toBe(1744108800000);
  });

  it('parses Unix timestamp zero (epoch)', () => {
    const d = parseDate('0');
    expect(d.getTime()).toBe(0);
  });

  it('parses US format MM/DD/YYYY', () => {
    const d = parseDate('04/08/2026');
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(3);
    expect(d.getUTCDate()).toBe(8);
  });

  it('parses EU format DD.MM.YYYY', () => {
    const d = parseDate('08.04.2026');
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(3);
    expect(d.getUTCDate()).toBe(8);
  });

  it('parses RFC 2822 style via fallback', () => {
    const d = parseDate('Wed, 08 Apr 2026 12:00:00 GMT');
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(3);
  });

  it('throws on invalid date string', () => {
    expect(() => parseDate('not-a-date')).toThrow();
  });

  it('throws on empty string', () => {
    expect(() => parseDate('')).toThrow();
  });
});

// ---------------------------------------------------------------------------
// formatDateOutput
// ---------------------------------------------------------------------------

describe('formatDateOutput', () => {
  const d = new Date('2026-04-08T15:30:00Z');

  it('formats iso', () => {
    expect(formatDateOutput(d, 'iso')).toBe('2026-04-08T15:30:00.000Z');
  });

  it('formats us', () => {
    expect(formatDateOutput(d, 'us')).toBe('04/08/2026');
  });

  it('formats eu', () => {
    expect(formatDateOutput(d, 'eu')).toBe('08.04.2026');
  });

  it('formats unix', () => {
    expect(formatDateOutput(d, 'unix')).toBe(String(Math.floor(d.getTime() / 1000)));
  });

  it('formats rfc2822', () => {
    const result = formatDateOutput(d, 'rfc2822');
    expect(result).toContain('2026');
    expect(result).toContain('Apr');
  });

  it('formats readable', () => {
    const result = formatDateOutput(d, 'readable');
    expect(result).toContain('2026');
    expect(result).toContain('April');
  });
});

// ---------------------------------------------------------------------------
// convertDateFormat (integration)
// ---------------------------------------------------------------------------

describe('convertDateFormat', () => {
  it('converts ISO to US', () => {
    expect(convertDateFormat('2026-04-08T00:00:00Z', 'us')).toBe('04/08/2026');
  });

  it('converts US to ISO', () => {
    const result = convertDateFormat('04/08/2026', 'iso');
    expect(result).toContain('2026-04-08');
  });

  it('converts Unix timestamp to EU', () => {
    // 1775606400 = 2026-04-08T00:00:00Z
    const result = convertDateFormat('1775606400', 'eu');
    expect(result).toBe('08.04.2026');
  });
});

// ---------------------------------------------------------------------------
// listTimezones
// ---------------------------------------------------------------------------

describe('listTimezones', () => {
  it('returns an array with at least 30 entries', () => {
    const tzs = listTimezones();
    expect(Array.isArray(tzs)).toBe(true);
    expect(tzs.length).toBeGreaterThanOrEqual(30);
  });

  it('includes UTC', () => {
    expect(listTimezones()).toContain('UTC');
  });

  it('includes common zones', () => {
    const tzs = listTimezones();
    expect(tzs).toContain('America/New_York');
    expect(tzs).toContain('Europe/London');
    expect(tzs).toContain('Asia/Tokyo');
  });
});

// ---------------------------------------------------------------------------
// convertTimezone
// ---------------------------------------------------------------------------

describe('convertTimezone', () => {
  it('converts UTC to Tokyo (UTC+9)', () => {
    // 2026-04-08T00:00:00 UTC → should be 09:00 in Tokyo
    const result = convertTimezone('2026-04-08T00:00:00', 'UTC', 'Asia/Tokyo');
    expect(result).toContain('9:00');
    expect(result).toContain('2026');
  });

  it('returns a non-empty string', () => {
    const result = convertTimezone('2026-04-08T12:00:00', 'UTC', 'Europe/London');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('throws on invalid iso string', () => {
    expect(() => convertTimezone('not-a-date', 'UTC', 'Europe/London')).toThrow();
  });
});

// ---------------------------------------------------------------------------
// calculateDuration
// ---------------------------------------------------------------------------

describe('calculateDuration', () => {
  it('calculates exactly one day', () => {
    const start = new Date('2026-04-08T00:00:00Z');
    const end = new Date('2026-04-09T00:00:00Z');
    const d = calculateDuration(start, end);
    expect(d.totalDays).toBe(1);
    expect(d.days).toBe(1);
    expect(d.hours).toBe(0);
    expect(d.minutes).toBe(0);
    expect(d.seconds).toBe(0);
  });

  it('calculates exactly one year', () => {
    const start = new Date('2025-04-08T00:00:00Z');
    const end = new Date('2026-04-08T00:00:00Z');
    const d = calculateDuration(start, end);
    expect(d.years).toBe(1);
    expect(d.months).toBe(0);
    expect(d.days).toBe(0);
  });

  it('calculates mixed duration', () => {
    const start = new Date('2026-01-01T00:00:00Z');
    const end = new Date('2026-04-08T06:30:45Z');
    const d = calculateDuration(start, end);
    expect(d.years).toBe(0);
    expect(d.totalDays).toBeGreaterThan(90);
    expect(d.hours).toBe(6);
    expect(d.minutes).toBe(30);
    expect(d.seconds).toBe(45);
  });

  it('handles reversed start/end (absolute difference)', () => {
    const start = new Date('2026-04-09T00:00:00Z');
    const end = new Date('2026-04-08T00:00:00Z');
    const d = calculateDuration(start, end);
    expect(d.totalDays).toBe(1);
  });

  it('calculates zero duration', () => {
    const d = new Date('2026-04-08T00:00:00Z');
    const result = calculateDuration(d, d);
    expect(result.totalSeconds).toBe(0);
    expect(result.years).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// formatDuration
// ---------------------------------------------------------------------------

describe('formatDuration', () => {
  it('formats 1 year 2 months 3 days', () => {
    const result = formatDuration({
      years: 1, months: 2, days: 3,
      hours: 0, minutes: 0, seconds: 0,
      totalDays: 428, totalHours: 428 * 24, totalMinutes: 428 * 24 * 60, totalSeconds: 428 * 24 * 3600,
    });
    expect(result).toContain('1 year');
    expect(result).toContain('2 months');
    expect(result).toContain('3 days');
  });

  it('uses singular for 1', () => {
    const result = formatDuration({
      years: 1, months: 1, days: 1,
      hours: 1, minutes: 1, seconds: 1,
      totalDays: 0, totalHours: 0, totalMinutes: 0, totalSeconds: 0,
    });
    expect(result).toContain('1 year,');
    expect(result).toContain('1 month,');
    expect(result).toContain('1 day,');
    expect(result).toContain('1 hour,');
    expect(result).toContain('1 minute,');
    expect(result).toContain('1 second');
  });

  it('shows 0 seconds when everything is zero', () => {
    const result = formatDuration({
      years: 0, months: 0, days: 0,
      hours: 0, minutes: 0, seconds: 0,
      totalDays: 0, totalHours: 0, totalMinutes: 0, totalSeconds: 0,
    });
    expect(result).toBe('0 seconds');
  });

  it('skips zero units', () => {
    const result = formatDuration({
      years: 2, months: 0, days: 0,
      hours: 0, minutes: 0, seconds: 30,
      totalDays: 730, totalHours: 0, totalMinutes: 0, totalSeconds: 0,
    });
    expect(result).toContain('2 years');
    expect(result).not.toContain('month');
    expect(result).toContain('30 seconds');
  });
});

// ---------------------------------------------------------------------------
// getIsoWeekNumber
// ---------------------------------------------------------------------------

describe('getIsoWeekNumber', () => {
  it('Jan 1 2026 is week 1', () => {
    expect(getIsoWeekNumber(new Date('2026-01-01'))).toBe(1);
  });

  it('April 8 2026 is week 15', () => {
    expect(getIsoWeekNumber(new Date('2026-04-08'))).toBe(15);
  });

  it('Dec 31 2026 is week 53 or 1 depending on year', () => {
    const w = getIsoWeekNumber(new Date('2026-12-31'));
    expect([52, 53, 1]).toContain(w);
  });

  it('Jan 1 2015 is week 1 (Thursday)', () => {
    // Jan 1 2015 is a Thursday — ISO week 1
    expect(getIsoWeekNumber(new Date('2015-01-01'))).toBe(1);
  });

  it('Dec 31 2018 is week 1 of 2019', () => {
    // Dec 31 2018 is a Monday and belongs to ISO week 1 of 2019
    expect(getIsoWeekNumber(new Date('2018-12-31'))).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// getUsWeekNumber
// ---------------------------------------------------------------------------

describe('getUsWeekNumber', () => {
  it('Jan 1 is always week 1', () => {
    expect(getUsWeekNumber(new Date('2026-01-01'))).toBe(1);
  });

  it('Jan 7 2026 is week 1 or 2 depending on Jan 1 day', () => {
    const w = getUsWeekNumber(new Date('2026-01-07'));
    expect(w).toBeGreaterThanOrEqual(1);
    expect(w).toBeLessThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// getDayOfYear
// ---------------------------------------------------------------------------

describe('getDayOfYear', () => {
  it('Jan 1 is day 1', () => {
    expect(getDayOfYear(new Date('2026-01-01'))).toBe(1);
  });

  it('Jan 2 is day 2', () => {
    expect(getDayOfYear(new Date('2026-01-02'))).toBe(2);
  });

  it('Dec 31 of non-leap year is 365', () => {
    expect(getDayOfYear(new Date('2026-12-31'))).toBe(365);
  });

  it('Dec 31 of leap year is 366', () => {
    expect(getDayOfYear(new Date('2024-12-31'))).toBe(366);
  });

  it('April 8 2026 is day 98', () => {
    // Jan(31) + Feb(28) + Mar(31) + 8 = 98
    expect(getDayOfYear(new Date('2026-04-08'))).toBe(98);
  });
});

// ---------------------------------------------------------------------------
// getDaysUntilYearEnd
// ---------------------------------------------------------------------------

describe('getDaysUntilYearEnd', () => {
  it('Dec 31 returns 0', () => {
    expect(getDaysUntilYearEnd(new Date('2026-12-31'))).toBe(0);
  });

  it('Dec 30 returns 1', () => {
    expect(getDaysUntilYearEnd(new Date('2026-12-30'))).toBe(1);
  });

  it('Jan 1 returns 364 for non-leap year', () => {
    expect(getDaysUntilYearEnd(new Date('2026-01-01'))).toBe(364);
  });

  it('Jan 1 returns 365 for leap year', () => {
    expect(getDaysUntilYearEnd(new Date('2024-01-01'))).toBe(365);
  });
});

// ---------------------------------------------------------------------------
// getWeekStats
// ---------------------------------------------------------------------------

describe('getWeekStats', () => {
  it('returns correct stats for April 8 2026 (Wednesday)', () => {
    const stats = getWeekStats('2026-04-08');
    expect(stats.isoWeek).toBe(15);
    expect(stats.dayOfYear).toBe(98);
    expect(stats.dayOfWeek).toBe('Wednesday');
    expect(typeof stats.usWeek).toBe('number');
    expect(typeof stats.daysUntilYearEnd).toBe('number');
  });

  it('throws on invalid input', () => {
    expect(() => getWeekStats('bad-input')).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Date helpers backing the week report
// ---------------------------------------------------------------------------

const utc = (s: string) => new Date(`${s}T00:00:00Z`);

describe('utcMidnight / addDays / toIsoDate', () => {
  it('utcMidnight strips the time of day', () => {
    expect(toIsoDate(utcMidnight(new Date('2026-04-08T23:59:59Z')))).toBe('2026-04-08');
    expect(utcMidnight(new Date('2026-04-08T23:59:59Z')).getUTCHours()).toBe(0);
  });

  it('addDays crosses month and year boundaries', () => {
    expect(toIsoDate(addDays(utc('2026-01-31'), 1))).toBe('2026-02-01');
    expect(toIsoDate(addDays(utc('2026-12-31'), 1))).toBe('2027-01-01');
    expect(toIsoDate(addDays(utc('2027-01-01'), -1))).toBe('2026-12-31');
  });

  it('addDays spans a leap day', () => {
    expect(toIsoDate(addDays(utc('2024-02-28'), 1))).toBe('2024-02-29');
    expect(toIsoDate(addDays(utc('2026-02-28'), 1))).toBe('2026-03-01');
  });
});

describe('isLeapYear / daysInYear / getQuarter', () => {
  it('applies the full Gregorian rule', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2026)).toBe(false);
    expect(isLeapYear(1900)).toBe(false); // divisible by 100
    expect(isLeapYear(2000)).toBe(true); // divisible by 400
  });

  it('daysInYear follows from it', () => {
    expect(daysInYear(2024)).toBe(366);
    expect(daysInYear(2026)).toBe(365);
  });

  it('getQuarter buckets months in threes', () => {
    expect(getQuarter(utc('2026-01-01'))).toBe(1);
    expect(getQuarter(utc('2026-03-31'))).toBe(1);
    expect(getQuarter(utc('2026-04-01'))).toBe(2);
    expect(getQuarter(utc('2026-07-01'))).toBe(3);
    expect(getQuarter(utc('2026-12-31'))).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// ISO week-year — the thing a bare week number cannot express
// ---------------------------------------------------------------------------

describe('getIsoWeekYear', () => {
  it('matches the calendar year mid-year', () => {
    expect(getIsoWeekYear(utc('2026-04-08'))).toBe(2026);
  });

  it('early January can belong to the previous ISO year', () => {
    // 2027-01-01 is a Friday, so it closes 2026-W53.
    expect(getIsoWeekYear(utc('2027-01-01'))).toBe(2026);
    expect(getIsoWeekNumber(utc('2027-01-01'))).toBe(53);
  });

  it('late December can belong to the next ISO year', () => {
    // 2024-12-30 is a Monday, so it opens 2025-W01.
    expect(getIsoWeekYear(utc('2024-12-30'))).toBe(2025);
    expect(getIsoWeekNumber(utc('2024-12-30'))).toBe(1);
    expect(getIsoWeekYear(utc('2018-12-31'))).toBe(2019);
  });
});

describe('weeksInIsoYear', () => {
  it('is 53 only for long years', () => {
    expect(weeksInIsoYear(2026)).toBe(53); // 1 Jan is a Thursday
    expect(weeksInIsoYear(2020)).toBe(53); // leap year starting on a Wednesday
    expect(weeksInIsoYear(2024)).toBe(52);
    expect(weeksInIsoYear(2025)).toBe(52);
  });

  it('agrees with the Thursday / leap-Wednesday rule for 1990–2050', () => {
    for (let y = 1990; y <= 2050; y++) {
      const jan1 = utc(`${y}-01-01`).getUTCDay();
      const long = jan1 === 4 || (isLeapYear(y) && jan1 === 3);
      expect(weeksInIsoYear(y)).toBe(long ? 53 : 52);
    }
  });

  it('tiles the years without gap or overlap for 1990–2050', () => {
    // The Monday opening year y+1 is exactly weeksInIsoYear(y) weeks after the
    // Monday opening year y — this is what makes the numbering a partition.
    for (let y = 1990; y <= 2050; y++) {
      expect(toIsoDate(addDays(isoWeekStart(y, 1), 7 * weeksInIsoYear(y)))).toBe(
        toIsoDate(isoWeekStart(y + 1, 1))
      );
    }
  });
});

describe('weeksInUsYear', () => {
  it('is 53 normally and 54 when 1 Jan is a Saturday in a leap year', () => {
    for (let y = 1990; y <= 2050; y++) {
      const jan1 = utc(`${y}-01-01`).getUTCDay();
      const expected = jan1 === 6 && isLeapYear(y) ? 54 : 53;
      expect(weeksInUsYear(y)).toBe(expected);
    }
  });
});

// ---------------------------------------------------------------------------
// Week boundaries
// ---------------------------------------------------------------------------

describe('startOfIsoWeek / startOfUsWeek', () => {
  it('lands on Monday and Sunday respectively', () => {
    for (let i = 0; i < 400; i++) {
      const d = addDays(utc('2025-11-01'), i);
      expect(startOfIsoWeek(d).getUTCDay()).toBe(1);
      expect(startOfUsWeek(d).getUTCDay()).toBe(0);
    }
  });

  it('returns the day itself when it already starts the week', () => {
    expect(toIsoDate(startOfIsoWeek(utc('2026-04-06')))).toBe('2026-04-06'); // Monday
    expect(toIsoDate(startOfUsWeek(utc('2026-04-05')))).toBe('2026-04-05'); // Sunday
  });

  it('the US week starts one day before the ISO week, except on Sundays', () => {
    for (let i = 0; i < 400; i++) {
      const d = addDays(utc('2025-11-01'), i);
      const gap = (startOfIsoWeek(d).getTime() - startOfUsWeek(d).getTime()) / 86_400_000;
      // Sunday is the one day the two conventions place in different weeks:
      // ISO closes a week with it, the US rule opens one.
      expect(gap).toBe(d.getUTCDay() === 0 ? -6 : 1);
    }
  });
});

describe('isoWeekStart / usWeekStart', () => {
  it('round-trips through the week number for 2020–2030', () => {
    for (let y = 2020; y <= 2030; y++) {
      for (let w = 1; w <= weeksInIsoYear(y); w++) {
        const start = isoWeekStart(y, w);
        expect(start.getUTCDay()).toBe(1);
        expect(getIsoWeekNumber(start)).toBe(w);
        expect(getIsoWeekYear(start)).toBe(y);
      }
    }
  });

  it('US week 1 is the Sunday on or before 1 Jan', () => {
    for (let y = 2020; y <= 2030; y++) {
      const start = usWeekStart(y, 1);
      expect(start.getUTCDay()).toBe(0);
      const jan1 = utc(`${y}-01-01`);
      expect(start.getTime()).toBeLessThanOrEqual(jan1.getTime());
      expect(jan1.getTime() - start.getTime()).toBeLessThan(7 * 86_400_000);
    }
  });

  it('later US weeks round-trip through the week number', () => {
    for (let y = 2020; y <= 2030; y++) {
      for (let w = 2; w <= weeksInUsYear(y); w++) {
        const start = usWeekStart(y, w);
        expect(start.getUTCDay()).toBe(0);
        expect(getUsWeekNumber(start)).toBe(w);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// getWeekReport
// ---------------------------------------------------------------------------

describe('getWeekReport', () => {
  it('reports a mid-year Wednesday', () => {
    const r = getWeekReport('2026-04-08');
    expect(r.date).toBe('2026-04-08');
    expect(r.dayOfWeek).toBe('Wednesday');
    expect(r.dayOfWeekShort).toBe('Wed');
    expect(r.isWeekend).toBe(false);

    expect(r.isoWeek).toBe(15);
    expect(r.isoWeekYear).toBe(2026);
    expect(r.isoLabel).toBe('2026-W15');
    expect(r.isoWeekStart).toBe('2026-04-06');
    expect(r.isoWeekEnd).toBe('2026-04-12');
    expect(r.isoDayNumber).toBe(3);
    expect(r.isoYearDiffers).toBe(false);

    expect(r.usWeekStart).toBe('2026-04-05');
    expect(r.usWeekEnd).toBe('2026-04-11');
    expect(r.usDayNumber).toBe(4);
    expect(r.usWeekYear).toBe(2026);

    expect(r.dayOfYear).toBe(98);
    expect(r.daysInYear).toBe(365);
    expect(r.quarter).toBe(2);
    expect(r.isLeapYear).toBe(false);
  });

  it('flags a date whose ISO week-year is the previous year', () => {
    const r = getWeekReport('2027-01-01');
    expect(r.isoLabel).toBe('2026-W53');
    expect(r.isoWeekYear).toBe(2026);
    expect(r.calendarYear).toBe(2027);
    expect(r.isoYearDiffers).toBe(true);
    // The US rule always puts 1 January in week 1 of its own calendar year.
    expect(r.usWeek).toBe(1);
    expect(r.usWeekYear).toBe(2027);
    // 2027-01-01 is a Friday, so its US week opened on Sunday 27 December.
    expect(r.usWeekStart).toBe('2026-12-27');
  });

  it('flags a date whose ISO week-year is the next year', () => {
    const r = getWeekReport('2024-12-30');
    expect(r.isoLabel).toBe('2025-W01');
    expect(r.isoWeekYear).toBe(2025);
    expect(r.calendarYear).toBe(2024);
    expect(r.isoYearDiffers).toBe(true);
    expect(r.usWeek).toBe(53);
  });

  it('marks weekends', () => {
    expect(getWeekReport('2026-04-11').isWeekend).toBe(true); // Saturday
    expect(getWeekReport('2026-04-12').isWeekend).toBe(true); // Sunday
    expect(getWeekReport('2026-04-13').isWeekend).toBe(false); // Monday
  });

  it('day of year and days remaining always account for the whole year', () => {
    for (const input of ['2026-01-01', '2026-04-08T15:30:00Z', '2024-02-29', '2026-12-31']) {
      const r = getWeekReport(input);
      expect(r.dayOfYear + r.daysUntilYearEnd).toBe(r.daysInYear);
      expect(r.yearProgress).toBeGreaterThan(0);
      expect(r.yearProgress).toBeLessThanOrEqual(1);
    }
  });

  it('ignores the time of day', () => {
    expect(getWeekReport('2026-04-08T23:59:59Z')).toEqual(getWeekReport('2026-04-08'));
  });

  it('accepts the other formats parseDate handles', () => {
    expect(getWeekReport('04/08/2026').date).toBe('2026-04-08');
    expect(getWeekReport('08.04.2026').date).toBe('2026-04-08');
  });

  it('throws on invalid input', () => {
    expect(() => getWeekReport('not-a-date')).toThrow();
  });

  it('the reported date always sits inside both reported week spans', () => {
    for (let i = 0; i < 400; i++) {
      const day = toIsoDate(addDays(utc('2025-11-01'), i));
      const r = getWeekReport(day);
      expect(r.isoWeekStart <= r.date && r.date <= r.isoWeekEnd).toBe(true);
      expect(r.usWeekStart <= r.date && r.date <= r.usWeekEnd).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// getWeekRuler
// ---------------------------------------------------------------------------

describe('getWeekRuler', () => {
  it('spans 8 days on a weekday, the US week opening it', () => {
    const r = getWeekRuler(getWeekReport('2026-04-08')); // Wednesday
    expect(r.start).toBe('2026-04-05'); // the US week's Sunday
    expect(r.span).toBe(8);
    expect(r.usOffset).toBe(0);
    expect(r.isoOffset).toBe(1);
  });

  it('stretches to 13 days on a Sunday, when the weeks share only that day', () => {
    const r = getWeekRuler(getWeekReport('2026-04-12')); // Sunday
    expect(r.start).toBe('2026-04-06'); // the ISO week's Monday
    expect(r.span).toBe(13);
    expect(r.isoOffset).toBe(0);
    expect(r.usOffset).toBe(6); // the Sunday itself
  });

  it('always leaves room for both seven-day bands', () => {
    for (let i = 0; i < 400; i++) {
      const day = toIsoDate(addDays(utc('2025-11-01'), i));
      const report = getWeekReport(day);
      const r = getWeekRuler(report);

      expect(r.isoOffset).toBeGreaterThanOrEqual(0);
      expect(r.usOffset).toBeGreaterThanOrEqual(0);
      expect(r.isoOffset + 7).toBeLessThanOrEqual(r.span);
      expect(r.usOffset + 7).toBeLessThanOrEqual(r.span);
      expect(r.span).toBe(report.dayOfWeek === 'Sunday' ? 13 : 8);

      // The bands must land on the days the report says they cover.
      expect(toIsoDate(addDays(utc(r.start), r.isoOffset))).toBe(report.isoWeekStart);
      expect(toIsoDate(addDays(utc(r.start), r.usOffset))).toBe(report.usWeekStart);
      // And the selected day has to be one of the cells.
      const offset = Math.round((Date.parse(`${report.date}T00:00:00Z`) - Date.parse(`${r.start}T00:00:00Z`)) / 86_400_000);
      expect(offset).toBeGreaterThanOrEqual(0);
      expect(offset).toBeLessThan(r.span);
    }
  });
});

// ---------------------------------------------------------------------------
// formatNextRunTimes
// ---------------------------------------------------------------------------

describe('formatNextRunTimes', () => {
  it('formats an array of dates', () => {
    const dates = [new Date('2026-04-08T09:00:00Z'), new Date('2026-04-09T09:00:00Z')];
    const result = formatNextRunTimes(dates, 2);
    expect(result).toHaveLength(2);
    expect(typeof result[0]).toBe('string');
    expect(result[0].length).toBeGreaterThan(0);
  });

  it('respects count limit', () => {
    const dates = [
      new Date('2026-04-08T09:00:00Z'),
      new Date('2026-04-09T09:00:00Z'),
      new Date('2026-04-10T09:00:00Z'),
    ];
    expect(formatNextRunTimes(dates, 2)).toHaveLength(2);
  });

  it('returns empty array for empty input', () => {
    expect(formatNextRunTimes([], 5)).toHaveLength(0);
  });
});
