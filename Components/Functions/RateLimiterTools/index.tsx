'use client';

import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  btnClass,
  btnSecondaryClass,
  hintClass,
  inputClass,
  labelClass,
  paneClass,
  sectionClass,
  segOff,
  segOn,
  selectClass,
} from '@/Components/MainView/MainPanel/formControls';
import {
  parseRateLimiterInput,
  calculateRateLimiter,
  toPerSecond,
  RateLimitAlgorithm,
  RateLimiterInput,
  RateUnit,
} from './logic';

const ALGORITHMS: Array<{ id: RateLimitAlgorithm; label: string }> = [
  { id: 'token-bucket', label: 'Token bucket' },
  { id: 'leaky-bucket', label: 'Leaky bucket' },
  { id: 'fixed-window', label: 'Fixed window' },
  { id: 'sliding-window', label: 'Sliding window' },
];

const UNITS: Array<{ id: RateUnit; label: string }> = [
  { id: 'per-second', label: 'per second' },
  { id: 'per-minute', label: 'per minute' },
  { id: 'per-hour', label: 'per hour' },
];

const DEFAULTS: RateLimiterInput = {
  rate: 100,
  unit: 'per-minute',
  burstSize: 200,
  algorithm: 'token-bucket',
};

const isUnit = (v: string | null): v is RateUnit => UNITS.some(u => u.id === v);
const isAlgorithm = (v: string | null): v is RateLimitAlgorithm => ALGORITHMS.some(a => a.id === v);

/** A number field that tolerates an empty box while the user retypes it. */
function numberOr(value: string, fallback: number): number {
  const n = parseFloat(value);
  return isNaN(n) ? fallback : n;
}

const Stat = ({ label, value, note }: { label: string; value: string; note?: string }) => (
  <div className="border border-gray-200 bg-gray-50 p-4">
    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">{label}</p>
    <p className="text-lg font-black text-gray-900 tracking-tight font-mono">{value}</p>
    {note && <p className="text-xs text-gray-500 mt-1">{note}</p>}
  </div>
);

export function RateLimiterCalculator() {
  const [config, setConfig] = useState<RateLimiterInput>(DEFAULTS);
  const [rateText, setRateText] = useState(String(DEFAULTS.rate));
  const [burstText, setBurstText] = useState(String(DEFAULTS.burstSize));
  const [trafficText, setTrafficText] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // ?from= still accepts the old positional payload so existing links keep working.
    const from = params.get('from');
    let seeded: RateLimiterInput | null = null;
    if (from) {
      try { seeded = parseRateLimiterInput(from); } catch { seeded = null; }
    }

    const next: RateLimiterInput = { ...DEFAULTS, ...(seeded ?? {}) };
    const rate = params.get('rate');
    if (rate !== null && !isNaN(parseFloat(rate))) next.rate = parseFloat(rate);
    const burst = params.get('burst');
    if (burst !== null && !isNaN(parseInt(burst, 10))) next.burstSize = parseInt(burst, 10);
    if (isUnit(params.get('unit'))) next.unit = params.get('unit') as RateUnit;
    if (isAlgorithm(params.get('algorithm'))) next.algorithm = params.get('algorithm') as RateLimitAlgorithm;
    const traffic = params.get('traffic');
    if (traffic !== null && !isNaN(parseFloat(traffic))) next.trafficRate = parseFloat(traffic);
    if (isUnit(params.get('trafficUnit'))) next.trafficUnit = params.get('trafficUnit') as RateUnit;

    if (next.trafficRate !== undefined && next.trafficUnit === undefined) next.trafficUnit = next.unit;
    setConfig(next);
    setRateText(String(next.rate));
    setBurstText(String(next.burstSize));
    setTrafficText(next.trafficRate === undefined ? '' : String(next.trafficRate));
  }, []);

  const { result, error } = useMemo(() => {
    try {
      return { result: calculateRateLimiter(config), error: '' };
    } catch (e) {
      return { result: null, error: (e as Error).message };
    }
  }, [config]);

  // Colour the traffic verdict rather than making the reader parse the sentence.
  const overLimit =
    config.trafficRate !== undefined && config.trafficUnit !== undefined
      ? toPerSecond(config.trafficRate, config.trafficUnit) > toPerSecond(config.rate, config.unit)
      : false;

  const setField = <K extends keyof RateLimiterInput>(id: K, value: RateLimiterInput[K]) =>
    setConfig(prev => ({ ...prev, [id]: value }));

  const setTraffic = (text: string) => {
    setTrafficText(text);
    if (text.trim() === '') {
      setConfig(prev => ({ ...prev, trafficRate: undefined, trafficUnit: undefined }));
      return;
    }
    const n = parseFloat(text);
    if (isNaN(n) || n < 0) return;
    setConfig(prev => ({ ...prev, trafficRate: n, trafficUnit: prev.trafficUnit ?? prev.unit }));
  };

  const reset = () => {
    setConfig(DEFAULTS);
    setRateText(String(DEFAULTS.rate));
    setBurstText(String(DEFAULTS.burstSize));
    setTrafficText('');
  };

  const copyHeaders = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.headers);
    toast.success('Copied to clipboard!');
  };

  return (
    <Panel
      title="Rate Limiter Calculator"
      description="Set a rate, a burst size and an algorithm to see the sustained throughput, token refill rate, burst recovery time and the [1 X-RateLimit-* 2] headers to send. Add your expected traffic to find out how much of it gets limited. Seedable from the URL, e.g. [1 ?rate=100&unit=per-minute&burst=200 2]."
      backColor="lime"
      extraElements={
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-8">
          {/* Input */}
          <div className="flex flex-col gap-8">
            <div>
              <p className={sectionClass}>Limit</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label className={labelClass} htmlFor="rl-rate">Rate</label>
                  <input
                    id="rl-rate"
                    className={`${inputClass} font-mono`}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={rateText}
                    onChange={e => {
                      setRateText(e.target.value);
                      setField('rate', numberOr(e.target.value, 0));
                    }}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="rl-unit">Unit</label>
                  <select
                    id="rl-unit"
                    className={selectClass}
                    value={config.unit}
                    onChange={e => setField('unit', e.target.value as RateUnit)}
                  >
                    {UNITS.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="rl-burst">Burst size</label>
                  <input
                    id="rl-burst"
                    className={`${inputClass} font-mono`}
                    type="number"
                    min={1}
                    step={1}
                    value={burstText}
                    onChange={e => {
                      setBurstText(e.target.value);
                      setField('burstSize', Math.round(numberOr(e.target.value, 0)));
                    }}
                  />
                  <p className={hintClass}>How many requests can arrive at once before the limit bites.</p>
                </div>
              </div>
            </div>

            <div>
              <p className={sectionClass}>Algorithm</p>
              <div className="flex flex-wrap gap-2">
                {ALGORITHMS.map(alg => (
                  <button
                    key={alg.id}
                    className={config.algorithm === alg.id ? segOn : segOff}
                    onClick={() => setField('algorithm', alg.id)}
                  >
                    {alg.label}
                  </button>
                ))}
              </div>
              {result && (
                <p className="text-sm text-gray-600 mt-3 leading-relaxed">{result.algorithmDescription}</p>
              )}
            </div>

            <div>
              <p className={sectionClass}>Expected traffic (optional)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label className={labelClass} htmlFor="rl-traffic">Traffic</label>
                  <input
                    id="rl-traffic"
                    className={`${inputClass} font-mono`}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="150"
                    value={trafficText}
                    onChange={e => setTraffic(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="rl-traffic-unit">Unit</label>
                  <select
                    id="rl-traffic-unit"
                    className={selectClass}
                    value={config.trafficUnit ?? config.unit}
                    disabled={config.trafficRate === undefined}
                    onChange={e => setField('trafficUnit', e.target.value as RateUnit)}
                  >
                    {UNITS.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
                  </select>
                </div>
              </div>
              <p className={hintClass}>Leave blank to skip the traffic comparison.</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className={btnSecondaryClass} onClick={reset}>Reset</button>
            </div>
          </div>

          {/* Result */}
          <div className="flex flex-col gap-8">
            {error && (
              <div className="border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {result && (
              <>
                <div>
                  <p className={sectionClass}>Sustained rate</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Stat label="Per second" value={result.sustainedRatePerSecond.toFixed(4)} />
                    <Stat label="Per minute" value={result.sustainedRatePerMinute.toFixed(2)} />
                    <Stat label="Per hour" value={result.sustainedRatePerHour.toFixed(0)} />
                  </div>
                </div>

                <div>
                  <p className={sectionClass}>Burst behaviour</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Stat label="Burst capacity" value={`${result.burstCapacity} req`} />
                    <Stat label="Refill rate" value={result.tokenRefillRate} />
                    <Stat
                      label="Recovery after full burst"
                      value={result.recoveryTimeAfterBurst}
                      note="Time to refill an emptied bucket."
                    />
                    <Stat
                      label="Wait when limited"
                      value={result.waitTimeIfLimitHit}
                      note="Time until the next request is allowed."
                    />
                  </div>
                </div>

                <div>
                  <p className={sectionClass}>Traffic</p>
                  {config.trafficRate === undefined ? (
                    <p className="text-sm text-gray-500">
                      Enter your expected traffic to see how much of it would be limited.
                    </p>
                  ) : (
                    <div
                      className={`border p-4 text-sm leading-relaxed ${
                        overLimit
                          ? 'border-red-200 bg-red-50 text-red-700'
                          : 'border-emerald-200 bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {result.trafficAnalysis}
                    </div>
                  )}
                </div>

                <div>
                  <p className={sectionClass}>Response headers</p>
                  <textarea
                    className={`${paneClass} min-h-[140px]`}
                    value={result.headers}
                    readOnly
                    spellCheck={false}
                  />
                  <div className="flex flex-wrap gap-3 mt-3">
                    <button className={btnClass} onClick={copyHeaders}>Copy headers</button>
                  </div>
                  <p className={hintClass}>Send these on every response, not only the 429s.</p>
                </div>
              </>
            )}
          </div>
        </div>
      }
    />
  );
}
