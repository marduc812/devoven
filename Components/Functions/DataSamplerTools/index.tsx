'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { processSampler, DataSamplerMode } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

export function DataSampler() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<DataSamplerMode>('sample');
  const [sampleSize, setSampleSize] = useState(10);
  const [trainRatio, setTrainRatio] = useState(0.8);
  const [numericSort, setNumericSort] = useState(false);

  useEffect(function() {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setInput(from);
    const m = p.get('mode');
    if (m) setMode(m as DataSamplerMode);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ mode })

  useEffect(function() {
    if (!input.trim()) { setOutput(''); return; }
    try {
      setOutput(processSampler(input, mode, sampleSize, trainRatio, numericSort));
    } catch (e) {
      setOutput('Error: ' + (e as Error).message);
    }
  }, [input, mode, sampleSize, trainRatio, numericSort]);

  const selectClass = "bg-white text-gray-900 border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:border-white/25";
  const inputClass = "bg-white text-gray-900 border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:border-white/25 w-20";

  const extraElements = (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <label className="text-gray-400 text-sm">Mode:</label>
        <select
          className={selectClass}
          value={mode}
          onChange={function(e) { setMode(e.target.value as DataSamplerMode); }}
        >
          <option value="sample">Random Sample</option>
          <option value="shuffle">Shuffle</option>
          <option value="split">Train/Test Split</option>
          <option value="deduplicate">Deduplicate</option>
          <option value="sort">Sort</option>
        </select>
      </div>

      {mode === 'sample' && (
        <div className="flex items-center gap-2">
          <label className="text-gray-400 text-sm">Sample size:</label>
          <input
            type="number"
            className={inputClass}
            min={1}
            value={sampleSize}
            onChange={function(e) { setSampleSize(parseInt(e.target.value, 10) || 1); }}
          />
        </div>
      )}

      {mode === 'split' && (
        <div className="flex items-center gap-2">
          <label className="text-gray-400 text-sm">Train ratio:</label>
          <input
            type="number"
            className={inputClass}
            min={0.1}
            max={0.9}
            step={0.1}
            value={trainRatio}
            onChange={function(e) { setTrainRatio(parseFloat(e.target.value) || 0.8); }}
          />
        </div>
      )}

      {mode === 'sort' && (
        <div className="flex items-center gap-2">
          <label className="text-gray-400 text-sm">Numeric sort:</label>
          <input
            type="checkbox"
            checked={numericSort}
            onChange={function(e) { setNumericSort(e.target.checked); }}
          />
        </div>
      )}
    </div>
  );

  return (
    <AdvancedConverter
      title="Data Sampler / Shuffler"
      description="Enter a list of items, one per line. Choose an operation: [1 Random Sample 2] picks N items, [1 Shuffle 2] reorders all, [1 Train/Test Split 2] divides by ratio, [1 Deduplicate 2] removes duplicates, [1 Sort 2] orders alphabetically or numerically."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Items (one per line)"
      toTitle="Result"
      backColor="lime"
      extraElements={extraElements}
    />
  );
}
