import {
  toSeconds,
  calculateTtl,
  formatTtlResult,
  parseCacheControl,
  formatCacheControlParsed,
  processCacheTtl,
} from '@/Components/Functions/CacheTtlTools/logic';

const NOW = new Date('2025-01-01T00:00:00Z').getTime();

describe('toSeconds', () => {
  it('seconds', () => expect(toSeconds(1, 'seconds')).toBe(1));
  it('minutes', () => expect(toSeconds(1, 'minutes')).toBe(60));
  it('hours', () => expect(toSeconds(1, 'hours')).toBe(3600));
  it('days', () => expect(toSeconds(1, 'days')).toBe(86400));
});

describe('calculateTtl', () => {
  it('calculates 1 hour TTL', () => {
    const r = calculateTtl(1, 'hours', NOW);
    expect(r.seconds).toBe(3600);
    expect(r.minutes).toBeCloseTo(60);
    expect(r.hours).toBeCloseTo(1);
    expect(r.days).toBeCloseTo(1 / 24);
  });

  it('includes cache-control header', () => {
    const r = calculateTtl(3600, 'seconds', NOW);
    expect(r.cacheControl).toContain('max-age=3600');
    expect(r.cacheControl).toContain('s-maxage=3600');
    expect(r.cacheControl).toContain('stale-while-revalidate');
  });

  it('includes expires header', () => {
    const r = calculateTtl(60, 'seconds', NOW);
    expect(r.expires).toBeTruthy();
  });

  it('throws on zero value', () => {
    expect(() => calculateTtl(0, 'seconds', NOW)).toThrow();
  });

  it('includes CDN headers', () => {
    const r = calculateTtl(24, 'hours', NOW);
    expect(r.cloudflareCacheControl).toContain('max-age');
    expect(r.fastlySurrogateControl).toContain('max-age');
    expect(r.varnishBereqHttp).toContain('beresp.ttl');
  });
});

describe('parseCacheControl', () => {
  it('parses max-age directive', () => {
    const directives = parseCacheControl('max-age=3600');
    expect(directives).toHaveLength(1);
    expect(directives[0].directive).toBe('max-age');
    expect(directives[0].value).toBe('3600');
    expect(directives[0].description).toBeTruthy();
  });

  it('parses multiple directives', () => {
    const directives = parseCacheControl('max-age=3600, s-maxage=86400, no-cache');
    expect(directives).toHaveLength(3);
    expect(directives[2].directive).toBe('no-cache');
    expect(directives[2].value).toBeNull();
  });

  it('parses no-store', () => {
    const directives = parseCacheControl('no-store');
    expect(directives[0].directive).toBe('no-store');
    expect(directives[0].description).toContain('cache');
  });
});

describe('formatCacheControlParsed', () => {
  it('returns message for empty directives', () => {
    expect(formatCacheControlParsed([])).toBe('No directives found.');
  });

  it('includes directive info', () => {
    const directives = parseCacheControl('max-age=3600, no-store');
    const result = formatCacheControlParsed(directives);
    expect(result).toContain('max-age');
    expect(result).toContain('no-store');
  });
});

describe('processCacheTtl', () => {
  it('calculate mode returns TTL result', () => {
    const output = processCacheTtl('3600', 'calculate', 'seconds', NOW);
    expect(output).toContain('TTL in All Units');
    expect(output).toContain('Cache-Control');
  });

  it('parse mode returns directive breakdown', () => {
    const output = processCacheTtl('max-age=3600, no-cache', 'parse', 'seconds', NOW);
    expect(output).toContain('max-age');
    expect(output).toContain('no-cache');
  });

  it('returns empty string for empty input', () => {
    expect(processCacheTtl('', 'calculate', 'seconds', NOW)).toBe('');
  });

  it('throws on non-numeric input in calculate mode', () => {
    expect(() => processCacheTtl('abc', 'calculate', 'seconds', NOW)).toThrow();
  });
});
