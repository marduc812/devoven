'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  CopyButton,
  ErrorNote,
  Field,
  HeroResult,
  PresetRow,
  ResultTable,
  SectionTitle,
  StatTile,
  StatusBadge,
  ValueCard,
} from '@/Components/MainView/MainPanel/ResultUI';
import { useShareLink } from '@/Components/Functions/ShareLink';
import { cidForms, cidSegments, decodeCID, gatewayLinks, splitLabel } from './logic';

const EXAMPLES = [
  { label: 'CIDv0 (Qm…)', value: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG' },
  { label: 'CIDv1 base32', value: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi' },
  { label: 'raw codec', value: 'bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy' },
];

export const IpfsCidDecoder = () => {
  const [fromValue, setFromValue] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const from = params.get('from') ?? '';
      if (from) setFromValue(from);
    }
  }, []);

  useShareLink({ from: fromValue });

  const decoded = useMemo(() => {
    const trimmed = fromValue.trim();
    if (!trimmed) return null;
    const info = decodeCID(trimmed);
    if (!info.valid) return { info, forms: null, segments: [], gateways: [] };
    const forms = cidForms(info);
    return { info, forms, segments: cidSegments(info), gateways: gatewayLinks(forms) };
  }, [fromValue]);

  const info = decoded?.info;
  const forms = decoded?.forms ?? null;

  const codec = splitLabel(info?.codec ?? '');
  const base = splitLabel(info?.baseEncoding ?? '');
  const digestBytes = info?.digestHex ? info.digestHex.length / 2 : 0;
  // A CID cut short still parses: the declared length outruns the bytes that follow.
  const truncated = Boolean(info?.valid && info.digestLength !== digestBytes);

  return (
    <Panel
      title="IPFS CID Decoder"
      description="Decode an IPFS [1 Content Identifier 2] and see what it is made of. Takes [1 CIDv0 2] (starts with Qm) and [1 CIDv1 2] in base32, base58btc or hex, and gives back the version, codec, hash function and digest, the same CID in every other encoding, and gateway URLs that resolve it."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Field
              label="IPFS CID"
              value={fromValue}
              onChange={setFromValue}
              placeholder="QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"
            />
            <PresetRow presets={EXAMPLES} onPick={setFromValue} />
          </div>

          {info && !info.valid && <ErrorNote>{info.error}</ErrorNote>}

          {info?.valid && (
            <>
              <HeroResult
                label="Decoded"
                value={`v${info.version} · ${codec.name} · ${info.hashFunction}`}
                note={`${base.name} encoded, ${digestBytes}-byte digest${
                  codec.note ? ` — ${codec.note}` : ''
                }`}
                tone="pass"
                copyText={forms?.v1Base32}
              />

              {truncated && (
                <div className="flex items-center gap-3">
                  <StatusBadge tone="warn">truncated</StatusBadge>
                  <span className="text-xs text-gray-500">
                    The multihash declares {info.digestLength} bytes of digest but only {digestBytes}{' '}
                    follow. The CID is cut short or the wrong characters were pasted.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                <StatTile label="Version" value={`v${info.version}`} hint={info.version === 0 ? 'legacy' : 'current'} />
                <StatTile label="Multibase" value={base.name} hint={base.note} />
                <StatTile
                  label="Codec"
                  value={codec.name}
                  hint={`0x${info.codecCode?.toString(16)}${codec.note ? ` · ${codec.note}` : ''}`}
                />
                <StatTile
                  label="Hash"
                  value={info.hashFunction ?? ''}
                  hint={`0x${info.hashFunctionCode?.toString(16)}`}
                />
                <StatTile
                  label="Digest"
                  value={`${digestBytes} bytes`}
                  hint={`${digestBytes * 8} bits`}
                />
              </div>

              <div className="flex flex-col gap-3">
                <SectionTitle note="<version><codec><hash-fn><length><digest>">Byte Layout</SectionTitle>
                <ResultTable
                  headers={['Field', 'Bytes (hex)', 'Meaning']}
                  rows={(decoded?.segments ?? []).map(segment => [
                    <span key="l" className="text-gray-500 whitespace-nowrap">
                      {segment.label}
                    </span>,
                    <span key="h" className="break-all">
                      {segment.hex}
                    </span>,
                    <span key="n" className="text-gray-500">
                      {segment.note}
                    </span>,
                  ])}
                />
              </div>

              {forms && (
                <div className="flex flex-col gap-3">
                  <SectionTitle note="same digest, different coat">Other Encodings</SectionTitle>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                    <ValueCard
                      label={`CIDv1 base32${forms.v1Base32 === fromValue.trim() ? ' · your input' : ''}`}
                      value={forms.v1Base32}
                    />
                    <ValueCard
                      label={`CIDv1 base58btc${forms.v1Base58 === fromValue.trim() ? ' · your input' : ''}`}
                      value={forms.v1Base58}
                    />
                    <ValueCard
                      label={`CIDv1 base16${forms.v1Hex === fromValue.trim() ? ' · your input' : ''}`}
                      value={forms.v1Hex}
                    />
                    {forms.v0 ? (
                      <ValueCard
                        label={`CIDv0${forms.v0 === fromValue.trim() ? ' · your input' : ''}`}
                        value={forms.v0}
                      />
                    ) : (
                      <div className="border border-gray-200 bg-gray-50 px-3 py-2 min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                          CIDv0
                        </div>
                        <div className="text-xs text-gray-500">{forms.v0Note}</div>
                      </div>
                    )}
                    <ValueCard label="Native URI" value={`ipfs://${forms.v1Base32}`} />
                  </div>
                </div>
              )}

              {decoded && decoded.gateways.length > 0 && (
                <div className="flex flex-col gap-3">
                  <SectionTitle note="public gateways — they may not hold this block">
                    Resolve It
                  </SectionTitle>
                  <div className="border border-gray-200 divide-y divide-gray-200">
                    {decoded.gateways.map(gateway => (
                      <div
                        key={gateway.name}
                        className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 px-3 py-2"
                      >
                        <div className="flex items-center justify-between gap-3 sm:w-44 sm:flex-shrink-0">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                            {gateway.name}
                          </span>
                          <span className="sm:hidden">
                            <CopyButton text={gateway.url} label={gateway.name} />
                          </span>
                        </div>
                        <a
                          href={gateway.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs text-gray-900 underline hover:text-gray-500 break-all min-w-0 flex-1"
                        >
                          {gateway.url}
                        </a>
                        <span className="hidden sm:block">
                          <CopyButton text={gateway.url} label={gateway.name} />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      }
    />
  );
};
