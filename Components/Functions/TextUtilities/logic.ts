// All functions are pure (no React, no browser APIs).
// Used by text-utilities React components and tested directly in Jest.

// ─── Lorem ipsum data bank ────────────────────────────────────────────────────

const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
  'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
];

const LOREM_PARAGRAPHS = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
  'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.',
  'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.',
];

// ─── Case conversion ──────────────────────────────────────────────────────────

export function toUpperCase(s: string): string {
  return s.toUpperCase();
}

export function toLowerCase(s: string): string {
  return s.toLowerCase();
}

export function toTitleCase(s: string): string {
  if (!s) return '';
  return s.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

export function toCamelCase(s: string): string {
  if (!s) return '';
  const words = s.trim().split(/[\s_\-]+/).filter(Boolean);
  return words
    .map((word, i) =>
      i === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join('');
}

export function toSnakeCase(s: string): string {
  if (!s) return '';
  return s
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[\s\-]+/)
    .filter(Boolean)
    .join('_')
    .toLowerCase();
}

export function toKebabCase(s: string): string {
  if (!s) return '';
  return s
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[\s_]+/)
    .filter(Boolean)
    .join('-')
    .toLowerCase();
}

export function toPascalCase(s: string): string {
  if (!s) return '';
  const words = s.trim().split(/[\s_\-]+/).filter(Boolean);
  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

export function convertCase(s: string, caseType: string): string {
  switch (caseType) {
    case 'upper':   return toUpperCase(s);
    case 'lower':   return toLowerCase(s);
    case 'title':   return toTitleCase(s);
    case 'camel':   return toCamelCase(s);
    case 'snake':   return toSnakeCase(s);
    case 'kebab':   return toKebabCase(s);
    case 'pascal':  return toPascalCase(s);
    default:        return s;
  }
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export function countWords(s: string): number {
  if (!s.trim()) return 0;
  return s.trim().split(/\s+/).filter(Boolean).length;
}

export function countChars(s: string): number {
  return s.length;
}

export function countCharsNoSpaces(s: string): number {
  return s.replace(/\s/g, '').length;
}

export function countLines(s: string): number {
  if (!s) return 0;
  return s.split('\n').length;
}

export function countSentences(s: string): number {
  if (!s.trim()) return 0;
  const terminated = s.match(/[^.!?]*[.!?]+/g) ?? [];
  // Text that runs out before its terminator is still a sentence: "Hi. And so"
  // is two, not one.
  const tail = s.slice(terminated.join('').length);
  return terminated.length + (tail.trim() === '' ? 0 : 1);
}

/** Lines with something on them; blank and whitespace-only lines don't count. */
export function countNonEmptyLines(s: string): number {
  if (!s) return 0;
  return s.split(/\r\n|\r|\n/).filter((line) => line.trim() !== '').length;
}

/**
 * Blocks of text separated by one or more blank lines. A run of blank lines is
 * a single break, and a document with no blank line in it is one paragraph.
 */
export function countParagraphs(s: string): number {
  if (!s.trim()) return 0;
  return s
    .replace(/\r\n?/g, '\n')
    .split(/\n[ \t]*\n/)
    .filter((block) => block.trim() !== '').length;
}

/**
 * Distinct words, ignoring case and the punctuation hanging off either end, so
 * `cat`, `Cat,` and `(cat)` are one word but `don't` and `dont` are two.
 */
export function countUniqueWords(s: string): number {
  if (!s.trim()) return 0;
  const words = s
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''))
    .filter(Boolean);
  return new Set(words).size;
}

export const COUNT_UNITS = [
  'words',
  'chars',
  'chars-no-spaces',
  'lines',
  'non-empty-lines',
  'paragraphs',
  'sentences',
  'unique-words',
  'bytes',
] as const;

export type CountUnit = (typeof COUNT_UNITS)[number];

/**
 * One entry point for every way of measuring a piece of text. Characters are
 * counted by code point, so an emoji is one character and not two.
 */
export function countUnit(s: string, unit: string): number {
  switch (unit) {
    case 'words': return countWords(s);
    case 'chars': return Array.from(s).length;
    case 'chars-no-spaces': return countCharsNoSpaces(s);
    case 'lines': return countLines(s);
    case 'non-empty-lines': return countNonEmptyLines(s);
    case 'paragraphs': return countParagraphs(s);
    case 'sentences': return countSentences(s);
    case 'unique-words': return countUniqueWords(s);
    case 'bytes': return new TextEncoder().encode(s).length;
    default: throw new Error(`Unknown unit "${unit}"`);
  }
}

// ─── Lorem ipsum ─────────────────────────────────────────────────────────────

export function generateLoremIpsum(paragraphs: number): string {
  if (paragraphs <= 0) return '';
  const result: string[] = [];
  for (let i = 0; i < paragraphs; i++) {
    result.push(LOREM_PARAGRAPHS[i % LOREM_PARAGRAPHS.length]);
  }
  return result.join('\n\n');
}

export function generateLoremWords(count: number): string {
  if (count <= 0) return '';
  const words: string[] = [];
  for (let i = 0; i < count; i++) {
    words.push(LOREM_WORDS[i % LOREM_WORDS.length]);
  }
  return words.join(' ');
}

// ─── Dedup / Sort / Reverse ───────────────────────────────────────────────────

export function removeDuplicateLines(s: string): string {
  if (!s) return '';
  const lines = s.split('\n');
  const seen = new Set<string>();
  return lines.filter((line) => {
    if (seen.has(line)) return false;
    seen.add(line);
    return true;
  }).join('\n');
}

export function sortLinesAsc(s: string): string {
  if (!s) return '';
  return s.split('\n').sort((a, b) => a.localeCompare(b)).join('\n');
}

export function sortLinesDesc(s: string): string {
  if (!s) return '';
  return s.split('\n').sort((a, b) => b.localeCompare(a)).join('\n');
}

export function reverseString(s: string): string {
  return s.split('').reverse().join('');
}

export function reverseLines(s: string): string {
  if (!s) return '';
  return s.split('\n').reverse().join('\n');
}

// ─── Slug / Whitespace ────────────────────────────────────────────────────────

export function toSlug(s: string): string {
  if (!s) return '';
  return s
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function trimLines(s: string): string {
  if (!s) return '';
  return s.split('\n').map((line) => line.trim()).join('\n');
}

export function collapseSpaces(s: string): string {
  if (!s) return '';
  return s.replace(/[^\S\n]+/g, ' ');
}

export function removeBlankLines(s: string): string {
  if (!s) return '';
  return s.split('\n').filter((line) => line.trim() !== '').join('\n');
}

// ─── Regex find & replace ────────────────────────────────────────────────────

export function regexFindReplace(
  text: string,
  pattern: string,
  flags: string,
  replacement: string,
): string {
  if (!text) return '';
  if (!pattern) return text;
  const regex = new RegExp(pattern, flags);
  return text.replace(regex, replacement);
}

// ─── Text repeater ───────────────────────────────────────────────────────────

export function repeatText(text: string, times: number, separator: string): string {
  if (!text || times <= 0) return '';
  const arr: string[] = [];
  for (let i = 0; i < times; i++) arr.push(text);
  return arr.join(separator);
}

// ─── Diff stats helper ────────────────────────────────────────────────────────

export function formatDiffStats(added: number, removed: number): string {
  const parts: string[] = [];
  if (added > 0) parts.push(`+${added} line${added !== 1 ? 's' : ''}`);
  if (removed > 0) parts.push(`-${removed} line${removed !== 1 ? 's' : ''}`);
  if (parts.length === 0) return 'No differences';
  return parts.join(', ');
}
