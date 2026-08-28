export function getUtf8Bytes(text: string): string {
  const bytes = new TextEncoder().encode(text);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' ');
}

/**
 * Grapheme clusters — what a reader calls "a character". Intl.Segmenter is the only
 * correct way to count them, but it is missing on older engines, where the code point
 * count is the closest honest answer.
 */
export function countGraphemes(text: string): number {
  const withSegmenter = Intl as unknown as {
    Segmenter?: new (
      locale?: string,
      options?: { granularity?: string }
    ) => { segment(input: string): Iterable<unknown> };
  };
  if (!withSegmenter.Segmenter) return [...text].length;
  return [...new withSegmenter.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].length;
}

const CONTROL_NAMES: Record<number, string> = {
  0x00: 'NUL', 0x07: 'BEL', 0x08: 'BS', 0x09: 'TAB', 0x0a: 'LF', 0x0b: 'VT',
  0x0c: 'FF', 0x0d: 'CR', 0x1b: 'ESC', 0x7f: 'DEL',
};

/** The code points worth naming outright, because they are invisible or deceptive. */
const NOTABLE_NAMES: Record<number, string> = {
  0x00a0: 'NO-BREAK SPACE',
  0x00ad: 'SOFT HYPHEN',
  0x200b: 'ZERO WIDTH SPACE',
  0x200c: 'ZERO WIDTH NON-JOINER',
  0x200d: 'ZERO WIDTH JOINER',
  0x200e: 'LEFT-TO-RIGHT MARK',
  0x200f: 'RIGHT-TO-LEFT MARK',
  0x2028: 'LINE SEPARATOR',
  0x2029: 'PARAGRAPH SEPARATOR',
  0x202a: 'LEFT-TO-RIGHT EMBEDDING',
  0x202b: 'RIGHT-TO-LEFT EMBEDDING',
  0x202c: 'POP DIRECTIONAL FORMATTING',
  0x202d: 'LEFT-TO-RIGHT OVERRIDE',
  0x202e: 'RIGHT-TO-LEFT OVERRIDE',
  0x2060: 'WORD JOINER',
  0x2066: 'LEFT-TO-RIGHT ISOLATE',
  0x2067: 'RIGHT-TO-LEFT ISOLATE',
  0x2068: 'FIRST STRONG ISOLATE',
  0x2069: 'POP DIRECTIONAL ISOLATE',
  0xfe0f: 'VARIATION SELECTOR-16',
  0xfeff: 'ZERO WIDTH NO-BREAK SPACE (BOM)',
};

const ZERO_WIDTH = [0x200b, 0x200c, 0x200d, 0x2060, 0xfeff];
const BIDI_CONTROLS = [0x202a, 0x202b, 0x202c, 0x202d, 0x202e, 0x2066, 0x2067, 0x2068, 0x2069];

function isCombining(cp: number): boolean {
  return (
    (cp >= 0x0300 && cp <= 0x036f) ||   // combining diacritical marks
    (cp >= 0x1ab0 && cp <= 0x1aff) ||
    (cp >= 0x1dc0 && cp <= 0x1dff) ||
    (cp >= 0x20d0 && cp <= 0x20ff) ||
    (cp >= 0xfe20 && cp <= 0xfe2f)
  );
}

export type CodePointCategory =
  | 'ascii'
  | 'control'
  | 'whitespace'
  | 'latin1'
  | 'combining'
  | 'invisible'
  | 'bidi'
  | 'bmp'
  | 'astral';

export interface CodePointInfo {
  /** Position in code points, 0-based. */
  index: number;
  char: string;
  codePoint: number;
  /** U+XXXX form. */
  hex: string;
  /** What to print — control and invisible code points get a stand-in. */
  display: string;
  name: string;
  category: CodePointCategory;
  utf8: string[];
  utf16: string[];
  /** A JS string escape that round-trips this code point. */
  escape: string;
}

function categorize(cp: number): CodePointCategory {
  if (cp === 0x09 || cp === 0x0a || cp === 0x0d || cp === 0x20) return 'whitespace';
  if (cp < 0x20 || cp === 0x7f) return 'control';
  if (ZERO_WIDTH.includes(cp) || cp === 0x00ad) return 'invisible';
  if (BIDI_CONTROLS.includes(cp) || cp === 0x200e || cp === 0x200f) return 'bidi';
  if (isCombining(cp)) return 'combining';
  if (cp < 0x80) return 'ascii';
  if (cp < 0x100) return 'latin1';
  if (cp > 0xffff) return 'astral';
  return 'bmp';
}

const CATEGORY_LABELS: Record<CodePointCategory, string> = {
  ascii: 'ASCII',
  control: 'Control',
  whitespace: 'Whitespace',
  latin1: 'Latin-1 supplement',
  combining: 'Combining mark',
  invisible: 'Invisible',
  bidi: 'Bidi control',
  bmp: 'Basic multilingual plane',
  astral: 'Supplementary plane',
};

function hexBytes(s: string): string[] {
  return Array.from(new TextEncoder().encode(s)).map(b =>
    b.toString(16).toUpperCase().padStart(2, '0')
  );
}

function utf16UnitsOf(char: string): string[] {
  const units: string[] = [];
  for (let i = 0; i < char.length; i++) {
    units.push(char.charCodeAt(i).toString(16).toUpperCase().padStart(4, '0'));
  }
  return units;
}

export function describeCodePoint(char: string, index = 0): CodePointInfo {
  const cp = char.codePointAt(0)!;
  const category = categorize(cp);

  let display = char;
  if (category === 'control') display = CONTROL_NAMES[cp] ?? `\\x${cp.toString(16).padStart(2, '0')}`;
  else if (category === 'invisible' || category === 'bidi') display = '◌';
  else if (category === 'combining') display = `◌${char}`;
  else if (cp === 0x20) display = '␣';
  else if (cp === 0x09) display = 'TAB';
  else if (cp === 0x0a || cp === 0x0d) display = CONTROL_NAMES[cp];

  return {
    index,
    char,
    codePoint: cp,
    hex: `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`,
    display,
    name: NOTABLE_NAMES[cp] ?? CONTROL_NAMES[cp] ?? CATEGORY_LABELS[category],
    category,
    utf8: hexBytes(char),
    utf16: utf16UnitsOf(char),
    escape:
      cp > 0xffff
        ? `\\u{${cp.toString(16).toUpperCase()}}`
        : `\\u${cp.toString(16).toUpperCase().padStart(4, '0')}`,
  };
}

export interface StringFlag {
  tone: 'warn' | 'info' | 'fail';
  label: string;
  detail: string;
}

export interface NormalizationForm {
  form: 'NFC' | 'NFD' | 'NFKC' | 'NFKD';
  value: string;
  changed: boolean;
  codePoints: number;
  utf8Bytes: number;
}

export interface StringReport {
  text: string;
  utf8Bytes: number;
  utf16Units: number;
  utf32Bytes: number;
  codePointCount: number;
  graphemeCount: number;
  lineCount: number;
  asciiOnly: boolean;
  /** Capped for rendering; `truncated` says whether anything was left out. */
  codePoints: CodePointInfo[];
  truncated: boolean;
  utf8Hex: string;
  flags: StringFlag[];
  normalization: NormalizationForm[];
}

const MAX_CODE_POINTS = 256;

export function analyzeString(text: string, limit = MAX_CODE_POINTS): StringReport {
  const chars = [...text];
  const utf8 = new TextEncoder().encode(text);
  const codePoints = chars.slice(0, limit).map((ch, i) => describeCodePoint(ch, i));
  const all = chars.map(ch => ch.codePointAt(0)!);

  const flags: StringFlag[] = [];

  if (text.charCodeAt(0) === 0xfeff) {
    flags.push({
      tone: 'warn',
      label: 'Byte order mark',
      detail: 'The string starts with U+FEFF. It is invisible but counts as a character and breaks exact comparisons.',
    });
  }
  if (all.some((cp, i) => ZERO_WIDTH.includes(cp) && !(i === 0 && cp === 0xfeff))) {
    flags.push({
      tone: 'warn',
      label: 'Zero-width characters',
      detail: 'Contains code points that render as nothing but still change length and equality.',
    });
  }
  if (all.some(cp => BIDI_CONTROLS.includes(cp))) {
    flags.push({
      tone: 'fail',
      label: 'Bidi control characters',
      detail: 'Directional overrides can display text in an order that differs from the stored order — the Trojan Source trick.',
    });
  }
  if (all.some(isCombining)) {
    flags.push({
      tone: 'info',
      label: 'Combining marks',
      detail: 'Accents are stored apart from their base letter, so one visible character spans several code points.',
    });
  }
  if (all.some(cp => cp > 0xffff)) {
    flags.push({
      tone: 'info',
      label: 'Astral plane characters',
      detail: 'Code points above U+FFFF take two UTF-16 units, so slicing by JS string index can cut one in half.',
    });
  }
  if (all.includes(0x00a0)) {
    flags.push({
      tone: 'warn',
      label: 'Non-breaking space',
      detail: 'U+00A0 looks like a space but is a different character, and it survives many hand-written trim routines.',
    });
  }
  if (all.some(cp => (cp < 0x20 || cp === 0x7f) && cp !== 0x09 && cp !== 0x0a && cp !== 0x0d)) {
    flags.push({
      tone: 'warn',
      label: 'Control characters',
      detail: 'Contains C0 control codes other than tab, newline and carriage return.',
    });
  }
  if (/\r\n/.test(text) && /(?:^|[^\r])\n/.test(text)) {
    flags.push({
      tone: 'warn',
      label: 'Mixed line endings',
      detail: 'Both CRLF and bare LF appear in the same string.',
    });
  }
  if (/[ \t]+(\r?\n|$)/.test(text)) {
    flags.push({
      tone: 'info',
      label: 'Trailing whitespace',
      detail: 'At least one line ends in spaces or tabs.',
    });
  }
  if (text !== text.normalize('NFC')) {
    flags.push({
      tone: 'warn',
      label: 'Not in NFC',
      detail: 'The composed form differs, so this will not compare equal to the same text typed elsewhere.',
    });
  }

  const normalization: NormalizationForm[] = (['NFC', 'NFD', 'NFKC', 'NFKD'] as const).map(form => {
    const value = text.normalize(form);
    return {
      form,
      value,
      changed: value !== text,
      codePoints: [...value].length,
      utf8Bytes: new TextEncoder().encode(value).length,
    };
  });

  return {
    text,
    utf8Bytes: utf8.length,
    utf16Units: text.length,
    utf32Bytes: chars.length * 4,
    codePointCount: chars.length,
    graphemeCount: countGraphemes(text),
    lineCount: text === '' ? 0 : text.split(/\r\n|\r|\n/).length,
    asciiOnly: all.every(cp => cp < 0x80),
    codePoints,
    truncated: chars.length > limit,
    utf8Hex: getUtf8Bytes(text),
    flags,
    normalization,
  };
}
