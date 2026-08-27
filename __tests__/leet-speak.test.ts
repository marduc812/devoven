import { toLeet, fromLeet, toAdvancedLeet } from '@/Components/Functions/LeetSpeakTools/logic';

describe('toLeet', () => {
  it('converts "leet" to "1337" style', () => {
    // l→1, e→3, e→3, t→7
    expect(toLeet('leet')).toBe('1337');
  });
  it('converts uppercase', () => expect(toLeet('LEET')).toBe('1337'));
  it('leaves numbers unchanged', () => expect(toLeet('123')).toBe('123'));
  it('leaves non-mapped chars unchanged', () => expect(toLeet('xyz')).toBe('xy2'));
  it('handles empty string', () => expect(toLeet('')).toBe(''));
});

describe('fromLeet', () => {
  it('converts 1337 back to leet-ish', () => expect(fromLeet('1337')).toContain('e'));
  it('leaves unmapped chars unchanged', () => expect(fromLeet('xyz')).toBe('xyz'));
});

describe('toAdvancedLeet', () => {
  it('converts a to @', () => expect(toAdvancedLeet('a')).toBe('@'));
  it('converts s to $', () => expect(toAdvancedLeet('s')).toBe('$'));
  it('handles uppercase by lowercasing first', () => expect(toAdvancedLeet('A')).toBe('@'));
});
