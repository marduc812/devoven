import { generateUuidBulk, formatUuidBulk } from '@/Components/Functions/UuidBulkTools/logic';
describe('generateUuidBulk', () => {
  it('generates correct count', () => expect(generateUuidBulk(5)).toHaveLength(5));
  it('generates valid UUID format', () => {
    const uuids = generateUuidBulk(3);
    for (const uuid of uuids) {
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    }
  });
  it('generates uppercase UUIDs', () => {
    const uuids = generateUuidBulk(1, 'uppercase');
    expect(uuids[0]).toMatch(/^[0-9A-F-]+$/);
  });
  it('generates no-hyphens format', () => {
    const uuid = generateUuidBulk(1, 'no-hyphens')[0];
    expect(uuid).not.toContain('-');
    expect(uuid).toHaveLength(32);
  });
  it('generates unique UUIDs', () => {
    const uuids = generateUuidBulk(100);
    expect(new Set(uuids).size).toBe(100);
  });
  it('throws for count > 1000', () => expect(() => generateUuidBulk(1001)).toThrow());
  it('throws for count < 1', () => expect(() => generateUuidBulk(0)).toThrow());
});
describe('formatUuidBulk', () => {
  it('returns n UUIDs joined by newlines', () => {
    const r = formatUuidBulk('5');
    expect(r.split('\n')).toHaveLength(5);
  });
  it('throws for invalid input', () => expect(() => formatUuidBulk('abc')).toThrow());
});
