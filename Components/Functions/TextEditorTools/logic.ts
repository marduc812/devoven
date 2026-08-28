// Pure text operations for the Online Text Editor.
// Everything here is (string, options) => string | Match[] so it can be unit tested
// without a DOM.

export type Match = { start: number; end: number };

export type DedupeOptions = {
  caseInsensitive?: boolean;
  trim?: boolean;
  adjacentOnly?: boolean;
};

export type SortMode = 'asc' | 'desc';

export type FindOptions = {
  regex?: boolean;
  caseSensitive?: boolean;
  wholeWord?: boolean;
  timeBudgetMs?: number;
};

export class SearchTimeoutError extends Error {
  constructor() {
    super('Search took too long and was stopped. Try a more specific pattern.');
    this.name = 'SearchTimeoutError';
  }
}

const DEFAULT_TIME_BUDGET_MS = 1000;
const TIME_CHECK_INTERVAL = 500;

/* ---------- line helpers ---------- */

type Decomposed = { lines: string[]; eol: string; trailing: boolean };

// Splitting a buffer into lines has to remember two things the naive split loses:
// which line ending was in use, and whether the file ended with one.
function decompose(text: string): Decomposed {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const trailing = /\r?\n$/.test(text);
  const body = trailing ? text.replace(/\r?\n$/, '') : text;
  return { lines: body.split(/\r?\n/), eol, trailing };
}

function recompose({ lines, eol, trailing }: Decomposed): string {
  return lines.join(eol) + (trailing ? eol : '');
}

function mapLines(text: string, fn: (lines: string[]) => string[]): string {
  const parts = decompose(text);
  return recompose({ ...parts, lines: fn(parts.lines) });
}

/* ---------- line operations ---------- */

export function dedupeLines(text: string, options: DedupeOptions = {}): string {
  const key = (line: string) => {
    let k = options.trim ? line.trim() : line;
    if (options.caseInsensitive) k = k.toLowerCase();
    return k;
  };

  return mapLines(text, (lines) => {
    if (options.adjacentOnly) {
      return lines.filter((line, i) => i === 0 || key(line) !== key(lines[i - 1]));
    }
    const seen = new Set<string>();
    return lines.filter((line) => {
      const k = key(line);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  });
}

export function sortLines(text: string, mode: SortMode, natural = false): string {
  const collator = natural ? new Intl.Collator(undefined, { numeric: true }) : null;
  const compare = (a: string, b: string) =>
    collator ? collator.compare(a, b) : a < b ? -1 : a > b ? 1 : 0;

  return mapLines(text, (lines) => {
    const sorted = [...lines].sort(compare);
    return mode === 'desc' ? sorted.reverse() : sorted;
  });
}

export function reverseLines(text: string): string {
  return mapLines(text, (lines) => [...lines].reverse());
}

export function trimTrailingWhitespace(text: string): string {
  return mapLines(text, (lines) => lines.map((line) => line.replace(/[ \t]+$/, '')));
}

export function removeEmptyLines(text: string): string {
  return mapLines(text, (lines) => lines.filter((line) => line.trim() !== ''));
}

/* ---------- search ---------- */

function escapeLiteral(source: string): string {
  return source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Builds the RegExp used for both searching and replacing, so the two can never
// disagree about what counts as a match.
export function buildRegex(query: string, options: FindOptions = {}, global = true): RegExp {
  let source = options.regex ? query : escapeLiteral(query);
  if (options.wholeWord) source = `\\b(?:${source})\\b`;

  let flags = global ? 'g' : '';
  if (!options.caseSensitive) flags += 'i';
  // Editors anchor ^ and $ per line, not per buffer, so regex mode is always
  // multiline. Literal mode escapes both characters, so the flag is a no-op there.
  if (options.regex) flags += 'm';

  return new RegExp(source, flags);
}

export function findMatches(text: string, query: string, options: FindOptions = {}): Match[] {
  if (!query) return [];

  const re = buildRegex(query, options, true);
  const budget = options.timeBudgetMs ?? DEFAULT_TIME_BUDGET_MS;
  const startedAt = Date.now();

  const matches: Match[] = [];
  let iterations = 0;
  let result: RegExpExecArray | null;

  while ((result = re.exec(text)) !== null) {
    matches.push({ start: result.index, end: result.index + result[0].length });

    // A zero-width match leaves lastIndex where it was, which would loop forever.
    if (result[0].length === 0) re.lastIndex += 1;

    if (++iterations % TIME_CHECK_INTERVAL === 0 && Date.now() - startedAt >= budget) {
      throw new SearchTimeoutError();
    }
  }

  return matches;
}

/* ---------- replace ---------- */

// One-character escapes the replacement field understands in regex mode.
const REPLACEMENT_ESCAPES: Record<string, string> = {
  n: '\n',
  r: '\r',
  t: '\t',
  f: '\f',
  v: '\v',
  '0': '\0',
  '\\': '\\',
};

// Sticky so it can be tested at one exact offset rather than anywhere later.
const CODE_ESCAPE = /\\(?:x([0-9a-fA-F]{2})|u\{([0-9a-fA-F]{1,6})\}|u([0-9a-fA-F]{4}))/y;

// A character produced by an escape is data, not template syntax, so a `$` that
// came out of `\x24` must not go on to be read as a group reference.
function asLiteral(text: string): string {
  return text.replace(/\$/g, '$$$$');
}

// In regex mode the replacement box is an escape-aware template, the way it works
// in editors like VS Code: typing `\n` has to insert a real newline rather than
// the backslash and the `n` that were typed. Sequences that mean nothing here are
// left exactly as they were, so a lone backslash still survives a replace.
export function unescapeReplacement(replacement: string): string {
  if (!replacement.includes('\\')) return replacement;

  let out = '';

  for (let i = 0; i < replacement.length; i++) {
    const char = replacement[i];

    // A trailing backslash has nothing to escape — it is just a backslash.
    if (char !== '\\' || i === replacement.length - 1) {
      out += char;
      continue;
    }

    const next = replacement[i + 1];

    const simple = REPLACEMENT_ESCAPES[next];
    if (simple !== undefined) {
      out += asLiteral(simple);
      i += 1;
      continue;
    }

    if (next === 'x' || next === 'u') {
      CODE_ESCAPE.lastIndex = i;
      const match = CODE_ESCAPE.exec(replacement);
      if (match) {
        const code = parseInt(match[1] ?? match[2] ?? match[3], 16);
        if (code <= 0x10ffff) {
          out += asLiteral(String.fromCodePoint(code));
          i += match[0].length - 1;
          continue;
        }
      }
    }

    // Unknown escape: keep the backslash and let the next character be read on
    // its own, so `\d` stays `\d`.
    out += char;
  }

  return out;
}

export function replaceAll(
  text: string,
  query: string,
  replacement: string,
  options: FindOptions = {}
): { text: string; count: number } {
  if (!query) return { text, count: 0 };

  const matches = findMatches(text, query, options);
  if (matches.length === 0) return { text, count: 0 };

  // In regex mode the replacement string may contain $1, $&, $$ — let the engine
  // expand them, after the escape sequences have been resolved. In literal mode
  // both of those must survive untouched, so the replacement is spliced in by
  // offset instead.
  if (options.regex) {
    const re = buildRegex(query, options, true);
    return { text: text.replace(re, unescapeReplacement(replacement)), count: matches.length };
  }

  let out = '';
  let cursor = 0;
  for (const match of matches) {
    out += text.slice(cursor, match.start) + replacement;
    cursor = match.end;
  }
  out += text.slice(cursor);

  return { text: out, count: matches.length };
}

// The literal text that a single match should be replaced with. In regex mode the
// replacement may reference groups from that specific match and use escape
// sequences; in literal mode it is used exactly as typed.
export function expandReplacement(
  matched: string,
  query: string,
  replacement: string,
  options: FindOptions = {}
): string {
  if (!options.regex) return replacement;
  return matched.replace(buildRegex(query, options, false), unescapeReplacement(replacement));
}

export function replaceMatch(
  text: string,
  match: Match,
  query: string,
  replacement: string,
  options: FindOptions = {}
): string {
  const expanded = expandReplacement(text.slice(match.start, match.end), query, replacement, options);
  return text.slice(0, match.start) + expanded + text.slice(match.end);
}
