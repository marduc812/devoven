'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { hintClass, labelClass } from '@/Components/MainView/MainPanel/formControls';
import {
  HashCandidate,
  IdentifyResult,
  formatIdentifyReport,
  identifyLines,
  modeLabel,
} from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const PLACEHOLDER = `5f4dcc3b5aa765d61d8327deb882cf99
$2y$12$Dwt1BZj6pcyc3Dy1FWZ5ieeUznr71EeNkJkUlypTsgbGxflSKlXX2
$1$28772684$iEwNOgGugqO9.bIz5sk8k/
b4b9b02e6f09a9bd760f388b67351e2b`;

/** Fallback size of the top group when no candidate is in the popular set. */
const FALLBACK_LIKELY = 4;

/**
 * Both halves of the tool get the same border and padding, stacked rather than
 * side by side: five hashes with two dozen candidates each need the full width
 * to stay readable. Written out rather than layered on `paneClass`, whose
 * `cursor-default` / `bg-gray-50` would fight an override by stylesheet order
 * instead of class-list order.
 *
 * The teal shades are the hashing category's own, and every one used here has a
 * `.dark` rule in app/globals.css — including the two hover states, which
 * Tailwind emits under a selector the plain `.bg-teal-*` overrides cannot reach.
 */
const inputPaneClass =
  'bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full h-40 border border-teal-200 font-mono text-xs resize-y focus:border-gray-900 focus:outline-none transition-colors duration-150';

const resultPaneClass = 'bg-teal-50 border border-teal-200 w-full';

/** Grid track shared by the column header and every candidate row. */
const rowGrid = 'grid grid-cols-[4.5rem_1fr] md:grid-cols-[4.5rem_16rem_1fr] gap-x-4';

const sectionLabelClass =
  'text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 pt-3 pb-1';

/** Text buttons that act on the results: same weight as the category accent. */
const actionClass =
  'text-xs font-bold uppercase tracking-wider text-teal-700 hover:underline cursor-pointer';

/**
 * The hashcat mode, as a badge in the category palette. Fixed width and centred
 * so a one-digit mode, a five-digit mode and the "no mode" dash all line up in
 * the column instead of each chip hugging its own text.
 */
const chipBase =
  'inline-block w-14 text-center font-mono text-[11px] leading-none px-1.5 py-1 border tabular-nums';

const modeChipClass = `${chipBase} bg-teal-100 text-teal-700 border-teal-200`;

const noModeChipClass = `${chipBase} bg-gray-100 text-gray-400 border-gray-200`;

function CandidateRow({ candidate, onCopy, copied }: {
  candidate: HashCandidate;
  onCopy: (text: string, key: string) => void;
  copied: string | null;
}) {
  const label = modeLabel(candidate.hashcat);
  const copyKey = `${candidate.name}:${label}`;

  return (
    <div className={`${rowGrid} items-center px-3 py-1.5 border-t border-teal-100 hover:bg-teal-50`}>
      {candidate.hashcat === null ? (
        <span className={noModeChipClass} title="hashcat cannot crack this type">
          {label}
        </span>
      ) : (
        <button
          type="button"
          className={`${modeChipClass} hover:bg-teal-200 cursor-pointer`}
          title="Copy hashcat mode"
          onClick={() => onCopy(label, copyKey)}
        >
          {copied === copyKey ? '✓' : label}
        </button>
      )}

      {candidate.tool ? (
        <Link href={candidate.tool} className="text-xs text-gray-900 hover:underline break-all">
          {candidate.name}
        </Link>
      ) : (
        <span className="text-xs text-gray-900 break-all">{candidate.name}</span>
      )}

      {candidate.description && (
        <span className="col-span-2 md:col-span-1 text-xs text-gray-500 leading-relaxed">
          {candidate.description}
          {candidate.link && (
            <>
              {' '}
              <a
                href={candidate.link}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gray-900"
              >
                See more
              </a>
            </>
          )}
        </span>
      )}
    </div>
  );
}

function ResultBlock({ result, index, open, expanded, onToggleOpen, onToggleExpanded, onCopy, copied }: {
  result: IdentifyResult;
  index: number;
  open: boolean;
  expanded: boolean;
  onToggleOpen: () => void;
  onToggleExpanded: () => void;
  onCopy: (text: string, key: string) => void;
  copied: string | null;
}) {
  const { hash, candidates } = result;
  // identifyHash already sorts the popular types to the front, so the split is
  // the size of that group. Cutting at a fixed number instead would drop a
  // common type into "less likely" whenever more than four of them match.
  const popularCount = candidates.filter((c) => c.popular).length;
  const cut = popularCount > 0 ? popularCount : Math.min(FALLBACK_LIKELY, candidates.length);
  const likely = candidates.slice(0, cut);
  const rest = candidates.slice(cut);
  const best = candidates[0];

  return (
    <div className="border-b border-teal-200 last:border-b-0">
      <button
        type="button"
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-teal-100 cursor-pointer"
        onClick={onToggleOpen}
        aria-expanded={open}
      >
        <span className="text-xs text-teal-700 font-bold tabular-nums w-5 shrink-0">{index + 1}</span>
        <span className="font-mono text-xs text-gray-500 truncate flex-1 min-w-0" title={hash}>
          {hash}
        </span>
        {best ? (
          <span className="text-xs text-teal-700 font-bold whitespace-nowrap">
            {best.name}
            <span className="text-gray-500 font-normal">
              {' · '}
              {candidates.length} type{candidates.length === 1 ? '' : 's'}
            </span>
          </span>
        ) : (
          <span className="text-xs text-gray-400 whitespace-nowrap">no match</span>
        )}
        <span className="text-xs text-teal-700 w-3 shrink-0 text-center">{open ? '−' : '+'}</span>
      </button>

      {open && candidates.length > 0 && (
        <div className="pb-2 bg-white">
          <div className={`${rowGrid} px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-teal-700`}>
            <span>Mode</span>
            <span>Type</span>
            <span className="hidden md:block">Notes</span>
          </div>
          {likely.map((candidate) => (
            <CandidateRow key={candidate.name} candidate={candidate} onCopy={onCopy} copied={copied} />
          ))}

          {rest.length > 0 && (
            <>
              {expanded && (
                <>
                  <div className={sectionLabelClass}>Less likely</div>
                  {rest.map((candidate) => (
                    <CandidateRow key={candidate.name} candidate={candidate} onCopy={onCopy} copied={copied} />
                  ))}
                </>
              )}
              <button
                type="button"
                className={`${actionClass} px-3 pt-2 block`}
                onClick={onToggleExpanded}
              >
                {expanded ? 'Hide less likely' : `Show ${rest.length} less likely`}
              </button>
            </>
          )}
        </div>
      )}

      {open && candidates.length === 0 && (
        <p className="text-xs text-gray-500 px-3 py-3 bg-white">
          No pattern in the database matches this string.
        </p>
      )}
    </div>
  );
}

export const HashIdentifier = () => {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  // Both maps hold only the blocks the user has clicked; everything else falls
  // back to a default that follows the number of hashes on screen.
  const [openState, setOpenState] = useState<Record<string, boolean>>({});
  const [expandedState, setExpandedState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') ?? '';
    if (from) setInput(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input })

  const results = useMemo(() => identifyLines(input), [input]);
  const total = results.reduce((sum, r) => sum + r.candidates.length, 0);
  // One hash opens on its own. Paste a list and you get a summary line each,
  // which is the whole point of the collapse.
  const openByDefault = results.length === 1;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  const allOpen = results.length > 0 && results.every((r) => openState[r.hash] ?? openByDefault);
  const setAll = (open: boolean) =>
    setOpenState(Object.fromEntries(results.map((r) => [r.hash, open])));

  return (
    <Panel
      title="Hash Identifier"
      description="Paste a hash and get the likely algorithms with the hashcat mode for each, ranked so the types you actually meet come first. Matches 200+ patterns, from [1 5f4dcc3b5aa765d61d8327deb882cf99 2] to Kerberos, KeePass and Bitcoin wallet hashes. One hash per line; nothing leaves your browser."
      backColor="teal"
      extraElements={
        <div className="flex flex-col gap-6">
          <div>
            <label className={labelClass} htmlFor="hash-input">
              Hashes
            </label>
            <textarea
              id="hash-input"
              className={inputPaneClass}
              placeholder={PLACEHOLDER}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
            />
            <p className={hintClass}>One hash per line.</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1 gap-4">
              <span className={`${labelClass} mb-0`}>Matches</span>
              {total > 0 && (
                <div className="flex items-center gap-4">
                  {results.length > 1 && (
                    <button
                      type="button"
                      className={actionClass}
                      onClick={() => setAll(!allOpen)}
                    >
                      {allOpen ? 'Collapse all' : 'Expand all'}
                    </button>
                  )}
                  <button
                    type="button"
                    className={actionClass}
                    onClick={() => handleCopy(formatIdentifyReport(input), '__report__')}
                  >
                    {copied === '__report__' ? 'Copied' : 'Copy report'}
                  </button>
                </div>
              )}
            </div>

            <div className={resultPaneClass}>
              {results.length === 0 ? (
                <p className="text-sm text-gray-500 p-3">Paste a hash to identify it.</p>
              ) : (
                results.map((result, i) => (
                  <ResultBlock
                    key={result.hash}
                    result={result}
                    index={i}
                    open={openState[result.hash] ?? openByDefault}
                    expanded={expandedState[result.hash] ?? false}
                    onToggleOpen={() =>
                      setOpenState((s) => ({
                        ...s,
                        [result.hash]: !(s[result.hash] ?? openByDefault),
                      }))
                    }
                    onToggleExpanded={() =>
                      setExpandedState((s) => ({ ...s, [result.hash]: !s[result.hash] }))
                    }
                    onCopy={handleCopy}
                    copied={copied}
                  />
                ))
              )}
            </div>
            <p className={hintClass}>
              {total > 0
                ? `${total} candidate${total === 1 ? '' : 's'} across ${results.length} hash${results.length === 1 ? '' : 'es'}. Click a mode to copy it.`
                : 'Ranked most likely first.'}
            </p>
          </div>
        </div>
      }
    />
  );
};

export default HashIdentifier;
