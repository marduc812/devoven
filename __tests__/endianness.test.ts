import { byteAscii, convertEndianness } from '@/Components/Functions/EndiannessTools/logic';

describe('convertEndianness', () => {
  it('converts 32-bit DEADBEEF big-endian correctly', () => {
    const result = convertEndianness('DEADBEEF', 32);
    expect(result.error).toBeUndefined();
    expect(result.bigEndianHex).toBe('DEADBEEF');
    expect(result.bytesBigEndian).toEqual(['DE', 'AD', 'BE', 'EF']);
  });

  it('produces little-endian reversal for 32-bit', () => {
    const result = convertEndianness('12345678', 32);
    expect(result.error).toBeUndefined();
    expect(result.bytesLittleEndian).toEqual(['78', '56', '34', '12']);
    expect(result.littleEndianHex).toBe('78563412');
  });

  it('handles 0x prefix', () => {
    const result = convertEndianness('0x12345678', 32);
    expect(result.error).toBeUndefined();
    expect(result.bigEndianHex).toBe('12345678');
  });

  it('pads short value for 32-bit', () => {
    const result = convertEndianness('FF', 32);
    expect(result.error).toBeUndefined();
    expect(result.inputHex).toBe('000000FF');
    expect(result.bytesBigEndian).toHaveLength(4);
  });

  it('handles 16-bit correctly', () => {
    const result = convertEndianness('1234', 16);
    expect(result.error).toBeUndefined();
    expect(result.bytesBigEndian).toHaveLength(2);
    expect(result.bytesBigEndian).toEqual(['12', '34']);
    expect(result.bytesLittleEndian).toEqual(['34', '12']);
  });

  it('handles 64-bit correctly', () => {
    const result = convertEndianness('0102030405060708', 64);
    expect(result.error).toBeUndefined();
    expect(result.bytesBigEndian).toHaveLength(8);
    expect(result.bytesBigEndian[0]).toBe('01');
    expect(result.bytesLittleEndian[0]).toBe('08');
  });

  it('returns error for invalid hex', () => {
    const result = convertEndianness('ZZZZ', 32);
    expect(result.error).toBeDefined();
  });

  it('returns error if value too large for bit width', () => {
    const result = convertEndianness('123456789', 32); // 9 hex digits > 8
    expect(result.error).toBeDefined();
  });

  it('computes decimal for simple value', () => {
    const result = convertEndianness('00000001', 32);
    expect(result.decimal).toBe('1');
  });

  it('computes decimal for 0xFF', () => {
    const result = convertEndianness('FF', 16);
    expect(result.decimal).toBe('255');
  });

  it('returns empty error for empty input', () => {
    const result = convertEndianness('', 32);
    expect(result.error).toBeDefined();
  });
});

// ─── 64-bit decimals ──────────────────────────────────────────────────────────
// These used to go through `high * 2^32 + low` in floating point, which rounds
// once the value passes 2^53.

describe('64-bit decimal precision', () => {
  it('reads the largest u64 exactly', () => {
    const result = convertEndianness('FFFFFFFFFFFFFFFF', 64);
    expect(result.decimal).toBe('18446744073709551615');
  });

  it('keeps 2^53 + 1 distinct from 2^53', () => {
    expect(convertEndianness('0020000000000001', 64).decimal).toBe('9007199254740993');
  });

  it('reads a byte-swapped 64-bit value exactly', () => {
    const result = convertEndianness('FFFFFFFFFFFFFF00', 64);
    expect(result.decimalSwapped).toBe('72057594037927935'); // 0x00FFFFFFFFFFFFFF
  });
});

// ─── signed values ────────────────────────────────────────────────────────────

describe('two\'s complement reading', () => {
  it('reads 0xFFFF as -1 at 16 bits', () => {
    expect(convertEndianness('FFFF', 16).decimalSigned).toBe('-1');
  });

  it('reads 0xFFFFFFFF as -1 at 32 bits', () => {
    expect(convertEndianness('FFFFFFFF', 32).decimalSigned).toBe('-1');
  });

  it('reads the largest u64 as -1 at 64 bits', () => {
    expect(convertEndianness('FFFFFFFFFFFFFFFF', 64).decimalSigned).toBe('-1');
  });

  it('leaves values below the halfway point positive', () => {
    expect(convertEndianness('7FFF', 16).decimalSigned).toBe('32767');
  });

  it('flips at the halfway point', () => {
    expect(convertEndianness('8000', 16).decimalSigned).toBe('-32768');
  });

  it('matches the unsigned value when the top bit is clear', () => {
    const result = convertEndianness('1234', 16);
    expect(result.decimalSigned).toBe(result.decimal);
  });
});

// ─── swapped value ────────────────────────────────────────────────────────────

describe('decimalSwapped', () => {
  it('is the little-endian reading of the same bytes', () => {
    const result = convertEndianness('12345678', 32);
    expect(result.decimalSwapped).toBe(String(0x78563412));
  });

  it('equals the unsigned value when every byte is the same', () => {
    const result = convertEndianness('1212', 16);
    expect(result.decimalSwapped).toBe(result.decimal);
  });
});

// ─── binary ───────────────────────────────────────────────────────────────────

describe('binary', () => {
  it('is padded to the bit width', () => {
    expect(convertEndianness('FF', 32).binary).toBe('00000000000000000000000011111111');
  });

  it('is 64 characters at 64 bits', () => {
    expect(convertEndianness('1', 64).binary).toHaveLength(64);
  });
});

// ─── byteAscii ────────────────────────────────────────────────────────────────

describe('byteAscii', () => {
  it('renders a printable byte', () => expect(byteAscii('41')).toBe('A'));
  it('renders a space', () => expect(byteAscii('20')).toBe(' '));
  it('dots out a control byte', () => expect(byteAscii('00')).toBe('.'));
  it('dots out DEL', () => expect(byteAscii('7F')).toBe('.'));
  it('dots out a high byte', () => expect(byteAscii('FF')).toBe('.'));
});
