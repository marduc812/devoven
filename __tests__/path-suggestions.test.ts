import { extractTargetSlug, getPathSuggestions, isNearMatch } from '@/Components/Functions/PathSuggestions';

const links = (pathname: string) => getPathSuggestions(pathname).map(s => s.link);
const names = (pathname: string) => getPathSuggestions(pathname).map(s => s.name);

describe('isNearMatch', () => {
  it('accepts identical words', () => expect(isNearMatch('base64', 'base64')).toBe(true));
  it('accepts one substitution', () => expect(isNearMatch('base65', 'base64')).toBe(true));
  it('accepts an adjacent transposition', () => expect(isNearMatch('base46', 'base64')).toBe(true));
  it('accepts one deletion', () => expect(isNearMatch('base6', 'base64')).toBe(true));
  it('accepts one insertion', () => expect(isNearMatch('base644', 'base64')).toBe(true));
  it('rejects two edits', () => expect(isNearMatch('bass46', 'base64')).toBe(false));
  it('rejects a large length gap', () => expect(isNearMatch('b', 'base64')).toBe(false));
  it('rejects unrelated words', () => expect(isNearMatch('sha256', 'base64')).toBe(false));
});

describe('extractTargetSlug', () => {
  it('reads a flat legacy path', () =>
    expect(extractTargetSlug('/string-to-bytes32')).toEqual({ slug: 'string-to-bytes32', category: undefined }));

  it('separates the category from the tool', () =>
    expect(extractTargetSlug('/converting/string-to-bytes32')).toEqual({ slug: 'string-to-bytes32', category: 'converting' }));

  it('strips a legacy file extension', () =>
    expect(extractTargetSlug('/base64-encode.html').slug).toBe('base64-encode'));

  it('decodes percent-encoding', () =>
    expect(extractTargetSlug('/base64%20encode').slug).toBe('base64 encode'));

  it('survives a malformed escape sequence', () =>
    expect(extractTargetSlug('/base64%zz').slug).toBe('base64%zz'));

  it('returns nothing for a bare category path', () =>
    expect(extractTargetSlug('/converting').slug).toBe(''));
});

describe('getPathSuggestions', () => {
  it('puts an exact slug first', () =>
    expect(links('/string-to-bytes32')[0]).toBe('/converting/string-to-bytes32'));

  it('puts the reverse tool first for the reverse slug', () =>
    expect(links('/bytes32-to-string')[0]).toBe('/converting/bytes32-to-string'));

  it('matches a near miss on the tool name', () =>
    expect(links('/base64-encoder')[0]).toBe('/encoding/base64-encode'));

  it('recovers from a transposed typo', () =>
    expect(links('/base64-encdoe')).toContain('/encoding/base64-encode'));

  it('uses the category as a tie-breaker, not as a search term', () => {
    // "converting" alone must not pull in the whole category.
    expect(getPathSuggestions('/converting')).toHaveLength(0);
  });

  it('still suggests when only the category is wrong', () =>
    expect(links('/hashing/string-to-bytes32')[0]).toBe('/converting/string-to-bytes32'));

  it('returns nothing for gibberish', () =>
    expect(getPathSuggestions('/qqqzzzwww-xyzzy')).toHaveLength(0));

  it('returns nothing for the root path', () =>
    expect(getPathSuggestions('/')).toHaveLength(0));

  it('caps the list at five entries', () =>
    expect(getPathSuggestions('/json').length).toBeLessThanOrEqual(5));

  it('honours a custom limit', () =>
    expect(getPathSuggestions('/json', 2).length).toBeLessThanOrEqual(2));

  it('does not return duplicates', () => {
    const result = names('/hash');
    expect(new Set(result).size).toBe(result.length);
  });
});
