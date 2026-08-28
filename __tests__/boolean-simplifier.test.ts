import { generateTruthTable, formatBooleanTable, grayCode, karnaughMap } from '@/Components/Functions/BooleanSimplifierTools/logic';

describe('grayCode', () => {
  it('returns a single empty label for zero bits', () => expect(grayCode(0)).toEqual(['']));
  it('returns 0,1 for one bit', () => expect(grayCode(1)).toEqual(['0', '1']));
  it('orders two bits so neighbours differ by one', () => expect(grayCode(2)).toEqual(['00', '01', '11', '10']));
  it('produces 2^n labels', () => expect(grayCode(3)).toHaveLength(8));
});

describe('karnaughMap', () => {
  it('lays two variables out as 2x2', () => {
    const map = karnaughMap(generateTruthTable('A && B'));
    expect(map.cells).toHaveLength(2);
    expect(map.cells[0]).toHaveLength(2);
  });

  it('lays four variables out as 4x4', () => {
    const map = karnaughMap(generateTruthTable('(A && B) || (!C && D)'));
    expect(map.cells).toHaveLength(4);
    expect(map.cells[0]).toHaveLength(4);
  });

  it('splits three variables into 2 rows by 4 columns', () => {
    const map = karnaughMap(generateTruthTable('A ^ B ^ C'));
    expect(map.rowVars).toEqual(['A']);
    expect(map.colVars).toEqual(['B', 'C']);
    expect(map.cells).toHaveLength(2);
    expect(map.cells[0]).toHaveLength(4);
  });

  it('covers every minterm exactly once', () => {
    const result = generateTruthTable('(A && B) || (!C && D)');
    const map = karnaughMap(result);
    const seen = map.cells.flat().map(c => c.minterm).sort((a, b) => a - b);
    expect(seen).toEqual(result.rows.map((_, i) => i));
  });

  it('cell values match the truth table', () => {
    const result = generateTruthTable('A && B');
    const map = karnaughMap(result);
    for (const cell of map.cells.flat()) {
      expect(cell.value).toBe(result.rows[cell.minterm].output);
    }
  });

  it('handles a single variable', () => {
    const map = karnaughMap(generateTruthTable('!A'));
    expect(map.cells).toHaveLength(1);
    expect(map.cells[0]).toHaveLength(2);
    expect(map.cells[0].map(c => c.value)).toEqual([true, false]);
  });
});

describe('generateTruthTable', () => {
  it('A && B: 1 minterm (row 3)', () => {
    const r = generateTruthTable('A && B');
    expect(r.variables).toEqual(['A', 'B']);
    expect(r.rows).toHaveLength(4);
    expect(r.minterms).toEqual([3]);
  });

  it('A || B: 3 minterms', () => {
    const r = generateTruthTable('A || B');
    expect(r.minterms).toEqual([1, 2, 3]);
  });

  it('!A: 1 minterm for 1-var', () => {
    const r = generateTruthTable('!A');
    expect(r.minterms).toEqual([0]);
  });

  it('A ^ B: XOR minterms [1,2]', () => {
    const r = generateTruthTable('A ^ B');
    expect(r.minterms).toEqual([1, 2]);
  });

  it('A NAND B: 3 minterms', () => {
    const r = generateTruthTable('A NAND B');
    expect(r.minterms).toEqual([0, 1, 2]);
  });

  it('A NOR B: 1 minterm', () => {
    const r = generateTruthTable('A NOR B');
    expect(r.minterms).toEqual([0]);
  });

  it('A XNOR B: 2 minterms', () => {
    const r = generateTruthTable('A XNOR B');
    expect(r.minterms).toEqual([0, 3]);
  });

  it('supports 3 variables', () => {
    const r = generateTruthTable('A && B && C');
    expect(r.rows).toHaveLength(8);
  });

  it('parentheses respected', () => {
    const r1 = generateTruthTable('A && (B || C)');
    const r2 = generateTruthTable('(A && B) || C');
    // These should differ
    expect(r1.minterms).not.toEqual(r2.minterms);
  });

  it('always true gives sop "1"', () => {
    const r = generateTruthTable('A || !A');
    expect(r.sop).toContain('always true');
  });

  it('always false gives sop "0"', () => {
    const r = generateTruthTable('A && !A');
    expect(r.sop).toContain('always false');
  });

  it('throws for empty expression', () => {
    expect(() => generateTruthTable('')).toThrow();
  });

  it('throws for no variables', () => {
    expect(() => generateTruthTable('1 && 0')).toThrow();
  });
});

describe('formatBooleanTable', () => {
  it('includes truth table header', () => {
    const out = formatBooleanTable('A && B');
    expect(out).toContain('Output');
    expect(out).toContain('Minterms');
  });

  it('includes SOP section', () => {
    const out = formatBooleanTable('A || B');
    expect(out).toContain('Sum of Products');
  });
});
