// Pure TypeScript — no browser APIs, no React.

export interface Fraction {
  num: number;
  den: number;
}

function gcd(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { const t = b; b = a % b; a = t; }
  return a;
}

export function reduceFraction(f: Fraction): Fraction {
  if (f.den === 0) throw new Error('Denominator cannot be zero');
  const g = gcd(Math.abs(f.num), Math.abs(f.den));
  const sign = f.den < 0 ? -1 : 1;
  return { num: sign * f.num / g, den: Math.abs(f.den) / g };
}

function parseFraction(s: string): Fraction {
  const trimmed = s.trim();
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    if (parts.length !== 2) throw new Error(`Invalid fraction: ${s}`);
    const num = parseInt(parts[0].trim(), 10);
    const den = parseInt(parts[1].trim(), 10);
    if (isNaN(num) || isNaN(den)) throw new Error(`Invalid fraction: ${s}`);
    if (den === 0) throw new Error('Denominator cannot be zero');
    return { num, den };
  }
  const n = parseInt(trimmed, 10);
  if (isNaN(n)) throw new Error(`Invalid number: ${s}`);
  return { num: n, den: 1 };
}

export function addFractions(a: Fraction, b: Fraction): Fraction {
  return reduceFraction({ num: a.num * b.den + b.num * a.den, den: a.den * b.den });
}

export function subtractFractions(a: Fraction, b: Fraction): Fraction {
  return reduceFraction({ num: a.num * b.den - b.num * a.den, den: a.den * b.den });
}

export function multiplyFractions(a: Fraction, b: Fraction): Fraction {
  return reduceFraction({ num: a.num * b.num, den: a.den * b.den });
}

export function divideFractions(a: Fraction, b: Fraction): Fraction {
  if (b.num === 0) throw new Error('Cannot divide by zero');
  return reduceFraction({ num: a.num * b.den, den: a.den * b.num });
}

function fractionToString(f: Fraction): string {
  if (f.den === 1) return String(f.num);
  return `${f.num}/${f.den}`;
}

function lcm(a: number, b: number): number {
  const g = gcd(a, b);
  return g === 0 ? 0 : Math.abs(a * b) / g;
}

export function calculateFraction(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  // Parse: support + - * /
  const tokenRegex = /(-?\d+(?:\/\d+)?|\+|-|\*|\/)/g;
  const tokens = trimmed.match(tokenRegex);
  if (!tokens) throw new Error('Invalid expression');

  // Collect fractions and operators
  const fracs: Fraction[] = [];
  const ops: string[] = [];
  let i = 0;
  while (i < tokens.length) {
    const tok = tokens[i];
    // Handle unary minus at start
    if (i === 0 && tok === '-') {
      i++;
      const next = tokens[i];
      if (!next) throw new Error('Invalid expression');
      const f = parseFraction(next);
      fracs.push({ num: -f.num, den: f.den });
      i++;
      continue;
    }
    if (tok === '+' || tok === '-' || tok === '*' || tok === '/') {
      ops.push(tok);
      i++;
    } else {
      fracs.push(parseFraction(tok));
      i++;
    }
  }

  if (fracs.length === 0) throw new Error('No fractions found');
  if (fracs.length !== ops.length + 1) throw new Error('Expression format: fraction op fraction (e.g. 3/4 + 1/6)');
  if (fracs.length > 2) throw new Error('Only binary operations supported (e.g. 3/4 + 1/6)');

  const a = fracs[0];
  const b = fracs[1];
  const op = ops[0];

  const lines: string[] = [];
  lines.push(`Expression: ${fractionToString(a)} ${op} ${fractionToString(b)}`);
  lines.push('');

  let result: Fraction;

  if (op === '+' || op === '-') {
    const lcd = lcm(a.den, b.den);
    const aConv: Fraction = { num: a.num * (lcd / a.den), den: lcd };
    const bConv: Fraction = { num: b.num * (lcd / b.den), den: lcd };
    lines.push(`Step 1 — Find LCD: LCD(${a.den}, ${b.den}) = ${lcd}`);
    lines.push(`Step 2 — Convert:  ${fractionToString(a)} = ${fractionToString(aConv)}`);
    lines.push(`                   ${fractionToString(b)} = ${fractionToString(bConv)}`);
    const combined: Fraction = op === '+' ? addFractions(a, b) : subtractFractions(a, b);
    const beforeReduce: Fraction = { num: op === '+' ? aConv.num + bConv.num : aConv.num - bConv.num, den: lcd };
    lines.push(`Step 3 — Operate:  ${fractionToString(aConv)} ${op} ${fractionToString(bConv)} = ${fractionToString(beforeReduce)}`);
    result = combined;
    if (beforeReduce.num !== combined.num || beforeReduce.den !== combined.den) {
      lines.push(`Step 4 — Reduce:   ${fractionToString(beforeReduce)} = ${fractionToString(combined)}`);
    }
  } else if (op === '*') {
    lines.push(`Step 1 — Multiply numerators:   ${a.num} × ${b.num} = ${a.num * b.num}`);
    lines.push(`Step 2 — Multiply denominators: ${a.den} × ${b.den} = ${a.den * b.den}`);
    const before: Fraction = { num: a.num * b.num, den: a.den * b.den };
    result = multiplyFractions(a, b);
    if (before.num !== result.num || before.den !== result.den) {
      lines.push(`Step 3 — Reduce:   ${fractionToString(before)} = ${fractionToString(result)}`);
    }
  } else {
    // division
    const recip: Fraction = { num: b.den, den: b.num };
    lines.push(`Step 1 — Reciprocal of ${fractionToString(b)}: ${fractionToString(recip)}`);
    lines.push(`Step 2 — Multiply: ${fractionToString(a)} × ${fractionToString(recip)}`);
    const before: Fraction = { num: a.num * recip.num, den: a.den * recip.den };
    result = divideFractions(a, b);
    lines.push(`Step 3 — Compute:  ${a.num} × ${recip.num} / (${a.den} × ${recip.den}) = ${fractionToString(before)}`);
    if (before.num !== result.num || before.den !== result.den) {
      lines.push(`Step 4 — Reduce:   ${fractionToString(before)} = ${fractionToString(result)}`);
    }
  }

  lines.push('');
  lines.push(`Result: ${fractionToString(result)}`);
  const decimal = result.num / result.den;
  lines.push(`Decimal: ${Number.isInteger(decimal) ? decimal : decimal.toFixed(8).replace(/\.?0+$/, '')}`);

  const g = gcd(Math.abs(result.num), result.den);
  if (g > 1 || result.den === 1) {
    lines.push(`Reduced form: ${fractionToString(result)}`);
  }

  return lines.join('\n');
}
