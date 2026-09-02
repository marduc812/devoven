'use client';

import React, { useEffect, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { generateAllHmacs, HmacAlgorithm, HmacResult } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

export const HmacGenerator = () => {
  const [message, setMessage] = useState('');
  const [key, setKey] = useState('');
  const [results, setResults] = useState<HmacResult[]>([]);
  const [selectedAlgo, setSelectedAlgo] = useState<HmacAlgorithm>('SHA-256');
  const [outputFormat, setOutputFormat] = useState<'hex' | 'base64'>('hex');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') || '';
    if (from) setMessage(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: message })

  useEffect(() => {
    if (message && key) {
      const r = generateAllHmacs(message, key);
      setResults(r);
    } else {
      setResults([]);
    }
  }, [message, key]);

  const selected = results.find(r => r.algorithm === selectedAlgo);
  const outputValue = selected ? (outputFormat === 'hex' ? selected.hex : selected.base64) : '';

  const algoColors: Record<HmacAlgorithm, string> = {
    'SHA-256': 'bg-teal-500/20 text-teal-300 border border-teal-500/40',
    'SHA-512': 'bg-teal-600/20 text-teal-200 border border-teal-600/40',
    'SHA-1': 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    'MD5': 'bg-orange-500/20 text-orange-300 border border-orange-500/40',
  };

  const inputClass = 'bg-white backdrop-blur-sm text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors duration-200 font-mono text-sm';

  return (
    <Panel
      title="HMAC Generator"
      description="Generate HMAC (Hash-based Message Authentication Code) using SHA-256, SHA-512, SHA-1, or MD5. Enter a message and secret key to compute the HMAC. Example: message [1 hello 2] with key [1 secret 2] produces a unique authentication code."
      backColor="teal"
      extraElements={
        <div className="flex flex-col gap-4 w-full">
          <div className="flex flex-col gap-2">
            <label className="text-gray-400 text-xs uppercase tracking-wider">Message</label>
            <textarea
              className={inputClass}
              rows={3}
              placeholder="Enter message to authenticate..."
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-gray-400 text-xs uppercase tracking-wider">Secret Key</label>
            <input
              type="text"
              className={inputClass}
              placeholder="Enter secret key..."
              value={key}
              onChange={e => setKey(e.target.value)}
            />
          </div>

          {results.length > 0 && (
            <>
              <div className="flex flex-wrap gap-2 pt-2">
                {results.map(r => (
                  <button
                    key={r.algorithm}
                    onClick={() => setSelectedAlgo(r.algorithm)}
                    className={`px-3 py-1.5 text-xs font-mono font-semibold transition-all ${
                      selectedAlgo === r.algorithm
                        ? algoColors[r.algorithm]
                        : 'bg-white/5 text-gray-400 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {r.algorithm}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setOutputFormat('hex')}
                  className={`px-3 py-1 text-xs transition-all ${outputFormat === 'hex' ? 'bg-teal-500/30 text-teal-300 border border-teal-500/50' : 'bg-white/5 text-gray-400 border border-gray-200 hover:bg-gray-100'}`}
                >
                  Hex
                </button>
                <button
                  onClick={() => setOutputFormat('base64')}
                  className={`px-3 py-1 text-xs transition-all ${outputFormat === 'base64' ? 'bg-teal-500/30 text-teal-300 border border-teal-500/50' : 'bg-white/5 text-gray-400 border border-gray-200 hover:bg-gray-100'}`}
                >
                  Base64
                </button>
              </div>

              {selected && (
                <div className="flex flex-col gap-2">
                  <label className="text-gray-400 text-xs uppercase tracking-wider">
                    HMAC-{selectedAlgo} ({selected.byteLength * 8} bits)
                  </label>
                  <textarea
                    className="bg-gray-50 text-gray-900 p-3 w-full border border-gray-300 cursor-default resize-y font-mono text-sm"
                    rows={3}
                    value={outputValue}
                    readOnly
                  />
                </div>
              )}

              <div className="flex flex-col gap-2 mt-2">
                <label className="text-gray-400 text-xs uppercase tracking-wider">All Results (Hex)</label>
                <div className="flex flex-col gap-2">
                  {results.map(r => (
                    <div key={r.algorithm} className="flex flex-col gap-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full self-start ${algoColors[r.algorithm]}`}>{r.algorithm}</span>
                      <code className="text-gray-300 text-xs font-mono bg-gray-50 p-2 break-all">{r.hex}</code>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {(!message || !key) && (
            <p className="text-gray-500 text-sm text-center py-4">
              Enter both a message and a secret key to generate HMAC values.
            </p>
          )}
        </div>
      }
    />
  );
};
