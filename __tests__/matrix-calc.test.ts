import {
  parseMatrix,
  matrixAdd,
  matrixSubtract,
  matrixMultiply,
  matrixTranspose,
  matrixDeterminant,
  matrixInverse,
  processMatrixOp,
} from '@/Components/Functions/MatrixCalcTools/logic';

describe('parseMatrix', () => {
  it('parses 2x2', () => expect(parseMatrix('1 2\n3 4')).toEqual([[1, 2], [3, 4]]));
  it('parses 3x3', () => {
    const m = parseMatrix('1 2 3\n4 5 6\n7 8 9');
    expect(m.length).toBe(3);
    expect(m[0]).toEqual([1, 2, 3]);
  });
  it('throws on empty', () => expect(() => parseMatrix('')).toThrow());
  it('throws on jagged rows', () => expect(() => parseMatrix('1 2\n3')).toThrow());
});

describe('matrixAdd', () => {
  it('adds 2x2', () => {
    const r = matrixAdd([[1, 2], [3, 4]], [[5, 6], [7, 8]]);
    expect(r).toEqual([[6, 8], [10, 12]]);
  });
  it('throws on dimension mismatch', () => {
    expect(() => matrixAdd([[1, 2]], [[1, 2], [3, 4]])).toThrow();
  });
});

describe('matrixSubtract', () => {
  it('subtracts', () => {
    const r = matrixSubtract([[5, 6], [7, 8]], [[1, 2], [3, 4]]);
    expect(r).toEqual([[4, 4], [4, 4]]);
  });
});

describe('matrixMultiply', () => {
  it('multiplies 2x2', () => {
    const r = matrixMultiply([[1, 2], [3, 4]], [[5, 6], [7, 8]]);
    expect(r).toEqual([[19, 22], [43, 50]]);
  });
  it('throws incompatible dims', () => {
    expect(() => matrixMultiply([[1, 2, 3]], [[1, 2]])).toThrow();
  });
});

describe('matrixTranspose', () => {
  it('transposes', () => {
    const r = matrixTranspose([[1, 2, 3], [4, 5, 6]]);
    expect(r).toEqual([[1, 4], [2, 5], [3, 6]]);
  });
});

describe('matrixDeterminant', () => {
  it('2x2 det', () => expect(matrixDeterminant([[1, 2], [3, 4]])).toBe(-2));
  it('3x3 det', () => {
    expect(matrixDeterminant([[1, 2, 3], [4, 5, 6], [7, 8, 10]])).toBeCloseTo(-3);
  });
  it('throws non-square', () => expect(() => matrixDeterminant([[1, 2, 3], [4, 5, 6]])).toThrow());
});

describe('matrixInverse', () => {
  it('inverts 2x2', () => {
    const inv = matrixInverse([[2, 1], [5, 3]]);
    expect(inv[0][0]).toBeCloseTo(3);
    expect(inv[0][1]).toBeCloseTo(-1);
    expect(inv[1][0]).toBeCloseTo(-5);
    expect(inv[1][1]).toBeCloseTo(2);
  });
  it('throws singular', () => expect(() => matrixInverse([[1, 2], [2, 4]])).toThrow());
});

describe('processMatrixOp', () => {
  it('add', () => expect(processMatrixOp('1 2\n3 4', '5 6\n7 8', 'add')).toContain('A + B'));
  it('transposeA', () => expect(processMatrixOp('1 2\n3 4', '', 'transposeA')).toContain('Transpose'));
  it('determinantA', () => expect(processMatrixOp('1 2\n3 4', '', 'determinantA')).toContain('-2'));
  it('returns empty on empty input', () => expect(processMatrixOp('', '', 'add')).toBe(''));
});
