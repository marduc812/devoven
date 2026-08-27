import {
  toPerSecond,
  formatDuration,
  calculateRateLimiter,
  parseRateLimiterInput,
  formatRateLimiterResult,
} from '@/Components/Functions/RateLimiterTools/logic';

describe('toPerSecond', () => {
  it('per-second stays same', () => expect(toPerSecond(10, 'per-second')).toBeCloseTo(10));
  it('per-minute divides by 60', () => expect(toPerSecond(60, 'per-minute')).toBeCloseTo(1));
  it('per-hour divides by 3600', () => expect(toPerSecond(3600, 'per-hour')).toBeCloseTo(1));
});

describe('formatDuration', () => {
  it('formats ms', () => expect(formatDuration(0.001)).toContain('ms'));
  it('formats seconds', () => expect(formatDuration(5)).toContain('s'));
  it('formats minutes', () => expect(formatDuration(90)).toContain('m'));
  it('formats hours', () => expect(formatDuration(7200)).toContain('h'));
});

describe('calculateRateLimiter', () => {
  it('calculates token bucket parameters', () => {
    const result = calculateRateLimiter({
      rate: 100,
      unit: 'per-minute',
      burstSize: 200,
      algorithm: 'token-bucket',
    });
    expect(result.sustainedRatePerMinute).toBeCloseTo(100);
    expect(result.burstCapacity).toBe(200);
    expect(result.recoveryTimeAfterBurst).toBeTruthy();
    expect(result.waitTimeIfLimitHit).toBeTruthy();
    expect(result.tokenRefillRate).toBeTruthy();
  });

  it('throws on zero rate', () => {
    expect(() => calculateRateLimiter({ rate: 0, unit: 'per-second', burstSize: 10, algorithm: 'token-bucket' })).toThrow();
  });

  it('throws on zero burst size', () => {
    expect(() => calculateRateLimiter({ rate: 10, unit: 'per-second', burstSize: 0, algorithm: 'token-bucket' })).toThrow();
  });

  it('detects traffic within limit', () => {
    const result = calculateRateLimiter({
      rate: 100,
      unit: 'per-minute',
      burstSize: 50,
      algorithm: 'fixed-window',
      trafficRate: 50,
      trafficUnit: 'per-minute',
    });
    expect(result.trafficAnalysis).toContain('WITHIN');
  });

  it('detects traffic exceeding limit', () => {
    const result = calculateRateLimiter({
      rate: 100,
      unit: 'per-minute',
      burstSize: 50,
      algorithm: 'sliding-window',
      trafficRate: 200,
      trafficUnit: 'per-minute',
    });
    expect(result.trafficAnalysis).toContain('EXCEEDS');
  });

  it('includes HTTP headers suggestion', () => {
    const result = calculateRateLimiter({ rate: 60, unit: 'per-minute', burstSize: 10, algorithm: 'token-bucket' });
    expect(result.headers).toContain('X-RateLimit-Limit');
    expect(result.headers).toContain('Retry-After');
  });
});

describe('parseRateLimiterInput', () => {
  it('parses basic input', () => {
    const r = parseRateLimiterInput('100 per-minute 200 token-bucket');
    expect(r.rate).toBe(100);
    expect(r.unit).toBe('per-minute');
    expect(r.burstSize).toBe(200);
    expect(r.algorithm).toBe('token-bucket');
  });

  it('parses input with traffic', () => {
    const r = parseRateLimiterInput('100 per-minute 200 token-bucket 150 per-minute');
    expect(r.trafficRate).toBe(150);
    expect(r.trafficUnit).toBe('per-minute');
  });

  it('throws on missing args', () => {
    expect(() => parseRateLimiterInput('100 per-minute')).toThrow();
  });

  it('throws on invalid algorithm', () => {
    expect(() => parseRateLimiterInput('100 per-minute 50 unknown-algo')).toThrow();
  });

  it('throws on invalid unit', () => {
    expect(() => parseRateLimiterInput('100 per-century 50 token-bucket')).toThrow();
  });
});

describe('formatRateLimiterResult', () => {
  it('includes expected sections', () => {
    const result = calculateRateLimiter({ rate: 10, unit: 'per-second', burstSize: 20, algorithm: 'leaky-bucket' });
    const output = formatRateLimiterResult(result);
    expect(output).toContain('Rate Limiter Parameters');
    expect(output).toContain('Algorithm');
    expect(output).toContain('Suggested HTTP Headers');
  });
});
