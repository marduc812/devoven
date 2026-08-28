'use client';
import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { minifyCode, MinifyResult, CodeLanguage } from './logic';

export function CodeMinifier() {
  const [input, setInput] = useState('');
  const [lang, setLang] = useState<CodeLanguage>('auto');
  const [output, setOutput] = useState('');
  const [stats, setStats] = useState<MinifyResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); setStats(null); setError(''); return; }
    try {
      const result = minifyCode(input, lang);
      setOutput(result.minified);
      setStats(result);
      setError('');
    } catch (e) {
      setOutput('');
      setStats(null);
      setError((e as Error).message);
    }
  }, [input, lang]);

  return (
    <AdvancedConverter
      title="Code Minifier"
      description="Minify [1 JavaScript 2] or [1 CSS 2] code. Removes comments, collapses whitespace, and strips unnecessary characters. Auto-detects language or choose manually. Shows original vs minified size."
      fromValue={input}
      toValue={error ? `Error: ${error}` : output}
      setFromValue={setInput}
      fromTitle="Code to minify"
      toTitle="Minified Output"
      backColor="cyan"
      extraElements={
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 w-full">
          <div className="flex flex-col gap-2">
            <label className="text-gray-400 text-sm">Language</label>
            <select
              className="border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:outline-none focus:border-gray-900"
              value={lang}
              onChange={e => setLang(e.target.value as CodeLanguage)}
            >
              <option value="auto">Auto-detect</option>
              <option value="js">JavaScript</option>
              <option value="css">CSS</option>
            </select>
          </div>

          {stats && (
            <dl className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500 font-mono sm:ml-auto">
              <div className="flex gap-1.5">
                <dt>Language</dt>
                <dd className="text-gray-900">{stats.language.toUpperCase()}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt>Original</dt>
                <dd className="text-gray-900">{stats.originalSize} B</dd>
              </div>
              <div className="flex gap-1.5">
                <dt>Minified</dt>
                <dd className="text-gray-900">{stats.minifiedSize} B</dd>
              </div>
              <div className="flex gap-1.5">
                <dt>Saved</dt>
                <dd className="text-gray-900">{stats.savings} B ({stats.savingsPercent.toFixed(1)}%)</dd>
              </div>
            </dl>
          )}
        </div>
      }
    />
  );
}
