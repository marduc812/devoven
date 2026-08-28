export interface TruthTableRow {
  vars: Record<string, boolean>;
  output: boolean;
}

export interface BooleanResult {
  variables: string[];
  rows: TruthTableRow[];
  minterms: number[];
  sop: string;
  formatted: string;
}

// Tokenizer / parser for boolean expressions
// Supports: A-D variables, &&/AND, ||/OR, !/NOT, ^/XOR, NAND, NOR, XNOR

function tokenize(expr: string): string[] {
  // Normalize: replace keywords with symbols
  const normalized = expr
    .replace(/\bNAND\b/gi, ' NAND ')
    .replace(/\bNOR\b/gi, ' NOR ')
    .replace(/\bXNOR\b/gi, ' XNOR ')
    .replace(/\bXOR\b/gi, ' ^ ')
    .replace(/\bAND\b/gi, ' && ')
    .replace(/\bOR\b/gi, ' || ')
    .replace(/\bNOT\b/gi, ' ! ')
    .replace(/&&/g, ' && ')
    .replace(/\|\|/g, ' || ')
    .replace(/\^/g, ' ^ ')
    .replace(/!/g, ' ! ')
    .replace(/\(/g, ' ( ')
    .replace(/\)/g, ' ) ');

  return normalized.trim().split(/\s+/).filter(t => t.length > 0);
}

function extractVariables(tokens: string[]): string[] {
  const vars = new Set<string>();
  for (const t of tokens) {
    if (/^[A-D]$/i.test(t)) vars.add(t.toUpperCase());
  }
  return Array.from(vars).sort();
}

// Recursive descent parser
function parseExpr(tokens: string[], pos: number[], env: Record<string, boolean>): boolean {
  return parseOr(tokens, pos, env);
}

function parseOr(tokens: string[], pos: number[], env: Record<string, boolean>): boolean {
  let left = parseAnd(tokens, pos, env);
  while (pos[0] < tokens.length && tokens[pos[0]] === '||') {
    pos[0]++;
    const right = parseAnd(tokens, pos, env);
    left = left || right;
  }
  return left;
}

function parseAnd(tokens: string[], pos: number[], env: Record<string, boolean>): boolean {
  let left = parseXor(tokens, pos, env);
  while (pos[0] < tokens.length && tokens[pos[0]] === '&&') {
    pos[0]++;
    const right = parseXor(tokens, pos, env);
    left = left && right;
  }
  return left;
}

function parseXor(tokens: string[], pos: number[], env: Record<string, boolean>): boolean {
  let left = parseNand(tokens, pos, env);
  while (pos[0] < tokens.length && tokens[pos[0]] === '^') {
    pos[0]++;
    const right = parseNand(tokens, pos, env);
    left = left !== right;
  }
  return left;
}

function parseNand(tokens: string[], pos: number[], env: Record<string, boolean>): boolean {
  let left = parseNor(tokens, pos, env);
  while (pos[0] < tokens.length && tokens[pos[0]].toUpperCase() === 'NAND') {
    pos[0]++;
    const right = parseNor(tokens, pos, env);
    left = !(left && right);
  }
  return left;
}

function parseNor(tokens: string[], pos: number[], env: Record<string, boolean>): boolean {
  let left = parseXnor(tokens, pos, env);
  while (pos[0] < tokens.length && tokens[pos[0]].toUpperCase() === 'NOR') {
    pos[0]++;
    const right = parseXnor(tokens, pos, env);
    left = !(left || right);
  }
  return left;
}

function parseXnor(tokens: string[], pos: number[], env: Record<string, boolean>): boolean {
  let left = parseNot(tokens, pos, env);
  while (pos[0] < tokens.length && tokens[pos[0]].toUpperCase() === 'XNOR') {
    pos[0]++;
    const right = parseNot(tokens, pos, env);
    left = left === right;
  }
  return left;
}

function parseNot(tokens: string[], pos: number[], env: Record<string, boolean>): boolean {
  if (pos[0] < tokens.length && tokens[pos[0]] === '!') {
    pos[0]++;
    return !parseNot(tokens, pos, env);
  }
  return parseAtom(tokens, pos, env);
}

function parseAtom(tokens: string[], pos: number[], env: Record<string, boolean>): boolean {
  if (pos[0] >= tokens.length) throw new Error('Unexpected end of expression');
  const t = tokens[pos[0]];
  if (t === '(') {
    pos[0]++;
    const val = parseExpr(tokens, pos, env);
    if (pos[0] >= tokens.length || tokens[pos[0]] !== ')') throw new Error('Missing closing parenthesis');
    pos[0]++;
    return val;
  }
  if (/^[A-D]$/i.test(t)) {
    pos[0]++;
    const key = t.toUpperCase();
    if (!(key in env)) throw new Error(`Variable ${key} not defined`);
    return env[key];
  }
  if (t === '0' || t.toLowerCase() === 'false') { pos[0]++; return false; }
  if (t === '1' || t.toLowerCase() === 'true') { pos[0]++; return true; }
  throw new Error(`Unexpected token: ${t}`);
}

function evaluate(expr: string, env: Record<string, boolean>): boolean {
  const tokens = tokenize(expr);
  const pos = [0];
  const result = parseExpr(tokens, pos, env);
  if (pos[0] < tokens.length) throw new Error(`Unexpected token at position ${pos[0]}: ${tokens[pos[0]]}`);
  return result;
}

export function generateTruthTable(expr: string): BooleanResult {
  if (!expr.trim()) throw new Error('Enter a boolean expression');
  const tokens = tokenize(expr);
  const variables = extractVariables(tokens);
  if (variables.length === 0) throw new Error('Expression must contain at least one variable (A-D)');
  if (variables.length > 4) throw new Error('Maximum 4 variables supported (A-D)');

  const numRows = Math.pow(2, variables.length);
  const rows: TruthTableRow[] = [];
  const minterms: number[] = [];

  for (let i = 0; i < numRows; i++) {
    const env: Record<string, boolean> = {};
    for (let j = 0; j < variables.length; j++) {
      env[variables[j]] = Boolean((i >> (variables.length - 1 - j)) & 1);
    }
    const output = evaluate(expr, env);
    rows.push({ vars: env, output });
    if (output) minterms.push(i);
  }

  // Build canonical SOP
  let sop = '';
  if (minterms.length === 0) {
    sop = '0 (always false)';
  } else if (minterms.length === numRows) {
    sop = '1 (always true)';
  } else {
    const terms = minterms.map(idx => {
      const row = rows[idx];
      return variables.map(v => row.vars[v] ? v : `!${v}`).join(' && ');
    });
    sop = terms.map(t => `(${t})`).join(' || ');
  }

  // Format truth table
  const header = variables.join('  ') + '  | Output';
  const separator = variables.map(() => '--').join('  ') + '  +--------';
  const tableRows = rows.map((r, idx) => {
    const varVals = variables.map(v => (r.vars[v] ? '1' : '0')).join('   ');
    return `${varVals}   |   ${r.output ? '1' : '0'}   (row ${idx})`;
  });

  const lines: string[] = [
    `Expression: ${expr}`,
    `Variables:  ${variables.join(', ')}`,
    ``,
    header,
    separator,
    ...tableRows,
    ``,
    `Minterms (rows where output = 1): ${minterms.length > 0 ? minterms.join(', ') : 'none'}`,
    ``,
    `Canonical Sum of Products (SOP):`,
    sop,
  ];

  return {
    variables,
    rows,
    minterms,
    sop,
    formatted: lines.join('\n'),
  };
}

export function formatBooleanTable(expr: string): string {
  return generateTruthTable(expr).formatted;
}

export interface KarnaughCell {
  minterm: number;
  value: boolean;
}

export interface KarnaughMap {
  /** Variables labelling the rows, most significant first. May be empty. */
  rowVars: string[];
  colVars: string[];
  /** Gray-coded bit strings, so adjacent cells differ by exactly one variable. */
  rowLabels: string[];
  colLabels: string[];
  cells: KarnaughCell[][];
}

/** Gray-code sequence of `bits`-wide binary strings. */
export function grayCode(bits: number): string[] {
  if (bits <= 0) return [''];
  const out: string[] = [];
  for (let i = 0; i < 1 << bits; i++) {
    out.push((i ^ (i >> 1)).toString(2).padStart(bits, '0'));
  }
  return out;
}

/**
 * Lay the truth table out as a Karnaugh map. Gray-code ordering means groups of
 * adjacent 1s are the terms that can be combined, which is the whole point of
 * drawing one.
 */
export function karnaughMap(result: BooleanResult): KarnaughMap {
  const v = result.variables.length;
  // Keep the grid as square as possible: 1×2, 2×2, 2×4, 4×4.
  const rowVarCount = v <= 2 ? v - 1 : v === 3 ? 1 : 2;
  const colVarCount = v - rowVarCount;

  const rowVars = result.variables.slice(0, rowVarCount);
  const colVars = result.variables.slice(rowVarCount);
  const rowLabels = grayCode(rowVarCount);
  const colLabels = grayCode(colVarCount);

  const cells = rowLabels.map(rowLabel =>
    colLabels.map(colLabel => {
      const rowBits = rowLabel === '' ? 0 : parseInt(rowLabel, 2);
      const colBits = parseInt(colLabel, 2);
      const minterm = (rowBits << colVarCount) | colBits;
      return { minterm, value: result.rows[minterm].output };
    })
  );

  return { rowVars, colVars, rowLabels, colLabels, cells };
}
