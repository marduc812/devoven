import { formatWorldClock, convertTimezone, COMMON_TIMEZONES } from '@/Components/Functions/WorldClockTools/logic';
describe('COMMON_TIMEZONES', () => {
  it('includes UTC', () => expect(COMMON_TIMEZONES).toContain('UTC'));
  it('includes major cities', () => expect(COMMON_TIMEZONES.length).toBeGreaterThan(10));
});
describe('formatWorldClock', () => {
  it('generates output with timezone names', () => {
    const r = formatWorldClock('2024-01-15T12:00:00Z');
    expect(r).toContain('UTC');
    expect(r).toContain('America/New_York');
  });
  it('includes ISO string header', () => {
    const r = formatWorldClock('2024-06-15T08:00:00Z');
    expect(r).toContain('World Clock for');
  });
  it('throws for invalid date', () => expect(() => formatWorldClock('not-a-date')).toThrow());
  it('works without argument (current time)', () => expect(formatWorldClock()).toContain('UTC'));
});
describe('convertTimezone', () => {
  it('converts between timezones', () => {
    const r = convertTimezone('2024-01-15T12:00:00Z', 'UTC', 'America/New_York');
    expect(r).toContain('UTC');
    expect(r).toContain('America/New_York');
  });
});
