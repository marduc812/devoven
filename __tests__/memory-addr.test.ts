import {
  calculateAddress,
  calculateDistance,
  formatBinary,
  humanBytes,
} from '@/Components/Functions/MemoryAddrTools/logic';

describe('calculateAddress', () => {
  it('computes base + offset in hex', () => {
    const result = calculateAddress('0x1000', '0x100');
    expect(result.error).toBeUndefined();
    expect(result.address).toBe('0x00001100');
  });

  it('computes decimal inputs', () => {
    const result = calculateAddress('4096', '256');
    expect(result.error).toBeUndefined();
    expect(result.addressDecimal).toBe('4352');
  });

  it('zero offset returns base', () => {
    const result = calculateAddress('0xDEAD0000', '0');
    expect(result.error).toBeUndefined();
    expect(result.address).toBe('0xDEAD0000');
  });

  it('returns 32-bit binary', () => {
    const result = calculateAddress('1', '');
    expect(result.error).toBeUndefined();
    expect(result.addressBinary).toHaveLength(32);
  });

  it('returns error for invalid base', () => {
    const result = calculateAddress('ZZZZ', '0');
    expect(result.error).toBeDefined();
  });

  it('returns error for invalid offset', () => {
    const result = calculateAddress('0x1000', 'abc');
    expect(result.error).toBeDefined();
  });

  it('computes page number for 4KB page', () => {
    const result = calculateAddress('0x1000', '');
    expect(result.error).toBeUndefined();
    const page4k = result.pageInfo.find(p => p.pageSize === '4 KB');
    expect(page4k).toBeDefined();
    expect(page4k?.pageNumber).toBe('0x00000001');
    expect(page4k?.offset).toBe('0x00000000');
  });

  it('checks alignment correctly for 4096-aligned address', () => {
    const result = calculateAddress('0x1000', '');
    const aligned4096 = result.alignmentInfo.find(a => a.alignment === 4096);
    expect(aligned4096?.aligned).toBe(true);
  });

  it('checks alignment correctly for non-aligned address', () => {
    const result = calculateAddress('0x1001', '');
    const aligned4 = result.alignmentInfo.find(a => a.alignment === 4);
    expect(aligned4?.aligned).toBe(false);
  });

  it('handles address 0', () => {
    const result = calculateAddress('0', '');
    expect(result.error).toBeUndefined();
    expect(result.address).toBe('0x00000000');
  });

  it('reports the start of the page the address falls in', () => {
    const result = calculateAddress('0x1234', '');
    const page4k = result.pageInfo.find(p => p.pageSize === '4 KB');
    expect(page4k?.pageStart).toBe('0x00001000');
    expect(page4k?.offsetDecimal).toBe(0x234);
  });

  it('reports both boundaries for an unaligned address', () => {
    const result = calculateAddress('0x1001', '');
    const align16 = result.alignmentInfo.find(a => a.alignment === 16);
    expect(align16?.aligned).toBe(false);
    expect(align16?.alignedDown).toBe('0x00001000');
    expect(align16?.alignedUp).toBe('0x00001010');
    expect(align16?.toNextBoundary).toBe(15);
  });

  it('needs no padding when already aligned', () => {
    const result = calculateAddress('0x1000', '');
    const align16 = result.alignmentInfo.find(a => a.alignment === 16);
    expect(align16?.toNextBoundary).toBe(0);
    expect(align16?.alignedDown).toBe('0x00001000');
    expect(align16?.alignedUp).toBe('0x00001000');
  });
});

describe('calculateDistance', () => {
  it('computes positive distance', () => {
    const result = calculateDistance('0x1000', '0x2000');
    expect(result.error).toBeUndefined();
    expect(result.distanceDecimal).toBe('4096');
    expect(result.signedDistance).toBe('+4096');
  });

  it('computes negative distance', () => {
    const result = calculateDistance('0x2000', '0x1000');
    expect(result.error).toBeUndefined();
    expect(result.signedDistance).toBe('-4096');
  });

  it('returns zero distance for same address', () => {
    const result = calculateDistance('0x1000', '0x1000');
    expect(result.distanceDecimal).toBe('0');
  });

  it('returns error for invalid address', () => {
    const result = calculateDistance('ZZZZ', '0x1000');
    expect(result.error).toBeDefined();
  });

  it('reports direction and a human-readable size', () => {
    expect(calculateDistance('0x1000', '0x2000').direction).toBe('above');
    expect(calculateDistance('0x2000', '0x1000').direction).toBe('below');
    expect(calculateDistance('0x1000', '0x1000').direction).toBe('same');
    expect(calculateDistance('0x1000', '0x2000').human).toBe('4 KB');
  });
});

describe('humanBytes', () => {
  it('keeps small counts in bytes', () => expect(humanBytes(512)).toBe('512 B'));
  it('scales to the largest whole unit', () => {
    expect(humanBytes(4096)).toBe('4 KB');
    expect(humanBytes(2097152)).toBe('2 MB');
    expect(humanBytes(1073741824)).toBe('1 GB');
  });
  it('shows two decimals for partial units', () => expect(humanBytes(1536)).toBe('1.50 KB'));
  it('stops scaling at GB', () => expect(humanBytes(4294967295)).toBe('4.00 GB'));
});

describe('formatBinary', () => {
  it('groups 32-bit binary into nibbles', () => {
    const formatted = formatBinary('00000000000000000000000000000001');
    expect(formatted).toBe('0000 0000 0000 0000 0000 0000 0000 0001');
  });
});
