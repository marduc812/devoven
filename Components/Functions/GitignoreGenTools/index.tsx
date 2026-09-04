'use client';

import React, { useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { PROJECT_TYPES, generateGitignore } from './logic';

const btnBase = 'px-2.5 py-1 text-xs border transition-colors duration-150 cursor-pointer';
const btnOff = `${btnBase} border-gray-200 bg-gray-50 text-gray-400 hover:text-gray-900 hover:border-gray-400`;
const btnOn = `${btnBase} border-emerald-500/60 bg-emerald-500/10 text-emerald-300`;

export const GitignoreGen = () => {
  const [selected, setSelected] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const toggle = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const output = generateGitignore(selected);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <Panel
      title="Gitignore Generator"
      description="Select one or more [1 project types 2] and get a combined, deduplicated [1 .gitignore 2] file ready to copy into your repository."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Project type toggles */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                Project Types ({selected.length} selected)
              </span>
              {selected.length > 0 && (
                <button className={btnBase + ' border-gray-200 bg-gray-50 text-gray-500 hover:text-gray-900'} onClick={() => setSelected([])}>
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {PROJECT_TYPES.map(pt => (
                <button
                  key={pt.id}
                  className={selected.includes(pt.id) ? btnOn : btnOff}
                  onClick={() => toggle(pt.id)}
                >
                  {pt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Output */}
          <div className="w-full h-px bg-gray-200" />
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                .gitignore Output {output ? `(${output.split('\n').length} lines)` : ''}
              </span>
              <button
                className={btnBase + ' border-gray-200 bg-gray-50 text-gray-600 hover:text-gray-900 hover:border-gray-400'}
                onClick={handleCopy}
                disabled={!output}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <textarea
              className="bg-gray-50 text-gray-900 p-3 w-full border border-gray-300 font-mono text-sm resize-y"
              rows={Math.max(6, Math.min(30, (output || '').split('\n').length + 2))}
              value={output || 'Select one or more project types above to generate your .gitignore file.'}
              readOnly
            />
          </div>
        </div>
      }
    />
  );
};
