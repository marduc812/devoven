import { csvToJson, jsonToCsv, parseCsvRow, detectInputType } from '../Components/Functions/CsvJsonTools/logic';

describe('parseCsvRow', () => {
  it('parses simple comma-separated values', () => {
    expect(parseCsvRow('a,b,c')).toEqual(['a', 'b', 'c']);
  });

  it('parses quoted field with comma inside', () => {
    expect(parseCsvRow('"hello, world",b')).toEqual(['hello, world', 'b']);
  });

  it('parses escaped double quotes', () => {
    expect(parseCsvRow('"he said ""hi"""')).toEqual(['he said "hi"']);
  });

  it('parses empty fields', () => {
    expect(parseCsvRow('a,,c')).toEqual(['a', '', 'c']);
  });
});

describe('csvToJson', () => {
  it('converts simple CSV to JSON', () => {
    const csv = 'name,age\nAlice,30\nBob,25';
    const result = JSON.parse(csvToJson(csv));
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Alice');
    expect(result[0].age).toBe('30');
  });

  it('returns empty array for CSV with only header', () => {
    const csv = 'name,age';
    const result = JSON.parse(csvToJson(csv));
    expect(result).toHaveLength(0);
  });

  it('handles quoted fields', () => {
    const csv = 'name,bio\nAlice,"Likes cats, dogs"';
    const result = JSON.parse(csvToJson(csv));
    expect(result[0].bio).toBe('Likes cats, dogs');
  });
});

describe('jsonToCsv', () => {
  it('converts JSON array to CSV', () => {
    const json = JSON.stringify([{ name: 'Alice', age: 30 }, { name: 'Bob', age: 25 }]);
    const result = jsonToCsv(json);
    const lines = result.split('\n');
    expect(lines[0]).toContain('name');
    expect(lines[0]).toContain('age');
    expect(lines[1]).toContain('Alice');
  });

  it('returns error for invalid JSON', () => {
    expect(jsonToCsv('not json')).toContain('Error');
  });

  it('returns error for non-array JSON', () => {
    expect(jsonToCsv('{"key":"val"}')).toContain('Error');
  });

  it('wraps values with commas in quotes', () => {
    const json = JSON.stringify([{ name: 'Alice, Jr.' }]);
    const result = jsonToCsv(json);
    expect(result).toContain('"Alice, Jr."');
  });

  it('returns empty string for empty array', () => {
    expect(jsonToCsv('[]')).toBe('');
  });
});

describe('detectInputType', () => {
  it('detects JSON array', () => {
    expect(detectInputType('[{"a":1}]')).toBe('json');
  });

  it('detects JSON object', () => {
    expect(detectInputType('{"a":1}')).toBe('json');
  });

  it('detects CSV', () => {
    expect(detectInputType('name,age\nAlice,30')).toBe('csv');
  });
});
