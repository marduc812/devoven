/**
 * Character-set modelling over a regexpp AST.
 *
 * Everything ReDoS detection needs reduces to one question: can these two
 * repeated constructs consume the same character? Answering it requires knowing
 * the set of characters each construct can begin with, and whether those sets
 * intersect.
 *
 * Constructs that cannot be modelled return 'unknown' rather than a guess. The
 * caller must then decline to report, never assume.
 */

import type { Node } from '@eslint-community/regexpp/ast';

export interface AnalysisFlags {
  ignoreCase: boolean;
  dotAll: boolean;
}

export interface Range {
  min: number;
  max: number;
}

/** A sorted, merged, non-overlapping set of code point ranges. */
export type CharSet = Range[];

export type MaybeCharSet = CharSet | 'unknown';

const MAX_CODE_POINT = 0x10ffff;

/** Sort and merge ranges so set operations can assume a canonical form. */
function normalize(ranges: Range[]): CharSet {
  if (ranges.length === 0) return [];
  const sorted = [...ranges].sort((a, b) => a.min - b.min);
  const merged: Range[] = [{ ...sorted[0] }];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const next = sorted[i];
    // Adjacent ranges merge too: [a-c] and [d-f] are one run.
    if (next.min <= last.max + 1) {
      last.max = Math.max(last.max, next.max);
    } else {
      merged.push({ ...next });
    }
  }
  return merged;
}

const of = (min: number, max: number = min): CharSet => [{ min, max }];

export function union(a: CharSet, b: CharSet): CharSet {
  return normalize([...a, ...b]);
}

export function intersect(a: CharSet, b: CharSet): CharSet {
  const out: Range[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    const min = Math.max(a[i].min, b[j].min);
    const max = Math.min(a[i].max, b[j].max);
    if (min <= max) out.push({ min, max });
    if (a[i].max < b[j].max) i++;
    else j++;
  }
  return out;
}

export function negate(set: CharSet): CharSet {
  const out: Range[] = [];
  let cursor = 0;
  for (const range of set) {
    if (range.min > cursor) out.push({ min: cursor, max: range.min - 1 });
    cursor = Math.max(cursor, range.max + 1);
  }
  if (cursor <= MAX_CODE_POINT) out.push({ min: cursor, max: MAX_CODE_POINT });
  return out;
}

export function isEmpty(set: CharSet): boolean {
  return set.length === 0;
}

export function hasChar(set: CharSet, ch: string): boolean {
  const cp = ch.codePointAt(0);
  if (cp === undefined) return false;
  return set.some(r => cp >= r.min && cp <= r.max);
}

const DIGIT = of(0x30, 0x39);
const WORD = normalize([{ min: 0x30, max: 0x39 }, { min: 0x41, max: 0x5a }, { min: 0x5f, max: 0x5f }, { min: 0x61, max: 0x7a }]);
const SPACE = normalize([
  { min: 0x09, max: 0x0d }, { min: 0x20, max: 0x20 }, { min: 0xa0, max: 0xa0 },
  { min: 0x1680, max: 0x1680 }, { min: 0x2000, max: 0x200a }, { min: 0x2028, max: 0x2029 },
  { min: 0x202f, max: 0x202f }, { min: 0x205f, max: 0x205f }, { min: 0x3000, max: 0x3000 },
  { min: 0xfeff, max: 0xfeff },
]);
/** Characters `.` never matches without the s flag. */
const LINE_TERMINATORS = normalize([{ min: 0x0a, max: 0x0a }, { min: 0x0d, max: 0x0d }, { min: 0x2028, max: 0x2029 }]);
const ANY = of(0, MAX_CODE_POINT);

/**
 * Add case-swapped counterparts for the i flag.
 *
 * Folding is exhaustive only for small ranges; larger ones fold their Latin
 * portion. Erring toward a slightly *larger* set is the safe direction: it can
 * only propose an extra attack candidate, and every candidate must survive the
 * benchmark before it is reported.
 */
function foldCase(set: CharSet): CharSet {
  const extra: Range[] = [];
  for (const range of set) {
    const hi = range.max - range.min > 256 ? Math.min(range.max, 0x24f) : range.max;
    for (let cp = range.min; cp <= hi; cp++) {
      const ch = String.fromCodePoint(cp);
      for (const variant of [ch.toUpperCase(), ch.toLowerCase()]) {
        if (variant.length === 1 && variant !== ch) {
          const code = variant.codePointAt(0)!;
          extra.push({ min: code, max: code });
        }
      }
    }
  }
  return extra.length === 0 ? set : union(set, normalize(extra));
}

/** True for constructs that consume no input, so a scan must look past them. */
function isZeroWidth(node: Node): boolean {
  return node.type === 'Assertion';
}

function characterSetOf(node: Extract<Node, { type: 'CharacterSet' }>, flags: AnalysisFlags): MaybeCharSet {
  switch (node.kind) {
    case 'digit':
      return node.negate ? negate(DIGIT) : DIGIT;
    case 'word':
      return node.negate ? negate(WORD) : WORD;
    case 'space':
      return node.negate ? negate(SPACE) : SPACE;
    case 'any':
      return flags.dotAll ? ANY : negate(LINE_TERMINATORS);
    default:
      // Unicode property escapes need the full property database to model.
      return 'unknown';
  }
}

/** Union the leading character sets of an alternative, looking past nullable elements. */
function firstCharsOfSequence(elements: readonly Node[], flags: AnalysisFlags): MaybeCharSet {
  let acc: CharSet = [];
  for (const element of elements) {
    if (isZeroWidth(element)) continue;
    const set = firstChars(element, flags);
    if (set === 'unknown') return 'unknown';
    acc = union(acc, set);
    if (!canMatchEmpty(element)) break;
  }
  return acc;
}

/** The set of characters a match of this node can begin with. */
export function firstChars(node: Node, flags: AnalysisFlags): MaybeCharSet {
  switch (node.type) {
    case 'Character': {
      const set = of(node.value);
      return flags.ignoreCase ? foldCase(set) : set;
    }
    case 'CharacterSet':
      return characterSetOf(node, flags);
    case 'CharacterClassRange': {
      const set = of(node.min.value, node.max.value);
      return flags.ignoreCase ? foldCase(set) : set;
    }
    case 'CharacterClass': {
      let acc: CharSet = [];
      for (const element of node.elements) {
        const set = firstChars(element, flags);
        if (set === 'unknown') return 'unknown';
        acc = union(acc, set);
      }
      return node.negate ? negate(acc) : acc;
    }
    case 'Quantifier':
      return firstChars(node.element, flags);
    case 'Group':
    case 'CapturingGroup': {
      let acc: CharSet = [];
      for (const alternative of node.alternatives) {
        const set = firstCharsOfSequence(alternative.elements, flags);
        if (set === 'unknown') return 'unknown';
        acc = union(acc, set);
      }
      return acc;
    }
    case 'Alternative':
      return firstCharsOfSequence(node.elements, flags);
    case 'Assertion':
      return [];
    default:
      // Backreferences, v-mode class expressions, class string disjunctions.
      return 'unknown';
  }
}

/** True when the node can match the empty string. */
export function canMatchEmpty(node: Node): boolean {
  switch (node.type) {
    case 'Character':
    case 'CharacterSet':
    case 'CharacterClass':
    case 'CharacterClassRange':
      return false;
    case 'Quantifier':
      return node.min === 0 || canMatchEmpty(node.element);
    case 'Group':
    case 'CapturingGroup':
      return node.alternatives.some(alt => canMatchEmpty(alt));
    case 'Alternative':
      return node.elements.every(el => canMatchEmpty(el));
    case 'Assertion':
      return true;
    default:
      // A backreference to an unmatched group matches empty.
      return true;
  }
}

/** Readable characters preferred when any member of a set would do. */
const PREFERRED = ['a', '0', ' ', '_'];

function pickFrom(set: CharSet): string | null {
  if (isEmpty(set)) return null;
  for (const ch of PREFERRED) {
    if (hasChar(set, ch)) return ch;
  }
  return String.fromCodePoint(set[0].min);
}

/**
 * The shortest string this node can match, preferring readable characters so
 * generated attack strings stay legible in the UI.
 */
export function shortestMatch(node: Node, flags: AnalysisFlags): string | 'unknown' {
  switch (node.type) {
    case 'Character':
      return String.fromCodePoint(node.value);
    case 'CharacterSet':
    case 'CharacterClass':
    case 'CharacterClassRange': {
      const set = firstChars(node, flags);
      if (set === 'unknown') return 'unknown';
      const picked = pickFrom(set);
      return picked === null ? 'unknown' : picked;
    }
    case 'Quantifier': {
      if (node.min === 0) return '';
      const body = shortestMatch(node.element, flags);
      return body === 'unknown' ? 'unknown' : body.repeat(node.min);
    }
    case 'Group':
    case 'CapturingGroup': {
      let best: string | null = null;
      for (const alternative of node.alternatives) {
        const candidate = shortestMatch(alternative, flags);
        if (candidate === 'unknown') continue;
        if (best === null || candidate.length < best.length) best = candidate;
      }
      return best === null ? 'unknown' : best;
    }
    case 'Alternative': {
      let out = '';
      for (const element of node.elements) {
        const part = shortestMatch(element, flags);
        if (part === 'unknown') return 'unknown';
        out += part;
      }
      return out;
    }
    case 'Assertion':
      return '';
    default:
      return 'unknown';
  }
}

/**
 * A character the set does not contain, used to build a suffix that forces the
 * engine to fail and backtrack. Null when the set covers every code point.
 */
export function charOutside(set: CharSet): string | null {
  return pickFrom(negate(set));
}
