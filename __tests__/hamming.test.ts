import {
  hammingDistance,
  hammingDistanceBinary,
  compareHamming,
} from '@/Components/Functions/HammingTools/logic';
describe('hammingDistance', () => {
  it('identical strings have distance 0', () => expect(hammingDistance('abc', 'abc')).toBe(0));
  it('one difference is 1', () => expect(hammingDistance('abc', 'aXc')).toBe(1));
  it('all different is length', () => expect(hammingDistance('abc', 'xyz')).toBe(3));
  it('throws for unequal length', () => expect(() => hammingDistance('ab', 'abc')).toThrow());
  it('karolin/kathrin is 3', () => expect(hammingDistance('karolin', 'kathrin')).toBe(3));
});
describe('hammingDistanceBinary', () => {
  it('distance between 0 and 0 is 0', () => expect(hammingDistanceBinary(0, 0)).toBe(0));
  it('distance between 1 and 0 is 1', () => expect(hammingDistanceBinary(1, 0)).toBe(1));
  it('counts differing bits', () => expect(hammingDistanceBinary(0b1010, 0b0101)).toBe(4));
});
// ─── compareHamming (structured) ──────────────────────────────────────────────

describe('compareHamming', () => {
  it('flags unequal lengths without computing a distance', () => {
    const r = compareHamming('abc', 'abcd');
    expect(r.equalLength).toBe(false);
    expect(r.lengthA).toBe(3);
    expect(r.lengthB).toBe(4);
    expect(r.positions).toEqual([]);
    expect(r.xor).toBeNull();
  });

  it('marks each position as same or different', () => {
    const r = compareHamming('karolin', 'kathrin');
    expect(r.distance).toBe(3);
    expect(r.differingIndexes).toEqual([2, 3, 4]);
    expect(r.positions[0]).toEqual({ index: 0, charA: 'k', charB: 'k', same: true });
    expect(r.positions[2]).toEqual({ index: 2, charA: 'r', charB: 't', same: false });
  });

  it('agrees with hammingDistance', () => {
    expect(compareHamming('karolin', 'kathrin').distance).toBe(
      hammingDistance('karolin', 'kathrin')
    );
    expect(compareHamming('1011101', '1001001').distance).toBe(
      hammingDistance('1011101', '1001001')
    );
  });

  it('computes similarity as the matching fraction', () => {
    expect(compareHamming('abcd', 'abcd').similarity).toBe(1);
    expect(compareHamming('abcd', 'abcx').similarity).toBe(0.75);
    expect(compareHamming('ab', 'xy').similarity).toBe(0);
  });

  it('treats empty strings as fully similar rather than dividing by zero', () => {
    const r = compareHamming('', '');
    expect(r.equalLength).toBe(true);
    expect(r.distance).toBe(0);
    expect(r.similarity).toBe(1);
  });

  it('detects binary input and returns the XOR', () => {
    const r = compareHamming('1011101', '1001001');
    expect(r.isBinary).toBe(true);
    expect(r.xor).toBe('0010100');
    // popcount of the XOR is the distance
    expect(r.xor!.split('').filter(c => c === '1').length).toBe(r.distance);
  });

  it('matches hammingDistanceBinary for short binary strings', () => {
    const r = compareHamming('1011101', '1001001');
    expect(r.distance).toBe(hammingDistanceBinary(parseInt('1011101', 2), parseInt('1001001', 2)));
  });

  it('XORs beyond 53 bits without losing precision', () => {
    const a = '1'.repeat(64);
    const b = '0'.repeat(64);
    const r = compareHamming(a, b);
    expect(r.xor).toBe('1'.repeat(64));
    expect(r.distance).toBe(64);
  });

  it('leaves xor null for non-binary text', () => {
    const r = compareHamming('karolin', 'kathrin');
    expect(r.isBinary).toBe(false);
    expect(r.xor).toBeNull();
  });
});
