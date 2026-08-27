/// <reference lib="webworker" />
/* -------------------------------------------------------------------------- */
/*  Web Worker for JWT RSA public-key recovery.                               */
/*                                                                            */
/*  The recovery's only heavy step is gcd(s1^e − m1, s2^e − m2): for e=65537  */
/*  each s^e is a ~16 MB integer and the GCD runs for minutes. Native BigInt  */
/*  cannot do this in any reasonable time (Euclid is quadratic on 16 MB       */
/*  operands), so we delegate the big-integer arithmetic to GMP compiled to   */
/*  WebAssembly. Running in a Worker keeps the page responsive throughout.    */
/* -------------------------------------------------------------------------- */

import { init, type GMPLib } from 'gmp-wasm';
import { recoverPublicKey, RecoveryError, type GcdOfPowDiff } from './logic';

export interface RecoverRequest {
  jwt1: string;
  jwt2: string;
}

export type WorkerMessage =
  | { type: 'stage'; stage: string; exponent?: number }
  | { type: 'result'; alg: string; matchedExponent: number | null; key: import('./logic').RecoveredKey | null }
  | { type: 'error'; message: string };

let gmpPromise: Promise<GMPLib> | null = null;

// Keep the whole pow→sub→gcd inside GMP so the ~16 MB intermediates never
// cross back into JS as decimal strings. Inputs/outputs are modulus-sized.
// getContext (rather than calculate) is used because it is correctly typed to
// return Integers; destroy() frees every Integer allocated in the context.
function makeGcd(gmp: GMPLib): GcdOfPowDiff {
  return (s1, m1, s2, m2, e) => {
    const ctx = gmp.getContext();
    // gmp-wasm's chained methods are typed to return a method-less `Integer`,
    // so each chain result is re-asserted as the concrete factory-return type.
    type Int = ReturnType<typeof ctx.Integer>;
    const int = (v: bigint) => ctx.Integer(v.toString());
    try {
      const a = (int(s1).pow(e) as Int).sub(int(m1)) as Int;
      const b = (int(s2).pow(e) as Int).sub(int(m2)) as Int;
      const result = (a.gcd(b) as Int).abs() as Int;
      return BigInt(result.toString());
    } finally {
      ctx.destroy();
    }
  };
}

const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = async (event: MessageEvent<RecoverRequest>) => {
  const post = (msg: WorkerMessage) => ctx.postMessage(msg);
  try {
    const gmp = await (gmpPromise ??= init());
    const result = await recoverPublicKey(
      event.data.jwt1,
      event.data.jwt2,
      makeGcd(gmp),
      (stage, exponent) => post({ type: 'stage', stage, exponent })
    );
    post({
      type: 'result',
      alg: result.alg,
      matchedExponent: result.matchedExponent,
      key: result.key,
    });
  } catch (err) {
    const message =
      err instanceof RecoveryError || err instanceof Error ? err.message : String(err);
    post({ type: 'error', message });
  }
};
