import { extractUuidTimestamp, formatUuidTimestamp } from '@/Components/Functions/UuidTimestampTools/logic';

describe('extractUuidTimestamp - UUID v1', () => {
  // Known v1 UUID: 6ba7b810-9dad-11d1-80b4-00c04fd430c8
  // Generated around 1998
  const v1Uuid = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

  it('correctly identifies version 1', () => {
    const result = extractUuidTimestamp(v1Uuid);
    expect(result.version).toBe(1);
  });

  it('returns a timestamp for v1 UUID', () => {
    const result = extractUuidTimestamp(v1Uuid);
    expect(result.timestamp).toBeInstanceOf(Date);
  });

  it('returns node ID for v1 UUID', () => {
    const result = extractUuidTimestamp(v1Uuid);
    expect(result.nodeId).toBe('00c04fd430c8');
  });

  it('returns ISO formatted string', () => {
    const result = extractUuidTimestamp(v1Uuid);
    expect(result.formatted).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('handles curly brace wrapped UUID', () => {
    const result = extractUuidTimestamp(`{${v1Uuid}}`);
    expect(result.version).toBe(1);
  });
});

describe('extractUuidTimestamp - UUID v7', () => {
  // UUID v7: first 48 bits are Unix ms timestamp
  // Construct a v7 UUID for a known timestamp
  // timestamp 0x018f4b90c000 = ?
  // Let's use a real example: 01907f8a-c8e4-7000-93e4-a03d4f5b3fcf (approximately 2024)
  const v7Uuid = '01907f8a-c8e4-7000-93e4-a03d4f5b3fcf';

  it('correctly identifies version 7', () => {
    const result = extractUuidTimestamp(v7Uuid);
    expect(result.version).toBe(7);
  });

  it('returns a timestamp for v7 UUID', () => {
    const result = extractUuidTimestamp(v7Uuid);
    expect(result.timestamp).toBeInstanceOf(Date);
  });

  it('returns ISO formatted string for v7', () => {
    const result = extractUuidTimestamp(v7Uuid);
    expect(result.formatted).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('v7 timestamp is reasonable (after 2020)', () => {
    const result = extractUuidTimestamp(v7Uuid);
    expect(result.timestamp!.getFullYear()).toBeGreaterThanOrEqual(2020);
  });
});

describe('extractUuidTimestamp - other versions', () => {
  it('returns no timestamp for v4 UUID', () => {
    const v4 = '550e8400-e29b-41d4-a716-446655440000';
    const result = extractUuidTimestamp(v4);
    expect(result.version).toBe(4);
    expect(result.timestamp).toBeUndefined();
  });

  it('throws on invalid UUID', () => {
    expect(() => extractUuidTimestamp('not-a-uuid')).toThrow('Invalid UUID format');
  });

  it('throws on empty string', () => {
    expect(() => extractUuidTimestamp('')).toThrow();
  });
});

describe('formatUuidTimestamp', () => {
  const v1Uuid = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

  it('formats v1 UUID info with all fields', () => {
    const info = extractUuidTimestamp(v1Uuid);
    const result = formatUuidTimestamp(info);
    expect(result).toContain('Version:');
    expect(result).toContain('ISO 8601:');
    expect(result).toContain('Unix ms:');
    expect(result).toContain('Node ID:');
  });

  it('formats v7 UUID info without node ID', () => {
    const v7 = '01907f8a-c8e4-7000-93e4-a03d4f5b3fcf';
    const info = extractUuidTimestamp(v7);
    const result = formatUuidTimestamp(info);
    expect(result).toContain('Version:');
    expect(result).not.toContain('Node ID:');
  });

  it('returns message for non-timestamp UUID', () => {
    const v4 = '550e8400-e29b-41d4-a716-446655440000';
    const info = extractUuidTimestamp(v4);
    const result = formatUuidTimestamp(info);
    expect(result).toContain('v4');
  });
});
