// ─── CBOR and MessagePack decoding ───────────────────────────────────────────
// Two binary encodings of the JSON data model, both of which carry things JSON
// cannot: byte strings, 64-bit integers, non-string map keys, and tagged or
// extension values. Decoding produces a JS value plus a note of anything JSON
// had to be told about.

import { BinaryEncoding, decodeBytes } from '@/Components/Functions/CompressionTools/logic';

export type { BinaryEncoding };

/** A byte string, kept apart from a text string so the output can say which. */
export class ByteString {
  constructor(readonly bytes: Uint8Array) {}
  toHex(): string {
    return [...this.bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
}

/** A CBOR tag or a MessagePack extension: a number and the value it wraps. */
export class TaggedValue {
  constructor(readonly tag: number | bigint, readonly value: unknown, readonly label?: string) {}
}

export type DecodeReport = {
  value: unknown;
  /** Bytes consumed. Less than the input means trailing data. */
  consumed: number;
  /** Anything the reader had to note: bignums, extensions, indefinite lengths. */
  notes: string[];
};

// ─── Shared reader ────────────────────────────────────────────────────────────

class Reader {
  offset = 0;
  readonly notes: string[] = [];
  private readonly view: DataView;

  constructor(readonly bytes: Uint8Array) {
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  note(message: string): void {
    if (!this.notes.includes(message)) this.notes.push(message);
  }

  need(count: number): void {
    if (this.offset + count > this.bytes.length) {
      throw new Error(`The data ends mid-value at byte ${this.offset}`);
    }
  }

  u8(): number { this.need(1); return this.bytes[this.offset++]; }
  u16(): number { this.need(2); const v = this.view.getUint16(this.offset); this.offset += 2; return v; }
  u32(): number { this.need(4); const v = this.view.getUint32(this.offset); this.offset += 4; return v; }
  u64(): bigint { this.need(8); const v = this.view.getBigUint64(this.offset); this.offset += 8; return v; }
  i8(): number { this.need(1); const v = this.view.getInt8(this.offset); this.offset += 1; return v; }
  i16(): number { this.need(2); const v = this.view.getInt16(this.offset); this.offset += 2; return v; }
  i32(): number { this.need(4); const v = this.view.getInt32(this.offset); this.offset += 4; return v; }
  i64(): bigint { this.need(8); const v = this.view.getBigInt64(this.offset); this.offset += 8; return v; }
  f32(): number { this.need(4); const v = this.view.getFloat32(this.offset); this.offset += 4; return v; }
  f64(): number { this.need(8); const v = this.view.getFloat64(this.offset); this.offset += 8; return v; }

  slice(length: number): Uint8Array {
    this.need(length);
    const out = this.bytes.subarray(this.offset, this.offset + length);
    this.offset += length;
    return out;
  }

  text(length: number): string {
    return new TextDecoder('utf-8', { fatal: false }).decode(this.slice(length));
  }

  /** Half floats have no DataView method, so unpack the IEEE 754 binary16. */
  f16(): number {
    const bits = this.u16();
    const sign = bits & 0x8000 ? -1 : 1;
    const exponent = (bits >> 10) & 0x1f;
    const fraction = bits & 0x3ff;
    if (exponent === 0) return sign * 2 ** -14 * (fraction / 1024);
    if (exponent === 0x1f) return fraction === 0 ? sign * Infinity : NaN;
    return sign * 2 ** (exponent - 15) * (1 + fraction / 1024);
  }
}

/** Numbers past 2^53 lose precision as a JS number, so they stay BigInt. */
function narrow(value: bigint): number | bigint {
  return value <= BigInt(Number.MAX_SAFE_INTEGER) && value >= BigInt(Number.MIN_SAFE_INTEGER)
    ? Number(value)
    : value;
}

const MAX_DEPTH = 200;

// ─── CBOR (RFC 8949) ──────────────────────────────────────────────────────────

const CBOR_TAGS: Record<number, string> = {
  0: 'date/time string',
  1: 'epoch date/time',
  2: 'unsigned bignum',
  3: 'negative bignum',
  4: 'decimal fraction',
  5: 'bigfloat',
  21: 'expected base64url',
  22: 'expected base64',
  23: 'expected base16',
  24: 'encoded CBOR data item',
  32: 'URI',
  33: 'base64url string',
  34: 'base64 string',
  36: 'MIME message',
  37: 'UUID',
  55799: 'self-described CBOR',
};

const BREAK = Symbol('cbor-break');

function readCborLength(reader: Reader, info: number): number | bigint | null {
  if (info < 24) return info;
  if (info === 24) return reader.u8();
  if (info === 25) return reader.u16();
  if (info === 26) return reader.u32();
  if (info === 27) return reader.u64();
  if (info === 31) return null; // indefinite
  throw new Error(`Reserved additional information ${info} at byte ${reader.offset - 1}`);
}

function bignumFromBytes(bytes: Uint8Array): bigint {
  let value = 0n;
  for (const byte of bytes) value = (value << 8n) | BigInt(byte);
  return value;
}

function readCbor(reader: Reader, depth = 0): unknown {
  if (depth > MAX_DEPTH) throw new Error('Nested too deeply to decode');

  const initial = reader.u8();
  const major = initial >> 5;
  const info = initial & 0x1f;

  switch (major) {
    case 0: {
      const length = readCborLength(reader, info);
      if (length === null) throw new Error('An integer cannot have an indefinite length');
      return typeof length === 'bigint' ? narrow(length) : length;
    }
    case 1: {
      const length = readCborLength(reader, info);
      if (length === null) throw new Error('An integer cannot have an indefinite length');
      const magnitude = typeof length === 'bigint' ? length : BigInt(length);
      return narrow(-1n - magnitude);
    }
    case 2: {
      const length = readCborLength(reader, info);
      if (length === null) {
        reader.note('Indefinite-length byte string, joined from its chunks.');
        const chunks: Uint8Array[] = [];
        for (;;) {
          const chunk = readCbor(reader, depth + 1);
          if (chunk === BREAK) break;
          if (!(chunk instanceof ByteString)) throw new Error('An indefinite byte string can only hold byte strings');
          chunks.push(chunk.bytes);
        }
        const total = chunks.reduce((sum, c) => sum + c.length, 0);
        const joined = new Uint8Array(total);
        let at = 0;
        for (const chunk of chunks) { joined.set(chunk, at); at += chunk.length; }
        return new ByteString(joined);
      }
      return new ByteString(reader.slice(Number(length)));
    }
    case 3: {
      const length = readCborLength(reader, info);
      if (length === null) {
        reader.note('Indefinite-length text string, joined from its chunks.');
        let text = '';
        for (;;) {
          const chunk = readCbor(reader, depth + 1);
          if (chunk === BREAK) break;
          if (typeof chunk !== 'string') throw new Error('An indefinite text string can only hold text strings');
          text += chunk;
        }
        return text;
      }
      return reader.text(Number(length));
    }
    case 4: {
      const length = readCborLength(reader, info);
      const out: unknown[] = [];
      if (length === null) {
        reader.note('Indefinite-length array, read until its break byte.');
        for (;;) {
          const item = readCbor(reader, depth + 1);
          if (item === BREAK) break;
          out.push(item);
        }
        return out;
      }
      for (let i = 0; i < Number(length); i++) out.push(readCbor(reader, depth + 1));
      return out;
    }
    case 5: {
      const length = readCborLength(reader, info);
      const entries: [unknown, unknown][] = [];
      if (length === null) {
        reader.note('Indefinite-length map, read until its break byte.');
        for (;;) {
          const key = readCbor(reader, depth + 1);
          if (key === BREAK) break;
          entries.push([key, readCbor(reader, depth + 1)]);
        }
      } else {
        for (let i = 0; i < Number(length); i++) {
          entries.push([readCbor(reader, depth + 1), readCbor(reader, depth + 1)]);
        }
      }
      return mapFromEntries(entries, reader);
    }
    case 6: {
      const tag = readCborLength(reader, info);
      if (tag === null) throw new Error('A tag cannot have an indefinite length');
      const value = readCbor(reader, depth + 1);
      const number = Number(tag);

      if ((number === 2 || number === 3) && value instanceof ByteString) {
        reader.note('Bignum tag decoded to an exact integer.');
        const magnitude = bignumFromBytes(value.bytes);
        return narrow(number === 2 ? magnitude : -1n - magnitude);
      }
      if (number === 1 && typeof value === 'number') {
        reader.note('Epoch timestamp tag shown as an ISO date.');
        return new Date(value * 1000).toISOString();
      }
      const label = CBOR_TAGS[number];
      if (label) reader.note(`Tag ${number} (${label}) kept as a tagged value.`);
      else reader.note(`Unknown tag ${number} kept as a tagged value.`);
      return new TaggedValue(typeof tag === 'bigint' ? tag : number, value, label);
    }
    default: {
      if (info === 20) return false;
      if (info === 21) return true;
      if (info === 22) return null;
      if (info === 23) { reader.note('CBOR "undefined" shown as null.'); return null; }
      if (info === 25) return reader.f16();
      if (info === 26) return reader.f32();
      if (info === 27) return reader.f64();
      if (info === 31) return BREAK;
      const simple = info === 24 ? reader.u8() : info;
      reader.note(`Simple value ${simple} kept as a tagged value.`);
      return new TaggedValue(simple, null, 'simple value');
    }
  }
}

// ─── MessagePack ──────────────────────────────────────────────────────────────

function readMessagePack(reader: Reader, depth = 0): unknown {
  if (depth > MAX_DEPTH) throw new Error('Nested too deeply to decode');

  const byte = reader.u8();

  if (byte <= 0x7f) return byte;
  if (byte >= 0xe0) return byte - 256;
  if (byte >= 0x80 && byte <= 0x8f) return readMap(reader, byte & 0x0f, depth);
  if (byte >= 0x90 && byte <= 0x9f) return readArray(reader, byte & 0x0f, depth);
  if (byte >= 0xa0 && byte <= 0xbf) return reader.text(byte & 0x1f);

  switch (byte) {
    case 0xc0: return null;
    case 0xc1: throw new Error(`Byte 0xc1 is never valid MessagePack (at byte ${reader.offset - 1})`);
    case 0xc2: return false;
    case 0xc3: return true;
    case 0xc4: return new ByteString(reader.slice(reader.u8()));
    case 0xc5: return new ByteString(reader.slice(reader.u16()));
    case 0xc6: return new ByteString(reader.slice(reader.u32()));
    case 0xc7: return readExtension(reader, reader.u8());
    case 0xc8: return readExtension(reader, reader.u16());
    case 0xc9: return readExtension(reader, reader.u32());
    case 0xca: return reader.f32();
    case 0xcb: return reader.f64();
    case 0xcc: return reader.u8();
    case 0xcd: return reader.u16();
    case 0xce: return reader.u32();
    case 0xcf: return narrow(reader.u64());
    case 0xd0: return reader.i8();
    case 0xd1: return reader.i16();
    case 0xd2: return reader.i32();
    case 0xd3: return narrow(reader.i64());
    case 0xd4: return readExtension(reader, 1);
    case 0xd5: return readExtension(reader, 2);
    case 0xd6: return readExtension(reader, 4);
    case 0xd7: return readExtension(reader, 8);
    case 0xd8: return readExtension(reader, 16);
    case 0xd9: return reader.text(reader.u8());
    case 0xda: return reader.text(reader.u16());
    case 0xdb: return reader.text(reader.u32());
    case 0xdc: return readArray(reader, reader.u16(), depth);
    case 0xdd: return readArray(reader, reader.u32(), depth);
    case 0xde: return readMap(reader, reader.u16(), depth);
    case 0xdf: return readMap(reader, reader.u32(), depth);
    default: throw new Error(`Unknown MessagePack byte 0x${byte.toString(16)} at byte ${reader.offset - 1}`);
  }
}

function readArray(reader: Reader, length: number, depth: number): unknown[] {
  const out: unknown[] = [];
  for (let i = 0; i < length; i++) out.push(readMessagePack(reader, depth + 1));
  return out;
}

function readMap(reader: Reader, length: number, depth: number): Record<string, unknown> {
  const entries: [unknown, unknown][] = [];
  for (let i = 0; i < length; i++) {
    entries.push([readMessagePack(reader, depth + 1), readMessagePack(reader, depth + 1)]);
  }
  return mapFromEntries(entries, reader);
}

/** Timestamps are extension type -1; everything else is handed back as is. */
function readExtension(reader: Reader, length: number): unknown {
  const type = reader.i8();
  const data = reader.slice(length);

  if (type === -1) {
    reader.note('Timestamp extension shown as an ISO date.');
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    if (length === 4) return new Date(view.getUint32(0) * 1000).toISOString();
    if (length === 8) {
      const packed = view.getBigUint64(0);
      const nanoseconds = Number(packed >> 34n);
      const seconds = Number(packed & 0x3ffffffffn);
      return new Date(seconds * 1000 + nanoseconds / 1e6).toISOString();
    }
    if (length === 12) {
      const nanoseconds = view.getUint32(0);
      const seconds = view.getBigInt64(4);
      return new Date(Number(seconds) * 1000 + nanoseconds / 1e6).toISOString();
    }
  }

  reader.note(`Extension type ${type} kept as a tagged value.`);
  return new TaggedValue(type, new ByteString(data), 'extension');
}

// ─── Shared map handling ──────────────────────────────────────────────────────

/**
 * JSON keys are strings, so a numeric or structured key is stringified and the
 * reader says it happened rather than quietly losing the distinction.
 */
function mapFromEntries(entries: [unknown, unknown][], reader: Reader): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of entries) {
    let name: string;
    if (typeof key === 'string') {
      name = key;
    } else if (typeof key === 'number' || typeof key === 'bigint' || typeof key === 'boolean' || key === null) {
      name = String(key);
      reader.note('Non-string map keys were converted to strings.');
    } else {
      name = JSON.stringify(toJsonReady(key));
      reader.note('Non-string map keys were converted to strings.');
    }
    if (name in out) reader.note(`Duplicate key "${name}"; the last one wins.`);
    out[name] = value;
  }
  return out;
}

// ─── Rendering ────────────────────────────────────────────────────────────────

/** Replaces the values JSON has no shape for, so `JSON.stringify` can run. */
export function toJsonReady(value: unknown): unknown {
  if (value instanceof ByteString) return { '$bytes': value.toHex() };
  if (value instanceof TaggedValue) {
    return value.label
      ? { '$tag': Number(value.tag), '$label': value.label, value: toJsonReady(value.value) }
      : { '$tag': Number(value.tag), value: toJsonReady(value.value) };
  }
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'number' && !Number.isFinite(value)) return String(value);
  if (Array.isArray(value)) return value.map(toJsonReady);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value)) out[key] = toJsonReady(inner);
    return out;
  }
  return value;
}

export type BinaryFormat = 'cbor' | 'msgpack';

/** Reads the bytes and reports what was there, without formatting anything. */
export function decodeBinaryFormat(bytes: Uint8Array, format: BinaryFormat): DecodeReport {
  if (bytes.length === 0) throw new Error('No bytes to decode');
  const reader = new Reader(bytes);
  const value = format === 'cbor' ? readCbor(reader) : readMessagePack(reader);
  if (value === BREAK) throw new Error('The data starts with a break byte');
  return { value, consumed: reader.offset, notes: reader.notes };
}

export type BinaryDecodeOptions = {
  encoding?: BinaryEncoding;
  indent?: number;
};

export type BinaryDecodeResult = {
  json: string;
  notes: string[];
  totalBytes: number;
  consumed: number;
};

/** The tool's entry point: encoded bytes in, JSON and a list of notes out. */
export function decodeToJson(
  input: string,
  format: BinaryFormat,
  options: BinaryDecodeOptions = {},
): BinaryDecodeResult {
  const text = input.trim();
  if (!text) throw new Error('Paste the bytes as hex or Base64');

  const encoding = options.encoding ?? detectEncoding(text);
  let bytes: Uint8Array;
  try {
    bytes = decodeBytes(text.replace(/\s+/g, ''), encoding);
  } catch {
    throw new Error(`Cannot read the input as ${encoding === 'hex' ? 'hex' : 'Base64'}`);
  }

  const report = decodeBinaryFormat(bytes, format);
  const notes = [...report.notes];
  if (report.consumed < bytes.length) {
    notes.push(`${bytes.length - report.consumed} trailing byte(s) after the first value.`);
  }

  return {
    json: JSON.stringify(toJsonReady(report.value), null, options.indent ?? 2),
    notes,
    totalBytes: bytes.length,
    consumed: report.consumed,
  };
}

/** Hex unless the text contains something only Base64 could hold. */
export function detectEncoding(input: string): BinaryEncoding {
  const clean = input.replace(/\s+/g, '');
  return /^[0-9a-fA-F]*$/.test(clean) && clean.length % 2 === 0 ? 'hex' : 'base64';
}

/** The one-string form the pipeline needs. */
export function decodeBinaryToJson(
  input: string,
  format: BinaryFormat,
  encoding?: BinaryEncoding,
): string {
  return decodeToJson(input, format, { encoding }).json;
}

export const CBOR_SAMPLE = 'a3646e616d6564636f7265656974656d7382010263746167f5';
export const MSGPACK_SAMPLE = '83a46e616d65a4636f7265a56974656d73920102a3746167c3';
