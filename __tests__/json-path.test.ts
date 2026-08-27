import {
  evaluateJsonPath,
  formatJsonPathResults,
} from '../Components/Functions/JsonPathTools/logic';

const sampleJson = JSON.stringify({
  store: {
    book: [
      { title: 'Sayings of the Century', price: 8.95, author: 'Nigel Rees' },
      { title: 'Sword of Honour', price: 12.99, author: 'Evelyn Waugh' },
      { title: 'Moby Dick', price: 8.99, author: 'Herman Melville' },
    ],
    bicycle: { color: 'red', price: 19.95 },
  },
});

// ─── evaluateJsonPath ─────────────────────────────────────────────────────────

describe('evaluateJsonPath', () => {
  it('returns root when path is $', () => {
    const results = evaluateJsonPath('{"a":1}', '$');
    expect(results).toHaveLength(1);
    expect(results[0].path).toBe('$');
    expect(results[0].value).toEqual({ a: 1 });
  });

  it('navigates child key with dot notation', () => {
    const results = evaluateJsonPath('{"a":{"b":42}}', '$.a.b');
    expect(results).toHaveLength(1);
    expect(results[0].value).toBe(42);
  });

  it('accesses array by index', () => {
    const results = evaluateJsonPath('{"arr":[10,20,30]}', '$.arr[1]');
    expect(results).toHaveLength(1);
    expect(results[0].value).toBe(20);
  });

  it('handles [*] on arrays', () => {
    const results = evaluateJsonPath(sampleJson, '$.store.book[*].title');
    expect(results).toHaveLength(3);
    expect(results.map(r => r.value)).toEqual([
      'Sayings of the Century',
      'Sword of Honour',
      'Moby Dick',
    ]);
  });

  it('filters array items by property value', () => {
    const results = evaluateJsonPath(sampleJson, '$.store.book[?(@.price < 10)].title');
    expect(results).toHaveLength(2);
    const titles = results.map(r => r.value);
    expect(titles).toContain('Sayings of the Century');
    expect(titles).toContain('Moby Dick');
  });

  it('filter by property existence', () => {
    const results = evaluateJsonPath(
      JSON.stringify([{ a: 1 }, { b: 2 }, { a: 3 }]),
      '$[?(@.a)]',
    );
    expect(results).toHaveLength(2);
  });

  it('throws when path does not start with $', () => {
    expect(() => evaluateJsonPath('{}', '.foo')).toThrow('JSONPath must start with $');
  });

  it('throws on invalid JSON', () => {
    expect(() => evaluateJsonPath('not json', '$.foo')).toThrow();
  });

  it('returns empty array when key not found', () => {
    const results = evaluateJsonPath('{"a":1}', '$.b');
    expect(results).toHaveLength(0);
  });
});

// ─── formatJsonPathResults ────────────────────────────────────────────────────

describe('formatJsonPathResults', () => {
  it('returns "No matches found" for empty array', () => {
    expect(formatJsonPathResults([])).toBe('No matches found');
  });

  it('formats single result', () => {
    const result = formatJsonPathResults([{ path: "$['a']", value: 42 }]);
    expect(result).toContain("[0] $['a']");
    expect(result).toContain('42');
  });

  it('formats multiple results with index', () => {
    const result = formatJsonPathResults([
      { path: "$['a']", value: 1 },
      { path: "$['b']", value: 2 },
    ]);
    expect(result).toContain('[0]');
    expect(result).toContain('[1]');
  });
});
