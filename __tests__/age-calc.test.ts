import { calculateAge, formatAgeResult } from '@/Components/Functions/AgeCalcTools/logic';

const TODAY = new Date('2026-04-10');

describe('calculateAge', () => {
  it('calculates age for a known birthday', () => {
    const result = calculateAge('1990-04-10', TODAY);
    expect(result.years).toBe(36);
    expect(result.months).toBe(0);
    expect(result.days).toBe(0);
  });

  it('calculates partial months correctly', () => {
    const result = calculateAge('1990-06-15', TODAY);
    expect(result.years).toBe(35);
    expect(result.months).toBe(9);
  });

  it('returns totalDays', () => {
    const result = calculateAge('2026-04-09', TODAY);
    expect(result.totalDays).toBe(1);
  });

  it('returns totalWeeks', () => {
    const result = calculateAge('2026-03-27', TODAY);
    expect(result.totalWeeks).toBe(2);
  });

  it('returns correct dayOfWeekBorn', () => {
    const result = calculateAge('1990-04-10', TODAY);
    expect(result.dayOfWeekBorn).toBe('Tuesday');
  });

  it('returns zodiac sign', () => {
    const result = calculateAge('1990-04-10', TODAY);
    expect(result.zodiacSign).toBe('Aries');
  });

  it('returns Chinese zodiac', () => {
    // 1990 is Horse year (1990 % 12 = 10 -> Horse)
    const result = calculateAge('1990-04-10', TODAY);
    expect(result.chineseZodiac).toBe('Horse');
  });

  it('throws on future date', () => {
    expect(() => calculateAge('2099-01-01', TODAY)).toThrow();
  });

  it('throws on invalid date', () => {
    expect(() => calculateAge('not-a-date', TODAY)).toThrow();
  });

  it('next birthday is upcoming when birthday has not yet passed this year', () => {
    // Born June 15: birthday not yet reached in April
    const result = calculateAge('1990-06-15', TODAY);
    expect(result.nextBirthday).toBe('2026-06-15');
    expect(result.daysUntilBirthday).toBeGreaterThan(0);
  });
});

describe('formatAgeResult', () => {
  it('includes all sections', () => {
    const result = calculateAge('1990-01-15', TODAY);
    const output = formatAgeResult(result);
    expect(output).toContain('Exact Age');
    expect(output).toContain('Time Stats');
    expect(output).toContain('Birthday Info');
    expect(output).toContain('Zodiac');
    expect(output).toContain('Chinese Zodiac');
  });
});
