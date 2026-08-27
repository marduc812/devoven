import {
  NTP_UNIX_OFFSET,
  parseNtpInput,
  convertNtp,
  formatNtpResult,
} from '@/Components/Functions/NtpTimeTools/logic';

describe('NTP_UNIX_OFFSET', () => {
  it('is 2208988800 (70 years in seconds)', () => {
    expect(NTP_UNIX_OFFSET).toBe(2208988800);
  });
});

describe('parseNtpInput', () => {
  it('treats values >= NTP_UNIX_OFFSET as NTP', () => {
    const result = parseNtpInput(String(NTP_UNIX_OFFSET + 1000));
    expect(result.isNtp).toBe(true);
    expect(result.value).toBe(NTP_UNIX_OFFSET + 1000);
  });

  it('treats values < NTP_UNIX_OFFSET as Unix', () => {
    const result = parseNtpInput('1700000000');
    expect(result.isNtp).toBe(false);
    expect(result.value).toBe(1700000000);
  });

  it('throws on negative input', () => {
    expect(() => parseNtpInput('-1')).toThrow();
  });

  it('throws on non-numeric input', () => {
    expect(() => parseNtpInput('abc')).toThrow();
  });
});

describe('convertNtp', () => {
  it('converts NTP timestamp to Unix by subtracting offset', () => {
    const ntpTs = NTP_UNIX_OFFSET + 0; // should give Unix = 0
    const result = convertNtp(String(ntpTs));
    expect(result.unixTimestamp).toBe(0);
    expect(result.ntpTimestamp).toBe(NTP_UNIX_OFFSET);
  });

  it('converts Unix timestamp to NTP by adding offset', () => {
    const result = convertNtp('0');
    expect(result.ntpTimestamp).toBe(NTP_UNIX_OFFSET);
    expect(result.unixTimestamp).toBe(0);
    expect(result.isNtp).toBe(false);
  });

  it('returns correct era 0 for modern timestamps', () => {
    const result = convertNtp('1700000000'); // Unix 2023
    expect(result.era).toBe(0);
  });

  it('ntpShort starts with 0x', () => {
    const result = convertNtp('1700000000');
    expect(result.ntpShort).toMatch(/^0x[0-9A-F]{8}$/);
  });

  it('ntpLong is 18 chars (0x + 16 hex)', () => {
    const result = convertNtp('1700000000');
    expect(result.ntpLong).toMatch(/^0x[0-9A-F]{16}$/);
  });

  it('epochDiff is always NTP_UNIX_OFFSET', () => {
    const result = convertNtp('1700000000');
    expect(result.epochDiff).toBe(NTP_UNIX_OFFSET);
  });
});

describe('formatNtpResult', () => {
  it('includes NTP and Unix timestamps in output', () => {
    const result = convertNtp('1700000000');
    const formatted = formatNtpResult(result);
    expect(formatted).toContain('NTP Timestamp');
    expect(formatted).toContain('Unix Timestamp');
    expect(formatted).toContain('UTC Date/Time');
  });

  it('includes epoch info', () => {
    const result = convertNtp('1700000000');
    const formatted = formatNtpResult(result);
    expect(formatted).toContain('NTP Epoch');
    expect(formatted).toContain('Unix Epoch');
  });
});
