import { analyzeBytes } from '@/Components/Functions/BitPatternTools/logic';

describe('analyzeBytes text mode', () => {
  it('handles ASCII text', () => {
    const result = analyzeBytes('A', 'text');
    expect(result.rows.length).toBe(1);
    expect(result.rows[0].byte).toBe(65); // 'A' = 0x41 = 65
    expect(result.rows[0].binary8).toBe('01000001');
    expect(result.rows[0].hex2).toBe('41');
    expect(result.rows[0].decimal).toBe(65);
  });

  it('handles "Hello" (5 bytes)', () => {
    const result = analyzeBytes('Hello', 'text');
    expect(result.totalBytes).toBe(5);
    expect(result.totalBits).toBe(40);
  });

  it('popcount is correct for 0xFF', () => {
    const result = analyzeBytes('ff', 'hex'); // 0xFF = all bits set
    expect(result.rows[0].bitCount).toBe(8);
    expect(result.rows[0].byte).toBe(0xFF);
  });

  it('popcount is correct for 0x00', () => {
    const result = analyzeBytes('00', 'hex'); // 0x00 = no bits set
    expect(result.rows[0].bitCount).toBe(0);
    expect(result.rows[0].byte).toBe(0x00);
  });

  it('setBitsTotal + clearBitsTotal == totalBits', () => {
    const result = analyzeBytes('Hello World', 'text');
    expect(result.setBitsTotal + result.clearBitsTotal).toBe(result.totalBits);
  });

  it('parity is correct', () => {
    const result = analyzeBytes('A', 'text'); // 0x41 = 01000001 = 2 bits set
    expect(result.rows[0].parity).toBe('even');
  });

  it('parity is odd for 0x07', () => {
    const result = analyzeBytes('07', 'hex'); // 0x07 = 00000111 = 3 bits
    expect(result.rows[0].parity).toBe('odd');
    expect(result.rows[0].bitCount).toBe(3);
  });

  it('octal encoding is correct', () => {
    const result = analyzeBytes('A', 'text'); // 65 in octal = 101
    expect(result.rows[0].octal3).toBe('101');
  });

  it('MSB of 0x80 is 1', () => {
    const result = analyzeBytes('80', 'hex'); // 0x80 in hex mode
    expect(result.rows[0].msb).toBe(1);
    expect(result.rows[0].byte).toBe(0x80);
  });

  it('LSB of odd byte is 1', () => {
    const result = analyzeBytes('A', 'text'); // 65 = 0x41 = odd
    expect(result.rows[0].lsb).toBe(1);
  });

  it('generates summary string', () => {
    const result = analyzeBytes('Hi', 'text');
    expect(result.summary).toContain('bytes');
    expect(result.summary).toContain('bits');
  });

  it('byteFrequency tracks occurrences', () => {
    const result = analyzeBytes('aaa', 'text'); // 3× 'a' = 0x61 = 97
    expect(result.byteFrequency[97]).toBe(3);
  });
});

describe('analyzeBytes hex mode', () => {
  it('parses hex string', () => {
    const result = analyzeBytes('41', 'hex'); // 'A'
    expect(result.rows.length).toBe(1);
    expect(result.rows[0].byte).toBe(0x41);
  });

  it('parses hex with spaces', () => {
    const result = analyzeBytes('48 65 6C 6C 6F', 'hex'); // "Hello"
    expect(result.totalBytes).toBe(5);
    expect(result.rows[0].byte).toBe(0x48); // 'H'
  });

  it('throws on odd-length hex', () => {
    expect(() => analyzeBytes('4', 'hex')).toThrow();
  });

  it('throws on invalid hex chars', () => {
    expect(() => analyzeBytes('GG', 'hex')).toThrow();
  });

  it('parses 0x prefix hex', () => {
    const result = analyzeBytes('0x4142', 'hex');
    expect(result.totalBytes).toBe(2);
  });
});
