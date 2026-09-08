// ─── PHP serialize() and unserialize() ───────────────────────────────────────
// The format is length-prefixed and untyped-ish: `a:2:{i:0;s:1:"a";i:1;N;}`.
// Lengths on strings count bytes, not characters, which is the part hand-written
// payloads usually get wrong.

export type PhpValue =
  | null
  | boolean
  | number
  | string
  | PhpArray
  | PhpObject
  | PhpReference
  | PhpEnum;

/** PHP arrays are ordered maps, so the keys are kept as written. */
export type PhpArray = { kind: 'array'; entries: [string | number, PhpValue][] };
export type PhpObject = { kind: 'object'; className: string; entries: [string, PhpValue][] };
export type PhpReference = { kind: 'reference'; index: number; object: boolean };
export type PhpEnum = { kind: 'enum'; name: string };

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// ─── Unserialize ──────────────────────────────────────────────────────────────

class PhpReader {
  offset = 0;
  /** Byte view, because `s:` lengths are byte counts. */
  readonly bytes: Uint8Array;

  constructor(readonly source: string) {
    this.bytes = encoder.encode(source);
  }

  fail(message: string): never {
    throw new Error(`${message} at byte ${this.offset}`);
  }

  peek(): string {
    if (this.offset >= this.bytes.length) this.fail('The data ends early');
    return String.fromCharCode(this.bytes[this.offset]);
  }

  expect(char: string): void {
    if (this.peek() !== char) this.fail(`Expected "${char}"`);
    this.offset++;
  }

  /** Reads up to `stop`, which is consumed. */
  until(stop: string): string {
    const target = stop.charCodeAt(0);
    const start = this.offset;
    while (this.offset < this.bytes.length && this.bytes[this.offset] !== target) this.offset++;
    if (this.offset >= this.bytes.length) this.fail(`Expected "${stop}"`);
    const text = decoder.decode(this.bytes.subarray(start, this.offset));
    this.offset++;
    return text;
  }

  takeBytes(length: number): string {
    if (this.offset + length > this.bytes.length) this.fail('A string is shorter than its declared length');
    const text = decoder.decode(this.bytes.subarray(this.offset, this.offset + length));
    this.offset += length;
    return text;
  }
}

function readInteger(reader: PhpReader, stop: string, what: string): number {
  const text = reader.until(stop);
  if (!/^-?\d+$/.test(text)) reader.fail(`"${text}" is not a valid ${what}`);
  return Number(text);
}

function readValue(reader: PhpReader, depth = 0): PhpValue {
  if (depth > 200) reader.fail('Nested too deeply to read');
  const type = reader.peek();

  switch (type) {
    case 'N':
      reader.offset++;
      reader.expect(';');
      return null;

    case 'b': {
      reader.offset++;
      reader.expect(':');
      const value = reader.until(';');
      if (value !== '0' && value !== '1') reader.fail(`"${value}" is not a boolean`);
      return value === '1';
    }

    case 'i':
      reader.offset++;
      reader.expect(':');
      return readInteger(reader, ';', 'integer');

    case 'd': {
      reader.offset++;
      reader.expect(':');
      const text = reader.until(';');
      if (text === 'INF') return Infinity;
      if (text === '-INF') return -Infinity;
      if (text === 'NAN') return NaN;
      const value = Number(text);
      if (Number.isNaN(value)) reader.fail(`"${text}" is not a float`);
      return value;
    }

    case 's': {
      reader.offset++;
      reader.expect(':');
      const length = readInteger(reader, ':', 'string length');
      reader.expect('"');
      const text = reader.takeBytes(length);
      reader.expect('"');
      reader.expect(';');
      return text;
    }

    case 'a': {
      reader.offset++;
      reader.expect(':');
      const count = readInteger(reader, ':', 'array length');
      reader.expect('{');
      const entries: [string | number, PhpValue][] = [];
      for (let i = 0; i < count; i++) {
        const key = readValue(reader, depth + 1);
        if (typeof key !== 'string' && typeof key !== 'number') reader.fail('An array key must be an integer or a string');
        entries.push([key, readValue(reader, depth + 1)]);
      }
      reader.expect('}');
      return { kind: 'array', entries };
    }

    case 'O': {
      reader.offset++;
      reader.expect(':');
      const nameLength = readInteger(reader, ':', 'class name length');
      reader.expect('"');
      const className = reader.takeBytes(nameLength);
      reader.expect('"');
      reader.expect(':');
      const count = readInteger(reader, ':', 'property count');
      reader.expect('{');
      const entries: [string, PhpValue][] = [];
      for (let i = 0; i < count; i++) {
        const key = readValue(reader, depth + 1);
        if (typeof key !== 'string') reader.fail('A property name must be a string');
        entries.push([key, readValue(reader, depth + 1)]);
      }
      reader.expect('}');
      return { kind: 'object', className, entries };
    }

    case 'E': {
      reader.offset++;
      reader.expect(':');
      const length = readInteger(reader, ':', 'enum name length');
      reader.expect('"');
      const name = reader.takeBytes(length);
      reader.expect('"');
      reader.expect(';');
      return { kind: 'enum', name };
    }

    case 'R':
    case 'r': {
      const object = type === 'r';
      reader.offset++;
      reader.expect(':');
      return { kind: 'reference', index: readInteger(reader, ';', 'reference'), object };
    }

    default:
      return reader.fail(`"${type}" is not a PHP serialization type`);
  }
}

export type UnserializeResult = {
  value: PhpValue;
  /** Bytes consumed; less than the input means trailing data. */
  consumed: number;
};

export function phpUnserialize(source: string): UnserializeResult {
  const text = source.trim();
  if (!text) throw new Error('Paste a serialized PHP value');
  const reader = new PhpReader(text);
  const value = readValue(reader);
  return { value, consumed: reader.offset };
}

// ─── Rendering as JSON ────────────────────────────────────────────────────────

/**
 * PHP has shapes JSON does not, so the ones that would otherwise vanish get a
 * `$`-prefixed wrapper: a class name, an enum case, a back reference.
 */
export function phpToJsonValue(value: PhpValue): unknown {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : String(value);

  switch (value.kind) {
    case 'reference':
      return { [value.object ? '$objectRef' : '$ref']: value.index };
    case 'enum':
      return { $enum: value.name };
    case 'object': {
      const out: Record<string, unknown> = { $class: value.className };
      for (const [key, inner] of value.entries) out[cleanPropertyName(key)] = phpToJsonValue(inner);
      return out;
    }
    case 'array': {
      // A list in PHP is an array whose keys are 0..n-1, and that is the only
      // case where a JSON array says the same thing.
      const isList = value.entries.every(([key], index) => key === index);
      if (isList) return value.entries.map(([, inner]) => phpToJsonValue(inner));
      const out: Record<string, unknown> = {};
      for (const [key, inner] of value.entries) out[String(key)] = phpToJsonValue(inner);
      return out;
    }
  }
}

/**
 * Private and protected properties are serialized with NUL-delimited prefixes
 * (`\0Class\0prop`, `\0*\0prop`). Made readable, with the visibility kept.
 */
function cleanPropertyName(name: string): string {
  const match = name.match(/^\0(\*|[^\0]+)\0(.+)$/);
  if (!match) return name;
  return match[1] === '*' ? `${match[2]} (protected)` : `${match[2]} (private ${match[1]})`;
}

export function phpToJson(source: string, indent = 2): string {
  const { value, consumed } = phpUnserialize(source);
  const json = JSON.stringify(phpToJsonValue(value), null, indent);
  const trailing = source.trim().length - consumed;
  return trailing > 0 ? `${json}\n\n// ${trailing} trailing byte(s) after the value` : json;
}

// ─── Serialize ────────────────────────────────────────────────────────────────

function serializeValue(value: unknown, depth = 0): string {
  if (depth > 200) throw new Error('Nested too deeply to serialize');
  if (value === null || value === undefined) return 'N;';
  if (typeof value === 'boolean') return `b:${value ? 1 : 0};`;
  if (typeof value === 'number') {
    if (Number.isInteger(value) && Math.abs(value) <= Number.MAX_SAFE_INTEGER) return `i:${value};`;
    if (value === Infinity) return 'd:INF;';
    if (value === -Infinity) return 'd:-INF;';
    if (Number.isNaN(value)) return 'd:NAN;';
    return `d:${value};`;
  }
  if (typeof value === 'string') return `s:${encoder.encode(value).length}:"${value}";`;

  if (Array.isArray(value)) {
    const body = value.map((item, index) => `i:${index};${serializeValue(item, depth + 1)}`).join('');
    return `a:${value.length}:{${body}}`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    const body = entries
      .map(([key, item]) => {
        // A numeric string key is an integer key in PHP.
        const phpKey = /^-?\d+$/.test(key) ? `i:${key};` : `s:${encoder.encode(key).length}:"${key}";`;
        return phpKey + serializeValue(item, depth + 1);
      })
      .join('');
    return `a:${entries.length}:{${body}}`;
  }

  throw new Error(`Cannot serialize a ${typeof value}`);
}

/** JSON in, a PHP serialized string out. */
export function jsonToPhp(source: string): string {
  const text = source.trim();
  if (!text) throw new Error('Paste some JSON');
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e: unknown) {
    throw new Error(`Not valid JSON: ${e instanceof Error ? e.message : 'parse error'}`);
  }
  return serializeValue(parsed);
}

export const PHP_SAMPLE =
  'a:3:{s:4:"name";s:5:"Alice";s:5:"roles";a:2:{i:0;s:5:"admin";i:1;s:6:"editor";}s:6:"active";b:1;}';
