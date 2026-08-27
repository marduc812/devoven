import { parseRateString, calculateRateLimit } from '@/Components/Functions/RateLimitCalcTools/logic';

describe('parseRateString', () => {
  it('parses 1000/hour', () => {
    const r = parseRateString('1000/hour');
    expect(r).not.toBeNull();
    expect(r!.requests).toBe(1000);
    expect(r!.unit).toBe('hour');
    expect(r!.perSecond).toBeCloseTo(1000 / 3600, 5);
  });

  it('parses 100 per minute', () => {
    const r = parseRateString('100 per minute');
    expect(r).not.toBeNull();
    expect(r!.requests).toBe(100);
    expect(r!.unit).toBe('minute');
    expect(r!.perSecond).toBeCloseTo(100 / 60, 5);
  });

  it('parses 50 req/s', () => {
    const r = parseRateString('50 req/s');
    expect(r).not.toBeNull();
    expect(r!.perSecond).toBe(50);
  });

  it('parses 10000 requests per day', () => {
    const r = parseRateString('10000 requests per day');
    expect(r).not.toBeNull();
    expect(r!.unit).toBe('day');
    expect(r!.perDay).toBe(10000);
  });

  it('returns null for invalid input', () => {
    expect(parseRateString('invalid')).toBeNull();
    expect(parseRateString('')).toBeNull();
  });
});

describe('calculateRateLimit', () => {
  it('returns correct safety margins for 1000/hour', () => {
    const result = calculateRateLimit('1000/hour');
    expect(result).not.toBeNull();
    expect(result!.safety80.perHour).toBeCloseTo(800, 0);
    expect(result!.safety90.perHour).toBeCloseTo(900, 0);
  });

  it('contains formatted output', () => {
    const result = calculateRateLimit('60/minute');
    expect(result).not.toBeNull();
    expect(result!.formatted).toContain('Rate Limit Analysis');
    expect(result!.formatted).toContain('Token Bucket');
    expect(result!.formatted).toContain('Retry-After');
  });

  it('returns null for invalid input', () => {
    expect(calculateRateLimit('xyz')).toBeNull();
  });

  it('calculates token bucket capacity', () => {
    const result = calculateRateLimit('10/second');
    expect(result).not.toBeNull();
    expect(result!.tokenBucket.capacity).toBeGreaterThan(0);
  });
});
