// SI Prefix Converter — pure logic, no browser APIs

export type SiPrefix = {
  name: string;
  symbol: string;
  exponent: number;
};

export const SI_PREFIXES: SiPrefix[] = [
  { name: 'yotta', symbol: 'Y',  exponent:  24 },
  { name: 'zetta', symbol: 'Z',  exponent:  21 },
  { name: 'exa',   symbol: 'E',  exponent:  18 },
  { name: 'peta',  symbol: 'P',  exponent:  15 },
  { name: 'tera',  symbol: 'T',  exponent:  12 },
  { name: 'giga',  symbol: 'G',  exponent:   9 },
  { name: 'mega',  symbol: 'M',  exponent:   6 },
  { name: 'kilo',  symbol: 'k',  exponent:   3 },
  { name: 'hecto', symbol: 'h',  exponent:   2 },
  { name: 'deca',  symbol: 'da', exponent:   1 },
  { name: '(none)', symbol: '',  exponent:   0 },
  { name: 'deci',  symbol: 'd',  exponent:  -1 },
  { name: 'centi', symbol: 'c',  exponent:  -2 },
  { name: 'milli', symbol: 'm',  exponent:  -3 },
  { name: 'micro', symbol: 'μ',  exponent:  -6 },
  { name: 'nano',  symbol: 'n',  exponent:  -9 },
  { name: 'pico',  symbol: 'p',  exponent: -12 },
  { name: 'femto', symbol: 'f',  exponent: -15 },
  { name: 'atto',  symbol: 'a',  exponent: -18 },
  { name: 'zepto', symbol: 'z',  exponent: -21 },
  { name: 'yocto', symbol: 'y',  exponent: -24 },
];

export function convertSiPrefix(value: number, fromExp: number, toExp: number): number {
  const diff = fromExp - toExp;
  return value * Math.pow(10, diff);
}

export type ConvertSiPrefixResult = {
  inputValue: number;
  outputValue: number;
  fromPrefix: SiPrefix;
  toPrefix: SiPrefix;
  unit: string;
  fromFormatted: string;
  toFormatted: string;
};

/** Parse and convert user input like "1000 MHz to GHz" or "1 km to mm"
 *  Flexible parser: handles symbol or name for prefixes.
 */
export function parseSiPrefixConversion(input: string): ConvertSiPrefixResult {
  const trimmed = input.trim();
  if (!trimmed) throw new Error('Enter a value such as "1000 MHz to GHz"');

  // Try pattern: <number> <fromPrefix><unit> to <toPrefix>[unit]
  // e.g.  1000 MHz to GHz
  //       1 km to mm
  //       500 mV to kV
  const match = trimmed.match(/^([+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\s+(\S+)\s+to\s+(\S+)$/i);
  if (!match) {
    throw new Error('Format: <number> <fromPrefixUnit> to <toPrefixUnit>. Example: "1000 MHz to GHz"');
  }

  const rawValue = parseFloat(match[1]);
  const fromStr = match[2];
  const toStr = match[3];

  if (isNaN(rawValue)) throw new Error('Invalid number');

  // Attempt to extract prefix + unit from a combined string like "MHz"
  function splitPrefixUnit(s: string): { prefix: SiPrefix; unit: string } {
    // Try two-char symbol first (da)
    for (const p of SI_PREFIXES) {
      if (p.symbol === '') continue;
      if (s.startsWith(p.symbol)) {
        return { prefix: p, unit: s.slice(p.symbol.length) };
      }
    }
    // No prefix match — use base (exponent 0)
    const base = SI_PREFIXES.find(p => p.exponent === 0);
    return { prefix: base!, unit: s };
  }

  const { prefix: fromPrefix, unit: fromUnit } = splitPrefixUnit(fromStr);
  const { prefix: toPrefix, unit: toUnit } = splitPrefixUnit(toStr);

  // Units should match (ignoring case), but we'll just warn if different
  const unit = fromUnit || toUnit;

  const outputValue = convertSiPrefix(rawValue, fromPrefix.exponent, toPrefix.exponent);

  function fmt(v: number, pfx: SiPrefix, u: string): string {
    let s = '';
    if (Math.abs(v) >= 1e-3 && Math.abs(v) < 1e15) {
      s = parseFloat(v.toPrecision(10)).toString();
    } else {
      s = v.toExponential(6);
    }
    return `${s} ${pfx.symbol}${u}`.trim();
  }

  return {
    inputValue: rawValue,
    outputValue,
    fromPrefix,
    toPrefix,
    unit,
    fromFormatted: fmt(rawValue, fromPrefix, fromUnit),
    toFormatted: fmt(outputValue, toPrefix, toUnit),
  };
}
