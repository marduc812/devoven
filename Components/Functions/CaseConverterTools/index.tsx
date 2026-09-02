'use client';
import { useState, useEffect } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { convertAllCases } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

export function CaseConverter() {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setInput(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input })

  const results = input.trim() ? convertAllCases(input) : [];

  function copyToClipboard(text: string, key: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(key);
        setTimeout(() => setCopied(''), 1500);
      });
    }
  }

  const inputClass =
    'bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors duration-150 text-sm';

  return (
    <Panel
      title="Multi-Case Converter"
      description="Convert a phrase to all common case formats at once. Handles [1 camelCase 2], [1 snake_case 2], [1 kebab-case 2], [1 PascalCase 2], and more. Supports spaces, hyphens, underscores as separators."
      backColor="rose"
      extraElements={
        <div className="flex flex-col gap-4">
          <input
            className={inputClass}
            placeholder="Enter a phrase, e.g. hello world"
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          {results.length === 0 && (
            <p className="text-gray-500 text-sm">Enter text above to see all case conversions.</p>
          )}
          {results.length > 0 && (
            <div className="flex flex-col gap-2">
              {results.map(r => (
                <div key={r.key} className="flex items-center gap-3 border-b border-gray-200 pb-2">
                  <span className="text-gray-500 text-xs w-44 shrink-0">{r.label}</span>
                  <code className="text-gray-900 text-sm font-mono flex-1 break-all">{r.value}</code>
                  <button
                    className="text-xs text-rose-400 hover:text-rose-300 transition-colors shrink-0 px-2 py-0.5 rounded border border-rose-500/30 hover:border-rose-400/50"
                    onClick={() => copyToClipboard(r.value, r.key)}
                  >
                    {copied === r.key ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      }
    />
  );
}
