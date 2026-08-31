'use client';

import React, { useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { paneClass, segOff, segOn } from '@/Components/MainView/MainPanel/formControls';
import {
  LICENSES,
  suggestLicenses,
  formatLicenseSummary,
  getLicenseById,
  type NeedsAnswer,
} from './logic';

// The selected state used to be emerald-300 text on an emerald-500/10 fill — a
// dark-theme palette that all but vanished on white. segOn/segOff carry the
// light-first colours that globals.css also overrides for dark mode.
const btnOff = segOff;
const btnOn = segOn;
const questionClass = 'text-gray-700 text-xs font-semibold';
const groupLabelClass = 'text-gray-500 text-xs font-semibold uppercase tracking-wider';

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
  // In suggest mode the chips pick which match to show; falling back to the top
  // one when the current selection is not among them.
  const displayLicense =
    mode === 'browse'
      ? browseLicense
      : suggested.find(l => l.id === selectedId) ?? suggested[0];
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
              <p className="text-gray-600 text-xs">Answer a few questions to find the right license:</p>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className={questionClass}>Commercial use allowed?</span>
                  <div className="flex gap-2">
                    <button className={needs.commercial ? btnOn : btnOff} onClick={() => toggle('commercial', true)}>Yes</button>
                    <button className={!needs.commercial ? btnOn : btnOff} onClick={() => toggle('commercial', false)}>No</button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className={questionClass}>Patent grant required?</span>
                  <div className="flex gap-2">
                    <button className={needs.patent ? btnOn : btnOff} onClick={() => toggle('patent', true)}>Yes</button>
                    <button className={!needs.patent ? btnOn : btnOff} onClick={() => toggle('patent', false)}>No / Don&apos;t care</button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className={questionClass}>Modifications policy?</span>
                  <div className="flex gap-2 flex-wrap">
                    {([['any', 'Any'], ['allow-closed', 'Allow closed-source'], ['keep-open', 'Must share modifications']] as const).map(([val, label]) => (
                      <button key={val} className={needs.modifications === val ? btnOn : btnOff} onClick={() => toggle('modifications', val)}>{label}</button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className={questionClass}>Network/SaaS use triggers sharing?</span>
                  <div className="flex gap-2">
                    <button className={needs.network ? btnOn : btnOff} onClick={() => toggle('network', true)}>Yes (AGPL style)</button>
                    <button className={!needs.network ? btnOn : btnOff} onClick={() => toggle('network', false)}>No</button>
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              <div className="flex flex-col gap-2">
                <span className={groupLabelClass}>Matching Licenses ({suggested.length})</span>
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
                  {suggested.length === 0 && <span className="text-red-700 text-xs">No licenses match your criteria.</span>}
                </div>
              </div>
            </div>
          )}

          {mode === 'browse' && (
            <div className="flex flex-col gap-2">
              <span className={groupLabelClass}>Choose a License</span>
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
            <span className={groupLabelClass}>
              {displayLicense?.spdx ?? 'License Details'}
            </span>
            <textarea
              className={`${paneClass} text-sm min-h-[420px]`}
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
