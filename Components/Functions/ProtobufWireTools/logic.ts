// Pure logic — no browser APIs, no BigInt literals.

export type WireType = 0 | 1 | 2 | 5;

export const WIRE_TYPES: Record<number, { name: string; description: string; types: string }> = {
  0: { name: 'Varint', description: 'Variable-length integer encoding. Uses 1–10 bytes. MSB = continuation bit.', types: 'int32, int64, uint32, uint64, sint32, sint64, bool, enum' },
  1: { name: '64-bit', description: 'Fixed 8-byte little-endian value.', types: 'fixed64, sfixed64, double' },
  2: { name: 'Length-delimited', description: 'Prefixed with a varint length, followed by that many bytes of data.', types: 'string, bytes, embedded messages, packed repeated fields' },
  3: { name: 'Start group (deprecated)', description: 'Groups are deprecated in proto3. Avoid.', types: 'group (deprecated)' },
  4: { name: 'End group (deprecated)', description: 'Groups are deprecated in proto3. Avoid.', types: 'group (deprecated)' },
  5: { name: '32-bit', description: 'Fixed 4-byte little-endian value.', types: 'fixed32, sfixed32, float' },
};

export type DecodedField = {
  offset: number;
  tagByte: string;
  fieldNumber: number;
  wireType: number;
  wireTypeName: string;
  rawBytes: string;
  varintSteps?: VarintStep[];
  valueInt?: number;
  valueHex?: string;
  valueFloat?: number;
  valueDouble?: number;
  lengthDelimited?: {
    length: number;
    dataHex: string;
    dataText: string | null;
  };
};

export type VarintStep = {
  byte: string;
  continuation: boolean;
  bits: string;
  value: number;
};

export type ProtobufDecodeResult = {
  fields: DecodedField[];
  totalBytes: number;
  warnings: string[];
};

function hexToBytes(hex: string): number[] {
  const clean = hex.replace(/[^0-9a-fA-F]/g, '');
  if (clean.length % 2 !== 0) throw new Error('Hex string must have even number of digits');
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 2) {
    bytes.push(parseInt(clean.slice(i, i + 2), 16));
  }
  return bytes;
}

function bytesToHex(bytes: number[]): string {
  return bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
}

function tryDecodeUtf8(bytes: number[]): string | null {
  try {
    let result = '';
    let i = 0;
    while (i < bytes.length) {
      const b = bytes[i];
      if (b < 0x80) {
        result += String.fromCharCode(b);
        i++;
      } else if ((b & 0xE0) === 0xC0) {
        if (i + 1 >= bytes.length) return null;
        result += String.fromCharCode(((b & 0x1F) << 6) | (bytes[i + 1] & 0x3F));
        i += 2;
      } else if ((b & 0xF0) === 0xE0) {
        if (i + 2 >= bytes.length) return null;
        result += String.fromCharCode(((b & 0x0F) << 12) | ((bytes[i + 1] & 0x3F) << 6) | (bytes[i + 2] & 0x3F));
        i += 3;
      } else if ((b & 0xF8) === 0xF0) {
        if (i + 3 >= bytes.length) return null;
        const cp = ((b & 0x07) << 18) | ((bytes[i + 1] & 0x3F) << 12) | ((bytes[i + 2] & 0x3F) << 6) | (bytes[i + 3] & 0x3F);
        result += String.fromCodePoint(cp);
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

// Decode a varint from bytes starting at offset. Returns [value, newOffset, steps].
// Value is kept as a safe JS number (up to 53 bits; larger values truncate the high bits).
function decodeVarint(bytes: number[], offset: number): [number, number, VarintStep[]] {
  let result = 0;
  let shift = 0;
  const steps: VarintStep[] = [];
  const startOffset = offset;

  while (offset < bytes.length && offset - startOffset < 10) {
    const b = bytes[offset];
    const continuation = (b & 0x80) !== 0;
    const payload = b & 0x7F;
    const bits = payload.toString(2).padStart(7, '0');
    steps.push({
      byte: b.toString(16).padStart(2, '0').toUpperCase(),
      continuation,
      bits,
      value: payload,
    });
    // Safe multiplication without BigInt: shift <=28 fits in 32-bit, for shift 28-35 use floating point
    if (shift < 32) {
      result = result + payload * Math.pow(2, shift);
    }
    // For shift>=32 we just truncate (JS numbers lose precision here)
    shift += 7;
    offset++;
    if (!continuation) break;
  }

  return [result, offset, steps];
}

function readFixed32(bytes: number[], offset: number): number {
  if (offset + 4 > bytes.length) throw new Error('Not enough bytes for 32-bit field');
  return (
    bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24)
  );
}

function readFixed64Approx(bytes: number[], offset: number): number {
  if (offset + 8 > bytes.length) throw new Error('Not enough bytes for 64-bit field');
  // Read as two 32-bit numbers (little-endian), combine as float approximation
  const lo = (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
  const hi = (bytes[offset + 4] | (bytes[offset + 5] << 8) | (bytes[offset + 6] << 16) | (bytes[offset + 7] << 24)) >>> 0;
  return lo + hi * 4294967296;
}

function readFloat(bytes: number[], offset: number): number {
  if (offset + 4 > bytes.length) throw new Error('Not enough bytes for float');
  const buf = [bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]];
  // Manual IEEE 754 single-precision decode
  const bits = buf[0] | (buf[1] << 8) | (buf[2] << 16) | (buf[3] << 24);
  const sign = (bits >>> 31) ? -1 : 1;
  const exp = (bits >>> 23) & 0xFF;
  const mantissa = bits & 0x7FFFFF;
  if (exp === 255) return mantissa ? NaN : sign * Infinity;
  if (exp === 0) return sign * Math.pow(2, -126) * (mantissa / 8388608);
  return sign * Math.pow(2, exp - 127) * (1 + mantissa / 8388608);
}

export function decodeProtobuf(hex: string): ProtobufDecodeResult {
  const bytes = hexToBytes(hex);
  const fields: DecodedField[] = [];
  const warnings: string[] = [];
  let offset = 0;

  while (offset < bytes.length) {
    const fieldOffset = offset;
    const tagStart = offset;

    // Decode tag varint
    const [tag, newOffset, tagSteps] = decodeVarint(bytes, offset);
    offset = newOffset;

    if (tag === 0) {
      warnings.push(`Zero tag at offset ${fieldOffset} — stopping (may indicate padding or encoding error)`);
      break;
    }

    const fieldNumber = Math.floor(tag / 8);
    const wireType = tag % 8;
    const tagBytes = bytes.slice(tagStart, offset);
    const tagHex = bytesToHex(tagBytes);

    const field: DecodedField = {
      offset: fieldOffset,
      tagByte: tagHex,
      fieldNumber,
      wireType,
      wireTypeName: WIRE_TYPES[wireType]?.name ?? `Unknown (${wireType})`,
      rawBytes: '',
    };

    if (wireType === 0) {
      // Varint
      const [value, nextOffset, steps] = decodeVarint(bytes, offset);
      const rawBytes = bytes.slice(offset, nextOffset);
      offset = nextOffset;
      field.rawBytes = bytesToHex(rawBytes);
      field.varintSteps = steps;
      field.valueInt = value;
      field.valueHex = '0x' + value.toString(16).toUpperCase();
    } else if (wireType === 1) {
      // 64-bit
      const rawBytes = bytes.slice(offset, offset + 8);
      if (offset + 8 > bytes.length) {
        warnings.push(`Not enough bytes for 64-bit field at offset ${offset}`);
        break;
      }
      field.rawBytes = bytesToHex(rawBytes);
      field.valueInt = readFixed64Approx(bytes, offset);
      field.valueHex = '0x' + rawBytes.map(b => b.toString(16).padStart(2, '0')).reverse().join('').toUpperCase();
      offset += 8;
    } else if (wireType === 2) {
      // Length-delimited
      const [length, afterLen] = decodeVarint(bytes, offset);
      offset = afterLen;
      if (offset + length > bytes.length) {
        warnings.push(`Length-delimited field at ${fieldOffset} claims ${length} bytes but only ${bytes.length - offset} remain`);
        break;
      }
      const data = bytes.slice(offset, offset + length);
      offset += length;
      const dataHex = bytesToHex(data);
      const dataText = tryDecodeUtf8(data);
      field.rawBytes = dataHex;
      field.lengthDelimited = { length, dataHex, dataText };
    } else if (wireType === 5) {
      // 32-bit
      const rawBytes = bytes.slice(offset, offset + 4);
      if (offset + 4 > bytes.length) {
        warnings.push(`Not enough bytes for 32-bit field at offset ${offset}`);
        break;
      }
      field.rawBytes = bytesToHex(rawBytes);
      const intVal = readFixed32(bytes, offset);
      field.valueInt = intVal >>> 0;
      field.valueHex = '0x' + (intVal >>> 0).toString(16).toUpperCase().padStart(8, '0');
      field.valueFloat = readFloat(bytes, offset);
      offset += 4;
    } else if (wireType === 3 || wireType === 4) {
      warnings.push(`Deprecated group wire type ${wireType} at offset ${fieldOffset} — skipping`);
      break;
    } else {
      warnings.push(`Unknown wire type ${wireType} at offset ${fieldOffset} — cannot continue`);
      break;
    }

    fields.push(field);
  }

  return { fields, totalBytes: bytes.length, warnings };
}

export function formatProtobufResult(result: ProtobufDecodeResult): string {
  if (result.fields.length === 0) return '(no fields decoded)';
  const lines: string[] = [`=== Protobuf Wire Format (${result.totalBytes} bytes) ===`, ''];
  for (const f of result.fields) {
    lines.push(`Field ${f.fieldNumber} | Wire Type ${f.wireType} (${f.wireTypeName}) | Offset ${f.offset}`);
    lines.push(`  Tag bytes: ${f.tagByte}`);
    if (f.wireType === 0 && f.varintSteps) {
      lines.push(`  Raw bytes: ${f.rawBytes}`);
      lines.push(`  Value (int): ${f.valueInt}`);
      lines.push(`  Value (hex): ${f.valueHex}`);
      lines.push('  Varint decoding:');
      for (const s of f.varintSteps) {
        lines.push(`    0x${s.byte} → MSB=${s.continuation ? 1 : 0} bits=[${s.bits}] payload=${s.value}`);
      }
    } else if (f.wireType === 1) {
      lines.push(`  Raw bytes: ${f.rawBytes}`);
      lines.push(`  Value (int approx): ${f.valueInt}`);
      lines.push(`  Value (hex LE): ${f.valueHex}`);
    } else if (f.wireType === 2 && f.lengthDelimited) {
      lines.push(`  Length: ${f.lengthDelimited.length} bytes`);
      lines.push(`  Data (hex): ${f.lengthDelimited.dataHex}`);
      if (f.lengthDelimited.dataText !== null) {
        lines.push(`  Data (UTF-8): ${f.lengthDelimited.dataText}`);
      } else {
        lines.push('  Data: (not valid UTF-8 — binary or nested message)');
      }
    } else if (f.wireType === 5) {
      lines.push(`  Raw bytes: ${f.rawBytes}`);
      lines.push(`  Value (uint32): ${f.valueInt}`);
      lines.push(`  Value (float): ${f.valueFloat}`);
      lines.push(`  Value (hex): ${f.valueHex}`);
    }
    lines.push('');
  }
  if (result.warnings.length > 0) {
    lines.push('=== Warnings ===');
    result.warnings.forEach(w => lines.push(`  ! ${w}`));
  }
  return lines.join('\n');
}
