import { decodeProtobuf, formatProtobufResult, WIRE_TYPES } from '../Components/Functions/ProtobufWireTools/logic';

describe('WIRE_TYPES', () => {
  it('defines wire types 0, 1, 2, 5', () => {
    expect(WIRE_TYPES[0]).toBeDefined();
    expect(WIRE_TYPES[1]).toBeDefined();
    expect(WIRE_TYPES[2]).toBeDefined();
    expect(WIRE_TYPES[5]).toBeDefined();
  });

  it('wire type 0 is Varint', () => {
    expect(WIRE_TYPES[0].name).toBe('Varint');
  });

  it('wire type 2 is Length-delimited', () => {
    expect(WIRE_TYPES[2].name).toBe('Length-delimited');
  });
});

describe('decodeProtobuf', () => {
  it('throws on invalid (non-hex) input that produces odd digits', () => {
    // 'GZ' strips to empty, '0GZ' -> '0' which is odd-length
    expect(() => decodeProtobuf('0GZ')).toThrow();
  });

  it('throws on odd-length hex string', () => {
    expect(() => decodeProtobuf('0a5')).toThrow();
  });

  it('decodes field 1 varint 1 (0x08 0x01)', () => {
    const r = decodeProtobuf('08 01');
    expect(r.fields).toHaveLength(1);
    expect(r.fields[0].fieldNumber).toBe(1);
    expect(r.fields[0].wireType).toBe(0);
    expect(r.fields[0].valueInt).toBe(1);
  });

  it('decodes varint 150 (0x08 0x96 0x01)', () => {
    const r = decodeProtobuf('08 96 01');
    expect(r.fields).toHaveLength(1);
    expect(r.fields[0].valueInt).toBe(150);
  });

  it('decodes field 1 string "hello" (0x0a 0x05 0x68 0x65 0x6c 0x6c 0x6f)', () => {
    const r = decodeProtobuf('0a 05 68 65 6c 6c 6f');
    expect(r.fields).toHaveLength(1);
    expect(r.fields[0].fieldNumber).toBe(1);
    expect(r.fields[0].wireType).toBe(2);
    expect(r.fields[0].lengthDelimited?.dataText).toBe('hello');
    expect(r.fields[0].lengthDelimited?.length).toBe(5);
  });

  it('decodes fixed32 field (0x0d 0x2c 0x01 0x00 0x00)', () => {
    const r = decodeProtobuf('0d 2c 01 00 00');
    expect(r.fields).toHaveLength(1);
    expect(r.fields[0].wireType).toBe(5);
    expect(r.fields[0].valueInt).toBe(0x0000012c);
  });

  it('decodes multiple fields', () => {
    // field 1 varint 1, field 2 string "hi"
    const r = decodeProtobuf('08 01 12 02 68 69');
    expect(r.fields).toHaveLength(2);
    expect(r.fields[0].fieldNumber).toBe(1);
    expect(r.fields[1].fieldNumber).toBe(2);
    expect(r.fields[1].lengthDelimited?.dataText).toBe('hi');
  });

  it('returns totalBytes count', () => {
    const r = decodeProtobuf('08 01');
    expect(r.totalBytes).toBe(2);
  });

  it('returns warnings array', () => {
    const r = decodeProtobuf('08 01');
    expect(Array.isArray(r.warnings)).toBe(true);
  });
});

describe('formatProtobufResult', () => {
  it('returns placeholder for empty fields', () => {
    const out = formatProtobufResult({ fields: [], totalBytes: 0, warnings: [] });
    expect(out).toContain('no fields decoded');
  });

  it('formats varint field', () => {
    const r = decodeProtobuf('08 96 01');
    const out = formatProtobufResult(r);
    expect(out).toContain('Field 1');
    expect(out).toContain('Varint');
    expect(out).toContain('150');
  });

  it('formats length-delimited field with text', () => {
    const r = decodeProtobuf('0a 05 68 65 6c 6c 6f');
    const out = formatProtobufResult(r);
    expect(out).toContain('hello');
    expect(out).toContain('Length-delimited');
  });
});
