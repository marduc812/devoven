export type RateLimitAlgorithm = 'token-bucket' | 'leaky-bucket' | 'fixed-window' | 'sliding-window';
export type RateUnit = 'per-second' | 'per-minute' | 'per-hour';

export interface RateLimiterInput {
  rate: number;
  unit: RateUnit;
  burstSize: number;
  algorithm: RateLimitAlgorithm;
  trafficRate?: number;
  trafficUnit?: RateUnit;
}

export interface RateLimiterResult {
  sustainedRatePerSecond: number;
  sustainedRatePerMinute: number;
  sustainedRatePerHour: number;
  burstCapacity: number;
  recoveryTimeAfterBurst: string;
  waitTimeIfLimitHit: string;
  tokenRefillRate: string;
  algorithmDescription: string;
  trafficAnalysis: string;
  headers: string;
}

export function toPerSecond(rate: number, unit: RateUnit): number {
  if (unit === 'per-second') return rate;
  if (unit === 'per-minute') return rate / 60;
  return rate / 3600;
}

export function formatDuration(seconds: number): string {
  if (seconds < 0.001) return '<1 ms';
  if (seconds < 1) return `${(seconds * 1000).toFixed(1)} ms`;
  if (seconds < 60) return `${seconds.toFixed(2)} s`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s.toFixed(0)}s`;
  }
  const h = Math.floor(seconds / 3600);
  const rem = seconds % 3600;
  const m = Math.floor(rem / 60);
  return `${h}h ${m}m`;
}

export function algorithmDescription(algorithm: RateLimitAlgorithm): string {
  switch (algorithm) {
    case 'token-bucket':
      return 'Token Bucket: Tokens accumulate up to burst size at the refill rate. Requests consume tokens; refused when empty. Allows bursts up to capacity.';
    case 'leaky-bucket':
      return 'Leaky Bucket: Requests enter a queue (bucket) and are processed at a fixed rate. Excess requests overflow (dropped). Provides smooth output rate.';
    case 'fixed-window':
      return 'Fixed Window: Counts requests in fixed time windows (e.g. per minute). Counter resets at window boundary. Vulnerable to burst at window edges.';
    case 'sliding-window':
      return 'Sliding Window: Tracks request timestamps and counts requests in a rolling time window. Smoother than fixed window; prevents edge-burst attacks.';
  }
}

export function calculateRateLimiter(input: RateLimiterInput): RateLimiterResult {
  const rps = toPerSecond(input.rate, input.unit);
  if (rps <= 0) throw new Error('Rate must be greater than 0');
  if (input.burstSize < 1) throw new Error('Burst size must be at least 1');

  const sustainedRatePerSecond = rps;
  const sustainedRatePerMinute = rps * 60;
  const sustainedRatePerHour = rps * 3600;

  const burstCapacity = input.burstSize;
  const refillRate = rps; // tokens per second

  // Recovery time: how long to refill full burst after it's exhausted
  const recoverySeconds = burstCapacity / refillRate;
  const recoveryTime = formatDuration(recoverySeconds);

  // Wait time if limit hit: time to wait for 1 token
  const waitSeconds = 1 / refillRate;
  const waitTime = formatDuration(waitSeconds);

  const tokenRefillRate =
    refillRate >= 1
      ? `${refillRate.toFixed(2)} tokens/second`
      : `1 token every ${formatDuration(1 / refillRate)}`;

  const algDesc = algorithmDescription(input.algorithm);

  // Traffic analysis
  let trafficAnalysis = 'No traffic pattern provided.';
  if (input.trafficRate !== undefined && input.trafficUnit !== undefined) {
    const trafficRps = toPerSecond(input.trafficRate, input.trafficUnit);
    if (trafficRps <= sustainedRatePerSecond) {
      const utilizationPct = ((trafficRps / sustainedRatePerSecond) * 100).toFixed(1);
      trafficAnalysis = `Traffic (${input.trafficRate} ${input.trafficUnit.replace('per-', '/')}) is WITHIN limit. Utilization: ${utilizationPct}%. No rate limiting expected.`;
    } else {
      const excessRps = trafficRps - sustainedRatePerSecond;
      const dropRatePct = ((excessRps / trafficRps) * 100).toFixed(1);
      trafficAnalysis = `Traffic (${input.trafficRate} ${input.trafficUnit.replace('per-', '/')}) EXCEEDS limit by ${excessRps.toFixed(2)} req/s. ~${dropRatePct}% of requests will be rate-limited. Burst capacity of ${burstCapacity} requests may absorb short spikes.`;
    }
  }

  // Suggest HTTP headers
  const limitPerMin = Math.round(sustainedRatePerMinute);
  const headers = [
    `X-RateLimit-Limit: ${limitPerMin}`,
    `X-RateLimit-Remaining: <current remaining>`,
    `X-RateLimit-Reset: <unix timestamp of window reset>`,
    `Retry-After: ${Math.ceil(waitSeconds)}`,
  ].join('\n');

  return {
    sustainedRatePerSecond,
    sustainedRatePerMinute,
    sustainedRatePerHour,
    burstCapacity,
    recoveryTimeAfterBurst: recoveryTime,
    waitTimeIfLimitHit: waitTime,
    tokenRefillRate,
    algorithmDescription: algDesc,
    trafficAnalysis,
    headers,
  };
}

export function parseRateLimiterInput(text: string): RateLimiterInput {
  // Format: "rate unit burst algorithm [traffic trafficUnit]"
  // e.g. "100 per-minute 200 token-bucket"
  // e.g. "10 per-second 50 sliding-window 15 per-second"
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) throw new Error('Input is empty');

  const tokens = lines[0].split(/\s+/);
  if (tokens.length < 4) {
    throw new Error('Expected: <rate> <unit> <burst> <algorithm> [traffic trafficUnit]');
  }

  const rate = parseFloat(tokens[0]);
  if (isNaN(rate) || rate <= 0) throw new Error('Rate must be a positive number');

  const unit = tokens[1] as RateUnit;
  if (!['per-second', 'per-minute', 'per-hour'].includes(unit)) {
    throw new Error('Unit must be: per-second, per-minute, or per-hour');
  }

  const burstSize = parseInt(tokens[2], 10);
  if (isNaN(burstSize) || burstSize < 1) throw new Error('Burst size must be a positive integer');

  const algorithm = tokens[3] as RateLimitAlgorithm;
  if (!['token-bucket', 'leaky-bucket', 'fixed-window', 'sliding-window'].includes(algorithm)) {
    throw new Error('Algorithm must be: token-bucket, leaky-bucket, fixed-window, or sliding-window');
  }

  let trafficRate: number | undefined;
  let trafficUnit: RateUnit | undefined;
  if (tokens.length >= 6) {
    trafficRate = parseFloat(tokens[4]);
    trafficUnit = tokens[5] as RateUnit;
    if (isNaN(trafficRate) || trafficRate < 0) throw new Error('Traffic rate must be a non-negative number');
    if (!['per-second', 'per-minute', 'per-hour'].includes(trafficUnit)) {
      throw new Error('Traffic unit must be: per-second, per-minute, or per-hour');
    }
  }

  return { rate, unit, burstSize, algorithm, trafficRate, trafficUnit };
}

export function formatRateLimiterResult(result: RateLimiterResult): string {
  const lines: string[] = [
    '=== Rate Limiter Parameters ===',
    '',
    `Sustained Rate`,
    `  ${result.sustainedRatePerSecond.toFixed(4)} req/s`,
    `  ${result.sustainedRatePerMinute.toFixed(2)} req/min`,
    `  ${result.sustainedRatePerHour.toFixed(0)} req/hr`,
    '',
    `Burst Capacity: ${result.burstCapacity} requests`,
    `Token Refill Rate: ${result.tokenRefillRate}`,
    '',
    `Recovery Time After Full Burst: ${result.recoveryTimeAfterBurst}`,
    `Wait Time if Limit Hit: ${result.waitTimeIfLimitHit}`,
    '',
    '=== Algorithm ===',
    result.algorithmDescription,
    '',
    '=== Traffic Analysis ===',
    result.trafficAnalysis,
    '',
    '=== Suggested HTTP Headers ===',
    result.headers,
  ];
  return lines.join('\n');
}
