// Quoted-Printable encoding/decoding per RFC 2045

const MAX_LINE_LENGTH = 76;

function toHex(byte: number): string {
  return byte.toString(16).toUpperCase().padStart(2, '0');
}

export function encodeQuotedPrintable(input: string): string {
  // Encode UTF-8 bytes
  const bytes: number[] = [];
  for (let i = 0; i < input.length; i++) {
    const cp = input.charCodeAt(i);
    if (cp < 128) {
      bytes.push(cp);
    } else if (cp < 0x800) {
      bytes.push(0xC0 | (cp >> 6));
      bytes.push(0x80 | (cp & 0x3F));
    } else if (cp >= 0xD800 && cp <= 0xDBFF && i + 1 < input.length) {
      const next = input.charCodeAt(i + 1);
      if (next >= 0xDC00 && next <= 0xDFFF) {
        const codePoint = 0x10000 + ((cp - 0xD800) << 10) + (next - 0xDC00);
        bytes.push(0xF0 | (codePoint >> 18));
        bytes.push(0x80 | ((codePoint >> 12) & 0x3F));
        bytes.push(0x80 | ((codePoint >> 6) & 0x3F));
        bytes.push(0x80 | (codePoint & 0x3F));
        i++;
        continue;
      }
      bytes.push(0xEF, 0xBF, 0xBD); // replacement char
    } else if (cp < 0x10000) {
      bytes.push(0xE0 | (cp >> 12));
      bytes.push(0x80 | ((cp >> 6) & 0x3F));
      bytes.push(0x80 | (cp & 0x3F));
    }
  }

  const lines: string[] = [];
  let current = '';

  const flush = (token: string) => {
    if (current.length + token.length > MAX_LINE_LENGTH) {
      lines.push(current + '=');
      current = '';
    }
    current += token;
  };

  let byteIdx = 0;
  const inputBytes = bytes;

  // Re-process per line to handle newlines correctly
  const rawLines = input.split('\n');
  for (let li = 0; li < rawLines.length; li++) {
    const rawLine = rawLines[li];
    current = '';
    const lineBytes: number[] = [];
    for (let i = 0; i < rawLine.length; i++) {
      const cp = rawLine.charCodeAt(i);
      if (cp < 128) {
        lineBytes.push(cp);
      } else if (cp < 0x800) {
        lineBytes.push(0xC0 | (cp >> 6), 0x80 | (cp & 0x3F));
      } else if (cp >= 0xD800 && cp <= 0xDBFF && i + 1 < rawLine.length) {
        const next = rawLine.charCodeAt(i + 1);
        if (next >= 0xDC00 && next <= 0xDFFF) {
          const codePoint = 0x10000 + ((cp - 0xD800) << 10) + (next - 0xDC00);
          lineBytes.push(
            0xF0 | (codePoint >> 18),
            0x80 | ((codePoint >> 12) & 0x3F),
            0x80 | ((codePoint >> 6) & 0x3F),
            0x80 | (codePoint & 0x3F)
          );
          i++;
          continue;
        }
        lineBytes.push(0xEF, 0xBF, 0xBD);
      } else {
        lineBytes.push(0xE0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3F), 0x80 | (cp & 0x3F));
      }
    }

    current = '';
    for (const byte of lineBytes) {
      let token: string;
      if (byte === 9 || byte === 32) {
        // Tab and space are ok in middle, but must encode at EOL
        token = String.fromCharCode(byte);
      } else if (byte === 13) {
        continue; // skip CR
      } else if ((byte >= 33 && byte <= 126 && byte !== 61) || byte === 9 || byte === 32) {
        token = String.fromCharCode(byte);
      } else {
        token = '=' + toHex(byte);
      }

      if (current.length + token.length > MAX_LINE_LENGTH) {
        lines.push(current + '=');
        current = '';
      }
      current += token;
    }

    // Encode trailing whitespace on the line
    while (current.endsWith(' ') || current.endsWith('\t')) {
      const last = current[current.length - 1];
      current = current.slice(0, -1);
      const encoded = '=' + toHex(last.charCodeAt(0));
      if (current.length + encoded.length > MAX_LINE_LENGTH) {
        lines.push(current + '=');
        current = '';
      }
      current += encoded;
    }

    lines.push(current);
    void inputBytes; void byteIdx; // suppress unused warnings
  }

  return lines.join('\r\n');
}

export function decodeQuotedPrintable(input: string): string {
  // Normalize CRLF to LF, then process
  const normalized = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  // Remove soft line breaks (= at end of line)
  const joined = normalized.replace(/=\n/g, '');

  const bytes: number[] = [];
  let i = 0;
  while (i < joined.length) {
    if (joined[i] === '=' && i + 2 < joined.length) {
      const hex = joined.slice(i + 1, i + 3);
      if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
        bytes.push(parseInt(hex, 16));
        i += 3;
        continue;
      }
    }
    const cp = joined.charCodeAt(i);
    if (cp < 128) {
      bytes.push(cp);
    } else {
      // Encode as UTF-8
      if (cp < 0x800) {
        bytes.push(0xC0 | (cp >> 6), 0x80 | (cp & 0x3F));
      } else {
        bytes.push(0xE0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3F), 0x80 | (cp & 0x3F));
      }
    }
    i++;
  }

  // Decode UTF-8 bytes to string
  return decodeUtf8Bytes(bytes);
}

function decodeUtf8Bytes(bytes: number[]): string {
  let str = '';
  let i = 0;
  while (i < bytes.length) {
    const b = bytes[i];
    if (b < 0x80) {
      str += String.fromCharCode(b);
      i++;
    } else if ((b & 0xE0) === 0xC0 && i + 1 < bytes.length) {
      const cp = ((b & 0x1F) << 6) | (bytes[i + 1] & 0x3F);
      str += String.fromCharCode(cp);
      i += 2;
    } else if ((b & 0xF0) === 0xE0 && i + 2 < bytes.length) {
      const cp = ((b & 0x0F) << 12) | ((bytes[i + 1] & 0x3F) << 6) | (bytes[i + 2] & 0x3F);
      str += String.fromCharCode(cp);
      i += 3;
    } else if ((b & 0xF8) === 0xF0 && i + 3 < bytes.length) {
      const cp = ((b & 0x07) << 18) | ((bytes[i + 1] & 0x3F) << 12) | ((bytes[i + 2] & 0x3F) << 6) | (bytes[i + 3] & 0x3F);
      const sub = cp - 0x10000;
      str += String.fromCharCode(0xD800 + (sub >> 10), 0xDC00 + (sub & 0x3FF));
      i += 4;
    } else {
      str += '\uFFFD';
      i++;
    }
  }
  return str;
}

export function isLikelyQuotedPrintable(input: string): boolean {
  return /=[0-9A-Fa-f]{2}/.test(input) || /=\r?\n/.test(input);
}

export function autoConvert(input: string): string {
  if (!input.trim()) return '';
  if (isLikelyQuotedPrintable(input)) {
    return decodeQuotedPrintable(input);
  }
  return encodeQuotedPrintable(input);
}
