// Template Literal Evaluator — safe arithmetic + string expression evaluator

export interface VariableMap {
  [key: string]: string | number | boolean;
}

export interface ExprResult {
  expression: string;
  value: string;
  error: string | null;
}

export interface TemplateLiteralResult {
  resolved: string;
  expressions: ExprResult[];
  error: string | null;
}

/** Parse variable definitions: "key=value" per line */
export function parseVariables(defs: string): VariableMap {
  const vars: VariableMap = {};
  const lines = defs.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val: string = trimmed.slice(eqIdx + 1).trim();
    if (!key) continue;
    // Detect types
    if (val === 'true') { vars[key] = true; continue; }
    if (val === 'false') { vars[key] = false; continue; }
    // Strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      vars[key] = val.slice(1, -1);
      continue;
    }
    const numVal = Number(val);
    if (!isNaN(numVal) && val !== '') {
      vars[key] = numVal;
      continue;
    }
    vars[key] = val;
  }
  return vars;
}

// ── Safe expression evaluator ─────────────────────────────────────────────────

type TokenType = 'NUMBER' | 'STRING' | 'IDENT' | 'OP' | 'LPAREN' | 'RPAREN' | 'QUESTION' | 'COLON' | 'DOT' | 'COMMA' | 'EOF';
interface Token { type: TokenType; value: string; }

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === ' ' || ch === '\t') { i++; continue; }
    // String literals
    if (ch === '"' || ch === "'") {
      const q = ch; let s = ''; i++;
      while (i < src.length && src[i] !== q) { s += src[i]; i++; }
      i++; // closing quote
      tokens.push({ type: 'STRING', value: s });
      continue;
    }
    // Numbers
    if ((ch >= '0' && ch <= '9') || (ch === '-' && tokens.length === 0)) {
      let n = ch; i++;
      while (i < src.length && ((src[i] >= '0' && src[i] <= '9') || src[i] === '.')) {
        n += src[i]; i++;
      }
      tokens.push({ type: 'NUMBER', value: n });
      continue;
    }
    if (ch === '(') { tokens.push({ type: 'LPAREN', value: '(' }); i++; continue; }
    if (ch === ')') { tokens.push({ type: 'RPAREN', value: ')' }); i++; continue; }
    if (ch === '?') { tokens.push({ type: 'QUESTION', value: '?' }); i++; continue; }
    if (ch === ':') { tokens.push({ type: 'COLON', value: ':' }); i++; continue; }
    if (ch === '.') { tokens.push({ type: 'DOT', value: '.' }); i++; continue; }
    if (ch === ',') { tokens.push({ type: 'COMMA', value: ',' }); i++; continue; }
    // Multi-char operators
    if (i + 1 < src.length) {
      const two = src.slice(i, i + 2);
      if (two === '===' || two === '!==' || two === '>=' || two === '<=' || two === '!=' || two === '==' || two === '&&' || two === '||' || two === '**') {
        tokens.push({ type: 'OP', value: two }); i += 2; continue;
      }
      if (src.slice(i, i + 3) === '===') {
        tokens.push({ type: 'OP', value: '===' }); i += 3; continue;
      }
      if (src.slice(i, i + 3) === '!==') {
        tokens.push({ type: 'OP', value: '!==' }); i += 3; continue;
      }
    }
    if ('+-*/%<>!&|'.indexOf(ch) !== -1) {
      tokens.push({ type: 'OP', value: ch }); i++; continue;
    }
    // Identifiers / keywords
    if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_') {
      let id = '';
      while (i < src.length && ((src[i] >= 'a' && src[i] <= 'z') || (src[i] >= 'A' && src[i] <= 'Z') || (src[i] >= '0' && src[i] <= '9') || src[i] === '_')) {
        id += src[i]; i++;
      }
      tokens.push({ type: 'IDENT', value: id });
      continue;
    }
    i++;
  }
  tokens.push({ type: 'EOF', value: '' });
  return tokens;
}

type PrimValue = string | number | boolean | null;

class Parser {
  private tokens: Token[];
  private pos: number;
  private vars: VariableMap;

  constructor(tokens: Token[], vars: VariableMap) {
    this.tokens = tokens;
    this.pos = 0;
    this.vars = vars;
  }

  private peek(): Token { return this.tokens[this.pos]; }
  private consume(): Token { return this.tokens[this.pos++]; }
  private expect(type: TokenType): Token {
    const t = this.consume();
    if (t.type !== type) throw new Error('Expected ' + type + ' but got ' + t.type);
    return t;
  }

  parse(): PrimValue {
    const val = this.parseTernary();
    return val;
  }

  private parseTernary(): PrimValue {
    const cond = this.parseOr();
    if (this.peek().type === 'QUESTION') {
      this.consume();
      const then = this.parseTernary();
      this.expect('COLON');
      const else_ = this.parseTernary();
      return cond ? then : else_;
    }
    return cond;
  }

  private parseOr(): PrimValue {
    let left = this.parseAnd();
    while (this.peek().type === 'OP' && this.peek().value === '||') {
      this.consume();
      const right = this.parseAnd();
      left = left || right;
    }
    return left;
  }

  private parseAnd(): PrimValue {
    let left = this.parseEquality();
    while (this.peek().type === 'OP' && this.peek().value === '&&') {
      this.consume();
      const right = this.parseEquality();
      left = left && right;
    }
    return left;
  }

  private parseEquality(): PrimValue {
    let left = this.parseComparison();
    while (this.peek().type === 'OP' && (this.peek().value === '===' || this.peek().value === '!==' || this.peek().value === '==' || this.peek().value === '!=')) {
      const op = this.consume().value;
      const right = this.parseComparison();
      if (op === '===' || op === '==') left = left === right;
      if (op === '!==' || op === '!=') left = left !== right;
    }
    return left;
  }

  private parseComparison(): PrimValue {
    let left = this.parseAddSub();
    while (this.peek().type === 'OP' && (this.peek().value === '<' || this.peek().value === '>' || this.peek().value === '<=' || this.peek().value === '>=')) {
      const op = this.consume().value;
      const right = this.parseAddSub();
      const l = Number(left), r = Number(right);
      if (op === '<') left = l < r;
      if (op === '>') left = l > r;
      if (op === '<=') left = l <= r;
      if (op === '>=') left = l >= r;
    }
    return left;
  }

  private parseAddSub(): PrimValue {
    let left = this.parseMulDiv();
    while (this.peek().type === 'OP' && (this.peek().value === '+' || this.peek().value === '-')) {
      const op = this.consume().value;
      const right = this.parseMulDiv();
      if (op === '+') {
        if (typeof left === 'string' || typeof right === 'string') {
          left = String(left) + String(right);
        } else {
          left = Number(left) + Number(right);
        }
      } else {
        left = Number(left) - Number(right);
      }
    }
    return left;
  }

  private parseMulDiv(): PrimValue {
    let left = this.parseUnary();
    while (this.peek().type === 'OP' && (this.peek().value === '*' || this.peek().value === '/' || this.peek().value === '%' || this.peek().value === '**')) {
      const op = this.consume().value;
      const right = this.parseUnary();
      const l = Number(left), r = Number(right);
      if (op === '*') left = l * r;
      if (op === '/') left = r !== 0 ? l / r : NaN;
      if (op === '%') left = l % r;
      if (op === '**') left = Math.pow(l, r);
    }
    return left;
  }

  private parseUnary(): PrimValue {
    if (this.peek().type === 'OP' && this.peek().value === '!') {
      this.consume();
      return !this.parsePostfix();
    }
    if (this.peek().type === 'OP' && this.peek().value === '-') {
      this.consume();
      return -Number(this.parsePostfix());
    }
    return this.parsePostfix();
  }

  private parsePostfix(): PrimValue {
    let obj = this.parsePrimary();
    // Handle method calls: identifier.method(args) or str.toUpperCase()
    while (this.peek().type === 'DOT') {
      this.consume();
      if (this.peek().type !== 'IDENT') break;
      const method = this.consume().value;
      let args: PrimValue[] = [];
      if (this.peek().type === 'LPAREN') {
        this.consume();
        if (this.peek().type !== 'RPAREN') {
          args.push(this.parseTernary());
          while (this.peek().type === 'COMMA') {
            this.consume(); args.push(this.parseTernary());
          }
        }
        if (this.peek().type === 'RPAREN') this.consume();
      }
      const s = String(obj);
      if (method === 'toUpperCase') obj = s.toUpperCase();
      else if (method === 'toLowerCase') obj = s.toLowerCase();
      else if (method === 'trim') obj = s.trim();
      else if (method === 'length') obj = s.length;
      else if (method === 'toString') obj = s;
      else if (method === 'repeat') obj = s.repeat(Number(args[0] || 0));
      else if (method === 'includes') obj = s.includes(String(args[0] || ''));
      else if (method === 'startsWith') obj = s.startsWith(String(args[0] || ''));
      else if (method === 'endsWith') obj = s.endsWith(String(args[0] || ''));
      else if (method === 'replace') obj = s.replace(String(args[0] || ''), String(args[1] || ''));
      else if (method === 'slice') obj = s.slice(Number(args[0] || 0), args[1] !== undefined ? Number(args[1]) : undefined);
      else if (method === 'split') obj = JSON.stringify(s.split(String(args[0] !== undefined ? args[0] : '')));
      else if (method === 'padStart') obj = s.padStart(Number(args[0] || 0), args[1] !== undefined ? String(args[1]) : ' ');
      else if (method === 'padEnd') obj = s.padEnd(Number(args[0] || 0), args[1] !== undefined ? String(args[1]) : ' ');
      else if (method === 'toFixed') obj = Number(obj).toFixed(Number(args[0] || 0));
      else if (method === 'abs') obj = Math.abs(Number(obj));
      else throw new Error('Unknown method: ' + method);
    }
    return obj;
  }

  private parsePrimary(): PrimValue {
    const t = this.peek();
    if (t.type === 'NUMBER') { this.consume(); return parseFloat(t.value); }
    if (t.type === 'STRING') { this.consume(); return t.value; }
    if (t.type === 'IDENT') {
      this.consume();
      if (t.value === 'true') return true;
      if (t.value === 'false') return false;
      if (t.value === 'null') return null;
      if (t.value === 'undefined') return null;
      if (t.value === 'Math') {
        this.expect('DOT');
        const fn = this.expect('IDENT').value;
        this.expect('LPAREN');
        const args: PrimValue[] = [];
        if (this.peek().type !== 'RPAREN') {
          args.push(this.parseTernary());
          while (this.peek().type === 'COMMA') {
            this.consume(); args.push(this.parseTernary());
          }
        }
        this.expect('RPAREN');
        const mathFn = (Math as any)[fn];
        if (typeof mathFn !== 'function') throw new Error('Unknown Math.' + fn);
        return mathFn.apply(Math, args.map(Number));
      }
      if (t.value === 'String') {
        this.expect('LPAREN');
        const arg = this.parseTernary();
        this.expect('RPAREN');
        return String(arg);
      }
      if (t.value === 'Number') {
        this.expect('LPAREN');
        const arg = this.parseTernary();
        this.expect('RPAREN');
        return Number(arg);
      }
      if (t.value === 'parseInt') {
        this.expect('LPAREN');
        const arg = this.parseTernary();
        this.expect('RPAREN');
        return parseInt(String(arg), 10);
      }
      if (t.value === 'parseFloat') {
        this.expect('LPAREN');
        const arg = this.parseTernary();
        this.expect('RPAREN');
        return parseFloat(String(arg));
      }
      // Variable lookup
      if (Object.prototype.hasOwnProperty.call(this.vars, t.value)) {
        return this.vars[t.value] as PrimValue;
      }
      throw new Error('Unknown identifier: ' + t.value);
    }
    if (t.type === 'LPAREN') {
      this.consume();
      const val = this.parseTernary();
      this.expect('RPAREN');
      return val;
    }
    throw new Error('Unexpected token: ' + t.value);
  }
}

function safeEval(expr: string, vars: VariableMap): PrimValue {
  const trimmed = expr.trim();
  if (!trimmed) return '';
  const tokens = tokenize(trimmed);
  const parser = new Parser(tokens, vars);
  return parser.parse();
}

/** Extract all ${...} expressions from a template literal string */
function extractExpressions(template: string): string[] {
  const exprs: string[] = [];
  let i = 0;
  while (i < template.length) {
    if (template[i] === '$' && template[i + 1] === '{') {
      let depth = 1; i += 2; let expr = '';
      while (i < template.length && depth > 0) {
        if (template[i] === '{') depth++;
        else if (template[i] === '}') { depth--; if (depth === 0) break; }
        expr += template[i]; i++;
      }
      exprs.push(expr);
      i++;
    } else {
      i++;
    }
  }
  return exprs;
}

export function evaluateTemplate(template: string, varDefs: string): TemplateLiteralResult {
  if (!template.trim()) return { resolved: '', expressions: [], error: null };

  const vars = parseVariables(varDefs);
  const expressionStrings = extractExpressions(template);
  const exprResults: ExprResult[] = [];

  let resolved = template;

  for (const expr of expressionStrings) {
    let value: string;
    let error: string | null = null;
    try {
      const result = safeEval(expr, vars);
      value = result === null ? 'null' : String(result);
    } catch (e) {
      value = '[error]';
      error = String(e);
    }
    exprResults.push({ expression: expr, value, error });
    // Replace first occurrence
    resolved = resolved.replace('${' + expr + '}', value);
  }

  return { resolved, expressions: exprResults, error: null };
}
