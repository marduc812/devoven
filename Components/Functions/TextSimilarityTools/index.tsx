'use client';
import { useState, useEffect } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { TextInputPane } from '@/Components/View/FileInput';
import { computeSimilarity } from './logic';


function pct(n: number): string {
  return (n * 100).toFixed(1) + '%';
}

function barColor(value: number): string {
  if (value >= 0.85) return 'bg-emerald-500';
  if (value >= 0.65) return 'bg-green-500';
  if (value >= 0.40) return 'bg-yellow-500';
  if (value >= 0.20) return 'bg-orange-500';
  return 'bg-red-500';
}

export function TextSimilarity() {
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');

  const hasInput = text1.trim() && text2.trim();
  const result = hasInput ? computeSimilarity(text1, text2) : null;

  const scores = result ? [
    { label: 'Jaccard Similarity', value: result.jaccard, hint: 'Word set overlap' },
    { label: 'Cosine Similarity', value: result.cosine, hint: 'Word frequency vectors' },
    { label: 'Edit Distance', value: result.editDistSimilarity, hint: 'Character-level edits' },
    { label: 'LCS Similarity', value: result.lcsSimilarity, hint: 'Longest common subsequence' },
    { label: 'Bigram Char', value: result.charSimilarity, hint: 'Character bigram overlap' },
  ] : [];

  let verdict = '';
  if (result) {
    const ov = result.overallEstimate;
    if (ov >= 0.85) verdict = 'Very High — texts are nearly identical or closely paraphrased.';
    else if (ov >= 0.65) verdict = 'High — texts share significant content.';
    else if (ov >= 0.40) verdict = 'Moderate — texts have some overlap.';
    else if (ov >= 0.20) verdict = 'Low — texts have little in common.';
    else verdict = 'Very Low — texts appear unrelated.';
  }

  const content = (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInputPane
          label="Text 1"
          value={text1}
          onChange={setText1}
          placeholder="Paste the first text here, or drop a file..."
          rows={6}
        />
        <TextInputPane
          label="Text 2"
          value={text2}
          onChange={setText2}
          placeholder="Paste the second text here, or drop a file..."
          rows={6}
        />
      </div>

      {result && (
        <>
          <div className="border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Algorithm</th>
                  <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Score</th>
                  <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 hidden sm:table-cell">Bar</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((s, i) => (
                  <tr key={s.label} className={i > 0 ? 'border-t border-gray-200 dark:border-gray-700' : ''}>
                    <td className="px-4 py-2">
                      <span className="text-gray-900 dark:text-gray-100 font-medium">{s.label}</span>
                      <span className="block text-xs text-gray-400 dark:text-gray-500">{s.hint}</span>
                    </td>
                    <td className="px-4 py-2 font-mono text-gray-900 dark:text-gray-100">{pct(s.value)}</td>
                    <td className="px-4 py-2 hidden sm:table-cell">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${barColor(s.value)}`} style={{ width: pct(s.value) }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Overall Average</span>
            <span className="font-mono text-lg text-gray-900 dark:text-gray-100">{pct(result.overallEstimate)}</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{verdict}</p>
        </>
      )}

      {!hasInput && (
        <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-4">
          Enter text in both fields to see similarity analysis.
        </p>
      )}
    </div>
  );

  return (
    <Panel
      title="Text Similarity Score"
      description="Compare two text blocks for similarity using 5 algorithms: [1 Jaccard 2] (word sets), [1 Cosine 2] (frequency vectors), [1 Edit Distance 2], [1 LCS 2] (sequence), and [1 Bigram 2] (character-level)."
      extraElements={content}
      backColor="rose"
    />
  );
}
