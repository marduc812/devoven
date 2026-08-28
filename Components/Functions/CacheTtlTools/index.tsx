'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { processCacheTtl, TtlUnit, CacheTtlMode } from './logic';

export function CacheTtlCalculator() {
  const [input, setInput] = useState('3600');
  const [output, setOutput] = useState('');
  const [unit, setUnit] = useState<TtlUnit>('seconds');
  const [mode, setMode] = useState<CacheTtlMode>('calculate');

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
      const result = processCacheTtl(input, mode, unit, Date.now());
      setOutput(result);
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input, mode, unit]);

  const extraElements = (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm">Mode:</span>
        <select
          className="bg-white text-gray-900 text-sm border border-gray-200 px-3 py-1.5 focus:outline-none focus:border-white/30"
          value={mode}
          onChange={e => setMode(e.target.value as CacheTtlMode)}
        >
          <option value="calculate">Calculate TTL</option>
          <option value="parse">Parse Cache-Control Header</option>
        </select>
      </div>
      {mode === 'calculate' && (
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Unit:</span>
          <select
            className="bg-white text-gray-900 text-sm border border-gray-200 px-3 py-1.5 focus:outline-none focus:border-white/30"
            value={unit}
            onChange={e => setUnit(e.target.value as TtlUnit)}
          >
            <option value="seconds">Seconds</option>
            <option value="minutes">Minutes</option>
            <option value="hours">Hours</option>
            <option value="days">Days</option>
          </select>
        </div>
      )}
    </div>
  );

  const fromTitle = mode === 'calculate'
    ? `TTL Value (${unit})`
    : 'Cache-Control Header Value';

  const description = mode === 'calculate'
    ? 'Enter a [1 TTL duration 2] and select unit. Get Cache-Control header, Expires header, and CDN-specific equivalents for [1 Cloudflare 2], [1 Fastly 2], and [1 Varnish 2].'
    : 'Paste a [1 Cache-Control header value 2] (e.g. [1 max-age=3600, s-maxage=86400, stale-while-revalidate=60 2]) to explain each directive.';

  return (
    <AdvancedConverter
      title="Cache TTL Calculator"
      description={description}
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle={fromTitle}
      toTitle="Results"
      backColor="lime"
      extraElements={extraElements}
    />
  );
}
