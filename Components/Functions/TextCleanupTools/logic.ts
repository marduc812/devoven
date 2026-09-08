// ─── Text cleanup one-liners ─────────────────────────────────────────────────
// Four small transforms that share nothing but their shape: text in, text out.

// ─── Remove diacritics ────────────────────────────────────────────────────────

/**
 * Letters that carry their mark inside the code point rather than as a
 * combining character, so NFD leaves them alone. Latin only; anything outside
 * this table survives untouched.
 */
const NON_DECOMPOSING: Record<string, string> = {
  'æ': 'ae', 'Æ': 'AE', 'œ': 'oe', 'Œ': 'OE',
  'ø': 'o', 'Ø': 'O', 'đ': 'd', 'Đ': 'D',
  'ð': 'd', 'Ð': 'D', 'ł': 'l', 'Ł': 'L',
  'ß': 'ss', 'ẞ': 'SS', 'þ': 'th', 'Þ': 'TH',
  'ħ': 'h', 'Ħ': 'H', 'ı': 'i', 'İ': 'I',
  'ŋ': 'n', 'Ŋ': 'N', 'ƒ': 'f', 'ĸ': 'k',
  'ŧ': 't', 'Ŧ': 'T',
};

const NON_DECOMPOSING_PATTERN = new RegExp(
  `[${Object.keys(NON_DECOMPOSING).join('')}]`,
  'g',
);

export type DiacriticsMode = 'marks' | 'fold';

/**
 * Strips combining marks. `fold` additionally transliterates the letters above,
 * which is what you want for a filename or an identifier and not what you want
 * when the marks are the only thing you meant to lose.
 */
export function removeDiacritics(text: string, mode: DiacriticsMode = 'marks'): string {
  const stripped = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC');
  if (mode !== 'fold') return stripped;
  return stripped.replace(NON_DECOMPOSING_PATTERN, (c) => NON_DECOMPOSING[c] ?? c);
}

/** Every character that changed, as `original -> replacement` rows. */
export function listDiacritics(text: string, mode: DiacriticsMode = 'marks'): string {
  const seen = new Map<string, string>();
  for (const char of text) {
    const cleaned = removeDiacritics(char, mode);
    if (cleaned !== char && !seen.has(char)) seen.set(char, cleaned);
  }
  if (seen.size === 0) return 'No accented characters found.';
  const rows = [...seen].map(([from, to]) => {
    const cp = from.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0');
    return `${from}  U+${cp}  →  ${to || '(removed)'}`;
  });
  return [`${seen.size} accented character${seen.size === 1 ? '' : 's'}`, '', ...rows].join('\n');
}

// ─── Strip ANSI escape codes ──────────────────────────────────────────────────

// CSI sequences (colour, cursor moves), OSC sequences (window titles, hyperlinks,
// closed by BEL or ST) and the single-character escapes in between.
const ANSI_SOURCE =
  '\\x1b(?:\\[[0-?]*[\\x20-\\x2f]*[@-~]|\\][\\s\\S]*?(?:\\x07|\\x1b\\\\)|[@-Z\\\\-_])';

function ansiPattern(): RegExp {
  return new RegExp(ANSI_SOURCE, 'g');
}

// Everything left in C0 and DEL once the escape sequences are gone, minus the
// tab, newline and carriage return that make the text a text.
const OTHER_CONTROLS = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g;

export type AnsiMode = 'strip' | 'list';

/** Removes escape sequences, and optionally the remaining control bytes too. */
export function stripAnsi(text: string, alsoControls = false): string {
  const clean = text.replace(ansiPattern(), '');
  return alsoControls ? clean.replace(OTHER_CONTROLS, '') : clean;
}

const SGR_NAMES: Record<number, string> = {
  0: 'reset', 1: 'bold', 2: 'dim', 3: 'italic', 4: 'underline', 5: 'blink',
  7: 'reverse', 8: 'hidden', 9: 'strikethrough',
  22: 'normal intensity', 23: 'not italic', 24: 'not underlined', 27: 'not reversed',
  30: 'black', 31: 'red', 32: 'green', 33: 'yellow',
  34: 'blue', 35: 'magenta', 36: 'cyan', 37: 'white', 39: 'default colour',
  40: 'black bg', 41: 'red bg', 42: 'green bg', 43: 'yellow bg',
  44: 'blue bg', 45: 'magenta bg', 46: 'cyan bg', 47: 'white bg', 49: 'default bg',
  90: 'bright black', 91: 'bright red', 92: 'bright green', 93: 'bright yellow',
  94: 'bright blue', 95: 'bright magenta', 96: 'bright cyan', 97: 'bright white',
};

const CSI_FINALS: Record<string, string> = {
  A: 'cursor up', B: 'cursor down', C: 'cursor forward', D: 'cursor back',
  E: 'cursor next line', F: 'cursor previous line', G: 'cursor column',
  H: 'cursor position', J: 'erase display', K: 'erase line',
  S: 'scroll up', T: 'scroll down', h: 'set mode', l: 'reset mode',
};

function describeAnsi(seq: string): string {
  const csi = seq.match(/^\x1b\[([0-?]*)[\x20-\x2f]*([@-~])$/);
  if (csi) {
    const [, args, final] = csi;
    if (final === 'm') {
      const codes = args === '' ? ['0'] : args.split(';');
      return `SGR: ${codes.map((c) => SGR_NAMES[Number(c)] ?? `code ${c}`).join(', ')}`;
    }
    return `CSI ${final}: ${CSI_FINALS[final] ?? 'unrecognised'}${args ? ` (${args})` : ''}`;
  }
  if (seq.startsWith('\x1b]')) return 'OSC: operating system command';
  return 'escape sequence';
}

/** A report of the sequences found, one row per distinct sequence, with counts. */
export function listAnsi(text: string): string {
  const counts = new Map<string, number>();
  for (const match of text.matchAll(ansiPattern())) {
    counts.set(match[0], (counts.get(match[0]) ?? 0) + 1);
  }
  if (counts.size === 0) return 'No ANSI escape sequences found.';
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  const rows = [...counts]
    .sort((a, b) => b[1] - a[1])
    .map(([seq, n]) => {
      const shown = seq.replace(/\x1b/g, 'ESC').replace(/\x07/g, 'BEL');
      return `${String(n).padStart(4)}  ${shown.padEnd(22)}  ${describeAnsi(seq)}`;
    });
  return [
    `${total} sequence${total === 1 ? '' : 's'}, ${counts.size} distinct`,
    '',
    ...rows,
  ].join('\n');
}

// ─── Strip HTML tags ──────────────────────────────────────────────────────────

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  copy: '©', reg: '®', trade: '™', hellip: '…',
  mdash: '—', ndash: '–', lsquo: '‘', rsquo: '’',
  ldquo: '“', rdquo: '”', laquo: '«', raquo: '»',
  deg: '°', plusmn: '±', times: '×', divide: '÷',
  euro: '€', pound: '£', yen: '¥', cent: '¢',
  sect: '§', para: '¶', middot: '·', bull: '•',
  dagger: '†', permil: '‰', larr: '←', rarr: '→',
  harr: '↔', infin: '∞', ne: '≠', le: '≤', ge: '≥',
};

/** Entity decoding without a DOM: the named table above plus numeric references. */
export function decodeHtmlEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (whole, body: string) => {
    if (body[0] === '#') {
      const hex = body[1] === 'x' || body[1] === 'X';
      const cp = hex ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      if (!Number.isFinite(cp) || cp < 0 || cp > 0x10ffff) return whole;
      try {
        return String.fromCodePoint(cp);
      } catch {
        return whole;
      }
    }
    return NAMED_ENTITIES[body] ?? NAMED_ENTITIES[body.toLowerCase()] ?? whole;
  });
}

export type StripHtmlOptions = {
  /** Turn `<br>`, `</p>`, `</div>` and friends into newlines instead of nothing. */
  keepBreaks?: boolean;
  /** Decode `&amp;` and the rest once the tags are gone. */
  decodeEntities?: boolean;
  /** Collapse the blank-line runs and trailing spaces that stripping leaves behind. */
  tidy?: boolean;
};

const BLOCK_TAGS =
  'address|article|aside|blockquote|div|dd|dl|dt|fieldset|figcaption|figure|footer|' +
  'form|h[1-6]|header|hr|li|main|nav|ol|p|pre|section|table|tbody|td|tfoot|th|thead|tr|ul';

/**
 * Tag removal by regex, which is the right tool here and not for parsing: the
 * script and style bodies go first, comments and CDATA next, then the tags.
 */
export function stripHtmlTags(html: string, options: StripHtmlOptions = {}): string {
  const { keepBreaks = true, decodeEntities = true, tidy = true } = options;

  let out = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '')
    .replace(/<\?[\s\S]*?\?>/g, '');

  if (keepBreaks) {
    out = out
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(new RegExp(`</(?:${BLOCK_TAGS})\\s*>`, 'gi'), '\n')
      .replace(new RegExp(`<(?:${BLOCK_TAGS})\\b[^>]*/>`, 'gi'), '\n');
  }

  out = out.replace(/<\/?[a-zA-Z][^>]*>/g, '');
  if (decodeEntities) out = decodeHtmlEntities(out);

  if (tidy) {
    out = out
      .split('\n')
      .map((line) => line.replace(/[^\S\n]+/g, ' ').trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
  return out;
}

// ─── Pad lines ────────────────────────────────────────────────────────────────

export type PadSide = 'left' | 'right' | 'both';

export type PadOptions = {
  width: number;
  side?: PadSide;
  /** A single character. Longer strings are cut down to their first character. */
  fill?: string;
  /** Cut lines already longer than the width instead of leaving them alone. */
  truncate?: boolean;
};

/**
 * Pads every line to the same width. `both` centres the line and puts the odd
 * character on the right, so a block of centred text keeps a straight left edge.
 */
export function padLines(text: string, options: PadOptions): string {
  const width = Math.floor(options.width);
  if (!Number.isFinite(width) || width < 0) throw new Error('Width must be a positive number');
  if (width > 10000) throw new Error('Width must be 10000 or less');

  const fillSource = options.fill ?? ' ';
  const fill = fillSource === '' ? ' ' : [...fillSource][0];
  const side = options.side ?? 'right';

  return text.split('\n').map((line) => {
    const chars = [...line];
    if (chars.length >= width) {
      return options.truncate ? chars.slice(0, width).join('') : line;
    }
    const missing = width - chars.length;
    if (side === 'left') return fill.repeat(missing) + line;
    if (side === 'right') return line + fill.repeat(missing);
    const left = Math.floor(missing / 2);
    return fill.repeat(left) + line + fill.repeat(missing - left);
  }).join('\n');
}
