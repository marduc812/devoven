'use client';

import React, { useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { formatSemverReport, semverComparison, parseSemver } from './logic';

export const SemverRangeChecker = () => {
  const [version, setVersion] = useState('1.4.2-beta.1');
  const [range, setRange] = useState('^1.0.0');
  const [versionB, setVersionB] = useState('1.4.3');

  const report = version.trim() ? formatSemverReport(version, range) : '';
  const svA = parseSemver(version);
  const svB = parseSemver(versionB);
  const comparison =
    svA.valid && svB.valid && version.trim() && versionB.trim()
      ? semverComparison(version, versionB)
      : null;

  const inputClass =
    'bg-white text-gray-900 border border-gray-200 focus:border-gray-400 focus:outline-none px-3 py-2 text-sm font-mono w-full';

  return (
    <Panel
      title="Semver Range Checker"
      description="Parse a [1 semver 2] string, check it against a [1 range expression 2] (^, ~, >=, <=, >, <, =), and compare two versions side-by-side."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Version + Range */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-gray-400 text-xs">Semver String</label>
              <input
                className={inputClass}
                value={version}
                onChange={e => setVersion(e.target.value)}
                placeholder="1.2.3-beta.1+build.42"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-gray-400 text-xs">Range Expression (optional)</label>
              <input
                className={inputClass}
                value={range}
                onChange={e => setRange(e.target.value)}
                placeholder="^1.0.0 or >=1.0.0 <2.0.0"
              />
            </div>
          </div>

          {/* Report */}
          {report && (
            <pre className="bg-gray-50 text-gray-900 p-3 border border-gray-200 font-mono text-xs whitespace-pre-wrap">
              {report}
            </pre>
          )}

          {/* Comparison */}
          <div className="w-full h-px bg-gray-200" />
          <div className="flex flex-col gap-3">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
              Version Comparison
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 text-xs">Version A</label>
                <input
                  className={inputClass}
                  value={version}
                  onChange={e => setVersion(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 text-xs">Version B</label>
                <input
                  className={inputClass}
                  value={versionB}
                  onChange={e => setVersionB(e.target.value)}
                  placeholder="1.4.3"
                />
              </div>
            </div>
            {comparison && (
              <div
                className={`text-center py-3 border font-mono text-sm ${
                  comparison.result === 0
                    ? 'border-blue-500/30 text-blue-300 bg-blue-500/5'
                    : 'border-emerald-500/30 text-emerald-300 bg-emerald-500/5'
                }`}
              >
                {comparison.label}
              </div>
            )}
            {!svA.valid && version.trim() && (
              <p className="text-red-400 text-xs">Version A is not valid semver</p>
            )}
            {!svB.valid && versionB.trim() && (
              <p className="text-red-400 text-xs">Version B is not valid semver</p>
            )}
          </div>
        </div>
      }
    />
  );
};
