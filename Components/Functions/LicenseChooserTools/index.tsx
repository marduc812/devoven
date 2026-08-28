'use client';

import React, { useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  LICENSES,
  suggestLicenses,
  formatLicenseSummary,
  getLicenseById,
  type NeedsAnswer,
} from './logic';

const btnBase = 'px-3 py-1.5 text-xs border transition-colors duration-150';
const btnOff = `${btnBase} border-gray-200 bg-gray-50 text-gray-400 hover:text-gray-900 hover:border-gray-400`;
const btnOn = `${btnBase} border-emerald-500/60 bg-emerald-500/10 text-emerald-300`;

export const LicenseChooser = () => {
  const [mode, setMode] = useState<'browse' | 'suggest'>('suggest');
  const [selectedId, setSelectedId] = useState<string>('mit');
  const [needs, setNeeds] = useState<NeedsAnswer>({
    commercial: true,
    shareCode: false,
    patent: false,
    modifications: 'any',
    network: false,
  });

  const toggle = <K extends keyof NeedsAnswer>(key: K, val: NeedsAnswer[K]) =>
    setNeeds(prev => ({ ...prev, [key]: val }));

  const suggested = suggestLicenses(needs);
  const browseLicense = getLicenseById(selectedId);
  const displayLicense = mode === 'browse' ? browseLicense : suggested[0];
  const output = displayLicense ? formatLicenseSummary(displayLicense) : 'No matching license found for your criteria.';

  return (
    <Panel
      title="License Chooser"
      description="Compare [1 open-source licenses 2] or answer a few questions to get a [1 license suggestion 2] for your project."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Mode tabs */}
          <div className="flex gap-2">
            <button className={mode === 'suggest' ? btnOn : btnOff} onClick={() => setMode('suggest')}>Smart Suggest</button>
            <button className={mode === 'browse' ? btnOn : btnOff} onClick={() => setMode('browse')}>Browse All</button>
          </div>

          {mode === 'suggest' && (
            <div className="flex flex-col gap-4">
              <p className="text-gray-400 text-xs">Answer a few questions to find the right license:</p>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-gray-300 text-xs font-semibold">Commercial use allowed?</span>
                  <div className="flex gap-2">
                    <button className={needs.commercial ? btnOn : btnOff} onClick={() => toggle('commercial', true)}>Yes</button>
                    <button className={!needs.commercial ? btnOn : btnOff} onClick={() => toggle('commercial', false)}>No</button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-gray-300 text-xs font-semibold">Patent grant required?</span>
                  <div className="flex gap-2">
                    <button className={needs.patent ? btnOn : btnOff} onClick={() => toggle('patent', true)}>Yes</button>
                    <button className={!needs.patent ? btnOn : btnOff} onClick={() => toggle('patent', false)}>No / Don&apos;t care</button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-gray-300 text-xs font-semibold">Modifications policy?</span>
                  <div className="flex gap-2 flex-wrap">
                    {([['any', 'Any'], ['allow-closed', 'Allow closed-source'], ['keep-open', 'Must share modifications']] as const).map(([val, label]) => (
                      <button key={val} className={needs.modifications === val ? btnOn : btnOff} onClick={() => toggle('modifications', val)}>{label}</button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-gray-300 text-xs font-semibold">Network/SaaS use triggers sharing?</span>
                  <div className="flex gap-2">
                    <button className={needs.network ? btnOn : btnOff} onClick={() => toggle('network', true)}>Yes (AGPL style)</button>
                    <button className={!needs.network ? btnOn : btnOff} onClick={() => toggle('network', false)}>No</button>
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              <div className="flex flex-col gap-2">
                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Matching Licenses ({suggested.length})</span>
                <div className="flex flex-wrap gap-2">
                  {suggested.map(l => (
                    <button
                      key={l.id}
                      className={selectedId === l.id ? btnOn : btnOff}
                      onClick={() => { setSelectedId(l.id); }}
                    >
                      {l.spdx}
                    </button>
                  ))}
                  {suggested.length === 0 && <span className="text-red-400 text-xs">No licenses match your criteria.</span>}
                </div>
              </div>
            </div>
          )}

          {mode === 'browse' && (
            <div className="flex flex-col gap-2">
              <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Choose a License</span>
              <div className="flex flex-wrap gap-2">
                {LICENSES.map(l => (
                  <button
                    key={l.id}
                    className={selectedId === l.id ? btnOn : btnOff}
                    onClick={() => setSelectedId(l.id)}
                  >
                    {l.spdx}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* License detail */}
          <div className="w-full h-px bg-gray-200" />
          <div className="flex flex-col gap-2">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
              {mode === 'suggest' && suggested.length > 0
                ? `Top Suggestion: ${displayLicense?.spdx ?? ''}`
                : displayLicense?.spdx ?? 'License Details'}
            </span>
            <textarea
              className="bg-gray-50 text-gray-900 p-3 w-full border border-gray-300 font-mono text-sm resize-y"
              rows={20}
              value={output}
              readOnly
            />
          </div>
        </div>
      }
    />
  );
};
