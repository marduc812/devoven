'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import {
  parseRateLimiterInput,
  calculateRateLimiter,
  formatRateLimiterResult,
  RateLimitAlgorithm,
  RateUnit,
} from './logic';

export function RateLimiterCalculator() {
  const [input, setInput] = useState('100 per-minute 200 token-bucket');
  const [output, setOutput] = useState('');
  const [algorithm, setAlgorithm] = useState<RateLimitAlgorithm>('token-bucket');
  const [unit, setUnit] = useState<RateUnit>('per-minute');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : ''
    );
    const from = params.get('from');
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      const parsed = parseRateLimiterInput(input);
      // override with UI controls if user hasn't specified in text
      const result = calculateRateLimiter({
        ...parsed,
        algorithm: parsed.algorithm || algorithm,
        unit: parsed.unit || unit,
      });
      setOutput(formatRateLimiterResult(result));
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input, algorithm, unit]);

  const extraElements = (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm">Algorithm:</span>
        <select
          className="bg-white text-gray-900 text-sm border border-gray-200 px-3 py-1.5 focus:outline-none focus:border-white/30"
          value={algorithm}
          onChange={e => setAlgorithm(e.target.value as RateLimitAlgorithm)}
        >
          <option value="token-bucket">Token Bucket</option>
          <option value="leaky-bucket">Leaky Bucket</option>
          <option value="fixed-window">Fixed Window</option>
          <option value="sliding-window">Sliding Window</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm">Unit:</span>
        <select
          className="bg-white text-gray-900 text-sm border border-gray-200 px-3 py-1.5 focus:outline-none focus:border-white/30"
          value={unit}
          onChange={e => setUnit(e.target.value as RateUnit)}
        >
          <option value="per-second">Per Second</option>
          <option value="per-minute">Per Minute</option>
          <option value="per-hour">Per Hour</option>
        </select>
      </div>
    </div>
  );

  return (
    <AdvancedConverter
      title="Rate Limiter Calculator"
      description="Calculate rate limiting parameters. Input format: [1 &lt;rate&gt; &lt;unit&gt; &lt;burst&gt; &lt;algorithm&gt; [traffic trafficUnit] 2]. Example: [1 100 per-minute 200 token-bucket 150 per-minute 2]. Algorithms: token-bucket, leaky-bucket, fixed-window, sliding-window. Units: per-second, per-minute, per-hour."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Rate Limit Parameters"
      toTitle="Analysis"
      backColor="lime"
      extraElements={extraElements}
    />
  );
}
