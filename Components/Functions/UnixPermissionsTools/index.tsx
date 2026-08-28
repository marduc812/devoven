'use client';

import React, { useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { parsePermissions, COMMON_PERMISSIONS, type PermissionBreakdown } from './logic';

const BitCell = ({ value, label }: { value: boolean; label: string }) => (
  <div className="flex flex-col items-center">
    <span
      className={`inline-flex items-center justify-center w-8 h-8 text-sm font-mono font-bold border ${
        value
          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
          : 'bg-gray-500/10 text-gray-600 border-gray-700/40'
      }`}
    >
      {value ? label : '-'}
    </span>
  </div>
);

const PermGroup = ({ label, perm }: { label: string; perm: { read: boolean; write: boolean; execute: boolean } }) => (
  <div className="flex flex-col items-center gap-1">
    <p className="text-gray-400 text-xs mb-1">{label}</p>
    <div className="flex gap-1">
      <BitCell value={perm.read} label="r" />
      <BitCell value={perm.write} label="w" />
      <BitCell value={perm.execute} label="x" />
    </div>
  </div>
);

export const UnixPermissions = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<PermissionBreakdown | null>(null);
  const [error, setError] = useState('');

  const calculate = () => {
    try {
      setResult(parsePermissions(input));
      setError('');
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : 'Invalid input');
    }
  };

  const inputClass =
    'bg-white backdrop-blur-sm text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors duration-200 font-mono text-sm';
  const btnClass =
    'mt-2 px-4 py-2 border border-gray-900 bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors duration-200 cursor-pointer';

  return (
    <Panel
      title="Unix File Permissions Calculator"
      description="Convert between octal ([1 755 2]) and symbolic ([1 rwxr-xr-x 2]) Unix file permissions. Shows visual owner/group/other breakdown and permission meaning."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-5">
          <div className="flex gap-2">
            <input
              className={inputClass}
              placeholder="755 or rwxr-xr-x"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && calculate()}
            />
            <button className={btnClass} onClick={calculate}>
              Convert
            </button>
          </div>

          {error && <p className="text-red-400 text-sm font-mono">{error}</p>}

          {result && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-around">
                <PermGroup label="Owner" perm={result.owner} />
                <PermGroup label="Group" perm={result.group} />
                <PermGroup label="Others" perm={result.other} />
              </div>
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex gap-4">
                  <span className="text-gray-400 w-24">Octal</span>
                  <span className="text-gray-900 font-mono">{result.octal}</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-gray-400 w-24">Symbolic</span>
                  <span className="text-gray-900 font-mono">{result.symbolic}</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-gray-400 w-24">Summary</span>
                  <span className="text-gray-300 text-xs">{result.description}</span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-2">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Common Permissions</p>
            <div className="flex flex-col gap-1">
              {COMMON_PERMISSIONS.map(cp => (
                <button
                  key={cp.octal}
                  className="flex items-center gap-3 text-left hover:bg-gray-50 px-2 py-1 transition-colors duration-150 cursor-pointer"
                  onClick={() => { setInput(cp.octal); setResult(null); setError(''); }}
                >
                  <span className="font-mono text-emerald-300 text-xs w-8">{cp.octal}</span>
                  <span className="font-mono text-gray-400 text-xs w-20">{cp.symbolic}</span>
                  <span className="text-gray-500 text-xs">{cp.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      }
    />
  );
};
