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

// ─── Helpers for the interactive UI ──────────────────────────────────────────

/** Rates scaled by an arbitrary fraction of the limit (0.8 = 80% headroom). */
export function marginRates(perSecond: number, fraction: number) {
  return safetyMargin(perSecond, fraction);
}

/** Seconds between two requests when sending at exactly `perSecond`. */
export function requestInterval(perSecond: number): number {
  return perSecond > 0 ? 1 / perSecond : 0;
}

/** A duration in seconds written the way a person would say it. */
export function humanDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return '0 s';
  if (seconds < 0.001) return `${(seconds * 1_000_000).toFixed(0)} µs`;
  if (seconds < 1) return `${(seconds * 1000).toFixed(seconds < 0.01 ? 1 : 0)} ms`;
  if (seconds < 60) return `${seconds < 10 ? seconds.toFixed(2) : seconds.toFixed(1)} s`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return s ? `${m} min ${s} s` : `${m} min`;
  }
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    return m ? `${h} h ${m} min` : `${h} h`;
  }
  const d = Math.floor(seconds / 86400);
  const h = Math.round((seconds % 86400) / 3600);
  return h ? `${d} d ${h} h` : `${d} d`;
}

export type TokenBucketParams = {
  capacity: number;
  refillPerSecond: number;
  burstCapacity: number;
  drainSeconds: number;
  refillSeconds: number;
};

/**
 * Token bucket sized so a client can burst for `burstSeconds` of quota before
 * the bucket empties and the refill rate takes over.
 */
export function tokenBucketParams(perSecond: number, burstSeconds: number): TokenBucketParams {
  const capacity = Math.max(1, Math.round(perSecond * burstSeconds));
  return {
    capacity,
    refillPerSecond: perSecond,
    burstCapacity: capacity,
    drainSeconds: burstSeconds,
    refillSeconds: perSecond > 0 ? capacity / perSecond : 0,
  };
}

/** The quota one client gets when `clients` of them share the same limit. */
export function perClientRates(perSecond: number, clients: number) {
  const n = Math.max(1, Math.floor(clients));
  const each = perSecond / n;
  return {
    clients: n,
    perSecond: each,
    perMinute: each * 60,
    perHour: each * 3600,
    perDay: each * 86400,
    intervalSeconds: requestInterval(each),
  };
}

export type BackoffStep = { attempt: number; delaySeconds: number; cumulativeSeconds: number };

/**
 * Exponential backoff starting at `baseSeconds` and doubling, clamped to
 * `capSeconds`. Delays are what you wait *before* each retry.
 */
export function backoffSchedule(baseSeconds: number, attempts: number, capSeconds: number): BackoffStep[] {
  const base = baseSeconds > 0 ? baseSeconds : 1;
  const cap = capSeconds > 0 ? capSeconds : base;
  const steps: BackoffStep[] = [];
  let cumulative = 0;
  for (let i = 0; i < attempts; i++) {
    const delay = Math.min(base * Math.pow(2, i), cap);
    cumulative += delay;
    steps.push({ attempt: i + 1, delaySeconds: delay, cumulativeSeconds: cumulative });
  }
  return steps;
}

/** Build a ParsedRate straight from a number and a unit, skipping the parser. */
export function rateFromParts(requests: number, unit: RateUnit): ParsedRate {
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
