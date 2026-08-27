import {
  parseDelimitedData,
  parseCsvLine,
  buildMarkdownTable,
  parseMarkdownTable,
  detectMdTableInput,
  processMdTable,
} from '@/Components/Functions/MdTableTools/logic';

describe('parseCsvLine', () => {
  it('splits simple CSV', () => {
    expect(parseCsvLine('a,b,c')).toEqual(['a', 'b', 'c']);
  });

  it('handles quoted fields', () => {
    expect(parseCsvLine('"hello, world",b')).toEqual(['hello, world', 'b']);
  });

  it('handles escaped quotes', () => {
    expect(parseCsvLine('"he said ""hi""",b')).toEqual(['he said "hi"', 'b']);
  });

  it('handles empty fields', () => {
    expect(parseCsvLine('a,,c')).toEqual(['a', '', 'c']);
  });
});

describe('parseDelimitedData', () => {
  it('parses CSV data', () => {
    const rows = parseDelimitedData('Name,Age\nAlice,30\nBob,25');
    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual(['Name', 'Age']);
    expect(rows[1]).toEqual(['Alice', '30']);
  });

  it('parses tab-delimited data', () => {
    const rows = parseDelimitedData('Name\tAge\nAlice\t30');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual(['Name', 'Age']);
  });

  it('skips empty lines', () => {
    const rows = parseDelimitedData('a,b\n\nc,d');
    expect(rows).toHaveLength(2);
  });
});

describe('buildMarkdownTable', () => {
  const rows = [
    ['Name', 'Language', 'Year'],
    ['TypeScript', 'Compiled', '2012'],
    ['Rust', 'Systems', '2010'],
  ];

  it('produces a table with header and separator', () => {
    const result = buildMarkdownTable(rows, 'left');
    const lines = result.split('\n');
    expect(lines).toHaveLength(4); // header + separator + 2 data rows
    expect(lines[1]).toContain('---');
    expect(lines[1]).toMatch(/^|\s*:?-+:?\s*\|/);
  });

  it('left-aligns with :---', () => {
    const result = buildMarkdownTable(rows, 'left');
    expect(result).toContain(':---');
  });

  it('center-aligns with colon on both sides', () => {
    const result = buildMarkdownTable(rows, 'center');
    // separator has colons on both sides (e.g. :------:)
    expect(result).toMatch(/:-+:/);
  });

  it('right-aligns with ---:', () => {
    const result = buildMarkdownTable(rows, 'right');
    expect(result).toMatch(/---:/);
  });

  it('no-alignment uses plain dashes', () => {
    const result = buildMarkdownTable(rows, 'none');
    const sepLine = result.split('\n')[1];
    expect(sepLine).not.toContain(':');
  });

  it('includes all cell values', () => {
    const result = buildMarkdownTable(rows, 'left');
    expect(result).toContain('TypeScript');
    expect(result).toContain('Rust');
    expect(result).toContain('Systems');
  });
});

describe('parseMarkdownTable', () => {
  const mdTable = `| Name       | Language | Year |
|:-----------|:---------|:-----|
| TypeScript | Compiled | 2012 |
| Rust       | Systems  | 2010 |`;

  it('parses markdown table to CSV', () => {
    const csv = parseMarkdownTable(mdTable);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(3); // header + 2 rows
    expect(lines[0]).toContain('Name');
    expect(lines[1]).toContain('TypeScript');
    expect(lines[2]).toContain('Rust');
  });

  it('throws on table with only 1 line', () => {
    expect(() => parseMarkdownTable('| Name |')).toThrow();
  });
});

describe('detectMdTableInput', () => {
  it('detects CSV input as csv-to-md', () => {
    expect(detectMdTableInput('Name,Age\nAlice,30')).toBe('csv-to-md');
  });

  it('detects markdown table as md-to-csv', () => {
    const md = '| Name | Age |\n|------|-----|\n| Alice | 30 |';
    expect(detectMdTableInput(md)).toBe('md-to-csv');
  });
});

describe('processMdTable', () => {
  it('processes CSV to markdown', () => {
    const result = processMdTable('Name,Age\nAlice,30', 'csv-to-md', 'left');
    expect(result).toContain('|');
    expect(result).toContain('Name');
    expect(result).toContain('Alice');
  });

  it('processes markdown to CSV', () => {
    const md = '| Name | Age |\n|------|-----|\n| Alice | 30 |';
    const result = processMdTable(md, 'md-to-csv', 'left');
    expect(result).toContain('Name');
    expect(result).toContain('Alice');
    expect(result).not.toContain('|');
  });

  it('returns empty for empty input', () => {
    expect(processMdTable('', 'auto', 'left')).toBe('');
  });

  it('auto-detects CSV direction', () => {
    const result = processMdTable('A,B\n1,2', 'auto', 'left');
    expect(result).toContain('|');
  });
});
