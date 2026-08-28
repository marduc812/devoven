/**
 * Worker-backed measurement.
 *
 * A catastrophic regex blocks its thread until it finishes, which for an
 * exponential pattern can mean never. Terminating a worker is the only way to
 * abandon a running RegExp in JavaScript, so every measurement happens off the
 * main thread and a run that overstays the cap is killed rather than awaited.
 */

import type { AttackCandidate } from './analyze';
import { buildAttack } from './analyze';
import { classifyGrowth, nextSweepK, type GrowthClass, type TimingPoint } from './classify';

/** Longest a single run may take before the worker is killed. */
const RUN_CAP_MS = 1000;
/** Ceiling on one candidate's whole sweep. */
const SWEEP_BUDGET_MS = 8000;
/** Ceiling on the whole analysis, across every candidate. */
const TOTAL_BUDGET_MS = 20000;
/** Suffixes tried per candidate before giving up on it. */
const MAX_SUFFIXES = 3;
/** Candidates measured per pattern. They are already sorted worst-first. */
const MAX_CANDIDATES = 4;

const WORKER_SOURCE = `
self.onmessage = function (event) {
  var data = event.data;
  try {
    var re = new RegExp(data.source, data.flags);
    var started = performance.now();
    re.test(data.input);
    self.postMessage({ ms: performance.now() - started });
  } catch (error) {
    self.postMessage({ error: String(error) });
  }
};
`;

export interface Finding {
  candidate: AttackCandidate;
  suffix: string;
  points: TimingPoint[];
  growth: GrowthClass;
  /** The string that demonstrates the finding. */
  attack: string;
  /** Pump count that produced the worst measured run. */
  worstK: number;
}

export interface BenchmarkOptions {
  signal?: AbortSignal;
  onProgress?: (message: string) => void;
}

/** Owns one worker, replacing it whenever a run has to be killed. */
class RegexRunner {
  private worker: Worker | null = null;
  private cold = true;

  private spawn(): Worker {
    const blob = new Blob([WORKER_SOURCE], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);
    // The worker keeps its own copy of the script; the URL is dead weight once
    // construction has read it.
    URL.revokeObjectURL(url);
    return worker;
  }

  private ensure(): Worker {
    if (!this.worker) {
      this.worker = this.spawn();
      this.cold = true;
    }
    return this.worker;
  }

  private once(source: string, flags: string, input: string): Promise<TimingPoint['ms'] | 'timeout'> {
    const worker = this.ensure();

    return new Promise(resolve => {
      const timer = setTimeout(() => {
        worker.onmessage = null;
        worker.terminate();
        this.worker = null;
        resolve('timeout');
      }, RUN_CAP_MS);

      worker.onmessage = (event: MessageEvent) => {
        clearTimeout(timer);
        worker.onmessage = null;
        const data = event.data as { ms?: number; error?: string };
        resolve(typeof data.ms === 'number' ? data.ms : 'timeout');
      };

      worker.postMessage({ source, flags, input });
    });
  }

  /**
   * Minimum of several runs. GC pauses, JIT warm-up and scheduling only ever
   * add time, so the fastest observation is closest to the engine's true cost.
   * Taking a single sample instead lets one unlucky reading invert the curve and
   * destroy the fit — measured in practice, not hypothesised.
   */
  async measure(source: string, flags: string, input: string): Promise<TimingPoint['ms'] | 'timeout'> {
    if (this.cold) {
      await this.once('^a+$', '', 'aaaa');
      this.cold = false;
    }

    let best = Infinity;
    for (let attempt = 0; attempt < 5; attempt++) {
      const result = await this.once(source, flags, input);
      if (result === 'timeout') return 'timeout';
      best = Math.min(best, result);
      // Never stop on a single reading: a lone slow sample is exactly the noise
      // this loop exists to reject.
      if (attempt >= 1 && best > 100) break;
      if (attempt >= 2 && best > 20) break;
    }
    return best;
  }

  dispose(): void {
    this.worker?.terminate();
    this.worker = null;
  }
}

async function sweep(
  runner: RegexRunner,
  source: string,
  flags: string,
  candidate: AttackCandidate,
  suffix: string,
  signal?: AbortSignal,
): Promise<{ points: TimingPoint[]; growth: GrowthClass }> {
  const points: TimingPoint[] = [];
  const started = Date.now();

  let k = nextSweepK(points);
  while (k !== null) {
    if (signal?.aborted || Date.now() - started > SWEEP_BUDGET_MS) break;
    const result = await runner.measure(source, flags, buildAttack(candidate, k, suffix));
    points.push(
      result === 'timeout' ? { k, ms: RUN_CAP_MS, timedOut: true } : { k, ms: result },
    );
    k = nextSweepK(points);
  }

  return { points, growth: classifyGrowth(points) };
}

const severity = (growth: GrowthClass): number => {
  if (growth.kind === 'exponential') return 1000;
  if (growth.kind === 'polynomial') return growth.degree ?? 2;
  return 0;
};

/**
 * Measures each candidate and returns the worst finding that reproduced, or
 * null when nothing did. A candidate that fails to reproduce is discarded
 * silently: static analysis proposing an attack is not evidence of one.
 */
export async function benchmarkCandidates(
  source: string,
  flags: string,
  candidates: AttackCandidate[],
  options: BenchmarkOptions = {},
): Promise<Finding | null> {
  const runner = new RegexRunner();
  const started = Date.now();
  let worst: Finding | null = null;

  try {
    for (const candidate of candidates.slice(0, MAX_CANDIDATES)) {
      for (const suffix of candidate.suffixes.slice(0, MAX_SUFFIXES)) {
        if (options.signal?.aborted || Date.now() - started > TOTAL_BUDGET_MS) return worst;

        options.onProgress?.(`Measuring ${candidate.excerpt}`);
        const { points, growth } = await sweep(runner, source, flags, candidate, suffix, options.signal);
        if (growth.kind === 'inconclusive' || growth.kind === 'linear') continue;

        const measured = points.filter(p => !p.timedOut);
        const worstPoint = measured.reduce((a, b) => (b.ms > a.ms ? b : a), measured[0]);

        const finding: Finding = {
          candidate,
          suffix,
          points: [...points].sort((a, b) => a.k - b.k),
          growth,
          attack: buildAttack(candidate, worstPoint.k, suffix),
          worstK: worstPoint.k,
        };

        if (!worst || severity(growth) > severity(worst.growth)) worst = finding;
        // This candidate reproduced; no need to try its remaining suffixes.
        break;
      }
    }
  } finally {
    runner.dispose();
  }

  return worst;
}

export const workerAvailable = (): boolean => typeof Worker !== 'undefined';
