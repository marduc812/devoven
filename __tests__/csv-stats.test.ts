import { parseCsvRow, analyzeCsv } from '@/Components/Functions/CsvStatsTools/logic';

describe('parseCsvRow', () => {
  it('parses simple row', () => {
    expect(parseCsvRow('a,b,c')).toEqual(['a', 'b', 'c']);
  });

  it('handles quoted fields', () => {
    expect(parseCsvRow('"hello, world",b')).toEqual(['hello, world', 'b']);
  });

  it('handles escaped quotes', () => {
    expect(parseCsvRow('"say ""hi""",b')).toEqual(['say "hi"', 'b']);
  });

  it('handles empty fields', () => {
    expect(parseCsvRow('a,,c')).toEqual(['a', '', 'c']);
  });
});

describe('analyzeCsv', () => {
  const csv = `name,age,score\nAlice,30,95.5\nBob,25,87\nCharlie,,72`;

  it('detects row count', () => {
    const analysis = analyzeCsv(csv);
    expect(analysis.rowCount).toBe(3);
  });

  it('detects column count', () => {
    const analysis = analyzeCsv(csv);
    expect(analysis.columnCount).toBe(3);
  });

  it('detects numeric columns', () => {
    const analysis = analyzeCsv(csv);
    const ageCol = analysis.columns.find(c => c.name === 'age');
    expect(ageCol).toBeDefined();
    expect(ageCol!.type).toBe('number');
  });

  it('detects string columns', () => {
    const analysis = analyzeCsv(csv);
    const nameCol = analysis.columns.find(c => c.name === 'name');
    expect(nameCol!.type).toBe('string');
  });

  it('counts nulls correctly', () => {
    const analysis = analyzeCsv(csv);
    const ageCol = analysis.columns.find(c => c.name === 'age');
    expect(ageCol!.nullCount).toBe(1);
  });

  it('computes min and max for numeric column', () => {
    const analysis = analyzeCsv(csv);
    const ageCol = analysis.columns.find(c => c.name === 'age');
    expect(ageCol!.min).toBe(25);
    expect(ageCol!.max).toBe(30);
  });

  it('computes mean for numeric column', () => {
    const analysis = analyzeCsv(csv);
    const ageCol = analysis.columns.find(c => c.name === 'age');
    expect(ageCol!.mean).toBeCloseTo(27.5);
  });

  it('counts unique values', () => {
    const analysis = analyzeCsv(csv);
    const nameCol = analysis.columns.find(c => c.name === 'name');
    expect(nameCol!.uniqueCount).toBe(3);
  });
});
