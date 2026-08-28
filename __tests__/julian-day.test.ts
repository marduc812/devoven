import {
  gregorianToJDN, jdnToGregorian, jdnToMJD, jdnDayOfWeek,
  easterForYear, parseGregorianToJDN, parseJDNToGregorian,
} from '@/Components/Functions/JulianDayTools/logic';

describe('gregorianToJDN', () => {
  it('J2000.0 epoch: 2000-01-01 = JDN 2451545', () => {
    expect(gregorianToJDN(2000, 1, 1)).toBe(2451545);
  });
  it('1858-11-17 = JDN 2400001 (MJD epoch)', () => {
    // MJD 0 = JDN 2400000.5, so 1858-11-17 = JDN 2400001
    expect(gregorianToJDN(1858, 11, 17)).toBe(2400001);
  });
  it('2024-04-10 returns a reasonable JDN', () => {
    const jdn = gregorianToJDN(2024, 4, 10);
    expect(jdn).toBeGreaterThan(2451545);
  });
});

describe('jdnToGregorian', () => {
  it('round-trips 2000-01-01', () => {
    const { year, month, day } = jdnToGregorian(2451545);
    expect(year).toBe(2000);
    expect(month).toBe(1);
    expect(day).toBe(1);
  });
  it('round-trips arbitrary date', () => {
    const jdn = gregorianToJDN(1999, 7, 15);
    const { year, month, day } = jdnToGregorian(jdn);
    expect(year).toBe(1999);
    expect(month).toBe(7);
    expect(day).toBe(15);
  });
});

describe('jdnToMJD', () => {
  it('J2000.0 MJD is 51544.5', () => {
    expect(jdnToMJD(2451545)).toBeCloseTo(51544.5);
  });
});

describe('jdnDayOfWeek', () => {
  it('2000-01-01 is Saturday (day 5)', () => {
    // 2000-01-01 is Saturday
    expect(jdnDayOfWeek(2451545)).toBe(5);
  });
});

describe('easterForYear', () => {
  it('Easter 2024 is March 31', () => {
    const { month, day } = easterForYear(2024);
    expect(month).toBe(3);
    expect(day).toBe(31);
  });
  it('Easter 2000 is April 23', () => {
    const { month, day } = easterForYear(2000);
    expect(month).toBe(4);
    expect(day).toBe(23);
  });
  it('Easter 1954 is April 18', () => {
    const { month, day } = easterForYear(1954);
    expect(month).toBe(4);
    expect(day).toBe(18);
  });
});

describe('parseGregorianToJDN', () => {
  it('parses 2000-01-01 correctly', () => {
    const r = parseGregorianToJDN('2000-01-01');
    expect(r.jdn).toBe(2451545);
    expect(r.dayOfWeek).toBe('Saturday');
  });
  it('throws on empty input', () => {
    expect(() => parseGregorianToJDN('')).toThrow();
  });
  it('throws on bad format', () => {
    expect(() => parseGregorianToJDN('not-a-date')).toThrow();
  });
  it('throws on bad month', () => {
    expect(() => parseGregorianToJDN('2000-13-01')).toThrow();
  });
});

describe('parseJDNToGregorian', () => {
  it('parses JDN 2451545 to 2000-01-01', () => {
    const r = parseJDNToGregorian('2451545');
    expect(r.dateFormatted).toContain('2000');
    expect(r.dayOfWeek).toBe('Saturday');
  });
  it('throws on empty input', () => {
    expect(() => parseJDNToGregorian('')).toThrow();
  });
  it('throws on non-numeric', () => {
    expect(() => parseJDNToGregorian('abc')).toThrow();
  });
});
