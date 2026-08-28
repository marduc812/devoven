// Pure TypeScript — no browser APIs, no BigInt literals.
// Modular Arithmetic Calculator

export interface ModArithResult {
  expression: string;
  result: number;
  steps: string[];
  inverse?: { value: number; modulus: number } | null;
}

// Extended GCD — returns { gcd, x, y }
function extGcd(a: number, b: number): { gcd: number; x: number; y: number } {
  if (b === 0) return { gcd: a, x: 1, y: 0 };
  const r = extGcd(b, a % b);
  return { gcd: r.gcd, x: r.y, y: r.x - Math.floor(a / b) * r.y };
}

// Fast modular exponentiation — base^exp mod m (no BigInt)
export function modPow(base: number, exp: number, mod: number): number {
  if (mod === 1) return 0;
  base = ((base % mod) + mod) % mod;
  let result = 1;
  while (exp > 0) {
    if (exp % 2 === 1) {
      result = (result * base) % mod;
    }
    base = (base * base) % mod;
    exp = Math.floor(exp / 2);
  }
  return result;
}

// Modular inverse via extended GCD
export function modInverse(a: number, m: number): number | null {
  const absM = Math.abs(m);
  const normA = ((a % absM) + absM) % absM;
  const { gcd, x } = extGcd(normA, absM);
  if (gcd !== 1) return null;
  return ((x % absM) + absM) % absM;
}

// Tokenise expression: numbers, +, -, *, ^, (, ), mod keyword
type Token = { type: 'num'; value: number } | { type: 'op'; value: string };

function tokenise(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    if (/\s/.test(expr[i])) { i++; continue; }
    if (/\d/.test(expr[i])) {
      let num = '';
      while (i < expr.length && /\d/.test(expr[i])) num += expr[i++];
      tokens.push({ type: 'num', value: parseInt(num, 10) });
      continue;
    }
    if ('+-*^()'.includes(expr[i])) {
      tokens.push({ type: 'op', value: expr[i] });
      i++;
      continue;
    }
    // 'mod' keyword (case insensitive)
    const rest = expr.slice(i).toLowerCase();
    if (rest.startsWith('mod')) {
      tokens.push({ type: 'op', value: 'mod' });
      i += 3;
      continue;
    }
    throw new Error(`Unexpected character: ${expr[i]}`);
  }
  return tokens;
}

// Simple recursive descent parser that returns [value, modulus] if expression
// contains a top-level "mod" operator, otherwise just the computed value.
// Grammar:
//   expr   = term (('+'|'-') term)*
//   term   = factor ('*' factor)*
//   factor = base ('^' factor)?  (right-associative for natural feel)
//   base   = '(' expr ')' | NUM | '-' base

class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token | null {
    return this.tokens[this.pos] ?? null;
  }

  private consume(): Token {
    return this.tokens[this.pos++];
  }

  private consumeOp(op: string): void {
    const t = this.peek();
    if (!t || t.type !== 'op' || t.value !== op) {
      throw new Error(`Expected '${op}'`);
    }
    this.consume();
  }

  parseExpr(): number {
    let left = this.parseTerm();
    while (true) {
      const t = this.peek();
      if (!t || t.type !== 'op') break;
      if (t.value === '+') { this.consume(); left += this.parseTerm(); }
      else if (t.value === '-') { this.consume(); left -= this.parseTerm(); }
      else break;
    }
    return left;
  }

  parseTerm(): number {
    let left = this.parseFactor();
    while (true) {
      const t = this.peek();
      if (!t || t.type !== 'op' || t.value !== '*') break;
      this.consume();
      left *= this.parseFactor();
    }
    return left;
  }

  parseFactor(): number {
    const base = this.parseBase();
    const t = this.peek();
    if (t && t.type === 'op' && t.value === '^') {
      this.consume();
      const exp = this.parseFactor(); // right-assoc
      return Math.pow(base, exp);
    }
    return base;
  }

  parseBase(): number {
    const t = this.peek();
    if (!t) throw new Error('Unexpected end of expression');
    if (t.type === 'op' && t.value === '-') {
      this.consume();
      return -this.parseBase();
    }
    if (t.type === 'op' && t.value === '(') {
      this.consume();
      const v = this.parseExpr();
      this.consumeOp(')');
      return v;
    }
    if (t.type === 'num') {
      this.consume();
      return t.value;
    }
    throw new Error(`Unexpected token: ${JSON.stringify(t.value)}`);
  }

  isDone(): boolean {
    return this.pos >= this.tokens.length;
  }
}

export function evaluateModularExpression(input: string): ModArithResult {
  const trimmed = input.trim();
  if (!trimmed) throw new Error('Enter an expression like "17 mod 5" or "2^10 mod 1000"');

  // Split on the last occurrence of "mod" (case insensitive)
  const modIdx = trimmed.toLowerCase().lastIndexOf(' mod ');
  if (modIdx === -1) {
    throw new Error('Expression must contain "mod", e.g. "17 mod 5" or "(3*7) mod 11"');
  }

  const lhsStr = trimmed.slice(0, modIdx).trim();
  const rhsStr = trimmed.slice(modIdx + 5).trim();

  // Parse modulus first
  const modTokens = tokenise(rhsStr);
  const modParser = new Parser(modTokens);
  const modulus = modParser.parseExpr();
  if (!modParser.isDone()) throw new Error('Invalid modulus expression');
  if (!Number.isInteger(modulus) || modulus <= 0) throw new Error('Modulus must be a positive integer');

  const steps: string[] = [];
  steps.push(`Expression: ${lhsStr} mod ${modulus}`);

  // Check for power expression a^b on lhs for fast exponentiation path
  const powerMatch = /^(-?\d+)\s*\^\s*(-?\d+)$/.exec(lhsStr);
  let lhsValue: number;

  if (powerMatch) {
    const base = parseInt(powerMatch[1], 10);
    const exp = parseInt(powerMatch[2], 10);
    if (exp < 0) throw new Error('Exponent must be non-negative');
    if (Math.abs(base) > 1e12 || exp > 1e7) throw new Error('Values too large');
    steps.push(`Detected: ${base}^${exp} mod ${modulus}`);
    steps.push(`Using fast modular exponentiation (square-and-multiply):`);

    // Show a few squaring steps
    let b = ((base % modulus) + modulus) % modulus;
    let e = exp;
    let r = 1;
    let stepCount = 0;
    const maxSteps = 20;
    while (e > 0 && stepCount < maxSteps) {
      if (e % 2 === 1) {
        steps.push(`  result = (${r} × ${b}) mod ${modulus} = ${(r * b) % modulus}  [bit=1, e=${e}]`);
        r = (r * b) % modulus;
      } else {
        steps.push(`  [bit=0, e=${e}, skip multiply]`);
      }
      b = (b * b) % modulus;
      e = Math.floor(e / 2);
      stepCount++;
    }
    if (e > 0) steps.push(`  ... (${Math.ceil(Math.log2(exp + 1)) - stepCount} more steps)`);

    lhsValue = modPow(base, exp, modulus);
  } else {
    // General expression evaluation
    const lhsTokens = tokenise(lhsStr);
    const lhsParser = new Parser(lhsTokens);
    const raw = lhsParser.parseExpr();
    if (!lhsParser.isDone()) throw new Error('Invalid left-hand expression');
    lhsValue = raw;
    steps.push(`Evaluated left side: ${lhsStr} = ${raw}`);
  }

  const result = ((lhsValue % modulus) + modulus) % modulus;
  steps.push(`Final: ${lhsValue} mod ${modulus} = ${result}`);

  // Modular inverse
  let inverse: { value: number; modulus: number } | null = null;
  if (Number.isInteger(lhsValue) && Math.abs(lhsValue) < 1e12) {
    const inv = modInverse(lhsValue, modulus);
    if (inv !== null) {
      inverse = { value: inv, modulus };
      steps.push(`Modular inverse of ${lhsValue} mod ${modulus} = ${inv}  (via extended Euclidean)`);
      steps.push(`  Verify: ${lhsValue} × ${inv} mod ${modulus} = ${((lhsValue * inv) % modulus + modulus) % modulus}`);
    } else {
      steps.push(`Modular inverse of ${lhsValue} mod ${modulus}: does not exist (GCD ≠ 1)`);
    }
  }

  return { expression: trimmed, result, steps, inverse };
}

export function formatResult(r: ModArithResult): string {
  const lines: string[] = [];
  lines.push(`Result: ${r.result}`);
  lines.push('');
  lines.push('--- Step-by-Step ---');
  r.steps.forEach(s => lines.push(s));
  return lines.join('\n');
}
