import {
  SET_OPERATIONS,
  SetOperation,
  applySetOperation,
  isSeparator,
  isSetOperation,
  joinItems,
  operationHint,
  operationLabel,
  operationSymbol,
  splitItems,
} from '@/Components/Functions/SetOpsTools/logic';
import { OPERATION_MAP } from '@/lib/blocks/registry';

const A = 'apple\nbanana\ncherry';
const B = 'banana\ncherry\ndate';

const run = (op: SetOperation, a = A, b = B, options = {}) =>
  applySetOperation(a, b, op, options).items;

describe('the five operations', () => {
  it('unions, keeping A first and each item once', () => {
    expect(run('union')).toEqual(['apple', 'banana', 'cherry', 'date']);
  });

  it('intersects', () => {
    expect(run('intersection')).toEqual(['banana', 'cherry']);
  });

  it('subtracts in both directions', () => {
    expect(run('difference')).toEqual(['apple']);
    expect(run('reverse-difference')).toEqual(['date']);
  });

  it('takes the symmetric difference as A-only then B-only', () => {
    expect(run('symmetric-difference')).toEqual(['apple', 'date']);
  });

  it('keeps first-seen order rather than sorting', () => {
    expect(run('union', 'zebra\nalpha', 'monkey')).toEqual(['zebra', 'alpha', 'monkey']);
  });

  it('sorts when asked', () => {
    expect(run('union', 'zebra\nalpha', 'monkey', { sort: true })).toEqual([
      'alpha',
      'monkey',
      'zebra',
    ]);
  });
});

describe('lists that are not sets yet', () => {
  it('folds repeats away and counts them', () => {
    const result = applySetOperation('a\nb\na\na', 'b\nb', 'union');
    expect(result.items).toEqual(['a', 'b']);
    expect(result.counts.duplicatesA).toBe(2);
    expect(result.counts.duplicatesB).toBe(1);
    expect(result.counts.a).toBe(2);
    expect(result.counts.b).toBe(1);
  });

  it('drops blank lines and trims each item', () => {
    expect(splitItems('  a  \n\n  b\n   \n')).toEqual(['a', 'b']);
  });

  it('leaves whitespace alone when trimming is off', () => {
    expect(splitItems('  a  \nb', { trim: false })).toEqual(['  a  ', 'b']);
  });

  it('treats an empty list as the empty set', () => {
    expect(run('union', '', B)).toEqual(['banana', 'cherry', 'date']);
    expect(run('intersection', '', B)).toEqual([]);
    expect(run('difference', A, '')).toEqual(['apple', 'banana', 'cherry']);
  });
});

describe('case sensitivity', () => {
  it('separates Apple from apple by default', () => {
    expect(run('intersection', 'Apple', 'apple')).toEqual([]);
    expect(run('union', 'Apple', 'apple')).toEqual(['Apple', 'apple']);
  });

  it('folds them together when asked, keeping the casing A used', () => {
    const options = { caseSensitive: false };
    expect(run('intersection', 'Apple', 'apple', options)).toEqual(['Apple']);
    expect(run('union', 'Apple', 'apple', options)).toEqual(['Apple']);
    expect(run('difference', 'Apple', 'apple', options)).toEqual([]);
  });

  it('dedupes case-insensitively too', () => {
    const result = applySetOperation('a\nA\nA', '', 'union', { caseSensitive: false });
    expect(result.items).toEqual(['a']);
    expect(result.counts.duplicatesA).toBe(2);
  });
});

describe('separators', () => {
  it('splits and joins on the same separator', () => {
    const result = applySetOperation('a, b, c', 'b, d', 'union', { separator: 'comma' });
    expect(result.items).toEqual(['a', 'b', 'c', 'd']);
    expect(result.joined).toBe('a, b, c, d');
  });

  it('handles space, semicolon and tab lists', () => {
    expect(splitItems('a  b   c', { separator: 'space' })).toEqual(['a', 'b', 'c']);
    expect(splitItems('a; b ;c', { separator: 'semicolon' })).toEqual(['a', 'b', 'c']);
    expect(splitItems('a\tb\tc', { separator: 'tab' })).toEqual(['a', 'b', 'c']);
  });

  it('splits lines on CRLF as well as LF', () => {
    expect(splitItems('a\r\nb\nc')).toEqual(['a', 'b', 'c']);
  });

  it('joins one per line by default', () => {
    expect(joinItems(['a', 'b'])).toBe('a\nb');
  });
});

describe('counts and overlap', () => {
  it('reports how the two lists relate, whatever the operation', () => {
    const counts = applySetOperation(A, B, 'intersection').counts;
    expect(counts).toMatchObject({ a: 3, b: 3, result: 2, onlyA: 1, onlyB: 1, both: 2 });
  });

  it('measures overlap as Jaccard over the union', () => {
    // 2 shared of 4 distinct.
    expect(applySetOperation(A, B, 'union').jaccard).toBeCloseTo(0.5);
    expect(applySetOperation('a\nb', 'a\nb', 'union').jaccard).toBe(1);
    expect(applySetOperation('a', 'b', 'union').jaccard).toBe(0);
  });

  it('calls two empty lists an overlap of zero rather than dividing by it', () => {
    const result = applySetOperation('', '', 'union');
    expect(result.jaccard).toBe(0);
    expect(result.items).toEqual([]);
    expect(result.joined).toBe('');
  });
});

describe('the operation table', () => {
  it('gives every operation a label, a symbol and a hint', () => {
    SET_OPERATIONS.forEach((op) => {
      expect(operationLabel[op]).toBeTruthy();
      expect(operationSymbol[op]).toBeTruthy();
      expect(operationHint[op]).toBeTruthy();
    });
  });

  it('narrows strings off a query string', () => {
    expect(isSetOperation('union')).toBe(true);
    expect(isSetOperation('sort')).toBe(false);
    expect(isSetOperation(null)).toBe(false);
    expect(isSeparator('comma')).toBe(true);
    expect(isSeparator('pipe')).toBe(false);
  });
});

describe('blocks registry', () => {
  const ids: Record<SetOperation, string> = {
    union: 'set-union',
    intersection: 'set-intersection',
    difference: 'set-difference',
    'reverse-difference': 'set-reverse-difference',
    'symmetric-difference': 'set-symmetric-difference',
  };

  /** Run an operation the way the pipeline does: defaults, then the two fields. */
  const call = (id: string, fields: Record<string, string>, overrides: Record<string, string> = {}) => {
    const op = OPERATION_MAP[id];
    if (!op) throw new Error(`operation "${id}" is not registered`);
    const params = Object.fromEntries(op.params.map((p) => [p.id, p.default]));
    return op.fn(fields.a ?? '', { ...params, ...fields, ...overrides });
  };

  it.each(SET_OPERATIONS)('registers %s with two linkable fields', (operation) => {
    const op = OPERATION_MAP[ids[operation]];
    expect(op.inputs?.map((f) => f.id)).toEqual(['a', 'b']);
    expect(op.inputs?.every((f) => f.long)).toBe(true);
    expect(op.terminal).toBeUndefined();
  });

  it.each(SET_OPERATIONS)('gives %s the same answer as the tool page', (operation) => {
    expect(call(ids[operation], { a: A, b: B })).toBe(
      applySetOperation(A, B, operation).joined,
    );
  });

  it('honours the case, sort and separator params', () => {
    expect(call(ids.union, { a: 'B\na', b: 'b' }, { case: 'insensitive', sort: 'yes' })).toBe('a\nB');
    expect(call(ids.union, { a: 'a, b', b: 'c' }, { separator: 'comma' })).toBe('a, b, c');
  });

  it('is a normal chainable block, so its output can feed the next one', () => {
    const joined = call(ids.union, { a: A, b: B });
    expect(call(ids.intersection, { a: joined, b: B })).toBe('banana\ncherry\ndate');
  });
});
