/**
 * @jest-environment jsdom
 */

import { escapeHtml, renderMarkdown } from '../Components/Functions/MarkdownPreviewTools/logic';

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

describe('renderMarkdown – XSS payloads', () => {
  // marked emits raw HTML untouched, and the preview pane hands the result to
  // dangerouslySetInnerHTML, so each of these executes without DOMPurify.
  const payloads: [string, string][] = [
    ['img onerror', '<img src=x onerror=alert(1)>'],
    ['svg onload', '<svg onload=alert(1)>'],
    ['details ontoggle', '<details open ontoggle=alert(1)>'],
    ['style onload', '<style onload=alert(1)>'],
    ['iframe javascript: src', '<iframe src="javascript:alert(1)"></iframe>'],
    ['markdown link to javascript:', '[click](javascript:alert(1))'],
  ];

  it.each(payloads)('strips the handler and scheme from %s', (_name, payload) => {
    const out = renderMarkdown(payload);
    expect(out).not.toMatch(/onerror/i);
    expect(out).not.toMatch(/onload/i);
    expect(out).not.toMatch(/ontoggle/i);
    expect(out).not.toMatch(/javascript:/i);
  });

  it('drops script tags', () => {
    const out = renderMarkdown('<script>alert(1)</script>');
    expect(out).not.toMatch(/<script/i);
  });
});

describe('renderMarkdown – ordinary Markdown still renders', () => {
  it('renders a heading', () => {
    expect(renderMarkdown('# Title')).toContain('<h1');
  });

  it('renders bold text', () => {
    expect(renderMarkdown('**bold**')).toContain('<strong>');
  });

  it('renders a fenced code block', () => {
    const out = renderMarkdown('```js\nconsole.log(1);\n```');
    expect(out).toContain('<pre><code');
  });

  it('keeps an ordinary link and its href', () => {
    const out = renderMarkdown('[example](https://example.com)');
    expect(out).toContain('href="https://example.com"');
  });
});
