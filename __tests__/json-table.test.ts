import { jsonToAsciiTable } from '@/Components/Functions/JsonTableTools/logic';
describe('jsonToAsciiTable', () => {
  const json = '[{"name":"Alice","age":30},{"name":"Bob","age":25}]';
  it('creates a table with headers', () => { const r = jsonToAsciiTable(json); expect(r).toContain('name'); expect(r).toContain('age'); });
  it('contains the data values', () => { const r = jsonToAsciiTable(json); expect(r).toContain('Alice'); expect(r).toContain('Bob'); });
  it('has border characters', () => { const r = jsonToAsciiTable(json); expect(r).toContain('+'); expect(r).toContain('|'); });
  it('throws for non-array', () => expect(() => jsonToAsciiTable('{"key":"value"}')).toThrow());
  it('handles empty array', () => expect(jsonToAsciiTable('[]')).toBe('(empty array)'));
  it('throws for invalid JSON', () => expect(() => jsonToAsciiTable('not json')).toThrow());
});
