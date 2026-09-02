import { computeAdler32, stringToBytes } from '../Components/Functions/FletcherTools/logic';

/**
 * Adler-32 has its own page at /hashing/adler32 as well as living inside the
 * Fletcher tool, so pin the values the page renders.
 */
describe('Adler-32', () => {
  it('matches the canonical "Wikipedia" checksum', () => {
    expect(computeAdler32(stringToBytes('Wikipedia'))).toBe(0x11e60398);
  });

  it('starts at 1 for the empty input', () => {
    expect(computeAdler32(stringToBytes(''))).toBe(1);
  });

  it('splits into the two running sums the page shows', () => {
    const checksum = computeAdler32(stringToBytes('Wikipedia'));
    expect(checksum & 0xffff).toBe(0x0398);
    expect(checksum >>> 16).toBe(0x11e6);
  });

  it('is order-sensitive, unlike a plain byte sum', () => {
    expect(computeAdler32(stringToBytes('ab'))).not.toBe(computeAdler32(stringToBytes('ba')));
  });

  it('stays in range across the 65521 modulus', () => {
    const checksum = computeAdler32(stringToBytes('a'.repeat(10000)));
    expect(checksum).toBeGreaterThan(0);
    expect(checksum).toBeLessThanOrEqual(0xffffffff);
  });
});
