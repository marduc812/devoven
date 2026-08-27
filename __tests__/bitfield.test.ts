import {
  numberToBits,
  parseBitfieldInput,
  analyzeBitfield,
  bitfieldFromInput,
  toggleBit,
  maskFor,
  parseBitPositions,
  setBitsAt,
  clearBitsAt,
  toggleBitsAt,
} from '@/Components/Functions/BitfieldTools/logic';

// The project targets ES2015, where BigInt literals are a syntax error — build values via BigInt().
const big = (v: string | number) => BigInt(v);
const MAX_U64 = big('0xFFFFFFFFFFFFFFFF');

describe('numberToBits', () => {
  it('255 has last 8 bits set', () => {
    const bits = numberToBits(255, 8);
    expect(bits.join('')).toBe('11111111');
  });
  it('0 has all bits clear', () => {
    const bits = numberToBits(0, 8);
    expect(bits.join('')).toBe('00000000');
  });
  it('1 has only last bit set', () => {
    const bits = numberToBits(1, 8);
    expect(bits[7]).toBe('1');
    expect(bits.slice(0,7).join('')).toBe('0000000');
  });
  it('returns 32 bits by default', () => expect(numberToBits(0).length).toBe(32));
});
describe('parseBitfieldInput', () => {
  it('parses decimal', () => expect(parseBitfieldInput('255', 32).value).toBe(big(255)));
  it('parses hex', () => expect(parseBitfieldInput('0xFF', 32).value).toBe(big(255)));
  it('parses binary', () => expect(parseBitfieldInput('0b1010', 32).value).toBe(big(10)));
  it('parses octal', () => expect(parseBitfieldInput('0o377', 32).value).toBe(big(255)));
  it('ignores separators', () => expect(parseBitfieldInput('1_000', 32).value).toBe(big(1000)));
  it('wraps negatives as two\'s complement', () => {
    expect(parseBitfieldInput('-1', 8).value).toBe(big(255));
    expect(parseBitfieldInput('-1', 32).value).toBe(big(0xffffffff));
  });
  it('flags values that overflow the width', () => {
    expect(parseBitfieldInput('300', 8)).toEqual({ value: big(44), wrapped: true });
    expect(parseBitfieldInput('255', 8).wrapped).toBe(false);
  });
  it('handles 64-bit values without precision loss', () =>
    expect(parseBitfieldInput('0xFFFFFFFFFFFFFFFF', 64).value).toBe(MAX_U64));
  it('throws on empty and invalid input', () => {
    expect(() => parseBitfieldInput('', 32)).toThrow();
    expect(() => parseBitfieldInput('abc', 32)).toThrow();
    expect(() => parseBitfieldInput('0b1210', 32)).toThrow();
    expect(() => parseBitfieldInput('0o399', 32)).toThrow();
  });
});

describe('analyzeBitfield', () => {
  it('lists bits MSB first', () => {
    const r = analyzeBitfield(big(0b1010), 8);
    expect(r.bits).toEqual([0, 0, 0, 0, 1, 0, 1, 0]);
  });
  it('formats each representation', () => {
    const r = analyzeBitfield(big(255), 16);
    expect(r.dec).toBe('255');
    expect(r.hex).toBe('0x00FF');
    expect(r.oct).toBe('0o377');
    expect(r.bin).toBe('0000000011111111');
  });
  it('counts set and clear bits', () => {
    const r = analyzeBitfield(big(15), 32);
    expect(r.setBits).toBe(4);
    expect(r.clearBits).toBe(28);
    expect(r.setPositions).toEqual([3, 2, 1, 0]);
  });
  it('reports highest and lowest set bit', () => {
    const r = analyzeBitfield(big(0b1001000), 32);
    expect(r.highestSetBit).toBe(6);
    expect(r.lowestSetBit).toBe(3);
  });
  it('reports -1 for both when the value is zero', () => {
    const r = analyzeBitfield(big(0), 32);
    expect(r.highestSetBit).toBe(-1);
    expect(r.lowestSetBit).toBe(-1);
  });
  it('breaks bytes down most significant first', () => {
    const r = analyzeBitfield(big(0xdeadbeef), 32);
    expect(r.bytes.map(b => b.index)).toEqual([3, 2, 1, 0]);
    expect(r.bytes.map(b => b.hex)).toEqual(['DE', 'AD', 'BE', 'EF']);
    expect(r.bytes[0].highBit).toBe(31);
    expect(r.bytes[0].lowBit).toBe(24);
    expect(r.bytes[0].bits.join('')).toBe('11011110');
  });
  it('shows printable ASCII for byte values', () => {
    const r = analyzeBitfield(BigInt('0x41'), 8);
    expect(r.bytes[0].char).toBe('A');
    expect(analyzeBitfield(big(0), 8).bytes[0].char).toBe('NUL');
  });
  it('computes the signed interpretation', () => {
    expect(analyzeBitfield(big(255), 8).signedDec).toBe('-1');
    expect(analyzeBitfield(big(127), 8).signedDec).toBe('127');
    expect(analyzeBitfield(MAX_U64, 64).signedDec).toBe('-1');
  });
  it('produces one byte group per 8 bits', () => {
    expect(analyzeBitfield(big(0), 8).bytes).toHaveLength(1);
    expect(analyzeBitfield(big(0), 64).bytes).toHaveLength(8);
    expect(analyzeBitfield(big(0), 64).bits).toHaveLength(64);
  });
});

describe('bitfieldFromInput', () => {
  it('parses and analyzes in one step', () => {
    const r = bitfieldFromInput('0xFF', 8);
    expect(r.setBits).toBe(8);
    expect(r.wrapped).toBe(false);
  });
  it('carries the wrapped flag through', () => expect(bitfieldFromInput('300', 8).wrapped).toBe(true));
});

describe('toggleBit', () => {
  it('sets a clear bit', () => expect(toggleBit(big(0), 3, 8)).toBe(big(8)));
  it('clears a set bit', () => expect(toggleBit(big(255), 0, 8)).toBe(big(254)));
  it('stays inside the width', () => expect(toggleBit(big(0), 63, 64)).toBe(big('0x8000000000000000')));
});

describe('maskFor', () => {
  it('builds an all-ones mask', () => {
    expect(maskFor(8)).toBe(big(255));
    expect(maskFor(64)).toBe(MAX_U64);
  });
});

describe('parseBitPositions', () => {
  it('parses a comma separated list', () =>
    expect(parseBitPositions('0, 3, 7', 8)).toEqual([0, 3, 7]));
  it('parses a space separated list', () =>
    expect(parseBitPositions('1 2 3', 8)).toEqual([1, 2, 3]));
  it('parses a single position', () => expect(parseBitPositions('5', 8)).toEqual([5]));
  it('round-trips the setPositions readout', () => {
    const r = analyzeBitfield(big(0b10010001), 8);
    expect(parseBitPositions(r.setPositions.join(', '), 8)).toEqual(r.setPositions);
  });
  it('drops duplicates', () => expect(parseBitPositions('3, 3, 3', 8)).toEqual([3]));
  it('rejects positions at or beyond the width', () => {
    expect(() => parseBitPositions('8', 8)).toThrow();
    expect(() => parseBitPositions('64', 64)).toThrow();
  });
  it('accepts the highest valid position', () =>
    expect(parseBitPositions('63', 64)).toEqual([63]));
  it('rejects non-numeric and negative input', () => {
    expect(() => parseBitPositions('abc', 8)).toThrow();
    expect(() => parseBitPositions('-1', 8)).toThrow();
    expect(() => parseBitPositions('1.5', 8)).toThrow();
  });
  it('rejects empty input', () => {
    expect(() => parseBitPositions('', 8)).toThrow();
    expect(() => parseBitPositions('  ', 8)).toThrow();
  });
});

describe('setBitsAt / clearBitsAt / toggleBitsAt', () => {
  it('sets bits, leaving others alone', () =>
    expect(setBitsAt(big(0), [0, 3, 7], 8)).toBe(big(0b10001001)));
  it('setting an already set bit is a no-op', () =>
    expect(setBitsAt(big(255), [0, 7], 8)).toBe(big(255)));
  it('clears bits', () => expect(clearBitsAt(big(255), [0, 7], 8)).toBe(big(0b01111110)));
  it('clearing an already clear bit is a no-op', () =>
    expect(clearBitsAt(big(0), [1, 2], 8)).toBe(big(0)));
  it('toggles bits', () => expect(toggleBitsAt(big(0b1010), [0, 1], 8)).toBe(big(0b1001)));
  it('stays inside the width', () => {
    expect(setBitsAt(big(0), [63], 64)).toBe(big('0x8000000000000000'));
    expect(clearBitsAt(MAX_U64, [63], 64)).toBe(big('0x7FFFFFFFFFFFFFFF'));
  });
  it('handles an empty position list', () => {
    expect(setBitsAt(big(42), [], 8)).toBe(big(42));
    expect(toggleBitsAt(big(42), [], 8)).toBe(big(42));
  });
});
