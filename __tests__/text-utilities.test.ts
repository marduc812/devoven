import {
  toUpperCase, toLowerCase, toTitleCase,
  toCamelCase, toSnakeCase, toKebabCase, toPascalCase, convertCase,
  countWords, countChars, countCharsNoSpaces, countLines, countSentences,
  generateLoremIpsum, generateLoremWords,
  removeDuplicateLines, sortLinesAsc, sortLinesDesc,
  reverseString, reverseLines,
  toSlug, trimLines, collapseSpaces, removeBlankLines,
  regexFindReplace,
  repeatText,
  formatDiffStats,
} from '@/Components/Functions/TextUtilities/logic';

// ─── Case Conversion ──────────────────────────────────────────────────────────

describe('toUpperCase', () => {
  it('uppercases a simple string', () => expect(toUpperCase('hello')).toBe('HELLO'));
  it('uppercases mixed case', () => expect(toUpperCase('Hello World')).toBe('HELLO WORLD'));
  it('handles digits and symbols unchanged', () => expect(toUpperCase('abc 123!')).toBe('ABC 123!'));
  it('empty input returns empty', () => expect(toUpperCase('')).toBe(''));
});

describe('toLowerCase', () => {
  it('lowercases a simple string', () => expect(toLowerCase('HELLO')).toBe('hello'));
  it('lowercases mixed case', () => expect(toLowerCase('Hello World')).toBe('hello world'));
  it('handles digits and symbols unchanged', () => expect(toLowerCase('ABC 123!')).toBe('abc 123!'));
  it('empty input returns empty', () => expect(toLowerCase('')).toBe(''));
});

describe('toTitleCase', () => {
  it('capitalizes each word', () => expect(toTitleCase('hello world')).toBe('Hello World'));
  it('lowercases already-upper words', () => expect(toTitleCase('HELLO WORLD')).toBe('Hello World'));
  it('handles single word', () => expect(toTitleCase('foo')).toBe('Foo'));
  it('empty input returns empty', () => expect(toTitleCase('')).toBe(''));
});

describe('toCamelCase', () => {
  it('converts hello world', () => expect(toCamelCase('hello world')).toBe('helloWorld'));
  it('handles multiple spaces', () => expect(toCamelCase('hello  world')).toBe('helloWorld'));
  it('handles snake_case input', () => expect(toCamelCase('hello_world')).toBe('helloWorld'));
  it('handles kebab-case input', () => expect(toCamelCase('hello-world')).toBe('helloWorld'));
  it('handles three words', () => expect(toCamelCase('foo bar baz')).toBe('fooBarBaz'));
  it('empty input returns empty', () => expect(toCamelCase('')).toBe(''));
});

describe('toSnakeCase', () => {
  it('converts hello world', () => expect(toSnakeCase('hello world')).toBe('hello_world'));
  it('converts kebab-case', () => expect(toSnakeCase('hello-world')).toBe('hello_world'));
  it('converts camelCase', () => expect(toSnakeCase('helloWorld')).toBe('hello_world'));
  it('handles three words', () => expect(toSnakeCase('foo bar baz')).toBe('foo_bar_baz'));
  it('empty input returns empty', () => expect(toSnakeCase('')).toBe(''));
});

describe('toKebabCase', () => {
  it('converts hello world', () => expect(toKebabCase('hello world')).toBe('hello-world'));
  it('converts snake_case', () => expect(toKebabCase('hello_world')).toBe('hello-world'));
  it('converts camelCase', () => expect(toKebabCase('helloWorld')).toBe('hello-world'));
  it('handles three words', () => expect(toKebabCase('foo bar baz')).toBe('foo-bar-baz'));
  it('empty input returns empty', () => expect(toKebabCase('')).toBe(''));
});

describe('toPascalCase', () => {
  it('converts hello world', () => expect(toPascalCase('hello world')).toBe('HelloWorld'));
  it('converts snake_case', () => expect(toPascalCase('hello_world')).toBe('HelloWorld'));
  it('converts kebab-case', () => expect(toPascalCase('hello-world')).toBe('HelloWorld'));
  it('handles single word', () => expect(toPascalCase('foo')).toBe('Foo'));
  it('empty input returns empty', () => expect(toPascalCase('')).toBe(''));
});

describe('convertCase dispatcher', () => {
  it('dispatches upper', () => expect(convertCase('hello', 'upper')).toBe('HELLO'));
  it('dispatches lower', () => expect(convertCase('HELLO', 'lower')).toBe('hello'));
  it('dispatches title', () => expect(convertCase('hello world', 'title')).toBe('Hello World'));
  it('dispatches camel', () => expect(convertCase('hello world', 'camel')).toBe('helloWorld'));
  it('dispatches snake', () => expect(convertCase('hello world', 'snake')).toBe('hello_world'));
  it('dispatches kebab', () => expect(convertCase('hello world', 'kebab')).toBe('hello-world'));
  it('dispatches pascal', () => expect(convertCase('hello world', 'pascal')).toBe('HelloWorld'));
  it('unknown case returns input unchanged', () => expect(convertCase('hello', 'unknown')).toBe('hello'));
});

// ─── Stats ────────────────────────────────────────────────────────────────────

describe('countWords', () => {
  it('counts words in a sentence', () => expect(countWords('hello world foo')).toBe(3));
  it('counts single word', () => expect(countWords('hello')).toBe(1));
  it('ignores leading/trailing spaces', () => expect(countWords('  hello world  ')).toBe(2));
  it('counts words separated by multiple spaces', () => expect(countWords('a  b  c')).toBe(3));
  it('empty input returns 0', () => expect(countWords('')).toBe(0));
  it('whitespace-only returns 0', () => expect(countWords('   ')).toBe(0));
});

describe('countChars', () => {
  it('counts all characters including spaces', () => expect(countChars('hello world')).toBe(11));
  it('counts empty string as 0', () => expect(countChars('')).toBe(0));
  it('counts newline as a character', () => expect(countChars('a\nb')).toBe(3));
});

describe('countCharsNoSpaces', () => {
  it('excludes spaces', () => expect(countCharsNoSpaces('hello world')).toBe(10));
  it('excludes tabs and newlines', () => expect(countCharsNoSpaces('a\tb\nc')).toBe(3));
  it('empty input returns 0', () => expect(countCharsNoSpaces('')).toBe(0));
});

describe('countLines', () => {
  it('counts two lines', () => expect(countLines('hello\nworld')).toBe(2));
  it('counts single line (no newline)', () => expect(countLines('hello')).toBe(1));
  it('counts three lines', () => expect(countLines('a\nb\nc')).toBe(3));
  it('empty string returns 0', () => expect(countLines('')).toBe(0));
});

describe('countSentences', () => {
  it('counts sentences ending with period', () => expect(countSentences('Hello. World.')).toBe(2));
  it('counts sentences ending with exclamation', () => expect(countSentences('Hello! World!')).toBe(2));
  it('counts sentences ending with question mark', () => expect(countSentences('Hello? World?')).toBe(2));
  it('mixed terminators', () => expect(countSentences('Hi. How are you? Good!')).toBe(3));
  it('empty input returns 0', () => expect(countSentences('')).toBe(0));
});

// ─── Lorem ipsum ─────────────────────────────────────────────────────────────

describe('generateLoremIpsum', () => {
  it('generates 1 paragraph', () => {
    const result = generateLoremIpsum(1);
    expect(result).toContain('Lorem ipsum');
    expect(result.split('\n\n').length).toBe(1);
  });
  it('generates 2 paragraphs separated by double newline', () => {
    const result = generateLoremIpsum(2);
    expect(result.split('\n\n').length).toBe(2);
  });
  it('generates 5 paragraphs', () => {
    const result = generateLoremIpsum(5);
    expect(result.split('\n\n').length).toBe(5);
  });
  it('0 paragraphs returns empty string', () => expect(generateLoremIpsum(0)).toBe(''));
  it('negative returns empty string', () => expect(generateLoremIpsum(-1)).toBe(''));
});

describe('generateLoremWords', () => {
  it('generates 5 words', () => {
    const result = generateLoremWords(5);
    expect(result.split(' ').length).toBe(5);
  });
  it('generates 1 word', () => {
    const result = generateLoremWords(1);
    expect(result.trim().split(' ').length).toBe(1);
  });
  it('generates 50 words', () => {
    const result = generateLoremWords(50);
    expect(result.split(' ').length).toBe(50);
  });
  it('0 words returns empty string', () => expect(generateLoremWords(0)).toBe(''));
});

// ─── Dedup / Sort / Reverse ───────────────────────────────────────────────────

describe('removeDuplicateLines', () => {
  it('removes duplicate lines preserving order', () => {
    expect(removeDuplicateLines('a\nb\na\nc')).toBe('a\nb\nc');
  });
  it('no duplicates returns unchanged', () => {
    expect(removeDuplicateLines('a\nb\nc')).toBe('a\nb\nc');
  });
  it('all duplicates returns one line', () => {
    expect(removeDuplicateLines('x\nx\nx')).toBe('x');
  });
  it('empty input returns empty', () => expect(removeDuplicateLines('')).toBe(''));
});

describe('sortLinesAsc', () => {
  it('sorts lines A-Z', () => expect(sortLinesAsc('banana\napple\ncherry')).toBe('apple\nbanana\ncherry'));
  it('handles already sorted', () => expect(sortLinesAsc('a\nb\nc')).toBe('a\nb\nc'));
  it('single line unchanged', () => expect(sortLinesAsc('hello')).toBe('hello'));
  it('empty input returns empty', () => expect(sortLinesAsc('')).toBe(''));
});

describe('sortLinesDesc', () => {
  it('sorts lines Z-A', () => expect(sortLinesDesc('apple\nbanana\ncherry')).toBe('cherry\nbanana\napple'));
  it('single line unchanged', () => expect(sortLinesDesc('hello')).toBe('hello'));
  it('empty input returns empty', () => expect(sortLinesDesc('')).toBe(''));
});

describe('reverseString', () => {
  it('reverses a simple string', () => expect(reverseString('hello')).toBe('olleh'));
  it('reverses hello world', () => expect(reverseString('hello world')).toBe('dlrow olleh'));
  it('empty string stays empty', () => expect(reverseString('')).toBe(''));
  it('palindrome stays the same', () => expect(reverseString('racecar')).toBe('racecar'));
});

describe('reverseLines', () => {
  it('reverses line order', () => expect(reverseLines('a\nb\nc')).toBe('c\nb\na'));
  it('single line unchanged', () => expect(reverseLines('hello')).toBe('hello'));
  it('two lines swap', () => expect(reverseLines('first\nsecond')).toBe('second\nfirst'));
  it('empty input returns empty', () => expect(reverseLines('')).toBe(''));
});

// ─── Slug / Whitespace ────────────────────────────────────────────────────────

describe('toSlug', () => {
  it('basic conversion', () => expect(toSlug('Hello World!')).toBe('hello-world'));
  it('multiple spaces become single hyphen', () => expect(toSlug('foo  bar')).toBe('foo-bar'));
  it('strips special chars', () => expect(toSlug('C++ is great')).toBe('c-is-great'));
  it('trims leading and trailing hyphens', () => expect(toSlug('  hello world  ')).toBe('hello-world'));
  it('preserves numbers', () => expect(toSlug('section 42 intro')).toBe('section-42-intro'));
  it('empty input returns empty', () => expect(toSlug('')).toBe(''));
});

describe('trimLines', () => {
  it('trims leading and trailing spaces from each line', () => {
    expect(trimLines('  hello  \n  world  ')).toBe('hello\nworld');
  });
  it('single line is trimmed', () => expect(trimLines('  hi  ')).toBe('hi'));
  it('empty input returns empty', () => expect(trimLines('')).toBe(''));
});

describe('collapseSpaces', () => {
  it('collapses multiple spaces to one', () => expect(collapseSpaces('a  b   c')).toBe('a b c'));
  it('collapses tabs to space', () => expect(collapseSpaces('a\tb')).toBe('a b'));
  it('preserves newlines', () => expect(collapseSpaces('a  b\nc  d')).toBe('a b\nc d'));
  it('empty input returns empty', () => expect(collapseSpaces('')).toBe(''));
});

describe('removeBlankLines', () => {
  it('removes empty lines', () => expect(removeBlankLines('a\n\nb\n\nc')).toBe('a\nb\nc'));
  it('removes whitespace-only lines', () => expect(removeBlankLines('a\n   \nb')).toBe('a\nb'));
  it('no blank lines, unchanged', () => expect(removeBlankLines('a\nb')).toBe('a\nb'));
  it('empty input returns empty', () => expect(removeBlankLines('')).toBe(''));
});

// ─── Regex find & replace ────────────────────────────────────────────────────

describe('regexFindReplace', () => {
  it('replaces all matches with global flag', () => {
    expect(regexFindReplace('foo bar foo', 'foo', 'g', 'baz')).toBe('baz bar baz');
  });
  it('replaces first match without global flag', () => {
    expect(regexFindReplace('foo bar foo', 'foo', '', 'baz')).toBe('baz bar foo');
  });
  it('case-insensitive match with i flag', () => {
    expect(regexFindReplace('Hello hello', 'hello', 'gi', 'hi')).toBe('hi hi');
  });
  it('empty text returns empty', () => {
    expect(regexFindReplace('', 'foo', 'g', 'bar')).toBe('');
  });
  it('empty pattern returns text unchanged', () => {
    expect(regexFindReplace('hello', '', 'g', 'bar')).toBe('hello');
  });
  it('regex with capture groups works', () => {
    expect(regexFindReplace('2024-01-15', '(\\d{4})-(\\d{2})-(\\d{2})', '', '$3/$2/$1')).toBe('15/01/2024');
  });
});

// ─── Text repeater / random picker ───────────────────────────────────────────

describe('repeatText', () => {
  it('repeats text 3 times with newline separator', () => {
    expect(repeatText('hello', 3, '\n')).toBe('hello\nhello\nhello');
  });
  it('repeats text 2 times with comma separator', () => {
    expect(repeatText('ab', 2, ',')).toBe('ab,ab');
  });
  it('repeats text 1 time returns the text itself', () => {
    expect(repeatText('hi', 1, '-')).toBe('hi');
  });
  it('0 times returns empty', () => expect(repeatText('hello', 0, '\n')).toBe(''));
  it('empty text returns empty', () => expect(repeatText('', 5, '\n')).toBe(''));
});

// ─── Diff stats ───────────────────────────────────────────────────────────────

describe('formatDiffStats', () => {
  it('formats added and removed', () => expect(formatDiffStats(5, 3)).toBe('+5 lines, -3 lines'));
  it('formats added only', () => expect(formatDiffStats(2, 0)).toBe('+2 lines'));
  it('formats removed only', () => expect(formatDiffStats(0, 4)).toBe('-4 lines'));
  it('singular line label', () => expect(formatDiffStats(1, 1)).toBe('+1 line, -1 line'));
  it('no differences', () => expect(formatDiffStats(0, 0)).toBe('No differences'));
});
