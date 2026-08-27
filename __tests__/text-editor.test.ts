import {
  dedupeLines,
  sortLines,
  reverseLines,
  trimTrailingWhitespace,
  removeEmptyLines,
  findMatches,
  replaceAll,
  replaceMatch,
  expandReplacement,
  unescapeReplacement,
  SearchTimeoutError,
} from '@/Components/Functions/TextEditorTools/logic';

describe('dedupeLines', () => {
  it('keeps the first occurrence and preserves order', () => {
    expect(dedupeLines('b\na\nb\nc\na')).toBe('b\na\nc');
  });

  it('is case-sensitive by default', () => {
    expect(dedupeLines('Foo\nfoo')).toBe('Foo\nfoo');
  });

  it('collapses case variants when caseInsensitive is set', () => {
    expect(dedupeLines('Foo\nfoo\nFOO', { caseInsensitive: true })).toBe('Foo');
  });

  it('treats surrounding whitespace as significant by default', () => {
    expect(dedupeLines('foo\n  foo')).toBe('foo\n  foo');
  });

  it('ignores surrounding whitespace when trim is set', () => {
    expect(dedupeLines('foo\n  foo  ', { trim: true })).toBe('foo');
  });

  it('collapses only neighbouring runs in adjacentOnly mode', () => {
    expect(dedupeLines('a\na\nb\na', { adjacentOnly: true })).toBe('a\nb\na');
  });

  it('combines caseInsensitive with adjacentOnly', () => {
    expect(dedupeLines('a\nA\nb\nA', { adjacentOnly: true, caseInsensitive: true })).toBe('a\nb\nA');
  });

  it('preserves CRLF line endings', () => {
    expect(dedupeLines('a\r\nb\r\na')).toBe('a\r\nb');
  });

  it('preserves a trailing newline', () => {
    expect(dedupeLines('a\nb\na\n')).toBe('a\nb\n');
  });

  it('returns empty input unchanged', () => {
    expect(dedupeLines('')).toBe('');
  });
});

describe('sortLines', () => {
  it('sorts ascending', () => {
    expect(sortLines('banana\napple\ncherry', 'asc')).toBe('apple\nbanana\ncherry');
  });

  it('sorts descending', () => {
    expect(sortLines('banana\napple\ncherry', 'desc')).toBe('cherry\nbanana\napple');
  });

  it('sorts lexically by default, so file10 precedes file9', () => {
    expect(sortLines('file9\nfile10', 'asc')).toBe('file10\nfile9');
  });

  it('sorts numerically within strings when natural is set', () => {
    expect(sortLines('file9\nfile10', 'asc', true)).toBe('file9\nfile10');
  });

  it('preserves CRLF line endings', () => {
    expect(sortLines('b\r\na', 'asc')).toBe('a\r\nb');
  });

  it('preserves a trailing newline', () => {
    expect(sortLines('b\na\n', 'asc')).toBe('a\nb\n');
  });
});

describe('reverseLines', () => {
  it('reverses line order', () => {
    expect(reverseLines('a\nb\nc')).toBe('c\nb\na');
  });

  it('preserves a trailing newline', () => {
    expect(reverseLines('a\nb\n')).toBe('b\na\n');
  });
});

describe('trimTrailingWhitespace', () => {
  it('strips trailing spaces and tabs from each line', () => {
    expect(trimTrailingWhitespace('a  \nb\t\nc')).toBe('a\nb\nc');
  });

  it('leaves leading indentation alone', () => {
    expect(trimTrailingWhitespace('    a   ')).toBe('    a');
  });

  it('preserves CRLF line endings', () => {
    expect(trimTrailingWhitespace('a  \r\nb')).toBe('a\r\nb');
  });
});

describe('removeEmptyLines', () => {
  it('drops blank lines', () => {
    expect(removeEmptyLines('a\n\nb\n\n\nc')).toBe('a\nb\nc');
  });

  it('drops whitespace-only lines', () => {
    expect(removeEmptyLines('a\n   \nb')).toBe('a\nb');
  });
});

describe('findMatches', () => {
  it('finds literal matches with start and end offsets', () => {
    expect(findMatches('the cat sat', 'cat')).toEqual([{ start: 4, end: 7 }]);
  });

  it('is case-insensitive by default', () => {
    expect(findMatches('Cat cat', 'cat')).toHaveLength(2);
  });

  it('respects caseSensitive', () => {
    expect(findMatches('Cat cat', 'cat', { caseSensitive: true })).toEqual([{ start: 4, end: 7 }]);
  });

  it('returns non-overlapping matches', () => {
    expect(findMatches('aaaa', 'aa')).toEqual([
      { start: 0, end: 2 },
      { start: 2, end: 4 },
    ]);
  });

  it('treats regex metacharacters literally when regex is off', () => {
    expect(findMatches('a.c abc', 'a.c')).toEqual([{ start: 0, end: 3 }]);
  });

  it('matches patterns when regex is on', () => {
    expect(findMatches('a1 b2', '[a-z]\\d', { regex: true })).toEqual([
      { start: 0, end: 2 },
      { start: 3, end: 5 },
    ]);
  });

  it('anchors ^ and $ to each line in regex mode', () => {
    expect(findMatches('ab\ncd', '$', { regex: true })).toEqual([
      { start: 2, end: 2 },
      { start: 5, end: 5 },
    ]);
    expect(findMatches('ab\ncd', '^', { regex: true })).toEqual([
      { start: 0, end: 0 },
      { start: 3, end: 3 },
    ]);
  });

  it('treats $ literally when regex mode is off', () => {
    expect(findMatches('a$\nb', '$')).toEqual([{ start: 1, end: 2 }]);
  });

  it('matches whole words only when wholeWord is set', () => {
    expect(findMatches('cat cats concat cat.', 'cat', { wholeWord: true })).toEqual([
      { start: 0, end: 3 },
      { start: 16, end: 19 },
    ]);
  });

  it('terminates on zero-width regex matches', () => {
    const matches = findMatches('bab', 'a*', { regex: true });
    expect(matches.length).toBeLessThan(10);
    expect(matches).toContainEqual({ start: 1, end: 2 });
  });

  it('returns no matches for an empty query', () => {
    expect(findMatches('abc', '')).toEqual([]);
  });

  it('throws on an invalid regex', () => {
    expect(() => findMatches('abc', '(unclosed', { regex: true })).toThrow();
  });

  it('throws SearchTimeoutError when the time budget is exceeded', () => {
    const haystack = 'a'.repeat(200000);
    expect(() => findMatches(haystack, 'a', { timeBudgetMs: 0 })).toThrow(SearchTimeoutError);
  });
});

describe('replaceAll', () => {
  it('replaces every literal match and reports the count', () => {
    expect(replaceAll('cat cat', 'cat', 'dog')).toEqual({ text: 'dog dog', count: 2 });
  });

  it('does not treat $ in the replacement as special in literal mode', () => {
    expect(replaceAll('cat', 'cat', '$1').text).toBe('$1');
  });

  it('expands capture groups in regex mode', () => {
    const result = replaceAll('joe@corp', '(\\w+)@(\\w+)', '$2:$1', { regex: true });
    expect(result.text).toBe('corp:joe');
  });

  it('expands $& as the whole match in regex mode', () => {
    expect(replaceAll('abc', 'b', '[$&]', { regex: true }).text).toBe('a[b]c');
  });

  it('leaves text untouched when there are no matches', () => {
    expect(replaceAll('abc', 'z', 'y')).toEqual({ text: 'abc', count: 0 });
  });

  it('replaces respecting wholeWord', () => {
    expect(replaceAll('cat cats', 'cat', 'dog', { wholeWord: true }).text).toBe('dog cats');
  });
});

describe('expandReplacement', () => {
  it('returns the replacement verbatim in literal mode', () => {
    expect(expandReplacement('cat', 'cat', '$1 dog')).toBe('$1 dog');
  });

  it('expands capture groups against the matched text in regex mode', () => {
    expect(expandReplacement('joe@corp', '(\\w+)@(\\w+)', '$2:$1', { regex: true })).toBe('corp:joe');
  });

  it('expands $& to the whole match in regex mode', () => {
    expect(expandReplacement('bc', 'b.', '[$&]', { regex: true })).toBe('[bc]');
  });
});

describe('unescapeReplacement', () => {
  it('leaves a replacement without backslashes alone', () => {
    expect(unescapeReplacement('$1 dog')).toBe('$1 dog');
  });

  it('turns the single-character escapes into real characters', () => {
    expect(unescapeReplacement('a\\nb\\tc\\rd')).toBe('a\nb\tc\rd');
  });

  it('collapses an escaped backslash without consuming the next character', () => {
    expect(unescapeReplacement('\\\\n')).toBe('\\n');
  });

  it('decodes \\xHH, \\uFFFF and \\u{...}', () => {
    expect(unescapeReplacement('\\x41\\u00e9\\u{1f600}')).toBe('Aé😀');
  });

  it('escapes a $ that came out of an escape so it is not a group reference', () => {
    expect(unescapeReplacement('\\x24')).toBe('$$');
  });

  it('keeps unknown escapes as typed', () => {
    expect(unescapeReplacement('\\d\\q')).toBe('\\d\\q');
  });

  it('keeps a trailing backslash', () => {
    expect(unescapeReplacement('end\\')).toBe('end\\');
  });

  it('keeps a malformed code escape as typed', () => {
    expect(unescapeReplacement('\\xZZ\\u12')).toBe('\\xZZ\\u12');
  });
});

describe('replace with escape sequences', () => {
  it('replaceAll inserts a newline for \\n in regex mode', () => {
    expect(replaceAll('a, b, c', ',\\s*', '\\n', { regex: true })).toEqual({
      text: 'a\nb\nc',
      count: 2,
    });
  });

  it('replaceAll keeps \\n literal in literal mode', () => {
    expect(replaceAll('a,b', ',', '\\n').text).toBe('a\\nb');
  });

  it('combines an escape with a capture group', () => {
    expect(replaceAll('k=v', '(\\w+)=(\\w+)', '$1:\\t$2', { regex: true }).text).toBe('k:\tv');
  });

  it('expandReplacement resolves escapes in regex mode', () => {
    expect(expandReplacement('a b', '(\\w) (\\w)', '$1\\n$2', { regex: true })).toBe('a\nb');
  });

  it('a $ decoded from an escape survives as a single dollar sign', () => {
    expect(replaceAll('price', 'price', '\\x2410', { regex: true }).text).toBe('$10');
  });
});

describe('replaceMatch', () => {
  it('replaces a single match at the given offsets', () => {
    const match = { start: 4, end: 7 };
    expect(replaceMatch('the cat sat', match, 'cat', 'dog')).toBe('the dog sat');
  });

  it('expands capture groups for the replaced match in regex mode', () => {
    const matches = findMatches('joe@corp bob@corp', '(\\w+)@(\\w+)', { regex: true });
    const result = replaceMatch('joe@corp bob@corp', matches[1], '(\\w+)@(\\w+)', '$1!', { regex: true });
    expect(result).toBe('joe@corp bob!');
  });
});
