import {
  parseRateString,
  calculateRateLimit,
  rateFromParts,
  marginRates,
  requestInterval,
  humanDuration,
  tokenBucketParams,
  perClientRates,
  backoffSchedule,
} from '@/Components/Functions/RateLimitCalcTools/logic';

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

describe('rateFromParts', () => {
  it('matches the parser for the same rate', () => {
    const parsed = parseRateString('1000/hour')!;
    const built = rateFromParts(1000, 'hour');
    expect(built).toEqual(parsed);
  });

  it('handles fractional rates', () => {
    expect(rateFromParts(0.5, 'second').perMinute).toBeCloseTo(30, 5);
  });
});

describe('humanDuration', () => {
  it('formats sub-second gaps in milliseconds', () => {
    expect(humanDuration(0.25)).toBe('250 ms');
  });

  it('formats minutes and hours', () => {
    expect(humanDuration(90)).toBe('1 min 30 s');
    expect(humanDuration(3660)).toBe('1 h 1 min');
  });

  it('formats days', () => {
    expect(humanDuration(90000)).toBe('1 d 1 h');
  });

  it('returns 0 s for non-positive input', () => {
    expect(humanDuration(0)).toBe('0 s');
    expect(humanDuration(-5)).toBe('0 s');
  });
});

describe('requestInterval', () => {
  it('inverts the per-second rate', () => {
    expect(requestInterval(4)).toBe(0.25);
  });

  it('returns 0 when the rate is 0', () => {
    expect(requestInterval(0)).toBe(0);
  });
});

describe('marginRates', () => {
  it('scales every period by the same fraction', () => {
    const m = marginRates(10, 0.9);
    expect(m.perSecond).toBeCloseTo(9, 5);
    expect(m.perMinute).toBeCloseTo(540, 5);
    expect(m.perHour).toBeCloseTo(32400, 5);
  });
});

describe('tokenBucketParams', () => {
  it('sizes the bucket to the burst window', () => {
    const b = tokenBucketParams(5, 10);
    expect(b.capacity).toBe(50);
    expect(b.refillSeconds).toBeCloseTo(10, 5);
  });

  it('never drops below one token', () => {
    expect(tokenBucketParams(0.001, 10).capacity).toBe(1);
  });
});

describe('perClientRates', () => {
  it('divides the rate evenly', () => {
    const each = perClientRates(12, 4);
    expect(each.perSecond).toBe(3);
    expect(each.intervalSeconds).toBeCloseTo(1 / 3, 5);
  });

  it('treats fewer than one client as one', () => {
    expect(perClientRates(12, 0).clients).toBe(1);
  });
});

describe('backoffSchedule', () => {
  it('doubles each attempt', () => {
    const steps = backoffSchedule(1, 4, 300);
    expect(steps.map(s => s.delaySeconds)).toEqual([1, 2, 4, 8]);
    expect(steps[3].cumulativeSeconds).toBe(15);
  });

  it('clamps to the cap', () => {
    const steps = backoffSchedule(10, 6, 30);
    expect(steps.map(s => s.delaySeconds)).toEqual([10, 20, 30, 30, 30, 30]);
  });
});
