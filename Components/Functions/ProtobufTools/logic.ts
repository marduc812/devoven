// All functions in this file are pure (no React, no browser APIs).
// Generic protobuf binary decoder (schema-less).

export type WireType = 0 | 1 | 2 | 5;

export const WIRE_TYPE_LABELS: Record<number, string> = {
  0: 'Varint',
  1: '64-bit',
  2: 'Length-delimited',
  3: 'Start group (deprecated)',
  4: 'End group (deprecated)',
  5: '32-bit',
};

export type ProtoField = {
  fieldNumber: number;
  wireType: number;
  wireTypeLabel: string;
  rawValueHex: string;
  interpretations: string[];
};

export type ProtoDecodeResult = {
  fields: ProtoField[];
  bytesConsumed: number;
  error?: string;
};

function readVarint(bytes: number[], offset: number): { value: number; bytesRead: number } {
  let result = 0;
  let shift = 0;
  let bytesRead = 0;

  while (offset + bytesRead < bytes.length) {
    const byte = bytes[offset + bytesRead];
    bytesRead++;
    result = result | ((byte & 0x7F) << shift);
    if ((byte & 0x80) === 0) break;
    shift += 7;
    if (shift >= 35) break; // max 5 bytes for 32-bit safe
  }

  return { value: result >>> 0, bytesRead };
}

function decodeBase64(input: string): number[] {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean = input.replace(/[^A-Za-z0-9+/=]/g, '');
  const bytes: number[] = [];
  let i = 0;
  while (i < clean.length) {
    const a = chars.indexOf(clean[i++]);
    const b = chars.indexOf(clean[i++]);
    const c = i < clean.length ? chars.indexOf(clean[i++]) : 0;
    const d = i < clean.length ? chars.indexOf(clean[i++]) : 0;

    const triple = (a << 18) | (b << 12) | ((c & 0x3F) << 6) | (d & 0x3F);
    bytes.push((triple >> 16) & 0xFF);
    if (c !== -1 && clean[i - 2] !== '=') bytes.push((triple >> 8) & 0xFF);
    if (d !== -1 && clean[i - 1] !== '=') bytes.push(triple & 0xFF);
  }
  return bytes;
}

function hexToBytes(input: string): number[] {
  const clean = input.replace(/[^0-9a-fA-F]/g, '');
  if (clean.length % 2 !== 0) throw new Error('Hex string must have an even number of hex digits');
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 2) {
    bytes.push(parseInt(clean.slice(i, i + 2), 16));
  }
  return bytes;
}

function tryDecodeUtf8(bytes: number[]): string | null {
  try {
    let result = '';
    let i = 0;
    while (i < bytes.length) {
      const b = bytes[i];
      if (b < 0x80) {
        if (b < 0x20 && b !== 0x09 && b !== 0x0A && b !== 0x0D) return null; // non-printable
        result += String.fromCharCode(b);
        i++;
      } else if ((b & 0xE0) === 0xC0) {
        if (i + 1 >= bytes.length) return null;
        const codePoint = ((b & 0x1F) << 6) | (bytes[i + 1] & 0x3F);
        result += String.fromCharCode(codePoint);
        i += 2;
      } else if ((b & 0xF0) === 0xE0) {
        if (i + 2 >= bytes.length) return null;
        const codePoint = ((b & 0x0F) << 12) | ((bytes[i + 1] & 0x3F) << 6) | (bytes[i + 2] & 0x3F);
        result += String.fromCharCode(codePoint);
        i += 3;
      } else if ((b & 0xF8) === 0xF0) {
        if (i + 3 >= bytes.length) return null;
        const codePoint = ((b & 0x07) << 18) | ((bytes[i + 1] & 0x3F) << 12) | ((bytes[i + 2] & 0x3F) << 6) | (bytes[i + 3] & 0x3F);
        result += String.fromCodePoint(codePoint);
        i += 4;
      } else {
        return null;
      }
    }
    return result;
  } catch {
    return null;
  }
}

function bytesToHex(bytes: number[]): string {
  return bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
}

function interpretLengthDelimited(bytes: number[]): string[] {
  const interpretations: string[] = [];

  // Try UTF-8 string
  const text = tryDecodeUtf8(bytes);
  if (text !== null) {
    interpretations.push(`string: "${text}"`);
  }

  // Try nested protobuf
  try {
    const nested = decodeProtoBytes(bytes);
    if (nested.fields.length > 0 && !nested.error) {
      const summary = nested.fields.map(f => `field ${f.fieldNumber} (${f.wireTypeLabel})`).join(', ');
      interpretations.push(`embedded message: { ${summary} }`);
    }
  } catch {
    // not a nested message
  }

  // Show as hex
  if (bytes.length <= 32) {
    interpretations.push(`bytes: ${bytesToHex(bytes)}`);
  } else {
    interpretations.push(`bytes: ${bytesToHex(bytes.slice(0, 32))}... (${bytes.length} total)`);
  }

  return interpretations;
}

export function decodeProtoBytes(bytes: number[]): ProtoDecodeResult {
  const fields: ProtoField[] = [];
  let offset = 0;

  while (offset < bytes.length) {
    const tagResult = readVarint(bytes, offset);
    offset += tagResult.bytesRead;
    const tag = tagResult.value;

    const fieldNumber = tag >>> 3;
    const wireType = tag & 0x07;

    if (fieldNumber === 0) {
      return { fields, bytesConsumed: offset, error: 'Invalid field number 0' };
    }

    const wireTypeLabel = WIRE_TYPE_LABELS[wireType] || `Unknown (${wireType})`;

    let rawValueHex = '';
    const interpretations: string[] = [];

    if (wireType === 0) {
      // Varint
      const varintResult = readVarint(bytes, offset);
      offset += varintResult.bytesRead;
      const v = varintResult.value;
      rawValueHex = v.toString(16).toUpperCase();

      interpretations.push(`uint32/uint64: ${v}`);
      // ZigZag decode
      const zigzag = (v >>> 1) ^ -(v & 1);
      interpretations.push(`sint32 (ZigZag): ${zigzag}`);
      // Boolean
      if (v === 0 || v === 1) interpretations.push(`bool: ${v === 1}`);
      // Enum
      interpretations.push(`enum value: ${v}`);

    } else if (wireType === 1) {
      // 64-bit fixed
      if (offset + 8 > bytes.length) {
        return { fields, bytesConsumed: offset, error: 'Unexpected end of data reading 64-bit value' };
      }
      const chunk = bytes.slice(offset, offset + 8);
      offset += 8;
      rawValueHex = bytesToHex(chunk);

      // Read as little-endian 32-bit for safety (JS numbers)
      const lo = chunk[0] | (chunk[1] << 8) | (chunk[2] << 16) | (chunk[3] << 24);
      const hi = chunk[4] | (chunk[5] << 8) | (chunk[6] << 16) | (chunk[7] << 24);
      interpretations.push(`fixed64 (lo=${lo >>> 0}, hi=${hi >>> 0})`);

      // Try as double (IEEE 754)
      const buf = new ArrayBuffer(8);
      const view = new DataView(buf);
      chunk.forEach((b, i) => view.setUint8(i, b));
      const d = view.getFloat64(0, true);
      if (!isNaN(d)) interpretations.push(`double: ${d}`);

    } else if (wireType === 2) {
      // Length-delimited
      const lenResult = readVarint(bytes, offset);
      offset += lenResult.bytesRead;
      const len = lenResult.value;

      if (offset + len > bytes.length) {
        return { fields, bytesConsumed: offset, error: `Field ${fieldNumber}: expected ${len} bytes but only ${bytes.length - offset} available` };
      }

      const payload = bytes.slice(offset, offset + len);
      offset += len;
      rawValueHex = bytesToHex(payload.slice(0, Math.min(payload.length, 16)));
      if (payload.length > 16) rawValueHex += '...';

      const interp = interpretLengthDelimited(payload);
      interpretations.push(...interp);

    } else if (wireType === 5) {
      // 32-bit fixed
      if (offset + 4 > bytes.length) {
        return { fields, bytesConsumed: offset, error: 'Unexpected end of data reading 32-bit value' };
      }
      const chunk = bytes.slice(offset, offset + 4);
      offset += 4;
      rawValueHex = bytesToHex(chunk);

      const v = (chunk[0] | (chunk[1] << 8) | (chunk[2] << 16) | (chunk[3] << 24)) >>> 0;
      interpretations.push(`fixed32: ${v}`);
      const buf = new ArrayBuffer(4);
      const view = new DataView(buf);
      chunk.forEach((b, i) => view.setUint8(i, b));
      const f = view.getFloat32(0, true);
      if (!isNaN(f)) interpretations.push(`float: ${f}`);

    } else if (wireType === 3 || wireType === 4) {
      // Groups (deprecated, skip)
      interpretations.push('(deprecated group type, skipping)');
      break;
    } else {
      return { fields, bytesConsumed: offset, error: `Unknown wire type ${wireType} at offset ${offset}` };
    }

    fields.push({ fieldNumber, wireType, wireTypeLabel, rawValueHex, interpretations });
  }

  return { fields, bytesConsumed: offset };
}

export function decodeProto(input: string, format: 'hex' | 'base64'): string {
  if (!input.trim()) return '';

  let bytes: number[];
  try {
    bytes = format === 'hex' ? hexToBytes(input) : decodeBase64(input);
  } catch (e) {
    return 'Error: ' + (e instanceof Error ? e.message : 'decode error');
  }

  if (bytes.length === 0) return 'Empty input';

  const result = decodeProtoBytes(bytes);

  if (result.fields.length === 0) {
    if (result.error) return `Error: ${result.error}`;
    return 'No fields decoded (empty message or invalid protobuf)';
  }

  const lines: string[] = [`=== Protobuf Decode (${bytes.length} bytes) ===`, ''];

  for (const field of result.fields) {
    lines.push(`Field ${field.fieldNumber} | Wire type ${field.wireType} (${field.wireTypeLabel})`);
    if (field.rawValueHex) lines.push(`  Raw: ${field.rawValueHex}`);
    for (const interp of field.interpretations) {
      lines.push(`  → ${interp}`);
    }
    lines.push('');
  }

  if (result.error) {
    lines.push(`Warning: ${result.error}`);
  }

  return lines.join('\n');
}

// ─── Proto skeleton generator from JSON ──────────────────────────────────────

export function jsonToProtoSkeleton(input: string): string {
  if (!input.trim()) return '';

  let data: unknown;
  try {
    data = JSON.parse(input);
  } catch (e) {
    throw new Error('Invalid JSON: ' + (e instanceof Error ? e.message : 'parse error'));
  }

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error('Top-level input must be a JSON object');
  }

  const obj = data as Record<string, unknown>;
  const lines: string[] = [];

  lines.push('syntax = "proto3";', '', 'message MyMessage {');

  let fieldNum = 1;
  for (const [key, value] of Object.entries(obj)) {
    const protoType = inferProtoType(value);
    lines.push(`  ${protoType} ${snakeCase(key)} = ${fieldNum++};`);
  }

  lines.push('}');
  return lines.join('\n');
}

function inferProtoType(value: unknown): string {
  if (value === null) return 'optional string';
  if (typeof value === 'boolean') return 'bool';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'int64' : 'double';
  }
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'string'; // dates as string
    return 'string';
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return 'repeated string';
    const itemType = inferProtoType(value[0]);
    return `repeated ${itemType}`;
  }
  if (typeof value === 'object') return 'bytes'; // nested — would need nested message
  return 'string';
}

function snakeCase(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
}
