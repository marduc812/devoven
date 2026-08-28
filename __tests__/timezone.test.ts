import { convertTimezone, getExampleInput } from '@/Components/Functions/TimezoneTools/logic';

describe('convertTimezone', () => {
  it('returns an empty list for empty input', () => {
    expect(convertTimezone('')).toEqual([]);
    expect(convertTimezone('   ')).toEqual([]);
  });

  it('returns an empty list for input it cannot parse', () => {
    expect(convertTimezone('nonsense')).toEqual([]);
  });

  it('converts a UTC instant into every listed zone', () => {
    const results = convertTimezone('2024-01-15 14:30 UTC');
    expect(results.length).toBeGreaterThan(5);
    for (const r of results) {
      expect(typeof r.timezone).toBe('string');
      expect(typeof r.label).toBe('string');
      expect(r.time).toMatch(/^\d{2}:\d{2}:\d{2}$/);
      expect(r.date).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    }
  });

  it('keeps the wall time in UTC as entered', () => {
    const utc = convertTimezone('2024-01-15 14:30 UTC').find(r => r.timezone === 'UTC');
    expect(utc).toBeDefined();
    expect(utc!.time).toBe('14:30:00');
    expect(utc!.date).toBe('01/15/2024');
  });

  it('applies the winter offset for New York (UTC-5)', () => {
    const ny = convertTimezone('2024-01-15 14:30 UTC').find(r => r.timezone === 'America/New_York');
    expect(ny!.time).toBe('09:30:00');
    expect(ny!.offset).toBe('GMT-5');
  });

  it('applies daylight saving for New York in July (UTC-4)', () => {
    const ny = convertTimezone('2024-07-15 14:30 UTC').find(r => r.timezone === 'America/New_York');
    expect(ny!.time).toBe('10:30:00');
    expect(ny!.offset).toBe('GMT-4');
  });

  it('rolls the date forward for zones ahead of UTC', () => {
    const tokyo = convertTimezone('2024-01-15 20:00 UTC').find(r => r.timezone === 'Asia/Tokyo');
    expect(tokyo!.date).toBe('01/16/2024');
    expect(tokyo!.time).toBe('05:00:00');
  });

  it('handles a half-hour offset zone', () => {
    const mumbai = convertTimezone('2024-01-15 14:30 UTC').find(r => r.timezone === 'Asia/Kolkata');
    expect(mumbai!.time).toBe('20:00:00');
  });

  it('accepts a T separator between date and time', () => {
    const a = convertTimezone('2024-01-15T14:30 UTC').find(r => r.timezone === 'UTC');
    expect(a!.time).toBe('14:30:00');
  });

  it('accepts a bare ISO instant with no named zone', () => {
    const a = convertTimezone('2024-01-15T14:30:00Z').find(r => r.timezone === 'UTC');
    expect(a!.time).toBe('14:30:00');
  });

  // Regression: seconds plus a named zone used to build "14:30:00:00" and fail.
  it('accepts an explicit seconds field alongside a named zone', () => {
    const a = convertTimezone('2024-01-15 14:30:45 UTC').find(r => r.timezone === 'UTC');
    expect(a!.time).toBe('14:30:45');
    const ny = convertTimezone('2024-01-15 14:30:45 UTC').find(r => r.timezone === 'America/New_York');
    expect(ny!.time).toBe('09:30:45');
  });

  it('accepts a source zone other than UTC', () => {
    const utc = convertTimezone('2024-01-15 09:30 America/New_York').find(r => r.timezone === 'UTC');
    expect(utc!.time).toBe('14:30:00');
  });
});

describe('getExampleInput', () => {
  it('produces input that convertTimezone can parse', () => {
    expect(convertTimezone(getExampleInput()).length).toBeGreaterThan(0);
  });
});
