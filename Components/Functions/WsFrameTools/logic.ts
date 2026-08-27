// All functions in this file are pure (no React, no browser APIs).
// RFC 6455 WebSocket frame decoder.

export type WsFrameResult = {
  fin: boolean;
  rsv1: boolean;
  rsv2: boolean;
  rsv3: boolean;
  opcode: number;
  opcodeLabel: string;
  masked: boolean;
  payloadLength: number;
  payloadLengthExtended: '7-bit' | '16-bit extended' | '64-bit extended';
  maskingKey: string | null;
  payloadHex: string;
  payloadText: string | null;
  totalBytes: number;
  frameHex: string;
};

export const OPCODES: Record<number, string> = {
  0x0: 'Continuation',
  0x1: 'Text',
  0x2: 'Binary',
  0x3: 'Reserved (3)',
  0x4: 'Reserved (4)',
  0x5: 'Reserved (5)',
  0x6: 'Reserved (6)',
  0x7: 'Reserved (7)',
  0x8: 'Close',
  0x9: 'Ping',
  0xA: 'Pong',
  0xB: 'Reserved (B)',
  0xC: 'Reserved (C)',
  0xD: 'Reserved (D)',
  0xE: 'Reserved (E)',
  0xF: 'Reserved (F)',
};

export const CLOSE_CODES: { code: number; name: string; description: string }[] = [
  { code: 1000, name: 'Normal Closure', description: 'The connection completed its purpose.' },
  { code: 1001, name: 'Going Away', description: 'Server or browser is going away (tab closed, server restart).' },
  { code: 1002, name: 'Protocol Error', description: 'Endpoint received a malformed frame.' },
  { code: 1003, name: 'Unsupported Data', description: 'Endpoint received data type it cannot handle (e.g., text-only endpoint got binary).' },
  { code: 1004, name: 'Reserved', description: 'Reserved for future use.' },
  { code: 1005, name: 'No Status Received', description: 'Expected a status code but none was received.' },
  { code: 1006, name: 'Abnormal Closure', description: 'Connection was closed abnormally (no close frame sent).' },
  { code: 1007, name: 'Invalid Frame Payload Data', description: 'Data in a message is not consistent with its type.' },
  { code: 1008, name: 'Policy Violation', description: 'Endpoint received a message that violates its policy.' },
  { code: 1009, name: 'Message Too Big', description: 'Message is too large to process.' },
  { code: 1010, name: 'Mandatory Extension', description: 'Client expected the server to negotiate an extension.' },
  { code: 1011, name: 'Internal Error', description: 'Server encountered an unexpected condition.' },
  { code: 1012, name: 'Service Restart', description: 'Server is restarting.' },
  { code: 1013, name: 'Try Again Later', description: 'Server is temporarily unable to handle the request.' },
  { code: 1015, name: 'TLS Handshake', description: 'TLS handshake failure (not sent in frames).' },
];

function hexToBytes(hex: string): number[] {
  const clean = hex.replace(/[^0-9a-fA-F]/g, '');
  if (clean.length % 2 !== 0) throw new Error('Hex string must have an even number of hex digits');
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
    // Manual UTF-8 decode without TextDecoder (no browser API)
    let result = '';
    let i = 0;
    while (i < bytes.length) {
      const b = bytes[i];
      if (b < 0x80) {
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
        return null; // Invalid UTF-8
      }
    }
    return result;
  } catch {
    return null;
  }
}

export function decodeWsFrame(input: string): WsFrameResult {
  const bytes = hexToBytes(input);
  if (bytes.length < 2) throw new Error('Frame must be at least 2 bytes');

  const byte0 = bytes[0];
  const byte1 = bytes[1];

  const fin = (byte0 & 0x80) !== 0;
  const rsv1 = (byte0 & 0x40) !== 0;
  const rsv2 = (byte0 & 0x20) !== 0;
  const rsv3 = (byte0 & 0x10) !== 0;
  const opcode = byte0 & 0x0F;
  const masked = (byte1 & 0x80) !== 0;
  const payloadLenRaw = byte1 & 0x7F;

  let offset = 2;
  let payloadLength = 0;
  let payloadLengthExtended: '7-bit' | '16-bit extended' | '64-bit extended';

  if (payloadLenRaw < 126) {
    payloadLength = payloadLenRaw;
    payloadLengthExtended = '7-bit';
  } else if (payloadLenRaw === 126) {
    if (bytes.length < offset + 2) throw new Error('Frame too short: expected 16-bit extended length');
    payloadLength = (bytes[offset] << 8) | bytes[offset + 1];
    offset += 2;
    payloadLengthExtended = '16-bit extended';
  } else {
    // 127 = 64-bit
    if (bytes.length < offset + 8) throw new Error('Frame too short: expected 64-bit extended length');
    // Use only last 4 bytes (safe for JS numbers up to 2^32)
    payloadLength = ((bytes[offset + 4] * 16777216 + bytes[offset + 5] * 65536 + bytes[offset + 6] * 256 + bytes[offset + 7]));
    offset += 8;
    payloadLengthExtended = '64-bit extended';
  }

  let maskingKey: string | null = null;
  let maskBytes: number[] = [];
  if (masked) {
    if (bytes.length < offset + 4) throw new Error('Frame too short: expected 4-byte masking key');
    maskBytes = bytes.slice(offset, offset + 4);
    maskingKey = bytesToHex(maskBytes);
    offset += 4;
  }

  const encodedPayload = bytes.slice(offset, offset + payloadLength);
  const payload: number[] = [];
  for (let i = 0; i < encodedPayload.length; i++) {
    payload.push(masked ? (encodedPayload[i] ^ maskBytes[i % 4]) : encodedPayload[i]);
  }

  const payloadHex = bytesToHex(payload);
  const payloadText = tryDecodeUtf8(payload);

  return {
    fin,
    rsv1,
    rsv2,
    rsv3,
    opcode,
    opcodeLabel: OPCODES[opcode] || `Unknown (0x${opcode.toString(16)})`,
    masked,
    payloadLength,
    payloadLengthExtended,
    maskingKey,
    payloadHex,
    payloadText,
    totalBytes: bytes.length,
    frameHex: bytesToHex(bytes),
  };
}

export function formatFrameResult(result: WsFrameResult): string {
  const lines: string[] = [
    '=== WebSocket Frame Analysis ===',
    '',
    `FIN:              ${result.fin ? '1 (final fragment)' : '0 (more fragments follow)'}`,
    `RSV1:             ${result.rsv1 ? '1' : '0'}`,
    `RSV2:             ${result.rsv2 ? '1' : '0'}`,
    `RSV3:             ${result.rsv3 ? '1' : '0'}`,
    `Opcode:           0x${result.opcode.toString(16).toUpperCase()} (${result.opcodeLabel})`,
    `MASK:             ${result.masked ? '1 (payload is masked)' : '0 (no masking)'}`,
    `Payload Length:   ${result.payloadLength} bytes (${result.payloadLengthExtended})`,
  ];

  if (result.maskingKey) {
    lines.push(`Masking Key:      ${result.maskingKey}`);
  }

  lines.push('');
  lines.push('=== Payload ===');

  if (result.payloadLength === 0) {
    lines.push('(empty payload)');
  } else {
    lines.push(`Hex: ${result.payloadHex || '(none)'}`);
    if (result.payloadText !== null) {
      lines.push(`Text (UTF-8): ${result.payloadText}`);
    } else {
      lines.push('Text: (not valid UTF-8)');
    }
  }

  lines.push('');
  lines.push(`Total Frame Size: ${result.totalBytes} bytes`);

  return lines.join('\n');
}
