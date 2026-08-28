// Safe math expression evaluator (no eval)
// Supports: +, -, *, /, **, %, parentheses, sqrt(), abs(), floor(), ceil(), round(), log(), log2(), log10(), sin(), cos(), tan(), pi, e

export function evaluate(expr: string): number {
  const tokens = tokenize(expr.replace(/\s+/g, ''));
  let pos = 0;

  function peek(): string { return tokens[pos] ?? ''; }
  function consume(): string { return tokens[pos++] ?? ''; }

  function parseExpr(): number { return parseAddSub(); }

  function parseAddSub(): number {
    let left = parseMulDiv();
    while (peek() === '+' || peek() === '-') {
      const op = consume();
      const right = parseMulDiv();
      left = op === '+' ? left + right : left - right;
    }
    return left;
  }

  function parseMulDiv(): number {
    let left = parsePower();
    while (peek() === '*' || peek() === '/' || peek() === '%') {
      const op = consume();
      const right = parsePower();
      if (op === '*') left *= right;
      else if (op === '/') { if (right === 0) throw new Error('Division by zero'); left /= right; }
      else left %= right;
    }
    return left;
  }

  function parsePower(): number {
    const base = parseUnary();
    if (peek() === '**') { consume(); return Math.pow(base, parsePower()); }
    return base;
  }

  function parseUnary(): number {
    if (peek() === '-') { consume(); return -parsePrimary(); }
    if (peek() === '+') { consume(); return parsePrimary(); }
    return parsePrimary();
  }

  function parsePrimary(): number {
    const tok = peek();

    // Number
    if (/^[\d.]/.test(tok)) { consume(); return parseFloat(tok); }

    // Constants
    if (tok === 'pi') { consume(); return Math.PI; }
    if (tok === 'e') { consume(); return Math.E; }

    // Functions
    const fns: Record<string, (x: number) => number> = {
      sqrt: Math.sqrt, abs: Math.abs, floor: Math.floor, ceil: Math.ceil,
      round: Math.round, log: Math.log, log2: Math.log2, log10: Math.log10,
      sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin,
      acos: Math.acos, atan: Math.atan, exp: Math.exp,
    };
    if (tok in fns) {
      consume();
      if (consume() !== '(') throw new Error(`Expected ( after ${tok}`);
      const arg = parseExpr();
      if (consume() !== ')') throw new Error('Expected )');
      return fns[tok](arg);
    }

    // Parentheses
    if (tok === '(') {
      consume();
      const val = parseExpr();
      if (consume() !== ')') throw new Error('Mismatched parentheses');
      return val;
    }

    throw new Error(`Unexpected token: "${tok}"`);
  }

  const result = parseExpr();
  if (pos < tokens.length) throw new Error(`Unexpected token: "${tokens[pos]}"`);
  return result;
}

function tokenize(expr: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < expr.length) {
    if (/\d|\./.test(expr[i])) {
      let num = '';
      while (i < expr.length && /[\d.]/.test(expr[i])) num += expr[i++];
      tokens.push(num);
    } else if (/[a-z]/i.test(expr[i])) {
      let name = '';
      while (i < expr.length && /[a-z]/i.test(expr[i])) name += expr[i++];
      tokens.push(name.toLowerCase());
    } else if (expr[i] === '*' && expr[i+1] === '*') {
      tokens.push('**'); i += 2;
    } else {
      tokens.push(expr[i++]);
    }
  }
  return tokens;
}

export function evaluateInput(input: string): string {
  const lines = input.trim().split('\n').filter(l => l.trim());
  const results: string[] = [];
  for (const line of lines) {
    const expr = line.trim();
    if (!expr) continue;
    try {
      const result = evaluate(expr);
      results.push(`${expr} = ${Number.isInteger(result) ? result : parseFloat(result.toFixed(10))}`);
    } catch (e) {
      results.push(`${expr} → Error: ${(e as Error).message}`);
    }
  }
  if (results.length === 0) throw new Error('Enter math expressions (one per line)');
  return results.join('\n');
}
