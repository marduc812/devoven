export type SolveResult = { steps: string[]; answer: string };

function trimEq(s: string): string { return s.trim(); }

/** Parse a coefficient from a string like "3", "-2", "", "+", "-" before a variable */
function parseCoeff(s: string): number {
  const t = s.trim().replace(/\s+/g, '');
  if (t === '' || t === '+') return 1;
  if (t === '-') return -1;
  const n = parseFloat(t);
  if (isNaN(n)) throw new Error('Cannot parse coefficient: "' + t + '"');
  return n;
}

/**
 * Solve ax + b = c  (single variable, linear)
 * e.g. "2x + 3 = 7", "x - 5 = 0", "3x = 9"
 */
export function solveLinear(equation: string): SolveResult {
  const steps: string[] = [];
  const [lhsRaw, rhsRaw] = equation.split('=');
  if (rhsRaw === undefined) throw new Error('No "=" found in equation');

  // Move everything to lhs: lhs - rhs = 0
  // We'll collect terms
  const lhs = trimEq(lhsRaw);
  const rhs = trimEq(rhsRaw);

  steps.push('Equation: ' + lhs + ' = ' + rhs);

  // Find variable name (single letter)
  const varMatch = equation.match(/[a-zA-Z]/);
  if (!varMatch) throw new Error('No variable found');
  const varName = varMatch[0];

  // Parse lhs and rhs for coefficients of variable and constants
  function parseSide(expr: string): { coeff: number; constant: number } {
    let coeff = 0;
    let constant = 0;
    // Normalize: insert + before terms if missing
    const normalized = expr.replace(/([0-9a-zA-Z])\s*([+-])/g, '$1 $2 ').trim();
    const terms = normalized.split(/\s+(?=[+-]|\d|[a-zA-Z])/).filter(Boolean);

    // Actually, split on + and - keeping sign
    const termList = expr.split(/(?=[+-])/).map(s => s.trim()).filter(Boolean);

    for (const term of termList) {
      if (term.includes(varName)) {
        const coeffStr = term.replace(varName, '').trim();
        coeff += parseCoeff(coeffStr);
      } else {
        const n = parseFloat(term.replace(/\s+/g, ''));
        if (!isNaN(n)) constant += n;
      }
    }
    return { coeff, constant };
  }

  const left = parseSide(lhs);
  const right = parseSide(rhs);

  // ax + b = cx + d  →  (a-c)x = d-b
  const a = left.coeff - right.coeff;
  const b = right.constant - left.constant;

  steps.push('Collect variable terms on left, constants on right:');
  steps.push('  ' + a + varName + ' = ' + b);

  if (a === 0) {
    if (b === 0) {
      steps.push('Infinite solutions (0 = 0)');
      return { steps, answer: 'Infinite solutions' };
    } else {
      steps.push('No solution (contradiction: 0 = ' + b + ')');
      return { steps, answer: 'No solution' };
    }
  }

  const x = b / a;
  steps.push('Divide both sides by ' + a + ':');
  steps.push('  ' + varName + ' = ' + b + ' / ' + a + ' = ' + parseFloat(x.toFixed(8)).toString());

  return { steps, answer: varName + ' = ' + parseFloat(x.toFixed(8)).toString() };
}

/**
 * Solve ax² + bx + c = 0 (quadratic)
 * e.g. "x^2 + 5x + 6 = 0", "2x² - 4x + 2 = 0"
 */
export function solveQuadratic(equation: string): SolveResult {
  const steps: string[] = [];
  const [lhsRaw, rhsRaw] = equation.split('=');
  if (rhsRaw === undefined) throw new Error('No "=" found');

  steps.push('Equation: ' + equation.trim());

  // Normalize: move rhs to lhs
  const rhsVal = parseFloat(trimEq(rhsRaw));
  const lhs = trimEq(lhsRaw);

  // Find variable
  const varMatch = lhs.match(/[a-zA-Z]/);
  if (!varMatch) throw new Error('No variable found');
  const v = varMatch[0];

  // Normalize exponent notation: x^2 → x², x**2 → x²
  const normalized = lhs
    .replace(/\*\*2/g, '²')
    .replace(/\^2/g, '²')
    .replace(/\*\*1/g, '')
    .replace(/\^1/g, '');

  // Extract quadratic coefficient
  let a = 0, b = 0, c = 0;

  // Match x² terms
  const quadPattern = new RegExp('([+-]?\\s*[0-9]*\\.?[0-9]*)\\s*' + v + '²', 'g');
  let m: RegExpExecArray | null;
  while ((m = quadPattern.exec(normalized)) !== null) {
    a += parseCoeff(m[1].replace(/\s/g, ''));
  }

  // Match x terms (not followed by ²)
  const linPattern = new RegExp('([+-]?\\s*[0-9]*\\.?[0-9]*)\\s*' + v + '(?!²)', 'g');
  while ((m = linPattern.exec(normalized)) !== null) {
    b += parseCoeff(m[1].replace(/\s/g, ''));
  }

  // Constants (no variable)
  const constPattern = /([+-]?\s*[0-9]+\.?[0-9]*)(?!\s*[a-zA-Z])/g;
  let cleanedForConst = normalized.replace(quadPattern, '').replace(linPattern, '');
  while ((m = constPattern.exec(cleanedForConst)) !== null) {
    c += parseFloat(m[1].replace(/\s/g, ''));
  }

  // Adjust for rhs
  c -= isNaN(rhsVal) ? 0 : rhsVal;

  steps.push('Standard form: ' + a + v + '² + ' + b + v + ' + ' + c + ' = 0');

  if (a === 0) throw new Error('No quadratic term found. Use linear solver for ax + b = c.');

  const discriminant = b * b - 4 * a * c;
  steps.push('Discriminant: b² - 4ac = ' + b + '² - 4×' + a + '×' + c + ' = ' + discriminant);

  if (discriminant < 0) {
    const realPart = -b / (2 * a);
    const imagPart = Math.sqrt(-discriminant) / (2 * a);
    const r = parseFloat(realPart.toFixed(6)).toString();
    const im = parseFloat(Math.abs(imagPart).toFixed(6)).toString();
    steps.push('Discriminant < 0: complex roots');
    steps.push(v + '₁ = ' + r + ' + ' + im + 'i');
    steps.push(v + '₂ = ' + r + ' - ' + im + 'i');
    return {
      steps,
      answer: v + '₁ = ' + r + ' + ' + im + 'i, ' + v + '₂ = ' + r + ' - ' + im + 'i',
    };
  }

  if (discriminant === 0) {
    const x = -b / (2 * a);
    steps.push('One real root (double root):');
    steps.push(v + ' = -b / (2a) = ' + parseFloat(x.toFixed(6)).toString());
    return { steps, answer: v + ' = ' + parseFloat(x.toFixed(6)).toString() + ' (double root)' };
  }

  const x1 = (-b + Math.sqrt(discriminant)) / (2 * a);
  const x2 = (-b - Math.sqrt(discriminant)) / (2 * a);
  steps.push('Two real roots using quadratic formula:');
  steps.push(v + '₁ = (-' + b + ' + √' + discriminant + ') / (2×' + a + ') = ' + parseFloat(x1.toFixed(6)).toString());
  steps.push(v + '₂ = (-' + b + ' - √' + discriminant + ') / (2×' + a + ') = ' + parseFloat(x2.toFixed(6)).toString());

  return {
    steps,
    answer: v + '₁ = ' + parseFloat(x1.toFixed(6)).toString() + ', ' + v + '₂ = ' + parseFloat(x2.toFixed(6)).toString(),
  };
}

/**
 * Solve 2×2 system: "ax + by = c\ndx + ey = f"
 * e.g. "2x + 3y = 8\nx - y = 1"
 */
export function solveSystem2x2(eq1: string, eq2: string): SolveResult {
  const steps: string[] = [];
  steps.push('System:');
  steps.push('  ' + eq1.trim());
  steps.push('  ' + eq2.trim());

  function extractCoefficients(eq: string): { x: number; y: number; c: number } {
    const [lhs, rhs] = eq.split('=');
    if (!rhs) throw new Error('No "=" in: ' + eq);
    const c = parseFloat(trimEq(rhs));
    if (isNaN(c)) throw new Error('Invalid constant in: ' + eq);

    let xc = 0, yc = 0;
    const terms = trimEq(lhs).split(/(?=[+-])/).map(s => s.trim()).filter(Boolean);
    for (const t of terms) {
      if (/x/.test(t)) xc += parseCoeff(t.replace('x', '').trim());
      else if (/y/.test(t)) yc += parseCoeff(t.replace('y', '').trim());
      else {
        const n = parseFloat(t);
        if (!isNaN(n)) yc += 0; // standalone constant in lhs, ignore (move to rhs handled by c)
      }
    }
    return { x: xc, y: yc, c };
  }

  const { x: a, y: b, c } = extractCoefficients(eq1);
  const { x: d, y: e, c: f } = extractCoefficients(eq2);

  steps.push('');
  steps.push('Coefficients: [' + a + ', ' + b + ' | ' + c + '] and [' + d + ', ' + e + ' | ' + f + ']');

  // Cramer's rule
  const det = a * e - b * d;
  steps.push('Determinant: ' + a + '×' + e + ' - ' + b + '×' + d + ' = ' + det);

  if (Math.abs(det) < 1e-12) {
    steps.push('Determinant is 0: system has no unique solution');
    return { steps, answer: 'No unique solution (dependent or inconsistent system)' };
  }

  const x = (c * e - b * f) / det;
  const y = (a * f - c * d) / det;

  steps.push('x = (' + c + '×' + e + ' - ' + b + '×' + f + ') / ' + det + ' = ' + parseFloat(x.toFixed(6)).toString());
  steps.push('y = (' + a + '×' + f + ' - ' + c + '×' + d + ') / ' + det + ' = ' + parseFloat(y.toFixed(6)).toString());

  return {
    steps,
    answer: 'x = ' + parseFloat(x.toFixed(6)).toString() + ', y = ' + parseFloat(y.toFixed(6)).toString(),
  };
}

function isQuadratic(eq: string): boolean {
  return /[a-zA-Z][²^]|[a-zA-Z]\*\*2/.test(eq) || /\^2/.test(eq);
}

function isSystem(input: string): boolean {
  const lines = input.trim().split('\n').filter(l => l.trim());
  return lines.length >= 2 && lines.every(l => l.includes('='));
}

export function solveEquation(input: string): string {
  const lines = input.trim().split('\n').filter(l => l.trim());
  if (lines.length === 0) return '';

  try {
    if (isSystem(input) && lines.length === 2) {
      const r = solveSystem2x2(lines[0], lines[1]);
      return ['=== System of 2 Linear Equations ===', '', ...r.steps, '', 'Answer: ' + r.answer].join('\n');
    }

    const eq = lines[0];
    if (isQuadratic(eq)) {
      const r = solveQuadratic(eq);
      return ['=== Quadratic Equation ===', '', ...r.steps, '', 'Answer: ' + r.answer].join('\n');
    }

    // default: linear
    const r = solveLinear(eq);
    return ['=== Linear Equation ===', '', ...r.steps, '', 'Answer: ' + r.answer].join('\n');
  } catch (e) {
    return 'Error: ' + (e as Error).message;
  }
}
