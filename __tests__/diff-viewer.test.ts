import { diffTexts, diffToString } from '@/Components/Functions/TextDiffTools/logic';

describe('diffTexts', () => {
  it('returns empty array for empty input', () => {
    expect(diffTexts('')).toEqual([]);
  });

  it('returns hint when no separator is found', () => {
    const result = diffTexts('line1\nline2');
    expect(result).toHaveLength(1);
    expect(result[0].text).toContain('---');
  });

  it('shows unchanged lines when both texts are identical', () => {
    const input = 'hello\nworld\n---\nhello\nworld';
    const result = diffTexts(input);
    expect(result.every(l => l.type === 'unchanged')).toBe(true);
    expect(result.map(l => l.text)).toEqual(['hello', 'world']);
  });

  it('marks added lines', () => {
    const input = 'hello\n---\nhello\nworld';
    const result = diffTexts(input);
    const added = result.filter(l => l.type === 'added');
    expect(added).toHaveLength(1);
    expect(added[0].text).toBe('world');
  });

  it('marks removed lines', () => {
    const input = 'hello\nworld\n---\nhello';
    const result = diffTexts(input);
    const removed = result.filter(l => l.type === 'removed');
    expect(removed).toHaveLength(1);
    expect(removed[0].text).toBe('world');
  });

  it('handles completely different texts', () => {
    const input = 'aaa\n---\nbbb';
    const result = diffTexts(input);
    const types = result.map(l => l.type);
    expect(types).toContain('removed');
    expect(types).toContain('added');
  });

  it('handles empty original', () => {
    const input = '\n---\nhello\nworld';
    const result = diffTexts(input);
    const added = result.filter(l => l.type === 'added');
    expect(added).toHaveLength(2);
  });

  it('handles empty modified', () => {
    const input = 'hello\nworld\n---\n';
    const result = diffTexts(input);
    const removed = result.filter(l => l.type === 'removed');
    expect(removed).toHaveLength(2);
  });
});

describe('diffToString', () => {
  it('returns empty string for empty array', () => {
    expect(diffToString([])).toBe('');
  });

  it('prefixes added lines with + ', () => {
    const result = diffToString([{ type: 'added', text: 'hello' }]);
    expect(result).toBe('+ hello');
  });

  it('prefixes removed lines with - ', () => {
    const result = diffToString([{ type: 'removed', text: 'hello' }]);
    expect(result).toBe('- hello');
  });

  it('prefixes unchanged lines with two spaces', () => {
    const result = diffToString([{ type: 'unchanged', text: 'hello' }]);
    expect(result).toBe('  hello');
  });

  it('formats mixed diff output correctly', () => {
    const lines = [
      { type: 'unchanged' as const, text: 'a' },
      { type: 'removed' as const, text: 'b' },
      { type: 'added' as const, text: 'c' },
    ];
    const result = diffToString(lines);
    expect(result).toBe('  a\n- b\n+ c');
  });
});
