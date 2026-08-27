'use client';

import React, { useState, useMemo } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { estimateComplexity, ComplexityResult, ComplexityRating } from './logic';

const ratingStyle: Record<ComplexityRating, { badge: string; bar: string; width: string }> = {
  'low':      { badge: 'border-emerald-200 bg-emerald-50 text-emerald-700', bar: 'bg-emerald-500', width: 'w-1/4' },
  'medium':   { badge: 'border-yellow-200 bg-yellow-50 text-yellow-700',   bar: 'bg-yellow-500',  width: 'w-2/4' },
  'high':     { badge: 'border-orange-200 bg-orange-50 text-orange-700',   bar: 'bg-orange-500',  width: 'w-3/4' },
  'very high':{ badge: 'border-red-200 bg-red-50 text-red-700',            bar: 'bg-red-500',     width: 'w-full' },
};

export const ComplexityEstimator = () => {
  const [code, setCode] = useState('');

  const result: ComplexityResult | null = useMemo(
    () => code.trim() ? estimateComplexity(code) : null,
    [code]
  );
  const style = result ? ratingStyle[result.rating] : null;

  return (
    <Panel
      title="Code Complexity Estimator"
      description="Paste any [1 code snippet 2] to get a language-agnostic [1 cyclomatic complexity 2] estimate — counts if/else, loops, switch/case, catch, &&, ||, and ternary branches."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Code Snippet (any language)</label>
            <textarea
              className="bg-white text-gray-900 border border-gray-300 focus:border-gray-900 focus:outline-none px-3 py-2 text-sm font-mono w-full resize-y"
              rows={8}
              placeholder="Paste any code snippet here..."
              value={code}
              onChange={e => setCode(e.target.value)}
            />
          </div>

          {result && style && (
            <>
              {/* Score + rating */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-5xl font-black font-mono text-gray-900">{result.cyclomaticComplexity}</span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Cyclomatic Complexity</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-black uppercase tracking-wider border ${style.badge}`}>
                      {result.rating}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 h-1.5">
                  <div className={`h-1.5 ${style.bar} ${style.width} transition-all duration-300`} />
                </div>
                <p className="text-xs text-gray-500 mt-1">{result.ratingNote}</p>
              </div>

              {/* Line metrics */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Line Metrics</p>
                <div className="border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      {[
                        ['Total Lines', result.linesOfCode],
                        ['Code Lines', result.codeLines],
                        ['Comment Lines', result.commentLines],
                        ['Blank Lines', result.blankLines],
                        ['Comment Ratio', `${result.commentRatio}%`],
                        ['Max Nesting Depth', result.maxNestingDepth],
                      ].map(([label, value], i) => (
                        <tr key={String(label)} className={i > 0 ? 'border-t border-gray-200' : ''}>
                          <td className="px-4 py-2 text-gray-500 text-xs">{label}</td>
                          <td className="px-4 py-2 text-gray-900 font-mono text-right">{String(value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Branch breakdown */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Branch Breakdown</p>
                <div className="border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      {[
                        ['If / Else', result.branches.ifElse],
                        ['Loops', result.branches.loops],
                        ['Switch / Case', result.branches.switchCase],
                        ['Try / Catch', result.branches.exceptions],
                        ['Logical (&&, ||)', result.branches.logicalOps],
                        ['Ternary (?)', result.branches.ternary],
                      ].map(([label, value], i) => (
                        <tr key={String(label)} className={i > 0 ? 'border-t border-gray-200' : ''}>
                          <td className="px-4 py-2 text-gray-500 text-xs">{label}</td>
                          <td className="px-4 py-2 text-gray-900 font-mono text-right">{String(value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {!code.trim() && (
            <p className="text-gray-400 text-sm text-center py-4">Paste code above to estimate complexity</p>
          )}
        </div>
      }
    />
  );
};
