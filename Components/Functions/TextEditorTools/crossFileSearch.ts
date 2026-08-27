// Searching several open buffers at once.
//
// Matches from every file are treated as one flat list, so stepping to the next
// match is `(index + 1) % total` no matter how many file boundaries that crosses.
// `locate` and `flatIndexOf` convert between that flat index and a (file, match)
// pair. Pure, like logic.ts — no React, no DOM.

import { findMatches, SearchTimeoutError, type FindOptions, type Match } from './logic';

export type SearchFile = { id: string; text: string };

export type FileMatches = { id: string; matches: Match[]; error: string | null };

export type Located = { id: string; matchIndex: number; match: Match };

/**
 * One file's matches, with the failure modes turned into a message instead of a
 * throw. A pattern that is invalid, or too slow for this particular file, must not
 * take the other files' results down with it.
 */
export function searchFile(text: string, query: string, options: FindOptions = {}): FileMatches['matches'] | string {
  if (!query) return [];
  try {
    return findMatches(text, query, options);
  } catch (error) {
    if (error instanceof SearchTimeoutError) return error.message;
    if (error instanceof SyntaxError) return 'Invalid regular expression.';
    return 'Search failed.';
  }
}

/** One file's result in the shape the flat-index helpers expect. */
export function searchOne(file: SearchFile, query: string, options: FindOptions = {}): FileMatches {
  const result = searchFile(file.text, query, options);
  return typeof result === 'string'
    ? { id: file.id, matches: [], error: result }
    : { id: file.id, matches: result, error: null };
}

export function findAcross(files: SearchFile[], query: string, options: FindOptions = {}): FileMatches[] {
  return files.map((file) => searchOne(file, query, options));
}

export function totalCount(results: FileMatches[]): number {
  return results.reduce((sum, file) => sum + file.matches.length, 0);
}

/** How many files contributed at least one match — drives the "· 3 files" suffix. */
export function fileCount(results: FileMatches[]): number {
  return results.reduce((count, file) => count + (file.matches.length > 0 ? 1 : 0), 0);
}

export function matchesFor(results: FileMatches[], id: string): Match[] {
  return results.find((file) => file.id === id)?.matches ?? [];
}

/**
 * The text every match covers, in the same order stepping visits them, with
 * duplicates intact — a column of values pulled out of the buffers, which is what
 * the clipboard wants. `files` must be the text the results were computed from:
 * offsets read against anything else would slice the wrong characters.
 */
export function collectText(results: FileMatches[], files: SearchFile[]): string[] {
  const sources = new Map(files.map((file) => [file.id, file.text]));
  const collected: string[] = [];

  for (const file of results) {
    const text = sources.get(file.id);
    if (text === undefined) continue;
    for (const match of file.matches) collected.push(text.slice(match.start, match.end));
  }
  return collected;
}

/** The first error any file reported, so the find bar can surface one message. */
export function firstError(results: FileMatches[]): string | null {
  return results.find((file) => file.error)?.error ?? null;
}

/** Flat index → the file and the match within it. Files with no matches are skipped. */
export function locate(results: FileMatches[], flatIndex: number): Located | null {
  if (flatIndex < 0) return null;

  let remaining = flatIndex;
  for (const file of results) {
    if (remaining < file.matches.length) {
      return { id: file.id, matchIndex: remaining, match: file.matches[remaining] };
    }
    remaining -= file.matches.length;
  }
  return null;
}

/** The inverse of `locate`. Returns -1 when that file or match is not in the results. */
export function flatIndexOf(results: FileMatches[], id: string, matchIndex: number): number {
  let offset = 0;
  for (const file of results) {
    if (file.id === id) {
      return matchIndex >= 0 && matchIndex < file.matches.length ? offset + matchIndex : -1;
    }
    offset += file.matches.length;
  }
  return -1;
}

/**
 * Steps `delta` matches from `flatIndex`, wrapping around the end of the whole set.
 * A `flatIndex` of -1 means "no match selected yet" — stepping forward from there
 * lands on the first match, stepping back lands on the last.
 */
export function step(results: FileMatches[], flatIndex: number, delta: number): number {
  const total = totalCount(results);
  if (total === 0) return -1;
  if (flatIndex < 0) return delta > 0 ? 0 : total - 1;
  return (((flatIndex + delta) % total) + total) % total;
}
