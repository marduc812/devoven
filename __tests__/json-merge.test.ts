import { deepMerge, mergeJsonStrings } from '@/Components/Functions/JsonMergeTools/logic';

describe('deepMerge', () => {
  it('merges two flat objects', () => {
    const r = deepMerge({ a: 1 }, { b: 2 });
    expect(r).toEqual({ a: 1, b: 2 });
  });
  it('source overwrites target on conflict', () => {
    const r = deepMerge({ a: 1 }, { a: 2 });
    expect(r.a).toBe(2);
  });
  it('deep merges nested objects', () => {
    const r = deepMerge({ x: { a: 1, b: 2 } }, { x: { b: 99, c: 3 } });
    expect(r.x).toEqual({ a: 1, b: 99, c: 3 });
  });
  it('does not deep merge arrays', () => {
    const r = deepMerge({ arr: [1, 2] }, { arr: [3, 4] });
    expect(r.arr).toEqual([3, 4]);
  });
  it('handles empty objects', () => {
    expect(deepMerge({}, { a: 1 })).toEqual({ a: 1 });
    expect(deepMerge({ a: 1 }, {})).toEqual({ a: 1 });
  });
});

describe('mergeJsonStrings', () => {
  it('merges two JSON objects', () => {
    const r = mergeJsonStrings('{"a":1}', '{"b":2}');
    const parsed = JSON.parse(r);
    expect(parsed).toEqual({ a: 1, b: 2 });
  });
  it('throws for invalid JSON', () => expect(() => mergeJsonStrings('not json', '{}')).toThrow());
  it('throws for non-object JSON', () => expect(() => mergeJsonStrings('[1,2]', '{}')).toThrow());
  it('returns formatted JSON', () => {
    const r = mergeJsonStrings('{"a":1}', '{"b":2}');
    expect(r).toContain('\n');
  });
});
