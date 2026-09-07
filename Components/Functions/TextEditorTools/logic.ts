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

// Whole-word matching is decided by the characters either side of a match, not by
// `\b`. Wrapping the query in `\b(?:…)\b` looks equivalent and is not: it matches
// nothing at all when the query starts or ends with punctuation — `\b(?:foo\(\))\b`
// can never match, because a word boundary after `)` demands a word character —
// and it treats `é` as a separator, so `café` would match inside `cafés`. Editors
// define a word by their separator list instead, which is what this does.
const SEPARATOR = new Uint8Array(128);
for (const ch of "`~!@#$%^&*()-=+[{]}\\|;:'\",.<>/? \t\n\r\f\v") SEPARATOR[ch.charCodeAt(0)] = 1;

function isWordChar(text: string, index: number): boolean {
  const code = text.charCodeAt(index);
  if (code < 128) return SEPARATOR[code] === 0;
  // Outside ASCII only whitespace separates: letters with accents, CJK and the
  // rest belong to the word they sit in.
  return !/\s/.test(text[index]);
}

// 1, or 2 when `index` is the start of a surrogate pair.
function codeUnitsAt(text: string, index: number): number {
  const high = text.charCodeAt(index);
  if (high < 0xd800 || high > 0xdbff) return 1;
  const low = text.charCodeAt(index + 1);
  return low >= 0xdc00 && low <= 0xdfff ? 2 : 1;
}

function isWholeWord(text: string, start: number, end: number): boolean {
  if (end === start) return true;
  if (start > 0 && isWordChar(text, start - 1) && isWordChar(text, start)) return false;
  if (end < text.length && isWordChar(text, end - 1) && isWordChar(text, end)) return false;
  return true;
}

// Builds the RegExp used for both searching and replacing. Whole-word is not part
// of it — `scan` applies that test to each candidate — so the two can never
// disagree about what counts as a match.
export function buildRegex(query: string, options: FindOptions = {}, global = true): RegExp {
  const source = options.regex ? query : escapeLiteral(query);

  let flags = global ? 'g' : '';
  if (!options.caseSensitive) flags += 'i';
  // Editors anchor ^ and $ per line, not per buffer, so regex mode is always
  // multiline. Literal mode escapes both characters, so the flag is a no-op there.
  if (options.regex) flags += 'm';

  return new RegExp(source, flags);
}

// The one pass over the buffer. Find and replace both go through it, so a match
// that is highlighted is exactly a match that gets replaced, and replacing does
// not run the pattern over the whole text a second time to find out where.
function scan(
  text: string,
  query: string,
  options: FindOptions,
  visit: (match: RegExpExecArray) => void
): void {
  const re = buildRegex(query, options, true);
  const budget = options.timeBudgetMs ?? DEFAULT_TIME_BUDGET_MS;
  const startedAt = Date.now();
  const wholeWord = !!options.wholeWord;

  let iterations = 0;
  let result: RegExpExecArray | null;

  while ((result = re.exec(text)) !== null) {
    const start = result.index;
    const end = start + result[0].length;

    // A candidate that fails the word test is skipped, not stopped on: the scan
    // carries on from the end of it, the way an editor's searcher does.
    if (!wholeWord || isWholeWord(text, start, end)) visit(result);

    // A zero-width match leaves lastIndex where it was, which would loop forever.
    // Stepping over it takes the whole character: nudging by one code unit lands
    // inside a surrogate pair and reports a third match in the middle of an emoji.
    if (end === start) re.lastIndex += codeUnitsAt(text, re.lastIndex);

    if (++iterations % TIME_CHECK_INTERVAL === 0 && Date.now() - startedAt >= budget) {
      throw new SearchTimeoutError();
    }
  }
}

export function findMatches(text: string, query: string, options: FindOptions = {}): Match[] {
  if (!query) return [];

  const matches: Match[] = [];
  scan(text, query, options, (m) => matches.push({ start: m.index, end: m.index + m[0].length }));
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

/**
 * Expands the `$` references in a replacement template — `$&`, `` $` ``, `$'`,
 * `$1`–`$99`, `$<name>`, `$$` — against one real match.
 *
 * This is what `String.prototype.replace` does internally, written out by hand
 * because the template has to be applied to a match found in the whole buffer.
 * Handing the pattern the matched text on its own instead is what makes a
 * lookaround silently replace nothing.
 */
function expandTemplate(template: string, match: RegExpExecArray, text: string): string {
  if (!template.includes('$')) return template;

  const captures = match.length - 1;
  let out = '';

  for (let i = 0; i < template.length; i++) {
    const char = template[i];

    // A trailing `$` has nothing to reference.
    if (char !== '$' || i === template.length - 1) {
      out += char;
      continue;
    }

    const next = template[i + 1];

    if (next === '$') { out += '$'; i += 1; continue; }
    if (next === '&') { out += match[0]; i += 1; continue; }
    if (next === '`') { out += text.slice(0, match.index); i += 1; continue; }
    if (next === "'") { out += text.slice(match.index + match[0].length); i += 1; continue; }

    // `$<name>` only means anything when the pattern has named groups; without
    // them it is three ordinary characters, exactly as the engine treats it.
    if (next === '<' && match.groups) {
      const close = template.indexOf('>', i + 2);
      if (close !== -1) {
        out += match.groups[template.slice(i + 2, close)] ?? '';
        i = close;
        continue;
      }
    }

    if (next >= '0' && next <= '9') {
      // Two digits win over one, but only if that group exists: with three groups
      // `$12` is group 1 followed by a literal 2.
      const two = template.slice(i + 1, i + 3);
      if (two.length === 2 && two[1] >= '0' && two[1] <= '9') {
        const both = parseInt(two, 10);
        if (both >= 1 && both <= captures) { out += match[both] ?? ''; i += 2; continue; }
      }
      const single = next.charCodeAt(0) - 48;
      if (single >= 1 && single <= captures) { out += match[single] ?? ''; i += 1; continue; }
    }

    // A `$` with nothing usable after it is a dollar sign.
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

  // In regex mode the replacement is an escape-aware template that may reference
  // groups from each match; resolving the escapes is per-replacement work, so it
  // happens once here rather than once per match. In literal mode the replacement
  // is spliced in exactly as typed — `$&` and `\n` have to survive untouched.
  const template = options.regex ? unescapeReplacement(replacement) : replacement;

  let out = '';
  let cursor = 0;
  let count = 0;

  scan(text, query, options, (m) => {
    out += text.slice(cursor, m.index);
    out += options.regex ? expandTemplate(template, m, text) : template;
    cursor = m.index + m[0].length;
    count += 1;
  });

  if (count === 0) return { text, count: 0 };
  return { text: out + text.slice(cursor), count };
}

// Re-runs the pattern at exactly the offset the match was found at, over the whole
// buffer, and hands back the engine's own match object. Sticky rather than a fresh
// search so it can only agree with what was highlighted, and against the whole
// text rather than the matched slice so a lookbehind, a lookahead or an anchor
// still sees what surrounds it.
function matchAt(text: string, match: Match, query: string, options: FindOptions): RegExpExecArray | null {
  const base = buildRegex(query, options, false);
  const sticky = new RegExp(base.source, base.flags + 'y');
  sticky.lastIndex = match.start;

  const found = sticky.exec(text);
  return found && found[0].length === match.end - match.start ? found : null;
}

/**
 * The literal text a single match should be replaced with. In regex mode the
 * replacement may reference that match's groups and use escape sequences; in
 * literal mode it is used exactly as typed. A match whose offsets no longer
 * describe the buffer expands to itself, so a stale replace is a no-op rather
 * than a corrupted edit.
 */
export function expandReplacement(
  text: string,
  match: Match,
  query: string,
  replacement: string,
  options: FindOptions = {}
): string {
  if (!options.regex) return replacement;

  const found = matchAt(text, match, query, options);
  if (!found) return text.slice(match.start, match.end);

  return expandTemplate(unescapeReplacement(replacement), found, text);
}

export function replaceMatch(
  text: string,
  match: Match,
  query: string,
  replacement: string,
  options: FindOptions = {}
): string {
  const expanded = expandReplacement(text, match, query, replacement, options);
  return text.slice(0, match.start) + expanded + text.slice(match.end);
}
