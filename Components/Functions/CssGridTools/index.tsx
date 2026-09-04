'use client';
import { useState, useEffect } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { GRID_PATTERNS, generateGridCss, generateResponsiveGrid } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

export function CssGridGenerator() {
  const [input, setInput] = useState('');
  const [generatedCss, setGeneratedCss] = useState('');
  const [responsiveCss, setResponsiveCss] = useState('');
  const [activePattern, setActivePattern] = useState<number | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const from = params.get('from') ?? '';
      if (from) setInput(decodeURIComponent(from));
    }
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input })

  useEffect(() => {
    setGeneratedCss(generateGridCss(input));
    setResponsiveCss(generateResponsiveGrid(input));
  }, [input]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  const selectPattern = (idx: number) => {
    setActivePattern(idx);
  };

  const pattern = activePattern !== null ? GRID_PATTERNS[activePattern] : null;

  return (
    <Panel
      title="CSS Grid Generator"
      description="Generate [1 CSS Grid 2] code from a description. Enter column/row counts, gaps, or repeat() syntax. Browse common grid patterns: Holy Grail, Sidebar, Card Grid, Magazine, and Dashboard layouts."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6 w-full">
          {/* Input */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-400 text-xs uppercase tracking-wide">Describe your grid</label>
            <input
              className="bg-white text-gray-900 placeholder:text-gray-400 p-3 border border-gray-200 focus:border-gray-400 focus:outline-none text-sm font-mono"
              placeholder='e.g. "3 columns, 2 rows, 16px gap" or "repeat(auto-fill, minmax(200px, 1fr))"'
              value={input}
              onChange={e => setInput(e.target.value)}
            />
          </div>

          {/* Generated CSS */}
          {generatedCss && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-gray-400 text-xs uppercase tracking-wide">Generated CSS</label>
                <button
                  onClick={() => handleCopy(`.container {\n${generatedCss}\n}`, 'main')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  {copied === 'main' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="bg-white border border-gray-200 p-4 text-emerald-300 text-sm font-mono overflow-x-auto whitespace-pre">
{`.container {
${generatedCss}
}`}
              </pre>
            </div>
          )}

          {/* Responsive variant */}
          {responsiveCss && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-gray-400 text-xs uppercase tracking-wide">Responsive Variant</label>
                <button
                  onClick={() => handleCopy(responsiveCss, 'responsive')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  {copied === 'responsive' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="bg-white border border-gray-200 p-4 text-gray-900 text-xs font-mono overflow-x-auto whitespace-pre">
                {responsiveCss}
              </pre>
            </div>
          )}

          {/* Common patterns */}
          <div className="flex flex-col gap-3">
            <label className="text-gray-400 text-xs uppercase tracking-wide">Common Grid Patterns</label>
            <div className="flex flex-wrap gap-2">
              {GRID_PATTERNS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => selectPattern(i === activePattern ? -1 : i)}
                  className={`px-3 py-1.5 text-xs border transition-colors ${
                    activePattern === i
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-400'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>

            {pattern && (
              <div className="border border-gray-200 bg-gray-50 p-4 flex flex-col gap-3">
                <div>
                  <h4 className="text-emerald-300 text-sm font-semibold">{pattern.name}</h4>
                  <p className="text-gray-400 text-xs mt-1">{pattern.description}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-xs">Container CSS</span>
                    <button
                      onClick={() => handleCopy(`.container {\n${pattern.css}\n}`, 'pattern-css')}
                      className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      {copied === 'pattern-css' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <pre className="bg-white border border-gray-200 p-3 text-emerald-300 text-xs font-mono overflow-x-auto whitespace-pre">
{`.container {
${pattern.css}
}`}
                  </pre>
                </div>
                {pattern.areas && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-xs">Grid Areas</span>
                      <button
                        onClick={() => handleCopy(pattern.areas!, 'pattern-areas')}
                        className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        {copied === 'pattern-areas' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <pre className="bg-white border border-gray-200 p-3 text-gray-900 text-xs font-mono overflow-x-auto whitespace-pre">
                      {pattern.areas}
                    </pre>
                  </div>
                )}
                {pattern.responsive && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-xs">Responsive Variant</span>
                      <button
                        onClick={() => handleCopy(pattern.responsive!, 'pattern-resp')}
                        className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        {copied === 'pattern-resp' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <pre className="bg-white border border-gray-200 p-3 text-gray-400 text-xs font-mono overflow-x-auto whitespace-pre">
                      {pattern.responsive}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      }
    />
  );
}
