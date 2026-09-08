import {
  decodeToJson,
  decodeBinaryToJson,
  detectEncoding,
  CBOR_SAMPLE,
  MSGPACK_SAMPLE,
} from '@/Components/Functions/BinaryFormatTools/logic';

const cbor = (hex: string) => JSON.parse(decodeToJson(hex, 'cbor', { encoding: 'hex' }).json);
const msgpack = (hex: string) => JSON.parse(decodeToJson(hex, 'msgpack', { encoding: 'hex' }).json);
const cborNotes = (hex: string) => decodeToJson(hex, 'cbor', { encoding: 'hex' }).notes;

describe('CBOR', () => {
  it('reads the scalar types', () => {
    expect(cbor('01')).toBe(1);
    expect(cbor('1903e8')).toBe(1000);
    expect(cbor('3901f3')).toBe(-500);
    expect(cbor('626869')).toBe('hi');
    expect(cbor('f4')).toBe(false);
    expect(cbor('f5')).toBe(true);
    expect(cbor('f6')).toBe(null);
  });

  it('reads floats, including half precision', () => {
    expect(cbor('fb3ff8000000000000')).toBe(1.5);
    expect(cbor('fa3fc00000')).toBe(1.5);
    expect(cbor('f93e00')).toBe(1.5);
    expect(cbor('f97c00')).toBe('Infinity');
  });

  it('reads arrays and maps', () => {
    expect(cbor('82018102')).toEqual([1, [2]]);
    expect(cbor('a16161a1616283016178f6')).toEqual({ a: { b: [1, 'x', null] } });
  });

  it('keeps byte strings apart from text', () => {
    expect(cbor('4201ff')).toEqual({ $bytes: '01ff' });
  });

  it('reads indefinite lengths and says it did', () => {
    expect(cbor('9f0102ff')).toEqual([1, 2]);
    expect(cbor('7f626865636c6c6fff')).toBe('hello');
    expect(cbor('5f42010243010203ff')).toEqual({ $bytes: '0102010203' });
    expect(cborNotes('9f0102ff')[0]).toContain('Indefinite-length array');
  });

  it('turns bignum tags into exact integers', () => {
    expect(cbor('c249010000000000000000')).toBe('18446744073709551616');
    expect(cborNotes('c249010000000000000000')[0]).toContain('Bignum');
  });

  it('turns an epoch tag into an ISO date and keeps other tags', () => {
    expect(cbor('c11a6553f100')).toBe('2023-11-14T22:13:20.000Z');
    expect(cbor('c074323032342d30352d30315431323a30303a30305a'))
      .toEqual({ $tag: 0, $label: 'date/time string', value: '2024-05-01T12:00:00Z' });
    expect(cbor('d8206a687474703a2f2f612e62'))
      .toEqual({ $tag: 32, $label: 'URI', value: 'http://a.b' });
  });

  it('holds integers past 2^53 as strings rather than losing them', () => {
    expect(cbor('1bffffffffffffffff')).toBe('18446744073709551615');
    expect(cbor('1b001fffffffffffff')).toBe(9007199254740991);
    expect(cbor('1b0020000000000000')).toBe('9007199254740992');
  });

  it('stringifies a non-string map key and notes it', () => {
    expect(cbor('a1016161')).toEqual({ '1': 'a' });
    expect(cborNotes('a1016161')[0]).toContain('Non-string map keys');
  });

  it('reports data that runs out or is reserved', () => {
    expect(() => cbor('82 01')).toThrow('ends mid-value');
    expect(() => cbor('1c')).toThrow('Reserved additional information');
    expect(() => cbor('')).toThrow('Paste the bytes');
  });

  it('notes trailing bytes rather than ignoring them', () => {
    const result = decodeToJson('0102', 'cbor', { encoding: 'hex' });
    expect(result.json).toBe('1');
    expect(result.notes[0]).toContain('trailing byte');
  });

  it('decodes its own sample', () => {
    expect(cbor(CBOR_SAMPLE)).toEqual({ name: 'core', items: [1, 2], tag: true });
  });
});

describe('MessagePack', () => {
  it('reads fixints and the wider integers', () => {
    expect(msgpack('01')).toBe(1);
    expect(msgpack('ff')).toBe(-1);
    expect(msgpack('cd03e8')).toBe(1000);
    expect(msgpack('d1fc18')).toBe(-1000);
    expect(msgpack('cfffffffffffffffff')).toBe('18446744073709551615');
    expect(msgpack('d3ffffffffffffffff')).toBe(-1);
  });

  it('reads nil, booleans and floats', () => {
    expect(msgpack('c0')).toBe(null);
    expect(msgpack('c2')).toBe(false);
    expect(msgpack('c3')).toBe(true);
    expect(msgpack('cb3ff8000000000000')).toBe(1.5);
    expect(msgpack('ca3fc00000')).toBe(1.5);
  });

  it('reads strings, bins, arrays and maps', () => {
    expect(msgpack('a26869')).toBe('hi');
    expect(msgpack('c402dead')).toEqual({ $bytes: 'dead' });
    expect(msgpack('9301a178c0')).toEqual([1, 'x', null]);
    expect(msgpack('81a16181a1629301a178c0')).toEqual({ a: { b: [1, 'x', null] } });
  });

  it('turns the timestamp extension into an ISO date', () => {
    expect(msgpack('d6ff6553f100')).toBe('2023-11-14T22:13:20.000Z');
  });

  it('keeps any other extension as a tagged value', () => {
    expect(msgpack('d40501')).toEqual({ $tag: 5, $label: 'extension', value: { $bytes: '01' } });
  });

  it('rejects the byte that is never valid', () => {
    expect(() => msgpack('c1')).toThrow('never valid MessagePack');
  });

  it('reports data that runs out', () => {
    expect(() => msgpack('9301')).toThrow('ends mid-value');
  });

  it('decodes its own sample', () => {
    expect(msgpack(MSGPACK_SAMPLE)).toEqual({ name: 'core', items: [1, 2], tag: true });
  });
});

describe('input handling', () => {
  it('detects hex versus Base64', () => {
    expect(detectEncoding('a3646e61')).toBe('hex');
    expect(detectEncoding('o2Rua')).toBe('base64');
    expect(detectEncoding('abc')).toBe('base64');
  });

  it('accepts Base64 and whitespace', () => {
    const base64 = Buffer.from(CBOR_SAMPLE, 'hex').toString('base64');
    expect(JSON.parse(decodeToJson(base64, 'cbor').json)).toEqual({ name: 'core', items: [1, 2], tag: true });
    expect(JSON.parse(decodeToJson('a1 61 61 01', 'cbor').json)).toEqual({ a: 1 });
  });

  it('gives the pipeline a single string', () => {
    expect(decodeBinaryToJson('01', 'cbor', 'hex')).toBe('1');
    expect(decodeBinaryToJson('01', 'msgpack', 'hex')).toBe('1');
  });
});
