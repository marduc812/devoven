import { applyOperation } from '@/Components/Functions/ArrayOpsTools/logic';

describe('applyOperation', () => {
  it('returns empty for empty input', () => {
    const result = applyOperation('', { operation: 'sort' });
    expect(result.items).toHaveLength(0);
    expect(result.count).toBe(0);
  });

  it('sorts alphabetically ascending', () => {
    const result = applyOperation('banana\napple\ncherry', { operation: 'sort', sortMode: 'alpha-asc' });
    expect(result.items).toEqual(['apple', 'banana', 'cherry']);
  });

  it('sorts alphabetically descending', () => {
    const result = applyOperation('banana\napple\ncherry', { operation: 'sort', sortMode: 'alpha-desc' });
    expect(result.items).toEqual(['cherry', 'banana', 'apple']);
  });

  it('sorts numerically ascending', () => {
    const result = applyOperation('10\n2\n30\n5', { operation: 'sort', sortMode: 'numeric-asc' });
    expect(result.items).toEqual(['2', '5', '10', '30']);
  });

  it('sorts by length ascending', () => {
    const result = applyOperation('bb\naaa\nc', { operation: 'sort', sortMode: 'length-asc' });
    expect(result.items[0]).toBe('c');
  });

  it('reverses items', () => {
    const result = applyOperation('a\nb\nc', { operation: 'reverse' });
    expect(result.items).toEqual(['c', 'b', 'a']);
  });

  it('deduplicates items', () => {
    const result = applyOperation('a\nb\na\nc\nb', { operation: 'deduplicate' });
    expect(result.items).toEqual(['a', 'b', 'c']);
    expect(result.count).toBe(3);
  });

  it('shuffles items (returns same count)', () => {
    const input = 'a\nb\nc\nd\ne';
    const result = applyOperation(input, { operation: 'shuffle' });
    expect(result.items).toHaveLength(5);
    expect(result.items.sort()).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('filters with regex', () => {
    const result = applyOperation('foo\nbar\nfoobar\nbaz', { operation: 'filter', filterRegex: '^foo' });
    expect(result.items).toEqual(['foo', 'foobar']);
  });

  it('returns error for invalid filter regex', () => {
    const result = applyOperation('a\nb', { operation: 'filter', filterRegex: '[invalid' });
    expect(result.error).not.toBeNull();
  });

  it('returns error for empty filter regex', () => {
    const result = applyOperation('a\nb', { operation: 'filter', filterRegex: '' });
    expect(result.error).not.toBeNull();
  });

  it('maps to uppercase', () => {
    const result = applyOperation('hello\nworld', { operation: 'map', mapOp: 'uppercase' });
    expect(result.items).toEqual(['HELLO', 'WORLD']);
  });

  it('maps to lowercase', () => {
    const result = applyOperation('HELLO\nWORLD', { operation: 'map', mapOp: 'lowercase' });
    expect(result.items).toEqual(['hello', 'world']);
  });

  it('wraps in double quotes', () => {
    const result = applyOperation('foo\nbar', { operation: 'map', mapOp: 'quote-double' });
    expect(result.items).toEqual(['"foo"', '"bar"']);
  });

  it('adds prefix', () => {
    const result = applyOperation('foo\nbar', { operation: 'map', mapOp: 'prefix', mapArg: 'https://' });
    expect(result.items).toEqual(['https://foo', 'https://bar']);
  });

  it('adds suffix', () => {
    const result = applyOperation('file1\nfile2', { operation: 'map', mapOp: 'suffix', mapArg: '.txt' });
    expect(result.items).toEqual(['file1.txt', 'file2.txt']);
  });

  it('slices first N', () => {
    const result = applyOperation('a\nb\nc\nd\ne', { operation: 'slice-first', sliceN: 3 });
    expect(result.items).toEqual(['a', 'b', 'c']);
  });

  it('slices last N', () => {
    const result = applyOperation('a\nb\nc\nd\ne', { operation: 'slice-last', sliceN: 2 });
    expect(result.items).toEqual(['d', 'e']);
  });

  it('joins with comma', () => {
    const result = applyOperation('a\nb\nc', { operation: 'sort', sortMode: 'alpha-asc', joinMode: 'comma' });
    expect(result.joined).toBe('a, b, c');
  });

  it('joins with pipe', () => {
    const result = applyOperation('a\nb', { operation: 'sort', joinMode: 'pipe' });
    expect(result.joined).toContain(' | ');
  });
});
