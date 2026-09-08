import {
  parseObjectId,
  formatObjectId,
  objectIdForDate,
  parseFileTime,
  formatFileTime,
  toFileTime,
  FILETIME_EPOCH_OFFSET,
} from '@/Components/Functions/TimestampIdTools/logic';

describe('parseObjectId', () => {
  it('reads the timestamp out of the leading four bytes', () => {
    const info = parseObjectId('507f1f77bcf86cd799439011');
    expect(info.unixSeconds).toBe(0x507f1f77);
    expect(info.date.toISOString()).toBe('2012-10-17T21:13:27.000Z');
  });

  it('splits the rest into the current and the legacy reading', () => {
    const info = parseObjectId('507f1f77bcf86cd799439011');
    expect(info.randomHex).toBe('bcf86cd799');
    expect(info.counter).toBe(0x439011);
    expect(info.legacy.machineHex).toBe('bcf86c');
    expect(info.legacy.processId).toBe(0xd799);
  });

  it('accepts the shell wrapper and mixed case', () => {
    expect(parseObjectId('ObjectId("507F1F77BCF86CD799439011")').hex)
      .toBe('507f1f77bcf86cd799439011');
    expect(parseObjectId("  ObjectId('507f1f77bcf86cd799439011')  ").unixSeconds)
      .toBe(0x507f1f77);
  });

  it('rejects anything that is not 24 hex characters', () => {
    expect(() => parseObjectId('507f1f77')).toThrow('24 hex characters');
    expect(() => parseObjectId('507f1f77bcf86cd7994390zz')).toThrow('24 hex characters');
  });

  it('formats a report with every field', () => {
    const text = formatObjectId(parseObjectId('507f1f77bcf86cd799439011'));
    expect(text).toContain('2012-10-17T21:13:27.000Z');
    expect(text).toContain('Process ID: 55193');
  });
});

describe('objectIdForDate', () => {
  it('builds the lowest ObjectId for an ISO date', () => {
    expect(objectIdForDate('2012-10-17T21:13:27.000Z')).toBe('507f1f770000000000000000');
  });

  it('accepts Unix seconds and milliseconds', () => {
    expect(objectIdForDate('1350508407')).toBe('507f1f770000000000000000');
    expect(objectIdForDate('1350508407000')).toBe('507f1f770000000000000000');
  });

  it('round-trips through the parser', () => {
    const id = objectIdForDate('2024-01-01T00:00:00.000Z');
    expect(parseObjectId(id).date.toISOString()).toBe('2024-01-01T00:00:00.000Z');
  });

  it('refuses a date the four bytes cannot hold', () => {
    expect(() => objectIdForDate('2200-01-01T00:00:00Z')).toThrow('1970 to 2106');
    expect(() => objectIdForDate('1900-01-01T00:00:00Z')).toThrow('1970 to 2106');
  });

  it('refuses text that is not a date', () => {
    expect(() => objectIdForDate('not a date')).toThrow('Cannot read');
    expect(() => objectIdForDate('   ')).toThrow('Enter a date');
  });
});

describe('parseFileTime', () => {
  it('converts the epoch offset itself to 1970', () => {
    const info = parseFileTime(String(FILETIME_EPOCH_OFFSET));
    expect(info.date.toISOString()).toBe('1970-01-01T00:00:00.000Z');
    expect(info.beforeUnixEpoch).toBe(false);
  });

  it('reads a real value', () => {
    const info = parseFileTime('132537600000000000');
    expect(info.date.toISOString()).toBe('2020-12-30T00:00:00.000Z');
  });

  it('accepts hex, separators and the high/low pair', () => {
    const decimal = parseFileTime('132537600000000000').ticks;
    expect(parseFileTime('0x1D6DE3EB7620000').ticks).toBe(decimal);
    expect(parseFileTime('132_537_600_000_000_000').ticks).toBe(decimal);
    expect(parseFileTime('132,537,600,000,000,000').ticks).toBe(decimal);
    expect(parseFileTime('30858814 3076653056').ticks).toBe(decimal);
  });

  it('flags an unset and a pre-1970 value', () => {
    expect(formatFileTime(parseFileTime('0'))).toContain('an unset FILETIME');
    expect(formatFileTime(parseFileTime('1000000000'))).toContain('Before 1970');
  });

  it('rejects nonsense and out-of-range values', () => {
    expect(() => parseFileTime('hello')).toThrow('Not a FILETIME');
    expect(() => parseFileTime('')).toThrow('Enter a FILETIME');
    expect(() => parseFileTime('99999999999999999999999')).toThrow('64-bit value');
    expect(() => parseFileTime('99999999999 1')).toThrow('32-bit value');
  });
});

describe('toFileTime', () => {
  it('is the inverse of parseFileTime', () => {
    const ticks = toFileTime('2020-12-30T00:00:00.000Z').split('\n')[0];
    expect(ticks).toContain('132537600000000000');
    expect(parseFileTime('132537600000000000').date.toISOString())
      .toBe('2020-12-30T00:00:00.000Z');
  });

  it('shows the hex and the high/low split', () => {
    const text = toFileTime('1970-01-01T00:00:00Z');
    expect(text).toContain('116444736000000000');
    expect(text).toContain('0x');
  });

  it('refuses a date before 1601', () => {
    expect(() => toFileTime('1500-01-01T00:00:00Z')).toThrow('outside the range');
  });
});
