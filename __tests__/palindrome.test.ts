import { isPalindrome, findLongestPalindrome, analyzePalindrome } from '@/Components/Functions/PalindromeTools/logic';
describe('isPalindrome', () => {
  it('"racecar" is a palindrome', () => expect(isPalindrome('racecar')).toBe(true));
  it('"hello" is not a palindrome', () => expect(isPalindrome('hello')).toBe(false));
  it('"A man a plan a canal Panama" is palindrome when ignoring spaces', () => {
    expect(isPalindrome('A man a plan a canal Panama', true, true)).toBe(true);
  });
  it('"Racecar" is palindrome case-insensitive', () => expect(isPalindrome('Racecar', false, true)).toBe(true));
  it('empty string is palindrome', () => expect(isPalindrome('')).toBe(true));
  it('"Was it a car or a cat I saw" is palindrome', () => {
    expect(isPalindrome('Was it a car or a cat I saw', true, true)).toBe(true);
  });
});
describe('findLongestPalindrome', () => {
  it('finds "racecar" in text', () => expect(findLongestPalindrome('aracecarb').toLowerCase()).toContain('racecar'));
  it('returns single char for no palindromes', () => expect(findLongestPalindrome('abc').length).toBeGreaterThanOrEqual(1));
});
describe('analyzePalindrome', () => {
  it('shows Yes for racecar', () => expect(analyzePalindrome('racecar')).toContain('Yes ✓'));
  it('includes cleaned and reversed', () => {
    const r = analyzePalindrome('hello');
    expect(r).toContain('Cleaned:');
    expect(r).toContain('Reversed:');
  });
  it('throws for empty', () => expect(() => analyzePalindrome('')).toThrow());
});
