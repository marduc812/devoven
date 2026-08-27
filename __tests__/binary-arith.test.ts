import { computeBinaryArith } from '@/Components/Functions/BinaryArithTools/logic';

describe('Binary Addition', () => {
  it('1010 + 0110 = 10000 (10 + 6 = 16)', () => {
    const r = computeBinaryArith('1010', '0110', '+');
    expect(r.error).toBeUndefined();
    expect(r.binaryResult).toBe('10000');
    expect(r.decResult).toBe(16);
  });

  it('1 + 1 = 10', () => {
    const r = computeBinaryArith('1', '1', '+');
    expect(r.binaryResult).toBe('10');
    expect(r.decResult).toBe(2);
  });

  it('provides carry steps', () => {
    const r = computeBinaryArith('1111', '0001', '+');
    expect(r.steps.length).toBeGreaterThan(0);
    expect(r.steps.some(s => s.label === 'Carries')).toBe(true);
  });
});

describe('Binary Subtraction', () => {
  it('1010 - 0011 = 111 (10 - 3 = 7)', () => {
    const r = computeBinaryArith('1010', '0011', '-');
    expect(r.error).toBeUndefined();
    expect(r.decResult).toBe(7);
    expect(r.binaryResult).toBe('111');
  });

  it('handles A < B (negative result)', () => {
    const r = computeBinaryArith('0011', '1010', '-');
    expect(r.decResult).toBe(-7);
    expect(r.binaryResult).toContain('-');
  });
});

describe('Binary Multiplication', () => {
  it('101 * 11 = 1111 (5 * 3 = 15)', () => {
    const r = computeBinaryArith('101', '11', '*');
    expect(r.decResult).toBe(15);
    expect(r.binaryResult).toBe('1111');
  });

  it('has shift-and-add steps', () => {
    const r = computeBinaryArith('101', '10', '*');
    expect(r.steps.length).toBeGreaterThan(0);
  });
});

describe('Binary Division', () => {
  it('1100 / 11 = 100 (12 / 3 = 4)', () => {
    const r = computeBinaryArith('1100', '11', '/');
    expect(r.decResult).toBe(4);
    expect(r.binaryResult).toBe('100');
  });

  it('division by zero returns error', () => {
    const r = computeBinaryArith('1010', '0', '/');
    expect(r.error).toBeDefined();
  });
});

describe('Input validation', () => {
  it('non-binary input A returns error', () => {
    const r = computeBinaryArith('102', '10', '+');
    expect(r.error).toBeDefined();
  });
  it('non-binary input B returns error', () => {
    const r = computeBinaryArith('10', 'abc', '+');
    expect(r.error).toBeDefined();
  });
});
