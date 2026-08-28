import { encodeToBacon, decodeFromBacon, isBaconEncoded, processBacon } from '@/Components/Functions/BaconCipherTools/logic';

describe('encodeToBacon', () => {
  it('encodes A to AAAAA', () => {
    expect(encodeToBacon('A', 'AB')).toBe('AAAAA');
  });
  it('encodes B to AAAAB', () => {
    expect(encodeToBacon('B', 'AB')).toBe('AAAAB');
  });
  it('encodes in 01 representation', () => {
    expect(encodeToBacon('A', '01')).toBe('00000');
    expect(encodeToBacon('B', '01')).toBe('00001');
  });
  it('I and J produce same code', () => {
    expect(encodeToBacon('I', 'AB')).toBe(encodeToBacon('J', 'AB'));
  });
  it('preserves spaces', () => {
    const r = encodeToBacon('A B', 'AB');
    expect(r).toContain(' ');
  });
});

describe('decodeFromBacon', () => {
  it('decodes AAAAA to A', () => {
    expect(decodeFromBacon('AAAAA', 'AB')).toBe('A');
  });
  it('decodes AAAAB to B', () => {
    expect(decodeFromBacon('AAAAB', 'AB')).toBe('B');
  });
  it('decodes 01 representation', () => {
    expect(decodeFromBacon('00000', '01')).toBe('A');
  });
  it('round-trips encode/decode', () => {
    const encoded = encodeToBacon('HELLO', 'AB');
    const decoded = decodeFromBacon(encoded, 'AB');
    expect(decoded).toBe('HELLO');
  });
});

describe('isBaconEncoded', () => {
  it('detects A/B encoded text', () => {
    expect(isBaconEncoded('AAAAA AAAAB', 'AB')).toBe(true);
  });
  it('detects 0/1 encoded text', () => {
    expect(isBaconEncoded('00000 00001', '01')).toBe(true);
  });
  it('returns false for plain text', () => {
    expect(isBaconEncoded('Hello World', 'AB')).toBe(false);
  });
});

describe('processBacon', () => {
  it('encodes plain text', () => {
    const r = processBacon('A', 'AB');
    expect(r).toContain('Encode');
    expect(r).toContain('AAAAA');
  });
  it('decodes bacon codes', () => {
    const r = processBacon('AAAAA', 'AB');
    expect(r).toContain('Decode');
    expect(r).toContain('A');
  });
  it('returns empty for empty input', () => {
    expect(processBacon('', 'AB')).toBe('');
  });
});
