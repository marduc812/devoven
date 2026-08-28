'use client';

import { useState, useEffect } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { analyzeSequence, PatternMatch } from './logic';

const inputClass =
  'bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none font-mono text-sm transition-colors duration-200';

function PatternCard({ pattern, primary }: { pattern: PatternMatch; primary: boolean }) {
  return (
    <div className={`p-3 border ${primary ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-gray-50 border-gray-200'}`}>
      <div className="flex items-center gap-2 mb-1">
        {primary && <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">Primary Match</span>}
        <span className={`text-sm font-medium ${primary ? 'text-emerald-200' : 'text-gray-300'}`}>{pattern.name}</span>
        <span className={`text-xs px-1.5 py-0.5 rounded ${pattern.confidence === 'exact' ? 'bg-green-50 text-green-700' : 'bg-yellow-500/20 text-yellow-400'}`}>
          {pattern.confidence}
        </span>
      </div>
      <p className="text-xs font-mono text-gray-400 mb-2">{pattern.formula}</p>
      <div>
        <span className="text-xs text-gray-500 uppercase tracking-wider">Next 5 terms:</span>
        <span className="text-xs font-mono text-gray-900 ml-2">
          {pattern.nextTerms.map(t => {
            const rounded = Math.round(t * 1e10) / 1e10;
            return rounded;
          }).join(', ')}
        </span>
      </div>
    </div>
  );
}

export function SequenceRecognizer() {
  const [input, setInput] = useState('');
  const [analysis, setAnalysis] = useState<ReturnType<typeof analyzeSequence>>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') ?? '';
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setAnalysis(null); setError(''); return; }
    const result = analyzeSequence(input);
    if (!result) {
      setError('Could not parse sequence. Enter numbers separated by commas or spaces.');
      setAnalysis(null);
      return;
    }
    setError('');
    setAnalysis(result);
  }, [input]);

  return (
    <Panel
      title="Sequence Pattern Recognizer"
      description="Enter a sequence of numbers to identify its pattern: arithmetic, geometric, Fibonacci-like, perfect squares/cubes, triangular, powers of 2, or polynomial. Shows the formula and next 5 predicted terms."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">
              Number Sequence
            </label>
            <input
              type="text"
              className={inputClass}
              placeholder="e.g. 1, 4, 9, 16, 25 or 1 2 4 8 16"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              {error}
            </div>
          )}

          {analysis && (
            <div className="flex flex-col gap-3">
              {/* Input echo */}
              <div className="p-2 bg-gray-50 border border-gray-200">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Parsed: </span>
                <span className="text-xs font-mono text-gray-300">{analysis.terms.join(', ')}</span>
                <span className="text-xs text-gray-600 ml-2">({analysis.terms.length} terms)</span>
              </div>

              {analysis.patterns.length === 0 && (
                <div className="p-3 bg-gray-50 border border-gray-200 text-gray-400 text-sm">
                  No standard pattern recognized. Try providing more terms, or the sequence may be non-standard.
                </div>
              )}

              {analysis.patterns.map((p, i) => (
                <PatternCard key={i} pattern={p} primary={i === 0} />
              ))}
            </div>
          )}
        </div>
      }
    />
  );
}
