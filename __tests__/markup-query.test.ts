import {
  parseMarkup,
  serialize,
  textContent,
  descendantElements,
  nodePath,
  queryCss,
  evaluateXPath,
  runCssQuery,
  cssExtract,
  runXPathQuery,
  xpathExtract,
} from '@/Components/Functions/MarkupQueryTools/logic';

const HTML = `
<html>
  <body>
    <div id="main" class="wrap dark">
      <p class="lead">First <b>bold</b> line</p>
      <p>Second line</p>
      <ul>
        <li class="item" data-sku="A-1"><a href="/p/1">One</a></li>
        <li class="item sale" data-sku="A-2"><a href="/p/2">Two</a></li>
        <li class="item" data-sku="B-7"><a href="/p/3">Three</a></li>
      </ul>
      <!-- a comment -->
      <img src="/x.png" alt="x">
    </div>
  </body>
</html>`;

const XML = `<catalog>
  <book id="bk101" lang="en"><author>Gambardella</author><title>Guide</title><price>44.95</price></book>
  <book id="bk102" lang="en"><author>Ralls</author><title>Midnight Rain</title><price>5.95</price></book>
  <book id="bk103" lang="fr"><author>Corets</author><title>Maeve</title><price>5.95</price></book>
</catalog>`;

const css = (selector: string) => queryCss(parseMarkup(HTML, 'html'), selector);
const names = (selector: string) => css(selector).map((n) => n.name);
const texts = (selector: string) => css(selector).map((n) => textContent(n).trim());

describe('parseMarkup', () => {
  it('builds a tree with parents and attributes', () => {
    const root = parseMarkup(HTML, 'html');
    const main = descendantElements(root).find((n) => n.attributes.id === 'main')!;
    expect(main.name).toBe('div');
    expect(main.attributes.class).toBe('wrap dark');
    expect(main.parent!.name).toBe('body');
  });

  it('closes void elements without swallowing what follows', () => {
    const root = parseMarkup('<p>a<br>b</p><p>c</p>', 'html');
    expect(descendantElements(root).map((n) => n.name)).toEqual(['p', 'br', 'p']);
    expect(textContent(root)).toBe('abc');
  });

  it('treats script and style content as text, not markup', () => {
    const root = parseMarkup('<div><script>if (a<b) { x(); }</script><p>after</p></div>', 'html');
    expect(descendantElements(root).map((n) => n.name)).toEqual(['div', 'script', 'p']);
  });

  it('keeps comments and CDATA apart from text', () => {
    const root = parseMarkup('<a><!--note--><![CDATA[raw < text]]>tail</a>', 'xml');
    const kinds = root.children[0].children.map((c) => c.kind);
    expect(kinds).toEqual(['comment', 'cdata', 'text']);
    expect(textContent(root)).toBe('raw < texttail');
  });

  it('recovers from an unclosed tag rather than throwing', () => {
    const root = parseMarkup('<ul><li>a<li>b</ul>', 'html');
    expect(descendantElements(root).map((n) => n.name)).toEqual(['ul', 'li', 'li']);
  });

  it('decodes entities in text and in attribute values', () => {
    const root = parseMarkup('<a title="a &amp; b">x &lt; y</a>', 'html');
    expect(root.children[0].attributes.title).toBe('a & b');
    expect(textContent(root)).toBe('x < y');
  });

  it('keeps case in XML and folds it in HTML', () => {
    expect(parseMarkup('<Book/>', 'xml').children[0].name).toBe('Book');
    expect(parseMarkup('<DIV></DIV>', 'html').children[0].name).toBe('div');
  });

  it('serializes back to markup', () => {
    expect(serialize(parseMarkup('<p class="a">x<br>y</p>', 'html'), 'html'))
      .toBe('<p class="a">x<br>y</p>');
    expect(serialize(parseMarkup('<a><b/></a>', 'xml'), 'xml')).toBe('<a><b/></a>');
  });

  it('describes where a node sits', () => {
    const second = css('li')[1];
    expect(nodePath(second)).toBe('/html/body/div/ul/li[2]');
  });
});

describe('queryCss', () => {
  it('matches by tag, id, class and the universal selector', () => {
    expect(names('p')).toEqual(['p', 'p']);
    expect(names('#main')).toEqual(['div']);
    expect(names('.sale')).toEqual(['li']);
    expect(css('*').length).toBeGreaterThan(10);
  });

  it('matches a compound selector', () => {
    expect(css('li.item.sale').length).toBe(1);
    expect(css('p.lead').length).toBe(1);
    expect(css('div.wrap.dark#main').length).toBe(1);
  });

  it('handles every attribute operator', () => {
    expect(css('[data-sku]').length).toBe(3);
    expect(css('[data-sku="A-1"]').length).toBe(1);
    expect(css('[data-sku^="A"]').length).toBe(2);
    expect(css('[data-sku$="7"]').length).toBe(1);
    expect(css('[data-sku*="-"]').length).toBe(3);
    expect(css('[class~="sale"]').length).toBe(1);
    expect(css('[data-sku|="A"]').length).toBe(2);
    expect(css('[data-sku="a-1" i]').length).toBe(1);
  });

  it('handles the four combinators', () => {
    expect(texts('ul > li > a')).toEqual(['One', 'Two', 'Three']);
    expect(css('div a').length).toBe(3);
    expect(css('li.item + li').length).toBe(2);
    expect(css('p.lead ~ ul').length).toBe(1);
    expect(css('p.lead + p').length).toBe(1);
  });

  it('handles a selector list', () => {
    expect(css('p, img').length).toBe(3);
  });

  it('handles structural pseudo-classes', () => {
    expect(texts('li:first-child')).toEqual(['One']);
    expect(texts('li:last-child')).toEqual(['Three']);
    expect(texts('li:nth-child(2)')).toEqual(['Two']);
    expect(texts('li:nth-child(odd)')).toEqual(['One', 'Three']);
    expect(texts('li:nth-child(2n)')).toEqual(['Two']);
    expect(texts('li:nth-last-child(1)')).toEqual(['Three']);
    expect(css('p:first-of-type').length).toBe(1);
  });

  it('handles :not, :is and :has', () => {
    expect(css('li:not(.sale)').length).toBe(2);
    expect(css(':is(p, img)').length).toBe(3);
    expect(css('div:has(> ul)').length).toBe(1);
    expect(css('li:has(a)').length).toBe(3);
  });

  it('supports the non-standard :contains people reach for', () => {
    expect(texts('li:contains("Two")')).toEqual(['Two']);
  });

  it('reports a selector it cannot read', () => {
    expect(() => css('li >')).toThrow('cannot end with');
    expect(() => css('> li')).toThrow('cannot start with');
    expect(() => css('li:hover')).toThrow('not supported');
    expect(() => css('')).toThrow();
  });
});

describe('evaluateXPath', () => {
  const run = (expression: string) => {
    const result = evaluateXPath(parseMarkup(XML, 'xml'), expression);
    if (result.type !== 'nodes') return result.value;
    return result.items.map((item) => (item.kind === 'attribute' ? item.value : textContent(item.node)));
  };

  it('walks absolute and descendant paths', () => {
    expect(run('/catalog/book/title')).toEqual(['Guide', 'Midnight Rain', 'Maeve']);
    expect(run('//title')).toEqual(['Guide', 'Midnight Rain', 'Maeve']);
    expect(run('//book/*[1]')).toEqual(['Gambardella', 'Ralls', 'Corets']);
  });

  it('reads attributes', () => {
    expect(run('//book/@id')).toEqual(['bk101', 'bk102', 'bk103']);
    expect(run('//@lang')).toEqual(['en', 'en', 'fr']);
    expect(run('//book[@id="bk102"]/title')).toEqual(['Midnight Rain']);
  });

  it('filters with positional predicates', () => {
    expect(run('//book[1]/title')).toEqual(['Guide']);
    expect(run('//book[last()]/title')).toEqual(['Maeve']);
    expect(run('//book[position() < 3]/@id')).toEqual(['bk101', 'bk102']);
  });

  it('filters with comparisons on element values', () => {
    expect(run('//book[price > 10]/title')).toEqual(['Guide']);
    expect(run('//book[price = 5.95]/@id')).toEqual(['bk102', 'bk103']);
    expect(run('//book[@lang != "en"]/@id')).toEqual(['bk103']);
  });

  it('supports the common string functions', () => {
    expect(run('//book[contains(title, "Rain")]/@id')).toEqual(['bk102']);
    expect(run('//book[starts-with(@id, "bk10")]/@id')).toEqual(['bk101', 'bk102', 'bk103']);
    expect(run('count(//book)')).toBe(3);
    expect(run('string-length(//title)')).toBe(5);
    expect(run('normalize-space("  a   b  ")')).toBe('a b');
    expect(run('concat(//book[1]/@id, "-", //book[2]/@id)')).toBe('bk101-bk102');
    expect(run('substring("abcdef", 2, 3)')).toBe('bcd');
    expect(run('upper-case(//book[1]/@id)')).toBe('BK101');
  });

  it('supports boolean operators and not()', () => {
    expect(run('//book[@lang="en" and price > 10]/@id')).toEqual(['bk101']);
    expect(run('//book[@lang="fr" or price > 10]/@id')).toEqual(['bk101', 'bk103']);
    expect(run('//book[not(@lang="en")]/@id')).toEqual(['bk103']);
    expect(run('//book[1]/@id = "bk101"')).toBe(true);
  });

  it('supports the axes it advertises', () => {
    expect(run('//title/parent::book/@id')).toEqual(['bk101', 'bk102', 'bk103']);
    expect(run('//book[2]/preceding-sibling::book/@id')).toEqual(['bk101']);
    expect(run('//book[1]/following-sibling::book/@id')).toEqual(['bk102', 'bk103']);
    expect(run('//price/ancestor::catalog/@id')).toEqual([]);
    expect(run('//book[1]/child::title')).toEqual(['Guide']);
    expect(run('//book[1]/descendant::text()')).toEqual(['Gambardella', 'Guide', '44.95']);
  });

  it('supports text() and node unions', () => {
    expect(run('//title/text()')).toEqual(['Guide', 'Midnight Rain', 'Maeve']);
    expect(run('//book[1]/title | //book[1]/price')).toEqual(['Guide', '44.95']);
  });

  it('reports an expression it cannot read', () => {
    expect(() => evaluateXPath(parseMarkup(XML, 'xml'), '//book[')).toThrow();
    expect(() => evaluateXPath(parseMarkup(XML, 'xml'), '//book/nope::x')).toThrow('not supported');
    expect(() => evaluateXPath(parseMarkup(XML, 'xml'), 'bogus(1)')).toThrow('not supported');
    expect(() => evaluateXPath(parseMarkup(XML, 'xml'), '   ')).toThrow('Enter an XPath');
  });
});

describe('the tool entry points', () => {
  it('renders CSS matches in each output shape', () => {
    expect(runCssQuery(HTML, 'li a', { output: 'text' }).rows).toEqual(['One', 'Two', 'Three']);
    expect(runCssQuery(HTML, 'li a', { output: 'attribute', attribute: 'href' }).rows)
      .toEqual(['/p/1', '/p/2', '/p/3']);
    expect(runCssQuery(HTML, 'p.lead', { output: 'markup' }).rows[0])
      .toBe('<p class="lead">First <b>bold</b> line</p>');
    expect(runCssQuery(HTML, 'li.sale', { output: 'path' }).rows).toEqual(['/html/body/div/ul/li[2]']);
    expect(JSON.parse(runCssQuery(HTML, 'li.sale', { output: 'json' }).rows[0]).attributes['data-sku'])
      .toBe('A-2');
  });

  it('collapses whitespace in text output unless told not to', () => {
    expect(runCssQuery('<p>  a\n  b  </p>', 'p').rows).toEqual(['a b']);
    expect(runCssQuery('<p>  a\n  b  </p>', 'p', { trim: false }).rows).toEqual(['  a\n  b  ']);
  });

  it('throws for the pipeline when nothing matched', () => {
    expect(() => cssExtract(HTML, '.missing')).toThrow('Nothing matched');
    expect(cssExtract(HTML, 'li a')).toBe('One\nTwo\nThree');
  });

  it('renders XPath results, including scalars', () => {
    expect(runXPathQuery(XML, '//title', { mode: 'xml' }).rows).toEqual(['Guide', 'Midnight Rain', 'Maeve']);
    const counted = runXPathQuery(XML, 'count(//book)', { mode: 'xml' });
    expect(counted.type).toBe('number');
    expect(counted.rows).toEqual(['3']);
    expect(xpathExtract(XML, '//book/@id', { mode: 'xml' })).toBe('bk101\nbk102\nbk103');
    expect(() => xpathExtract(XML, '//missing', { mode: 'xml' })).toThrow('Nothing matched');
  });
});
