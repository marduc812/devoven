import { decodeProto, decodeProtoBytes, jsonToProtoSkeleton } from '@/Components/Functions/ProtobufTools/logic';

describe('decodeProtoBytes', () => {
  it('decodes a varint field (field 1, type 0, value 150)', () => {
    // Tag: field 1, wire type 0 = 0x08; value 150 = varint [0x96, 0x01]
    const result = decodeProtoBytes([0x08, 0x96, 0x01]);
    expect(result.fields).toHaveLength(1);
    expect(result.fields[0].fieldNumber).toBe(1);
    expect(result.fields[0].wireType).toBe(0);
    expect(result.fields[0].wireTypeLabel).toBe('Varint');
    expect(result.fields[0].interpretations.some(i => i.includes('150'))).toBe(true);
  });

  it('decodes a length-delimited string field', () => {
    // Tag: field 2, wire type 2 = 0x12; length 5; "Hello"
    const bytes = [0x12, 0x05, 0x48, 0x65, 0x6c, 0x6c, 0x6f];
    const result = decodeProtoBytes(bytes);
    expect(result.fields).toHaveLength(1);
    expect(result.fields[0].fieldNumber).toBe(2);
    expect(result.fields[0].wireType).toBe(2);
    expect(result.fields[0].interpretations.some(i => i.includes('Hello'))).toBe(true);
  });

  it('returns error for field number 0', () => {
    // Tag = 0x00 = field 0, wire type 0
    const result = decodeProtoBytes([0x00, 0x00]);
    expect(result.error).toBeTruthy();
  });

  it('handles multiple fields', () => {
    // Field 1 varint 1, Field 2 varint 2
    const result = decodeProtoBytes([0x08, 0x01, 0x10, 0x02]);
    expect(result.fields).toHaveLength(2);
    expect(result.fields[0].fieldNumber).toBe(1);
    expect(result.fields[1].fieldNumber).toBe(2);
  });

  it('decodes empty bytes', () => {
    const result = decodeProtoBytes([]);
    expect(result.fields).toHaveLength(0);
  });
});

describe('decodeProto', () => {
  it('returns empty on empty input', () => {
    expect(decodeProto('', 'hex')).toBe('');
  });

  it('decodes hex encoded proto', () => {
    const output = decodeProto('08 96 01', 'hex');
    expect(output).toContain('Field 1');
    expect(output).toContain('Varint');
  });

  it('decodes base64 encoded proto', () => {
    // 0x08 0x96 0x01 in base64
    const base64 = Buffer.from([0x08, 0x96, 0x01]).toString('base64');
    const output = decodeProto(base64, 'base64');
    expect(output).toContain('Field 1');
  });

  it('returns error message on bad hex', () => {
    const output = decodeProto('ZZ ZZ', 'hex');
    expect(output).toContain('Empty');
  });

  it('handles string field via hex', () => {
    const output = decodeProto('12 05 48 65 6c 6c 6f', 'hex');
    expect(output).toContain('Hello');
  });
});

describe('jsonToProtoSkeleton', () => {
  it('returns empty on empty input', () => {
    expect(jsonToProtoSkeleton('')).toBe('');
  });

  it('throws on invalid JSON', () => {
    expect(() => jsonToProtoSkeleton('{bad}')).toThrow('Invalid JSON');
  });

  it('throws on non-object top level', () => {
    expect(() => jsonToProtoSkeleton('[1, 2, 3]')).toThrow('Top-level');
  });

  it('generates proto3 syntax declaration', () => {
    const output = jsonToProtoSkeleton('{"name": "Alice"}');
    expect(output).toContain('syntax = "proto3"');
  });

  it('maps string to string type', () => {
    const output = jsonToProtoSkeleton('{"name": "Alice"}');
    expect(output).toContain('string name');
  });

  it('maps integer to int64', () => {
    const output = jsonToProtoSkeleton('{"age": 30}');
    expect(output).toContain('int64 age');
  });

  it('maps boolean to bool', () => {
    const output = jsonToProtoSkeleton('{"active": true}');
    expect(output).toContain('bool active');
  });

  it('maps float to double', () => {
    const output = jsonToProtoSkeleton('{"score": 3.14}');
    expect(output).toContain('double score');
  });

  it('maps array to repeated', () => {
    const output = jsonToProtoSkeleton('{"tags": ["a", "b"]}');
    expect(output).toContain('repeated string tags');
  });

  it('assigns sequential field numbers', () => {
    const output = jsonToProtoSkeleton('{"a": 1, "b": 2}');
    expect(output).toContain('= 1;');
    expect(output).toContain('= 2;');
  });

  it('converts camelCase to snake_case', () => {
    const output = jsonToProtoSkeleton('{"firstName": "Alice"}');
    expect(output).toContain('first_name');
  });
});
