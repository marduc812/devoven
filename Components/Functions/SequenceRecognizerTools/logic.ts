export interface PatternMatch {
  name: string;
  formula: string;
  confidence: 'exact' | 'approximate';
  nextTerms: number[];
}

export interface SequenceAnalysis {
  terms: number[];
  patterns: PatternMatch[];
  primaryPattern: PatternMatch | null;
}

function allClose(values: number[], tolerance: number): boolean {
  if (values.length === 0) return false;
  const first = values[0];
  return values.every(v => Math.abs(v - first) <= tolerance);
}

function isArithmetic(terms: number[]): PatternMatch | null {
  if (terms.length < 2) return null;
  const diffs: number[] = [];
  for (let i = 1; i < terms.length; i++) diffs.push(terms[i] - terms[i - 1]);
  if (!allClose(diffs, 1e-9)) return null;
  const d = diffs[0];
  const a = terms[0];
  const next: number[] = [];
  for (let i = 1; i <= 5; i++) next.push(terms[terms.length - 1] + d * i);
  return {
    name: 'Arithmetic Progression',
    formula: `a(n) = ${a} + ${d}·(n−1)  [d = ${d}]`,
    confidence: 'exact',
    nextTerms: next,
  };
}

function isGeometric(terms: number[]): PatternMatch | null {
  if (terms.length < 2) return null;
  if (terms.some(t => t === 0)) return null;
  const ratios: number[] = [];
  for (let i = 1; i < terms.length; i++) ratios.push(terms[i] / terms[i - 1]);
  if (!allClose(ratios, 1e-9)) return null;
  const r = ratios[0];
  const a = terms[0];
  const last = terms[terms.length - 1];
  const next: number[] = [];
  for (let i = 1; i <= 5; i++) next.push(last * Math.pow(r, i));
  return {
    name: 'Geometric Progression',
    formula: `a(n) = ${a} · ${r}^(n−1)  [r = ${r}]`,
    confidence: 'exact',
    nextTerms: next,
  };
}

function isFibonacciLike(terms: number[]): PatternMatch | null {
  if (terms.length < 3) return null;
  for (let i = 2; i < terms.length; i++) {
    if (Math.abs(terms[i] - (terms[i - 1] + terms[i - 2])) > 1e-9) return null;
  }
  const a = terms[0];
  const b = terms[1];
  const next: number[] = [];
  let prev1 = terms[terms.length - 2];
  let prev2 = terms[terms.length - 1];
  for (let i = 0; i < 5; i++) {
    const n = prev1 + prev2;
    next.push(n);
    prev1 = prev2;
    prev2 = n;
  }
  return {
    name: 'Fibonacci-like',
    formula: `a(n) = a(n−1) + a(n−2), starting with ${a}, ${b}`,
    confidence: 'exact',
    nextTerms: next,
  };
}

function isPerfectSquares(terms: number[]): PatternMatch | null {
  // Check if terms are n^2 for some starting n
  if (terms.length < 3) return null;
  const roots = terms.map(t => Math.round(Math.sqrt(Math.abs(t))));
  for (let i = 0; i < terms.length; i++) {
    if (terms[i] < 0 || Math.abs(roots[i] * roots[i] - terms[i]) > 1e-9) return null;
  }
  // Check that roots are consecutive
  for (let i = 1; i < roots.length; i++) {
    if (roots[i] !== roots[i - 1] + 1) return null;
  }
  const lastRoot = roots[roots.length - 1];
  const next: number[] = [];
  for (let i = 1; i <= 5; i++) next.push((lastRoot + i) * (lastRoot + i));
  return {
    name: 'Perfect Squares',
    formula: `a(n) = (n + ${roots[0] - 1})²`,
    confidence: 'exact',
    nextTerms: next,
  };
}

function isPerfectCubes(terms: number[]): PatternMatch | null {
  if (terms.length < 3) return null;
  const roots = terms.map(t => Math.round(Math.cbrt(t)));
  for (let i = 0; i < terms.length; i++) {
    if (Math.abs(roots[i] * roots[i] * roots[i] - terms[i]) > 1e-9) return null;
  }
  for (let i = 1; i < roots.length; i++) {
    if (roots[i] !== roots[i - 1] + 1) return null;
  }
  const lastRoot = roots[roots.length - 1];
  const next: number[] = [];
  for (let i = 1; i <= 5; i++) next.push(Math.pow(lastRoot + i, 3));
  return {
    name: 'Perfect Cubes',
    formula: `a(n) = (n + ${roots[0] - 1})³`,
    confidence: 'exact',
    nextTerms: next,
  };
}

function isTriangular(terms: number[]): PatternMatch | null {
  if (terms.length < 3) return null;
  // T(n) = n(n+1)/2; find starting n
  const roots = terms.map(t => {
    // solve n^2 + n - 2t = 0
    const disc = 1 + 8 * t;
    const n = (-1 + Math.sqrt(disc)) / 2;
    return Math.round(n);
  });
  for (let i = 0; i < terms.length; i++) {
    const n = roots[i];
    if (Math.abs(n * (n + 1) / 2 - terms[i]) > 1e-9) return null;
  }
  for (let i = 1; i < roots.length; i++) {
    if (roots[i] !== roots[i - 1] + 1) return null;
  }
  const lastN = roots[roots.length - 1];
  const next: number[] = [];
  for (let i = 1; i <= 5; i++) {
    const nn = lastN + i;
    next.push(nn * (nn + 1) / 2);
  }
  return {
    name: 'Triangular Numbers',
    formula: `a(n) = n(n+1)/2, starting at n=${roots[0]}`,
    confidence: 'exact',
    nextTerms: next,
  };
}

function isPowersOf2(terms: number[]): PatternMatch | null {
  if (terms.length < 3) return null;
  const exps = terms.map(t => Math.round(Math.log2(t)));
  for (let i = 0; i < terms.length; i++) {
    if (terms[i] <= 0 || Math.abs(Math.pow(2, exps[i]) - terms[i]) > 1e-9) return null;
  }
  for (let i = 1; i < exps.length; i++) {
    if (exps[i] !== exps[i - 1] + 1) return null;
  }
  const lastExp = exps[exps.length - 1];
  const next: number[] = [];
  for (let i = 1; i <= 5; i++) next.push(Math.pow(2, lastExp + i));
  return {
    name: 'Powers of 2',
    formula: `a(n) = 2^(n + ${exps[0] - 1})`,
    confidence: 'exact',
    nextTerms: next,
  };
}

function isAlternatingSigns(terms: number[]): PatternMatch | null {
  if (terms.length < 3) return null;
  // Check if abs values form an arithmetic or geometric pattern with alternating signs
  let hasAlt = true;
  for (let i = 0; i < terms.length - 1; i++) {
    if (terms[i] * terms[i + 1] >= 0) { hasAlt = false; break; }
  }
  if (!hasAlt) return null;
  const absTerms = terms.map(t => Math.abs(t));
  const arith = isArithmetic(absTerms);
  const geom = isGeometric(absTerms);
  const base = arith || geom;
  if (!base) return null;
  const lastSign = terms[terms.length - 1] < 0 ? -1 : 1;
  const next = base.nextTerms.map((v, i) => {
    const sign = i % 2 === 0 ? -lastSign : lastSign;
    return sign * v;
  });
  return {
    name: `Alternating Signs (${base.name})`,
    formula: `(-1)^n · (${base.formula})`,
    confidence: 'exact',
    nextTerms: next,
  };
}

// Simple polynomial fit using finite differences
function polynomialFit(terms: number[], degree: number): PatternMatch | null {
  if (terms.length < degree + 2) return null;
  // nth-order difference should be constant for nth-degree polynomial
  let diffs = [...terms];
  for (let d = 0; d < degree; d++) {
    const next: number[] = [];
    for (let i = 1; i < diffs.length; i++) next.push(diffs[i] - diffs[i - 1]);
    diffs = next;
  }
  if (!allClose(diffs, 1e-6)) return null;
  // predict next 5 terms by extending differences
  const sequences: number[][] = [terms.slice()];
  let cur = [...terms];
  for (let d = 0; d < degree; d++) {
    const next: number[] = [];
    for (let i = 1; i < cur.length; i++) next.push(cur[i] - cur[i - 1]);
    sequences.push(next);
    cur = next;
  }
  const nextTerms: number[] = [];
  for (let step = 0; step < 5; step++) {
    // Extend each level
    for (let level = sequences.length - 1; level >= 0; level--) {
      if (level === sequences.length - 1) {
        sequences[level].push(sequences[level][sequences[level].length - 1]);
      } else {
        const last = sequences[level][sequences[level].length - 1];
        const diff = sequences[level + 1][sequences[level + 1].length - 1];
        sequences[level].push(last + diff);
      }
    }
    nextTerms.push(sequences[0][sequences[0].length - 1]);
  }
  const degLabel = degree === 1 ? 'Linear' : degree === 2 ? 'Quadratic' : 'Cubic';
  return {
    name: `${degLabel} Polynomial (degree ${degree})`,
    formula: `Finite differences method (degree ${degree})`,
    confidence: degree <= 2 ? 'exact' : 'approximate',
    nextTerms,
  };
}

export function analyzeSequence(input: string): SequenceAnalysis | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(/[\s,;]+/).filter(s => s.length > 0);
  const terms = parts.map(p => parseFloat(p));
  if (terms.some(isNaN)) return null;
  if (terms.length < 2) return null;

  const patterns: PatternMatch[] = [];

  const checks = [
    isArithmetic,
    isGeometric,
    isFibonacciLike,
    isPerfectSquares,
    isPerfectCubes,
    isTriangular,
    isPowersOf2,
    isAlternatingSigns,
  ];

  for (const check of checks) {
    const result = check(terms);
    if (result) patterns.push(result);
  }

  // Polynomial fits (skip if already matched)
  if (patterns.length === 0) {
    for (let deg = 1; deg <= 3; deg++) {
      const fit = polynomialFit(terms, deg);
      if (fit) { patterns.push(fit); break; }
    }
  }

  return {
    terms,
    patterns,
    primaryPattern: patterns.length > 0 ? patterns[0] : null,
  };
}
