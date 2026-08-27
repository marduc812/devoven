'use client';

import React, { useState, useEffect } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { analyzeAriaIssues, formatAnalysisOutput, getPatternSuggestions } from './logic';

export function AriaLabelGenerator() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [activePattern, setActivePattern] = useState<string | null>(null);

  const patterns = getPatternSuggestions();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      const result = analyzeAriaIssues(input);
      setOutput(formatAnalysisOutput(result));
    } catch (e) {
      setOutput(e instanceof Error ? 'Error: ' + e.message : 'Error analyzing HTML');
    }
  }, [input]);

  const textareaClass = 'bg-white backdrop-blur-sm text-gray-900 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none resize-none transition-colors duration-200 font-mono text-sm';
  const btnClass = 'px-3 py-1.5 text-xs border border-gray-200 bg-gray-50 text-gray-300 hover:text-gray-900 hover:border-gray-400 transition-colors cursor-pointer';

  return (
    <Panel
      title="ARIA Label Generator"
      description="Analyze HTML snippets for accessibility issues and get [1 ARIA 2] label suggestions. Paste your HTML to check for missing labels, alt text, and roles."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Pattern Suggestions */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Pattern Examples</span>
            <div className="flex flex-wrap gap-2">
              {patterns.map(function(p) {
                return (
                  <button
                    key={p.pattern}
                    className={btnClass + (activePattern === p.pattern ? ' border-emerald-500/40 text-emerald-300' : '')}
                    onClick={function() {
                      setActivePattern(p.pattern);
                      setInput(p.html);
                    }}
                  >
                    {p.pattern}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-gray-500 uppercase tracking-wider">HTML Input</span>
            <textarea
              className={textareaClass}
              placeholder={'<button></button>\n<img src="logo.png">\n<input type="text">'}
              rows={8}
              value={input}
              onChange={function(e) { setInput(e.target.value); setActivePattern(null); }}
            />
          </div>

          {/* Output */}
          {output && (
            <>
              <div className="w-full h-px bg-gray-200" />
              <div className="flex flex-col gap-2">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Analysis Result</span>
                <pre className="bg-gray-50 text-gray-900 p-3 w-full border border-gray-200 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                  {output}
                </pre>
              </div>
            </>
          )}
        </div>
      }
    />
  );
}
