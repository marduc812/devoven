import { htmlToJsx } from '@/Components/Functions/HtmlToJsxTools/logic';

describe('htmlToJsx', () => {
  it('converts class to className', () => expect(htmlToJsx('<div class="foo">')).toContain('className="foo"'));
  it('converts for to htmlFor', () => expect(htmlToJsx('<label for="id">')).toContain('htmlFor="id"'));
  it('converts tabindex to tabIndex', () => expect(htmlToJsx('<div tabindex="0">')).toContain('tabIndex="0"'));
  it('converts style to object', () => {
    const r = htmlToJsx('<div style="color: red; font-size: 14px">');
    expect(r).toContain("style={{");
    expect(r).toContain("color: 'red'");
    expect(r).toContain("fontSize: '14px'");
  });
  it('self-closes br tag', () => expect(htmlToJsx('<br>')).toContain('<br />'));
  it('self-closes img tag', () => expect(htmlToJsx('<img src="foo.png">')).toContain('<img src="foo.png" />'));
  it('converts boolean attributes', () => expect(htmlToJsx('<input disabled>')).toContain('disabled={true}'));
  it('converts HTML comments to JSX comments', () => expect(htmlToJsx('<!-- hello -->')).toContain('{/* hello */}'));
  it('leaves normal text unchanged', () => expect(htmlToJsx('<p>Hello</p>')).toContain('<p>Hello</p>'));
});
