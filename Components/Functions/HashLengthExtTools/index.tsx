'use client';
import { useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  HASH_ALGORITHMS,
  CONCEPT_SECTIONS,
  calculateMerkleDamgardPadding,
} from './logic';

export function HashLengthExtReference() {
  const [keyLength, setKeyLength] = useState(16);
  const [messageLength, setMessageLength] = useState(32);
  const [selectedAlgo, setSelectedAlgo] = useState('SHA-256');

  const algo = HASH_ALGORITHMS.find(a => a.name === selectedAlgo) || HASH_ALGORITHMS[2];
  const paddingInfo = calculateMerkleDamgardPadding(keyLength, messageLength, algo.blockSize);

  return (
    <Panel
      title="Hash Length Extension Attack"
      description="Educational reference explaining [1 hash length extension attacks 2] — which algorithms are vulnerable, how the Merkle-Damgård construction enables the attack, and how to defend against it."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6 w-full">
          {/* Disclaimer */}
          <div className="bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-300">
            This is a purely educational reference. No exploit code is included. Understanding the attack helps implement correct defenses (HMAC, SHA-3).
          </div>

          {/* Algorithm vulnerability table */}
          <div className="flex flex-col gap-2">
            <h3 className="text-gray-900 text-sm font-semibold">Algorithm Vulnerability Status</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-200">
                    <th className="text-left py-2 pr-4">Algorithm</th>
                    <th className="text-left py-2 pr-4">Family</th>
                    <th className="text-left py-2 pr-4">Block Size</th>
                    <th className="text-left py-2 pr-4">Status</th>
                    <th className="text-left py-2">Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {HASH_ALGORITHMS.map((algo, i) => (
                    <tr key={i} className="border-b border-gray-200">
                      <td className="py-2 pr-4 font-mono text-gray-900">{algo.name}</td>
                      <td className="py-2 pr-4 text-gray-500">{algo.family}</td>
                      <td className="py-2 pr-4 text-gray-500">{algo.blockSize}B</td>
                      <td className="py-2 pr-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          algo.vulnerable
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {algo.vulnerable ? 'Vulnerable' : 'Safe'}
                        </span>
                      </td>
                      <td className="py-2 text-gray-500 text-xs max-w-xs">{algo.recommendation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Concept sections */}
          {CONCEPT_SECTIONS.map((section, i) => (
            <div key={i} className="border border-gray-200 bg-gray-50 p-4 flex flex-col gap-2">
              <h3 className="text-gray-900 text-sm font-semibold">{section.title}</h3>
              <pre className="text-gray-400 text-xs leading-relaxed whitespace-pre-wrap font-sans">{section.content}</pre>
            </div>
          ))}

          {/* Padding Calculator */}
          <div className="border border-gray-200 bg-gray-50 p-4 flex flex-col gap-4">
            <h3 className="text-gray-900 text-sm font-semibold">Padding Calculator</h3>
            <p className="text-gray-500 text-xs">Calculate the Merkle-Damgård padding bytes (glue) an attacker must include in their forged message extension.</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 text-xs">Algorithm</label>
                <select
                  value={selectedAlgo}
                  onChange={e => setSelectedAlgo(e.target.value)}
                  className="bg-white text-gray-900 p-2 border border-gray-200 focus:border-gray-400 focus:outline-none text-sm"
                >
                  {HASH_ALGORITHMS.filter(a => a.vulnerable).map(a => (
                    <option key={a.name} value={a.name}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 text-xs">Key Length (bytes)</label>
                <input
                  type="number"
                  min={1}
                  max={256}
                  value={keyLength}
                  onChange={e => setKeyLength(Math.max(1, parseInt(e.target.value) || 1))}
                  className="bg-white text-gray-900 p-2 border border-gray-200 focus:border-gray-400 focus:outline-none text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 text-xs">Message Length (bytes)</label>
                <input
                  type="number"
                  min={1}
                  max={1024}
                  value={messageLength}
                  onChange={e => setMessageLength(Math.max(1, parseInt(e.target.value) || 1))}
                  className="bg-white text-gray-900 p-2 border border-gray-200 focus:border-gray-400 focus:outline-none text-sm"
                />
              </div>
            </div>

            <div className="bg-white p-3 flex flex-col gap-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs mb-2">
                <div><span className="text-gray-500">Block size:</span> <span className="text-gray-900 font-mono">{paddingInfo.blockSize} bytes</span></div>
                <div><span className="text-gray-500">Padding bytes:</span> <span className="text-gray-900 font-mono">{paddingInfo.paddingBytes}</span></div>
                <div><span className="text-gray-500">Padded total:</span> <span className="text-gray-900 font-mono">{paddingInfo.paddedLengthBytes} bytes</span></div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-1">Glue padding (hex):</div>
                <code className="text-emerald-300 text-xs font-mono break-all">{paddingInfo.glueMessage}</code>
              </div>
            </div>

            <pre className="text-gray-400 text-xs leading-relaxed whitespace-pre-wrap">{paddingInfo.explanation}</pre>
          </div>
        </div>
      }
    />
  );
}
