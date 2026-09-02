'use client';

import React, { useEffect, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { evaluatePassphrase, type PassphraseResult } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const strengthBadge: Record<string, string> = {
  'Very Weak':  'border border-red-300 bg-red-50 text-red-700',
  'Weak':       'border border-orange-300 bg-orange-50 text-orange-700',
  'Moderate':   'border border-yellow-300 bg-yellow-50 text-yellow-700',
  'Strong':     'border border-green-300 bg-green-50 text-green-700',
  'Very Strong':'border border-emerald-300 bg-emerald-50 text-emerald-700',
  'Exceptional':'border border-teal-300 bg-teal-50 text-teal-700',
};

const barColors: Record<string, string> = {
  'Very Weak':  'bg-red-500',
  'Weak':       'bg-orange-500',
  'Moderate':   'bg-yellow-500',
  'Strong':     'bg-green-500',
  'Very Strong':'bg-emerald-500',
  'Exceptional':'bg-teal-500',
};

const inputClass = 'bg-white text-gray-900 border border-gray-300 px-3 py-2 w-full focus:outline-none focus:border-gray-900 font-mono text-sm';
const labelClass = 'block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1';
const sectionLabel = 'text-xs font-bold uppercase tracking-wider text-gray-500 mb-2';

export const PassphraseStrength = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<PassphraseResult | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : ''
    );
    const from = params.get('from') || '';
    if (from) setInput(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input })

  useEffect(() => {
    if (!input) { setResult(null); return; }
    setResult(evaluatePassphrase(input));
  }, [input]);

  return (
    <Panel
      backColor="lime"
      title="Passphrase Strength & Policy Checker"
      description="Evaluate a password or passphrase against NIST SP 800-63B, PCI DSS 4.0, HIPAA, and OWASP ASVS requirements. Shows entropy in bits, estimated crack times at various attack speeds, and actionable improvement suggestions. Nothing is sent to a server."
      extraElements={
        <div className="flex flex-col gap-5">
          <div>
            <label className={labelClass}>Password / Passphrase</label>
            <input
              type="text"
              className={inputClass}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your password or passphrase here..."
              autoComplete="off"
            />
            <p className="text-xs text-gray-400 mt-1">All analysis is performed locally — nothing is stored or transmitted.</p>
          </div>

          {result && (
            <div className="flex flex-col gap-5">
              {/* Strength indicator */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${strengthBadge[result.strength] || 'border border-gray-200 text-gray-700'}`}>
                    {result.strength}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">{result.entropy} bits entropy</span>
                </div>
                <div className="w-full bg-gray-200 h-1.5">
                  <div
                    className={`h-1.5 transition-all duration-300 ${barColors[result.strength] || 'bg-gray-400'}`}
                    style={{ width: `${result.strengthScore}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Length: {result.length}</span>
                  <span>Charset: ~{result.charsetSize} symbols</span>
                </div>
              </div>

              {/* Crack times */}
              <div>
                <p className={sectionLabel}>Estimated Crack Times</p>
                <div className="border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Attack Speed</th>
                        <th className="px-4 py-2 text-right text-xs font-bold uppercase tracking-wider text-gray-500">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.crackTimes.map((ct, i) => (
                        <tr key={ct.attackSpeed} className={i > 0 ? 'border-t border-gray-200' : ''}>
                          <td className="px-4 py-2 text-gray-500 text-xs">{ct.attackSpeed}</td>
                          <td className="px-4 py-2 text-gray-900 font-mono text-right text-xs">{ct.timeToCrack}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Policy compliance */}
              <div>
                <p className={sectionLabel}>Policy Compliance</p>
                <div className="flex flex-col gap-2">
                  {result.policies.map(p => (
                    <div key={p.name} className={`border px-4 py-3 ${p.met ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold ${p.met ? 'text-emerald-600' : 'text-gray-400'}`}>{p.met ? '✓' : '✗'}</span>
                        <span className="text-sm font-semibold text-gray-900">{p.name}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{p.description}</p>
                      <div className="flex flex-col gap-0.5">
                        {p.requirements.map(r => (
                          <span key={r} className="text-xs text-emerald-600 flex gap-1">
                            <span>✓</span><span>{r}</span>
                          </span>
                        ))}
                        {p.failedRequirements.map(r => (
                          <span key={r} className="text-xs text-red-600 flex gap-1">
                            <span>✗</span><span>{r}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggestions */}
              {result.suggestions.length > 0 && (
                <div>
                  <p className={sectionLabel}>Suggestions</p>
                  <ul className="flex flex-col gap-1">
                    {result.suggestions.map((s, i) => (
                      <li key={i} className="text-xs text-gray-700 flex gap-2 border-l-2 border-gray-300 pl-3 py-0.5">
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {!input && (
            <p className="text-gray-400 text-sm text-center py-4">
              Enter a password or passphrase above to evaluate it
            </p>
          )}
        </div>
      }
    />
  );
};
