'use client';

import { useState, useEffect, useMemo } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { processRailFence, railFenceAsciiArt, ART_MAX_COLUMNS } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const selectClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';
const inputClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900 w-20';
const labelClass = 'text-xs text-gray-500 uppercase tracking-wider';

export function RailFenceCipher() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [rails, setRails] = useState(3);
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const r = params.get('rails');
    if (r) setRails(parseInt(r) || 3);
    const m = params.get('mode');
    if (m === 'decode') setMode('decode');
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ rails, mode })

  useEffect(() => {
    if (!input.trim()) { setOutput(''); setError(''); return; }
    try {
      setOutput(processRailFence(input, rails, mode));
      setError('');
    } catch (e: unknown) {
      setOutput('');
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [input, rails, mode]);

  // The zigzag always shows the plaintext, whichever direction we ran in.
  const plain = mode === 'encode' ? input : output;
  const art = useMemo(
    () => (error ? '' : railFenceAsciiArt(plain, rails)),
    [plain, rails, error]
  );
  const truncated = plain.length > ART_MAX_COLUMNS;

  return (
    <AdvancedConverter
      title="Rail Fence Cipher"
      description="Classic transposition cipher that writes text in a [1 zigzag pattern 2] across a number of rails, then reads off each rail in order. The diagram under the output shows the fence."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input Text"
      toTitle="Output"
      backColor="yellow"
      extraElements={
        <div className="flex flex-row flex-wrap gap-3 items-center">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as 'encode' | 'decode')}
            className={selectClass}
          >
            <option value="encode">Encode</option>
            <option value="decode">Decode</option>
          </select>
          <div className="flex items-center gap-2">
            <label className={labelClass}>Rails</label>
            <input
              type="number"
              min={2}
              max={20}
              value={rails}
              onChange={(e) => setRails(parseInt(e.target.value) || 2)}
              className={inputClass}
            />
          </div>
        </div>
      }
      belowOutput={
        <>
          {error && (
            <p className="mt-3 border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
              {error}
            </p>
          )}

          {art && (
            <div className="mt-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1.5">
                <h2 className="font-bold text-xs text-gray-900 tracking-widest uppercase">
                  Zigzag Pattern
                </h2>
                <p className="text-gray-400 px-2 text-xs font-mono">
                  {rails} rails
                  {truncated ? `; first ${ART_MAX_COLUMNS} of ${plain.length} chars` : ''}
                </p>
              </div>
              <pre className="bg-gray-50 text-gray-900 p-3 w-full border border-gray-300 font-mono text-sm leading-6 overflow-x-auto whitespace-pre">
                {art}
              </pre>
            </div>
          )}
        </>
      }
    />
  );
}
