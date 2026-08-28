export function toScientific(n: number, precision = 4): string {
  return n.toExponential(precision);
}

export function toEngineering(n: number): string {
  if (n === 0) return '0';
  const exp = Math.floor(Math.log10(Math.abs(n)));
  const engExp = Math.floor(exp / 3) * 3;
  const mantissa = n / Math.pow(10, engExp);
  return `${mantissa.toPrecision(4)} × 10^${engExp}`;
}

/** Drop trailing zeros, but only the ones behind a decimal point. */
function trimZeros(s: string): string {
  return s.includes('.') ? s.replace(/\.?0+$/, '') : s;
}

const SI_LARGE = ['', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
const SI_SMALL = ['', 'm', 'µ', 'n', 'p', 'f', 'a', 'z', 'y'];

export function formatWithSI(n: number): string {
  if (n === 0) return '0';
  if (!isFinite(n)) return n.toString();

  const neg = n < 0;
  const abs = Math.abs(n);
  const sign = neg ? '-' : '';

  if (abs >= 1000) {
    const exp = Math.min(Math.floor(Math.log10(abs) / 3), SI_LARGE.length - 1);
    const scaled = abs / Math.pow(10, exp * 3);
    return `${sign}${trimZeros(scaled.toPrecision(4))}${SI_LARGE[exp]}`;
  }

  if (abs < 1) {
    const exp = Math.min(Math.ceil(-Math.log10(abs) / 3), SI_SMALL.length - 1);
    const scaled = abs * Math.pow(10, exp * 3);
    return `${sign}${trimZeros(scaled.toPrecision(4))}${SI_SMALL[exp]}`;
  }

  return n.toString();
}

export const LOCALES = ['en-US', 'en-GB', 'de-DE', 'fr-FR', 'ja-JP', 'ar-SA'] as const;
export type Locale = (typeof LOCALES)[number];

function resolveLocale(locale: string): string {
  return (LOCALES as readonly string[]).includes(locale) ? locale : 'en-US';
}

export interface NumberFormat {
  group: 'Locale' | 'Notation' | 'Radix';
  label: string;
  value: string;
  /** Short explanation shown under the value, or why it does not apply. */
  note: string;
  available: boolean;
}

/** The separators a locale uses, which is usually the surprising part. */
export function localeSeparators(locale: string): { group: string; decimal: string } {
  const parts = new Intl.NumberFormat(resolveLocale(locale)).formatToParts(12345.6);
  return {
    group: parts.find((p) => p.type === 'group')?.value ?? '',
    decimal: parts.find((p) => p.type === 'decimal')?.value ?? '',
  };
}

export function parseNumber(input: string): number {
  const n = parseFloat(input.replace(/[,\s]/g, ''));
  if (isNaN(n)) throw new Error('Invalid number');
  return n;
}

/**
 * True when the input carries more integer digits than a double can hold, so
 * every representation below is a rounded stand-in for what was typed.
 */
export function losesPrecision(input: string, n: number): boolean {
  return Number.isInteger(n) && Math.abs(n) > Number.MAX_SAFE_INTEGER;
}

export function numberFormats(input: string, locale = 'en-US'): NumberFormat[] {
  const n = parseNumber(input);
  const loc = resolveLocale(locale);
  const isInt = Number.isInteger(n);
  const isNonNegativeInt = isInt && n >= 0;

  const radixNote = !isInt
    ? 'integers only'
    : n < 0
      ? 'non-negative integers only'
      : '';

  return [
    {
      group: 'Locale',
      label: 'Standard',
      value: n.toLocaleString(loc),
      note: `grouped for ${loc}`,
      available: true,
    },
    {
      group: 'Locale',
      label: 'No decimals',
      value: Math.round(n).toLocaleString(loc),
      note: 'rounded to a whole number',
      available: true,
    },
    {
      group: 'Locale',
      label: '2 decimals',
      value: n.toLocaleString(loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      note: 'fixed two places',
      available: true,
    },
    {
      group: 'Locale',
      label: 'Compact',
      value: n.toLocaleString(loc, { notation: 'compact', maximumFractionDigits: 2 }),
      note: 'short form for labels',
      available: true,
    },
    {
      group: 'Locale',
      label: 'Percent',
      value: n.toLocaleString(loc, { style: 'percent', maximumFractionDigits: 2 }),
      note: 'read as a fraction of 1',
      available: true,
    },
    {
      group: 'Notation',
      label: 'Scientific',
      value: toScientific(n),
      note: 'mantissa × 10^exponent',
      available: true,
    },
    {
      group: 'Notation',
      label: 'Engineering',
      value: toEngineering(n),
      note: 'exponent a multiple of 3',
      available: true,
    },
    {
      group: 'Notation',
      label: 'SI suffix',
      value: formatWithSI(n),
      note: 'metric prefix',
      available: true,
    },
    {
      group: 'Radix',
      label: 'Binary',
      value: isInt ? n.toString(2) : 'N/A (decimal)',
      note: radixNote || 'base 2',
      available: isInt,
    },
    {
      group: 'Radix',
      label: 'Hex',
      value: isNonNegativeInt ? '0x' + n.toString(16).toUpperCase() : 'N/A',
      note: radixNote || 'base 16',
      available: isNonNegativeInt,
    },
    {
      group: 'Radix',
      label: 'Octal',
      value: isNonNegativeInt ? '0o' + n.toString(8) : 'N/A',
      note: radixNote || 'base 8',
      available: isNonNegativeInt,
    },
  ];
}
