import { haversineDistance, parseCoordsInput } from '@/Components/Functions/HaversineTools/logic';

describe('haversineDistance', () => {
  it('returns 0 for identical points', () => expect(haversineDistance(0, 0, 0, 0)).toBe(0));
  it('calculates London to Paris (~340km)', () => {
    const dist = haversineDistance(51.5074, -0.1278, 48.8566, 2.3522);
    expect(dist).toBeGreaterThan(330);
    expect(dist).toBeLessThan(350);
  });
  it('calculates NY to LA (~3940km)', () => {
    const dist = haversineDistance(40.7128, -74.0060, 34.0522, -118.2437);
    expect(dist).toBeGreaterThan(3900);
    expect(dist).toBeLessThan(4000);
  });
  it('is symmetric (a→b = b→a)', () => {
    const d1 = haversineDistance(51.5, -0.1, 48.8, 2.3);
    const d2 = haversineDistance(48.8, 2.3, 51.5, -0.1);
    expect(Math.abs(d1 - d2)).toBeLessThan(0.001);
  });
});

describe('parseCoordsInput', () => {
  it('calculates distance from two coord lines', () => {
    const r = parseCoordsInput('51.5074,-0.1278\n48.8566,2.3522');
    expect(r).toContain('Kilometers:');
    expect(r).toContain('Miles:');
  });
  it('includes nautical miles', () => {
    const r = parseCoordsInput('0,0\n0,1');
    expect(r).toContain('Nautical miles:');
  });
  it('throws for single line', () => expect(() => parseCoordsInput('51.5,0.1')).toThrow());
  it('throws for invalid coords', () => expect(() => parseCoordsInput('abc\ndef')).toThrow());
});
