// Pure TypeScript — no browser APIs. Converts text to a hex dump (like xxd).

const BYTES_PER_ROW = 16;

function toHex(byte: number): string {
  return byte.toString(16).padStart(2, '0');
}

function toPrintable(byte: number): string {
  return byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.';
}

function encodeToBytes(text: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6));
      bytes.push(0x80 | (code & 0x3f));
    } else {
      bytes.push(0xe0 | (code >> 12));
      bytes.push(0x80 | ((code >> 6) & 0x3f));
      bytes.push(0x80 | (code & 0x3f));
    }
  }
  return bytes;
}

export function textToHexDump(input: string): string {
  if (!input) return '';

  const bytes = encodeToBytes(input);
  const lines: string[] = [];

  for (let offset = 0; offset < bytes.length; offset += BYTES_PER_ROW) {
    const row = bytes.slice(offset, offset + BYTES_PER_ROW);

    // Offset column (8 hex digits)
    const offsetStr = offset.toString(16).padStart(8, '0');

    // Hex columns (two groups of 8)
    const hexParts: string[] = [];
    for (let i = 0; i < BYTES_PER_ROW; i++) {
      if (i < row.length) {
        hexParts.push(toHex(row[i]));
      } else {
        hexParts.push('  ');
      }
      if (i === 7) hexParts.push(' '); // extra space between groups
    }
    const hexStr = hexParts.join(' ');

    // ASCII column
    const asciiStr = row.map(toPrintable).join('');

    lines.push(`${offsetStr}  ${hexStr}  |${asciiStr}|`);
  }

  // Final line with total byte count
  const totalOffset = bytes.length.toString(16).padStart(8, '0');
  lines.push(`${totalOffset}`);

  return lines.join('\n');
}

export interface HexStats {
  totalBytes: number;
  totalRows: number;
  uniqueBytes: number;
  nullBytes: number;
  printableBytes: number;
}

