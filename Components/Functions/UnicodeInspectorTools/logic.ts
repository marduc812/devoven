export type CharInfo = {
  char: string;
  codePoint: number;
  codePointStr: string;   // U+XXXX
  decimal: number;
  hex: string;            // 0x1F600
  name: string;           // descriptive name or category
  category: string;       // Unicode general category abbreviation
  categoryName: string;
  utf8Bytes: string;      // e.g. "F0 9F 98 80"
  utf8ByteCount: number;
  utf16Units: string;     // e.g. "D83D DE00" for surrogate pair
  utf16ByteCount: number;
  isSurrogate: boolean;
  isCombining: boolean;
  isEmoji: boolean;
};

export type InspectionResult = {
  chars: CharInfo[];
  totalCodePoints: number;
  utf8TotalBytes: number;
  utf16TotalBytes: number;
  summary: string;
};

/** Map Unicode general category to descriptive name */
function getCategoryName(category: string): string {
  const map: Record<string, string> = {
    Lu: 'Uppercase Letter', Ll: 'Lowercase Letter', Lt: 'Titlecase Letter',
    Lm: 'Modifier Letter', Lo: 'Other Letter',
    Mn: 'Non-spacing Mark', Mc: 'Spacing Combining Mark', Me: 'Enclosing Mark',
    Nd: 'Decimal Digit Number', Nl: 'Letter Number', No: 'Other Number',
    Pc: 'Connector Punctuation', Pd: 'Dash Punctuation', Ps: 'Open Punctuation',
    Pe: 'Close Punctuation', Pi: 'Initial Punctuation', Pf: 'Final Punctuation',
    Po: 'Other Punctuation',
    Sm: 'Math Symbol', Sc: 'Currency Symbol', Sk: 'Modifier Symbol', So: 'Other Symbol',
    Zs: 'Space Separator', Zl: 'Line Separator', Zp: 'Paragraph Separator',
    Cc: 'Control', Cf: 'Format', Cs: 'Surrogate', Co: 'Private Use', Cn: 'Not Assigned',
  };
  return map[category] || 'Unknown';
}

/** Get Unicode general category for a code point (heuristic, covers major ranges) */
function getCategory(cp: number): string {
  if (cp >= 0x41 && cp <= 0x5A) return 'Lu'; // A-Z
  if (cp >= 0x61 && cp <= 0x7A) return 'Ll'; // a-z
  if (cp >= 0x30 && cp <= 0x39) return 'Nd'; // 0-9
  if (cp === 0x20) return 'Zs'; // space
  if (cp === 0x09 || cp === 0x0A || cp === 0x0D) return 'Cc'; // tab, LF, CR
  if (cp < 0x20 || (cp >= 0x7F && cp <= 0x9F)) return 'Cc';
  if (cp >= 0x300 && cp <= 0x36F) return 'Mn'; // combining diacritics
  if (cp >= 0x1DC0 && cp <= 0x1DFF) return 'Mn';
  if (cp >= 0x20D0 && cp <= 0x20FF) return 'Mn';
  if (cp >= 0xFE20 && cp <= 0xFE2F) return 'Mn';
  if (cp >= 0x0600 && cp <= 0x06FF) return 'Lo'; // Arabic
  if (cp >= 0x0400 && cp <= 0x04FF) return cp <= 0x042F ? 'Lu' : 'Ll'; // Cyrillic
  if (cp >= 0x4E00 && cp <= 0x9FFF) return 'Lo'; // CJK
  if (cp >= 0x3040 && cp <= 0x309F) return 'Lo'; // Hiragana
  if (cp >= 0x30A0 && cp <= 0x30FF) return 'Lo'; // Katakana
  if (cp >= 0xAC00 && cp <= 0xD7A3) return 'Lo'; // Hangul
  if (cp >= 0x1F300 && cp <= 0x1FBFF) return 'So'; // Emoji/symbols
  if (cp >= 0x2600 && cp <= 0x27BF) return 'So'; // Misc symbols
  if (cp >= 0x2700 && cp <= 0x27BF) return 'So'; // Dingbats
  if ((cp >= 0x21 && cp <= 0x2F) || (cp >= 0x3A && cp <= 0x40) ||
    (cp >= 0x5B && cp <= 0x60) || (cp >= 0x7B && cp <= 0x7E)) return 'Po';
  if (cp >= 0x00C0 && cp <= 0x00D6) return 'Lu';
  if (cp >= 0x00D8 && cp <= 0x00DE) return 'Lu';
  if (cp >= 0x00DF && cp <= 0x00F6) return 'Ll';
  if (cp >= 0x00F8 && cp <= 0x00FF) return 'Ll';
  if (cp >= 0x0100 && cp <= 0x017E) return cp % 2 === 0 ? 'Lu' : 'Ll';
  if (cp >= 0xD800 && cp <= 0xDFFF) return 'Cs';
  if (cp >= 0xE000 && cp <= 0xF8FF) return 'Co';
  if (cp >= 0xFFF0 && cp <= 0xFFFF) return 'Cn';
  if (cp >= 0xA0 && cp <= 0xBF) return 'Po';
  return 'Lo';
}

/** Check if code point is in combining mark range */
function isCombiningMark(cp: number): boolean {
  return (cp >= 0x300 && cp <= 0x36F) ||
    (cp >= 0x1DC0 && cp <= 0x1DFF) ||
    (cp >= 0x20D0 && cp <= 0x20FF) ||
    (cp >= 0xFE20 && cp <= 0xFE2F) ||
    (cp >= 0x0900 && cp <= 0x097F && cp % 16 >= 2 && cp % 16 <= 4);
}

/** Check if code point is emoji */
function isEmojiCodePoint(cp: number): boolean {
  return (cp >= 0x1F300 && cp <= 0x1FBFF) ||
    (cp >= 0x2600 && cp <= 0x27BF) ||
    (cp >= 0xFE00 && cp <= 0xFE0F) || // variation selectors
    (cp >= 0x1F1E0 && cp <= 0x1F1FF) || // flag sequences
    cp === 0x200D || // ZWJ
    cp === 0x20E3; // combining enclosing keycap
}

/** Get a descriptive name for the character */
function getCharName(cp: number): string {
  // Control chars
  const controlNames: Record<number, string> = {
    0x00: 'NULL', 0x07: 'BELL', 0x08: 'BACKSPACE', 0x09: 'CHARACTER TABULATION',
    0x0A: 'LINE FEED', 0x0B: 'LINE TABULATION', 0x0C: 'FORM FEED',
    0x0D: 'CARRIAGE RETURN', 0x1B: 'ESCAPE', 0x7F: 'DELETE',
    0xFEFF: 'ZERO WIDTH NO-BREAK SPACE (BOM)', 0x200B: 'ZERO WIDTH SPACE',
    0x200C: 'ZERO WIDTH NON-JOINER', 0x200D: 'ZERO WIDTH JOINER',
    0x200E: 'LEFT-TO-RIGHT MARK', 0x200F: 'RIGHT-TO-LEFT MARK',
    0x2028: 'LINE SEPARATOR', 0x2029: 'PARAGRAPH SEPARATOR',
    0x00A0: 'NO-BREAK SPACE', 0x00AD: 'SOFT HYPHEN',
  };
  if (controlNames[cp]) return controlNames[cp];

  // ASCII printable
  if (cp >= 0x20 && cp <= 0x7E) {
    const names: Record<number, string> = {
      0x20: 'SPACE', 0x21: 'EXCLAMATION MARK', 0x22: 'QUOTATION MARK',
      0x23: 'NUMBER SIGN', 0x24: 'DOLLAR SIGN', 0x25: 'PERCENT SIGN',
      0x26: 'AMPERSAND', 0x27: 'APOSTROPHE', 0x28: 'LEFT PARENTHESIS',
      0x29: 'RIGHT PARENTHESIS', 0x2A: 'ASTERISK', 0x2B: 'PLUS SIGN',
      0x2C: 'COMMA', 0x2D: 'HYPHEN-MINUS', 0x2E: 'FULL STOP',
      0x2F: 'SOLIDUS', 0x3A: 'COLON', 0x3B: 'SEMICOLON',
      0x3C: 'LESS-THAN SIGN', 0x3D: 'EQUALS SIGN', 0x3E: 'GREATER-THAN SIGN',
      0x3F: 'QUESTION MARK', 0x40: 'COMMERCIAL AT',
      0x5B: 'LEFT SQUARE BRACKET', 0x5C: 'REVERSE SOLIDUS', 0x5D: 'RIGHT SQUARE BRACKET',
      0x5E: 'CIRCUMFLEX ACCENT', 0x5F: 'LOW LINE', 0x60: 'GRAVE ACCENT',
      0x7B: 'LEFT CURLY BRACKET', 0x7C: 'VERTICAL LINE', 0x7D: 'RIGHT CURLY BRACKET',
      0x7E: 'TILDE',
    };
    if (names[cp]) return names[cp];
    if (cp >= 0x30 && cp <= 0x39) return `DIGIT ${String.fromCodePoint(cp)}`;
    if (cp >= 0x41 && cp <= 0x5A) return `LATIN CAPITAL LETTER ${String.fromCodePoint(cp)}`;
    if (cp >= 0x61 && cp <= 0x7A) return `LATIN SMALL LETTER ${String.fromCodePoint(cp).toUpperCase()}`;
    return `ASCII CHARACTER ${cp}`;
  }

  // Common Unicode ranges
  if (cp >= 0x00C0 && cp <= 0x00FF) return `LATIN EXTENDED CHARACTER U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
  if (cp >= 0x0400 && cp <= 0x04FF) return `CYRILLIC CHARACTER U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
  if (cp >= 0x0600 && cp <= 0x06FF) return `ARABIC CHARACTER U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
  if (cp >= 0x0900 && cp <= 0x097F) return `DEVANAGARI CHARACTER U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
  if (cp >= 0x3040 && cp <= 0x309F) return `HIRAGANA CHARACTER U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
  if (cp >= 0x30A0 && cp <= 0x30FF) return `KATAKANA CHARACTER U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
  if (cp >= 0x4E00 && cp <= 0x9FFF) return `CJK UNIFIED IDEOGRAPH U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
  if (cp >= 0xAC00 && cp <= 0xD7A3) return `HANGUL SYLLABLE U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
  if (cp >= 0x1F300 && cp <= 0x1FBFF) return `EMOJI/SYMBOL U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
  if (cp >= 0x2600 && cp <= 0x27BF) return `MISCELLANEOUS SYMBOL U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;

  return `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
}

/** Encode code point to UTF-8 bytes */
function toUtf8Bytes(cp: number): number[] {
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

/** Encode code point to UTF-16 code units (returns 1 or 2 units) */
function toUtf16Units(cp: number): number[] {
  if (cp < 0x10000) return [cp];
  const c = cp - 0x10000;
  return [0xD800 | (c >> 10), 0xDC00 | (c & 0x3FF)];
}

/** Extract code points from a string (handles surrogate pairs) */
function extractCodePoints(str: string): number[] {
  const cps: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code >= 0xD800 && code <= 0xDBFF && i + 1 < str.length) {
      const next = str.charCodeAt(i + 1);
      if (next >= 0xDC00 && next <= 0xDFFF) {
        cps.push(0x10000 + ((code - 0xD800) << 10) + (next - 0xDC00));
        i++;
        continue;
      }
    }
    cps.push(code);
  }
  return cps;
}

export function inspectText(text: string): InspectionResult {
  if (!text) {
    return { chars: [], totalCodePoints: 0, utf8TotalBytes: 0, utf16TotalBytes: 0, summary: '' };
  }

  const codePoints = extractCodePoints(text);
  const chars: CharInfo[] = [];
  let utf8Total = 0;
  let utf16Total = 0;

  for (const cp of codePoints) {
    const char = String.fromCodePoint(cp);
    const utf8 = toUtf8Bytes(cp);
    const utf16 = toUtf16Units(cp);
    const category = getCategory(cp);
    const utf8Str = utf8.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
    const utf16Str = utf16.map(u => u.toString(16).toUpperCase().padStart(4, '0')).join(' ');

    utf8Total += utf8.length;
    utf16Total += utf16.length * 2;

    chars.push({
      char,
      codePoint: cp,
      codePointStr: 'U+' + cp.toString(16).toUpperCase().padStart(4, '0'),
      decimal: cp,
      hex: '0x' + cp.toString(16).toUpperCase(),
      name: getCharName(cp),
      category,
      categoryName: getCategoryName(category),
      utf8Bytes: utf8Str,
      utf8ByteCount: utf8.length,
      utf16Units: utf16Str,
      utf16ByteCount: utf16.length * 2,
      isSurrogate: category === 'Cs',
      isCombining: isCombiningMark(cp),
      isEmoji: isEmojiCodePoint(cp),
    });
  }

  const categories = chars.reduce((acc, c) => {
    acc[c.categoryName] = (acc[c.categoryName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const catSummary = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([k, v]) => `${v}× ${k}`)
    .join(', ');

  const summary = [
    `${codePoints.length} code points`,
    `${utf8Total} UTF-8 bytes`,
    `${utf16Total} UTF-16 bytes`,
    catSummary,
  ].filter(Boolean).join(' · ');

  return { chars, totalCodePoints: codePoints.length, utf8TotalBytes: utf8Total, utf16TotalBytes: utf16Total, summary };
}

export function formatInspection(result: InspectionResult): string {
  if (result.chars.length === 0) return '';
  const header = `Code Points: ${result.totalCodePoints}  |  UTF-8: ${result.utf8TotalBytes} bytes  |  UTF-16: ${result.utf16TotalBytes} bytes\n\n`;
  const rows = result.chars.map((c, i) => {
    const idx = String(i + 1).padStart(3, ' ');
    const cp = c.codePointStr.padEnd(8);
    const ch = (c.char === '\n' ? '↵' : c.char === '\t' ? '→' : c.char === ' ' ? '·' : c.char).padEnd(4);
    return `${idx}. ${cp}  ${ch}  UTF-8: ${c.utf8Bytes.padEnd(17)}  UTF-16: ${c.utf16Units.padEnd(12)}  ${c.name}`;
  });
  return header + rows.join('\n');
}
