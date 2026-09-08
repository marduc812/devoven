// ─── Rison ───────────────────────────────────────────────────────────────────
// The compact, URL-safe serialization Kibana puts in its `_a` and `_g` query
// parameters. `(query:(match:(host:web-1)),size:20)` is the same data as the
// JSON, with fewer characters that need percent-encoding.

export type RisonMode = 'rison' | 'o-rison' | 'a-rison';

/** Characters that need no quoting inside a Rison identifier. */
const NOT_ID_START = /[-0-9 '!:(),*@$]/;
const NOT_ID_CHAR = /[ '!:(),*@$]/;

// ─── Decode ───────────────────────────────────────────────────────────────────

class RisonReader {
  offset = 0;

  constructor(readonly source: string) {}

  fail(message: string): never {
    throw new Error(`${message} at character ${this.offset + 1}`);
  }

  peek(): string {
    return this.source[this.offset] ?? '';
  }

  next(): string {
    if (this.offset >= this.source.length) this.fail('The value ends early');
    return this.source[this.offset++];
  }

  expect(char: string): void {
    if (this.peek() !== char) this.fail(`Expected "${char}"`);
    this.offset++;
  }
}

function readRison(reader: RisonReader, depth = 0): unknown {
  if (depth > 200) reader.fail('Nested too deeply to read');
  const char = reader.peek();

  if (char === '!') {
    reader.offset++;
    const kind = reader.next();
    if (kind === 't') return true;
    if (kind === 'f') return false;
    if (kind === 'n') return null;
    if (kind === '(') return readArrayBody(reader, depth);
    reader.fail(`"!${kind}" is not a Rison value`);
  }

  if (char === '(') {
    reader.offset++;
    return readObjectBody(reader, depth);
  }

  if (char === "'") return readQuoted(reader);

  if (char === '-' || (char >= '0' && char <= '9')) return readNumber(reader);

  return readIdentifier(reader);
}

function readArrayBody(reader: RisonReader, depth: number): unknown[] {
  const out: unknown[] = [];
  if (reader.peek() === ')') { reader.offset++; return out; }
  for (;;) {
    out.push(readRison(reader, depth + 1));
    const separator = reader.next();
    if (separator === ')') return out;
    if (separator !== ',') reader.fail(`Expected "," or ")", found "${separator}"`);
  }
}

function readObjectBody(reader: RisonReader, depth: number): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (reader.peek() === ')') { reader.offset++; return out; }
  for (;;) {
    const key = readRison(reader, depth + 1);
    if (typeof key !== 'string' && typeof key !== 'number') reader.fail('An object key must be a string or a number');
    reader.expect(':');
    out[String(key)] = readRison(reader, depth + 1);
    const separator = reader.next();
    if (separator === ')') return out;
    if (separator !== ',') reader.fail(`Expected "," or ")", found "${separator}"`);
  }
}

function readQuoted(reader: RisonReader): string {
  reader.expect("'");
  let out = '';
  for (;;) {
    const char = reader.next();
    if (char === "'") return out;
    if (char === '!') {
      const escaped = reader.next();
      if (escaped !== '!' && escaped !== "'") reader.fail(`"!${escaped}" is not an escape inside a string`);
      out += escaped;
      continue;
    }
    out += char;
  }
}

function readNumber(reader: RisonReader): number {
  const match = reader.source.slice(reader.offset).match(/^-?(?:\d+)(?:\.\d+)?(?:e-?\d+)?/);
  if (!match) reader.fail('Not a number');
  reader.offset += match[0].length;
  const value = Number(match[0]);
  if (Number.isNaN(value)) reader.fail('Not a number');
  return value;
}

function readIdentifier(reader: RisonReader): string {
  const start = reader.offset;
  if (reader.offset >= reader.source.length) reader.fail('A value is missing');
  if (NOT_ID_START.test(reader.peek())) reader.fail(`"${reader.peek()}" cannot start an identifier`);
  reader.offset++;
  while (reader.offset < reader.source.length && !NOT_ID_CHAR.test(reader.source[reader.offset])) {
    reader.offset++;
  }
  return reader.source.slice(start, reader.offset);
}

/**
 * `o-rison` and `a-rison` are the forms Kibana puts in a URL with the outer
 * brackets left off, which is why a raw `_a=` value often will not parse as
 * plain Rison.
 */
export function decodeRison(source: string, mode: RisonMode = 'rison'): unknown {
  const text = source.trim();
  if (!text) throw new Error('Paste a Rison value');

  // The bracket-less forms are read by supplying the closing bracket the URL
  // left off, so the same body readers do the work.
  if (mode !== 'rison') {
    const reader = new RisonReader(`${text})`);
    const value = mode === 'a-rison' ? readArrayBody(reader, 0) : readObjectBody(reader, 0);
    if (reader.offset < reader.source.length) reader.fail('Trailing characters after the value');
    return value;
  }

  const reader = new RisonReader(text);
  const value = readRison(reader, 0);
  if (reader.offset < text.length) reader.fail('Trailing characters after the value');
  return value;
}

export function risonToJson(source: string, mode: RisonMode = 'rison', indent = 2): string {
  return JSON.stringify(decodeRison(source, mode), null, indent);
}

// ─── Encode ───────────────────────────────────────────────────────────────────

function quoteString(value: string): string {
  if (value === '') return "''";
  const bare = !NOT_ID_START.test(value[0]) && ![...value.slice(1)].some((c) => NOT_ID_CHAR.test(c));
  // A bare identifier that would read back as a number has to be quoted.
  if (bare && !/^-?\d/.test(value)) return value;
  return `'${value.replace(/([!'])/g, '!$1')}'`;
}

function writeRison(value: unknown, depth = 0): string {
  if (depth > 200) throw new Error('Nested too deeply to encode');
  if (value === null || value === undefined) return '!n';
  if (typeof value === 'boolean') return value ? '!t' : '!f';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Rison has no way to write Infinity or NaN');
    return String(value);
  }
  if (typeof value === 'string') return quoteString(value);
  if (Array.isArray(value)) return `!(${value.map((item) => writeRison(item, depth + 1)).join(',')})`;
  if (typeof value === 'object') {
    // Kibana sorts keys, and so does the reference implementation, so a round
    // trip through here produces a stable URL.
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `(${entries.map(([key, item]) => `${quoteString(key)}:${writeRison(item, depth + 1)}`).join(',')})`;
  }
  throw new Error(`Cannot encode a ${typeof value} as Rison`);
}

export function encodeRison(value: unknown, mode: RisonMode = 'rison'): string {
  const text = writeRison(value);
  if (mode === 'o-rison') {
    if (!text.startsWith('(')) throw new Error('o-rison needs an object');
    return text.slice(1, -1);
  }
  if (mode === 'a-rison') {
    if (!text.startsWith('!(')) throw new Error('a-rison needs an array');
    return text.slice(2, -1);
  }
  return text;
}

export function jsonToRison(source: string, mode: RisonMode = 'rison'): string {
  const text = source.trim();
  if (!text) throw new Error('Paste some JSON');
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e: unknown) {
    throw new Error(`Not valid JSON: ${e instanceof Error ? e.message : 'parse error'}`);
  }
  return encodeRison(parsed, mode);
}

export const RISON_SAMPLE =
  "(query:(bool:(filter:!((match_phrase:(host:'web-1'))))),size:20,sort:!((timestamp:desc)))";
