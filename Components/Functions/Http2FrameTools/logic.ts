// ─── HTTP/2 Frame Decoder (RFC 7540) ─────────────────────────────────────────

export type FrameType =
  | 'DATA'
  | 'HEADERS'
  | 'PRIORITY'
  | 'RST_STREAM'
  | 'SETTINGS'
  | 'PUSH_PROMISE'
  | 'PING'
  | 'GOAWAY'
  | 'WINDOW_UPDATE'
  | 'CONTINUATION'
  | 'UNKNOWN';

export interface FrameTypeInfo {
  code: number;
  name: FrameType;
  description: string;
  flags: FlagDef[];
}

export interface FlagDef {
  bit: number;
  name: string;
  description: string;
}

export interface DecodedFrame {
  length: number;
  type: FrameType;
  typeCode: number;
  flags: number;
  flagNames: string[];
  streamId: number;
  payloadHex: string;
  payloadInterpretation: string;
  errors: string[];
}

export interface DecodeResult {
  frames: DecodedFrame[];
  errors: string[];
  rawHex: string;
  totalBytes: number;
}

// ─── Frame type registry ──────────────────────────────────────────────────────

export const FRAME_TYPES: FrameTypeInfo[] = [
  {
    code: 0x0,
    name: 'DATA',
    description: 'Conveys arbitrary, variable-length sequences of octets associated with a stream.',
    flags: [
      { bit: 0x1, name: 'END_STREAM', description: 'Bit 0: Indicates that this frame is the last that the endpoint will send for the identified stream.' },
      { bit: 0x8, name: 'PADDED', description: 'Bit 3: Indicates that the Pad Length field and any padding that it describes are present.' },
    ],
  },
  {
    code: 0x1,
    name: 'HEADERS',
    description: 'Opens a stream and carries a header block fragment. Can also carry END_STREAM to half-close the stream.',
    flags: [
      { bit: 0x1, name: 'END_STREAM', description: 'Bit 0: End of the stream.' },
      { bit: 0x4, name: 'END_HEADERS', description: 'Bit 2: Indicates that the frame contains an entire header block and is not followed by CONTINUATION frames.' },
      { bit: 0x8, name: 'PADDED', description: 'Bit 3: Padding present.' },
      { bit: 0x20, name: 'PRIORITY', description: 'Bit 5: Exclusive flag, stream dependency, and weight are present.' },
    ],
  },
  {
    code: 0x2,
    name: 'PRIORITY',
    description: 'Specifies the sender-advised priority of a stream. Can be sent in any state.',
    flags: [],
  },
  {
    code: 0x3,
    name: 'RST_STREAM',
    description: 'Allows immediate termination of a stream. Carries a 32-bit error code.',
    flags: [],
  },
  {
    code: 0x4,
    name: 'SETTINGS',
    description: 'Conveys configuration parameters that affect how endpoints communicate. Both peers must send SETTINGS on connection establishment.',
    flags: [
      { bit: 0x1, name: 'ACK', description: 'Bit 0: Indicates that this frame acknowledges receipt and application of the peer\'s SETTINGS frame.' },
    ],
  },
  {
    code: 0x5,
    name: 'PUSH_PROMISE',
    description: 'Notifies the peer endpoint of a stream the sender intends to initiate (server push).',
    flags: [
      { bit: 0x4, name: 'END_HEADERS', description: 'Bit 2: Indicates that the header block is complete.' },
      { bit: 0x8, name: 'PADDED', description: 'Bit 3: Padding present.' },
    ],
  },
  {
    code: 0x6,
    name: 'PING',
    description: 'A mechanism for measuring a minimal round-trip time from the sender, as well as determining whether an idle connection is still functional. Payload is 8 octets of opaque data.',
    flags: [
      { bit: 0x1, name: 'ACK', description: 'Bit 0: Indicates that this PING frame is a PING response.' },
    ],
  },
  {
    code: 0x7,
    name: 'GOAWAY',
    description: 'Initiates shutdown of a connection or signals serious error conditions. Contains the highest-numbered stream ID processed and an error code.',
    flags: [],
  },
  {
    code: 0x8,
    name: 'WINDOW_UPDATE',
    description: 'Used to implement flow control. Payload is a 31-bit window size increment (1 to 2^31-1 octets).',
    flags: [],
  },
  {
    code: 0x9,
    name: 'CONTINUATION',
    description: 'Used to continue a sequence of header block fragments. Must follow a HEADERS, PUSH_PROMISE, or CONTINUATION frame.',
    flags: [
      { bit: 0x4, name: 'END_HEADERS', description: 'Bit 2: Indicates this frame ends the header block.' },
    ],
  },
];

export const ERROR_CODES: Record<number, string> = {
  0x0: 'NO_ERROR — Graceful shutdown',
  0x1: 'PROTOCOL_ERROR — Protocol error detected',
  0x2: 'INTERNAL_ERROR — Implementation fault',
  0x3: 'FLOW_CONTROL_ERROR — Flow-control limits exceeded',
  0x4: 'SETTINGS_TIMEOUT — Settings not acknowledged',
  0x5: 'STREAM_CLOSED — Frame for half-closed stream',
  0x6: 'FRAME_SIZE_ERROR — Frame size incorrect',
  0x7: 'REFUSED_STREAM — Stream not processed',
  0x8: 'CANCEL — Stream cancelled',
  0x9: 'COMPRESSION_ERROR — Compression state not updated',
  0xa: 'CONNECT_ERROR — TCP connection error',
  0xb: 'ENHANCE_YOUR_CALM — Calming processing rate',
  0xc: 'INADEQUATE_SECURITY — Negotiated TLS parameters not acceptable',
  0xd: 'HTTP_1_1_REQUIRED — Use HTTP/1.1 for this request',
};

export const SETTINGS_IDS: Record<number, string> = {
  0x1: 'HEADER_TABLE_SIZE',
  0x2: 'ENABLE_PUSH',
  0x3: 'MAX_CONCURRENT_STREAMS',
  0x4: 'INITIAL_WINDOW_SIZE',
  0x5: 'MAX_FRAME_SIZE',
  0x6: 'MAX_HEADER_LIST_SIZE',
};

// ─── Hex parsing ──────────────────────────────────────────────────────────────

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/[\s\n\r:]/g, '');
  if (!/^[0-9a-fA-F]*$/.test(clean)) throw new Error('Invalid hex characters');
  if (clean.length % 2 !== 0) throw new Error('Hex string must have even length');
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array, start: number, len: number): string {
  let hex = '';
  for (let i = start; i < start + len && i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function read32be(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
}

function read24be(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] << 16) | (bytes[offset + 1] << 8) | bytes[offset + 2]) >>> 0;
}

// ─── Frame interpretation ─────────────────────────────────────────────────────

function getFrameType(code: number): FrameTypeInfo {
  return FRAME_TYPES.find(t => t.code === code) || {
    code,
    name: 'UNKNOWN' as FrameType,
    description: 'Unknown frame type',
    flags: [],
  };
}

function decodeFlags(flags: number, typeInfo: FrameTypeInfo): string[] {
  const names: string[] = [];
  for (const fd of typeInfo.flags) {
    if ((flags & fd.bit) !== 0) names.push(fd.name);
  }
  return names;
}

function interpretPayload(
  bytes: Uint8Array,
  payloadStart: number,
  payloadLen: number,
  typeInfo: FrameTypeInfo,
  flags: number,
  errors: string[],
): string {
  const lines: string[] = [];

  if (payloadLen === 0) {
    return 'Empty payload';
  }

  switch (typeInfo.name) {
    case 'DATA': {
      let dataStart = payloadStart;
      let dataLen = payloadLen;
      if ((flags & 0x8) !== 0 && payloadLen > 0) {
        const padLen = bytes[payloadStart];
        lines.push('Pad Length: ' + padLen);
        dataStart = payloadStart + 1;
        dataLen = payloadLen - 1 - padLen;
      }
      lines.push('Data (' + dataLen + ' bytes): ' + bytesToHex(bytes, dataStart, Math.min(dataLen, 32)) + (dataLen > 32 ? '...' : ''));
      break;
    }

    case 'HEADERS': {
      let offset = payloadStart;
      if ((flags & 0x8) !== 0) {
        lines.push('Pad Length: ' + bytes[offset]);
        offset++;
      }
      if ((flags & 0x20) !== 0 && offset + 4 <= payloadStart + payloadLen) {
        const dep = read32be(bytes, offset);
        const exclusive = (dep & 0x80000000) !== 0;
        const streamDep = dep & 0x7fffffff;
        const weight = bytes[offset + 4] + 1;
        lines.push('Exclusive: ' + exclusive);
        lines.push('Stream Dependency: ' + streamDep);
        lines.push('Weight: ' + weight);
        offset += 5;
      }
      const hdrLen = payloadStart + payloadLen - offset;
      lines.push('Header Block Fragment (' + hdrLen + ' bytes, HPACK encoded)');
      lines.push('Hex: ' + bytesToHex(bytes, offset, Math.min(hdrLen, 32)) + (hdrLen > 32 ? '...' : ''));
      break;
    }

    case 'PRIORITY': {
      if (payloadLen < 5) { errors.push('PRIORITY frame too short (need 5 bytes)'); break; }
      const dep = read32be(bytes, payloadStart);
      const exclusive = (dep & 0x80000000) !== 0;
      const streamDep = dep & 0x7fffffff;
      const weight = bytes[payloadStart + 4] + 1;
      lines.push('Exclusive: ' + exclusive);
      lines.push('Stream Dependency: ' + streamDep);
      lines.push('Weight: ' + weight);
      break;
    }

    case 'RST_STREAM': {
      if (payloadLen < 4) { errors.push('RST_STREAM frame too short'); break; }
      const code = read32be(bytes, payloadStart);
      lines.push('Error Code: 0x' + code.toString(16) + ' (' + (ERROR_CODES[code] || 'Unknown error') + ')');
      break;
    }

    case 'SETTINGS': {
      if ((flags & 0x1) !== 0) {
        lines.push('ACK — acknowledges peer SETTINGS');
      } else {
        const count = Math.floor(payloadLen / 6);
        lines.push('Settings count: ' + count);
        for (let i = 0; i < count; i++) {
          const o = payloadStart + i * 6;
          const id = (bytes[o] << 8) | bytes[o + 1];
          const val = read32be(bytes, o + 2);
          const name = SETTINGS_IDS[id] || 'UNKNOWN(0x' + id.toString(16) + ')';
          lines.push(name + ' = ' + val);
        }
      }
      break;
    }

    case 'PUSH_PROMISE': {
      let offset = payloadStart;
      if ((flags & 0x8) !== 0) { lines.push('Pad Length: ' + bytes[offset]); offset++; }
      if (offset + 4 <= payloadStart + payloadLen) {
        const prom = read32be(bytes, offset) & 0x7fffffff;
        lines.push('Promised Stream ID: ' + prom);
        offset += 4;
      }
      const hdrLen = payloadStart + payloadLen - offset;
      lines.push('Header Block Fragment (' + hdrLen + ' bytes, HPACK encoded)');
      break;
    }

    case 'PING': {
      if (payloadLen < 8) { errors.push('PING frame must be 8 bytes'); break; }
      lines.push('Opaque Data: ' + bytesToHex(bytes, payloadStart, 8));
      if ((flags & 0x1) !== 0) lines.push('(This is a PING response)');
      break;
    }

    case 'GOAWAY': {
      if (payloadLen < 8) { errors.push('GOAWAY frame too short'); break; }
      const lastStream = read32be(bytes, payloadStart) & 0x7fffffff;
      const errCode = read32be(bytes, payloadStart + 4);
      lines.push('Last Stream ID: ' + lastStream);
      lines.push('Error Code: 0x' + errCode.toString(16) + ' (' + (ERROR_CODES[errCode] || 'Unknown') + ')');
      if (payloadLen > 8) {
        const debugLen = payloadLen - 8;
        lines.push('Additional Debug Data (' + debugLen + ' bytes): ' + bytesToHex(bytes, payloadStart + 8, Math.min(debugLen, 32)));
      }
      break;
    }

    case 'WINDOW_UPDATE': {
      if (payloadLen < 4) { errors.push('WINDOW_UPDATE frame too short'); break; }
      const increment = read32be(bytes, payloadStart) & 0x7fffffff;
      if (increment === 0) errors.push('Window size increment of 0 is a PROTOCOL_ERROR');
      lines.push('Window Size Increment: ' + increment + ' bytes');
      break;
    }

    case 'CONTINUATION': {
      lines.push('Header Block Fragment (' + payloadLen + ' bytes, HPACK encoded)');
      lines.push('Hex: ' + bytesToHex(bytes, payloadStart, Math.min(payloadLen, 32)) + (payloadLen > 32 ? '...' : ''));
      break;
    }

    default:
      lines.push('Payload (' + payloadLen + ' bytes): ' + bytesToHex(bytes, payloadStart, Math.min(payloadLen, 32)) + (payloadLen > 32 ? '...' : ''));
  }

  return lines.join('\n');
}

// ─── Main decode ──────────────────────────────────────────────────────────────

export function decodeHttp2Frames(hex: string): DecodeResult {
  const errors: string[] = [];
  const frames: DecodedFrame[] = [];
  const rawHex = hex;
  let bytes: Uint8Array;

  try {
    bytes = hexToBytes(hex);
  } catch (e: unknown) {
    return { frames, errors: [e instanceof Error ? e.message : 'Invalid hex'], rawHex, totalBytes: 0 };
  }

  let offset = 0;

  // Skip the HTTP/2 client preface if present (PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n)
  const preface = '505249202a20485454502f322e300d0a0d0a534d0d0a0d0a';
  const hexClean = hex.replace(/[\s\n\r:]/g, '').toLowerCase();
  if (hexClean.startsWith(preface)) {
    offset = preface.length / 2;
  }

  while (offset < bytes.length) {
    if (bytes.length - offset < 9) {
      errors.push('Incomplete frame header at offset ' + offset + ' (need 9 bytes, got ' + (bytes.length - offset) + ')');
      break;
    }

    const length = read24be(bytes, offset);
    const typeCode = bytes[offset + 3];
    const flags = bytes[offset + 4];
    const streamId = read32be(bytes, offset + 5) & 0x7fffffff;

    const payloadStart = offset + 9;
    const payloadEnd = payloadStart + length;

    if (payloadEnd > bytes.length) {
      errors.push('Frame at offset ' + offset + ' declares length ' + length + ' but only ' + (bytes.length - payloadStart) + ' bytes remain');
      break;
    }

    const typeInfo = getFrameType(typeCode);
    const flagNames = decodeFlags(flags, typeInfo);
    const payloadHex = bytesToHex(bytes, payloadStart, length);
    const frameErrors: string[] = [];
    const payloadInterpretation = interpretPayload(bytes, payloadStart, length, typeInfo, flags, frameErrors);

    frames.push({
      length,
      type: typeInfo.name,
      typeCode,
      flags,
      flagNames,
      streamId,
      payloadHex,
      payloadInterpretation,
      errors: frameErrors,
    });

    offset = payloadEnd;
  }

  return { frames, errors, rawHex, totalBytes: bytes.length };
}

export const SAMPLE_HEX = [
  '// HTTP/2 SETTINGS frame (empty, type=0x4, flags=0x0, stream=0)',
  '00 00 00 04 00 00 00 00 00',
  '',
  '// HTTP/2 SETTINGS ACK (type=0x4, flags=0x1, stream=0)',
  '00 00 00 04 01 00 00 00 00',
  '',
  '// HTTP/2 WINDOW_UPDATE (type=0x8, increment=65535, stream=0)',
  '00 00 04 08 00 00 00 00 00 00 00 ff ff',
  '',
  '// HTTP/2 PING (type=0x6, opaque=0102030405060708)',
  '00 00 08 06 00 00 00 00 00 01 02 03 04 05 06 07 08',
].join('\n');
