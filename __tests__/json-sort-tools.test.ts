import { sortJsonKeys, sortJsonKeysMinified, sortJson } from '../Components/Functions/JsonSortTools/logic';

describe('sortJsonKeys', () => {
  it('sorts keys alphabetically', () => {
    const input = '{"z":1,"a":2,"m":3}';
    const result = sortJsonKeys(input);
    const parsed = JSON.parse(result);
    expect(Object.keys(parsed)).toEqual(['a', 'm', 'z']);
  });

  it('sorts nested object keys', () => {
    const input = '{"b":{"y":1,"x":2},"a":3}';
    const result = sortJsonKeys(input);
    const parsed = JSON.parse(result);
    expect(Object.keys(parsed)).toEqual(['a', 'b']);
    expect(Object.keys(parsed.b)).toEqual(['x', 'y']);
  });

  it('handles arrays without sorting them', () => {
    const input = '{"b":[3,1,2],"a":1}';
    const result = sortJsonKeys(input);
    const parsed = JSON.parse(result);
    expect(Object.keys(parsed)).toEqual(['a', 'b']);
    expect(parsed.b).toEqual([3, 1, 2]);
  });

  it('returns empty string for empty input', () => {
    expect(sortJsonKeys('')).toBe('');
    expect(sortJsonKeys('  ')).toBe('');
  });

  it('throws on invalid JSON', () => {
    expect(() => sortJsonKeys('not json')).toThrow();
  });

  it('handles null values', () => {
    const result = JSON.parse(sortJsonKeys('{"b":null,"a":1}'));
    expect(result.b).toBeNull();
  });
});

describe('sortJsonKeysMinified', () => {
  it('sorts and minifies', () => {
    const input = '{"z": 1, "a": 2}';
    const result = sortJsonKeysMinified(input);
    expect(result).toBe('{"a":2,"z":1}');
  });
});

describe('sortJson', () => {
  it('returns sorted JSON, key count, and depth', () => {
    const result = sortJson('{"b":{"y":1},"a":2}');
    expect(JSON.parse(result.sorted)).toEqual({ a: 2, b: { y: 1 } });
    expect(result.keyCount).toBeGreaterThan(0);
    expect(result.depth).toBeGreaterThan(0);
  });

  it('throws on empty input', () => {
    expect(() => sortJson('')).toThrow();
    expect(() => sortJson('   ')).toThrow();
  });

  it('throws on invalid JSON', () => {
    expect(() => sortJson('{bad}')).toThrow();
  });
});
