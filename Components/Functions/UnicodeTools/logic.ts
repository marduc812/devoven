// Pure TypeScript — no browser APIs. Buffer and Math are fine.

/** Encode a code point as UTF-8 bytes */
export function codePointToUtf8Bytes(cp: number): number[] {
  if (cp < 0x80) return [cp];
  if (cp < 0x800) return [0xC0 | (cp >> 6), 0x80 | (cp & 0x3F)];
  if (cp < 0x10000) return [0xE0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3F), 0x80 | (cp & 0x3F)];
  return [
    0xF0 | (cp >> 18),
    0x80 | ((cp >> 12) & 0x3F),
    0x80 | ((cp >> 6) & 0x3F),
    0x80 | (cp & 0x3F),
  ];
}

/** Encode a code point as UTF-16 code units */
export function codePointToUtf16Units(cp: number): number[] {
  if (cp <= 0xFFFF) return [cp];
  const adjusted = cp - 0x10000;
  const high = 0xD800 + (adjusted >> 10);
  const low = 0xDC00 + (adjusted & 0x3FF);
  return [high, low];
}

function toHex(n: number, pad: number): string {
  return n.toString(16).toUpperCase().padStart(pad, '0');
}

export type CharInfo = {
  char: string;
  codePoint: number;
  codePointStr: string;  // U+XXXX
  utf8Bytes: string;     // "0xXX 0xXX ..."
  utf16Units: string;    // "0xXXXX ..."
  htmlEntity: string;    // &#xXXXX;
  cssEscape: string;     // \XXXXXX
  jsEscape: string;      // \uXXXX or \u{XXXXXX}
};

export function analyzeChar(cp: number): CharInfo {
  const char = String.fromCodePoint(cp);
  const codePointStr = 'U+' + toHex(cp, 4);
  const utf8 = codePointToUtf8Bytes(cp).map(b => '0x' + toHex(b, 2)).join(' ');
  const utf16 = codePointToUtf16Units(cp).map(u => '0x' + toHex(u, 4)).join(' ');
  const htmlEntity = '&#x' + toHex(cp, 4) + ';';
  const cssEscape = '\\' + toHex(cp, 6);
  const jsEscape = cp <= 0xFFFF ? '\\u' + toHex(cp, 4) : '\\u{' + toHex(cp, 1) + '}';

  return { char, codePoint: cp, codePointStr, utf8Bytes: utf8, utf16Units: utf16, htmlEntity, cssEscape, jsEscape };
}

/** Parse input: character, U+XXXX, hex 0x..., or decimal number */
export function parseInput(raw: string): number[] | null {
  const s = raw.trim();
  if (!s) return null;

  // U+XXXX or U+XXXXXXXX
  const uPlusMatch = /^u\+([0-9a-f]{1,6})$/i.exec(s);
  if (uPlusMatch) {
    const cp = parseInt(uPlusMatch[1], 16);
    if (cp > 0x10FFFF) return null;
    return [cp];
  }

  // 0xXXXX hex
  const hexMatch = /^0x([0-9a-f]{1,6})$/i.exec(s);
  if (hexMatch) {
    const cp = parseInt(hexMatch[1], 16);
    if (cp > 0x10FFFF) return null;
    return [cp];
  }

  // Pure decimal number
  if (/^\d+$/.test(s)) {
    const cp = parseInt(s, 10);
    if (cp > 0x10FFFF) return null;
    return [cp];
  }

  // Otherwise treat as character string — extract code points
  const points: number[] = [];
  let i = 0;
  while (i < s.length) {
    const cp = s.codePointAt(i);
    if (cp !== undefined) {
      points.push(cp);
      i += cp > 0xFFFF ? 2 : 1;
    } else {
      i++;
    }
  }
  return points.length > 0 ? points : null;
}

export function analyzeInput(input: string): CharInfo[] | string {
  const points = parseInput(input);
  if (!points) return 'Enter a character, code point (U+1F600), hex (0x1F600), or decimal number';
  return points.map(analyzeChar);
}

export type UnicodeBlock = {
  name: string;
  start: number;
  end: number;
  example: string;
};

export const UNICODE_BLOCKS: UnicodeBlock[] = [
  { name: 'Basic Latin (ASCII)', start: 0x0000, end: 0x007F, example: 'A, z, 0' },
  { name: 'Latin-1 Supplement', start: 0x0080, end: 0x00FF, example: 'é, ñ, ü' },
  { name: 'Latin Extended-A', start: 0x0100, end: 0x017F, example: 'Ā, ā, Ă' },
  { name: 'Greek and Coptic', start: 0x0370, end: 0x03FF, example: 'α, β, Ω' },
  { name: 'Cyrillic', start: 0x0400, end: 0x04FF, example: 'А, Б, Я' },
  { name: 'Arabic', start: 0x0600, end: 0x06FF, example: 'ب, ت, ث' },
  { name: 'Hebrew', start: 0x0590, end: 0x05FF, example: 'א, ב, ג' },
  { name: 'Devanagari', start: 0x0900, end: 0x097F, example: 'अ, आ, इ' },
  { name: 'CJK Unified Ideographs', start: 0x4E00, end: 0x9FFF, example: '一, 中, 文' },
  { name: 'Hiragana', start: 0x3040, end: 0x309F, example: 'あ, い, う' },
  { name: 'Katakana', start: 0x30A0, end: 0x30FF, example: 'ア, イ, ウ' },
  { name: 'Hangul Syllables', start: 0xAC00, end: 0xD7AF, example: '가, 나, 다' },
  { name: 'Emoticons (Emoji)', start: 0x1F600, end: 0x1F64F, example: '😀, 😂, 🥳' },
  { name: 'Miscellaneous Symbols', start: 0x2600, end: 0x26FF, example: '☀, ★, ♠' },
  { name: 'Mathematical Operators', start: 0x2200, end: 0x22FF, example: '∑, ∞, √' },
  { name: 'Currency Symbols', start: 0x20A0, end: 0x20CF, example: '€, ₿, ₹' },
];
