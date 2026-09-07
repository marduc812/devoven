// Set operations over two lists.
//
// Array Operations reshapes one list; this one relates two. Everything is
// treated as a set, so each list is deduplicated before the operation runs and
// the counts below say how many duplicates that cost. Order is never sorted
// unless asked for: items come out in the order they were first seen, because a
// list of hostnames or ids is usually already in a meaningful order.

export type SetOperation =
  | 'union'
  | 'intersection'
  | 'difference'
  | 'reverse-difference'
  | 'symmetric-difference';

export const SET_OPERATIONS: SetOperation[] = [
  'union',
  'intersection',
  'difference',
  'reverse-difference',
  'symmetric-difference',
];

export const operationLabel: Record<SetOperation, string> = {
  union: 'Union',
  intersection: 'Intersection',
  difference: 'Difference (A minus B)',
  'reverse-difference': 'Difference (B minus A)',
  'symmetric-difference': 'Symmetric difference',
};

export const operationSymbol: Record<SetOperation, string> = {
  union: 'A ∪ B',
  intersection: 'A ∩ B',
  difference: 'A \\ B',
  'reverse-difference': 'B \\ A',
  'symmetric-difference': 'A △ B',
};

export const operationHint: Record<SetOperation, string> = {
  union: 'Everything in either list, each item once.',
  intersection: 'Only the items that appear in both lists.',
  difference: 'Items in A that are not in B.',
  'reverse-difference': 'Items in B that are not in A.',
  'symmetric-difference': 'Items in one list or the other, but not in both.',
};

export type Separator = 'line' | 'comma' | 'space' | 'semicolon' | 'tab';

export const SEPARATORS: Separator[] = ['line', 'comma', 'space', 'semicolon', 'tab'];

export const separatorLabel: Record<Separator, string> = {
  line: 'One per line',
  comma: 'Comma separated',
  space: 'Space separated',
  semicolon: 'Semicolon separated',
  tab: 'Tab separated',
};

const SPLIT_PATTERN: Record<Separator, RegExp> = {
  line: /\r?\n/,
  comma: /,/,
  space: /[ \t]+/,
  semicolon: /;/,
  tab: /\t/,
};

const JOIN_WITH: Record<Separator, string> = {
  line: '\n',
  comma: ', ',
  space: ' ',
  semicolon: '; ',
  tab: '\t',
};

export interface SetOptions {
  /** Off means A and a differ. Defaults to on. */
  caseSensitive?: boolean;
  /** Trim whitespace around each item. Defaults to on. */
  trim?: boolean;
  /** Sort the result instead of keeping first-seen order. Defaults to off. */
  sort?: boolean;
  /** How the input is split and the output joined. Defaults to one per line. */
  separator?: Separator;
}

export interface SetCounts {
  /** Distinct items in each list. */
  a: number;
  b: number;
  /** Distinct items in the result. */
  result: number;
  onlyA: number;
  onlyB: number;
  both: number;
  /** Repeats that were folded away when each list became a set. */
  duplicatesA: number;
  duplicatesB: number;
}

export interface SetResult {
  items: string[];
  joined: string;
  counts: SetCounts;
  /** Overlap as |A ∩ B| / |A ∪ B|, 0 when both lists are empty. */
  jaccard: number;
}

export function splitItems(input: string, options: SetOptions = {}): string[] {
  const separator = options.separator ?? 'line';
  const trim = options.trim ?? true;
  return input
    .split(SPLIT_PATTERN[separator])
    .map((item) => (trim ? item.trim() : item))
    .filter((item) => item !== '');
}

export function joinItems(items: string[], separator: Separator = 'line'): string {
  return items.join(JOIN_WITH[separator]);
}

/** The value two items are compared by, which is the item itself unless case is being ignored. */
const keyOf = (item: string, caseSensitive: boolean): string =>
  caseSensitive ? item : item.toLowerCase();

/** First-seen items, in order, plus how many repeats were dropped. */
function dedupe(items: string[], caseSensitive: boolean): { unique: string[]; duplicates: number } {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const item of items) {
    const key = keyOf(item, caseSensitive);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  return { unique, duplicates: items.length - unique.length };
}

export function applySetOperation(
  listA: string,
  listB: string,
  operation: SetOperation,
  options: SetOptions = {},
): SetResult {
  const caseSensitive = options.caseSensitive ?? true;
  const separator = options.separator ?? 'line';

  const a = dedupe(splitItems(listA, options), caseSensitive);
  const b = dedupe(splitItems(listB, options), caseSensitive);

  const inA = new Set(a.unique.map((item) => keyOf(item, caseSensitive)));
  const inB = new Set(b.unique.map((item) => keyOf(item, caseSensitive)));

  const onlyA = a.unique.filter((item) => !inB.has(keyOf(item, caseSensitive)));
  const onlyB = b.unique.filter((item) => !inA.has(keyOf(item, caseSensitive)));
  // Taken from A, so an item that differs only in case reads the way A wrote it.
  const both = a.unique.filter((item) => inB.has(keyOf(item, caseSensitive)));

  let items: string[];
  switch (operation) {
    case 'union':
      items = [...a.unique, ...onlyB];
      break;
    case 'intersection':
      items = both;
      break;
    case 'difference':
      items = onlyA;
      break;
    case 'reverse-difference':
      items = onlyB;
      break;
    case 'symmetric-difference':
      items = [...onlyA, ...onlyB];
      break;
  }

  if (options.sort) items = [...items].sort((x, y) => x.localeCompare(y));

  const unionSize = a.unique.length + onlyB.length;

  return {
    items,
    joined: joinItems(items, separator),
    counts: {
      a: a.unique.length,
      b: b.unique.length,
      result: items.length,
      onlyA: onlyA.length,
      onlyB: onlyB.length,
      both: both.length,
      duplicatesA: a.duplicates,
      duplicatesB: b.duplicates,
    },
    jaccard: unionSize === 0 ? 0 : both.length / unionSize,
  };
}

export function isSetOperation(value: string | null | undefined): value is SetOperation {
  return !!value && (SET_OPERATIONS as string[]).includes(value);
}

export function isSeparator(value: string | null | undefined): value is Separator {
  return !!value && (SEPARATORS as string[]).includes(value);
}
