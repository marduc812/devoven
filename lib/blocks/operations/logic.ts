import { Operation, DroppedItem } from '../types';

// Numbers, comparisons and true/false values. Every block here reads and
// writes plain strings so it chains like any other: "true" and "false" for
// booleans, decimal text for numbers.

const TRUE_WORDS = new Set(['true', '1', 'yes', 'on', 'y', 't']);
const FALSE_WORDS = new Set(['false', '0', 'no', 'off', 'n', 'f', '']);

/** Reads a boolean the way a person would write one; throws on anything else. */
export function parseBool(value: string, label: string): boolean {
  const v = value.trim().toLowerCase();
  if (TRUE_WORDS.has(v)) return true;
  if (FALSE_WORDS.has(v)) return false;
  throw new Error(`${label} is "${value.trim()}", expected true or false`);
}

/** Reads a number, allowing surrounding whitespace and thousands separators. */
export function parseNum(value: string, label: string): number {
  const v = value.trim().replace(/,(?=\d{3}(?:\D|$))/g, '');
  if (v === '' || !/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(v)) {
    throw new Error(`${label} is "${value.trim()}", not a number`);
  }
  return Number(v);
}

function isNumeric(value: string): boolean {
  try { parseNum(value, ''); return true; } catch { return false; }
}

/** Formats a number without float noise: 0.1 + 0.2 comes out as 0.3. */
export function formatNum(n: number): string {
  if (!Number.isFinite(n)) throw new Error(Number.isNaN(n) ? 'The result is not a number' : 'The result is infinite');
  return String(Number(n.toPrecision(15)));
}

export const COMPARISONS = [
  { value: 'eq', label: 'equals' },
  { value: 'ne', label: 'does not equal' },
  { value: 'gt', label: 'is greater than' },
  { value: 'lt', label: 'is less than' },
  { value: 'gte', label: 'is at least' },
  { value: 'lte', label: 'is at most' },
  { value: 'contains', label: 'contains' },
  { value: 'not-contains', label: 'does not contain' },
  { value: 'starts', label: 'starts with' },
  { value: 'ends', label: 'ends with' },
  { value: 'matches', label: 'matches regex' },
  { value: 'empty', label: 'is empty' },
  { value: 'not-empty', label: 'is not empty' },
];

/**
 * Compares two values. Both numeric means a numeric comparison, otherwise the
 * strings are compared as text, so "10" > "9" but "b" > "a" too.
 */
export function compare(a: string, b: string, how: string): boolean {
  const numeric = isNumeric(a) && isNumeric(b);
  const na = numeric ? parseNum(a, 'Value A') : 0;
  const nb = numeric ? parseNum(b, 'Value B') : 0;
  const sa = a.trim();
  const sb = b.trim();
  switch (how) {
    case 'eq': return numeric ? na === nb : sa === sb;
    case 'ne': return numeric ? na !== nb : sa !== sb;
    case 'gt': return numeric ? na > nb : sa > sb;
    case 'lt': return numeric ? na < nb : sa < sb;
    case 'gte': return numeric ? na >= nb : sa >= sb;
    case 'lte': return numeric ? na <= nb : sa <= sb;
    case 'contains': return a.includes(b);
    case 'not-contains': return !a.includes(b);
    case 'starts': return a.startsWith(b);
    case 'ends': return a.endsWith(b);
    case 'matches': {
      let re: RegExp;
      try { re = new RegExp(b); } catch { throw new Error(`"${b}" is not a valid regex`); }
      return re.test(a);
    }
    case 'empty': return sa === '';
    case 'not-empty': return sa !== '';
    default: throw new Error(`Unknown comparison "${how}"`);
  }
}

const twoValues = [
  { id: 'a', label: 'Value A' },
  { id: 'b', label: 'Value B' },
];

const compareParam = { id: 'how', label: 'Test', kind: 'select' as const, options: COMPARISONS, default: 'eq' };

export const logicOperations: Operation[] = [
  {
    id: 'length',
    name: 'Length',
    category: 'logic',
    params: [
      {
        id: 'unit', label: 'Count', kind: 'select', default: 'chars',
        options: [
          { value: 'chars', label: 'Characters' },
          { value: 'words', label: 'Words' },
          { value: 'lines', label: 'Lines' },
          { value: 'bytes', label: 'Bytes (UTF-8)' },
        ],
      },
    ],
    fn: (input, p) => {
      switch (p.unit) {
        case 'words': return String(input.trim() === '' ? 0 : input.trim().split(/\s+/).length);
        case 'lines': return String(input === '' ? 0 : input.split(/\r\n|\r|\n/).length);
        case 'bytes': return String(new TextEncoder().encode(input).length);
        default: return String(Array.from(input).length);
      }
    },
  },
  {
    id: 'arithmetic',
    name: 'Arithmetic',
    category: 'logic',
    inputs: twoValues,
    params: [
      {
        id: 'op', label: 'Operator', kind: 'select', default: 'add',
        options: [
          { value: 'add', label: 'A + B' },
          { value: 'sub', label: 'A − B' },
          { value: 'mul', label: 'A × B' },
          { value: 'div', label: 'A ÷ B' },
          { value: 'mod', label: 'A mod B' },
          { value: 'pow', label: 'A ^ B' },
          { value: 'min', label: 'min(A, B)' },
          { value: 'max', label: 'max(A, B)' },
        ],
      },
    ],
    fn: (_input, p) => {
      const a = parseNum(p.a ?? '', 'Value A');
      const b = parseNum(p.b ?? '', 'Value B');
      switch (p.op) {
        case 'sub': return formatNum(a - b);
        case 'mul': return formatNum(a * b);
        case 'div':
          if (b === 0) throw new Error('Cannot divide by zero');
          return formatNum(a / b);
        case 'mod':
          if (b === 0) throw new Error('Cannot divide by zero');
          return formatNum(a % b);
        case 'pow': return formatNum(a ** b);
        case 'min': return formatNum(Math.min(a, b));
        case 'max': return formatNum(Math.max(a, b));
        default: return formatNum(a + b);
      }
    },
  },
  {
    id: 'round',
    name: 'Round',
    category: 'logic',
    params: [
      {
        id: 'mode', label: 'Mode', kind: 'select', default: 'nearest',
        options: [
          { value: 'nearest', label: 'Nearest' },
          { value: 'floor', label: 'Down (floor)' },
          { value: 'ceil', label: 'Up (ceil)' },
          { value: 'trunc', label: 'Toward zero' },
        ],
      },
      { id: 'decimals', label: 'Decimals', kind: 'text', default: '0' },
    ],
    fn: (input, p) => {
      const n = parseNum(input, 'Input');
      const decimals = parseNum(p.decimals || '0', 'Decimals');
      if (!Number.isInteger(decimals) || decimals < 0 || decimals > 15) throw new Error('Decimals must be a whole number from 0 to 15');
      const scale = 10 ** decimals;
      const scaled = n * scale;
      const rounded =
        p.mode === 'floor' ? Math.floor(scaled)
        : p.mode === 'ceil' ? Math.ceil(scaled)
        : p.mode === 'trunc' ? Math.trunc(scaled)
        : Math.round(scaled);
      return (rounded / scale).toFixed(decimals);
    },
  },
  {
    id: 'compare',
    name: 'Compare',
    category: 'logic',
    inputs: twoValues,
    params: [compareParam],
    fn: (_input, p) => String(compare(p.a ?? '', p.b ?? '', p.how)),
  },
  {
    id: 'logic-and',
    name: 'And',
    category: 'logic',
    inputs: twoValues,
    params: [],
    fn: (_input, p) => String(parseBool(p.a ?? '', 'Value A') && parseBool(p.b ?? '', 'Value B')),
  },
  {
    id: 'logic-or',
    name: 'Or',
    category: 'logic',
    inputs: twoValues,
    params: [],
    fn: (_input, p) => String(parseBool(p.a ?? '', 'Value A') || parseBool(p.b ?? '', 'Value B')),
  },
  {
    id: 'logic-xor',
    name: 'Xor',
    category: 'logic',
    inputs: twoValues,
    params: [],
    fn: (_input, p) => String(parseBool(p.a ?? '', 'Value A') !== parseBool(p.b ?? '', 'Value B')),
  },
  {
    id: 'logic-not',
    name: 'Not',
    category: 'logic',
    params: [],
    fn: (input) => String(!parseBool(input, 'Input')),
  },
  {
    id: 'choose',
    name: 'Choose',
    category: 'logic',
    inputs: [
      { id: 'condition', label: 'Condition', placeholder: 'true or false' },
      { id: 'then', label: 'If true' },
      { id: 'else', label: 'If false' },
    ],
    params: [],
    fn: (_input, p) => (parseBool(p.condition ?? '', 'Condition') ? p.then ?? '' : p.else ?? ''),
  },
  {
    id: 'keep-if',
    name: 'Keep If',
    category: 'logic',
    params: [
      compareParam,
      { id: 'value', label: 'Value', kind: 'text', default: '' },
    ],
    fn: (input, p) => {
      if (compare(input, p.value ?? '', p.how)) return input;
      throw new DroppedItem();
    },
  },
];
