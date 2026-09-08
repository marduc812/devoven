'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { IoClipboardOutline, IoDownloadOutline } from 'react-icons/io5';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  CopyButton,
  Field,
  PresetRow,
  ErrorNote,
  StatusBadge,
} from '@/Components/MainView/MainPanel/ResultUI';
import { segOn, segOff, btnSecondaryClass } from '@/Components/MainView/MainPanel/formControls';
import { useShareLink } from '@/Components/Functions/ShareLink';
import {
  ALL_SECTIONS,
  DEFAULT_ALLOWED,
  SECTION_TITLES,
  Section,
  Variant,
  bypassPayloads,
  payloadFor,
} from './logic';

const PRESETS = [
  { label: '127.0.0.1', value: '127.0.0.1' },
  { label: 'localhost', value: 'localhost' },
  { label: '169.254.169.254', value: '169.254.169.254' },
  { label: 'http://127.0.0.1:8080/admin', value: 'http://127.0.0.1:8080/admin' },
  { label: '::1', value: '::1' },
];

const FILTERS = ['all', ...ALL_SECTIONS] as const;
type Filter = (typeof FILTERS)[number];

const FILTER_LABELS: Record<Filter, string> = {
  all: 'Everything',
  ip: 'Address formats',
  alias: 'Other names',
  host: 'Host mangling',
  url: 'URL confusion',
};

/**
 * One payload. The label is a column of its own so the eye can run down the
 * list of techniques without reading every value, and the value stays in
 * monospace where a stray zero or an O is still tellable apart.
 */
const PayloadRow = ({ label, value, note }: { label: string; value: string; note?: string }) => (
  <div className="group flex flex-col gap-1 border-t border-gray-200 px-3 py-2 first:border-t-0 hover:bg-gray-50 sm:flex-row sm:items-baseline sm:gap-4">
    <span className="flex-shrink-0 text-[11px] uppercase tracking-wider text-gray-500 sm:w-48">
      {label}
    </span>
    <div className="min-w-0 flex-1">
      <div className="break-all font-mono text-xs text-gray-900">{value}</div>
      {note && <div className="mt-0.5 text-[11px] leading-snug text-gray-400">{note}</div>}
    </div>
    {/* Forty-odd rows, so the per-row copy stays out of the way until the
        pointer is on one. There is no hover on touch, so below `sm` it shows. */}
    <div className="flex-shrink-0 transition-opacity duration-150 sm:pt-0.5 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
      <CopyButton text={value} label={label} />
    </div>
  </div>
);

const SectionCard = ({
  title,
  note,
  rows,
  onCopyAll,
}: {
  title: string;
  note?: string;
  rows: React.ReactNode;
  onCopyAll: string;
}) => (
  <div className="border border-gray-200">
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2">
      <span className="text-xs font-bold uppercase tracking-widest text-gray-500">{title}</span>
      <div className="flex items-baseline gap-3">
        {note && <span className="text-[11px] text-gray-400">{note}</span>}
        <CopyButton text={onCopyAll} label={`all ${title} payloads`} verb="copy all" />
      </div>
    </div>
    {rows}
  </div>
);

export function SsrfBypass() {
  const [input, setInput] = useState('');
  const [allowed, setAllowed] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [copiedAll, setCopiedAll] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const host = params.get('allowed');
    if (host) setAllowed(host);
    const only = params.get('section');
    if (only && (FILTERS as readonly string[]).includes(only)) setFilter(only as Filter);
  }, []);

  // A Panel tool has no textarea publishing `from` for it, so it publishes the
  // whole state itself. These keys are exactly the ones read above.
  useShareLink({ from: input, allowed: allowed || null, section: filter === 'all' ? null : filter });

  const { result, error } = useMemo(() => {
    if (!input.trim()) return { result: null, error: '' };
    try {
      return {
        result: bypassPayloads(input, {
          allowed,
          sections: filter === 'all' ? undefined : [filter as Section],
        }),
        error: '',
      };
    } catch (e: unknown) {
      return { result: null, error: e instanceof Error ? e.message : 'Cannot read that target' };
    }
  }, [input, allowed, filter]);

  const grouped = useMemo(() => {
    if (!result) return [];
    const order: Section[] = ALL_SECTIONS.filter((s) => result.variants.some((v) => v.section === s));
    return order.map((section) => ({
      section,
      items: result.variants
        .filter((v) => v.section === section)
        .map((variant: Variant) => ({ variant, payload: payloadFor(result.target, variant) })),
    }));
  }, [result]);

  const allPayloads = result
    ? result.variants.map((v) => payloadFor(result.target, v)).join('\n')
    : '';

  const download = () => {
    if (!result) return;
    const blob = new Blob([`${allPayloads}\n`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ssrf-${result.canonical.replace(/[^a-z0-9]+/gi, '-')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Panel
      title="SSRF Bypass Payloads"
      description="Every spelling of one destination that a URL parser might accept. Takes an address, a hostname or a whole URL — [1 127.0.0.1 2], [1 localhost 2], [1 169.254.169.254 2], [1 http://127.0.0.1:8080/admin 2] — and returns the numeric forms ([1 2130706433 2], [1 0x7f000001 2], [1 0177.0000.0000.0001 2], [1 127.1 2]), the other names for the same host, the separator tricks an IDNA parser folds away, and the userinfo and slash payloads that split a URL differently in two libraries. Port and path are carried into every payload."
      backColor="sky"
      extraElements={
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <Field
              label="Target"
              hint="address, hostname or URL"
              value={input}
              onChange={setInput}
              placeholder="http://127.0.0.1:8080/admin"
            />
            <Field
              label="Allowlisted host"
              hint="optional"
              value={allowed}
              onChange={setAllowed}
              placeholder={DEFAULT_ALLOWED}
            />
          </div>

          <PresetRow presets={PRESETS} onPick={setInput} />

          {error && <ErrorNote>{error}</ErrorNote>}

          {result && (
            <>
              <div className="flex flex-wrap items-center gap-3 border border-gray-200 bg-gray-50 px-3 py-2">
                <span className="font-mono text-sm font-bold text-gray-900">{result.canonical}</span>
                <StatusBadge tone={result.internal ? 'warn' : 'info'}>
                  {result.description}
                </StatusBadge>
                <span className="font-mono text-xs text-gray-500">
                  {result.variants.length} payloads
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    className={`${btnSecondaryClass} flex items-center gap-1.5`}
                    onClick={() => {
                      navigator.clipboard.writeText(allPayloads).then(
                        () => {
                          setCopiedAll(true);
                          setTimeout(() => setCopiedAll(false), 1200);
                        },
                        () => {},
                      );
                    }}
                  >
                    <IoClipboardOutline className="text-sm" />
                    {copiedAll ? 'Copied' : 'Copy all'}
                  </button>
                  <button
                    className={`${btnSecondaryClass} flex items-center gap-1.5`}
                    onClick={download}
                  >
                    <IoDownloadOutline className="text-sm" />
                    Download
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {FILTERS.map((key) => (
                  <button
                    key={key}
                    className={filter === key ? segOn : segOff}
                    onClick={() => setFilter(key)}
                  >
                    {FILTER_LABELS[key]}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-4">
                {grouped.map(({ section, items }) => (
                  <SectionCard
                    key={section}
                    title={SECTION_TITLES[section]}
                    note={section === 'url' ? `allowlisted host: ${result.allowed}` : undefined}
                    onCopyAll={items.map((i) => i.payload).join('\n')}
                    rows={items.map(({ variant, payload }) => (
                      <PayloadRow
                        key={variant.label}
                        label={variant.label}
                        value={payload}
                        note={variant.note}
                      />
                    ))}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      }
    />
  );
}
