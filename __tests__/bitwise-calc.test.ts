import { computeBitwise, formatBitwise } from '@/Components/Functions/BitwiseCalcTools/logic';

describe('computeBitwise', () => {
  it('AND of 0xFF and 0x0F = 0x0F', () => {
    const r = computeBitwise('0xFF', '0x0F', '1');
    expect(r.and & 0xFFFF).toBe(0x0F);
  });

  it('OR of 0xF0 and 0x0F = 0xFF', () => {
    const r = computeBitwise('0xF0', '0x0F', '1');
    expect(r.or & 0xFFFF).toBe(0xFF);
  });

  it('XOR of same value = 0', () => {
    const r = computeBitwise('42', '42', '1');
    expect(r.xor).toBe(0);
  });

  it('NOT 0 = -1 (signed 32-bit)', () => {
    const r = computeBitwise('0', '0', '1');
    expect(r.notA).toBe(-1);
  });

  it('left shift 1 by 3 = 8', () => {
    const r = computeBitwise('1', '0', '3');
    expect(r.leftShiftA).toBe(8);
  });

  it('right shift 8 by 3 = 1', () => {
    const r = computeBitwise('8', '0', '3');
    expect(r.rightShiftA).toBe(1);
  });

  it('unsigned right shift -1 by 1 = large positive', () => {
    const r = computeBitwise('-1', '0', '1');
    expect(r.unsignedRightShiftA).toBeGreaterThan(0);
  });

  it('NAND of all-zeros = all-ones', () => {
    const r = computeBitwise('0', '0', '1');
    // 0 NAND 0 = NOT(0 AND 0) = NOT(0) = -1 (signed)
    expect(r.nand).toBe(-1);
  });

  it('NOR of 0 and 0 = -1', () => {
    const r = computeBitwise('0', '0', '1');
    expect(r.nor).toBe(-1);
  });

  it('parses hex input', () => {
    const r = computeBitwise('0x10', '0x10', '1');
    expect(r.a).toBe(16);
    expect(r.b).toBe(16);
  });

  it('throws for empty A', () => {
    expect(() => computeBitwise('', '5', '1')).toThrow();
  });

  it('throws for empty B', () => {
    expect(() => computeBitwise('5', '', '1')).toThrow();
  });

  it('throws for invalid shift', () => {
    expect(() => computeBitwise('5', '3', '32')).toThrow();
  });
});

describe('formatBitwise', () => {
  it('includes AND in output', () => {
    const out = formatBitwise('5', '3', '1');
    expect(out).toContain('AND');
  });

  it('includes binary representation', () => {
    const out = formatBitwise('255', '15', '1');
    expect(out).toContain('11111111');
  });
});
