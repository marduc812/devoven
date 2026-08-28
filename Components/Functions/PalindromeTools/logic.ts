export function isPalindrome(text: string, ignoreSpaces = true, ignoreCase = true): boolean {
  let cleaned = text;
  if (ignoreCase) cleaned = cleaned.toLowerCase();
  if (ignoreSpaces) cleaned = cleaned.replace(/[^a-z0-9]/gi, '');
  else cleaned = cleaned.replace(/[^a-zA-Z0-9]/g, '');
  return cleaned === cleaned.split('').reverse().join('');
}

export function findLongestPalindrome(text: string): string {
  let longest = '';
  for (let i = 0; i < text.length; i++) {
    // Odd length
    let lo = i, hi = i;
    while (lo > 0 && hi < text.length - 1 && text[lo - 1].toLowerCase() === text[hi + 1].toLowerCase()) { lo--; hi++; }
    if (hi - lo + 1 > longest.length) longest = text.slice(lo, hi + 1);
    // Even length
    lo = i; hi = i + 1;
    while (lo >= 0 && hi < text.length && text[lo].toLowerCase() === text[hi].toLowerCase()) { lo--; hi++; }
    if (hi - lo - 1 > longest.length) longest = text.slice(lo + 1, hi);
  }
  return longest;
}

export function analyzePalindrome(input: string): string {
  if (!input.trim()) throw new Error('Enter some text');
  const strict = isPalindrome(input, false, false);
  const caseInsensitive = isPalindrome(input, false, true);
  const ignoreAll = isPalindrome(input, true, true);
  const longest = findLongestPalindrome(input);

  const cleaned = input.toLowerCase().replace(/[^a-z0-9]/g, '');
  const reversed = cleaned.split('').reverse().join('');

  return [
    `Input:                "${input}"`,
    `Strict palindrome:    ${strict ? 'Yes ✓' : 'No ✗'}`,
    `Case-insensitive:     ${caseInsensitive ? 'Yes ✓' : 'No ✗'}`,
    `Ignore spaces/punct:  ${ignoreAll ? 'Yes ✓' : 'No ✗'}`,
    ``,
    `Cleaned:  ${cleaned}`,
    `Reversed: ${reversed}`,
    ``,
    `Longest palindromic substring: "${longest}"`,
  ].join('\n');
}
