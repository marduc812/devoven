export type BitPatternRow = {
  byte: number;
  charCode: number;
  char: string;
  binary8: string;
  hex2: string;
  decimal: number;
  octal3: string;
  msb: number;  // most significant bit
  lsb: number;  // least significant bit
  bitCount: number;  // popcount
  parity: 'even' | 'odd';
};

export type BitPatternResult = {
  rows: BitPatternRow[];
  totalBytes: number;
  totalBits: number;
  setBitsTotal: number;
  clearBitsTotal: number;
  byteFrequency: Record<number, number>;
  summary: string;
};

export type InputMode = 'text' | 'hex';

function popcount(byte: number): number {
  let n = byte;
  let count = 0;
  while (n) {
    count += n & 1;
    n >>= 1;
  }
  return count;
}

function textToBytes(text: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // Encode as UTF-8
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xC0 | (code >> 6), 0x80 | (code & 0x3F));
    } else if (code < 0xD800 || code >= 0xE000) {
      bytes.push(0xE0 | (code >> 12), 0x80 | ((code >> 6) & 0x3F), 0x80 | (code & 0x3F));
    } else {
      // Surrogate pair
      const lo = text.charCodeAt(++i);
      const cp = 0x10000 + ((code - 0xD800) << 10) + (lo - 0xDC00);
      bytes.push(
        0xF0 | (cp >> 18),
        0x80 | ((cp >> 12) & 0x3F),
        0x80 | ((cp >> 6) & 0x3F),
        0x80 | (cp & 0x3F)
      );
    }
  }
  return bytes;
}

function hexToBytes(hex: string): number[] {
  const clean = hex.replace(/\s+/g, '').replace(/^0x/i, '');
  if (clean.length % 2 !== 0) throw new Error('Hex string must have an even number of hex digits');
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 2) {
    const b = parseInt(clean.slice(i, i + 2), 16);
    if (isNaN(b)) throw new Error(`Invalid hex at position ${i}: "${clean.slice(i, i + 2)}"`);
    bytes.push(b);
  }
  return bytes;
}

function byteToDisplay(byte: number): string {
  if (byte >= 0x20 && byte < 0x7F) return String.fromCharCode(byte);
  const names: Record<number, string> = {
    0x00: 'NUL', 0x07: 'BEL', 0x08: 'BS', 0x09: 'HT', 0x0A: 'LF',
    0x0B: 'VT', 0x0C: 'FF', 0x0D: 'CR', 0x1B: 'ESC', 0x7F: 'DEL',
    0x80: 'PAD', 0xA0: 'NBSP',
  };
  return names[byte] || '.';
}

export function analyzeBytes(input: string, mode: InputMode): BitPatternResult {
  const bytes = mode === 'hex' ? hexToBytes(input) : textToBytes(input);

  let setBitsTotal = 0;
  const byteFreq: Record<number, number> = {};

  const rows: BitPatternRow[] = bytes.map((byte, idx) => {
    const bits = popcount(byte);
    setBitsTotal += bits;
    byteFreq[byte] = (byteFreq[byte] || 0) + 1;

    const charCode = idx;
    return {
      byte,
      charCode: byte,
      char: byteToDisplay(byte),
      binary8: byte.toString(2).padStart(8, '0'),
      hex2: byte.toString(16).toUpperCase().padStart(2, '0'),
      decimal: byte,
      octal3: byte.toString(8).padStart(3, '0'),
      msb: (byte >> 7) & 1,
      lsb: byte & 1,
      bitCount: bits,
      parity: bits % 2 === 0 ? 'even' : 'odd',
    };
  });

  const totalBytes = bytes.length;
  const totalBits = totalBytes * 8;
  const clearBitsTotal = totalBits - setBitsTotal;
  const density = totalBits > 0 ? Math.round(setBitsTotal / totalBits * 100) : 0;

  const summary = totalBytes > 0
    ? `${totalBytes} bytes · ${totalBits} bits · ${setBitsTotal} set (${density}%) · ${clearBitsTotal} clear`
    : 'No data';

  return { rows, totalBytes, totalBits, setBitsTotal, clearBitsTotal, byteFrequency: byteFreq, summary };
}
