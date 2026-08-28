import {
  escapeHtml,
  unescapeHtml,
  escapeRegex,
  escapeJson,
  unescapeJson,
  escapeSql,
  escapeShell,
  escapeCsv,
} from '../Components/Functions/TextEscapeTools/logic';

// ─── escapeHtml ────────────────────────────────────────────────────────────────

describe('escapeHtml', () => {
  it('escapes ampersands', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });
  it('escapes angle brackets', () => {
    expect(escapeHtml('<div>hello</div>')).toBe('&lt;div&gt;hello&lt;/div&gt;');
  });
  it('escapes double quotes', () => {
    expect(escapeHtml('Say "hello"')).toBe('Say &quot;hello&quot;');
  });
  it('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#039;s');
  });
  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('');
  });
  it('handles text with no special chars', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });
  it('escapes all special chars together', () => {
    expect(escapeHtml('<a href="test" data-val=\'x\'>A & B</a>')).toBe(
      '&lt;a href=&quot;test&quot; data-val=&#039;x&#039;&gt;A &amp; B&lt;/a&gt;'
    );
  });
});

// ─── unescapeHtml ──────────────────────────────────────────────────────────────

describe('unescapeHtml', () => {
  it('unescapes &amp;', () => {
    expect(unescapeHtml('Tom &amp; Jerry')).toBe('Tom & Jerry');
  });
  it('unescapes &lt; and &gt;', () => {
    expect(unescapeHtml('&lt;div&gt;')).toBe('<div>');
  });
  it('unescapes &quot;', () => {
    expect(unescapeHtml('Say &quot;hello&quot;')).toBe('Say "hello"');
  });
  it('unescapes &#039;', () => {
    expect(unescapeHtml('it&#039;s')).toBe("it's");
  });
  it('unescapes numeric entities', () => {
    expect(unescapeHtml('&#65;')).toBe('A');
  });
  it('unescapes hex entities', () => {
    expect(unescapeHtml('&#x41;')).toBe('A');
  });
  it('handles empty string', () => {
    expect(unescapeHtml('')).toBe('');
  });
});

// ─── escapeRegex ──────────────────────────────────────────────────────────────

describe('escapeRegex', () => {
  it('escapes dot', () => {
    expect(escapeRegex('1.2')).toBe('1\\.2');
  });
  it('escapes special regex chars', () => {
    expect(escapeRegex('(test)')).toBe('\\(test\\)');
  });
  it('escapes brackets', () => {
    expect(escapeRegex('[a-z]')).toBe('\\[a\\-z\\]');
  });
  it('handles plain text', () => {
    expect(escapeRegex('hello')).toBe('hello');
  });
  it('escapes backslash', () => {
    expect(escapeRegex('\\')).toBe('\\\\');
  });
});

// ─── escapeJson ───────────────────────────────────────────────────────────────

describe('escapeJson', () => {
  it('escapes newlines', () => {
    expect(escapeJson('line1\nline2')).toBe('line1\\nline2');
  });
  it('escapes tabs', () => {
    expect(escapeJson('a\tb')).toBe('a\\tb');
  });
  it('escapes backslash', () => {
    expect(escapeJson('a\\b')).toBe('a\\\\b');
  });
  it('escapes double quotes', () => {
    expect(escapeJson('say "hi"')).toBe('say \\"hi\\"');
  });
  it('handles plain text', () => {
    expect(escapeJson('hello')).toBe('hello');
  });
});

// ─── unescapeJson ─────────────────────────────────────────────────────────────

describe('unescapeJson', () => {
  it('unescapes newlines', () => {
    expect(unescapeJson('line1\\nline2')).toBe('line1\nline2');
  });
  it('unescapes tabs', () => {
    expect(unescapeJson('a\\tb')).toBe('a\tb');
  });
  it('unescapes backslash', () => {
    expect(unescapeJson('a\\\\b')).toBe('a\\b');
  });
  it('throws on invalid sequences', () => {
    expect(() => unescapeJson('\\q')).toThrow();
  });
});

// ─── escapeSql ────────────────────────────────────────────────────────────────

describe('escapeSql', () => {
  it('escapes single quotes', () => {
    expect(escapeSql("O'Brien")).toBe("O''Brien");
  });
  it('escapes backslashes', () => {
    expect(escapeSql('C:\\path')).toBe('C:\\\\path');
  });
  it('handles plain text', () => {
    expect(escapeSql('hello')).toBe('hello');
  });
  it('escapes multiple quotes', () => {
    expect(escapeSql("it's 'quoted'")).toBe("it''s ''quoted''");
  });
});

// ─── escapeShell ──────────────────────────────────────────────────────────────

describe('escapeShell', () => {
  it('wraps in single quotes', () => {
    expect(escapeShell('hello')).toBe("'hello'");
  });
  it('escapes embedded single quotes', () => {
    expect(escapeShell("it's")).toBe("'it'\\''s'");
  });
  it('handles empty string', () => {
    expect(escapeShell('')).toBe("''");
  });
  it('handles text with spaces', () => {
    expect(escapeShell('hello world')).toBe("'hello world'");
  });
});

// ─── escapeCsv ────────────────────────────────────────────────────────────────

describe('escapeCsv', () => {
  it('returns plain text as-is', () => {
    expect(escapeCsv('hello')).toBe('hello');
  });
  it('wraps text with comma in quotes', () => {
    expect(escapeCsv('a,b')).toBe('"a,b"');
  });
  it('wraps text with double quote and escapes it', () => {
    expect(escapeCsv('say "hi"')).toBe('"say ""hi"""');
  });
  it('wraps text with newline in quotes', () => {
    expect(escapeCsv('line1\nline2')).toBe('"line1\nline2"');
  });
  it('handles empty string', () => {
    expect(escapeCsv('')).toBe('');
  });
});
