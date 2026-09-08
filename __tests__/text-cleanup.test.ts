import {
  removeDiacritics,
  listDiacritics,
  stripAnsi,
  listAnsi,
  decodeHtmlEntities,
  stripHtmlTags,
  padLines,
} from '@/Components/Functions/TextCleanupTools/logic';

const ESC = '\x1b';

describe('removeDiacritics', () => {
  it('strips combining marks', () => {
    expect(removeDiacritics('Crème Brûlée')).toBe('Creme Brulee');
    expect(removeDiacritics('naïve café résumé')).toBe('naive cafe resume');
  });

  it('handles marks that were already decomposed', () => {
    expect(removeDiacritics('école')).toBe('ecole');
  });

  it('leaves non-decomposing letters alone in marks mode', () => {
    expect(removeDiacritics('Straße Ærø')).toBe('Straße Ærø');
  });

  it('transliterates them in fold mode', () => {
    expect(removeDiacritics('Straße', 'fold')).toBe('Strasse');
    expect(removeDiacritics('Ærø', 'fold')).toBe('AEro');
    expect(removeDiacritics('Łódź', 'fold')).toBe('Lodz');
  });

  it('leaves unmarked scripts untouched and strips marks in the ones that have them', () => {
    expect(removeDiacritics('日本語 привет')).toBe('日本語 привет');
    expect(removeDiacritics('Ελληνικά')).toBe('Ελληνικα');
  });

  it('lists what changed', () => {
    const report = listDiacritics('café');
    expect(report).toContain('1 accented character');
    expect(report).toContain('U+00E9');
  });

  it('says so when nothing changed', () => {
    expect(listDiacritics('plain ascii')).toBe('No accented characters found.');
  });
});

describe('stripAnsi', () => {
  it('removes SGR colour codes', () => {
    expect(stripAnsi(`${ESC}[31mred${ESC}[0m`)).toBe('red');
    expect(stripAnsi(`${ESC}[1;33;40mwarn${ESC}[m`)).toBe('warn');
  });

  it('removes cursor movement and erase sequences', () => {
    expect(stripAnsi(`a${ESC}[2Jb${ESC}[1;1Hc`)).toBe('abc');
  });

  it('removes OSC sequences closed by BEL or ST', () => {
    expect(stripAnsi(`${ESC}]0;window title\x07done`)).toBe('done');
    expect(stripAnsi(`${ESC}]8;;https://example.com${ESC}\\link`)).toBe('link');
  });

  it('keeps tabs and newlines but can drop other control bytes', () => {
    expect(stripAnsi('a\tb\nc\x00d')).toBe('a\tb\nc\x00d');
    expect(stripAnsi('a\tb\nc\x00d', true)).toBe('a\tb\ncd');
  });

  it('leaves text without escapes untouched', () => {
    expect(stripAnsi('[31m is not an escape')).toBe('[31m is not an escape');
  });

  it('reports the sequences it finds', () => {
    const report = listAnsi(`${ESC}[31ma${ESC}[31mb${ESC}[0m`);
    expect(report).toContain('3 sequences, 2 distinct');
    expect(report).toContain('red');
    expect(report).toContain('reset');
  });

  it('says so when there are none', () => {
    expect(listAnsi('nothing here')).toBe('No ANSI escape sequences found.');
  });
});

describe('stripHtmlTags', () => {
  it('removes tags and keeps the text', () => {
    expect(stripHtmlTags('<p>Hello <b>world</b></p>')).toBe('Hello world');
  });

  it('drops script and style bodies', () => {
    expect(stripHtmlTags('<style>p{color:red}</style><p>hi</p><script>alert(1)</script>')).toBe('hi');
  });

  it('drops comments and processing instructions', () => {
    expect(stripHtmlTags('<!-- note --><p>a</p><?php echo 1; ?>')).toBe('a');
  });

  it('turns block closers into line breaks', () => {
    expect(stripHtmlTags('<li>one</li><li>two</li>')).toBe('one\ntwo');
    expect(stripHtmlTags('a<br>b')).toBe('a\nb');
  });

  it('can leave the breaks out', () => {
    expect(stripHtmlTags('<li>one</li><li>two</li>', { keepBreaks: false })).toBe('onetwo');
  });

  it('decodes entities once the markup is gone', () => {
    expect(stripHtmlTags('<p>a &amp; b &lt;c&gt; &#65; &#x42;</p>')).toBe('a & b <c> A B');
    expect(stripHtmlTags('<p>a &amp; b</p>', { decodeEntities: false })).toBe('a &amp; b');
  });

  it('leaves an unknown entity alone', () => {
    expect(decodeHtmlEntities('&notreal; &amp;')).toBe('&notreal; &');
  });

  it('collapses the whitespace stripping leaves behind', () => {
    expect(stripHtmlTags('<div>\n  <p>  a  </p>\n\n\n  <p>b</p>\n</div>')).toBe('a\n\nb');
  });

  it('is not fooled by a > inside an attribute value it does not own', () => {
    expect(stripHtmlTags('<a href="/x" title="a">link</a>')).toBe('link');
  });
});

describe('padLines', () => {
  it('pads on the right by default', () => {
    expect(padLines('ab\ncde', { width: 5 })).toBe('ab   \ncde  ');
  });

  it('pads on the left', () => {
    expect(padLines('7\n42', { width: 4, side: 'left', fill: '0' })).toBe('0007\n0042');
  });

  it('centres with the odd character on the right', () => {
    expect(padLines('ab', { width: 5, side: 'both', fill: '.' })).toBe('.ab..');
  });

  it('leaves longer lines alone unless asked to cut them', () => {
    expect(padLines('abcdef', { width: 3 })).toBe('abcdef');
    expect(padLines('abcdef', { width: 3, truncate: true })).toBe('abc');
  });

  it('counts code points, not UTF-16 units', () => {
    expect(padLines('😀', { width: 3, fill: '-' })).toBe('😀--');
  });

  it('uses only the first character of a longer fill', () => {
    expect(padLines('a', { width: 3, fill: 'xy' })).toBe('axx');
  });

  it('rejects a width that is not a number', () => {
    expect(() => padLines('a', { width: NaN })).toThrow('Width must be a positive number');
    expect(() => padLines('a', { width: -1 })).toThrow('Width must be a positive number');
    expect(() => padLines('a', { width: 20001 })).toThrow('Width must be 10000 or less');
  });
});
