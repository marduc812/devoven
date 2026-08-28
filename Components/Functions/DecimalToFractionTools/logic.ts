// Decimal to Fraction converter

export type FractionResult = {
  numerator: number;
  denominator: number;
  simplified: string;
  percentage: string;
  ratio: string;
  continuedFraction: number[];
  continuedFractionStr: string;
  isRepeating: boolean;
  decimal: number;
};

export function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b !== 0) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

function simplify(num: number, den: number): [number, number] {
  if (den === 0) throw new Error('Denominator cannot be zero');
  const g = gcd(Math.abs(num), Math.abs(den));
  let n = num / g;
  let d = den / g;
  if (d < 0) { n = -n; d = -d; }
  return [n, d];
}

export function decimalToFraction(input: string): FractionResult {
  const trimmed = input.trim();
  if (!trimmed) throw new Error('Empty input');

  let decimalValue = parseFloat(trimmed);
  if (isNaN(decimalValue)) throw new Error('Invalid decimal number');

  const negative = decimalValue < 0;
  const absVal = Math.abs(decimalValue);

  // Detect repeating decimal via string analysis
  const str = trimmed.replace(/^-/, '');
  const dotIdx = str.indexOf('.');
  let num: number;
  let den: number;
  let isRepeating = false;

  if (dotIdx === -1) {
    // Integer
    num = Math.round(absVal);
    den = 1;
  } else {
    // Check for repeating pattern in string (e.g. 0.333... or 0.142857142857)
    const fracPart = str.slice(dotIdx + 1);
    const repeat = detectRepeat(fracPart);

    if (repeat) {
      isRepeating = true;
      const nonRepeating = fracPart.slice(0, fracPart.indexOf(repeat));
      // Formula: if X = A.BCD... where CD... repeats
      // X = (A*BC...CD - A*B) / (9...9 0...0) where 9s = length of repeat, 0s = length of non-repeat
      const intPart = Math.round(parseInt(str.slice(0, dotIdx), 10));
      const nonRepLen = nonRepeating.length;
      const repLen = repeat.length;
      const nines = parseInt('9'.repeat(repLen) + '0'.repeat(nonRepLen), 10);
      const full = parseInt(nonRepeating + repeat, 10);
      const nonRep = nonRepLen > 0 ? parseInt(nonRepeating, 10) : 0;
      const wholeNum = intPart * nines + full - nonRep;
      [num, den] = simplify(wholeNum, nines);
    } else {
      // Finite decimal: multiply by 10^decimals
      const decimalPlaces = fracPart.length;
      const scale = Math.pow(10, decimalPlaces);
      const rounded = Math.round(absVal * scale);
      [num, den] = simplify(rounded, scale);
    }
  }

  if (negative) num = -num;

  const [sNum, sDen] = simplify(num, den);
  const simplified = sDen === 1 ? `${sNum}` : `${sNum}/${sDen}`;
  const percentage = (decimalValue * 100).toFixed(4).replace(/\.?0+$/, '') + '%';
  const ratio = `${sNum}:${sDen}`;
  const cf = continuedFraction(Math.abs(decimalValue));

  return {
    numerator: sNum,
    denominator: sDen,
    simplified,
    percentage,
    ratio,
    continuedFraction: cf,
    continuedFractionStr: formatContinuedFraction(cf),
    isRepeating,
    decimal: decimalValue,
  };
}

function detectRepeat(fracStr: string): string | null {
  // Try to find repeating block in fractional digits
  const maxLen = Math.floor(fracStr.length / 2);
  for (let len = 1; len <= maxLen; len++) {
    const candidate = fracStr.slice(0, len);
    // Check if the string is composed of repetitions of candidate
    let ok = true;
    for (let i = 0; i < fracStr.length; i++) {
      if (fracStr[i] !== candidate[i % len]) {
        ok = false;
        break;
      }
    }
    if (ok && fracStr.length >= len * 2) return candidate;
  }
  return null;
}

export function continuedFraction(x: number, maxTerms: number = 10): number[] {
  const terms: number[] = [];
  for (let i = 0; i < maxTerms; i++) {
    const a = Math.floor(x);
    terms.push(a);
    const frac = x - a;
    if (frac < 1e-10) break;
    x = 1 / frac;
  }
  return terms;
}

function formatContinuedFraction(terms: number[]): string {
  if (terms.length === 0) return '[]';
  if (terms.length === 1) return `[${terms[0]}]`;
  return `[${terms[0]}; ${terms.slice(1).join(', ')}]`;
}

export function formatFractionResult(result: FractionResult): string {
  const lines: string[] = [
    `Fraction:            ${result.simplified}`,
    `Numerator:           ${result.numerator}`,
    `Denominator:         ${result.denominator}`,
    `Percentage:          ${result.percentage}`,
    `Ratio:               ${result.ratio}`,
    `Continued Fraction:  ${result.continuedFractionStr}`,
  ];
  if (result.isRepeating) {
    lines.push(`Note:                Repeating decimal detected`);
  }
  return lines.join('\n');
}
