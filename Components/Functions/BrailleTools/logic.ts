/**
 * Grade 1 Braille converter using Unicode Braille Patterns (U+2800–U+28FF).
 * Braille cell bit layout (dots 1-8):
 *   dot 1 = bit 0 (0x01)
 *   dot 2 = bit 1 (0x02)
 *   dot 3 = bit 2 (0x04)
 *   dot 4 = bit 3 (0x08)
 *   dot 5 = bit 4 (0x10)
 *   dot 6 = bit 5 (0x20)
 *   dot 7 = bit 6 (0x40)
 *   dot 8 = bit 7 (0x80)
 *
 * Standard Grade 1 Braille uses dots 1-6 only.
 */

// Braille cell values for A-Z (dots 1-6)
const LETTER_MAP: Record<string, number> = {
  'a': 0x01, 'b': 0x03, 'c': 0x09, 'd': 0x19, 'e': 0x11,
  'f': 0x0B, 'g': 0x1B, 'h': 0x13, 'i': 0x0A, 'j': 0x1A,
  'k': 0x05, 'l': 0x07, 'm': 0x0D, 'n': 0x1D, 'o': 0x15,
  'p': 0x0F, 'q': 0x1F, 'r': 0x17, 's': 0x0E, 't': 0x1E,
  'u': 0x25, 'v': 0x27, 'w': 0x3A, 'x': 0x2D, 'y': 0x3D,
  'z': 0x35,
};

// Digits 1-9, 0 use the same patterns as a-j with number indicator prefix
const DIGIT_MAP: Record<string, number> = {
  '1': 0x01, '2': 0x03, '3': 0x09, '4': 0x19, '5': 0x11,
  '6': 0x0B, '7': 0x1B, '8': 0x13, '9': 0x0A, '0': 0x1A,
};

// Number indicator cell (dots 3, 4, 5, 6)
const NUMBER_INDICATOR = 0x3C;

// Punctuation
const PUNCT_MAP: Record<string, number> = {
  '.': 0x32,
  ',': 0x02,
  ';': 0x06,
  ':': 0x12,
  '!': 0x16,
  '?': 0x26,
  "'": 0x04,
  '-': 0x24,
  '(': 0x36,
  ')': 0x36,
  '"': 0x10,
  ' ': 0x00, // space = empty cell
};

// Capital indicator (dot 6)
const CAPITAL_INDICATOR = 0x20;

export interface BrailleCell {
  original: string;
  brailleChar: string;
  dots: string; // e.g. "1-2-4"
  isIndicator?: boolean;
  indicatorLabel?: string;
  /** Raw dot bitmask (dot n = bit n-1), for rendering the 2x3 cell. */
  bits?: number;
}

/** Expand a cell bitmask into six booleans, indexed dot 1..6. */
export function dotsOf(bits: number): boolean[] {
  return [1, 2, 3, 4, 5, 6].map(dot => (bits & (1 << (dot - 1))) !== 0);
}

function cellToDots(bits: number): string {
  const dots: number[] = [];
  for (let dot = 1; dot <= 6; dot++) {
    if (bits & (1 << (dot - 1))) dots.push(dot);
  }
  return dots.length > 0 ? dots.join('-') : '(space)';
}

function bitsToChar(bits: number): string {
  return String.fromCharCode(0x2800 + bits);
}

export function textToBraille(text: string): BrailleCell[] {
  const cells: BrailleCell[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    const lower = ch.toLowerCase();

    // Digit sequence
    if (ch >= '0' && ch <= '9') {
      // Insert number indicator
      cells.push({
        original: '#',
        brailleChar: bitsToChar(NUMBER_INDICATOR),
        dots: cellToDots(NUMBER_INDICATOR),
        bits: NUMBER_INDICATOR,
        isIndicator: true,
        indicatorLabel: 'number',
      });
      // Consume all consecutive digits
      while (i < text.length && text[i] >= '0' && text[i] <= '9') {
        const d = text[i];
        const bits = DIGIT_MAP[d];
        cells.push({
          original: d,
          brailleChar: bitsToChar(bits),
          dots: cellToDots(bits),
          bits,
        });
        i++;
      }
      continue;
    }

    // Uppercase letter
    if (ch >= 'A' && ch <= 'Z') {
      cells.push({
        original: '^',
        brailleChar: bitsToChar(CAPITAL_INDICATOR),
        dots: cellToDots(CAPITAL_INDICATOR),
        bits: CAPITAL_INDICATOR,
        isIndicator: true,
        indicatorLabel: 'capital',
      });
      const bits = LETTER_MAP[lower];
      cells.push({
        original: ch,
        brailleChar: bitsToChar(bits),
        dots: cellToDots(bits),
        bits,
      });
      i++;
      continue;
    }

    // Lowercase letter
    if (ch >= 'a' && ch <= 'z') {
      const bits = LETTER_MAP[ch];
      cells.push({
        original: ch,
        brailleChar: bitsToChar(bits),
        dots: cellToDots(bits),
        bits,
      });
      i++;
      continue;
    }

    // Punctuation or space
    if (ch in PUNCT_MAP) {
      const bits = PUNCT_MAP[ch];
      cells.push({
        original: ch === ' ' ? '⎵' : ch,
        brailleChar: bitsToChar(bits),
        dots: ch === ' ' ? '(empty)' : cellToDots(bits),
        bits,
      });
      i++;
      continue;
    }

    // Unknown character — pass through as a representation note
    cells.push({
      original: ch,
      brailleChar: '?',
      dots: '(unsupported)',
    });
    i++;
  }
  return cells;
}

export function formatBrailleOutput(text: string): string {
  if (!text.trim()) return '';
  const cells = textToBraille(text);

  const brailleStr = cells.map(c => c.brailleChar).join('');
  const lines: string[] = [];
  lines.push('Braille Output:');
  lines.push(brailleStr);
  lines.push('');
  lines.push('Cell Details:');
  lines.push('  Char    Braille    Dots');
  lines.push('  ' + '-'.repeat(40));
  for (const cell of cells) {
    const label = cell.isIndicator ? `[${cell.indicatorLabel} indicator]` : cell.original;
    lines.push(`  ${label.padEnd(7)} ${cell.brailleChar.padEnd(10)} ${cell.dots}`);
  }
  lines.push('');
  lines.push('Notes:');
  lines.push('  ^ = capital indicator (dot 6) precedes each uppercase letter');
  lines.push('  # = number indicator (dots 3-4-5-6) precedes digit sequences');
  lines.push('  Supported: A-Z, a-z, 0-9, basic punctuation (.,;:!?\'-()\" )');
  return lines.join('\n');
}
