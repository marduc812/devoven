'use client';

import React, { useState } from 'react';
import { FileTextArea } from '@/Components/View/FileInput';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { evaluateJsonPath, formatJsonPathResults } from './logic';

export const JsonPathTester = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [pathInput, setPathInput] = useState('');
  const [results, setResults] = useState('');

  const evaluate = () => {
    if (!jsonInput.trim() || !pathInput.trim()) {
      setResults('');
      return;
    }
    try {
      const matched = evaluateJsonPath(jsonInput, pathInput);
      setResults(formatJsonPathResults(matched));
    } catch (e: unknown) {
      setResults(e instanceof Error ? `Error: ${e.message}` : 'Invalid input');
    }
  };

  const textareaClass =
    'bg-white backdrop-blur-sm text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none resize-none transition-colors duration-200 font-mono text-sm';
  const inputClass =
    'bg-white backdrop-blur-sm text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors duration-200 font-mono text-sm';
  const btnClass =
    'px-5 py-2 bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-sm font-medium hover:bg-cyan-500/30 transition-colors duration-200 cursor-pointer';

  return (
    <Panel
      title="JSON Path Tester"
      description="Test [1 JSONPath 2] expressions against a JSON document. Supports [1 $ 2], [1 .key 2], [1 [0] 2], [1 [*] 2], [1 ..key 2], and filter expressions like [1 [?(@.price > 10)] 2]."
      backColor="cyan"
      extraElements={
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-cyan-300 text-xs font-semibold uppercase tracking-wider">
              JSON Document
            </label>
            <FileTextArea>
              <textarea
                className={textareaClass}
                placeholder={'{\n  "store": {\n    "book": [{ "title": "Example", "price": 9.99 }]\n  }\n}'}
                rows={8}
                value={jsonInput}
                onChange={e => setJsonInput(e.target.value)}
              />
            </FileTextArea>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-cyan-300 text-xs font-semibold uppercase tracking-wider">
              JSONPath Expression
            </label>
            <div className="flex gap-2">
              <input
                className={inputClass}
                placeholder="$.store.book[*].title"
                value={pathInput}
                onChange={e => setPathInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && evaluate()}
              />
              <button className={btnClass} onClick={evaluate}>
                Evaluate
              </button>
            </div>
          </div>

          {results && (
            <>
              <div className="w-full h-px bg-gray-200" />
              <div className="flex flex-col gap-2">
                <label className="text-cyan-300 text-xs font-semibold uppercase tracking-wider">
                  Results
                </label>
                <pre className="bg-gray-50 p-3 border border-gray-200 font-mono text-sm text-gray-900 whitespace-pre-wrap break-all">
                  {results}
                </pre>
              </div>
            </>
          )}
        </div>
      }
    />
  );
};
