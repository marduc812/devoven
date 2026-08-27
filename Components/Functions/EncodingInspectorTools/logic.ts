export type CharInfo = {
  char: string;
  codePoint: number;
  hex: string;
  name: string;
  category: string;
};

export function inspectText(text: string): CharInfo[] {
  const results: CharInfo[] = [];
  for (const char of text) {
    const cp = char.codePointAt(0) ?? 0;
    results.push({
      char,
      codePoint: cp,
      hex: `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`,
      name: getUnicodeName(cp),
      category: getUnicodeCategory(cp),
    });
  }
  return results;
}

function getUnicodeName(cp: number): string {
  if (cp < 32) return CONTROL_NAMES[cp] ?? `CONTROL-${cp}`;
  if (cp === 32) return 'SPACE';
  if (cp >= 33 && cp <= 126) return `LATIN LETTER/SYMBOL`;
  if (cp >= 128 && cp <= 159) return `LATIN-1 SUPPLEMENT (control)`;
  if (cp >= 160 && cp <= 255) return `LATIN-1 SUPPLEMENT`;
  if (cp >= 256 && cp <= 591) return `LATIN EXTENDED`;
  if (cp >= 0x2000 && cp <= 0x206f) return `GENERAL PUNCTUATION`;
  if (cp >= 0x2100 && cp <= 0x214f) return `LETTERLIKE SYMBOLS`;
  if (cp >= 0xfe00 && cp <= 0xfe0f) return `VARIATION SELECTOR`;
  if (cp >= 0x1f300 && cp <= 0x1faff) return `EMOJI`;
  return `CHARACTER`;
}

const CONTROL_NAMES: Record<number, string> = {
  0: 'NULL',
  1: 'SOH',
  2: 'STX',
  3: 'ETX',
  4: 'EOT',
  5: 'ENQ',
  6: 'ACK',
  7: 'BEL',
  8: 'BS',
  9: 'TAB',
  10: 'LF',
  11: 'VT',
  12: 'FF',
  13: 'CR',
  14: 'SO',
  15: 'SI',
  16: 'DLE',
  17: 'DC1',
  18: 'DC2',
  19: 'DC3',
  20: 'DC4',
  21: 'NAK',
  22: 'SYN',
  23: 'ETB',
  24: 'CAN',
  25: 'EM',
  26: 'SUB',
  27: 'ESC',
  28: 'FS',
  29: 'GS',
  30: 'RS',
  31: 'US',
};

function getUnicodeCategory(cp: number): string {
  if (cp < 32 || (cp >= 128 && cp <= 159)) return 'Control';
  if (cp === 32 || (cp >= 0x2000 && cp <= 0x200b)) return 'Whitespace';
  if ((cp >= 65 && cp <= 90) || (cp >= 97 && cp <= 122)) return 'Latin Letter';
  if (cp >= 48 && cp <= 57) return 'Digit';
  if (cp >= 33 && cp <= 126) return 'ASCII Symbol';
  if (cp >= 0x1f300 && cp <= 0x1faff) return 'Emoji';
  return 'Unicode';
}

export function formatInspection(chars: CharInfo[]): string {
  if (chars.length === 0) return 'Enter text to inspect';
  return chars
    .slice(0, 200)
    .map(
      c =>
        `${c.hex.padEnd(8)} ${c.category.padEnd(14)} ${c.char === '\n' ? '↵' : c.char === '\t' ? '→' : c.char} — ${c.name}`,
    )
    .join('\n');
}

export function detectIssues(text: string): string[] {
  const issues: string[] = [];
  if (text.includes('\u0000')) issues.push('Contains NULL bytes (U+0000)');
  if (text.includes('\uFEFF')) issues.push('Contains BOM (U+FEFF byte order mark)');
  if (/\r\n/.test(text)) issues.push('Windows line endings (CRLF)');
  else if (/\r/.test(text)) issues.push('Old Mac line endings (CR only)');
  if (/\u200B|\u200C|\u200D/.test(text)) issues.push('Contains zero-width characters');
  if (/\u00A0/.test(text)) issues.push('Contains non-breaking spaces (U+00A0)');
  if (/[\uD800-\uDFFF]/.test(text)) issues.push('Contains lone surrogates (invalid Unicode)');
  return issues;
}
