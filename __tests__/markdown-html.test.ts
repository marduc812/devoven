// Tests for the /converting/markdown-html route logic
// (wraps MarkdownToHtmlTools — see also markdown-to-html.test.ts)
import { markdownToHtml } from '../Components/Functions/MarkdownToHtmlTools/logic';

describe('markdownToHtml (markdown-html route)', () => {
  it('returns empty string for empty input', () => {
    expect(markdownToHtml('')).toBe('');
    expect(markdownToHtml('  ')).toBe('');
  });

  it('converts h1 heading', () => {
    expect(markdownToHtml('# Hello')).toBe('<h1>Hello</h1>');
  });

  it('converts h2–h6 headings', () => {
    expect(markdownToHtml('## H2')).toContain('<h2>H2</h2>');
    expect(markdownToHtml('### H3')).toContain('<h3>H3</h3>');
    expect(markdownToHtml('###### H6')).toContain('<h6>H6</h6>');
  });

  it('converts bold text', () => {
    expect(markdownToHtml('**bold**')).toContain('<strong>bold</strong>');
  });

  it('converts italic text', () => {
    expect(markdownToHtml('*italic*')).toContain('<em>italic</em>');
  });

  it('converts inline code', () => {
    expect(markdownToHtml('`code`')).toContain('<code>code</code>');
  });

  it('converts fenced code blocks', () => {
    const input = '```js\nconst x = 1;\n```';
    const result = markdownToHtml(input);
    expect(result).toContain('<pre><code');
    expect(result).toContain('const x = 1;');
  });

  it('converts unordered lists', () => {
    const result = markdownToHtml('- item one\n- item two');
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>');
    expect(result).toContain('item one');
  });

  it('converts ordered lists', () => {
    const result = markdownToHtml('1. first\n2. second');
    expect(result).toContain('<ol>');
    expect(result).toContain('<li>');
    expect(result).toContain('first');
  });

  it('converts blockquotes', () => {
    const result = markdownToHtml('> quoted text');
    expect(result).toContain('<blockquote>');
  });

  it('converts horizontal rules', () => {
    expect(markdownToHtml('---')).toContain('<hr');
    expect(markdownToHtml('***')).toContain('<hr');
  });

  it('converts links', () => {
    const result = markdownToHtml('[DevOven](https://devoven.com)');
    expect(result).toContain('<a href="https://devoven.com">');
    expect(result).toContain('DevOven');
  });

  it('converts images', () => {
    const result = markdownToHtml('![alt text](image.png)');
    expect(result).toContain('<img src="image.png"');
    expect(result).toContain('alt="alt text"');
  });

  it('wraps plain text in paragraph tags', () => {
    const result = markdownToHtml('Hello world');
    expect(result).toContain('<p>');
    expect(result).toContain('Hello world');
  });
});
