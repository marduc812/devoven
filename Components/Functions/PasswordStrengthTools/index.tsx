'use client';

import React, { useEffect, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { analyzePassword, PasswordAnalysis } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const scoreBadge: Record<PasswordAnalysis['score'], string> = {
  'Weak':       'border border-red-300 bg-red-50 text-red-700',
  'Fair':       'border border-yellow-300 bg-yellow-50 text-yellow-700',
  'Strong':     'border border-green-300 bg-green-50 text-green-700',
  'Very Strong':'border border-emerald-300 bg-emerald-50 text-emerald-700',
};

function ScoreBadge({ score }: { score: PasswordAnalysis['score'] }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${scoreBadge[score]}`}>
      {score}
    </span>
  );
}

function CheckRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div className={`flex items-center gap-2 text-xs px-3 py-2 border ${value ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500'}`}>
      <span className="font-bold">{value ? '✓' : '✗'}</span>
      <span>{label}</span>
    </div>
  );
}

const inputClass = 'w-full bg-white text-gray-900 border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:border-gray-900 placeholder-gray-400';
const labelClass = 'block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1';
const sectionLabel = 'text-xs font-bold uppercase tracking-wider text-gray-500 mb-2';

export const PasswordStrengthAnalyzer = () => {
  const [password, setPassword] = useState('');
  const [analysis, setAnalysis] = useState<PasswordAnalysis | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') || '';
    if (from) setPassword(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: password })

  useEffect(() => {
    setAnalysis(analyzePassword(password));
  }, [password]);

  const content = (
    <div className="flex flex-col gap-5">
      <div>
        <label className={labelClass}>Password</label>
        <input
          type="text"
          className={inputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter a password to analyze..."
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>

      {analysis && (
        <>
          <div className="flex items-center gap-3 py-3 border-t border-gray-200">
            <span className={labelClass} style={{marginBottom:0}}>Score:</span>
            <ScoreBadge score={analysis.score} />
            <span className="text-gray-500 text-xs ml-auto font-mono">
              {analysis.entropy} bits entropy
            </span>
          </div>

          {analysis.warnings.length > 0 && (
            <div className="flex flex-col gap-1">
              {analysis.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-xs px-3 py-2 border border-red-200 bg-red-50 text-red-700">
                  <span className="font-bold">!</span>
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          <div>
            <p className={sectionLabel}>Character Classes</p>
            <div className="grid grid-cols-2 gap-1">
              <CheckRow label="Lowercase (a-z)" value={analysis.hasLower} />
              <CheckRow label="Uppercase (A-Z)" value={analysis.hasUpper} />
              <CheckRow label="Digits (0-9)" value={analysis.hasDigit} />
              <CheckRow label="Symbols (!@#…)" value={analysis.hasSymbol} />
            </div>
          </div>

          <div className="border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="px-4 py-2 text-gray-500 text-xs">Length</td>
                  <td className="px-4 py-2 text-gray-900 font-mono text-right">{analysis.length}</td>
                </tr>
                <tr className="border-t border-gray-200">
                  <td className="px-4 py-2 text-gray-500 text-xs">Charset Size</td>
                  <td className="px-4 py-2 text-gray-900 font-mono text-right">{analysis.charsetSize} chars</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <p className={sectionLabel}>Estimated Crack Time</p>
            <div className="border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Attack Speed</th>
                    <th className="px-4 py-2 text-right text-xs font-bold uppercase tracking-wider text-gray-500">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.crackTimes.map((ct, i) => (
                    <tr key={ct.label} className={i > 0 ? 'border-t border-gray-200' : ''}>
                      <td className="px-4 py-2 text-gray-500 text-xs">{ct.label}</td>
                      <td className="px-4 py-2 text-gray-900 font-mono text-right text-xs">{ct.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!password && (
        <p className="text-gray-400 text-sm text-center py-4">
          Enter a password above to see its strength analysis.
        </p>
      )}
    </div>
  );

  return (
    <Panel
      title="Password Strength Analyzer"
      description="Analyze the strength of a password. Shows [1 entropy 2], [1 character classes 2], and [1 estimated crack times 2] for different attack scenarios. Nothing is sent to any server."
      extraElements={content}
      backColor="lime"
    />
  );
};
