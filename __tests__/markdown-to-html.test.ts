import { markdownToHtml } from '@/Components/Functions/DataFormatConverters/logic';

describe('markdownToHtml - headers', () => {
  it('converts # h1', () => expect(markdownToHtml('# Hello')).toContain('<h1>Hello</h1>'));
  it('converts ## h2', () => expect(markdownToHtml('## World')).toContain('<h2>World</h2>'));
  it('converts ### h3', () => expect(markdownToHtml('### Title')).toContain('<h3>Title</h3>'));
  it('converts #### h4', () => expect(markdownToHtml('#### Foo')).toContain('<h4>Foo</h4>'));
});

describe('markdownToHtml - inline', () => {
  it('converts **bold**', () => expect(markdownToHtml('**bold**')).toContain('<strong>bold</strong>'));
  it('converts *italic*', () => expect(markdownToHtml('*italic*')).toContain('<em>italic</em>'));
  it('converts `code`', () => expect(markdownToHtml('`code`')).toContain('<code>code</code>'));
  it('converts [link](url)', () => {
    const html = markdownToHtml('[click](https://example.com)');
    expect(html).toContain('<a href="https://example.com">click</a>');
  });
  it('converts ![img](src)', () => {
    const html = markdownToHtml('![alt text](img.png)');
    expect(html).toContain('<img src="img.png" alt="alt text">');
  });
});

describe('markdownToHtml - blocks', () => {
  it('converts code block', () => {
    const md = '```js\nconsole.log("hi");\n```';
    const html = markdownToHtml(md);
    expect(html).toContain('<pre><code');
    expect(html).toContain('console.log');
  });
  it('converts unordered list', () => {
    const html = markdownToHtml('- item1\n- item2');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>item1</li>');
    expect(html).toContain('<li>item2</li>');
  });
  it('converts ordered list', () => {
    const html = markdownToHtml('1. first\n2. second');
    expect(html).toContain('<ol>');
    expect(html).toContain('<li>first</li>');
  });
  it('converts blockquote', () => {
    const html = markdownToHtml('> quoted text');
    expect(html).toContain('<blockquote>');
    expect(html).toContain('quoted text');
  });
  it('converts horizontal rule ---', () => {
    expect(markdownToHtml('---')).toContain('<hr>');
  });
  it('converts horizontal rule ***', () => {
    expect(markdownToHtml('***')).toContain('<hr>');
  });
  it('wraps paragraphs in <p>', () => {
    const html = markdownToHtml('Hello world');
    expect(html).toContain('<p>Hello world</p>');
  });
});

describe('markdownToHtml - empty', () => {
  it('returns empty string for empty input', () => {
    expect(markdownToHtml('')).toBe('');
  });
  it('returns empty string for whitespace-only input', () => {
    expect(markdownToHtml('   ')).toBe('');
  });
});

describe('markdownToHtml - HTML escaping', () => {
  it('escapes HTML in code blocks', () => {
    const html = markdownToHtml('```\n<script>alert(1)</script>\n```');
    expect(html).toContain('&lt;script&gt;');
  });
});
