import { dateDiff, parseDateInput } from '@/Components/Functions/DateDiffTools/logic';

describe('parseDateInput', () => {
  it('parses YYYY-MM-DD', () => expect(parseDateInput('2024-01-15').getFullYear()).toBe(2024));
  it('throws for invalid date', () => expect(() => parseDateInput('not a date')).toThrow());
});

describe('dateDiff', () => {
  it('same day is 0 days', () => {
    const r = dateDiff('2024-01-01', '2024-01-01');
    expect(r).toContain('Total days:   0');
  });
  it('one week is 7 days', () => {
    const r = dateDiff('2024-01-01', '2024-01-08');
    expect(r).toContain('Total days:   7');
    expect(r).toContain('1 weeks');
  });
  it('handles reverse order (date2 before date1)', () => {
    const r = dateDiff('2024-01-08', '2024-01-01');
    expect(r).toContain('Total days:   7');
    expect(r).toContain('before');
  });
  it('includes year and month approximation for long periods', () => {
    const r = dateDiff('2020-01-01', '2021-01-01');
    expect(r).toContain('1 year(s)');
  });
  it('includes milliseconds', () => {
    const r = dateDiff('2024-01-01', '2024-01-02');
    expect(r).toContain('Milliseconds:');
  });
});
