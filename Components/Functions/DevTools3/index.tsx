'use client';

import React, { useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  calculateSpecificity,
  compareSpecificity,
  parseSemver,
  compareSemver,
  semverSatisfies,
  bumpVersion,
  type SpecificityScore,
} from './logic';

// ─── B2. Semver Comparator ────────────────────────────────────────────────────
export const SemverComparator = () => {
  const [versionA, setVersionA] = useState('');
  const [versionB, setVersionB] = useState('');
  const [rangeVersion, setRangeVersion] = useState('');
  const [range, setRange] = useState('');
  const [bumpInput, setBumpInput] = useState('');

  const inputClass = 'bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 border border-gray-300 focus:outline-none focus:border-gray-900 font-mono text-sm w-full';

  const parsedA = versionA.trim() ? parseSemver(versionA) : null;
  const parsedB = versionB.trim() ? parseSemver(versionB) : null;

  let compareResult: string | null = null;
  if (parsedA?.valid && parsedB?.valid) {
    try {
      const cmp = compareSemver(versionA, versionB);
      compareResult = cmp === 1 ? 'A > B' : cmp === -1 ? 'A < B' : 'A = B';
    } catch { /* ignore */ }
  }

  let satisfiesResult: boolean | null = null;
  if (rangeVersion.trim() && range.trim()) {
    try { satisfiesResult = semverSatisfies(rangeVersion, range); } catch { /* ignore */ }
  }

  let bumpResult: { major: string; minor: string; patch: string } | null = null;
  if (bumpInput.trim() && parseSemver(bumpInput).valid) {
    try {
      bumpResult = {
        major: bumpVersion(bumpInput, 'major'),
        minor: bumpVersion(bumpInput, 'minor'),
        patch: bumpVersion(bumpInput, 'patch'),
      };
    } catch { /* ignore */ }
  }

  return (
    <Panel
      title="Semver Comparator"
      description="Parse, compare, and validate [1 semantic version 2] strings. Check range satisfaction and bump versions."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6">
          {/* Compare two versions */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Compare Versions</span>
            <div className="flex flex-row gap-3 items-center">
              <input className={inputClass} placeholder="1.2.3" value={versionA} onChange={e => setVersionA(e.target.value)} />
              <span className="text-gray-400 text-sm shrink-0">vs</span>
              <input className={inputClass} placeholder="1.3.0" value={versionB} onChange={e => setVersionB(e.target.value)} />
            </div>
            {parsedA && !parsedA.valid && <p className="text-red-600 text-xs">Version A is not valid semver</p>}
            {parsedB && !parsedB.valid && <p className="text-red-600 text-xs">Version B is not valid semver</p>}
            {compareResult && (
              <div className="border border-gray-200 bg-gray-50 p-3 text-center">
                <span className="text-gray-900 font-black font-mono text-lg">{compareResult}</span>
              </div>
            )}
          </div>

          <div className="w-full h-px bg-gray-200" />

          {/* Range satisfies */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Range Check</span>
            <div className="flex flex-row gap-3 items-center">
              <input className={inputClass} placeholder="version e.g. 1.5.0" value={rangeVersion} onChange={e => setRangeVersion(e.target.value)} />
              <span className="text-gray-400 text-sm shrink-0">satisfies</span>
              <input className={inputClass} placeholder="range e.g. ^1.0.0" value={range} onChange={e => setRange(e.target.value)} />
            </div>
            {satisfiesResult !== null && (
              <div className={`border p-3 text-center ${satisfiesResult ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
                <span className={`font-bold text-sm uppercase tracking-wide ${satisfiesResult ? 'text-emerald-700' : 'text-red-700'}`}>
                  {satisfiesResult ? '✓ Satisfies' : '✗ Does not satisfy'}
                </span>
              </div>
            )}
          </div>

          <div className="w-full h-px bg-gray-200" />

          {/* Bump version */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Bump Version</span>
            <input className={inputClass} placeholder="e.g. 1.2.3" value={bumpInput} onChange={e => setBumpInput(e.target.value)} />
            {bumpResult && (
              <div className="border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {(['major', 'minor', 'patch'] as const).map((type, i) => (
                      <tr key={type} className={i > 0 ? 'border-t border-gray-200' : ''}>
                        <td className="px-4 py-2 text-gray-500 text-xs capitalize">{type}</td>
                        <td className="px-4 py-2 text-gray-900 font-mono text-right">{bumpResult![type]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      }
    />
  );
};
