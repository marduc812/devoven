'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { FileTextArea } from '@/Components/View/FileInput';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  CopyButton,
  ErrorNote,
  HeroResult,
  PresetRow,
  SectionTitle,
  StatTile,
  StatusBadge,
} from '@/Components/MainView/MainPanel/ResultUI';
import { buildMerkleTree, merkleLevels, merkleProof } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const PRESETS = [
  { label: 'Transactions', value: 'tx-alpha\ntx-bravo\ntx-charlie\ntx-delta' },
  { label: 'Odd count', value: 'a\nb\nc\nd\ne' },
  {
    label: 'Block files',
    value: 'block-0.dat\nblock-1.dat\nblock-2.dat\nblock-3.dat\nblock-4.dat\nblock-5.dat\nblock-6.dat\nblock-7.dat',
  },
];

const short = (h: string) => `${h.slice(0, 8)}…${h.slice(-4)}`;

export const MerkleTreeVisualizer = () => {
  const [input, setInput] = useState('tx-alpha\ntx-bravo\ntx-charlie\ntx-delta');
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from') ?? '';
    if (from) setInput(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input })

  const items = useMemo(
    () => input.split('\n').map(s => s.trim()).filter(s => s.length > 0),
    [input]
  );

  const { result, error } = useMemo(() => {
    if (items.length === 0) return { result: null, error: '' };
    try {
      return { result: buildMerkleTree(items), error: '' };
    } catch (e) {
      return { result: null, error: e instanceof Error ? e.message : 'Error building tree' };
    }
  }, [items]);

  // Keep the selection valid when the item list shrinks.
  const leafIndex = result && selected < result.leaves.length ? selected : 0;

  const levels = useMemo(() => (result ? merkleLevels(result.leaves) : []), [result]);
  const proof = useMemo(
    () => (result ? merkleProof(result.leaves, leafIndex) : []),
    [result, leafIndex]
  );

  /** Hashes on the path from the selected leaf up to the root, for highlighting. */
  const pathHashes = useMemo(() => {
    if (!result) return new Set<string>();
    const set = new Set<string>([result.leaves[leafIndex]]);
    for (const step of proof) set.add(step.resultHash);
    return set;
  }, [result, proof, leafIndex]);

  const siblingHashes = useMemo(() => new Set(proof.map(s => s.siblingHash)), [proof]);

  return (
    <Panel
      title="Merkle Tree Visualizer"
      description="Build a [1 Merkle tree 2] from a list of items, one per line. Each item is SHA-256 hashed into a leaf and every parent hashes its two children. Click any leaf to see the [1 proof path 2] that recomputes the root. Max 64 items."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6">
          {/* Input */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Items <span className="font-normal text-gray-400 normal-case">one per line, max 64</span>
            </label>
            <FileTextArea>
              <textarea
                className="bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full h-36 border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors duration-150 font-mono text-sm resize-y"
                placeholder={'tx-alpha\ntx-bravo\ntx-charlie'}
                value={input}
                onChange={e => setInput(e.target.value)}
              />
            </FileTextArea>
            <PresetRow presets={PRESETS} onPick={setInput} />
          </div>

          {error && <ErrorNote>{error}</ErrorNote>}

          {result && (
            <>
              <HeroResult
                label="Merkle root"
                value={<span className="text-lg sm:text-xl">{result.root}</span>}
                copyText={result.root}
                note={`SHA-256 · ${result.leaves.length} leaf hash${result.leaves.length === 1 ? '' : 'es'} · ${levels.length - 1} level${levels.length === 2 ? '' : 's'} above the leaves`}
              />

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <StatTile label="Items" value={items.length} />
                <StatTile label="Tree depth" value={levels.length - 1} hint="levels above the leaves" />
                <StatTile
                  label="Proof size"
                  value={proof.length}
                  hint={`${proof.length} sibling hash${proof.length === 1 ? '' : 'es'}`}
                />
                <StatTile
                  label="Odd-level padding"
                  value={proof.some(s => s.duplicated) ? 'Yes' : 'No'}
                  hint="lone nodes pair with themselves"
                />
              </div>

              {/* Tree */}
              <div className="flex flex-col gap-3">
                <SectionTitle note="root at the top — the highlighted path recomputes it from the selected leaf">
                  Tree structure
                </SectionTitle>
                <div className="border border-gray-200 overflow-x-auto">
                  <div className="flex flex-col gap-2 p-4 min-w-fit">
                    {[...levels].reverse().map((nodes, revIdx) => {
                      const level = levels.length - 1 - revIdx;
                      return (
                        <div key={level} className="flex flex-col items-center gap-1">
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            {nodes.map((hash, i) => {
                              const onPath = pathHashes.has(hash);
                              const isSibling = !onPath && siblingHashes.has(hash);
                              return (
                                <div
                                  key={`${level}-${i}`}
                                  title={hash}
                                  className={`px-2 py-1 border font-mono text-[10px] whitespace-nowrap ${
                                    onPath
                                      ? 'bg-emerald-100 border-emerald-400 text-emerald-800 font-bold'
                                      : isSibling
                                        ? 'bg-amber-50 border-amber-300 text-amber-800'
                                        : 'bg-gray-50 border-gray-200 text-gray-500'
                                  }`}
                                >
                                  {short(hash)}
                                </div>
                              );
                            })}
                          </div>
                          <span className="text-[9px] uppercase tracking-widest text-gray-700">
                            {level === levels.length - 1
                              ? 'root'
                              : level === 0
                                ? 'leaves'
                                : `level ${level}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-emerald-100 border border-emerald-400" /> proof path
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-amber-50 border border-amber-300" /> sibling hashes
                  </span>
                </div>
              </div>

              {/* Leaves */}
              <div className="flex flex-col gap-3">
                <SectionTitle note="click a leaf to build its proof">Leaves</SectionTitle>
                <div className="border border-gray-200 divide-y divide-gray-200">
                  {result.leaves.map((hash, i) => (
                    <button
                      key={i}
                      onClick={() => setSelected(i)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors duration-150 cursor-pointer ${
                        i === leafIndex ? 'bg-emerald-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className="font-mono text-[10px] text-gray-400 w-8 flex-shrink-0">
                        [{i}]
                      </span>
                      <span className="font-mono text-xs text-gray-900 truncate flex-1 min-w-0">
                        {items[i]}
                      </span>
                      <span className="font-mono text-[11px] text-gray-500 flex-shrink-0 hidden sm:inline">
                        {short(hash)}
                      </span>
                      {i === leafIndex && <StatusBadge tone="pass">selected</StatusBadge>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Proof */}
              <div className="flex flex-col gap-3">
                <SectionTitle
                  note={`${proof.length} hash${proof.length === 1 ? '' : 'es'} verify "${items[leafIndex]}" against the root`}
                >
                  Proof path
                </SectionTitle>

                <div className="flex flex-col gap-1">
                  <div className="border border-emerald-300 bg-emerald-50 px-3 py-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        Leaf hash
                      </div>
                      <div className="font-mono text-xs text-gray-900 break-all">
                        {result.leaves[leafIndex]}
                      </div>
                    </div>
                    <CopyButton text={result.leaves[leafIndex]} label="leaf hash" />
                  </div>

                  {proof.map((step, i) => (
                    <div key={i} className="border border-gray-200 px-3 py-2">
                      <div className="flex flex-wrap items-baseline gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                          Step {i + 1}
                        </span>
                        <StatusBadge tone={step.duplicated ? 'warn' : 'neutral'}>
                          {step.duplicated
                            ? 'paired with itself'
                            : `sibling on the ${step.siblingPosition}`}
                        </StatusBadge>
                      </div>
                      <div className="font-mono text-[11px] text-gray-500 break-all">
                        + {step.siblingHash}
                      </div>
                      <div className="font-mono text-xs text-gray-900 break-all mt-1">
                        = {step.resultHash}
                      </div>
                    </div>
                  ))}

                  {proof.length === 0 && (
                    <p className="text-xs text-gray-400">
                      A single item is its own root — there is nothing to prove against.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      }
    />
  );
};
