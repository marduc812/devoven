import { diffJson, formatDiffResults } from '@/Components/Functions/ExtraConverters4/logic';

describe('diffJson', () => {
  it('finds added key', () => {
    const diffs = diffJson('{"a":1}', '{"a":1,"b":2}');
    expect(diffs.some(d => d.type === 'added' && d.path === 'b')).toBe(true);
  });
  it('finds changed value', () => {
    const diffs = diffJson('{"a":1}', '{"a":2}');
    expect(diffs.some(d => d.type === 'changed')).toBe(true);
  });
  it('identical objects have no diff', () => {
    expect(diffJson('{"a":1}', '{"a":1}')).toHaveLength(0);
  });
  it('finds removed key', () => {
    const diffs = diffJson('{"a":1,"b":2}', '{"a":1}');
    expect(diffs.some(d => d.type === 'removed' && d.path === 'b')).toBe(true);
  });
  it('throws when input is empty', () => {
    expect(() => diffJson('', '{"a":1}')).toThrow('Both inputs required');
  });
  it('handles nested changes', () => {
    const diffs = diffJson('{"a":{"b":1}}', '{"a":{"b":2}}');
    expect(diffs.some(d => d.type === 'changed' && d.path === 'a.b')).toBe(true);
  });
});

describe('formatDiffResults', () => {
  it('returns identical message for empty diff', () => {
    expect(formatDiffResults([])).toContain('identical');
  });
  it('formats added entries with +', () => {
    const diffs = diffJson('{"a":1}', '{"a":1,"b":2}');
    expect(formatDiffResults(diffs)).toContain('+ b:');
  });
  it('formats removed entries with -', () => {
    const diffs = diffJson('{"a":1,"b":2}', '{"a":1}');
    expect(formatDiffResults(diffs)).toContain('- b:');
  });
  it('formats changed entries with ~', () => {
    const diffs = diffJson('{"a":1}', '{"a":2}');
    expect(formatDiffResults(diffs)).toContain('~ a:');
  });
});
