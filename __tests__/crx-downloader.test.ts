import {
  extractExtensionId,
  buildCrxUrl,
  CRX_ENDPOINT,
  DEFAULT_PRODVERSION,
} from '@/Components/Functions/CrxDownloaderTools/logic';

const ID = 'nngceckbapebfimnlniiiahkandclblb';

describe('extractExtensionId', () => {
  it('extracts from a current store URL', () => {
    expect(
      extractExtensionId(`https://chromewebstore.google.com/detail/bitwarden-password-manager/${ID}`),
    ).toEqual({ id: ID });
  });

  it('extracts from a legacy store URL', () => {
    expect(
      extractExtensionId(`https://chrome.google.com/webstore/detail/bitwarden-free-password-m/${ID}`),
    ).toEqual({ id: ID });
  });

  it('extracts from a URL with no slug', () => {
    expect(extractExtensionId(`https://chromewebstore.google.com/detail/${ID}`)).toEqual({ id: ID });
  });

  it('extracts from a URL with a query string', () => {
    expect(
      extractExtensionId(`https://chromewebstore.google.com/detail/bitwarden/${ID}?hl=en-GB`),
    ).toEqual({ id: ID });
  });

  it('extracts from a URL with a trailing path segment', () => {
    expect(
      extractExtensionId(`https://chromewebstore.google.com/detail/bitwarden/${ID}/related`),
    ).toEqual({ id: ID });
  });

  it('accepts a bare ID', () => {
    expect(extractExtensionId(ID)).toEqual({ id: ID });
  });

  it('accepts a bare ID with surrounding whitespace', () => {
    expect(extractExtensionId(`  ${ID}\n`)).toEqual({ id: ID });
  });

  it('is not fooled by a long slug', () => {
    // The slug is longer than 32 characters but contains letters outside a-p.
    const url = `https://chromewebstore.google.com/detail/super-quality-password-manager-extension/${ID}`;
    expect(extractExtensionId(url)).toEqual({ id: ID });
  });

  it('rejects empty input', () => {
    expect(extractExtensionId('   ')).toEqual({
      error: 'Enter a Chrome Web Store URL or extension ID',
    });
  });

  it('reports the length when an ID is too short', () => {
    const result = extractExtensionId(ID.slice(0, 31));
    expect(result).toEqual({ error: 'Extension IDs are 32 characters long (found 31)' });
  });

  it('reports the length when an ID is too long', () => {
    const result = extractExtensionId(`${ID}a`);
    expect(result).toEqual({ error: 'Extension IDs are 32 characters long (found 33)' });
  });

  it('reports the alphabet when a 32-character token uses other letters', () => {
    expect(extractExtensionId('z'.repeat(32))).toEqual({
      error: 'Extension IDs use only the letters a–p',
    });
  });

  it('reports the alphabet when a 32-character token contains digits', () => {
    expect(extractExtensionId(`${'a'.repeat(31)}9`)).toEqual({
      error: 'Extension IDs use only the letters a–p',
    });
  });

  it('rejects input with no ID-shaped token at all', () => {
    expect(extractExtensionId('https://example.com/some/page')).toEqual({
      error: 'Could not find a 32-character extension ID in that input',
    });
  });
});

describe('buildCrxUrl', () => {
  it('builds the exact endpoint URL with defaults', () => {
    expect(buildCrxUrl({ id: ID })).toBe(
      'https://clients2.google.com/service/update2/crx?response=redirect' +
        '&acceptformat=crx3' +
        '&prodversion=9999.0.0.0' +
        `&x=id%3D${ID}%26installsource%3Dondemand%26uc`,
    );
  });

  it('double-encodes the x parameter so it decodes to a query string', () => {
    const url = new URL(buildCrxUrl({ id: ID }));
    expect(url.searchParams.get('x')).toBe(`id=${ID}&installsource=ondemand&uc`);
  });

  it('points at the update endpoint', () => {
    expect(buildCrxUrl({ id: ID }).startsWith(`${CRX_ENDPOINT}?`)).toBe(true);
  });

  it('defaults prodversion to the sentinel that always serves the newest build', () => {
    const url = new URL(buildCrxUrl({ id: ID }));
    expect(url.searchParams.get('prodversion')).toBe(DEFAULT_PRODVERSION);
  });

  it('honours a custom prodversion', () => {
    const url = new URL(buildCrxUrl({ id: ID, prodversion: '102.0.5005.61' }));
    expect(url.searchParams.get('prodversion')).toBe('102.0.5005.61');
  });

  it('honours the crx2 fallback format', () => {
    expect(buildCrxUrl({ id: ID, acceptformat: 'crx2,crx3' })).toContain('&acceptformat=crx2,crx3');
  });

  it('always requests a redirect to the file', () => {
    const url = new URL(buildCrxUrl({ id: ID }));
    expect(url.searchParams.get('response')).toBe('redirect');
  });

  it('throws on an invalid ID', () => {
    expect(() => buildCrxUrl({ id: 'not-an-id' })).toThrow('Invalid extension ID');
  });
});
