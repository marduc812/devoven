'use client';

import { useState, useEffect } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { compareHashes, formatCompareResult } from './logic';

const inputClass =
  'bg-white backdrop-blur-sm text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none resize-none transition-colors duration-200 font-mono text-sm';
const labelClass = 'text-xs text-gray-400 uppercase tracking-wider';

export function HashVerifier() {
  const [computedHash, setComputedHash] = useState('');
  const [expectedHash, setExpectedHash] = useState('');
  const [result, setResult] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setExpectedHash(from);
  }, []);

  function handleCompare() {
    if (!computedHash.trim() || !expectedHash.trim()) {
      setResult('Please enter both hashes to compare.');
      return;
    }
    const comparison = compareHashes(computedHash, expectedHash);
    setResult(formatCompareResult(comparison));
  }

  const isMatch = result.startsWith('✓');
  const isMismatch = result.startsWith('✗');

  return (
    <Panel
      title="Hash Verifier"
      description="Verify a hash by comparing your computed hash against an expected value. Handles case differences and whitespace automatically."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-4">
          <div>
            <label className={`${labelClass} mb-2 block`}>Computed Hash</label>
            <input
              type="text"
              className={inputClass}
              placeholder="Paste the hash you computed or downloaded…"
              value={computedHash}
              onChange={(e) => setComputedHash(e.target.value)}
            />
          </div>
          <div>
            <label className={`${labelClass} mb-2 block`}>Expected Hash</label>
            <input
              type="text"
              className={inputClass}
              placeholder="Paste the expected / reference hash…"
              value={expectedHash}
              onChange={(e) => setExpectedHash(e.target.value)}
            />
          </div>
          <button
            onClick={handleCompare}
            className="bg-gray-100 hover:bg-gray-700 text-gray-700 border border-gray-300 px-4 py-2 text-sm font-medium transition-colors duration-200 self-start"
          >
            Compare Hashes
          </button>
          {result && (
            <div
              className={`border px-4 py-3 font-mono text-sm whitespace-pre-wrap ${
                isMatch
                  ? 'bg-green-500/10 border-green-500/30 text-green-700'
                  : isMismatch
                  ? 'bg-red-500/10 border-red-500/30 text-red-300'
                  : 'bg-white border-gray-200 text-gray-500'
              }`}
            >
              {result}
            </div>
          )}
        </div>
      }
    />
  );
}
