// Pure TypeScript — no browser APIs, no React.
// Extended Euclidean Algorithm: find x, y such that ax + by = gcd(a, b)

export interface ExtGcdResult {
  a: number;
  b: number;
  gcd: number;
  x: number;
  y: number;
  steps: string[];
}

export function extendedGcd(a: number, b: number): { gcd: number; x: number; y: number } {
  if (b === 0) return { gcd: a, x: 1, y: 0 };
  const { gcd, x: x1, y: y1 } = extendedGcd(b, a % b);
  return { gcd, x: y1, y: x1 - Math.floor(a / b) * y1 };
}

export function buildSteps(a: number, b: number): string[] {
  const steps: string[] = [];
  let r0 = a, r1 = b;
  let s0 = 1, s1 = 0;
  let t0 = 0, t1 = 1;

  while (r1 !== 0) {
    const q = Math.floor(r0 / r1);
    const r2 = r0 - q * r1;
    const s2 = s0 - q * s1;
    const t2 = t0 - q * t1;

    steps.push(`${r0} = ${q} × ${r1} + ${r2}  (s=${s2}, t=${t2})`);

    r0 = r1; r1 = r2;
    s0 = s1; s1 = s2;
    t0 = t1; t1 = t2;
  }

  return steps;
}

export function calculateExtendedGcd(input: string): string {
  const parts = input.trim().split(/[\s,]+/);
  if (parts.length < 2) throw new Error('Enter two integers separated by space or comma');

  const a = parseInt(parts[0], 10);
  const b = parseInt(parts[1], 10);

  if (isNaN(a) || isNaN(b)) throw new Error('Both values must be integers');
  if (a === 0 && b === 0) throw new Error('Both numbers cannot be zero');
  if (Math.abs(a) > 9999999999 || Math.abs(b) > 9999999999) throw new Error('Numbers too large (max 10 digits)');

  const absA = Math.abs(a), absB = Math.abs(b);
  const { gcd, x, y } = extendedGcd(absA, absB);

  // Adjust signs for original inputs
  const xFinal = a < 0 ? -x : x;
  const yFinal = b < 0 ? -y : y;

  const steps = buildSteps(absA, absB);

  const lines = [
    `a = ${a}`,
    `b = ${b}`,
    `GCD(${a}, ${b}) = ${gcd}`,
    '',
    `Bézout coefficients:`,
    `  x = ${xFinal}`,
    `  y = ${yFinal}`,
    `  Verification: ${a}×(${xFinal}) + ${b}×(${yFinal}) = ${a * xFinal + b * yFinal}`,
    '',
    `Modular inverses:`,
  ];

  if (gcd === 1) {
    const invA = ((xFinal % absB) + absB) % absB;
    const invB = ((yFinal % absA) + absA) % absA;
    lines.push(`  ${a} mod ${Math.abs(b)} inverse: ${invA}`);
    lines.push(`  ${b} mod ${Math.abs(a)} inverse: ${invB}`);
  } else {
    lines.push(`  No modular inverse (GCD ≠ 1)`);
  }

  if (steps.length > 0) {
    lines.push('');
    lines.push('Euclidean steps:');
    steps.forEach((s, i) => lines.push(`  Step ${i + 1}: ${s}`));
  }

  return lines.join('\n');
}
