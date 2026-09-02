'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  ErrorNote,
  HeroResult,
  PresetRow,
  SectionTitle,
  StatusBadge,
  ValueCard,
  inputClass,
  type BadgeTone,
} from '@/Components/MainView/MainPanel/ResultUI';
import { toEIP55Checksum, type EthChecksumForm } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const PRESETS = [
  { label: 'lowercase', value: '0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359' },
  { label: 'checksummed', value: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed' },
  { label: 'uppercase', value: '0xDE709F2102306220921060314715629080E2FB20' },
  { label: 'wrong checksum', value: '0x5aAeb6053f3E94C9b9A09f33669435E7Ef1BeAed' },
];

const FORM_COPY: Record<EthChecksumForm, { tone: BadgeTone; badge: string; note: string }> = {
  checksummed: {
    tone: 'pass',
    badge: 'Checksum valid',
    note: 'The capitalization you pasted matches EIP-55, so the address survived the trip intact.',
  },
  lowercase: {
    tone: 'info',
    badge: 'No checksum in input',
    note: 'An all-lowercase address carries no checksum. Use the capitalized form below.',
  },
  uppercase: {
    tone: 'info',
    badge: 'No checksum in input',
    note: 'An all-uppercase address carries no checksum. Use the capitalized form below.',
  },
  mismatch: {
    tone: 'fail',
    badge: 'Checksum mismatch',
    note: 'The mixed case you pasted disagrees with EIP-55. Either a character was mistyped or the case was mangled in transit.',
  },
};

/** The address with its uppercased letters — the checksum itself — picked out. */
const CasedAddress = ({ address, wrong }: { address: string; wrong?: number[] }) => (
  <span className="break-all">
    <span className="text-gray-400">0x</span>
    {address
      .slice(2)
      .split('')
      .map((ch, i) => {
        if (wrong?.includes(i)) {
          return (
            <span key={i} className="text-rose-700 bg-rose-100">
              {ch}
            </span>
          );
        }
        const isUpper = ch >= 'A' && ch <= 'F';
        return (
          <span key={i} className={isUpper ? 'text-indigo-700' : 'text-gray-900'}>
            {ch}
          </span>
        );
      })}
  </span>
);

export const EthChecksumConverter = () => {
  const [input, setInput] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input })

  const result = useMemo(() => (input.trim() ? toEIP55Checksum(input) : null), [input]);
  const copy = result?.form ? FORM_COPY[result.form] : null;

  return (
    <Panel
      title="Ethereum Address Checksum (EIP-55)"
      description="Capitalize an Ethereum address the [1 EIP-55 2] way, or check the capitalization of one you were given. Each hex letter is uppercased when the matching nibble of [1 keccak256(lowercase address) 2] is 8 or more, which hides a checksum in the case — so [1 0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359 2] becomes [1 0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359 2]."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <label
              className="text-[10px] font-bold uppercase tracking-widest text-gray-500"
              htmlFor="eth-address"
            >
              Ethereum address
            </label>
            <input
              id="eth-address"
              className={inputClass}
              placeholder="0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359"
              value={input}
              onChange={e => setInput(e.target.value)}
              spellCheck={false}
              autoComplete="off"
            />
            <PresetRow presets={PRESETS} onPick={setInput} />
          </div>

          {result && !result.valid && <ErrorNote>{result.error}</ErrorNote>}

          {result?.valid && copy && result.checksummed && (
            <>
              <HeroResult
                label="EIP-55 checksummed"
                value={<CasedAddress address={result.checksummed} />}
                tone={copy.tone}
                copyText={result.checksummed}
                note={
                  <span className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={copy.tone}>{copy.badge}</StatusBadge>
                    <StatusBadge tone="neutral">
                      {result.upperCount} of {result.letterCount} letters uppercased
                    </StatusBadge>
                  </span>
                }
              />

              <p className="text-sm text-gray-500 leading-relaxed">{copy.note}</p>

              {result.form === 'mismatch' && (
                <div className="flex flex-col gap-2">
                  <SectionTitle
                    note={`${result.mismatches?.length} character${
                      result.mismatches?.length === 1 ? '' : 's'
                    } differ`}
                  >
                    Your input
                  </SectionTitle>
                  <div className="border border-rose-200 bg-rose-50 px-3 py-2 font-mono text-base">
                    <CasedAddress address={result.input!} wrong={result.mismatches} />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <SectionTitle note="What wallets and explorers store">Lowercase form</SectionTitle>
                <ValueCard label="Address, no checksum" value={result.normalized!} />
              </div>
            </>
          )}
        </div>
      }
    />
  );
};
