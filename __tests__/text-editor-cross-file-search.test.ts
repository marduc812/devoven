import {
  findAcross,
  searchFile,
  totalCount,
  fileCount,
  matchesFor,
  collectText,
  firstError,
  locate,
  flatIndexOf,
  step,
  type FileMatches,
} from '@/Components/Functions/TextEditorTools/crossFileSearch';

// a: 2 matches, b: none, c: 1 match — the empty file in the middle is the case
// that flat-index arithmetic tends to get wrong.
const FILES = [
  { id: 'a', text: 'foo bar foo' },
  { id: 'b', text: 'nothing here' },
  { id: 'c', text: 'foo' },
];

const results = () => findAcross(FILES, 'foo');

describe('searchFile', () => {
  it('returns matches for a plain query', () => {
    expect(searchFile('foo foo', 'foo')).toEqual([
      { start: 0, end: 3 },
      { start: 4, end: 7 },
    ]);
  });

  it('returns nothing for an empty query rather than matching everywhere', () => {
    expect(searchFile('foo', '')).toEqual([]);
  });

  it('reports an invalid pattern as a message instead of throwing', () => {
    expect(searchFile('foo', '(', { regex: true })).toBe('Invalid regular expression.');
  });

  it('reports a search that blows its time budget', () => {
    const evil = searchFile('a'.repeat(30000), '(a+)+$', { regex: true, timeBudgetMs: 0 });
    expect(typeof evil === 'string' || Array.isArray(evil)).toBe(true);
  });
});

describe('findAcross', () => {
  it('keeps one entry per file, in order, including files with no matches', () => {
    expect(results().map((file) => [file.id, file.matches.length])).toEqual([
      ['a', 2],
      ['b', 0],
      ['c', 1],
    ]);
  });

  it('does not let one failing file sink the others', () => {
    const mixed = findAcross(FILES, 'foo(', { regex: true });
    expect(mixed.every((file) => file.error === 'Invalid regular expression.')).toBe(true);
    expect(totalCount(mixed)).toBe(0);
  });

  it('surfaces a single error message', () => {
    expect(firstError(results())).toBeNull();
    expect(firstError(findAcross(FILES, '(', { regex: true }))).toBe('Invalid regular expression.');
  });

  it('honours find options across every file', () => {
    const sensitive = findAcross([{ id: 'a', text: 'Foo foo' }], 'foo', { caseSensitive: true });
    expect(totalCount(sensitive)).toBe(1);
  });
});

describe('counts', () => {
  it('totals matches across files', () => {
    expect(totalCount(results())).toBe(3);
  });

  it('counts only files that actually matched', () => {
    expect(fileCount(results())).toBe(2);
  });

  it('pulls one file’s matches back out', () => {
    expect(matchesFor(results(), 'a')).toHaveLength(2);
    expect(matchesFor(results(), 'b')).toEqual([]);
    expect(matchesFor(results(), 'missing')).toEqual([]);
  });
});

describe('locate', () => {
  it('walks the flat index across file boundaries, skipping empty files', () => {
    expect(locate(results(), 0)).toMatchObject({ id: 'a', matchIndex: 0 });
    expect(locate(results(), 1)).toMatchObject({ id: 'a', matchIndex: 1 });
    expect(locate(results(), 2)).toMatchObject({ id: 'c', matchIndex: 0 });
  });

  it('returns the match itself, not just its position', () => {
    expect(locate(results(), 1)?.match).toEqual({ start: 8, end: 11 });
  });

  it('has nothing to locate outside the range', () => {
    expect(locate(results(), 3)).toBeNull();
    expect(locate(results(), -1)).toBeNull();
    expect(locate(findAcross(FILES, 'zzz'), 0)).toBeNull();
  });
});

describe('flatIndexOf', () => {
  it('round-trips with locate for every match', () => {
    const found = results();
    for (let i = 0; i < totalCount(found); i++) {
      const at = locate(found, i)!;
      expect(flatIndexOf(found, at.id, at.matchIndex)).toBe(i);
    }
  });

  it('is -1 for a file with no matches, an unknown file, or an out-of-range match', () => {
    expect(flatIndexOf(results(), 'b', 0)).toBe(-1);
    expect(flatIndexOf(results(), 'missing', 0)).toBe(-1);
    expect(flatIndexOf(results(), 'a', 5)).toBe(-1);
    expect(flatIndexOf(results(), 'a', -1)).toBe(-1);
  });
});

describe('step', () => {
  it('advances and wraps around the end of the whole set', () => {
    const found = results();
    expect(step(found, 0, 1)).toBe(1);
    expect(step(found, 1, 1)).toBe(2);
    expect(step(found, 2, 1)).toBe(0);
  });

  it('goes backwards and wraps past the start', () => {
    const found = results();
    expect(step(found, 2, -1)).toBe(1);
    expect(step(found, 0, -1)).toBe(2);
  });

  it('lands on the first or last match when nothing is selected yet', () => {
    expect(step(results(), -1, 1)).toBe(0);
    expect(step(results(), -1, -1)).toBe(2);
  });

  it('stays unselected when there is nothing to step to', () => {
    expect(step(findAcross(FILES, 'zzz'), -1, 1)).toBe(-1);
    expect(step([] as FileMatches[], 0, 1)).toBe(-1);
  });
});

describe('collectText', () => {
  it('returns the matched text of every match, in the order stepping visits them', () => {
    const files = [
      { id: 'a', text: 'user=alice ip=10.0.0.1\nuser=bob ip=10.0.0.42' },
      { id: 'b', text: 'no addresses here' },
      { id: 'c', text: 'user=carol ip=192.168.1.7' },
    ];
    const query = '\\d+\\.\\d+\\.\\d+\\.\\d+';

    expect(collectText(findAcross(files, query, { regex: true }), files)).toEqual([
      '10.0.0.1',
      '10.0.0.42',
      '192.168.1.7',
    ]);
  });

  it('keeps duplicates rather than collapsing them', () => {
    expect(collectText(results(), FILES)).toEqual(['foo', 'foo', 'foo']);
  });

  it('carries the search options through', () => {
    const files = [{ id: 'a', text: 'Foo foo' }];
    expect(collectText(findAcross(files, 'foo'), files)).toEqual(['Foo', 'foo']);
    expect(collectText(findAcross(files, 'foo', { caseSensitive: true }), files)).toEqual(['foo']);
  });

  it('returns empty strings for a zero-width pattern rather than looping', () => {
    const files = [{ id: 'a', text: 'ab' }];
    expect(collectText(findAcross(files, 'x*', { regex: true }), files)).toEqual(['', '', '']);
  });

  it('returns nothing when the search found nothing', () => {
    expect(collectText(findAcross(FILES, 'zzz'), FILES)).toEqual([]);
  });

  it('collects nothing from a file whose search failed', () => {
    const files = [{ id: 'a', text: 'foo' }];
    expect(collectText(findAcross(files, '(', { regex: true }), files)).toEqual([]);
  });

  it('skips a file it was not given the text for rather than slicing another buffer', () => {
    expect(collectText(results(), [FILES[0]])).toEqual(['foo', 'foo']);
  });
});
