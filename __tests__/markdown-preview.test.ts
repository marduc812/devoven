import { extractMarkdownStats, escapeHtml } from '../Components/Functions/MarkdownPreviewTools/logic';

describe('extractMarkdownStats', () => {
  it('counts words', () => {
    const stats = extractMarkdownStats('Hello world foo bar');
    expect(stats).toContain('Words:       4');
  });

  it('counts characters', () => {
    const md = 'Hello';
    const stats = extractMarkdownStats(md);
    expect(stats).toContain(`Characters:  5`);
  });

  it('counts lines', () => {
    const md = 'line1\nline2\nline3';
    const stats = extractMarkdownStats(md);
    expect(stats).toContain('Lines:       3');
  });

  it('counts headings', () => {
    const md = '# Heading 1\n## Heading 2\nsome text\n### Third';
    const stats = extractMarkdownStats(md);
    expect(stats).toContain('Headings:    3');
  });

  it('counts links', () => {
    const md = '[Link1](https://a.com) and [Link2](https://b.com)';
    const stats = extractMarkdownStats(md);
    expect(stats).toContain('Links:       2');
  });

  it('counts code blocks', () => {
    const md = '```\ncode here\n```\n\n```\nmore code\n```';
    const stats = extractMarkdownStats(md);
    expect(stats).toContain('Code blocks: 2');
  });

  it('handles empty string', () => {
    const stats = extractMarkdownStats('');
    expect(stats).toContain('Words:       0');
    expect(stats).toContain('Headings:    0');
  });

  it('0 words for whitespace-only', () => {
    const stats = extractMarkdownStats('   ');
    expect(stats).toContain('Words:       0');
  });
});

describe('escapeHtml', () => {
  it('escapes ampersand', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('escapes less-than', () => {
    expect(escapeHtml('<div>')).toBe('&lt;div&gt;');
  });

  it('escapes greater-than', () => {
    expect(escapeHtml('a > b')).toBe('a &gt; b');
  });

  it('escapes double quotes', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
  });

  it('escapes multiple entities', () => {
    const result = escapeHtml('<a href="url">link & more</a>');
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
    expect(result).toContain('&quot;');
    expect(result).toContain('&amp;');
  });

  it('leaves plain text unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });
});
