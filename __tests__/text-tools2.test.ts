import {
  addLineNumbers,
  removeLineNumbers,
  indentText,
  dedentText,
  convertIndent,
  extractColumns,
  detectDelimiter,
  truncateByChars,
  truncateByWords,
  truncateByLines,
  removeEmojis,
  extractEmojis,
  wrapText,
  unwrapText,
} from '../Components/Functions/TextTools2/logic';

// ─── addLineNumbers ────────────────────────────────────────────────────────────

describe('addLineNumbers', () => {
  it('numbers lines starting from 1', () => {
    expect(addLineNumbers('a\nb\nc')).toBe('1. a\n2. b\n3. c');
  });
  it('custom start number', () => {
    expect(addLineNumbers('x\ny', 5)).toBe('5. x\n6. y');
  });
  it('custom separator', () => {
    expect(addLineNumbers('foo\nbar', 1, ') ')).toBe('1) foo\n2) bar');
  });
  it('empty input returns empty string', () => {
    expect(addLineNumbers('')).toBe('');
  });
  it('single line', () => {
    expect(addLineNumbers('hello')).toBe('1. hello');
  });
});

// ─── removeLineNumbers ─────────────────────────────────────────────────────────

describe('removeLineNumbers', () => {
  it('removes dot-style line numbers', () => {
    expect(removeLineNumbers('1. foo\n2. bar')).toBe('foo\nbar');
  });
  it('removes parenthesis-style line numbers', () => {
    expect(removeLineNumbers('1) foo\n2) bar')).toBe('foo\nbar');
  });
  it('removes colon-style line numbers', () => {
    expect(removeLineNumbers('1: foo\n2: bar')).toBe('foo\nbar');
  });
  it('empty input returns empty string', () => {
    expect(removeLineNumbers('')).toBe('');
  });
  it('lines without numbers are unchanged', () => {
    expect(removeLineNumbers('no numbers here')).toBe('no numbers here');
  });
});

// ─── indentText ───────────────────────────────────────────────────────────────

describe('indentText', () => {
  it('indents all non-empty lines by given spaces', () => {
    expect(indentText('foo\nbar', 2)).toBe('  foo\n  bar');
  });
  it('does not indent empty lines', () => {
    expect(indentText('foo\n\nbar', 4)).toBe('    foo\n\n    bar');
  });
  it('empty input returns empty string', () => {
    expect(indentText('', 4)).toBe('');
  });
  it('zero spaces leaves text unchanged', () => {
    expect(indentText('hello', 0)).toBe('hello');
  });
  it('indents single line', () => {
    expect(indentText('hello', 3)).toBe('   hello');
  });
});

// ─── dedentText ───────────────────────────────────────────────────────────────

describe('dedentText', () => {
  it('removes common leading whitespace', () => {
    expect(dedentText('  foo\n  bar')).toBe('foo\nbar');
  });
  it('handles mixed indentation removing minimum', () => {
    expect(dedentText('  foo\n    bar')).toBe('foo\n  bar');
  });
  it('empty input returns as-is', () => {
    expect(dedentText('')).toBe('');
  });
  it('no common indent leaves text unchanged', () => {
    expect(dedentText('foo\nbar')).toBe('foo\nbar');
  });
  it('all blank lines returns original text', () => {
    expect(dedentText('\n\n')).toBe('\n\n');
  });
});

// ─── convertIndent ────────────────────────────────────────────────────────────

describe('convertIndent', () => {
  it('converts 4-space indent to 2-space indent', () => {
    expect(convertIndent('    foo\n        bar', 4, 2)).toBe('  foo\n    bar');
  });
  it('converts 2-space indent to 4-space indent', () => {
    expect(convertIndent('  foo\n  bar', 2, 4)).toBe('    foo\n    bar');
  });
  it('empty input returns empty string', () => {
    expect(convertIndent('', 4, 2)).toBe('');
  });
  it('no indentation leaves text unchanged', () => {
    expect(convertIndent('foo\nbar', 4, 2)).toBe('foo\nbar');
  });
  it('tab-based indent is converted', () => {
    expect(convertIndent('\tfoo', 4, 2)).toBe('  foo');
  });
});

// ─── extractColumns ───────────────────────────────────────────────────────────

describe('extractColumns', () => {
  it('extracts specified columns from comma-delimited text', () => {
    expect(extractColumns('a,b,c\nd,e,f', ',', [1, 3])).toBe('a,c\nd,f');
  });
  it('extracts tab-delimited columns', () => {
    expect(extractColumns('a\tb\tc', '\t', [2])).toBe('b');
  });
  it('empty text returns empty string', () => {
    expect(extractColumns('', ',', [1])).toBe('');
  });
  it('handles out-of-range column indices with empty string', () => {
    expect(extractColumns('a,b', ',', [1, 5])).toBe('a,');
  });
  it('space delimiter splits on whitespace', () => {
    expect(extractColumns('foo bar baz', ' ', [1, 3])).toBe('foo baz');
  });
});

// ─── detectDelimiter ──────────────────────────────────────────────────────────

describe('detectDelimiter', () => {
  it('detects comma delimiter', () => {
    expect(detectDelimiter('a,b,c\nd,e,f')).toBe(',');
  });
  it('detects tab delimiter', () => {
    expect(detectDelimiter('a\tb\tc')).toBe('\t');
  });
  it('detects semicolon delimiter', () => {
    expect(detectDelimiter('a;b;c')).toBe(';');
  });
  it('detects pipe delimiter', () => {
    expect(detectDelimiter('a|b|c')).toBe('|');
  });
  it('defaults to space for unrecognized delimiters', () => {
    expect(detectDelimiter('hello world')).toBe(' ');
  });
});

// ─── truncateByChars ──────────────────────────────────────────────────────────

describe('truncateByChars', () => {
  it('truncates long text', () => {
    expect(truncateByChars('Hello World', 8)).toBe('Hello...');
  });
  it('no truncation if within limit', () => {
    expect(truncateByChars('Hi', 10)).toBe('Hi');
  });
  it('custom ellipsis', () => {
    expect(truncateByChars('Hello World', 8, ' [more]')).toBe('H [more]');
  });
  it('empty input returns empty string', () => {
    expect(truncateByChars('', 10)).toBe('');
  });
  it('exact limit does not truncate', () => {
    expect(truncateByChars('Hello', 5)).toBe('Hello');
  });
});

// ─── truncateByWords ──────────────────────────────────────────────────────────

describe('truncateByWords', () => {
  it('truncates to word limit', () => {
    expect(truncateByWords('one two three four', 2)).toBe('one two...');
  });
  it('no truncation if within word limit', () => {
    expect(truncateByWords('one two', 5)).toBe('one two');
  });
  it('custom ellipsis', () => {
    expect(truncateByWords('one two three', 2, ' ...')).toBe('one two ...');
  });
  it('empty input returns empty string', () => {
    expect(truncateByWords('', 5)).toBe('');
  });
  it('exact word count does not truncate', () => {
    expect(truncateByWords('one two three', 3)).toBe('one two three');
  });
});

// ─── truncateByLines ──────────────────────────────────────────────────────────

describe('truncateByLines', () => {
  it('truncates to line limit', () => {
    expect(truncateByLines('a\nb\nc\nd', 2)).toBe('a\nb\n...');
  });
  it('no truncation if within line limit', () => {
    expect(truncateByLines('a\nb', 5)).toBe('a\nb');
  });
  it('custom ellipsis', () => {
    expect(truncateByLines('a\nb\nc', 2, '[more]')).toBe('a\nb\n[more]');
  });
  it('empty input returns empty string', () => {
    expect(truncateByLines('', 5)).toBe('');
  });
  it('exact line count does not truncate', () => {
    expect(truncateByLines('a\nb\nc', 3)).toBe('a\nb\nc');
  });
});

// ─── removeEmojis ─────────────────────────────────────────────────────────────

describe('removeEmojis', () => {
  it('removes emoji from text', () => {
    expect(removeEmojis('Hello 😀 World')).toBe('Hello World');
  });
  it('returns text unchanged if no emojis', () => {
    expect(removeEmojis('Hello World')).toBe('Hello World');
  });
  it('removes multiple emojis', () => {
    const result = removeEmojis('😀😂🎉 party time');
    expect(result).not.toContain('😀');
    expect(result).toContain('party time');
  });
  it('empty input returns empty string', () => {
    expect(removeEmojis('')).toBe('');
  });
  it('collapses multiple spaces after removal', () => {
    const result = removeEmojis('a 😀 😂 b');
    expect(result).toBe('a b');
  });
});

// ─── extractEmojis ────────────────────────────────────────────────────────────

describe('extractEmojis', () => {
  it('extracts emojis from text', () => {
    expect(extractEmojis('Hello 😀 World 🎉')).toBe('😀 🎉');
  });
  it('returns empty string when no emojis', () => {
    expect(extractEmojis('Hello World')).toBe('');
  });
  it('extracts single emoji', () => {
    expect(extractEmojis('test 🎉 end')).toBe('🎉');
  });
  it('empty input returns empty string', () => {
    expect(extractEmojis('')).toBe('');
  });
  it('extracts multiple consecutive emojis', () => {
    const result = extractEmojis('😀😂');
    expect(result).toContain('😀');
    expect(result).toContain('😂');
  });
});

// ─── wrapText ─────────────────────────────────────────────────────────────────

describe('wrapText', () => {
  it('wraps long lines at specified width', () => {
    expect(wrapText('one two three four five', 10)).toBe('one two\nthree four\nfive');
  });
  it('does not wrap short lines', () => {
    expect(wrapText('short', 80)).toBe('short');
  });
  it('handles multi-line input', () => {
    const result = wrapText('hello world\nfoo bar', 80);
    expect(result).toBe('hello world\nfoo bar');
  });
  it('empty input returns empty string', () => {
    expect(wrapText('', 80)).toBe('');
  });
  it('width of 1 wraps each word to its own line', () => {
    const result = wrapText('a b c', 1);
    expect(result).toBe('a\nb\nc');
  });
});

// ─── unwrapText ───────────────────────────────────────────────────────────────

describe('unwrapText', () => {
  it('joins consecutive lines', () => {
    expect(unwrapText('hello\nworld')).toBe('hello world');
  });
  it('preserves paragraph breaks (double newlines)', () => {
    const result = unwrapText('para one\nline two\n\npara two\nline two');
    expect(result).toContain('\n\n');
  });
  it('empty input returns empty string', () => {
    expect(unwrapText('')).toBe('');
  });
  it('single line is unchanged', () => {
    expect(unwrapText('hello world')).toBe('hello world');
  });
  it('multiple consecutive blank lines collapse', () => {
    const result = unwrapText('a\n\n\n\nb');
    expect(result).toBe('a\n\nb');
  });
});
