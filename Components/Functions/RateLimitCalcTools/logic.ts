// ─── API Rate Limit Calculator Logic ─────────────────────────────────────────

export type RateUnit = 'second' | 'minute' | 'hour' | 'day';

export type ParsedRate = {
  requests: number;
  unit: RateUnit;
  perSecond: number;
  perMinute: number;
  perHour: number;
  perDay: number;
};

export type RateLimitResult = {
  parsed: ParsedRate;
  safety80: { perSecond: number; perMinute: number; perHour: number; perDay: number };
  safety90: { perSecond: number; perMinute: number; perHour: number; perDay: number };
  tokenBucket: {
    capacity: number;
    refillRate: string;
    burstCapacity: number;
  };
  retryAfter: string;
  formatted: string;
};

const UNIT_TO_SECONDS: Record<RateUnit, number> = {
  second: 1,
  minute: 60,
  hour: 3600,
  day: 86400,
};

export function parseRateString(input: string): ParsedRate | null {
  const s = input.trim().toLowerCase();

  // Patterns: "1000/hour", "100 per minute", "1000 requests per hour", "50 req/s"
  const patterns: RegExp[] = [
    /^(\d+(?:\.\d+)?)\s*(?:requests?\s+)?(?:per|\/)\s*(second|minute|hour|day|sec|min|hr|s|m|h|d)s?$/,
    /^(\d+(?:\.\d+)?)\s*(?:req|reqs|requests?)?\s*(?:\/|per)\s*(second|minute|hour|day|sec|min|hr|s|m|h|d)s?$/,
  ];

  let requests = 0;
  let unitStr = '';

  for (const pat of patterns) {
    const m = s.match(pat);
    if (m) {
      requests = parseFloat(m[1]);
      unitStr = m[2];
      break;
    }
  }

  if (!requests) return null;

  const unitMap: Record<string, RateUnit> = {
    second: 'second', sec: 'second', s: 'second',
    minute: 'minute', min: 'minute', m: 'minute',
    hour: 'hour', hr: 'hour', h: 'hour',
    day: 'day', d: 'day',
  };

  const unit = unitMap[unitStr];
  if (!unit) return null;

  const perSecond = requests / UNIT_TO_SECONDS[unit];

  return {
    requests,
    unit,
    perSecond,
    perMinute: perSecond * 60,
    perHour: perSecond * 3600,
    perDay: perSecond * 86400,
  };
}

function safetyMargin(perSecond: number, pct: number) {
  const r = perSecond * pct;
  return {
    perSecond: r,
    perMinute: r * 60,
    perHour: r * 3600,
    perDay: r * 86400,
  };
}

function fmt(n: number): string {
  if (n < 0.01) return n.toExponential(2);
  if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(2) + 'k';
  return n % 1 === 0 ? String(n) : n.toFixed(4);
}

export function calculateRateLimit(input: string): RateLimitResult | null {
  const parsed = parseRateString(input);
  if (!parsed) return null;

  const safety80 = safetyMargin(parsed.perSecond, 0.8);
  const safety90 = safetyMargin(parsed.perSecond, 0.9);

  // Token bucket: capacity = burst = ~10x per-second rate (floor 1), fill rate = perSecond
  const burstCapacity = Math.max(1, Math.round(parsed.perSecond * 10));
  const tokenBucket = {
    capacity: burstCapacity,
    refillRate: `${fmt(parsed.perSecond)} tokens/second`,
    burstCapacity,
  };

  // Retry-After: if you hit the limit, wait 1 / perSecond seconds
  const retryAfterSec = parsed.perSecond > 0 ? 1 / parsed.perSecond : 0;
  const retryAfter = retryAfterSec < 1
    ? `${Math.round(retryAfterSec * 1000)} ms`
    : `${retryAfterSec.toFixed(2)} s`;

  const lines: string[] = [
    `╔══════════════════════════════════════════════════╗`,
    `║  Rate Limit Analysis                             ║`,
    `╚══════════════════════════════════════════════════╝`,
    ``,
    `Input:         ${parsed.requests} requests per ${parsed.unit}`,
    ``,
    `─── Rates ─────────────────────────────────────────`,
    `  Per second:  ${fmt(parsed.perSecond)}`,
    `  Per minute:  ${fmt(parsed.perMinute)}`,
    `  Per hour:    ${fmt(parsed.perHour)}`,
    `  Per day:     ${fmt(parsed.perDay)}`,
    ``,
    `─── With 80% Safety Margin ─────────────────────────`,
    `  Per second:  ${fmt(safety80.perSecond)}`,
    `  Per minute:  ${fmt(safety80.perMinute)}`,
    `  Per hour:    ${fmt(safety80.perHour)}`,
    `  Per day:     ${fmt(safety80.perDay)}`,
    ``,
    `─── With 90% Safety Margin ─────────────────────────`,
    `  Per second:  ${fmt(safety90.perSecond)}`,
    `  Per minute:  ${fmt(safety90.perMinute)}`,
    `  Per hour:    ${fmt(safety90.perHour)}`,
    `  Per day:     ${fmt(safety90.perDay)}`,
    ``,
    `─── Token Bucket Parameters ────────────────────────`,
    `  Bucket capacity:  ${tokenBucket.capacity} tokens`,
    `  Refill rate:      ${tokenBucket.refillRate}`,
    `  Max burst:        ${tokenBucket.burstCapacity} requests`,
    ``,
    `─── Retry-After ────────────────────────────────────`,
    `  Wait at least:    ${retryAfter} after being rate-limited`,
  ];

  return {
    parsed,
    safety80,
    safety90,
    tokenBucket,
    retryAfter,
    formatted: lines.join('\n'),
  };
}
