import {
  toScientific,
  toEngineering,
  formatWithSI,
  numberFormats,
  localeSeparators,
  losesPrecision,
  parseNumber,
} from '../Components/Functions/NumberFormatAdvancedTools/logic';

// ─── toScientific ─────────────────────────────────────────────────────────────

describe('toScientific', () => {
  it('formats a large number in scientific notation', () => {
    expect(toScientific(1234567)).toBe('1.2346e+6');
  });

  it('formats with custom precision', () => {
    expect(toScientific(1234567, 2)).toBe('1.23e+6');
  });

  it('handles small numbers', () => {
    expect(toScientific(0.00123, 2)).toBe('1.23e-3');
  });

  it('handles zero', () => {
    expect(toScientific(0, 4)).toBe('0.0000e+0');
  });

  it('handles negative numbers', () => {
    const result = toScientific(-1000, 2);
    expect(result).toBe('-1.00e+3');
  });
});

// ─── toEngineering ────────────────────────────────────────────────────────────

describe('toEngineering', () => {
  it('returns "0" for zero', () => {
    expect(toEngineering(0)).toBe('0');
  });

  it('uses exponents that are multiples of 3', () => {
    const result = toEngineering(1234567);
    expect(result).toContain('× 10^6');
  });

  it('handles 1000 (10^3)', () => {
    const result = toEngineering(1000);
    expect(result).toContain('× 10^3');
  });

  it('handles small numbers < 1000', () => {
    const result = toEngineering(500);
    expect(result).toContain('× 10^0');
  });

  it('handles negative numbers', () => {
    const result = toEngineering(-1000000);
    expect(result).toContain('-');
    expect(result).toContain('× 10^6');
  });
});

// ─── formatWithSI ─────────────────────────────────────────────────────────────

describe('formatWithSI', () => {
  it('returns plain number for values < 1000', () => {
    expect(formatWithSI(999)).toBe('999');
  });

  it('uses k suffix for thousands', () => {
    expect(formatWithSI(1000)).toContain('k');
  });

  it('uses M suffix for millions', () => {
    expect(formatWithSI(1_000_000)).toContain('M');
  });

  it('uses G suffix for billions', () => {
    expect(formatWithSI(1_000_000_000)).toContain('G');
  });

  it('handles negative numbers', () => {
    expect(formatWithSI(-5000)).toContain('-');
    expect(formatWithSI(-5000)).toContain('k');
  });

  it('returns 0 for zero', () => {
    expect(formatWithSI(0)).toBe('0');
  });
});

// ─── formatWithSI, trailing zeros ─────────────────────────────────────────────
// The zero strip used to run on the whole string, so a scaled mantissa of
// "1000" lost its zeros and 1e21 came back as "1E".

describe('formatWithSI trailing zeros', () => {
  it('keeps the zeros of a whole mantissa past the largest prefix', () => {
    expect(formatWithSI(1e27)).toBe('1000Y');
  });

  it('still trims zeros behind the decimal point', () => {
    expect(formatWithSI(1500)).toBe('1.5k');
  });

  it('carries into the next prefix rather than dropping digits', () => {
    expect(formatWithSI(1e15)).toBe('1P');
  });

  it('handles a mantissa of exactly 100', () => {
    expect(formatWithSI(1e5)).toBe('100k');
  });
});

// ─── formatWithSI, small values ───────────────────────────────────────────────

describe('formatWithSI below 1', () => {
  it('uses milli', () => expect(formatWithSI(0.5)).toBe('500m'));
  it('uses micro', () => expect(formatWithSI(0.0000005)).toBe('500n'));
  it('leaves values between 1 and 1000 alone', () => expect(formatWithSI(3.14)).toBe('3.14'));
  it('keeps the sign on a small negative', () => expect(formatWithSI(-0.5)).toBe('-500m'));
});

// ─── parseNumber ──────────────────────────────────────────────────────────────

describe('parseNumber', () => {
  it('strips grouping commas', () => expect(parseNumber('1,000,000')).toBe(1000000));
  it('strips spaces', () => expect(parseNumber('1 000')).toBe(1000));
  it('throws on text', () => expect(() => parseNumber('abc')).toThrow('Invalid number'));
});

// ─── numberFormats ────────────────────────────────────────────────────────────

describe('numberFormats', () => {
  it('groups every entry under Locale, Notation or Radix', () => {
    const groups = new Set(numberFormats('255').map((f) => f.group));
    expect([...groups].sort()).toEqual(['Locale', 'Notation', 'Radix']);
  });

  it('marks the radix entries available for a non-negative integer', () => {
    const radix = numberFormats('255').filter((f) => f.group === 'Radix');
    expect(radix.every((f) => f.available)).toBe(true);
    expect(radix.find((f) => f.label === 'Hex')!.value).toBe('0xFF');
  });

  it('marks the radix entries unavailable for a decimal', () => {
    const radix = numberFormats('3.14').filter((f) => f.group === 'Radix');
    expect(radix.every((f) => !f.available)).toBe(true);
  });

  it('allows binary but not hex for a negative integer', () => {
    const radix = numberFormats('-8').filter((f) => f.group === 'Radix');
    expect(radix.find((f) => f.label === 'Binary')!.available).toBe(true);
    expect(radix.find((f) => f.label === 'Hex')!.available).toBe(false);
  });

  it('respects the locale for the standard form', () => {
    expect(numberFormats('1234.5', 'de-DE').find((f) => f.label === 'Standard')!.value).toBe(
      (1234.5).toLocaleString('de-DE'),
    );
  });

  it('falls back to en-US for an unknown locale', () => {
    expect(numberFormats('1234.5', 'xx-XX').find((f) => f.label === 'Standard')!.value).toBe(
      (1234.5).toLocaleString('en-US'),
    );
  });

  it('throws on text', () => expect(() => numberFormats('abc')).toThrow('Invalid number'));
});

// ─── localeSeparators ─────────────────────────────────────────────────────────

describe('localeSeparators', () => {
  it('reports a dot decimal for en-US', () => {
    expect(localeSeparators('en-US').decimal).toBe('.');
  });

  it('reports a comma decimal for de-DE', () => {
    expect(localeSeparators('de-DE').decimal).toBe(',');
  });

  it('swaps the two between en-US and de-DE', () => {
    const us = localeSeparators('en-US');
    const de = localeSeparators('de-DE');
    expect(de.decimal).toBe(us.group);
  });
});

// ─── losesPrecision ───────────────────────────────────────────────────────────

describe('losesPrecision', () => {
  it('is false for a small integer', () => expect(losesPrecision('255', 255)).toBe(false));
  it('is false at the safe integer limit', () =>
    expect(losesPrecision('9007199254740991', Number.MAX_SAFE_INTEGER)).toBe(false));
  it('is true past the safe integer limit', () =>
    expect(losesPrecision('99999999999999999', 1e17)).toBe(true));
  it('is false for a decimal', () => expect(losesPrecision('3.14', 3.14)).toBe(false));
});
