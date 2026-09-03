import { sanitizeAnalyticsUrl } from '@/lib/analytics';

describe('sanitizeAnalyticsUrl', () => {
  it('keeps origin and path', () => {
    expect(sanitizeAnalyticsUrl('https://www.devoven.com/encoding/base64')).toBe(
      'https://www.devoven.com/encoding/base64',
    );
  });

  it('drops a query string carrying tool input', () => {
    expect(
      sanitizeAnalyticsUrl('https://www.devoven.com/encoding/base64?from=hunter2&zeros=true'),
    ).toBe('https://www.devoven.com/encoding/base64');
  });

  it('drops the encoded pipeline the blocks builder syncs into the address bar', () => {
    expect(sanitizeAnalyticsUrl('https://www.devoven.com/blocks?p=eyJibG9ja3MiOlt7ImlkIjoi')).toBe(
      'https://www.devoven.com/blocks',
    );
  });

  it('drops the fragment', () => {
    expect(sanitizeAnalyticsUrl('https://www.devoven.com/search#q=secret')).toBe(
      'https://www.devoven.com/search',
    );
  });

  it('drops query and fragment together', () => {
    expect(sanitizeAnalyticsUrl('https://www.devoven.com/t?from=a#b')).toBe(
      'https://www.devoven.com/t',
    );
  });

  it('keeps a trailing slash as-is so paths are not merged', () => {
    expect(sanitizeAnalyticsUrl('https://www.devoven.com/')).toBe('https://www.devoven.com/');
  });

  it('preserves credentials-free ports', () => {
    expect(sanitizeAnalyticsUrl('http://localhost:3000/hashing/md5?from=x')).toBe(
      'http://localhost:3000/hashing/md5',
    );
  });

  it('handles a path-only url', () => {
    expect(sanitizeAnalyticsUrl('/encoding/base64?from=secret')).toBe('/encoding/base64');
  });

  it('still strips the query when the input is not a well-formed url', () => {
    // Junk parses as a relative path against the internal base rather than
    // throwing. What matters is that nothing after the '?' survives.
    expect(sanitizeAnalyticsUrl('not a url at all?from=secret')).not.toContain('secret');
  });

  it('is idempotent', () => {
    const once = sanitizeAnalyticsUrl('https://www.devoven.com/x?from=y#z');
    expect(sanitizeAnalyticsUrl(once)).toBe(once);
  });

  it('never lets a userinfo section through', () => {
    expect(sanitizeAnalyticsUrl('https://user:pass@www.devoven.com/x?from=y')).toBe(
      'https://www.devoven.com/x',
    );
  });
});
