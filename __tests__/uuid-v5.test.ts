import { generateUuidV5, NAMESPACES, formatUuidV5 } from '@/Components/Functions/UuidV5Tools/logic';

describe('generateUuidV5', () => {
  it('generates a valid UUID v5 format', () => {
    const uuid = generateUuidV5(NAMESPACES.DNS, 'example.com');
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('produces a stable deterministic UUID for DNS + www.example.com', () => {
    // Deterministic: same input always yields same output
    const uuid = generateUuidV5(NAMESPACES.DNS, 'www.example.com');
    // Must be valid v5 format
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    // Must be stable across calls
    expect(generateUuidV5(NAMESPACES.DNS, 'www.example.com')).toBe(uuid);
  });

  it('is deterministic', () => {
    const a = generateUuidV5(NAMESPACES.URL, 'https://devoven.com');
    const b = generateUuidV5(NAMESPACES.URL, 'https://devoven.com');
    expect(a).toBe(b);
  });

  it('differs for different names', () => {
    const a = generateUuidV5(NAMESPACES.DNS, 'foo.com');
    const b = generateUuidV5(NAMESPACES.DNS, 'bar.com');
    expect(a).not.toBe(b);
  });

  it('differs for different namespaces', () => {
    const a = generateUuidV5(NAMESPACES.DNS, 'test');
    const b = generateUuidV5(NAMESPACES.URL, 'test');
    expect(a).not.toBe(b);
  });

  it('version nibble is 5', () => {
    const uuid = generateUuidV5(NAMESPACES.OID, 'test');
    expect(uuid[14]).toBe('5');
  });

  it('variant bits are correct', () => {
    const uuid = generateUuidV5(NAMESPACES.X500, 'test');
    const variantChar = uuid[19];
    expect(['8', '9', 'a', 'b']).toContain(variantChar);
  });
});

describe('formatUuidV5', () => {
  it('includes UUID v5 line', () => {
    const out = formatUuidV5('DNS', 'example.com');
    expect(out).toContain('UUID v5:');
    expect(out).toContain('example.com');
  });
  it('throws when name is empty', () => {
    expect(() => formatUuidV5('DNS', '')).toThrow('Name is required');
  });
});
