'use client';

import React, { useEffect, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  parseEmailHeaders,
  formatDelay,
  CATEGORY_LABELS,
  SAMPLE_HEADERS,
  type EmailHeaderAnalysis,
  type HeaderCategory,
} from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const categoryColor: Record<HeaderCategory, string> = {
  routing: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  identity: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  authentication: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  content: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  spam: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  other: 'bg-gray-500/20 text-gray-700 border-gray-500/40',
};

const authColor = (val: string | null) => {
  if (!val) return 'text-gray-500';
  const v = val.toLowerCase();
  if (v === 'pass') return 'text-emerald-400';
  if (v === 'fail') return 'text-rose-400';
  if (v === 'softfail' || v === 'neutral') return 'text-amber-400';
  return 'text-gray-700';
};

export const EmailHeaderAnalyzer = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<EmailHeaderAnalysis | null>(null);
  const [activeCategory, setActiveCategory] = useState<HeaderCategory | 'all'>('all');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') ?? '';
    if (from) setInput(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input })

  useEffect(() => {
    if (!input.trim()) { setResult(null); return; }
    setResult(parseEmailHeaders(input));
  }, [input]);

  const inputClass =
    'bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 focus:border-gray-900 focus:outline-none font-mono text-xs resize-y min-h-[160px]';

  const categories: Array<HeaderCategory | 'all'> = ['all', 'routing', 'identity', 'authentication', 'content', 'spam', 'other'];

  const filteredHeaders = result
    ? activeCategory === 'all'
      ? result.headers
      : result.headers.filter(h => h.category === activeCategory)
    : [];

  return (
    <Panel
      title="Email Header Analyzer"
      description="Paste raw email headers to analyze the delivery path, authentication results (SPF/DKIM/DMARC), and all header fields."
      backColor="sky"
      extraElements={
        <div className="flex flex-col gap-4">
          <textarea
            className={inputClass}
            placeholder="Paste raw email headers here..."
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button
            className="px-4 py-2 border border-gray-900 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors cursor-pointer self-start"
            onClick={() => setInput(SAMPLE_HEADERS)}
          >
            Load Sample
          </button>

          {result && (
            <div className="flex flex-col gap-5">
              {/* Summary */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  ['From', result.from],
                  ['To', result.to],
                  ['Subject', result.subject],
                  ['Date', result.date],
                  ['Message-ID', result.messageId],
                  ['Total Delivery', result.deliveryMs !== null ? formatDelay(result.deliveryMs) : '—'],
                ].map(([label, value]) => (
                  <div key={label} className="border border-gray-200 p-3">
                    <p className="text-gray-500 text-xs mb-0.5">{label}</p>
                    <p className="text-gray-900 text-xs font-mono break-all">{value || '—'}</p>
                  </div>
                ))}
              </div>

              {/* Authentication */}
              {result.authResults && (
                <div className="border border-gray-200 p-3">
                  <p className="text-purple-400 text-xs font-semibold uppercase tracking-wider mb-2">Authentication Results</p>
                  <div className="flex gap-4 flex-wrap">
                    {(['spf', 'dkim', 'dmarc'] as const).map(key => (
                      <div key={key} className="flex flex-col gap-0.5">
                        <span className="text-gray-500 text-xs uppercase">{key}</span>
                        <span className={`text-sm font-bold font-mono ${authColor(result.authResults ? result.authResults[key] : null)}`}>
                          {(result.authResults && result.authResults[key]) || '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Received hops */}
              {result.received.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Mail Delivery Path ({result.received.length} hop{result.received.length !== 1 ? 's' : ''})
                  </p>
                  <div className="flex flex-col gap-2">
                    {result.received.map((hop, i) => (
                      <div key={i} className="border border-gray-200 p-3 flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-gray-500 font-mono">Hop {i + 1}</span>
                          {hop.delay !== null && hop.delay > 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded border ${hop.delay > 60000 ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-sky-500/20 text-sky-300 border-sky-500/40'}`}>
                              +{formatDelay(hop.delay)}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap text-xs">
                          <span className="text-gray-500">from</span>
                          <span className="text-gray-900 font-mono">{hop.from}</span>
                          <span className="text-gray-500">by</span>
                          <span className="text-gray-900 font-mono">{hop.by}</span>
                        </div>
                        {hop.date && (
                          <p className="text-gray-500 text-xs font-mono">{hop.date}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Header list with filter */}
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">All Headers</p>
                  <div className="flex gap-1 flex-wrap">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        className={`text-xs px-2 py-0.5 border cursor-pointer transition-colors ${activeCategory === cat ? 'bg-sky-500/30 text-sky-200 border-sky-500/60' : 'bg-white text-gray-500 border-gray-300 hover:border-gray-900 hover:text-gray-900'}`}
                        onClick={() => setActiveCategory(cat)}
                      >
                        {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {filteredHeaders.map((h, i) => (
                    <div key={i} className="border border-gray-200 p-3">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-gray-900 text-xs font-mono font-semibold">{h.name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded border ${categoryColor[h.category]}`}>
                          {CATEGORY_LABELS[h.category]}
                        </span>
                      </div>
                      <p className="text-gray-900 text-xs font-mono break-all">{h.value}</p>
                      <p className="text-gray-500 text-xs mt-1 leading-relaxed">{h.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      }
    />
  );
};
