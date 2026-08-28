import { formatPhoneNumber } from '@/Components/Functions/PhoneFormatterTools/logic';

describe('formatPhoneNumber', () => {
  it('formats 10-digit US number', () => {
    const r = formatPhoneNumber('2025551234');
    expect(r).toContain('(202) 555-1234');
    expect(r).toContain('+12025551234');
  });
  it('formats with dashes in input', () => {
    const r = formatPhoneNumber('202-555-1234');
    expect(r).toContain('(202) 555-1234');
  });
  it('formats with parentheses', () => {
    const r = formatPhoneNumber('(202) 555-1234');
    expect(r).toContain('+12025551234');
  });
  it('handles 11 digit US number starting with 1', () => {
    const r = formatPhoneNumber('12025551234');
    expect(r).toContain('+12025551234');
  });
  it('includes digit count', () => {
    const r = formatPhoneNumber('2025551234');
    expect(r).toContain('Digit count:    10');
  });
  it('handles international number', () => {
    const r = formatPhoneNumber('+442071234567');
    expect(r).toContain('E.164');
  });
  it('throws for empty input', () => expect(() => formatPhoneNumber('')).toThrow());
});
