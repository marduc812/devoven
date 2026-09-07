'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { FileTextArea } from '@/Components/View/FileInput';
import {
  CopyButton,
  ResultTable,
  SectionTitle,
  StatTile,
  StatusBadge,
} from '@/Components/MainView/MainPanel/ResultUI';
import { inputClass } from '@/Components/MainView/MainPanel/formControls';
import { useShareLink } from '@/Components/Functions/ShareLink';
import {
  DigestCase,
  familyLabel,
  familyNote,
  filterHashRows,
  formatAllHashes,
  generateAllHashes,
  groupByFamily,
} from './logic';

const segBase = 'font-mono text-xs px-3 py-1.5 border transition-colors duration-150 cursor-pointer';

export const AllHashes = () => {
  const [input, setInput] = useState('');
  const [digestCase, setDigestCase] = useState<DigestCase>('lower');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const from = params.get('from');
    if (from) setInput(from);
    if (params.get('case') === 'upper') setDigestCase('upper');
    const filter = params.get('filter');
    if (filter) setQuery(filter);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input, case: digestCase, filter: query });

  const rows = useMemo(() => generateAllHashes(input, { case: digestCase }), [input, digestCase]);
  const shown = useMemo(() => filterHashRows(rows, query), [rows, query]);
  const groups = useMemo(() => groupByFamily(shown), [shown]);

  const inputBytes = useMemo(() => new TextEncoder().encode(input).length, [input]);

  return (
    <Panel
      title="Generate All Hashes"
      description="Run every hash on the shelf over one input at once — [1 MD5 2], the SHA-2 and SHA-3 sizes, Keccak, BLAKE2 and BLAKE3, RIPEMD160, Whirlpool, SM3, and the non-cryptographic checksums. Useful when you have a digest and need to work out which algorithm made it, or when you want the same string in every format at once."
      backColor="teal"
      extraElements={
        <div className="flex flex-col gap-6">
          {/* Input */}
          <div className="flex flex-col gap-3">
            <SectionTitle
              note={`${input.length} char${input.length === 1 ? '' : 's'} · ${inputBytes} byte${inputBytes === 1 ? '' : 's'} UTF-8`}
            >
              Input
            </SectionTitle>

            <FileTextArea>
              <textarea
                className="bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full h-28 border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors duration-150 font-mono text-sm resize-y"
                spellCheck={false}
                placeholder="Type or paste anything, or drop a text file on this box"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </FileTextArea>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                {(
                  [
                    ['lower', 'lowercase'],
                    ['upper', 'UPPERCASE'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setDigestCase(value)}
                    className={`${segBase} ${
                      digestCase === value
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <input
                className={`${inputClass} flex-1 min-w-[12rem]`}
                placeholder="Filter by algorithm, family or digest"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatTile label="Algorithms" value={rows.length} hint="run on every keystroke" />
            <StatTile
              label="Shown"
              value={shown.length}
              hint={query ? `matching "${query}"` : 'no filter'}
            />
            <StatTile label="Families" value={groups.length} hint="grouped below" />
            <StatTile
              label="Widths"
              value={`${Math.min(...rows.map((r) => r.bits))}–${Math.max(...rows.map((r) => r.bits))}`}
              hint="bits"
            />
          </div>

          {/* Digests */}
          {groups.length === 0 ? (
            <div className="border border-gray-200 bg-gray-50 px-4 py-3 flex flex-wrap items-center gap-3">
              <StatusBadge tone="neutral">no match</StatusBadge>
              <p className="text-sm text-gray-600">
                Nothing on the shelf matches &ldquo;{query}&rdquo;. Clear the filter to see all{' '}
                {rows.length} again.
              </p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.family} className="flex flex-col gap-2">
                <SectionTitle note={familyNote[group.family]}>
                  {familyLabel[group.family]}
                </SectionTitle>
                <ResultTable
                  headers={['Algorithm', 'Bits', 'Digest', '']}
                  align={['left', 'right', 'left', 'right']}
                  rows={group.rows.map((row) => [
                    <span key="n" className="whitespace-nowrap">
                      <span className="text-gray-900 font-bold">{row.name}</span>
                      <span className="block font-sans text-[11px] text-gray-400 whitespace-normal">
                        {row.note}
                      </span>
                    </span>,
                    <span key="b" className="text-gray-500">
                      {row.bits}
                    </span>,
                    <span key="d" className="break-all">
                      {row.digest}
                      {row.decimal && (
                        <span className="block text-[11px] text-gray-400">{row.decimal} decimal</span>
                      )}
                    </span>,
                    <CopyButton key="c" text={row.digest} label={row.name} />,
                  ])}
                />
              </div>
            ))
          )}

          {/* The whole table as text, for pasting into a ticket. */}
          <div className="flex flex-col gap-2">
            <SectionTitle note={<CopyButton text={formatAllHashes(shown)} label="every digest" />}>
              All of it as text
            </SectionTitle>
            <textarea
              className="bg-gray-50 text-gray-900 p-3 w-full border border-gray-200 cursor-default resize-y font-mono text-xs"
              rows={8}
              value={formatAllHashes(shown)}
              readOnly
            />
          </div>
        </div>
      }
    />
  );
};
